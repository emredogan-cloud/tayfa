import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from './keys';
import type { NotificationsResponse } from './types';

/**
 * The Notification Center feed. Frequency caps + "would a friend text this?"
 * gating are enforced server-side (GROWTH §9); the client only renders the
 * already-sent ledger and tracks opens.
 */
export function useNotifications(): UseQueryResult<NotificationsResponse, Error> {
  return useQuery({
    queryKey: qk.notifications(),
    queryFn: ({ signal }) => api.get<NotificationsResponse>('/me/notifications', undefined, signal),
  });
}

/**
 * Mark notifications opened. Passing no ids marks everything read. Optimistically
 * clears the local unread state so the badge updates instantly.
 */
export function useMarkNotificationsRead(): UseMutationResult<{ ok: boolean }, Error, string[]> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.post<{ ok: boolean }>('/me/notifications/read', { ids }),
    onMutate: (ids: string[]) => {
      const key = qk.notifications();
      const prev = qc.getQueryData<NotificationsResponse>(key);
      if (prev) {
        const markAll = ids.length === 0;
        const nowIso = prev.notifications[0]?.createdAt ?? '';
        const next: NotificationsResponse = {
          notifications: prev.notifications.map((n) =>
            markAll || ids.includes(n.id) ? { ...n, readAt: n.readAt ?? nowIso } : n,
          ),
          unreadCount: markAll
            ? 0
            : prev.notifications.filter((n) => !ids.includes(n.id) && n.readAt === null).length,
        };
        qc.setQueryData(key, next);
      }
      return { prev };
    },
    onError: (_e, _ids, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.notifications(), ctx.prev);
    },
  });
}

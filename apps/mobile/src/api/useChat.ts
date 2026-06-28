import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { sendMessageSchema } from '@tayfa/shared/schemas';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import { uuidv4 } from '@/lib/uuid';
import { qk } from './keys';
import type { ChatThread } from './types';

export interface SendMessageVars {
  conversationId: string;
  body: string;
  /** True when the user tapped an AI icebreaker suggestion (analytics signal). */
  fromIcebreaker?: boolean;
}

export interface UseChatResult {
  thread: UseQueryResult<ChatThread, Error>;
  send: UseMutationResult<ChatThread, Error, SendMessageVars>;
}

/**
 * Group chat for an event conversation. Messages include system notices (joins,
 * reminders) and surface AI icebreakers grounded only in shared public interests
 * (the generative call fails open to [] — chat is never blocked on AI).
 */
export function useChat(eventId: string): UseChatResult {
  const qc = useQueryClient();

  const thread = useQuery({
    queryKey: qk.chat(eventId),
    refetchInterval: 8_000,
    queryFn: ({ signal }) => api.get<ChatThread>(`/events/${eventId}/chat`, undefined, signal),
  });

  const send = useMutation<ChatThread, Error, SendMessageVars>({
    mutationFn: ({ conversationId, body }) => {
      const payload = sendMessageSchema.parse({
        conversationId,
        body,
        idempotencyKey: uuidv4(),
      });
      return api.post<ChatThread>(`/events/${eventId}/chat`, payload);
    },
    onSuccess: (next, vars) => {
      if (vars.fromIcebreaker) {
        track('icebreaker_used', { conversation_id: vars.conversationId });
      }
      qc.setQueryData(qk.chat(eventId), next);
    },
  });

  return { thread, send };
}

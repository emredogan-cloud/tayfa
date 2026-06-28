import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from './keys';
import type { EventDetail } from './types';

/**
 * Event detail. `preciseLocation` arrives only when the BFF's release gate
 * (canReleasePreciseLocation) passed for this viewer — otherwise the client
 * shows the fuzzed neighborhood from `event.location`. There is no client path
 * that can reconstruct precise coordinates.
 */
export function useEvent(eventId: string | undefined): UseQueryResult<EventDetail, Error> {
  return useQuery({
    queryKey: qk.event(eventId ?? 'unknown'),
    enabled: Boolean(eventId),
    queryFn: ({ signal }) => api.get<EventDetail>(`/events/${eventId}`, undefined, signal),
  });
}

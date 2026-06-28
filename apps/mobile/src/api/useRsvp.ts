import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { type RsvpDecision } from '@tayfa/shared/schemas';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import { qk } from './keys';
import type { RsvpResult } from './types';

/**
 * RSVP actions for a single event. `join` requests a seat (the BFF runs the
 * RSVP state machine + capacity check and decides whether approval is needed);
 * `leave` releases it; `decide` is the host approve/reject. The precise location
 * only unlocks once the BFF moves the viewer to an approved state in-window.
 */
export interface UseRsvpResult {
  join: UseMutationResult<RsvpResult, Error, void>;
  leave: UseMutationResult<RsvpResult, Error, void>;
  decide: UseMutationResult<RsvpResult, Error, Omit<RsvpDecision, 'eventId'>>;
}

export function useRsvp(eventId: string): UseRsvpResult {
  const qc = useQueryClient();
  const invalidate = (): void => {
    void qc.invalidateQueries({ queryKey: qk.event(eventId) });
    void qc.invalidateQueries({ queryKey: ['feed'] });
  };

  const join = useMutation<RsvpResult, Error, void>({
    mutationFn: () => api.post<RsvpResult>(`/events/${eventId}/rsvp`, { eventId }),
    onSuccess: (result) => {
      track('rsvp_created', {
        event_id: result.eventId,
        requires_approval: result.requiresApproval,
      });
      invalidate();
    },
  });

  const leave = useMutation<RsvpResult, Error, void>({
    mutationFn: () => api.del<RsvpResult>(`/events/${eventId}/rsvp`, { eventId }),
    onSuccess: invalidate,
  });

  const decide = useMutation<RsvpResult, Error, Omit<RsvpDecision, 'eventId'>>({
    mutationFn: (input) =>
      api.post<RsvpResult>(`/events/${eventId}/rsvp/decision`, { ...input, eventId }),
    onSuccess: (result, input) => {
      if (input.decision === 'approve') {
        track('rsvp_approved', { event_id: result.eventId, member_user_id: input.memberUserId });
      }
      invalidate();
    },
  });

  return { join, leave, decide };
}

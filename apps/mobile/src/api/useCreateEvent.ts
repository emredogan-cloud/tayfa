import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { createEventSchema, type CreateEvent } from '@tayfa/shared/schemas';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import type { CreatedEvent } from './types';

/**
 * Create an event (P3). We Zod-validate client-side with the SAME schema the BFF
 * uses — fast feedback — but the BFF re-validates and is the authority (capacity
 * min ≥ 2, future start, women-only/verified-only flags). On success we emit the
 * typed `event_created` analytics event and invalidate the feed.
 */
export function useCreateEvent(): UseMutationResult<CreatedEvent, Error, CreateEvent> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEvent) => {
      // Throws (caught by react-query) if the draft is invalid — never ship a bad payload.
      const valid = createEventSchema.parse(input);
      return api.post<CreatedEvent>('/events', valid);
    },
    onSuccess: (created, input) => {
      track('event_created', {
        event_id: created.id,
        category: input.category,
        from_template: input.fromTemplateId !== undefined,
        capacity_max: input.capacityMax,
      });
      void qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

import { z } from 'zod';
import { CONTENT_LIMITS } from '../constants/limits.js';
import { GROUP_DEFAULTS } from '../constants/safety.js';
import { EVENT_VISIBILITIES } from '../types/enums.js';
import { geoPointSchema, isoDateTimeSchema, uuidSchema } from './common.js';

/**
 * Event creation (P3). Capacity enforces the small-group default — min ≥ 2 (no
 * 1:1). Precise `location` is accepted here (server-side) but is fuzzed before
 * it reaches any non-approved client.
 */
export const createEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(CONTENT_LIMITS.eventTitleMinLength)
      .max(CONTENT_LIMITS.eventTitleMaxLength),
    description: z.string().trim().max(CONTENT_LIMITS.eventDescriptionMaxLength).optional(),
    category: z.string().min(1),
    location: geoPointSchema,
    venueName: z.string().trim().max(120).optional(),
    startsAt: isoDateTimeSchema,
    endsAt: isoDateTimeSchema,
    capacityMin: z
      .number()
      .int()
      .min(GROUP_DEFAULTS.minCapacity, { message: 'No 1:1 events — minimum group size is 2' }),
    capacityMax: z.number().int().max(GROUP_DEFAULTS.hardMaxCapacity),
    visibility: z.enum(EVENT_VISIBILITIES).default('public'),
    interestIds: z.array(uuidSchema).max(10).default([]),
    fromTemplateId: uuidSchema.optional(),
    womenOnly: z.boolean().default(false),
    verifiedOnly: z.boolean().default(false),
  })
  .refine((v) => v.capacityMax >= v.capacityMin, {
    message: 'capacityMax must be ≥ capacityMin',
    path: ['capacityMax'],
  })
  .refine((v) => new Date(v.endsAt) > new Date(v.startsAt), {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  })
  .refine((v) => new Date(v.startsAt) > new Date(), {
    message: 'startsAt must be in the future',
    path: ['startsAt'],
  });
export type CreateEvent = z.infer<typeof createEventSchema>;

export const rsvpRequestSchema = z.object({
  eventId: uuidSchema,
});
export type RsvpRequest = z.infer<typeof rsvpRequestSchema>;

export const rsvpDecisionSchema = z.object({
  eventId: uuidSchema,
  memberUserId: uuidSchema,
  decision: z.enum(['approve', 'reject']),
});
export type RsvpDecision = z.infer<typeof rsvpDecisionSchema>;

/** Feed query (P2). Premium filters are flagged so the BFF can gate them. */
export const feedQuerySchema = z.object({
  center: geoPointSchema,
  radiusMeters: z.number().int().min(500).max(40_000).default(5_000),
  categories: z.array(z.string()).max(10).optional(),
  startsAfter: isoDateTimeSchema.optional(),
  startsBefore: isoDateTimeSchema.optional(),
  womenOnly: z.boolean().optional(),
  verifiedOnly: z.boolean().optional(),
  /** Premium: advanced sub-genre/artist filters. BFF rejects for free tier. */
  advancedInterestFilters: z.array(uuidSchema).max(20).optional(),
});
export type FeedQuery = z.infer<typeof feedQuerySchema>;

/** Mutual attendance confirmation (NSM input from the client). */
export const checkinConfirmSchema = z.object({
  eventId: uuidSchema,
  location: geoPointSchema,
  deviceFingerprint: z.string().min(8),
});
export type CheckinConfirm = z.infer<typeof checkinConfirmSchema>;

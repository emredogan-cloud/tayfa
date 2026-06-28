import { z } from 'zod';
import { CONTENT_LIMITS } from '../constants/limits.js';
import { REPORT_TARGET_TYPES } from '../types/enums.js';
import { uuidSchema } from './common.js';

/** Report reasons (mirror domain/moderation REPORT_REASONS keys). */
export const reportReasonSchema = z.enum([
  'threat',
  'sexual_misconduct',
  'minor_safety',
  'csam',
  'doxxing',
  'stalking',
  'imminent_harm',
  'harassment',
  'scam',
  'hate_speech',
  'repeated_unwanted_contact',
  'spam',
  'off_topic',
  'other',
]);

export const reportSchema = z.object({
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: uuidSchema,
  reason: reportReasonSchema,
  detail: z.string().trim().max(CONTENT_LIMITS.reportReasonMaxLength).optional(),
  evidenceUrl: z.url().optional(),
});
export type ReportInput = z.infer<typeof reportSchema>;

export const blockSchema = z.object({
  blockedUserId: uuidSchema,
});
export type BlockInput = z.infer<typeof blockSchema>;

/** Post-meetup rating — feeds reliability + safety scores. */
export const ratingSchema = z.object({
  eventId: uuidSchema,
  targetUserId: uuidSchema,
  vibe: z.number().int().min(1).max(5),
  showedUp: z.boolean(),
  wouldMeetAgain: z.boolean(),
  /** Private safety flag — invisible to the rated user (anti-weaponization). */
  privateSafetyFlag: z.boolean().default(false),
});
export type RatingInput = z.infer<typeof ratingSchema>;

/** Share-my-plan with a trusted contact (safety center). */
export const sharePlanSchema = z.object({
  eventId: uuidSchema,
  contactName: z.string().trim().min(1).max(80),
  contactPhone: z.string().min(7).max(20),
});
export type SharePlanInput = z.infer<typeof sharePlanSchema>;

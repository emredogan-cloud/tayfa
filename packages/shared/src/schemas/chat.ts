import { z } from 'zod';
import { CONTENT_LIMITS } from '../constants/limits.js';
import { uuidSchema } from './common.js';

export const sendMessageSchema = z.object({
  conversationId: uuidSchema,
  body: z.string().trim().min(1).max(CONTENT_LIMITS.messageMaxLength),
  mediaUrl: z.url().optional(),
  /** Client-generated id for idempotent sends (dedupe on retry). */
  idempotencyKey: z.uuid(),
});
export type SendMessage = z.infer<typeof sendMessageSchema>;

export const accountDeletionSchema = z.object({
  /** KVKK/GDPR erasure must be explicitly confirmed. */
  confirm: z.literal(true),
  reason: z.string().max(500).optional(),
});
export type AccountDeletion = z.infer<typeof accountDeletionSchema>;

import { z } from 'zod';
import { CONTENT_LIMITS } from '../constants/limits.js';
import { type CONSENT_CATEGORIES, INTEREST_SOURCES } from '../types/enums.js';
import { uuidSchema } from './common.js';

/**
 * Granular consent (KVKK Art. 6 — unbundled açık rıza). Each category is a
 * SEPARATE toggle; core service must NOT be gated on `marketing` consent. The
 * consent version + timestamp are logged per the disclosure requirement.
 */
export const consentSchema = z.object({
  location: z.boolean(),
  marketing: z.boolean(),
  connected_accounts: z.boolean(),
  biometric_verification: z.boolean(),
  consentVersion: z.string().min(1),
});
export type ConsentInput = z.infer<typeof consentSchema>;

// Exhaustiveness guard: every consent category must be a key of the schema.
type _ConsentKeysCover = (typeof CONSENT_CATEGORIES)[number] extends keyof ConsentInput
  ? true
  : never;
export const _consentKeysCover: _ConsentKeysCover = true;

export const profileSetupSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(CONTENT_LIMITS.displayNameMinLength)
    .max(CONTENT_LIMITS.displayNameMaxLength),
  bio: z.string().trim().max(CONTENT_LIMITS.bioMaxLength).optional(),
  homeCityId: uuidSchema.optional(),
  neighborhood: z.string().trim().max(80).optional(),
  languages: z.array(z.string().length(2)).max(6).default(['tr']),
});
export type ProfileSetup = z.infer<typeof profileSetupSchema>;

/** Taste-card interest selection. ≥5 interests required to complete onboarding. */
export const interestSelectionSchema = z.object({
  interests: z
    .array(
      z.object({
        interestId: uuidSchema,
        weight: z.number().min(0).max(1).default(1),
        source: z.enum(INTEREST_SOURCES).default('onboarding'),
      }),
    )
    .min(CONTENT_LIMITS.minInterestsToComplete, {
      message: `Pick at least ${CONTENT_LIMITS.minInterestsToComplete} interests`,
    })
    .max(100),
});
export type InterestSelection = z.infer<typeof interestSelectionSchema>;

export const connectAccountSchema = z.object({
  provider: z.enum(['spotify', 'apple_music', 'letterboxd']),
  authCode: z.string().min(1),
});
export type ConnectAccount = z.infer<typeof connectAccountSchema>;

/**
 * Rate limits and abuse ceilings (RISK_ANALYSIS §5, Redis-backed). Conservative
 * where the report says "implement aggressively / not quantified".
 */

export interface RateLimit {
  readonly action: string;
  readonly max: number;
  readonly windowSeconds: number;
}

export const RATE_LIMITS = {
  /** OTP requests per phone number. */
  authOtpRequest: { action: 'auth.otp.request', max: 5, windowSeconds: 60 * 60 },
  /** Persona is a cost-attack vector — limit verification attempts. */
  verificationStart: { action: 'verification.start', max: 5, windowSeconds: 24 * 60 * 60 },
  /** New-contact velocity (anti-harassment). */
  dmNewContact: { action: 'dm.new_contact', max: 10, windowSeconds: 60 * 60 },
  messageSend: { action: 'message.send', max: 60, windowSeconds: 60 },
  eventCreate: { action: 'event.create', max: 10, windowSeconds: 24 * 60 * 60 },
  /** New hosts are throttled harder until reputation builds. */
  eventCreateNewHost: { action: 'event.create.new_host', max: 2, windowSeconds: 24 * 60 * 60 },
  imageUpload: { action: 'image.upload', max: 30, windowSeconds: 60 * 60 },
  reportSubmit: { action: 'report.submit', max: 20, windowSeconds: 60 * 60 },
} as const satisfies Record<string, RateLimit>;

/** Content length bounds (validated by Zod schemas). */
export const CONTENT_LIMITS = {
  bioMaxLength: 500,
  displayNameMaxLength: 40,
  displayNameMinLength: 2,
  eventTitleMaxLength: 80,
  eventTitleMinLength: 6,
  eventDescriptionMaxLength: 1000,
  messageMaxLength: 2000,
  reportReasonMaxLength: 1000,
  minInterestsToComplete: 5,
} as const;

/** GDPR/KVKK data-subject-rights SLA (RISK_ANALYSIS §4). */
export const DATA_RIGHTS_SLA_DAYS = 30;

/** Breach-notification clock (KVKK Board + GDPR). */
export const BREACH_NOTIFICATION_HOURS = 72;

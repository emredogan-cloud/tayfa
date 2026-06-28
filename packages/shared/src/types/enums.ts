/**
 * Canonical enums (Data Model §5). Declared as `const` tuples so they are the
 * single source for: TS union types, Zod `z.enum`, and Postgres enum DDL.
 */

export const VERIFICATION_LEVELS = ['none', 'phone', 'id', 'id_live'] as const;
export type VerificationLevel = (typeof VERIFICATION_LEVELS)[number];

/** Ordered rank for step-up gating comparisons (`id_live` > `id` > `phone`). */
export const VERIFICATION_RANK: Record<VerificationLevel, number> = {
  none: 0,
  phone: 1,
  id: 2,
  id_live: 3,
};

export const VERIFICATION_TYPES = ['phone', 'id', 'liveness'] as const;
export type VerificationType = (typeof VERIFICATION_TYPES)[number];

export const EVENT_STATUSES = [
  'draft',
  'open',
  'full',
  'confirmed',
  'completed',
  'cancelled',
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_VISIBILITIES = ['public', 'interest_match', 'invite'] as const;
export type EventVisibility = (typeof EVENT_VISIBILITIES)[number];

/** RSVP / attendance ledger states (event_member.rsvp_status). */
export const RSVP_STATUSES = [
  'requested',
  'approved',
  'going',
  'attended',
  'no_show',
  'left',
] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export const EVENT_MEMBER_ROLES = ['host', 'member'] as const;
export type EventMemberRole = (typeof EVENT_MEMBER_ROLES)[number];

export const CONVERSATION_SCOPES = ['event', 'crew', 'dm'] as const;
export type ConversationScope = (typeof CONVERSATION_SCOPES)[number];

export const MODERATION_STATUSES = ['pending', 'clear', 'flagged', 'removed'] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const REPORT_TARGET_TYPES = ['user', 'event', 'message'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const REPORT_STATUSES = ['open', 'triaged', 'actioned', 'dismissed', 'appealed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Report severity → drives the response SLA (RISK_ANALYSIS §3.4). */
export const REPORT_SEVERITIES = ['safety_critical', 'high', 'standard'] as const;
export type ReportSeverity = (typeof REPORT_SEVERITIES)[number];

export const MODERATION_ACTOR = ['ai', 'human'] as const;
export type ModerationActor = (typeof MODERATION_ACTOR)[number];

export const MODERATION_ACTIONS = ['warn', 'remove', 'suspend', 'ban', 'clear'] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

export const INTEREST_DOMAINS = [
  'music_genre',
  'artist',
  'tv_show',
  'film',
  'sport',
  'hobby',
  'cuisine',
  'cause',
  'game',
] as const;
export type InterestDomain = (typeof INTEREST_DOMAINS)[number];

export const INTEREST_SOURCES = ['onboarding', 'connected_account', 'inferred'] as const;
export type InterestSource = (typeof INTEREST_SOURCES)[number];

/** Consent categories — each captured as a separate açık rıza toggle (KVKK Art. 6). */
export const CONSENT_CATEGORIES = [
  'location',
  'marketing',
  'connected_accounts',
  'biometric_verification',
] as const;
export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];

export const SUBSCRIPTION_STORES = ['app_store', 'play_store', 'stripe'] as const;
export type SubscriptionStore = (typeof SUBSCRIPTION_STORES)[number];

export const SUBSCRIPTION_STATUSES = [
  'active',
  'in_trial',
  'grace_period',
  'expired',
  'cancelled',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Entitlements — the server-side source of truth for premium gating. */
export const ENTITLEMENTS = ['free', 'tayfa_plus'] as const;
export type Entitlement = (typeof ENTITLEMENTS)[number];

export const REFERRAL_STATES = [
  'created',
  'installed',
  'activated',
  'rewarded',
  'rejected',
] as const;
export type ReferralState = (typeof REFERRAL_STATES)[number];

export const PLATFORMS = ['ios', 'android', 'web'] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PRICING_REGIONS = ['TR', 'EU'] as const;
export type PricingRegion = (typeof PRICING_REGIONS)[number];

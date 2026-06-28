import { z } from 'zod';

/**
 * Typed analytics taxonomy (GROWTH_STRATEGY §6, mission deliverable). This is
 * the single contract consumed identically by mobile, web, and the BFF. Adding
 * or changing an event here is a compile error everywhere it is emitted.
 *
 * Discipline (TECH_DECISIONS ADR-008): log INTENTIONAL events only — event
 * volume is a direct PostHog cost. Every event below maps to a funnel step,
 * retention loop, monetization surface, or safety signal.
 *
 * Ambient properties (distinct_id, city, cohort, platform, app_version,
 * session_id, ts) are attached by the analytics client at capture time and are
 * NOT redeclared per-event. Tracking is consent-gated.
 */

const eventId = z.uuid();
const userId = z.uuid();

/** All event names — the closed vocabulary. */
export const ANALYTICS_EVENT_NAMES = [
  // ── Activation funnel (GROWTH §4) ──
  'signup_started',
  'signup_completed',
  'age_gate_passed',
  'age_gate_failed',
  'consent_captured',
  'interest_added',
  'connected_account_imported',
  'onboarding_completed',
  'feed_first_viewed',
  // ── Discovery (P2) ──
  'feed_impression',
  'feed_card_tapped',
  'feed_filter_used',
  'people_card_tapped',
  // ── Core loop (P3) ──
  'event_created',
  'event_viewed',
  'rsvp_created',
  'rsvp_approved',
  'chat_first_message',
  'reminder_sent',
  'reminder_opened',
  'checkin_started',
  'meetup_completed', // ← North Star Metric
  'rating_submitted',
  'report_filed',
  'user_blocked',
  // ── Matching (P4) ──
  'recommendation_impression',
  'recommendation_accepted',
  'recommendation_rejected',
  'icebreaker_used',
  'match_feedback',
  // ── Safety (P5) ──
  'verification_started',
  'verification_completed',
  'safety_center_opened',
  'sos_triggered',
  'plan_shared_with_contact',
  // ── Retention & virality (P6) ──
  'crew_formed',
  'recurring_meetup_scheduled',
  'streak_continued',
  'streak_broken',
  'referral_sent',
  'referral_installed',
  'referral_activated', // reward unlocks only here (referee's first meetup)
  'recap_shared',
  'notification_opted_out',
  // ── Monetization (P7) ──
  'paywall_viewed',
  'trial_started',
  'subscription_converted',
  'subscription_renewed',
  'subscription_churned',
] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

const noProps = z.object({}).strict();

/**
 * Per-event property schemas. Each is a strict object so unexpected properties
 * (a typo, an un-budgeted field) fail validation instead of silently inflating
 * PostHog cost.
 */
export const ANALYTICS_EVENTS = {
  signup_started: noProps,
  signup_completed: z.object({ method: z.enum(['phone', 'apple', 'google']) }).strict(),
  age_gate_passed: z.object({ age: z.number().int().min(18) }).strict(),
  age_gate_failed: z.object({ age: z.number().int().min(0) }).strict(),
  consent_captured: z
    .object({
      location: z.boolean(),
      marketing: z.boolean(),
      connected_accounts: z.boolean(),
      biometric_verification: z.boolean(),
      consent_version: z.string(),
    })
    .strict(),
  interest_added: z
    .object({
      interest_id: eventId,
      domain: z.string(),
      source: z.enum(['onboarding', 'connected_account', 'inferred']),
    })
    .strict(),
  connected_account_imported: z
    .object({
      provider: z.enum(['spotify', 'apple_music', 'letterboxd']),
      interests_imported: z.number().int().nonnegative(),
    })
    .strict(),
  onboarding_completed: z
    .object({ interest_count: z.number().int(), seconds_to_complete: z.number().nonnegative() })
    .strict(),
  feed_first_viewed: z.object({ event_count: z.number().int().nonnegative() }).strict(),

  feed_impression: z
    .object({ event_id: eventId, position: z.number().int(), is_interest_matched: z.boolean() })
    .strict(),
  feed_card_tapped: z
    .object({ event_id: eventId, position: z.number().int(), is_interest_matched: z.boolean() })
    .strict(),
  feed_filter_used: z.object({ filter: z.string(), is_premium_filter: z.boolean() }).strict(),
  people_card_tapped: z.object({ target_user_id: userId }).strict(),

  event_created: z
    .object({
      event_id: eventId,
      category: z.string(),
      from_template: z.boolean(),
      capacity_max: z.number().int(),
    })
    .strict(),
  event_viewed: z.object({ event_id: eventId }).strict(),
  rsvp_created: z.object({ event_id: eventId, requires_approval: z.boolean() }).strict(),
  rsvp_approved: z.object({ event_id: eventId, member_user_id: userId }).strict(),
  chat_first_message: z.object({ conversation_id: eventId, event_id: eventId }).strict(),
  reminder_sent: z.object({ event_id: eventId, offset_hours: z.number() }).strict(),
  reminder_opened: z.object({ event_id: eventId, offset_hours: z.number() }).strict(),
  checkin_started: z.object({ event_id: eventId }).strict(),
  meetup_completed: z
    .object({
      event_id: eventId,
      confirmed_attendees: z.number().int().min(2),
      geofence_passed: z.boolean(),
      collusion_score: z.number().min(0).max(1),
    })
    .strict(),
  rating_submitted: z
    .object({
      event_id: eventId,
      vibe: z.number().int().min(1).max(5),
      showed_up: z.boolean(),
      would_meet_again: z.boolean(),
    })
    .strict(),
  report_filed: z
    .object({
      target_type: z.enum(['user', 'event', 'message']),
      severity: z.enum(['safety_critical', 'high', 'standard']),
    })
    .strict(),
  user_blocked: z.object({ target_user_id: userId }).strict(),

  recommendation_impression: z
    .object({ surface: z.enum(['events', 'people', 'crews']), count: z.number().int() })
    .strict(),
  recommendation_accepted: z.object({ surface: z.string(), target_id: eventId }).strict(),
  recommendation_rejected: z.object({ surface: z.string(), target_id: eventId }).strict(),
  icebreaker_used: z.object({ conversation_id: eventId }).strict(),
  match_feedback: z
    .object({ target_id: eventId, sentiment: z.enum(['great', 'not_for_me']) })
    .strict(),

  verification_started: z.object({ type: z.enum(['id', 'liveness']) }).strict(),
  verification_completed: z.object({ level: z.enum(['phone', 'id', 'id_live']) }).strict(),
  safety_center_opened: noProps,
  sos_triggered: z.object({ event_id: eventId.optional() }).strict(),
  plan_shared_with_contact: z.object({ event_id: eventId }).strict(),

  crew_formed: z.object({ crew_id: eventId, member_count: z.number().int().min(2) }).strict(),
  recurring_meetup_scheduled: z.object({ crew_id: eventId, event_id: eventId }).strict(),
  streak_continued: z.object({ weeks: z.number().int().positive() }).strict(),
  streak_broken: z.object({ weeks: z.number().int().nonnegative() }).strict(),
  referral_sent: z.object({ code: z.string() }).strict(),
  referral_installed: z.object({ code: z.string() }).strict(),
  referral_activated: z.object({ code: z.string(), referee_user_id: userId }).strict(),
  recap_shared: z.object({ event_id: eventId, destination: z.string() }).strict(),
  notification_opted_out: z
    .object({ category: z.enum(['social', 'discovery', 'lifecycle']) })
    .strict(),

  paywall_viewed: z
    .object({ placement: z.enum(['P-1', 'P-2', 'P-3', 'P-4', 'P-5']), feature: z.string() })
    .strict(),
  trial_started: z.object({ placement: z.string() }).strict(),
  subscription_converted: z
    .object({ product_id: z.string(), region: z.enum(['TR', 'EU']), is_annual: z.boolean() })
    .strict(),
  subscription_renewed: z.object({ product_id: z.string() }).strict(),
  subscription_churned: z
    .object({ product_id: z.string(), reason: z.string().optional() })
    .strict(),
} as const satisfies Record<AnalyticsEventName, z.ZodType>;

/** Properties type for a given event name. */
export type AnalyticsProps<N extends AnalyticsEventName> = z.infer<(typeof ANALYTICS_EVENTS)[N]>;

/** A fully-formed, validated analytics event ready to send to PostHog. */
export type AnalyticsEvent = {
  [N in AnalyticsEventName]: { name: N; props: AnalyticsProps<N> };
}[AnalyticsEventName];

/**
 * Validate + construct an event. Throwing here is intentional: a malformed
 * analytics call is a developer bug, caught in dev/CI, never shipped.
 */
export function buildAnalyticsEvent<N extends AnalyticsEventName>(
  name: N,
  props: AnalyticsProps<N>,
): AnalyticsEvent {
  const schema = ANALYTICS_EVENTS[name];
  const parsed = schema.parse(props) as AnalyticsProps<N>;
  return { name, props: parsed } as AnalyticsEvent;
}

/** The NSM event — referenced explicitly so dashboards can't drift from code. */
export const NORTH_STAR_EVENT: AnalyticsEventName = 'meetup_completed';

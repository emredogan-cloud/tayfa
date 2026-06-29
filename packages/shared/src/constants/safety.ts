import type { ReportSeverity } from '../types/enums.js';

/**
 * Trust & Safety constants. RISK_ANALYSIS wins all conflicts, so these numbers
 * are mandatory, not advisory.
 */

/** Report → action SLAs in minutes (RISK_ANALYSIS §3.4, 24/7). */
export const REPORT_SLA_MINUTES: Record<ReportSeverity, number> = {
  safety_critical: 30,
  high: 4 * 60,
  standard: 24 * 60,
};

/** Confidence at/above which an automated moderation verdict may auto-action. */
export const MODERATION_AUTO_ACTION_CONFIDENCE = 0.95;
/** Below this, a human must review (human-in-loop). Between → queue + auto-hold. */
export const MODERATION_HUMAN_REVIEW_FLOOR = 0.5;

/** Safety-incident-rate targets per meetup (Gate A → post-P5). */
export const INCIDENT_RATE_TARGET = {
  mvp: 0.005,
  postSafetyPhase: 0.003,
} as const;

/** Hard age gate (RISK_ANALYSIS, non-negotiable). */
export const MIN_AGE_YEARS = 18;

/**
 * Precise event location is released ONLY to approved members and ONLY within
 * this window before start (RISK_ANALYSIS §3.2). Outside it, clients see the
 * geocell centroid only.
 */
export const PRECISE_LOCATION_RELEASE_WINDOW_MINUTES = 30;

/** Small-group defaults (RISK_ANALYSIS §3.1): no 1:1 default; nudge 3+. */
export const GROUP_DEFAULTS = {
  minCapacity: 2,
  nudgeCapacity: 3,
  defaultMaxCapacity: 6,
  hardMaxCapacity: 50,
} as const;

/**
 * Reputation gates. A user below these scores cannot host / DM
 * (RISK_ANALYSIS §3.1, §PS). Scores are 0..100.
 */
export const REPUTATION_GATES = {
  minReliabilityToHost: 40,
  minSafetyToHost: 60,
  minSafetyToDm: 60,
  /** Below this safety score a user is never recommended to others. */
  neverRecommendBelowSafety: 35,
} as const;

/** Default starting scores for a new account (neutral-positive). */
export const INITIAL_SCORES = {
  reliability: 70,
  safety: 75,
} as const;

/**
 * NSM anti-gaming (RISK_ANALYSIS §NSM). A meetup only counts when geofence ∩
 * mutual-confirm hold AND collusion signals stay clean.
 */
export const NSM = {
  /** Both attendees must be within this radius of the event at confirm time. */
  geofenceRadiusMeters: 250,
  /** Minimum distinct confirmed attendees for a meetup to count toward NSM. */
  minConfirmedAttendees: 2,
  /** Confirmation must occur within this window around starts_at. */
  confirmWindowMinutesBefore: 30,
  confirmWindowMinutesAfter: 180,
  /** Suspected spoof/collusion share must stay at/below this at Gate A. */
  maxSuspectedCollusionShare: 0.05,
} as const;

/** Ban-evasion fingerprint signals that contribute to a re-registration risk score. */
export const BAN_EVASION_SIGNALS = [
  'device_id_match',
  'phone_hash_match',
  'id_hash_match',
  'payment_fingerprint_match',
  'reappearance_near_blocker',
] as const;
export type BanEvasionSignal = (typeof BAN_EVASION_SIGNALS)[number];

/** Money/scam language patterns — fast-track a report when matched (RISK_ANALYSIS §PS). */
export const SCAM_PATTERNS: readonly RegExp[] = [
  /\biban\b/i,
  /\bgift\s?card\b/i,
  /\bbitcoin\b|\bbtc\b|\bcrypto\b|\busdt\b/i,
  /\bwestern union\b|\bmoneygram\b/i,
  /\bsend (?:me )?money\b|\btransfer\b.*\bmoney\b/i,
  /\bpapara\b|\bhavale\b/i,
];

/**
 * Isolation / off-platform / secrecy language — a grooming + scam early-warning
 * (RISK_ANALYSIS §PS, §sextortion). Moving off-platform removes accountability.
 */
export const ISOLATION_PATTERNS: readonly RegExp[] = [
  /\b(?:whats ?app|telegram|signal|insta(?:gram)?|snap(?:chat)?)\b/i,
  /\b(?:dm|text|message) me (?:on|at)\b/i,
  /\b(?:don'?t|do not) tell\b|\bkeep (?:this|it) (?:secret|between us)\b|\bour secret\b/i,
  /\b(?:just between|only) you and me\b/i,
];

/**
 * Ban-evasion signal weights → re-registration risk score (RISK_ANALYSIS §ban-evasion).
 * ID-hash match is the strongest single signal; reappearance near a blocker is a
 * direct PS-10 alert. Weights are blended and clamped to [0,1].
 */
export const BAN_EVASION_WEIGHTS: Record<BanEvasionSignal, number> = {
  id_hash_match: 0.6,
  phone_hash_match: 0.4,
  device_id_match: 0.35,
  payment_fingerprint_match: 0.3,
  reappearance_near_blocker: 0.45,
};

/** Ban-evasion decision thresholds on the blended risk score. */
export const BAN_EVASION_THRESHOLDS = { block: 0.8, review: 0.4 } as const;

/**
 * Grooming / predatory behaviour thresholds (RISK_ANALYSIS §PS behavioural anomaly).
 * Fan-out = one account contacting many fresh accounts; age-gap targeting of
 * newcomers is the highest-signal pattern. Tunable.
 */
export const GROOMING = {
  /** New distinct contacts in 24h above this is a fan-out signal. */
  fanOutContacts24h: 8,
  /** Share of recipients who are recently-joined accounts that flags targeting. */
  newcomerShare: 0.6,
  /** Median age gap (years) to recipients that flags age-gap targeting. */
  ageGapYears: 12,
  /** Risk at/above which a human moderator must review (human-in-loop). */
  reviewRisk: 0.5,
} as const;

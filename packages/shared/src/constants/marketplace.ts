/**
 * Marketplace economics (ROADMAP §Phase 9, §7 "marketplace take"). All money is
 * handled in INTEGER MINOR UNITS (kuruş / cents) — never floats — and take rates
 * are basis points so the split is exact. Numbers here are the initial policy; the
 * source of truth is config, never hardcoded in a surface.
 */

/** Platform take by marketplace event type, in basis points (100 bps = 1%). */
export const TAKE_RATES_BPS = {
  /** Peer ticketed events — kept low; the social graph is not a tax base. */
  ticketed: 1_000, // 10%
  /** Featured/boosted placement. */
  featured: 1_500, // 15%
  /** Venue/brand sponsored events — highest, they get distribution + labeling. */
  venue: 2_000, // 20%
} as const;
export type MarketplaceType = keyof typeof TAKE_RATES_BPS;

/**
 * Host payout eligibility floor (ROADMAP §9: "host KYC", "sponsored ≠ unsafe").
 * Payouts are a financial-compliance surface — KYC is MANDATORY and ID-level
 * verification + a baseline reliability are required before any money moves.
 */
export const HOST_PAYOUT = {
  minReliabilityScore: 0.6,
  /** Stripe Connect onboarding (KYC) must be complete before a first payout. */
  requiresKyc: true,
  /** Hold a host's first payout for fraud review (days). */
  firstPayoutHoldDays: 7,
} as const;

/** Host pro-tools (recurring/ticketed/analytics) gating. */
export const HOST_PRO_TOOLS = {
  minCompletedHostedEvents: 3,
  minReliabilityScore: 0.6,
} as const;

/**
 * Ambassador / community program (ROADMAP §9, §growth). Rewards are earned on REAL
 * value (verified completed meetups driven), gated like referrals to resist
 * collusion: a per-period cap and a distinct-host requirement.
 */
export const AMBASSADOR = {
  /** Reward per verified completed meetup the ambassador's events produced (minor units). */
  rewardPerVerifiedMeetupMinor: 2_500, // ₺25
  /** Anti-collusion: distinct hosts required before rewards unlock. */
  minDistinctHosts: 3,
  /** Cap rewarded meetups per period (collusion ceiling). */
  maxRewardedMeetupsPerPeriod: 40,
} as const;

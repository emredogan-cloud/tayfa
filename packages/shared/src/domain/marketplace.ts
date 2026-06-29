import {
  AMBASSADOR,
  HOST_PAYOUT,
  HOST_PRO_TOOLS,
  TAKE_RATES_BPS,
  type MarketplaceType,
} from '../constants/marketplace.js';
import type { VerificationLevel } from '../types/enums.js';

/**
 * Marketplace & platform layer (ROADMAP §Phase 9). Pure + tested decisions for the
 * supply side — payout math, host eligibility (KYC-gated), the sponsored-content
 * policy engine, and ambassador rewards. Two invariants run through all of it:
 *  • MONEY IS INTEGER MINOR UNITS — never floats; splits are exact.
 *  • SPONSORED ≠ UNSAFE — branded content meets the SAME safety bar as organic and
 *    is always clearly labeled (never disguised as peer content).
 */

// ── Payout split (exact integer money) ──────────────────────────────────────────

export interface PayoutSplit {
  readonly grossMinor: number;
  readonly platformFeeMinor: number;
  readonly hostNetMinor: number;
  readonly takeRateBps: number;
}

/**
 * Split a gross ticket amount (minor units) into platform take + host net for a
 * marketplace type. Integer math only: `platformFee = floor(gross * bps / 10000)`,
 * `hostNet = gross - platformFee` (so the two always sum back to gross, no rounding
 * leak). Throws on a negative or non-integer gross — money bugs must be loud.
 */
export function computePayoutSplit(grossMinor: number, type: MarketplaceType): PayoutSplit {
  if (!Number.isInteger(grossMinor) || grossMinor < 0) {
    throw new RangeError('grossMinor must be a non-negative integer (minor units)');
  }
  const takeRateBps = TAKE_RATES_BPS[type];
  const platformFeeMinor = Math.floor((grossMinor * takeRateBps) / 10_000);
  return {
    grossMinor,
    platformFeeMinor,
    hostNetMinor: grossMinor - platformFeeMinor,
    takeRateBps,
  };
}

// ── Ticketing state ─────────────────────────────────────────────────────────────

export interface TicketingState {
  readonly remaining: number;
  readonly soldOut: boolean;
  /** Waitlist opens once sold out (host pro-tool). */
  readonly waitlistOpen: boolean;
}

export function ticketingState(capacityMax: number, sold: number): TicketingState {
  const remaining = Math.max(0, capacityMax - sold);
  const soldOut = remaining === 0;
  return { remaining, soldOut, waitlistOpen: soldOut };
}

// ── Host eligibility (pro-tools + payouts) ───────────────────────────────────────

const ID_LEVELS: ReadonlySet<VerificationLevel> = new Set<VerificationLevel>(['id', 'id_live']);

export interface HostStanding {
  readonly verificationLevel: VerificationLevel;
  readonly reliabilityScore: number;
  readonly completedHostedEvents: number;
  /** Stripe Connect onboarding (KYC) complete. */
  readonly kycComplete: boolean;
}

export type ProToolsBlocker = 'too_few_hosted_events' | 'reliability_too_low';

export function canUseHostProTools(host: HostStanding): {
  readonly allowed: boolean;
  readonly blockers: readonly ProToolsBlocker[];
} {
  const blockers: ProToolsBlocker[] = [];
  if (host.completedHostedEvents < HOST_PRO_TOOLS.minCompletedHostedEvents) {
    blockers.push('too_few_hosted_events');
  }
  if (host.reliabilityScore < HOST_PRO_TOOLS.minReliabilityScore) {
    blockers.push('reliability_too_low');
  }
  return { allowed: blockers.length === 0, blockers };
}

export type PayoutBlocker = 'kyc_incomplete' | 'id_verification_required' | 'reliability_too_low';

/**
 * Whether money may be paid out to a host. KYC is MANDATORY (financial compliance),
 * ID-level verification is required (anti-fraud), and a reliability floor applies.
 * Returns the first-payout hold so the caller can defer a new host's funds.
 */
export function hostPayoutEligibility(host: HostStanding): {
  readonly eligible: boolean;
  readonly blockers: readonly PayoutBlocker[];
  readonly firstPayoutHoldDays: number;
} {
  const blockers: PayoutBlocker[] = [];
  if (HOST_PAYOUT.requiresKyc && !host.kycComplete) blockers.push('kyc_incomplete');
  if (!ID_LEVELS.has(host.verificationLevel)) blockers.push('id_verification_required');
  if (host.reliabilityScore < HOST_PAYOUT.minReliabilityScore) blockers.push('reliability_too_low');
  return {
    eligible: blockers.length === 0,
    blockers,
    firstPayoutHoldDays: HOST_PAYOUT.firstPayoutHoldDays,
  };
}

// ── Sponsored-content policy engine ──────────────────────────────────────────────

export interface SponsoredEvent {
  readonly isSponsored: boolean;
  /** An unmissable "Sponsored" / "Partner" label is attached. */
  readonly hasLabel: boolean;
  /** The sponsor/brand is disclosed. */
  readonly hasDisclosure: boolean;
  /** Passed the SAME safety/moderation review as organic content. */
  readonly passedSafetyReview: boolean;
}

export type SponsoredViolation = 'missing_label' | 'missing_disclosure' | 'failed_safety_review';

/**
 * Sponsored-content policy (ROADMAP §9: "sponsored ≠ unsafe", strict labeling).
 * Organic events pass trivially. A sponsored event may publish ONLY if it is
 * clearly labeled, discloses its sponsor, AND cleared the same safety bar — any
 * miss blocks publication. Safety is never relaxed for revenue.
 */
export function sponsoredEventPolicy(event: SponsoredEvent): {
  readonly allowed: boolean;
  readonly violations: readonly SponsoredViolation[];
} {
  if (!event.isSponsored) {
    // Organic content still must clear safety; labeling/disclosure are N/A.
    return {
      allowed: event.passedSafetyReview,
      violations: event.passedSafetyReview ? [] : ['failed_safety_review'],
    };
  }
  const violations: SponsoredViolation[] = [];
  if (!event.hasLabel) violations.push('missing_label');
  if (!event.hasDisclosure) violations.push('missing_disclosure');
  if (!event.passedSafetyReview) violations.push('failed_safety_review');
  return { allowed: violations.length === 0, violations };
}

// ── Ambassador rewards (anti-collusion) ──────────────────────────────────────────

export interface AmbassadorMetrics {
  /** Verified completed meetups produced by the ambassador's events (real value). */
  readonly verifiedMeetupsDriven: number;
  /** Distinct hosts involved — collusion resistance. */
  readonly distinctHosts: number;
}

export interface AmbassadorReward {
  readonly rewardMinor: number;
  readonly rewardedMeetups: number;
  readonly reason: 'ok' | 'below_distinct_host_floor';
}

/**
 * Compute an ambassador's reward for a period. Earned on REAL value (verified
 * completed meetups), gated like referrals: rewards unlock only past a distinct-host
 * floor (so a ring of two accounts can't farm it), and rewarded meetups are capped
 * per period (collusion ceiling).
 */
export function ambassadorReward(metrics: AmbassadorMetrics): AmbassadorReward {
  if (metrics.distinctHosts < AMBASSADOR.minDistinctHosts) {
    return { rewardMinor: 0, rewardedMeetups: 0, reason: 'below_distinct_host_floor' };
  }
  const rewardedMeetups = Math.min(
    Math.max(0, metrics.verifiedMeetupsDriven),
    AMBASSADOR.maxRewardedMeetupsPerPeriod,
  );
  return {
    rewardMinor: rewardedMeetups * AMBASSADOR.rewardPerVerifiedMeetupMinor,
    rewardedMeetups,
    reason: 'ok',
  };
}

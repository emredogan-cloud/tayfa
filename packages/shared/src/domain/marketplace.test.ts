import { describe, expect, it } from 'vitest';
import {
  ambassadorReward,
  canUseHostProTools,
  computePayoutSplit,
  hostPayoutEligibility,
  sponsoredEventPolicy,
  ticketingState,
  type HostStanding,
} from './marketplace.js';
import { AMBASSADOR, HOST_PRO_TOOLS, TAKE_RATES_BPS } from '../constants/marketplace.js';

describe('computePayoutSplit — exact integer money', () => {
  it('splits gross into platform take + host net that sum back exactly', () => {
    const s = computePayoutSplit(10_000, 'ticketed'); // ₺100.00 @ 10%
    expect(s.platformFeeMinor).toBe(1_000);
    expect(s.hostNetMinor).toBe(9_000);
    expect(s.platformFeeMinor + s.hostNetMinor).toBe(s.grossMinor);
    expect(s.takeRateBps).toBe(TAKE_RATES_BPS.ticketed);
  });
  it('floors the fee so the platform never over-collects (no rounding leak)', () => {
    const s = computePayoutSplit(999, 'venue'); // 20% of 999 = 199.8 → floor 199
    expect(s.platformFeeMinor).toBe(199);
    expect(s.hostNetMinor).toBe(800);
    expect(s.platformFeeMinor + s.hostNetMinor).toBe(999);
  });
  it('handles a free (0) ticket', () => {
    expect(computePayoutSplit(0, 'featured')).toMatchObject({
      platformFeeMinor: 0,
      hostNetMinor: 0,
    });
  });
  it('rejects negative or non-integer money loudly', () => {
    expect(() => computePayoutSplit(-1, 'ticketed')).toThrow(RangeError);
    expect(() => computePayoutSplit(10.5, 'ticketed')).toThrow(RangeError);
  });
});

describe('ticketingState', () => {
  it('tracks remaining, sold-out, and opens the waitlist on sell-out', () => {
    expect(ticketingState(10, 4)).toEqual({ remaining: 6, soldOut: false, waitlistOpen: false });
    expect(ticketingState(10, 10)).toEqual({ remaining: 0, soldOut: true, waitlistOpen: true });
    expect(ticketingState(10, 12).remaining).toBe(0); // oversell clamps
  });
});

describe('host eligibility', () => {
  const solid: HostStanding = {
    verificationLevel: 'id',
    reliabilityScore: 0.8,
    completedHostedEvents: HOST_PRO_TOOLS.minCompletedHostedEvents,
    kycComplete: true,
  };

  it('allows pro-tools for an established, reliable host', () => {
    expect(canUseHostProTools(solid)).toEqual({ allowed: true, blockers: [] });
  });
  it('blocks pro-tools for a new or unreliable host', () => {
    const r = canUseHostProTools({ ...solid, completedHostedEvents: 0, reliabilityScore: 0.1 });
    expect(r.allowed).toBe(false);
    expect(r.blockers).toEqual(['too_few_hosted_events', 'reliability_too_low']);
  });

  it('pays out only with KYC + ID verification + reliability', () => {
    const r = hostPayoutEligibility(solid);
    expect(r.eligible).toBe(true);
    expect(r.firstPayoutHoldDays).toBeGreaterThan(0);
  });
  it('blocks payout when KYC is incomplete (financial compliance)', () => {
    const r = hostPayoutEligibility({ ...solid, kycComplete: false });
    expect(r.eligible).toBe(false);
    expect(r.blockers).toContain('kyc_incomplete');
  });
  it('blocks payout without ID-level verification', () => {
    const r = hostPayoutEligibility({ ...solid, verificationLevel: 'phone' });
    expect(r.blockers).toContain('id_verification_required');
  });
});

describe('sponsoredEventPolicy — sponsored ≠ unsafe', () => {
  it('publishes a properly labeled, disclosed, safety-cleared sponsored event', () => {
    const r = sponsoredEventPolicy({
      isSponsored: true,
      hasLabel: true,
      hasDisclosure: true,
      passedSafetyReview: true,
    });
    expect(r).toEqual({ allowed: true, violations: [] });
  });
  it('blocks an unlabeled or undisclosed sponsored event', () => {
    const r = sponsoredEventPolicy({
      isSponsored: true,
      hasLabel: false,
      hasDisclosure: false,
      passedSafetyReview: true,
    });
    expect(r.allowed).toBe(false);
    expect(r.violations).toEqual(['missing_label', 'missing_disclosure']);
  });
  it('NEVER relaxes safety for revenue — failed review blocks even if labeled', () => {
    const r = sponsoredEventPolicy({
      isSponsored: true,
      hasLabel: true,
      hasDisclosure: true,
      passedSafetyReview: false,
    });
    expect(r.allowed).toBe(false);
    expect(r.violations).toContain('failed_safety_review');
  });
  it('organic content only needs to clear safety (label/disclosure N/A)', () => {
    expect(
      sponsoredEventPolicy({
        isSponsored: false,
        hasLabel: false,
        hasDisclosure: false,
        passedSafetyReview: true,
      }),
    ).toEqual({ allowed: true, violations: [] });
  });
});

describe('ambassadorReward — earned on real value, anti-collusion', () => {
  it('rewards verified meetups past the distinct-host floor', () => {
    const r = ambassadorReward({
      verifiedMeetupsDriven: 5,
      distinctHosts: AMBASSADOR.minDistinctHosts,
    });
    expect(r.reason).toBe('ok');
    expect(r.rewardedMeetups).toBe(5);
    expect(r.rewardMinor).toBe(5 * AMBASSADOR.rewardPerVerifiedMeetupMinor);
  });
  it('pays nothing below the distinct-host floor (collusion resistance)', () => {
    const r = ambassadorReward({ verifiedMeetupsDriven: 50, distinctHosts: 1 });
    expect(r).toEqual({ rewardMinor: 0, rewardedMeetups: 0, reason: 'below_distinct_host_floor' });
  });
  it('caps rewarded meetups per period (collusion ceiling)', () => {
    const r = ambassadorReward({
      verifiedMeetupsDriven: 10_000,
      distinctHosts: AMBASSADOR.minDistinctHosts,
    });
    expect(r.rewardedMeetups).toBe(AMBASSADOR.maxRewardedMeetupsPerPeriod);
  });
});

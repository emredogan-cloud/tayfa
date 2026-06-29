import { describe, expect, it } from 'vitest';
import {
  buildUpgradeOffer,
  decideUpgradePrompt,
  meetsConversionTarget,
  reconcileEntitlement,
  revenueCatEventToStatus,
  type BillingStatus,
  type PaywallContext,
} from './monetization.js';
import { CONVERSION_TARGETS, PRICING } from '../constants/pricing.js';

describe('decideUpgradePrompt — value-first', () => {
  it('NEVER shows in a core/social/safety flow', () => {
    const d = decideUpgradePrompt({
      context: 'core_flow',
      entitlement: 'free',
      trialEligible: true,
    });
    expect(d.show).toBe(false);
    if (!d.show) expect(d.reason).toBe('core_flow_never_interrupt');
  });

  it('NEVER shows to an already-subscribed user, even at an aspiration moment', () => {
    const d = decideUpgradePrompt({
      context: 'post_meetup_high',
      entitlement: 'tayfa_plus',
      trialEligible: false,
    });
    expect(d.show).toBe(false);
    if (!d.show) expect(d.reason).toBe('already_subscribed');
  });

  it('shows a trial-led offer at the post-meetup high for an engaged free user', () => {
    const d = decideUpgradePrompt({
      context: 'post_meetup_high',
      entitlement: 'free',
      trialEligible: true,
    });
    expect(d).toMatchObject({ show: true, trigger: 'post_meetup_high', offerTrial: true });
  });

  it('shows a (non-trial) offer when the user has not yet earned a trial', () => {
    const d = decideUpgradePrompt({
      context: 'tapped_premium_feature',
      entitlement: 'free',
      trialEligible: false,
      feature: 'see_whos_interested',
    });
    expect(d).toMatchObject({ show: true, offerTrial: false, feature: 'see_whos_interested' });
  });

  it('omits feature when none triggered the prompt', () => {
    const d = decideUpgradePrompt({
      context: 'hit_crew_limit',
      entitlement: 'free',
      trialEligible: false,
    });
    expect(d.show).toBe(true);
    if (d.show) expect('feature' in d).toBe(false);
  });

  it('treats an unknown context as non-aspiration (never shows)', () => {
    const d = decideUpgradePrompt({
      context: 'browsing' as PaywallContext,
      entitlement: 'free',
      trialEligible: true,
    });
    expect(d.show).toBe(false);
  });
});

describe('buildUpgradeOffer — region-aware, config-sourced', () => {
  it('computes annual savings from config and frames positively', () => {
    const offer = buildUpgradeOffer('TR', true);
    expect(offer.price).toBe(PRICING.TR);
    expect(offer.annualSavings).toBe(
      Math.round((PRICING.TR.monthly * 12 - PRICING.TR.annual) * 100) / 100,
    );
    expect(offer.trial).toBe(true);
    expect(offer.framing).toBe('more_and_better_plans');
  });
  it('uses EU pricing for the EU region', () => {
    expect(buildUpgradeOffer('EU', false).price.currency).toBe('EUR');
  });
});

describe('reconcileEntitlement — grace keeps access, refund revokes', () => {
  const cases: Array<[BillingStatus, string, 'full' | 'grace' | 'none']> = [
    ['active', 'tayfa_plus', 'full'],
    ['in_trial', 'tayfa_plus', 'full'],
    ['cancelled', 'tayfa_plus', 'full'], // paid through the period
    ['in_grace_period', 'tayfa_plus', 'grace'], // failed renewal → keep serving
    ['billing_retry', 'tayfa_plus', 'grace'],
    ['expired', 'free', 'none'],
    ['refunded', 'free', 'none'], // money returned → revoke now
    ['paused', 'free', 'none'],
  ];
  it.each(cases)('%s → %s / %s', (status, entitlement, access) => {
    const r = reconcileEntitlement(status);
    expect(r.entitlement).toBe(entitlement);
    expect(r.access).toBe(access);
  });
  it('marks the trial state only for in_trial', () => {
    expect(reconcileEntitlement('in_trial').inTrial).toBe(true);
    expect(reconcileEntitlement('active').inTrial).toBe(false);
  });
});

describe('revenueCatEventToStatus', () => {
  it('maps purchases/renewals to active, or in_trial for a trial period', () => {
    expect(revenueCatEventToStatus('INITIAL_PURCHASE', 'NORMAL')).toBe('active');
    expect(revenueCatEventToStatus('INITIAL_PURCHASE', 'TRIAL')).toBe('in_trial');
    expect(revenueCatEventToStatus('RENEWAL')).toBe('active');
    expect(revenueCatEventToStatus('UNCANCELLATION')).toBe('active');
  });
  it('maps lifecycle events to the right status', () => {
    expect(revenueCatEventToStatus('CANCELLATION')).toBe('cancelled');
    expect(revenueCatEventToStatus('BILLING_ISSUE')).toBe('billing_retry');
    expect(revenueCatEventToStatus('SUBSCRIPTION_PAUSED')).toBe('paused');
    expect(revenueCatEventToStatus('EXPIRATION')).toBe('expired');
    expect(revenueCatEventToStatus('REFUND')).toBe('refunded');
  });
  it('returns null (no state change) for TRANSFER and unknown types', () => {
    expect(revenueCatEventToStatus('TRANSFER')).toBeNull();
    expect(revenueCatEventToStatus('SOMETHING_NEW')).toBeNull();
  });
});

describe('meetsConversionTarget', () => {
  const band = { min: CONVERSION_TARGETS.freeToPaidMin, max: CONVERSION_TARGETS.freeToPaidMax };
  it('classifies below / in-band / above', () => {
    expect(meetsConversionTarget(0.02, band).status).toBe('below');
    expect(meetsConversionTarget(0.04, band).status).toBe('in_band');
    expect(meetsConversionTarget(0.07, band).status).toBe('above');
  });
});

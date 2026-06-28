import { describe, expect, it } from 'vitest';
import {
  canCreateCrew,
  checkFeatureAccess,
  isNeverPaywalled,
  isPremiumFeature,
  maxPhotos,
  maxPrompts,
  paywallSafetyViolations,
} from './entitlements.js';

describe('the inviolable safety invariant', () => {
  it('no feature is BOTH premium and never-paywalled', () => {
    // If this ever fails, a paywall has crept onto safety — the one forbidden thing.
    expect(paywallSafetyViolations()).toEqual([]);
  });
});

describe('checkFeatureAccess', () => {
  it('always allows never-paywalled features regardless of entitlement', () => {
    for (const f of [
      'report',
      'block',
      'id_liveness_verification',
      'safety_center',
      'women_only_filter',
    ] as const) {
      expect(isNeverPaywalled(f)).toBe(true);
      expect(checkFeatureAccess(f, 'free').allowed).toBe(true);
      expect(checkFeatureAccess(f, 'tayfa_plus').allowed).toBe(true);
    }
  });

  it('gates premium features for free users and unlocks them for subscribers', () => {
    expect(isPremiumFeature('see_whos_interested')).toBe(true);
    const free = checkFeatureAccess('see_whos_interested', 'free');
    expect(free.allowed).toBe(false);
    if (!free.allowed) expect(free.requiresUpgrade).toBe(true);
    expect(checkFeatureAccess('see_whos_interested', 'tayfa_plus').allowed).toBe(true);
  });
});

describe('free-tier limits', () => {
  it('caps free crews at 3 and lets premium run unlimited', () => {
    expect(canCreateCrew('free', 2)).toBe(true);
    expect(canCreateCrew('free', 3)).toBe(false);
    expect(canCreateCrew('tayfa_plus', 99)).toBe(true);
  });
  it('raises photo/prompt ceilings for premium', () => {
    expect(maxPhotos('free')).toBe(3);
    expect(maxPhotos('tayfa_plus')).toBeGreaterThan(3);
    expect(maxPrompts('free')).toBe(3);
    expect(maxPrompts('tayfa_plus')).toBeGreaterThan(3);
  });
});

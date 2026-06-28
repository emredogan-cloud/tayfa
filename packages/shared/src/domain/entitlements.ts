import {
  FREE_TIER_LIMITS,
  NEVER_PAYWALLED,
  PREMIUM_FEATURES,
  type NeverPaywalledFeature,
  type PremiumFeature,
} from '../constants/pricing.js';
import type { Entitlement } from '../types/enums.js';

/**
 * Entitlement gating (MONETIZATION §11–12, P7). RevenueCat is the server-side
 * source of truth for `entitlement`; client flags are NEVER trusted. The
 * inviolable rule — safety, verification, and the core loop are FREE FOREVER —
 * is enforced structurally here, not by convention.
 */

export type Feature = NeverPaywalledFeature | PremiumFeature;

const NEVER_SET: ReadonlySet<string> = new Set(NEVER_PAYWALLED);
const PREMIUM_SET: ReadonlySet<string> = new Set(PREMIUM_FEATURES);

export const isNeverPaywalled = (f: Feature): f is NeverPaywalledFeature => NEVER_SET.has(f);
export const isPremiumFeature = (f: Feature): f is PremiumFeature => PREMIUM_SET.has(f);

export type AccessDecision =
  | { readonly allowed: true; readonly requiresUpgrade: false }
  | { readonly allowed: false; readonly requiresUpgrade: true; readonly feature: PremiumFeature }
  | { readonly allowed: true; readonly requiresUpgrade: false; readonly free: true };

/**
 * The one function every feature gate calls. A never-paywalled feature is always
 * allowed. A premium feature is allowed only with the `tayfa_plus` entitlement.
 */
export function checkFeatureAccess(feature: Feature, entitlement: Entitlement): AccessDecision {
  if (isNeverPaywalled(feature)) {
    return { allowed: true, requiresUpgrade: false, free: true };
  }
  if (entitlement === 'tayfa_plus') {
    return { allowed: true, requiresUpgrade: false };
  }
  return { allowed: false, requiresUpgrade: true, feature: feature as PremiumFeature };
}

/**
 * Compile-time + runtime invariant: no feature may be BOTH premium and
 * never-paywalled. A regression here would let a paywall creep onto safety — the
 * one thing the business must never do. The unit test asserts this returns [].
 */
export function paywallSafetyViolations(): string[] {
  const violations: string[] = [];
  for (const f of NEVER_PAYWALLED) {
    if (PREMIUM_SET.has(f)) violations.push(f);
  }
  return violations;
}

export function canCreateCrew(entitlement: Entitlement, activeCrews: number): boolean {
  if (entitlement === 'tayfa_plus') return true;
  return activeCrews < FREE_TIER_LIMITS.maxActiveCrews;
}

export function maxPhotos(entitlement: Entitlement): number {
  return entitlement === 'tayfa_plus' ? 12 : FREE_TIER_LIMITS.maxPhotos;
}

export function maxPrompts(entitlement: Entitlement): number {
  return entitlement === 'tayfa_plus' ? 8 : FREE_TIER_LIMITS.maxPrompts;
}

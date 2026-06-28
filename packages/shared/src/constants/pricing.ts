import type { PricingRegion } from '../types/enums.js';

/**
 * Tayfa+ pricing (MONETIZATION_ANALYSIS §10). Prices are charm-pointed and set
 * to local WTP (PPP), NOT FX parity — ₺149 is intentionally ~half the EU price
 * in hard-currency terms. Source of truth is config, never hardcoded in UI
 * (TECH_DECISIONS: "no hardcoded prices").
 */

export interface PlanPrice {
  readonly region: PricingRegion;
  readonly currency: 'TRY' | 'EUR';
  readonly monthly: number;
  readonly annual: number;
  /** Effective monthly cost on the annual plan. */
  readonly annualPerMonth: number;
  /** Discount of annual vs 12× monthly, as a fraction (0..1). */
  readonly annualDiscount: number;
  /** RevenueCat product identifiers. */
  readonly monthlyProductId: string;
  readonly annualProductId: string;
}

export const PRICING: Record<PricingRegion, PlanPrice> = {
  TR: {
    region: 'TR',
    currency: 'TRY',
    monthly: 149,
    annual: 999,
    annualPerMonth: 83.25,
    annualDiscount: 0.441,
    monthlyProductId: 'tayfa_plus_monthly_try',
    annualProductId: 'tayfa_plus_annual_try',
  },
  EU: {
    region: 'EU',
    currency: 'EUR',
    monthly: 6.99,
    annual: 49.99,
    annualPerMonth: 4.17,
    annualDiscount: 0.404,
    monthlyProductId: 'tayfa_plus_monthly_eur',
    annualProductId: 'tayfa_plus_annual_eur',
  },
};

/**
 * Trial is engagement-gated, never offered at install (MONETIZATION §13):
 * eligible only after ≥2 completed meetups OR membership in ≥1 crew.
 */
export const TRIAL = {
  minCompletedMeetups: 2,
  orMinCrews: 1,
  lengthDays: 7,
  reminderBeforeExpiryDays: 2,
} as const;

/** Free→paid and trial→paid targets (saturated city). */
export const CONVERSION_TARGETS = {
  freeToPaidMin: 0.03,
  freeToPaidMax: 0.05,
  trialToPaidMin: 0.3,
  monthlyChurnMax: 0.08,
} as const;

/**
 * The inviolable free list (MONETIZATION §12). These can NEVER sit behind a
 * paywall. Enforced in code by `domain/entitlements.ts`.
 */
export const NEVER_PAYWALLED = [
  'discover_events',
  'join_event',
  'create_event',
  'group_chat',
  'phone_verification',
  'id_liveness_verification',
  'block',
  'report',
  'appeals',
  'safety_center',
  'sos_checkin',
  'share_my_plan',
  'live_location_to_crew',
  'women_only_filter',
  'verified_only_filter',
  'reliability_safety_scores',
  'standard_match_ranking',
] as const;
export type NeverPaywalledFeature = (typeof NEVER_PAYWALLED)[number];

/** Premium features unlocked by the `tayfa_plus` entitlement (MONETIZATION §11). */
export const PREMIUM_FEATURES = [
  'unlimited_crews',
  'extra_photos_prompts',
  'premium_recap_cards',
  'advanced_interest_filters',
  'see_whos_interested',
  'match_ranking_boost',
  'travel_mode',
  'early_access_events',
  'read_receipts',
] as const;
export type PremiumFeature = (typeof PREMIUM_FEATURES)[number];

/** Free-tier ceilings that premium lifts. */
export const FREE_TIER_LIMITS = {
  maxActiveCrews: 3,
  maxPhotos: 3,
  maxPrompts: 3,
} as const;

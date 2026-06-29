import { PRICING, type PlanPrice } from '../constants/pricing.js';
import type { PremiumFeature } from '../constants/pricing.js';
import type { Entitlement, PricingRegion } from '../types/enums.js';

/**
 * Monetization decisions (MONETIZATION_ANALYSIS §10–14, ROADMAP §7, P7). Two pure,
 * tested concerns sit on top of the entitlement/trial/pricing primitives:
 *
 *  1. VALUE-FIRST paywall timing — the paywall appears only at *aspiration moments*
 *     (a great meetup just happened, a free-tier ceiling was reached, a premium
 *     feature was tapped) and NEVER interrupts a core / social / safety flow.
 *  2. ENTITLEMENT RECONCILIATION — map a billing lifecycle status (active, trial,
 *     grace, billing-retry, cancelled, expired, refunded, paused) to what the user
 *     may actually access. Grace/retry KEEP access (don't punish a failed renewal);
 *     refund/expiry REVOKE. RevenueCat is the server-side source of truth.
 *
 * Safety, verification, and the core loop are free forever — that invariant lives in
 * `domain/entitlements.ts` and is never reached by this file.
 */

// ── 1. Value-first paywall timing ─────────────────────────────────────────────

/**
 * Where in the product a possible upgrade prompt is being considered. `core_flow`
 * is the explicit guard: discovering/joining events, chat, and every safety surface
 * must NEVER show a paywall (ROADMAP §7 "never blocking core/social/safety").
 */
export type PaywallContext =
  | 'post_meetup_high' // just completed a great meetup → the aspiration moment
  | 'hit_crew_limit' // tried to exceed the free active-crew ceiling
  | 'tapped_premium_feature' // tapped see-who's-interested / advanced filter / travel mode
  | 'tapped_boost' // tapped match-ranking boost
  | 'core_flow'; // discover / join / chat / safety → never interrupt

const CORE_FLOW: PaywallContext = 'core_flow';

/** Contexts where, if anywhere, an upgrade is a *welcome* offer rather than a wall. */
const ASPIRATION_CONTEXTS: ReadonlySet<PaywallContext> = new Set([
  'post_meetup_high',
  'hit_crew_limit',
  'tapped_premium_feature',
  'tapped_boost',
]);

export interface UpgradePromptInput {
  readonly context: PaywallContext;
  readonly entitlement: Entitlement;
  /** From `checkTrialEligibility` — has the user earned a trial offer? */
  readonly trialEligible: boolean;
  /** The premium feature that triggered the prompt, if any (for copy/targeting). */
  readonly feature?: PremiumFeature;
}

export type UpgradePrompt =
  | { readonly show: false; readonly reason: 'already_subscribed' | 'core_flow_never_interrupt' }
  | {
      readonly show: true;
      readonly trigger: Exclude<PaywallContext, 'core_flow'>;
      readonly offerTrial: boolean;
      readonly feature?: PremiumFeature;
    };

/**
 * Decide whether to surface an upgrade prompt — the one gate every paywall call
 * site uses. Already-subscribed users and ALL core/social/safety flows never see
 * one. At an aspiration moment we show a value-framed offer, preferring a trial
 * when the user has earned it (engagement-gated → higher convert, lower churn).
 */
export function decideUpgradePrompt(input: UpgradePromptInput): UpgradePrompt {
  if (input.entitlement === 'tayfa_plus') {
    return { show: false, reason: 'already_subscribed' };
  }
  if (input.context === CORE_FLOW || !ASPIRATION_CONTEXTS.has(input.context)) {
    return { show: false, reason: 'core_flow_never_interrupt' };
  }
  return {
    show: true,
    // Narrowed by the guard above: every remaining context is an aspiration moment.
    trigger: input.context as Exclude<PaywallContext, 'core_flow'>,
    offerTrial: input.trialEligible,
    ...(input.feature !== undefined ? { feature: input.feature } : {}),
  };
}

// ── 2. Region-aware upgrade offer ─────────────────────────────────────────────

export interface UpgradeOffer {
  readonly region: PricingRegion;
  readonly price: PlanPrice;
  /** Annual savings vs 12× monthly, in whole local currency, for the "save X" line. */
  readonly annualSavings: number;
  /** Whether to lead with a free trial (engagement-gated). */
  readonly trial: boolean;
  /** Frame premium as MORE/BETTER plans, never "unlock basic features" (§7). */
  readonly framing: 'more_and_better_plans';
}

/** Build the offer card for a region. Prices come from config, never hardcoded. */
export function buildUpgradeOffer(region: PricingRegion, trialAvailable: boolean): UpgradeOffer {
  const price = PRICING[region];
  const annualSavings = Math.round((price.monthly * 12 - price.annual) * 100) / 100;
  return {
    region,
    price,
    annualSavings,
    trial: trialAvailable,
    framing: 'more_and_better_plans',
  };
}

// ── 3. Entitlement reconciliation (billing lifecycle → access) ─────────────────

/** Normalised subscription lifecycle state (provider-agnostic). */
export type BillingStatus =
  | 'active'
  | 'in_trial'
  | 'in_grace_period'
  | 'billing_retry'
  | 'cancelled' // will not renew, but PAID THROUGH the current period → keep access
  | 'expired'
  | 'refunded' // clawed back → revoke immediately
  | 'paused';

export interface ReconciledEntitlement {
  readonly entitlement: Entitlement;
  readonly inTrial: boolean;
  /** `full` = paid/trial; `grace` = renewal failing but still served; `none` = free. */
  readonly access: 'full' | 'grace' | 'none';
}

/**
 * Map a billing status to what the user may access. The product-critical calls:
 *  • grace period + billing retry KEEP premium — a failed charge is a payment
 *    problem, not a reason to yank features mid-month (reduces involuntary churn).
 *  • cancellation KEEPS premium until expiry — they paid through the period.
 *  • refund REVOKES immediately — the money was returned.
 */
export function reconcileEntitlement(status: BillingStatus): ReconciledEntitlement {
  switch (status) {
    case 'active':
      return { entitlement: 'tayfa_plus', inTrial: false, access: 'full' };
    case 'in_trial':
      return { entitlement: 'tayfa_plus', inTrial: true, access: 'full' };
    case 'cancelled':
      return { entitlement: 'tayfa_plus', inTrial: false, access: 'full' };
    case 'in_grace_period':
    case 'billing_retry':
      return { entitlement: 'tayfa_plus', inTrial: false, access: 'grace' };
    case 'expired':
    case 'refunded':
    case 'paused':
      return { entitlement: 'free', inTrial: false, access: 'none' };
  }
}

// ── 4. RevenueCat event-type mapping (the concrete integration) ────────────────

/** RevenueCat webhook event types we act on (others are ignored → no state change). */
export type RevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'PRODUCT_CHANGE'
  | 'UNCANCELLATION'
  | 'NON_RENEWING_PURCHASE'
  | 'CANCELLATION'
  | 'BILLING_ISSUE'
  | 'SUBSCRIPTION_PAUSED'
  | 'EXPIRATION'
  | 'TRANSFER'
  | 'REFUND';

/**
 * Translate a RevenueCat event (+ its `period_type`) to a normalised BillingStatus.
 * `period_type === 'TRIAL'` wins for purchase/renewal events. Unknown/no-op event
 * types return null → the caller makes NO entitlement change (fail-safe).
 */
export function revenueCatEventToStatus(
  type: RevenueCatEventType | string,
  periodType?: string,
): BillingStatus | null {
  const isTrial = periodType === 'TRIAL' || periodType === 'INTRO';
  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'PRODUCT_CHANGE':
    case 'UNCANCELLATION':
    case 'NON_RENEWING_PURCHASE':
      return isTrial ? 'in_trial' : 'active';
    case 'CANCELLATION':
      return 'cancelled';
    case 'BILLING_ISSUE':
      return 'billing_retry';
    case 'SUBSCRIPTION_PAUSED':
      return 'paused';
    case 'EXPIRATION':
      return 'expired';
    case 'REFUND':
      return 'refunded';
    default:
      return null; // TRANSFER and any unknown type → no entitlement change
  }
}

// ── 5. Conversion guardrail (observability, not gating) ────────────────────────

/** Does a cohort hit the saturated-city free→paid target band? (MONETIZATION §14) */
export function meetsConversionTarget(
  freeToPaidRate: number,
  band: { readonly min: number; readonly max: number },
): { readonly status: 'below' | 'in_band' | 'above' } {
  if (freeToPaidRate < band.min) return { status: 'below' };
  if (freeToPaidRate > band.max) return { status: 'above' };
  return { status: 'in_band' };
}

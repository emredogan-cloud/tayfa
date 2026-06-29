import { AI_BUDGETS, MESSAGE_ARCHIVAL, SLO, type AiFeature } from '../constants/scale.js';

/**
 * Scale & reliability guards (ROADMAP §Phase 8). Pure decisions for the three
 * scale levers that must NOT live as magic numbers in the request path: AI cost
 * control, hot-table archival, and SLO checks. Every optimization is measured, and
 * cost guards fail OPEN (serve cache → template) so budget never breaks a flow.
 */

// ── AI cost guard ───────────────────────────────────────────────────────────────

export type AiSpendDecision =
  | { readonly action: 'allow' }
  | { readonly action: 'serve_cached'; readonly reason: 'budget_exhausted' }
  | { readonly action: 'fallback_template'; readonly reason: 'budget_exhausted' };

/**
 * Decide whether a feature may make a fresh paid AI call. Under budget → allow.
 * Over budget → degrade gracefully: prefer a cached result, else fail OPEN to a
 * template. NEVER returns a hard "deny" — a cost ceiling must not break UX (only
 * cosmetic generation is gated this way; safety moderation has its own fail-CLOSED
 * path and is never routed through this guard).
 */
export function decideAiSpend(
  feature: AiFeature,
  spentUnits: number,
  cacheAvailable: boolean,
): AiSpendDecision {
  const budget = AI_BUDGETS[feature].dailyUnits;
  if (spentUnits < budget) return { action: 'allow' };
  return cacheAvailable
    ? { action: 'serve_cached', reason: 'budget_exhausted' }
    : { action: 'fallback_template', reason: 'budget_exhausted' };
}

// ── Hot-table partitioning / archival ───────────────────────────────────────────

/** Month partition key (`YYYY_MM`) for the write-hot `message` table. */
export function messagePartitionKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}_${m}`;
}

/**
 * Whether a message older than the hot window is an archival candidate. Cold chat
 * moves to cheap storage; this never deletes — archival is reversible.
 */
export function shouldArchiveMessage(
  ageDays: number,
  hotWindowDays = MESSAGE_ARCHIVAL.hotWindowDays,
): boolean {
  return ageDays > hotWindowDays;
}

// ── SLO checks ──────────────────────────────────────────────────────────────────

export type SloName = keyof typeof SLO;

/** Whether an observed p99 latency is within its SLO budget (downtime = lost NSM). */
export function withinSlo(slo: SloName, observedP99Ms: number): boolean {
  return observedP99Ms <= SLO[slo];
}

/** A breach amount (ms over budget), or 0 when within SLO — for alert severity. */
export function sloBreachMs(slo: SloName, observedP99Ms: number): number {
  return Math.max(0, observedP99Ms - SLO[slo]);
}

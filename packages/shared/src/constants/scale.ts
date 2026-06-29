/**
 * Scale & reliability thresholds (ROADMAP §Phase 8). These drive the pure
 * scale-guard decisions in `domain/scale.ts` — cost control, hot-table archival,
 * and SLO checks — so the triggers are config, not magic numbers in the code.
 */

/** Chat is the write-hot table → partition by month, archive the cold tail. */
export const MESSAGE_ARCHIVAL = {
  /** Keep this many days of chat "hot"; older partitions are cold-storage candidates. */
  hotWindowDays: 90,
} as const;

/**
 * AI cost guards (ROADMAP §8 cost analysis). Per-feature daily budgets in abstract
 * "units" (1 unit ≈ one generation/embedding call); callers pass live spend. The
 * guard degrades gracefully — serve cache, then fail OPEN to a template — and never
 * breaks a user flow on budget exhaustion.
 */
export const AI_BUDGETS = {
  icebreakers: { dailyUnits: 50_000 },
  embeddings: { dailyUnits: 200_000 },
  moderation: { dailyUnits: 500_000 },
} as const;
export type AiFeature = keyof typeof AI_BUDGETS;

/** Service SLOs tied to NSM (downtime = missed meetups). p99 latency budgets (ms). */
export const SLO = {
  feedP99Ms: 150,
  rsvpP99Ms: 300,
  matchP99Ms: 400,
} as const;

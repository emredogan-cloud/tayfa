import type { RankingExplanation } from '../types/domain.js';

/**
 * Feed ranking (Discovery §P2). The database does the heavy lifting — PostGIS
 * `ST_DWithin` for radius and pgvector cosine similarity for interest match —
 * and hands this pure function the per-candidate features. Here we BLEND them
 * into a single explainable score so weights are tunable without a DB round-trip
 * and the ranking-eval harness can assert golden orderings.
 *
 * Guardrail (P4): ranking changes are evaluated against predicted completed-
 * meetup lift, never raw tap-rate. `serendipity` is an injected term (not
 * RNG-internal) so it stays deterministic and testable, and so the feed never
 * collapses into a filter bubble.
 */

export interface RankingWeights {
  readonly interest: number;
  readonly distance: number;
  readonly recency: number;
  readonly capacity: number;
  readonly reliability: number;
  readonly serendipity: number;
}

/** Default weights — interest match dominates, then proximity (the wedge vs Meetup). */
export const DEFAULT_WEIGHTS: RankingWeights = {
  interest: 0.42,
  distance: 0.24,
  recency: 0.12,
  capacity: 0.08,
  reliability: 0.08,
  serendipity: 0.06,
};

export interface RankingCandidate {
  readonly eventId: string;
  /** pgvector cosine similarity in [0,1] (1 = identical taste). */
  readonly interestSimilarity: number;
  /** Great-circle distance from the viewer, meters (PostGIS). */
  readonly distanceMeters: number;
  /** Hours until the event starts (must be ≥ 0; past events filtered upstream). */
  readonly hoursUntilStart: number;
  readonly capacityGoing: number;
  readonly capacityMax: number;
  /** Host reliability score in [0,100]. */
  readonly hostReliability: number;
  /** Injected serendipity term in [0,1] — breaks filter bubbles deterministically. */
  readonly serendipity: number;
  readonly mutualInterestCount: number;
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Distance decays smoothly: 0m→1.0, 5km→0.5, 20km→0.2. */
const distanceScore = (meters: number): number => 1 / (1 + Math.max(0, meters) / 5_000);

/** Sooner (but future) events rank higher; flat after two weeks out. */
const recencyScore = (hoursUntilStart: number): number => {
  const h = Math.max(0, hoursUntilStart);
  const horizon = 24 * 14; // 2 weeks
  return clamp01(1 - h / horizon);
};

/** Joinable events with some social proof score best; full events score 0. */
const capacityScore = (going: number, max: number): number => {
  if (max <= 0) return 0;
  const remaining = max - going;
  if (remaining <= 0) return 0;
  const fill = clamp01(going / max);
  return 0.6 + 0.4 * fill;
};

export function scoreCandidate(
  c: RankingCandidate,
  weights: RankingWeights = DEFAULT_WEIGHTS,
): RankingExplanation {
  const interest = clamp01(c.interestSimilarity);
  const dist = distanceScore(c.distanceMeters);
  const recency = recencyScore(c.hoursUntilStart);
  const capacity = capacityScore(c.capacityGoing, c.capacityMax);
  const reliability = clamp01(c.hostReliability / 100);
  const serendipity = clamp01(c.serendipity);

  const weightSum =
    weights.interest +
    weights.distance +
    weights.recency +
    weights.capacity +
    weights.reliability +
    weights.serendipity;

  const weighted =
    weights.interest * interest +
    weights.distance * dist +
    weights.recency * recency +
    weights.capacity * capacity +
    weights.reliability * reliability +
    weights.serendipity * serendipity;

  const score = weightSum === 0 ? 0 : weighted / weightSum;

  return {
    score,
    interestSimilarity: interest,
    distanceMeters: c.distanceMeters,
    distanceScore: dist,
    recencyScore: recency,
    capacityScore: capacity,
    serendipity,
    mutualInterestCount: c.mutualInterestCount,
  };
}

export interface RankedCandidate<T extends RankingCandidate = RankingCandidate> {
  readonly candidate: T;
  readonly explanation: RankingExplanation;
}

/**
 * Rank a candidate set, highest score first. Ties break by interest similarity
 * then distance (closer wins) so ordering is total and deterministic — required
 * for the golden-fixture eval harness.
 */
export function rankFeed<T extends RankingCandidate>(
  candidates: readonly T[],
  weights: RankingWeights = DEFAULT_WEIGHTS,
): RankedCandidate<T>[] {
  return candidates
    .map((candidate) => ({ candidate, explanation: scoreCandidate(candidate, weights) }))
    .sort((a, b) => {
      if (b.explanation.score !== a.explanation.score) {
        return b.explanation.score - a.explanation.score;
      }
      if (b.explanation.interestSimilarity !== a.explanation.interestSimilarity) {
        return b.explanation.interestSimilarity - a.explanation.interestSimilarity;
      }
      return a.explanation.distanceMeters - b.explanation.distanceMeters;
    });
}

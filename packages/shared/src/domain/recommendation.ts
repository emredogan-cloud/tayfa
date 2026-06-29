import { EMBEDDING } from '../constants/geo.js';
import {
  DEFAULT_WEIGHTS,
  scoreCandidate,
  type RankingCandidate,
  type RankingWeights,
} from './ranking.js';

/**
 * Recommendation ranking v2 (Phase 4). The DB does candidate generation —
 * PostGIS radius ∩ pgvector cosine ANN over `event.embedding` — and hands each
 * candidate its features. This pure layer BLENDS the relevance score (interest ∩
 * distance ∩ recency ∩ capacity ∩ reliability ∩ serendipity, from `ranking.ts`)
 * with behavioural and social signals, and emits an explainable result so every
 * card can answer "Why am I seeing this?".
 *
 * Guardrail (mission §P4): tune against predicted COMPLETED-MEETUP lift, never raw
 * tap-rate — `meetupPropensity()` is the proxy the eval harness scores on.
 */

export interface RecommendationCandidate extends RankingCandidate {
  /** Behavioural affinity in [0,1]: attended/rated-highly similar events. */
  readonly behaviorAffinity: number;
  /** Social proof in [0,1]: mutuals / prior co-attendance among who's going. */
  readonly socialProof: number;
}

export interface RecommendationWeights {
  /** Weight of the base relevance score (ranking.ts). */
  readonly relevance: number;
  readonly behavior: number;
  readonly social: number;
}

export const DEFAULT_RECOMMENDATION_WEIGHTS: RecommendationWeights = {
  relevance: 0.7,
  behavior: 0.18,
  social: 0.12,
};

export interface RecommendationExplanation {
  readonly score: number;
  readonly relevanceScore: number;
  readonly behaviorAffinity: number;
  readonly socialProof: number;
  readonly interestSimilarity: number;
  readonly distanceMeters: number;
  readonly mutualInterestCount: number;
  /** Human-readable reasons for the "Why am I seeing this?" affordance. */
  readonly reasons: readonly string[];
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Build the "Why am I seeing this?" reasons from a candidate's features, most
 * compelling first, capped at 3. Never leaks PII — only counts + coarse signals.
 */
export function explainRecommendation(c: RecommendationCandidate): string[] {
  const reasons: string[] = [];
  if (c.mutualInterestCount > 0) {
    reasons.push(
      c.mutualInterestCount === 1
        ? '1 shared interest'
        : `${c.mutualInterestCount} shared interests`,
    );
  }
  if (c.socialProof >= 0.5) reasons.push("People you'd vibe with are going");
  if (c.distanceMeters <= 2_000) reasons.push('Close to you');
  else if (c.distanceMeters <= 5_000) reasons.push('In your area');
  if (c.behaviorAffinity >= 0.6) reasons.push('Like meetups you’ve enjoyed');
  if (c.hostReliability >= 85) reasons.push('Hosted by a reliable member');
  if (reasons.length === 0 && c.serendipity >= 0.5) reasons.push('Something a little different');
  if (reasons.length === 0) reasons.push('Happening near you soon');
  return reasons.slice(0, 3);
}

export function scoreRecommendation(
  c: RecommendationCandidate,
  weights: RecommendationWeights = DEFAULT_RECOMMENDATION_WEIGHTS,
  baseWeights: RankingWeights = DEFAULT_WEIGHTS,
): RecommendationExplanation {
  const base = scoreCandidate(c, baseWeights);
  const behavior = clamp01(c.behaviorAffinity);
  const social = clamp01(c.socialProof);

  const wSum = weights.relevance + weights.behavior + weights.social;
  const score =
    wSum === 0
      ? 0
      : (weights.relevance * base.score + weights.behavior * behavior + weights.social * social) /
        wSum;

  return {
    score,
    relevanceScore: base.score,
    behaviorAffinity: behavior,
    socialProof: social,
    interestSimilarity: base.interestSimilarity,
    distanceMeters: base.distanceMeters,
    mutualInterestCount: base.mutualInterestCount,
    reasons: explainRecommendation(c),
  };
}

export interface RankedRecommendation<T extends RecommendationCandidate = RecommendationCandidate> {
  readonly candidate: T;
  readonly explanation: RecommendationExplanation;
}

/**
 * Rank recommendation candidates, best first. Total + deterministic ordering
 * (score → relevance → distance) so the offline eval harness is stable.
 */
export function rankRecommendations<T extends RecommendationCandidate>(
  candidates: readonly T[],
  weights: RecommendationWeights = DEFAULT_RECOMMENDATION_WEIGHTS,
  baseWeights: RankingWeights = DEFAULT_WEIGHTS,
): RankedRecommendation<T>[] {
  return candidates
    .map((candidate) => ({
      candidate,
      explanation: scoreRecommendation(candidate, weights, baseWeights),
    }))
    .sort((a, b) => {
      if (b.explanation.score !== a.explanation.score)
        return b.explanation.score - a.explanation.score;
      if (b.explanation.relevanceScore !== a.explanation.relevanceScore) {
        return b.explanation.relevanceScore - a.explanation.relevanceScore;
      }
      return a.explanation.distanceMeters - b.explanation.distanceMeters;
    });
}

/**
 * Predicted completed-meetup propensity for a candidate — the GUARDRAIL metric
 * any ranking change is scored against (never raw tap-rate). Heuristic blend of
 * the signals most correlated with a real show-up: relevance, social proof, and
 * joinability (open capacity). Bounded [0,1].
 */
export function meetupPropensity(c: RecommendationCandidate): number {
  const rel = scoreCandidate(c).score;
  const joinable = c.capacityMax > c.capacityGoing ? 1 : 0;
  return clamp01(0.55 * rel + 0.3 * clamp01(c.socialProof) + 0.15 * joinable);
}

/**
 * Whether a stored embedding must be recomputed (model or version drift). The
 * re-embed job (Inngest) calls this; sticky embedding dimension means a model
 * change is a versioned re-embed, never a silent overwrite (TECH_DECISIONS ADR-011).
 */
export function needsReembed(stored: { model: string | null; version: number | null }): boolean {
  return stored.model !== EMBEDDING.model || stored.version !== EMBEDDING.version;
}

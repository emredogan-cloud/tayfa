import { INITIAL_SCORES, REPUTATION_GATES } from '../constants/safety.js';

/**
 * Reputation scoring (GROWTH §habit, RISK_ANALYSIS §reputation). Two scores,
 * both 0–100, both smoothed with a Bayesian prior so a single bad event can't
 * tank a new user and a brand-new account isn't presumed perfect:
 *   • reliability — show-up behaviour; gates HOSTING and ranks supply.
 *   • safety — rating/report signal; gates HOSTING + DM; suppresses recommendations.
 *
 * Pure: takes aggregates, returns a score. The DB stores the aggregates; these
 * functions are the single definition of how they roll up.
 */

export interface ReliabilityAggregate {
  readonly attended: number;
  readonly noShows: number;
  readonly lateCancels: number;
  readonly hostedCompleted: number;
}

export interface SafetyAggregate {
  /** Ratings where would_meet_again = true. */
  readonly positiveRatings: number;
  /** Ratings where would_meet_again = false OR vibe ≤ 2. */
  readonly negativeRatings: number;
  /** Private safety flags raised against the user (invisible to them). */
  readonly privateSafetyFlags: number;
  /** Reports upheld by a moderator after review. */
  readonly upheldReports: number;
}

const clampScore = (n: number): number => (n < 0 ? 0 : n > 100 ? 100 : Math.round(n));

// Priors encode the neutral-positive starting scores for a fresh account.
const RELIABILITY_PRIOR_POS = 7;
const RELIABILITY_PRIOR_TOTAL = 10; // → 70 at zero history
const SAFETY_PRIOR_POS = 7.5;
const SAFETY_PRIOR_TOTAL = 10; // → 75 at zero history

export function computeReliabilityScore(agg: ReliabilityAggregate): number {
  const total = agg.attended + agg.noShows + agg.lateCancels;
  const base = (100 * (agg.attended + RELIABILITY_PRIOR_POS)) / (total + RELIABILITY_PRIOR_TOTAL);
  // Small supply-side bonus for hosts who actually run completed events.
  const hostBonus = Math.min(8, agg.hostedCompleted * 1.5);
  return clampScore(base + hostBonus);
}

export function computeSafetyScore(agg: SafetyAggregate): number {
  const ratings = agg.positiveRatings + agg.negativeRatings;
  const base = (100 * (agg.positiveRatings + SAFETY_PRIOR_POS)) / (ratings + SAFETY_PRIOR_TOTAL);
  // Safety penalties are heavy and asymmetric — false-negative cost dominates.
  const penalty = agg.privateSafetyFlags * 8 + agg.upheldReports * 20;
  return clampScore(base - penalty);
}

export const initialReliabilityScore = (): number => INITIAL_SCORES.reliability;
export const initialSafetyScore = (): number => INITIAL_SCORES.safety;

export interface ReputationScores {
  readonly reliability: number;
  readonly safety: number;
}

/** Hosting requires BOTH reliability and safety above their gates. */
export function canHost(scores: ReputationScores): boolean {
  return (
    scores.reliability >= REPUTATION_GATES.minReliabilityToHost &&
    scores.safety >= REPUTATION_GATES.minSafetyToHost
  );
}

/** DMs require Verified+ (checked elsewhere) AND a safety floor. */
export function canDm(scores: ReputationScores): boolean {
  return scores.safety >= REPUTATION_GATES.minSafetyToDm;
}

/** A low-safety user is never recommended to others (risk > benefit). */
export function isRecommendable(scores: ReputationScores): boolean {
  return scores.safety >= REPUTATION_GATES.neverRecommendBelowSafety;
}

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RECOMMENDATION_WEIGHTS,
  explainRecommendation,
  meetupPropensity,
  needsReembed,
  rankRecommendations,
  scoreRecommendation,
  type RecommendationCandidate,
} from './recommendation.js';
import { EMBEDDING } from '../constants/geo.js';

const base: RecommendationCandidate = {
  eventId: 'e',
  interestSimilarity: 0.6,
  distanceMeters: 1_500,
  hoursUntilStart: 36,
  capacityGoing: 3,
  capacityMax: 6,
  hostReliability: 80,
  serendipity: 0.2,
  mutualInterestCount: 2,
  behaviorAffinity: 0.4,
  socialProof: 0.3,
};

describe('scoreRecommendation', () => {
  it('blends relevance + behavior + social into [0,1]', () => {
    const e = scoreRecommendation(base);
    expect(e.score).toBeGreaterThan(0);
    expect(e.score).toBeLessThanOrEqual(1);
    expect(e.relevanceScore).toBeGreaterThan(0);
  });

  it('rewards behavioural affinity and social proof', () => {
    const low = scoreRecommendation({ ...base, behaviorAffinity: 0, socialProof: 0 });
    const high = scoreRecommendation({ ...base, behaviorAffinity: 1, socialProof: 1 });
    expect(high.score).toBeGreaterThan(low.score);
  });

  it('returns 0 with all-zero weights (no division by zero)', () => {
    const e = scoreRecommendation(base, { relevance: 0, behavior: 0, social: 0 });
    expect(e.score).toBe(0);
  });
});

describe('explainRecommendation — "Why am I seeing this?"', () => {
  it('surfaces shared interests, social proof, and proximity (max 3)', () => {
    const reasons = explainRecommendation({
      ...base,
      mutualInterestCount: 3,
      socialProof: 0.8,
      distanceMeters: 900,
    });
    expect(reasons.length).toBeLessThanOrEqual(3);
    expect(reasons).toContain('3 shared interests');
    expect(reasons).toContain("People you'd vibe with are going");
    expect(reasons).toContain('Close to you');
  });

  it('always gives at least one reason (never empty / never PII)', () => {
    const reasons = explainRecommendation({
      ...base,
      mutualInterestCount: 0,
      socialProof: 0,
      behaviorAffinity: 0,
      serendipity: 0,
      distanceMeters: 30_000,
      hostReliability: 50,
    });
    expect(reasons.length).toBeGreaterThanOrEqual(1);
    expect(reasons.join(' ')).not.toMatch(/@|\+\d|http/); // no emails/phones/links
  });
});

describe('rankRecommendations', () => {
  it('ranks a high-affinity social pick above a cold one, deterministically', () => {
    const cold: RecommendationCandidate = {
      ...base,
      eventId: 'cold',
      behaviorAffinity: 0,
      socialProof: 0,
      interestSimilarity: 0.2,
    };
    const warm: RecommendationCandidate = {
      ...base,
      eventId: 'warm',
      behaviorAffinity: 0.9,
      socialProof: 0.9,
      interestSimilarity: 0.9,
    };
    const r1 = rankRecommendations([cold, warm]).map((x) => x.candidate.eventId);
    const r2 = rankRecommendations([warm, cold]).map((x) => x.candidate.eventId);
    expect(r1).toEqual(['warm', 'cold']);
    expect(r1).toEqual(r2);
  });
});

describe('meetupPropensity (guardrail)', () => {
  it('is higher for a joinable, socially-proven, relevant event', () => {
    const good = meetupPropensity({
      ...base,
      socialProof: 0.9,
      capacityGoing: 3,
      capacityMax: 6,
      interestSimilarity: 0.9,
    });
    const full = meetupPropensity({
      ...base,
      socialProof: 0.1,
      capacityGoing: 6,
      capacityMax: 6,
      interestSimilarity: 0.2,
    });
    expect(good).toBeGreaterThan(full);
    expect(good).toBeLessThanOrEqual(1);
  });
});

describe('needsReembed', () => {
  it('flags model or version drift; current = no re-embed', () => {
    expect(needsReembed({ model: EMBEDDING.model, version: EMBEDDING.version })).toBe(false);
    expect(needsReembed({ model: 'old-model', version: EMBEDDING.version })).toBe(true);
    expect(needsReembed({ model: EMBEDDING.model, version: 0 })).toBe(true);
    expect(needsReembed({ model: null, version: null })).toBe(true);
  });

  it('keeps the default recommendation weights normalized-ish (sum ≈ 1)', () => {
    const w = DEFAULT_RECOMMENDATION_WEIGHTS;
    expect(w.relevance + w.behavior + w.social).toBeCloseTo(1, 5);
  });
});

import { describe, expect, it } from 'vitest';
import { DEFAULT_WEIGHTS, rankFeed, scoreCandidate, type RankingCandidate } from './ranking.js';

const base: RankingCandidate = {
  eventId: 'e',
  interestSimilarity: 0.5,
  distanceMeters: 2_000,
  hoursUntilStart: 48,
  capacityGoing: 3,
  capacityMax: 6,
  hostReliability: 70,
  serendipity: 0.2,
  mutualInterestCount: 2,
};

describe('scoreCandidate', () => {
  it('produces a score in [0,1] with explainable components', () => {
    const e = scoreCandidate(base);
    expect(e.score).toBeGreaterThanOrEqual(0);
    expect(e.score).toBeLessThanOrEqual(1);
    expect(e.interestSimilarity).toBeCloseTo(0.5);
    expect(e.distanceScore).toBeGreaterThan(0);
    expect(e.capacityScore).toBeGreaterThan(0);
  });

  it('scores a full event 0 on capacity (cannot be joined)', () => {
    const e = scoreCandidate({ ...base, capacityGoing: 6, capacityMax: 6 });
    expect(e.capacityScore).toBe(0);
  });

  it('clamps out-of-range inputs', () => {
    const e = scoreCandidate({ ...base, interestSimilarity: 5, serendipity: -3 });
    expect(e.interestSimilarity).toBe(1);
    expect(e.serendipity).toBe(0);
  });

  it('returns score 0 when all weights are 0 (no division by zero)', () => {
    const e = scoreCandidate(base, {
      interest: 0,
      distance: 0,
      recency: 0,
      capacity: 0,
      reliability: 0,
      serendipity: 0,
    });
    expect(e.score).toBe(0);
  });
});

describe('rankFeed — the P2 success metric', () => {
  it('ranks an interest-matched far event ABOVE a merely-nearby low-interest event', () => {
    const interestMatchedFar: RankingCandidate = {
      ...base,
      eventId: 'matched_far',
      interestSimilarity: 0.95,
      distanceMeters: 8_000,
    };
    const nearbyLowInterest: RankingCandidate = {
      ...base,
      eventId: 'nearby_low',
      interestSimilarity: 0.1,
      distanceMeters: 200,
    };
    const ranked = rankFeed([nearbyLowInterest, interestMatchedFar], DEFAULT_WEIGHTS);
    expect(ranked[0]?.candidate.eventId).toBe('matched_far');
    expect(ranked[1]?.candidate.eventId).toBe('nearby_low');
  });

  it('is deterministic regardless of input order', () => {
    const a: RankingCandidate = { ...base, eventId: 'a', distanceMeters: 1_000 };
    const b: RankingCandidate = { ...base, eventId: 'b', distanceMeters: 500 };
    const r1 = rankFeed([a, b]).map((x) => x.candidate.eventId);
    const r2 = rankFeed([b, a]).map((x) => x.candidate.eventId);
    expect(r1).toEqual(r2);
    expect(r1[0]).toBe('b'); // closer event scores higher
  });

  it('breaks exact score ties by interest similarity (higher first)', () => {
    // Weight only distance → equal distance ⇒ equal score ⇒ tie-break engages.
    const distanceOnly = {
      interest: 0,
      distance: 1,
      recency: 0,
      capacity: 0,
      reliability: 0,
      serendipity: 0,
    };
    const lowInterest: RankingCandidate = {
      ...base,
      eventId: 'low',
      interestSimilarity: 0.2,
      distanceMeters: 1_000,
    };
    const highInterest: RankingCandidate = {
      ...base,
      eventId: 'high',
      interestSimilarity: 0.9,
      distanceMeters: 1_000,
    };
    const ranked = rankFeed([lowInterest, highInterest], distanceOnly);
    expect(ranked[0]?.explanation.score).toBeCloseTo(ranked[1]?.explanation.score ?? -1);
    expect(ranked[0]?.candidate.eventId).toBe('high');
  });
});

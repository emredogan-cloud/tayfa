import { describe, expect, it } from 'vitest';
import {
  canDm,
  canHost,
  computeReliabilityScore,
  computeSafetyScore,
  initialReliabilityScore,
  initialSafetyScore,
  isRecommendable,
} from './reputation.js';

describe('reliability score', () => {
  it('starts neutral-positive (~70) for a brand-new account', () => {
    expect(initialReliabilityScore()).toBe(70);
    expect(
      computeReliabilityScore({ attended: 0, noShows: 0, lateCancels: 0, hostedCompleted: 0 }),
    ).toBe(70);
  });
  it('rises with reliable attendance', () => {
    const s = computeReliabilityScore({
      attended: 20,
      noShows: 0,
      lateCancels: 0,
      hostedCompleted: 0,
    });
    expect(s).toBeGreaterThan(85);
  });
  it('falls with no-shows and late cancels', () => {
    const s = computeReliabilityScore({
      attended: 2,
      noShows: 8,
      lateCancels: 2,
      hostedCompleted: 0,
    });
    expect(s).toBeLessThan(50);
  });
  it('gives hosts a capped supply-side bonus', () => {
    const withHost = computeReliabilityScore({
      attended: 10,
      noShows: 0,
      lateCancels: 0,
      hostedCompleted: 10,
    });
    const noHost = computeReliabilityScore({
      attended: 10,
      noShows: 0,
      lateCancels: 0,
      hostedCompleted: 0,
    });
    expect(withHost).toBeGreaterThanOrEqual(noHost);
    expect(withHost).toBeLessThanOrEqual(100);
  });
});

describe('safety score', () => {
  it('starts ~75 for a new account', () => {
    expect(initialSafetyScore()).toBe(75);
    expect(
      computeSafetyScore({
        positiveRatings: 0,
        negativeRatings: 0,
        privateSafetyFlags: 0,
        upheldReports: 0,
      }),
    ).toBe(75);
  });
  it('is punished heavily by upheld reports and private flags', () => {
    const s = computeSafetyScore({
      positiveRatings: 5,
      negativeRatings: 0,
      privateSafetyFlags: 2,
      upheldReports: 2,
    });
    expect(s).toBeLessThan(40);
  });
  it('never goes below 0', () => {
    const s = computeSafetyScore({
      positiveRatings: 0,
      negativeRatings: 10,
      privateSafetyFlags: 10,
      upheldReports: 10,
    });
    expect(s).toBe(0);
  });
});

describe('reputation gates', () => {
  it('blocks hosting below the reliability OR safety floor', () => {
    expect(canHost({ reliability: 80, safety: 80 })).toBe(true);
    expect(canHost({ reliability: 30, safety: 80 })).toBe(false); // reliability too low
    expect(canHost({ reliability: 80, safety: 50 })).toBe(false); // safety too low
  });
  it('blocks DM below the safety floor', () => {
    expect(canDm({ reliability: 0, safety: 60 })).toBe(true);
    expect(canDm({ reliability: 99, safety: 59 })).toBe(false);
  });
  it('never recommends a low-safety user', () => {
    expect(isRecommendable({ reliability: 90, safety: 34 })).toBe(false);
    expect(isRecommendable({ reliability: 90, safety: 35 })).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { haversineMeters, isWithin } from './geo-distance.js';

describe('haversineMeters', () => {
  it('is zero for identical points', () => {
    expect(haversineMeters({ lat: 41, lng: 29 }, { lat: 41, lng: 29 })).toBe(0);
  });

  it('matches a known distance (Kadıköy → Beşiktaş ≈ 4.6km) within 5%', () => {
    const kadikoy = { lat: 40.9907, lng: 29.0277 };
    const besiktas = { lat: 41.0422, lng: 29.0083 };
    const d = haversineMeters(kadikoy, besiktas);
    expect(d).toBeGreaterThan(4_300);
    expect(d).toBeLessThan(6_500);
  });

  it('is symmetric', () => {
    const a = { lat: 40.99, lng: 29.02 };
    const b = { lat: 41.04, lng: 29.0 };
    expect(haversineMeters(a, b)).toBeCloseTo(haversineMeters(b, a), 6);
  });
});

describe('isWithin', () => {
  const center = { lat: 40.9907, lng: 29.0277 };
  it('returns true inside the radius and false outside', () => {
    expect(isWithin(center, { lat: 40.991, lng: 29.028 }, 250)).toBe(true);
    expect(isWithin(center, { lat: 41.05, lng: 29.05 }, 250)).toBe(false);
  });
});

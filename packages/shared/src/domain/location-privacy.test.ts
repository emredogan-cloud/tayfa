import { describe, expect, it } from 'vitest';
import { canReleasePreciseLocation, fuzz, type FuzzInput } from './location-privacy.js';
import type { GeoPoint } from '../types/domain.js';

// Deterministic H3 stubs (the real h3-js lives in app packages).
const h3IndexOf = (lat: number, lng: number): string => `cell_${lat.toFixed(2)}_${lng.toFixed(2)}`;
const h3Centroid = (cell: string): GeoPoint => {
  const [, lat, lng] = cell.split('_');
  return { lat: Number(lat), lng: Number(lng) };
};

const baseFuzz = (point: GeoPoint): FuzzInput => ({
  point,
  neighborhood: 'Kadıköy',
  h3IndexOf,
  h3Centroid,
});

describe('fuzz', () => {
  it('returns a geocell + centroid and NEVER the precise point', () => {
    const precise = { lat: 40.99071234, lng: 29.02779876 };
    const fuzzed = fuzz(baseFuzz(precise));
    expect(fuzzed.geocell).toBe('cell_40.99_29.03');
    // The fuzzed centroid is coarser than the precise input — coordinates differ.
    expect(fuzzed.centroid.lat).not.toBe(precise.lat);
    expect(fuzzed.centroid.lng).not.toBe(precise.lng);
    expect(fuzzed.neighborhood).toBe('Kadıköy');
    expect(fuzzed.approxRadiusMeters).toBeGreaterThan(0);
    // Structural guarantee: the type carries no precise GeoPoint field.
    expect(Object.keys(fuzzed)).not.toContain('point');
  });
});

describe('canReleasePreciseLocation', () => {
  const startsAt = new Date('2026-07-01T18:00:00Z');

  it('always allows the host', () => {
    const d = canReleasePreciseLocation({
      isHost: true,
      viewerRsvpStatus: null,
      eventStartsAt: startsAt,
      now: new Date('2026-06-01T00:00:00Z'),
    });
    expect(d.allowed).toBe(true);
  });

  it('denies a non-member (deny-by-default)', () => {
    const d = canReleasePreciseLocation({
      isHost: false,
      viewerRsvpStatus: null,
      eventStartsAt: startsAt,
      now: new Date('2026-07-01T17:50:00Z'),
    });
    expect(d).toEqual({ allowed: false, reason: 'not_a_member' });
  });

  it('denies a requested-but-not-approved member', () => {
    const d = canReleasePreciseLocation({
      isHost: false,
      viewerRsvpStatus: 'requested',
      eventStartsAt: startsAt,
      now: new Date('2026-07-01T17:50:00Z'),
    });
    expect(d).toEqual({ allowed: false, reason: 'rsvp_not_approved' });
  });

  it('denies an approved member OUTSIDE the release window', () => {
    const d = canReleasePreciseLocation({
      isHost: false,
      viewerRsvpStatus: 'approved',
      eventStartsAt: startsAt,
      now: new Date('2026-07-01T17:00:00Z'), // 60 min before — window is 30 min
    });
    expect(d).toEqual({ allowed: false, reason: 'outside_release_window' });
  });

  it('allows an approved member INSIDE the release window', () => {
    const d = canReleasePreciseLocation({
      isHost: false,
      viewerRsvpStatus: 'going',
      eventStartsAt: startsAt,
      now: new Date('2026-07-01T17:45:00Z'), // 15 min before
    });
    expect(d.allowed).toBe(true);
  });
});

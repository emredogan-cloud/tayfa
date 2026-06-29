import { describe, expect, it } from 'vitest';
import {
  applyGhostTownGuard,
  cityLaunchDecision,
  cityLiquidityStatus,
  resolveActiveCity,
  resolveDiscoveryRadius,
} from './expansion.js';
import { DISCOVERY, EXPANSION } from '../constants/geo.js';

describe('cityLiquidityStatus', () => {
  const floor = EXPANSION.liquidityEventsPerWeekFloor;
  it('classifies across the liquidity bands', () => {
    expect(cityLiquidityStatus(floor * 2)).toBe('saturated');
    expect(cityLiquidityStatus(floor)).toBe('liquid');
    expect(cityLiquidityStatus(floor - 1)).toBe('seeding');
    expect(cityLiquidityStatus(floor / 2 - 1)).toBe('ghost_town');
    expect(cityLiquidityStatus(0)).toBe('ghost_town');
  });
});

describe('resolveDiscoveryRadius — fallback ladder', () => {
  it('picks the first radius that has enough events', () => {
    const r = resolveDiscoveryRadius([2, 5, 12, 40], 8);
    expect(r).toEqual({ radiusMeters: DISCOVERY.radiusFallbackLadderMeters[2], sufficient: true });
  });
  it('returns the max radius and sufficient:false when nothing reaches the floor', () => {
    const r = resolveDiscoveryRadius([0, 1, 2, 3], 8);
    expect(r).toEqual({ radiusMeters: DISCOVERY.maxRadiusMeters, sufficient: false });
  });
  it('treats missing steps as zero', () => {
    expect(resolveDiscoveryRadius([], 1).sufficient).toBe(false);
  });
});

describe('applyGhostTownGuard — never an empty feed', () => {
  it('returns live events untouched when already above the floor', () => {
    const live = Array.from({ length: 10 }, (_, i) => `live${i}`);
    const r = applyGhostTownGuard({ live, seed: ['s1'], minVisible: 8 });
    expect(r).toEqual({ events: live, seeded: false, seededCount: 0 });
  });
  it('backfills from seed supply up to minVisible and flags it', () => {
    const r = applyGhostTownGuard({
      live: ['a', 'b'],
      seed: ['s1', 's2', 's3', 's4', 's5'],
      minVisible: 5,
    });
    expect(r.events).toEqual(['a', 'b', 's1', 's2', 's3']);
    expect(r.seeded).toBe(true);
    expect(r.seededCount).toBe(3);
  });
  it('does not invent demand it cannot back — caps at available seed', () => {
    const r = applyGhostTownGuard({ live: [], seed: ['s1'], minVisible: 8 });
    expect(r.events).toEqual(['s1']);
    expect(r.seededCount).toBe(1);
  });
});

describe('cityLaunchDecision — all gates must pass', () => {
  const ready = {
    liquidityEventsPerWeek: EXPANSION.liquidityEventsPerWeekFloor,
    verifiedHostCount: EXPANSION.minVerifiedHosts,
    ltvToCacRatio: 1.5,
  };
  it('launches when liquidity + hosts + economics all clear', () => {
    const d = cityLaunchDecision(ready);
    expect(d.launch).toBe(true);
    expect(d.blockers).toEqual([]);
    expect(d.status).toBe('liquid');
  });
  it('blocks on unproven economics even with great liquidity (the discipline gate)', () => {
    const d = cityLaunchDecision({
      ...ready,
      liquidityEventsPerWeek: 200,
      ltvToCacRatio: 0.8,
    });
    expect(d.launch).toBe(false);
    expect(d.blockers).toContain('unproven_economics');
    expect(d.status).toBe('saturated');
  });
  it('collects every failing gate', () => {
    const d = cityLaunchDecision({
      liquidityEventsPerWeek: 1,
      verifiedHostCount: 0,
      ltvToCacRatio: 0,
    });
    expect(d.blockers).toEqual([
      'insufficient_liquidity',
      'too_few_verified_hosts',
      'unproven_economics',
    ]);
  });
});

describe('resolveActiveCity — travel mode is premium', () => {
  it('shows home city when no travel requested', () => {
    expect(resolveActiveCity({ homeCityId: 'ist', entitlement: 'free' })).toEqual({
      cityId: 'ist',
      traveling: false,
    });
  });
  it('lets a Tayfa+ user travel to another city', () => {
    expect(
      resolveActiveCity({ homeCityId: 'ist', requestedCityId: 'ber', entitlement: 'tayfa_plus' }),
    ).toEqual({ cityId: 'ber', traveling: true });
  });
  it('keeps a free user on home + flags upgrade (never hard-blocks the feed)', () => {
    const r = resolveActiveCity({
      homeCityId: 'ist',
      requestedCityId: 'ber',
      entitlement: 'free',
    });
    expect(r).toEqual({ cityId: 'ist', traveling: false, requiresUpgrade: true });
  });
  it('ignores a travel request that equals the home city', () => {
    expect(
      resolveActiveCity({ homeCityId: 'ist', requestedCityId: 'ist', entitlement: 'free' }),
    ).toEqual({ cityId: 'ist', traveling: false });
  });
});

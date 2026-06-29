import { DISCOVERY, EXPANSION } from '../constants/geo.js';
import { checkFeatureAccess } from './entitlements.js';
import type { Entitlement } from '../types/enums.js';

/**
 * Multi-city expansion (ROADMAP §Phase 8, §cold-start). Launching a city is a
 * repeatable PLAYBOOK gated on real liquidity + seeded supply + proven economics —
 * never thin global spread. Pure + tested: liquidity classification, the radius
 * fallback ladder, the ghost-town guard (never an empty feed), the city go/no-go
 * gate, and travel-mode city resolution (a premium feature, P7).
 */

// ── City liquidity ─────────────────────────────────────────────────────────────

export type LiquidityStatus = 'ghost_town' | 'seeding' | 'liquid' | 'saturated';

/**
 * Classify a city by live events/week within the liquidity radius. A city is
 * "liquid" at the floor and "saturated" at the multiple (compounding network
 * effect). Below half the floor it's a ghost town — supply seeding is mandatory.
 */
export function cityLiquidityStatus(liveEventsPerWeek: number): LiquidityStatus {
  const floor = EXPANSION.liquidityEventsPerWeekFloor;
  if (liveEventsPerWeek >= floor * EXPANSION.saturationMultiple) return 'saturated';
  if (liveEventsPerWeek >= floor) return 'liquid';
  if (liveEventsPerWeek >= floor / 2) return 'seeding';
  return 'ghost_town';
}

// ── Radius fallback ladder ──────────────────────────────────────────────────────

/**
 * Walk the discovery-radius ladder, widening until a step has enough candidate
 * events; return the chosen radius. `countsByStep[i]` is the candidate count at
 * `radiusFallbackLadderMeters[i]`. If no step reaches `minEvents`, return the max
 * radius with `sufficient: false` (the caller then triggers the ghost-town guard).
 */
export function resolveDiscoveryRadius(
  countsByStep: readonly number[],
  minEvents = EXPANSION.minVisibleFeedEvents,
): { readonly radiusMeters: number; readonly sufficient: boolean } {
  const ladder = DISCOVERY.radiusFallbackLadderMeters;
  for (let i = 0; i < ladder.length; i++) {
    if ((countsByStep[i] ?? 0) >= minEvents) {
      return { radiusMeters: ladder[i] ?? DISCOVERY.maxRadiusMeters, sufficient: true };
    }
  }
  return { radiusMeters: DISCOVERY.maxRadiusMeters, sufficient: false };
}

// ── Ghost-town guard ────────────────────────────────────────────────────────────

export interface GhostTownInput<T> {
  /** Real, user-created live events (already ranked). */
  readonly live: readonly T[];
  /** Curated/partner/seed events to backfill with — clearly flagged to the UI. */
  readonly seed: readonly T[];
  /** Never render fewer than this many (defaults to the configured floor). */
  readonly minVisible?: number;
}

export interface GhostTownResult<T> {
  readonly events: readonly T[];
  /** True when any seed events were mixed in (the UI must label them honestly). */
  readonly seeded: boolean;
  readonly seededCount: number;
}

/**
 * The make-or-break guarantee: a live feed NEVER renders empty (ROADMAP §cold-start).
 * Real events lead; if there aren't enough, backfill from curated/partner seed
 * supply up to `minVisible`. The result flags whether seeding happened so the UI
 * can label seed events honestly (we never fake real demand silently).
 */
export function applyGhostTownGuard<T>(input: GhostTownInput<T>): GhostTownResult<T> {
  const minVisible = input.minVisible ?? EXPANSION.minVisibleFeedEvents;
  if (input.live.length >= minVisible) {
    return { events: input.live, seeded: false, seededCount: 0 };
  }
  const need = minVisible - input.live.length;
  const fill = input.seed.slice(0, need);
  return {
    events: [...input.live, ...fill],
    seeded: fill.length > 0,
    seededCount: fill.length,
  };
}

// ── City launch go/no-go gate ───────────────────────────────────────────────────

export interface CityLaunchMetrics {
  readonly liquidityEventsPerWeek: number;
  readonly verifiedHostCount: number;
  /** Proven economics from the lead city — gate scaling on this (Phase 8 dep). */
  readonly ltvToCacRatio: number;
}

export type LaunchBlocker =
  'insufficient_liquidity' | 'too_few_verified_hosts' | 'unproven_economics';

export interface CityLaunchDecision {
  readonly launch: boolean;
  readonly blockers: readonly LaunchBlocker[];
  readonly status: LiquidityStatus;
}

/**
 * Decide whether a city may open to the public. ALL gates must pass — liquidity,
 * seeded host supply, AND proven unit economics. The economics gate is the
 * discipline line: "don't scale unproven economics" (Phase 8 depends on Phase 7).
 */
export function cityLaunchDecision(metrics: CityLaunchMetrics): CityLaunchDecision {
  const blockers: LaunchBlocker[] = [];
  if (metrics.liquidityEventsPerWeek < EXPANSION.liquidityEventsPerWeekFloor) {
    blockers.push('insufficient_liquidity');
  }
  if (metrics.verifiedHostCount < EXPANSION.minVerifiedHosts) {
    blockers.push('too_few_verified_hosts');
  }
  if (metrics.ltvToCacRatio < EXPANSION.minLtvToCac) {
    blockers.push('unproven_economics');
  }
  return {
    launch: blockers.length === 0,
    blockers,
    status: cityLiquidityStatus(metrics.liquidityEventsPerWeek),
  };
}

// ── Travel mode (premium city scoping) ──────────────────────────────────────────

export interface ActiveCityInput {
  readonly homeCityId: string;
  /** A city the user wants to browse instead of home ("plan before you move"). */
  readonly requestedCityId?: string;
  readonly entitlement: Entitlement;
}

export interface ActiveCityResult {
  readonly cityId: string;
  /** True when travel mode is actively scoping the feed to a non-home city. */
  readonly traveling: boolean;
  /** Set when a free user requested travel mode — surfaces the upgrade nudge. */
  readonly requiresUpgrade?: true;
}

/**
 * Resolve which city's feed to show. Travel mode (browse another city before you
 * move) is a Tayfa+ feature — a free user always sees their home city, and a
 * requested-but-gated travel city surfaces an upgrade signal (never a hard block
 * on the core feed).
 */
export function resolveActiveCity(input: ActiveCityInput): ActiveCityResult {
  if (!input.requestedCityId || input.requestedCityId === input.homeCityId) {
    return { cityId: input.homeCityId, traveling: false };
  }
  const access = checkFeatureAccess('travel_mode', input.entitlement);
  if (!access.allowed) {
    return { cityId: input.homeCityId, traveling: false, requiresUpgrade: true };
  }
  return { cityId: input.requestedCityId, traveling: true };
}

/**
 * Geo constants (TECH_DECISIONS §3). Geocell = H3 index computed in app code
 * (h3-js), stored as text — avoids a Postgres h3 extension dependency. Precise
 * coordinates live in `geography(Point,4326)` and never leave the server for
 * non-approved users.
 */

/** H3 resolution for neighborhood-granularity bucketing (res 8–9). */
export const GEOCELL_RESOLUTION = 8;

/** Default discovery radius and the fallback ladder for sparse (cold) geocells. */
export const DISCOVERY = {
  defaultRadiusMeters: 5_000,
  /** Liquidity floor: ≥40 live events/week within this radius of the median user. */
  liquidityRadiusMeters: 5_000,
  liquidityEventsPerWeekFloor: 40,
  /** Ghost-town guard: widen the radius in steps before showing a curated fallback. */
  radiusFallbackLadderMeters: [5_000, 10_000, 20_000, 40_000],
  maxRadiusMeters: 40_000,
} as const;

/** Beachhead city (roadmap §1). */
export const BEACHHEAD = {
  cityName: 'Istanbul',
  countryCode: 'TR',
  /** Kadıköy centroid — used to seed synthetic test events. */
  seedCenter: { lat: 40.9907, lng: 29.0277 },
} as const;

/**
 * City-launch go/no-go gates (ROADMAP §Phase 8 + §cold-start). A city ships only
 * when it has real liquidity AND seeded supply AND proven economics — "don't scale
 * before economics work" (Phase 8 dependency on Phase 7's LTV:CAC).
 */
export const EXPANSION = {
  /** Liquidity floor to call a city launch-ready (events/week within 5km). */
  liquidityEventsPerWeekFloor: DISCOVERY.liquidityEventsPerWeekFloor,
  /** A city is "saturated" at 2× the floor. */
  saturationMultiple: 2,
  /** Minimum verified ambassador/seed hosts before opening a city. */
  minVerifiedHosts: 5,
  /** Don't scale unproven economics — require LTV:CAC ≥ this in the lead city. */
  minLtvToCac: 1,
  /** Ghost-town guard: never render fewer than this many events in a live feed. */
  minVisibleFeedEvents: 8,
} as const;

/** Data residency (TECH_DECISIONS ADR-014: one-way door). */
export const DATA_RESIDENCY_REGION = 'eu-central-1';

/** Embedding model + dimension (TECH_DECISIONS ADR-011). Cosine distance, HNSW. */
export const EMBEDDING = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  distance: 'cosine',
  version: 1,
} as const;

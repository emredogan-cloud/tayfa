import { PRECISE_LOCATION_RELEASE_WINDOW_MINUTES } from '../constants/safety.js';
import { GEOCELL_RESOLUTION } from '../constants/geo.js';
import type { FuzzedLocation, GeoPoint } from '../types/domain.js';
import type { RsvpStatus } from '../types/enums.js';

/**
 * Location privacy — the single most safety-critical invariant (RISK_ANALYSIS
 * §location, TECH_DECISIONS). Precise coordinates must NEVER be exposed to a
 * non-approved user. This module is the gatekeeper: feed/discovery surfaces call
 * `fuzz()`; precise release is allowed ONLY through `canReleasePreciseLocation()`.
 *
 * `h3IndexOf` is injected (h3-js lives in app packages) so this module stays
 * pure and dependency-free for testing.
 */

export interface FuzzInput {
  readonly point: GeoPoint;
  readonly neighborhood: string | null;
  /** Pure function that returns the H3 cell id for a lat/lng at a resolution. */
  readonly h3IndexOf: (lat: number, lng: number, resolution: number) => string;
  /** Pure function returning the centroid lat/lng of an H3 cell. */
  readonly h3Centroid: (cell: string) => GeoPoint;
}

/** Approximate edge radius (meters) of an H3 cell by resolution (res 8 ≈ 460m). */
const H3_APPROX_RADIUS_M: Record<number, number> = {
  7: 1_220,
  8: 461,
  9: 174,
};

/**
 * Convert a precise point into the ONLY shape a non-approved client may receive.
 * The output type (`FuzzedLocation`) structurally cannot carry the precise point.
 */
export function fuzz(input: FuzzInput): FuzzedLocation {
  const cell = input.h3IndexOf(input.point.lat, input.point.lng, GEOCELL_RESOLUTION);
  const centroid = input.h3Centroid(cell);
  return {
    geocell: cell,
    centroid,
    approxRadiusMeters: H3_APPROX_RADIUS_M[GEOCELL_RESOLUTION] ?? 461,
    neighborhood: input.neighborhood,
  };
}

export interface PreciseReleaseContext {
  readonly viewerRsvpStatus: RsvpStatus | null;
  readonly eventStartsAt: Date;
  readonly now: Date;
  readonly isHost: boolean;
}

export type PreciseReleaseDecision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: PreciseReleaseDenyReason };

export type PreciseReleaseDenyReason =
  'not_a_member' | 'rsvp_not_approved' | 'outside_release_window';

const APPROVED_STATUSES: ReadonlySet<RsvpStatus> = new Set<RsvpStatus>([
  'approved',
  'going',
  'attended',
]);

/**
 * Gate for releasing a precise event pin. The host always sees it; everyone else
 * must be an approved member AND inside the release window (≤30 min before
 * start, through the event). Deny-by-default: any unhandled case is a denial.
 */
export function canReleasePreciseLocation(ctx: PreciseReleaseContext): PreciseReleaseDecision {
  if (ctx.isHost) return { allowed: true };

  if (ctx.viewerRsvpStatus === null || !APPROVED_STATUSES.has(ctx.viewerRsvpStatus)) {
    return {
      allowed: false,
      reason: ctx.viewerRsvpStatus === null ? 'not_a_member' : 'rsvp_not_approved',
    };
  }

  const windowOpensMs =
    ctx.eventStartsAt.getTime() - PRECISE_LOCATION_RELEASE_WINDOW_MINUTES * 60_000;
  if (ctx.now.getTime() < windowOpensMs) {
    return { allowed: false, reason: 'outside_release_window' };
  }

  return { allowed: true };
}

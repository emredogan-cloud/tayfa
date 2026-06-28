import { cellToLatLng, latLngToCell } from 'h3-js';
import { fuzz, type FuzzInput } from '@tayfa/shared/domain';
import { GEOCELL_RESOLUTION } from '@tayfa/shared/constants';
import type { FuzzedLocation, GeoPoint } from '@tayfa/shared/types';

/**
 * H3 adapters for the spine's pure location-privacy module. `fuzz()` is dependency
 * -free by design (h3-js lives in app packages); we inject the two H3 functions
 * here. This is the ONLY place the web tier turns a precise point into the fuzzed
 * shape a non-approved client may receive (RISK_ANALYSIS §location).
 */

const h3IndexOf: FuzzInput['h3IndexOf'] = (lat, lng, resolution) =>
  latLngToCell(lat, lng, resolution);

const h3Centroid: FuzzInput['h3Centroid'] = (cell) => {
  const [lat, lng] = cellToLatLng(cell);
  return { lat, lng };
};

/** Fuzz a precise point into a geocell + centroid (never carries the precise point). */
export function fuzzPoint(point: GeoPoint, neighborhood: string | null): FuzzedLocation {
  return fuzz({ point, neighborhood, h3IndexOf, h3Centroid });
}

/** The neighborhood-granularity H3 geocell a precise point belongs to (for storage). */
export function pointToGeocell(point: GeoPoint): string {
  return latLngToCell(point.lat, point.lng, GEOCELL_RESOLUTION);
}

/**
 * Centroid of a stored geocell — for surfaces that only ever had the geocell
 * (e.g. the share page, which reads `event.geocell` and never `event.location`).
 */
export function geocellToCentroid(geocell: string): GeoPoint {
  const [lat, lng] = cellToLatLng(geocell);
  return { lat, lng };
}

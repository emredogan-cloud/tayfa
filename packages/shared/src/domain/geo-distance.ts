import type { GeoPoint } from '../types/domain.js';

const EARTH_RADIUS_METERS = 6_371_008.8; // mean Earth radius (IUGG)

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Great-circle (haversine) distance in meters between two WGS84 points. Mirrors
 * PostGIS `ST_DistanceSphere`/geography distance closely enough for ranking and
 * geofence checks; the DB remains the authority for the actual queries.
 */
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** True when `point` is within `radiusMeters` of `center` (PostGIS ST_DWithin analogue). */
export function isWithin(center: GeoPoint, point: GeoPoint, radiusMeters: number): boolean {
  return haversineMeters(center, point) <= radiusMeters;
}

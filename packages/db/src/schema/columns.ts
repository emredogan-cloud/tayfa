import { customType } from 'drizzle-orm/pg-core';
import { EMBEDDING } from '@tayfa/shared/constants';

/**
 * Custom column types Drizzle doesn't ship — PostGIS geography and pgvector.
 * The authoritative DDL lives in `sql/` (it controls GiST/HNSW indexes, RLS,
 * etc.); these give the query layer correct TS types.
 */

/** `geography(Point,4326)` — precise WGS84 point. Never exposed to non-approved clients. */
export const geographyPoint = customType<{
  data: { lat: number; lng: number };
  driverData: string;
}>({
  dataType() {
    return 'geography(Point,4326)';
  },
  toDriver(value) {
    // EWKT — PostGIS parses SRID=4326;POINT(lng lat). Note lng/lat order.
    return `SRID=4326;POINT(${value.lng} ${value.lat})`;
  },
});

/** `vector(1536)` — pgvector embedding (cosine space, HNSW indexed). */
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return `vector(${EMBEDDING.dimensions})`;
  },
  toDriver(value) {
    return `[${value.join(',')}]`;
  },
  fromDriver(value) {
    return JSON.parse(value) as number[];
  },
});

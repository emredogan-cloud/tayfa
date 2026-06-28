import { createServiceClient, type Database } from '@tayfa/db';
import { env } from './env.js';
import { ApiError } from './http.js';

/**
 * Service-role DB access — SERVER-ONLY, bypasses RLS (TECH_DECISIONS ADR-005).
 * Only the BFF and the T&S console may import this. The connection is created
 * lazily and memoised across the serverless function's warm lifetime so we don't
 * open a pool per request.
 *
 * In `mock` mode without DATABASE_URL this throws a clear 503 instead of a cryptic
 * connection error — the surface still typechecks and the failure is legible.
 */
let cached: { db: Database } | null = null;

export function getServiceDb(): Database {
  if (cached) return cached.db;
  const url = env.databaseUrl();
  if (!url) {
    throw new ApiError(
      503,
      'database_unavailable',
      'DATABASE_URL is not configured (set provider mode + env to run the BFF against Postgres)',
    );
  }
  const { db } = createServiceClient(url);
  cached = { db };
  return db;
}

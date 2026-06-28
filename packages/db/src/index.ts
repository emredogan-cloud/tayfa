/**
 * @tayfa/db — the data layer. Drizzle schema (typed queries) + client factories.
 * The authoritative DDL (extensions, RLS deny-by-default + FORCE, PostGIS/pgvector
 * indexes) lives in `sql/` and is applied by `migrate.ts`. The Drizzle schema and
 * the SQL are kept in lockstep (see docs/ARCHITECTURE.md §data-layer).
 */
export * as schema from './schema/index.js';
export { createServiceClient, createRlsClient, type Database } from './client.js';
export { runMigrations } from './migrate.js';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

/**
 * Drizzle client factory. Two postures:
 *  • `createServiceClient` — service role, bypasses RLS. BFF / migrations / T&S
 *    console ONLY. Never shipped to a client (TECH_DECISIONS ADR-005).
 *  • `createRlsClient` — runs as the `authenticated` role with `request.jwt.claims`
 *    set, so deny-by-default RLS applies exactly as it would for that user. This
 *    is what the RLS policy tests exercise.
 */

export type Database = ReturnType<typeof drizzle<typeof schema>>;

export function createServiceClient(connectionString: string): {
  db: Database;
  sql: postgres.Sql;
} {
  const sql = postgres(connectionString, { max: 10, prepare: false });
  return { db: drizzle(sql, { schema }), sql };
}

/**
 * Connection that simulates an authenticated Supabase user for RLS. Every query
 * sets the role + JWT claims so `auth.uid()` resolves to `userId`.
 */
export function createRlsClient(
  connectionString: string,
  userId: string,
): { db: Database; sql: postgres.Sql } {
  const sql = postgres(connectionString, {
    max: 5,
    prepare: false,
    connection: {
      // Supabase resolves auth.uid() from request.jwt.claims.sub.
      'request.jwt.claims': JSON.stringify({ sub: userId, role: 'authenticated' }),
      role: 'authenticated',
    },
  });
  return { db: drizzle(sql, { schema }), sql };
}

export { schema };

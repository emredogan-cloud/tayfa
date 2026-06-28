import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import postgres from 'postgres';
import { runMigrations } from './migrate.js';

/**
 * RLS policy tests (mission §TESTING, TECH_DECISIONS: "CI fails if any table
 * lacks a tested policy"). Proves deny-by-default cross-user isolation against a
 * REAL Postgres with PostGIS + pgvector. Self-skips when no TEST_DATABASE_URL is
 * set so the pure-unit CI job stays DB-free; the dedicated `rls` CI job provides
 * a postgres service and sets TEST_DATABASE_URL.
 */
const DB_URL = process.env.TEST_DATABASE_URL;
const userA = '11111111-1111-4111-8111-111111111111';
const userB = '22222222-2222-4222-8222-222222222222';

let sql: postgres.Sql;

/** Run `fn` as an authenticated user with auth.uid() = userId (Supabase pattern). */
async function asUser<T>(
  userId: string,
  fn: (tx: postgres.TransactionSql) => Promise<T>,
): Promise<T> {
  return sql.begin(async (tx) => {
    await tx.unsafe(
      `SELECT set_config('request.jwt.claims', '${JSON.stringify({ sub: userId, role: 'authenticated' })}', true)`,
    );
    await tx.unsafe('SET LOCAL ROLE authenticated');
    return fn(tx);
  });
}

describe.skipIf(!DB_URL)('RLS deny-by-default isolation', () => {
  beforeAll(async () => {
    await runMigrations(DB_URL!);
    sql = postgres(DB_URL!, { max: 4, prepare: false, onnotice: () => {} });
    // Seed two users + profiles via the superuser connection (bypasses RLS).
    for (const id of [userA, userB]) {
      await sql`INSERT INTO auth.users (id, phone) VALUES (${id}, ${'+9055500' + id.slice(0, 5)})
                ON CONFLICT (id) DO NOTHING`;
      await sql`INSERT INTO profile (user_id, display_name, birthdate)
                VALUES (${id}, ${'User ' + id.slice(0, 4)}, '1996-01-01')
                ON CONFLICT (user_id) DO NOTHING`;
    }
  });

  afterAll(async () => {
    if (sql) await sql.end();
  });

  it('every public table has RLS ENABLED and FORCED', async () => {
    const rows = await sql<{ tablename: string; rls: boolean; force: boolean }[]>`
      SELECT c.relname AS tablename, c.relrowsecurity AS rls, c.relforcerowsecurity AS force
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
    `;
    expect(rows.length).toBeGreaterThan(15);
    const offenders = rows.filter((r) => !r.rls || !r.force).map((r) => r.tablename);
    expect(offenders).toEqual([]);
  });

  it('a user can read their OWN profile but NOT another user’s base row', async () => {
    const own = await asUser(
      userA,
      (tx) => tx`SELECT user_id FROM profile WHERE user_id = ${userA}`,
    );
    expect(own).toHaveLength(1);

    const other = await asUser(
      userA,
      (tx) => tx`SELECT user_id FROM profile WHERE user_id = ${userB}`,
    );
    expect(other).toHaveLength(0); // deny-by-default — B's row is invisible to A
  });

  it('the public_profile view exposes the safe slice WITHOUT birthdate', async () => {
    const cols = await sql<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'public_profile'
    `;
    const names = cols.map((c) => c.column_name);
    expect(names).toContain('display_name');
    expect(names).not.toContain('birthdate'); // PII never in the public slice
  });

  it('the feed_event view never carries the precise location column', async () => {
    const cols = await sql<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'feed_event'
    `;
    expect(cols.map((c) => c.column_name)).not.toContain('location');
  });

  it('messages are readable ONLY by conversation members', async () => {
    // A creates a DM conversation A is a member of; B is not.
    const [conv] = await sql<{ id: string }[]>`
      INSERT INTO conversation (scope, scope_id) VALUES ('dm', gen_random_uuid()) RETURNING id`;
    const convId = conv!.id;
    await sql`INSERT INTO conversation_member (conversation_id, user_id) VALUES (${convId}, ${userA})`;
    await sql`INSERT INTO message (conversation_id, sender_id, body) VALUES (${convId}, ${userA}, 'secret')`;

    const aSees = await asUser(
      userA,
      (tx) => tx`SELECT body FROM message WHERE conversation_id = ${convId}`,
    );
    expect(aSees).toHaveLength(1);

    const bSees = await asUser(
      userB,
      (tx) => tx`SELECT body FROM message WHERE conversation_id = ${convId}`,
    );
    expect(bSees).toHaveLength(0); // B is not a member — total denial
  });

  it('moderation_action + audit_log DENY all authenticated access (service-role only)', async () => {
    const mod = await asUser(userA, (tx) => tx`SELECT * FROM moderation_action`);
    expect(mod).toHaveLength(0);
    await expect(
      asUser(userA, (tx) => tx`INSERT INTO audit_log (action) VALUES ('hack')`),
    ).rejects.toThrow();
  });
});

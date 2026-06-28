import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit config. The schema here is the typed query layer; the deployment
 * DDL is the hand-authored `sql/` (it controls PostGIS/pgvector index types and
 * RLS, which the generator cannot express). Use `drizzle-kit` for introspection
 * + drift detection against the SQL, not as the migration source of truth.
 */
export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:54322/postgres',
  },
  verbose: true,
  strict: true,
});

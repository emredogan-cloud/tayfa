-- Supabase-compatibility shim for LOCAL / CI Postgres ONLY.
-- In production these objects are provided by Supabase (the `auth` schema,
-- `auth.uid()`, and the anon/authenticated/service_role roles). Creating them
-- IF NOT EXISTS makes the schema + RLS policies run identically on a plain
-- Postgres so the RLS test suite can prove deny-by-default isolation in CI.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS auth;

-- Minimal stand-in for Supabase's auth.users (FK target only).
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE,
  email text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- auth.uid() — reads the JWT `sub` claim set per-connection (Supabase semantics).
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$
    SELECT NULLIF(
      current_setting('request.jwt.claims', true)::json ->> 'sub', ''
    )::uuid
  $$;

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

# Deployment Guide

Three deploy targets, all **EU/Frankfurt-aligned** (ADR-014 — data residency is a one-way
door):

1. **Web + BFF** → Vercel (Next.js App Router, Fluid Compute, Node 24).
2. **Mobile** → EAS Build / Submit / Update (Expo).
3. **Database** → Supabase (EU) via the authoritative SQL migrations in `packages/db`.

> Status note: the spine (`packages/shared`, `packages/db`) is built and tested; the
> `apps/*` surfaces are scaffolded. The procedures below are the intended pipeline and are
> ready to drive once the app code lands. See [`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md).

---

## 1. Environments

| Environment | Web (Vercel) | Mobile (EAS channel) | Database (Supabase project) |
|---|---|---|---|
| **dev** | Preview / local | `dev` | dev project (EU) |
| **preview / staging** | Preview per PR | `preview` | staging project (EU) |
| **production** | Production | `prod` | prod project (EU) |

Each environment is a **separate Supabase project** (separate data, keys, residency
boundary) and a **separate set of secrets**. Never point preview at prod data.

---

## 2. Web + BFF on Vercel

1. **Import** the repo at <https://vercel.com> → New Project → root `apps/web`. Framework:
   Next.js. **Region: Frankfurt (`fra1`)** so the BFF sits next to Supabase EU.
2. **Build settings:** monorepo-aware. Build command `pnpm --filter @tayfa/web build`
   (Turborepo prunes the graph); install `pnpm install`; Node 24.
3. **Environment variables** (Project → Settings → Environment Variables), set per
   environment (Production / Preview / Development) — see
   [`ENVIRONMENT_SETUP.md`](./ENVIRONMENT_SETUP.md):
   - Public (client bundle): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `NEXT_PUBLIC_POSTHOG_*`, `NEXT_PUBLIC_SENTRY_DSN`.
   - Server-only (BFF): `SUPABASE_SERVICE_ROLE_KEY`, `AI_GATEWAY_API_KEY`, `OPENAI_API_KEY`,
     `INNGEST_*`, `UPSTASH_*`, `PERSONA_*`, `REVENUECAT_*`, `HIVE_API_KEY` / `AWS_*`,
     `STRIPE_*`, `SENTRY_AUTH_TOKEN`.
4. **Middleware** (`apps/web/middleware.ts`) runs auth · geo-resolve · rate-limit · BotID on
   the edge before Route Handlers.
5. **Inngest:** register the serve endpoint (`/api/inngest`) in the Inngest dashboard so
   durable functions are invoked.
6. **Deploy:** every PR gets a **Preview deployment** (its own URL + env); merging to the
   default branch triggers a **Production** deploy.

Edge caching: share/OG pages use Vercel Runtime Cache; the discovery feed is cached in
Upstash Redis (keyed by `{geocell, interest_cluster, filters}`), not at the edge.

---

## 3. Mobile on EAS (Expo)

Auth the toolchain with `EXPO_ACCESS_TOKEN` (see ENVIRONMENT_SETUP). `eas.json` defines
three build profiles bound to the three **EAS Update channels**: `dev`, `preview`, `prod`.

### Build (native binaries) — EAS Build

```bash
eas build --profile dev      --platform all   # internal dev client
eas build --profile preview  --platform all   # stakeholder/QA (internal distribution)
eas build --profile prod     --platform all   # store-ready AAB / IPA
```

CI also produces the Android artifacts the mission requires: **debug APK**, **release APK**,
and **AAB**.

### Submit (to the stores) — EAS Submit

```bash
eas submit --profile prod --platform ios       # App Store Connect
eas submit --profile prod --platform android    # Google Play (AAB)
```

### Over-the-air updates — EAS Update (ADR-013)

JS/asset hot-fixes ship **without store review**, pinned to a `runtimeVersion`:

```bash
eas update --channel preview --message "fix: feed empty-state copy"
eas update --channel prod    --message "fix: RSVP race UI" --rollout 10   # staged 10%
```

- `runtimeVersion` pins JS bundles to a compatible native binary — never push a JS update
  that needs newer native code than the installed binary has.
- **Native changes** (new permissions, SDK upgrades, new native modules) require a **store
  release**, not an OTA. OTA is for JS/asset only.

---

## 4. Database migrations (Supabase EU)

The deployment artifact is the **hand-authored SQL** in `packages/db/sql` (authoritative —
BTD-002), applied in lexical order by `runMigrations`. Every statement is idempotent.

```bash
# Against a target environment's database (use the DIRECT 5432 connection for DDL)
DATABASE_URL="postgresql://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres" \
  pnpm --filter @tayfa/db db:migrate
```

Order: `00_extensions → 05_auth_compat → 10_enums → 20_tables → 30_indexes → 40_functions →
50_rls`. On a real Supabase project the `auth` schema already exists, so `05_auth_compat`
(the local shim) is a no-op there.

**Drift detection:** `drizzle-kit` introspects the live DB and diffs it against the Drizzle
schema to catch divergence; the SQL — not the generator — remains the source of truth.

**Promotion:** apply migrations to **staging first**, run the RLS suite against it
(`TEST_DATABASE_URL=<staging> pnpm --filter @tayfa/db test:rls`), then apply to production.
Because every statement is `IF NOT EXISTS`/`OR REPLACE`, re-application is safe; additive
changes are forward-compatible with the previous app version (deploy DB before app).

---

## 5. Secrets management

| Surface | Where secrets live |
|---|---|
| Web / BFF | **Vercel Environment Variables**, scoped per environment. |
| Mobile build/OTA | **EAS Secrets** (`eas secret:create`) + `EXPO_PUBLIC_*` build-time vars. |
| CI | **GitHub Actions Secrets** (`SUPABASE_SERVICE_ROLE_KEY`, `EXPO_ACCESS_TOKEN`, `SENTRY_AUTH_TOKEN`, `TEST_DATABASE_URL`, …). |
| Local dev | `.env` (git-ignored). `TAYFA_PROVIDER_MODE=mock` means **no real keys needed**. |

Rules: `.env` is never committed (enforced by `.gitignore` + secret scanning in CI). The
`SUPABASE_SERVICE_ROLE_KEY` and all `*_SECRET`/`*_API_KEY` values are **server-only** and must
never appear in an `EXPO_PUBLIC_*`/`NEXT_PUBLIC_*` var. Rotate keys on staff offboarding or
suspected exposure; RevenueCat/Persona/Stripe webhook secrets are verified on every inbound
call (fail-closed on bad signature).

---

## 6. Staged rollout & rollback

**Web (Vercel):**
- Every deploy is immutable and addressable. Roll back by **promoting a previous production
  deployment** (Vercel dashboard → Deployments → Promote) — instant, no rebuild.
- Use **feature flags (PostHog)** to dark-launch BFF features independently of the deploy.

**Mobile (EAS Update):**
- Roll out OTA updates **staged** (`--rollout 10` → 25 → 50 → 100), watching Sentry
  crash-free rate and PostHog funnels between steps.
- **Rollback** = `eas update:republish` of the last-good update on the channel (or roll the
  rollout back to 0%). Because clients pull the newest compatible update per `runtimeVersion`,
  republishing a known-good bundle reverts users on next launch.
- A bad **native** binary requires a new store submission (slow) — which is exactly why
  OTA-able fixes are preferred for client bugs (ADR-013).

**Database:**
- Migrations are additive/idempotent and applied **before** the app version that needs them,
  so the previous app keeps working. Destructive changes are two-phase (add → backfill →
  switch reads → drop in a later release), never a single irreversible drop.

**Go/no-go gate:** a production deploy proceeds only on **green CI** (lint · typecheck · unit
· RLS · build · security) — see [`RELEASE_PROCESS.md`](./RELEASE_PROCESS.md).

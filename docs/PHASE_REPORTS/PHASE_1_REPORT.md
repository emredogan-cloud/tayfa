# Phase 1 Report — Foundation: Identity, Verified Onboarding & Platform Skeleton

> Roadmap §10, Phase 1. **Objective:** a new user can sign up (phone OTP), complete a
> verified, interest-rich profile, and land on a non-empty home screen — on a
> production-grade, observable, compliant platform skeleton.

**Status:** Spine **complete** (data foundation, contract, RLS, compliance primitives). App
surfaces (Expo onboarding wizard, web landing + KVKK/privacy/terms pages) **built and
typecheck-green** (the web `next build` also passes in mock mode), with on-device/emulator and
live-infra validation still pending — see [`../KNOWN_LIMITATIONS.md`](../KNOWN_LIMITATIONS.md).

---

## Completed work

**Monorepo + toolchain.** pnpm + Turborepo (Node 24, ESM, strict TS), ESLint flat config,
Prettier, Vitest, `tsconfig.base.json` with the full strict set (`noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `verbatimModuleSyntax`, no `any`). Commit `576a783`.

**Data foundation (`packages/db`).** Phase-1 subset of Data Model §5 implemented exactly:
`profile` (1–1 with `auth.users`, `birthdate`, `verification_level`, `safety_score`,
`reliability_score`, **`interest_embedding vector(1536)`** with `embedding_model`/`version`),
`interest_taxonomy` (+ `embedding vector(1536)`), `user_interest` (weight + source),
`device`, `verification`, `consent`, plus `city`/geocell. PostGIS + pgvector extensions
(`sql/00_extensions.sql`); 1536-d matching the embedding model (ADR-011). Commit `8edd246`.

**RLS deny-by-default.** `sql/50_rls.sql` enables **+ FORCEs** RLS on every public table,
writes per-operation policies, and exposes the location-free `feed_event` and PII-free
`public_profile` views. `auth.uid()` is the identity anchor (`sql/05_auth_compat.sql` shims
it for off-Supabase testing).

**Auth / age gate.** Phone-OTP contract (`schemas/auth.ts`: `otpRequestSchema`,
`otpVerifySchema`) and the **18+ age gate** (`ageGateSchema`, `MIN_AGE_YEARS = 18`,
`verification.ts` domain). OTP request rate-limited (`RATE_LIMITS.authOtpRequest`: 5/hr).

**Onboarding contract.** `profileSetupSchema`, `interestSelectionSchema`,
`connectAccountSchema` (Spotify/Apple Music/Letterboxd import → taxonomy);
`CONTENT_LIMITS.minInterestsToComplete = 5`. Aggregate interest embedding is computed
**async** (mock `EmbeddingProvider`, FNV-1a-seeded), never in the request path (ADR-011).

**Compliance (GDPR/KVKK before first user).** Granular `consentSchema` (location / marketing
/ connected-accounts as separate toggles) + `consent` table; `accountDeletionSchema` and the
data-export/delete contract; `DATA_RIGHTS_SLA_DAYS = 30`, `BREACH_NOTIFICATION_HOURS = 72`.
EU/Frankfurt residency (`DATA_RESIDENCY_REGION = 'eu-central-1'`, ADR-014).

**Analytics from screen #1.** Typed event taxonomy (`@tayfa/shared/events`):
`buildAnalyticsEvent`, `ANALYTICS_EVENT_NAMES` (signup/onboarding/interest events),
`NORTH_STAR_EVENT`; consent-gated.

---

## Decisions made

- **Zod v4** as the single boundary/type source (BTD-001).
- **Authoritative SQL alongside Drizzle** (BTD-002) — RLS + PostGIS/pgvector index types the
  generator can't express live in `sql/`.
- **H3 geocell in app code, res 8, stored as text** (BTD-004) — no Postgres H3 extension.
- **Enum `moderation_action_type`** to avoid the `moderation_action` table-name collision
  (BTD-005).
- **Mock provider mode** so onboarding (embeddings, verification) runs keyless (BTD-003).

---

## Tests

| Acceptance criterion (roadmap) | Satisfied by |
|---|---|
| 18+ age gate enforced | `domain/verification.test.ts` (3) + `ageGateSchema`, `MIN_AGE_YEARS` |
| ≥5 interests to complete onboarding | `CONTENT_LIMITS.minInterestsToComplete`, `interestSelectionSchema` |
| Aggregate interest embedding computed (async) | `MockEmbeddingProvider` (1536-d, seeded); never in request path |
| Consent captured granularly | `consentSchema` + `consent` table |
| Account export/delete (erasure) | `accountDeletionSchema`, `DATA_RIGHTS_SLA_DAYS` |
| **0 RLS leaks** — every table deny-by-default | `db/src/rls.test.ts` (6): RLS ENABLED+FORCED on all tables, no cross-user read |
| Typed analytics from event #1 | `events/taxonomy.test.ts` (5) |

**Totals:** 78 domain unit tests (~99% coverage), 6 RLS tests on real PostGIS + pgvector.

```bash
pnpm --filter @tayfa/shared test      # 78 pass
TEST_DATABASE_URL=… pnpm --filter @tayfa/db test   # 6 RLS pass (Docker Postgres)
```

---

## CI status

Four workflow files (`ci`, `security`, `mobile`, `pr-validation`) are **committed** in
`.github/workflows/` and **validated locally** — the lint · typecheck · unit · rls · web-build ·
coverage commands run green here. GitHub Actions has **not yet run** because the repo is not
yet pushed (push pending the user's go-ahead — see KNOWN_LIMITATIONS §4). Locally:
`pnpm typecheck`, `pnpm --filter @tayfa/shared test`, and the RLS suite pass.

## Known issues / pending

- Expo onboarding wizard, web landing + KVKK/privacy/terms pages: **built and typecheck-green**
  (web `next build` passes in mock mode); end-to-end runtime validation pending (the React
  Query hooks need a running BFF).
- On-device emulator validation of the onboarding funnel (Maestro): **pending** — no AVD in
  this environment.
- Real Supabase Auth (SMS provider) + Persona verification: **mock mode** until keys added.

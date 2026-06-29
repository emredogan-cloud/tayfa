# Known Limitations & Honest Status

This document is deliberately blunt. It states what is **actually implemented and tested**
versus what is **scaffolded / foundation only**, and lists every external dependency and
validation step still pending. No green-washing.

---

## 1. What is implemented and verified

**`packages/shared` — the domain contract (the spine).** Fully implemented, strict-typed,
and tested.
- Zod schemas for every server boundary (auth, onboarding, event, RSVP, feed, check-in,
  safety, chat, account deletion).
- Pure business logic: RSVP state machine, feed ranking, NSM confirmation, reputation,
  location privacy, entitlements, trial, referral, moderation routing, notifications.
- Typed analytics taxonomy; branded ids and exhaustive enums; `Result`/`ok`/`err`.
- Provider interfaces + deterministic, fail-closed **mock** implementations.
- **78 unit tests**, ~99% line coverage on the domain; thresholds enforced in CI
  (90% critical domain).

**`packages/db` — the data layer (the spine).** Fully implemented and tested.
- Drizzle schema (typed query layer) + authoritative hand-authored SQL (24 tables, PostGIS,
  pgvector, GiST + HNSW indexes, functions/triggers).
- RLS **deny-by-default + FORCE** on every table; `feed_event` + `public_profile` views for
  location/PII privacy; service-role vs. authenticated client factories.
- **6 RLS policy tests** against a real PostGIS + pgvector Postgres (Docker), proving
  cross-user isolation, chat-member-only reads, and mutual-block invisibility.

**Tooling.** pnpm + Turborepo monorepo, strict TS (`tsconfig.base.json`), ESLint flat
config, Prettier, Vitest, Docker Postgres recipe (`infra/Dockerfile.postgres`), `.env.example`
with `TAYFA_PROVIDER_MODE=mock` so the whole spine runs **with zero credentials**.

---

## 2. What is built and compiles vs. what is runtime-validated

- **`apps/mobile` (Expo / React Native) — BUILT, typecheck-green, NOT device-validated.**
  The Expo Router screens (auth/OTP/age-gate, onboarding taste-cards + consent + profile,
  feed/create/crews/profile tabs, event detail, group chat, safety center, paywall), the
  NativeWind design system, and the React Query/Zustand wiring are implemented and pass
  `tsc --noEmit` against the spine. They have **not** been run on a device/emulator (see §4)
  and the React Query hooks expect a running BFF — so the screens are structurally complete
  but not yet exercised end-to-end at runtime.
- **`apps/web` (Next.js App Router + BFF) — BUILT, typecheck + production build green.**
  All BFF Route Handlers, middleware (auth · geo · rate-limit · BotID hook), the moderation
  console, and the landing/OG/KVKK/legal pages are implemented; `next build` succeeds in mock
  mode (21 routes + middleware). Not yet deployed to Vercel and not exercised against a live
  Supabase/Upstash (mock providers stand in).
- **Provider adapters (Phase 4 update).** The factory is now a **per-provider hybrid**
  (`apps/web/lib/providers.ts`): each provider uses its REAL adapter when its env key is
  present, the mock otherwise; `TAYFA_PROVIDER_MODE=mock` forces all-mock (CI/keyless).
  **REAL and wired:** OpenAI embeddings (`text-embedding-3-small`), generative icebreakers
  (AI Gateway/Claude Haiku → OpenAI → template), OpenAI text moderation. Their *live* calls
  are currently gated by the **OpenAI account quota (HTTP 429)** — code is real and ready.
  **Real-when-keyed (Phase 6):** Braze lifecycle CRM (`BrazeLifecycleProvider` → real REST
  `/users/track`, EU endpoint, **fail-soft** no-op on outage). Caps are enforced by the domain
  (`decideLifecycleSend`) BEFORE enqueue, so a lifecycle send can never jump a frequency cap.
  **Real-when-keyed (Phase 7):** RevenueCat billing (`RevenueCatBillingProvider`) — webhook
  authenticated by a **constant-time** secret compare then mapped through the tested
  `revenueCatEventToStatus → reconcileEntitlement` pipeline (grace/retry keep access, refund
  revokes); `getEntitlement` reads the live subscriber over REST. **Fail-closed** (bad/missing
  signature or no-op event → no entitlement change; a read failure resolves to `free`).
  **Still mock pending keys:** Persona (ID/liveness), Hive/Rekognition (image moderation),
  Expo Push; Braze + RevenueCat are mock until their keys (`BRAZE_API_KEY` / `REVENUECAT_API_KEY`
  + `REVENUECAT_WEBHOOK_SECRET`) are set. Inngest function bodies (candidate-gen/re-embed,
  lifecycle journeys, streak rollup, trial lifecycle) are designed, not yet implemented.
  (Historical note below predates Phase 4.) The real
  Persona / RevenueCat / Hive / OpenAI / AI Gateway / Inngest / Upstash / Expo Push / Braze /
  Stripe adapters are interface-complete but not wired — they are drop-in behind the existing
  `Providers` interface (`TAYFA_PROVIDER_MODE`).
- **Inngest functions.** The event names and step semantics are designed (roadmap §4); the
  durable function bodies live with the BFF and are pending.
- **P8 scale infra is operational, not app code.** P8 ships the *pure decisions* (city
  liquidity, ghost-town guard, city-launch go/no-go, travel mode, AI cost guard, message
  archival, SLO checks — all in `domain/expansion.ts` + `domain/scale.ts`, tested). The infra
  it gates — Postgres read replicas, `message`/`event` time-partitioning DDL, the Supabase
  Realtime → **Stream** chat migration (dual-write→cutover), Cloudflare R2 + CDN media, and
  BigQuery + dbt models — plus the **100× load test, chaos drills, chat-migration integrity
  test, and DR restore** require a real staging environment and are **NOT done**. Not claimed.
- **P4–P8 (matching depth, full T&S, retention/virality, monetization, scale).**
  Domain logic + real-when-keyed adapters are implemented and tested; remaining gaps are the
  durable-workflow bodies (Inngest), unkeyed live providers, and the P8 infra/IaC above. The
  entitlement model, trial logic, referral state machine, reputation, notification policy,
  pricing, retention, monetization, and expansion/scale guards exist as tested domain
  primitives — later wiring drops in without refactor.

---

## 3. External credentials still required

The app runs in **mock mode** with none of these. Each is needed only to bring its live
surface online (see [`ENVIRONMENT_SETUP.md`](./ENVIRONMENT_SETUP.md) for exact steps):

- **Supabase** (EU/Frankfurt project) — URL, anon key, **service-role key**, `DATABASE_URL`.
  Needed for any real auth/data/realtime/storage.
- **Persona** — `PERSONA_API_KEY`, `PERSONA_WEBHOOK_SECRET`, `PERSONA_TEMPLATE_ID`. Needed for
  real ID + liveness verification (Stripe Identity is the documented fallback).
- **RevenueCat** — server + webhook secrets + per-platform public keys. Needed for real
  entitlements/subscriptions (entitlements are server-side truth).
- **Hive / AWS Rekognition** — `HIVE_API_KEY` or `AWS_*`. Needed for real image NSFW/face
  moderation.
- **Braze** — `BRAZE_API_KEY` + EU REST endpoint. Needed for P6 lifecycle journeys.
- **Stripe / Stripe Connect** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Needed for P9
  web payments / payouts.
- Plus: AI Gateway / OpenAI, Inngest, Upstash Redis, PostHog (EU), Sentry, Expo access token.

---

## 4. Build-environment constraints (this slice)

- **No Android emulator / AVD in the build environment.** The mission requires per-phase
  on-device emulator validation (onboarding, auth, profile, event create/discover, RSVP,
  chat, notifications, subscriptions, safety flows, error recovery). That validation is
  **pending** — there is no AVD/emulator available here to install an APK and run the
  journeys. The Maestro/Detox suites are defined as targets; they have not been executed on a
  device. This is an environment limitation, not a decision to skip validation.
- **Mobile EAS build needs credentials.** EAS Build/Submit/Update require an Expo account +
  `EXPO_ACCESS_TOKEN` and store credentials; no native binary (debug/release APK or AAB) has
  been produced in this environment.
- **GitHub public-repo push pending user authorization.** The mission calls for a public
  GitHub repo with protected `main` and CI. Local git history exists (clean conventional
  commits on `main`), but pushing to a public remote and enabling Actions was **blocked by the
  harness** pending the user's explicit go-ahead (publishing to a public surface from
  mission-file intent alone is gated). Intended remote: `emredogan-cloud/tayfa`. **Pending the
  user's confirmation.**
- **CI workflows committed but never executed on GitHub.** `.github/workflows/` contains four
  pipelines (ci, security, mobile, pr-validation). The `rls-tests`/`web-build`/coverage jobs
  have been validated *locally* (the same commands run green here), but Actions has not run
  because the repo is not yet pushed. The mission's "CI green is a hard gate" is therefore
  satisfied locally, not yet on GitHub.
- **Visual assets generated (14) but not yet wired into every screen.** Mission §IMAGE
  GENERATION is done: ultra-detailed prompts live in `docs/design-prompts/`, and
  `scripts/generate-assets.ts` produced a brand set (app icon, onboarding/marketing/safety
  heroes, event tiles, recap card) into `assets/generated/` via the OpenAI Images API. The app
  icon is wired into the mobile config; the remaining assets are referenced by the design specs
  but not yet imported into every screen.

---

## 5. Deliberate scope choices (correct, not gaps)

- **Single Postgres (pgvector + PostGIS), no separate vector DB** — until a measured ANN p95
  > ~150 ms trigger (ADR-003). Externalizing early would add a sync problem for zero benefit.
- **Supabase Realtime chat, not Stream** — fine for ≤6-person groups at MVP; Stream migration
  is a planned, triggered move (ADR-006). `message` partitioning is the bridge (P4).
- **No GraphQL, no Kubernetes/microservices/Kafka** — anti-overengineering (mission, ADR-005).
- **Verification deferred/tiered, not at signup** — so the biggest cost line scales with
  privileged actions, not signups (ADR-010).

---

## 6. Risks to watch (from RISK_ANALYSIS, carried forward)

- **RLS misconfig = data leak.** Mitigated by the FORCE + tested-policy CI gate; any new table
  *must* arrive with a policy test or CI fails.
- **NSM gaming (two fake accounts).** Mitigated by geofence ∩ mutual-confirm ∩ collusion-share
  cap; keep the anti-abuse signals under review as real traffic arrives.
- **Precise-location leak.** Structurally prevented (server-only point, fuzzed `feed_event`
  view, 30-min BFF-gated release) — but every new read path must use the view, never the raw
  point.
- **TR → Frankfurt latency.** Mitigated by Redis geocell feed caching; watch p75 feed latency
  against the <150 ms budget.

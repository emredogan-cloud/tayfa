<div align="center">

# Tayfa

**Friends through _doing_, not swiping.**

A verified, location-based social app that turns shared hobbies into real-life,
small-group hangouts for young people new to a city. Explicitly **not** a dating app.

[![CI](https://github.com/emredogan-cloud/tayfa/actions/workflows/ci.yml/badge.svg)](https://github.com/emredogan-cloud/tayfa/actions/workflows/ci.yml)
[![Security](https://github.com/emredogan-cloud/tayfa/actions/workflows/security.yml/badge.svg)](https://github.com/emredogan-cloud/tayfa/actions/workflows/security.yml)
[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](./LICENSE)

</div>

---

## What is Tayfa?

Tayfa (Turkish slang for _"crew / squad"_) helps 18–32-year-olds who are **new to
a city** — or just tired of being lonely in it — spin up and join spontaneous
micro-events around shared interests: _"padel tonight, need 2,"_ _"Sunday coffee
crawl, 4 going."_ Small groups kill first-meeting shyness; full verification kills
the safety anxiety; interest-matching kills the empty-feed problem.

- **North Star Metric:** Weekly Completed Meetups — events where ≥2 verified users
  were confirmed present (geofence + mutual confirmation).
- **Beachhead:** Istanbul → İzmir/Ankara → EU university cities.
- **Compliance:** GDPR + KVKK, EU/Frankfurt data residency, from day one.

The product thesis, phase plan, and deep-dives live in
[`roadmaps/`](./roadmaps/APP_EXECUTION_ROADMAP.md) and [`reports/`](./reports).
That roadmap is the canonical source of truth; this codebase implements it.

## Monorepo layout

```
tayfa/
├─ apps/
│  ├─ mobile/      Expo + React Native (primary surface) — Expo Router, NativeWind, React Query, Zustand
│  └─ web/         Next.js App Router — landing, OG share pages, KVKK/privacy, moderation console, BFF
├─ packages/
│  ├─ shared/      Cross-monorepo CONTRACT: Zod schemas, typed analytics taxonomy, domain types,
│  │              and pure business logic (RSVP state machine, feed ranking, NSM, reputation,
│  │              location privacy, entitlements). Zero I/O, 99% test coverage.
│  └─ db/          Single source of truth for data: Drizzle schema + authoritative SQL
│                 (PostGIS + pgvector, RLS deny-by-default + FORCE). EU residency.
├─ docs/           ARCHITECTURE, DECISIONS, ENVIRONMENT_SETUP, TESTING, DEPLOYMENT, phase reports
├─ roadmaps/ reports/   The product/strategy source of truth (do not contradict)
└─ .github/workflows/   CI/CD: lint · typecheck · unit · RLS · build · security
```

## Tech stack

| Layer | Choice |
|---|---|
| Mobile | Expo (React Native) + TypeScript, Expo Router, NativeWind, React Query, Zustand |
| Web / BFF | Next.js App Router on Vercel (Route Handlers, Node 24) |
| Data | Supabase (Postgres + **PostGIS** + **pgvector**), Drizzle ORM, RLS deny-by-default |
| Async | Inngest (durable workflows) + Upstash Redis (cache, rate-limits, idempotency) |
| Auth / Identity | Supabase Auth (phone OTP) + Persona (ID + liveness) |
| AI | Vercel AI Gateway + AI SDK v6 (Claude Haiku) · `text-embedding-3-small` → pgvector |
| Payments | RevenueCat (subscriptions) + Stripe (web / Connect payouts) |
| Observability | Sentry · PostHog (analytics, flags, experiments) |

Full reasoning + ADRs: [`reports/TECH_DECISIONS.md`](./reports/TECH_DECISIONS.md),
[`docs/DECISIONS.md`](./docs/DECISIONS.md).

## Safety & compliance (non-negotiable)

This is a meet-strangers-IRL app, so safety is existential, not a checkbox:

- **RLS deny-by-default + FORCE** on every table, with **100% policy-test coverage** in CI.
- **Precise location never leaves the server** for non-approved users — clients see a
  fuzzed geocell centroid; the precise pin is BFF-gated to approved members ≤30 min before start.
- **Safety is never paywalled** — block, report, verification, the safety center, and
  women-only / verified-only filters are free forever (enforced in code, with a unit test).
- **18+ age gate**, fail-closed verification/moderation on provider outage, and an NSM that
  resists two-account gaming (geofence ∩ mutual-confirm ∩ anti-collusion).

## Quick start

```bash
# 1. Prereqs: Node 24, pnpm 10, Docker (for a local Postgres with PostGIS + pgvector)
corepack enable && pnpm install

# 2. Copy the env template (the app runs fully in mock mode with no real keys)
cp .env.example .env            # TAYFA_PROVIDER_MODE=mock by default

# 3. Verify the spine
pnpm --filter @tayfa/shared test     # 78 unit tests, 99% coverage on the domain core
pnpm typecheck                       # strict TS across the workspace

# 4. (Optional) bring up a real DB and prove RLS isolation
docker build -f infra/Dockerfile.postgres -t tayfa-postgres infra
docker run -d --name tayfa-pg -e POSTGRES_PASSWORD=postgres -p 54322:5432 tayfa-postgres
export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
pnpm --filter @tayfa/db test         # migrations + RLS deny-by-default tests
```

See [`docs/ENVIRONMENT_SETUP.md`](./docs/ENVIRONMENT_SETUP.md) for every env var
(purpose, dashboard, exact steps, pricing) and [`docs/TESTING_GUIDE.md`](./docs/TESTING_GUIDE.md)
for the full test matrix.

## Status

MVP (Phases 1–3 of the roadmap) is the focus: verified onboarding → interest-ranked
discovery → the core create/RSVP/chat/meetup loop with baseline safety. Later phases
(matching, full T&S, retention/virality, monetization, scale, marketplace) are scaffolded
as drop-in foundations and tracked in [`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md).

---

<sub>© 2026 Tayfa — all rights reserved. Built EU/TR-first for GDPR + KVKK.</sub>

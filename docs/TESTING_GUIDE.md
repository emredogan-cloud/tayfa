# Testing Guide

Tayfa is a meet-strangers-IRL app, so correctness of the **domain core** and the **RLS
isolation guarantee** is existential. The test strategy is a pyramid whose two lower
layers are **already implemented and run in CI today**; the upper (component / E2E) layers
slot in with the mobile + web surfaces.

```
        ╱  E2E (Maestro / Detox / Playwright)  ╲     ← slots in with apps/* (scaffolded)
       ╱  Integration (BFF Route Handlers + DB) ╲    ← slots in with the BFF
      ╱  RLS policy tests (real Postgres, Docker) ╲  ← IMPLEMENTED — packages/db
     ╱  Vitest unit on the pure domain (zero I/O)  ╲ ← IMPLEMENTED — packages/shared (99%)
    ╱________________________________________________╲
```

---

## Layer 1 — Unit tests on the domain core (`@tayfa/shared`)

The domain is **pure** (zero I/O), so it is exhaustively unit-tested with **Vitest**. This
is the critical-domain layer the mission requires at **90%+** coverage; it currently sits at
~99% lines on the domain.

**78 tests** across 13 files (`packages/shared/src/**/*.test.ts`):

| File | Tests | What it proves |
|---|---:|---|
| `domain/rsvp-state-machine.test.ts` | 11 | Legal RSVP transitions, seat occupancy, last-seat rejection. |
| `domain/reputation.test.ts` | 10 | `computeReliabilityScore`/`computeSafetyScore`, `canHost`/`canDm` gates. |
| `domain/ranking.test.ts` | 7 | Feed ranking golden cases (interest ∩ geo ∩ recency ∩ capacity). |
| `domain/moderation.test.ts` | 7 | Severity routing, SLA deadlines, scam-language detection. |
| `domain/nsm.test.ts` | 6 | NSM geofence ∩ mutual-confirm ∩ anti-collusion (two-account gaming). |
| `domain/location-privacy.test.ts` | 6 | `canReleasePreciseLocation`, fuzzing — precise coords never leak early. |
| `domain/entitlements.test.ts` | 5 | `checkFeatureAccess`, safety features **never** paywalled. |
| `domain/trial.test.ts` | 5 | Engagement-gated trial eligibility + schedule. |
| `domain/notifications.test.ts` | 5 | Per-category + global daily notification caps. |
| `events/taxonomy.test.ts` | 5 | Typed analytics event builder + NSM event name. |
| `domain/geo-distance.test.ts` | 4 | Haversine distance correctness. |
| `domain/referral.test.ts` | 4 | Referral state transitions. |
| `domain/verification.test.ts` | 3 | Verification level step-up / fail-closed. |

**Run:**

```bash
pnpm --filter @tayfa/shared test           # all 78, headless
pnpm --filter @tayfa/shared test:watch     # watch mode
pnpm --filter @tayfa/shared test:coverage  # with v8 coverage + thresholds
```

**Coverage thresholds** are enforced in `packages/shared/vitest.config.ts` and scoped to
the critical domain (`src/domain/**`, `src/events/**`, excluding `index.ts` and tests):

```
lines 90 · functions 90 · branches 85 · statements 90
```

This is the mission's "**90%+ critical domain**" gate. The "**80% overall**" workspace gate
is enforced by the aggregate CI coverage job.

---

## Layer 2 — RLS policy tests on real Postgres (`@tayfa/db`)

The RLS guarantee (ADR-005: deny-by-default + FORCE, **no policy ⇒ no access**) cannot be
unit-tested in the abstract — it must run against a **real Postgres with PostGIS +
pgvector**. `packages/db/src/rls.test.ts` (**6 tests**) does exactly that: it runs the
authoritative `sql/` migrations, seeds two users, then asserts cross-user isolation as the
`authenticated` role with `request.jwt.claims.sub` set per user (the Supabase pattern).

What it proves:

- **Every public table has RLS `ENABLED` *and* `FORCED`** (the test fails if any table is
  missing FORCE — this is the "table without a tested policy fails CI" gate). It asserts
  `> 15` tables; the schema ships 24.
- A user cannot read another user's private rows.
- Chat is readable **only by conversation members**.
- Blocked users are mutually invisible.

The suite **self-skips** when `TEST_DATABASE_URL` is unset, so the pure-unit CI job stays
DB-free; a dedicated `rls` CI job provides a Postgres service and sets the var.

### Local Postgres recipe (`infra/Dockerfile.postgres`)

The image is PostGIS + pgvector in one (`postgis/postgis:16-3.4` + `postgresql-16-pgvector`),
mirroring the Supabase EU stack closely enough to run migrations and RLS tests:

```bash
# Build the PostGIS + pgvector image
docker build -f infra/Dockerfile.postgres -t tayfa-postgres infra

# Run it on 54322 (the repo default DATABASE_URL port)
docker run -d --name tayfa-pg -e POSTGRES_PASSWORD=postgres -p 54322:5432 tayfa-postgres

# Point the tests at it and run the RLS suite (also applies migrations first)
export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
pnpm --filter @tayfa/db test          # migrations + RLS isolation
pnpm --filter @tayfa/db test:rls      # RLS suite only

# Tear down
docker rm -f tayfa-pg
```

Migrations and seed can be run independently:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres \
  pnpm --filter @tayfa/db db:migrate   # applies sql/ in lexical order
DATABASE_URL=... pnpm --filter @tayfa/db db:seed
```

---

## Layer 3 — Integration (BFF Route Handlers + DB)

Where it slots in: with `apps/web` (the Next.js BFF). Integration tests exercise a Route
Handler end-to-end against a Dockerized Postgres + Redis + mocked providers
(`TAYFA_PROVIDER_MODE=mock`), asserting Zod validation at the boundary, transactional RSVP
capacity (the last-seat race), idempotent webhook handling, and fail-closed provider
behavior. The pure pieces these handlers call (`transitionRsvp`, `evaluateMeetupNsm`,
`checkFeatureAccess`, …) are already covered by Layer 1, so integration focuses on wiring
and I/O semantics.

---

## Layer 4 — Component & E2E

- **Component (mobile):** React Native Testing Library (+ Jest preset) for screens and
  design-system primitives; slots in with `apps/mobile`.
- **E2E (mobile):** **Maestro** for the onboarding funnel and the core loop flows
  (signup → onboarding → verification → create → join → chat → meetup confirm → rating →
  subscription → moderation), and **Detox** for native-integration regression. Run on a
  local Android emulator / iOS simulator and in CI on a device farm.
- **E2E (web):** **Playwright** for the landing/OG pages and the moderation console.

These layers are **scaffolded targets**, not yet implemented — see
[`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md). The critical E2E suite enumerated in the
mission maps 1:1 to the loop above.

---

## Running everything

```bash
corepack enable && pnpm install        # Node 24, pnpm 10
pnpm typecheck                         # strict TS across the workspace (turbo)
pnpm lint                              # eslint
pnpm test                              # turbo run test across packages
pnpm test:coverage                     # coverage with thresholds
```

In CI the jobs are: **lint → typecheck → unit (DB-free) → rls (Postgres service) → build →
security**. **CI green is a hard gate** (mission) — no merge while red. Coverage thresholds:
**80% overall**, **90% critical domain**.

## Conventions

- **Vitest** with `globals: true`, `environment: 'node'`. Test files are `*.test.ts`
  colocated next to the unit under test.
- Tests are **deterministic** — the domain is pure and mock providers are seeded (FNV-1a +
  mulberry32), so there are no flaky time/network dependencies in Layers 1–2.
- **Never** stub a safety control as "passing." Fail-closed paths are tested explicitly
  (e.g. a malformed verification webhook must resolve to deny).

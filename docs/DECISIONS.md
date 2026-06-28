# Architecture Decision Records (ADR Log)

This is the **compact** ADR log. Each ADR-001..014 mirrors the full reasoning,
alternatives, and reversibility analysis in [`reports/TECH_DECISIONS.md`](../reports/TECH_DECISIONS.md)
(the mandatory architecture document — do not contradict it). Below the platform ADRs are
the **build-time decisions actually made in this repo** (BTD-001..005).

**Reversibility legend:** _two-way_ = cheap to reverse · _sticky_ = reversible at cost ·
_one-way door_ = effectively irreversible.

---

## Platform ADRs (mirror of TECH_DECISIONS)

### ADR-001 — Mobile = Expo / React Native + TypeScript
One codebase for iOS + Android, huge TS hiring pool, OTA hot-fixes via EAS Update
(ADR-013), shared types with web. _Reversibility: two-way (per-module)._ Trigger to
revisit: native-perf ceiling hit on a core screen.

### ADR-002 — Supabase as BaaS
Managed Postgres + Auth (GoTrue phone OTP + Apple/Google) + Realtime + Storage + Edge
Functions, with **RLS as the authorization substrate**, EU/Frankfurt region. Velocity over
plumbing; the product is the differentiator. Complex business logic is pushed to the
Next.js/Vercel BFF, *not* Edge Functions. _Reversibility: two-way on DB, sticky on the
GoTrue/Realtime/Storage glue._ Trigger: business logic outgrows RLS/Edge perf.

### ADR-003 — Single database: Postgres + PostGIS + pgvector
One engine for OLTP + geo + vector ANN. No separate search/vector store for MVP — matching
stays a single cheap query. _Reversibility: two-way (additive)._ Trigger: pgvector ANN p95
> ~150 ms at target recall at city scale → candidate generation moves to Qdrant; geo/
relational/reputation re-rank stays in Postgres.

### ADR-004 — Drizzle ORM
SQL-first TypeScript ORM that fits PostGIS/pgvector and a client-direct-RLS design better
than a heavy/GraphQL-first layer. _Reversibility: two-way._ Trigger: migration ergonomics
break down. (See BTD-002 for how this repo splits Drizzle vs. authoritative SQL.)

### ADR-005 — Client-direct-RLS + thin BFF
The defining decision. Mobile reads/writes **client-direct to Postgres** for the safe 80%
(RLS-scoped), and routes the sharp 20% (matching, payments, moderation, precise location)
through a **thin BFF running as the service role**. RLS is **deny-by-default + FORCE**;
**no policy ⇒ no access**; CI fails if any table lacks a tested policy. Guarantees data
isolation even with a stolen JWT. _Reversibility: sticky (security posture)._ Trigger: RLS
policy sprawl / audit burden.

### ADR-006 — Chat: Supabase Realtime now → Stream at scale
Realtime is in-stack, cheap, and fine for ≤6-person groups (MVP). `message` is the
write-hot table; the plan is monthly range partitioning (P4) as a bridge, then a dual-write
→ verify → cutover migration to Stream. _Reversibility: costly two-way (planned migration)._
Trigger: chat = top-2 retention surface AND concurrency/volume nears Realtime's ceiling.

### ADR-007 — Inngest for durable async workflows
Durable, observable, retryable steps own every multi-step/time-delayed flow (matching,
notifications, lifecycle, post-meetup, billing webhooks). No cron-soup. _Reversibility:
two-way._ Trigger: workflow volume/cost or self-host/residency need → Temporal or Vercel
Workflow, keeping event names + step semantics.

### ADR-008 — PostHog for analytics, flags & experiments
One tool for product analytics + feature flags + experiments + replay, EU cloud. The
**typed event schema is the durable asset** (`@tayfa/shared/events`). _Reversibility:
two-way (schema travels)._ Trigger: event-volume cost or advanced-stats ceiling.

### ADR-009 — RevenueCat over raw IAP + Stripe
RevenueCat is the **entitlement source of truth**, abstracting App Store / Play billing;
Stripe handles web payments + Connect payouts (P9). Entitlements are server-side truth;
webhooks idempotent; never trust a client flag. _Reversibility: two-way._ Trigger: fee at
scale vs. native-billing effort.

### ADR-010 — Persona for ID + liveness
Configurable verification flows, broad document/region coverage incl. TR, decisioning
engine for tiered badges. **Stripe Identity is the documented fallback.** Verification is
deferred/tiered so the biggest cost line scales with privileged actions, not signups.
_Reversibility: sticky (re-verify on switch)._ Trigger: cost-per-verify, coverage, or TR
pass-rate.

### ADR-011 — AI: Gateway + Claude Haiku + pgvector embeddings
Generative (icebreakers, onboarding extraction) defaults to **Claude Haiku via the Vercel
AI Gateway**, Sonnet as an escalation lever — never in a hot path, always cached/batched/
deferred, **fail-open to a template**. Embeddings: `text-embedding-3-small` (1536-d,
L2-normalized, cosine via `<=>`) → pgvector HNSW. Each vector stores `embedding_model` +
`embedding_version` so a model change is a versioned re-embed + index rebuild, not a silent
overwrite. _Reversibility: very two-way (model), sticky (embedding dimension)._

### ADR-012 — Phone-OTP-first auth
Phone numbers fit the 18–32 mobile-first demographic and double as a trust + ban-evasion
signal. Verification is stepped up later (ADR-010). Vercel WAF + BotID + Redis rate-limits
defend the OTP endpoint against toll fraud. _Reversibility: mostly reversible (identity
anchor sticky)._ Trigger: OTP fraud/SMS cost or email market signal.

### ADR-013 — EAS Update OTA strategy
Ship JS/asset hot-fixes without store review via EAS Update, with `runtimeVersion` pinning,
staged rollout, and rollback. Store review reserved for **native** changes only.
_Reversibility: two-way._ Trigger: store-policy change / OTA reliability incident.

### ADR-014 — EU/Frankfurt region for the TR market
System-of-record in EU/Frankfurt for GDPR + KVKK from day one. **One-way door** — a future
TR-region migration would be painful. Mitigation for TR→Frankfurt latency: batch/cache the
client-direct reads (Redis geocell feed cache). Trigger: TR data-localization law or a
Vercel+Supabase TR region.

---

## Build-time decisions made in THIS repo (BTD)

These were decided while implementing the spine; they refine, not contradict, the ADRs.

### BTD-001 — Zod **v4** at every server boundary
`@tayfa/shared` depends on `zod@^4`. All server-boundary inputs, webhook payloads, and
parsed AI outputs validate against Zod schemas (`schemas/`). `z.infer` types are the single
type source shared across mobile, web, and db, so a schema change ripples through the type
system at compile time. _Why v4:_ smaller bundle and faster parse for the mobile client,
current API surface. Refines ADR-005 (Zod where the BFF is in the path; Postgres
constraints where client-direct writes bypass Zod).

### BTD-002 — Hand-authored SQL as the authoritative DDL, **alongside** Drizzle
Drizzle (`src/schema/*.ts`) is the **typed query layer**; the hand-authored `sql/` files are
the **deployment source of truth**. The generator cannot express PostGIS/pgvector index
types (GiST, HNSW), RLS policies, or the `feed_event`/`public_profile` views, and these are
exactly the security- and performance-critical surface. `runMigrations` applies `sql/` in
lexical order (`00_extensions → 05_auth_compat → 10_enums → 20_tables → 30_indexes →
40_functions → 50_rls`), every statement idempotent. `drizzle-kit` is used for **drift
detection** against the SQL, not as the migration engine. Refines ADR-004.

### BTD-003 — Mock provider mode (`TAYFA_PROVIDER_MODE=mock`)
Every external dependency sits behind a TS interface with a deterministic mock
(`createMockProviders()`) that honors the production contract — same shapes, **fail-closed**
semantics, seeded pseudo-randomness. `TAYFA_PROVIDER_MODE=mock` forces mock mode for CI and
keyless local dev; otherwise the BFF selects a real adapter per-provider when its key is
present, falling back to the mock when absent. This is the concrete implementation of the
mission AUTONOMY rule ("continue despite missing credentials").

### BTD-004 — H3 geocell computed in **app code**, stored as text
Geocells use `h3-js` at **resolution 8** (neighborhood granularity), computed in
application code and stored as a text column — avoiding a Postgres H3 extension dependency
while keeping Supabase portability. Precise coordinates stay in `geography(Point,4326)`;
the geocell is what the location-free `feed_event` view exposes. Implements the
location-privacy guarantee of ADR-005/RISK_ANALYSIS structurally.

### BTD-005 — Postgres enum renamed `moderation_action_type`
The moderation-action enum is named **`moderation_action_type`** in Postgres
(`schema/enums.ts`: `pgEnum('moderation_action_type', MODERATION_ACTIONS)`) rather than
`moderation_action`, because `moderation_action` is already the **table** name (the
report→action ledger). Renaming the enum avoids a type/table name collision in the same
schema while keeping the TS union (`ModerationAction`) and Zod schema unchanged.

---

## Decisions deliberately **rejected** (anti-overengineering)

- **Separate vector DB (Pinecone/Qdrant) from day one** — rejected; pgvector keeps matching
  single-query and cheap until a measured latency trigger (ADR-003).
- **GraphQL gateway** — rejected; REST-ish Route Handlers + client-direct reads are simpler
  for mobile-first (ADR-005).
- **Kubernetes / microservices / Kafka** — explicitly out of scope (mission §REQUIRED STACK).
- **Store-only releases (no OTA)** — rejected; loses the daily-ship/hot-fix advantage
  (ADR-013).

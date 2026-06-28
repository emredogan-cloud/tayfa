# TECHNICAL DECISIONS — Tayfa (working codename)

> **Document class:** ADR-style deep-dive / Technical Decisions Record.
> **Companion to:** `roadmaps/APP_EXECUTION_ROADMAP.md` (the source of truth for stack, phases, North Star, market). This report **expands** the roadmap and must never contradict it.
> **Product (canonical):** Tayfa — a verified, location-based social app for real-life **small-group** hangouts among young people (18–32), interest/hobby matched, explicitly **not** a dating app. Beachhead Istanbul → TR + EU. Compliance GDPR + KVKK, EU/Frankfurt data residency. **North Star = Weekly Completed Meetups** (distinct events where ≥2 verified users were confirmed present via geofence + mutual confirmation).
> **Audience:** the engineers who will build this. Written to be trusted, not to sell. Every choice carries honest failure modes and a documented revisit-trigger.
> **Generated:** 2026-06-26 · TECH_DECISIONS version 1.0

---

## Table of Contents

1. [Architecture Principles](#1-architecture-principles)
2. [ADR Catalog](#2-adr-catalog) — 14 numbered records
3. [Data Architecture Deep-Dive](#3-data-architecture-deep-dive)
4. [Scalability & Evolution Path](#4-scalability--evolution-path)
5. [AI Engineering Architecture](#5-ai-engineering-architecture)
6. [Security & Privacy Architecture](#6-security--privacy-architecture)
7. [DevEx, Repo & CI/CD](#7-devex-repo--cicd)
8. [Build vs Buy Summary](#8-build-vs-buy-summary)

---

## 1. Architecture Principles

These are the rules every ADR below is measured against. When two principles conflict, the earlier one wins.

### P1 — Simplicity → Maintainability → Scalability → Advanced features (in that order)
This is the roadmap's stated priority order, and it is a *lexical* ordering, not a weighted average. We do not trade simplicity for a scalability win we don't yet need. A two-engineer team plus AI coding agents cannot carry accidental complexity; every moving part must earn its operational cost. The MVP (Phases 1–3) is the entire core loop — verified profile → matched discovery → event → chat → confirmed meetup → rating — on a stack a small team can hold in their heads.

### P2 — Boring where possible, sharp where it must be
Postgres, TypeScript, React Native, HTTP, JWTs — proven, hireable, well-documented. We spend our *novelty budget* only on the things that are genuinely our product: the **interest graph**, the **meetup loop**, and the **trust/reputation system**. Everything else is deliberately unremarkable.

### P3 — Buy commodity, build the moat
Auth, chat infrastructure, billing, liveness/ID verification, content moderation, push, analytics — these are solved problems sold by specialists who do them better and cheaper than we can. We **buy** them. We **build** the interest-matching core, the meetup loop, the trust/reputation system, and the Trust & Safety tooling, because that is the differentiated IP no vendor sells. (Full split in §8.)

### P4 — Earn complexity only on a metric trigger
We do not pre-build for a scale we have not reached. Read replicas, table partitioning, a dedicated vector store, chat-on-Stream, media-on-R2, a learned ranker, city-sharding — each is **designed for but not built**, gated behind a specific, written metric threshold (§4). "We might need it later" is not a trigger; a p99 latency or a cost-per-MAU crossing is.

### P5 — Mobile-first, thin everywhere else
The phone is the product. The web surface (Next.js on Vercel) is deliberately thin: landing/SEO, OG share pages for the viral loop, and the internal moderation/admin console. The backend is thin: clients talk **directly to Postgres through Row-Level Security** for the safe ~80% of operations, and route only the privileged ~20% (matching orchestration, payments, moderation, anything that must not be client-trusted) through a BFF. Less server = less latency, less to operate, less to break.

### P6 — Safety and privacy by design, not as a feature flag
This is a *meet-strangers-in-real-life* app. A safety failure is existential, not a bug. Therefore: RLS is **deny-by-default**; location is **fuzzed** until trust is established; verification is a **step-up** gate on privileged actions; moderation and verification **fail closed** (deny the privilege) when a provider is down. Safety features are **never** behind a paywall.

### P7 — EU data residency is a first-class constraint
GDPR + KVKK are not a compliance afterthought bolted on before launch — they shape the topology. The system-of-record lives in the EU (Supabase Frankfurt). Consent is granular and captured before the first user. Data-subject rights (export, delete, rectify) ship in Phase 1. We collect the minimum we use and retain verification PII for the shortest defensible window.

### P8 — Reversibility is a design input
For each major decision we ask: *is this a one-way door or a two-way door?* (Amazon's framing.) Two-way doors we make fast and revisit cheaply. One-way doors — data residency, the identity anchor, the client-direct-RLS security posture, the event schema — we deliberate hard now, while the cost of being wrong is near zero, because retrofitting them after we hold real user PII is brutal.

---

## 2. ADR Catalog

Each record: **Context · Decision · Alternatives Considered (with why-rejected) · Consequences (good & bad) · Reversibility · Revisit-trigger.**

| # | Decision | Door | Headline revisit-trigger |
|---|---|---|---|
| [ADR-001](#adr-001--cross-platform-mobile--expo--react-native) | Mobile = Expo / React Native + TS | Two-way (per-module) | Native perf ceiling hit on a core screen |
| [ADR-002](#adr-002--supabase-as-baas) | Supabase as BaaS | Two-way on DB, sticky on glue | Business logic outgrows Edge Functions / RLS perf |
| [ADR-003](#adr-003--single-database-postgres--postgis--pgvector) | Single Postgres + PostGIS + pgvector | Two-way (additive) | pgvector ANN p95 > budget at city scale |
| [ADR-004](#adr-004--drizzle-orm) | Drizzle ORM | Two-way | Team friction / migration ergonomics break down |
| [ADR-005](#adr-005--client-direct-rls--thin-bff) | Client-direct-RLS + thin BFF | Sticky (security posture) | RLS policy sprawl / audit burden crosses a line |
| [ADR-006](#adr-006--chat-supabase-realtime-now-stream-at-scale) | Chat: Supabase Realtime → Stream | Costly two-way (planned migration) | Chat = top retention surface + concurrency ceiling |
| [ADR-007](#adr-007--inngest-for-durable-async-workflows) | Inngest for async/workflows | Two-way | Workflow volume/cost or self-host need |
| [ADR-008](#adr-008--posthog-for-analytics-flags--experiments) | PostHog (analytics+flags+experiments) | Two-way (schema is the asset) | Event volume cost / advanced-stats ceiling |
| [ADR-009](#adr-009--revenuecat-over-iap--stripe) | RevenueCat over IAP + Stripe | Two-way | Fee at scale vs. native-billing effort |
| [ADR-010](#adr-010--persona-for-id--liveness) | Persona for ID + liveness | Sticky (re-verify on switch) | Cost-per-verify, coverage, or pass-rate in TR |
| [ADR-011](#adr-011--ai-gateway--claude-haiku--pgvector-embeddings) | AI: Gateway + Claude Haiku + pgvector | Very two-way (model), sticky (embedding dim) | Generative quality, embedding recall, or cost |
| [ADR-012](#adr-012--phone-otp-first-auth) | Phone-OTP-first auth | Mostly reversible (identity anchor sticky) | OTP fraud/SMS cost, or market signal for email |
| [ADR-013](#adr-013--eas-update-ota-strategy) | EAS Update OTA strategy | Two-way | Store-policy change / OTA reliability incident |
| [ADR-014](#adr-014--eufrankfurt-region-for-the-tr-market) | EU/Frankfurt region for TR market | **One-way door** | TR data-localization law / a Vercel+Supabase TR region |

---

### ADR-001 — Cross-platform mobile = Expo / React Native

**Context.** Mobile is the product (P5). We need iOS + Android at parity, a fast iteration loop (the roadmap wants daily shipping and OTA hot-fixes), native push/location/camera, and a hiring pool a startup can actually recruit from. The team is two mobile engineers plus AI coding agents.

**Decision.** **Expo (managed workflow) + React Native + TypeScript**, with **Expo Router** (file-based navigation), **NativeWind** (Tailwind-for-RN styling), **React Query** (server-state/caching) and **Zustand** (light client state). Ship via **EAS Build/Submit/Update**.

**Alternatives considered.**
- **Native iOS (Swift) + native Android (Kotlin).** Best performance and platform fidelity, full access to every native API. Rejected for MVP: two codebases, two skill sets, ~2× the build effort, no OTA — every fix waits on store review. A small team cannot afford the duplication, and our screens (feeds, chat, maps, forms) are not performance-bound in a way that needs native.
- **Flutter (Dart).** Excellent rendering performance and a single codebase. Rejected: Dart is a smaller hiring pool than TypeScript, and — decisively — it does not share a language or types with our Next.js web app and `packages/shared` Zod schemas. RN/Expo lets one TypeScript monorepo span mobile + web + shared domain types, which compounds team velocity (P1/P2).
- **PWA / responsive web only.** Cheapest, instantly updatable. Rejected: iOS web push and background geolocation are second-class; camera/liveness flows are clunky; no App Store presence (a trust signal for a safety-first product); and the discovery surface needs native maps and smooth lists. A meet-IRL app that can't reliably do location and push is crippled.

**Consequences.**
- *Good:* one codebase, huge TS hiring pool, OTA via EAS Update (ship JS/asset fixes without store review — see ADR-013), shared types with web, mature ecosystem for push/location/camera via config plugins.
- *Bad:* a performance ceiling below pure-native for graphics-heavy or sub-frame interactions; heavy native modules (advanced AR, deep BLE) require config plugins or a custom dev client; we inherit the RN upgrade treadmill and occasional native-build flakiness; some third-party SDKs ship native code that needs a rebuild (not OTA-able).

**Reversibility.** **Two-way door, per module.** Expo's config-plugin + dev-client model means we can drop to native for a specific screen or module if profiling demands it, without rewriting the app. A *full* migration to native or Flutter is effectively one-way at scale, but we would only face that after a clear, measured performance failure.

**Revisit-trigger.** A core screen (feed scroll, map, chat) misses its frame budget on mid-tier Android after profiling and optimization, **or** a strategic native capability (e.g., advanced camera/AR for verification) cannot be reached through a config plugin. Then: eject that module to native, not the app.

---

### ADR-002 — Supabase as BaaS

**Context.** We need Auth, a relational DB, realtime, object storage, and a security model — fast, with minimal ops, in the EU. The differentiator is the *product* (matching, the loop, trust), not the plumbing (P3). We want Postgres specifically, for PostGIS + pgvector (ADR-003).

**Decision.** **Supabase** as the managed backend: Postgres (with PostGIS + pgvector), **Auth** (GoTrue: phone OTP + Apple/Google), **Realtime**, **Storage**, **Edge Functions**, and **Row-Level Security** as the authorization substrate. EU region (Frankfurt — ADR-014).

**Alternatives considered.**
- **Firebase / Firestore.** Superb realtime and mobile DX. Rejected hard: Firestore is a document store with weak relational/geo/vector support — our entire moat is *relational + geospatial + semantic* matching, which is exactly Postgres's home turf. Firestore security rules are less expressive than SQL RLS, GDPR/KVKK residency is harder to pin to the EU, and we'd fight the data model forever.
- **Roll-your-own Node + Postgres (e.g., Fastify/NestJS + RDS).** Maximum control. Rejected for MVP: we'd hand-build auth, realtime, storage, and an RLS-equivalent — months of undifferentiated work (violates P1/P3). Supabase *is* Postgres underneath, so we keep the option to extract later (see Reversibility).
- **Nhost / Appwrite.** Nhost (Postgres + Hasura/GraphQL) and Appwrite (open-source BaaS) are credible. Rejected: smaller ecosystems and operator communities, and Nhost's GraphQL-first posture conflicts with our SQL-first, client-direct-RLS design (ADR-005). Supabase has the largest community, the clearest EU-region story, and first-class pgvector/PostGIS.

**Consequences.**
- *Good:* collapses auth+DB+realtime+storage+row-security into one managed stack → maximum MVP velocity, minimum ops (P1). The DB is **standard Postgres** — no proprietary query language, fully portable.
- *Bad:* **vendor coupling** on the glue (Auth/GoTrue, Realtime, Storage APIs, the `auth.uid()` RLS convention); complex business logic outgrows Deno Edge Functions (we deliberately push that to the Next.js/Vercel BFF instead — ADR-005); serverless clients can stress connection pooling (mitigate with Supavisor/PgBouncer transaction pooling); RLS has real performance characteristics that must be engineered (§3, §6).

**Reversibility.** **Two-way door on the database, sticky on the platform glue.** The Postgres data is a `pg_dump`/logical-replication away from any Postgres host, so the *system-of-record* is portable. What's sticky is Auth (re-issuing identities), Realtime channels, and the RLS-as-authz convention — migrating those touches every client. We treat "leave Supabase entirely" as a real but expensive option, and "extract a hot path to a dedicated Node service while Supabase stays system-of-record" as the cheap, expected evolution.

**Revisit-trigger.** Business logic that genuinely belongs server-side keeps growing in Edge Functions/BFF beyond what's maintainable, **or** RLS policy evaluation becomes a measured bottleneck we can't index away, **or** Supabase platform limits (connections, Realtime concurrency, Storage egress) start dictating product decisions. Response: extract specific hot paths to dedicated services; Supabase remains system-of-record.

---

### ADR-003 — Single database: Postgres + PostGIS + pgvector

**Context.** Discovery is the intersection of three queries: *near me* (geo), *like my taste* (semantic similarity), and *happening soon / has capacity* (relational). The roadmap's matching moat lives here. We must avoid premature data-store sprawl (P1/P4).

**Decision.** **One PostgreSQL database** with **PostGIS** for geospatial (`geography(Point,4326)`, `ST_DWithin`, GiST indexes) and **pgvector** for interest embeddings (`vector(1536)`, ANN via HNSW). Geo ∩ vector ∩ relational ranking runs in a **single SQL query**, no external search/vector tier.

**Alternatives considered.**
- **Dedicated vector DB (Pinecone, Qdrant, Weaviate).** Purpose-built ANN, great at billions of vectors. Rejected for MVP: introduces a second store to operate, sync, and pay for; forces a network hop and a *join across systems* (you'd fetch candidate IDs from the vector DB, then re-query Postgres for geo+relational filters — two round-trips and a consistency problem). At our scale (one city → a few cities), pgvector in-DB is faster end-to-end because the geo/relational filters and the vector search happen in one planner. We keep Qdrant as the documented escape hatch (§4).
- **Elasticsearch / OpenSearch for geo + search.** Strong geo and text search, vector support exists. Rejected: another cluster to run, a denormalized index to keep in sync with Postgres, and weaker transactional guarantees for the RSVP/capacity logic that *must* be correct. We are not a full-text-search product; we are a structured-matching product.
- **Postgres now, externalize later.** This *is* the decision — single DB now, with a written trigger to externalize the vector store only if pgvector latency degrades.

**Consequences.**
- *Good:* one store to operate, back up, and reason about; matching is a single, explainable, testable SQL query (the roadmap's "ranking as a pure function"); no cross-store consistency; cheapest possible matching ("the moat is cheap"). Adding a separate store later is **additive**, not a rewrite.
- *Bad:* single-DB CPU contention between OLTP (reads/writes) and ANN search at high scale; HNSW index build is memory-hungry and slow to rebuild; recall must be tuned (`ef_search`); a change of embedding dimension forces an index rebuild and full re-embed (see ADR-011); pgvector's practical ceiling is lower than a dedicated engine's.

**Reversibility.** **Two-way door (additive).** Externalizing vectors to Qdrant later is a candidate-generation swap behind the ranking function, not a schema rewrite — Postgres keeps geo + relational + system-of-record. Low regret.

**Revisit-trigger.** pgvector ANN query **p95 > ~150 ms at target recall** under city-scale load *after* HNSW tuning and caching (§4), or index build/maintenance starts blocking writes. Then: move candidate generation to a dedicated vector store; keep the final geo/relational/reputation re-rank in Postgres.

---

### ADR-004 — Drizzle ORM

**Context.** We are SQL-first by necessity: PostGIS spatial operators and pgvector ANN operators (`<=>`, `ST_DWithin`) are not things you want an ORM to hide. We also want type-safe schema, painless migrations, and a tiny runtime for serverless cold-starts.

**Decision.** **Drizzle ORM** as the schema definition + query builder + migration tool, with **raw SQL as a first-class escape hatch** for spatial/vector queries.

**Alternatives considered.**
- **Prisma.** Best-in-class DX and ergonomics. Rejected: historically heavier runtime/engine (cold-start cost on serverless), and a more opinionated query layer that fights raw PostGIS/pgvector SQL — exactly the queries that matter most to us. Prisma's geo/vector support means dropping to `$queryRaw` for the important paths anyway, at which point Drizzle's thinner, SQL-shaped model wins.
- **Raw SQL only (pg / postgres.js) or Kysely.** Maximum control; Kysely is a superb typed query builder. Rejected as the *primary* tool: we'd hand-roll migrations and lose the single-source schema-as-TypeScript that drives `packages/db`. We get most of Kysely's type-safety from Drizzle while also getting migrations. (Kysely-style raw building remains available via Drizzle's `sql` template for the hairy queries.)

**Consequences.**
- *Good:* TypeScript-native schema in `packages/db`, SQL-first querying that doesn't obscure PostGIS/pgvector, tiny runtime (serverless-friendly), straightforward migrations, raw-SQL escape hatch always present.
- *Bad:* less "magic" than Prisma (more explicit code), a smaller ecosystem and fewer Stack Overflow answers, and spatial/vector columns still need hand-written SQL and custom column types — Drizzle types them as opaque unless we wrap them.

**Reversibility.** **Two-way door.** The schema and migrations are ultimately SQL; the queries are mostly SQL. Swapping ORMs is annoying but not architectural — the database doesn't care which TypeScript library issued the query.

**Revisit-trigger.** Team velocity suffers from Drizzle's verbosity or migration ergonomics in a way that's measured (e.g., repeated migration incidents), or a Drizzle limitation blocks a needed pattern. Low likelihood given the SQL-first escape hatch.

---

### ADR-005 — Client-direct-RLS + thin BFF

**Context.** P5 says thin server. Most operations are user-owned reads/writes ("my profile," "events near me," "my chats") that RLS can secure perfectly. A minority are privileged or cross-cutting (matching orchestration, payments, moderation actions, anything that must not trust the client) and need a server.

**Decision.** **Clients talk directly to Postgres via Supabase, secured by deny-by-default RLS, for the safe ~80%.** The privileged ~20% goes through a **thin BFF** — Next.js Route Handlers / Vercel Functions (Fluid Compute, Node 24) — using the service role. The split is **explicit and documented**: a written rule for what is client-direct vs. BFF, so there's no ambiguity about where logic lives.

**Alternatives considered.**
- **Full backend API (every call through a server tier).** The traditional, easy-to-audit model. Rejected for MVP: doubles the surface to build and operate, adds a latency hop to every read, and reimplements authorization that RLS already enforces — undifferentiated work that violates P1/P5. We *selectively* adopt it for the 20% that needs it.
- **GraphQL gateway (Apollo / Hasura / PostGraphile).** One flexible endpoint, great client ergonomics. Rejected: adds a schema/resolver layer and a whole operational concern; over-fetching/n+1 and query-cost control become new problems; and it competes with, rather than complements, RLS. For a mobile-first app, REST-ish Route Handlers + direct Supabase reads are simpler (P1/P2).

**Consequences.**
- *Good:* low latency (reads skip the server), a thin/cheap server tier (Vercel Active-CPU billing stays low), RLS guarantees a user can't read another user's private data **even with a leaked token**, and the team builds only the privileged logic.
- *Bad — and these are real:* **every table needs correct policies; one missing policy is a data leak** (hence exhaustive RLS policy tests in CI — §7). Client-direct **writes bypass application-layer validation** unless enforced by Postgres `CHECK`/constraints/triggers — Zod-at-the-boundary only protects the BFF path, so invariants that *must* hold on client-direct writes have to live in the database. Cross-cutting concerns (rate-limit, idempotency, complex validation) can't sit on client-direct paths — anything needing them must be promoted to the BFF. The 80/20 line requires *discipline*; drift toward "just let the client do it" is the failure mode.

**Reversibility.** **Sticky — this is a security-posture commitment.** It's reversible *incrementally* (move any endpoint behind the BFF without a big-bang rewrite), but RLS-as-primary-authz shapes the data model (every row user-attributable) and the client code. Unwinding it entirely (going full-API) touches every call site. This is the second-hardest-to-reverse decision after data residency.

**Revisit-trigger.** RLS policy count/complexity crosses the team's audit threshold (we can no longer confidently prove "no cross-user read"), **or** we repeatedly need cross-cutting logic on paths that are client-direct, **or** an RLS performance problem can't be indexed away. Response: promote those domains behind the BFF; keep RLS as defense-in-depth.

---

### ADR-006 — Chat: Supabase Realtime now, Stream at scale

**Context.** Group chat is the pre-meetup coordination surface (kills shyness, lifts attendance) and a major retention surface once crews form. MVP groups are small (2–6). Rich chat at volume (reactions, threads, read receipts, media, moderation, search, offline sync) is a specialist problem.

**Decision.** **Supabase Realtime for MVP chat** (in-stack: Postgres-backed messages + Realtime broadcast/presence for live updates and RSVP/typing), with a **planned migration to Stream Chat** when chat becomes a core retention surface at scale.

**Alternatives considered.**
- **Stream Chat from day one.** Purpose-built, scales, ships moderation/threads/reactions/read-receipts out of the box. Rejected *for MVP*: it's spend and an integration before we've proven the loop, and it pulls chat data into a third party we'd rather not couple to until chat is proven core (P3/P4). We adopt it exactly when the trigger fires.
- **Custom WebSockets (self-hosted: ws / Socket.IO / a Go service).** Full control. Rejected: standing infrastructure, presence/fan-out, reconnection, scaling, and moderation all become our problem — the opposite of P3. We are not in the chat-infra business.
- **Ably / PubNub.** Excellent managed realtime transport. Rejected: they're transport, not *chat* — we'd still build message model, moderation, threads, read-state on top. Supabase Realtime already gives us transport in-stack for free at MVP; Stream gives us the full chat product at scale. The middle ground buys little.

**Consequences.**
- *Good:* zero new vendor and zero cost for MVP chat; messages live in Postgres under the same RLS model (conversation members only); presence/typing via Realtime; one less thing to operate while we prove the loop.
- *Bad:* Supabase Realtime is **not a chat product** — no built-in threads/reactions/read-receipts at scale, no managed moderation, no media pipeline, no offline sync, and the write-hot `message` table becomes a scaling concern (partitioning — §3/§4). We are explicitly accruing a *planned* migration.

**Reversibility.** **Costly two-way door — a planned, high-risk migration, not a swap.** The cutover (dual-write → verify → cutover with rollback) is one of the roadmap's named execution bottlenecks (Phase 8). We design the `conversation`/`message` model behind an interface so the app code doesn't hard-couple to Supabase Realtime, which lowers (not eliminates) the migration cost.

**Revisit-trigger.** Chat becomes a **top-2 retention surface** *and* concurrent connections / message volume approach Supabase Realtime's comfortable ceiling, *or* we need managed moderation/threads/media that we'd otherwise have to build. Then: migrate to Stream with dual-write and a zero-data-loss integrity test (Phase 8).

---

### ADR-007 — Inngest for durable async workflows

**Context.** The core loop is a *time-based, multi-step, retryable* state machine: `event.created` → embed → find candidates → notify → RSVP → provision chat → T-24h/T-2h reminders → check-in window → geofence + mutual-confirm → **record NSM** → ratings → crew prompt. Plus moderation escalation, verification pipelines, lifecycle journeys, billing webhooks. None of this belongs in a request handler.

**Decision.** **Inngest** for all durable, event-driven, time-delayed, retryable workflows (matching fan-out, notification orchestration with frequency caps, verification/moderation pipelines, post-meetup flows, lifecycle). **Upstash Redis** for cache, rate-limits, ephemeral queues, and idempotency keys. No cron-soup; durable and observable by default.

**Alternatives considered.**
- **Vercel Cron + ad-hoc handlers.** Simplest for periodic jobs. Rejected as the primary engine: cron gives you *scheduled* execution but not *durable multi-step workflows* — you'd hand-roll retries, step state, fan-out, delays, and idempotency (the "cron-soup" the roadmap explicitly rejects). Fine for a nightly export; wrong for the meetup lifecycle.
- **Temporal.** The gold standard for durable execution. Rejected for MVP: it wants a server/cluster (or Temporal Cloud spend) and a steeper operational and mental model than a small team needs now (P1). It's the *scale-up* option if Inngest's volume/cost ceiling is hit.
- **BullMQ (Redis-backed queues).** Mature, self-hostable. Rejected: it's a job queue, not a durable workflow engine — multi-step orchestration, delays, and observability are DIY, and it implies a long-running worker process (less serverless-native than Inngest). We already use Upstash Redis for cache/rate-limit; we don't want it to also own critical workflow state.
- **Vercel Queues / Vercel Workflow.** Increasingly capable and in-platform. Rejected *as the primary choice today* on maturity/feature grounds for our durable, step-level, fan-out needs; genuinely worth re-evaluating at the revisit-trigger since staying in-platform would cut a vendor.

**Consequences.**
- *Good:* durable, retryable, observable workflows with **no standing infrastructure**; step-level retries and idempotency; native fan-out for matching; clean time-delays for reminders/check-in windows; serverless-native (fits Vercel). The reliability-critical NSM loop gets first-class durability.
- *Bad:* another vendor in a critical path (the *entire* meetup loop runs on it — an Inngest outage degrades reminders/NSM); payload-size and step limits to design around; distributed-step debugging has a learning curve; cold-start nuances.

**Reversibility.** **Two-way door.** Workflows are code; the event-driven boundary (`event.created`, etc.) is ours. Re-hosting on Temporal or Vercel Workflow is a real but bounded migration — we keep the event names and step semantics stable.

**Revisit-trigger.** Workflow **volume or cost** outgrows Inngest's pricing comfort, **or** we need self-hosting/data-residency control over workflow state, **or** Vercel Workflow reaches feature parity and consolidating vendors is worth it. Then: Temporal (scale) or Vercel Workflow (consolidation).

---

### ADR-008 — PostHog for analytics, flags & experiments

**Context.** The growth loop needs product analytics, funnels, session replay, feature flags, and A/B experiments — and the roadmap mandates instrumentation *from event #1* (before there are users) and a guardrail discipline (NSM + safety must never regress). KVKK/GDPR want EU residency and event-schema control.

**Decision.** **PostHog** as the single tool for product analytics + funnels + session replay + feature flags + experiments (EU cloud region). Pipe to **BigQuery + dbt** for deep cohort/LTV/attribution analysis once it outgrows PostHog. A **typed event schema** lives in `packages/shared` and is the durable, provider-portable asset.

**Alternatives considered.**
- **Amplitude + LaunchDarkly + Statsig + Mixpanel (best-of-breed per function).** Each is excellent at its slice (Amplitude/Mixpanel analytics, LaunchDarkly/Statsig flags+experiments). Rejected for MVP: four vendors, four SDKs, four bills, four data-residency reviews, and the integration glue to make flags/experiments talk to analytics — heavy operational and cost overhead for a small team (P1/P3). PostHog does the *entire* growth loop in one tool with an EU region and a self-host option. We accept "good at everything" over "best at one thing" while small.
- **Pure warehouse-first (everything to BigQuery, build dashboards in Looker/Metabase).** Maximum flexibility, full ownership. Rejected as the *activation* layer: it's slow to iterate on funnels/flags/replay and requires data-eng we don't have yet. We use the warehouse for *deep* analysis (it's the second hop), not as the real-time growth surface.

**Consequences.**
- *Good:* one tool for the whole growth loop; flags + experiments + analytics natively integrated (experiment guardrails are easy); EU region for KVKK; self-host option if residency demands it; warehouse export keeps deep analysis open.
- *Bad:* PostHog is "good at everything, best at nothing" — its experimentation stats are less sophisticated than Statsig's, its analytics less polished than Amplitude's; it's heavy and **needs event-schema discipline** (noise = cost and unusable funnels); cost scales with event volume (sample high-frequency events; model deep cuts in BigQuery).

**Reversibility.** **Two-way door — and the event schema is the asset, not the vendor.** Because the typed event taxonomy lives in `packages/shared`, re-pointing emission at another analytics tool is a transport swap. Historical data is exportable. Flags/experiments are stickier (they're wired into code paths) but migratable.

**Revisit-trigger.** Event-volume cost crosses budget despite sampling, **or** experiment design needs statistical rigor PostHog can't provide (sequential testing, CUPED at the level Statsig offers). Response: keep PostHog for analytics/flags, add a specialist experimentation layer, lean harder on BigQuery + dbt.

---

### ADR-009 — RevenueCat over IAP + Stripe

**Context.** Tayfa+ is a cross-platform consumer subscription. Apple/Google **mandate IAP** for digital goods on mobile (15–30% cut, non-negotiable). We also need web/venue payments and, later, Stripe Connect payouts to hosts. Entitlement truth must be server-side (never client-trusted).

**Decision.** **RevenueCat** as the cross-platform subscription/entitlement layer over App Store + Google Play IAP; **Stripe** for web checkout where permitted, venue payments, and Connect payouts. Entitlements sync to our DB via idempotent webhooks and are the **server-side source of truth**. The entitlement model is **stubbed in Phase 1** so paywalls drop in later without a refactor.

**Alternatives considered.**
- **Raw StoreKit 2 + Google Play Billing (no RevenueCat).** No ~1% RevenueCat fee, full control. Rejected: receipt validation, cross-platform entitlement reconciliation, subscription state machines, grace periods, billing retries, and store-server-notification handling are a deep, error-prone, *revenue-critical* swamp — exactly the commodity to buy (P3). The ~1% (over a free tier) buys correctness and cross-platform analytics; building it is far more expensive than 1%.
- **Stripe-only (no IAP).** Cleanest billing, lowest fees, best dashboards. Rejected as the primary mobile path: it **violates App Store / Play policy** for in-app digital subscriptions and risks app rejection/removal — fatal for a mobile-first product. Stripe is correct for *web* and *marketplace/payouts*, not for unlocking mobile premium.

**Consequences.**
- *Good:* cross-platform subs/entitlements/receipts/analytics solved; store-compliant; server-side entitlement truth; Stripe covers web + Connect payouts; clean separation (RevenueCat = consumer subs, Stripe = marketplace).
- *Bad:* RevenueCat fee (~1% over the free tier) on top of the store 15–30% cut; a dependency in the revenue path (an outage delays entitlement sync — mitigate with idempotent webhooks + reconciliation); two billing systems to reconcile (consumer vs. marketplace).

**Reversibility.** **Two-way door.** RevenueCat is a layer *over* StoreKit/Play Billing; entitlements can be re-derived from store receipts if we ever drop it. Switching cost is moderate, not architectural.

**Revisit-trigger.** RevenueCat's fee at scale exceeds the cost of owning native billing **and** we have the team to maintain it correctly, **or** we negotiate the store small-business rate (15%) and want to push more to web checkout where policy allows. Until then, the fee is cheap insurance.

---

### ADR-010 — Persona for ID + liveness

**Context.** Verification is the trust primitive and a *marketable* feature ("Verified+" badge), not a tax. ID + liveness is expensive (~€1–1.5/verification) and sensitive PII (KVKK). It must be **deferred and tiered** — phone is free for everyone; ID/liveness gates hosting and DMs (the privileged 20%), so cost scales with privileged actions, not signups.

**Decision.** **Persona** for ID document + liveness/selfie verification, integrated via webhooks → `verification` records → `verification_level` propagated into JWT claims. **Stripe Identity** as the documented fallback/secondary. Verification is **deferred** (only when a user wants to host/DM/become Verified+) and we store **provider references, not raw documents**, with short retention (KVKK minimization).

**Alternatives considered.**
- **Stripe Identity.** Already in our stack via Stripe (ADR-009), simple, good coverage. Kept as the fallback. Persona chosen as primary for its more configurable verification *flows*, broader document/region coverage, and a workflow/decisioning engine better suited to a tiered, badge-driven trust model and TR document types. (This is a close call; Stripe Identity is a perfectly defensible primary if its TR coverage and pass-rate test better.)
- **Onfido / Veriff.** Both are strong, enterprise-grade KYC/liveness specialists with excellent fraud and document coverage. Rejected for MVP on cost/contract overhead and integration weight — they shine at higher volume/regulated-KYC needs; Persona/Stripe Identity hit the better velocity-vs-capability point for a deferred, consumer trust badge now. Genuine candidates at scale if fraud/coverage demands it.

**Consequences.**
- *Good:* buy specialist liveness/anti-spoofing (we never build this); tiered/deferred keeps the **biggest AI/verification cost line** controlled (only hosts/DM/Verified+ incur it); badge drives the trust flywheel; provider-ref storage + short retention keeps KVKK exposure minimal.
- *Bad:* per-verification cost is the largest variable cost driver — mis-gating (e.g., verifying at signup) would be a cash incinerator; verification friction can suppress hosting (frame as a badge/privilege, make it fast); a real PII surface that must be encrypted, minimized, audited, and DPA-papered; pass-rates and document coverage in TR need validation before launch.

**Reversibility.** **Sticky — switching providers means re-verifying users.** We mitigate by storing only provider refs + our own `verification_level` (not the vendor's internal state), so the *trust model* is ours and provider-portable, but a switch re-runs verification flows for affected users. Moderately hard to reverse.

**Revisit-trigger.** Cost-per-verify, **TR document/pass-rate coverage**, fraud/ban-evasion bypass rate, or onboarding-friction-driven host drop-off crosses an acceptable threshold. Then: A/B Persona vs. Stripe Identity vs. Onfido/Veriff on pass-rate and cost in the live TR funnel.

---

### ADR-011 — AI: Gateway + Claude Haiku + pgvector embeddings

**Context.** Three distinct AI jobs, three different tools (P2 — right tool per job): **generative** (icebreakers, onboarding free-text → interest extraction), **embeddings** (the matching moat), **moderation** (image + text — see §5). The hard rule (roadmap §8): *every AI call is cached, batched, or deferred — never synchronous in a hot path.*

**Decision.**
- **Generative** via **Vercel AI Gateway + AI SDK v6**, default model **Anthropic Claude Haiku-tier** — through the Gateway this is the slug `anthropic/claude-haiku-4.5` (the Anthropic-direct model ID is `claude-haiku-4-5`; ~$1 / $5 per 1M input/output tokens). Cached by interest-cluster, generated async, with a templated fallback. Sonnet (`anthropic/claude-sonnet-4.6`) is held in reserve as a quality-escalation lever only if Haiku output quality proves insufficient — Haiku is the default per the canonical stack.
- **Embeddings** → **pgvector** (`vector(1536)`), default model `text-embedding-3-small` (1536-dim, matching the schema), recomputed **async via Inngest** on interest/event change, never in the request path. (Cohere or a self-hosted open model — BGE/E5 — are documented alternatives.)
- **Image moderation** Hive / AWS Rekognition; **text moderation** OpenAI Moderation (free/cheap). (§5.)

**Alternatives considered.**
- **Direct provider SDK (Anthropic/OpenAI SDK, no Gateway).** One less hop. Rejected for generative: the Gateway gives **provider failover, cost observability + per-feature budgets/tags, zero-retention routing, caching headers, and one-string model swaps** — all of which we want for cost control and resilience (P3). *Note:* embeddings are an exception — AI SDK v6 routes embeddings via a provider rather than the Gateway's text/image path, so embeddings call the provider (or AI SDK `embedMany`) directly; that's expected, not a contradiction.
- **Self-hosted models (Llama/Mistral for generation; local embeddings).** No per-token vendor cost, full residency control. Rejected for MVP: GPU ops, scaling, and quality tuning are a team we don't have (P1/P3). Local *embeddings* become attractive at volume (cheap, residency-friendly) and are the documented in-house move; local *generation* is a later, optional optimization.
- **Pinecone (vector store).** Covered in ADR-003 — rejected for MVP in favor of in-DB pgvector; matching stays cheap and single-query.

**Consequences.**
- *Good:* right tool per job; Gateway = failover + cost guardrails + model portability (swap model by changing a string); Haiku is cheap and fast and fine for icebreakers/extraction; embeddings in-DB keep matching at ~€0 marginal; aggressive caching (interest-cluster, embedding-hash, moderation-hash) drives per-user AI cost to roadmap targets (< €0.02/active user/mo for generative).
- *Bad:* multiple AI vendors to manage; Haiku quality has a ceiling for nuanced extraction (escalation path: Sonnet, gated); a change of **embedding model/dimension forces a full corpus re-embed + HNSW rebuild** (the sticky sub-decision — we version embeddings: store `embedding_model` + `embedding_version` alongside the vector); generative output is untrusted and must be prompt-injection-safe (§5/§6).

**Reversibility.** **Very two-way on the model** (Gateway makes it a one-string swap), **sticky on the embedding dimension** (1536 chosen to match common providers; changing it is a re-embed + reindex of the whole corpus — plan it as a versioned migration, not a config change).

**Revisit-trigger.** Generative quality/cost shifts the model choice (Gateway makes this trivial), **or** embedding **recall@k** on real matching data is insufficient (try larger/different embeddings — re-embed), **or** embedding volume makes a self-hosted/open model cheaper than the API. The dimension decision is revisited only deliberately, with a planned re-embed.

---

### ADR-012 — Phone-OTP-first auth

**Context.** Target users are 18–32, mobile-first; phone numbers fit the demographic and double as a **trust + ban-evasion signal** (one number, harder to mass-create than email). Verification is deferred/tiered (ADR-010), so auth must cleanly support step-up.

**Decision.** **Supabase Auth phone OTP as the primary sign-in**, with **Apple / Google social** for convenience. Phone is the identity anchor; social is never the *only* trust signal. ID/liveness step-up (Persona) layers on top for privileged actions. 18+ age-gate at signup.

**Alternatives considered.**
- **Email + password (or magic link) primary.** Universal, cheap, no SMS cost. Rejected as primary: email is trivially mass-created (weak anti-abuse/ban-evasion signal), and for a phone-native young audience meeting strangers, a phone number is both lower-friction and a stronger trust primitive. Email remains available as a convenience/recovery option.
- **Social-only (Apple/Google).** Lowest friction, no SMS cost. Rejected as the *only* path: it outsources our identity anchor to a third party, gives a weaker independent trust/ban-evasion signal, and excludes users who won't link social. Social is a convenience layer, not the trust foundation.

**Consequences.**
- *Good:* fits the demographic and the safety story; phone is a real anti-Sybil/ban-evasion signal; clean base for step-up verification; social available for one-tap convenience.
- *Bad:* **SMS OTP cost and fraud** (OTP-pumping/toll fraud is a known attack — mitigate with Vercel BotID + WAF + per-number/IP rate limits on the OTP endpoint, and a reputable SMS provider with fraud controls); SMS deliverability varies by carrier (TR coverage must be validated); number recycling means a phone isn't a permanent identity (tie identity to the account, layer device + verification fingerprints for ban-evasion).

**Reversibility.** **Mostly reversible** — adding email/social as additional methods is easy. The *identity anchor* (phone as the primary key for a person) is somewhat sticky because the account-identity and ban-evasion model assume it. Low-to-moderate regret.

**Revisit-trigger.** SMS OTP **cost or fraud rate** becomes material despite rate-limiting/BotID, **or** market signal shows a segment (e.g., EU university cities) strongly prefers email/social. Response: rebalance methods; keep phone as a trust signal even if not the sole entry.

---

### ADR-013 — EAS Update OTA strategy

**Context.** The roadmap wants a weekly (even daily) ship cadence and the ability to hot-fix without waiting on App Store / Play review. Expo enables this via EAS Update (OTA delivery of JS + assets). But OTA can ship bugs as fast as fixes, and it can't change native code.

**Decision.** **EAS Build/Submit for native binaries; EAS Update for OTA JS/asset delivery**, organized by **channels per environment** (dev / preview / prod), pinned with a **`runtimeVersion` policy** so OTA bundles only land on compatible native builds. Production OTA ships behind **staged rollouts with fast rollback**, and is treated as a real release (release health gates), not a free-for-all.

**Alternatives considered.**
- **Store-only releases (no OTA).** Simplest mental model, every change reviewed. Rejected: loses the daily-ship/hot-fix advantage that is a core reason to choose Expo (ADR-001); a critical client bug would wait days for review. We keep store review for *native* changes only.
- **CodePush / custom OTA.** Microsoft's CodePush is sunsetting/legacy for RN, and a custom OTA pipeline is undifferentiated infra (P3). EAS Update is the first-party, supported path for Expo.

**Consequences.**
- *Good:* instant JS/asset hot-fixes and experiments without store review; per-environment channels; staged rollout + rollback; tight loop with feature flags (PostHog) for kill-switching.
- *Bad:* OTA can push a **bad bundle instantly to everyone** — *requires* staged rollouts, monitoring (Sentry release health), and rollback discipline; **native changes still gate on store review** (new native module, permission change → new binary); a **`runtimeVersion` mismatch can leave users unable to receive OTA** (or, mishandled, "brick" the update channel) — runtimeVersion hygiene is mandatory; OTA must never be used to bypass store review policy (e.g., changing a paid-feature gate in a way stores disallow).

**Reversibility.** **Two-way door.** OTA is a delivery mechanism; we can dial rollout percentages, pause, or revert to store-only for a release at will.

**Revisit-trigger.** A store-policy change restricts OTA, **or** an OTA reliability/runtimeVersion incident causes user harm. Response: tighten rollout gates, or fall back to store-only for the affected surface.

---

### ADR-014 — EU/Frankfurt region for the TR market

**Context.** Tayfa is GDPR + KVKK from day one. The beachhead is Istanbul (TR), expanding to TR + EU. Neither Vercel nor Supabase has a Turkey region; Frankfurt (`eu-central-1`) is the closest compliant location. Data residency is a legal posture, and the system-of-record region is effectively immutable once it holds real PII (including ID-verification data).

**Decision.** **System-of-record in the EU (Supabase Frankfurt); Vercel functions in the EU region.** Add **Istanbul/edge caching (Cloudflare)** for static assets and media to cut perceived latency for TR users. EU residency satisfies both GDPR and KVKK's adequacy/transfer posture, with DPAs papered for every sub-processor.

**Alternatives considered.**
- **US region (e.g., us-east-1).** Cheaper/larger ecosystem, lower latency to US. Rejected outright: cross-Atlantic transfer of EU/TR personal data is a GDPR/KVKK liability and contradicts P7; latency to Istanbul is worse than Frankfurt; non-starter for a trust-first product.
- **Wait for / self-host a Turkey region.** Best latency, strongest KVKK localization story. Rejected for MVP: neither managed vendor offers TR; self-hosting Postgres+infra in a TR datacenter is exactly the undifferentiated ops burden P1/P3 forbid at this stage. Frankfurt is the pragmatic compliant choice; a TR region is the documented future move *if* TR data-localization law tightens.
- **Multi-region active-active.** Rejected as premature overengineering (P4) — operational and consistency complexity unjustified at one-city scale.

**Consequences.**
- *Good:* one compliant home for GDPR + KVKK; low-ish latency to TR/EU (~40–60 ms RTT Istanbul↔Frankfurt); clean DPA/sub-processor story; edge caching masks static/media latency.
- *Bad:* **Frankfurt is not Istanbul** — every client-direct DB round-trip from TR carries cross-border latency, so the client-direct-RLS reads (ADR-005) must be batched/cached (Redis, geocell feed cache) to feel instant; KVKK may eventually demand stricter in-country localization than Frankfurt provides (regulatory risk); a future TR region migration would be painful.

**Reversibility.** **One-way door — the hardest-to-reverse decision in this document.** A Supabase project's region is fixed; changing it means **migrating to a new project**: data migration, downtime, re-issuing/re-pointing Auth, re-papering every DPA and KVKK VERBİS registration, and potentially re-consenting users. Once real user PII (especially verification data) lands in a region, moving it is a legal-and-technical migration, not a config change. This is why P7/P8 demand we get it right *now*, before the first user.

**Revisit-trigger.** TR enacts **strict data-localization** requiring in-country storage, **or** Vercel + Supabase ship a Turkey region with acceptable maturity, **or** TR-user latency on cached paths still fails the UX bar. Any of these forces a deliberate, planned region migration — treated as a major project with legal sign-off.

---

## 3. Data Architecture Deep-Dive

This expands the roadmap's §5 data model. Postgres, UUID PKs, `created_at/updated_at` everywhere, soft-delete via `deleted_at` on user content, **every row user-attributable** (the precondition for RLS — ADR-005).

### 3.1 Key tables (and what makes each one load-bearing)

- **`profile`** (1–1 with Supabase `auth.users`): `display_name`, `birthdate`→age, `bio`, `home_city_id`, `neighborhood`, `avatar`, `languages`, `verification_level` enum `{none, phone, id, id_live}`, `safety_score`, `reliability_score`, and `interest_embedding vector(1536)` (the weighted aggregate of the user's interests — the matching key). Stores `embedding_model` + `embedding_version` alongside the vector so a future model change is a versioned re-embed, not a silent corruption (ADR-011).
- **`interest_taxonomy`**: canonical tags (`domain` ∈ {music_genre, artist, tv_show, sport, hobby, cuisine, cause, …}, `label`, `slug`, `embedding vector(1536)`). Seeded with embeddings at build time. Joined via **`user_interest`** (`user_id`, `interest_id`, `weight`, `source` ∈ {onboarding, connected_account, inferred}) and **`event_interest`**.
- **`event`**: `host_id`, `title`, `description`, `category`, **`location geography(Point,4326)`**, `venue_name`, `starts_at`, `ends_at`, capacity `{min,max}`, `visibility` ∈ {public, interest_match, invite}, `status` ∈ {draft, open, full, confirmed, completed, cancelled}, **`embedding vector(1536)`**, `gender_balance_policy`, `age_range`.
- **`event_member`**: the RSVP + attendance ledger — `event_id`, `user_id`, `role` ∈ {host, member}, `rsvp_status` ∈ {requested, approved, going, attended, no_show, left}, `joined_at`. This is the transactional heart of the loop (capacity races live here).
- **`crew`** + **`crew_member`** + **`crew_event`**: recurring groups formed from repeat co-attendance — the D30 retention engine.
- **`conversation`** (`scope` ∈ {event, crew, dm}, `scope_id`) → **`message`** (`sender_id`, `body`, `media_url`, `moderation_status`); **`conversation_member`** for read-state/mute. `message` is the **write-hot** table (§3.6).
- **`verification`** (`user_id`, `type` ∈ {phone, id, liveness}, `provider`, `provider_ref`, `status`, `verified_at`) — provider refs only, never raw documents (KVKK).
- **`report`** → **`moderation_action`** (`actor` ∈ {ai, human}, `action`, `rationale`); **`block`** (`blocker_id`, `blocked_id`). The T&S spine.
- **`rating`** (`vibe` 1–5, `showed_up`, `would_meet_again`, flags) → feeds `reliability_score`/`safety_score`.
- **`notification`**, **`device`** (`expo_push_token`, platform, last_seen), **`subscription`** (mirrored from RevenueCat), **`referral`**, **`city`** / **`geocell`** (H3).

### 3.2 Geo strategy — `geography` vs `geometry`, `ST_DWithin`, H3

- **`geography(Point, 4326)`, not `geometry`.** `geography` computes on the spheroid, so distances are in **meters** and correct without choosing a projection — exactly what "events within X km of me" needs across a city/country. `geometry` is faster (planar) but would force a metric projection and risk subtle distance bugs. Correctness wins (P6); we mitigate the speed cost with caching.
- **`ST_DWithin(location, :me, :radius_m)`** for the radius filter — it is **index-assisted by a GiST index** on `event.location`, so it's a true indexed range query, not a full scan. We do *not* compute `ST_Distance` for filtering (that can't use the index the same way); we use `ST_DWithin` to filter, then order by distance only on the small candidate set.
- **H3 geocells for bucketing, not for the precise query.** We store an **H3 index** (Uber's hierarchical hexagonal grid, ~resolution 8–9 for neighborhood granularity) on `event` and `profile`. H3 is the key for: (a) **feed cache keys** (`{geocell, interest_cluster, filters}` in Redis — §5/§6), (b) **liquidity heatmaps** and the ghost-town guard (count live events per cell), and (c) cheap "widen the radius" fallback (walk to neighboring cells via `k-ring`) when a cell is sparse. PostGIS does the *precise* distance; H3 does the *cheap bucketed* operations. They are complementary, not redundant.

### 3.3 Vector / matching strategy — dimension, HNSW vs IVFFlat, when to externalize

- **Dimension: 1536**, matching `text-embedding-3-small` (ADR-011). Embeddings are **L2-normalized** so **cosine distance** (`<=>`) is the operator; with normalized vectors cosine and inner product agree, and cosine is the intuitive "taste similarity."
- **Index: HNSW, not IVFFlat (default).** HNSW gives better recall-vs-latency and — critically — **handles incremental inserts without a training step**, which fits a stream of new events/profiles. IVFFlat needs representative data present to train its lists and degrades if data distribution shifts, making it awkward for a growing dataset. HNSW costs more memory and has a slower build; we accept that at our scale. Query-time recall is tuned with **`ef_search`** (raise for recall, lower for latency); build with sensible `m`/`ef_construction`. IVFFlat remains the fallback if HNSW memory becomes a problem on a very large corpus.
- **The single-query ranking.** Discovery is *one* SQL statement: `ST_DWithin` (geo filter, GiST) ∩ vector similarity (HNSW, `<=>`) ∩ `status='open'` ∩ time/capacity/freshness, blended into an **explainable score** (the roadmap's "ranking as a pure, testable function" with golden-case fixtures). Logging per-feature contributions makes it debuggable and tunable, and leaves a trail for a future learned ranker.
- **When to externalize (ADR-003 trigger):** only when pgvector ANN p95 > ~150 ms at target recall under city-scale load *after* tuning + caching. Then candidate generation moves to Qdrant; the geo/relational/reputation re-rank stays in Postgres.

### 3.4 RLS policy patterns

- **Deny-by-default, forced.** Every table: `ENABLE ROW LEVEL SECURITY` *and* `FORCE ROW LEVEL SECURITY`. **No policy ⇒ no access.** A table that ships without a tested policy fails CI (§7). This is the whole game for ADR-005's security guarantee.
- **"Every row is user-owned."** The base pattern is `USING ((select auth.uid()) = user_id)`. We wrap `auth.uid()` in a scalar subquery so Postgres evaluates it **once per query, not once per row** — a documented RLS performance footgun. Columns referenced in `USING`/`WITH CHECK` clauses are indexed.
- **Per-operation policies.** Separate `SELECT` / `INSERT` / `UPDATE` / `DELETE` policies (e.g., a member can read a conversation but not insert as another user; a host can update their event but not others').
- **Public slices via views / column-level exposure.** Other users' *public* profile fields are exposed through a security-definer view or a policy that returns only non-private columns. Private fields (exact location until approved, contact, birthdate) are never selectable directly.
- **Location fuzzing in the policy/exposure layer.** Non-approved members see only the **geocell centroid** of an event, never the precise `geography` point. The precise pin is released — by an explicit BFF action, RLS-gated on `rsvp_status='approved'` and proximity to `starts_at` — only to approved attendees. A test proves precise coordinates never leave the server for non-approved users (Phase 2 acceptance criterion).
- **Chat:** `message` and `conversation` readable only by `conversation_member` rows for that conversation.
- **Moderation/admin:** *no* client policy grants it — moderator/admin access is **service-role through the BFF only**, fully audited (§6). Clients never hold the service role.

### 3.5 Indexing plan

- `GiST` on `event.location` (PostGIS radius).
- `HNSW` on `profile.interest_embedding` and `event.embedding` (ANN).
- Composite `(home_city_id, starts_at, status)` on `event` for the feed; **partial index `WHERE status='open'`** to keep the hot index small.
- `(user_id, rsvp_status)` on `event_member`; `(conversation_id, created_at DESC)` on `message`.
- H3 `geocell` column (btree) on `event`/`profile` for bucketed feeds and heatmaps.
- Indexes on every column appearing in an RLS `USING`/`WITH CHECK` clause (RLS perf — §3.4).

### 3.6 The write-hot chat table & partitioning

`message` is the write-hot table. Plan (not built for MVP — P4): **partition by month** (declarative range partitioning on `created_at`) once volume warrants, so writes hit a small live partition and old partitions can be archived to cold storage cheaply. The `(conversation_id, created_at DESC)` index serves the "latest messages" read pattern. At the chat-migration trigger (ADR-006), `message` moves to **Stream**, which removes this table from our hot path entirely — partitioning is the bridge until then, not the end state.

---

## 4. Scalability & Evolution Path

The roadmap's complexity triggers, made concrete. Each is **designed for, not built** (P4). The threshold is what *forces* the work.

| Lever | Build when (specific trigger) | What we do |
|---|---|---|
| **Read replicas** | Primary CPU sustained > ~70% from read load, or read p95 degrades under feed/discovery traffic | Add Supabase read replica(s); route discovery/feed reads to replica, keep RSVP/capacity writes on primary (accept replica lag for reads, never for the capacity transaction) |
| **Partition `message`** | `message` row count / write rate makes index maintenance or vacuum a measured problem (well before chat migration) | Declarative monthly range partitioning + archival of cold partitions (§3.6) |
| **Migrate chat → Stream** | Chat is a **top-2 retention surface** AND concurrent Realtime connections / msg volume approach Supabase's comfortable ceiling | Dual-write → verify → cutover with rollback + zero-data-loss integrity test (ADR-006, Phase 8) |
| **Media → Cloudflare R2 + CDN** | Storage **egress cost** crosses budget, or image-transform/delivery latency hurts UX | Move media to R2 + CDN + on-the-fly transforms (imgproxy/Cloudflare Images); signed URLs throughout; never serve originals |
| **Externalize vector store** | pgvector ANN **p95 > ~150 ms at target recall** at city scale after HNSW tuning + caching | Candidate generation → Qdrant; final geo/relational/reputation re-rank stays in Postgres (ADR-003) |
| **Learned ranker** | Enough labeled outcome data (attended/rated/skipped) AND a clear, measured lift hypothesis over the heuristic+embedding blend | Train an offline model against the ranking-eval harness; guardrail on **predicted completed-meetup lift**, not tap-rate (Phase 4) |
| **City-sharding** | A single DB can no longer hold all cities' graphs within latency/cost SLOs | Shard by city (each city is a near-independent graph — the long-horizon lever); region-pin shards for residency |
| **Self-host / Temporal (workflows)** | Inngest volume/cost ceiling, or self-host/residency need (ADR-007) | Re-host workflows on Temporal or Vercel Workflow, keeping event names/step semantics |
| **Braze (lifecycle)** | Expo Push outgrown — need journeys, segmentation, send-time optimization, frequency caps at scale | Adopt Braze for lifecycle journeys; Expo Push stays for transactional (Phase 6) |

### What we are deliberately NOT building for MVP — and why that's correct

- **Kubernetes / container orchestration.** We have no services to orchestrate — Vercel + Supabase + Inngest are managed. K8s would be pure operational cost for a two-engineer team (P1). *Correct because* serverless covers our load profile and we add dedicated services only at a named trigger.
- **Microservices.** A distributed monolith for a pre-PMF product is the classic premature-scaling trap — network calls, distributed transactions, and deploy coordination with no team to run them. The modular monolith (one Postgres, a thin BFF, clear domains in `packages/`) is faster to build and reason about. *Correct because* our bottleneck is liquidity and the loop, not service decomposition.
- **Kafka / event-streaming platform.** Inngest + Postgres + Redis cover our event/async needs durably. Kafka is infrastructure for a scale and team we don't have. *Correct because* event volume is modest and Inngest gives durability without standing brokers.
- **Separate vector DB (Pinecone/Qdrant) from day one.** pgvector keeps matching single-query and cheap until a measured latency trigger (ADR-003). *Correct because* externalizing early adds a store, a sync problem, and a cross-system join for zero current benefit.
- **Custom auth.** Supabase Auth + Persona cover it; building auth is undifferentiated risk (P3). *Correct because* auth bugs are security incidents and specialists do this better.
- **GraphQL gateway.** ADR-005 — REST-ish Route Handlers + client-direct reads are simpler for mobile-first. *Correct because* it avoids a schema/resolver tier and query-cost control we don't need.

The discipline: **every one of these has a written trigger.** We are not refusing complexity forever; we are refusing to pay for it before a metric demands it.

---

## 5. AI Engineering Architecture

Three jobs, three pipelines, one rule: **every AI call is cached, batched, or deferred — never synchronous in a hot path** (roadmap §8). All generative traffic flows through the **Vercel AI Gateway** (failover, cost observability, per-feature budgets/tags, zero-retention routing) on **AI SDK v6**.

### 5.1 Generative — icebreakers & onboarding extraction (Claude Haiku, async, cached, injection-safe)

- **Model & routing.** Default `anthropic/claude-haiku-4.5` via the Gateway (cheap, fast: ~$1/$5 per 1M in/out). Sonnet (`anthropic/claude-sonnet-4.6`) is a *quality-escalation lever only*, gated, not the default.
- **Never in the hot path.** Icebreakers are generated **async via Inngest** when an event chat is provisioned (and **cached by interest-cluster** in Postgres/Redis), not on the user's tap. Onboarding free-text → interest extraction runs async after the user submits, mapping to `interest_taxonomy`. The UI always has a **templated fallback** so a slow/failed AI call never blocks the user.
- **Prompt-injection-safe by construction.** User content (interests, bio, free text) is treated as **data, never instructions**: it's passed as structured input, the model uses **structured output** (AI SDK structured generation) so we parse a typed object rather than free text, the generative path has **no tool access** and cannot take actions, and output is **encoded** before display. Icebreakers are grounded only in **shared public** interests and must emit **no PII**. Jailbreak/abuse detection and rate-limits sit on the generative endpoints (Phase 4/5 acceptance criteria).
- **Fail-open to template (this is the *one* place we fail open, deliberately):** a missing icebreaker is a cosmetic degradation, not a safety event, so the templated fallback is correct. (Contrast moderation/verification, which fail *closed* — §6.)

### 5.2 Embeddings — the matching moat (recompute async, version the vectors)

- **Model & store.** `text-embedding-3-small` (1536-dim) → pgvector (ADR-003/-011). Embeddings are **recomputed async via Inngest** on interest/event change — *never* in the request path.
- **Embedding cache.** Keyed by a hash of the normalized interest set → embedding, so identical taste profiles reuse a computed vector (the roadmap's embedding-cache cost lever).
- **Versioning.** Each vector stores `embedding_model` + `embedding_version`; a model change is a planned, versioned **re-embed + HNSW rebuild** (the sticky cost in ADR-011), not a silent overwrite. Matching at query time is in-DB ANN — **~€0 marginal** per match (the moat is cheap).
- **Note on the Gateway.** AI SDK v6 routes embeddings through a provider (or `embedMany`), not the Gateway's text/image path — expected. At volume, a self-hosted/open embedding model (BGE/E5) is the documented in-house move for cost + residency.

### 5.3 Moderation — image + text, async pipeline, human-in-loop, fail-safe

- **Pipeline (async, Inngest):** on **photo upload** (profile/event) → image scan via **Hive / AWS Rekognition** (NSFW + face checks) — **at upload, not per-view** (cost). On **new/edited message** → **OpenAI Moderation** (free/cheap text) + a risk score; **hash-cache** results so identical content isn't re-scanned. Output → **auto-action** (clear/remove) below/above confidence thresholds, or a **human review queue** in the band between, with an **appeals** flow.
- **Human-in-the-loop above a confidence threshold** — false positives harm good users, so a human decides the ambiguous and high-impact cases. Every action lands in the **immutable audit log** (§6).
- **Fail-safe = deny-closed.** If a moderation provider is down, content is **held/queued, not published** (and verification denies the privilege — §6). The roadmap is explicit: on provider outage, **fail safe, not open.** This is the opposite of §5.1's generative fail-open, and the distinction is deliberate: cosmetic features degrade gracefully; safety-critical decisions deny.

### 5.4 Cost-control engineering (the levers, concretely)

- **Cache** — interest-cluster cache (icebreakers), embedding-hash cache, moderation hash-cache, Redis feed cache (`{geocell, interest_cluster, filters}`).
- **Batch** — Inngest fan-out for embedding recompute and candidate notification; the Gateway's caching headers (`max-age`) for idempotent generative prompts; batch APIs where latency-insensitive.
- **Defer** — everything async; no AI in a request handler; verification deferred/tiered (ADR-010) so the **biggest cost line scales with privileged actions, not signups**.
- **Gateway routing** — per-feature **budgets + tags** (cost attribution), provider **failover**, cheapest-acceptable model per job, and one-string model swaps for cost/quality tuning.
- **Target:** the roadmap's order-of-magnitude — generative < €0.02/active user/mo, embeddings < €0.01, match ranking ~€0 marginal, ID/liveness the dominant line (gated to hosts/DM/Verified+).

---

## 6. Security & Privacy Architecture

This is a meet-strangers-IRL app; security and safety are existential (P6). Full risk register in `RISK_ANALYSIS.md`; this is the architecture.

### 6.1 Authorization — RLS deny-by-default
The authorization substrate is Postgres RLS (ADR-005, §3.4): `ENABLE` + `FORCE` RLS on every table, **no policy ⇒ no access**, per-operation policies, `(select auth.uid())` wrapped for performance, indexes on policy columns. CI **fails if any table lacks a tested policy** (§7). This guarantees a user cannot read another user's private data **even with a stolen JWT** — the leaked-token threat is contained at the database, not just the API.

### 6.2 Step-up verification & JWT claims
Phone OTP → base Supabase session (short-lived JWT + refresh). Privileged actions (hosting, DMs, certain venues) require **step-up**: Persona ID + liveness → `verification` record → **`verification_level` propagated into the JWT** (via a Supabase Auth custom-access-token hook / `app_metadata`). Middleware enforces the required level per route; sensitive RLS policies also check the claim. Device binding for push tokens.

### 6.3 Location privacy & fuzzing
Never expose precise user location. Event locations are **fuzzed to the geocell centroid** until a member is RSVP-approved; the **precise pin releases only near `starts_at`, only to approved members**, via an RLS-gated BFF action. There is **no public "who's nearby" map of people.** "Share my live location with my crew" is **opt-in and time-boxed.** A test proves precise coordinates never leave the server for non-approved users (§3.4).

### 6.4 API abuse — WAF, BotID, rate-limits, idempotency
**Vercel WAF + BotID** on auth and abuse-prone endpoints (especially the OTP endpoint — toll-fraud defense, ADR-012). **Upstash Redis rate-limits** per user / IP / action. **Idempotency keys** on writes and webhooks (RevenueCat, Persona, Inngest) to make retries safe. **Zod validation on every BFF boundary** (and Postgres `CHECK`/constraints for invariants on client-direct writes — ADR-005). Signed URLs for all media.

### 6.5 Secrets management
Service-role key and all provider secrets live in **Vercel / Supabase env vaults, never on the client.** Least-privilege keys per integration; rotation on exposure. The mobile/web clients hold only the anon key (which is safe precisely *because* RLS is deny-by-default).

### 6.6 Fail-safe (deny-closed) on provider outage
On verification or moderation provider failure, the system **denies the privilege / holds the content** — never grants or publishes (§5.3). Circuit breakers around external calls; the roadmap's incident posture treats provider-outage as **deny-closed**. (The lone, deliberate fail-*open* is non-safety generative content — §5.1.)

### 6.7 Audit logs
Every moderation action (`moderation_action`) and verification event is **append-only and immutable**, with actor (ai/human), rationale, and timestamp — legal auditability. Moderator/admin access is **service-role through the BFF only**, itself audited. No client path reaches moderation/admin data.

### 6.8 KVKK / GDPR data handling
- **Residency:** EU/Frankfurt system-of-record (ADR-014).
- **Consent:** explicit, **granular, separate** consents for location, connected accounts (Spotify/Apple Music/Letterboxd), and marketing — captured **before** the first user, gating analytics.
- **Data-subject rights:** export, delete/erasure, rectification built in **from Phase 1** (Inngest jobs), not bolted on.
- **Minimization:** collect only what we use; store **verification provider refs, not raw ID documents**; short retention on verification PII; encryption at rest (Supabase) and in transit.
- **Legal scaffolding:** KVKK *aydınlatma metni* (disclosure) + VERBİS registration; a **DPA with every sub-processor** (Supabase, Vercel, Persona, RevenueCat, Stream, Hive/AWS, OpenAI, Inngest, Upstash, PostHog, Braze); 18+ age-gate.

---

## 7. DevEx, Repo & CI/CD

### 7.1 Monorepo layout (pnpm workspaces)
```
tayfa/
├─ apps/
│  ├─ mobile/      # Expo + Expo Router + NativeWind + React Query + Zustand
│  └─ web/         # Next.js App Router on Vercel (landing, OG share, moderation console, BFF Route Handlers)
├─ packages/
│  ├─ db/          # Drizzle schema + migrations + RLS policies (the single schema source)
│  ├─ shared/      # Zod schemas, the typed analytics event taxonomy, domain types
│  ├─ config/      # shared tsconfig / eslint / prettier (optional)
│  └─ ui/          # shared design tokens / primitives (optional)
```
- **pnpm workspaces** for the workspace graph; **Turborepo** (optional but recommended) for task orchestration + remote caching so CI only rebuilds what changed.
- `packages/shared` is the **contract**: Zod schemas drive both runtime validation *and* TypeScript types (`z.infer`), and the typed event taxonomy is consumed identically by mobile, web, and the BFF — so a schema change is a compile error everywhere, not a runtime surprise.
- `packages/db` is the **single schema source** (Drizzle) — migrations and RLS policies live with the schema they secure.

### 7.2 TypeScript strictness & Zod-at-boundaries
- **Strict everywhere:** `strict: true`, `noUncheckedIndexedAccess: true`, **no `any`** (the roadmap's quality bar). Secrets only via env, never committed.
- **Zod at every boundary:** BFF request inputs, webhook payloads (RevenueCat/Persona/Inngest), and **AI outputs** (parse generative results against a schema — §5.1) are all Zod-validated. Invariants on client-direct writes that Zod can't reach live as Postgres constraints/triggers (ADR-005).

### 7.3 Testing strategy
- **Unit** (Vitest): domain logic — ranking function (golden-case fixtures), RSVP state machine, scoring, the NSM anti-gaming logic.
- **RLS policy tests** (the non-negotiable layer): every table proven deny-by-default, every policy proven to block cross-user reads (two-user harness via Drizzle/pgTAP). **CI fails if any table lacks a tested policy.**
- **E2E:** **Maestro or Detox** for the mobile onboarding/loop flows; Playwright for the web moderation console. Acceptance criteria map to specific tests (the roadmap's "checklist mapping each acceptance criterion to the test that proves it").
- **Load** (k6 / Artillery): the feed/discovery endpoint (p75 < 150 ms budget) and the RSVP/capacity last-seat race (concurrency correctness).
- **Chaos:** provider-outage drills proving **fail-closed** verification/moderation (§6.6) and the NSM geofence/mutual-confirm anti-gaming under adversarial conditions.

### 7.4 CI gates (GitHub Actions)
Every PR: **lint → typecheck → unit → RLS policy tests → build (both apps)**; merge blocked on any failure. Security-relevant checks (RLS coverage, secret scanning) are hard gates. The roadmap's anti-hallucination rule is enforced here: a security control stubbed as "TODO" is not "done."

### 7.5 EAS channels / OTA & environment separation
- **EAS channels per environment** (dev / preview / prod); native binaries via **EAS Build/Submit**; JS/asset hot-fixes via **EAS Update** with `runtimeVersion` pinning, **staged rollout, and rollback** (ADR-013). Vercel preview deployments per PR for web.
- **Separate Supabase projects per environment** (dev / staging / prod) — important for **data-residency isolation** and for running destructive RLS/migration tests without touching production PII. Each environment has its own secrets and sub-processor scoping.
- Release health gates on EAS/Vercel rollouts (Sentry); flags (PostHog) for kill-switching risky changes.

### 7.6 Observability
**Sentry** (RN + web errors + performance), **OpenTelemetry** traces on the BFF, **Better Stack + Checkly** for uptime/synthetic checks. Cost grows with volume → sample. SLO dashboards tie reliability to NSM (downtime = missed meetups = trust loss). Structured logs throughout.

---

## 8. Build vs Buy Summary

The governing rule (P3): **buy the commodity, build the moat.** The right-hand column is the differentiated IP no vendor sells — it is the company.

### 8.1 What we BUY (commodity — specialists do it better/cheaper)

| Capability | Vendor | Why buy (not build) | Key risk we accept |
|---|---|---|---|
| Auth (phone OTP + social) | Supabase Auth | Auth bugs are security incidents; specialists do it right | Vendor coupling on GoTrue (ADR-002) |
| ID + liveness verification | Persona (Stripe Identity fallback) | Anti-spoofing/liveness is deep specialist work | Cost-per-verify; re-verify on switch (ADR-010) |
| Chat infrastructure | Supabase Realtime → Stream | Rich chat at scale + moderation is a product, not a feature | Planned migration cost (ADR-006) |
| Billing / subscriptions | RevenueCat + Stripe | Receipt validation + cross-platform entitlements are a swamp | ~1% fee + revenue-path dependency (ADR-009) |
| Content moderation | Hive / Rekognition (image), OpenAI Moderation (text) | NSFW/CSAM/abuse detection at scale is specialist + liability-sensitive | False positives → human-in-loop (§5.3) |
| Generative AI | Claude Haiku via Vercel AI Gateway | Model quality + routing/failover/cost control bought, not built | Multi-vendor; quality ceiling (ADR-011) |
| Embeddings | `text-embedding-3-small` → pgvector | Cheap, standard; in-house only at volume | Re-embed on model change (ADR-011) |
| Async / workflows | Inngest | Durable retryable workflows without standing infra | Critical-path vendor (ADR-007) |
| Cache / rate-limit / queues | Upstash Redis | Serverless Redis, no ops | — |
| Push (transactional) | Expo Push → Braze (lifecycle) | Free/instant now; CRM journeys later | Expo lacks segmentation (→Braze) |
| Analytics / flags / experiments | PostHog → BigQuery + dbt | Whole growth loop in one EU-resident tool | Event-volume cost; stats ceiling (ADR-008) |
| Observability | Sentry + OpenTelemetry + Better Stack/Checkly | Standard, proven | Cost with volume → sample |
| Infra / hosting | Vercel + Supabase (EU) | Managed serverless; no K8s | Region is one-way (ADR-014) |

### 8.2 What we BUILD (the differentiated IP — the moat)

| Capability | Why it's ours to build | Where it lives |
|---|---|---|
| **Interest-matching core** | The compounding moat — taxonomy + weighted interest embeddings + the geo∩vector∩relational∩reputation∩serendipity **ranking function** + the explainability/eval harness. No vendor sells "match young people for hobby hangouts in Istanbul." | Postgres (PostGIS + pgvector) + ranking service + `packages/db` |
| **The meetup loop** | The product *is* the loop: event creation, the RSVP/approval **state machine** with transactional capacity, auto-provisioned chat, the time-based lifecycle (reminders/check-in), and — critically — **NSM recording** (geofence + mutual-confirm, anti-two-account-gaming). The North Star is defined by code we write. | BFF + Inngest workflows + Postgres |
| **Trust / reputation system** | `reliability_score` + `safety_score` from attendance/ratings, surfaced as trust signals and fed into ranking — the social currency that aligns incentives with real-world value. Bespoke to our safety thesis. | Inngest jobs + Postgres + ranking |
| **Trust & Safety tooling** | Moderation console, queues + SLAs (<4h general, <30min safety-critical), escalation, **ban-evasion fingerprinting** (device/phone/ID), appeals, immutable audit log, women-only/verified-only filters, safety center (share-plan, time-boxed live-location, SOS). The orchestration around bought moderation primitives is ours, and it's the brand. | Web console (BFF, service-role) + Inngest + Postgres |
| **Location-privacy / fuzzing logic** | Geocell-centroid exposure, precise-pin release timing, RLS-gated location policies — a bespoke privacy mechanism that is core to safety, not a vendor feature. | RLS + BFF + PostGIS/H3 |
| **Crew-formation engine** | Turning repeat co-attendance into recurring crews — the strongest D30 retention lever and a graph that raises switching costs. | Postgres graph + Inngest |

The pattern is consistent: we buy the **primitives** (a moderation score, a liveness check, a chat transport, an entitlement) and build the **orchestration and product logic** that turns those primitives into Tayfa's defensible, compounding advantage — the interest graph, the verified-meetup loop, and the trust system.

---

*Source of truth: `roadmaps/APP_EXECUTION_ROADMAP.md`. Companion reports: `RISK_ANALYSIS.md` · `GROWTH_STRATEGY.md` · `MONETIZATION_ANALYSIS.md`. This document expands the roadmap's stack and §4/§5/§9; it does not contradict it. Every decision here carries a reversibility classification and a written revisit-trigger so future engineers can tell what was chosen on purpose, what was chosen provisionally, and exactly what metric should make them reconsider.*

# Phase 8 Report — Multi-City Scale & Reliability

**Date:** 2026-06-29 · **Status:** implemented + verified (typecheck/lint/tests/build green; CI pending push).

P8 makes launching a city a **repeatable, gated playbook** and encodes the **scale guards** (cost, archival, SLO) as pure, tested decisions — the parts of "harden for 10–100× load" that belong in the domain rather than as magic numbers in the request path (ROADMAP §Phase 8). The heavy infra moves it describes (read replicas, `message` partitioning, Stream chat migration, R2/CDN, BigQuery+dbt) are **operational/IaC**, not application code; this phase ships the **decision logic** they execute against, honestly scoped (see Known issues).

## Completed work

**Multi-city expansion — `packages/shared/src/domain/expansion.ts` (pure, exhaustively tested):**
- **City liquidity** — `cityLiquidityStatus()` classifies a city by live events/week within the liquidity radius into `ghost_town | seeding | liquid | saturated` (floor = 40/wk from `DISCOVERY`; saturated at 2×).
- **Radius fallback ladder** — `resolveDiscoveryRadius()` walks `radiusFallbackLadderMeters`, widening until a step has enough candidates, else returns the max radius with `sufficient:false` (→ ghost-town guard).
- **Ghost-town guard** — `applyGhostTownGuard()` is the make-or-break guarantee: a live feed **never renders empty**. Real events lead; if short of `minVisible`, backfill from curated/partner **seed** supply and **flag `seeded`** so the UI labels seed events honestly — we never fake real demand silently.
- **City launch go/no-go** — `cityLaunchDecision()` opens a city only when **all** gates pass: liquidity floor, ≥5 verified seed hosts, **and proven economics (LTV:CAC ≥ 1)**. The economics gate is the discipline line — "don't scale unproven economics" (Phase 8 depends on Phase 7). Returns the full blocker list.
- **Travel mode** — `resolveActiveCity()` scopes the feed to another city ("plan before you move") as a **Tayfa+** feature; a free user stays pinned to home and a gated request returns `requiresUpgrade` rather than blocking the core feed.

**Scale & reliability guards — `packages/shared/src/domain/scale.ts` (pure, tested):**
- **AI cost guard** — `decideAiSpend()` allows fresh paid calls under a per-feature daily budget, then degrades gracefully (serve cache → **fail OPEN to template**). It NEVER hard-denies — a cost ceiling must not break UX (safety moderation has its own fail-CLOSED path and is never routed here).
- **Hot-table archival** — `messagePartitionKey()` (month key for the write-hot `message` table) + `shouldArchiveMessage()` (cold-tail cutoff; archival is reversible, never deletes).
- **SLOs** — `withinSlo()` / `sloBreachMs()` against per-service p99 budgets (feed 150 ms, RSVP 300 ms, match 400 ms) — downtime = missed meetups = lost NSM.

**Config — `constants/geo.ts` (`EXPANSION`) + new `constants/scale.ts` (`MESSAGE_ARCHIVAL`, `AI_BUDGETS`, `SLO`):** every threshold is config, not a literal in the code.

**Light BFF wiring — `apps/web/app/api/cities/active/route.ts`:**
- `GET /api/cities/active[?city=<id>]` resolves the active city (travel mode premium-gated via `resolveActiveCity`) and computes the city's live liquidity (upcoming joinable events within the radius over the next 7 days) → `cityLiquidityStatus`. Read-only; no change to the hot feed path.

## Tests
- `packages/shared`: **163 unit tests pass** (19 files; +21 across `expansion.ts` + `scale.ts`). Domain coverage holds ≥ thresholds.
- `apps/web`: `next build` green — **18 routes**, incl. the new `ƒ /api/cities/active`.
- `packages/db`: RLS suite **6/6** (no schema change — `city` table already existed from the spine).
- Typecheck (shared + web) clean; ESLint + Prettier clean.

## Decisions
- **A city opens only on all three gates.** Liquidity AND seeded hosts AND proven economics — encoded in `cityLaunchDecision`, with the economics gate explicitly preventing premature scaling.
- **Never an empty feed, never a faked one.** The ghost-town guard backfills from seed supply but flags `seeded` so the surface stays honest.
- **Cost guards fail open; safety fails closed.** `decideAiSpend` degrades to cache/template and never denies; this is deliberately the opposite of the moderation pipeline.
- **Travel mode never blocks the core feed.** A gated travel request downgrades to home + an upgrade nudge — consistent with the P7 "never block core/social/safety" rule.
- **Thresholds live in config.** Liquidity floors, AI budgets, archival window, and SLO budgets are all in `constants/`, so ops can tune without touching logic.

## CI status
Committed + pushed on completion; CI + Security expected green. Updated here once the push run is confirmed.

## Known issues / pending (honest scope)
- **Infra deliverables are operational, not app code, and are NOT done here:** read replicas, `message`/`event` time-partitioning DDL, the **Supabase Realtime → Stream chat migration** (dual-write → verify → cutover), Cloudflare R2 + CDN media, and BigQuery + dbt models. This phase ships the **pure decisions** (`messagePartitionKey`, `shouldArchiveMessage`, `decideAiSpend`, SLO checks) those systems execute against; the migrations/IaC + the 100× load test, chaos drills, and chat-migration integrity test remain to be run in a real environment. Not claimed as complete.
- **Verified-host + LTV:CAC inputs** to `cityLaunchDecision` come from the analytics/ops layer (BigQuery), which is pending; the gate is unit-tested against supplied metrics.
- **`/api/cities/active` liquidity** counts events within the radius of the city centre as a proxy; the production heatmap uses H3 geocell bucketing + cache tiers (designed, not wired).
- On-device re-validation pending device reconnection — P8 adds no new mobile **screens** (travel-mode city switcher polish sits on the existing feed shell). See `PHASE_8_DEVICE_REPORT.md`.

# Phase 2 Report — Interest Graph & Discovery Feed

> Roadmap §10, Phase 2. **Objective:** turn interest data into a living, ranked, geo-aware
> discovery feed — the user sees *relevant* events/people near them, not a wall of strangers.

**Status:** Ranking engine + data surfaces **complete and tested**; the feed UI and the BFF
feed Route Handler are **built and typecheck-green** (web `next build` passes) running in mock
mode. The live PostGIS/pgvector candidate query against real infra (the <150 ms p75 budget +
load test) and the Redis cache wiring remain **pending** (the ranking itself is a pure function
the handler calls). See [`../KNOWN_LIMITATIONS.md`](../KNOWN_LIMITATIONS.md).

---

## Completed work

**Ranking as a pure, testable, explainable function.** `domain/ranking.ts` —
`rankFeed`, `scoreCandidate`, `DEFAULT_WEIGHTS` — combines **interest similarity** (cosine on
the 1536-d embeddings) ∩ **geo distance** ∩ **recency** ∩ **capacity-remaining** into a
ranked, explainable order. Feature contributions are exposed per card ("why you're seeing
this" — mutual interests), and weights are tunable without code change (the golden-test
harness guards against regressions). Distance math is real Haversine (`domain/geo-distance.ts`),
not approximated.

**Event data model + geo.** `event` table: `location geography(Point,4326)` (PostGIS),
`geocell` (H3 res 8, app-computed), `embedding vector(1536)`, `status`, capacity{min,max},
visibility{public, interest_match, invite}, age range. GiST index on `event.location`, HNSW
on `event.embedding` and `profile.interest_embedding` (`sql/30_indexes.sql`), composite
`(home_city_id/city, starts_at, status)` feed index with a partial `WHERE status='open'`.

**Location privacy in the feed (RISK_ANALYSIS).** Non-members read the **location-free
`feed_event` view** — geocell + venue name only, never the precise point. `domain/
location-privacy.ts` (`canReleasePreciseLocation`, `fuzz`) governs the centroid the client
sees; precise coordinates are released only by the BFF, only to approved members, only within
`PRECISE_LOCATION_RELEASE_WINDOW_MINUTES` (30) before start.

**Discovery constants.** `DISCOVERY` — 5 km default radius, the radius-fallback ladder
(5 → 10 → 20 → 40 km) so cold geocells never render empty, the liquidity floor (≥40 events/
week), `GEOCELL_RESOLUTION = 8`. Beachhead seed center = Kadıköy (`BEACHHEAD.seedCenter`).

**People-discovery privacy.** Candidate-people surfacing respects RLS + blocks (`is_blocked`,
`public_profile` view) and never exposes private fields (no birthdate/PII).

**Analytics.** Feed events in the typed taxonomy (impression, card_tap, filter_used) for
offline ranking eval.

---

## Decisions made

- **pgvector ANN + PostGIS in one query** — no external search infra until a measured p95
  trigger (ADR-003).
- **Redis cache keyed by `{geocell, interest_cluster, filters}`** with short TTL +
  invalidation on event create/update via Inngest (caching design in
  [`../ARCHITECTURE.md`](../ARCHITECTURE.md) §6).
- **Ranking is a pure function**, not a SQL-buried heuristic — explainable, unit-tunable, and
  testable with golden fixtures.
- **Embeddings L2-normalized → cosine `<=>`** (ADR-011), versioned for safe re-embed.

---

## Tests

| Acceptance criterion (roadmap) | Satisfied by |
|---|---|
| Interest-matched events outrank merely-nearby ones | `domain/ranking.test.ts` (7) golden cases |
| Distance math correct (no approximation) | `domain/geo-distance.test.ts` (4) Haversine |
| **Precise coordinates never leave the server** for non-approved users | `domain/location-privacy.test.ts` (6) + `feed_event` view in `db/src/rls.test.ts` |
| People-discovery respects RLS + blocks | `public_profile` view + `is_blocked` (RLS tests) |
| Weights tunable without regression | golden-fixture harness in `ranking.test.ts` |

**Totals:** part of the 78 domain unit tests; ranking + geo + location-privacy = 17 tests
directly covering Phase 2; RLS view behavior covered in the 6 db tests.

```bash
pnpm --filter @tayfa/shared test    # includes ranking/geo/location-privacy
```

---

## CI status

Same as Phase 1: the four workflows are committed and validated locally (green here for the
implemented layers); GitHub Actions has not yet run (push pending the user's authorization).

## Known issues / pending

- **Live PostGIS `ST_DWithin` × pgvector candidate query against real infra:** the BFF feed
  Route Handler is **built** and runs in mock mode (`rankFeed` is the pure re-rank it applies
  over candidates); the live SQL candidate-generation query latency (<150 ms p75 budget) +
  load test remain **pending** real infra.
- **Redis feed cache + Inngest cache-warming:** designed, not wired (no Upstash key in mock
  mode); the Inngest cache-warming function bodies are not yet implemented.
- **Feed UI** (event cards, mutual-interest chips, filters, empty-state CTA): **built and
  typecheck-green**; end-to-end runtime validation pending (the hooks need a running BFF).
- Synthetic Istanbul event seeding for load testing: `seed.ts` runs clean (60 events with
  geography + pgvector + H3 on Docker Postgres); bulk load-scale geocell seeding pending the
  live DB.

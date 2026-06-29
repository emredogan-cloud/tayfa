# Phase 4 Report — Smart Matching & AI

**Date:** 2026-06-29 · **Status:** implemented + verified (CI green); live real-AI gated by OpenAI account quota.

Phase 4 turns the interest graph into a production matching + AI layer, and begins the mission's overarching objective — **progressively replacing mock infrastructure with real production paths** (keeping `TAYFA_PROVIDER_MODE=mock` as the keyless/CI default; production activates per-key).

## Completed work

**Real AI providers (replacing the mock stubs):**
- `apps/web/lib/ai.ts` — a real OpenAI-compatible HTTP client (no heavy SDK):
  - `embedText` → **OpenAI `text-embedding-3-small`** (1536-d, L2-normalized for cosine).
  - `generateIcebreakers` → **Vercel AI Gateway / Claude Haiku** when `AI_GATEWAY_API_KEY` is set, else **OpenAI** chat, else a deterministic **template** fallback. Injection-safe (interests are inserted as DATA; the system prompt forbids following them).
  - `moderateTextOpenAI` → **OpenAI Moderation** (`omni-moderation-latest`).
- `apps/web/lib/providers.ts` — **per-provider hybrid factory**: each provider is its REAL adapter when its env key is present, the deterministic mock otherwise. `TAYFA_PROVIDER_MODE=mock` is a hard all-mock override (CI/keyless default). Embeddings + text moderation are now real with `OPENAI_API_KEY`; generative is real with the gateway or OpenAI.
- **Fail-safe posture (mission §P4 / RISK_ANALYSIS):** embeddings unavailable → throw (caller falls back to text/geocell feed); generation unavailable → template (fails OPEN, cosmetic); text moderation unavailable → flagged/hold (fails CLOSED).

**Matching domain (`packages/shared/domain/recommendation.ts`):**
- Ranking v2 — blends the base relevance score (interest ∩ distance ∩ recency ∩ capacity ∩ reliability ∩ serendipity) with **behavioural affinity** and **social proof**.
- `explainRecommendation` — the **"Why am I seeing this?"** reasons (shared interests, social proof, proximity, host reliability), PII-free, capped at 3.
- `meetupPropensity` — the **guardrail** metric (predicted completed-meetup lift, NOT tap-rate) the eval harness scores ranking changes against.
- `needsReembed` — embedding model/version drift → versioned re-embed (sticky dimension, ADR-011).

**Embedding pipeline + pgvector:**
- `packages/db/src/embed.ts` — real OpenAI embedding for the seed/verification (mock fallback when keyless or on API error — verified: the seed did not crash on a 429, it warned and fell back).
- `packages/db/src/verify-matching.ts` (`pnpm --filter @tayfa/db db:verify-matching`) — embeds a query and runs the real **pgvector cosine ANN** (`<=>`) over seeded events.
- **Migrations made idempotent** — RLS policies are dropped-then-recreated, so a re-applied migration no longer fails on `CREATE POLICY ... already exists`.

## Tests
- `packages/shared`: **87 unit tests pass** (9 new for recommendation), ~98.6% statements / ~88.9% branches on the domain (≥ thresholds).
- `packages/db`: RLS suite **6/6** against real Postgres+PostGIS+pgvector; idempotent re-migration confirmed.
- pgvector cosine ANN mechanism verified directly (correct nearest-neighbour ordering + HNSW index).
- `apps/web`: `next build` green (16 routes); AI client + factory compile and bundle.

## Decisions
- Raw fetch over the AI SDK for the embedding/generation client — zero new deps, works identically against OpenAI and the AI Gateway by swapping base URL + model + auth.
- Per-provider hybrid (real-when-keyed) rather than a global mock/prod switch — implements "production activates when keys present" while preserving keyless/CI mock.
- Seed + verification embeddings reuse the SAME model/normalization as the BFF (`EMBEDDING` constant) so vectors are consistent across writers.

## CI status
Committed and pushed; CI + Security green on the latest commit (lint, typecheck, unit, RLS-on-real-Postgres, web build, coverage gate, pnpm audit, gitleaks, Trivy, CodeQL).

## Known issues / pending
- **Live real-AI is gated by the OpenAI account quota** (HTTP 429 — the same billing cap that stopped the recap-card asset). The adapter + `verify-matching.ts` are real and ready; semantic-quality demonstration runs the moment quota is restored. Mechanism (operator/index/fallback) is verified.
- **On-device re-validation pending** — the physical device is currently disconnected. P4 adds **no new mobile screens**; the matching surface (ranked feed, "why you're seeing this", icebreakers) was validated on-device in the P1–P3 pass and the installed APK has no native changes (see `PHASE_4_DEVICE_REPORT.md`).
- Still mock pending keys (per the hybrid factory): Persona, RevenueCat, Hive/Rekognition image moderation, Expo Push, Inngest function bodies (candidate-gen/re-embed jobs are designed; bodies live with the BFF).

# Phase 6 Report — Retention Engine (the habit moat)

**Date:** 2026-06-29 · **Status:** implemented + verified (typecheck/lint/tests/build green; CI pending push).

P6 turns one-off meetups into a habit — crews, streaks, recurrence, shareable recaps, and lifecycle journeys — WITHOUT dark patterns. Per ROADMAP §6 (retention loops D1/D7/D30) and GROWTH_STRATEGY §7 (positive/identity framing, never guilt or loss). Every nudge is gated by the same server-side notification caps built in earlier phases; safety/anti-spam invariants are never relaxed for engagement.

## Completed work

**Retention decision core — `packages/shared/src/domain/retention.ts` (pure, exhaustively tested):**
- **Crew formation (the D30 engine)** — `shouldSuggestCrew()` fires on repeat co-attendance (≥2 shared meetups) **plus** a mutual "would meet again"; `crewCandidatesFromCluster()` extracts the deduped qualifying members from a cluster's pairwise signals. Conservative by design — a crew suggestion is a strong social act, so it needs a real signal, not a single overlap.
- **Streaks (positive, graceful)** — `computeStreak()` counts the current weekly run from the most-recent week, tracks the longest run, and emits **identity/positive copy** (“N weeks of real plans 🎉 — you’re building something”). A missed week breaks gracefully to a **“fresh start”** message — never guilt, never a loss-frame countdown (GROWTH §7).
- **Recurrence** — `nextRecurrence()` advances a crew's cadence (`weekly | biweekly | monthly`); `ad_hoc` has no schedule → `null`.
- **Recap cards (shareable, privacy-safe)** — `buildRecapCard()` builds a post-meetup recap from **neighborhood + counts + average vibe ONLY** — never a precise pin, address, or attendee name/PII. Privacy is enforced in this one tested place (a test asserts no lat/long-precision numbers leak into the serialized card).
- **Lifecycle journeys** — `selectLifecycleJourney()` places a user in exactly one journey by priority (activate-first-meetup → post-meetup rebooking → crew ritual → lapsing win-back), returning `null` for a freshly-active user who needs no nudge. `decideLifecycleSend()` then runs that journey **through `canSendNotification`** so a lifecycle nudge can never jump the per-category or global daily cap, and respects user mutes (`muted` / `category_cap` / `global_cap` reasons surfaced for observability).

**Lifecycle provider (per-key hybrid, real when keyed):**
- New `LifecycleProvider` adapter contract (`enqueue`, `syncAudience`) added to `packages/shared/src/adapters/types.ts` + wired into the `Providers` bundle.
- `MockLifecycleProvider` (deterministic, records enqueued events) added to `createMockProviders()` — the keyless/CI default.
- `BrazeLifecycleProvider` (`apps/web/lib/providers.ts`) makes **real Braze REST `/users/track` calls when `BRAZE_API_KEY` is present**, EU endpoint by default (`rest.fra-01.braze.eu`, KVKK/GDPR data residency). Lifecycle is non-critical: on outage it **no-ops** (a missed win-back is not a safety risk) and never throws into the request path. Caps are enforced by the domain BEFORE enqueue, so the adapter never jumps a frequency cap.
- Env accessors `brazeApiKey` / `brazeRestEndpoint` added; documented in `.env.example`. `TAYFA_PROVIDER_MODE=mock` remains the hard override.

**Shareable recap surface — `apps/web/app/api/og/recap/[eventId]/route.tsx`:**
- A dynamic OG image rendered from the tested `buildRecapCard` (headline + vibe/where/crew stats), driving the install loop (GROWTH §virality). Best-effort DB fetch with a branded fallback card; cached 1h. Privacy by construction — reuses the domain builder so the "neighborhood + counts only" rule lives in one audited place. Complements the existing pre-event `/api/og/[eventId]` card and `/share/[eventId]` page.

## Provider posture (per-key hybrid, unchanged invariant)
- **Real:** OpenAI embeddings + text moderation + generation (P4); **Braze lifecycle (P6)** when keyed.
- **Fail-closed stubs (pending keys):** Persona ID/liveness, Hive/Rekognition image moderation, RevenueCat billing, Expo push.
- **Mock default:** every provider falls back to its deterministic mock; `TAYFA_PROVIDER_MODE=mock` forces all-mock for CI/determinism.

## Tests
- `packages/shared`: **121 unit tests pass** (16 files; +15 for `retention.ts`). `retention.ts` 100% coverage; domain aggregate ~98.4% statements / ~90.6% branches (≥ thresholds).
- `apps/web`: `next build` green — **17 routes**, including the new `ƒ /api/og/recap/[eventId]`.
- `packages/db`: RLS suite still **6/6** (deny-by-default isolation intact; no schema change this phase).
- Typecheck (shared + web) clean; ESLint + Prettier clean.

## Decisions
- **No dark patterns, by construction.** Streaks use positive/identity framing and break to "fresh start"; there is no loss-frame countdown, no guilt copy, no manufactured FOMO. This is a product-values line from GROWTH §7, enforced in the tested copy.
- **Caps win over engagement, always.** Every lifecycle send routes through the existing `canSendNotification` caps + user mutes. A retention nudge is structurally incapable of exceeding the daily ceiling — the engagement system cannot override the anti-spam system.
- **Recaps carry zero precise location / PII.** The recap builder is the single chokepoint; the OG route renders only what it returns. A test guards against precision leakage.
- **Lifecycle fails soft, safety fails closed.** Braze outages no-op (acceptable for a win-back); this is the deliberate opposite of verification/moderation, which deny on outage.
- **Crew suggestion is conservative.** Requires repeat co-attendance + mutual intent — avoids spamming weak ties with "form a crew" prompts.

## CI status
Committed + pushed on completion; CI + Security expected green (lint, typecheck, unit, RLS, web build, coverage, audit, gitleaks, Trivy, CodeQL). Updated here once the push run is confirmed.

## Known issues / pending
- **Inngest orchestration** of lifecycle journeys (scheduled send-time optimization, the weekly streak rollup, crew-ritual reminders) is designed; `decideLifecycleSend` / `selectLifecycleJourney` / `nextRecurrence` are the pure decisions those durable functions will call. Job bodies land with the Inngest wiring pass.
- **Braze** is real-when-keyed but unexercised against a live workspace in CI (mock default). Real-send is covered by the adapter's fail-soft contract.
- **Crew persistence** (the `crew` / `crew_member` / `crew_event` tables from ROADMAP §data-model) is schema-designed; this phase ships the formation/ritual decision logic that sits on top of it.
- On-device re-validation pending device reconnection — P6 adds no new **mobile consumer screens** (recap is a web/OG share surface; crews/streaks/lifecycle are server-side decision logic). See `PHASE_6_DEVICE_REPORT.md`.

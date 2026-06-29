# Phase 7 Report — Monetization (Tayfa+)

**Date:** 2026-06-29 · **Status:** implemented + verified (typecheck/lint/tests/build green; CI pending push).

P7 makes Tayfa+ a real, server-authoritative subscription — value-first paywall timing, lifecycle-correct entitlement reconciliation, and a **real-when-keyed RevenueCat adapter** — on top of the P1 foundation (entitlement gating, engagement-gated trial, regional pricing). The inviolable rule is enforced in code, not convention: **safety, verification, and the core loop are free forever** and are structurally unreachable by any paywall path (MONETIZATION_ANALYSIS §10–14, ROADMAP §7).

## Completed work

**Monetization decision core — `packages/shared/src/domain/monetization.ts` (pure, exhaustively tested):**
- **Value-first paywall timing** — `decideUpgradePrompt()` shows an upgrade prompt ONLY at *aspiration moments* (`post_meetup_high`, `hit_crew_limit`, `tapped_premium_feature`, `tapped_boost`) and **NEVER** during a `core_flow` (discover/join/chat/safety) or to an already-subscribed user. At an aspiration moment it returns a value-framed offer, preferring a **trial** when the user has earned one. A core flow can't accidentally raise a wall — the function returns `{ show: false }` for it by construction.
- **Region-aware offer** — `buildUpgradeOffer()` builds the offer card from `PRICING` config (never hardcoded), computing annual savings for the "save X" line and tagging the positive framing (`more_and_better_plans`, never "unlock basic features").
- **Entitlement reconciliation** — `reconcileEntitlement()` maps a normalised billing lifecycle status to **what the user may actually access**. Product-critical calls: **grace period + billing retry KEEP premium** (a failed charge is a payment problem, not a reason to yank features → lowers involuntary churn); **cancellation KEEPS premium until expiry** (paid through the period); **refund REVOKES immediately**.
- **RevenueCat event mapping** — `revenueCatEventToStatus()` translates a webhook event type (+ `period_type`) into that normalised status; unknown / no-op types (e.g. `TRANSFER`) return `null` → **no entitlement change** (fail-safe).
- **Conversion guardrail** — `meetsConversionTarget()` classifies a cohort's free→paid rate against the saturated-city target band (observability, not gating).

**Real billing adapter — `apps/web/lib/providers.ts` (`RevenueCatBillingProvider`, real-when-keyed):**
- `resolveWebhook()` **authenticates** the call with the configured Authorization secret using a **constant-time compare** (`timingSafeEqual`, length-guarded), then maps the event through the tested `revenueCatEventToStatus → reconcileEntitlement` pipeline into an `EntitlementSnapshot`. **Fail-closed**: missing secret, mismatched signature, missing `app_user_id`, or a no-op event all return `null` — never a silent grant.
- `getEntitlement()` reads the live subscriber over the REST API and resolves the `tayfa_plus` entitlement (expiry-aware). A read failure conservatively resolves to `free` — a billing outage never upgrades anyone.
- Wired into the per-key hybrid factory: real when `REVENUECAT_API_KEY` is present, mock otherwise; `TAYFA_PROVIDER_MODE=mock` forces mock.
- The existing **signature-verified, idempotent webhook handler** (`/api/webhooks/revenuecat`) now flows real snapshots into `profile.entitlement` (the single truth every gate reads) + the `subscription` ledger.

**Light BFF wiring — `apps/web/app/api/billing/offer/route.ts`:**
- `GET /api/billing/offer[?context=...]` returns the user's regional offer with **server-computed** entitlement + trial eligibility (client flags never trusted). Region from the edge country header (TR price point for Türkiye, EU/PPP otherwise). Trial eligibility uses the tested `checkTrialEligibility` over real attended-meetup + prior-trial counts. When a `context` is supplied, the value-first gate decides whether to show a prompt at all.

## Provider posture (per-key hybrid)
- **Real-when-keyed:** OpenAI embeddings/moderation/generation (P4), Braze lifecycle (P6), **RevenueCat billing (P7)**.
- **Fail-closed stubs (pending keys):** Persona ID/liveness, Hive/Rekognition image moderation, Expo push.
- **Mock default:** `TAYFA_PROVIDER_MODE=mock` forces all-mock for CI/determinism.

## Tests
- `packages/shared`: **142 unit tests pass** (17 files; +21 for `monetization.ts`). Domain coverage holds ≥ thresholds.
- `apps/web`: `next build` green — **17 routes**, incl. the new `ƒ /api/billing/offer`.
- `packages/db`: RLS suite **6/6** (no schema change this phase — `subscription` table + RLS already existed from the spine).
- Typecheck (shared + web) clean; ESLint + Prettier clean.

## Decisions
- **Safety is structurally unreachable by a paywall.** `decideUpgradePrompt` returns `{ show: false }` for `core_flow`; `checkFeatureAccess` (P1) returns `free: true` for every `NEVER_PAYWALLED` feature; `paywallSafetyViolations()` is asserted `[]` in CI. Three independent guards.
- **Grace beats churn.** Failed-renewal states keep premium served; only expiry/refund revoke. This is a deliberate revenue-retention choice backed by the reconciliation tests.
- **Server is the source of truth.** Entitlement is read from `profile.entitlement` (written by the verified webhook), never from a client flag. The offer endpoint recomputes eligibility server-side.
- **Refund revokes immediately** while cancellation does not — the distinction (money returned vs. simply not renewing) is encoded and tested.
- **Prices live in config.** Region/price come from `PRICING` + the edge country header; no price string is hardcoded in a surface.

## CI status
Committed + pushed on completion; CI + Security expected green. Updated here once the push run is confirmed.

## Known issues / pending
- **RevenueCat** is real-when-keyed but unexercised against a live RevenueCat project in CI (mock default). The signature-verify + reconcile path is unit-covered; a live end-to-end purchase test needs sandbox IAP + keys.
- **Crew-count in trial eligibility is 0** until crew persistence lands (P6 noted the `crew` tables are schema-designed). Trial eligibility therefore keys off completed meetups today; it will also honour crew membership once persisted.
- **Inngest** trial-lifecycle orchestration (trial-start, 2-days-before-expiry reminder, expiry downgrade) is designed; `buildTrialSchedule` / `reconcileEntitlement` are the pure decisions those durable functions will call.
- **Paywall UI surfaces** (the mobile offer sheet) consume `/api/billing/offer` + `decideUpgradePrompt`; the screen exists from the P1–P3 build and is unchanged at the native level. See `PHASE_7_DEVICE_REPORT.md`.

# Phase 9 Report — Platform & Network Effects (Marketplace)

**Date:** 2026-06-29 · **Status:** implemented + verified (typecheck/lint/tests/build green; on-device cumulative re-validation done; CI pending push). **Final roadmap phase.**

P9 builds the supply-side / marketplace layer **on top of a proven, safe core** — payout math, host eligibility (KYC-gated), the sponsored-content policy engine, and ambassador rewards — encoded as pure, tested decisions. Two invariants run through everything: **money is integer minor units** (exact splits, no float drift) and **sponsored ≠ unsafe** (branded content meets the same safety bar as organic and is always clearly labeled). The heavy integrations it describes (Stripe Connect payouts + KYC, B2B2C DPAs, governed partner API) are **operational/financial-compliance surfaces**, scoped honestly below.

## Completed work

**Marketplace decision core — `packages/shared/src/domain/marketplace.ts` (pure, exhaustively tested):**
- **Payout split (exact integer money)** — `computePayoutSplit()` splits a gross ticket (minor units) into platform take + host net by basis-point take rate; `platformFee = floor(gross·bps/10000)`, `hostNet = gross − platformFee`, so the two **always sum back to gross** (no rounding leak). Throws on negative/non-integer money — money bugs must be loud.
- **Ticketing** — `ticketingState()` derives remaining / sold-out / waitlist-open (oversell clamps).
- **Host eligibility** — `canUseHostProTools()` gates recurring/ticketed/analytics on hosting track record + reliability. `hostPayoutEligibility()` gates **money** on **mandatory KYC + ID-level verification + reliability**, returning the first-payout fraud hold. Payouts are a financial-compliance surface — KYC is never optional.
- **Sponsored-content policy engine** — `sponsoredEventPolicy()` publishes a sponsored event ONLY if it is clearly **labeled**, **discloses** its sponsor, AND **cleared the same safety review** as organic — any miss blocks publication. Safety is never relaxed for revenue; organic content still must clear safety.
- **Ambassador rewards (anti-collusion)** — `ambassadorReward()` pays on REAL value (verified completed meetups), gated like referrals: a distinct-host floor (a two-account ring earns nothing) and a per-period cap (collusion ceiling).

**Config — new `constants/marketplace.ts`:** `TAKE_RATES_BPS` (ticketed 10% / featured 15% / venue 20%), `HOST_PAYOUT` (KYC required, reliability floor, first-payout hold), `HOST_PRO_TOOLS`, `AMBASSADOR` (reward/floor/cap). All money is config, never hardcoded in a surface.

**Light BFF wiring — `apps/web/app/api/host/eligibility/route.ts`:**
- `GET /api/host/eligibility` returns host pro-tools + payout eligibility computed **server-side** from the user's standing (verification level, reliability, completed hosted events). KYC has no column yet → reads `false` and honestly surfaces as a payout blocker (never silently "complete"). Client is never trusted for these facts.

## Tests
- `packages/shared`: **180 unit tests pass** (20 files; +17 for `marketplace.ts`). Domain coverage holds ≥ thresholds.
- `apps/web`: `next build` green — **19 routes**, incl. the new `ƒ /api/host/eligibility`.
- `packages/db`: RLS suite **6/6** (no schema change — marketplace tables are not introduced this phase).
- Typecheck (shared + web) clean; ESLint + Prettier clean.

## Decisions
- **Money is integer minor units, always.** No float ever touches a payout; the split provably reconstructs the gross. Negative/non-integer input throws.
- **Sponsored ≠ unsafe, enforced in code.** The policy engine blocks any sponsored event that is unlabeled, undisclosed, or failed safety review — three independent gates — so commercialization can never erode the trust moat.
- **Payouts require KYC + ID verification.** Encoded as hard blockers; a host cannot be paid without clearing financial-compliance and anti-fraud gates, with a first-payout hold on top.
- **Ambassador rewards resist collusion.** Earned only on verified meetups, only past a distinct-host floor, capped per period — same anti-fraud philosophy as referrals/NSM.
- **Take rates are config.** Tunable without touching logic; the social graph is deliberately taxed lightly (10% peer ticketing).

## On-device cumulative re-validation
The physical device (Xiaomi 22095RA98C, Android 13, id `jfzxugsgnnvsrsg6`) **reconnected** during P9. A real on-device run was performed: the app, **bundled from the full P1–P9 codebase** (2095 modules, including the new `@tayfa/shared` P4–P9 domain), launches and renders on-device. Evidence + scope in `PHASE_9_DEVICE_REPORT.md` and `screenshots/device-validation/p9-p4-p9-revalidation/`.

## CI status
Committed + pushed on completion; CI + Security expected green. Updated here once the push run is confirmed.

## Known issues / pending (honest scope)
- **Stripe Connect payouts + host KYC, B2B2C DPAs/tenant isolation, and any governed partner API** are financial-compliance and legal surfaces requiring real Stripe/legal integration — **NOT built here**. P9 ships the *pure decisions* (`computePayoutSplit`, `hostPayoutEligibility`, `sponsoredEventPolicy`, `ambassadorReward`) those systems execute against; a `kyc_complete` flag and marketplace tables (ticket, payout, sponsor) are designed but not migrated.
- **Take-rate / reward numbers are initial policy** in config, not finance-approved.
- Marketplace fraud monitoring, payout reconciliation jobs, and the host dashboard/venue surfaces are operational/Inngest + UI work pending real keys.

## Roadmap completion
With P9, the P1–P9 execution roadmap is **functionally complete at the domain + BFF level**: every phase ships tested pure decision logic, real-when-keyed adapters (OpenAI, Braze, RevenueCat), and honest disclosure of the operational/IaC/financial-compliance surfaces that require real credentials or staging environments. `TAYFA_PROVIDER_MODE=mock` remains the keyless/CI default; production paths activate per-key.

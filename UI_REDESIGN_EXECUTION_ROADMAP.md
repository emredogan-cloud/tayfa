# Tayfa — UI Redesign Execution Roadmap

**Status:** ACTIVE · **Started:** 2026-06-30 · **Owner:** autonomous (CTO / Staff Mobile / Design Systems / QA / Release)
**Design source of truth:** `screenshots/re-design/` (26 redesigned screens). Target fidelity **≥90/100**.
**Asset policy:** generate only missing assets via OpenAI Images API (`OPENAI_API_KEY` in `.env`), ≤ **$15** total, tracked in `OPENAI_IMAGE_USAGE_REPORT.md`. Never use external/internet assets.

## Design language (reverse-engineered)

- **Canvas** warm cream `#FBF7F2`/`#FFFBF7`; **cards** white, radius ~24, soft warm shadow (no hard black). **Chips/buttons** pill or radius ~16–20.
- **Type**: heavy bold display headings; **two-tone headlines** (ink black + one ember accent word, e.g. "What's your **number?**"); gray (`inkMuted`) body.
- **Color roles**: ember `#FF5A3C` = primary/energy; teal `#0E9F8E` = verified/going; grape `#7A5AF8` = Tayfa+/premium; amber `#FF9F1C` = Top Host/highlights; women `#C24AAE`.
- **Illustration**: (a) flat warm people scenes for social/discovery; (b) **3D clay mascot** (ember blob character) + clay objects for hero/auth/safety moments. Floating interest-icon badges in soft circular chips.
- **Patterns**: onboarding 3-step progress bar; language selector pill; country-code phone picker; CTA buttons with trailing `→`; trust-badge rows (icon + 2-line label, dividers); photo-led event cards with category badge overlay + heart favorite; attendee avatar stacks; labeled circular header icon-buttons.

## Engineering constraints

- Monorepo, pnpm+Turborepo, strict TS, ESM `.js` specifiers. Mobile = Expo SDK 52 / RN 0.76 / Expo Router v4 / NativeWind 4.1.23 / Hermes. Keep `tokens.ts` ↔ `tailwind.config.js` in sync.
- Every phase: `lint` → `typecheck` → `test` → `build`; commit → push → **CI green** before next phase. Device validation when the Xiaomi is attached, else record "Device validation skipped (device unavailable)" and continue.
- Safety is never gated; fail-closed verification/age; precise location never leaves server for non-approved users. `EXPO_PUBLIC_ALLOW_MOCK` demo-only.

---

## Phase 0 — Design-system foundation & asset pipeline
**Objective:** make every later screen a thin re-skin by upgrading tokens + core components, and stand up the OpenAI asset pipeline.
**Engineering:** refresh `tokens.ts`/`tailwind.config.js` (radii, shadows, accent helpers); upgrade design-system: `Text` (add two-tone `Display`/accent support), `Button` (trailing-icon + loading + variants), `Card`, `Chip` (icon + tint variants), new primitives `ProgressDots`, `TrustRow`, `AvatarStack`, `SegmentedProgress`, `IllustrationImage`/`AssetImage` (typed registry under `src/assets/illustrations`). Add `scripts/generate-assets.mjs` (Node, reads `OPENAI_API_KEY`, writes PNGs, appends usage log).
**Design:** lock spacing/radius/shadow scale to mockups.
**Tests:** component render/unit tests; typecheck; lint. **Acceptance:** existing screens still build & pass CI with new primitives available. **Risks:** token drift → snapshot diffs. **Deliverables:** upgraded design-system, asset pipeline, `PHASE_0_REPORT.md`.

## Phase 1 — First onboarding screen + onboarding-persistence bug
**Objective:** ship `0001-first-onboarding.png` as the first-run screen; fix the "returns to onboarding after reopen" bug.
**Engineering:** new `app/(onboarding)/welcome.tsx` (or index gate) shown on first launch; "Get started" → phone, "Continue with Google" (wire to Supabase OAuth, graceful mock fallback), "Log in". Persist onboarding-complete + session via SecureStore; fix index routing so a completed user never sees onboarding again. **Generate** the hero illustration asset.
**Tests:** unit test the first-run gate (first/second/third launch, after reboot/reinstall). **Acceptance:** fresh install → welcome → app; reopen → straight to app; ≥90% fidelity. **Deliverables:** screen, asset, `PHASE_1_REPORT.md`.

## Phase 2 — Auth flow redesign
**Screens:** `o1-auth-phone`, `02-auth-otp`, `03-age-gate`. Two-tone headlines, 3-step progress bar, language selector, country-code picker, 3D mascot hero, trust rows, CTA→arrow. **Generate** mascot/OTP/age clay illustrations. Keep fail-closed age gate. `PHASE_2_REPORT.md`.

## Phase 3 — Onboarding content redesign
**Screens:** `04-interests`, `05-consent`, `06-profile`. Progress bar continuity, chip grid, consent toggles, profile setup. `PHASE_3_REPORT.md`.

## Phase 4 — Discover, event detail, ranking
**Screens:** `07-feed`, `08-feed-filters`, `09-event-card`, `09b-ranking-explanation`, `10-event-detail`. Photo-led cards + category badges + heart + avatar stack + Top Host badge; illustrated liquidity banner; Filters sheet; neighborhood-privacy detail. **Generate** representative event photos for mock data. `PHASE_4_REPORT.md`.

## Phase 5 — Chat, create, crews
**Screens:** `11-chat`, `12-chat-icebreakers`, `13-create-event`, `17-crews`. `PHASE_5_REPORT.md`.

## Phase 6 — Safety, trust & monetization surfaces
**Screens:** `14-safety-center`, `15-report-flow`, `16-block-flow`, `19-paywall`, `20-settings`, `25-verify-to-host`, `22-empty-state` + loading/error states. `PHASE_6_REPORT.md`.

## Phase 7 — Profile, Edit Profile, Sign Out & Delete Account
**Screens:** `18-profile`, `26-edit-profile`. **Bugs:** Sign Out → confirmation dialog, clear nav stack (no back into authed app); Delete Account → modern modal (DELETE text field, optional reason, warning, loading/error/success). `PHASE_7_REPORT.md`.

## Phase 8 — Notification Center (new)
**Objective:** implement the missing notifications surface. Grouped notifications (meetup reminders, crew activity, host announcements, safety alerts, payment updates, system), unread indicators, empty/loading/error/populated states. Backend: BFF route + shared schema + mock. Entry point from header. `PHASE_8_REPORT.md`.

## Phase 9 — Travel Mode mobile UI (Phase-8 backend exists)
**Objective:** Discover city selector → BottomSheet (current/home city, travel mode toggle, recently visited, Istanbul/Ankara/İzmir, liquidity indicators), wired to existing backend. `PHASE_9_REPORT.md`.

## Phase 10 — Marketplace + Host Panel mobile UI (backend exists)
**Screens:** Host Dashboard, Venue Dashboard, Sponsored Events, Payout Summary, Verification Status, Upcoming Earnings, Applications, Featured Listings, Marketplace Discover, Booking Requests, Host Analytics. Match redesign language; **generate** required assets. `PHASE_10_REPORT.md`.

## Phase 11 — Asset finalize, device validation, final report
Finalize `OPENAI_IMAGE_USAGE_REPORT.md`; standalone release build + on-device validation + fresh screenshot harvest; `FINAL_EXECUTION_REPORT.md` (phases, architecture, UX, screenshots, assets, OpenAI usage, limitations, production/beta readiness, recommendations).

---

### Execution order & cadence
Sequential 0→11. Each phase is independently CI-green and reported. Visual fidelity verified against the corresponding `screenshots/re-design/*.png` (re-harvest on device where possible). Asset generation happens within the phase that first needs each asset; reused thereafter.

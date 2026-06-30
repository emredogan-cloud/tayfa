# Phase 1 — First onboarding screen + onboarding-persistence wiring

**Status:** ✅ complete · mobile lint + typecheck + shared tests green · Date: 2026-07-01

## Objective
Ship `0001-first-onboarding.png` as the first screen every first-time user sees, integrated into the onboarding flow, and consume the persisted `hasSeenWelcome` first-run gate (persistence mechanism landed in Phase 0).

## Implementation
- **Asset (generated, ≥90% fidelity):** added manifest spec `onboarding-welcome-illustration` and generated `assets/generated/onboarding/welcome-illustration.png` via the existing `gpt-image-1` pipeline — a flat illustration of four diverse friends with floating interest badges (bike, coffee, music, hiking), a soft peach blob with a faint Istanbul skyline + sparkles, transparent background. Matches the redesign's flat-illustration style (the pre-existing `welcome-hero.png` was photographic with baked-in text and did not fit). Bundled to `apps/mobile/assets/illustrations/welcome-people.png`.
- **Asset registry:** `src/lib/illustrations.ts` — one typed import site for bundled illustrations; `assets.d.ts` declares `*.png/.jpg/.webp` modules for tsc.
- **Screen:** `app/(onboarding)/welcome.tsx` — brand wordmark (ember + sparkle), hero headline "Meet up, your way.", subhead, the people illustration, the four pillars (Small crews / Safe & verified / Find your vibe / Host with ease) in a card with soft-tinted icon badges, a primary "Get started" CTA (with the new `Button` trailing arrow), "Continue with Google" (secondary), and "Already have an account? Log in".
- **Routing / first-run gate:** `app/index.tsx` now sends unauthenticated **first-time** users to `/(onboarding)/welcome` and returning users straight to `/(auth)/phone`, keyed on the persisted `hasSeenWelcome`. Each welcome CTA sets `hasSeenWelcome` (persisted via the Phase-0 write-through), so the intro shows once and never again until reinstall.
- **Google auth:** `continueWithGoogle` attempts Supabase OAuth in configured builds (`supabaseReady`) and gracefully falls through to the verified phone-OTP flow in demo/mock builds — no new dependencies, nothing half-wired.
- **Analytics:** added `welcome_cta_tapped` (method: get_started | google | log_in) to the shared taxonomy; consumed by the screen. Shared taxonomy test stays green.

## Tests
- `@tayfa/shared` typecheck ✅, vitest **180/180 pass** (incl. taxonomy consistency).
- `@tayfa/mobile` typecheck ✅, lint ✅. Prettier clean.
- Standalone release APK builds successfully (`assembleRelease`, 38.6 MB, asset embedded).

## Device validation
**Device validation skipped (device unavailable)** — the Xiaomi (`jfzxugsgnnvsrsg6`) physically disconnected mid-phase and `adb reconnect`/`kill-server` could not recover it. The standalone release APK (welcome-screen build) is built and staged at `apps/mobile/android/app/build/outputs/apk/release/app-release.apk` for the next device pass, where the first/second/third-launch + reboot + reinstall persistence repro and the welcome-screen screenshot will be captured.

## Known issues / follow-ups
- Google OAuth is wired but inert in demo builds (no provider config + deep-link redirect) — falls through to phone, as intended for now.
- On-device visual fidelity check + persistence repro pending device reconnection.

## Deliverables
`welcome.tsx`, `illustrations.ts`, `assets.d.ts`, generated welcome illustration, `index.tsx` gate, `welcome_cta_tapped` event, this report.

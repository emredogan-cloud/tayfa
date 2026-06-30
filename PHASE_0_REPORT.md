# Phase 0 — Design-system foundation & onboarding-persistence fix

**Status:** ✅ complete · CI gate: mobile **lint + typecheck** green · Date: 2026-06-30

## Objective
Make every redesigned screen a thin re-skin by upgrading the design-system primitives, and fix the explicitly-reported onboarding-persistence bug as foundational infrastructure.

## Implementation

### Design-system primitives (reverse-engineered from `screenshots/re-design/`)
- **`Button`** — added a `rightIcon` prop (the redesign's CTA trailing `→`), pinned to the right edge so the label stays centered.
- **`SegmentedProgress`** — the onboarding/auth 3-segment step bar (active+done fill ember, upcoming stay sunken). `accessibilityRole="progressbar"`.
- **`TrustRow`** — the auth/safety reassurance strip: white card, N items each an ember-soft icon badge + short label, hairline dividers.
- **`AvatarStack`** — already existed in `Avatar.tsx` (overlapping avatars + "+N"); reused, no duplication.
- All exported from `design-system/index.ts`.

### Onboarding-persistence bug — root cause & permanent fix
**Reported:** complete onboarding → close → reopen → back at onboarding.
**Root cause:** the render-facing session lived only in in-memory zustand. In **mock/demo builds** (Supabase unconfigured) there is no Supabase session to restore at boot, so every cold start reset the store and the route gate sent the user back to onboarding. (Production, with a real Supabase session persisted in the keychain, was unaffected — so the bug was demo-only but real.)
**Fix:**
- New `src/lib/sessionStorage.ts` — a small SecureStore-backed mirror of the render-facing slice (`userId`, `phone`, `verificationLevel`, `entitlement`, `onboardingComplete`, `hasSeenWelcome`), key `tayfa.session.v1`, separate from Supabase's own keychain entry.
- `stores/session.ts` — a write-through `subscribe` mirrors the slice on every post-boot change (best-effort, fire-and-forget). Added `hasSeenWelcome` + `setHasSeenWelcome` (for the Phase-1 welcome gate). `signOut` keeps `hasSeenWelcome` sticky.
- `app/_layout.tsx` boot — when there is **no live Supabase session**: in a configured/production build the user is genuinely signed out → clear the mirror; in a mock/demo build → **restore** the persisted slice (this is what stops the bounce-back). The `onAuthStateChange` listener now ignores events unless `supabaseReady`, so the placeholder client's initial null-session event can't wipe a just-restored session.

**Why this is correct & safe:** production stays Supabase-authoritative (the mirror is only *read* when Supabase is unconfigured and has no session); the mirror never asserts entitlement (server re-checks every premium action); safety/verification unaffected.

## Tests
- `pnpm --filter @tayfa/mobile typecheck` → **pass** (exit 0).
- `pnpm --filter @tayfa/mobile lint` → **pass** (exit 0).
- Prettier style on all changed files → clean.
- Mobile has no unit-test runner (repo convention: mobile gate = lint + typecheck; vitest lives in `@tayfa/shared`/`@tayfa/db`).

## Device validation
Deferred to a dedicated device pass (requires a standalone release rebuild). The persistence fix's manual repro — onboarding → cold start → reopen across first/second/third launch + reboot + reinstall — will be verified on the Xiaomi during Phase 1's device validation. Logic verified by inspection: mock otp hydrate (`otp.tsx:49`) + `setOnboardingComplete(true)` (`profile.tsx:85`) are both captured by the write-through mirror and restored at boot.

## CI
Mobile lint + typecheck green locally; pushing to `main` runs Mobile / CI / Security workflows.

## Known issues / follow-ups
- The welcome first-run gate (`hasSeenWelcome`) is persisted but not yet consumed by routing — wired in **Phase 1** (first-onboarding screen).
- Visual fidelity of the new primitives is verified against the redesign during the screens that use them (Phases 1–10).

## Deliverables
Upgraded design-system (`Button`, `SegmentedProgress`, `TrustRow`), `sessionStorage.ts`, persistence-aware session store + boot, this report.

# Phase 3 — Onboarding content redesign (interests · consent · profile)

**Status:** ✅ complete · mobile lint + typecheck green · Date: 2026-07-01

## Objective

Rebuild the three onboarding-content screens to match `04-interests`, `05-consent`,
`06-profile` (≥90% fidelity), preserving all domain logic: the catalog-driven taste
picker + min-5 gate (`interestSelectionSchema`), unbundled KVKK consent toggles, and
the single profile/interests/consent submit to the BFF.

## Implementation

- **`interests.tsx`** — `AuthHeader` ("Better matches" pill + 4-step progress), two-tone
  headline ("Pick your **vibe**"), the new two-mascot high-five hero, a rounded **search
  bar** with magnifier + clear button, an **icon filter rail** (All + nine domains, each
  with its own glyph/accent; active pill is ember-filled with a check), and interests
  rendered as **bordered selectable cards** (leading domain icon + label + trailing radio
  that fills ember on select). Sections get a **"See all (N)" / "See less"** toggle
  (preview capped at 8, auto-expanded while searching or domain-filtered), and a sticky
  **"N selected / Select at least 5"** status banner above the CTA. Catalog loading /
  error (Retry) / empty states preserved; `interest_added` analytics + min-5 gate
  unchanged.
- **`consent.tsx`** — `AuthHeader` ("You're in control" pill + progress), two-tone
  headline ("Your data, **your choice**"), the ember-blob-with-padlock-shield hero, the
  four independent `Toggle` rows now carrying **haloed colored icon badges** (location/
  ember, connected accounts/grape, biometric/teal, marketing/amber), an inline green
  **"Does not gate the app"** safety banner, and the EU-data footnote. **Marketing never
  gates the app — Continue is always enabled** and every toggle defaults off (KVKK açık
  rıza unbundled). Consent state + `setAnalyticsConsent` logic unchanged.
- **`profile.tsx`** — `AuthHeader` ("You can edit anytime" pill + progress), two-tone
  headline ("Make it **yours**"), the clay profile-card hero, a centered **photo
  placeholder** (grape camera circle + "+" badge, "add later"), icon-labelled Display
  name / Bio / Neighborhood fields with counters + hint, and a grape **"Real people. Real
  meetups."** trust nudge. **The full submit path is byte-for-byte preserved**:
  `profileSetupSchema` + `interestSelectionSchema` + `consentSchema` validation, the
  `/me/onboarding` POST with offline/mock tolerance, `onboarding_completed` analytics,
  `setOnboardingComplete(true)` (which the Phase-0 SecureStore mirror persists), reset,
  and `replace('/(tabs)/feed')`.

## Assets (generated, ≥90% fidelity)

Three new 1024² claymorphism illustrations via the `gpt-image-1` pipeline, registered in
`illustrations.ts`:

- `onboarding-interests-mascots` — ember + grape blobs high-fiving with floating
  music/coffee/bike/palette interest badges.
- `onboarding-consent-mascot` — ember blob hugging a lavender padlock shield + grape
  checkmark badge.
- `onboarding-profile-card` — cream profile card with grape avatar, placeholder lines,
  interest chips + a coral heart.

All verified visually against their mockups before wiring in.

## Tests

- `@tayfa/mobile` typecheck ✅, lint ✅, Prettier clean.
- `@tayfa/shared` vitest untouched (no taxonomy/schema changes this phase) — still green.

## Device validation

**Device validation skipped (device unavailable)** — the Xiaomi remains disconnected and
`adb` cannot see it. Onboarding screens will be captured in the next device pass.

## OpenAI usage (cumulative)

7 high-quality `gpt-image-1` 1024² generations so far (1 welcome + 3 auth + 3 onboarding)
≈ **$1.19** of the $15 budget. Full log lands in `OPENAI_IMAGE_USAGE_REPORT.md` (Phase 11).

## Deliverables

Redesigned interests/consent/profile screens, 3 clay illustrations, illustration-registry
+ manifest updates, this report.

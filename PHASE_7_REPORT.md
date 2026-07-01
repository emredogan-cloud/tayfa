# Phase 7 — Profile · Edit Profile · sign-out & delete-account bug fixes

**Status:** ✅ complete · mobile lint + typecheck + Prettier green · Date: 2026-07-01

## Objective

Rebuild the "You" tab and its editor to ≥90% fidelity against `18-profile` /
`20-settings` / `26-edit-profile`, and land the two remaining explicit bug fixes:
**(b)** Sign out must confirm and reset the nav stack, and **(c)** Delete account
must be a modern modal with a type-to-confirm gate and real loading/error states.

## Implementation

- **`(tabs)/profile.tsx` (rewrite)** — centered identity (avatar + camera badge →
  Edit profile, name, a grape "Phone verified" pill / `VerifiedBadge`, location),
  a **reputation card** with Reliability / Safety / Meetups each over a soft-haloed
  glyph, a **bio card** with a 👋 accent, **interest chips** now carrying their
  domain glyph, an outlined **Edit profile** entry, the engagement-gated trial
  card, and a **Settings** list (Safety Center, Tayfa+ with a NEW badge, Sign out,
  Delete account) with sublabels. Inline editing moved out to its own screen.
- **`edit-profile.tsx` (NEW, `26`)** — back / "Edit profile" / **Save** header;
  avatar + camera badge; **Basic info** (Name + Location editable, Phone + Age as
  verified read-only truth); **About you** bio with a live counter; **Interests**
  chips; and a Safety Center row. Saving reuses `useUpdateProfile` →
  `profileSetupSchema` (same validation as onboarding).
- **`lib/interestMeta.ts` (NEW)** — extracted the per-domain glyph/label/accent map
  into one source of truth now shared by the onboarding picker, the profile chips
  and the editor (onboarding `interests.tsx` refactored to consume it).

## Bug fixes

- **(b) Sign out** — the settings row now opens a **`ConfirmDialog`** ("Sign out?")
  instead of signing out instantly. On confirm, `doSignOut` clears Supabase +
  analytics + the session store, then **`router.dismissAll()` (guarded) +
  `router.replace('/(auth)/phone')`** so the back gesture can no longer return to
  the authenticated app.
- **(c) Delete account** — replaced the plain `Alert.alert` with a
  **`DeleteAccountModal`**: danger-haloed header, KVKK/GDPR irreversibility
  warning, an optional "why are you leaving?" reason (sent via
  `accountDeletionSchema.reason`), and a **type-DELETE-to-confirm** gate. The
  delete button stays disabled until "DELETE" is typed, shows a spinner while
  `DELETE /me` runs, surfaces errors inline, and on success signs the user out.

## Honest-data notes (no fabrication)

- `Profile` exposes `age` but no birth date, and has no gender / "looking for"
  field, so the editor shows a real **Age** row instead of the mockup's fabricated
  "15 May 1998", and omits the "I am / Looking for" preference rows entirely.
- Interests are shown as chips (with a note) rather than made removable + "add",
  because the profile-update mutation has no interests field — editing them is a
  backend follow-up, not a fake control.
- Photo upload isn't built, so the camera badge is honest ("Photo upload is coming
  soon") rather than a silent no-op.

## Tests

- `@tayfa/mobile` typecheck ✅, lint ✅, Prettier ✅ (the mobile CI gate).
- No shared/schema changes this phase.

## Device validation

**Device validation skipped (device unavailable)** — Xiaomi still disconnected.

## OpenAI usage (cumulative)

No new generations this phase. 8 total ≈ **$1.36** of $15.

## Deliverables

Rewritten profile screen, the new edit-profile screen, the shared interest-meta
helper, both bug fixes (sign-out confirm + nav reset, delete-account modal), and
this report.

# Phase 6 — Safety flows · paywall · verify-to-host · reusable states

**Status:** ✅ complete · mobile lint + typecheck + Prettier green · Date: 2026-07-01

## Objective

Rebuild the safety, monetization and gating surfaces to ≥90% fidelity against
`14-safety-center`, `15-report-flow`, `16-block-flow`, `19-paywall`,
`21b-location-permission-dialog`, `22-empty-state`, `25-verify-to-host` — while
preserving every safety-critical invariant: SOS still confirms then dials 112,
verification stays server-authoritative and fail-closed, safety is never
paywalled, and precise location never leaves the server for non-approved viewers.

## New reusable design-system primitives

- **`EmptyState`** — illustration/soft-glyph + bold reassurance headline + calm
  one-liner + optional CTA. One component for empty/error/done states so a screen
  with nothing in it still points somewhere (redesign `22`).
- **`Overlay`** — the app's modal vocabulary: `Sheet` (bottom sheet + grab
  handle), `CenterModal` (centered card), `ConfirmDialog` (haloed icon + title +
  message + confirm/cancel, `danger`/`grape`/`ember`/`verified` tones, optional
  body slot + `cancelLabel={null}` for acknowledgements), and
  `LocationPrimingDialog` (pre-permission priming, `21b`).
- **`SafetyActions`** — `SafetyActionsSheet` (`16`: block / report meetup / report
  host) and `ReportReasonDialog` (`15`: Safety Threat → `imminent_harm`, Scam or
  Money Request → `scam`, Harassment → `harassment`). Choices map straight to
  `reportReasonSchema` keys so the BFF + moderation pipeline stay authoritative.

## Screen work

- **`event/[id].tsx`** — the `…` overflow now opens the styled **Safety action
  sheet** (`16`) instead of an OS `Alert`; from it, **Report** opens the
  **reason-picker dialog** (`15`) and **Block** opens a `ConfirmDialog`. Report
  supports both `event` and `user` targets, shows a verified "Report sent"
  acknowledgement, and "Leave meetup" rides along the sheet for members. All
  `useReport` / `useBlock` / `useRsvp` logic preserved.
- **`paywall.tsx`** (`19`) — "Always free, always safe" reassurance card, a **Most
  popular** ribbon + **Best value** pill + config-derived **"N months free"** gift
  pill on the annual plan (never a marketing number that doesn't reconcile with
  the real annual/monthly price), a **7-day happiness guarantee** row, chevron
  feature rows, and a sparkle CTA + lock-icon billing footnote. Pricing still
  comes from `PRICING` config; the purchase action is unchanged (RevenueCat/native
  sheet seam — no local premium flag flip).
- **`safety-center.tsx`** (`14`) — added the subtitle, a white "!" disc inside the
  SOS card, and a "Private & secure" badge on Share-my-plan. The SOS confirm →
  `tel:112` dial, `TR_EMERGENCY` numbers, `sharePlanSchema` flow and the
  off-by-default live-location toggle are untouched.
- **`verify-to-host.tsx`** (NEW, `25`) — the hosting gate: two-tone headline,
  3-step explainer (ID scan → liveness selfie → review), a "Safety, not
  surveillance" panel, and an "Always free" badge. **Start verification kicks off
  the provider flow only** (mock-tolerant `POST /me/verification/start`) and shows
  an in-review acknowledgement — it never flips the local verification level
  (fail-closed). `create.tsx`'s "Verify to publish" CTA and empty-host card now
  route here.
- **`EventCard.tsx`** — reworked to the clearer `09`/`21b`/`25` layout: host +
  verified + a qualitative **reliability pill**, photo thumbnail on the right, a
  green **"who's going"** band that expands into the ranking rationale, and a
  **Save + View details** footer.
- **`feed.tsx`** — the empty branch now uses `EmptyState`, and a **"Quiet around
  here? — be the spark"** host card appears below the events whenever supply is
  thin (`liquidity.widened`), matching `22`/`25`.
- **`create.tsx`** — "Use current location" now shows the **LocationPrimingDialog**
  before sending anyone to OS settings, and the verify gate routes to
  `/verify-to-host`.

## Honest-data & security notes (no fabrication)

- The `21b` / `25` mockups render the Discover feed (high- and low-liquidity)
  rather than literal dialogs; I used them as the card/liquidity fidelity
  reference and designed the priming dialog + verify gate from product logic.
- Avatar stacks in the "going" band aren't backed by attendee data on `FeedEvent`,
  so they're intentionally omitted (a backend follow-up), same as Phase 4/5.
- Verification remains **server-authoritative and fail-closed**; the gate screen
  only starts the flow. Safety (SOS, report, block, Safety Center) is identical
  for free and Tayfa+ — never gated. No precise geometry is ever rendered client
  side.

## Tests

- `@tayfa/mobile` typecheck ✅, lint ✅, Prettier ✅ (the mobile CI gate).
- No shared/schema changes this phase.

## Device validation

**Device validation skipped (device unavailable)** — Xiaomi still disconnected.

## OpenAI usage (cumulative)

No new generations this phase — reused bundled illustrations. 8 total ≈ **$1.36**
of $15.

## Deliverables

3 new design-system files (`EmptyState`, `Overlay`, `SafetyActions`), the new
`verify-to-host` screen, restyled safety/paywall/event-detail/feed/create/event-
card surfaces, and this report.

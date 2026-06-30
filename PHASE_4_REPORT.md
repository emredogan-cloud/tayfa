# Phase 4 — Discover / event card / ranking / event detail redesign

**Status:** ✅ complete · mobile lint + typecheck green · Date: 2026-07-01

## Objective

Rebuild the discovery surface to ≥90% fidelity against `07-feed`, `08-feed-filters`,
`09-event-card`, `09b-ranking-explanation`, `10-event-detail` — preserving the
privacy-by-design location model, the free safety filters, and ranking explainability.

## Implementation

- **`EventCard` (rewrite)** — photo-led horizontal card: a derived **category tile** on
  the left with an Indoor/Outdoor scene chip, host trust on the right (avatar, name +
  `VerifiedBadge`, teal **Reliability**, amber **Top Host** when ≥90), a save heart, bold
  title, calendar + location rows, mutual-interest chips, and a footer band with capacity
  (`N going · M spots left`) and an expandable **"Why you're seeing this"** rationale card
  (interest-match % · distance · soonness). Ranking transparency preserved.
- **`eventImage` helper (new)** — feed events carry no cover photo by design (identity/
  location are fuzzed), so this deterministically maps category/title/interests → one of
  four generated category tiles (cycling/bouldering/coffee/boardgames) + an indoor/outdoor
  scene chip. Same event → same tile.
- **`feed.tsx` (rewrite)** — "Discover" + "Around Istanbul" location subtitle, **Verified**
  (→ Safety Center) and **Premium** (→ paywall) header tiles, the illustrated liquidity
  banner, a filter rail (`Women only` / `Verified only` free safety pills + a **Filters**
  sheet), a Tayfa+ footer upsell for free-tier users, and an illustrated empty state. The
  **Filters bottom-sheet** exposes the free safety toggles and teases advanced sub-genre
  filters as Tayfa+ (routes to paywall) — **safety filters are never gated.**
- **`LiquidityBanner` (enhanced)** — taller two-line headline + an optional illustration
  (passed as an opaque image handle so the design-system layer stays asset-agnostic).
- **`PremiumUpsell` (new design-system primitive)** — grape reach-only upsell (solid +
  soft variants). `onPress` routes to the **in-app paywall**; it never triggers billing.
- **`event/[id].tsx` (rewrite)** — back / **share** / overflow top bar, RSVP status pill,
  title + dated subtitle, host card (HOST pill + Reliability + signal bars + View profile),
  a **location-privacy card** (fuzzed neighborhood, green "Hidden for privacy", unlock-
  window note, stylized fuzzed-area map that **never renders precise geo**), "You have in
  common" chips, a "Who's going" member list with status badges + host approve/reject,
  a free-tier premium nudge, and a sticky **Open chat / Join** + save bar. **`preciseLocation`
  is still shown ONLY when the BFF released it**; report/block stay free; "Leave meetup"
  moved into the overflow menu.

## Assets

One new generated illustration (`feed-liquidity-people`, transparent) + the four existing
event tiles and empty-state copied into the mobile bundle and registered.

## Tests

- `@tayfa/mobile` typecheck ✅, lint ✅, Prettier clean.
- No shared/schema changes → `@tayfa/shared` vitest unaffected.

## Device validation

**Device validation skipped (device unavailable)** — Xiaomi still disconnected; `adb`
cannot see it. Feed/event screens queued for the next device pass.

## Known follow-ups

- The redesign's 5-tab bar (adds **Chats**) and a public host-profile screen are deferred
  to **Phase 5** (chat/crews); "View profile" currently shows a "coming soon" notice.
- Saved-heart state is local/visual pending a save endpoint.

## OpenAI usage (cumulative)

8 high-quality `gpt-image-1` 1024² generations (1 welcome + 3 auth + 3 onboarding + 1
liquidity) ≈ **$1.36** of the $15 budget; the four reused event tiles + empty state were
generated in an earlier phase.

## Deliverables

Rewritten `EventCard`, `feed.tsx`, `event/[id].tsx`; new `eventImage` + `PremiumUpsell`;
enhanced `LiquidityBanner`; 1 new illustration; this report.

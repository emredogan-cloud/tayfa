# Phase 9 — Travel Mode (mobile UI)

**Status:** ✅ complete · mobile lint + typecheck + Prettier green · Date: 2026-07-01

## Objective

Give the existing Travel Mode backend (`resolveActiveCity`, a Tayfa+ premium
feature) a mobile UI: browse another city's meetups before you go, with the
premium gate surfaced honestly and the discover feed scoping to the chosen city.
No re-design mockup exists, so it's built in the established design language.

## Implementation

- **`app/travel-mode.tsx` (NEW)** — a two-tone "See a city **before** you go"
  screen with a grape Tayfa+ badge. Free members see a `PremiumUpsell` and every
  non-home city shows a lock → paywall (`?feature=travel_mode`). Tayfa+ members
  pick a city and the feed scopes to it. Selection runs through the shared
  **`resolveActiveCity`** rule (home always resolves to home; a gated request
  yields `requiresUpgrade`; a Tayfa+ request yields `traveling`) — the client
  never invents access. Includes an active-city card with **Return home**.
- **`lib/cities.ts` (NEW)** — the client presentation catalog (name, flag,
  centroid) for the launch + roadmap cities. The authoritative launched-city list
  stays server-side (the city go/no-go gates live in `@tayfa/shared`); this is
  just what the picker renders and what centroid the feed uses.
- **`stores/travel.ts` (NEW)** — a small, ephemeral zustand store for the active
  travel city (resets on cold start; home is always the fallback).
- **`(tabs)/feed.tsx`** — the header location subtitle is now a **city selector**
  (flag + name + chevron → Travel Mode). When traveling, the feed uses the city
  centroid instead of GPS, and a grape **"Traveling in {city}"** banner appears
  with a one-tap **Home** return and a reminder that the user isn't sharing their
  location.

## Privacy / server-authority notes

- Travel Mode uses a **city centroid**, never the user's GPS — the banner says so
  explicitly. Precise location handling is unchanged.
- Access is decided by the shared domain rule, not a client flag; the entitlement
  itself remains server-authoritative (RevenueCat → BFF).
- The cities list is presentation data; a real BFF would return the live launched
  cities + their liquidity. The copy ("cities open as they reach enough verified
  hosts") reflects the real go/no-go gating rather than implying every city is
  live.

## Tests

- `@tayfa/mobile` typecheck ✅, lint ✅, Prettier ✅ (the mobile CI gate).
- No shared/schema changes this phase (reused `resolveActiveCity`).

## Device validation

**Device validation skipped (device unavailable)** — Xiaomi still disconnected.

## OpenAI usage (cumulative)

No new generations this phase. 8 total ≈ **$1.36** of $15.

## Deliverables

The Travel Mode screen, the cities catalog + travel store, the feed city-selector
+ traveling banner integration, and this report.

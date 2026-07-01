# Phase 8 — Notification Center (new)

**Status:** ✅ complete · mobile lint + typecheck + Prettier green · Date: 2026-07-01

## Objective

Build the Notification Center — a surface the app didn't have at all — in the
established redesign language, grounded in the real notification domain
(`NOTIFICATION_CATEGORIES` + the `notification` ledger). There is no re-design
mockup for this screen, so it's designed from the existing design system + the
GROWTH §9 policy model.

## Implementation

- **`app/notifications.tsx` (NEW)** — a back / "Notifications" / **Mark all read**
  header over a list of ledger rows. Each row leads with a **category glyph**
  (Your plans → ember calendar, Social → grape chat, Discovery → amber compass,
  Tayfa/lifecycle → teal sparkles), the title + body, and a relative timestamp;
  **unread rows** get an ember-soft tint + a dot. Tapping a plan/social item marks
  it read and **deep-links to its meetup**. Empty state uses the reusable
  `EmptyState`; a footer grounds the UX in the frequency policy ("a couple of
  notifications a day, tops — safety alerts always come through").
- **`api/useNotifications.ts` (NEW)** — `useNotifications()` (GET
  `/me/notifications`) + `useMarkNotificationsRead()` (POST
  `/me/notifications/read`) with an **optimistic** cache update so the unread
  badge clears instantly and rolls back on error.
- **`api/types.ts`** — `NotificationItem` (mirrors the ledger's
  type/category/payload/opened columns, payload flattened to title/body/eventId)
  + `NotificationsResponse`. Category typed against `@tayfa/shared/constants`.
- **`lib/mock-data.ts`** — a realistic Istanbul notification set across all four
  categories (RSVP approved, new message, event reminder, discovery match,
  welcome) with mixed read/unread, plus handlers for `GET /me/notifications` and
  `POST /me/notifications/read`, so the screen is fully walkable in the standalone
  demo build (same last-resort mock layer as feed/crews/profile).
- **`(tabs)/feed.tsx`** — added an **Alerts** bell tile to the header with a live
  unread count badge, routing to the Notification Center.

## Server-authority / honest-data notes

- Frequency caps, the global daily ceiling and the "would a friend text this?" bar
  are **server-side** (GROWTH §9). The client only renders the already-sent ledger
  and reports opens — it never decides what to send.
- Category mute (`NOTIFICATION_POLICY.userMutable`) is surfaced as copy, not a
  fake toggle, since there's no preferences endpoint yet — a backend follow-up.
- All notification content is seed/demo data in the `__DEV__`-only mock layer; a
  real BFF response always wins and mocks never ship in release builds.

## Tests

- `@tayfa/mobile` typecheck ✅, lint ✅, Prettier ✅ (the mobile CI gate).
- No shared/schema changes this phase.

## Device validation

**Device validation skipped (device unavailable)** — Xiaomi still disconnected.

## OpenAI usage (cumulative)

No new generations this phase. 8 total ≈ **$1.36** of $15.

## Deliverables

The Notification Center screen, the notifications API hooks + types, mock data +
handlers, the feed bell entry point, and this report.

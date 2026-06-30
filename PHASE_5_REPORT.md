# Phase 5 — Chat · icebreakers · create-event · crews redesign

**Status:** ✅ complete · mobile lint + typecheck green · Date: 2026-07-01

## Objective

Rebuild the group chat, host wizard and crews surfaces to ≥90% fidelity against
`11-chat`, `12-chat-icebreakers`, `13-create-event`, `17-crews` — preserving the
messaging/icebreaker logic, the no-1:1 + free-safety-filter host rules, and the
server-authoritative crew entitlement gate.

## Implementation

- **`event/[id]/chat.tsx` (rewrite)** — back / title / overflow header, a **meetup
  sub-header** (title + going/spots + a "Meetup details" pill → event detail), a
  **"You're in a verified group"** trust banner (→ Safety Center), a "Today" divider, and
  redesigned bubbles: incoming get an avatar + **per-sender colored name** + timestamp;
  outgoing use an ember-soft bubble with a delivered tick. The AI **icebreakers** rail
  (grounded in shared interests, fail-open to `[]`) is restyled with a sparkle and still
  sends on tap; the composer keeps the full send/first-message-analytics path. Pulls the
  event via `useEvent` only for the header.
- **`(tabs)/create.tsx` (rewrite)** — "Host a meetup ✨ / Bring people together" header, a
  **horizontal category gallery** (colored glyph tiles, ember-selected), title with
  counter, a **privacy-fuzzed Where card** (stylized fuzzed-area map + "Use current
  location" → opens OS settings when on the city-center fallback + an amber lock note that
  the exact pin stays private), clock-chip **When** options, group-size stepper
  (**min locked, never 1:1**), visibility selector, and the **free** Women-only / Verified+
  safety toggles. The publish CTA is **"Verify to publish"** until the host is Verified+
  (the free host gate, surfaced honestly) then "Publish meetup". All `useCreateEvent` /
  `checkActionAllowed('host_event', …)` logic preserved.
- **`(tabs)/crews.tsx` (rewrite)** — "Your crews" header, an amber **streak banner**, crew
  cards with a name-derived category glyph + an uppercase cadence pill + members + next
  meetup, a dashed **"Form a crew"** card, and the **server-gated** premium upsell when the
  free crew limit is reached (`canCreateCrew` — never a client flag).

## Honest-data notes (no fabrication)

The mockups show per-message reactions / typing dots / online presence and per-crew
"meetups this month / week streak" + attendee avatar stacks. Those fields don't exist in
the current `ChatThread` / `Crew` models, so they're intentionally omitted rather than
faked — they're backend-data follow-ups. The redesign matches every data-backed element.

## Deferred to a later phase

- The redesign's **5-tab bar** (adds a **Chats** list tab) — there's no chats-list
  mockup or list endpoint yet; the tab-bar restructure stays a follow-up.
- Public host-profile screen (the chat/event "Meetup details" + host "View profile"
  routes target the event; full profiles remain pending).

## Tests

- `@tayfa/mobile` typecheck ✅, lint ✅, Prettier clean.
- No shared/schema changes this phase.

## Device validation

**Device validation skipped (device unavailable)** — Xiaomi still disconnected.

## OpenAI usage (cumulative)

No new generations this phase — 8 total ≈ **$1.36** of $15.

## Deliverables

Rewritten chat / create / crews screens, name-derived crew glyphs, this report.

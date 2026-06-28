# Phase 3 Report — Core Loop: Events, Groups, RSVP, Chat & Baseline Safety

> Roadmap §10, Phase 3. **Objective:** close the loop — create a micro-event, others
> discover & RSVP, the group gets a chat, they coordinate, and the app records a **completed
> meetup (NSM)** — with block/report safety from day one. *This is the product.*

**Status:** The loop's **logic, data model, and safety primitives are complete and tested**.
The interactive surfaces (event-create wizard, group-chat UI, web moderation console) are
**built and typecheck-green** atop the tested primitives (the web `next build` also passes);
the Inngest durable function bodies remain **designed, not implemented**, and on-device /
live-infra validation is still pending. See [`../KNOWN_LIMITATIONS.md`](../KNOWN_LIMITATIONS.md).

---

## Completed work

**Event + loop data model (Data Model §5).** `event_member` (RSVP/attendance ledger),
`conversation` (scope{event,crew,dm}), `conversation_member`, `message` (with
`moderation_status`), `rating`, `report`, `moderation_action`, `block`, plus `crew`/
`crew_member`/`crew_event` for the retention seed — all with **deny-by-default + FORCE RLS**.

**RSVP state machine + transactional capacity.** `domain/rsvp-state-machine.ts` —
`transitionRsvp`, `initialRsvpStatus`, `occupiesSeat` — enforces
`requested → approved → going → attended | no_show | left`; `occupiesSeat` defines exactly
which states consume capacity, so the **last-seat race** is decided by a single tested
predicate (the transaction in the BFF wraps the decrement; the legality is pure-tested).

**Auto-provisioned group chat (RLS-enforced).** `conversation` + `conversation_member`;
chat is readable **only by members** via `is_conversation_member` (`sql/40_functions.sql`),
proven in the RLS suite. Blocked users are mutually severed (`is_blocked`). Realtime/presence
+ Expo push wiring lives in the BFF behind mock providers; live Supabase Realtime/presence +
Expo push are pending real keys.

**NSM recording — anti-gaming.** `domain/nsm.ts` (`evaluateMeetupNsm`) +
`evaluateMeetupNsm`/`NSM` constants: a meetup counts only when **≥2 distinct attendees
mutually confirm** AND a **geofence** check passes (250 m radius) within the confirm window
(−30/+180 min of `starts_at`), with **suspected-collusion share ≤ 5%**. Designed to resist
two-account gaming; the anti-abuse signals are logged. `NORTH_STAR_EVENT` is the typed NSM
analytics event. Check-in contract: `checkinConfirmSchema`. **The geofence/confirmation is
never faked as always-true** (anti-hallucination).

**Post-meetup reputation.** `domain/reputation.ts` — vibe/showed-up/meet-again ratings feed
`computeReliabilityScore` / `computeSafetyScore`; `canHost`/`canDm` gate privileged actions
below `REPUTATION_GATES` (host: reliability ≥ 40 & safety ≥ 60; DM: safety ≥ 60; never
recommend below safety 35). `ratingSchema` validates the input.

**Safety (mandatory, never paywalled).** `reportSchema`, `blockSchema`; `domain/moderation.ts`
— `routeModeration`, `severityForReason`, `slaDeadline`, `detectScamLanguage`. Severity →
SLA (`REPORT_SLA_MINUTES`: safety-critical **30 min**, high **4 h**, standard **24 h**),
auto-action confidence floor 0.95 with a human-review floor 0.5 (human in the loop). Scam/
money-language patterns fast-track a report. **Entitlements prove safety is free**:
`isNeverPaywalled` + the `NEVER_PAYWALLED` list (block, report, appeals, safety center,
women-only/verified-only filters, …) — gating is **only** via `checkFeatureAccess`.

**Precise-location release rule.** Approved members get the precise pin only ≤30 min before
start, via the BFF, via `canReleasePreciseLocation` — everyone else gets the fuzzed centroid.

**Inngest lifecycle (designed).** Event names + step semantics: `event.created` (match-notify
top candidates, reuse Phase-2 ranking), `event.reminder` (T-24h, T-2h), `event.checkin_window`,
`event.completed` (rating + crew prompt). Notification frequency caps enforced server-side
(`canSendNotification`, `NOTIFICATION_POLICY`, global ≤2/day). Steps are idempotent by design.

---

## Decisions made

- **Supabase Realtime for MVP chat** (≤6-person groups), Stream migration deferred to a
  triggered move (ADR-006); `message` partitioning is the P4 bridge.
- **Geofence ∩ mutual-confirm ∩ collusion cap for NSM** (RISK_ANALYSIS §NSM) — the metric is
  designed to resist two-account gaming, not just to count taps.
- **Reputation gates host/DM**, not a paywall — safety is never monetized (MONETIZATION §12,
  enforced by `entitlements.ts`).
- **Rate-limits on create/message** (`RATE_LIMITS`: event create 10/day, new-host 2/day,
  message 60/min, DM new-contact 10/hr) — Redis-backed in the BFF.

---

## Tests — acceptance criteria → proof

| Acceptance criterion (roadmap "Done when") | Satisfied by |
|---|---|
| RSVP legality + last-seat capacity | `domain/rsvp-state-machine.test.ts` (11) |
| Chat readable **only by conversation members** | `db/src/rls.test.ts` (6) via `is_conversation_member` |
| NSM resists two-account gaming (geofence ∩ mutual-confirm ∩ collusion) | `domain/nsm.test.ts` (6) |
| Mutual rating updates reliability/safety; host/DM gating | `domain/reputation.test.ts` (10) |
| report → action SLA + human-in-loop + scam fast-track | `domain/moderation.test.ts` (7) |
| **Safety never paywalled** (block/report/filters free) | `domain/entitlements.test.ts` (5) + `NEVER_PAYWALLED` |
| Notification frequency caps | `domain/notifications.test.ts` (5) |
| Precise location released only to approved members near start | `domain/location-privacy.test.ts` (6) |
| Block = total severance | `is_blocked` in `db/src/rls.test.ts` |

**Totals:** the Phase-3 logic accounts for the bulk of the 78 domain tests; chat-RLS and
block isolation are in the 6 db RLS tests.

```bash
pnpm --filter @tayfa/shared test                     # 78 pass
TEST_DATABASE_URL=… pnpm --filter @tayfa/db test     # 6 RLS pass (chat-member-only, block)
```

---

## CI status

The four workflows are **committed** and **validated locally** (green here for the implemented
layers); GitHub Actions has not yet run (push pending the user's authorization —
KNOWN_LIMITATIONS §4). **CI green remains the hard release gate.**

## Known issues / pending

- **Interactive surfaces** (event-create wizard + map picker, group-chat UI with presence,
  check-in screen, post-meetup rating, block/report flows, host controls, **web moderation
  console**): **built and typecheck-green**; on-device / runtime validation pending (the hooks
  need a running BFF; no AVD here).
- **Inngest durable function bodies**: **designed (names/steps/caps), not implemented**.
  Supabase Realtime channels + Expo push are wired behind mock providers — live until
  Inngest/Supabase/Expo keys are added.
- **report→action E2E and reminder-timing E2E**: defined as Maestro/integration targets;
  **not executed** (no AVD; needs the BFF running against live infra).
- **Last-seat race integration test** (real transaction): pending a live transaction against
  the Docker Postgres harness; the legality predicate it relies on is unit-proven.

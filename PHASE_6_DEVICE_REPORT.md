# Phase 6 Device Validation Report

**Date:** 2026-06-29 · **Phase:** 6 — Retention Engine · **Status:** no new mobile consumer screens this phase; live re-run pending device reconnection.

## Summary

P6 is a **retention/backend + web-share** phase. Its deliverables are **server-side decision logic** (crew formation, positive streaks, recurrence, lifecycle-journey selection gated by the notification caps) and a **web** surface (the shareable recap OG image at `/api/og/recap/[eventId]`). It adds **no new mobile consumer screens** — streaks/crew prompts/lifecycle nudges surface through existing notification + plan surfaces (already validated in the P1–P3 device pass) and the recap is an Open-Graph/share artifact, not an in-app screen.

No native changes → the installed debug APK renders all prior consumer screens unchanged.

## What was verified for P6 (without the device)

| Check | Result |
|---|---|
| Crew formation, streaks, recurrence, recap builder, lifecycle selection + cap-gated send | ✅ 15 new unit tests (121 total); `retention.ts` 100% coverage |
| Lifecycle nudge can never exceed daily caps / respects mutes | ✅ unit-proven (`decideLifecycleSend` routes through `canSendNotification`) |
| Streak copy is positive/graceful (no guilt, no loss-frame) | ✅ unit-proven ("fresh start" on a broken streak; "building something" framing) |
| Recap card carries no precise pin / PII | ✅ unit-proven (test rejects lat/long-precision numbers in the serialized card) |
| Recap OG route renders | ✅ `next build` green — 17 routes incl. `ƒ /api/og/recap/[eventId]` |
| Braze lifecycle adapter (real-when-keyed, fail-soft) | ✅ typecheck + hybrid factory wiring; mock default in CI |
| RLS intact (no schema change) | ✅ 6/6 RLS suite |

## Device re-validation status

The physical device (Xiaomi, Android 13, id `jfzxugsgnnvsrsg6`) is **disconnected** at P6 completion (`adb devices` → none attached). Because P6 adds no new mobile screens, a live re-run would re-confirm the **unchanged** plans/notifications/profile surfaces from the P1–P3 captures.

**To re-validate when reconnected:** relaunch the app; confirm the home/plans, notification preferences, and profile surfaces render unchanged. To exercise the recap share artifact, open `/api/og/recap/<eventId>` in a browser against a seeded event and confirm the privacy-safe card (neighborhood + counts + vibe, no precise location).

## Honest gaps
- No new P6 mobile screenshots this pass (device offline; no new mobile surface to capture).
- The recap OG image was verified to **build and register as a route**; rendering against live seeded data + the Braze live-send path are pending a keyed/seeded environment.
- Lifecycle **Inngest orchestration** (send-time scheduling, streak rollup, crew-ritual reminders) is designed but not yet wired; the pure decisions it will call are tested.
- Per the per-phase discipline, a fresh on-device run should be performed once the device is reconnected; recorded here as **pending**, not skipped.

# Phase 8 Device Validation Report

**Date:** 2026-06-29 · **Phase:** 8 — Multi-City Scale & Reliability · **Status:** no new native screens; live re-run pending device reconnection.

## Summary

P8 is a **scale/backend + ops** phase. Its application-code deliverables are **pure decision logic** (city liquidity, ghost-town guard, city-launch go/no-go, travel-mode resolution, AI cost guard, archival, SLO checks) and a **read-only BFF endpoint** (`/api/cities/active`). The user-facing change is the **travel-mode city switcher**, which sits on the **existing feed shell** validated in the P1–P3 device pass — there is **no new native screen** and no native change. The heavy P8 work (replicas, partitioning, chat migration, R2/CDN, BigQuery) is operational/IaC, not on-device.

No native changes → the installed debug APK renders all prior screens unchanged.

## What was verified for P8 (without the device)

| Check | Result |
|---|---|
| City liquidity classification | ✅ unit-proven (`cityLiquidityStatus` band boundaries) |
| Ghost-town guard never renders an empty feed (and flags seeding) | ✅ unit-proven (`applyGhostTownGuard`) |
| City launch gated on liquidity + hosts + **proven economics** | ✅ unit-proven (`cityLaunchDecision`; economics gate blocks even at high liquidity) |
| Travel mode premium-gated, never blocks the core feed | ✅ unit-proven (`resolveActiveCity` → home + `requiresUpgrade` for free users) |
| AI cost guard fails OPEN (cache → template), never denies | ✅ unit-proven (`decideAiSpend`) |
| Archival/partition + SLO helpers | ✅ unit-proven (`messagePartitionKey`, `shouldArchiveMessage`, `withinSlo`, `sloBreachMs`) |
| `/api/cities/active` builds + registers | ✅ `next build` green — 18 routes incl. `ƒ /api/cities/active` |
| RLS intact (no schema change) | ✅ 6/6 RLS suite |

## Device re-validation status

The physical device (Xiaomi, Android 13, id `jfzxugsgnnvsrsg6`) is **disconnected** at P8 completion (`adb devices` → none attached). Because P8 adds no new native screens, a live re-run would re-confirm the **unchanged** feed shell, onto which the travel-mode city switcher attaches.

**To re-validate when reconnected:** relaunch the app; confirm the feed shell renders unchanged and (for a Tayfa+ account) the city/travel switcher scopes the feed, while a free account stays on the home city with an upgrade nudge. Server-side, hit `/api/cities/active?city=<id>` and confirm liquidity status + travel gating.

## Honest gaps
- No new P8 mobile screenshots this pass (device offline; no new native surface).
- The **100× load test, chaos drills, chat-migration integrity test, and DR restore** described by the roadmap require a real staging environment and are **not run here** — explicitly not claimed.
- Per the per-phase discipline, a fresh on-device run should be performed once the device is reconnected; recorded here as **pending**, not skipped.

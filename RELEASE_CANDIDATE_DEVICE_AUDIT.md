# Tayfa — Release-Candidate Device Audit (P1–P9)

**Date:** 2026-06-29 · **Device:** Xiaomi 22095RA98C ("light"), Android 13, 1080×2408 @440 dpi, id `jfzxugsgnnvsrsg6` · **Build:** fresh debug APK from the complete P1–P9 codebase (clean install), Metro serving the current source · **Evidence:** `screenshots/rc-audit/`.

## ⛔ BETA READINESS GATE: **NO — not yet** (one Medium defect open + live-backend validation outstanding)

The app is **functionally solid and beta-promising** — no crashes, no ANRs, no safety defects, no premium bypass, and every reachable core journey works. It is **not** a full YES yet for two honest reasons:
1. **One Medium accessibility defect** (text overlap/truncation at ≥130 % system font scale) — partially mitigated, not fully resolved.
2. **Several journeys were validated against the dev mock only** (no live BFF/Supabase). Real OTP, RSVP/chat echo, entitlement change, and mutual-block invisibility must be confirmed against a staging backend before a public beta.

Per the gate ("only YES if all criteria pass; otherwise fix and repeat"), this is a **conditional NO** with a short, concrete close-out list (§Gate checklist). No safety/crash/security blocker was found.

---

## 1. Build, install, launch

| Step | Result |
|---|---|
| `adb uninstall app.tayfa.mobile` | ✅ Success (clean slate) |
| Fresh build from full P1–P9 source (`gradlew assembleDebug`, arm64-v8a, Hermes) | ✅ BUILD SUCCESSFUL (2m27s), 63 MB APK |
| Clean install | ✅ Success |
| Launch + Metro bundle | ✅ 2101 modules, no native crash |
| `adb logcat` monitored entire session | ✅ **No app FATAL / ANR / JS redbox** (only unrelated MIUI/WiFi/Play noise) |

_A first-attempt `clean assembleDebug` hit a reanimated prefab/CMake ordering flake; re-running `assembleDebug` resolved it (tooling flake, not an app defect)._

---

## 2. Journeys — results

### AUTH + onboarding — ✅ PASS
Launch → phone → OTP → age gate → interests (taste cards, ≥5, live counter, search, filters) → consent (granular KVKK/GDPR; "DOES NOT GATE THE APP"; "Data stored in EU (Frankfurt)") → native OS location permission → profile setup → feed. Evidence `01`–`10`.
- **Safety-critical: under-18 birthdate (`2015-01-01`) is BLOCKED** ("You must be at least 18 to use Tayfa"); valid 18+ proceeds. `05`.

### DISCOVERY — ✅ PASS
Feed loads; **liquidity proof** "42 meetups near you this week / within 5 km"; **free safety filters** Women-only + Verified-only toggle (never paywalled); **location privacy** — neighborhood + fuzzed distance ("Kadıköy · 800 m away"), no precise pin. `10`, `12`, `12b`.

### MATCHING — ✅ PASS (after fix)
"Why you're seeing this" explainability ("You both like Cycling +1 more / Interest match 84 % · 800 m away · soonness boost"); AI icebreakers in chat. `11-…-FIXED`. **Bug D1 found & fixed** (was −114 %, see §3).

### EVENTS — ✅ PASS (mock echo limited)
Event detail: host (verified/reliability), **🔒 neighborhood privacy** ("exact spot unlocks for approved guests ~30 min before; until then your location stays private"), in-common interests, who's-going with HOST/GOING/APPROVED states, capacity. Join → member state ("✓ GOING", Open chat + Leave). `13`,`14`,`18`. _RSVP/echo + waitlist + edit/cancel + host-approval need a live BFF (static mock doesn't echo)._

### CHAT — ✅ PASS (mock echo limited)
Group chat: user + **system messages** ("Ece joined the meetup"), **✨ AI ICEBREAKERS**, composer + send (mutation fires). `19`,`20`. _Sent-echo + offline recovery need a live BFF._

### TRUST & SAFETY — ✅ PASS
- Event "…" → Safety action sheet: **BLOCK HOST / REPORT MEETUP**. `15`.
- **Report flow**: reason picker (SAFETY THREAT / SCAM OR MONEY REQUEST / HARASSMENT) → submit → clean return. `16`,`17`.
- **Safety Center**: **"🔓 ALWAYS FREE — NEVER BEHIND A PAYWALL"**, **SOS**, TR emergency numbers (112/155/156/110), Share-My-Plan. `24`. _(SOS deliberately not triggered — it places a real 112 call.)_
- **Verify-to-host gate**: "Verify to publish" is **disabled** for a phone-only user; free "Start free verification" prompt. `26`.
- _Appeals UI is the web/admin console (not a mobile screen); unblock + live Persona verification need keys/backend._

### RETENTION — ✅ PASS
Crews tab: **streak** card ("Keep your streak alive" — positive framing), **recurring crew** ("Sunday Bike Crew · WEEKLY · 5 members · Next 02.07.2026"), "Form a crew". `22`. _Recap cards = web OG/share artifact (P6); lifecycle nudges = push — neither is an in-app mobile screen._

### PAYMENTS — ✅ PASS
Tayfa+ paywall: declares **"Discovering, joining, hosting, chat, verification, and the entire Safety Center are always free. Tayfa+ never gates them."**; **TR pricing matches config exactly** (Annual ₺999 / ₺83.25 mo / save 44 %; Monthly ₺149); premium features listed correctly. `25`. _(Continue not tapped — no sandbox IAP products; would invoke real Google Play billing. Real entitlement change needs RevenueCat sandbox.)_

### MULTI-CITY / MARKETPLACE — ⚠️ DOCUMENTED ABSENT ON MOBILE
- **Multi-city / travel-mode switcher: no mobile UI.** Feed is scoped to "Around Istanbul"; the city/travel switcher (Istanbul/Ankara/İzmir, geocell switching) is **not built on mobile** — P8 shipped the domain + BFF (`/api/cities/active`, `resolveActiveCity`, ghost-town guard) only.
- **Marketplace / host pro-tools: no mobile UI.** The Host tab is template/freestyle event creation; ticketing/payouts/sponsored surfaces are **not built on mobile** — P9 shipped the domain + BFF (`computePayoutSplit`, `hostPayoutEligibility`, sponsored policy) only. Per the brief: explicitly documented as absent.

---

## 3. Defects

### D1 — "Interest match −114 %" in explainability — ✅ FIXED & VERIFIED
- **Severity:** Low (cosmetic; no crash/safety impact).
- **Root cause:** `EventCard.tsx` didn't clamp the rendered % AND the dev mock produced out-of-range ranking scores (multiplied a large uid seed by 0.01).
- **Fix:** clamp the rendered value to `[0,100]%` (production robustness) + bound mock scores to `[0,1]`. **Retested on device → "84 %".** Committed `55cc9c6`.

### D2 — Text overlap/truncation at large system font scale — ⚠️ OPEN (Medium), partially mitigated
- **Severity:** Medium (accessibility; app fully usable at default scale, degrades at elevated scale).
- **Symptom:** at **130 %** font scale, widespread truncation (feed header "Discov", filter chips "Women"/"Verified", interest tags "Cycli"/"Specialty", "4 GOING · 2 SPOTS", tab labels "Disc…"); at **150 %**, the display heading "What's your number?" **overlaps** its subtitle and the CTA/footer clip. `28`,`29`.
- **Root cause:** design-system `Text` variants use **fixed line-heights** that don't scale with font size, and several screens don't scroll / containers are fixed-width.
- **Mitigation applied:** per-variant `maxFontSizeMultiplier` cap on the design-system `Text` (headings capped tighter, body copy generous) — bounds the worst overflow. Committed.
- **Residual / recommended:** the tight fixed line-heights on `display`/`title` still overlap near the cap; full fix needs **dynamic line-heights + scrollable auth/onboarding + wrapping headings** (true Dynamic-Type reflow). **Recommended before public beta.**

### Observations (not app defects)
- **Dev-build HMR/reload transients:** editing a deep module (mock/Text) triggered Metro fast-refresh/full-reload that briefly showed a blank screen and reset the **in-memory** dev session (back to auth). Production loads a static bundle (no HMR) and persists the Supabase session in SecureStore — so this is a dev-only artifact. Cold launches always rendered correctly.
- **Mock echo limitations:** RSVP/chat-send mutations fire but the static dev mock doesn't echo new state; a real BFF returns updated state.

---

## 4. Accessibility audit

| Test | Result |
|---|---|
| Font scale 100 % | ✅ Clean, no clipping/overlap |
| Font scale 130 % | ⚠️ Widespread truncation (D2) |
| Font scale 150 % / 180 % | ⚠️ Heading overlap + CTA/footer clip (D2; partially mitigated) |
| Dark mode (OS night) | ✅ App keeps a consistent **branded light theme** (fixed-theme product choice; renders correctly, no clipping). Dark theme not implemented. |
| Landscape | ✅ App is **portrait-locked** by design (`orientation: 'portrait'`) — landscape not entered, so no landscape layout issues. |
| Small/large device | Tested on the 6.7" 1080×2408 device; layouts render correctly at default scale. |

---

## 5. Performance audit

| Metric | Result | Note |
|---|---|---|
| Cold start (native first frame, `am start -W`) | **1626 ms** | debug build + Metro overhead; release (embedded JS) differs |
| Warm/hot start | **97 ms** | excellent |
| Memory (TOTAL PSS) | **346 MB** (Native Heap 219 MB) | **debug Hermes + Metro inflates this heavily**; a release build is far lower. Stable across session — no leak observed. |
| Scrolling | Smooth during feed/list interaction (qualitative) | |
| Crashes / ANRs | **none** across the full session | |

> Performance numbers are from a **debug** build and must be re-measured on a **release** build for true figures (release embeds the JS bundle, strips dev tooling, and typically cuts both cold-start and memory substantially).

---

## 6. Security audit

| Attempt | Result |
|---|---|
| **Safety behind a paywall** | ❌ Impossible — Safety Center badge "ALWAYS FREE — NEVER BEHIND A PAYWALL" + the paywall itself declares safety/verification/core always free; domain `paywallSafetyViolations()` asserted `[]`. ✅ verified on device. |
| **Premium bypass** (client self-grant) | ❌ Impossible by architecture — the client `entitlement` is a UI-hint cache only; the BFF re-checks every premium action (e.g. advanced filters → 402) and RevenueCat is the server source of truth. Free user sees the paywall; cannot unlock client-side. |
| **Unauthorized navigation** (deep link to a route group while signed out) | ✅ `tayfa://tabs/feed` → expo-router **"Unmatched Route"** (route groups aren't URL-addressable). `33`. The index route gate also lands every session with no token on auth. |
| **Blocked-user visibility** | Server-enforced — mutual-block invisibility is an **RLS** invariant (db RLS suite 6/6); the block UI exists. Not dynamically exercised on device (static mock). |
| **Precise-location leakage** | ✅ Not exposed — event detail shows neighborhood only ("location stays private until ~30 min before"); feed shows fuzzed distance. |

_Note: the real security boundary is the **BFF auth + Postgres RLS** (server-side), not client navigation — by design, the client is never trusted. A direct `/feed` deep-link variant was interrupted by a device USB drop; even were a shell to render, no protected data loads without a valid token (BFF 401 + RLS)._

---

## 7. Gate checklist & close-out

| Criterion | Status |
|---|---|
| No crashes | ✅ |
| No ANRs | ✅ |
| All journeys pass | ⚠️ all *reachable* journeys pass; some echo flows mock-limited; multi-city/marketplace mobile UI absent by design |
| No critical UI defects | ✅ (D1 fixed; D2 is Medium, not critical) |
| No safety defects | ✅ (under-18 blocked; safety free; SOS present) |
| No premium bypass | ✅ |
| No broken flows | ✅ (mock-echo limits are environmental) |
| Acceptable performance | ✅ for debug (warm 97 ms); re-measure on release |

**To reach a full BETA = YES:**
1. Resolve **D2** (Dynamic-Type reflow: dynamic line-heights + scrollable auth/onboarding + wrapping headings).
2. Re-run the journeys against a **live staging BFF + Supabase + RevenueCat sandbox** to confirm real OTP, RSVP/chat echo, entitlement change, and mutual-block invisibility.
3. Re-measure **performance on a release build**.
4. (Product decision) build the **multi-city** and **marketplace/host** mobile surfaces if they are in beta scope, or explicitly defer.

_No crash, safety, or premium-bypass blocker was found. The foundation is strong; the gate is held only by the items above._

_Screenshots: `screenshots/rc-audit/` (numbered by journey)._

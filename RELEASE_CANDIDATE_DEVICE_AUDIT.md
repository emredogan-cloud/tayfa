# Tayfa — Release-Candidate Device Audit (P1–P9)

**Date:** 2026-06-29 · **Device:** Xiaomi 22095RA98C ("light"), Android 13, 1080×2408 @440dpi, id `jfzxugsgnnvsrsg6` · **Build:** fresh debug APK from the complete P1–P9 codebase (clean install), Metro serving the current source · **Status:** IN PROGRESS — interrupted by a physical USB disconnect partway through; see §Completion status.

> **Beta readiness gate: NOT YET — audit incomplete (device disconnected mid-run).** A YES/NO verdict is only valid after every journey + the accessibility/performance/security audits run on device. Several core journeys passed (below); the remainder are pending device reconnection. This document is updated live as the audit resumes.

---

## Build & install

| Step | Result |
|---|---|
| `adb uninstall app.tayfa.mobile` (old build removed) | ✅ Success |
| Fresh build from full P1–P9 source (`gradlew assembleDebug`, arm64-v8a, Hermes) | ✅ BUILD SUCCESSFUL (2m27s), 63 MB APK |
| Clean install of the fresh APK | ✅ Success |
| Launch (`MainActivity`) + Metro bundle | ✅ 2101 modules bundled, no native crash |
| `adb logcat` monitored for the whole session | ✅ No app `FATAL`/ANR/JS redbox observed (only unrelated MIUI/WiFi/Play-services noise) |

A clean prefab/CMake flake on the first `clean assembleDebug` (reanimated prefab wiped mid-graph) was resolved by re-running `assembleDebug` (documented; not an app defect).

---

## Journeys executed on device (so far)

### AUTH + onboarding — ✅ PASS
| Step | Result | Evidence |
|---|---|---|
| Cold launch → phone entry | ✅ renders | `01-auth-phone.png` |
| Phone number + Send code → OTP screen | ✅ navigates | `02-phone-filled.png`, `03-otp.png` |
| OTP verify → age gate | ✅ navigates (dev OTP path — see Limitations) | `04-age-gate.png` |
| **Age gate — under-18 rejection** | ✅ **BLOCKED** with "You must be at least 18 to use Tayfa" (safety gate works) | `05-age-gate-under18-blocked.png` |
| Age gate — valid 18+ → interests | ✅ proceeds | — |
| Interests (taste cards, "choose ≥5", live counter, search, category filters) | ✅ selection + "Continue with 6" enable logic | `06`, `07` |
| Consent (Location / Connected accounts / Biometric / Marketing; "DOES NOT GATE THE APP"; "Data stored in EU (Frankfurt)") | ✅ granular KVKK/GDPR toggles render | `08-consent.png`, `08b` |
| Location consent → **native OS permission dialog** (precise/approximate) | ✅ real permission flow fires + grant | `10-feed.png` (post-grant) |
| Profile setup (display name 0/40, bio 0/500, neighborhood; avatar initials) | ✅ fields + counters + button-enable | `09`, `09b` |
| Enter Tayfa → feed | ✅ reaches Discover | `10-feed.png` |

### DISCOVERY — ✅ PASS
- Feed loads with event cards. **Liquidity proof** banner "42 meetups near you this week / Within 5 km of you" renders. `10-feed.png`
- **Free safety filters** "Women only" + "Verified only" toggle on with checkmarks — confirmed free (never paywalled). `12-filter-verified.png`, `12b-filter-women.png`
- **Location privacy**: cards show neighborhood + fuzzed distance ("Kadıköy · 800 m away") — no precise pin. ✅
- Travel mode / multi-city switch / ghost-town behaviour — **PENDING** (not reached before disconnect).

### MATCHING — ✅ PASS
- **"Why you're seeing this"** expands to an explanation: "You both like Cycling +1 more / Interest match 84% · 800 m away · soonness boost". `11-why-seeing-this-FIXED.png`
- **AI icebreakers** render in chat (below).
- **BUG FOUND & FIXED** — see §Defects (the explanation showed **-114%** before the fix).

### EVENTS — ✅ PASS (with mock echo limitation)
- Event detail: title/date, host card (verified, reliability), **🔒 Neighborhood privacy** ("the exact spot unlocks for approved guests ~30 min before it starts; until then your location stays private"), "you have in common", "who's going" with per-member RSVP states (HOST/GOING/APPROVED), capacity ("4 going · 2 spots left"). `13-event-detail.png`
- **Join meetup** button present + tappable; **member state** ("✓ GOING" badge, "Open chat" + "Leave") reflected. `14`, `18-event-member-state.png`
- RSVP transition echo, waitlist, capacity edge cases, edit/cancel event, host approval — **PARTIAL/PENDING** (echo limited by static mock; host-only flows not yet exercised).

### CHAT — ✅ PASS (with mock echo limitation)
- Group chat renders: user messages, **system message** ("Ece joined the meetup"), **✨ ICEBREAKERS** AI chips, and the "Message the group…" composer + send. `19-chat.png`, `20-chat-typing.png`
- Typing + keyboard + send-button: composer accepts input and the send mutation fires. Sent-message echo + offline recovery — **PARTIAL** (static mock thread doesn't append; needs a live BFF).

### TRUST & SAFETY — ✅ PARTIAL PASS
- Event "…" → **Safety** action sheet: CANCEL / **BLOCK HOST** / **REPORT MEETUP**. `15-event-menu.png`
- **Report flow**: reason picker (SAFETY THREAT / SCAM OR MONEY REQUEST / HARASSMENT) → submit → returns cleanly. `16-report-flow.png`, `17-report-submitted.png`
- Block/unblock, verification prompt, verify-to-host, appeals UI, Safety Center, SOS — **PENDING** (not reached before disconnect).

### RETENTION / PAYMENTS / MULTI-CITY / MARKETPLACE / ACCESSIBILITY / PERFORMANCE / SECURITY
- **PENDING DEVICE RECONNECTION** — not yet executed.

---

## Defects found

### D1 — "Interest match −114%" in the explainability card — ✅ FIXED & VERIFIED
- **Severity:** Low (cosmetic / data-display; no crash, no safety impact).
- **Symptom:** "Why you're seeing this" rendered `Interest match -114%` — a negative, out-of-range percentage. `11-why-seeing-this.png` (before).
- **Root cause:** two issues — (1) `EventCard.tsx` did not clamp the displayed percentage; (2) the dev mock generated out-of-range ranking scores (it multiplied the large uid seed `n` (201…) by `0.01`, yielding negative `interestSimilarity`).
- **Fix:** (1) clamp the rendered value to `[0,100]%` in `EventCard.tsx` (production robustness — the UI can never show an out-of-range %); (2) bound mock ranking scores to `[0,1]` and derive a sane descending demo score. Committed.
- **Retest:** ✅ now renders `Interest match 84%`. `11-why-seeing-this-FIXED.png`.

### Observations (not app defects)
- **Dev-build HMR transient:** editing a deep module (mock-data) triggered Metro fast-refresh/full-reload that briefly showed a blank screen and reset the in-memory session (back to auth). This is a **dev/Metro artifact only** — a production release loads a static bundle and never HMRs. Cold launches always rendered correctly.
- **Mock echo limitations:** RSVP/chat-send mutations fire but the static dev mock doesn't echo new state (a real BFF returns updated state). Validated by switching the mock to a joined state to exercise the member/chat experience.

---

## Completion status (resume plan)

**Completed on device:** build/install, auth+onboarding (incl. under-18 block), discovery feed + free filters + location privacy, matching explainability (+bug fix), event detail + member state, group chat + AI icebreakers, T&S report flow + block menu.

**Remaining (pending device reconnection):**
1. Discovery: travel mode, multi-city switch (Istanbul/Ankara/İzmir), ghost-town behaviour.
2. Events: RSVP transitions/waitlist/capacity edge cases, edit/cancel, host approval.
3. Chat: long-message wrap, scroll, offline recovery.
4. T&S: block/unblock, verification prompt, verify-to-host, appeals, Safety Center, **SOS** (must be free).
5. Retention: crews, recurring plans, streaks, recap cards, lifecycle nudges.
6. Payments: paywall, entitlement change, upgrade prompts, premium gating — **verify safety stays free**.
7. Marketplace: host/marketplace UI (or document absent).
8. Accessibility: font scaling 100/130/150/180%, dark mode, landscape, small/large — no clipping/overlap/hidden actions.
9. Performance: cold/warm start, nav latency, scroll FPS, memory, leak check.
10. Security: blocked-user visibility, unauthorized navigation, premium bypass, safety-paywall — verify impossible.

The audit will resume and this document + the beta-readiness verdict will be completed once the device is reconnected.

_Screenshots: `screenshots/rc-audit/`._

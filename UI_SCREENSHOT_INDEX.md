# Tayfa — UI Screenshot Index

Full UI harvest for redesign preparation. **Device:** Xiaomi 22095RA98C, Android 13, **1080×2408 @440 dpi**. **Build:** standalone release APK (`__DEV__=false`, no Metro, `EXPO_PUBLIC_ALLOW_MOCK=1` so the canned mock data makes every surface walkable). All shots have the **real status bar visible**, **no debug overlays / redboxes / Metro warnings**. Captured 2026-06-30.

Folder: [`screenshots/ui-review/`](screenshots/ui-review/) · **27 images** (25 of the 26 required + 2 bonus hidden surfaces; `21-notifications` intentionally absent — see note).

| # | File | Screen | Notes |
|---|------|--------|-------|
| 00 | `00-FAILURE-unable-to-load-script.png` | **The reported failure** | Red "Unable to load script…" native error from the old DEBUG dev-client build with no Metro. Root cause + fix in `APP_LAUNCH_FAILURE_REPORT.md`. |
| 01 | `01-auth-phone.png` | Phone entry (`/(auth)/phone`) | "What's your number?" — `+90` prefill, number-pad up. Doubles as the standalone-launch proof. |
| 02 | `02-auth-otp.png` | OTP (`/(auth)/otp`) | "Enter the code" — 6-digit field, Resend, Verify. |
| 03 | `03-age-gate.png` | Age gate (`/(auth)/age-gate`) | "How old are you?" — hard 18+ gate, `YYYY-MM-DD` masked field. |
| 04 | `04-interests.png` | Interests (`/(onboarding)/interests`) | "Pick your vibe" — search + category chips (Music/Artists/TV/Film/Sport), choose ≥5. |
| 05 | `05-consent.png` | Consent (`/(onboarding)/consent`) | "Your data, your choice" — granular KVKK/GDPR toggles, "DOES NOT GATE THE APP", EU (Frankfurt) storage. |
| 06 | `06-profile-setup.png` | Profile setup (`/(onboarding)/profile`) | "Make it yours" — display name, bio, neighborhood, Enter Tayfa. |
| 07 | `07-feed.png` | Discover feed (`/(tabs)/feed`) | Header + liquidity banner ("42 meetups near you this week") + first event card. |
| 08 | `08-feed-filters.png` | Feed filters | Free safety filters (Women only / Verified only) on the discovery feed. |
| 09 | `09-event-card.png` | Event card (close-up) | A single ranked card — host reliability, mutual-interest chips, "X going · N spots left", "Why you're seeing this". |
| 09b | `09b-ranking-explanation.png` | **Ranking transparency** (bonus) | Expanded "Why you're seeing this": "You both like Board Games +1 more · Interest match 72% · 1.2 km away · soonness boost". |
| 10 | `10-event-detail.png` | Event detail (`/event/[id]`) | GOING badge, host, **Neighborhood privacy card** (exact spot unlocks ~30 min before), "You have in common", Who's going, Open chat. |
| 11 | `11-chat.png` | Group chat (`/event/[id]/chat`) | Conversation thread with member bubbles + system "joined" line + composer. |
| 12 | `12-chat-icebreakers.png` | Chat icebreakers | AI **Icebreakers** chips (grounded only in shared public interests), e.g. "Anyone want to grab food after?". |
| 13 | `13-create-event.png` | Host a hangout — form (`/(tabs)/create`) | Title, **privacy-preserving location picker** ("Your exact pin stays private…"), venue, When chips. |
| 14 | `14-safety-center.png` | Safety Center (`/safety-center`) | "ALWAYS FREE — NEVER BEHIND A PAYWALL", SOS, Türkiye emergency numbers, Share my plan. |
| 15 | `15-report-flow.png` | Report dialog (hidden surface) | "Report this meetup" action sheet — Safety threat / Scam or money request / Harassment, over dimmed detail. |
| 16 | `16-block-flow.png` | Block confirmation (hidden surface) | Block-user confirmation dialog. |
| 17 | `17-crews.png` | Crews (`/(tabs)/crews`) | Standing groups list — the retention surface beyond one-off meetups. |
| 18 | `18-profile.png` | You / profile (`/(tabs)/profile`) | Avatar, PHONE VERIFIED badge, Reliability/Safety/Meetups stats, interests, Edit profile, settings. |
| 19 | `19-paywall.png` | Tayfa+ paywall (`/paywall`) | "More & better, when you want it" — Annual ₺999 / Monthly ₺149, "always free" reassurance, feature list. |
| 20 | `20-settings.png` | Settings (profile, scrolled) | Settings rows: Safety Center, Tayfa+, Sign out, Delete account (KVKK/GDPR). |
| 21 | — | **Notifications — N/A** | The app has **no notification inbox / settings screen** (no `expo-notifications`, no push-token or inbox code). Intentionally not captured. |
| 21b | `21b-location-permission-dialog.png` | OS location permission (bonus) | Android runtime "while using the app / only this time / don't allow" dialog from the location consent flow. |
| 22 | `22-empty-state.png` | Feed empty state | "0 meetups near you this week · widened to 5 km" → "Quiet around here" illustration + "Host a meetup" CTA. |
| 23 | `23-loading-state.png` | Feed loading state | Pull-to-refresh spinner over the discovery feed (ember `RefreshControl`). |
| 24 | `24-error-state.png` | Validation error state | Age gate, fail-closed: under-18 date → red field + "You must be at least 18 to use Tayfa". |
| 25 | `25-verify-to-host.png` | Verify-to-host gate (`/(tabs)/create`) | "Verify to host — it's free" card (ID + liveness), Start free verification, "Verify to publish" (disabled). |

## Notes for the redesign

- **Safety is never gated.** Safety Center, verification, reporting, blocking, women-only / verified-only filters are all free (14, 15, 16, 25, 19).
- **Privacy is a visible product surface**, not fine print: neighborhood-fuzzing on the event detail (10) and create form (13), granular consent (05), EU data residency.
- **Trust signals everywhere:** verification shields, reliability scores, transparent ranking ("Why you're seeing this", 09b).
- `21-notifications` is the only required slot with no screen behind it — the product currently has no notifications surface. Flagged as a **design gap / opportunity** for the redesign rather than a captured screen.
- Two true app dialogs (report 15, block 16) and the OS permission dialog (21b) are included as "hidden surface" examples; the in-app action sheets and toasts otherwise reuse these same dialog and inline-error patterns.

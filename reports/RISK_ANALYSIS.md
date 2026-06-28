# RISK ANALYSIS — Tayfa (working codename)

> **Companion to:** `roadmaps/APP_EXECUTION_ROADMAP.md` (source of truth) · sibling reports: `GROWTH_STRATEGY.md`, `TECH_DECISIONS.md`, `MONETIZATION_ANALYSIS.md`.
> **Authors (role hats):** Principal Engineer / CTO · Head of Trust & Safety · Data Protection Officer (DPO).
> **Product under analysis:** A verified, location-based social app that turns shared hobbies into real-life **small-group** hangouts for 18–32-year-olds who are new to a city or lonely in it. **Explicitly not a dating app.** Beachhead: Istanbul → TR → EU.
> **Why this report exists:** Tayfa's core action is *putting strangers together in the physical world*. That single fact makes this the most important document in the roadmap. Everything below is written in that light — brutally, not defensively.
> **Generated:** 2026-06-26 · Risk report version 1.0 · Review cadence: monthly (T&S + DPO) until P5 ships, then quarterly + after every Sev-1.

---

## 0. How To Read This Report (scoring method)

Severity is deliberate, not vibes. Each register row carries:

- **Likelihood (L)** — `L=1` (rare), `M=2` (plausible within a year of operation), `H=3` (expected at our scale).
- **Impact (I)** — `L=1`, `M=2`, `H=3`, **`Critical=5`** (Critical is weighted to dominate: a single Critical event can end the company, regardless of likelihood).
- **Severity score = L × I** (range 1–15). Bands: **10–15 = CRITICAL (red)**, **6–9 = HIGH (orange)**, **3–5 = MEDIUM (yellow)**, **1–2 = LOW (green)**.

**Owner glossary:** `HTS` Head of Trust & Safety · `DPO` Data Protection Officer · `CTO` CTO/Principal Engineer · `GROWTH` Founder/Head of Growth · `OPS` Head of Operations · `LEGAL` General Counsel (incl. external TR/EU counsel) · `PM` Head of Product · `FIN` Finance/CEO.

A guiding principle inherited from the roadmap and reinforced here: **safety is never paywalled, never deferred for velocity, and never marketed as a guarantee.** The honest posture is *harm reduction + accountability + fast response* — not "safe."

---

## 1. Executive Risk Summary — The 5 Existential Risks (ranked)

These are the risks that can *end the company*, not merely bruise a metric. Ranked by `existential weight = how completely failure here kills Tayfa`, with likelihood as the tie-breaker.

| # | Existential risk | One-line |
|---|---|---|
| **1** | **A serious real-world safety incident** (sexual assault, violence, abduction) at or after a Tayfa meetup — disproportionately a young woman meeting a man she matched with. | The product's entire premise (strangers meeting IRL) is also its kill-switch: one credible incident + press + a grieving family = brand death, criminal/civil exposure, store removal, and investor flight — and the MVP ships the *meeting* capability (P3) **before** the full safety system (P5). |
| **2** | **Cold-start liquidity failure in Istanbul** — the feed never reaches density, so meetups don't happen and the North Star (Weekly Completed Meetups) flatlines. | This is the *most likely* killer and it kills *first*: without ≥40 live events/week within 5 km of the median user, there is no loop, no retention, no virality, and no amount of safety or AI matters. |
| **3** | **Predatory misuse + age-gate bypass** — the platform becomes a hunting ground because it self-selects *isolated, lonely, low-local-network* targets and only self-declares 18+. | This compounds Risk 1 and adds criminal-facilitation and child-safety exposure (a minor on an adults' meet-strangers app); it is the specific shape Risk 1 takes when an adversary, not bad luck, is the cause. |
| **4** | **KVKK/GDPR + duty-of-care legal exposure** — mishandled location data, biometric (liveness) data treated as ordinary, unlawful TR↔EU transfer, no VERBİS, and platform liability for offline harm. | Turkish + EU regulators and a single plaintiff's lawyer can each, independently, impose existential cost: KVKK administrative fines, forced processing halts, and a negligence theory that "you matched us, you owe a duty of care." |
| **5** | **Unit economics never close in a low-WTP market** — verification burn (Persona) + 24/7 T&S staffing + AI/media cost outrun TR subscription revenue; CAC > LTV. | Tayfa is structurally *expensive* (it must pay for trust) and structurally *cheap to monetize* (TR PPP, safety free forever) — the scissors can run the company out of cash before the network effect compounds. |

**The single most important risk to internalize:** *Risk 1.* Not because it is the most likely, but because it is the only one that is simultaneously **(a) irreversible**, **(b) a direct consequence of the product working as designed**, and **(c) currently under-mitigated in the MVP timeline.** Everything in §3 exists to drag Risk 1's likelihood down and its response time to near-zero.

---

## 2. Risk Register

Unified schema for every sub-table: **ID · Risk · Likelihood · Impact · Severity (score / band) · Owner · Mitigation · Early-warning metric.** Grouped by category. Physical safety is first and longest by design.

### 2.1 Physical Safety / Real-World Harm — `PS` (the #1 category)

This category is treated as primary. No other risk class is allowed to be better-resourced than this one.

| ID | Risk | L | I | Severity | Owner | Mitigation | Early-warning metric |
|---|---|---|---|---|---|---|---|
| **PS-01** | **Sexual assault / rape** during or after a meetup — typically when a group event collapses to a de-facto 1:1, or a follow-on "let's go somewhere quieter." | M | Critical | **10 — CRITICAL** | HTS | Small-group-default (min 2, encourage 3+); public-venue nudging at event creation; *no 1:1 default*; "is this still a group?" check-in; verified-only & women-only filters (P5); post-meetup safety rating with private flag; suspend-on-credible-report < 30 min; survivor-first Sev-1 protocol (§3.5). | Reports tagged `safety_sexual` per 1k meetups; share of meetups that decayed to 1:1; women-segment report rate. |
| **PS-02** | **Physical assault / violence** at a meetup (escalation, intoxication, premeditated). | M | Critical | **10 — CRITICAL** | HTS | Public-venue default; reliability/safety score gating (low-trust users can't host); in-meetup SOS + local emergency (112) one-tap; ban-evasion fingerprinting; venue-partner "safe-host" sites at scale. | Violent-incident reports per 1k meetups; SOS activations; police-report follow-ups logged. |
| **PS-03** | **Stalking via location** — a user de-fuzzes or socially-engineers another's home neighborhood and follows them, or uses opt-in live-location after a fallout. | M | High | **6 — HIGH** | CTO | Server-enforced location fuzzing (geocell centroid) — *precise pin released only to approved members, only near `starts_at`*; live-location is opt-in, time-boxed, crew-scoped, instantly revocable; never expose a "people near me" map; block instantly severs all location sharing. | De-fuzzing/scrape anomaly alerts; live-location-after-block attempts; stalking-tagged reports. |
| **PS-04** | **Harassment / unwanted advances** (in-app DMs + IRL), disproportionately toward women — the slow-bleed risk that drives the highest-value safety-sensitive segment off the platform. | H | High | **9 — HIGH** | HTS | Text moderation + risk scoring on messages (P5); DM gated behind Verified+ (id_live); one-tap block+report; rate-limit new-contact velocity; "decline without explaining" UX; women-only events option. | Harassment reports/active user; women W4 retention vs overall; block rate on first-contact DMs. |
| **PS-05** | **Predator targets the isolated newcomer** — *Newcomer Nilay* (0 local friends, no one to compare notes with) is the textbook grooming target; the app's own targeting *finds* her. | M | Critical | **10 — CRITICAL** | HTS | Verification tiers (ID+liveness to host/DM); behavioral anomaly detection (one account messaging many new/young/female accounts); conservative people-recommendations; "keep it in a group" and "tell a friend your plan" nudges in MVP; never recommend a high-risk-scored user. | Fan-out messaging anomalies; account age vs target-age skew; grooming-pattern model hits (P5). |
| **PS-06** | **Minor bypasses the 18+ age-gate** (false birthdate; borrowed/edited ID) and attends an adults' meetup → child-safety incident, criminal exposure, and CSAM risk in chat/photos. | M | Critical | **10 — CRITICAL** | HTS / DPO | 18+ hard gate at signup; **age-assurance escalation** — ID/liveness (Persona) catches age at the host/DM step; image moderation flags apparent minors; CSAM detection + mandatory NCMEC/INHOPE-style reporting + immediate law-enforcement preservation; no public discovery of users until phone-verified. | Verification age-mismatch rate; apparent-minor image flags; reports tagged `minor_suspected`. |
| **PS-07** | **Lure-to-location** — a fabricated event ("come to this address at 10pm") used to set up robbery, mugging, or worse. | M | High | **6 — HIGH** | HTS | Public-venue nudging + warning on private/residential pins; host reliability/verification surfaced before RSVP; precise location withheld until near start; report-an-address flow; new-host event throttling. | Private/residential-pin event share; reports on first-time hosts; RSVP-then-cancel-then-relocate patterns. |
| **PS-08** | **Coercive group dynamics** — a "crew" becomes a pressure environment: MLM/recruitment, cult, radicalization, or a single dominant member isolating a newcomer. | L | High | **3 — MEDIUM** | HTS | Crew-report flow; detection of repeated solo-recruiting hosts; commercial-recruitment policy in ToS; member can leave any crew instantly with no notification to others. | Crew churn spikes; "all roads lead to one host" graph patterns; recruitment-tagged reports. |
| **PS-09** | **Drink-spiking / drugging** at nightlife/bar meetups. | M | Critical | **10 — CRITICAL** | HTS | Safety-center guidance for nightlife events; "watch your drink / stay with the group" contextual tips; venue-partner program favors reputable venues; SOS + check-in window; rating flags feed risk score. | Nightlife-event incident reports; venue-clustered report patterns. |
| **PS-10** | **Intimate-partner abuser / ex locates a victim** via the platform (especially any location feature, or by recognizing a profile). | M | Critical | **10 — CRITICAL** | HTS / CTO | Block = total severance (no location, no presence, no co-event visibility, no "people you may know"); "don't show me to people who don't have my number" privacy mode; rapid full-erasure path; never surface mutual-contact hints that reveal presence. | Block-then-reappear attempts; erasure requests citing safety; ban-evasion-near-a-blocker signals. |
| **PS-11** | **Medical emergency / no responsible-party protocol** at a meetup (allergic reaction, fall, panic attack) with diffusion of responsibility. | L | High | **3 — MEDIUM** | OPS | In-app emergency numbers (112) + nearest-hospital info in safety center; host "first aid / emergency" prompt for activity types; check-in window catches no-response. | Unresolved check-in windows; emergency-info taps; incident reports tagged `medical`. |
| **PS-12** | **Off-platform escalation** — users move to WhatsApp/Instagram immediately, then harm occurs where Tayfa has no visibility, no evidence, and no levers. | H | High | **9 — HIGH** | HTS / PM | Make in-app coordination strictly better pre-meetup (group chat, reminders, check-in, plan-sharing) so there's *less reason* to leave; in-app warning when a number/handle is shared early; retain in-app evidence trail; honest messaging that off-platform = unprotected. | Share-of-meetups with zero in-app chat after RSVP; contact-info-share rate pre-meetup; "we moved to WhatsApp" survey signal. |

**Honest framing for the board:** No software prevents a determined offender in the physical world. Tayfa's job is to (1) make targeting *harder* (verification, fuzzing, group default), (2) make detection *faster* (moderation, anomalies, reports), (3) make response *near-instant* (Sev-1, <30 min), and (4) make consequences *certain* (ban-evasion, law-enforcement cooperation). We must never sell "safe." We sell "safer, verified, and accountable" — and we must be able to *prove* the program existed when it matters legally (§3.6).

### 2.2 Trust & Abuse — `TA`

| ID | Risk | L | I | Severity | Owner | Mitigation | Early-warning metric |
|---|---|---|---|---|---|---|---|
| **TA-01** | **Catfishing / fake profiles** — stolen photos, fabricated identity, bypassing photo liveness. | M | High | **6 — HIGH** | HTS | Liveness selfie ↔ profile-photo match (P5); reverse-image checks on upload; Verified+ badge as the trust signal; report-as-fake flow; new-account discovery throttling. | Photo-liveness mismatch rate; fake-profile reports; reused-image hits. |
| **TA-02** | **Ban evasion** — banned bad actors re-register with a new phone/email and resume. | H | High | **9 — HIGH** | HTS / CTO | Device + phone + ID fingerprinting (P5) from a *lightweight day-one baseline*; ID-hash matching at verification; risk-scored new accounts; manual review of re-registration signals. | Re-registration match rate; time-to-rebahn; banned-fingerprint reappearance. |
| **TA-03** | **Romance-scam / financial-fraud crossover** *despite* the anti-dating stance — scammers love isolated, lonely newcomers; "platonic" is just their cover story. | H | High | **9 — HIGH** | HTS | "Never send money" interstitials; detection of money/crypto/IBAN/gift-card language; off-platform-payment warnings; report-a-scam; verification raises cost-of-attack; scam-pattern model. | Money-keyword message rate; scam reports; sudden cross-city/foreign-account contact spikes. |
| **TA-04** | **Spam / promotional abuse** — DM/event spam, OnlyFans/crypto/MLM promo, link-spam. | H | Medium | **6 — HIGH** | HTS | Rate limits (Redis) on messages/events/new-contacts; link + repeated-content detection; new-account throttles; promo policy enforcement. | Messages-per-account outliers; link-share rate; spam reports per 1k DMs. |
| **TA-05** | **Coordinated inauthentic behavior** — botnets faking liquidity, rating/reputation manipulation, or **brigaded reports** to mass-falsely-ban a target (often a woman who rejected someone). | M | High | **6 — HIGH** | HTS | BotID + WAF on signup/auth; report *quality* weighting (not raw count); cluster detection on coordinated reports; human review before bans triggered by report-volume alone. | Report-burst-against-one-target alerts; new-account clustering; rating-velocity anomalies. |
| **TA-06** | **NSM gaming** — two/many accounts faking "completed meetups" to farm referral rewards or inflate reliability/safety scores. | M | High | **6 — HIGH** | CTO / HTS | NSM = geofence ∩ mutual-confirm ∩ anti-collusion signals; rewards gated on *referee's first real meetup*; device/graph collusion detection; reward idempotency + fraud holds. | Self-referral graph density; same-device mutual-confirms; reward-clawback rate. |
| **TA-07** | **Weaponized false reports** — the report button used as a retaliation tool. | M | High | **6 — HIGH** | HTS | Two-sided context in moderation; reporter-reputation weighting; appeals flow; no auto-ban on a single report; pattern-of-false-reporting penalties. | False-report-confirmation rate; appeal-overturn rate; serial-reporter flags. |
| **TA-08** | **Brand impersonation / phishing** — fake "Tayfa" events, fake login pages harvesting OTP. | M | Medium | **4 — MEDIUM** | CTO | OTP anti-phishing copy ("we never ask…"); domain/brand monitoring; in-app-only auth; takedown process. | Credential-stuffing spikes; OTP-abuse rate; reported phishing domains. |
| **TA-09** | **Sextortion** — a contact obtained via Tayfa used to blackmail with images. | M | High | **6 — HIGH** | HTS | Image-share friction + warnings; sextortion-pattern detection; dedicated report reason → fast-track + resources; cooperation with law enforcement. | Sextortion-tagged reports; threat-language detection hits. |

### 2.3 Privacy & Data — `PD`

| ID | Risk | L | I | Severity | Owner | Mitigation | Early-warning metric |
|---|---|---|---|---|---|---|---|
| **PD-01** | **Precise-location exposure** — de-fuzzing, a precise-pin leak to non-approved members, or "who's nearby" inference enabling physical targeting. | M | Critical | **10 — CRITICAL** | CTO / DPO | Precise coords *never* in a client-readable row; fuzzed centroid stored in a separate public column/view; precise pin via BFF only, only to approved members, only near start; no people-proximity surface; pen-test the de-fuzzing path. | Any precise-coord egress to non-approved user (alert = Sev-1); scrape-pattern alerts. |
| **PD-02** | **ID-document / biometric PII breach** — liveness/face data and ID references exposed. | M | Critical | **10 — CRITICAL** | DPO / CTO | Store *provider references, not raw documents* (Persona holds the docs); biometric = special category → explicit consent + encryption + short retention; minimize fields; DPA with Persona; access via BFF service-role only + audit. | Verification-table access anomalies; retention-window breaches; sub-processor incident notices. |
| **PD-03** | **General data breach** — Postgres exfiltration via a leaked service-role key or an RLS bypass; the catastrophic one (location + chat + PII in one place). | M | Critical | **10 — CRITICAL** | CTO | RLS deny-by-default + column-level protection; minimize service-role usage + rotate keys; secrets in vaults never client; PITR backups; breach runbook with **72h** Board + GDPR notification clock. | Anomalous bulk reads; service-role usage outside BFF; failed-RLS-policy CI signals. |
| **PD-04** | **Re-identification** from "aggregate" data — a single user in a sparse geocell + a rare interest combo is uniquely identifiable. | M | High | **6 — HIGH** | DPO | k-anonymity thresholds on any public/aggregate surface; suppress low-count geocells; never publish per-neighborhood user counts below a floor; review BigQuery/dbt exports. | Low-k geocell exposure attempts; uniqueness audits on shared surfaces. |
| **PD-05** | **Over-collection** — connected accounts (Spotify/Letterboxd), birthdate, precise location collected beyond stated purpose (data-minimization breach). | M | High | **6 — HIGH** | DPO | Granular separate consents (location/marketing/connected-accounts); collect-what-we-use review per field; purpose-limitation in RoPA; default precise-location *off* until needed. | Consent-vs-collection drift audit; fields-collected-but-unused count. |
| **PD-06** | **Third-party leakage via PostHog session replay** — replay captures chat content, location, or PII. | M | High | **6 — HIGH** | DPO / CTO | Mask all inputs/PII/location in replay by default; disable replay on chat & verification screens; EU-region PostHog; consent-gated analytics; event-schema discipline. | Unmasked-field audits; replay-on-sensitive-screen checks. |
| **PD-07** | **Sub-processor breach** — Persona, Hive/Rekognition (AWS), OpenAI, Braze, RevenueCat, Cloudflare, Inngest, Upstash, Vercel breached; data leaves EU control. | M | High | **6 — HIGH** | DPO | DPA + EU-region with every sub-processor; OpenAI/AI-Gateway zero-retention; maintain a sub-processor register; vendor incident-notification SLAs; minimize data sent per vendor. | Vendor security-incident notices; sub-processor SOC2/ISO lapse; data-egress-per-vendor review. |
| **PD-08** | **Chat-content exposure** — RLS misconfig on `message`, Realtime authorization gap, or the Stream migration (P8) leaking history. | M | Critical | **10 — CRITICAL** | CTO | RLS so only `conversation_member` reads; Supabase Realtime Authorization on the channel; chat-RLS test in CI; migration-integrity + access tests before cutover. | Cross-conversation read attempts; Realtime auth failures; migration-diff anomalies. |
| **PD-09** | **Incomplete erasure** — R2 media orphans, BigQuery copies, backups, and sub-processor caches survive a delete request (KVKK/GDPR violation). | M | High | **6 — HIGH** | DPO / CTO | Erasure orchestration fans out to *all* stores + sub-processors (Inngest); media tombstoning; backup-expiry honors erasure; erasure verification job + audit. | Erasure-completeness audit; orphaned-media count; DSR SLA adherence. |

### 2.4 Legal & Compliance — `LC` (KVKK + GDPR + platform liability)

| ID | Risk | L | I | Severity | Owner | Mitigation | Early-warning metric |
|---|---|---|---|---|---|---|---|
| **LC-01** | **VERBİS non-/late registration** — Tayfa processes special-category (biometric) data as a core activity and (if structured abroad) has **no de-minimis exemption**; failure = administrative fine. | M | High | **6 — HIGH** | DPO / LEGAL | Register in VERBİS *before first user*; if controller is non-TR, appoint a TR data-controller representative (notarized + apostilled board resolution); maintain RoPA. | Registration status (binary launch-blocker); Authority correspondence. |
| **LC-02** | **Defective aydınlatma metni / consent** — missing or bundled clarification text (KVKK Art. 10) and explicit consent (açık rıza), unlawful processing follows. | M | High | **6 — HIGH** | DPO / LEGAL | Standalone *aydınlatma metni* at each collection point; unbundled, specific, withdrawable consents; layered notices; consent-version logging. | Consent-capture rate (target 100%); consent-version coverage; legal review sign-off. |
| **LC-03** | **Unlawful TR↔EU transfer** — storing TR-resident data in Supabase **Frankfurt** is a cross-border transfer under KVKK Art. 9; post-1-Sept-2024 explicit consent is invalid for regular/repeated transfers, and Turkey has issued no EU adequacy decision. | M | High | **6 — HIGH** | DPO / LEGAL | Execute the Board-published **standard contract (standart sözleşme)** with the EU processor, in Turkish, and **notify the Authority within 5 business days** of signing; document the basis per data flow; revisit if an adequacy decision lands. | Transfer-mechanism status per processor; 5-day notification log; new-vendor transfer review. |
| **LC-04** | **Biometric data treated as ordinary** — liveness/face is *özel nitelikli kişisel veri* (special category, KVKK Art. 6 / GDPR Art. 9); processing without an explicit-consent basis + safeguards is a serious violation. | M | Critical | **10 — CRITICAL** | DPO / LEGAL | Explicit, separate consent for biometric verification; provider-ref-only storage; encryption + short retention; **DPIA** for the verification flow; Board "adequate measures" checklist for special-category data. | DPIA completion; biometric-consent coverage; retention-window audit. |
| **LC-05** | **Platform liability for offline harm / duty of care** — a negligence theory ("you matched us, you owed a duty") after an incident; civil claims, possibly criminal-facilitation scrutiny. | M | Critical | **10 — CRITICAL** | LEGAL / HTS | Documented *reasonable-care* program (this report + §3) is the core defense; honest non-guarantee messaging; robust ToS + warnings; demonstrable T&S diligence logs; incident records; insurance (LC-07). | Incident count + response-time logs; counsel risk review; regulatory inquiries. |
| **LC-06** | **Data-subject-rights SLA breach** — export/delete/rectification not served within the GDPR 30-day / KVKK ~30-day window. | M | High | **6 — HIGH** | DPO / CTO | Self-serve export/delete from **P1** (already in roadmap); DSR ticket SLA dashboard; identity-verification on requests; erasure orchestration (PD-09). | DSR queue age; SLA-breach count; export/delete success rate. |
| **LC-07** | **Insufficient / no insurance at the first incident** — no general/public liability, cyber, D&O, or **abuse & molestation** cover when a claim lands. | M | High | **6 — HIGH** | FIN / LEGAL | Bind public/general liability + cyber + D&O + tech E&O + a specialty **abuse/molestation** line *before first meetup* (likely placed via London/Lloyd's market; TR market is thin); annual limits review vs scale. | Coverage-bound status (launch-blocker); limit adequacy vs MAU; claims history. |
| **LC-08** | **Unenforceable waivers** — relying on ToS to disclaim personal-injury liability; under Türk Borçlar Kanunu (and consumer law) you cannot pre-waive gross negligence/willful harm. | M | High | **6 — HIGH** | LEGAL | Treat waivers as risk-reducing, not liability-eliminating; pair with real safety program + insurance; jurisdiction-appropriate ToS; consumer-law-compliant terms. | Counsel enforceability review; ToS version control. |
| **LC-09** | **18+ enforcement failure** — a 16–17-year-old on an adults' meet-strangers app triggers child-data (KVKK/GDPR Art. 8) + criminal exposure. | M | High | **6 — HIGH** | DPO / HTS | Hard 18+ gate; age-assurance escalation at verification; apparent-minor image flags; immediate removal + preservation protocol. (Tightly coupled to PS-06.) | Verification age-mismatch rate; minor-suspected reports. |
| **LC-10** | **App Store / Google Play policy action** — UGC-safety requirements (reporting, blocking, objectionable-content), or a "dating-adjacent" category review, leading to rejection/removal. | M | High | **6 — HIGH** | PM / LEGAL | Block/report from day one (already MVP); clear UGC moderation + content policy; position firmly as *platonic social*, not dating, in store metadata; appeal playbook. | Store review flags; rejection notices; policy-update monitoring. |
| **LC-11** | **Law-enforcement cooperation / evidence preservation failure** — inability to preserve and lawfully produce data after a crime is reported. | M | Medium | **4 — MEDIUM** | LEGAL / HTS | Legal-hold + evidence-preservation runbook; defined LE-request process; immutable moderation audit log; chat-retention policy balancing privacy vs preservation. | LE-request response time; preservation-hold coverage. |
| **LC-12** | **EU Digital Services Act (DSA) obligations** unmet on EU expansion — notice-and-action, transparency reporting, trusted flaggers, point-of-contact. | M | Medium | **4 — MEDIUM** | LEGAL / HTS | DSA-readiness package staged for EU entry; statement-of-reasons on moderation actions; transparency-report tooling reused from the audit log. | EU-launch readiness checklist; DSA correspondence. |

### 2.5 Technical — `TE`

| ID | Risk | L | I | Severity | Owner | Mitigation | Early-warning metric |
|---|---|---|---|---|---|---|---|
| **TE-01** | **RLS misconfig → cross-user data leak** — one missing/loose policy exposes home neighborhoods, chats, PII. RLS is the *primary* boundary, so a single gap is catastrophic. | M | Critical | **10 — CRITICAL** | CTO | Deny-by-default; CI fails if any table lacks a *tested* policy; column-level protection for location/birthdate; periodic policy red-team; defense-in-depth via BFF for sensitive reads. | RLS-policy test coverage (must be 100%); cross-user read attempts; pen-test findings. |
| **TE-02** | **Chat-migration data loss** — Supabase Realtime → Stream (P8) on the most-used retention surface. | M | High | **6 — HIGH** | CTO | Dual-write → verify → cutover with rollback; migration-integrity test (zero-loss proof); chat-abstraction layer in P3 to shrink blast radius. | Message-count parity during dual-write; integrity-test diffs. |
| **TE-03** | **Capacity race** — last-seat double-book / RSVP integrity under concurrency. | M | Medium | **4 — MEDIUM** | CTO | Transactional capacity decrement; concurrency test for last-seat race; idempotent RSVP transitions. | Over-capacity events; RSVP-state anomalies. |
| **TE-04** | **Realtime reliability** — chat/presence outage breaks pre-meetup coordination → no-shows, trust erosion. | M | High | **6 — HIGH** | CTO | Reconnect/backoff; message delivery confirmations; degrade gracefully to push; uptime SLOs + alerts. | Realtime disconnect rate; message-delivery-failure rate. |
| **TE-05** | **AI/provider outage** — Persona/Hive/OpenAI down blocks verification or moderation; the *fail-open vs fail-safe* decision. | M | High | **6 — HIGH** | CTO / HTS | **Fail safe, not open** — on provider failure, deny the privileged action (no host/DM/upload) rather than letting unmoderated content through; queue + retry; status-page monitoring; provider redundancy via AI Gateway. | Provider error rate; verification/moderation queue backlog; fail-open incidents (must be zero). |
| **TE-06** | **Cost runaway** — abuse-driven spikes in AI/verification/media/notification spend (a verification-spam attack burns cash directly). | M | High | **6 — HIGH** | CTO / FIN | Rate-limit verification + uploads + AI endpoints; per-feature cost budgets + alerts; cache/batch/defer all AI; cost-per-active-user dashboard (P8 formalized, lightweight from P1). | Daily spend vs budget; cost-per-active-user trend; per-endpoint call spikes. |
| **TE-07** | **GPS/geofence spoofing** defeats NSM confirmation *and* in-meetup check-in/SOS reliability. | M | High | **6 — HIGH** | CTO / HTS | Multi-signal NSM (geofence ∩ mutual-confirm ∩ device/behavior); mock-location detection; treat check-in as one signal, not proof-of-safety; anti-collusion graph checks. | Mock-location flags; confirm-without-geo anomalies; spoofing-cluster detection. |
| **TE-08** | **Single-region (Frankfurt) outage** — full platform down, including *safety-critical paths* (check-in, SOS, report) during live meetups. | M | High | **6 — HIGH** | CTO | Multi-AZ within region; PITR + DR runbook *before* P8; static fallback for emergency numbers/safety center; status comms; multi-region DR roadmap. | Region health; RTO/RPO drill results; safety-path availability SLO. |
| **TE-09** | **Leaked secrets** — service-role key / provider keys in a client bundle or repo bypass RLS entirely. | M | Critical | **10 — CRITICAL** | CTO | Secrets in Vercel/Supabase vaults only; secret-scanning in CI; key rotation; least-privilege keys; no service-role on client; bundle audits. | Secret-scan hits; anomalous service-role auth; key-age monitoring. |
| **TE-10** | **Push (Expo) outage** — safety reminders / check-in prompts not delivered. | L | Medium | **2 — LOW** | CTO | In-app fallback for safety prompts; don't make push the *only* channel for safety-critical nudges; monitor delivery. | Push-delivery success rate. |

### 2.6 Product / Behavioral — `PB`

| ID | Risk | L | I | Severity | Owner | Mitigation | Early-warning metric |
|---|---|---|---|---|---|---|---|
| **PB-01** | **No-shows erode trust** — host shows up, nobody comes; the loneliness app *deepens* loneliness. | H | High | **9 — HIGH** | PM | Reliability score (social currency); RSVP→reminder→commitment ladder; pre-meetup chat warm-up; gentle no-show consequences; over-RSVP small groups. | No-show rate (<25% target); reliability-score distribution; first-meetup abandonment. |
| **PB-02** | **Empty-feed cold start** — the ghost-town first impression kills activation before any feature matters. | H | High | **9 — HIGH** | GROWTH | Liquidity-proof banner; *real* seeded ambassador events (never phantom); radius/curation fallback; never render empty (ghost-town guard). (Couples to GM-01.) | First-session feed-event count; signup→first-RSVP rate; empty-feed impressions (must trend to 0). |
| **PB-03** | **Notification fatigue** → opt-out / uninstall. | M | Medium | **4 — MEDIUM** | PM / GROWTH | Hard frequency caps; "would a friend text this?" bar; granular per-category controls; send-time optimization. | Opt-out rate (<15%); push-driven uninstall; CTR decay. |
| **PB-04** | **Filter-bubble loneliness** — over-personalization narrows the world and isolates; ironic and brand-corrosive for a *loneliness* product. | M | Medium | **4 — MEDIUM** | PM | Serendipity term in ranking; diversity injection; "meet someone different" surfaces; guardrail on homogeneity. | Match-diversity metric; repeat-same-people rate; satisfaction vs novelty. |
| **PB-05** | **Dark-pattern / mission drift** — internal metrics drift toward in-app time instead of real meetups; the app starts competing with the user's real life. | M | High | **6 — HIGH** | PM / GROWTH | NSM (real meetups) as the *only* North Star; no engagement-bait; "the app wins when you're out with people" charter; review features against NSM, not session time. | Session-time-vs-NSM divergence; vanity-metric creep in dashboards. |
| **PB-06** | **Toxic community dynamics** — cliques, regulars-vs-newbies gatekeeping, exclusionary crews; newcomers (the core persona) get frozen out. | M | High | **6 — HIGH** | HTS / PM | Newcomer-friendly event types; anti-exclusion norms in community guidelines; "first-timer welcome" nudges; report-exclusionary-behavior; balance recurring crews with open events. | Newcomer retention vs veteran; crew-closedness metric; exclusion reports. |
| **PB-07** | **"Is this a date?" ambiguity returns** — the anti-dating positioning fails in practice; the app becomes a soft dating app, poisoning platonic intent and amplifying safety risk. | H | High | **9 — HIGH** | PM / HTS | Group-default reinforces platonic framing; copy + norms relentlessly platonic; detect/curb 1:1-romantic drift; no dating-style "see who likes you" framing (tension with premium — see §5); women-only options. | Share of 1:1-from-group conversions; "felt like a date" survey signal; romantic-intent reports. |
| **PB-08** | **Meetup-quality variance** — awkward/low-quality first meetups → negative word-of-mouth in a WoM-dependent product. | M | Medium | **4 — MEDIUM** | PM | Icebreakers (P4); good event-template design; small-group format; host quality signals; post-meetup feedback loop. | Vibe-rating distribution; would-meet-again rate; first-meetup NPS. |

### 2.7 Growth / Market — `GM`

| ID | Risk | L | I | Severity | Owner | Mitigation | Early-warning metric |
|---|---|---|---|---|---|---|---|
| **GM-01** | **Cold-start liquidity per city** — Istanbul never reaches the ≥40 live events/wk within 5 km density floor; the loop never ignites. | H | Critical | **15 — CRITICAL** | GROWTH | One-city focus; neighborhood-by-neighborhood saturation (start Kadıköy); *real* ambassador/seed hosts; partner pipeline (campuses, run clubs, climbing gyms, board-game cafés); ghost-town guard; liquidity go/no-go gate before any scale spend. | Live events/wk within 5 km of median user; events-per-active-host; geocell liquidity heatmap. |
| **GM-02** | **Low willingness-to-pay in TR** — subscription revenue can't cover Tayfa's structurally high trust costs. | H | High | **9 — HIGH** | FIN / GROWTH | TR PPP pricing + annual anchoring; revenue diversification (marketplace P9, B2B2C); keep CAC near-zero via virality; consider earlier B2B2C pilots (§5). | Free→paid % (TR); trial→paid; ARPU vs cost-per-active-user. |
| **GM-03** | **CAC > LTV** — paid acquisition is unsustainable; growth must be organic or die. | M | High | **6 — HIGH** | GROWTH / FIN | Structural virality (every event is multiplayer); quality-gated referral; recap-card shareability; gate scale spend on LTV:CAC ≥3. | Blended CAC; LTV:CAC; organic-vs-paid mix; k-factor. |
| **GM-04** | **Single-city concentration** — all eggs in Istanbul; one bad press cycle (esp. a safety incident) is *total*, not partial. | M | High | **6 — HIGH** | FIN / GROWTH | Economic logic favors focus, but pre-stage a second-city playbook + crisis-comms so concentration is a *choice*, not a trap; brand-resilience reserve. | Brand-sentiment monitoring; press-mention risk; concentration ratio. |
| **GM-05** | **Incumbent response** — Bumble BFF, Meetup, Timeleft, or even Instagram/Tinder bolt on hobby-group features. | M | Medium | **4 — MEDIUM** | GROWTH / PM | Defensible moat = local liquidity + verification trust + interest graph + reputation (switching costs); move fast in the beachhead; safety as brand. | Competitor feature launches; share-of-voice; churn-to-competitor signal. |
| **GM-06** | **Virality outpaces T&S capacity** — growth hacks increase stranger-contact volume faster than safety can scale; incident exposure spikes. | M | High | **6 — HIGH** | HTS / GROWTH | **Safety-leads rule**: T&S capacity + tooling is a *gate* on virality switches; scale growth only as incident-rate and SLA hold; throttle growth if queue/SLA degrade. | Reports-per-meetup trend vs growth rate; T&S queue depth; SLA adherence under load. |
| **GM-07** | **Supply (host) shortage** — demand outpaces hosts; seekers arrive to empty experiences (the classic marketplace failure). | H | High | **9 — HIGH** | GROWTH / PM | Host-side gamification (leaderboards, perks); AI event-template friction-removal; ambassador hosts; make hosting low-effort + high-status; supply dashboards per geocell. | Host:seeker ratio per geocell; events created per host; host churn. |
| **GM-08** | **Seasonality** — winter dip in IRL activity → engagement + revenue trough. | M | Medium | **4 — MEDIUM** | PM / GROWTH | Indoor-activity programming; win-back; annual subs smooth revenue; seasonal event templates. | Seasonal NSM variance; winter cohort retention. |

### 2.8 Financial / Operational — `FO`

| ID | Risk | L | I | Severity | Owner | Mitigation | Early-warning metric |
|---|---|---|---|---|---|---|---|
| **FO-01** | **Verification cost burn** — Persona ID+liveness (~€1–1.5/verify) scales with abuse and growth. | M | High | **6 — HIGH** | FIN / CTO | *Deferred, tiered* verification (only hosts/DM/Verified+ pay the cost; phone free); rate-limit verification; cache verification state; abuse-driven re-verify guards. | Verifications/active user; verification spend; verification-spam attempts. |
| **FO-02** | **AI / media cost at scale** — moderation volume + image-storage egress. | M | Medium | **4 — MEDIUM** | CTO / FIN | Moderate only new/edited content + hash-cache; R2 + CDN + transforms (never serve originals); per-feature budgets. | Cost-per-active-user; moderation calls/user; egress GB/user. |
| **FO-03** | **T&S staffing / on-call burnout** — a 0.5-FTE T&S allocation cannot sustain a 24/7 <30-min safety-critical SLA. | H | High | **9 — HIGH** | HTS / OPS | Honest staffing model (the 0.5 FTE is *insufficient* for the SLA — see §5); blended in-house + outsourced 24/7 coverage; tooling to make each case fast; follow-the-sun as EU comes online; well-defined escalation. | SLA adherence; on-call hours/person; queue backlog; T&S attrition. |
| **FO-04** | **Founder-dependency on liquidity ops** — cold-start is owned by the founder and not systematized; bus-factor of one. | M | High | **6 — HIGH** | GROWTH / OPS | Systematize the city-launch playbook + ambassador pipeline into tooling (P8) and a hire-able ops role; document the motion early. | Liquidity-ops bus-factor; playbook coverage; ambassador-pipeline health. |
| **FO-05** | **Runway / fundraising risk** — a capital-intensive (trust-heavy) low-margin (TR) business can run out of cash before the network compounds. | M | High | **6 — HIGH** | FIN | Phase gates conserve spend until economics prove out; diversify revenue; tight burn discipline; raise on NSM + retention proof, not vanity. | Months of runway; burn vs NSM growth; gross margin trajectory. |
| **FO-06** | **Vendor lock-in / price hikes** — Persona, Hive, Stream raise prices or degrade. | M | Medium | **4 — MEDIUM** | CTO / FIN | Abstraction layers (chat, moderation, verification) to keep providers swappable; AI Gateway for model routing; periodic vendor benchmarking. | Vendor cost trend; lock-in audit; alternative-provider readiness. |
| **FO-07** | **Moderator vicarious trauma** — staff exposed to NSFW/violent content and CSAM. | M | High | **6 — HIGH** | HTS / OPS | Wellness program, exposure limits, rotation, counseling; blur/grey-out tooling; CSAM auto-routing minimizes human exposure + mandatory reporting; trauma-informed processes. | Moderator wellbeing surveys; exposure-hours; T&S attrition. |

**Register summary:** 12 Critical, ~30 High, the remainder Medium/Low. The Critical band is dominated by physical-safety, location/PII, biometric-compliance, and the cold-start-liquidity rows — i.e., *exactly* the four themes of the existential summary in §1.

---

## 3. Deep-Dive: The Safety Problem

This is the section the company exists to get right. The model is a **layered defense**: a determined offender must defeat *every* layer; a careless one is stopped at the first. We map each layer to the roadmap phases that build it — **P3 (baseline)** and **P5 (full T&S, "the moat")** — and we are explicit about where the *baseline is currently too thin*.

### 3.1 The threat model, stated plainly

Tayfa's adversaries are not abstract. They are: (a) **opportunistic offenders** who exploit a 1:1 drift or intoxication; (b) **premeditated predators** who *select the platform because it surfaces isolated newcomers* and use a platonic cover; (c) **scammers** (romance/financial) for whom "let's be friends" is a script; (d) **abusers/stalkers** seeking a specific person; (e) **minors** evading the age gate; (f) **the physical environment itself** (medical emergencies, accidents). The victim profile that should keep us up at night is *Newcomer Nilay*: new to Istanbul, few local ties, high trust-propensity, no one to sanity-check a stranger — i.e., the exact user we optimize to *find and activate*.

### 3.2 Layered defense — Prevention → Detection → Response → Recovery

| Layer | What it does | Mechanisms | Phase |
|---|---|---|---|
| **Prevention** | Lower the probability a bad actor gets in or gets a target alone. | Verification tiers (§3.3); **small-group default** (min 2, nudge 3+, no 1:1 default); public-venue nudging; location fuzzing (precise pin only to approved members near start); women-only / verified-only filters; reliability/safety-score gating of hosting; interest-matching (reduces pure randomness); 18+ gate + age-assurance; keep-it-on-platform + "tell a friend your plan" nudges. | P3 baseline (group default, fuzzing, block/report); **P5** (verification tiers, filters, reputation gating, ban-evasion). |
| **Detection** | Surface bad actors and bad content fast. | Proactive moderation — image NSFW (Hive/Rekognition) + text (OpenAI) + risk scoring; behavioral anomaly detection (fan-out messaging, age/target skew, location anomalies); ban-evasion fingerprinting (device/phone/ID); report signals; post-meetup safety ratings + private flags; CSAM detection with special handling. | P3 baseline (reports, ratings); **P5** (full proactive pipeline, scoring, ban-evasion). |
| **Response** | Act in minutes, not hours, when safety is at stake. | Report→action SLAs (§3.4); 24/7 on-call T&S; in-meetup **SOS + check-in**; one-tap local emergency (112) + helplines; suspend-on-credible-report < 30 min; evidence preservation + LE liaison; appeals to protect the falsely-accused. | P3 baseline (report queue + console v0, <4h SLA); **P5** (full console, <30-min safety SLA, SOS/check-in, on-call rotation). |
| **Recovery** | Survive the incident that *does* happen — for the victim first, then the company. | Sev-1 protocol (§3.5); victim/user-care first; legal + PR; ban-evasion hardening; post-incident review feeding this register; insurance claim. | Defined in §13 of roadmap; **must exist operationally from P3** (not P5). |

### 3.3 Verification tiers (the trust ladder)

| Tier | How earned | What it unlocks | Cost posture |
|---|---|---|---|
| **Phone (free, mandatory)** | Phone OTP at signup. | Browse, RSVP to public events, join group chat. | Free — universal baseline; rate-limited against OTP abuse. |
| **ID-verified** | Persona ID document check. | Higher trust badge; precursor to liveness. | ~€1–1.5/verify — *deferred*, paid only when the user reaches for a privileged action. |
| **Verified+ (ID + liveness)** | Persona liveness ↔ ID ↔ profile-photo match. | **Required to host and to DM.** The trust badge users *want*. | Biggest single AI cost line — gated to hosts/DM only, never charged to the user (safety isn't paywalled), never required merely to *attend*. |

**The deliberate gap, named:** attending a meetup requires only *phone* verification. That is a real residual risk (an ID-unverified attendee can join a group). The mitigation is the group format + host visibility + reputation + the option for hosts/women to require *verified-only* attendees (P5). The product decision (don't ID-gate attendance) is correct for liquidity, but the board should understand it is a *traded* risk, not an absent one.

### 3.4 Report → action SLAs

| Severity | Examples | Target response | Action |
|---|---|---|---|
| **Safety-critical** | Threats of violence, sexual misconduct, a minor, credible imminent-harm, doxxing/stalking, CSAM. | **< 30 minutes**, 24/7 | Immediate suspend-pending-review; evidence preservation; LE escalation if imminent; Sev-1 if an incident occurred. |
| **High** | Harassment, scams, hate, repeated unwanted contact. | **< 4 hours** | Review → warn/remove/suspend; risk-score update. |
| **Standard** | Spam, off-topic, minor ToS. | **< 24 hours** | Triage → action or dismiss; appeal available. |

**Brutal honesty (links to FO-03):** a *< 30-min, 24/7* SLA is operationally incompatible with the roadmap's *0.5-FTE T&S* assumption. Either (a) staff blended in-house + outsourced 24/7 coverage from launch, or (b) do not enable features that generate safety-critical volume until that coverage exists. You cannot promise a 30-minute safety response and resource it like a part-time job. This is the report's most important *operational* finding.

### 3.5 Women-safety features (designed *with* the target users, not for them)

- **Women-only events** and **verified-only filters** (P5) — expands the most safety-sensitive, highest-WoM segment.
- **Decline without explanation**; block = total severance (location, presence, co-event visibility, recommendations) — see PS-10.
- **"Tell a friend your plan"** (trusted-contact share of event + time + place) — *recommend pulling this into P3*, it is the cheapest, highest-leverage safety feature and currently sits in the P5 safety center.
- **Opt-in, time-boxed, crew-scoped live location** — never default, never to non-crew, instantly revocable.
- **In-meetup check-in + SOS** with local emergency numbers.
- **Guardrail metric:** women-segment W4 retention must be **≥ overall**; if it lags, safety is failing the people who feel it most.

### 3.6 Insurance & legal duty-of-care posture

- **Bind before first meetup** (LC-07): public/general liability, cyber/breach, D&O, tech E&O, and a specialty **abuse & molestation** line. The TR market for the abuse line is thin; expect to place via the London/Lloyd's market through a broker. Treat "insurance bound" as a launch-blocker.
- **Duty of care (LC-05):** assume a court *may* find that curating matches and arranging meetings creates a duty. The strongest defense is a **documented, demonstrably-operated reasonable-care program** — this report, the §3 layers, the SLA logs, the moderation audit trail, and incident records all serve as evidence that Tayfa exercised reasonable care. **Never market "safe"** — an over-promise becomes the plaintiff's exhibit A. Market "verified, group-first, and accountable."
- **Waivers (LC-08):** useful for risk allocation and warnings, but cannot pre-waive gross negligence/willful harm under Türk Borçlar Kanunu; do not rely on them as the liability shield.

### 3.7 After a serious incident — the Sev-1 protocol

When (not if) a credible serious incident occurs:

1. **T-0 — Triage & contain (minutes):** safety-critical SLA fires; on-call T&S suspends the implicated account(s); preserve all evidence (chat, RSVP, location, device, audit log) under legal hold; do *not* delete anything.
2. **Victim first (T-0 to T-1h):** dedicated user-care contact; provide emergency resources/helplines; support reporting to authorities; assign a single point of contact. *The victim is not a PR problem; treat them as a person.*
3. **Escalate (T-1h):** Sev-1 incident commander; loop in HTS, LEGAL, DPO, CEO; activate LE-liaison and insurer-notification processes.
4. **Investigate & harden (T-1 to T-24h):** root-cause; ban-evasion hardening; identify the layer that failed; check for other at-risk users (same offender pattern).
5. **Communicate (counsel-guided):** factual, victim-respecting, non-defensive; never deny the incident, never over-claim safety; coordinate with authorities on what can be said.
6. **Regulatory clocks:** if personal data is implicated, the **72-hour** KVKK Board + GDPR breach-notification clocks may run — DPO owns this in parallel.
7. **Post-incident review:** blameless, written, fed into this register; every Sev-1 must change something (a policy, a control, a threshold).

### 3.8 How P3 vs P5 address this — and the sequencing flaw

- **P3 (MVP baseline):** block/report from day one, moderation queue v0, <4h SLA, NSM via geofence ∩ mutual-confirm, small-group default, location fuzzing. **This is the *meeting* capability going live.**
- **P5 (full T&S, "the moat"):** verification tiers, proactive moderation pipeline, safety center (SOS/check-in/plan-sharing/live-location), reputation system, ban-evasion, women-only/verified-only filters, full console + audit + on-call.

**The flaw (expanded in §5):** P3 ships the *dangerous capability* (strangers meeting IRL) while the *full safety system* is P5 — and per the roadmap's own dependency graph, P4 (Matching, which *proactively increases* stranger contact) can precede or parallel P5. The roadmap states a "safety-leads" rule but does not bind it tightly enough. **Fix applied (recommended):** define a **non-negotiable MVP safety floor** that ships *inside P3* — trusted-contact plan-sharing, in-app emergency numbers, image moderation on upload, mandatory phone verification, conservative defaults (public-venue nudge, no precise location pre-T-minus, no 1:1 default), and a real (even if outsourced) 24/7 safety on-call with a written Sev-1 protocol. Matching (P4) and virality (P6) are *gated* on this floor + core P5 tooling.

---

## 4. Deep-Dive: KVKK + GDPR Compliance

Tayfa is a Turkish-beachhead app processing **location data** and **biometric (liveness) data** about a **young, partly-vulnerable** population, storing it in the **EU (Frankfurt)**. That combination triggers nearly every sharp edge of both regimes. This section is concrete and TR-specific; figures stated as ranges should be confirmed with TR counsel (KVKK fines are revalued annually).

### 4.1 The legal-entity decision comes first

Whether the controller is a **Turkish entity** (e.g., Tayfa A.Ş.) or a **non-TR entity serving TR users** changes the obligations materially:

- A **non-TR controller** processing data of people **resident in Turkey** must register in **VERBİS regardless of size** (no de-minimis threshold) **and appoint a Turkish data-controller representative** (a TR legal entity or resident citizen), via a wet-ink, notarized, apostilled board resolution.
- A **TR controller** processing **special-category data** (biometric/liveness) as a core activity must register in VERBİS; the small-controller exemption (<10 employees and <10M TRY balance-sheet) does **not** apply because special-category processing is core.

**Either way, VERBİS registration is mandatory and is a launch-blocker (LC-01).** Decide the entity structure *before* writing the privacy program, because it dictates the representative requirement and the intra-group transfer posture.

### 4.2 Aydınlatma metni + açık rıza (the consent architecture)

- **Aydınlatma metni** (clarification text, KVKK Art. 10) must be presented **at the point of collection**, **separately** from consent, identifying the controller, purposes, recipients, transfer basis, and rights. Provide it in layered form at signup, at location-permission, at verification, and at connected-account import.
- **Açık rıza** (explicit consent) must be **unbundled, specific, informed, and freely withdrawable.** Separate toggles for: precise **location**, **marketing**, **connected accounts** (Spotify/Letterboxd), and — critically — **biometric verification**. Log consent **version + timestamp**. Do not gate the *core service* on marketing consent (that breaks "freely given").

### 4.3 Biometric data = özel nitelikli kişisel veri (the sharpest edge)

Liveness/face data is **special category** under **KVKK Art. 6** and **GDPR Art. 9**. Processing requires an **explicit-consent** basis **plus** adequate technical/organizational measures (the KVKK Board publishes a special-category-data measures checklist). Mandatory controls: **store provider references, not raw documents** (Persona retains the document/biometric artifacts under its DPA); **encrypt at rest**; **short retention**; **strict access** (BFF service-role + audit only); and a **DPIA** (GDPR Art. 35 / KVKK best practice) for the verification flow because it is high-risk processing of special-category data on potentially-vulnerable users. **Mishandling here is the most likely path to a Critical compliance finding (LC-04).**

### 4.4 Data-subject rights — built in from P1 (already correct)

KVKK Art. 11 (+ Art. 13, ~30-day application response) and GDPR Arts. 15–22 (30-day) require **access/export, erasure/delete, and rectification**. The roadmap correctly puts self-serve **export/delete in P1**. The residual risk is **completeness** (PD-09): erasure must fan out to Postgres, R2 media, BigQuery copies, backups (honor expiry), and every sub-processor (Persona, Braze, PostHog, etc.). Verify with an erasure-completeness job + audit.

### 4.5 Cross-border transfer TR↔EU — the Frankfurt nuance (genuinely thorny)

Storing **TR-resident** users' data in **Supabase Frankfurt** is a **cross-border transfer abroad under KVKK Art. 9.** After **Law No. 7499** (Official Gazette 12 March 2024; KVKK amendments effective **1 June 2024**) Turkey adopted a GDPR-aligned **three-tier** mechanism:

1. **Adequacy decision (yeterlilik kararı)** by the Turkish Board — *none currently exists for the EU/Germany*, so this path is unavailable today.
2. **Appropriate safeguards** — chiefly the Board-published **standard contract (standart sözleşme)**, which must be adopted **exactly as published, in Turkish**, and **notified to the Authority within 5 business days** of signing (or **binding corporate rules** for intra-group transfers).
3. **Specific derogations** — including **explicit consent**, but **only for occasional (arızi) transfers**; since **1 September 2024, explicit consent is no longer valid for regular/repeated transfers** — which is exactly what continuous storage in Frankfurt is.

**Practical conclusion (LC-03):** Tayfa must execute the **standard contract** with the EU-located processor and **file it with the Authority within 5 business days**, *per data flow / per processor.* Conversely, **EU users' data in Frankfurt stays in the EU** (fine for GDPR); but if any **support/ops/analytics is performed from Turkey on EU users' data**, that is a **GDPR Chapter V transfer** to a non-adequate country (Turkey is not on the EU adequacy list) requiring **SCCs + a transfer-impact assessment**. The transfer friction is therefore **bidirectional** and is a standing obligation, not a one-time task.

### 4.6 Sub-processor DPAs + data residency

Maintain a living **sub-processor register** with a **DPA**, EU region, and data-category mapping for each: **Supabase** (Frankfurt), **Persona** (biometric/ID — most sensitive), **Hive/AWS Rekognition** (images), **OpenAI** (text moderation — zero-retention), **AI Gateway/Anthropic** (generative — zero-retention), **Braze**, **RevenueCat**, **PostHog** (EU region, replay masking), **Sentry**, **Cloudflare R2/CDN**, **Inngest**, **Upstash**, **Vercel**, **BigQuery**. Minimize what each receives; pin EU regions; verify zero-retention on AI providers; require breach-notification SLAs.

### 4.7 Age, breach, and platform-law obligations

- **Age 18+** avoids most child-data complexity, but enforcement is weak until verification (PS-06/LC-09); add age-assurance escalation + apparent-minor flags + CSAM handling.
- **Breach notification:** KVKK Board ("en kısa sürede ve her hâlde **72 saat**") and GDPR (**72h**) clocks; data-subject notification where high-risk. Pre-write the breach runbook.
- **DSA (EU)** obligations attach on EU expansion (LC-12): notice-and-action, statement-of-reasons, transparency reports, point of contact — reuse the moderation audit log to satisfy these.

### 4.8 Compliance launch-gate (DPO sign-off required)

`[ ]` Entity structure decided · `[ ]` VERBİS registered (+ TR representative if foreign) · `[ ]` aydınlatma metni live at every collection point · `[ ]` unbundled açık rıza incl. biometric · `[ ]` DPIA for verification + location · `[ ]` standard contract executed + filed (5-day) for TR→EU flows · `[ ]` SCCs + TIA for any EU→TR processing · `[ ]` DPAs with all sub-processors · `[ ]` export/delete live + erasure-completeness verified · `[ ]` RoPA maintained · `[ ]` breach runbook + 72h clock owned. **No first user before every box is checked.**

---

## 5. Self-Validation Report (deep, critical re-review of the entire roadmap)

The roadmap's own §14 self-review concludes "Cleared to execute." That is too kind. Below is a genuinely adversarial re-read. For each dimension: **issues found · fixes applied · optimization opportunities · future scaling recommendations.** I am looking for what the roadmap *glossed*.

### 5.1 Missing systems

**Issues found:**
- **No MVP safety floor.** The full safety system is P5, but the *meeting* capability is P3. SOS/check-in/plan-sharing are deferred. The single biggest gap.
- **No incident-response/legal-escalation runbook as a P1–P3 deliverable.** Sev-1 lives in §13 prose; an incident can happen on launch day.
- **No insurance procurement task** anywhere in the phase plan (only mentioned as a risk).
- **No DPIA** (GDPR Art. 35) for location + biometric + vulnerable users.
- **No CSAM-specific detection + mandatory-reporting pipeline** (Hive helps, but CSAM has special legal handling and human-exposure minimization needs).
- **No robust age assurance** — 18+ is self-declared until the (deferred) ID step.
- **No anti-scraping system** — faces + neighborhoods are harvestable.
- **No moderator-wellness/vicarious-trauma program** despite humans facing violent/NSFW/CSAM content.

**Fixes applied (recommended):** pull a **P3 safety floor** (plan-sharing, in-app emergency numbers, image moderation on upload, mandatory phone verify, conservative defaults, 24/7 on-call + Sev-1 runbook); add **insurance** and **DPIA** as explicit P1 launch-blockers; specify a **CSAM pipeline** with auto-routing + NCMEC/INHOPE reporting in P3/P5; add **age-assurance escalation**; add **anti-scraping** (rate limits, signed URLs, no bulk endpoints); add a **moderator-wellness** program in P5 staffing.

**Optimization opportunities:** plan-sharing and emergency numbers are near-zero engineering cost for outsized safety + legal-defense value. **Future scaling:** as EU comes online, fold DSA transparency + trusted-flagger tooling into the same audit-log spine.

### 5.2 Dependency conflicts

**Issues found:** the dependency graph allows **P4 (Matching)** and **P6 (Virality)** to parallel/precede **P5 (Trust & Safety)**, while *also* stating a "safety-leads" rule. P4 *proactively increases* stranger contact and P6 *amplifies volume* — both should be hard-gated on P5's core tooling, not merely "encouraged" to follow it. Also, **two notification systems** (Expo in P3, Braze in P6) mean frequency-cap logic must stay consistent across a migration (a soft "no duplicated systems" violation).

**Fixes applied:** bind the safety-leads rule into an explicit gate — *no proactive matching ramp (P4) and no virality switch (P6) until the P3 safety floor + P5 core (verification tiers, proactive moderation, ban-evasion, SOS) are live.* Centralize frequency-cap + send-policy logic server-side so it survives the Expo→Braze migration.

**Optimization:** ship P5's *verification + moderation core* in parallel with P4 build, but flag-gate P4's matching ramp behind it. **Future scaling:** a single "safety capacity" signal that *automatically throttles* growth features when SLA/queue degrade (ties to GM-06).

### 5.3 Architectural contradictions

**Issues found:**
- **Client-direct CRUD vs location privacy.** The roadmap has mobile read events "client-direct to Postgres via RLS," but RLS is *row*-level and cannot *value-transform* a `geography` column into a fuzzed centroid. If precise coords sit in a client-readable row, a crafted query or a token leak exposes them. The roadmap hand-waves "via policy/views."
- **pgvector ANN + RLS** can fight each other: RLS predicates can defeat ANN index usage, hurting the "<150 ms feed" budget at scale.
- **Supabase Realtime + chat-RLS**: Realtime authorization on `postgres_changes`/broadcast has sharp edges; "readable only by members" needs explicit Realtime Authorization, not just table RLS.

**Fixes applied:** store a **separate fuzzed centroid column** (the only one in any client-readable view) and serve **precise coordinates exclusively via the BFF** to approved members near start; never place precise coords in a client-readable row. Add a test that proves precise coords never egress to non-approved users (the roadmap asks for this in P2 — make it a *permanent* CI gate, not a one-off). For ANN+RLS, benchmark early and consider BFF-mediated discovery for the sensitive slice. Enable **Supabase Realtime Authorization** explicitly with a chat-RLS CI test.

**Optimization:** a thin **chat-abstraction layer in P3** so the P8 Stream migration (TE-02) is a provider swap, not a rewrite. **Future scaling:** if pgvector+RLS latency degrades, move discovery fully behind the BFF before reaching for a dedicated vector store.

### 5.4 Premature overengineering

**Issues found:** **pgvector + embedding aggregation + Inngest async recompute in P1** is real infrastructure standing up before a single user — when **tag-overlap (Jaccard)** would likely prove the loop in P1–P2. The **people-discovery surface in P2** ("people you'd vibe with") introduces a *browse-humans* pattern early — a dating-drift (PB-07) and safety (PS-05) risk before the safety system exists.

**Fixes applied:** keep the `vector(1536)` *columns* (cheap, avoids retrofit) but consider a **tag-overlap baseline ranker** for P1–P2, promoting embeddings when an A/B shows lift (E1/E4 already exist). **De-emphasize people-discovery until P5** — events, not people, are the CTA; a human-browsing surface before verification tiers + ban-evasion is a self-inflicted risk.

**Optimization:** the roadmap is otherwise well-disciplined (K8s/microservices/Kafka/separate-vector-DB correctly rejected). **Future scaling:** earn the learned ranker only when data volume + a clear lift hypothesis exist (the roadmap says this — hold the line).

### 5.5 MVP integrity

**Issue found (the big one):** the MVP (P1–P3) is **riskier than the roadmap admits.** It ships the *complete dangerous capability* — strangers meeting IRL — with only *baseline* safety: self-declared 18+, ID verification not required to *attend*, no proactive image moderation, no SOS/check-in, no plan-sharing. The roadmap calls the MVP "safety-first"; it is "loop-first with baseline safety." Also, **NSM integrity** (geofence ∩ mutual-confirm) is softer than claimed — GPS spoofing + two-account collusion (TA-06/TE-07) are not addressed until later, so early NSM numbers may be partly gameable.

**Fixes applied:** the **P3 safety floor** (§3.8) is the fix — it restores MVP integrity by ensuring the minimum safety controls ship *with* the meeting capability. Add **anti-collusion + mock-location signals** to the P3 NSM definition so the North Star is trustworthy from day one.

**Optimization:** conservative MVP defaults (public-venue, group-only, no precise location pre-T-minus) cost little and cut the worst-case tail. **Future scaling:** as verification adoption rises, *relax* defaults gradually behind data, not all at once.

### 5.6 Security gaps

**Issues found:** RLS is the *single primary boundary* for a location app — a 100% bet on policy-correctness. **Service-role key blast radius** is total (bypasses RLS). No explicit **verification-endpoint rate-limit** (a cost-burn + abuse vector, FO-01/TE-06). **Moderation evasion** (unicode/leetspeak/image-text) is under-addressed vs the well-handled prompt-injection on icebreakers.

**Fixes applied:** **defense-in-depth** — column-level protection for location/birthdate, a fuzzed-only public view, BFF-mediated sensitive reads; **minimize + rotate** service-role usage and scan bundles/CI for secrets (TE-09); **rate-limit verification** and uploads; add **moderation-evasion normalization** (unicode fold, OCR on images) to the P5 pipeline.

**Optimization:** make the RLS policy-test matrix a *blocking* CI gate forever (the roadmap starts this in P1 — never let it lapse). **Future scaling:** periodic third-party pen-tests focused on the de-fuzzing and RLS-bypass paths.

### 5.7 Monetization gaps

**Issues found:** **3–5% free→paid at ₺149/mo in TR is optimistic** given PPP and that the core value (meetups, crews, *all* safety) is free forever. Worse, several premium features — **"see who's interested before you commit," "boost in match ranking"** — are **literal dating-app monetization mechanics**, in direct tension with the anti-dating brand (PB-07). And the cost base (verification + 24/7 T&S + AI/media) is *structurally heavy*, so subs-only in TR may not cover it.

**Fixes applied:** reframe premium strictly as **"more & better *plans*"** (filters, travel mode, unlimited crews, premium recaps) and **drop or heavily re-frame "see who's interested"/"boost"** to avoid re-importing dating dynamics; lean on **revenue diversification** (marketplace P9, B2B2C) earlier in the *planning*; keep a **free-tier-health guardrail** so monetization never depresses NSM/liquidity (the roadmap has this — enforce it).

**Optimization:** **pilot B2B2C (campus/relocation/HR) earlier than P9** — employers/universities paying to onboard new-in-city cohorts is the *most defensible* revenue for the exact core persona and side-steps consumer WTP. **Future scaling:** marketplace take + B2B2C as the margin engine; consumer subs as the engagement signal, not the sole P&L.

### 5.8 Retention gaps

**Issue found:** **crews are the D30 engine *and* the churn mechanism.** When a crew gels, it can graduate to WhatsApp — at which point **meetups happen off-platform (NSM uncounted), the relationship + safety visibility + monetization all leak**, and the roadmap shrugs ("fine — they feed NSM & virality"). That is under-weighted: the product's *success* (real friendship) is also its *exit*.

**Fixes applied:** give crews **ongoing in-app gravity** — one-tap recurring scheduling, shared photo/recap memory, *new-member discovery* (crews recruit on-platform), and crew-scoped safety (plan-sharing, check-in). The job is to make staying *more useful* than leaving, not to trap.

**Optimization:** crew-formation rate as the **leading retention indicator** (roadmap agrees). **Future scaling:** "crew graduation" as a *feature* (crews invite new members, spinning up the loop) rather than a leak.

### 5.9 Scalability gaps

**Issues found:** **chat migration (Realtime→Stream) at P8** lands on the most-used retention surface with the data model + client built against Realtime in P3. **Single Frankfurt region** = single point of failure with **no DR before P8** — and for a *safety* app, an outage during live meetups means no check-in/SOS/report. **pgvector+RLS** scaling (5.3).

**Fixes applied:** **chat-abstraction layer in P3** (shrinks TE-02 blast radius); **PITR + DR runbook + safety-path static fallback before P8** (don't wait for the scale phase to be able to recover data or serve emergency info during an outage). 

**Optimization:** multi-AZ now, multi-region DR roadmap. **Future scaling:** read replicas → time-partitioning → H3 geocell bucketing → city-sharding, all behind documented triggers (roadmap is right to gate these).

### 5.10 Growth bottlenecks

**Issues found:** the true bottleneck is **supply (hosts), not demand** (GM-07), yet the plan leans on **paid ambassador hosts** — a manual, founder-dependent, *cost-bearing*, and *safety-sensitive* motion (paid hosts with weak vetting = risk). And the **"ghost-town guard / never show an empty feed"** instruction is one slip away from **phantom/AI-generated events** — if a user RSVPs to a seeded event that isn't real, that is a trust-destroying bait-and-switch and a possible **deceptive-practice** issue under consumer law.

**Fixes applied:** make it a **hard rule that every seeded event is a *real*, ambassador-hosted, attendable event** — never phantom; "AI templates" assist *creation*, they do not *fabricate* events. Vet ambassador hosts at the **Verified+** bar (they carry elevated safety responsibility). Systematize the liquidity motion into tooling + a hire-able role to cut founder bus-factor (FO-04).

**Optimization:** supply-side gamification (host leaderboards/perks) + ultra-low-friction hosting. **Future scaling:** city-launch playbook with per-geocell liquidity go/no-go gates (roadmap P8 — pull the *playbook discipline* earlier even if the tooling is manual).

### 5.11 Self-validation verdict

The plan is **strong, disciplined, and mostly internally consistent** — but the roadmap's "cleared to execute, safety-first" verdict **overstates MVP safety** and **under-binds the safety-leads rule.** With the fixes above — chiefly the **P3 safety floor**, the **compliance launch-gate**, the **honest T&S staffing model**, and the **server-side location-privacy architecture** — it is cleared to execute. Without them, the MVP ships an under-protected real-world-harm surface. **Conditional go, not unconditional go.**

---

## 6. Risk-Adjusted Go / No-Go Gates

The roadmap defines three phase gates (post-P3 activation+NSM, post-P6 retention+k, post-P7 LTV:CAC). Below, each gate is augmented with **risk thresholds that *halt* progression**, plus a **continuous safety circuit-breaker** that overrides all of them.

### Gate A — after P3 (MVP): "Do users actually, *safely*, meet?"

| Dimension | GO threshold | NO-GO / HALT if… |
|---|---|---|
| Activation (NSM) | ≥35% of activated users complete a meetup in 14 days | < 25% |
| North Star | Weekly Completed Meetups trending up; verified geofence+confirm | NSM flat/down, or > 5% suspected spoof/collusion |
| Safety incident rate | < 0.5% per meetup (MVP target) | > 0.5%, or **any** Sev-1 not yet remediated |
| Report→action SLA | 100% < 4h; safety-critical < 30 min | < 95% SLA, or any safety-critical breach |
| Data security | 0 RLS leaks in test matrix; 0 precise-location egress | any cross-user leak or precise-coord egress |
| Compliance | All §4.8 boxes checked | any box unchecked |
| No-show rate | < 25% | > 40% (loop is broken) |

**Halt means:** no growth spend, no P4/P6 ramp. Fix safety/compliance/loop first.

### Gate B — after P6 (PMF): "Is it sticky and viral *without* breaking safety*?"

| Dimension | GO threshold | NO-GO / HALT if… |
|---|---|---|
| Retention | D7 ≥30%, D30 ≥22% | D30 < 15% |
| Virality | k ≥ 0.4 in lead city | k < 0.2 |
| Women-segment retention | ≥ overall | persistently below overall (safety failing the key segment) |
| Referral fraud | reward-clawback rate low | fraud > tolerated threshold |
| Ban-evasion | re-registration caught at high rate | rising successful evasion |
| T&S capacity | SLA holds under current volume | SLA degrades as volume grows (GM-06) |
| Notification health | opt-out < 15% | opt-out > 25% (fatigue) |

**Halt means:** do not enter monetization (P7); fix retention/safety-capacity first.

### Gate C — after P7 (Scale-readiness): "Do the economics work *and* does safety scale*?"

| Dimension | GO threshold | NO-GO / HALT if… |
|---|---|---|
| Unit economics | **LTV:CAC ≥ 3** in lead city | < 2 |
| Monetization guardrail | NSM & liquidity flat-or-up post-paywall | paywall depresses NSM/liquidity |
| Churn | monthly < 8% | > 12% |
| Safety-at-scale | incident rate flat/down as volume rises | incident rate rises with scale |
| Cost discipline | cost-per-active-user trending down; verification burn bounded | burn outpaces revenue |

**Halt means:** do not multi-city (P8). Scaling unproven economics or unproven safety-at-scale just multiplies the loss.

### Continuous Safety Circuit-Breaker (overrides all gates, any phase)

Trip — **freeze all growth spend + new-feature flags immediately** — if **any** of:
- a **Sev-1 safety incident** occurs (until reviewed + hardened);
- safety-critical **SLA breach** in any rolling 7-day window;
- **incident rate** breaches the active target (0.5% MVP → 0.3% post-P5);
- a **data breach** affecting location/biometric/PII;
- **women-segment retention** drops materially below overall;
- **fail-open** of verification/moderation under provider outage (must be zero).

The circuit-breaker is *not* a metric to optimize — it is a brake. Growth that outruns safety is, for this product specifically, a path to extinction (GM-06).

---

## 7. Top 3 Risks → Immediate Actions (before / at launch)

Mapped to the existential summary (§1). These are the three things that *must* be true before the first stranger meets another stranger.

### Action 1 — Build the MVP Safety Floor before the first meetup (addresses Risk 1 & 3)
Do **not** wait for P5. Ship *inside P3*: **trusted-contact plan-sharing** + **in-app emergency numbers (112) and helplines** + **image moderation on upload** + **mandatory phone verification** + **conservative defaults** (public-venue nudge, group-only/no-1:1-default, no precise location until near start) + **ban-evasion fingerprinting baseline** + a **real, 24/7 (outsourced if needed) safety on-call** running the **written Sev-1 protocol** (§3.7) with the **< 30-min safety-critical SLA**. **Bind insurance** (public liability + cyber + D&O + **abuse/molestation**) and adopt the **honest non-guarantee safety-marketing** posture. *Owner: HTS. Blocker: yes.*

### Action 2 — Seed *real* liquidity in 2–3 Istanbul neighborhoods before opening demand (addresses Risk 2 & 5)
Cold-start is the most likely killer. Recruit and **Verified+-vet ambassador hosts** (they carry elevated safety responsibility) to run **real, attendable** events in a tight beachhead (start Kadıköy); partner with campuses, run/climb clubs, and board-game cafés for demand. Enforce the **never-phantom rule**: the ghost-town guard shows *real* events only — AI assists creation, it never fabricates. Hold the **≥40 live events/wk within 5 km** liquidity gate before any scale spend, and systematize the motion to cut founder bus-factor. *Owner: GROWTH. Blocker for scale spend: yes.*

### Action 3 — Clear the KVKK/GDPR launch-gate before the first user (addresses Risk 4)
DPO sign-off is a launch-blocker. Complete §4.8 in full: **decide the entity structure**, **register in VERBİS** (+ TR representative if the controller is foreign), publish the **aydınlatma metni** and capture **unbundled açık rıza** (incl. **biometric**), run the **DPIA** for verification + location, execute the **standard contract** for TR→EU storage and **file it with the Authority within 5 business days** (and SCCs + TIA for any EU→TR processing), sign **DPAs** with all sub-processors, store **Persona references not raw documents** with short retention + encryption, and ship **export/delete** with verified erasure completeness. *Owner: DPO + LEGAL. Blocker: yes.*

---

> **Closing posture.** Tayfa can be a genuinely good thing — it attacks real loneliness with a real mechanism. But it is also, unavoidably, an apparatus for putting strangers in a room together, and it self-selects the lonely and isolated as its users. That duality is the whole risk. The company earns the right to grow only by treating physical safety as a first-class engineering and operational system from the *first* meetup — not as a P5 feature — and by being honest, internally and externally, that it sells *safer and accountable*, never *safe*. Every gate, every circuit-breaker, and every "blocker: yes" in this report exists to keep that promise.

*Sources for KVKK specifics (cross-border transfer & VERBİS):* [Istanbul Law Firm — KVKK Cross-Border Transfers & 5-business-day notification](https://istanbullawyerfirm.com/blog/kvkk-cross-border-data-transfers-standard-contracts-notification-guide-2025) · [Moral & Partners — Amendments to Law 6698](https://moral.av.tr/en/legal-updates/amendments-to-law-numbered-6698-on-the-protection-of-personal-data-1849) · [IBA — VERBIS registration & enforcement](https://www.ibanet.org/Mandatory-data-protection-compliance-Turkey-VERBIS) · [Lexology/Prighter — VERBIS for foreign controllers](https://prighter.com/resources/turkish-kvkk-verbis-registration/). Figures (KVKK fines) are revalued annually — confirm current bands with TR counsel.

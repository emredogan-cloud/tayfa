# Incident Response & Escalation Runbook (Trust & Safety)

> Tayfa is a meet-strangers-IRL product. Safety incidents are **existential**, not
> support tickets. This runbook is binding from the moment the core loop (P3) ships.
> Source of truth: `reports/RISK_ANALYSIS.md` §3.4, §3.7, §6.

## 1. Severity tiers & SLAs (24/7)

The SLA clock is set at report-file time from severity (`REPORT_SLA_MINUTES` in
`@tayfa/shared`; `severityForReason()` maps a reason → severity):

| Severity | Examples | Response SLA | First action |
|---|---|---|---|
| **safety_critical** | threats, sexual misconduct, a minor, imminent harm, doxxing, stalking, CSAM | **< 30 min** | suspend-pending-review, preserve evidence, LE escalation if imminent, **Sev-1** |
| **high** | harassment, scams, hate, repeated unwanted contact | **< 4 h** | review → warn/remove/suspend; update risk score |
| **standard** | spam, off-topic, minor ToS | **< 24 h** | triage → action or dismiss; appeal available |

A **safety-critical SLA breach in any rolling 7-day window trips the growth
circuit-breaker** (§5).

## 2. Sev-1 safety incident protocol (a real-world harm occurred or is imminent)

1. **T-0 (minutes) — contain.** Suspend implicated account(s). Preserve ALL evidence
   under legal hold: chat, RSVP/attendance, check-in/geofence signals, device
   fingerprints, the immutable `audit_log`. Nothing is deleted.
2. **Victim first (T-0 → T-1h).** A dedicated user-care contact reaches the affected
   user; provide local emergency/helpline info (the in-app Safety Center: 112/155/156/110
   for TR); support their LE report; single point of contact.
3. **Escalate (T-1h).** Page the incident commander; loop in T&S lead, Legal, DPO, CEO;
   activate LE liaison + insurer notification (abuse & molestation cover bound pre-launch).
4. **Investigate & harden (T-1 → T-24h).** Root-cause; identify the failed safety layer;
   run **ban-evasion fingerprinting** (`banEvasionRiskScore`) to find linked accounts and
   other at-risk users; ship the hardening.
5. **Communicate (counsel-guided).** Factual, victim-respecting, non-defensive; coordinate
   with authorities.
6. **Regulatory clocks.** If PII/location/biometric was involved: **KVKK Board + GDPR
   notification within 72 h** of discovery (`BREACH_NOTIFICATION_HOURS`).
7. **Post-incident review.** Blameless, written, fed into the risk register. Every Sev-1
   changes something.

## 3. The moderation pipeline (how content/behaviour reaches a human)

Decisions are computed by `decideModeration()` (pure, tested) over provider verdicts +
behavioural risk, and **fail closed**:

- Provider **unavailable** (Persona/Hive/OpenAI down) → content is **held, never published**;
  privileged actions (host/DM) are **denied, not granted**.
- High-confidence flag (≥ `MODERATION_AUTO_ACTION_CONFIDENCE` = 0.95) → auto-remove.
- Ambiguous flag → **hold + human review**.
- `safety_critical` report → straight to **human review** (fast lane).
- Behavioural risk (grooming/ban-evasion) ≥ 0.5 → human review.

**Human-in-the-loop is mandatory** above the confidence floor — false positives harm good
users, so a person makes the call on anything not unambiguous.

### Detection signals
- **Scam/financial:** `detectScamLanguage()` (IBAN, gift cards, crypto, papara/havale, "send money").
- **Grooming/predatory:** `detectGroomingSignals()` — fan-out velocity, newcomer targeting,
  age-gap, isolation/off-platform language. Never auto-bans; routes to review.
- **Ban-evasion:** `banEvasionRiskScore()` — device/phone/ID/payment fingerprints +
  reappearance-near-blocker; ≥0.8 block, ≥0.4 manual review.

## 4. Moderator console & appeals

- Console: `apps/web/app/moderation` (service-role, `requireConsoleAccess`). Queue is sorted
  by SLA deadline; the report detail shows the scam signal, prior actions, and the **immutable
  audit trail**. Every action writes a `moderation_action` + `audit_log` row.
- **Appeals** (protect the falsely-accused): a member appeals an enforcement → report
  `appealed`. A moderator resolves via `resolveAppeal` (uses the tested `transitionAppeal`
  state machine): **uphold** (action stands) or **overturn** (reverses it with a logged
  `clear`). Both are audited. Pattern-of-false-reporting penalties apply to abusive reporters.
- Access is least-privilege via the `TAYFA_MODERATOR_USER_IDS` allowlist; moderator reads
  go through the service role + are audited (RLS denies authenticated users on
  `moderation_action`/`audit_log`).

## 5. Continuous safety circuit-breaker (overrides all growth gates, any phase)

Freeze all growth spend + feature flags immediately if ANY of:
- a Sev-1 incident occurs (until reviewed + hardened);
- a safety-critical SLA breach in any rolling 7-day window;
- incident rate exceeds target (0.5% MVP → 0.3% post-P5, `INCIDENT_RATE_TARGET`);
- a data breach affecting location/biometric/PII;
- women-segment retention drops materially below overall;
- ANY fail-OPEN of verification/moderation under provider outage (must be zero).

## 6. Never

- Never paywall or monetize safety (block, report, appeals, verification, Safety Center,
  women-only/verified-only filters are free forever — enforced by `paywallSafetyViolations()`).
- Never fail open on verification/moderation.
- Never expose precise location to a non-approved user (geocell-only until the 30-min release).
- Never auto-ban on a behavioural signal alone — a human reviews.

## 7. On-call (fill in before launch)

- T&S on-call rotation: **TODO** (blended in-house + outsourced 24/7 — a 0.5-FTE assumption is
  incompatible with the <30-min safety-critical SLA; staff it or don't enable the features that
  generate that volume).
- Incident commander · Legal · DPO · LE liaison · insurer: **TODO** contacts.

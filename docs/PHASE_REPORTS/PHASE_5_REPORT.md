# Phase 5 Report — Trust & Safety (the moat)

**Date:** 2026-06-29 · **Status:** implemented + verified (CI green). Treated as the existential phase.

P5 completes the Trust & Safety system on top of the P1–P3 baseline (block/report/ratings, reputation, step-up verification gating, the moderation console, the append-only `audit_log` with deny-all RLS) and the P4 real OpenAI text moderation.

## Completed work

**T&S decision core — `packages/shared/domain/safety.ts` (pure, exhaustively tested):**
- **Ban-evasion** — `banEvasionRiskScore()` blends device/phone/ID/payment fingerprint matches + reappearance-near-blocker + links to already-banned accounts into a risk score; block ≥0.8, manual review ≥0.4, else allow (`BAN_EVASION_WEIGHTS`/`BAN_EVASION_THRESHOLDS`).
- **Grooming / predatory detection** — `detectGroomingSignals()` flags fan-out velocity, newcomer targeting, age-gap targeting, and isolation/off-platform language (`detectIsolationLanguage` + `ISOLATION_PATTERNS`) + money solicitation (reuses `detectScamLanguage`). **Never auto-bans** — routes to human review (`GROOMING.reviewRisk`).
- **Moderation pipeline** — `decideModeration()` turns text+image provider verdicts + behavioural risk + report severity into `publish | hold | auto_remove | human_review`. **Fails CLOSED**: any missing expected verdict (provider outage) → `hold`, never publish. Safety-critical reports jump to human review. Human-in-the-loop below the 0.95 auto-action floor.
- **Appeals** — `transitionAppeal()` state machine (`actioned → appealed → upheld | overturned`) + `appealReversesAction()`, protecting the falsely-accused.
- **Audit** — `buildAuditEntry()` shapes append-only audit records (actor/action/target/metadata).

**Moderation console — `apps/web/app/moderation`:**
- Existing: SLA-sorted queue, report detail with scam signal + prior actions + the **immutable audit trail**, `resolveReport` (writes `moderation_action` + `audit_log`).
- New: **`resolveAppeal`** server action (uses the tested appeal machine) — uphold keeps enforcement, overturn reverses it with a logged `clear`; both audited. Appeal-resolution UI shown when a report is `appealed`. Access stays least-privilege (`requireConsoleAccess`, `TAYFA_MODERATOR_USER_IDS`).

**Provider posture (per-key hybrid from P4):**
- **Real:** OpenAI **text moderation** (`moderateTextOpenAI`, fail-closed). **Verification/host/DM gating** already enforced (`checkActionAllowed`, `canHost`, `canDm`).
- **Fail-closed stubs (pending keys):** Persona ID+liveness (`PersonaVerificationProvider` — deny on missing config), Hive/Rekognition **image** moderation (deny/hold). Never fail open.

**Runbook — `docs/INCIDENT_RESPONSE.md`:** severity tiers + SLAs, the Sev-1 protocol (contain → victim-first → escalate → harden → 72h regulatory clock → blameless review), the fail-closed pipeline, console+appeals, and the **continuous safety circuit-breaker** trip conditions. Plus the "never paywall safety / never fail open / never auto-ban on a signal alone" invariants.

## Tests
- `packages/shared`: **106 unit tests pass** (+19 for `safety.ts`), domain coverage ~98.7% statements / ~88.6% branches (≥ thresholds); `safety.ts` 99%/87.5%.
- `apps/web`: `next build` green (16 routes) with the appeal action + UI.
- RLS suite still 6/6 (moderation_action + audit_log deny authenticated; service-role-only).

## Decisions
- Detection is **advisory, not autonomous**: grooming/ban-evasion route to human review; only ≥0.95-confidence provider verdicts auto-act. False-positive cost on a social-trust product is too high to automate bans.
- The pipeline **fails closed** uniformly; the only fail-open path in the system is cosmetic generation (icebreakers → template).
- Appeals reuse the same tested state-machine pattern as RSVP/referral for consistency + auditability.

## CI status
Committed + pushed; CI + Security green (lint, typecheck, unit, RLS, web build, coverage, audit, gitleaks, Trivy, CodeQL).

## Known issues / pending
- **Persona ID/liveness + Hive image moderation** are real-interface fail-closed stubs pending their keys (per the per-key hybrid factory). Image NSFW/face checks therefore hold-by-default.
- **Inngest** moderation-pipeline orchestration (async scan→queue→action) bodies are designed; `decideModeration` is the pure decision they will call.
- On-device re-validation pending device reconnection — P5 adds no new consumer screens (block/report/safety-center/verification-prompt were validated in the P1–P3 device pass); the moderation console is web/admin. See `PHASE_5_DEVICE_REPORT.md`.
- T&S on-call staffing + escalation contacts are operational TODOs (documented in the runbook).

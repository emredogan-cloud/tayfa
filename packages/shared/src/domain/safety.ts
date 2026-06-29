import {
  BAN_EVASION_THRESHOLDS,
  BAN_EVASION_WEIGHTS,
  GROOMING,
  ISOLATION_PATTERNS,
  MODERATION_AUTO_ACTION_CONFIDENCE,
  type BanEvasionSignal,
} from '../constants/safety.js';
import type { ModerationVerdict } from '../adapters/types.js';
import { err, ok, type Result } from '../types/result.js';
import type { ReportSeverity } from '../types/enums.js';
import { detectScamLanguage } from './moderation.js';

/**
 * Trust & Safety decision core (Phase 5 — existential). Pure, exhaustively
 * tested: ban-evasion risk, grooming/predatory detection, the moderation
 * pipeline decision (human-in-loop), and the appeals state machine. All I/O
 * (Persona, Hive, OpenAI) lives in adapters and FAILS CLOSED; this layer turns
 * signals into decisions and never "passes" ambiguous content.
 */

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

// ── Ban-evasion ───────────────────────────────────────────────────────────────

export interface BanEvasionInput {
  /** Which fingerprint signals fired for this (re-)registration. */
  readonly signals: readonly BanEvasionSignal[];
  /** Count of already-banned accounts sharing a fingerprint with this one. */
  readonly linkedBannedAccounts: number;
}

export type BanEvasionAction = 'allow' | 'review' | 'block';

export interface BanEvasionResult {
  readonly risk: number;
  readonly action: BanEvasionAction;
  readonly signals: readonly BanEvasionSignal[];
}

/**
 * Blend fingerprint signals into a re-registration risk score. A link to an
 * already-banned account is a strong amplifier. Decision: block ≥0.8, review
 * ≥0.4 (manual review before any privileged action), else allow.
 */
export function banEvasionRiskScore(input: BanEvasionInput): BanEvasionResult {
  const unique = [...new Set(input.signals)];
  const base = unique.reduce((s, sig) => s + (BAN_EVASION_WEIGHTS[sig] ?? 0), 0);
  // Each linked banned account adds confidence (saturating).
  const linkBoost = 1 - Math.exp(-0.6 * Math.max(0, input.linkedBannedAccounts));
  const risk = clamp01(base + 0.5 * linkBoost * (base > 0 ? 1 : 0.4));

  const action: BanEvasionAction =
    risk >= BAN_EVASION_THRESHOLDS.block
      ? 'block'
      : risk >= BAN_EVASION_THRESHOLDS.review
        ? 'review'
        : 'allow';
  return { risk, action, signals: unique };
}

// ── Grooming / predatory behaviour ────────────────────────────────────────────

export interface ContactBehavior {
  readonly newContactsLast24h: number;
  readonly distinctRecipients: number;
  /** Recipients whose accounts were created recently (newcomers). */
  readonly recipientsRecentlyJoined: number;
  /** Median age gap (years) from sender to recipients (absolute). */
  readonly medianAgeGapYears: number;
}

export type GroomingFlag =
  'fan_out' | 'newcomer_targeting' | 'age_gap' | 'isolation_language' | 'money_solicitation';

export interface GroomingResult {
  readonly flags: readonly GroomingFlag[];
  readonly risk: number;
  readonly needsHumanReview: boolean;
}

/** Detect off-platform / secrecy language (grooming + scam early warning). */
export function detectIsolationLanguage(text: string): boolean {
  return ISOLATION_PATTERNS.some((re) => re.test(text));
}

/**
 * Score predatory-behaviour risk from contact patterns + a message sample.
 * Combines fan-out, newcomer targeting, age-gap, and isolation/money language.
 * A match here NEVER auto-bans — it routes to human review (false positives harm
 * good users); the score weights the highest-harm signals most.
 */
export function detectGroomingSignals(
  behavior: ContactBehavior,
  sampleText: string,
): GroomingResult {
  const flags: GroomingFlag[] = [];
  let risk = 0;

  if (behavior.newContactsLast24h > GROOMING.fanOutContacts24h) {
    flags.push('fan_out');
    risk += 0.25;
  }
  const newcomerShare =
    behavior.distinctRecipients > 0
      ? behavior.recipientsRecentlyJoined / behavior.distinctRecipients
      : 0;
  if (newcomerShare >= GROOMING.newcomerShare && behavior.distinctRecipients >= 3) {
    flags.push('newcomer_targeting');
    risk += 0.3;
  }
  if (behavior.medianAgeGapYears >= GROOMING.ageGapYears) {
    flags.push('age_gap');
    risk += 0.25;
  }
  if (detectIsolationLanguage(sampleText)) {
    flags.push('isolation_language');
    risk += 0.2;
  }
  if (detectScamLanguage(sampleText).matched) {
    flags.push('money_solicitation');
    risk += 0.2;
  }

  const finalRisk = clamp01(risk);
  return { flags, risk: finalRisk, needsHumanReview: finalRisk >= GROOMING.reviewRisk };
}

// ── Moderation pipeline decision ──────────────────────────────────────────────

export interface ModerationPipelineInput {
  /** Text verdict from the provider; `null`/`undefined` = unavailable (fail closed). */
  readonly textVerdict?: ModerationVerdict | null;
  /** Image verdict; `null`/`undefined` = unavailable (fail closed) when an image exists. */
  readonly imageVerdict?: ModerationVerdict | null;
  /** Whether the content includes an image (so a missing image verdict fails closed). */
  readonly hasImage?: boolean;
  /** Behavioural risk (grooming/ban-evasion) in [0,1]. */
  readonly riskScore?: number;
  /** Severity if this came from a user report (drives fast human review). */
  readonly reportSeverity?: ReportSeverity | null;
}

export type ModerationOutcome = 'publish' | 'hold' | 'auto_remove' | 'human_review';

export interface ModerationPipelineResult {
  readonly outcome: ModerationOutcome;
  readonly needsHuman: boolean;
  readonly reasons: readonly string[];
}

/**
 * The pipeline decision (RISK_ANALYSIS §moderation). FAIL CLOSED: any expected
 * provider verdict that is missing (provider outage) → HOLD, never publish. A
 * high-confidence flag auto-removes; everything ambiguous or risky goes to a
 * human. Safety-critical reports jump straight to human review.
 */
export function decideModeration(input: ModerationPipelineInput): ModerationPipelineResult {
  const reasons: string[] = [];

  // Fail-closed on provider unavailability.
  const textUnavailable =
    input.textVerdict === null ||
    (input.textVerdict?.categories ?? []).includes('provider_unavailable');
  const imageUnavailable =
    Boolean(input.hasImage) &&
    (input.imageVerdict === null ||
      input.imageVerdict === undefined ||
      input.imageVerdict.categories.includes('provider_unavailable'));
  if (textUnavailable || imageUnavailable) {
    reasons.push('provider_unavailable');
    return { outcome: 'hold', needsHuman: true, reasons };
  }

  const verdicts = [input.textVerdict, input.imageVerdict].filter((v): v is ModerationVerdict =>
    Boolean(v),
  );
  const flagged = verdicts.filter((v) => v.flagged);
  const maxConfidence = flagged.reduce((m, v) => Math.max(m, v.confidence), 0);

  if (input.reportSeverity === 'safety_critical') {
    reasons.push('safety_critical_report');
    return { outcome: 'human_review', needsHuman: true, reasons };
  }

  if (flagged.length > 0) {
    flagged.forEach((v) => reasons.push(...v.categories));
    if (maxConfidence >= MODERATION_AUTO_ACTION_CONFIDENCE) {
      return { outcome: 'auto_remove', needsHuman: false, reasons };
    }
    return { outcome: 'hold', needsHuman: true, reasons };
  }

  if ((input.riskScore ?? 0) >= GROOMING.reviewRisk) {
    reasons.push('behavioural_risk');
    return { outcome: 'human_review', needsHuman: true, reasons };
  }

  return { outcome: 'publish', needsHuman: false, reasons: ['clear'] };
}

// ── Appeals state machine ─────────────────────────────────────────────────────

export type AppealStatus = 'actioned' | 'appealed' | 'upheld' | 'overturned';
export type AppealEvent = 'file_appeal' | 'uphold' | 'overturn';
export type AppealError =
  | {
      readonly kind: 'illegal_transition';
      readonly from: AppealStatus;
      readonly event: AppealEvent;
    }
  | { readonly kind: 'terminal'; readonly status: AppealStatus };

const APPEAL_TERMINAL: ReadonlySet<AppealStatus> = new Set<AppealStatus>(['upheld', 'overturned']);

/**
 * Appeals (RISK_ANALYSIS §appeals — protect the falsely-accused). An enforced
 * action can be appealed once; a human resolves it to `upheld` (action stands)
 * or `overturned` (action reversed). Terminal states reject further events.
 */
export function transitionAppeal(
  status: AppealStatus,
  event: AppealEvent,
): Result<AppealStatus, AppealError> {
  if (APPEAL_TERMINAL.has(status)) return err({ kind: 'terminal', status });
  if (status === 'actioned' && event === 'file_appeal') return ok('appealed');
  if (status === 'appealed' && event === 'uphold') return ok('upheld');
  if (status === 'appealed' && event === 'overturn') return ok('overturned');
  return err({ kind: 'illegal_transition', from: status, event });
}

/** Whether a resolved appeal means the original enforcement must be reversed. */
export const appealReversesAction = (status: AppealStatus): boolean => status === 'overturned';

// ── Audit log ─────────────────────────────────────────────────────────────────

export interface AuditEntry {
  readonly actorUserId: string | null;
  readonly actorType: 'human' | 'ai' | 'system';
  readonly action: string;
  readonly targetType: string | null;
  readonly targetId: string | null;
  readonly metadata: Record<string, unknown>;
}

/**
 * Build an immutable audit entry for a privileged/T&S action. The audit_log
 * table is append-only (no RLS UPDATE/DELETE policy ⇒ denied); this just shapes
 * the record. `action` is namespaced, e.g. `moderation.remove`, `verification.grant`.
 */
export function buildAuditEntry(input: {
  actorUserId?: string | null;
  actorType?: 'human' | 'ai' | 'system';
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}): AuditEntry {
  return {
    actorUserId: input.actorUserId ?? null,
    actorType: input.actorType ?? 'human',
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    metadata: input.metadata ?? {},
  };
}

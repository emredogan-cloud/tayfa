import {
  MODERATION_AUTO_ACTION_CONFIDENCE,
  MODERATION_HUMAN_REVIEW_FLOOR,
  REPORT_SLA_MINUTES,
  SCAM_PATTERNS,
} from '../constants/safety.js';
import type { ReportSeverity } from '../types/enums.js';

/**
 * Moderation routing + report triage (RISK_ANALYSIS §3.4, §moderation). Pure
 * helpers; the async pipeline (Inngest) and provider calls (Hive/OpenAI) live in
 * app packages. Fail-closed behaviour (deny on provider outage) is the caller's
 * responsibility — these functions never "pass" content on their own.
 */

/** Canonical report reasons mapped to severity (drives the SLA clock). */
export const REPORT_REASONS = {
  threat: 'safety_critical',
  sexual_misconduct: 'safety_critical',
  minor_safety: 'safety_critical',
  csam: 'safety_critical',
  doxxing: 'safety_critical',
  stalking: 'safety_critical',
  imminent_harm: 'safety_critical',
  harassment: 'high',
  scam: 'high',
  hate_speech: 'high',
  repeated_unwanted_contact: 'high',
  spam: 'standard',
  off_topic: 'standard',
  other: 'standard',
} as const satisfies Record<string, ReportSeverity>;

export type ReportReason = keyof typeof REPORT_REASONS;

export function severityForReason(reason: ReportReason): ReportSeverity {
  return REPORT_REASONS[reason];
}

/** SLA deadline for a report, computed at file time from its severity. */
export function slaDeadline(severity: ReportSeverity, filedAt: Date): Date {
  return new Date(filedAt.getTime() + REPORT_SLA_MINUTES[severity] * 60_000);
}

export type ModerationRoute = 'auto_action' | 'human_review' | 'auto_hold';

/**
 * Route a moderation verdict by confidence. Above the auto-action floor → act
 * automatically; below the human-review floor → a human MUST review; in between
 * → hold the content (not published) and queue for review. Note: holding, not
 * publishing, is the safe default in the ambiguous band.
 */
export function routeModeration(confidence: number): ModerationRoute {
  if (confidence >= MODERATION_AUTO_ACTION_CONFIDENCE) return 'auto_action';
  if (confidence < MODERATION_HUMAN_REVIEW_FLOOR) return 'human_review';
  return 'auto_hold';
}

export interface ScamScan {
  readonly matched: boolean;
  readonly patterns: readonly string[];
}

/**
 * Detect money/scam solicitation language (IBAN, gift cards, crypto, "send
 * money", papara/havale). A match fast-tracks the report and surfaces a "never
 * send money" interstitial. Treat as a SIGNAL — never an automatic ban.
 */
export function detectScamLanguage(text: string): ScamScan {
  const patterns: string[] = [];
  for (const re of SCAM_PATTERNS) {
    if (re.test(text)) patterns.push(re.source);
  }
  return { matched: patterns.length > 0, patterns };
}

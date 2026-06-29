import { describe, expect, it } from 'vitest';
import {
  appealReversesAction,
  banEvasionRiskScore,
  buildAuditEntry,
  decideModeration,
  detectGroomingSignals,
  detectIsolationLanguage,
  transitionAppeal,
  type ContactBehavior,
} from './safety.js';
import { isErr, unwrap } from '../types/result.js';
import type { ModerationVerdict } from '../adapters/types.js';

const clean: ContactBehavior = {
  newContactsLast24h: 2,
  distinctRecipients: 2,
  recipientsRecentlyJoined: 0,
  medianAgeGapYears: 1,
};

describe('banEvasionRiskScore', () => {
  it('allows a clean registration (no signals)', () => {
    const r = banEvasionRiskScore({ signals: [], linkedBannedAccounts: 0 });
    expect(r.action).toBe('allow');
    expect(r.risk).toBe(0);
  });
  it('blocks an ID-hash match linked to a banned account', () => {
    const r = banEvasionRiskScore({
      signals: ['id_hash_match', 'device_id_match'],
      linkedBannedAccounts: 2,
    });
    expect(r.risk).toBeGreaterThanOrEqual(0.8);
    expect(r.action).toBe('block');
  });
  it('routes a single moderate signal to review', () => {
    const r = banEvasionRiskScore({ signals: ['phone_hash_match'], linkedBannedAccounts: 0 });
    expect(r.action).toBe('review');
  });
  it('dedupes repeated signals', () => {
    const r = banEvasionRiskScore({
      signals: ['device_id_match', 'device_id_match'],
      linkedBannedAccounts: 0,
    });
    expect(r.signals).toEqual(['device_id_match']);
  });
});

describe('detectIsolationLanguage', () => {
  it('flags off-platform + secrecy pushes', () => {
    expect(detectIsolationLanguage('add me on whatsapp')).toBe(true);
    expect(detectIsolationLanguage("let's keep this between us")).toBe(true);
    expect(detectIsolationLanguage('see you at the climbing gym')).toBe(false);
  });
});

describe('detectGroomingSignals', () => {
  it('is clean for normal behaviour', () => {
    const r = detectGroomingSignals(clean, 'looking forward to the ride!');
    expect(r.flags).toHaveLength(0);
    expect(r.needsHumanReview).toBe(false);
  });
  it('flags fan-out + newcomer targeting + age gap and escalates to review', () => {
    const predatory: ContactBehavior = {
      newContactsLast24h: 20,
      distinctRecipients: 10,
      recipientsRecentlyJoined: 9,
      medianAgeGapYears: 15,
    };
    const r = detectGroomingSignals(predatory, 'message me on telegram, our secret');
    expect(r.flags).toEqual(
      expect.arrayContaining(['fan_out', 'newcomer_targeting', 'age_gap', 'isolation_language']),
    );
    expect(r.needsHumanReview).toBe(true);
    expect(r.risk).toBeGreaterThanOrEqual(0.5);
  });
  it('flags money solicitation', () => {
    const r = detectGroomingSignals(clean, 'send me money via IBAN');
    expect(r.flags).toContain('money_solicitation');
  });
});

const verdict = (
  flagged: boolean,
  confidence: number,
  categories: string[] = [],
): ModerationVerdict => ({
  flagged,
  confidence,
  categories,
});

describe('decideModeration (fail-closed pipeline)', () => {
  it('publishes when everything is clear', () => {
    const r = decideModeration({ textVerdict: verdict(false, 0.02) });
    expect(r.outcome).toBe('publish');
    expect(r.needsHuman).toBe(false);
  });
  it('auto-removes a high-confidence flag', () => {
    const r = decideModeration({ textVerdict: verdict(true, 0.98, ['sexual_minors']) });
    expect(r.outcome).toBe('auto_remove');
  });
  it('holds an ambiguous flag for a human', () => {
    const r = decideModeration({ textVerdict: verdict(true, 0.7, ['harassment']) });
    expect(r.outcome).toBe('hold');
    expect(r.needsHuman).toBe(true);
  });
  it('FAILS CLOSED when the text provider is unavailable', () => {
    const r = decideModeration({ textVerdict: null });
    expect(r.outcome).toBe('hold');
    expect(r.reasons).toContain('provider_unavailable');
  });
  it('FAILS CLOSED when an image is present but its verdict is missing', () => {
    const r = decideModeration({ textVerdict: verdict(false, 0.01), hasImage: true });
    expect(r.outcome).toBe('hold');
  });
  it('sends a safety-critical report straight to human review', () => {
    const r = decideModeration({
      textVerdict: verdict(false, 0.01),
      reportSeverity: 'safety_critical',
    });
    expect(r.outcome).toBe('human_review');
  });
  it('routes high behavioural risk to human review', () => {
    const r = decideModeration({ textVerdict: verdict(false, 0.01), riskScore: 0.8 });
    expect(r.outcome).toBe('human_review');
  });
});

describe('transitionAppeal', () => {
  it('actioned → appealed → upheld', () => {
    expect(unwrap(transitionAppeal('actioned', 'file_appeal'))).toBe('appealed');
    expect(unwrap(transitionAppeal('appealed', 'uphold'))).toBe('upheld');
    expect(appealReversesAction('upheld')).toBe(false);
  });
  it('appealed → overturned reverses the action', () => {
    expect(unwrap(transitionAppeal('appealed', 'overturn'))).toBe('overturned');
    expect(appealReversesAction('overturned')).toBe(true);
  });
  it('rejects illegal + terminal transitions', () => {
    expect(isErr(transitionAppeal('actioned', 'uphold'))).toBe(true);
    const term = transitionAppeal('upheld', 'overturn');
    expect(isErr(term)).toBe(true);
    if (isErr(term)) expect(term.error.kind).toBe('terminal');
  });
});

describe('buildAuditEntry', () => {
  it('applies safe defaults and preserves provided fields', () => {
    const e = buildAuditEntry({ action: 'moderation.remove', targetId: 'u1', targetType: 'user' });
    expect(e).toMatchObject({
      actorUserId: null,
      actorType: 'human',
      action: 'moderation.remove',
      targetType: 'user',
      targetId: 'u1',
    });
    expect(e.metadata).toEqual({});
  });
});

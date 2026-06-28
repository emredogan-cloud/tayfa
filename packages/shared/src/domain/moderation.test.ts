import { describe, expect, it } from 'vitest';
import {
  detectScamLanguage,
  routeModeration,
  severityForReason,
  slaDeadline,
} from './moderation.js';

describe('severity → SLA', () => {
  it('maps reasons to the correct severity', () => {
    expect(severityForReason('threat')).toBe('safety_critical');
    expect(severityForReason('csam')).toBe('safety_critical');
    expect(severityForReason('harassment')).toBe('high');
    expect(severityForReason('spam')).toBe('standard');
  });
  it('computes the SLA deadline from severity (30m / 4h / 24h)', () => {
    const filed = new Date('2026-07-01T12:00:00Z');
    expect(slaDeadline('safety_critical', filed).toISOString()).toBe('2026-07-01T12:30:00.000Z');
    expect(slaDeadline('high', filed).toISOString()).toBe('2026-07-01T16:00:00.000Z');
    expect(slaDeadline('standard', filed).toISOString()).toBe('2026-07-02T12:00:00.000Z');
  });
});

describe('routeModeration — confidence routing', () => {
  it('auto-actions only at very high confidence', () => {
    expect(routeModeration(0.99)).toBe('auto_action');
  });
  it('holds (does not publish) in the ambiguous band', () => {
    expect(routeModeration(0.7)).toBe('auto_hold');
  });
  it('sends low-confidence to a human', () => {
    expect(routeModeration(0.2)).toBe('human_review');
  });
});

describe('detectScamLanguage', () => {
  it('flags money/crypto/IBAN solicitation', () => {
    expect(detectScamLanguage('send me 500 via IBAN now').matched).toBe(true);
    expect(detectScamLanguage('pay with a gift card').matched).toBe(true);
    expect(detectScamLanguage('do you have USDT?').matched).toBe(true);
    expect(detectScamLanguage('papara ile gönder').matched).toBe(true);
  });
  it('does not flag normal conversation', () => {
    expect(detectScamLanguage('see you at the climbing gym at 6!').matched).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  decideAiSpend,
  messagePartitionKey,
  shouldArchiveMessage,
  sloBreachMs,
  withinSlo,
} from './scale.js';
import { AI_BUDGETS, MESSAGE_ARCHIVAL, SLO } from '../constants/scale.js';

describe('decideAiSpend — cost guard fails open, never breaks UX', () => {
  it('allows a fresh call under budget', () => {
    expect(decideAiSpend('icebreakers', 0, false)).toEqual({ action: 'allow' });
  });
  it('serves cache over budget when a cached result exists', () => {
    const d = decideAiSpend('icebreakers', AI_BUDGETS.icebreakers.dailyUnits, true);
    expect(d).toEqual({ action: 'serve_cached', reason: 'budget_exhausted' });
  });
  it('falls open to a template over budget with no cache (never denies)', () => {
    const d = decideAiSpend('icebreakers', AI_BUDGETS.icebreakers.dailyUnits + 1, false);
    expect(d).toEqual({ action: 'fallback_template', reason: 'budget_exhausted' });
  });
});

describe('messagePartitionKey', () => {
  it('formats YYYY_MM in UTC, zero-padded', () => {
    expect(messagePartitionKey(new Date('2026-01-09T23:30:00Z'))).toBe('2026_01');
    expect(messagePartitionKey(new Date('2026-12-31T12:00:00Z'))).toBe('2026_12');
  });
});

describe('shouldArchiveMessage', () => {
  it('archives only beyond the hot window', () => {
    expect(shouldArchiveMessage(MESSAGE_ARCHIVAL.hotWindowDays)).toBe(false);
    expect(shouldArchiveMessage(MESSAGE_ARCHIVAL.hotWindowDays + 1)).toBe(true);
  });
});

describe('SLO checks', () => {
  it('passes within budget and fails over it', () => {
    expect(withinSlo('feedP99Ms', SLO.feedP99Ms)).toBe(true);
    expect(withinSlo('feedP99Ms', SLO.feedP99Ms + 1)).toBe(false);
  });
  it('reports breach amount for alert severity', () => {
    expect(sloBreachMs('feedP99Ms', SLO.feedP99Ms + 25)).toBe(25);
    expect(sloBreachMs('feedP99Ms', SLO.feedP99Ms - 10)).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { buildTrialSchedule, checkTrialEligibility } from './trial.js';

describe('checkTrialEligibility — engagement-gated', () => {
  it('is NOT eligible at install (zero engagement)', () => {
    const r = checkTrialEligibility({
      completedMeetups: 0,
      activeCrews: 0,
      hasUsedTrial: false,
      currentEntitlement: 'free',
    });
    expect(r).toEqual({ eligible: false, reason: 'not_engaged_enough' });
  });

  it('is eligible after 2 completed meetups', () => {
    expect(
      checkTrialEligibility({
        completedMeetups: 2,
        activeCrews: 0,
        hasUsedTrial: false,
        currentEntitlement: 'free',
      }),
    ).toEqual({ eligible: true });
  });

  it('is eligible with ≥1 crew even without 2 meetups', () => {
    expect(
      checkTrialEligibility({
        completedMeetups: 1,
        activeCrews: 1,
        hasUsedTrial: false,
        currentEntitlement: 'free',
      }),
    ).toEqual({ eligible: true });
  });

  it('blocks an already-subscribed or already-trialed user', () => {
    expect(
      checkTrialEligibility({
        completedMeetups: 5,
        activeCrews: 2,
        hasUsedTrial: false,
        currentEntitlement: 'tayfa_plus',
      }),
    ).toEqual({ eligible: false, reason: 'already_subscribed' });
    expect(
      checkTrialEligibility({
        completedMeetups: 5,
        activeCrews: 2,
        hasUsedTrial: true,
        currentEntitlement: 'free',
      }),
    ).toEqual({ eligible: false, reason: 'trial_already_used' });
  });
});

describe('buildTrialSchedule', () => {
  it('runs 7 days with a reminder 2 days before expiry', () => {
    const start = new Date('2026-07-01T12:00:00Z');
    const s = buildTrialSchedule(start);
    expect(s.endsAt.toISOString()).toBe('2026-07-08T12:00:00.000Z');
    expect(s.reminderAt.toISOString()).toBe('2026-07-06T12:00:00.000Z');
  });
});

import { TRIAL } from '../constants/pricing.js';
import type { Entitlement } from '../types/enums.js';

/**
 * Engagement-gated trial (MONETIZATION §13). A trial is NEVER offered at install
 * — only after the user has real habit (≥2 completed meetups OR ≥1 crew). This
 * raises trial→paid conversion, lowers post-trial churn, and is anti-abuse
 * (faking eligibility means faking geofenced, mutually-confirmed meetups).
 */

export interface TrialEligibilityInput {
  readonly completedMeetups: number;
  readonly activeCrews: number;
  readonly hasUsedTrial: boolean;
  readonly currentEntitlement: Entitlement;
}

export type TrialEligibility =
  | { readonly eligible: true }
  | {
      readonly eligible: false;
      readonly reason: 'already_subscribed' | 'trial_already_used' | 'not_engaged_enough';
    };

export function checkTrialEligibility(input: TrialEligibilityInput): TrialEligibility {
  if (input.currentEntitlement === 'tayfa_plus') {
    return { eligible: false, reason: 'already_subscribed' };
  }
  if (input.hasUsedTrial) {
    return { eligible: false, reason: 'trial_already_used' };
  }
  const engaged =
    input.completedMeetups >= TRIAL.minCompletedMeetups || input.activeCrews >= TRIAL.orMinCrews;
  return engaged ? { eligible: true } : { eligible: false, reason: 'not_engaged_enough' };
}

export interface TrialSchedule {
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly reminderAt: Date;
}

export function buildTrialSchedule(startsAt: Date): TrialSchedule {
  const endsAt = new Date(startsAt.getTime() + TRIAL.lengthDays * 24 * 60 * 60 * 1000);
  const reminderAt = new Date(
    endsAt.getTime() - TRIAL.reminderBeforeExpiryDays * 24 * 60 * 60 * 1000,
  );
  return { startsAt, endsAt, reminderAt };
}

import { err, ok, type Result } from '../types/result.js';
import type { ReferralState } from '../types/enums.js';

/**
 * Referral reward state machine (GROWTH §8). The defining anti-fraud rule: the
 * reward unlocks ONLY on the referee's FIRST COMPLETED MEETUP — never on signup
 * or install. Signup-gating is "a fraud magnet"; meetup-gating forces an
 * attacker to fake a geofenced, mutually-confirmed, two-verified-user meetup
 * (expensive by NSM design). Self/circular referrals are rejected up front.
 */

export type ReferralEvent =
  | { readonly type: 'install' }
  | { readonly type: 'meetup_completed' } // referee's first NSM-confirmed meetup
  | { readonly type: 'fraud_detected'; readonly signal: string };

export type ReferralTransitionError =
  | {
      readonly kind: 'illegal_transition';
      readonly from: ReferralState;
      readonly event: ReferralEvent['type'];
    }
  | { readonly kind: 'self_referral' }
  | { readonly kind: 'already_terminal'; readonly state: ReferralState };

const TERMINAL: ReadonlySet<ReferralState> = new Set<ReferralState>(['rewarded', 'rejected']);

/**
 * Advance a referral. `referrerId`/`refereeId` are passed so self-referral is
 * caught regardless of state. Reward is granted by reaching `rewarded`, which is
 * reachable ONLY via `meetup_completed` from `installed`.
 */
export function transitionReferral(
  state: ReferralState,
  event: ReferralEvent,
  ids: { readonly referrerId: string; readonly refereeId: string },
): Result<ReferralState, ReferralTransitionError> {
  if (ids.referrerId === ids.refereeId) {
    return err({ kind: 'self_referral' });
  }
  if (event.type === 'fraud_detected') {
    if (TERMINAL.has(state)) return err({ kind: 'already_terminal', state });
    return ok('rejected');
  }
  if (TERMINAL.has(state)) {
    return err({ kind: 'already_terminal', state });
  }

  switch (state) {
    case 'created':
      if (event.type === 'install') return ok('installed');
      break;
    case 'installed':
      // The ONLY path to a reward: a real completed meetup by the referee.
      if (event.type === 'meetup_completed') return ok('activated');
      break;
    case 'activated':
      // `activated` → `rewarded` is the post-grant bookkeeping step.
      if (event.type === 'meetup_completed') return ok('rewarded');
      break;
    default:
      break;
  }
  return err({ kind: 'illegal_transition', from: state, event: event.type });
}

/** Whether reaching this state means the reward should be paid out. */
export const isRewardGranted = (state: ReferralState): boolean =>
  state === 'activated' || state === 'rewarded';

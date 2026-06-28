import { describe, expect, it } from 'vitest';
import { isRewardGranted, transitionReferral } from './referral.js';
import { isErr, unwrap } from '../types/result.js';

const ids = { referrerId: 'A', refereeId: 'B' };

describe('referral state machine — reward is meetup-gated', () => {
  it('walks created → installed → activated (reward) → rewarded', () => {
    expect(unwrap(transitionReferral('created', { type: 'install' }, ids))).toBe('installed');
    expect(unwrap(transitionReferral('installed', { type: 'meetup_completed' }, ids))).toBe(
      'activated',
    );
    expect(isRewardGranted('activated')).toBe(true);
    expect(unwrap(transitionReferral('activated', { type: 'meetup_completed' }, ids))).toBe(
      'rewarded',
    );
  });

  it('does NOT grant a reward on install alone (the anti-fraud core)', () => {
    const afterInstall = unwrap(transitionReferral('created', { type: 'install' }, ids));
    expect(isRewardGranted(afterInstall)).toBe(false);
    // You cannot jump straight from installed to a reward without a real meetup.
    const illegal = transitionReferral('created', { type: 'meetup_completed' }, ids);
    expect(isErr(illegal)).toBe(true);
  });

  it('rejects self-referral regardless of state', () => {
    const r = transitionReferral(
      'created',
      { type: 'install' },
      { referrerId: 'X', refereeId: 'X' },
    );
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.kind).toBe('self_referral');
  });

  it('moves to rejected on fraud detection and stays terminal', () => {
    expect(
      unwrap(
        transitionReferral('installed', { type: 'fraud_detected', signal: 'device_match' }, ids),
      ),
    ).toBe('rejected');
    const afterTerminal = transitionReferral('rejected', { type: 'meetup_completed' }, ids);
    expect(isErr(afterTerminal)).toBe(true);
    if (isErr(afterTerminal)) expect(afterTerminal.error.kind).toBe('already_terminal');
  });
});

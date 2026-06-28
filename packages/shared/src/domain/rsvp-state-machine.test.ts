import { describe, expect, it } from 'vitest';
import {
  initialRsvpStatus,
  isTerminalRsvp,
  occupiesSeat,
  transitionRsvp,
} from './rsvp-state-machine.js';
import { isErr, isOk, unwrap } from '../types/result.js';

describe('initialRsvpStatus', () => {
  it('admits public events directly to going', () => {
    expect(initialRsvpStatus('public')).toBe('going');
  });
  it('requires approval for interest_match and invite events', () => {
    expect(initialRsvpStatus('interest_match')).toBe('requested');
    expect(initialRsvpStatus('invite')).toBe('requested');
  });
});

describe('transitionRsvp — happy paths', () => {
  it('host approves a request', () => {
    const r = transitionRsvp('requested', 'approve', { actor: 'host' });
    expect(unwrap(r)).toBe('approved');
  });
  it('member confirms going then system marks attended', () => {
    expect(unwrap(transitionRsvp('approved', 'confirm_going', { actor: 'member' }))).toBe('going');
    expect(unwrap(transitionRsvp('going', 'mark_attended', { actor: 'system' }))).toBe('attended');
  });
  it('system marks no_show after the window', () => {
    expect(unwrap(transitionRsvp('going', 'mark_no_show', { actor: 'system' }))).toBe('no_show');
  });
  it('member can leave from requested/approved/going', () => {
    expect(unwrap(transitionRsvp('requested', 'leave', { actor: 'member' }))).toBe('left');
    expect(unwrap(transitionRsvp('approved', 'leave', { actor: 'member' }))).toBe('left');
    expect(unwrap(transitionRsvp('going', 'leave', { actor: 'member' }))).toBe('left');
  });
});

describe('transitionRsvp — illegal & unauthorized', () => {
  it('rejects an illegal transition (attend from requested)', () => {
    const r = transitionRsvp('requested', 'mark_attended', { actor: 'system' });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.kind).toBe('illegal_transition');
  });
  it('rejects approve performed by a member (needs host)', () => {
    const r = transitionRsvp('requested', 'approve', { actor: 'member' });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) {
      expect(r.error.kind).toBe('not_authorized');
      if (r.error.kind === 'not_authorized') expect(r.error.need).toBe('host');
    }
  });
  it('treats terminal states as having no outgoing transitions', () => {
    for (const action of ['approve', 'confirm_going', 'mark_attended', 'leave'] as const) {
      expect(isOk(transitionRsvp('attended', action, { actor: 'system' }))).toBe(false);
      expect(isOk(transitionRsvp('no_show', action, { actor: 'system' }))).toBe(false);
      expect(isOk(transitionRsvp('left', action, { actor: 'member' }))).toBe(false);
    }
  });
});

describe('classification helpers', () => {
  it('identifies terminal states', () => {
    expect(isTerminalRsvp('attended')).toBe(true);
    expect(isTerminalRsvp('no_show')).toBe(true);
    expect(isTerminalRsvp('left')).toBe(true);
    expect(isTerminalRsvp('going')).toBe(false);
  });
  it('counts seat-occupying states (no_show/left free the seat)', () => {
    expect(occupiesSeat('requested')).toBe(true);
    expect(occupiesSeat('going')).toBe(true);
    expect(occupiesSeat('attended')).toBe(true);
    expect(occupiesSeat('no_show')).toBe(false);
    expect(occupiesSeat('left')).toBe(false);
  });
});

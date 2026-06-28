import { err, ok, type Result } from '../types/result.js';
import type { EventVisibility, RsvpStatus } from '../types/enums.js';

/**
 * RSVP / attendance state machine (Core Loop §P3). Transitions are explicit and
 * deny-by-default — an undefined (state, action) pair is an error, never a
 * silent no-op. Capacity/transaction concerns are handled by the caller; this
 * module owns only the legality of a transition.
 */

export type RsvpAction =
  | 'approve' // host approves a request
  | 'confirm_going' // member confirms attendance intent
  | 'mark_attended' // check-in / mutual confirm succeeded
  | 'mark_no_show' // check-in window passed without confirmation
  | 'leave'; // member leaves / cancels

export type RsvpTransitionError =
  | { readonly kind: 'illegal_transition'; readonly from: RsvpStatus; readonly action: RsvpAction }
  | {
      readonly kind: 'not_authorized';
      readonly action: RsvpAction;
      readonly need: 'host' | 'member' | 'system';
    };

interface TransitionRule {
  readonly to: RsvpStatus;
  readonly actor: 'host' | 'member' | 'system';
}

/** The complete, closed transition table. */
const TRANSITIONS: Partial<Record<RsvpStatus, Partial<Record<RsvpAction, TransitionRule>>>> = {
  requested: {
    approve: { to: 'approved', actor: 'host' },
    leave: { to: 'left', actor: 'member' },
  },
  approved: {
    confirm_going: { to: 'going', actor: 'member' },
    leave: { to: 'left', actor: 'member' },
  },
  going: {
    mark_attended: { to: 'attended', actor: 'system' },
    mark_no_show: { to: 'no_show', actor: 'system' },
    leave: { to: 'left', actor: 'member' },
  },
  // terminal states: attended, no_show, left — no outgoing transitions.
};

export interface TransitionContext {
  /** Who is performing the action. */
  readonly actor: 'host' | 'member' | 'system';
}

/**
 * Compute the next RSVP status for an action, or an error explaining why it is
 * not permitted. Pure and total.
 */
export function transitionRsvp(
  from: RsvpStatus,
  action: RsvpAction,
  ctx: TransitionContext,
): Result<RsvpStatus, RsvpTransitionError> {
  const rule = TRANSITIONS[from]?.[action];
  if (!rule) {
    return err({ kind: 'illegal_transition', from, action });
  }
  // `system` actions may be performed by the system actor only; host actions by
  // a host; member actions by the member (the host is also a member, but role
  // checks live in the caller — here we enforce the required actor class).
  if (rule.actor !== ctx.actor) {
    return err({ kind: 'not_authorized', action, need: rule.actor });
  }
  return ok(rule.to);
}

/**
 * Decide the initial RSVP status when a user joins, based on the event's
 * approval policy. `interest_match` and `invite` visibilities require host
 * approval; fully public events admit directly to `going`.
 */
export function initialRsvpStatus(visibility: EventVisibility): RsvpStatus {
  return visibility === 'public' ? 'going' : 'requested';
}

const TERMINAL: ReadonlySet<RsvpStatus> = new Set<RsvpStatus>(['attended', 'no_show', 'left']);
export const isTerminalRsvp = (s: RsvpStatus): boolean => TERMINAL.has(s);

/** A status that occupies a capacity seat (counts against `capacity.max`). */
const OCCUPIES_SEAT: ReadonlySet<RsvpStatus> = new Set<RsvpStatus>([
  'requested',
  'approved',
  'going',
  'attended',
]);
export const occupiesSeat = (s: RsvpStatus): boolean => OCCUPIES_SEAT.has(s);

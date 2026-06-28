import { VERIFICATION_RANK, type VerificationLevel } from '../types/enums.js';

/**
 * Step-up verification gating (RISK_ANALYSIS §verification tiers,
 * TECH_DECISIONS ADR-010/012). Phone is free + mandatory; ID + liveness
 * (Verified+) is required to HOST and to DM, and is FREE to the user (the
 * business absorbs the €1–1.5). Fail-closed: if level is unknown, deny.
 */

/** Privileged actions and the minimum verification level each requires. */
export const ACTION_MIN_LEVEL = {
  browse: 'none',
  rsvp: 'phone',
  group_chat: 'phone',
  create_event: 'phone',
  host_event: 'id_live',
  send_dm: 'id_live',
} as const satisfies Record<string, VerificationLevel>;

export type GatedAction = keyof typeof ACTION_MIN_LEVEL;

export function meetsLevel(have: VerificationLevel, need: VerificationLevel): boolean {
  return VERIFICATION_RANK[have] >= VERIFICATION_RANK[need];
}

export type StepUpDecision =
  { readonly allowed: true } | { readonly allowed: false; readonly required: VerificationLevel };

/** The gate every privileged action calls. Deny-by-default on insufficient level. */
export function checkActionAllowed(action: GatedAction, level: VerificationLevel): StepUpDecision {
  const need = ACTION_MIN_LEVEL[action];
  return meetsLevel(level, need) ? { allowed: true } : { allowed: false, required: need };
}

import { NSM } from '../constants/safety.js';
import { isWithin } from './geo-distance.js';
import type { AttendanceConfirmation, GeoPoint } from '../types/domain.js';

/**
 * North Star Metric integrity (RISK_ANALYSIS §NSM). A "completed meetup" — the
 * unit of real value — counts ONLY when:
 *   1. geofence: confirming attendees are physically at the event, and
 *   2. mutual-confirm: ≥2 DISTINCT verified users explicitly confirm, and
 *   3. anti-collusion: signals (shared device, mock GPS) stay below threshold.
 *
 * Designed to resist the canonical attack — one person with two accounts faking
 * a meetup — by requiring distinct device fingerprints, not just distinct user
 * ids. Check-in location is treated as a SIGNAL, never proof (mock-location is
 * possible), so it feeds the collusion score rather than gating alone.
 */

export type NsmFlag =
  | 'duplicate_device'
  | 'mock_location'
  | 'insufficient_attendees'
  | 'geofence_failed'
  | 'outside_window';

export interface NsmInput {
  readonly eventLocation: GeoPoint;
  readonly startsAt: Date;
  readonly confirmations: readonly AttendanceConfirmation[];
}

export interface NsmResult {
  /** Whether this meetup counts toward the North Star Metric. */
  readonly counts: boolean;
  readonly confirmedAttendees: number;
  readonly distinctDevices: number;
  readonly geofencePassed: boolean;
  /** 0 (clean) … 1 (almost certainly collusion). */
  readonly collusionScore: number;
  readonly flags: readonly NsmFlag[];
  readonly validUserIds: readonly string[];
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

function withinWindow(confirmedAt: Date, startsAt: Date): boolean {
  const opens = startsAt.getTime() - NSM.confirmWindowMinutesBefore * 60_000;
  const closes = startsAt.getTime() + NSM.confirmWindowMinutesAfter * 60_000;
  const t = confirmedAt.getTime();
  return t >= opens && t <= closes;
}

export function evaluateMeetupNsm(input: NsmInput): NsmResult {
  const flags = new Set<NsmFlag>();

  // Keep only confirmations inside the time window AND geofence radius.
  const valid: AttendanceConfirmation[] = [];
  for (const c of input.confirmations) {
    const at = new Date(c.confirmedAt);
    if (!withinWindow(at, input.startsAt)) {
      flags.add('outside_window');
      continue;
    }
    if (!isWithin(input.eventLocation, c.location, NSM.geofenceRadiusMeters)) {
      flags.add('geofence_failed');
      continue;
    }
    valid.push(c);
  }

  // Distinct users and distinct devices among valid confirmations.
  const userIds = new Set<string>();
  const deviceById = new Map<string, Set<string>>(); // device → users seen on it
  let mockCount = 0;
  for (const c of valid) {
    userIds.add(c.userId);
    if (c.mockLocationSuspected) mockCount += 1;
    const users = deviceById.get(c.deviceFingerprint) ?? new Set<string>();
    users.add(c.userId);
    deviceById.set(c.deviceFingerprint, users);
  }
  const distinctDevices = deviceById.size;
  const distinctUsers = userIds.size;

  // Collusion score: shared-device fraction (the strongest signal) + mock-GPS fraction.
  const denom = valid.length === 0 ? 1 : valid.length;
  const sharedDeviceConfs = valid.length - distinctDevices; // confs beyond one-per-device
  const deviceComponent = clamp01(sharedDeviceConfs / denom);
  const mockComponent = clamp01(mockCount / denom);
  const collusionScore = clamp01(deviceComponent * 0.6 + mockComponent * 0.4);

  if (sharedDeviceConfs > 0) flags.add('duplicate_device');
  if (mockCount > 0) flags.add('mock_location');

  const geofencePassed = distinctUsers >= NSM.minConfirmedAttendees;
  if (!geofencePassed) flags.add('insufficient_attendees');

  // A meetup counts only when every gate holds: enough DISTINCT users on enough
  // DISTINCT devices, inside geofence+window, with collusion below threshold.
  const counts =
    geofencePassed &&
    distinctDevices >= NSM.minConfirmedAttendees &&
    collusionScore <= NSM.maxSuspectedCollusionShare;

  return {
    counts,
    confirmedAttendees: distinctUsers,
    distinctDevices,
    geofencePassed,
    collusionScore,
    flags: [...flags],
    validUserIds: [...userIds],
  };
}

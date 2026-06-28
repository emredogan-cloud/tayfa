import { describe, expect, it } from 'vitest';
import { evaluateMeetupNsm } from './nsm.js';
import type { AttendanceConfirmation, GeoPoint } from '../types/domain.js';

const EVENT_LOC: GeoPoint = { lat: 40.9907, lng: 29.0277 };
const STARTS_AT = new Date('2026-07-01T18:00:00Z');
const NEAR: GeoPoint = { lat: 40.9908, lng: 29.0278 }; // ~15m away
const FAR: GeoPoint = { lat: 41.05, lng: 29.05 }; // kilometers away

function conf(over: Partial<AttendanceConfirmation>): AttendanceConfirmation {
  return {
    userId: 'u1',
    confirmedAt: '2026-07-01T18:05:00Z',
    location: NEAR,
    mockLocationSuspected: false,
    deviceFingerprint: 'device-1',
    ...over,
  };
}

describe('evaluateMeetupNsm', () => {
  it('counts a genuine meetup: 2 distinct users on 2 distinct devices, in geofence + window', () => {
    const r = evaluateMeetupNsm({
      eventLocation: EVENT_LOC,
      startsAt: STARTS_AT,
      confirmations: [
        conf({ userId: 'u1', deviceFingerprint: 'device-1' }),
        conf({ userId: 'u2', deviceFingerprint: 'device-2' }),
      ],
    });
    expect(r.counts).toBe(true);
    expect(r.confirmedAttendees).toBe(2);
    expect(r.distinctDevices).toBe(2);
    expect(r.geofencePassed).toBe(true);
    expect(r.collusionScore).toBe(0);
    expect(r.flags).toHaveLength(0);
  });

  it('REJECTS the two-accounts-one-device attack', () => {
    const r = evaluateMeetupNsm({
      eventLocation: EVENT_LOC,
      startsAt: STARTS_AT,
      confirmations: [
        conf({ userId: 'u1', deviceFingerprint: 'same-device' }),
        conf({ userId: 'u2', deviceFingerprint: 'same-device' }),
      ],
    });
    expect(r.counts).toBe(false);
    expect(r.distinctDevices).toBe(1);
    expect(r.collusionScore).toBeGreaterThan(0);
    expect(r.flags).toContain('duplicate_device');
  });

  it('excludes a confirmation outside the geofence and fails on too few attendees', () => {
    const r = evaluateMeetupNsm({
      eventLocation: EVENT_LOC,
      startsAt: STARTS_AT,
      confirmations: [
        conf({ userId: 'u1', deviceFingerprint: 'device-1', location: NEAR }),
        conf({ userId: 'u2', deviceFingerprint: 'device-2', location: FAR }),
      ],
    });
    expect(r.counts).toBe(false);
    expect(r.confirmedAttendees).toBe(1);
    expect(r.flags).toContain('geofence_failed');
    expect(r.flags).toContain('insufficient_attendees');
  });

  it('excludes a confirmation outside the time window', () => {
    const r = evaluateMeetupNsm({
      eventLocation: EVENT_LOC,
      startsAt: STARTS_AT,
      confirmations: [
        conf({ userId: 'u1', deviceFingerprint: 'device-1' }),
        // 90 min before start — window opens only 30 min before
        conf({ userId: 'u2', deviceFingerprint: 'device-2', confirmedAt: '2026-07-01T16:30:00Z' }),
      ],
    });
    expect(r.flags).toContain('outside_window');
    expect(r.confirmedAttendees).toBe(1);
    expect(r.counts).toBe(false);
  });

  it('flags suspected mock-location and raises the collusion score', () => {
    const r = evaluateMeetupNsm({
      eventLocation: EVENT_LOC,
      startsAt: STARTS_AT,
      confirmations: [
        conf({ userId: 'u1', deviceFingerprint: 'device-1', mockLocationSuspected: true }),
        conf({ userId: 'u2', deviceFingerprint: 'device-2', mockLocationSuspected: true }),
      ],
    });
    expect(r.flags).toContain('mock_location');
    expect(r.collusionScore).toBeGreaterThan(0);
    expect(r.counts).toBe(false); // mock fraction pushes collusion over threshold
  });

  it('does not count a solo check-in', () => {
    const r = evaluateMeetupNsm({
      eventLocation: EVENT_LOC,
      startsAt: STARTS_AT,
      confirmations: [conf({ userId: 'u1' })],
    });
    expect(r.counts).toBe(false);
    expect(r.flags).toContain('insufficient_attendees');
  });
});

import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_EVENTS,
  ANALYTICS_EVENT_NAMES,
  NORTH_STAR_EVENT,
  buildAnalyticsEvent,
} from './taxonomy.js';

describe('analytics taxonomy', () => {
  it('has a schema for every declared event name (closed vocabulary)', () => {
    for (const name of ANALYTICS_EVENT_NAMES) {
      expect(ANALYTICS_EVENTS[name]).toBeDefined();
    }
  });

  it('names the North Star Metric event explicitly', () => {
    expect(NORTH_STAR_EVENT).toBe('meetup_completed');
  });

  it('validates and constructs a well-formed event', () => {
    const e = buildAnalyticsEvent('onboarding_completed', {
      interest_count: 7,
      seconds_to_complete: 64,
    });
    expect(e.name).toBe('onboarding_completed');
    expect(e.props.interest_count).toBe(7);
  });

  it('rejects malformed props (strict — catches typos and budget creep)', () => {
    expect(() =>
      // @ts-expect-error — extra property is not allowed by the strict schema
      buildAnalyticsEvent('age_gate_passed', { age: 21, extra: true }),
    ).toThrow();
    expect(() => buildAnalyticsEvent('age_gate_passed', { age: 16 })).toThrow(); // age < 18
  });

  it('enforces the NSM event invariant (≥2 confirmed attendees)', () => {
    expect(() =>
      buildAnalyticsEvent('meetup_completed', {
        event_id: '11111111-1111-4111-8111-111111111111',
        confirmed_attendees: 1, // invalid — NSM requires ≥2
        geofence_passed: true,
        collusion_score: 0,
      }),
    ).toThrow();
  });
});

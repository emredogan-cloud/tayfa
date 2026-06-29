import { describe, expect, it } from 'vitest';
import {
  buildRecapCard,
  computeStreak,
  crewCandidatesFromCluster,
  decideLifecycleSend,
  nextRecurrence,
  selectLifecycleJourney,
  shouldSuggestCrew,
  type LifecycleState,
} from './retention.js';
import type { NotificationCategory } from '../constants/notifications.js';
import type { SendWindowCounts } from './notifications.js';

describe('crew formation', () => {
  it('suggests a crew on repeat co-attendance + mutual would-meet-again', () => {
    expect(shouldSuggestCrew({ sharedMeetups: 2, mutualWouldMeetAgain: true })).toBe(true);
    expect(shouldSuggestCrew({ sharedMeetups: 1, mutualWouldMeetAgain: true })).toBe(false);
    expect(shouldSuggestCrew({ sharedMeetups: 3, mutualWouldMeetAgain: false })).toBe(false);
  });
  it('extracts qualifying members from a cluster, deduped', () => {
    const members = crewCandidatesFromCluster([
      { userId: 'a', co: { sharedMeetups: 2, mutualWouldMeetAgain: true } },
      { userId: 'a', co: { sharedMeetups: 3, mutualWouldMeetAgain: true } },
      { userId: 'b', co: { sharedMeetups: 1, mutualWouldMeetAgain: true } },
    ]);
    expect(members).toEqual(['a']);
  });
});

describe('computeStreak (positive, graceful)', () => {
  it('counts the current run from the most recent week', () => {
    const s = computeStreak([true, true, true, false, true]);
    expect(s.current).toBe(3);
    expect(s.longest).toBe(3);
    expect(s.active).toBe(true);
    expect(s.message).toContain('3 weeks');
  });
  it('breaks gracefully (no guilt) when the latest week is missed', () => {
    const s = computeStreak([false, true, true]);
    expect(s.current).toBe(0);
    expect(s.active).toBe(false);
    expect(s.longest).toBe(2);
    expect(s.message.toLowerCase()).toContain('fresh start');
  });
  it('handles a brand-new user', () => {
    expect(computeStreak([]).current).toBe(0);
    expect(computeStreak([true]).message).toContain('1 week');
  });
});

describe('nextRecurrence', () => {
  const from = new Date('2026-07-01T18:00:00Z');
  it('advances weekly/biweekly/monthly and returns null for ad_hoc', () => {
    expect(nextRecurrence('weekly', from)?.toISOString()).toBe('2026-07-08T18:00:00.000Z');
    expect(nextRecurrence('biweekly', from)?.toISOString()).toBe('2026-07-15T18:00:00.000Z');
    expect(nextRecurrence('monthly', from)?.toISOString()).toBe('2026-08-01T18:00:00.000Z');
    expect(nextRecurrence('ad_hoc', from)).toBeNull();
  });
});

describe('buildRecapCard — privacy-safe', () => {
  it('uses neighborhood + counts only, never a precise pin or names', () => {
    const card = buildRecapCard({
      title: 'Sunday Coastal Ride',
      neighborhood: 'Kadıköy',
      attendeeCount: 5,
      category: 'Cycling',
      distanceKm: 18,
      vibeAverage: 4.6,
    });
    expect(card.headline).toBe('Sunday Coastal Ride');
    expect(card.subline).toBe('Cycling · Kadıköy');
    const flat = JSON.stringify(card);
    expect(flat).not.toMatch(/\d+\.\d{4,}/); // no lat/long-precision numbers
    expect(card.stats).toEqual(
      expect.arrayContaining([
        { label: 'crew', value: '5 people' },
        { label: 'where', value: 'Kadıköy' },
      ]),
    );
  });
  it('omits optional stats when absent', () => {
    const card = buildRecapCard({
      title: 'Coffee',
      neighborhood: null,
      attendeeCount: 1,
      category: 'Coffee',
    });
    expect(card.subline).toBe('Coffee');
    expect(card.stats).toEqual([{ label: 'crew', value: '1 person' }]);
  });
});

describe('selectLifecycleJourney', () => {
  const base: LifecycleState = {
    onboardingComplete: true,
    completedMeetups: 2,
    activeCrews: 0,
    daysSinceLastMeetup: 7,
  };
  it('returns null until onboarding is complete', () => {
    expect(selectLifecycleJourney({ ...base, onboardingComplete: false })).toBeNull();
  });
  it('activates first meetup, then rebooking, crew ritual, win-back in priority order', () => {
    expect(selectLifecycleJourney({ ...base, completedMeetups: 0 })).toBe(
      'onboarding_to_first_meetup',
    );
    expect(selectLifecycleJourney({ ...base, daysSinceLastMeetup: 1 })).toBe(
      'post_meetup_rebooking',
    );
    expect(selectLifecycleJourney({ ...base, activeCrews: 1 })).toBe('crew_ritual');
    expect(selectLifecycleJourney({ ...base, daysSinceLastMeetup: 30 })).toBe('lapsing_winback');
  });
  it('returns null for a freshly-active user needing no nudge', () => {
    expect(selectLifecycleJourney(base)).toBeNull();
  });
});

describe('decideLifecycleSend — respects caps', () => {
  const counts = (over: Partial<SendWindowCounts> = {}): SendWindowCounts => ({
    perCategory: { your_plans: 0, social: 0, discovery: 0, lifecycle: 0 },
    total: 0,
    ...over,
  });
  const lapsing: LifecycleState = {
    onboardingComplete: true,
    completedMeetups: 3,
    activeCrews: 0,
    daysSinceLastMeetup: 30,
  };
  const noMutes = new Set<NotificationCategory>();

  it('sends when under the cap', () => {
    const d = decideLifecycleSend(lapsing, counts(), noMutes);
    expect(d?.journey).toBe('lapsing_winback');
    expect(d?.send).toBe(true);
  });
  it('is blocked by the global daily cap (never jumps it)', () => {
    const d = decideLifecycleSend(lapsing, counts({ total: 2 }), noMutes);
    expect(d?.send).toBe(false);
    expect(d?.reason).toBe('global_cap');
  });
  it('respects a user mute on lifecycle', () => {
    const d = decideLifecycleSend(lapsing, counts(), new Set<NotificationCategory>(['lifecycle']));
    expect(d?.send).toBe(false);
    expect(d?.reason).toBe('muted');
  });
  it('returns null when there is no journey to send', () => {
    const fresh: LifecycleState = {
      onboardingComplete: true,
      completedMeetups: 2,
      activeCrews: 0,
      daysSinceLastMeetup: 7,
    };
    expect(decideLifecycleSend(fresh, counts(), noMutes)).toBeNull();
  });
});

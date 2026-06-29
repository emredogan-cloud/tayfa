import {
  GLOBAL_DAILY_NOTIFICATION_CAP,
  NOTIFICATION_POLICY,
  type NotificationCategory,
} from '../constants/notifications.js';
import { canSendNotification, type SendWindowCounts } from './notifications.js';

/**
 * Retention engine (Phase 6) — turn one-off meetups into habits WITHOUT dark
 * patterns. Pure + tested: crew suggestion, positive-framed streaks, recurrence,
 * privacy-safe recap cards, and lifecycle-journey selection that always respects
 * the server-side notification caps. Framing is identity/positive, never guilt
 * or loss (GROWTH_STRATEGY §7); streaks break gracefully.
 */

// ── Crew formation (the D30 engine) ───────────────────────────────────────────

export interface CoAttendance {
  /** Distinct meetups these two attended together. */
  readonly sharedMeetups: number;
  /** Both rated would_meet_again = true. */
  readonly mutualWouldMeetAgain: boolean;
}

/**
 * Whether a pair (or cluster) should be prompted to form a crew. Repeat
 * co-attendance + a mutual "would meet again" is the signal that a one-off has
 * become a group worth keeping (GROWTH §6). Conservative: needs ≥2 shared meetups.
 */
export function shouldSuggestCrew(co: CoAttendance): boolean {
  return co.sharedMeetups >= 2 && co.mutualWouldMeetAgain;
}

/** From a cluster's pairwise signals, the members who qualify for a crew suggestion. */
export function crewCandidatesFromCluster(
  pairs: readonly { userId: string; co: CoAttendance }[],
): string[] {
  return [...new Set(pairs.filter((p) => shouldSuggestCrew(p.co)).map((p) => p.userId))];
}

// ── Streaks (positive, graceful) ──────────────────────────────────────────────

export interface StreakResult {
  readonly current: number;
  readonly longest: number;
  readonly active: boolean;
  /** Positive, identity-framed copy — never guilt/loss (GROWTH §7). */
  readonly message: string;
}

/**
 * Weekly-meetup streak from a recent-first list of weeks (true = had ≥1 completed
 * meetup that week). A missed week breaks the current streak (back to 0) but is
 * "life happens", never punished. The most recent week leads.
 */
export function computeStreak(attendedWeeksRecentFirst: readonly boolean[]): StreakResult {
  let current = 0;
  for (const w of attendedWeeksRecentFirst) {
    if (w) current += 1;
    else break;
  }
  let longest = 0;
  let run = 0;
  for (const w of attendedWeeksRecentFirst) {
    run = w ? run + 1 : 0;
    if (run > longest) longest = run;
  }
  const active = current > 0;
  const message = !active
    ? 'Fresh start — your next plan kicks off a new streak 🌱'
    : current === 1
      ? 'Nice — 1 week of real plans. The crew habit starts here.'
      : `${current} weeks of real plans 🎉 — you’re building something.`;
  return { current, longest, active, message };
}

// ── Recurrence ────────────────────────────────────────────────────────────────

export type Cadence = 'weekly' | 'biweekly' | 'monthly' | 'ad_hoc';

/** Next occurrence for a crew's cadence. `ad_hoc` has no schedule → null. */
export function nextRecurrence(cadence: Cadence, from: Date): Date | null {
  const d = new Date(from.getTime());
  switch (cadence) {
    case 'weekly':
      d.setDate(d.getDate() + 7);
      return d;
    case 'biweekly':
      d.setDate(d.getDate() + 14);
      return d;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      return d;
    case 'ad_hoc':
      return null;
  }
}

// ── Recap cards (shareable, privacy-safe) ─────────────────────────────────────

export interface RecapInput {
  readonly title: string;
  readonly neighborhood: string | null;
  readonly attendeeCount: number;
  readonly category: string;
  readonly distanceKm?: number;
  readonly vibeAverage?: number;
}

export interface RecapCard {
  readonly headline: string;
  readonly subline: string;
  readonly stats: readonly { label: string; value: string }[];
}

/**
 * Build a shareable post-meetup recap (GROWTH §virality). Privacy-audited: uses
 * NEIGHBORHOOD only (never a precise pin), counts only (never names), and no PII —
 * safe to render to an OG image / IG story.
 */
export function buildRecapCard(input: RecapInput): RecapCard {
  const stats: { label: string; value: string }[] = [
    {
      label: 'crew',
      value: `${input.attendeeCount} ${input.attendeeCount === 1 ? 'person' : 'people'}`,
    },
  ];
  if (input.neighborhood) stats.push({ label: 'where', value: input.neighborhood });
  if (typeof input.distanceKm === 'number' && input.distanceKm > 0) {
    stats.push({ label: 'distance', value: `${input.distanceKm.toFixed(1)} km` });
  }
  if (typeof input.vibeAverage === 'number') {
    stats.push({ label: 'vibe', value: `${input.vibeAverage.toFixed(1)}/5` });
  }
  return {
    headline: input.title,
    subline: input.neighborhood ? `${input.category} · ${input.neighborhood}` : input.category,
    stats,
  };
}

// ── Lifecycle journeys ────────────────────────────────────────────────────────

export type LifecycleJourney =
  'onboarding_to_first_meetup' | 'post_meetup_rebooking' | 'crew_ritual' | 'lapsing_winback' | null;

export interface LifecycleState {
  readonly onboardingComplete: boolean;
  readonly completedMeetups: number;
  readonly activeCrews: number;
  readonly daysSinceLastMeetup: number | null;
}

/**
 * Pick the lifecycle journey a user belongs in (GROWTH §retention loops). Order:
 * crews (D30 ritual) > just-had-a-meetup rebooking > activate first meetup >
 * win back a lapsing user. Returns null when the user is freshly active and needs
 * no nudge (don't over-message).
 */
export function selectLifecycleJourney(state: LifecycleState): LifecycleJourney {
  if (!state.onboardingComplete) return null;
  if (state.completedMeetups === 0) return 'onboarding_to_first_meetup';
  if (state.daysSinceLastMeetup !== null && state.daysSinceLastMeetup <= 3) {
    return 'post_meetup_rebooking';
  }
  if (state.activeCrews > 0) return 'crew_ritual';
  if (state.daysSinceLastMeetup !== null && state.daysSinceLastMeetup >= 14) {
    return 'lapsing_winback';
  }
  return null;
}

/** Lifecycle messages are the lowest-priority `lifecycle` category. */
const JOURNEY_CATEGORY: NotificationCategory = 'lifecycle';

export interface LifecycleSendDecision {
  readonly journey: Exclude<LifecycleJourney, null>;
  readonly send: boolean;
  readonly reason: 'ok' | 'muted' | 'category_cap' | 'global_cap';
}

/**
 * Decide whether the selected lifecycle journey may send now — ALWAYS through the
 * server-side caps (GROWTH §9: ≤1–2/day, easy opt-out). A lifecycle nudge never
 * jumps the cap. Returns null when there is no journey to send.
 */
export function decideLifecycleSend(
  state: LifecycleState,
  counts: SendWindowCounts,
  mutedCategories: ReadonlySet<NotificationCategory>,
): LifecycleSendDecision | null {
  const journey = selectLifecycleJourney(state);
  if (journey === null) return null;
  const decision = canSendNotification(JOURNEY_CATEGORY, counts, mutedCategories);
  return {
    journey,
    send: decision.send,
    reason: decision.send ? 'ok' : decision.reason,
  };
}

/** Exposed for callers/tests: the daily ceiling lifecycle nudges live under. */
export const LIFECYCLE_CAPS = {
  category: NOTIFICATION_POLICY.lifecycle.dailyCap,
  global: GLOBAL_DAILY_NOTIFICATION_CAP,
} as const;

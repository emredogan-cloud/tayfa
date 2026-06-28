/**
 * Notification policy (GROWTH_STRATEGY §9). Frequency caps are enforced
 * SERVER-SIDE. Every push must pass the "would a friend text this?" bar.
 */

export const NOTIFICATION_CATEGORIES = ['your_plans', 'social', 'discovery', 'lifecycle'] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export interface NotificationPolicy {
  readonly category: NotificationCategory;
  readonly priority: number; // 1 = highest
  /** Max sends per rolling 24h for this category. `null` = governed only by global cap. */
  readonly dailyCap: number | null;
  /** Whether the user can mute this category without losing the others. */
  readonly userMutable: boolean;
}

export const NOTIFICATION_POLICY: Record<NotificationCategory, NotificationPolicy> = {
  your_plans: { category: 'your_plans', priority: 1, dailyCap: null, userMutable: false },
  social: { category: 'social', priority: 2, dailyCap: 3, userMutable: true },
  discovery: { category: 'discovery', priority: 3, dailyCap: 1, userMutable: true },
  lifecycle: { category: 'lifecycle', priority: 4, dailyCap: 1, userMutable: true },
};

/** Global per-user ceiling across all categories (GROWTH §9: ≤1–2/day, tunable). */
export const GLOBAL_DAILY_NOTIFICATION_CAP = 2;

/** Opt-out guardrail — if exceeded, a notification experiment loses. */
export const NOTIFICATION_OPT_OUT_GUARDRAIL = 0.15;

import {
  GLOBAL_DAILY_NOTIFICATION_CAP,
  NOTIFICATION_POLICY,
  type NotificationCategory,
} from '../constants/notifications.js';

/**
 * Notification frequency-cap enforcement (GROWTH §9). Enforced SERVER-SIDE.
 * `your_plans` is privileged (the user wants those) and bypasses the discovery/
 * lifecycle caps but still counts toward the global ceiling. Caps are checked
 * against rolling-24h send counts the caller supplies (from Redis).
 */

export interface SendWindowCounts {
  /** Sends in the last 24h, per category. */
  readonly perCategory: Readonly<Record<NotificationCategory, number>>;
  /** Total sends in the last 24h across all categories. */
  readonly total: number;
}

export type NotificationDecision =
  | { readonly send: true }
  | { readonly send: false; readonly reason: 'category_cap' | 'global_cap' | 'muted' };

export function canSendNotification(
  category: NotificationCategory,
  counts: SendWindowCounts,
  userMutedCategories: ReadonlySet<NotificationCategory>,
): NotificationDecision {
  const policy = NOTIFICATION_POLICY[category];

  if (userMutedCategories.has(category) && policy.userMutable) {
    return { send: false, reason: 'muted' };
  }

  // your_plans bypasses category + global caps (it is what the user came for),
  // but everything else respects both.
  if (category === 'your_plans') {
    return { send: true };
  }

  if (counts.total >= GLOBAL_DAILY_NOTIFICATION_CAP) {
    return { send: false, reason: 'global_cap' };
  }

  if (policy.dailyCap !== null && counts.perCategory[category] >= policy.dailyCap) {
    return { send: false, reason: 'category_cap' };
  }

  return { send: true };
}

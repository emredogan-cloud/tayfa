import { describe, expect, it } from 'vitest';
import { canSendNotification, type SendWindowCounts } from './notifications.js';
import type { NotificationCategory } from '../constants/notifications.js';

const counts = (over: Partial<SendWindowCounts> = {}): SendWindowCounts => ({
  perCategory: { your_plans: 0, social: 0, discovery: 0, lifecycle: 0 },
  total: 0,
  ...over,
});
const noMutes = new Set<NotificationCategory>();

describe('canSendNotification', () => {
  it('always allows your_plans, even past the global cap', () => {
    expect(canSendNotification('your_plans', counts({ total: 99 }), noMutes).send).toBe(true);
  });

  it('enforces the global daily cap on non-essential categories', () => {
    const d = canSendNotification('discovery', counts({ total: 2 }), noMutes);
    expect(d).toEqual({ send: false, reason: 'global_cap' });
  });

  it('enforces a per-category cap (discovery ≤ 1/day)', () => {
    const d = canSendNotification(
      'discovery',
      counts({ total: 1, perCategory: { your_plans: 0, social: 0, discovery: 1, lifecycle: 0 } }),
      noMutes,
    );
    expect(d).toEqual({ send: false, reason: 'category_cap' });
  });

  it('respects a user mute on a mutable category', () => {
    const muted = new Set<NotificationCategory>(['discovery']);
    expect(canSendNotification('discovery', counts(), muted)).toEqual({
      send: false,
      reason: 'muted',
    });
  });

  it('allows a within-cap social notification', () => {
    expect(canSendNotification('social', counts({ total: 1 }), noMutes).send).toBe(true);
  });
});

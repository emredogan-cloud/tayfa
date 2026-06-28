import type { Capacity } from '@tayfa/shared/types';

/** Lightweight, locale-stable formatters. No heavy date lib in the bundle. */

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** "Sat 14 Jun · 19:30" */
export function formatEventWhen(iso: string): string {
  const d = new Date(iso);
  const day = DAYS[d.getDay()] ?? '';
  const month = MONTHS[d.getMonth()] ?? '';
  return `${day} ${d.getDate()} ${month} · ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Human "starts in" copy: "in 2h", "in 3 days", "started". */
export function formatStartsIn(iso: string, now: Date = new Date()): string {
  const diffMs = new Date(iso).getTime() - now.getTime();
  if (diffMs <= 0) return 'happening now';
  const mins = Math.round(diffMs / 60_000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.round(hours / 24);
  return `in ${days} ${days === 1 ? 'day' : 'days'}`;
}

export function formatDistance(meters: number): string {
  if (meters < 950) return `${Math.round(meters / 10) * 10} m away`;
  return `${(meters / 1000).toFixed(meters < 9500 ? 1 : 0)} km away`;
}

export function formatGoing(capacity: Capacity): string {
  const remaining = Math.max(0, capacity.max - capacity.going);
  if (remaining === 0) return 'Full';
  if (capacity.going === 0) return `${capacity.max} spots`;
  return `${capacity.going} going · ${remaining} ${remaining === 1 ? 'spot' : 'spots'} left`;
}

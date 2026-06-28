import { Redis } from '@upstash/redis';
import type { RateLimit } from '@tayfa/shared/constants';
import { env } from './env.js';

/**
 * Fixed-window rate limiter (RISK_ANALYSIS §5, Redis-backed). Uses Upstash Redis
 * (HTTP — works in the Edge runtime) when configured, and falls back to an
 * in-process Map so dev/CI run with no Redis. The window/limit come from the
 * spine's `RATE_LIMITS` so the ceilings stay in one place.
 *
 * Fixed-window is deliberate: it's atomic with a single INCR+EXPIRE, cheap, and
 * good enough for abuse ceilings. The mock fallback is per-isolate (not shared)
 * which is acceptable for local — never rely on it in production.
 */

export interface RateLimitResult {
  readonly success: boolean;
  readonly limit: number;
  readonly remaining: number;
  /** Unix ms when the current window resets. */
  readonly reset: number;
}

let redis: Redis | null = null;
function getRedis(): Redis | null {
  const url = env.redisUrl();
  const token = env.redisToken();
  if (!url || !token) return null;
  redis ??= new Redis({ url, token });
  return redis;
}

// ── In-memory fallback (mock-safe) ───────────────────────────────────────────
const memory = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    memory.set(key, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, reset: resetAt };
  }
  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  return { success: entry.count <= limit, limit, remaining, reset: entry.resetAt };
}

/**
 * Consume one token for `identifier` under a named limit. `identifier` is usually
 * a user id, phone, or IP — combined with the action so different actions never
 * share a bucket.
 */
export async function consumeRateLimit(
  limit: RateLimit,
  identifier: string,
): Promise<RateLimitResult> {
  const key = `rl:${limit.action}:${identifier}`;
  const client = getRedis();
  if (!client) {
    return memoryLimit(key, limit.max, limit.windowSeconds);
  }

  // INCR returns the new count; set the TTL only on the first hit of a window.
  const count = await client.incr(key);
  if (count === 1) {
    await client.expire(key, limit.windowSeconds);
  }
  const ttl = await client.ttl(key);
  const reset = Date.now() + (ttl > 0 ? ttl * 1000 : limit.windowSeconds * 1000);
  return {
    success: count <= limit.max,
    limit: limit.max,
    remaining: Math.max(0, limit.max - count),
    reset,
  };
}

/** Standard 429 headers so clients can back off. */
export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    'RateLimit-Limit': String(r.limit),
    'RateLimit-Remaining': String(r.remaining),
    'RateLimit-Reset': String(Math.ceil((r.reset - Date.now()) / 1000)),
  };
}

import { Redis } from '@upstash/redis';
import { env } from './env.js';

/**
 * Idempotency guard for webhooks + at-most-once writes. `claim(key)` returns
 * `true` exactly once per key within the TTL; subsequent calls return `false`,
 * so a replayed RevenueCat/Persona delivery (or a client retry) is a no-op.
 *
 * Redis (Upstash) is the durable backend; an in-memory Set is the mock fallback.
 * Note: the DB unique constraints (e.g. `subscription.providerTxnId`) are the
 * ultimate idempotency backstop — this is the fast, pre-write guard.
 */

let redis: Redis | null = null;
function getRedis(): Redis | null {
  const url = env.redisUrl();
  const token = env.redisToken();
  if (!url || !token) return null;
  redis ??= new Redis({ url, token });
  return redis;
}

const seen = new Map<string, number>();

/** Returns true if THIS caller is the first to claim `key` (within `ttlSeconds`). */
export async function claimOnce(key: string, ttlSeconds = 60 * 60 * 24): Promise<boolean> {
  const namespaced = `idem:${key}`;
  const client = getRedis();
  if (!client) {
    const now = Date.now();
    const exp = seen.get(namespaced);
    if (exp && exp > now) return false;
    seen.set(namespaced, now + ttlSeconds * 1000);
    return true;
  }
  // SET key value NX EX ttl → 'OK' when set (first time), null when it already exists.
  const res = await client.set(namespaced, '1', { nx: true, ex: ttlSeconds });
  return res === 'OK';
}

import { EMBEDDING } from '../constants/geo.js';
import { detectScamLanguage } from '../domain/moderation.js';
import type {
  AnalyticsClient,
  BillingProvider,
  EmbeddingProvider,
  GenerativeProvider,
  LifecycleProvider,
  ModerationProvider,
  ModerationVerdict,
  Providers,
  PushProvider,
  VerificationProvider,
} from './types.js';

/**
 * Deterministic mock providers. They let the entire app run with NO credentials
 * (mission §AUTONOMY) and make tests reproducible. They honour the production
 * contract — same shapes, fail-closed semantics — so swapping in a real adapter
 * changes nothing for callers.
 */

// FNV-1a → seedable PRNG for deterministic pseudo-embeddings.
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BANNED_WORDS = ['nsfw', 'nude', 'kill you', 'csam'];

export class MockVerificationProvider implements VerificationProvider {
  async startInquiry(input: { userId: string; type: 'id' | 'liveness' }) {
    return {
      inquiryId: `mock_inq_${input.type}_${input.userId}`,
      hostedUrl: `https://mock.persona/inquiry/${input.userId}`,
    };
  }
  async resolveWebhook(payload: unknown) {
    // Mock resolves a well-formed payload to id_live; anything malformed → deny.
    const p = payload as { userId?: string; passed?: boolean } | null;
    if (!p || typeof p.userId !== 'string' || p.passed !== true) return null; // fail-closed
    return { userId: p.userId, level: 'id_live' as const, providerRef: `mock_ref_${p.userId}` };
  }
}

export class MockModerationProvider implements ModerationProvider {
  async moderateText(text: string): Promise<ModerationVerdict> {
    const lower = text.toLowerCase();
    const hits = BANNED_WORDS.filter((w) => lower.includes(w));
    const scam = detectScamLanguage(text);
    const flagged = hits.length > 0 || scam.matched;
    return {
      flagged,
      confidence: flagged ? 0.97 : 0.02,
      categories: [...hits, ...(scam.matched ? ['scam_solicitation'] : [])],
    };
  }
  async moderateImage(imageUrl: string): Promise<ModerationVerdict> {
    const flagged = /nsfw|nude/i.test(imageUrl);
    return { flagged, confidence: flagged ? 0.96 : 0.03, categories: flagged ? ['nsfw'] : [] };
  }
}

export class MockBillingProvider implements BillingProvider {
  async getEntitlement(userId: string) {
    return { userId, entitlement: 'free' as const, inTrial: false, renewsAt: null };
  }
  async resolveWebhook(payload: unknown) {
    const p = payload as { userId?: string; entitlement?: 'free' | 'tayfa_plus' } | null;
    if (!p || typeof p.userId !== 'string') return null;
    return {
      userId: p.userId,
      entitlement: p.entitlement ?? 'free',
      inTrial: false,
      renewsAt: null,
    };
  }
}

export class MockEmbeddingProvider implements EmbeddingProvider {
  async embed(text: string): Promise<number[]> {
    const rng = mulberry32(fnv1a(text.toLowerCase().trim()));
    const v = Array.from({ length: EMBEDDING.dimensions }, () => rng() * 2 - 1);
    // L2-normalize (cosine space).
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    return v.map((x) => x / norm);
  }
}

export class MockGenerativeProvider implements GenerativeProvider {
  async icebreakers(input: { sharedInterests: readonly string[]; count: number }) {
    const base = input.sharedInterests.slice(0, 3);
    const templates = [
      base[0]
        ? `You both love ${base[0]} — what got you into it?`
        : 'What are you hoping to do this week?',
      base[1]
        ? `Any ${base[1]} recommendations? The group needs ideas.`
        : 'First time joining something like this?',
      base[2] ? `Settle a debate: best ${base[2]} of all time?` : 'Who is bringing the good vibes?',
    ];
    return templates.slice(0, Math.max(1, input.count));
  }
}

export class MockPushProvider implements PushProvider {
  async send(input: { to: readonly string[] }) {
    return { accepted: input.to.length, rejected: 0 };
  }
}

/** No-op lifecycle CRM (Braze) for tests/mock mode; records enqueues for assertions. */
export class MockLifecycleProvider implements LifecycleProvider {
  public readonly enqueued: { userId: string; journey: string }[] = [];
  async enqueue(input: { userId: string; journey: string }) {
    this.enqueued.push({ userId: input.userId, journey: input.journey });
    return { accepted: true };
  }
  async syncAudience(): Promise<void> {
    /* no-op in mock */
  }
}

/** No-op analytics for tests/mock mode (consent-gated in real clients). */
export class MockAnalyticsClient implements AnalyticsClient {
  public readonly captured: { distinctId: string; name: string; props: Record<string, unknown> }[] =
    [];
  capture(distinctId: string, name: string, props: Record<string, unknown>): void {
    this.captured.push({ distinctId, name, props });
  }
  identify(): void {
    /* no-op in mock */
  }
}

export function createMockProviders(): Providers {
  return {
    mode: 'mock',
    verification: new MockVerificationProvider(),
    moderation: new MockModerationProvider(),
    billing: new MockBillingProvider(),
    embeddings: new MockEmbeddingProvider(),
    generative: new MockGenerativeProvider(),
    push: new MockPushProvider(),
    lifecycle: new MockLifecycleProvider(),
  };
}

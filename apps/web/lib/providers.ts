import {
  createMockProviders,
  type BillingProvider,
  type EmbeddingProvider,
  type EntitlementSnapshot,
  type GenerativeProvider,
  type LifecycleProvider,
  type ModerationProvider,
  type ModerationVerdict,
  type Providers,
  type PushProvider,
  type VerificationProvider,
} from '@tayfa/shared/adapters';
import type { VerificationLevel } from '@tayfa/shared/types';
import {
  reconcileEntitlement,
  revenueCatEventToStatus,
  type BillingStatus,
} from '@tayfa/shared/domain';
import { timingSafeEqual } from 'node:crypto';
import { env, providerMode } from './env.js';
import { embedText, generateIcebreakers, moderateTextOpenAI } from './ai.js';

/** Constant-time string compare that never throws on length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * Provider wiring (mission §AUTONOMY: interface → mock → production adapter →
 * documented ENV). `createProviders()` returns the deterministic mocks in `mock`
 * mode, or a production bundle whose adapters call the real SDKs.
 *
 * The production adapters here are intentionally thin and HONEST: where a real
 * SDK integration is out of scope for this surface, the method guards on its env
 * and throws `ProviderNotConfiguredError` rather than pretending to work — EXCEPT
 * the two fail-closed contracts (verification + moderation), which DENY on any
 * error or missing config and never "pass" (RISK_ANALYSIS §fail-safe).
 */

export class ProviderNotConfiguredError extends Error {
  constructor(provider: string, missing: string) {
    super(`${provider} is not configured (missing ${missing})`);
    this.name = 'ProviderNotConfiguredError';
  }
}

// ── Production adapters ───────────────────────────────────────────────────────

/** Persona ID/liveness. Fail-closed: `resolveWebhook` returns null on any doubt. */
class PersonaVerificationProvider implements VerificationProvider {
  async startInquiry(input: { userId: string; type: 'id' | 'liveness' }): Promise<{
    inquiryId: string;
    hostedUrl: string;
  }> {
    const apiKey = env.personaApiKey();
    if (!apiKey) throw new ProviderNotConfiguredError('Persona', 'PERSONA_API_KEY');
    // Real adapter: POST https://api.withpersona.com/api/v1/inquiries with the
    // template id, returning the hosted flow URL. Stubbed pending SDK wiring.
    void input;
    throw new ProviderNotConfiguredError('Persona inquiry', 'Persona SDK integration');
  }

  async resolveWebhook(
    payload: unknown,
    signature: string,
  ): Promise<{ userId: string; level: VerificationLevel; providerRef: string } | null> {
    const secret = env.personaWebhookSecret();
    // Fail-closed: no secret, no signature, or any verification doubt → deny.
    if (!secret || !signature) return null;
    void payload;
    return null;
  }
}

/**
 * Moderation. Text is REAL (OpenAI Moderation API). Fail-closed: any error or
 * missing config → `flagged: true` (hold), never silently pass (RISK §fail-safe).
 * Image NSFW/face checks need Hive/Rekognition (not wired) → fail-closed.
 */
class OpenAiModerationProvider implements ModerationProvider {
  async moderateText(text: string): Promise<ModerationVerdict> {
    try {
      return await moderateTextOpenAI(text);
    } catch {
      return { flagged: true, confidence: 1, categories: ['provider_unavailable'] };
    }
  }

  async moderateImage(imageUrl: string): Promise<ModerationVerdict> {
    void imageUrl;
    // Real adapter pending Hive/Rekognition keys. Until then we DENY (hold).
    return { flagged: true, confidence: 1, categories: ['provider_unavailable'] };
  }
}

/**
 * RevenueCat — the server-side source of truth for entitlements. REAL when keyed.
 *
 * `getEntitlement` reads the live subscriber via the REST API. `resolveWebhook`
 * authenticates the call with the configured Authorization secret (constant-time),
 * then maps the event through the tested `revenueCatEventToStatus` →
 * `reconcileEntitlement` pipeline. Fail-closed: no secret, a mismatched signature,
 * or an unparseable/no-op event all yield `null` — never a silent entitlement grant.
 */
class RevenueCatBillingProvider implements BillingProvider {
  async getEntitlement(userId: string): Promise<EntitlementSnapshot> {
    const apiKey = env.revenueCatApiKey();
    if (!apiKey) throw new ProviderNotConfiguredError('RevenueCat', 'REVENUECAT_API_KEY');
    const res = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
      { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' } },
    );
    if (!res.ok) {
      // Conservative: a billing read failure must not upgrade anyone.
      return { userId, entitlement: 'free', inTrial: false, renewsAt: null };
    }
    const body = (await res.json()) as {
      subscriber?: {
        entitlements?: Record<string, { expires_date?: string | null; period_type?: string }>;
      };
    };
    const ent = body.subscriber?.entitlements?.['tayfa_plus'];
    const renewsAt = ent?.expires_date ?? null;
    const activeNow = Boolean(ent) && (!renewsAt || new Date(renewsAt).getTime() > Date.now());
    return {
      userId,
      entitlement: activeNow ? 'tayfa_plus' : 'free',
      inTrial: ent?.period_type === 'trial' || ent?.period_type === 'intro',
      renewsAt: activeNow ? renewsAt : null,
    };
  }

  async resolveWebhook(payload: unknown, signature: string): Promise<EntitlementSnapshot | null> {
    const secret = env.revenueCatWebhookSecret();
    // Fail-closed: can't authenticate → reject. RevenueCat sends the configured
    // value verbatim in the Authorization header (optionally "Bearer <secret>").
    if (!secret || !signature) return null;
    const presented = signature.replace(/^Bearer\s+/i, '');
    if (!safeEqual(presented, secret)) return null;

    const event = (payload as { event?: Record<string, unknown> })?.event;
    if (!event || typeof event !== 'object') return null;
    const userId = (event['app_user_id'] ?? event['original_app_user_id']) as string | undefined;
    if (!userId) return null;

    const status: BillingStatus | null = revenueCatEventToStatus(
      String(event['type'] ?? ''),
      typeof event['period_type'] === 'string' ? (event['period_type'] as string) : undefined,
    );
    if (status === null) return null; // no-op event (e.g. TRANSFER) → no state change

    const reconciled = reconcileEntitlement(status);
    const expiryMs = event['expiration_at_ms'];
    return {
      userId,
      entitlement: reconciled.entitlement,
      inTrial: reconciled.inTrial,
      renewsAt:
        reconciled.entitlement === 'tayfa_plus' && typeof expiryMs === 'number'
          ? new Date(expiryMs).toISOString()
          : null,
    };
  }
}

/** REAL embeddings — OpenAI text-embedding-3-small (1536-d, cosine). */
class OpenAiEmbeddingProvider implements EmbeddingProvider {
  async embed(text: string): Promise<number[]> {
    return embedText(text);
  }
}

/** REAL generation — AI Gateway (Claude Haiku) or OpenAI; fails OPEN to templates. */
class GatewayGenerativeProvider implements GenerativeProvider {
  async icebreakers(input: {
    sharedInterests: readonly string[];
    count: number;
  }): Promise<string[]> {
    const { icebreakers } = await generateIcebreakers(input.sharedInterests, input.count);
    return icebreakers;
  }
}

class ExpoPushProvider implements PushProvider {
  async send(input: {
    to: readonly string[];
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<{ accepted: number; rejected: number }> {
    void input;
    throw new ProviderNotConfiguredError('Expo Push', 'EXPO_ACCESS_TOKEN + SDK integration');
  }
}

/**
 * Braze lifecycle CRM (P6). Real REST calls when keyed — caps are enforced by the
 * domain (`decideLifecycleSend`) BEFORE we ever enqueue, so this adapter never
 * jumps a frequency cap. Lifecycle is non-critical: on outage we no-op (a missed
 * win-back is not a safety risk), never throw into the request path.
 */
class BrazeLifecycleProvider implements LifecycleProvider {
  private async track(body: unknown): Promise<boolean> {
    const apiKey = env.brazeApiKey();
    if (!apiKey) return false;
    try {
      const res = await fetch(`${env.brazeRestEndpoint()}/users/track`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async enqueue(input: { userId: string; journey: string; payload?: Record<string, unknown> }) {
    const accepted = await this.track({
      events: [
        {
          external_id: input.userId,
          name: `journey.${input.journey}`,
          time: new Date().toISOString(),
          properties: input.payload ?? {},
        },
      ],
    });
    return { accepted };
  }

  async syncAudience(userId: string, attributes: Record<string, unknown>): Promise<void> {
    await this.track({ attributes: [{ external_id: userId, ...attributes }] });
  }
}

/**
 * Per-provider hybrid wiring (mission §"replace mocks" + §AUTONOMY): each provider
 * is its REAL adapter when its env key is present, and the deterministic mock
 * otherwise. So production paths activate the moment a key appears, while keyless
 * dev + CI stay fully mocked. `TAYFA_PROVIDER_MODE=mock` (the .env / CI default)
 * is a HARD override that forces every provider to mock for determinism.
 */
function buildProviders(): Providers {
  const mock = createMockProviders();
  if (process.env.TAYFA_PROVIDER_MODE === 'mock') return mock;

  const hasOpenAi = Boolean(env.openaiApiKey());
  const hasGen = hasOpenAi || Boolean(env.aiGatewayApiKey());
  const hasPersona = Boolean(env.personaApiKey());
  const hasRevenueCat = Boolean(env.revenueCatApiKey());
  const hasExpo = Boolean(env.expoAccessToken());
  const hasBraze = Boolean(env.brazeApiKey());
  const anyReal = hasOpenAi || hasGen || hasPersona || hasRevenueCat || hasExpo || hasBraze;

  return {
    mode: providerMode() === 'production' || anyReal ? 'production' : 'mock',
    verification: hasPersona ? new PersonaVerificationProvider() : mock.verification,
    moderation: hasOpenAi ? new OpenAiModerationProvider() : mock.moderation,
    billing: hasRevenueCat ? new RevenueCatBillingProvider() : mock.billing,
    embeddings: hasOpenAi ? new OpenAiEmbeddingProvider() : mock.embeddings,
    generative: hasGen ? new GatewayGenerativeProvider() : mock.generative,
    push: hasExpo ? new ExpoPushProvider() : mock.push,
    lifecycle: hasBraze ? new BrazeLifecycleProvider() : mock.lifecycle,
  };
}

let cached: Providers | null = null;

/** Get the active provider bundle. Memoised for the function's warm lifetime. */
export function createProviders(): Providers {
  if (cached) return cached;
  cached = buildProviders();
  return cached;
}

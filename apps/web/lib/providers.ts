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
import { env, providerMode } from './env.js';
import { embedText, generateIcebreakers, moderateTextOpenAI } from './ai.js';

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

/** RevenueCat — the server-side source of truth for entitlements. */
class RevenueCatBillingProvider implements BillingProvider {
  async getEntitlement(userId: string): Promise<EntitlementSnapshot> {
    const apiKey = env.revenueCatApiKey();
    if (!apiKey) throw new ProviderNotConfiguredError('RevenueCat', 'REVENUECAT_API_KEY');
    void userId;
    throw new ProviderNotConfiguredError('RevenueCat getEntitlement', 'RevenueCat SDK integration');
  }

  async resolveWebhook(payload: unknown, signature: string): Promise<EntitlementSnapshot | null> {
    const secret = env.revenueCatWebhookSecret();
    if (!secret || !signature) return null; // invalid signature → reject
    void payload;
    return null;
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

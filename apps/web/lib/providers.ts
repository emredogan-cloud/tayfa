import {
  createMockProviders,
  type BillingProvider,
  type EmbeddingProvider,
  type EntitlementSnapshot,
  type GenerativeProvider,
  type ModerationProvider,
  type ModerationVerdict,
  type Providers,
  type PushProvider,
  type VerificationProvider,
} from '@tayfa/shared/adapters';
import type { VerificationLevel } from '@tayfa/shared/types';
import { env, providerMode } from './env.js';

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

/** Moderation. Fail-closed: any error/missing config → `flagged: true` (hold). */
class HiveModerationProvider implements ModerationProvider {
  async moderateText(text: string): Promise<ModerationVerdict> {
    void text;
    // Real adapter: OpenAI Moderation API for text. On outage we DENY (hold).
    return { flagged: true, confidence: 1, categories: ['provider_unavailable'] };
  }

  async moderateImage(imageUrl: string): Promise<ModerationVerdict> {
    void imageUrl;
    // Real adapter: Hive / Rekognition NSFW + face checks. On outage we DENY.
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

class OpenAiEmbeddingProvider implements EmbeddingProvider {
  async embed(text: string): Promise<number[]> {
    void text;
    throw new ProviderNotConfiguredError('OpenAI embeddings', 'OPENAI_API_KEY + SDK integration');
  }
}

class GatewayGenerativeProvider implements GenerativeProvider {
  async icebreakers(input: {
    sharedInterests: readonly string[];
    count: number;
  }): Promise<string[]> {
    void input;
    throw new ProviderNotConfiguredError('AI Gateway', 'AI_GATEWAY_API_KEY + SDK integration');
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

function createProductionProviders(): Providers {
  return {
    mode: 'production',
    verification: new PersonaVerificationProvider(),
    moderation: new HiveModerationProvider(),
    billing: new RevenueCatBillingProvider(),
    embeddings: new OpenAiEmbeddingProvider(),
    generative: new GatewayGenerativeProvider(),
    push: new ExpoPushProvider(),
  };
}

let cached: Providers | null = null;

/** Get the active provider bundle. Memoised for the function's warm lifetime. */
export function createProviders(): Providers {
  if (cached) return cached;
  cached = providerMode() === 'mock' ? createMockProviders() : createProductionProviders();
  return cached;
}

import type { VerificationLevel } from '../types/enums.js';

/**
 * Provider interfaces (mission §AUTONOMY: interface → mock → production adapter →
 * documented ENV). Every external dependency is abstracted behind one of these
 * so the app runs fully in `mock` mode with no credentials, and a production
 * adapter (with the real SDK, living in an app package) drops in unchanged.
 *
 * Fail-closed contract: verification + moderation adapters MUST deny on provider
 * error, never pass (RISK_ANALYSIS §fail-safe). The mocks honour this contract.
 */

export type ProviderMode = 'mock' | 'production';

// ── Identity verification (Persona) ──────────────────────────────────────────
export interface VerificationProvider {
  /** Start an ID/liveness inquiry; returns a hosted URL/ref for the client. */
  startInquiry(input: { userId: string; type: 'id' | 'liveness' }): Promise<{
    inquiryId: string;
    hostedUrl: string;
  }>;
  /** Verify + parse a webhook; returns the resulting level or `null` (deny). */
  resolveWebhook(
    payload: unknown,
    signature: string,
  ): Promise<{
    userId: string;
    level: VerificationLevel;
    providerRef: string;
  } | null>;
}

// ── Moderation (Hive/Rekognition image, OpenAI text) ──────────────────────────
export interface ModerationVerdict {
  readonly flagged: boolean;
  readonly confidence: number; // 0..1
  readonly categories: readonly string[];
}
export interface ModerationProvider {
  moderateText(text: string): Promise<ModerationVerdict>;
  moderateImage(imageUrl: string): Promise<ModerationVerdict>;
}

// ── Billing (RevenueCat) ──────────────────────────────────────────────────────
export interface EntitlementSnapshot {
  readonly userId: string;
  readonly entitlement: 'free' | 'tayfa_plus';
  readonly inTrial: boolean;
  readonly renewsAt: string | null;
}
export interface BillingProvider {
  getEntitlement(userId: string): Promise<EntitlementSnapshot>;
  /** Verify + parse a billing webhook idempotently; `null` = invalid signature. */
  resolveWebhook(payload: unknown, signature: string): Promise<EntitlementSnapshot | null>;
}

// ── Embeddings (OpenAI text-embedding-3-small) ────────────────────────────────
export interface EmbeddingProvider {
  /** Returns a 1536-d vector (cosine space). Called async, never in request path. */
  embed(text: string): Promise<number[]>;
}

// ── Generative (Vercel AI Gateway → Claude Haiku) ─────────────────────────────
export interface GenerativeProvider {
  /** Icebreakers grounded ONLY in shared public interests; injection-safe. */
  icebreakers(input: { sharedInterests: readonly string[]; count: number }): Promise<string[]>;
}

// ── Push (Expo) ──────────────────────────────────────────────────────────────
export interface PushProvider {
  send(input: {
    to: readonly string[];
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<{ accepted: number; rejected: number }>;
}

// ── Analytics (PostHog) ───────────────────────────────────────────────────────
export interface AnalyticsClient {
  capture(distinctId: string, name: string, props: Record<string, unknown>): void;
  identify(distinctId: string, props: Record<string, unknown>): void;
}

export interface Providers {
  readonly mode: ProviderMode;
  readonly verification: VerificationProvider;
  readonly moderation: ModerationProvider;
  readonly billing: BillingProvider;
  readonly embeddings: EmbeddingProvider;
  readonly generative: GenerativeProvider;
  readonly push: PushProvider;
}

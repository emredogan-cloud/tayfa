import type { ProviderMode } from '@tayfa/shared/adapters';

/**
 * Typed, lazily-read environment access. Every external dependency is optional so
 * the app boots in `mock` mode with zero credentials (mission §AUTONOMY). Reads
 * are functions (not a frozen snapshot) so Next's per-request env edits and test
 * overrides are honoured.
 *
 * .env.example (repo root) documents every key. Anything NOT prefixed
 * NEXT_PUBLIC_* is server-only and must never reach the client bundle.
 */

const read = (key: string): string | undefined => {
  const v = process.env[key];
  return v && v.length > 0 ? v : undefined;
};

/** The single switch that forces every provider into deterministic mock mode. */
export function providerMode(): ProviderMode {
  return read('TAYFA_PROVIDER_MODE') === 'production' ? 'production' : 'mock';
}

export const isMockMode = (): boolean => providerMode() === 'mock';

export const env = {
  nodeEnv: () => read('NODE_ENV') ?? 'development',

  // Supabase
  supabaseUrl: () => read('NEXT_PUBLIC_SUPABASE_URL') ?? read('SUPABASE_URL'),
  supabaseAnonKey: () => read('NEXT_PUBLIC_SUPABASE_ANON_KEY') ?? read('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: () => read('SUPABASE_SERVICE_ROLE_KEY'),
  databaseUrl: () => read('DATABASE_URL'),

  // Upstash Redis (rate-limits + idempotency)
  redisUrl: () => read('UPSTASH_REDIS_REST_URL'),
  redisToken: () => read('UPSTASH_REDIS_REST_TOKEN'),

  // AI: OpenAI (embeddings, text moderation) + Vercel AI Gateway (Claude Haiku
  // generation). Generation prefers the gateway when keyed, else OpenAI, else a
  // template fallback. Embeddings + text moderation use OpenAI directly.
  openaiApiKey: () => read('OPENAI_API_KEY'),
  aiGatewayApiKey: () => read('AI_GATEWAY_API_KEY'),
  aiGatewayBaseUrl: () => read('AI_GATEWAY_BASE_URL') ?? 'https://ai-gateway.vercel.sh/v1',

  // PostHog (analytics, EU cloud)
  posthogKey: () => read('POSTHOG_KEY') ?? read('NEXT_PUBLIC_POSTHOG_KEY'),
  posthogHost: () => read('NEXT_PUBLIC_POSTHOG_HOST') ?? 'https://eu.i.posthog.com',

  // Provider webhook secrets (signature verification — fail-closed)
  revenueCatWebhookSecret: () => read('REVENUECAT_WEBHOOK_SECRET'),
  revenueCatApiKey: () => read('REVENUECAT_API_KEY'),
  personaWebhookSecret: () => read('PERSONA_WEBHOOK_SECRET'),
  personaApiKey: () => read('PERSONA_API_KEY'),

  // Expo push (transactional notifications)
  expoAccessToken: () => read('EXPO_ACCESS_TOKEN'),

  // T&S console access — comma-separated allowlist of moderator user ids.
  moderatorUserIds: (): readonly string[] =>
    (read('TAYFA_MODERATOR_USER_IDS') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),

  // Public base URL (OG tags, share links).
  appUrl: () => read('NEXT_PUBLIC_APP_URL') ?? 'https://tayfa.app',
} as const;

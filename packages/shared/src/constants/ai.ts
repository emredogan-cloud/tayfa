/**
 * AI model routing (TECH_DECISIONS ADR-011). Generative defaults to Claude
 * Haiku via the Vercel AI Gateway; Sonnet is a quality-escalation lever, not the
 * default. Every generative call is cached, batched, or deferred — never in a
 * hot request path.
 */

export const AI_MODELS = {
  /** Default for icebreakers + onboarding extraction (~$1/$5 per 1M in/out). */
  generativeDefault: 'anthropic/claude-haiku-4.5',
  /** Escalation only when quality demands it. */
  generativeEscalation: 'anthropic/claude-sonnet-4.6',
  embedding: 'text-embedding-3-small',
  /** Text moderation (cheap/free). */
  moderationText: 'omni-moderation-latest',
  /** Asset generation (mission §IMAGE GENERATION). */
  image: 'gpt-image-1',
} as const;

/** Per-active-user/month AI cost ceilings (TECH_DECISIONS / cost analysis §8). */
export const AI_COST_TARGETS_EUR = {
  generativePerUser: 0.02,
  embeddingsPerUser: 0.01,
  matchingPerUser: 0.0,
} as const;

/** Generative output is a cosmetic feature: fail OPEN to a template, never block. */
export const ICEBREAKER = {
  count: 3,
  maxTokens: 120,
  cacheTtlSeconds: 60 * 60 * 24 * 7,
} as const;

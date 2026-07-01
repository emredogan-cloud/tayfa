import type { FeedQuery } from '@tayfa/shared/schemas';

/** Centralized React Query keys so invalidation stays consistent across hooks. */
export const qk = {
  feed: (query: FeedQuery) => ['feed', query] as const,
  catalog: () => ['interest-catalog'] as const,
  event: (id: string) => ['event', id] as const,
  chat: (eventId: string) => ['chat', eventId] as const,
  myProfile: () => ['profile', 'me'] as const,
  publicProfile: (userId: string) => ['profile', userId] as const,
  notifications: () => ['notifications'] as const,
} as const;

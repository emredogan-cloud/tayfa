import { QueryClient } from '@tanstack/react-query';

/**
 * Shared React Query client. Defaults tuned for a mobile social feed: data goes
 * stale fast enough to feel live, but we keep cache around so tab switches are
 * instant. Mutations surface errors to the caller (no silent failures on safety
 * actions like report/block).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

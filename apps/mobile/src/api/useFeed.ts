import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { FeedQuery } from '@tayfa/shared/schemas';
import { api } from '@/lib/api';
import { qk } from './keys';
import type { CatalogInterest, FeedResponse } from './types';

/**
 * Ranked discovery feed (P2). The query carries the viewer's center + radius and
 * any FREE filters (women-only / verified-only). Premium filters
 * (`advancedInterestFilters`) are sent too, but the BFF rejects them for free
 * tier — the client never decides entitlement.
 */
export function useFeed(query: FeedQuery, enabled = true): UseQueryResult<FeedResponse, Error> {
  return useQuery({
    queryKey: qk.feed(query),
    enabled,
    queryFn: ({ signal }) => api.post<FeedResponse>('/feed', query, signal),
  });
}

/** Interest catalog for the onboarding taste-card picker. */
export function useInterestCatalog(): UseQueryResult<readonly CatalogInterest[], Error> {
  return useQuery({
    queryKey: qk.catalog(),
    staleTime: 60 * 60_000,
    queryFn: ({ signal }) =>
      api.get<readonly CatalogInterest[]>('/interests/catalog', undefined, signal),
  });
}

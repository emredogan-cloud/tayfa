import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from './keys';
import type { HostStandingResponse, MarketplaceResponse } from './types';

/** The signed-in host's standing (eligibility inputs + earnings) for the Host Panel. */
export function useHostStanding(): UseQueryResult<HostStandingResponse, Error> {
  return useQuery({
    queryKey: qk.hostStanding(),
    queryFn: ({ signal }) => api.get<HostStandingResponse>('/me/host/standing', undefined, signal),
  });
}

/** Ticketed / featured / venue-sponsored listings for the Marketplace. */
export function useMarketplace(): UseQueryResult<MarketplaceResponse, Error> {
  return useQuery({
    queryKey: qk.marketplace(),
    queryFn: ({ signal }) => api.get<MarketplaceResponse>('/marketplace', undefined, signal),
  });
}

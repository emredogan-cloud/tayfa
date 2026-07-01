import { create } from 'zustand';
import type { TravelCity } from '@/lib/cities';

/**
 * Travel Mode state (P9). Ephemeral by design — when set, the discover feed is
 * scoped to another city's centroid ("plan before you move"). Resets on cold
 * start; the home city is always the fallback. Travel Mode itself is a Tayfa+
 * feature, gated via the shared `resolveActiveCity` domain rule at selection time.
 */
interface TravelState {
  city: TravelCity | null;
  setCity: (city: TravelCity | null) => void;
}

export const useTravel = create<TravelState>((set) => ({
  city: null,
  setCity: (city) => set({ city }),
}));

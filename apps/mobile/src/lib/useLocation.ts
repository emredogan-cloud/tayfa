import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { BEACHHEAD } from '@tayfa/shared/constants';
import type { GeoPoint } from '@tayfa/shared/types';

export type LocationStatus = 'pending' | 'granted' | 'denied';

export interface NearbyCenter {
  /** The discovery center — real GPS when granted, beachhead fallback otherwise. */
  center: GeoPoint;
  status: LocationStatus;
  /** True when we're using the city-center fallback (location off / denied). */
  usingFallback: boolean;
}

/**
 * Resolve a discovery center. We ask for foreground location; if granted we use
 * the device fix, otherwise we fall back to the beachhead city center so the
 * feed is never empty just because permission was declined. The precise fix
 * stays on-device — only the center point is sent to the BFF for the radius
 * query, and every event comes back already fuzzed.
 */
export function useNearbyCenter(): NearbyCenter {
  const [center, setCenter] = useState<GeoPoint>(BEACHHEAD.seedCenter);
  const [status, setStatus] = useState<LocationStatus>('pending');
  const [usingFallback, setUsingFallback] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function resolve(): Promise<void> {
      try {
        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (!mounted) return;
        if (perm !== 'granted') {
          setStatus('denied');
          setUsingFallback(true);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!mounted) return;
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('granted');
        setUsingFallback(false);
      } catch {
        if (!mounted) return;
        setStatus('denied');
        setUsingFallback(true);
      }
    }
    void resolve();
    return () => {
      mounted = false;
    };
  }, []);

  return { center, status, usingFallback };
}

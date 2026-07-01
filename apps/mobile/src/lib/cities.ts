import type { GeoPoint } from '@tayfa/shared/types';

/**
 * Launch + roadmap cities for Travel Mode. The real launched-city list is
 * server-owned (city-launch go/no-go gates live in `@tayfa/shared`); this is the
 * client-side presentation catalog — name, flag and centroid — used to scope the
 * discover feed when a Tayfa+ member browses another city before they travel.
 */
export interface TravelCity {
  readonly id: string;
  readonly name: string;
  readonly country: string;
  readonly flag: string;
  readonly center: GeoPoint;
  /** True for the beachhead / user's home city (never gated). */
  readonly home?: boolean;
}

export const HOME_CITY_ID = 'ist';

export const CITIES: readonly TravelCity[] = [
  {
    id: 'ist',
    name: 'Istanbul',
    country: 'Türkiye',
    flag: '🇹🇷',
    center: { lat: 40.9907, lng: 29.0277 },
    home: true,
  },
  {
    id: 'izm',
    name: 'İzmir',
    country: 'Türkiye',
    flag: '🇹🇷',
    center: { lat: 38.4237, lng: 27.1428 },
  },
  {
    id: 'ank',
    name: 'Ankara',
    country: 'Türkiye',
    flag: '🇹🇷',
    center: { lat: 39.9334, lng: 32.8597 },
  },
  {
    id: 'ber',
    name: 'Berlin',
    country: 'Germany',
    flag: '🇩🇪',
    center: { lat: 52.52, lng: 13.405 },
  },
  {
    id: 'lon',
    name: 'London',
    country: 'United Kingdom',
    flag: '🇬🇧',
    center: { lat: 51.5074, lng: -0.1278 },
  },
  {
    id: 'ams',
    name: 'Amsterdam',
    country: 'Netherlands',
    flag: '🇳🇱',
    center: { lat: 52.3676, lng: 4.9041 },
  },
  {
    id: 'bcn',
    name: 'Barcelona',
    country: 'Spain',
    flag: '🇪🇸',
    center: { lat: 41.3874, lng: 2.1686 },
  },
  {
    id: 'lis',
    name: 'Lisbon',
    country: 'Portugal',
    flag: '🇵🇹',
    center: { lat: 38.7223, lng: -9.1393 },
  },
];

export const HOME_CITY: TravelCity = CITIES.find((c) => c.id === HOME_CITY_ID) ?? CITIES[0]!;

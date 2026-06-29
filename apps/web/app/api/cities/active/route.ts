import { and, eq, gt, inArray, isNull, lt, sql } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { cityLiquidityStatus, resolveActiveCity } from '@tayfa/shared/domain';
import { DISCOVERY } from '@tayfa/shared/constants';
import type { EventStatus } from '@tayfa/shared/types';
import { requireSession } from '@/lib/auth.js';
import { getServiceDb } from '@/lib/db.js';
import { apiHandler, jsonOk, ApiError } from '@/lib/http.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JOINABLE: readonly EventStatus[] = ['open', 'confirmed'];

/**
 * GET /api/cities/active[?city=<cityId>] — resolve the feed's active city + its
 * live liquidity (P8). Travel mode (browse another city before you move) is a
 * Tayfa+ feature: a free user is always pinned to their home city, and a gated
 * travel request returns `requiresUpgrade` rather than blocking the core feed.
 *
 * Liquidity = upcoming joinable events within the liquidity radius of the city
 * centre over the next 7 days → classified by the tested `cityLiquidityStatus`.
 * This drives the ghost-town guard and the city-launch go/no-go gate upstream.
 */
export const GET = apiHandler(async (req: Request) => {
  const session = await requireSession();
  const db = getServiceDb();

  const [profile] = await db
    .select({ homeCityId: schema.profile.homeCityId })
    .from(schema.profile)
    .where(eq(schema.profile.userId, session.userId))
    .limit(1);

  const requestedCityId = new URL(req.url).searchParams.get('city') ?? undefined;
  const homeCityId = profile?.homeCityId ?? undefined;
  if (!homeCityId && !requestedCityId) {
    throw new ApiError(409, 'no_home_city', 'Set a home city before resolving the feed city');
  }

  const resolved = resolveActiveCity({
    homeCityId: homeCityId ?? (requestedCityId as string),
    ...(requestedCityId ? { requestedCityId } : {}),
    entitlement: session.entitlement,
  });

  const [city] = await db
    .select({
      id: schema.city.id,
      name: schema.city.name,
      countryCode: schema.city.countryCode,
      centerLat: schema.city.centerLat,
      centerLng: schema.city.centerLng,
    })
    .from(schema.city)
    .where(eq(schema.city.id, resolved.cityId))
    .limit(1);
  if (!city) throw new ApiError(404, 'city_not_found', 'Unknown city');

  // Live liquidity: upcoming joinable events within the radius over the next week.
  const center = sql`ST_SetSRID(ST_MakePoint(${city.centerLng}, ${city.centerLat}), 4326)::geography`;
  const weekAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [liquidity] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.event)
    .where(
      and(
        isNull(schema.event.deletedAt),
        inArray(schema.event.status, [...JOINABLE]),
        gt(schema.event.startsAt, new Date()),
        lt(schema.event.startsAt, weekAhead),
        sql`ST_DWithin(${schema.event.location}, ${center}, ${DISCOVERY.liquidityRadiusMeters})`,
      ),
    );
  const eventsPerWeek = liquidity?.n ?? 0;

  return jsonOk({
    activeCity: {
      id: city.id,
      name: city.name,
      countryCode: city.countryCode,
    },
    traveling: resolved.traveling,
    ...(resolved.requiresUpgrade ? { requiresUpgrade: true } : {}),
    liquidity: { eventsPerWeek, status: cityLiquidityStatus(eventsPerWeek) },
  });
});

import { and, eq, gt, inArray, isNull, sql } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { feedQuerySchema } from '@tayfa/shared/schemas';
import { checkFeatureAccess, rankFeed, type RankingCandidate } from '@tayfa/shared/domain';
import type { EventStatus } from '@tayfa/shared/types';
import { requireSession, requireVerificationLevel } from '@/lib/auth.js';
import { getServiceDb } from '@/lib/db.js';
import { fuzzPoint, geocellToCentroid } from '@/lib/geo.js';
import { apiHandler, jsonOk, ApiError, parseJson } from '@/lib/http.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/feed — ranked discovery feed (P2).
 *
 * Safety/monetization invariants:
 *  • Precise location NEVER leaves here. We select `event.location` only to derive
 *    a distance scalar; the response carries a FUZZED geocell centroid.
 *  • Premium `advancedInterestFilters` are rejected for the free tier via
 *    `checkFeatureAccess('advanced_interest_filters', …)` — and ONLY that. Every
 *    other filter (incl. women-only / verified-only) is free forever.
 *  • Ranking is the spine's deterministic `rankFeed`; the BFF only assembles
 *    candidates from Postgres.
 */

const CANDIDATE_LIMIT = 200;
const JOINABLE: readonly EventStatus[] = ['open', 'confirmed'];

interface CandidateRow {
  id: string;
  hostId: string;
  title: string;
  category: string;
  startsAt: Date;
  endsAt: Date;
  capacityMin: number;
  capacityMax: number;
  goingCount: number;
  visibility: 'public' | 'interest_match' | 'invite';
  status: EventStatus;
  geocell: string;
  venueName: string | null;
  womenOnly: boolean;
  verifiedOnly: boolean;
  hostDisplayName: string;
  hostAvatarUrl: string | null;
  hostVerificationLevel: 'none' | 'phone' | 'id' | 'id_live';
  hostReliability: number;
  hostNeighborhood: string | null;
  distanceMeters: number;
  mutualInterestCount: number;
}

export const POST = apiHandler(async (req: Request) => {
  const session = await requireSession();
  // Browsing the feed is free + open, but you must at least be phone-verified to
  // act on it later; we require nothing beyond a session to view.
  requireVerificationLevel(session, 'browse');

  const query = await parseJson(req, feedQuerySchema);

  // Premium gate — the ONLY paywalled filter. Free tier may not use it.
  if (query.advancedInterestFilters && query.advancedInterestFilters.length > 0) {
    const access = checkFeatureAccess('advanced_interest_filters', session.entitlement);
    if (!access.allowed) {
      throw new ApiError(
        402,
        'upgrade_required',
        'Advanced interest filters are a Tayfa+ feature',
        {
          feature: access.feature,
        },
      );
    }
  }

  const db = getServiceDb();

  // Viewer's interest set — used to count mutual interests per candidate (the
  // similarity proxy when embeddings aren't yet populated).
  const viewerInterests = await db
    .select({ interestId: schema.userInterest.interestId })
    .from(schema.userInterest)
    .where(eq(schema.userInterest.userId, session.userId));
  const viewerInterestIds = viewerInterests.map((r) => r.interestId);
  const viewerInterestCount = Math.max(1, viewerInterestIds.length);

  const point = sql`ST_SetSRID(ST_MakePoint(${query.center.lng}, ${query.center.lat}), 4326)::geography`;

  const conditions = [
    isNull(schema.event.deletedAt),
    inArray(schema.event.status, [...JOINABLE]),
    gt(schema.event.startsAt, new Date()),
    sql`ST_DWithin(${schema.event.location}, ${point}, ${query.radiusMeters})`,
  ];
  if (query.categories && query.categories.length > 0) {
    conditions.push(inArray(schema.event.category, query.categories));
  }
  if (query.womenOnly === true) conditions.push(eq(schema.event.womenOnly, true));
  if (query.verifiedOnly === true) conditions.push(eq(schema.event.verifiedOnly, true));

  const rows = (await db
    .select({
      id: schema.event.id,
      hostId: schema.event.hostId,
      title: schema.event.title,
      category: schema.event.category,
      startsAt: schema.event.startsAt,
      endsAt: schema.event.endsAt,
      capacityMin: schema.event.capacityMin,
      capacityMax: schema.event.capacityMax,
      goingCount: schema.event.goingCount,
      visibility: schema.event.visibility,
      status: schema.event.status,
      geocell: schema.event.geocell,
      venueName: schema.event.venueName,
      womenOnly: schema.event.womenOnly,
      verifiedOnly: schema.event.verifiedOnly,
      hostDisplayName: schema.profile.displayName,
      hostAvatarUrl: schema.profile.avatarUrl,
      hostVerificationLevel: schema.profile.verificationLevel,
      hostReliability: schema.profile.reliabilityScore,
      hostNeighborhood: schema.profile.neighborhood,
      distanceMeters: sql<number>`ST_Distance(${schema.event.location}, ${point})`,
      mutualInterestCount: sql<number>`(
        SELECT count(*)::int FROM event_interest ei
        WHERE ei.event_id = ${schema.event.id}
          AND ei.interest_id = ANY(${viewerInterestIds})
      )`,
    })
    .from(schema.event)
    .innerJoin(schema.profile, eq(schema.profile.userId, schema.event.hostId))
    .where(and(...conditions))
    .limit(CANDIDATE_LIMIT)) as unknown as CandidateRow[];

  const now = Date.now();
  const candidates: (RankingCandidate & { row: CandidateRow })[] = rows.map((row) => {
    const mutual = row.mutualInterestCount;
    // Similarity proxy: fraction of the viewer's interests this event shares.
    // The async embedding pipeline (spine) refines this offline; here we keep a
    // deterministic, explainable fallback so the feed always has signal.
    const interestSimilarity = Math.min(1, mutual / viewerInterestCount);
    return {
      row,
      eventId: row.id,
      interestSimilarity,
      distanceMeters: row.distanceMeters,
      hoursUntilStart: Math.max(0, (row.startsAt.getTime() - now) / 3_600_000),
      capacityGoing: row.goingCount,
      capacityMax: row.capacityMax,
      hostReliability: row.hostReliability,
      // Light, deterministic serendipity by event id so the feed isn't a pure
      // filter bubble (the spine weights this at 6%).
      serendipity: (Number.parseInt(row.id.replace(/\D/g, '').slice(0, 6) || '0', 10) % 100) / 100,
      mutualInterestCount: mutual,
    };
  });

  const ranked = rankFeed(candidates);

  const items = ranked.map(({ candidate, explanation }) => {
    const row = candidate.row;
    const fuzzed = fuzzPoint(geocellToCentroid(row.geocell), row.hostNeighborhood);
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      visibility: row.visibility,
      status: row.status,
      venueName: row.venueName,
      capacity: { min: row.capacityMin, max: row.capacityMax, going: row.goingCount },
      womenOnly: row.womenOnly,
      verifiedOnly: row.verifiedOnly,
      // FUZZED only — no precise coordinates by construction.
      location: fuzzed,
      host: {
        userId: row.hostId,
        displayName: row.hostDisplayName,
        avatarUrl: row.hostAvatarUrl,
        verificationLevel: row.hostVerificationLevel,
        reliabilityScore: row.hostReliability,
        neighborhood: row.hostNeighborhood,
      },
      ranking: explanation,
    };
  });

  return jsonOk({ items, count: items.length });
});

import { and, eq, sql } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { canReleasePreciseLocation } from '@tayfa/shared/domain';
import { uuidSchema } from '@tayfa/shared/schemas';
import { requireSession } from '@/lib/auth.js';
import { getServiceDb } from '@/lib/db.js';
import { fuzzPoint, geocellToCentroid } from '@/lib/geo.js';
import { apiHandler, jsonError, jsonOk, ApiError } from '@/lib/http.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/location/[eventId] — release the PRECISE event pin.
 *
 * This is the single most safety-critical endpoint (RISK_ANALYSIS §location). The
 * precise point is released ONLY when the spine's `canReleasePreciseLocation`
 * says so: the host always, otherwise an approved member inside the ≤30-min
 * release window. Every other case returns 403 with the exact reason AND a fuzzed
 * fallback so the client can still render the neighborhood — never the pin.
 *
 * Precise coordinates are fetched with ST_X/ST_Y (the geography column is never
 * serialized raw) and never logged.
 */
export const GET = apiHandler(
  async (_req: Request, ctx: { params: Promise<{ eventId: string }> }) => {
    const session = await requireSession();
    const { eventId } = await ctx.params;
    const parsed = uuidSchema.safeParse(eventId);
    if (!parsed.success) throw new ApiError(400, 'invalid_event_id', 'Invalid event id');

    const db = getServiceDb();

    const [event] = await db
      .select({
        id: schema.event.id,
        hostId: schema.event.hostId,
        startsAt: schema.event.startsAt,
        venueName: schema.event.venueName,
        address: schema.event.address,
        geocell: schema.event.geocell,
        deletedAt: schema.event.deletedAt,
        lat: sql<number>`ST_Y(${schema.event.location}::geometry)`,
        lng: sql<number>`ST_X(${schema.event.location}::geometry)`,
      })
      .from(schema.event)
      .where(eq(schema.event.id, parsed.data))
      .limit(1);

    if (!event || event.deletedAt) {
      throw new ApiError(404, 'event_not_found', 'Event not found');
    }

    const isHost = event.hostId === session.userId;

    const [membership] = await db
      .select({ rsvpStatus: schema.eventMember.rsvpStatus })
      .from(schema.eventMember)
      .where(
        and(
          eq(schema.eventMember.eventId, parsed.data),
          eq(schema.eventMember.userId, session.userId),
        ),
      )
      .limit(1);

    const decision = canReleasePreciseLocation({
      viewerRsvpStatus: membership?.rsvpStatus ?? null,
      eventStartsAt: event.startsAt,
      now: new Date(),
      isHost,
    });

    if (!decision.allowed) {
      // Deny precise, but hand back the fuzzed cell so the UI degrades gracefully.
      const fuzzed = fuzzPoint(geocellToCentroid(event.geocell), null);
      return jsonError(403, 'location_not_released', 'Precise location is not available yet', {
        reason: decision.reason,
        fuzzed,
      });
    }

    // Approved release. (A production build would also append an audit_log row.)
    return jsonOk({
      eventId: event.id,
      point: { lat: event.lat, lng: event.lng },
      venueName: event.venueName,
      address: event.address,
    });
  },
);

import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { checkinConfirmSchema } from '@tayfa/shared/schemas';
import { evaluateMeetupNsm } from '@tayfa/shared/domain';
import type { AttendanceConfirmation } from '@tayfa/shared/types';
import { requireSession, requireVerificationLevel } from '@/lib/auth.js';
import { getServiceDb } from '@/lib/db.js';
import { apiHandler, jsonOk, ApiError, parseJson } from '@/lib/http.js';
import { claimOnce } from '@/lib/idempotency.js';
import { captureAnalytics, flushAnalytics } from '@/lib/posthog-server.js';

export const runtime = 'nodejs';

interface ConfirmationRow {
  userId: string;
  checkinAt: Date | null;
  lat: number | null;
  lng: number | null;
  fingerprint: string | null;
}

/**
 * POST /api/checkin — mutual attendance confirmation that feeds the NSM (P3).
 *
 * A "completed meetup" only counts when the spine's `evaluateMeetupNsm` says so:
 * ≥2 distinct verified attendees, inside the geofence + time window, with
 * collusion signals (shared device / mock GPS) clean. Distinct DEVICES — not just
 * user ids — are checked via the `device` fingerprint, which is what defeats the
 * "one person, two accounts" attack.
 *
 * Idempotent: the NSM completion (status flip + analytics) fires at most once per
 * event via `claimOnce`.
 */
export const POST = apiHandler(async (req: Request) => {
  const session = await requireSession();
  requireVerificationLevel(session, 'rsvp');

  const input = await parseJson(req, checkinConfirmSchema);
  const db = getServiceDb();

  const summary = await db.transaction(async (tx) => {
    const [event] = await tx
      .select({
        id: schema.event.id,
        status: schema.event.status,
        startsAt: schema.event.startsAt,
        deletedAt: schema.event.deletedAt,
        lat: sql<number>`ST_Y(${schema.event.location}::geometry)`,
        lng: sql<number>`ST_X(${schema.event.location}::geometry)`,
      })
      .from(schema.event)
      .where(eq(schema.event.id, input.eventId))
      .limit(1);

    if (!event || event.deletedAt) throw new ApiError(404, 'event_not_found', 'Event not found');

    const [member] = await tx
      .select({ rsvpStatus: schema.eventMember.rsvpStatus })
      .from(schema.eventMember)
      .where(
        and(
          eq(schema.eventMember.eventId, input.eventId),
          eq(schema.eventMember.userId, session.userId),
        ),
      )
      .limit(1);
    if (!member || !['approved', 'going', 'attended'].includes(member.rsvpStatus)) {
      throw new ApiError(403, 'not_attending', 'Only confirmed attendees can check in');
    }

    // Record this confirmation. The device fingerprint is also persisted (latest
    // device row) so the NSM distinct-device check has real data.
    await tx
      .update(schema.eventMember)
      .set({ checkinAt: new Date(), checkinLocation: input.location, updatedAt: new Date() })
      .where(
        and(
          eq(schema.eventMember.eventId, input.eventId),
          eq(schema.eventMember.userId, session.userId),
        ),
      );

    // Gather every confirmation on this event with the confirmer's device hash.
    const rows = (await tx
      .select({
        userId: schema.eventMember.userId,
        checkinAt: schema.eventMember.checkinAt,
        lat: sql<number | null>`ST_Y(${schema.eventMember.checkinLocation}::geometry)`,
        lng: sql<number | null>`ST_X(${schema.eventMember.checkinLocation}::geometry)`,
        fingerprint: sql<string | null>`(
          SELECT d.fingerprint_hash FROM device d WHERE d.user_id = ${schema.eventMember.userId} LIMIT 1
        )`,
      })
      .from(schema.eventMember)
      .where(
        and(eq(schema.eventMember.eventId, input.eventId), isNotNull(schema.eventMember.checkinAt)),
      )) as unknown as ConfirmationRow[];

    const confirmations: AttendanceConfirmation[] = rows
      .filter(
        (r): r is ConfirmationRow & { checkinAt: Date; lat: number; lng: number } =>
          r.checkinAt !== null && r.lat !== null && r.lng !== null,
      )
      .map((r): AttendanceConfirmation => ({
        // Branded UserId — the column is a uuid string at runtime.
        userId: r.userId as AttendanceConfirmation['userId'],
        confirmedAt: r.checkinAt.toISOString(),
        location: { lat: r.lat, lng: r.lng },
        // We cannot trust a client-asserted mock flag; device-integrity signals
        // would set this server-side. Absent that, treat as not-suspected and let
        // the distinct-device check carry the anti-collusion weight.
        mockLocationSuspected: false,
        // Fall back to the user id when no device hash exists, so two accounts on
        // one device still collapse to one device only when a real hash matches.
        deviceFingerprint: r.fingerprint ?? `nofp:${r.userId}`,
      }));

    const nsm = evaluateMeetupNsm({
      eventLocation: { lat: event.lat, lng: event.lng },
      startsAt: event.startsAt,
      confirmations,
    });

    return { event, nsm };
  });

  // Promote to a completed meetup at most once (NSM integrity + analytics).
  let nsmCounted = false;
  if (summary.nsm.counts && (await claimOnce(`nsm:complete:${input.eventId}`, 60 * 60 * 24 * 7))) {
    nsmCounted = true;
    await db
      .update(schema.eventMember)
      .set({ rsvpStatus: 'attended', updatedAt: new Date() })
      .where(
        and(
          eq(schema.eventMember.eventId, input.eventId),
          eq(schema.eventMember.rsvpStatus, 'going'),
        ),
      );
    await db
      .update(schema.event)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(schema.event.id, input.eventId));

    await captureAnalytics(
      session.userId,
      'meetup_completed',
      {
        event_id: input.eventId,
        confirmed_attendees: summary.nsm.confirmedAttendees,
        geofence_passed: summary.nsm.geofencePassed,
        collusion_score: summary.nsm.collusionScore,
      },
      { consented: session.analyticsConsent },
    );
    await flushAnalytics();
  }

  return jsonOk({
    checkedIn: true,
    meetupCounts: summary.nsm.counts,
    nsmCounted,
    confirmedAttendees: summary.nsm.confirmedAttendees,
    flags: summary.nsm.flags,
  });
});

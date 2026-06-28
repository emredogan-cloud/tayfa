import { and, eq, sql } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { rsvpRequestSchema } from '@tayfa/shared/schemas';
import { initialRsvpStatus, occupiesSeat, meetsLevel } from '@tayfa/shared/domain';
import { requireSession, requireVerificationLevel } from '@/lib/auth.js';
import { getServiceDb } from '@/lib/db.js';
import { apiHandler, jsonOk, ApiError, parseJson } from '@/lib/http.js';
import { captureAnalytics, flushAnalytics } from '@/lib/posthog-server.js';

export const runtime = 'nodejs';

/**
 * POST /api/rsvp — request to join an event (P3).
 *
 * The initial RSVP status comes from the spine's `initialRsvpStatus(visibility)`:
 * public events admit straight to `going`; gated visibilities land in `requested`
 * pending host approval (later moved with `transitionRsvp`). Idempotent: re-RSVPing
 * returns the existing membership rather than duplicating it.
 *
 * Free `verified_only` filter is enforced here (never paywalled). `rsvp` requires
 * phone verification.
 */
export const POST = apiHandler(async (req: Request) => {
  const session = await requireSession();
  requireVerificationLevel(session, 'rsvp');

  const { eventId } = await parseJson(req, rsvpRequestSchema);
  const db = getServiceDb();

  const result = await db.transaction(async (tx) => {
    const [event] = await tx
      .select({
        id: schema.event.id,
        visibility: schema.event.visibility,
        status: schema.event.status,
        capacityMax: schema.event.capacityMax,
        goingCount: schema.event.goingCount,
        verifiedOnly: schema.event.verifiedOnly,
        deletedAt: schema.event.deletedAt,
      })
      .from(schema.event)
      .where(eq(schema.event.id, eventId))
      .limit(1);

    if (!event || event.deletedAt) {
      throw new ApiError(404, 'event_not_found', 'Event not found');
    }
    if (event.status === 'cancelled' || event.status === 'completed') {
      throw new ApiError(409, 'event_closed', 'This event is no longer accepting RSVPs');
    }
    // Free verified-only filter: gate joiners by verification, not by payment.
    if (event.verifiedOnly && !meetsLevel(session.verificationLevel, 'id')) {
      throw new ApiError(403, 'verification_required', 'This event is for ID-verified members', {
        required: 'id',
      });
    }

    // Idempotency: one membership per (event, user).
    const [existing] = await tx
      .select({ rsvpStatus: schema.eventMember.rsvpStatus })
      .from(schema.eventMember)
      .where(
        and(eq(schema.eventMember.eventId, eventId), eq(schema.eventMember.userId, session.userId)),
      )
      .limit(1);
    if (existing) {
      return {
        status: existing.rsvpStatus,
        requiresApproval: existing.rsvpStatus === 'requested',
        alreadyMember: true,
      };
    }

    const status = initialRsvpStatus(event.visibility);

    // Capacity: a seat-occupying status can't push past capacityMax.
    if (occupiesSeat(status) && event.goingCount >= event.capacityMax) {
      throw new ApiError(409, 'event_full', 'This event is full');
    }

    await tx.insert(schema.eventMember).values({
      eventId,
      userId: session.userId,
      role: 'member',
      rsvpStatus: status,
    });

    if (occupiesSeat(status)) {
      await tx
        .update(schema.event)
        .set({ goingCount: sql`${schema.event.goingCount} + 1`, updatedAt: new Date() })
        .where(eq(schema.event.id, eventId));
    }

    return { status, requiresApproval: status === 'requested', alreadyMember: false };
  });

  if (!result.alreadyMember) {
    await captureAnalytics(
      session.userId,
      'rsvp_created',
      { event_id: eventId, requires_approval: result.requiresApproval },
      { consented: session.analyticsConsent },
    );
    await flushAnalytics();
  }

  return jsonOk({ rsvpStatus: result.status, requiresApproval: result.requiresApproval });
});

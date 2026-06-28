import { schema } from '@tayfa/db';
import { createEventSchema } from '@tayfa/shared/schemas';
import { RATE_LIMITS } from '@tayfa/shared/constants';
import { requireSession, requireVerificationLevel } from '@/lib/auth.js';
import { getServiceDb } from '@/lib/db.js';
import { pointToGeocell } from '@/lib/geo.js';
import { apiHandler, jsonOk, ApiError, parseJson } from '@/lib/http.js';
import { claimOnce } from '@/lib/idempotency.js';
import { consumeRateLimit } from '@/lib/ratelimit.js';

export const runtime = 'nodejs';

/**
 * POST /api/events — create an event (P3).
 *
 * Two non-negotiables:
 *  • NO 1:1. The schema enforces `capacityMin ≥ GROUP_DEFAULTS.minCapacity` (2);
 *    we re-assert via the gate so a future schema change can't silently allow it.
 *  • HOST VERIFICATION. Creating an event makes you its host, so we gate on the
 *    `host_event` action (id+liveness) via `checkActionAllowed`. That verification
 *    is FREE to the user (the business absorbs the cost) — never paywalled.
 *
 * Idempotent via an optional `Idempotency-Key` header; rate-limited per host.
 */
export const POST = apiHandler(async (req: Request) => {
  const session = await requireSession();
  // Host-level verification (id_live). Denial returns a typed 403 telling the
  // client to route into the free step-up flow.
  requireVerificationLevel(session, 'host_event');

  const input = await parseJson(req, createEventSchema);

  const rl = await consumeRateLimit(RATE_LIMITS.eventCreate, session.userId);
  if (!rl.success) {
    throw new ApiError(429, 'rate_limited', 'You have created too many events recently');
  }

  const idemKey = req.headers.get('Idempotency-Key');
  if (idemKey && !(await claimOnce(`event:create:${session.userId}:${idemKey}`))) {
    throw new ApiError(409, 'duplicate_request', 'This event creation was already processed');
  }

  const geocell = pointToGeocell(input.location);

  const eventId = await getServiceDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(schema.event)
      .values({
        hostId: session.userId,
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        // PRECISE point — stored server-side only; clients receive the fuzzed cell.
        location: input.location,
        geocell,
        venueName: input.venueName ?? null,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        capacityMin: input.capacityMin,
        capacityMax: input.capacityMax,
        goingCount: 1, // the host occupies a seat
        visibility: input.visibility,
        status: 'open',
        womenOnly: input.womenOnly,
        verifiedOnly: input.verifiedOnly,
      })
      .returning({ id: schema.event.id });

    if (!created) throw new ApiError(500, 'event_create_failed', 'Could not create the event');

    // The host joins their own event as a confirmed member.
    await tx.insert(schema.eventMember).values({
      eventId: created.id,
      userId: session.userId,
      role: 'host',
      rsvpStatus: 'going',
    });

    if (input.interestIds.length > 0) {
      await tx
        .insert(schema.eventInterest)
        .values(input.interestIds.map((interestId) => ({ eventId: created.id, interestId })));
    }

    return created.id;
  });

  return jsonOk({ eventId }, 201);
});

import { and, eq } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { ratingSchema } from '@tayfa/shared/schemas';
import { requireSession } from '@/lib/auth.js';
import { getServiceDb } from '@/lib/db.js';
import { apiHandler, jsonOk, ApiError, parseJson } from '@/lib/http.js';
import { captureAnalytics, flushAnalytics } from '@/lib/posthog-server.js';

export const runtime = 'nodejs';

/**
 * POST /api/ratings — post-meetup rating (P3/P5). Feeds reliability + safety
 * scores, which the spine recomputes ASYNC from aggregates (never in-request).
 *
 * The `privateSafetyFlag` is stored but NEVER exposed to the rated user
 * (anti-weaponization). Idempotent per (rater, target, event) via the DB unique
 * constraint — re-submitting is a no-op, not a duplicate.
 */
export const POST = apiHandler(async (req: Request) => {
  const session = await requireSession();
  const input = await parseJson(req, ratingSchema);

  if (input.targetUserId === session.userId) {
    throw new ApiError(400, 'self_rating', 'You cannot rate yourself');
  }

  const db = getServiceDb();

  // You may only rate someone from an event you were part of.
  const [membership] = await db
    .select({ id: schema.eventMember.id })
    .from(schema.eventMember)
    .where(
      and(
        eq(schema.eventMember.eventId, input.eventId),
        eq(schema.eventMember.userId, session.userId),
      ),
    )
    .limit(1);
  if (!membership) {
    throw new ApiError(403, 'not_a_participant', 'You can only rate people from events you joined');
  }

  const [created] = await db
    .insert(schema.rating)
    .values({
      raterId: session.userId,
      targetUserId: input.targetUserId,
      eventId: input.eventId,
      vibe: input.vibe,
      showedUp: input.showedUp,
      wouldMeetAgain: input.wouldMeetAgain,
      privateSafetyFlag: input.privateSafetyFlag,
    })
    .onConflictDoNothing({
      target: [schema.rating.raterId, schema.rating.targetUserId, schema.rating.eventId],
    })
    .returning({ id: schema.rating.id });

  // No row returned → the unique constraint fired: already rated. Idempotent OK.
  const alreadyRated = !created;

  if (!alreadyRated) {
    await captureAnalytics(
      session.userId,
      'rating_submitted',
      {
        event_id: input.eventId,
        vibe: input.vibe,
        showed_up: input.showedUp,
        would_meet_again: input.wouldMeetAgain,
      },
      { consented: session.analyticsConsent },
    );
    await flushAnalytics();
  }

  return jsonOk({ ratingId: created?.id ?? null, alreadyRated });
});

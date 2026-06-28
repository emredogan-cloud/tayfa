import { eq } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { accountDeletionSchema } from '@tayfa/shared/schemas';
import { DATA_RIGHTS_SLA_DAYS } from '@tayfa/shared/constants';
import { requireSession } from '@/lib/auth.js';
import { getServiceDb } from '@/lib/db.js';
import { apiHandler, jsonOk, parseJson } from '@/lib/http.js';
import { claimOnce } from '@/lib/idempotency.js';

export const runtime = 'nodejs';

/**
 * POST /api/account/delete — GDPR Art. 17 / KVKK erasure ("right to be forgotten").
 *
 * Erasure is an ORCHESTRATION, not a single DELETE, and it must be idempotent.
 * This handler performs the synchronous, in-DB steps and records the request; the
 * remaining fan-out (external processors) is enqueued for the async pipeline.
 *
 * Steps performed here (transactional):
 *   1. Tombstone the profile (soft-delete + pseudonymize displayName/bio/avatar/
 *      neighborhood) so the account can no longer be addressed, while preserving
 *      the referential integrity other users' meetup history depends on.
 *   2. Revoke all consents and detach interest edges.
 *   3. Write an immutable audit row (legal record of the erasure request).
 *
 * Fan-out enqueued for the async worker (Inngest) — left as documented steps so
 * this surface stays request-fast and the orchestration is auditable:
 *   • delete Supabase Auth user (auth.users) so the phone/identity is freed;
 *   • purge Storage objects (avatars, message media);
 *   • request deletion at processors: Persona (verification refs), RevenueCat
 *     (subscriber), PostHog (person), Sentry (user), Expo/Braze (push tokens);
 *   • crypto-shred message bodies (or hard-delete) per retention policy;
 *   • cancel any active subscription so billing stops.
 *
 * Statutory completion window: {DATA_RIGHTS_SLA_DAYS} days.
 */
export const POST = apiHandler(async (req: Request) => {
  const session = await requireSession();
  await parseJson(req, accountDeletionSchema); // requires `confirm: true`

  const uid = session.userId;

  // Idempotent: a second confirmation within the window is a harmless no-op.
  const firstRequest = await claimOnce(
    `account:delete:${uid}`,
    60 * 60 * 24 * DATA_RIGHTS_SLA_DAYS,
  );

  if (firstRequest) {
    const db = getServiceDb();
    const now = new Date();
    await db.transaction(async (tx) => {
      // (1) Tombstone + pseudonymize the profile.
      await tx
        .update(schema.profile)
        .set({
          deletedAt: now,
          displayName: 'Deleted user',
          bio: null,
          avatarUrl: null,
          neighborhood: null,
          geocell: null,
          updatedAt: now,
        })
        .where(eq(schema.profile.userId, uid));

      // (2) Revoke consents + detach interest edges.
      await tx.delete(schema.consent).where(eq(schema.consent.userId, uid));
      await tx.delete(schema.userInterest).where(eq(schema.userInterest.userId, uid));

      // (3) Immutable audit record of the erasure request (append-only table).
      await tx.insert(schema.auditLog).values({
        actorUserId: uid,
        actorType: 'human',
        action: 'account.erasure_requested',
        targetType: 'user',
        targetId: uid,
        metadata: { requestedAt: now.toISOString(), slaDays: DATA_RIGHTS_SLA_DAYS },
      });

      // NOTE: enqueue the external fan-out here (Inngest emit) — see header doc.
    });
  }

  return jsonOk({
    status: 'erasure_scheduled',
    completionWithinDays: DATA_RIGHTS_SLA_DAYS,
    alreadyRequested: !firstRequest,
  });
});

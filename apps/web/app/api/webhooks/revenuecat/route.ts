import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { getServiceDb } from '@/lib/db.js';
import { apiHandler, jsonOk, jsonError } from '@/lib/http.js';
import { claimOnce } from '@/lib/idempotency.js';
import { createProviders } from '@/lib/providers.js';

export const runtime = 'nodejs';

// Note: webhooks are server-to-server and carry no user session — auth is the
// provider signature, verified inside `billing.resolveWebhook` (fail-closed).

/**
 * POST /api/webhooks/revenuecat — entitlement sync (P7). RevenueCat is the
 * SERVER-SIDE SOURCE OF TRUTH for entitlements; the client is never trusted.
 *
 * Contract:
 *  • SIGNATURE-VERIFIED. `billing.resolveWebhook` validates the signature; a null
 *    result means invalid/forged → 401, no state change.
 *  • IDEMPOTENT. A content hash guards against redelivery; the
 *    `subscription.providerTxnId` unique index is the durable backstop.
 *  • Writes `profile.entitlement` (what every feature gate reads) atomically.
 */
export const POST = apiHandler(async (req: Request) => {
  const rawBody = await req.text();
  const signature =
    req.headers.get('authorization') ?? req.headers.get('x-revenuecat-signature') ?? '';

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonError(400, 'invalid_json', 'Body must be JSON');
  }

  const providers = createProviders();
  const snapshot = await providers.billing.resolveWebhook(payload, signature);
  if (!snapshot) {
    // Fail-closed: bad signature or unparseable event. Never mutate entitlements.
    return jsonError(401, 'invalid_signature', 'Webhook signature verification failed');
  }

  // Idempotency key: prefer the event id, fall back to a body hash.
  const eventId =
    (typeof payload === 'object' && payload !== null && 'event' in payload
      ? (payload as { event?: { id?: string } }).event?.id
      : undefined) ?? createHash('sha256').update(rawBody).digest('hex');

  if (!(await claimOnce(`rc:event:${eventId}`, 60 * 60 * 24 * 30))) {
    return jsonOk({ idempotent: true }); // already applied — ack so RC stops retrying
  }

  const db = getServiceDb();
  await db.transaction(async (tx) => {
    // The gate truth: keep profile.entitlement in lockstep with RevenueCat.
    await tx
      .update(schema.profile)
      .set({ entitlement: snapshot.entitlement, updatedAt: new Date() })
      .where(eq(schema.profile.userId, snapshot.userId));

    // Durable record of the subscription event (idempotent on providerTxnId).
    await tx
      .insert(schema.subscription)
      .values({
        userId: snapshot.userId,
        product: 'revenuecat',
        // Store channel isn't in the snapshot; the subscriber object carries it in
        // production. Default to app_store for the ledger row.
        store: 'app_store',
        entitlement: snapshot.entitlement,
        status: snapshot.inTrial
          ? 'in_trial'
          : snapshot.entitlement === 'tayfa_plus'
            ? 'active'
            : 'expired',
        renewsAt: snapshot.renewsAt ? new Date(snapshot.renewsAt) : null,
        providerTxnId: eventId,
      })
      .onConflictDoNothing({ target: schema.subscription.providerTxnId });
  });

  return jsonOk({ applied: true, entitlement: snapshot.entitlement });
});

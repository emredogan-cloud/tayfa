import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { VERIFICATION_RANK } from '@tayfa/shared/types';
import { getServiceDb } from '@/lib/db.js';
import { apiHandler, jsonOk, jsonError } from '@/lib/http.js';
import { claimOnce } from '@/lib/idempotency.js';
import { createProviders } from '@/lib/providers.js';

export const runtime = 'nodejs';

/**
 * POST /api/webhooks/persona — identity verification resolution (P5).
 *
 * FAIL-CLOSED: `verification.resolveWebhook` returns null on a bad signature OR a
 * non-passing inquiry; we then make NO change and reject. We only ever RAISE a
 * user's verification level, never lower it from a webhook, and we never store
 * biometric documents — only the provider reference (KVKK §biometric). Idempotent
 * by event hash.
 */
export const POST = apiHandler(async (req: Request) => {
  const rawBody = await req.text();
  const signature =
    req.headers.get('persona-signature') ?? req.headers.get('x-persona-signature') ?? '';

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonError(400, 'invalid_json', 'Body must be JSON');
  }

  const providers = createProviders();
  const resolved = await providers.verification.resolveWebhook(payload, signature);
  if (!resolved) {
    // Fail-closed: deny on any doubt. Never "pass" verification on provider error.
    return jsonError(401, 'verification_denied', 'Verification could not be confirmed');
  }

  const eventHash = createHash('sha256').update(rawBody).digest('hex');
  if (!(await claimOnce(`persona:event:${eventHash}`, 60 * 60 * 24 * 30))) {
    return jsonOk({ idempotent: true });
  }

  const db = getServiceDb();
  await db.transaction(async (tx) => {
    // Record the verification (provider reference only — no document data).
    await tx.insert(schema.verification).values({
      userId: resolved.userId,
      type: resolved.level === 'id_live' ? 'liveness' : 'id',
      provider: 'persona',
      providerRef: resolved.providerRef,
      status: 'verified',
      verifiedAt: new Date(),
    });

    // Only raise the level — never downgrade via webhook.
    const [profile] = await tx
      .select({ verificationLevel: schema.profile.verificationLevel })
      .from(schema.profile)
      .where(eq(schema.profile.userId, resolved.userId))
      .limit(1);

    if (
      profile &&
      VERIFICATION_RANK[resolved.level] > VERIFICATION_RANK[profile.verificationLevel]
    ) {
      await tx
        .update(schema.profile)
        .set({ verificationLevel: resolved.level, updatedAt: new Date() })
        .where(eq(schema.profile.userId, resolved.userId));
    }
  });

  return jsonOk({ applied: true, level: resolved.level });
});

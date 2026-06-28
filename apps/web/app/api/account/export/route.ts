import { eq } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { DATA_RIGHTS_SLA_DAYS } from '@tayfa/shared/constants';
import { requireSession } from '@/lib/auth.js';
import { getServiceDb } from '@/lib/db.js';
import { apiHandler } from '@/lib/http.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/account/export — GDPR Art. 15/20 + KVKK access/portability.
 *
 * Assembles the signed-in user's personal data into a single machine-readable
 * JSON document, served as an attachment. We export the user's OWN data only and
 * deliberately EXCLUDE other users' PII (e.g. reports name only the target id, not
 * the target's profile) and any biometric document data (we never store it — only
 * provider references). Synchronous here; a heavy account would be fulfilled
 * within the {DATA_RIGHTS_SLA_DAYS}-day statutory window via an async job.
 */
export const GET = apiHandler(async () => {
  const session = await requireSession();
  const db = getServiceDb();
  const uid = session.userId;

  const [
    profile,
    interests,
    hostedEvents,
    memberships,
    ratingsGiven,
    reportsFiled,
    consents,
    subscriptions,
    blocks,
  ] = await Promise.all([
    db.select().from(schema.profile).where(eq(schema.profile.userId, uid)).limit(1),
    db.select().from(schema.userInterest).where(eq(schema.userInterest.userId, uid)),
    db.select().from(schema.event).where(eq(schema.event.hostId, uid)),
    db.select().from(schema.eventMember).where(eq(schema.eventMember.userId, uid)),
    db.select().from(schema.rating).where(eq(schema.rating.raterId, uid)),
    db.select().from(schema.report).where(eq(schema.report.reporterId, uid)),
    db.select().from(schema.consent).where(eq(schema.consent.userId, uid)),
    db.select().from(schema.subscription).where(eq(schema.subscription.userId, uid)),
    // Blocks the user themselves created (their own action data).
    db.select().from(schema.block).where(eq(schema.block.blockerId, uid)),
  ]);

  const exportDoc = {
    meta: {
      kind: 'tayfa.personal_data_export',
      version: 1,
      userId: uid,
      generatedAt: new Date().toISOString(),
      statutorySlaDays: DATA_RIGHTS_SLA_DAYS,
      note: 'Contains your own personal data only. Biometric documents are never stored; verification holds provider references only.',
    },
    profile: profile[0] ?? null,
    interests,
    hostedEvents,
    eventMemberships: memberships,
    ratingsYouGave: ratingsGiven,
    reportsYouFiled: reportsFiled,
    consents,
    subscriptions,
    blocksYouCreated: blocks,
  };

  const filename = `tayfa-data-export-${uid}.json`;
  return new Response(JSON.stringify(exportDoc, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  });
});

import { schema } from '@tayfa/db';
import { reportSchema } from '@tayfa/shared/schemas';
import { severityForReason, slaDeadline, detectScamLanguage } from '@tayfa/shared/domain';
import { RATE_LIMITS } from '@tayfa/shared/constants';
import { requireSession } from '@/lib/auth.js';
import { getServiceDb } from '@/lib/db.js';
import { apiHandler, jsonOk, ApiError, parseJson } from '@/lib/http.js';
import { consumeRateLimit } from '@/lib/ratelimit.js';
import { captureAnalytics, flushAnalytics } from '@/lib/posthog-server.js';

export const runtime = 'nodejs';

/**
 * POST /api/reports — file a report into the moderation queue (P5).
 *
 * SAFETY IS NEVER PAYWALLED: there is no entitlement check here, ever. Severity
 * and the SLA deadline are computed by the spine (`severityForReason` +
 * `slaDeadline`) so the T&S console can sort the queue by urgency. A scam-language
 * scan fast-tracks money-fraud signals. The report + an immutable audit row are
 * written together.
 */
export const POST = apiHandler(async (req: Request) => {
  const session = await requireSession();
  const input = await parseJson(req, reportSchema);

  const rl = await consumeRateLimit(RATE_LIMITS.reportSubmit, session.userId);
  if (!rl.success) {
    throw new ApiError(429, 'rate_limited', 'Too many reports submitted recently');
  }

  const severity = severityForReason(input.reason);
  const filedAt = new Date();
  const deadline = slaDeadline(severity, filedAt);

  // Money/scam language is a signal (never an auto-ban) — surfaced to triage.
  const scam = input.detail ? detectScamLanguage(input.detail) : { matched: false, patterns: [] };

  const db = getServiceDb();
  const reportId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(schema.report)
      .values({
        reporterId: session.userId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        severity,
        detail: input.detail ?? null,
        evidenceUrl: input.evidenceUrl ?? null,
        status: 'open',
        slaDeadline: deadline,
      })
      .returning({ id: schema.report.id });

    if (!created) throw new ApiError(500, 'report_failed', 'Could not file the report');

    await tx.insert(schema.auditLog).values({
      actorUserId: session.userId,
      actorType: 'human',
      action: 'report.filed',
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: { reportId: created.id, severity, scamMatched: scam.matched },
    });

    return created.id;
  });

  await captureAnalytics(
    session.userId,
    'report_filed',
    { target_type: input.targetType, severity },
    { consented: session.analyticsConsent },
  );
  await flushAnalytics();

  return jsonOk({ reportId, severity, slaDeadline: deadline.toISOString(), scamFlagged: scam.matched }, 201);
});

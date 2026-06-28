'use server';

import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { schema } from '@tayfa/db';
import { MODERATION_ACTIONS } from '@tayfa/shared/types';
import { getSession } from '@/lib/auth.js';
import { getServiceDb } from '@/lib/db.js';

/**
 * Server Action: resolve a report from the T&S console. Every decision writes a
 * `moderation_action` (actor = human) AND an immutable `audit_log` row — the legal
 * record of who did what, when (RISK_ANALYSIS §3.4). A "dismiss" records the
 * audit + status but no enforcement action.
 *
 * Re-checks moderator authorization server-side; a stale/forged form cannot act.
 */
// `dismiss` = no enforcement; the rest map 1:1 to the spine's MODERATION_ACTIONS.
const DECISIONS = ['dismiss', ...MODERATION_ACTIONS] as const;

const decisionSchema = z.object({
  reportId: z.uuid(),
  decision: z.enum(DECISIONS),
  rationale: z.string().trim().max(1000).optional(),
});

export async function resolveReport(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session?.isModerator) {
    throw new Error('Forbidden: Trust & Safety console is restricted');
  }

  const input = decisionSchema.parse({
    reportId: formData.get('reportId'),
    decision: formData.get('decision'),
    rationale: formData.get('rationale') || undefined,
  });

  const db = getServiceDb();
  await db.transaction(async (tx) => {
    const [report] = await tx
      .select({
        id: schema.report.id,
        targetType: schema.report.targetType,
        targetId: schema.report.targetId,
      })
      .from(schema.report)
      .where(eq(schema.report.id, input.reportId))
      .limit(1);
    if (!report) throw new Error('Report not found');

    const isEnforcement = input.decision !== 'dismiss';

    if (isEnforcement) {
      await tx.insert(schema.moderationAction).values({
        reportId: report.id,
        targetUserId: report.targetType === 'user' ? report.targetId : null,
        actor: 'human',
        // `isEnforcement` guarantees decision !== 'dismiss' here.
        action: input.decision as Exclude<typeof input.decision, 'dismiss'>,
        rationale: input.rationale ?? null,
        confidence: null, // human decision — no model confidence
      });
    }

    await tx
      .update(schema.report)
      .set({ status: isEnforcement ? 'actioned' : 'dismissed', updatedAt: new Date() })
      .where(eq(schema.report.id, report.id));

    // Immutable audit trail (append-only table).
    await tx.insert(schema.auditLog).values({
      actorUserId: session.userId,
      actorType: 'human',
      action: `moderation.${input.decision}`,
      targetType: report.targetType,
      targetId: report.targetId,
      metadata: { reportId: report.id, rationale: input.rationale ?? null },
    });
  });

  revalidatePath('/moderation');
  redirect('/moderation');
}

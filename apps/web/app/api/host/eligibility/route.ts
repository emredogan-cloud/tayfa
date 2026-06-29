import { and, count, eq } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { canUseHostProTools, hostPayoutEligibility } from '@tayfa/shared/domain';
import { requireSession } from '@/lib/auth.js';
import { getServiceDb } from '@/lib/db.js';
import { apiHandler, jsonOk, ApiError } from '@/lib/http.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/host/eligibility — host pro-tools + payout eligibility (P9), computed
 * SERVER-SIDE from the signed-in user's standing. Pro-tools (recurring/ticketed/
 * analytics) gate on hosting track record + reliability; payouts add the mandatory
 * KYC + ID-verification gates (financial compliance — `sponsored ≠ unsafe`, and
 * `money requires KYC`). The client is never trusted for any of these facts.
 */
export const GET = apiHandler(async () => {
  const session = await requireSession();
  const db = getServiceDb();

  const [profile] = await db
    .select({
      verificationLevel: schema.profile.verificationLevel,
      reliabilityScore: schema.profile.reliabilityScore,
    })
    .from(schema.profile)
    .where(eq(schema.profile.userId, session.userId))
    .limit(1);
  if (!profile) throw new ApiError(409, 'profile_not_initialized', 'Complete onboarding first');

  const [hosted] = await db
    .select({ n: count() })
    .from(schema.event)
    .where(and(eq(schema.event.hostId, session.userId), eq(schema.event.status, 'completed')));

  // KYC is a Stripe Connect onboarding fact; no column is wired yet, so it reads
  // false and surfaces as a payout blocker — honest, never silently "complete".
  const standing = {
    verificationLevel: profile.verificationLevel,
    reliabilityScore: profile.reliabilityScore,
    completedHostedEvents: hosted?.n ?? 0,
    kycComplete: false,
  };

  return jsonOk({
    proTools: canUseHostProTools(standing),
    payout: hostPayoutEligibility(standing),
  });
});

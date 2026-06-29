import { and, count, eq } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import {
  buildUpgradeOffer,
  checkTrialEligibility,
  decideUpgradePrompt,
  type PaywallContext,
} from '@tayfa/shared/domain';
import type { PricingRegion } from '@tayfa/shared/types';
import { requireSession } from '@/lib/auth.js';
import { getServiceDb } from '@/lib/db.js';
import { apiHandler, jsonOk } from '@/lib/http.js';

export const runtime = 'nodejs';

const ASPIRATION: ReadonlySet<string> = new Set([
  'post_meetup_high',
  'hit_crew_limit',
  'tapped_premium_feature',
  'tapped_boost',
  'core_flow',
]);

/** TR price point for Türkiye; EU (PPP) everywhere else. */
function regionFromCountry(country: string | null): PricingRegion {
  return country?.toUpperCase() === 'TR' ? 'TR' : 'EU';
}

/**
 * GET /api/billing/offer[?context=...] — the Tayfa+ upgrade offer for the signed-in
 * user (P7). Entitlement + trial eligibility are computed SERVER-SIDE (never trusted
 * from the client). When a `context` is supplied, the value-first paywall gate
 * (`decideUpgradePrompt`) decides whether a prompt should show at all — core/social/
 * safety flows and already-subscribed users get `{ show: false }`.
 *
 * Prices come from config (`PRICING`), regionalised by the edge country header.
 */
export const GET = apiHandler(async (req: Request) => {
  const session = await requireSession();
  const region = regionFromCountry(req.headers.get('x-tayfa-geo-country'));
  const db = getServiceDb();

  // Engagement-gated trial: earned by real meetups (geofenced + mutually confirmed),
  // not offered at install. Crew membership isn't persisted yet → counted as 0.
  const [attended] = await db
    .select({ n: count() })
    .from(schema.eventMember)
    .where(
      and(
        eq(schema.eventMember.userId, session.userId),
        eq(schema.eventMember.rsvpStatus, 'attended'),
      ),
    );
  const [everTrialed] = await db
    .select({ n: count() })
    .from(schema.subscription)
    .where(
      and(
        eq(schema.subscription.userId, session.userId),
        eq(schema.subscription.status, 'in_trial'),
      ),
    );

  const eligibility = checkTrialEligibility({
    completedMeetups: attended?.n ?? 0,
    activeCrews: 0,
    hasUsedTrial: (everTrialed?.n ?? 0) > 0,
    currentEntitlement: session.entitlement,
  });
  const trialEligible = eligibility.eligible;

  const offer = buildUpgradeOffer(region, trialEligible);

  // Optional value-first gate: only when the caller names the moment.
  const rawCtx = new URL(req.url).searchParams.get('context');
  const context = rawCtx && ASPIRATION.has(rawCtx) ? (rawCtx as PaywallContext) : null;
  const prompt = context
    ? decideUpgradePrompt({ context, entitlement: session.entitlement, trialEligible })
    : null;

  return jsonOk({
    entitlement: session.entitlement,
    region,
    trialEligible,
    offer,
    ...(prompt ? { prompt } : {}),
  });
});

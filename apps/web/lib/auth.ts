import { and, desc, eq } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { checkActionAllowed, type GatedAction } from '@tayfa/shared/domain';
import { asId, type Entitlement, type UserId, type VerificationLevel } from '@tayfa/shared/types';
import { headers } from 'next/headers';
import { getServiceDb } from './db.js';
import { env, isMockMode } from './env.js';
import { ApiError } from './http.js';
import { getServerSupabase } from './supabase-server.js';

/**
 * Session = the SERVER's truth about who is calling. Identity comes from the
 * Supabase JWT; the privileged facts (verification level, entitlement) are loaded
 * from the database, NEVER from a client flag (mission MANDATORY: entitlements
 * are server-side truth; eslint also bans `isPremiumFromClient`).
 *
 * Gating fails closed: if we can't confirm a level, the user is treated as the
 * least-privileged (`none` / `free`), so privileged actions are denied.
 */
export interface Session {
  readonly userId: UserId;
  readonly email: string | null;
  readonly verificationLevel: VerificationLevel;
  readonly entitlement: Entitlement;
  readonly isModerator: boolean;
  /** Product-analytics consent — gates server-side PostHog capture. */
  readonly analyticsConsent: boolean;
}

async function resolveAuthUserId(): Promise<{ userId: string; email: string | null } | null> {
  const supabase = await getServerSupabase();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      return { userId: data.user.id, email: data.user.email ?? null };
    }
  }
  // Dev/mock convenience: let a header impersonate a user when no Supabase is
  // wired up. Only honoured in mock mode so it can never bypass real auth.
  if (isMockMode()) {
    const h = await headers();
    const devUser = h.get('x-tayfa-dev-user');
    if (devUser) return { userId: devUser, email: null };
  }
  return null;
}

/**
 * Resolve the current session, or `null` if unauthenticated. Privileged fields
 * are read from the DB; if the DB is unavailable we still return a session pinned
 * to the safe minimum so downstream gates deny rather than crash.
 */
export async function getSession(): Promise<Session | null> {
  const auth = await resolveAuthUserId();
  if (!auth) return null;

  const userId = asId<'UserId'>(auth.userId);
  const isModerator = env.moderatorUserIds().includes(auth.userId);

  // Safe defaults — used if the profile/consent lookup fails.
  let verificationLevel: VerificationLevel = 'none';
  let entitlement: Entitlement = 'free';
  let analyticsConsent = false;

  try {
    const db = getServiceDb();
    const [profile] = await db
      .select({
        verificationLevel: schema.profile.verificationLevel,
        entitlement: schema.profile.entitlement,
      })
      .from(schema.profile)
      .where(eq(schema.profile.userId, auth.userId))
      .limit(1);

    if (profile) {
      verificationLevel = profile.verificationLevel;
      entitlement = profile.entitlement;
    }

    const [consent] = await db
      .select({ granted: schema.consent.granted })
      .from(schema.consent)
      .where(and(eq(schema.consent.userId, auth.userId), eq(schema.consent.category, 'marketing')))
      .orderBy(desc(schema.consent.createdAt))
      .limit(1);
    analyticsConsent = consent?.granted ?? false;
  } catch {
    // Fail closed: keep the safe-minimum defaults set above.
  }

  return {
    userId,
    email: auth.email,
    verificationLevel,
    entitlement,
    isModerator,
    analyticsConsent,
  };
}

/** Require an authenticated session, or throw a typed 401. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new ApiError(401, 'unauthenticated', 'Sign in to continue');
  return session;
}

/**
 * Enforce a step-up verification requirement for a gated action. Uses the spine's
 * `checkActionAllowed`; on denial throws a 403 that tells the client exactly which
 * level to step up to (the app then routes into the FREE id/liveness flow).
 */
export function requireVerificationLevel(session: Session, action: GatedAction): void {
  const decision = checkActionAllowed(action, session.verificationLevel);
  if (!decision.allowed) {
    throw new ApiError(
      403,
      'verification_required',
      `This action requires ${decision.required} verification`,
      {
        action,
        required: decision.required,
        have: session.verificationLevel,
      },
    );
  }
}

/** Gate the Trust & Safety console. Simple allowlist role check (RLS-bypassing tier). */
export async function requireModerator(): Promise<Session> {
  const session = await requireSession();
  if (!session.isModerator) {
    throw new ApiError(403, 'forbidden', 'Trust & Safety console is restricted');
  }
  return session;
}

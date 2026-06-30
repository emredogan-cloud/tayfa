import * as SecureStore from 'expo-secure-store';
import type { Entitlement, UserId, VerificationLevel } from '@tayfa/shared/types';

/**
 * Render-facing session persistence.
 *
 * The Supabase JWT is already persisted by the Supabase client (keychain via the
 * SecureStore adapter in `supabase.ts`). This is a SEPARATE, small record of the
 * derived session slice (who/onboarding/entitlement) so that **mock/demo builds**
 * — where there is no real Supabase session to restore — still remember a
 * completed onboarding across app restarts. Without it the in-memory zustand
 * store resets on every cold start and the user is bounced back to onboarding
 * (the reported bug). In production Supabase remains the source of truth; this is
 * only consulted when there is no live Supabase session AND Supabase is unconfigured.
 */
const KEY = 'tayfa.session.v1';

export interface PersistedSession {
  userId: UserId | null;
  phone: string | null;
  verificationLevel: VerificationLevel;
  entitlement: Entitlement;
  onboardingComplete: boolean;
  /** First-run gate — true once the welcome screen has been seen. */
  hasSeenWelcome: boolean;
}

export async function loadPersistedSession(): Promise<PersistedSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return null;
  }
}

export async function persistSession(session: PersistedSession): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(session));
  } catch {
    // Best-effort: persistence is an enhancement, never a correctness requirement.
  }
}

export async function clearPersistedSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // ignore
  }
}

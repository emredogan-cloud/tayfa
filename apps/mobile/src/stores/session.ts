import { create } from 'zustand';
import type { Entitlement, UserId, VerificationLevel } from '@tayfa/shared/types';
import { persistSession } from '@/lib/sessionStorage';

/**
 * Auth + identity session. The JWT itself lives in the Supabase client (keychain
 * via expo-secure-store); this store holds the derived, render-facing slice.
 *
 * PERSISTENCE: the render-facing slice is mirrored to SecureStore (see
 * `sessionStorage.ts`) via a write-through subscription below, so mock/demo
 * builds remember a completed onboarding across cold starts. Production auth
 * stays Supabase-authoritative — this mirror is only *read* at boot when there
 * is no live Supabase session and Supabase is unconfigured.
 *
 * CRITICAL: `entitlement` here is a CACHE of the server truth (RevenueCat via the
 * BFF) for UI hints only. It is NEVER the authority for unlocking a feature — the
 * BFF re-checks every premium action. We never write a client-asserted premium flag.
 */
export interface SessionState {
  /** Phone in E.164, captured during the OTP flow (pre-auth). */
  phone: string | null;
  userId: UserId | null;
  verificationLevel: VerificationLevel;
  entitlement: Entitlement;
  onboardingComplete: boolean;
  /** First-run gate — true once the welcome screen has been seen. */
  hasSeenWelcome: boolean;
  /** True once we've checked Supabase for an existing session at boot. */
  hydrated: boolean;

  setPhone: (phone: string) => void;
  hydrate: (input: {
    userId: UserId | null;
    verificationLevel?: VerificationLevel;
    entitlement?: Entitlement;
    onboardingComplete?: boolean;
    hasSeenWelcome?: boolean;
  }) => void;
  setVerificationLevel: (level: VerificationLevel) => void;
  setEntitlement: (entitlement: Entitlement) => void;
  setOnboardingComplete: (done: boolean) => void;
  setHasSeenWelcome: (seen: boolean) => void;
  signOut: () => void;
}

export const useSession = create<SessionState>((set) => ({
  phone: null,
  userId: null,
  verificationLevel: 'none',
  entitlement: 'free',
  onboardingComplete: false,
  hasSeenWelcome: false,
  hydrated: false,

  setPhone: (phone) => set({ phone }),
  hydrate: ({ userId, verificationLevel, entitlement, onboardingComplete, hasSeenWelcome }) =>
    set((s) => ({
      userId,
      verificationLevel: verificationLevel ?? s.verificationLevel,
      entitlement: entitlement ?? s.entitlement,
      onboardingComplete: onboardingComplete ?? s.onboardingComplete,
      hasSeenWelcome: hasSeenWelcome ?? s.hasSeenWelcome,
      hydrated: true,
    })),
  setVerificationLevel: (verificationLevel) => set({ verificationLevel }),
  setEntitlement: (entitlement) => set({ entitlement }),
  setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
  setHasSeenWelcome: (hasSeenWelcome) => set({ hasSeenWelcome }),
  signOut: () =>
    set({
      phone: null,
      userId: null,
      verificationLevel: 'none',
      entitlement: 'free',
      onboardingComplete: false,
      // hasSeenWelcome stays sticky across sign-out: a returning user who already
      // saw the welcome intro should land on auth, not re-watch the intro.
    }),
}));

// Write-through: mirror the render-facing slice to SecureStore on every change,
// but only once the session has been hydrated at boot — so we never clobber the
// persisted record with the pre-boot default. Fire-and-forget (best-effort).
useSession.subscribe((state) => {
  if (!state.hydrated) return;
  void persistSession({
    userId: state.userId,
    phone: state.phone,
    verificationLevel: state.verificationLevel,
    entitlement: state.entitlement,
    onboardingComplete: state.onboardingComplete,
    hasSeenWelcome: state.hasSeenWelcome,
  });
});

/** Convenience selector: is there an authenticated user? */
export const useIsAuthenticated = (): boolean => useSession((s) => s.userId !== null);

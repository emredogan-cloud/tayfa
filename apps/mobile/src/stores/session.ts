import { create } from 'zustand';
import type { Entitlement, UserId, VerificationLevel } from '@tayfa/shared/types';

/**
 * Auth + identity session. The JWT itself lives in the Supabase client (keychain
 * via expo-secure-store); this store holds the derived, render-facing slice.
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
  /** True once we've checked Supabase for an existing session at boot. */
  hydrated: boolean;

  setPhone: (phone: string) => void;
  hydrate: (input: {
    userId: UserId | null;
    verificationLevel?: VerificationLevel;
    entitlement?: Entitlement;
    onboardingComplete?: boolean;
  }) => void;
  setVerificationLevel: (level: VerificationLevel) => void;
  setEntitlement: (entitlement: Entitlement) => void;
  setOnboardingComplete: (done: boolean) => void;
  signOut: () => void;
}

export const useSession = create<SessionState>((set) => ({
  phone: null,
  userId: null,
  verificationLevel: 'none',
  entitlement: 'free',
  onboardingComplete: false,
  hydrated: false,

  setPhone: (phone) => set({ phone }),
  hydrate: ({ userId, verificationLevel, entitlement, onboardingComplete }) =>
    set((s) => ({
      userId,
      verificationLevel: verificationLevel ?? s.verificationLevel,
      entitlement: entitlement ?? s.entitlement,
      onboardingComplete: onboardingComplete ?? s.onboardingComplete,
      hydrated: true,
    })),
  setVerificationLevel: (verificationLevel) => set({ verificationLevel }),
  setEntitlement: (entitlement) => set({ entitlement }),
  setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
  signOut: () =>
    set({
      phone: null,
      userId: null,
      verificationLevel: 'none',
      entitlement: 'free',
      onboardingComplete: false,
    }),
}));

/** Convenience selector: is there an authenticated user? */
export const useIsAuthenticated = (): boolean => useSession((s) => s.userId !== null);

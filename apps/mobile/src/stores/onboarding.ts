import { create } from 'zustand';
import type { ConsentCategory, InterestDomain } from '@tayfa/shared/types';

/**
 * Onboarding draft — interests, granular consent, and the profile being built.
 * Kept client-side until the user finishes each step, then POSTed to the BFF
 * (which Zod-validates with the shared schemas). Consent toggles are SEPARATE
 * (KVKK unbundled açık rıza); `marketing` must never gate the core flow.
 */

export interface DraftInterest {
  readonly interestId: string;
  readonly label: string;
  readonly domain: InterestDomain;
  readonly slug: string;
  readonly weight: number;
}

export type ConsentToggles = Record<ConsentCategory, boolean>;

export interface ProfileDraft {
  displayName: string;
  bio: string;
  neighborhood: string;
}

interface OnboardingState {
  startedAt: number;
  interests: DraftInterest[];
  consent: ConsentToggles;
  profile: ProfileDraft;

  toggleInterest: (interest: DraftInterest) => void;
  hasInterest: (interestId: string) => boolean;
  setConsent: (category: ConsentCategory, value: boolean) => void;
  setProfileField: <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => void;
  reset: () => void;
}

const DEFAULT_CONSENT: ConsentToggles = {
  location: false,
  marketing: false,
  connected_accounts: false,
  biometric_verification: false,
};

export const useOnboarding = create<OnboardingState>((set, get) => ({
  startedAt: Date.now(),
  interests: [],
  consent: { ...DEFAULT_CONSENT },
  profile: { displayName: '', bio: '', neighborhood: '' },

  toggleInterest: (interest) =>
    set((s) => {
      const exists = s.interests.some((i) => i.interestId === interest.interestId);
      return {
        interests: exists
          ? s.interests.filter((i) => i.interestId !== interest.interestId)
          : [...s.interests, interest],
      };
    }),
  hasInterest: (interestId) => get().interests.some((i) => i.interestId === interestId),
  setConsent: (category, value) => set((s) => ({ consent: { ...s.consent, [category]: value } })),
  setProfileField: (key, value) => set((s) => ({ profile: { ...s.profile, [key]: value } })),
  reset: () =>
    set({
      startedAt: Date.now(),
      interests: [],
      consent: { ...DEFAULT_CONSENT },
      profile: { displayName: '', bio: '', neighborhood: '' },
    }),
}));

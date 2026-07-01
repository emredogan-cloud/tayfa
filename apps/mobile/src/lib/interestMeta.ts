import type { Ionicons } from '@expo/vector-icons';
import type { InterestDomain } from '@tayfa/shared/types';
import { colors } from '@/design-system';

/**
 * Per-domain label, glyph and accent for interests. One source of truth shared by
 * the onboarding taste-card picker, the profile chips and the edit-profile screen
 * so an interest always looks the same wherever it appears.
 */
export const DOMAIN_META: Record<
  InterestDomain,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  music_genre: { label: 'Music', icon: 'musical-notes', color: colors.ember },
  artist: { label: 'Artists', icon: 'mic', color: colors.women },
  tv_show: { label: 'TV', icon: 'tv', color: colors.grape },
  film: { label: 'Film', icon: 'film', color: colors.amber },
  sport: { label: 'Sport', icon: 'basketball', color: colors.verified },
  hobby: { label: 'Hobbies', icon: 'color-palette', color: colors.ember },
  cuisine: { label: 'Food', icon: 'restaurant', color: colors.amber },
  cause: { label: 'Causes', icon: 'heart', color: colors.women },
  game: { label: 'Games', icon: 'game-controller', color: colors.grape },
};

/** Icon + accent for a single interest, keyed by its domain. */
export function interestIcon(domain: InterestDomain): {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
} {
  const m = DOMAIN_META[domain];
  return { icon: m.icon, color: m.color };
}

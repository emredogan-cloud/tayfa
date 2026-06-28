import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import type { VerificationLevel } from '@tayfa/shared/types';
import { cn } from '@/lib/cn';
import { colors } from './tokens';
import { Text } from './Text';

export type BadgeTone =
  'neutral' | 'ember' | 'verified' | 'grape' | 'amber' | 'danger' | 'women' | 'success';

const TONE: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: 'bg-surface-alt', fg: 'text-ink-muted' },
  ember: { bg: 'bg-ember-soft', fg: 'text-ember-dark' },
  verified: { bg: 'bg-verified-soft', fg: 'text-verified' },
  grape: { bg: 'bg-grape-soft', fg: 'text-grape' },
  amber: { bg: 'bg-amber-soft', fg: 'text-amber' },
  danger: { bg: 'bg-danger-soft', fg: 'text-danger' },
  women: { bg: 'bg-women-soft', fg: 'text-women' },
  success: { bg: 'bg-success-soft', fg: 'text-success' },
};

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
}

export function Badge({
  label,
  tone = 'neutral',
  icon,
  className,
}: BadgeProps): React.ReactElement {
  const t = TONE[tone];
  return (
    <View className={cn('flex-row items-center gap-1 rounded-full px-2.5 py-1', t.bg, className)}>
      {icon ? <Ionicons name={icon} size={12} color={ICON_TINT[tone]} /> : null}
      <Text variant="caption" className={t.fg}>
        {label}
      </Text>
    </View>
  );
}

const ICON_TINT: Record<BadgeTone, string> = {
  neutral: colors.inkMuted,
  ember: colors.emberDark,
  verified: colors.verified,
  grape: colors.grape,
  amber: colors.amber,
  danger: colors.danger,
  women: colors.women,
  success: colors.success,
};

/** Human-facing label for each verification tier. */
const LEVEL_LABEL: Record<VerificationLevel, string> = {
  none: 'Unverified',
  phone: 'Phone verified',
  id: 'ID verified',
  id_live: 'Verified+',
};

export interface VerifiedBadgeProps {
  level: VerificationLevel;
  /** Compact = checkmark only (avatars, dense lists). */
  compact?: boolean;
  className?: string;
}

/**
 * Trust signal. `id_live` (Verified+) is the gold standard required to host/DM;
 * `phone` is the mandatory baseline. `none` renders nothing (no negative badge).
 */
export function VerifiedBadge({
  level,
  compact = false,
  className,
}: VerifiedBadgeProps): React.ReactElement | null {
  if (level === 'none') return null;
  const isPlus = level === 'id_live';
  const tone: BadgeTone = isPlus ? 'verified' : 'neutral';
  const icon: keyof typeof Ionicons.glyphMap = isPlus ? 'shield-checkmark' : 'checkmark-circle';

  if (compact) {
    return (
      <View
        className={cn(
          'h-5 w-5 items-center justify-center rounded-full bg-verified-soft',
          className,
        )}
      >
        <Ionicons name={icon} size={13} color={colors.verified} />
      </View>
    );
  }
  return <Badge label={LEVEL_LABEL[level]} tone={tone} icon={icon} className={className} />;
}

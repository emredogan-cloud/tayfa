import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { colors } from './tokens';
import { Text } from './Text';
import { Button } from './Button';

type StateTone = 'ember' | 'grape' | 'verified' | 'amber' | 'neutral';

const TONE: Record<StateTone, { bg: string; fg: string }> = {
  ember: { bg: 'bg-ember-soft', fg: colors.ember },
  grape: { bg: 'bg-grape-soft', fg: colors.grape },
  verified: { bg: 'bg-verified-soft', fg: colors.verified },
  amber: { bg: 'bg-amber-soft', fg: colors.amber },
  neutral: { bg: 'bg-surface-alt', fg: colors.inkMuted },
};

/**
 * Reusable empty / error / done state (redesign `22-empty-state`). Leads with a
 * warm illustration or a soft-haloed glyph, a bold reassurance headline, a calm
 * one-liner, and an optional next-step CTA — so a screen with nothing in it still
 * feels alive and points somewhere, never like a dead end.
 */
export interface EmptyStateProps {
  /** Opaque image handle (require/import id) — takes precedence over `icon`. */
  illustration?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: StateTone;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  illustration,
  icon = 'sparkles',
  tone = 'ember',
  title,
  body,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps): React.ReactElement {
  const t = TONE[tone];
  return (
    <View className={cn('items-center gap-3 px-6 py-12', className)}>
      {illustration ? (
        <Image
          source={illustration}
          style={{ width: 176, height: 176 }}
          contentFit="contain"
          transition={200}
          accessibilityLabel=""
        />
      ) : (
        <View className={cn('h-20 w-20 items-center justify-center rounded-3xl', t.bg)}>
          <Ionicons name={icon} size={34} color={t.fg} />
        </View>
      )}
      <Text variant="h1" className="text-center">
        {title}
      </Text>
      {body ? (
        <Text variant="callout" className="text-center text-ink-muted">
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} fullWidth={false} onPress={onAction} className="mt-1" />
      ) : null}
    </View>
  );
}

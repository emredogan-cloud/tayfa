import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';
import { colors } from './tokens';
import { Text } from './Text';

/**
 * Interest chip. Doubles as the taste-card selector (onboarding) and the
 * mutual-interest tag on feed/event cards. `mutual` highlights interests the
 * viewer shares with the event — the core "why you'd click" signal.
 */
export interface ChipProps {
  label: string;
  selected?: boolean;
  /** Shared with the viewer — render with the warm "spark" treatment. */
  mutual?: boolean;
  onPress?: () => void;
  className?: string;
}

export function Chip({
  label,
  selected = false,
  mutual = false,
  onPress,
  className,
}: ChipProps): React.ReactElement {
  const content = (
    <View
      className={cn(
        'flex-row items-center gap-1 rounded-full border px-3 py-1.5',
        selected
          ? 'border-ember bg-ember'
          : mutual
            ? 'border-ember-soft bg-ember-soft'
            : 'border-line bg-surface-alt',
        className,
      )}
    >
      {mutual && !selected ? <Ionicons name="sparkles" size={12} color={colors.ember} /> : null}
      {selected ? <Ionicons name="checkmark" size={13} color={colors.inkInverse} /> : null}
      <Text
        variant="subhead"
        className={cn(
          selected ? 'text-ink-inverse' : mutual ? 'text-ember-dark' : 'text-ink-muted',
        )}
      >
        {label}
      </Text>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="active:opacity-80"
    >
      {content}
    </Pressable>
  );
}

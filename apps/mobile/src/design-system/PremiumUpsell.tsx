import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';
import { colors, shadows } from './tokens';
import { Text } from './Text';

/**
 * Tayfa+ upsell banner (grape). Premium buys *visibility & reach* — more
 * matches, early access, advanced sub-genre filters. It NEVER gates safety
 * (women-only/verified-only filters, report/block stay free). `onPress` routes
 * to the in-app paywall; it must never trigger billing directly.
 */
export interface PremiumUpsellProps {
  title: string;
  body: string;
  onPress: () => void;
  /** Subtle = lighter grape-soft card (event detail); default = solid grape. */
  variant?: 'solid' | 'soft';
  className?: string;
}

export function PremiumUpsell({
  title,
  body,
  onPress,
  variant = 'solid',
  className,
}: PremiumUpsellProps): React.ReactElement {
  const solid = variant === 'solid';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
      onPress={onPress}
      style={solid ? shadows.card : undefined}
      className={cn(
        'flex-row items-center gap-3 rounded-2xl p-3.5 active:opacity-90',
        solid ? 'bg-grape' : 'border border-grape-soft bg-grape-soft',
        className,
      )}
    >
      <View
        className={cn(
          'h-11 w-11 items-center justify-center rounded-full',
          solid ? 'bg-white/20' : 'bg-grape',
        )}
      >
        <Ionicons name="diamond" size={20} color={solid ? colors.inkInverse : colors.inkInverse} />
      </View>
      <View className="flex-1">
        <Text variant="bodyStrong" className={solid ? 'text-ink-inverse' : 'text-ink'}>
          {title}
        </Text>
        <Text variant="footnote" className={solid ? 'text-white/80' : 'text-ink-muted'}>
          {body}
        </Text>
      </View>
      {solid ? (
        <View className="flex-row items-center gap-1 rounded-full bg-surface px-3 py-2">
          <Ionicons name="diamond" size={13} color={colors.grape} />
          <Text variant="subhead" className="font-bold text-grape">
            Upgrade
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center gap-1 rounded-full bg-grape px-3 py-2">
          <Ionicons name="sparkles" size={13} color={colors.inkInverse} />
          <Text variant="subhead" className="font-bold text-ink-inverse">
            Upgrade
          </Text>
        </View>
      )}
    </Pressable>
  );
}

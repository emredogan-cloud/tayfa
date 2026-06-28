import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { colors } from './tokens';
import { Text } from './Text';

/**
 * Liquidity banner — "12 events near you this week". This is the single most
 * important trust signal on a marketplace feed: it proves the place is alive
 * before the user scrolls. When supply is thin we soften the copy and surface
 * the widened radius instead of showing a ghost town.
 */
export interface LiquidityBannerProps {
  eventsThisWeek: number;
  radiusMeters: number;
  widened?: boolean;
  className?: string;
}

function formatRadius(meters: number): string {
  return meters >= 1000 ? `${Math.round(meters / 1000)} km` : `${meters} m`;
}

export function LiquidityBanner({
  eventsThisWeek,
  radiusMeters,
  widened = false,
  className,
}: LiquidityBannerProps): React.ReactElement {
  const lively = eventsThisWeek >= 8;
  return (
    <View
      className={cn(
        'flex-row items-center gap-3 rounded-2xl border px-4 py-3',
        lively ? 'border-ember-soft bg-ember-soft' : 'border-amber-soft bg-amber-soft',
        className,
      )}
    >
      <View
        className={cn(
          'h-9 w-9 items-center justify-center rounded-full',
          lively ? 'bg-ember' : 'bg-amber',
        )}
      >
        <Ionicons name={lively ? 'flame' : 'compass'} size={18} color={colors.inkInverse} />
      </View>
      <View className="flex-1">
        <Text variant="bodyStrong" className={lively ? 'text-ember-dark' : 'text-ink'}>
          {eventsThisWeek} {eventsThisWeek === 1 ? 'meetup' : 'meetups'} near you this week
        </Text>
        <Text variant="footnote" className="text-ink-muted">
          {widened
            ? `We widened the search to ${formatRadius(radiusMeters)} to find more`
            : `Within ${formatRadius(radiusMeters)} of you`}
        </Text>
      </View>
    </View>
  );
}

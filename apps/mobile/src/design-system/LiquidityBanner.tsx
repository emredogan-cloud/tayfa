import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { colors } from './tokens';
import { Text } from './Text';

/**
 * Liquidity banner — "42 meetups near you this week". This is the single most
 * important trust signal on a marketplace feed: it proves the place is alive
 * before the user scrolls. When supply is thin we soften the copy and surface
 * the widened radius instead of showing a ghost town. An optional illustration
 * (passed as an opaque image handle) bleeds off the right edge.
 */
export interface LiquidityBannerProps {
  eventsThisWeek: number;
  radiusMeters: number;
  widened?: boolean;
  /** Opaque image source (require/import id) shown on the right. */
  illustration?: number;
  className?: string;
}

function formatRadius(meters: number): string {
  return meters >= 1000 ? `${Math.round(meters / 1000)} km` : `${meters} m`;
}

export function LiquidityBanner({
  eventsThisWeek,
  radiusMeters,
  widened = false,
  illustration,
  className,
}: LiquidityBannerProps): React.ReactElement {
  const lively = eventsThisWeek >= 8;
  return (
    <View
      className={cn(
        'relative min-h-[104px] justify-center overflow-hidden rounded-2xl border',
        lively ? 'border-ember-soft bg-ember-soft' : 'border-amber-soft bg-amber-soft',
        className,
      )}
    >
      {illustration ? (
        <Image
          source={illustration}
          style={{ position: 'absolute', right: -8, bottom: 0, width: 188, height: 104 }}
          contentFit="contain"
          contentPosition="bottom"
          transition={200}
          accessibilityLabel=""
        />
      ) : null}

      <View className="flex-row items-center gap-3 px-4 py-3 pr-40">
        <View
          className={cn(
            'h-12 w-12 items-center justify-center rounded-full',
            lively ? 'bg-ember' : 'bg-amber',
          )}
        >
          <Ionicons name={lively ? 'water' : 'compass'} size={22} color={colors.inkInverse} />
        </View>
        <View className="flex-1">
          <Text variant="h2" className="text-ink">
            {eventsThisWeek} {eventsThisWeek === 1 ? 'meetup' : 'meetups'} near you this week
          </Text>
          <Text variant="footnote" className="mt-0.5 text-ink-muted">
            {widened
              ? `We widened the search to ${formatRadius(radiusMeters)} to find more`
              : `Within ${formatRadius(radiusMeters)} of you`}
          </Text>
        </View>
      </View>
    </View>
  );
}

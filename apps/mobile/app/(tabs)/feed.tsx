import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, Modal, Pressable, RefreshControl, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { FeedQuery } from '@tayfa/shared/schemas';
import type { FeedEvent } from '@tayfa/shared/types';
import { DISCOVERY } from '@tayfa/shared/constants';
import { useFeed } from '@/api';
import {
  Button,
  Card,
  colors,
  LiquidityBanner,
  PremiumUpsell,
  Screen,
  shadows,
  Text,
  Toggle,
} from '@/design-system';
import { EventCard } from '@/components/EventCard';
import { cn } from '@/lib/cn';
import { illustrations } from '@/lib/illustrations';
import { track } from '@/lib/analytics';
import { useNearbyCenter } from '@/lib/useLocation';
import { useSession } from '@/stores/session';

function SafetyPill({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={cn(
        'h-11 flex-row items-center gap-1.5 rounded-full border px-4 active:opacity-80',
        active ? 'border-ember bg-ember' : 'border-line bg-surface',
      )}
    >
      <Ionicons name={icon} size={16} color={active ? colors.inkInverse : colors.inkMuted} />
      <Text
        variant="subhead"
        className={cn('font-semibold', active ? 'text-ink-inverse' : 'text-ink')}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Ranked discovery feed (P2) — the home surface (redesign `07-feed`). Liquidity
 * banner up top proves the place is alive; photo-led cards lead with mutual
 * interest + proximity + who's going. The women-only and verified-only filters
 * are FREE safety filters (never gated); advanced sub-genre filters are premium
 * and rejected server-side for the free tier.
 */
export default function FeedScreen(): React.ReactElement {
  const router = useRouter();
  const { center, usingFallback } = useNearbyCenter();
  const entitlement = useSession((s) => s.entitlement);
  const [womenOnly, setWomenOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const seenFirstView = useRef(false);

  const query = useMemo<FeedQuery>(
    () => ({
      center,
      radiusMeters: DISCOVERY.defaultRadiusMeters,
      ...(womenOnly ? { womenOnly: true } : {}),
      ...(verifiedOnly ? { verifiedOnly: true } : {}),
    }),
    [center, womenOnly, verifiedOnly],
  );

  const feed = useFeed(query);
  const events = feed.data?.events ?? [];
  const isFree = entitlement === 'free';

  useEffect(() => {
    if (feed.data && !seenFirstView.current) {
      seenFirstView.current = true;
      track('feed_first_viewed', { event_count: feed.data.events.length });
    }
  }, [feed.data]);

  function applyWomen(next: boolean): void {
    setWomenOnly(next);
    if (next) track('feed_filter_used', { filter: 'women_only', is_premium_filter: false });
  }
  function applyVerified(next: boolean): void {
    setVerifiedOnly(next);
    if (next) track('feed_filter_used', { filter: 'verified_only', is_premium_filter: false });
  }

  const header = (
    <View className="gap-4 pb-2">
      <View className="flex-row items-start justify-between pt-2">
        <View className="flex-1">
          <Text variant="display">Discover</Text>
          <View className="mt-0.5 flex-row items-center gap-1">
            <Ionicons name="location-outline" size={13} color={colors.inkSubtle} />
            <Text variant="footnote" className="text-ink-subtle">
              {usingFallback ? 'Around Istanbul' : 'Around you'}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.push('/safety-center')}
            accessibilityLabel="Safety Center"
            className="items-center active:opacity-80"
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-verified-soft">
              <Ionicons name="shield-checkmark" size={22} color={colors.verified} />
            </View>
            <Text className="mt-1 text-[11px] font-semibold text-ink-muted">Verified</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/paywall')}
            accessibilityLabel="Tayfa Plus"
            className="items-center active:opacity-80"
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-grape-soft">
              <Ionicons name="sparkles" size={22} color={colors.grape} />
            </View>
            <Text className="mt-1 text-[11px] font-semibold text-ink-muted">Premium</Text>
          </Pressable>
        </View>
      </View>

      {feed.data ? (
        <LiquidityBanner
          eventsThisWeek={feed.data.liquidity.eventsThisWeek}
          radiusMeters={feed.data.liquidity.radiusMeters}
          widened={feed.data.liquidity.widened}
          illustration={illustrations.liquidityPeople}
        />
      ) : null}

      <View className="flex-row items-center gap-2">
        <SafetyPill
          icon="female"
          label="Women only"
          active={womenOnly}
          onPress={() => applyWomen(!womenOnly)}
        />
        <SafetyPill
          icon="shield-checkmark"
          label="Verified only"
          active={verifiedOnly}
          onPress={() => applyVerified(!verifiedOnly)}
        />
        <View className="flex-1" />
        <Pressable
          onPress={() => setFiltersOpen(true)}
          accessibilityLabel="Filters"
          className="h-11 flex-row items-center gap-1.5 rounded-full border border-line bg-surface px-4 active:opacity-80"
        >
          <Ionicons name="options-outline" size={16} color={colors.inkMuted} />
          <Text variant="subhead" className="font-semibold text-ink">
            Filters
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Screen padded={false}>
      <FlatList
        data={events}
        keyExtractor={(item: FeedEvent) => item.id}
        renderItem={({ item }) => (
          <EventCard event={item} onPress={() => router.push(`/event/${item.id}`)} />
        )}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListFooterComponent={
          isFree && events.length > 0 ? (
            <View className="pt-3">
              <PremiumUpsell
                title="More matches. Better vibes."
                body="Premium members get more visibility and early access to new meetups."
                onPress={() => router.push('/paywall')}
              />
            </View>
          ) : null
        }
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefetching}
            onRefresh={() => void feed.refetch()}
            tintColor={colors.ember}
          />
        }
        ListEmptyComponent={
          feed.isLoading ? (
            <View className="items-center py-24">
              <ActivityIndicator color={colors.ember} />
            </View>
          ) : (
            <View className="items-center gap-3 px-6 py-12">
              <Image
                source={illustrations.eventsEmpty}
                style={{ width: 180, height: 180 }}
                contentFit="contain"
                accessibilityLabel=""
              />
              <Text variant="h1" className="text-center">
                Quiet around here
              </Text>
              <Text variant="callout" className="text-center text-ink-muted">
                Be the spark — host the first hangout near you and your crowd will follow.
              </Text>
              <Button
                label="Host a meetup"
                fullWidth={false}
                onPress={() => router.push('/(tabs)/create')}
              />
            </View>
          )
        }
      />

      {/* Filters sheet — free safety filters + a Tayfa+ teaser for advanced ones */}
      <Modal
        visible={filtersOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFiltersOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40"
          accessibilityLabel="Close filters"
          onPress={() => setFiltersOpen(false)}
        />
        <View
          style={shadows.floating}
          className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-canvas px-5 pb-10 pt-3"
        >
          <View className="mb-4 items-center">
            <View className="h-1.5 w-12 rounded-full bg-surface-sunken" />
          </View>
          <Text variant="h1">Filters</Text>
          <Text variant="footnote" className="mt-1 text-ink-muted">
            Safety filters are always free.
          </Text>

          <Card padded={false} className="mt-4 px-4">
            <Toggle
              accent={
                <View className="h-10 w-10 items-center justify-center rounded-full bg-women-soft">
                  <Ionicons name="female" size={18} color={colors.women} />
                </View>
              }
              title="Women only"
              description="See and join meetups that are open to women only."
              value={womenOnly}
              onValueChange={applyWomen}
            />
            <View className="h-px bg-line" />
            <Toggle
              accent={
                <View className="h-10 w-10 items-center justify-center rounded-full bg-verified-soft">
                  <Ionicons name="shield-checkmark" size={18} color={colors.verified} />
                </View>
              }
              title="Verified only"
              description="Only show meetups hosted by ID-verified members."
              value={verifiedOnly}
              onValueChange={applyVerified}
            />
          </Card>

          <Pressable
            onPress={() => {
              setFiltersOpen(false);
              router.push('/paywall');
            }}
            className="mt-3 flex-row items-center gap-3 rounded-2xl border border-grape-soft bg-grape-soft p-3.5 active:opacity-90"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-grape">
              <Ionicons name="options" size={18} color={colors.inkInverse} />
            </View>
            <View className="flex-1">
              <Text variant="bodyStrong" className="text-ink">
                Advanced filters
              </Text>
              <Text variant="footnote" className="text-ink-muted">
                Filter by sub-genre, time and distance with Tayfa+.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.grape} />
          </Pressable>

          <Button label="Show meetups" className="mt-4" onPress={() => setFiltersOpen(false)} />
        </View>
      </Modal>
    </Screen>
  );
}

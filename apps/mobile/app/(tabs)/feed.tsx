import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { FeedQuery } from '@tayfa/shared/schemas';
import type { FeedEvent } from '@tayfa/shared/types';
import { DISCOVERY } from '@tayfa/shared/constants';
import { useFeed } from '@/api';
import { Button, Chip, colors, LiquidityBanner, Screen, Text } from '@/design-system';
import { EventCard } from '@/components/EventCard';
import { track } from '@/lib/analytics';
import { useNearbyCenter } from '@/lib/useLocation';

/**
 * Ranked discovery feed (P2) — the home surface. Liquidity banner up top proves
 * the place is alive; cards lead with mutual interest + proximity + who's going.
 * The women-only and verified-only filters are FREE safety filters (never gated);
 * advanced sub-genre filters are premium and rejected server-side for free tier.
 */
export default function FeedScreen(): React.ReactElement {
  const router = useRouter();
  const { center, usingFallback } = useNearbyCenter();
  const [womenOnly, setWomenOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
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

  useEffect(() => {
    if (feed.data && !seenFirstView.current) {
      seenFirstView.current = true;
      track('feed_first_viewed', { event_count: feed.data.events.length });
    }
  }, [feed.data]);

  function toggleWomen(): void {
    const next = !womenOnly;
    setWomenOnly(next);
    if (next) track('feed_filter_used', { filter: 'women_only', is_premium_filter: false });
  }
  function toggleVerified(): void {
    const next = !verifiedOnly;
    setVerifiedOnly(next);
    if (next) track('feed_filter_used', { filter: 'verified_only', is_premium_filter: false });
  }

  const header = (
    <View className="gap-4 pb-2">
      <View className="flex-row items-center justify-between pt-2">
        <View>
          <Text variant="display">Discover</Text>
          <Text variant="footnote" className="text-ink-subtle">
            {usingFallback ? 'Around Istanbul' : 'Around you'}
          </Text>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => router.push('/safety-center')}
            accessibilityLabel="Safety Center"
            className="h-11 w-11 items-center justify-center rounded-full bg-verified-soft active:opacity-80"
          >
            <Ionicons name="shield-checkmark" size={20} color={colors.verified} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/paywall')}
            accessibilityLabel="Tayfa Plus"
            className="h-11 w-11 items-center justify-center rounded-full bg-grape-soft active:opacity-80"
          >
            <Ionicons name="sparkles" size={20} color={colors.grape} />
          </Pressable>
        </View>
      </View>

      {feed.data ? (
        <LiquidityBanner
          eventsThisWeek={feed.data.liquidity.eventsThisWeek}
          radiusMeters={feed.data.liquidity.radiusMeters}
          widened={feed.data.liquidity.widened}
        />
      ) : null}

      <View className="flex-row gap-2">
        <Chip label="Women only" mutual={womenOnly} selected={womenOnly} onPress={toggleWomen} />
        <Chip
          label="Verified only"
          mutual={verifiedOnly}
          selected={verifiedOnly}
          onPress={toggleVerified}
        />
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
            <View className="items-center gap-4 px-6 py-20">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-ember-soft">
                <Ionicons name="add" size={28} color={colors.ember} />
              </View>
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
    </Screen>
  );
}

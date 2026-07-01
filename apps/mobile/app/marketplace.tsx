import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ticketingState } from '@tayfa/shared/domain';
import { useMarketplace } from '@/api';
import type { MarketplaceListing } from '@/api';
import { Badge, Card, Chip, colors, EmptyState, Screen, Text } from '@/design-system';
import { formatEventWhen, formatMinor, formatStartsIn } from '@/lib/format';

/** Label for a listing — sponsored content is ALWAYS disclosed (sponsored ≠ hidden). */
function listingLabel(item: MarketplaceListing): {
  text: string;
  tone: 'grape' | 'amber' | 'neutral';
} {
  if (item.sponsored)
    return { text: `Sponsored · ${item.sponsorName ?? 'Partner'}`, tone: 'grape' };
  if (item.kind === 'featured') return { text: 'Featured', tone: 'amber' };
  return { text: 'Ticketed', tone: 'neutral' };
}

/**
 * Marketplace (P10). Ticketed workshops, featured meetups and venue/brand
 * partners. Two invariants from the shared policy are visible here: sponsored
 * content is ALWAYS clearly labeled + disclosed (never disguised as peer
 * content), and every listing clears the SAME safety review as organic events.
 */
export default function MarketplaceScreen(): React.ReactElement {
  const router = useRouter();
  const query = useMarketplace();
  const listings = query.data?.listings ?? [];

  const header = (
    <View className="gap-4 pb-2">
      <View className="flex-row items-center gap-3 pt-1">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Text variant="h1" className="flex-1">
          Marketplace
        </Text>
      </View>
      <Card className="flex-row items-start gap-3 border-verified-soft bg-verified-soft">
        <Ionicons name="shield-checkmark" size={20} color={colors.verified} />
        <Text variant="footnote" className="flex-1 text-ink">
          Ticketed workshops and partner events — every one clears the same safety review as
          everything on Tayfa, and sponsored content is always clearly labeled.
        </Text>
      </Card>
    </View>
  );

  return (
    <Screen padded={false}>
      <FlatList
        data={listings}
        keyExtractor={(l: MarketplaceListing) => l.id}
        renderItem={({ item }) => <ListingCard item={item} />}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View className="h-3" />}
        contentContainerClassName="px-5 pb-10 pt-2"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          query.isLoading ? (
            <View className="items-center py-24">
              <ActivityIndicator color={colors.ember} />
            </View>
          ) : (
            <EmptyState
              icon="storefront-outline"
              tone="grape"
              title="Nothing on sale nearby yet"
              body="Ticketed workshops and partner events will show up here as they open."
            />
          )
        }
      />
    </Screen>
  );
}

function ListingCard({ item }: { item: MarketplaceListing }): React.ReactElement {
  const label = listingLabel(item);
  const tickets = ticketingState(item.capacityMax, item.sold);
  const free = item.priceMinor === 0;

  function getTicket(): void {
    Alert.alert(
      tickets.soldOut ? 'Join waitlist' : 'Get a ticket',
      'Secure checkout for marketplace tickets is coming soon.',
    );
  }

  return (
    <Card className="gap-3">
      <View className="flex-row items-center justify-between">
        <Badge label={label.text} tone={label.tone} icon={item.sponsored ? 'pricetag' : 'star'} />
        <View className="flex-row items-center gap-1">
          <Ionicons name="shield-checkmark" size={12} color={colors.verified} />
          <Text variant="caption" className="text-verified">
            Safety-reviewed
          </Text>
        </View>
      </View>

      <View className="gap-1">
        <Text variant="h2">{item.title}</Text>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="business-outline" size={13} color={colors.inkSubtle} />
          <Text variant="footnote" className="text-ink-muted">
            {item.venueName} · {item.neighborhood}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="calendar-outline" size={13} color={colors.inkSubtle} />
          <Text variant="footnote" className="text-ink-muted">
            {formatEventWhen(item.startsAt)} · {formatStartsIn(item.startsAt)}
          </Text>
        </View>
      </View>

      <View className="flex-row">
        <Chip label={item.category} />
      </View>

      <View className="flex-row items-center justify-between border-t border-line pt-3">
        <View>
          <Text variant="title" className="text-ink">
            {free ? 'Free' : formatMinor(item.priceMinor, item.currency)}
          </Text>
          <Text
            variant="footnote"
            className={tickets.soldOut ? 'text-ink-subtle' : 'font-semibold text-verified'}
          >
            {tickets.soldOut
              ? 'Sold out · waitlist open'
              : `${tickets.remaining} ${tickets.remaining === 1 ? 'ticket' : 'tickets'} left`}
          </Text>
        </View>
        <Pressable
          onPress={getTicket}
          accessibilityRole="button"
          className={`flex-row items-center gap-1.5 rounded-full px-5 py-3 active:opacity-90 ${
            tickets.soldOut ? 'bg-surface-sunken' : 'bg-ember'
          }`}
        >
          <Ionicons
            name={tickets.soldOut ? 'hourglass-outline' : 'ticket'}
            size={16}
            color={tickets.soldOut ? colors.inkMuted : colors.inkInverse}
          />
          <Text
            variant="bodyStrong"
            className={tickets.soldOut ? 'text-ink-muted' : 'text-ink-inverse'}
          >
            {tickets.soldOut ? 'Waitlist' : 'Get ticket'}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

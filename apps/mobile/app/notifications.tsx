import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { NotificationCategory } from '@tayfa/shared/constants';
import { useNotifications, useMarkNotificationsRead } from '@/api';
import type { NotificationItem } from '@/api';
import { colors, EmptyState, Screen, Text } from '@/design-system';
import { cn } from '@/lib/cn';

const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; soft: string }
> = {
  your_plans: { label: 'Your plans', icon: 'calendar', color: colors.ember, soft: 'bg-ember-soft' },
  social: {
    label: 'Social',
    icon: 'chatbubble-ellipses',
    color: colors.grape,
    soft: 'bg-grape-soft',
  },
  discovery: { label: 'Discovery', icon: 'compass', color: colors.amber, soft: 'bg-amber-soft' },
  lifecycle: { label: 'Tayfa', icon: 'sparkles', color: colors.verified, soft: 'bg-verified-soft' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.round(d / 7)}w ago`;
}

/**
 * Notification Center (P8, new). Renders the already-sent notification ledger
 * grouped by the four GROWTH categories. Frequency caps and the
 * "would-a-friend-text-this" bar are enforced server-side; here we only display
 * and track opens. Tapping a plan/social item deep-links to its meetup.
 */
export default function NotificationsScreen(): React.ReactElement {
  const router = useRouter();
  const query = useNotifications();
  const mark = useMarkNotificationsRead();

  const data = query.data;
  const items = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  function open(n: NotificationItem): void {
    if (n.readAt === null) mark.mutate([n.id]);
    if (n.eventId) router.push(`/event/${n.eventId}`);
  }

  const header = (
    <View className="flex-row items-center gap-3 px-1 pb-2 pt-1">
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityLabel="Go back"
        className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
      >
        <Ionicons name="chevron-back" size={22} color={colors.ink} />
      </Pressable>
      <Text variant="h1" className="flex-1">
        Notifications
      </Text>
      {unread > 0 ? (
        <Pressable onPress={() => mark.mutate([])} hitSlop={8} className="active:opacity-70">
          <Text variant="subhead" className="font-bold text-ember">
            Mark all read
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <Screen padded={false}>
      <FlatList
        data={items}
        keyExtractor={(n: NotificationItem) => n.id}
        renderItem={({ item }) => <NotificationRow item={item} onPress={() => open(item)} />}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View className="h-2" />}
        contentContainerClassName="px-4 pb-10 pt-2"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          query.isLoading ? (
            <View className="items-center py-24">
              <ActivityIndicator color={colors.ember} />
            </View>
          ) : (
            <EmptyState
              icon="notifications-outline"
              tone="grape"
              title="You're all caught up"
              body="New RSVPs, messages and meetups near you will show up here."
            />
          )
        }
        ListFooterComponent={
          items.length > 0 ? (
            <View className="mt-4 flex-row items-start gap-2 px-1">
              <Ionicons name="shield-checkmark" size={14} color={colors.verified} />
              <Text variant="footnote" className="flex-1 text-ink-subtle">
                Tayfa keeps it quiet — a couple of notifications a day, tops. Safety alerts always
                come through.
              </Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: () => void;
}): React.ReactElement {
  const meta = CATEGORY_META[item.category];
  const unread = item.readAt === null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={cn(
        'flex-row items-start gap-3 rounded-2xl border p-3.5 active:opacity-90',
        unread ? 'border-ember-soft bg-ember-soft' : 'border-line bg-surface',
      )}
    >
      <View className={cn('h-11 w-11 items-center justify-center rounded-full', meta.soft)}>
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text variant="bodyStrong" className="flex-1 text-ink">
            {item.title}
          </Text>
          {unread ? <View className="h-2.5 w-2.5 rounded-full bg-ember" /> : null}
        </View>
        <Text variant="footnote" className="mt-0.5 text-ink-muted">
          {item.body}
        </Text>
        <Text variant="caption" className="mt-1.5 text-ink-subtle">
          {meta.label} · {timeAgo(item.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

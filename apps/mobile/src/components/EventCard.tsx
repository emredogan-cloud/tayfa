import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import type { FeedEvent } from '@tayfa/shared/types';
import { Avatar, Badge, Card, Chip, colors, Text, VerifiedBadge } from '@/design-system';
import { eventImage } from '@/lib/eventImage';
import { formatDistance, formatEventWhen, formatStartsIn } from '@/lib/format';

/**
 * The feed's hero unit (redesign `07-feed` / `09-event-card`). A photo-led
 * horizontal card: category tile on the left, host trust + title + when/where +
 * mutual interests on the right, and a footer band with capacity + an
 * expandable "why you're seeing this" ranking rationale so discovery feels
 * transparent, not algorithmic.
 */
export interface EventCardProps {
  event: FeedEvent;
  onPress: () => void;
}

function whyText(event: FeedEvent): string {
  const top = event.sharedInterests[0]?.label;
  const n = event.ranking.mutualInterestCount;
  if (top && n > 1) return `You both like ${top} +${n - 1} more`;
  if (top) return `You both like ${top}`;
  return 'Popular with people near you this week';
}

export function EventCard({ event, onPress }: EventCardProps): React.ReactElement {
  const [showWhy, setShowWhy] = useState(false);
  const [saved, setSaved] = useState(false);
  const img = eventImage(event);
  const spotsLeft = Math.max(0, event.capacity.max - event.capacity.going);
  const isFull = event.status === 'full' || spotsLeft === 0;
  const chips = event.sharedInterests.slice(0, 2);
  const topHost = event.host.reliabilityScore >= 90;
  const matchPct = Math.max(0, Math.min(100, Math.round(event.ranking.interestSimilarity * 100)));

  return (
    <Card padded={false} className="overflow-hidden">
      <Pressable onPress={onPress} className="flex-row active:opacity-95">
        {/* Category tile */}
        <View className="relative w-32 self-stretch">
          <Image
            source={img.source}
            style={{ width: '100%', height: '100%', minHeight: 172 }}
            contentFit="cover"
            transition={150}
            accessibilityLabel=""
          />
          <View className="absolute bottom-2 left-2 flex-row items-center gap-1 rounded-full bg-black/55 px-2 py-1">
            <Ionicons name={img.scene.icon} size={11} color="#FFFFFF" />
            <Text className="text-[11px] font-semibold text-white">{img.scene.label}</Text>
          </View>
        </View>

        {/* Details */}
        <View className="flex-1 gap-2 p-3">
          <View className="flex-row items-start gap-2">
            <Avatar name={event.host.displayName} uri={event.host.avatarUrl} size="sm" />
            <View className="flex-1">
              <View className="flex-row items-center gap-1">
                <Text variant="subhead" className="font-bold text-ink">
                  {event.host.displayName}
                </Text>
                <VerifiedBadge level={event.host.verificationLevel} compact />
              </View>
              <View className="mt-0.5 flex-row flex-wrap items-center gap-1.5">
                <Text variant="footnote" className="font-semibold text-verified">
                  Reliability {Math.round(event.host.reliabilityScore)}
                </Text>
                {topHost ? <Badge label="Top Host" tone="amber" icon="star" /> : null}
              </View>
            </View>
            <Pressable
              onPress={() => setSaved((v) => !v)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={saved ? 'Saved' : 'Save meetup'}
            >
              <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={colors.ember} />
            </Pressable>
          </View>

          <Text variant="h2" className="text-ink">
            {event.title}
          </Text>

          <View className="gap-1">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="calendar-outline" size={13} color={colors.inkSubtle} />
              <Text variant="footnote" className="text-ink-muted">
                {formatEventWhen(event.startsAt)} · {formatStartsIn(event.startsAt)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="location-outline" size={13} color={colors.inkSubtle} />
              <Text variant="footnote" className="text-ink-muted">
                {event.location.neighborhood ?? 'Nearby'} ·{' '}
                {formatDistance(event.ranking.distanceMeters)}
              </Text>
            </View>
          </View>

          {chips.length > 0 ? (
            <View className="flex-row flex-wrap gap-1.5">
              {chips.map((i) => (
                <Chip key={i.id} label={i.label} mutual />
              ))}
            </View>
          ) : null}
        </View>
      </Pressable>

      {/* Footer band — capacity + ranking rationale */}
      <View className="border-t border-line px-3 py-2.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Ionicons
              name={isFull ? 'people' : 'people-outline'}
              size={15}
              color={isFull ? colors.inkSubtle : colors.verified}
            />
            <Text
              variant="footnote"
              className={isFull ? 'font-bold text-ink-subtle' : 'font-bold text-verified'}
            >
              {isFull
                ? `${event.capacity.going} going · full`
                : `${event.capacity.going} going · ${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} left`}
            </Text>
          </View>
          <Pressable
            onPress={() => setShowWhy((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            className="flex-row items-center gap-1 active:opacity-70"
          >
            <Ionicons name="sparkles" size={13} color={colors.ember} />
            <Text variant="footnote" className="font-semibold text-ember">
              Why you&apos;re seeing this
            </Text>
            <Ionicons
              name={showWhy ? 'chevron-up' : 'chevron-forward'}
              size={13}
              color={colors.ember}
            />
          </Pressable>
        </View>

        {showWhy ? (
          <View className="mt-2.5 flex-row items-center gap-2.5 rounded-2xl bg-surface-alt p-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-amber-soft">
              <Ionicons name="sparkles" size={16} color={colors.amber} />
            </View>
            <View className="flex-1">
              <Text variant="subhead" className="font-semibold text-ink">
                {whyText(event)}
              </Text>
              <Text variant="footnote" className="text-ink-subtle">
                Interest match {matchPct}% · {formatDistance(event.ranking.distanceMeters)} ·
                soonness boost
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

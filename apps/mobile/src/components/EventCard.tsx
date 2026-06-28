import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import type { FeedEvent } from '@tayfa/shared/types';
import { Avatar, Badge, Card, Chip, colors, Text, VerifiedBadge } from '@/design-system';
import { formatDistance, formatEventWhen, formatGoing, formatStartsIn } from '@/lib/format';

/**
 * The feed's hero unit. Leads with WHY this stranger's hangout is for you —
 * mutual interests + proximity + who's going — and exposes the ranking rationale
 * ("why you're seeing this") so discovery feels transparent, not algorithmic.
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
  const isFull = event.status === 'full' || event.capacity.going >= event.capacity.max;
  const chips = event.sharedInterests.slice(0, 3);

  return (
    <Card onPress={onPress} className="gap-3">
      {/* Host + trust */}
      <View className="flex-row items-center gap-2">
        <Avatar name={event.host.displayName} uri={event.host.avatarUrl} size="sm" />
        <View className="flex-1">
          <View className="flex-row items-center gap-1">
            <Text variant="subhead" className="text-ink">
              {event.host.displayName}
            </Text>
            <VerifiedBadge level={event.host.verificationLevel} compact />
          </View>
          <Text variant="footnote" className="text-ink-subtle">
            Reliability {Math.round(event.host.reliabilityScore)}
          </Text>
        </View>
        {event.visibility === 'interest_match' ? (
          <Badge label="Match" tone="ember" icon="sparkles" />
        ) : event.visibility === 'invite' ? (
          <Badge label="Invite" tone="grape" icon="lock-closed" />
        ) : null}
      </View>

      {/* Title */}
      <Text variant="h2">{event.title}</Text>

      {/* When / where / going */}
      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
        <View className="flex-row items-center gap-1">
          <Ionicons name="time-outline" size={14} color={colors.inkMuted} />
          <Text variant="footnote" className="text-ink-muted">
            {formatEventWhen(event.startsAt)} · {formatStartsIn(event.startsAt)}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="location-outline" size={14} color={colors.inkMuted} />
          <Text variant="footnote" className="text-ink-muted">
            {event.location.neighborhood ?? 'Nearby'} ·{' '}
            {formatDistance(event.ranking.distanceMeters)}
          </Text>
        </View>
      </View>

      {/* Mutual-interest chips */}
      {chips.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {chips.map((i) => (
            <Chip key={i.id} label={i.label} mutual />
          ))}
        </View>
      ) : null}

      {/* Going + Why */}
      <View className="flex-row items-center justify-between">
        <Badge
          label={formatGoing(event.capacity)}
          tone={isFull ? 'neutral' : 'success'}
          icon={isFull ? 'people' : 'people-outline'}
        />
        <Pressable
          onPress={() => setShowWhy((v) => !v)}
          hitSlop={8}
          className="flex-row items-center gap-1 active:opacity-70"
        >
          <Ionicons name="sparkles-outline" size={13} color={colors.ember} />
          <Text variant="footnote" className="text-ember">
            Why you're seeing this
          </Text>
          <Ionicons name={showWhy ? 'chevron-up' : 'chevron-down'} size={13} color={colors.ember} />
        </Pressable>
      </View>

      {showWhy ? (
        <View className="gap-1 rounded-lg bg-surface-alt p-3">
          <Text variant="footnote" className="text-ink">
            {whyText(event)}
          </Text>
          <Text variant="footnote" className="text-ink-subtle">
            Interest match {Math.round(event.ranking.interestSimilarity * 100)}% ·{' '}
            {formatDistance(event.ranking.distanceMeters)} · soonness boost
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

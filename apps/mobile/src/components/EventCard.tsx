import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import type { FeedEvent } from '@tayfa/shared/types';
import { Avatar, Button, Card, Chip, colors, Text, VerifiedBadge } from '@/design-system';
import { eventImage } from '@/lib/eventImage';
import { formatDistance, formatEventWhen, formatStartsIn } from '@/lib/format';

/**
 * The feed's hero unit (redesign `09-event-card` / `21b` / `25`). Host trust up
 * top (avatar + name + verified + a qualitative reliability pill), a photo
 * thumbnail on the right, when/where + mutual-interest chips, a green "who's
 * going" band that doubles as the expandable "why this?" ranking rationale, and a
 * Save + View details footer. Discovery stays transparent, never a black box.
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

/** Qualitative reliability label — mirrors the mockup's green "Great" pill. */
function reliabilityLabel(score: number): string {
  if (score >= 80) return 'Great';
  if (score >= 65) return 'Good';
  if (score >= 45) return 'Fair';
  return 'New';
}

export function EventCard({ event, onPress }: EventCardProps): React.ReactElement {
  const [showWhy, setShowWhy] = useState(false);
  const [saved, setSaved] = useState(false);
  const img = eventImage(event);
  const spotsLeft = Math.max(0, event.capacity.max - event.capacity.going);
  const isFull = event.status === 'full' || spotsLeft === 0;
  const chips = event.sharedInterests.slice(0, 2);
  const score = Math.round(event.host.reliabilityScore);
  const matchPct = Math.max(0, Math.min(100, Math.round(event.ranking.interestSimilarity * 100)));

  return (
    <Card className="gap-3">
      <Pressable onPress={onPress} className="gap-3 active:opacity-95">
        <View className="flex-row gap-3">
          {/* Left column: host + title + when/where */}
          <View className="flex-1 gap-2">
            <View className="flex-row items-center gap-2">
              <Avatar name={event.host.displayName} uri={event.host.avatarUrl} size="sm" />
              <View className="flex-1">
                <View className="flex-row items-center gap-1">
                  <Text variant="bodyStrong" numberOfLines={1} className="text-ink">
                    {event.host.displayName}
                  </Text>
                  <VerifiedBadge level={event.host.verificationLevel} compact />
                </View>
                <View className="mt-0.5 flex-row items-center gap-1.5">
                  <Text variant="footnote" className="text-ink-muted">
                    Reliability {score}
                  </Text>
                  <View className="rounded-full bg-success-soft px-2 py-0.5">
                    <Text variant="caption" className="text-success">
                      {reliabilityLabel(score)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <Text variant="h2" numberOfLines={2} className="text-ink">
              {event.title}
            </Text>

            <View className="gap-1">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="calendar-outline" size={13} color={colors.inkSubtle} />
                <Text variant="footnote" className="flex-1 text-ink-muted">
                  {formatEventWhen(event.startsAt)} · {formatStartsIn(event.startsAt)}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="location-outline" size={13} color={colors.inkSubtle} />
                <Text variant="footnote" className="flex-1 text-ink-muted">
                  {event.location.neighborhood ?? 'Nearby'} ·{' '}
                  {formatDistance(event.ranking.distanceMeters)}
                </Text>
              </View>
            </View>
          </View>

          {/* Photo thumbnail */}
          <Image
            source={img.source}
            style={{ width: 104, height: 104, borderRadius: 18 }}
            contentFit="cover"
            transition={150}
            accessibilityLabel=""
          />
        </View>

        {chips.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {chips.map((i) => (
              <Chip key={i.id} label={i.label} mutual />
            ))}
          </View>
        ) : null}
      </Pressable>

      {/* Who's going band — also the "why this?" toggle */}
      <Pressable
        onPress={() => setShowWhy((v) => !v)}
        accessibilityRole="button"
        className="flex-row items-center gap-2 rounded-2xl bg-success-soft px-3 py-2.5 active:opacity-90"
      >
        <Ionicons name="people" size={15} color={colors.success} />
        <Text variant="footnote" className="font-bold uppercase text-success">
          {isFull
            ? `${event.capacity.going} going · full`
            : `${event.capacity.going} going · ${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} left`}
        </Text>
        <View className="flex-1" />
        <Ionicons name="sparkles" size={13} color={colors.verified} />
        <Text variant="footnote" className="font-semibold text-verified">
          Why this?
        </Text>
        <Ionicons
          name={showWhy ? 'chevron-up' : 'chevron-forward'}
          size={13}
          color={colors.verified}
        />
      </Pressable>

      {showWhy ? (
        <View className="flex-row items-center gap-2.5 rounded-2xl bg-surface-alt p-3">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-amber-soft">
            <Ionicons name="sparkles" size={16} color={colors.amber} />
          </View>
          <View className="flex-1">
            <Text variant="subhead" className="font-semibold text-ink">
              {whyText(event)}
            </Text>
            <Text variant="footnote" className="text-ink-subtle">
              Interest match {matchPct}% · {formatDistance(event.ranking.distanceMeters)} · soonness
              boost
            </Text>
          </View>
        </View>
      ) : null}

      {/* Footer: Save + View details */}
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => setSaved((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Saved' : 'Save meetup'}
          className="flex-row items-center gap-1.5 px-1.5 py-2 active:opacity-70"
        >
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={colors.ink} />
          <Text variant="subhead" className="font-semibold text-ink">
            Save
          </Text>
        </Pressable>
        <Button
          label="View details"
          className="flex-1"
          onPress={onPress}
          rightIcon={<Ionicons name="chevron-forward" size={18} color={colors.inkInverse} />}
        />
      </View>
    </Card>
  );
}

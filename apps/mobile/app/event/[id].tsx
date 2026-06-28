import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { RsvpStatus } from '@tayfa/shared/types';
import { initialRsvpStatus } from '@tayfa/shared/domain';
import { PRECISE_LOCATION_RELEASE_WINDOW_MINUTES } from '@tayfa/shared/constants';
import type { ReportInput } from '@tayfa/shared/schemas';
import { useEvent, useRsvp, useReport, useBlock } from '@/api';
import type { EventMemberView } from '@/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  colors,
  Screen,
  Text,
  VerifiedBadge,
} from '@/design-system';
import { track } from '@/lib/analytics';
import { formatEventWhen, formatGoing, formatStartsIn } from '@/lib/format';
import { useEffect } from 'react';

const RSVP_BADGE: Partial<
  Record<RsvpStatus, { label: string; tone: 'success' | 'amber' | 'neutral' }>
> = {
  requested: { label: 'Requested', tone: 'amber' },
  approved: { label: 'Approved', tone: 'success' },
  going: { label: 'Going', tone: 'success' },
  attended: { label: 'Attended', tone: 'neutral' },
};

const REPORT_REASONS: ReadonlyArray<{ key: ReportInput['reason']; label: string }> = [
  { key: 'harassment', label: 'Harassment' },
  { key: 'scam', label: 'Scam or money request' },
  { key: 'imminent_harm', label: 'Safety threat' },
  { key: 'spam', label: 'Spam' },
];

/**
 * Event detail. The precise pin is shown ONLY when `preciseLocation` is present —
 * the BFF released it because this viewer is an approved member inside the
 * release window. Otherwise the screen shows the fuzzed neighborhood and an
 * honest note about when the exact spot unlocks. Report/block are always free.
 */
export default function EventDetailScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id ?? '';
  const detail = useEvent(eventId);
  const rsvp = useRsvp(eventId);
  const report = useReport();
  const block = useBlock();

  useEffect(() => {
    if (eventId) track('event_viewed', { event_id: eventId });
  }, [eventId]);

  if (detail.isLoading || !detail.data) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.ember} />
      </Screen>
    );
  }

  const { event, members, viewerRsvpStatus, preciseLocation, viewerIsHost } = detail.data;
  const requiresApproval = initialRsvpStatus(event.visibility) === 'requested';
  const isMember =
    viewerRsvpStatus !== null && viewerRsvpStatus !== 'left' && viewerRsvpStatus !== 'no_show';
  const pendingRequests = members.filter((m) => m.rsvpStatus === 'requested');

  function reportEvent(): void {
    Alert.alert('Report this meetup', 'Why are you reporting it?', [
      ...REPORT_REASONS.map((r) => ({
        text: r.label,
        onPress: () =>
          report.mutate(
            { targetType: 'event', targetId: eventId, reason: r.key },
            { onSuccess: () => Alert.alert('Thanks', 'Our safety team will review this fast.') },
          ),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }

  function blockHost(): void {
    Alert.alert('Block host', `You won't see ${event.host.displayName} or their events again.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () =>
          block.mutate({ blockedUserId: event.host.userId }, { onSuccess: () => router.back() }),
      },
    ]);
  }

  function openOverflow(): void {
    Alert.alert('Safety', undefined, [
      { text: 'Report meetup', onPress: reportEvent },
      { text: 'Block host', style: 'destructive', onPress: blockHost },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const badge = viewerRsvpStatus ? RSVP_BADGE[viewerRsvpStatus] : undefined;

  return (
    <Screen padded={false} edges={['top']}>
      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 py-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Pressable
          onPress={openOverflow}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-40 gap-5" showsVerticalScrollIndicator={false}>
        {/* Title + badges */}
        <View className="gap-2">
          {badge ? (
            <View className="flex-row flex-wrap items-center gap-2">
              <Badge label={badge.label} tone={badge.tone} icon="checkmark-circle" />
            </View>
          ) : null}
          <Text variant="title">{event.title}</Text>
          <Text variant="callout" className="text-ink-muted">
            {formatEventWhen(event.startsAt)} · {formatStartsIn(event.startsAt)}
          </Text>
        </View>

        {/* Host */}
        <Card
          onPress={() => router.push(`/event/${eventId}`)}
          className="flex-row items-center gap-3"
        >
          <Avatar name={event.host.displayName} uri={event.host.avatarUrl} size="md" />
          <View className="flex-1">
            <View className="flex-row items-center gap-1">
              <Text variant="bodyStrong">{event.host.displayName}</Text>
              <VerifiedBadge level={event.host.verificationLevel} compact />
            </View>
            <Text variant="footnote" className="text-ink-muted">
              Host · Reliability {Math.round(event.host.reliabilityScore)}
            </Text>
          </View>
        </Card>

        {/* Location — precise only when released */}
        <Card className="gap-2">
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={preciseLocation ? 'location' : 'lock-closed'}
              size={16}
              color={preciseLocation ? colors.ember : colors.inkSubtle}
            />
            <Text variant="bodyStrong">{preciseLocation ? 'Exact location' : 'Neighborhood'}</Text>
          </View>
          {preciseLocation ? (
            <>
              <Text variant="body">
                {preciseLocation.venueName ?? event.venueName ?? 'Meeting point'}
              </Text>
              {preciseLocation.address ? (
                <Text variant="footnote" className="text-ink-muted">
                  {preciseLocation.address}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <Text variant="body">{event.location.neighborhood ?? 'Around the area'}</Text>
              <Text variant="footnote" className="text-ink-subtle">
                The exact spot unlocks for approved guests about{' '}
                {PRECISE_LOCATION_RELEASE_WINDOW_MINUTES} minutes before it starts. Until then your
                location stays private.
              </Text>
            </>
          )}
        </Card>

        {/* Mutual interests */}
        {event.sharedInterests.length > 0 ? (
          <View className="gap-2">
            <Text variant="caption" className="text-ink-subtle">
              You have in common
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {event.sharedInterests.map((i) => (
                <Chip key={i.id} label={i.label} mutual />
              ))}
            </View>
          </View>
        ) : null}

        {/* Who's going */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text variant="caption" className="text-ink-subtle">
              Who's going
            </Text>
            <Text variant="footnote" className="text-ink-muted">
              {formatGoing(event.capacity)}
            </Text>
          </View>
          <View className="gap-2">
            {members.map((m) => (
              <MemberRow
                key={m.profile.userId}
                member={m}
                showApproval={viewerIsHost && m.rsvpStatus === 'requested'}
                onApprove={() =>
                  rsvp.decide.mutate({ memberUserId: m.profile.userId, decision: 'approve' })
                }
                onReject={() =>
                  rsvp.decide.mutate({ memberUserId: m.profile.userId, decision: 'reject' })
                }
                deciding={rsvp.decide.isPending}
              />
            ))}
          </View>
        </View>

        {/* Host pending summary */}
        {viewerIsHost && pendingRequests.length > 0 ? (
          <Badge
            label={`${pendingRequests.length} waiting for your approval`}
            tone="amber"
            icon="hourglass"
          />
        ) : null}
      </ScrollView>

      {/* Sticky action bar */}
      <View className="absolute inset-x-0 bottom-0 gap-3 border-t border-line bg-canvas px-5 pb-8 pt-4">
        {isMember ? (
          <View className="flex-row gap-3">
            <Button label="Open chat" onPress={() => router.push(`/event/${eventId}/chat`)} />
            <Button
              label="Leave"
              variant="secondary"
              fullWidth={false}
              loading={rsvp.leave.isPending}
              onPress={() => rsvp.leave.mutate()}
            />
          </View>
        ) : (
          <Button
            label={requiresApproval ? 'Request to join' : 'Join meetup'}
            loading={rsvp.join.isPending}
            disabled={event.status === 'full'}
            onPress={() => rsvp.join.mutate()}
          />
        )}
      </View>
    </Screen>
  );
}

function MemberRow({
  member,
  showApproval,
  onApprove,
  onReject,
  deciding,
}: {
  member: EventMemberView;
  showApproval: boolean;
  onApprove: () => void;
  onReject: () => void;
  deciding: boolean;
}): React.ReactElement {
  return (
    <View className="flex-row items-center gap-3">
      <Avatar name={member.profile.displayName} uri={member.profile.avatarUrl} size="sm" />
      <View className="flex-1">
        <View className="flex-row items-center gap-1">
          <Text variant="subhead">{member.profile.displayName}</Text>
          <VerifiedBadge level={member.profile.verificationLevel} compact />
          {member.isHost ? <Badge label="Host" tone="ember" /> : null}
        </View>
      </View>
      {showApproval ? (
        <View className="flex-row gap-2">
          <Pressable
            onPress={onReject}
            disabled={deciding}
            className="h-9 w-9 items-center justify-center rounded-full bg-danger-soft active:opacity-70"
          >
            <Ionicons name="close" size={18} color={colors.danger} />
          </Pressable>
          <Pressable
            onPress={onApprove}
            disabled={deciding}
            className="h-9 w-9 items-center justify-center rounded-full bg-success-soft active:opacity-70"
          >
            <Ionicons name="checkmark" size={18} color={colors.success} />
          </Pressable>
        </View>
      ) : (
        <Badge label={member.rsvpStatus} tone="neutral" />
      )}
    </View>
  );
}

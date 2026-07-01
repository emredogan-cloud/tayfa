import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Pressable, Share, ScrollView, View } from 'react-native';
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
  ConfirmDialog,
  PremiumUpsell,
  ReportReasonDialog,
  SafetyActionsSheet,
  Screen,
  Text,
  VerifiedBadge,
} from '@/design-system';
import { track } from '@/lib/analytics';
import { formatEventWhen, formatGoing, formatStartsIn } from '@/lib/format';
import { useSession } from '@/stores/session';

const RSVP_BADGE: Partial<
  Record<RsvpStatus, { label: string; tone: 'success' | 'amber' | 'neutral' }>
> = {
  requested: { label: 'Requested', tone: 'amber' },
  approved: { label: 'Approved', tone: 'success' },
  going: { label: 'Going', tone: 'success' },
  attended: { label: 'Attended', tone: 'neutral' },
};

const MEMBER_STATUS: Record<
  RsvpStatus,
  { label: string; tone: 'success' | 'grape' | 'amber' | 'neutral' }
> = {
  requested: { label: 'Requested', tone: 'amber' },
  approved: { label: 'Approved', tone: 'grape' },
  going: { label: 'Going', tone: 'success' },
  attended: { label: 'Attended', tone: 'neutral' },
  left: { label: 'Left', tone: 'neutral' },
  no_show: { label: 'No show', tone: 'neutral' },
};

/** Tiny reliability strength indicator (4 bars, filled by score). */
function ReliabilityBars({ score }: { score: number }): React.ReactElement {
  const filled = Math.max(1, Math.min(4, Math.ceil(score / 25)));
  return (
    <View className="flex-row items-end gap-0.5">
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            height: 4 + i * 3,
            backgroundColor: i < filled ? colors.verified : colors.lineStrong,
          }}
          className="w-1 rounded-sm"
        />
      ))}
    </View>
  );
}

/**
 * Event detail (redesign `10-event-detail`). The precise pin is shown ONLY when
 * `preciseLocation` is present — the BFF released it because this viewer is an
 * approved member inside the release window. Otherwise the screen shows the
 * fuzzed neighborhood and an honest note about when the exact spot unlocks.
 * Report/block are always free; the premium nudge is reach-only, never safety.
 */
export default function EventDetailScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id ?? '';
  const detail = useEvent(eventId);
  const rsvp = useRsvp(eventId);
  const report = useReport();
  const block = useBlock();
  const entitlement = useSession((s) => s.entitlement);
  const [saved, setSaved] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<'event' | 'user' | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reportDone, setReportDone] = useState(false);

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
  const isFree = entitlement === 'free';
  const badge = viewerRsvpStatus ? RSVP_BADGE[viewerRsvpStatus] : undefined;

  function submitReport(reason: ReportInput['reason']): void {
    const isUser = reportTarget === 'user';
    report.mutate(
      {
        targetType: isUser ? 'user' : 'event',
        targetId: isUser ? event.host.userId : eventId,
        reason,
      },
      {
        onSuccess: () => {
          setReportTarget(null);
          setReportDone(true);
        },
      },
    );
  }

  function shareEvent(): void {
    void Share.share({
      message: `Join me at "${event.title}" on Tayfa — ${formatEventWhen(event.startsAt)}.`,
    });
  }

  return (
    <Screen padded={false} edges={['top']}>
      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 py-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <View className="flex-row gap-2">
          <Pressable
            onPress={shareEvent}
            hitSlop={8}
            accessibilityLabel="Share meetup"
            className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
          >
            <Ionicons name="share-social-outline" size={19} color={colors.ink} />
          </Pressable>
          <Pressable
            onPress={() => setSafetyOpen(true)}
            hitSlop={8}
            accessibilityLabel="Safety and more options"
            className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-40 gap-5" showsVerticalScrollIndicator={false}>
        {/* Status + title */}
        <View className="gap-2">
          {badge ? (
            <View className="flex-row">
              <Badge label={badge.label.toUpperCase()} tone={badge.tone} icon="checkmark-circle" />
            </View>
          ) : null}
          <Text variant="title">{event.title}</Text>
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="calendar-outline" size={15} color={colors.inkMuted} />
            <Text variant="callout" className="text-ink-muted">
              {formatEventWhen(event.startsAt)} · {formatStartsIn(event.startsAt)}
            </Text>
          </View>
        </View>

        {/* Host */}
        <Card className="flex-row items-center gap-3">
          <Avatar name={event.host.displayName} uri={event.host.avatarUrl} size="md" />
          <View className="flex-1">
            <View className="flex-row items-center gap-1">
              <Text variant="bodyStrong">{event.host.displayName}</Text>
              <VerifiedBadge level={event.host.verificationLevel} compact />
            </View>
            <View className="mt-1 flex-row items-center gap-2">
              <Badge label="HOST" tone="ember" />
              <Text variant="footnote" className="text-ink-muted">
                Reliability {Math.round(event.host.reliabilityScore)}
              </Text>
              <ReliabilityBars score={event.host.reliabilityScore} />
            </View>
          </View>
          <Pressable
            onPress={() =>
              Alert.alert(event.host.displayName, "This host's full profile is coming soon.")
            }
            className="rounded-full border border-ember bg-ember-soft px-4 py-2 active:opacity-80"
          >
            <Text variant="subhead" className="font-bold text-ember">
              View profile
            </Text>
          </Pressable>
        </Card>

        {/* Location — precise only when released, else fuzzed + privacy promise */}
        <Card className="flex-row gap-3">
          <View className="flex-1 gap-1.5">
            <View className="flex-row items-center gap-2">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-ember-soft">
                <Ionicons name="location" size={15} color={colors.ember} />
              </View>
              <Text variant="bodyStrong">
                {preciseLocation ? 'Exact location' : 'Neighborhood'}
              </Text>
              {!preciseLocation ? (
                <Ionicons name="lock-closed" size={14} color={colors.inkSubtle} />
              ) : null}
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
                <Text variant="body" className="font-semibold">
                  {event.location.neighborhood ?? 'Around the area'}
                </Text>
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="lock-closed" size={13} color={colors.success} />
                  <Text variant="footnote" className="font-semibold text-success">
                    Hidden for privacy
                  </Text>
                </View>
                <Text variant="footnote" className="text-ink-subtle">
                  The exact spot unlocks for approved guests about{' '}
                  {PRECISE_LOCATION_RELEASE_WINDOW_MINUTES} minutes before it starts.
                </Text>
              </>
            )}
          </View>

          {/* Map thumbnail — a stylized fuzzed area; never renders precise geo */}
          <View className="h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-surface-sunken">
            <View
              style={{ backgroundColor: `${colors.ember}22` }}
              className="absolute h-24 w-24 rounded-full"
            />
            <View
              style={{ backgroundColor: `${colors.ember}3A` }}
              className="absolute h-14 w-14 rounded-full"
            />
            <View className="h-9 w-9 items-center justify-center rounded-full bg-ember">
              <Ionicons
                name={preciseLocation ? 'location' : 'lock-closed'}
                size={16}
                color={colors.inkInverse}
              />
            </View>
          </View>
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
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="caption" className="text-ink-subtle">
              Who&apos;s going
            </Text>
            <Text variant="footnote" className="text-ink-muted">
              {formatGoing(event.capacity)}
            </Text>
          </View>
          <Card padded={false} className="px-4">
            {members.map((m, i) => (
              <View key={m.profile.userId}>
                {i > 0 ? <View className="h-px bg-line" /> : null}
                <MemberRow
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
              </View>
            ))}
          </Card>
        </View>

        {/* Host pending summary */}
        {viewerIsHost && pendingRequests.length > 0 ? (
          <Badge
            label={`${pendingRequests.length} waiting for your approval`}
            tone="amber"
            icon="hourglass"
          />
        ) : null}

        {/* Premium nudge — reach only, never gates joining or safety */}
        {isFree ? (
          <PremiumUpsell
            variant="soft"
            title="Want more matches like this?"
            body="Premium members unlock more meetups, see more people and match faster."
            onPress={() => router.push('/paywall')}
          />
        ) : null}
      </ScrollView>

      {/* Sticky action bar */}
      <View className="absolute inset-x-0 bottom-0 flex-row items-center gap-3 border-t border-line bg-canvas px-5 pb-8 pt-4">
        {isMember ? (
          <Button
            label="Open chat"
            className="flex-1"
            onPress={() => router.push(`/event/${eventId}/chat`)}
            rightIcon={<Ionicons name="chatbubble-ellipses" size={18} color={colors.inkInverse} />}
          />
        ) : (
          <Button
            label={requiresApproval ? 'Request to join' : 'Join meetup'}
            className="flex-1"
            loading={rsvp.join.isPending}
            disabled={event.status === 'full'}
            onPress={() => rsvp.join.mutate()}
          />
        )}
        <Pressable
          onPress={() => setSaved((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Saved' : 'Save meetup'}
          className="h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface active:opacity-80"
        >
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={24} color={colors.ember} />
        </Pressable>
      </View>

      {/* Safety, report & block flows (always free) */}
      <SafetyActionsSheet
        visible={safetyOpen}
        onClose={() => setSafetyOpen(false)}
        onBlock={() => {
          setSafetyOpen(false);
          setBlockOpen(true);
        }}
        onReportEvent={() => {
          setSafetyOpen(false);
          setReportTarget('event');
        }}
        onReportUser={() => {
          setSafetyOpen(false);
          setReportTarget('user');
        }}
        {...(isMember
          ? {
              onLeave: () => {
                setSafetyOpen(false);
                rsvp.leave.mutate();
              },
            }
          : {})}
      />
      <ReportReasonDialog
        visible={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        targetLabel={reportTarget === 'user' ? 'this host' : 'this meetup'}
        onPick={submitReport}
      />
      <ConfirmDialog
        visible={blockOpen}
        onClose={() => setBlockOpen(false)}
        onConfirm={() =>
          block.mutate(
            { blockedUserId: event.host.userId },
            {
              onSuccess: () => {
                setBlockOpen(false);
                router.back();
              },
            },
          )
        }
        loading={block.isPending}
        tone="danger"
        icon="ban"
        title={`Block ${event.host.displayName}?`}
        message="You won't see their meetups or messages, and they can't see yours. You can undo this in Settings."
        confirmLabel="Block host"
      />
      <ConfirmDialog
        visible={reportDone}
        onClose={() => setReportDone(false)}
        onConfirm={() => setReportDone(false)}
        tone="verified"
        icon="checkmark-circle"
        title="Report sent"
        message="Thank you — our safety team reviews reports fast and follows up if needed."
        confirmLabel="Done"
        cancelLabel={null}
      />
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
  const status = MEMBER_STATUS[member.rsvpStatus];
  return (
    <View className="flex-row items-center gap-3 py-3">
      <Avatar name={member.profile.displayName} uri={member.profile.avatarUrl} size="sm" />
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text variant="subhead" className="font-semibold">
            {member.profile.displayName}
          </Text>
          <VerifiedBadge level={member.profile.verificationLevel} compact />
          {member.isHost ? <Badge label="HOST" tone="ember" /> : null}
        </View>
      </View>
      {showApproval ? (
        <View className="flex-row gap-2">
          <Pressable
            onPress={onReject}
            disabled={deciding}
            accessibilityLabel="Reject"
            className="h-9 w-9 items-center justify-center rounded-full bg-danger-soft active:opacity-70"
          >
            <Ionicons name="close" size={18} color={colors.danger} />
          </Pressable>
          <Pressable
            onPress={onApprove}
            disabled={deciding}
            accessibilityLabel="Approve"
            className="h-9 w-9 items-center justify-center rounded-full bg-success-soft active:opacity-70"
          >
            <Ionicons name="checkmark" size={18} color={colors.success} />
          </Pressable>
        </View>
      ) : (
        <Badge label={status.label.toUpperCase()} tone={status.tone} />
      )}
    </View>
  );
}

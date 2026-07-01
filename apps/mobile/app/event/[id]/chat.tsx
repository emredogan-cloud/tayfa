import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CONTENT_LIMITS } from '@tayfa/shared/constants';
import { useChat, useEvent } from '@/api';
import type { ChatMessage } from '@/api';
import { Avatar, colors, Screen, Text } from '@/design-system';
import { cn } from '@/lib/cn';
import { track } from '@/lib/analytics';
import { useSession } from '@/stores/session';

const SENDER_COLORS = [
  'text-verified',
  'text-grape',
  'text-women',
  'text-amber',
  'text-ember-dark',
] as const;

function senderColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return SENDER_COLORS[h % SENDER_COLORS.length] ?? 'text-ink';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h < 10 ? `0${h}` : h}:${m < 10 ? `0${m}` : m}`;
}

/**
 * Event group chat (redesign `11-chat` / `12-chat-icebreakers`). System messages
 * (joins, reminders, the precise-location unlock) render as centered notices;
 * member messages as bubbles with sender color + timestamp. AI icebreakers —
 * grounded only in shared public interests — sit above the composer to break the
 * awkward-silence problem; tapping one sends it. The generative call fails open
 * to [], so chat is never blocked on AI.
 */
export default function ChatScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id ?? '';
  const { thread, send } = useChat(eventId);
  const detail = useEvent(eventId);
  const myUserId = useSession((s) => s.userId);
  const [draft, setDraft] = useState('');

  const ordered = useMemo(() => {
    const list = thread.data?.messages ?? [];
    return [...list].reverse(); // inverted list: newest at the bottom
  }, [thread.data?.messages]);

  function submit(body: string, fromIcebreaker = false): void {
    const text = body.trim();
    const conversationId = thread.data?.conversationId;
    if (!text || !conversationId) return;
    const wasEmpty = (thread.data?.messages.length ?? 0) === 0;
    send.mutate(
      { conversationId, body: text, fromIcebreaker },
      {
        onSuccess: () => {
          if (wasEmpty)
            track('chat_first_message', { conversation_id: conversationId, event_id: eventId });
        },
      },
    );
    setDraft('');
  }

  const icebreakers = thread.data?.icebreakers ?? [];
  const showIcebreakers = icebreakers.length > 0 && ordered.length < 6;
  const event = detail.data?.event;
  const spotsLeft = event ? Math.max(0, event.capacity.max - event.capacity.going) : 0;

  if (thread.isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.ember} />
      </Screen>
    );
  }

  return (
    <Screen padded={false} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-2 px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Text variant="h1" className="flex-1">
          Group chat
        </Text>
        <Pressable
          onPress={() => router.push(`/event/${eventId}`)}
          hitSlop={8}
          accessibilityLabel="Meetup options"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.ink} />
        </Pressable>
      </View>

      {/* Meetup sub-header */}
      {event ? (
        <View className="flex-row items-center justify-between gap-3 px-4 pb-3">
          <View className="flex-1">
            <Text variant="bodyStrong" numberOfLines={1}>
              {event.title}
            </Text>
            <Text variant="footnote">
              <Text variant="footnote" className="font-semibold text-verified">
                {event.capacity.going} going
              </Text>
              <Text variant="footnote" className="text-ink-subtle">
                {' · '}
              </Text>
              <Text
                variant="footnote"
                className={spotsLeft > 0 ? 'font-semibold text-ember' : 'text-ink-subtle'}
              >
                {spotsLeft > 0 ? `${spotsLeft} spots left` : 'full'}
              </Text>
            </Text>
          </View>
          <Pressable
            onPress={() => router.push(`/event/${eventId}`)}
            className="flex-row items-center gap-1.5 rounded-full border border-ember bg-ember-soft px-3.5 py-2 active:opacity-80"
          >
            <Ionicons name="calendar-outline" size={14} color={colors.ember} />
            <Text variant="subhead" className="font-bold text-ember">
              Meetup details
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Verified-group trust banner */}
      <Pressable
        onPress={() => router.push('/safety-center')}
        className="mx-4 mb-1 flex-row items-center gap-3 rounded-2xl bg-ember-soft px-3.5 py-3 active:opacity-90"
      >
        <View className="h-10 w-10 items-center justify-center rounded-full bg-ember">
          <Ionicons name="shield-checkmark" size={18} color={colors.inkInverse} />
        </View>
        <View className="flex-1">
          <Text variant="bodyStrong" className="text-ink">
            You&apos;re in a verified group
          </Text>
          <Text variant="footnote" className="text-ink-muted">
            Everyone here is verified and this chat is moderated.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.ember} />
      </Pressable>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
        className="flex-1"
      >
        <FlatList
          data={ordered}
          inverted
          keyExtractor={(m: ChatMessage) => m.id}
          renderItem={({ item }) => <Bubble message={item} mine={item.senderId === myUserId} />}
          ListFooterComponent={
            ordered.length > 0 ? (
              <View className="my-2 items-center">
                <View className="rounded-full bg-surface-alt px-3 py-1">
                  <Text variant="footnote" className="font-semibold text-ink-muted">
                    Today
                  </Text>
                </View>
              </View>
            ) : null
          }
          contentContainerClassName="px-4 py-4 gap-2"
          showsVerticalScrollIndicator={false}
        />

        {/* Icebreakers */}
        {showIcebreakers ? (
          <View className="gap-2 px-4 pb-2">
            <View className="flex-row items-center gap-1">
              <Ionicons name="sparkles" size={14} color={colors.grape} />
              <Text variant="caption" className="text-grape">
                Icebreakers
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2"
            >
              {icebreakers.map((ib, i) => (
                <Pressable
                  key={`${i}-${ib.slice(0, 12)}`}
                  onPress={() => submit(ib, true)}
                  className="max-w-[260px] flex-row items-center gap-2 rounded-2xl border border-grape-soft bg-grape-soft px-3 py-2.5 active:opacity-80"
                >
                  <Ionicons name="sparkles-outline" size={15} color={colors.grape} />
                  <Text variant="footnote" className="flex-1 text-grape">
                    {ib}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Composer */}
        <View className="flex-row items-end gap-2 border-t border-line px-4 pb-8 pt-3">
          <View className="flex-1 rounded-2xl border border-line-strong bg-surface px-4">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Message the group…"
              placeholderTextColor={colors.inkSubtle}
              selectionColor={colors.ember}
              multiline
              maxLength={CONTENT_LIMITS.messageMaxLength}
              className="max-h-28 min-h-[44px] py-2.5 text-[16px] leading-[22px] text-ink"
            />
          </View>
          <Pressable
            onPress={() => submit(draft)}
            disabled={!draft.trim() || send.isPending}
            accessibilityLabel="Send message"
            className={cn(
              'h-12 w-12 items-center justify-center rounded-full',
              draft.trim() ? 'bg-ember active:bg-ember-dark' : 'bg-surface-sunken',
            )}
          >
            <Ionicons
              name="paper-plane"
              size={20}
              color={draft.trim() ? colors.inkInverse : colors.inkSubtle}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Bubble({ message, mine }: { message: ChatMessage; mine: boolean }): React.ReactElement {
  if (message.kind === 'system') {
    return (
      <View className="my-1 flex-row items-center justify-center gap-2">
        <View className="rounded-full bg-surface-alt px-3 py-1">
          <Text variant="footnote" className="text-ink-subtle">
            {message.body} · {formatTime(message.createdAt)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={cn('flex-row items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
      {!mine && message.sender ? (
        <Avatar name={message.sender.displayName} uri={message.sender.avatarUrl} size="xs" />
      ) : null}
      <View
        className={cn(
          'max-w-[80%] rounded-2xl px-3.5 py-2.5',
          mine ? 'rounded-br-md bg-ember-soft' : 'rounded-bl-md border border-line bg-surface',
        )}
      >
        {!mine && message.sender ? (
          <Text variant="caption" className={cn('mb-1', senderColor(message.senderId))}>
            {message.sender.displayName}
          </Text>
        ) : null}
        <Text variant="body" className="text-ink">
          {message.body}
        </Text>
        <View className="mt-1 flex-row items-center justify-end gap-1">
          <Text variant="footnote" className="text-ink-subtle">
            {formatTime(message.createdAt)}
          </Text>
          {mine ? <Ionicons name="checkmark-done" size={14} color={colors.ember} /> : null}
        </View>
      </View>
    </View>
  );
}

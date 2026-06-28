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
import { useChat } from '@/api';
import type { ChatMessage } from '@/api';
import { Avatar, colors, Screen, Text } from '@/design-system';
import { cn } from '@/lib/cn';
import { track } from '@/lib/analytics';
import { useSession } from '@/stores/session';

/**
 * Event group chat. System messages (joins, reminders, the precise-location
 * unlock) are rendered as centered notices; member messages as bubbles. AI
 * icebreakers — grounded only in shared public interests — are offered above the
 * composer to break the awkward-silence problem; tapping one sends it. The
 * generative call fails open to [], so chat is never blocked on AI.
 */
export default function ChatScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id ?? '';
  const { thread, send } = useChat(eventId);
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
      <View className="flex-row items-center gap-2 border-b border-line px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-alt"
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Text variant="h2" className="flex-1">
          Group chat
        </Text>
      </View>

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
          contentContainerClassName="px-4 py-4 gap-2"
          showsVerticalScrollIndicator={false}
        />

        {/* Icebreakers */}
        {showIcebreakers ? (
          <View className="gap-2 px-4 pb-2">
            <View className="flex-row items-center gap-1">
              <Ionicons name="sparkles" size={13} color={colors.grape} />
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
                  className="max-w-[260px] rounded-2xl border border-grape-soft bg-grape-soft px-3 py-2 active:opacity-80"
                >
                  <Text variant="footnote" className="text-grape">
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
            className={cn(
              'h-11 w-11 items-center justify-center rounded-full',
              draft.trim() ? 'bg-ember active:bg-ember-dark' : 'bg-surface-sunken',
            )}
          >
            <Ionicons
              name="arrow-up"
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
      <View className="my-1 items-center">
        <View className="rounded-full bg-surface-alt px-3 py-1">
          <Text variant="footnote" className="text-ink-subtle">
            {message.body}
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
          'max-w-[78%] rounded-2xl px-3.5 py-2.5',
          mine ? 'rounded-br-md bg-ember' : 'rounded-bl-md bg-surface border border-line',
        )}
      >
        {!mine && message.sender ? (
          <Text variant="caption" className="mb-0.5 text-ink-subtle">
            {message.sender.displayName}
          </Text>
        ) : null}
        <Text variant="body" className={mine ? 'text-ink-inverse' : 'text-ink'}>
          {message.body}
        </Text>
      </View>
    </View>
  );
}

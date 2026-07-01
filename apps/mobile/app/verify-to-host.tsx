import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge, Button, Card, colors, ConfirmDialog, Screen, Text } from '@/design-system';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import { illustrations } from '@/lib/illustrations';

interface Step {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly title: string;
  readonly desc: string;
}

const STEPS: readonly Step[] = [
  {
    icon: 'card-outline',
    title: 'Scan your ID',
    desc: 'A passport or national ID — encrypted end to end.',
  },
  {
    icon: 'happy-outline',
    title: 'Take a quick selfie',
    desc: 'A liveness check confirms it’s really you.',
  },
  {
    icon: 'time-outline',
    title: 'We review in minutes',
    desc: 'Usually instant. We’ll notify you the moment it clears.',
  },
];

/**
 * Verify-to-host gate (redesign `25-verify-to-host`). Hosting requires Verified+
 * (ID + liveness) — free, but non-negotiable: it's what makes it safe to show up
 * to a stranger's meetup. Verification is SERVER-AUTHORITATIVE and fail-closed:
 * this screen only kicks off the secure provider flow; it never flips the local
 * verification level. The badge unlocks only when the backend confirms.
 */
export default function VerifyToHostScreen(): React.ReactElement {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [started, setStarted] = useState(false);

  function startVerification(): void {
    setStarting(true);
    track('verification_started', { type: 'id' });
    // Provider seam: this hands off to the KYC provider (mock-tolerant). The
    // entitlement to host flips only when the server confirms id_live — never here.
    void api
      .post('/me/verification/start', {})
      .catch(() => undefined)
      .finally(() => {
        setStarting(false);
        setStarted(true);
      });
  }

  return (
    <Screen padded={false} edges={['top']}>
      <View className="flex-row items-center justify-between px-5 py-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Badge label="Always free" tone="success" icon="lock-open" />
      </View>

      <ScrollView contentContainerClassName="px-5 pb-40 gap-5" showsVerticalScrollIndicator={false}>
        <View className="items-center pt-2">
          <Image
            source={illustrations.authPhone}
            style={{ width: 148, height: 148 }}
            contentFit="contain"
            transition={200}
            accessibilityLabel=""
          />
        </View>

        <View className="gap-2">
          <Text variant="display">
            Verify to{' '}
            <Text variant="display" className="text-ember">
              host
            </Text>
          </Text>
          <Text variant="callout" className="text-ink-muted">
            Hosting needs a quick ID + liveness check. It’s free — and it’s exactly what makes Tayfa
            meetups safe enough to show up to.
          </Text>
        </View>

        {/* Steps */}
        <View className="gap-3">
          {STEPS.map((s, i) => (
            <View key={s.title} className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-ember-soft">
                <Ionicons name={s.icon} size={20} color={colors.ember} />
              </View>
              <View className="flex-1">
                <Text variant="bodyStrong">
                  {i + 1}. {s.title}
                </Text>
                <Text variant="footnote" className="text-ink-muted">
                  {s.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Why we ask — safety, not surveillance */}
        <Card className="flex-row items-start gap-3 border-verified-soft bg-verified-soft">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-verified">
            <Ionicons name="shield-checkmark" size={20} color={colors.inkInverse} />
          </View>
          <View className="flex-1">
            <Text variant="bodyStrong" className="text-verified">
              Safety, not surveillance
            </Text>
            <Text variant="footnote" className="mt-0.5 text-ink">
              Your documents are encrypted, checked by a secure provider, and never shown to other
              members. Verification is never sold or paywalled.
            </Text>
          </View>
        </Card>

        <View className="gap-2 rounded-2xl bg-surface-alt p-4">
          <Text variant="caption" className="text-ink-subtle">
            Once verified you can
          </Text>
          {[
            'Host meetups anyone can trust',
            'Wear the Verified+ badge on your profile',
            'Reach people who filter for verified hosts',
          ].map((line) => (
            <View key={line} className="flex-row items-start gap-2">
              <Ionicons name="checkmark-circle" size={16} color={colors.verified} />
              <Text variant="footnote" className="flex-1 text-ink">
                {line}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 gap-2 border-t border-line bg-canvas px-5 pb-8 pt-4">
        <Button
          label="Start ID verification"
          loading={starting}
          onPress={startVerification}
          rightIcon={<Ionicons name="arrow-forward" size={18} color={colors.inkInverse} />}
        />
        <Button label="Maybe later" variant="ghost" onPress={() => router.back()} />
      </View>

      <ConfirmDialog
        visible={started}
        onClose={() => {
          setStarted(false);
          router.back();
        }}
        onConfirm={() => {
          setStarted(false);
          router.back();
        }}
        tone="verified"
        icon="shield-checkmark"
        title="Verification started"
        message="We’ll walk you through the ID scan and selfie, then review it — usually in minutes. You’ll get a notification the moment your Verified+ badge is ready."
        confirmLabel="Got it"
        cancelLabel={null}
      />
    </Screen>
  );
}

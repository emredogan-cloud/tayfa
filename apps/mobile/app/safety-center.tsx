import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { sharePlanSchema } from '@tayfa/shared/schemas';
import { Badge, Button, Card, colors, Screen, Text, TextField, Toggle } from '@/design-system';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';

interface EmergencyNumber {
  readonly label: string;
  readonly number: string;
  readonly icon: keyof typeof Ionicons.glyphMap;
}

// Türkiye emergency services (single emergency line 112 + specifics).
const TR_EMERGENCY: readonly EmergencyNumber[] = [
  { label: 'Emergency (all)', number: '112', icon: 'medkit' },
  { label: 'Police', number: '155', icon: 'shield' },
  { label: 'Gendarmerie', number: '156', icon: 'car' },
  { label: 'Fire', number: '110', icon: 'flame' },
];

/**
 * Safety Center — EVERYTHING here is free, forever (RISK_ANALYSIS: safety is
 * never paywalled). SOS, check-in, share-my-plan, live-location-to-crew, and the
 * Türkiye emergency numbers. Presented as a modal so it's reachable from any
 * surface in one tap.
 */
export default function SafetyCenterScreen(): React.ReactElement {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [liveLocation, setLiveLocation] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  function call(number: string): void {
    void Linking.openURL(`tel:${number}`);
  }

  function triggerSos(): void {
    Alert.alert('Send SOS', 'Alert your trusted contacts and Tayfa safety, and call 112?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send SOS',
        style: 'destructive',
        onPress: () => {
          track('sos_triggered', eventId ? { event_id: eventId } : {});
          void api.post('/safety/sos', eventId ? { eventId } : {}).catch(() => undefined);
          call('112');
        },
      },
    ]);
  }

  async function sharePlan(): Promise<void> {
    setPlanError(null);
    if (!eventId) {
      Alert.alert(
        'Pick a meetup',
        'Open Share my plan from a meetup you’ve joined and we’ll send those details to your contact.',
      );
      return;
    }
    const parsed = sharePlanSchema.safeParse({ eventId, contactName, contactPhone });
    if (!parsed.success) {
      setPlanError(parsed.error.issues[0]?.message ?? 'Check the contact details');
      return;
    }
    setSharing(true);
    try {
      await api.post('/safety/share-plan', parsed.data);
      track('plan_shared_with_contact', { event_id: eventId });
      Alert.alert('Plan shared', `${contactName} now has your meetup details and check-in time.`);
      setContactName('');
      setContactPhone('');
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : 'Could not share. Try again.');
    } finally {
      setSharing(false);
    }
  }

  function toggleLiveLocation(value: boolean): void {
    setLiveLocation(value);
    void api.post('/safety/live-location', { enabled: value }).catch(() => undefined);
  }

  return (
    <Screen padded={false}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <View className="flex-1 pr-3">
          <Text variant="h1">Safety Center</Text>
          <Text variant="footnote" className="text-ink-muted">
            Your safety tools — always one tap away.
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        >
          <Ionicons name="close" size={20} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-12 gap-5" showsVerticalScrollIndicator={false}>
        <Badge label="Always free — never behind a paywall" tone="success" icon="lock-open" />

        {/* SOS */}
        <Pressable onPress={triggerSos} className="active:opacity-90">
          <View className="items-center gap-2 rounded-3xl bg-danger p-6" style={{ elevation: 4 }}>
            <View className="h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-surface">
                <Ionicons name="alert" size={28} color={colors.danger} />
              </View>
            </View>
            <Text variant="title" className="text-ink-inverse">
              SOS
            </Text>
            <Text variant="footnote" className="text-center text-ink-inverse opacity-90">
              Alert your contacts + Tayfa safety and call 112 immediately
            </Text>
          </View>
        </Pressable>

        {/* Emergency numbers */}
        <View className="gap-2">
          <Text variant="caption" className="text-ink-subtle">
            Türkiye emergency numbers
          </Text>
          <Card padded={false}>
            {TR_EMERGENCY.map((e, i) => (
              <View key={e.number}>
                {i > 0 ? <View className="h-px bg-line" /> : null}
                <Pressable
                  onPress={() => call(e.number)}
                  className="flex-row items-center gap-3 px-4 py-3.5 active:bg-surface-alt"
                >
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-danger-soft">
                    <Ionicons name={e.icon} size={18} color={colors.danger} />
                  </View>
                  <Text variant="bodyStrong" className="flex-1">
                    {e.label}
                  </Text>
                  <Text variant="bodyStrong" className="text-danger">
                    {e.number}
                  </Text>
                  <Ionicons name="call" size={16} color={colors.inkSubtle} />
                </Pressable>
              </View>
            ))}
          </Card>
        </View>

        {/* Share my plan */}
        <View className="gap-2">
          <Text variant="caption" className="text-ink-subtle">
            Share my plan
          </Text>
          <Card className="gap-3">
            <Badge
              label="Private & secure"
              tone="verified"
              icon="lock-closed"
              className="self-start"
            />
            <Text variant="footnote" className="text-ink-muted">
              Send a trusted contact where you’re going, who with, and when you’ll check in.
            </Text>
            <TextField
              label="Contact name"
              value={contactName}
              onChangeText={setContactName}
              placeholder="e.g. Ayşe"
              maxLength={80}
            />
            <TextField
              label="Contact phone"
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="+90 5XX XXX XX XX"
              keyboardType="phone-pad"
              error={planError}
            />
            <Button
              label="Share my plan"
              variant="secondary"
              loading={sharing}
              disabled={!contactName.trim() || !contactPhone.trim()}
              onPress={() => void sharePlan()}
            />
          </Card>
        </View>

        {/* Live location to crew */}
        <Card padded={false} className="px-4">
          <Toggle
            accent={
              <View className="h-9 w-9 items-center justify-center rounded-full bg-verified-soft">
                <Ionicons name="navigate" size={18} color={colors.verified} />
              </View>
            }
            title="Live location to crew"
            description="Share your live location with your crew while a meetup is happening. Off by default."
            value={liveLocation}
            onValueChange={toggleLiveLocation}
          />
        </Card>

        <Text variant="footnote" className="text-center text-ink-subtle">
          Block, report and ID verification are always free too. Your safety is never a paid
          feature.
        </Text>
      </ScrollView>
    </Screen>
  );
}

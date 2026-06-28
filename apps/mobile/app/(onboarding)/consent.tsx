import { Ionicons } from '@expo/vector-icons';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge, Button, Card, colors, Screen, Text, Toggle } from '@/design-system';
import { setAnalyticsConsent } from '@/lib/analytics';
import { useOnboarding } from '@/stores/onboarding';

/**
 * Granular consent (KVKK Art. 6 — unbundled açık rıza). Each category is an
 * INDEPENDENT toggle. Critically, `marketing` must NOT gate the core service:
 * Continue is always enabled and the product works fully with every toggle off.
 * We log the consent version + timestamp server-side at finish.
 */
export default function ConsentScreen(): React.ReactElement {
  const router = useRouter();
  const consent = useOnboarding((s) => s.consent);
  const setConsent = useOnboarding((s) => s.setConsent);

  function dot(color: string, icon: keyof typeof Ionicons.glyphMap): React.ReactElement {
    return (
      <View
        style={{ backgroundColor: color }}
        className="h-9 w-9 items-center justify-center rounded-full"
      >
        <Ionicons name={icon} size={18} color={colors.inkInverse} />
      </View>
    );
  }

  function onContinue(): void {
    // Informed step complete: product analytics may run, gated on this consent.
    // Marketing comms remain separately governed by the `marketing` toggle.
    setAnalyticsConsent(true);
    router.push('/(onboarding)/profile');
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerClassName="px-5 pt-6 pb-32" showsVerticalScrollIndicator={false}>
        <Text variant="display">Your data,{'\n'}your choice</Text>
        <Text variant="callout" className="mt-2 text-ink-muted">
          Turn on only what you want. Each is separate — and Tayfa works fully even with everything
          off.
        </Text>

        <Card padded={false} className="mt-6 px-4">
          <Toggle
            accent={dot(colors.ember, 'location')}
            title="Location"
            description="Show meetups near you. Your precise spot is fuzzed to a neighborhood and never shared with other users."
            value={consent.location}
            onValueChange={(v) => setConsent('location', v)}
          />
          <View className="h-px bg-line" />
          <Toggle
            accent={dot(colors.grape, 'link')}
            title="Connected accounts"
            description="Import taste from Spotify, Apple Music or Letterboxd to match faster."
            value={consent.connected_accounts}
            onValueChange={(v) => setConsent('connected_accounts', v)}
          />
          <View className="h-px bg-line" />
          <Toggle
            accent={dot(colors.verified, 'finger-print')}
            title="Biometric verification"
            description="Use Face/Touch ID to unlock Tayfa and speed up identity checks."
            value={consent.biometric_verification}
            onValueChange={(v) => setConsent('biometric_verification', v)}
          />
          <View className="h-px bg-line" />
          <View className="py-1">
            <Toggle
              accent={dot(colors.amber, 'mail')}
              title="Marketing"
              description="Occasional tips and offers. Optional — this never affects your access."
              value={consent.marketing}
              onValueChange={(v) => setConsent('marketing', v)}
            />
            <View className="pb-3">
              <Badge label="Does not gate the app" tone="success" icon="checkmark-circle" />
            </View>
          </View>
        </Card>

        <Text variant="footnote" className="mt-4 text-ink-subtle">
          You can change any of these anytime in Settings. Data is stored in the EU (Frankfurt).
        </Text>
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 border-t border-line bg-canvas px-5 pb-8 pt-4">
        <Button label="Continue" onPress={onContinue} />
      </View>
    </Screen>
  );
}

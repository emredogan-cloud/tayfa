import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, colors, Screen, Text, Toggle } from '@/design-system';
import { AuthHeader } from '@/components/AuthHeader';
import { illustrations } from '@/lib/illustrations';
import { setAnalyticsConsent } from '@/lib/analytics';
import { useOnboarding } from '@/stores/onboarding';

/**
 * Granular consent (redesign `05-consent`; KVKK Art. 6 — unbundled açık rıza).
 * Each category is an INDEPENDENT toggle. Critically, `marketing` must NOT gate
 * the core service: Continue is always enabled and the product works fully with
 * every toggle off. We log the consent version + timestamp server-side at finish.
 */
export default function ConsentScreen(): React.ReactElement {
  const router = useRouter();
  const consent = useOnboarding((s) => s.consent);
  const setConsent = useOnboarding((s) => s.setConsent);

  /** Colored icon badge with a soft halo ring, matching the redesign. */
  function badge(
    color: string,
    soft: string,
    icon: keyof typeof Ionicons.glyphMap,
  ): React.ReactElement {
    return (
      <View
        style={{ backgroundColor: soft }}
        className="h-12 w-12 items-center justify-center rounded-full"
      >
        <View
          style={{ backgroundColor: color }}
          className="h-9 w-9 items-center justify-center rounded-full"
        >
          <Ionicons name={icon} size={18} color={colors.inkInverse} />
        </View>
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
      <ScrollView contentContainerClassName="px-5 pb-32" showsVerticalScrollIndicator={false}>
        <AuthHeader
          pill={{ icon: 'shield-checkmark-outline', label: "You're in control" }}
          progress={{ steps: 4, current: 2 }}
        />

        {/* Headline + hero */}
        <View className="mt-5 flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text
              style={{ fontSize: 34, lineHeight: 40 }}
              className="font-extrabold tracking-tight text-ink"
            >
              Your data,{'\n'}
              <Text
                style={{ fontSize: 34, lineHeight: 40 }}
                className="font-extrabold tracking-tight text-ember"
              >
                your choice
              </Text>
            </Text>
            <Text variant="callout" className="mt-2 text-ink-muted">
              Turn on only what you want. Each is separate — and Tayfa works fully even with
              everything off.
            </Text>
          </View>
          <Image
            source={illustrations.onboardingConsent}
            style={{ width: 124, height: 124 }}
            contentFit="contain"
            transition={200}
            accessibilityLabel=""
          />
        </View>

        <Card padded={false} className="mt-6 px-4">
          <Toggle
            accent={badge(colors.ember, colors.emberSoft, 'location')}
            title="Location"
            description="Show meetups near you. Your precise spot is fuzzed to a neighborhood and never shared with other users."
            value={consent.location}
            onValueChange={(v) => setConsent('location', v)}
          />
          <View className="h-px bg-line" />
          <Toggle
            accent={badge(colors.grape, colors.grapeSoft, 'link')}
            title="Connected accounts"
            description="Import taste from Spotify, Apple Music or Letterboxd to match faster."
            value={consent.connected_accounts}
            onValueChange={(v) => setConsent('connected_accounts', v)}
          />
          <View className="h-px bg-line" />
          <Toggle
            accent={badge(colors.verified, colors.verifiedSoft, 'finger-print')}
            title="Biometric verification"
            description="Use Face/Touch ID to unlock Tayfa and speed up identity checks."
            value={consent.biometric_verification}
            onValueChange={(v) => setConsent('biometric_verification', v)}
          />
          <View className="h-px bg-line" />
          <Toggle
            accent={badge(colors.amber, colors.amberSoft, 'mail')}
            title="Marketing"
            description="Occasional tips and offers. Optional — this never affects your access."
            value={consent.marketing}
            onValueChange={(v) => setConsent('marketing', v)}
          />

          {/* Safety promise — granular consent never gates the core product. */}
          <View className="mb-4 mt-1 flex-row items-center gap-3 rounded-2xl bg-success-soft px-3.5 py-3">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-success">
              <Ionicons name="checkmark" size={18} color={colors.inkInverse} />
            </View>
            <View className="flex-1">
              <Text variant="bodyStrong" className="text-success">
                Does not gate the app
              </Text>
              <Text variant="footnote" className="text-ink-muted">
                Tayfa works fully even if everything is off.
              </Text>
            </View>
          </View>
        </Card>

        <View className="mt-4 flex-row items-start gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-grape-soft">
            <Ionicons name="lock-closed" size={16} color={colors.grape} />
          </View>
          <Text variant="footnote" className="flex-1 text-ink-subtle">
            You can change any of these anytime in Settings. Data is stored in the EU (Frankfurt).
          </Text>
        </View>
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 border-t border-line bg-canvas px-5 pb-8 pt-3">
        <Button
          label="Continue"
          onPress={onContinue}
          rightIcon={<Ionicons name="arrow-forward" size={20} color={colors.inkInverse} />}
        />
      </View>
    </Screen>
  );
}

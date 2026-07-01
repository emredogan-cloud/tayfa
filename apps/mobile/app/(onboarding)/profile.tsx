import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { consentSchema, interestSelectionSchema, profileSetupSchema } from '@tayfa/shared/schemas';
import { CONTENT_LIMITS } from '@tayfa/shared/constants';
import { Button, colors, Screen, Text, TextField } from '@/design-system';
import { AuthHeader } from '@/components/AuthHeader';
import { illustrations } from '@/lib/illustrations';
import { api, ApiError } from '@/lib/api';
import { track } from '@/lib/analytics';
import { useOnboarding } from '@/stores/onboarding';
import { useSession } from '@/stores/session';

/** Bumped whenever the consent copy changes (logged with the açık rıza record). */
const CONSENT_VERSION = '2026-06-01';

function FieldLabel({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}): React.ReactElement {
  return (
    <View className="flex-row items-center gap-1.5">
      <Ionicons name={icon} size={16} color={colors.grape} />
      <Text variant="label" className="text-ink">
        {text}
      </Text>
    </View>
  );
}

/**
 * Final onboarding step — the profile (redesign `06-profile`), then a single
 * submit that ships interests + granular consent + profile to the BFF (which
 * Zod-validates all three with the shared schemas and is the authority). On
 * success we flip onboarding to complete and drop the user into a live feed.
 */
export default function ProfileScreen(): React.ReactElement {
  const router = useRouter();
  const draft = useOnboarding((s) => s.profile);
  const interests = useOnboarding((s) => s.interests);
  const consent = useOnboarding((s) => s.consent);
  const setField = useOnboarding((s) => s.setProfileField);
  const resetOnboarding = useOnboarding((s) => s.reset);
  const setOnboardingComplete = useSession((s) => s.setOnboardingComplete);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nameValid = draft.displayName.trim().length >= CONTENT_LIMITS.displayNameMinLength;

  async function onFinish(): Promise<void> {
    setError(null);

    const profileParsed = profileSetupSchema.safeParse({
      displayName: draft.displayName,
      ...(draft.bio.trim() ? { bio: draft.bio } : {}),
      ...(draft.neighborhood.trim() ? { neighborhood: draft.neighborhood } : {}),
      languages: ['tr'],
    });
    if (!profileParsed.success) {
      setError(profileParsed.error.issues[0]?.message ?? 'Check your profile details');
      return;
    }

    const interestsParsed = interestSelectionSchema.safeParse({
      interests: interests.map((i) => ({
        interestId: i.interestId,
        weight: i.weight,
        source: 'onboarding',
      })),
    });
    if (!interestsParsed.success) {
      setError(interestsParsed.error.issues[0]?.message ?? 'Pick a few more interests');
      return;
    }

    const consentParsed = consentSchema.parse({ ...consent, consentVersion: CONSENT_VERSION });
    const secondsToComplete = Math.round((Date.now() - useOnboarding.getState().startedAt) / 1000);

    setLoading(true);
    try {
      await api.post('/me/onboarding', {
        profile: profileParsed.data,
        interests: interestsParsed.data,
        consent: consentParsed,
      });
    } catch (e) {
      // Tolerate offline/mock (network) errors so the flow stays walkable; a real
      // 4xx (validation/auth) is surfaced to the user.
      if (!(e instanceof ApiError) || e.status !== 0) {
        setLoading(false);
        setError(e instanceof Error ? e.message : 'Could not finish setup. Try again.');
        return;
      }
    }

    track('onboarding_completed', {
      interest_count: interests.length,
      seconds_to_complete: secondsToComplete,
    });
    setOnboardingComplete(true);
    resetOnboarding();
    router.replace('/(tabs)/feed');
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="px-5 pb-32"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthHeader
            pill={{ icon: 'sparkles-outline', label: 'You can edit anytime' }}
            progress={{ steps: 4, current: 3 }}
          />

          {/* Headline + hero */}
          <View className="mt-5 flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <Text
                style={{ fontSize: 34, lineHeight: 40 }}
                className="font-extrabold tracking-tight text-ink"
              >
                Make it{'\n'}
                <Text
                  style={{ fontSize: 34, lineHeight: 40 }}
                  className="font-extrabold tracking-tight text-ember"
                >
                  yours
                </Text>
              </Text>
              <Text variant="callout" className="mt-2 text-ink-muted">
                This is what people see before they meet you. Keep it real.
              </Text>
            </View>
            <Image
              source={illustrations.onboardingProfile}
              style={{ width: 124, height: 124 }}
              contentFit="contain"
              transition={200}
              accessibilityLabel=""
            />
          </View>

          {/* Photo placeholder (added later from the profile tab) */}
          <View className="my-6 items-center">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-grape-soft">
              <Ionicons name="camera-outline" size={30} color={colors.grape} />
              <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-canvas bg-grape">
                <Ionicons name="add" size={18} color={colors.inkInverse} />
              </View>
            </View>
            <Text variant="footnote" className="mt-2 text-ink-subtle">
              Add a photo later in your profile
            </Text>
          </View>

          <View className="gap-4">
            <View className="gap-1.5">
              <FieldLabel icon="person-outline" text="Display name" />
              <TextField
                value={draft.displayName}
                onChangeText={(t) => setField('displayName', t)}
                placeholder="e.g. Deniz"
                maxLength={CONTENT_LIMITS.displayNameMaxLength}
                showCounter
                autoCapitalize="words"
              />
            </View>
            <View className="gap-1.5">
              <FieldLabel icon="chatbubble-ellipses-outline" text="Bio" />
              <TextField
                value={draft.bio}
                onChangeText={(t) => setField('bio', t)}
                placeholder="What you're into, what you're looking for in a hangout…"
                maxLength={CONTENT_LIMITS.bioMaxLength}
                showCounter
                multiline
                numberOfLines={3}
              />
            </View>
            <View className="gap-1.5">
              <FieldLabel icon="location-outline" text="Neighborhood" />
              <TextField
                value={draft.neighborhood}
                onChangeText={(t) => setField('neighborhood', t)}
                placeholder="e.g. Kadıköy"
                maxLength={80}
                hint="Helps surface meetups in your part of the city"
              />
            </View>

            {/* Trust nudge */}
            <View className="flex-row items-center gap-3 rounded-2xl bg-grape-soft px-3.5 py-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-grape">
                <Ionicons name="shield-checkmark" size={18} color={colors.inkInverse} />
              </View>
              <View className="flex-1">
                <Text variant="bodyStrong" className="text-ink">
                  Real people. Real meetups.
                </Text>
                <Text variant="footnote" className="text-ink-muted">
                  Keep your info honest and respectful.
                </Text>
              </View>
            </View>

            {error ? (
              <Text variant="footnote" className="text-danger">
                {error}
              </Text>
            ) : null}
          </View>
        </ScrollView>

        <View className="absolute inset-x-0 bottom-0 border-t border-line bg-canvas px-5 pb-8 pt-3">
          <Button
            label="Enter Tayfa"
            loading={loading}
            disabled={!nameValid}
            onPress={() => void onFinish()}
            rightIcon={<Ionicons name="arrow-forward" size={20} color={colors.inkInverse} />}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

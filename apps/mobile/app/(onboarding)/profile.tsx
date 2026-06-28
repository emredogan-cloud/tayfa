import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { consentSchema, interestSelectionSchema, profileSetupSchema } from '@tayfa/shared/schemas';
import { CONTENT_LIMITS } from '@tayfa/shared/constants';
import { Avatar, Button, Screen, Text, TextField } from '@/design-system';
import { api, ApiError } from '@/lib/api';
import { track } from '@/lib/analytics';
import { useOnboarding } from '@/stores/onboarding';
import { useSession } from '@/stores/session';

/** Bumped whenever the consent copy changes (logged with the açık rıza record). */
const CONSENT_VERSION = '2026-06-01';

/**
 * Final onboarding step — the profile, then a single submit that ships interests
 * + granular consent + profile to the BFF (which Zod-validates all three with
 * the shared schemas and is the authority). On success we flip onboarding to
 * complete and drop the user into a live feed.
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
          contentContainerClassName="px-5 pt-6 pb-32"
          showsVerticalScrollIndicator={false}
        >
          <Text variant="display">Make it{'\n'}yours</Text>
          <Text variant="callout" className="mt-2 text-ink-muted">
            This is what people see before they meet you. Keep it real.
          </Text>

          <View className="my-6 items-center">
            <Avatar name={draft.displayName || 'You'} size="xl" />
            <Text variant="footnote" className="mt-2 text-ink-subtle">
              Add a photo later in your profile
            </Text>
          </View>

          <View className="gap-2">
            <TextField
              label="Display name"
              value={draft.displayName}
              onChangeText={(t) => setField('displayName', t)}
              placeholder="e.g. Deniz"
              maxLength={CONTENT_LIMITS.displayNameMaxLength}
              showCounter
              autoCapitalize="words"
            />
            <TextField
              label="Bio"
              value={draft.bio}
              onChangeText={(t) => setField('bio', t)}
              placeholder="What you're into, what you're looking for in a hangout…"
              maxLength={CONTENT_LIMITS.bioMaxLength}
              showCounter
              multiline
              numberOfLines={3}
            />
            <TextField
              label="Neighborhood"
              value={draft.neighborhood}
              onChangeText={(t) => setField('neighborhood', t)}
              placeholder="e.g. Kadıköy"
              maxLength={80}
              hint="Helps surface meetups in your part of the city"
            />
            {error ? (
              <Text variant="footnote" className="text-danger">
                {error}
              </Text>
            ) : null}
          </View>
        </ScrollView>

        <View className="absolute inset-x-0 bottom-0 border-t border-line bg-canvas px-5 pb-8 pt-4">
          <Button
            label="Enter Tayfa"
            loading={loading}
            disabled={!nameValid}
            onPress={() => void onFinish()}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

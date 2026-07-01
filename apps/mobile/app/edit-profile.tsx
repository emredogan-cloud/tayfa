import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CONTENT_LIMITS } from '@tayfa/shared/constants';
import { useMyProfile, useUpdateProfile } from '@/api';
import { Avatar, Card, colors, Screen, Text, TextField, VerifiedBadge } from '@/design-system';
import { interestIcon } from '@/lib/interestMeta';
import { useSession } from '@/stores/session';

/**
 * Edit profile (redesign `26-edit-profile`). Basic info (name + location editable;
 * phone + age shown as verified read-only truth), an about-you bio with a live
 * counter, and the interest chips. Saving goes through the shared
 * `profileSetupSchema` via `useUpdateProfile` — the same validation as onboarding.
 * Fields with no backing model column (date of birth, gender/looking-for) are
 * intentionally not faked here.
 */
export default function EditProfileScreen(): React.ReactElement {
  const router = useRouter();
  const profileQuery = useMyProfile();
  const update = useUpdateProfile();
  const phone = useSession((s) => s.phone);

  const [name, setName] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (profileQuery.isLoading || !profileQuery.data) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.ember} />
      </Screen>
    );
  }

  const { profile, interests } = profileQuery.data;
  // Lazy-init from server truth on first render, then track local edits.
  const nameValue = name ?? profile.displayName;
  const bioValue = bio ?? profile.bio ?? '';
  const neighborhoodValue = neighborhood ?? profile.neighborhood ?? '';
  const nameValid = nameValue.trim().length >= CONTENT_LIMITS.displayNameMinLength;

  function save(): void {
    setError(null);
    update.mutate(
      {
        displayName: nameValue.trim(),
        languages: profile.languages.length ? [...profile.languages] : ['tr'],
        ...(bioValue.trim() ? { bio: bioValue.trim() } : {}),
        ...(neighborhoodValue.trim() ? { neighborhood: neighborhoodValue.trim() } : {}),
      },
      {
        onSuccess: () => router.back(),
        onError: (e) => setError(e instanceof Error ? e.message : 'Could not save. Try again.'),
      },
    );
  }

  return (
    <Screen padded={false} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Text variant="h1" className="flex-1 text-center">
          Edit profile
        </Text>
        <Pressable
          onPress={save}
          disabled={!nameValid || update.isPending}
          accessibilityLabel="Save profile"
          className={`h-10 items-center justify-center rounded-full px-5 ${
            nameValid ? 'bg-ember active:bg-ember-dark' : 'bg-surface-sunken'
          }`}
        >
          {update.isPending ? (
            <ActivityIndicator color={colors.inkInverse} size="small" />
          ) : (
            <Text
              variant="bodyStrong"
              className={nameValid ? 'text-ink-inverse' : 'text-ink-subtle'}
            >
              Save
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-16 gap-5" showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View className="items-center pt-2">
          <View>
            <Avatar name={profile.displayName} uri={profile.avatarUrl} size="xl" />
            <Pressable
              onPress={() => Alert.alert('Add a photo', 'Photo upload is coming soon.')}
              accessibilityLabel="Change photo"
              className="absolute -bottom-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-2 border-canvas bg-ember active:opacity-80"
            >
              <Ionicons name="camera" size={18} color={colors.inkInverse} />
            </Pressable>
          </View>
        </View>

        {/* Basic info */}
        <View className="gap-2">
          <Text variant="caption" className="text-ink-subtle">
            Basic info
          </Text>
          <Card className="gap-3">
            <TextField
              label="Name"
              value={nameValue}
              onChangeText={setName}
              maxLength={CONTENT_LIMITS.displayNameMaxLength}
              placeholder="Your name"
            />
            <TextField
              label="Location"
              value={neighborhoodValue}
              onChangeText={setNeighborhood}
              maxLength={80}
              placeholder="e.g. Kadıköy, İstanbul"
            />
            <ReadRow
              icon="call-outline"
              label="Phone"
              value={phone ?? '+90 5XX XXX XX XX'}
              trailing={
                <VerifiedBadge
                  level={profile.verificationLevel === 'none' ? 'phone' : profile.verificationLevel}
                />
              }
            />
            <ReadRow icon="balloon-outline" label="Age" value={`${profile.age}`} />
          </Card>
        </View>

        {/* About you */}
        <View className="gap-2">
          <Text variant="caption" className="text-ink-subtle">
            About you
          </Text>
          <TextField
            label="Bio"
            value={bioValue}
            onChangeText={setBio}
            maxLength={CONTENT_LIMITS.bioMaxLength}
            showCounter
            multiline
            numberOfLines={3}
            placeholder="A line about you and what you're up for."
          />
        </View>

        {/* Interests */}
        <View className="gap-2">
          <Text variant="caption" className="text-ink-subtle">
            Interests
          </Text>
          <Card className="gap-3">
            {interests.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {interests.map((i) => {
                  const meta = interestIcon(i.domain);
                  return (
                    <View
                      key={i.id}
                      className="flex-row items-center gap-1.5 rounded-full bg-ember-soft px-3 py-1.5"
                    >
                      <Ionicons name={meta.icon} size={13} color={meta.color} />
                      <Text variant="subhead" className="font-semibold text-ember-dark">
                        {i.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text variant="footnote" className="text-ink-muted">
                You haven&apos;t picked any interests yet.
              </Text>
            )}
            <Text variant="footnote" className="text-ink-subtle">
              Interests shape who you meet. They&apos;re taken from your taste picks.
            </Text>
          </Card>
        </View>

        {error ? (
          <Text variant="footnote" className="text-danger">
            {error}
          </Text>
        ) : null}

        {/* Safety */}
        <Pressable
          onPress={() => router.push('/safety-center')}
          className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface p-4 active:bg-surface-alt"
        >
          <Ionicons name="shield-checkmark" size={20} color={colors.verified} />
          <Text variant="bodyStrong" className="flex-1">
            Safety Center
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.inkSubtle} />
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function ReadRow({
  icon,
  label,
  value,
  trailing,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  trailing?: React.ReactNode;
}): React.ReactElement {
  return (
    <View className="flex-row items-center gap-3 border-t border-line pt-3">
      <Ionicons name={icon} size={18} color={colors.inkMuted} />
      <View className="flex-1">
        <Text variant="caption" className="text-ink-subtle">
          {label}
        </Text>
        <Text variant="body">{value}</Text>
      </View>
      {trailing}
    </View>
  );
}

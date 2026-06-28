import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { accountDeletionSchema } from '@tayfa/shared/schemas';
import { checkTrialEligibility } from '@tayfa/shared/domain';
import { useMyProfile, useUpdateProfile } from '@/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  colors,
  Screen,
  Text,
  TextField,
  VerifiedBadge,
} from '@/design-system';
import { api } from '@/lib/api';
import { resetAnalytics } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/stores/session';

/**
 * Your profile — identity, trust (VerifiedBadge + reliability/safety scores),
 * interests, and settings. Editing goes through the shared profileSetupSchema.
 * The trial CTA only appears when engagement-gated eligibility passes (≥2 meetups
 * or ≥1 crew) — never dangled at install.
 */
export default function ProfileScreen(): React.ReactElement {
  const router = useRouter();
  const profileQuery = useMyProfile();
  const update = useUpdateProfile();
  const entitlement = useSession((s) => s.entitlement);
  const signOut = useSession((s) => s.signOut);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [neighborhood, setNeighborhood] = useState('');

  if (profileQuery.isLoading || !profileQuery.data) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.ember} />
      </Screen>
    );
  }

  const { profile, interests, completedMeetups, activeCrews } = profileQuery.data;
  const trial = checkTrialEligibility({
    completedMeetups,
    activeCrews,
    hasUsedTrial: false,
    currentEntitlement: entitlement,
  });

  function startEdit(): void {
    setName(profile.displayName);
    setBio(profile.bio ?? '');
    setNeighborhood(profile.neighborhood ?? '');
    setEditing(true);
  }

  function saveEdit(): void {
    update.mutate(
      {
        displayName: name,
        languages: profile.languages.length ? [...profile.languages] : ['tr'],
        ...(bio.trim() ? { bio } : {}),
        ...(neighborhood.trim() ? { neighborhood } : {}),
      },
      { onSuccess: () => setEditing(false) },
    );
  }

  async function doSignOut(): Promise<void> {
    await supabase.auth.signOut();
    resetAnalytics();
    signOut();
    router.replace('/(auth)/phone');
  }

  function confirmDelete(): void {
    Alert.alert(
      'Delete account',
      'This permanently erases your account and data (KVKK/GDPR). This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await api.del('/me', accountDeletionSchema.parse({ confirm: true }));
              } finally {
                await doSignOut();
              }
            })();
          },
        },
      ],
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerClassName="px-5 pt-6 pb-24 gap-5"
        showsVerticalScrollIndicator={false}
      >
        {/* Identity */}
        <View className="items-center gap-3">
          <Avatar name={profile.displayName} uri={profile.avatarUrl} size="xl" />
          {editing ? null : (
            <>
              <View className="flex-row items-center gap-2">
                <Text variant="title">{profile.displayName}</Text>
              </View>
              <VerifiedBadge level={profile.verificationLevel} />
              {profile.neighborhood ? (
                <Text variant="footnote" className="text-ink-subtle">
                  {profile.neighborhood}
                </Text>
              ) : null}
            </>
          )}
        </View>

        {editing ? (
          <Card className="gap-2">
            <TextField
              label="Display name"
              value={name}
              onChangeText={setName}
              maxLength={40}
              showCounter
            />
            <TextField
              label="Bio"
              value={bio}
              onChangeText={setBio}
              maxLength={500}
              showCounter
              multiline
              numberOfLines={3}
            />
            <TextField
              label="Neighborhood"
              value={neighborhood}
              onChangeText={setNeighborhood}
              maxLength={80}
            />
            <View className="flex-row gap-3 pt-1">
              <Button label="Cancel" variant="secondary" onPress={() => setEditing(false)} />
              <Button
                label="Save"
                loading={update.isPending}
                disabled={name.trim().length < 2}
                onPress={saveEdit}
              />
            </View>
          </Card>
        ) : (
          <>
            {/* Reputation */}
            <Card className="flex-row justify-around">
              <Stat
                label="Reliability"
                value={Math.round(profile.reliabilityScore)}
                tint={colors.success}
              />
              <View className="w-px bg-line" />
              <Stat label="Safety" value={Math.round(profile.safetyScore)} tint={colors.verified} />
              <View className="w-px bg-line" />
              <Stat label="Meetups" value={completedMeetups} tint={colors.ember} />
            </Card>

            {profile.bio ? (
              <Card>
                <Text variant="body">{profile.bio}</Text>
              </Card>
            ) : null}

            {/* Interests */}
            {interests.length > 0 ? (
              <View className="gap-2">
                <Text variant="caption" className="text-ink-subtle">
                  Interests
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {interests.map((i) => (
                    <Badge key={i.id} label={i.label} tone="ember" />
                  ))}
                </View>
              </View>
            ) : null}

            <Button label="Edit profile" variant="secondary" onPress={startEdit} />

            {/* Trial / premium — engagement-gated */}
            {trial.eligible ? (
              <Card className="gap-2 border-grape-soft bg-grape-soft">
                <Text variant="bodyStrong" className="text-grape">
                  You've earned a free Tayfa+ trial
                </Text>
                <Text variant="footnote" className="text-ink-muted">
                  You've shown up. Try premium free for 7 days — more & better plans, no pressure.
                </Text>
                <Button
                  label="Start free trial"
                  variant="premium"
                  onPress={() => router.push('/paywall?placement=P-3')}
                />
              </Card>
            ) : null}

            {/* Settings */}
            <View className="gap-2">
              <Text variant="caption" className="text-ink-subtle">
                Settings
              </Text>
              <Card padded={false}>
                <Row
                  icon="shield-checkmark"
                  tint={colors.verified}
                  label="Safety Center"
                  onPress={() => router.push('/safety-center')}
                />
                <Divider />
                <Row
                  icon="sparkles"
                  tint={colors.grape}
                  label="Tayfa+"
                  onPress={() => router.push('/paywall')}
                />
                <Divider />
                <Row
                  icon="log-out-outline"
                  tint={colors.inkMuted}
                  label="Sign out"
                  onPress={() => void doSignOut()}
                />
                <Divider />
                <Row
                  icon="trash-outline"
                  tint={colors.danger}
                  label="Delete account"
                  destructive
                  onPress={confirmDelete}
                />
              </Card>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Stat({
  label,
  value,
  tint,
}: {
  label: string;
  value: number;
  tint: string;
}): React.ReactElement {
  return (
    <View className="items-center gap-1">
      <Text variant="h1" style={{ color: tint }}>
        {value}
      </Text>
      <Text variant="footnote" className="text-ink-subtle">
        {label}
      </Text>
    </View>
  );
}

function Divider(): React.ReactElement {
  return <View className="h-px bg-line" />;
}

function Row({
  icon,
  label,
  tint,
  onPress,
  destructive = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tint: string;
  onPress: () => void;
  destructive?: boolean;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-4 active:bg-surface-alt"
    >
      <Ionicons name={icon} size={20} color={tint} />
      <Text variant="bodyStrong" className={destructive ? 'flex-1 text-danger' : 'flex-1 text-ink'}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.inkSubtle} />
    </Pressable>
  );
}

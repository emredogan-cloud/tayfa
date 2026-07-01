import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { accountDeletionSchema } from '@tayfa/shared/schemas';
import { checkTrialEligibility } from '@tayfa/shared/domain';
import { useMyProfile } from '@/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CenterModal,
  colors,
  ConfirmDialog,
  Screen,
  Text,
  TextField,
  VerifiedBadge,
} from '@/design-system';
import { api } from '@/lib/api';
import { resetAnalytics } from '@/lib/analytics';
import { interestIcon } from '@/lib/interestMeta';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/stores/session';

/**
 * Your profile — the "You" tab (redesign `18-profile` / `20-settings`). Centered
 * identity + trust scores, bio, interests, an Edit-profile entry, and Settings.
 * Sign out now confirms first and resets the nav stack (no more back-into-the-app
 * bug); Delete account is a proper KVKK/GDPR modal with a type-to-confirm gate.
 */
export default function ProfileScreen(): React.ReactElement {
  const router = useRouter();
  const profileQuery = useMyProfile();
  const entitlement = useSession((s) => s.entitlement);
  const signOut = useSession((s) => s.signOut);

  const [signOutOpen, setSignOutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  async function doSignOut(): Promise<void> {
    await supabase.auth.signOut();
    resetAnalytics();
    signOut();
    // Reset the navigation stack so the back gesture can't return to the
    // authenticated app after signing out (bug fix b).
    try {
      router.dismissAll();
    } catch {
      // Nothing to dismiss — fine.
    }
    router.replace('/(auth)/phone');
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerClassName="px-5 pt-6 pb-24 gap-5"
        showsVerticalScrollIndicator={false}
      >
        {/* Identity */}
        <View className="items-center gap-3">
          <View>
            <Avatar name={profile.displayName} uri={profile.avatarUrl} size="xl" />
            <Pressable
              onPress={() => router.push('/edit-profile')}
              accessibilityLabel="Edit photo"
              className="absolute -bottom-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-2 border-canvas bg-surface active:opacity-80"
              style={{ elevation: 2 }}
            >
              <Ionicons name="camera" size={18} color={colors.grape} />
            </Pressable>
          </View>
          <Text variant="title">{profile.displayName}</Text>
          {profile.verificationLevel === 'none' ? null : profile.verificationLevel === 'phone' ? (
            <Badge label="Phone verified" tone="grape" icon="checkmark-circle" />
          ) : (
            <VerifiedBadge level={profile.verificationLevel} />
          )}
          {profile.neighborhood ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="location-outline" size={13} color={colors.inkSubtle} />
              <Text variant="footnote" className="text-ink-subtle">
                {profile.neighborhood}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Reputation */}
        <Card className="flex-row justify-around">
          <Stat
            label="Reliability"
            value={Math.round(profile.reliabilityScore)}
            tint={colors.success}
            icon="shield-checkmark"
            soft="bg-success-soft"
          />
          <View className="w-px bg-line" />
          <Stat
            label="Safety"
            value={Math.round(profile.safetyScore)}
            tint={colors.verified}
            icon="shield-half"
            soft="bg-verified-soft"
          />
          <View className="w-px bg-line" />
          <Stat
            label="Meetups"
            value={completedMeetups}
            tint={colors.ember}
            icon="people"
            soft="bg-ember-soft"
          />
        </Card>

        {/* Bio */}
        {profile.bio ? (
          <Card className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-soft">
              <Text style={{ fontSize: 20 }}>👋</Text>
            </View>
            <Text variant="body" className="flex-1">
              {profile.bio}
            </Text>
          </Card>
        ) : null}

        {/* Interests */}
        {interests.length > 0 ? (
          <View className="gap-2">
            <Text variant="caption" className="text-ink-subtle">
              Interests
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {interests.map((i) => {
                const meta = interestIcon(i.domain);
                return (
                  <View
                    key={i.id}
                    className="flex-row items-center gap-1.5 rounded-full bg-ember-soft px-3 py-2"
                  >
                    <Ionicons name={meta.icon} size={14} color={meta.color} />
                    <Text variant="subhead" className="font-semibold text-ember-dark">
                      {i.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Edit profile */}
        <Pressable
          onPress={() => router.push('/edit-profile')}
          accessibilityRole="button"
          className="flex-row items-center justify-center gap-2 rounded-2xl border border-ember bg-surface py-3.5 active:bg-ember-soft"
        >
          <Ionicons name="create-outline" size={18} color={colors.ember} />
          <Text variant="bodyStrong" className="text-ember">
            Edit profile
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.ember} />
        </Pressable>

        {/* Trial / premium — engagement-gated, never dangled at install */}
        {trial.eligible ? (
          <Card className="gap-2 border-grape-soft bg-grape-soft">
            <Text variant="bodyStrong" className="text-grape">
              You&apos;ve earned a free Tayfa+ trial
            </Text>
            <Text variant="footnote" className="text-ink-muted">
              You&apos;ve shown up. Try premium free for 7 days — more &amp; better plans, no
              pressure.
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
              sublabel="Emergency & safety tools"
              onPress={() => router.push('/safety-center')}
            />
            <Divider />
            <Row
              icon="sparkles"
              tint={colors.grape}
              label="Tayfa+"
              sublabel="Premium features & perks"
              badge={<Badge label="New" tone="grape" />}
              onPress={() => router.push('/paywall')}
            />
            <Divider />
            <Row
              icon="log-out-outline"
              tint={colors.inkMuted}
              label="Sign out"
              sublabel="See you next time!"
              onPress={() => setSignOutOpen(true)}
            />
            <Divider />
            <Row
              icon="trash-outline"
              tint={colors.danger}
              label="Delete account"
              sublabel="Permanently delete your account"
              destructive
              onPress={() => setDeleteOpen(true)}
            />
          </Card>
        </View>
      </ScrollView>

      {/* Sign out — confirm first (bug fix b) */}
      <ConfirmDialog
        visible={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        onConfirm={() => {
          setSignOutOpen(false);
          void doSignOut();
        }}
        tone="ember"
        icon="log-out-outline"
        title="Sign out?"
        message="See you next time! You'll need to sign in again to get back to your crews."
        confirmLabel="Sign out"
        cancelLabel="Stay"
      />

      {/* Delete account — modern KVKK/GDPR flow (bug fix c) */}
      <DeleteAccountModal
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={doSignOut}
      />
    </Screen>
  );
}

function Stat({
  label,
  value,
  tint,
  icon,
  soft,
}: {
  label: string;
  value: number;
  tint: string;
  icon: keyof typeof Ionicons.glyphMap;
  soft: string;
}): React.ReactElement {
  return (
    <View className="items-center gap-1">
      <Text variant="h1" style={{ color: tint }}>
        {value}
      </Text>
      <Text variant="footnote" className="text-ink-subtle">
        {label}
      </Text>
      <View className={`mt-1 h-8 w-8 items-center justify-center rounded-full ${soft}`}>
        <Ionicons name={icon} size={15} color={tint} />
      </View>
    </View>
  );
}

function Divider(): React.ReactElement {
  return <View className="h-px bg-line" />;
}

function Row({
  icon,
  label,
  sublabel,
  tint,
  onPress,
  badge,
  destructive = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel: string;
  tint: string;
  onPress: () => void;
  badge?: React.ReactNode;
  destructive?: boolean;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-4 active:bg-surface-alt"
    >
      <Ionicons name={icon} size={22} color={tint} />
      <View className="flex-1">
        <Text variant="bodyStrong" className={destructive ? 'text-danger' : 'text-ink'}>
          {label}
        </Text>
        <Text variant="footnote" className="text-ink-muted">
          {sublabel}
        </Text>
      </View>
      {badge}
      <Ionicons name="chevron-forward" size={18} color={colors.inkSubtle} />
    </Pressable>
  );
}

function DeleteAccountModal({
  visible,
  onClose,
  onDeleted,
}: {
  visible: boolean;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}): React.ReactElement {
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canDelete = confirmText.trim().toUpperCase() === 'DELETE';

  async function remove(): Promise<void> {
    if (!canDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await api.del(
        '/me',
        accountDeletionSchema.parse({
          confirm: true,
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        }),
      );
      await onDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete your account. Try again.');
      setDeleting(false);
    }
  }

  return (
    <CenterModal visible={visible} onClose={deleting ? () => undefined : onClose}>
      <View className="items-center gap-2">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-danger-soft">
          <Ionicons name="trash" size={26} color={colors.danger} />
        </View>
        <Text variant="h1" className="text-center">
          Delete account
        </Text>
        <Text variant="callout" className="text-center text-ink-muted">
          This permanently erases your account, meetups and messages (KVKK/GDPR). It can&apos;t be
          undone.
        </Text>
      </View>

      <View className="mt-4 gap-3">
        <TextField
          label="Why are you leaving? (optional)"
          value={reason}
          onChangeText={setReason}
          maxLength={500}
          multiline
          numberOfLines={2}
          placeholder="Your feedback helps us improve."
        />
        <TextField
          label="Type DELETE to confirm"
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="DELETE"
        />
      </View>

      {error ? (
        <Text variant="footnote" className="mt-3 text-center text-danger">
          {error}
        </Text>
      ) : null}

      <View className="mt-5 gap-2">
        <Button
          label="Delete my account"
          variant="danger"
          loading={deleting}
          disabled={!canDelete}
          onPress={() => void remove()}
        />
        <Button label="Cancel" variant="ghost" disabled={deleting} onPress={onClose} />
      </View>
    </CenterModal>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Crew } from '@tayfa/shared/types';
import { canCreateCrew } from '@tayfa/shared/domain';
import { FREE_TIER_LIMITS } from '@tayfa/shared/constants';
import { api } from '@/lib/api';
import { Badge, Button, Card, colors, Screen, Text } from '@/design-system';
import { useSession } from '@/stores/session';

const CADENCE_LABEL: Record<Crew['cadence'], string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  ad_hoc: 'Now & then',
};

/** Derive a friendly category glyph from the crew name. */
function crewIcon(name: string): { icon: keyof typeof Ionicons.glyphMap; color: string } {
  const n = name.toLowerCase();
  if (/bike|cycl|ride/.test(n)) return { icon: 'bicycle', color: colors.grape };
  if (/coffee|brunch|caf/.test(n)) return { icon: 'cafe', color: colors.verified };
  if (/board|game|chess|catan/.test(n)) return { icon: 'dice', color: colors.grape };
  if (/book|read/.test(n)) return { icon: 'book', color: colors.amber };
  if (/run|hike|walk|climb|boulder/.test(n)) return { icon: 'walk', color: colors.verified };
  if (/music|gig|concert/.test(n)) return { icon: 'musical-notes', color: colors.grape };
  if (/food|dinner|eat/.test(n)) return { icon: 'restaurant', color: colors.amber };
  return { icon: 'people', color: colors.ember };
}

/**
 * Crews home (P6; redesign `17-crews`) — the retention engine. A crew is a
 * recurring small group that forms out of repeated meetups. Free tier hosts up
 * to FREE_TIER_LIMITS.maxActiveCrews; beyond that, unlimited crews is a premium
 * upgrade (gated via canCreateCrew, the server-side entitlement check — never a
 * client flag).
 */
export default function CrewsScreen(): React.ReactElement {
  const router = useRouter();
  const entitlement = useSession((s) => s.entitlement);
  const crews = useQuery({
    queryKey: ['crews'],
    queryFn: ({ signal }) => api.get<readonly Crew[]>('/me/crews', undefined, signal),
  });

  const list = crews.data ?? [];
  const allowNew = canCreateCrew(entitlement, list.length);

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerClassName="px-5 pt-6 pb-24 gap-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text variant="display">Your crews</Text>
            <Text variant="callout" className="mt-2 text-ink-muted">
              The people you keep showing up for. Crews turn one good night into a habit.
            </Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-full bg-ember-soft">
            <Ionicons name="people" size={22} color={colors.ember} />
          </View>
        </View>

        {/* Streak banner */}
        <Card className="flex-row items-center gap-3 border-amber-soft bg-amber-soft">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-amber">
            <Ionicons name="water" size={20} color={colors.inkInverse} />
          </View>
          <View className="flex-1">
            <Text variant="bodyStrong">Keep your streak alive</Text>
            <Text variant="footnote" className="text-ink-muted">
              Meet up again this week to keep the momentum going.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.amber} />
        </Card>

        {crews.isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={colors.ember} />
          </View>
        ) : list.length === 0 ? (
          <Card className="items-center gap-3 py-8">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-grape-soft">
              <Ionicons name="people" size={26} color={colors.grape} />
            </View>
            <Text variant="h2" className="text-center">
              No crews yet
            </Text>
            <Text variant="footnote" className="px-6 text-center text-ink-muted">
              After a couple of great meetups, invite the regulars to form a crew and lock in a
              recurring plan.
            </Text>
          </Card>
        ) : (
          <View className="gap-3">
            {list.map((crew) => {
              const meta = crewIcon(crew.name);
              return (
                <Card key={crew.id} className="gap-3">
                  <View className="flex-row items-center gap-3">
                    <View
                      style={{ backgroundColor: `${meta.color}22` }}
                      className="h-12 w-12 items-center justify-center rounded-full"
                    >
                      <Ionicons name={meta.icon} size={24} color={meta.color} />
                    </View>
                    <Text variant="h2" className="flex-1">
                      {crew.name}
                    </Text>
                    <Badge
                      label={CADENCE_LABEL[crew.cadence].toUpperCase()}
                      tone="grape"
                      icon="repeat"
                    />
                  </View>
                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="people-outline" size={14} color={colors.inkMuted} />
                      <Text variant="footnote" className="text-ink-muted">
                        {crew.memberCount} members
                      </Text>
                    </View>
                    {crew.nextMeetupAt ? (
                      <View className="flex-row items-center gap-1.5">
                        <Ionicons name="calendar-outline" size={14} color={colors.inkMuted} />
                        <Text variant="footnote" className="text-ink-muted">
                          Next: {new Date(crew.nextMeetupAt).toLocaleDateString()}
                        </Text>
                      </View>
                    ) : (
                      <Text variant="footnote" className="text-ink-subtle">
                        No plan set
                      </Text>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {allowNew ? (
          <Pressable
            onPress={() => router.push('/(tabs)/create')}
            accessibilityRole="button"
            className="flex-row items-center gap-3 rounded-2xl border border-dashed border-line-strong p-4 active:opacity-80"
          >
            <View className="h-12 w-12 items-center justify-center rounded-full bg-ember-soft">
              <Ionicons name="add" size={24} color={colors.ember} />
            </View>
            <View className="flex-1">
              <Text variant="bodyStrong">Form a crew</Text>
              <Text variant="footnote" className="text-ink-muted">
                Find your people. Start something great.
              </Text>
            </View>
            <Ionicons name="sparkles" size={18} color={colors.amber} />
          </Pressable>
        ) : (
          <Card className="gap-3 border-grape-soft bg-grape-soft">
            <Text variant="bodyStrong" className="text-grape">
              You&apos;re at {FREE_TIER_LIMITS.maxActiveCrews} crews
            </Text>
            <Text variant="footnote" className="text-ink-muted">
              Tayfa+ unlocks unlimited crews so you can keep every circle going at once.
            </Text>
            <Button
              label="See Tayfa+"
              variant="premium"
              onPress={() => router.push('/paywall?feature=unlimited_crews')}
            />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

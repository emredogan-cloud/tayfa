import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, SegmentedProgress, shadows, Text } from '@/design-system';

/**
 * Shared header for the auth/onboarding flow (redesign): an optional back chip
 * on the left, an optional context pill on the right ("Secure verification",
 * "One-time check"), and an optional step progress bar underneath. Keeps the
 * three auth screens visually consistent.
 */
export interface AuthHeaderProps {
  showBack?: boolean;
  pill?: { icon: keyof typeof Ionicons.glyphMap; label: string };
  progress?: { steps: number; current: number };
  /** Custom right-side element (e.g. a language selector) instead of a pill. */
  right?: React.ReactNode;
}

export function AuthHeader({
  showBack = true,
  pill,
  progress,
  right,
}: AuthHeaderProps): React.ReactElement {
  const router = useRouter();
  return (
    <View className="gap-5">
      <View className="h-11 flex-row items-center justify-between">
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-surface-alt active:opacity-70"
          >
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
        ) : (
          <View className="h-11 w-11" />
        )}
        {right ??
          (pill ? (
            <View
              style={shadows.card}
              className="flex-row items-center gap-1.5 rounded-full bg-surface px-3.5 py-2.5"
            >
              <Ionicons name={pill.icon} size={15} color={colors.verified} />
              <Text variant="subhead" className="font-semibold text-ink">
                {pill.label}
              </Text>
            </View>
          ) : null)}
      </View>
      {progress ? <SegmentedProgress steps={progress.steps} current={progress.current} /> : null}
    </View>
  );
}

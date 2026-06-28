import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { colors, Screen, Text } from '@/design-system';
import { useSession } from '@/stores/session';

/**
 * Route gate. Until the Supabase session is checked we show a warm splash; then
 * we branch: unauthenticated → phone, authenticated-but-unonboarded → taste
 * cards, fully set up → the feed. Every deeper screen assumes a session exists.
 */
export default function Index(): React.ReactElement {
  const hydrated = useSession((s) => s.hydrated);
  const userId = useSession((s) => s.userId);
  const onboardingComplete = useSession((s) => s.onboardingComplete);

  if (!hydrated) {
    return (
      <Screen className="items-center justify-center">
        <View className="items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-ember">
            <Text variant="title" className="text-ink-inverse">
              T
            </Text>
          </View>
          <Text variant="h2">Tayfa</Text>
          <ActivityIndicator color={colors.ember} />
        </View>
      </Screen>
    );
  }

  if (!userId) return <Redirect href="/(auth)/phone" />;
  if (!onboardingComplete) return <Redirect href="/(onboarding)/interests" />;
  return <Redirect href="/(tabs)/feed" />;
}

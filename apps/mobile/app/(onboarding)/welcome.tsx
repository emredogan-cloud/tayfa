import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, colors, Screen, Text } from '@/design-system';
import { cn } from '@/lib/cn';
import { illustrations } from '@/lib/illustrations';
import { supabase, supabaseReady } from '@/lib/supabase';
import { useSession } from '@/stores/session';
import { track } from '@/lib/analytics';

/**
 * First-run welcome (redesign `0001-first-onboarding`). The first screen a
 * brand-new user sees: brand promise + the four pillars + entry into auth. Shown
 * only until `hasSeenWelcome` is set (persisted), then the route gate sends
 * first-time users straight to phone auth. Verified phone-OTP is the primary
 * path; "Continue with Google" is a convenience wired to Supabase OAuth in
 * configured builds with a graceful fall-through to phone in demo/mock builds.
 */
const FEATURES = [
  {
    icon: 'people' as const,
    tint: 'bg-ember-soft',
    color: colors.ember,
    title: 'Small crews',
    body: 'Meaningful connections, not crowds.',
  },
  {
    icon: 'shield-checkmark' as const,
    tint: 'bg-verified-soft',
    color: colors.verified,
    title: 'Safe & verified',
    body: 'Verified people, built-in safety tools.',
  },
  {
    icon: 'sparkles' as const,
    tint: 'bg-grape-soft',
    color: colors.grape,
    title: 'Find your vibe',
    body: 'Discover meetups around your interests.',
  },
  {
    icon: 'add-circle' as const,
    tint: 'bg-amber-soft',
    color: colors.amber,
    title: 'Host with ease',
    body: 'Create hangouts and bring your crew.',
  },
];

export default function WelcomeScreen(): React.ReactElement {
  const router = useRouter();
  const setHasSeenWelcome = useSession((s) => s.setHasSeenWelcome);

  function goPhone(method: 'get_started' | 'log_in'): void {
    setHasSeenWelcome(true);
    track('welcome_cta_tapped', { method });
    router.replace('/(auth)/phone');
  }

  async function continueWithGoogle(): Promise<void> {
    setHasSeenWelcome(true);
    track('welcome_cta_tapped', { method: 'google' });
    if (supabaseReady) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { skipBrowserRedirect: true },
        });
        if (!error && data?.url) {
          await Linking.openURL(data.url);
          return;
        }
      } catch {
        // fall through to the verified phone flow
      }
    }
    router.replace('/(auth)/phone');
  }

  return (
    <Screen scroll contentClassName="pb-8">
      {/* Brand wordmark */}
      <View className="flex-row items-center justify-center gap-1 pt-2">
        <Text
          style={{ fontSize: 30, lineHeight: 34 }}
          className="font-extrabold tracking-tight text-ember"
        >
          Tayfa
        </Text>
        <Ionicons name="sparkles" size={15} color={colors.ember} />
      </View>

      {/* Hero headline + subhead */}
      <Text
        style={{ fontSize: 38, lineHeight: 42 }}
        className="mt-3 text-center font-extrabold tracking-tight text-ink"
      >
        Meet up,{'\n'}your way.
      </Text>
      <Text variant="callout" className="mt-3 text-center text-ink-muted">
        Real people, real plans,{'\n'}real connections.
      </Text>

      {/* People illustration */}
      <Image
        source={illustrations.welcomePeople}
        style={{ width: '100%', height: 250 }}
        contentFit="contain"
        transition={200}
        accessibilityLabel="A group of friends meeting up together"
      />

      {/* The four pillars */}
      <Card className="flex-row justify-between gap-1 p-4">
        {FEATURES.map((f) => (
          <View key={f.title} className="flex-1 items-center gap-2">
            <View className={cn('h-12 w-12 items-center justify-center rounded-full', f.tint)}>
              <Ionicons name={f.icon} size={22} color={f.color} />
            </View>
            <Text
              style={{ fontSize: 13, lineHeight: 16 }}
              className="text-center font-bold text-ink"
            >
              {f.title}
            </Text>
            <Text
              style={{ fontSize: 11, lineHeight: 15 }}
              className="text-center font-normal text-ink-subtle"
            >
              {f.body}
            </Text>
          </View>
        ))}
      </Card>

      {/* CTAs */}
      <Button
        label="Get started"
        className="mt-6"
        onPress={() => goPhone('get_started')}
        rightIcon={<Ionicons name="arrow-forward" size={20} color={colors.inkInverse} />}
      />
      <Button
        label="Continue with Google"
        variant="secondary"
        className="mt-3"
        onPress={() => void continueWithGoogle()}
        leftIcon={<Ionicons name="logo-google" size={18} color="#4285F4" />}
      />

      {/* Log in */}
      <View className="mt-5 flex-row items-center justify-center gap-1.5">
        <Text variant="subhead" className="text-ink-muted">
          Already have an account?
        </Text>
        <Text
          variant="subhead"
          className="font-bold text-ember underline"
          onPress={() => goPhone('log_in')}
        >
          Log in
        </Text>
      </View>
    </Screen>
  );
}

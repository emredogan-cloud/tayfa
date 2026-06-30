import '../global.css';

import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { asId } from '@tayfa/shared/types';

import { colors } from '@/design-system';
import { queryClient } from '@/lib/queryClient';
import { api, setAuthTokenProvider } from '@/lib/api';
import { getAccessToken, supabase, supabaseReady } from '@/lib/supabase';
import { clearPersistedSession, loadPersistedSession } from '@/lib/sessionStorage';
import { initSentry, Sentry } from '@/lib/sentry';
import { initAnalytics, identifyUser } from '@/lib/analytics';
import { useSession } from '@/stores/session';
import type { SessionBootstrap } from '@/api/types';

function RootLayout(): React.ReactElement {
  const hydrate = useSession((s) => s.hydrate);
  const signOut = useSession((s) => s.signOut);
  const setPhone = useSession((s) => s.setPhone);

  useEffect(() => {
    initSentry();
    initAnalytics();
    // The BFF auth header is sourced from the live Supabase session (keychain).
    setAuthTokenProvider(getAccessToken);

    let mounted = true;

    async function bootstrap(): Promise<void> {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      if (!mounted) return;

      if (!user) {
        // No live Supabase session. In a configured (production) build this means
        // the user is genuinely signed out → drop any stale persisted mirror. In
        // mock/demo builds (Supabase unconfigured) there is never a live session,
        // so restore the persisted slice — this is what keeps a completed
        // onboarding from bouncing the user back to the intro on every cold start.
        if (supabaseReady) {
          await clearPersistedSession();
          if (!mounted) return;
          hydrate({ userId: null });
          return;
        }
        const persisted = await loadPersistedSession();
        if (!mounted) return;
        if (persisted?.userId) {
          hydrate({
            userId: persisted.userId,
            verificationLevel: persisted.verificationLevel,
            entitlement: persisted.entitlement,
            onboardingComplete: persisted.onboardingComplete,
            hasSeenWelcome: persisted.hasSeenWelcome,
          });
          if (persisted.phone) setPhone(persisted.phone);
        } else {
          hydrate({ userId: null, hasSeenWelcome: persisted?.hasSeenWelcome ?? false });
        }
        return;
      }
      // Optimistically mark authenticated, then enrich from the BFF (server truth
      // for verification level + entitlement + onboarding completion).
      hydrate({ userId: asId<'UserId'>(user.id) });
      try {
        const boot = await api.get<SessionBootstrap>('/me/session');
        if (!mounted) return;
        hydrate({
          userId: boot.userId,
          verificationLevel: boot.verificationLevel,
          entitlement: boot.entitlement,
          onboardingComplete: boot.onboardingComplete,
        });
        identifyUser(boot.userId);
      } catch {
        // Offline / mock mode: keep the optimistic session; the gate still works.
      }
    }

    void bootstrap();

    // Only let real Supabase auth events drive sign-out. In mock/demo mode the
    // placeholder client emits an initial null-session event that would otherwise
    // wipe the just-restored persisted session.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (supabaseReady && !session?.user) signOut();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrate, signOut, setPhone]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.canvas },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
            <Stack.Screen name="safety-center" options={{ presentation: 'modal' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Sentry.wrap adds touch/navigation breadcrumbs + error boundary at the root.
export default Sentry.wrap(RootLayout);

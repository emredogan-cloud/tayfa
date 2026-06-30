/**
 * Public runtime config. Only EXPO_PUBLIC_* values may live here — they are
 * inlined into the client bundle and must be safe to expose (RLS + the BFF
 * protect everything that matters). Server-only secrets never reach the app.
 */
export const ENV = {
  /** Tayfa BFF base URL — the ONLY backend the client talks to for app data. */
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '',
  posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  /**
   * Demo/tester builds set EXPO_PUBLIC_ALLOW_MOCK=1 so the canned mock-data
   * fallback works even in a standalone (release, __DEV__=false) build that has
   * no backend to reach. Real production builds leave it unset → never mock.
   */
  allowMock: process.env.EXPO_PUBLIC_ALLOW_MOCK === '1',
} as const;

export const isConfigured = {
  supabase: ENV.supabaseUrl.length > 0 && ENV.supabaseAnonKey.length > 0,
  posthog: ENV.posthogKey.length > 0,
  sentry: ENV.sentryDsn.length > 0,
} as const;

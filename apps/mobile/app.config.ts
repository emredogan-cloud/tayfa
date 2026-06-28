import type { ExpoConfig } from 'expo/config';

/**
 * Tayfa Expo app config (EAS-ready). Secrets are read from EXPO_PUBLIC_* env at
 * build time (see .env.example); nothing sensitive is hardcoded here. Permission
 * strings are explicit and purpose-limited (App Store / KVKK transparency).
 */
const config: ExpoConfig = {
  name: 'Tayfa',
  slug: 'tayfa',
  scheme: 'tayfa',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  // Re-fetch JS over-the-air only when native runtime is compatible.
  runtimeVersion: { policy: 'fingerprint' },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'app.tayfa.mobile',
    config: { usesNonExemptEncryption: false },
    infoPlist: {
      // Precise location is only ever used to surface nearby meetups; the server
      // fuzzes everything to a geocell centroid before it reaches other users.
      NSLocationWhenInUseUsageDescription:
        'Tayfa uses your location to show meetups happening near you. Your precise spot is never shared with other people.',
    },
  },
  android: {
    package: 'app.tayfa.mobile',
    adaptiveIcon: { backgroundColor: '#FFFBF7' },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Tayfa uses your location to show meetups near you. We never share your exact location with other users.',
      },
    ],
    [
      '@sentry/react-native/expo',
      {
        organization: process.env.SENTRY_ORG ?? 'tayfa',
        project: process.env.SENTRY_PROJECT ?? 'mobile',
      },
    ],
  ],
  extra: {
    eas: { projectId: process.env.EAS_PROJECT_ID ?? '00000000-0000-0000-0000-000000000000' },
  },
};

export default config;

import * as Sentry from '@sentry/react-native';
import { ENV, isConfigured } from './env';

/**
 * Crash + performance monitoring. No-ops cleanly when no DSN is configured
 * (mock/dev). PII is scrubbed by default; we never attach precise location or
 * message bodies to events.
 */
let started = false;

export function initSentry(): void {
  if (started) return;
  started = true;
  // Always init (so the root `Sentry.wrap` has an initialized client and does not
  // warn) but stay DISABLED when no DSN is set — no events leave the device in
  // mock/dev. PII is never attached (no precise location or message bodies).
  Sentry.init({
    dsn: isConfigured.sentry ? ENV.sentryDsn : undefined,
    enabled: isConfigured.sentry,
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
    enableAutoSessionTracking: isConfigured.sentry,
  });
}

// Initialize at module load so it runs before `Sentry.wrap` at the app root.
initSentry();

export { Sentry };

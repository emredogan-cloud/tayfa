import * as Sentry from '@sentry/react-native';
import { ENV, isConfigured } from './env';

/**
 * Crash + performance monitoring. No-ops cleanly when no DSN is configured
 * (mock/dev). PII is scrubbed by default; we never attach precise location or
 * message bodies to events.
 */
export function initSentry(): void {
  if (!isConfigured.sentry) return;
  Sentry.init({
    dsn: ENV.sentryDsn,
    tracesSampleRate: 0.2,
    // Don't ship breadcrumbs that could carry user content.
    sendDefaultPii: false,
    enableAutoSessionTracking: true,
  });
}

export { Sentry };

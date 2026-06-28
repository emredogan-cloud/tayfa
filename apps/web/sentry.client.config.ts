import * as Sentry from '@sentry/nextjs';

/**
 * Browser Sentry init. Uses the PUBLIC DSN and runs only when configured.
 * Session replay masks all text/inputs — we never want a user's messages,
 * neighborhood, or verification flow captured. No-op without a DSN.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
    integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
    sendDefaultPii: false,
  });
}

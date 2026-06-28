import * as Sentry from '@sentry/nextjs';

/**
 * Edge-runtime Sentry init (middleware + edge routes). Mirrors the server config
 * but runs in the Vercel Edge runtime. No-op without SENTRY_DSN.
 */
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    sendDefaultPii: false,
  });
}

import * as Sentry from '@sentry/nextjs';

/**
 * Server-runtime Sentry init (Node BFF handlers, RSC, T&S console).
 * No-op when SENTRY_DSN is absent so mock/CI runs stay quiet and free.
 * We never send PII: precise location, phone, and document data are out of scope
 * by construction (the BFF is the only tier that ever sees them).
 */
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // KVKK/GDPR: do not attach request bodies or IPs to events.
    sendDefaultPii: false,
  });
}

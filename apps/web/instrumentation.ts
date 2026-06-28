import * as Sentry from '@sentry/nextjs';

/**
 * Next.js instrumentation hook. Loads the right Sentry init for each runtime
 * (Node BFF vs Edge middleware). The browser config lives in
 * `sentry.client.config.ts` and is wired automatically by the Sentry plugin.
 * All inits are no-ops without a DSN, so mock/CI runs stay clean.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config.js');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config.js');
  }
}

// Capture errors thrown in nested React Server Components (App Router).
export const onRequestError = Sentry.captureRequestError;

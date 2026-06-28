import { PostHog } from 'posthog-node';
import {
  buildAnalyticsEvent,
  type AnalyticsEventName,
  type AnalyticsProps,
} from '@tayfa/shared/events';
import { env } from './env.js';

/**
 * Server-side analytics (PostHog EU). Two invariants:
 *
 *  1. CONSENT-GATED. We only transmit when the caller passes `consented: true`
 *     (the user's analytics/product consent). Without it we still BUILD the event
 *     so a malformed call fails loudly in dev — we just don't send it.
 *
 *  2. SCHEMA-VALIDATED. Every event goes through `buildAnalyticsEvent`, so an
 *     un-budgeted property or a typo is a hard error, never silent PostHog spend.
 *
 * No-op (but still validating) when POSTHOG key is absent — mock/CI stays quiet.
 */

let client: PostHog | null = null;
function getClient(): PostHog | null {
  const key = env.posthogKey();
  if (!key) return null;
  // flushAt:1 + short interval: serverless functions are short-lived, so we send
  // eagerly rather than buffering events that would die with the invocation.
  client ??= new PostHog(key, { host: env.posthogHost(), flushAt: 1, flushInterval: 0 });
  return client;
}

export interface CaptureOptions {
  /** The user's analytics/product-improvement consent. Required to transmit. */
  readonly consented: boolean;
}

/**
 * Validate + (consent-gated) capture a typed analytics event. Returns the built
 * event so callers can also persist/inspect it. Throws if `props` are invalid —
 * that's a developer bug, caught in dev/CI.
 */
export async function captureAnalytics<N extends AnalyticsEventName>(
  distinctId: string,
  name: N,
  props: AnalyticsProps<N>,
  opts: CaptureOptions,
): Promise<void> {
  // Always validate (throws on malformed input) — even when we won't transmit.
  const event = buildAnalyticsEvent(name, props);
  if (!opts.consented) return;

  const ph = getClient();
  if (!ph) return;

  ph.capture({
    distinctId,
    event: event.name,
    properties: { ...event.props, $lib: 'tayfa-bff' },
  });
}

/** Flush pending events at the end of a request (best-effort). */
export async function flushAnalytics(): Promise<void> {
  if (client) await client.flush();
}

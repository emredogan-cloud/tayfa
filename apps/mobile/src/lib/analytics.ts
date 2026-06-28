import PostHog from 'posthog-react-native';
import {
  buildAnalyticsEvent,
  type AnalyticsEventName,
  type AnalyticsProps,
} from '@tayfa/shared/events';
import { ENV, isConfigured } from './env';

/**
 * Consent-gated analytics. PostHog is only ever called AFTER the user grants
 * consent (KVKK açık rıza). `buildAnalyticsEvent` validates the payload against
 * the shared taxonomy at the call site, so a malformed event is a dev-time error
 * — never silently inflating PostHog cost. Ambient props (platform, app_version,
 * session_id) are attached by PostHog's RN SDK; we don't redeclare them.
 */

let client: PostHog | null = null;
let consentGranted = false;

export function initAnalytics(): void {
  if (!isConfigured.posthog || client) return;
  client = new PostHog(ENV.posthogKey, { host: ENV.posthogHost });
  // We control opt-in ourselves via consent; start opted-out until granted.
  void client.optOut();
}

/**
 * Flip tracking on/off from the consent screen / settings. Until consent is
 * granted, every `track`/`identify` call is a no-op.
 */
export function setAnalyticsConsent(granted: boolean): void {
  consentGranted = granted;
  if (!client) return;
  if (granted) void client.optIn();
  else void client.optOut();
}

export function identifyUser(userId: string, props: Record<string, unknown> = {}): void {
  if (!consentGranted || !client) return;
  client.identify(userId, props as Record<string, string | number | boolean | null>);
}

export function resetAnalytics(): void {
  if (!client) return;
  client.reset();
}

/**
 * Type-safe capture. The generic ties the event name to its exact property
 * schema, so you cannot send `meetup_completed` without `confirmed_attendees`.
 */
export function track<N extends AnalyticsEventName>(name: N, props: AnalyticsProps<N>): void {
  // Validate even when tracking is off — catches taxonomy drift in dev.
  const event = buildAnalyticsEvent(name, props);
  if (!consentGranted || !client) return;
  client.capture(event.name, event.props as Record<string, string | number | boolean | null>);
}

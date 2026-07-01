import type {
  ConversationId,
  EventId,
  FeedEvent,
  InterestSummary,
  Message,
  PreciseEventLocation,
  Profile,
  PublicProfile,
  RsvpStatus,
  UserId,
  UserInterest,
  VerificationLevel,
} from '@tayfa/shared/types';
import type { NotificationCategory } from '@tayfa/shared/constants';

/**
 * BFF response contracts as consumed by the mobile client. These mirror the
 * shared domain types exactly — the BFF is the source of truth and must conform.
 * Precise location is OPTIONAL and only present when the BFF's
 * `canReleasePreciseLocation` gate passed for this viewer; otherwise the client
 * only ever sees the fuzzed geocell centroid carried on `FeedEvent.location`.
 */

export interface LiquiditySummary {
  /** "{n} events near you this week" — drives the discovery liquidity banner. */
  readonly eventsThisWeek: number;
  readonly radiusMeters: number;
  /** True when we widened past the default radius to fill a sparse geocell. */
  readonly widened: boolean;
}

export interface FeedResponse {
  readonly events: readonly FeedEvent[];
  readonly liquidity: LiquiditySummary;
  readonly nextCursor: string | null;
}

export interface EventDetail {
  readonly event: FeedEvent;
  /** Approved/going members the viewer is allowed to see ("who's going"). */
  readonly members: readonly EventMemberView[];
  /** The viewer's own RSVP state, or null if not a member. */
  readonly viewerRsvpStatus: RsvpStatus | null;
  /** Present ONLY when released by the BFF gate; null otherwise. */
  readonly preciseLocation: PreciseEventLocation | null;
  /** Whether the viewer is the host (drives host-only controls). */
  readonly viewerIsHost: boolean;
}

export interface EventMemberView {
  readonly profile: PublicProfile;
  readonly rsvpStatus: RsvpStatus;
  readonly isHost: boolean;
}

/** Chat message enriched for rendering: system notices + sender identity. */
export interface ChatMessage extends Message {
  readonly kind: 'user' | 'system';
  /** Null for system messages. */
  readonly sender: PublicProfile | null;
}

export interface ChatThread {
  readonly conversationId: ConversationId;
  readonly eventId: EventId;
  readonly messages: readonly ChatMessage[];
  /** AI icebreakers grounded in shared public interests (fails open to []). */
  readonly icebreakers: readonly string[];
}

export interface MyProfileResponse {
  readonly profile: Profile;
  readonly interests: readonly UserInterest[];
  /** Counts that gate trial eligibility + reputation display. */
  readonly completedMeetups: number;
  readonly activeCrews: number;
}

export interface PublicProfileResponse {
  readonly profile: PublicProfile;
}

/**
 * A single Notification Center row. Mirrors the `notification` ledger
 * (type + category + payload + sent/opened) with the payload flattened to the
 * fields the UI renders. `readAt` maps to the ledger's `openedAt`.
 */
export interface NotificationItem {
  readonly id: string;
  readonly type: string;
  readonly category: NotificationCategory;
  readonly title: string;
  readonly body: string;
  readonly createdAt: string;
  readonly readAt: string | null;
  /** Optional deep-link target extracted from the payload. */
  readonly eventId?: string | null;
}

export interface NotificationsResponse {
  readonly notifications: readonly NotificationItem[];
  readonly unreadCount: number;
}

/** A selectable interest in the onboarding taste-card catalog. */
export interface CatalogInterest extends InterestSummary {
  /** Optional popularity hint for ordering the catalog. */
  readonly popularity: number;
}

export interface RsvpResult {
  readonly eventId: EventId;
  readonly status: RsvpStatus;
  readonly requiresApproval: boolean;
}

export interface CreatedEvent {
  readonly id: EventId;
}

export interface SessionBootstrap {
  readonly userId: UserId;
  readonly verificationLevel: VerificationLevel;
  readonly entitlement: 'free' | 'tayfa_plus';
  readonly onboardingComplete: boolean;
}

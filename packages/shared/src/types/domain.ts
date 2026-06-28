import type {
  CityId,
  ConversationId,
  CrewId,
  EventId,
  InterestId,
  MessageId,
  ProfileId,
  ReportId,
  UserId,
} from './ids.js';
import type {
  ConversationScope,
  Entitlement,
  EventStatus,
  EventVisibility,
  InterestDomain,
  ReportSeverity,
  ReportStatus,
  VerificationLevel,
} from './enums.js';

/** WGS84 point. PRECISE — only ever held server-side / by approved members. */
export interface GeoPoint {
  readonly lat: number;
  readonly lng: number;
}

/**
 * What a non-approved client is allowed to see: a fuzzed location derived from
 * the geocell centroid. There is no `GeoPoint` here by construction — you cannot
 * leak precise coordinates through this type (TECH_DECISIONS / RISK §location).
 */
export interface FuzzedLocation {
  readonly geocell: string;
  readonly centroid: GeoPoint;
  readonly approxRadiusMeters: number;
  readonly neighborhood: string | null;
}

export interface Profile {
  readonly id: ProfileId;
  readonly userId: UserId;
  readonly displayName: string;
  readonly bio: string | null;
  readonly age: number;
  readonly homeCityId: CityId | null;
  readonly neighborhood: string | null;
  readonly avatarUrl: string | null;
  readonly languages: readonly string[];
  readonly verificationLevel: VerificationLevel;
  readonly reliabilityScore: number;
  readonly safetyScore: number;
  readonly entitlement: Entitlement;
  readonly createdAt: string;
}

/** The public slice of another user's profile (RLS-exposed subset). */
export interface PublicProfile {
  readonly userId: UserId;
  readonly displayName: string;
  readonly bio: string | null;
  readonly avatarUrl: string | null;
  readonly verificationLevel: VerificationLevel;
  readonly reliabilityScore: number;
  readonly neighborhood: string | null;
  readonly sharedInterests: readonly InterestSummary[];
}

export interface InterestSummary {
  readonly id: InterestId;
  readonly domain: InterestDomain;
  readonly label: string;
  readonly slug: string;
}

export interface UserInterest extends InterestSummary {
  readonly weight: number;
}

/** Capacity is a closed range; `min` enforces the no-1:1 default. */
export interface Capacity {
  readonly min: number;
  readonly max: number;
  readonly going: number;
}

/**
 * An event as seen on the feed by a NON-member: location is always fuzzed.
 * Precise location is a separate, BFF-gated fetch (`PreciseEventLocation`).
 */
export interface FeedEvent {
  readonly id: EventId;
  readonly hostId: UserId;
  readonly title: string;
  readonly category: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly capacity: Capacity;
  readonly visibility: EventVisibility;
  readonly status: EventStatus;
  readonly location: FuzzedLocation;
  readonly venueName: string | null;
  readonly sharedInterests: readonly InterestSummary[];
  readonly host: PublicProfile;
  /** Explainability: why this event ranked where it did ("why you're seeing this"). */
  readonly ranking: RankingExplanation;
}

/** Released only to approved members, only within the release window. */
export interface PreciseEventLocation {
  readonly eventId: EventId;
  readonly point: GeoPoint;
  readonly venueName: string | null;
  readonly address: string | null;
}

export interface RankingExplanation {
  readonly score: number;
  readonly interestSimilarity: number;
  readonly distanceMeters: number;
  readonly distanceScore: number;
  readonly recencyScore: number;
  readonly capacityScore: number;
  readonly serendipity: number;
  readonly mutualInterestCount: number;
}

export interface Conversation {
  readonly id: ConversationId;
  readonly scope: ConversationScope;
  readonly scopeId: string;
}

export interface Message {
  readonly id: MessageId;
  readonly conversationId: ConversationId;
  readonly senderId: UserId;
  readonly body: string;
  readonly mediaUrl: string | null;
  readonly createdAt: string;
}

export interface Report {
  readonly id: ReportId;
  readonly reporterId: UserId;
  readonly targetType: 'user' | 'event' | 'message';
  readonly targetId: string;
  readonly severity: ReportSeverity;
  readonly status: ReportStatus;
  readonly reason: string;
  readonly createdAt: string;
  /** SLA deadline (ISO) computed from severity at file time. */
  readonly slaDeadline: string;
}

export interface Crew {
  readonly id: CrewId;
  readonly name: string;
  readonly memberCount: number;
  readonly cadence: 'weekly' | 'biweekly' | 'monthly' | 'ad_hoc';
  readonly nextMeetupAt: string | null;
}

/** A meetup attendance attempt evaluated for NSM. */
export interface AttendanceConfirmation {
  readonly userId: UserId;
  readonly confirmedAt: string;
  readonly location: GeoPoint;
  readonly mockLocationSuspected: boolean;
  readonly deviceFingerprint: string;
}

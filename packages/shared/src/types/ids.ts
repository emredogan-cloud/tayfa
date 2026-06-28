/**
 * Branded ID types. A `UserId` is a string at runtime but distinct from an
 * `EventId` at compile time, so you can't accidentally pass one where the other
 * is expected. All entity IDs are UUID v4 (Postgres `uuid` PKs, Data Model §5).
 */

declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

export type UserId = Brand<string, 'UserId'>;
export type ProfileId = Brand<string, 'ProfileId'>;
export type EventId = Brand<string, 'EventId'>;
export type EventMemberId = Brand<string, 'EventMemberId'>;
export type CrewId = Brand<string, 'CrewId'>;
export type ConversationId = Brand<string, 'ConversationId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type InterestId = Brand<string, 'InterestId'>;
export type ReportId = Brand<string, 'ReportId'>;
export type ModerationActionId = Brand<string, 'ModerationActionId'>;
export type VerificationId = Brand<string, 'VerificationId'>;
export type RatingId = Brand<string, 'RatingId'>;
export type SubscriptionId = Brand<string, 'SubscriptionId'>;
export type ReferralId = Brand<string, 'ReferralId'>;
export type NotificationId = Brand<string, 'NotificationId'>;
export type CityId = Brand<string, 'CityId'>;
export type DeviceId = Brand<string, 'DeviceId'>;

/** Cast a validated string into a branded ID. Validate with `schemas` first. */
export const asId = <B extends string>(value: string): Brand<string, B> =>
  value as Brand<string, B>;

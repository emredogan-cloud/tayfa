import { pgEnum } from 'drizzle-orm/pg-core';
import {
  CONSENT_CATEGORIES,
  CONVERSATION_SCOPES,
  ENTITLEMENTS,
  EVENT_MEMBER_ROLES,
  EVENT_STATUSES,
  EVENT_VISIBILITIES,
  INTEREST_DOMAINS,
  INTEREST_SOURCES,
  MODERATION_ACTIONS,
  MODERATION_ACTOR,
  MODERATION_STATUSES,
  PLATFORMS,
  REFERRAL_STATES,
  REPORT_SEVERITIES,
  REPORT_STATUSES,
  REPORT_TARGET_TYPES,
  RSVP_STATUSES,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_STORES,
  VERIFICATION_LEVELS,
  VERIFICATION_TYPES,
} from '@tayfa/shared/types';

/** Postgres enums — the SAME `const` tuples used by TS unions and Zod (single source). */
export const verificationLevelEnum = pgEnum('verification_level', VERIFICATION_LEVELS);
export const verificationTypeEnum = pgEnum('verification_type', VERIFICATION_TYPES);
export const eventStatusEnum = pgEnum('event_status', EVENT_STATUSES);
export const eventVisibilityEnum = pgEnum('event_visibility', EVENT_VISIBILITIES);
export const rsvpStatusEnum = pgEnum('rsvp_status', RSVP_STATUSES);
export const eventMemberRoleEnum = pgEnum('event_member_role', EVENT_MEMBER_ROLES);
export const conversationScopeEnum = pgEnum('conversation_scope', CONVERSATION_SCOPES);
export const moderationStatusEnum = pgEnum('moderation_status', MODERATION_STATUSES);
export const reportTargetTypeEnum = pgEnum('report_target_type', REPORT_TARGET_TYPES);
export const reportStatusEnum = pgEnum('report_status', REPORT_STATUSES);
export const reportSeverityEnum = pgEnum('report_severity', REPORT_SEVERITIES);
export const moderationActorEnum = pgEnum('moderation_actor', MODERATION_ACTOR);
export const moderationActionEnum = pgEnum('moderation_action_type', MODERATION_ACTIONS);
export const interestDomainEnum = pgEnum('interest_domain', INTEREST_DOMAINS);
export const interestSourceEnum = pgEnum('interest_source', INTEREST_SOURCES);
export const consentCategoryEnum = pgEnum('consent_category', CONSENT_CATEGORIES);
export const subscriptionStoreEnum = pgEnum('subscription_store', SUBSCRIPTION_STORES);
export const subscriptionStatusEnum = pgEnum('subscription_status', SUBSCRIPTION_STATUSES);
export const entitlementEnum = pgEnum('entitlement', ENTITLEMENTS);
export const referralStateEnum = pgEnum('referral_state', REFERRAL_STATES);
export const platformEnum = pgEnum('platform', PLATFORMS);

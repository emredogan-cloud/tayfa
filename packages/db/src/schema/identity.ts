import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { INITIAL_SCORES } from '@tayfa/shared/constants';
import { primaryId, softDelete, timestamps, userIdColumn } from './_helpers.js';
import { vector } from './columns.js';
import {
  consentCategoryEnum,
  entitlementEnum,
  platformEnum,
  verificationLevelEnum,
  verificationTypeEnum,
} from './enums.js';
import { city } from './geo.js';

/**
 * profile — 1:1 with auth.users. Holds the trust primitives (verification_level,
 * reliability/safety scores) and the aggregate interest embedding for ANN match.
 * Sensitive columns (birthdate, exact location) are protected by RLS + column
 * policies; only the public slice is ever exposed to other users.
 */
export const profile = pgTable(
  'profile',
  {
    id: primaryId(),
    userId: uuid('user_id').notNull().unique(),
    displayName: varchar('display_name', { length: 40 }).notNull(),
    bio: varchar('bio', { length: 500 }),
    /** Stored, never exposed raw — age is derived and 18+ is enforced at signup. */
    birthdate: date('birthdate').notNull(),
    homeCityId: uuid('home_city_id').references(() => city.id),
    neighborhood: varchar('neighborhood', { length: 80 }),
    avatarUrl: text('avatar_url'),
    languages: jsonb('languages').$type<string[]>().notNull().default(['tr']),
    verificationLevel: verificationLevelEnum('verification_level').notNull().default('none'),
    reliabilityScore: integer('reliability_score').notNull().default(INITIAL_SCORES.reliability),
    safetyScore: integer('safety_score').notNull().default(INITIAL_SCORES.safety),
    entitlement: entitlementEnum('entitlement').notNull().default('free'),
    /** Aggregate of weighted interests — recomputed async (Inngest), never in-request. */
    interestEmbedding: vector('interest_embedding'),
    embeddingModel: text('embedding_model'),
    embeddingVersion: integer('embedding_version'),
    /** H3 geocell (app-computed) for cheap bucketed feeds — NOT precise location. */
    geocell: text('geocell'),
    ...timestamps,
    ...softDelete,
  },
  (t) => [
    uniqueIndex('profile_user_idx').on(t.userId),
    index('profile_city_idx').on(t.homeCityId),
    index('profile_geocell_idx').on(t.geocell),
  ],
);

/** device — push tokens + ban-evasion fingerprinting (RISK_ANALYSIS §ban-evasion). */
export const device = pgTable(
  'device',
  {
    id: primaryId(),
    userId: userIdColumn(),
    expoPushToken: text('expo_push_token'),
    platform: platformEnum('platform').notNull(),
    /** Hashed device fingerprint — re-registration signal, never raw identifiers. */
    fingerprintHash: text('fingerprint_hash'),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (t) => [
    index('device_user_idx').on(t.userId),
    index('device_fingerprint_idx').on(t.fingerprintHash),
  ],
);

/**
 * verification — provider REFERENCES only, never raw documents (KVKK §biometric).
 * Short retention; encrypted at rest in the SQL layer.
 */
export const verification = pgTable(
  'verification',
  {
    id: primaryId(),
    userId: userIdColumn(),
    type: verificationTypeEnum('type').notNull(),
    provider: text('provider').notNull().default('persona'),
    providerRef: text('provider_ref'),
    status: varchar('status', { length: 24 }).notNull().default('pending'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('verification_user_idx').on(t.userId)],
);

/**
 * consent — unbundled açık rıza (KVKK Art. 6). One row per category per user
 * with version + timestamp; marketing consent must NOT gate core service.
 */
export const consent = pgTable(
  'consent',
  {
    id: primaryId(),
    userId: userIdColumn(),
    category: consentCategoryEnum('category').notNull(),
    granted: boolean('granted').notNull(),
    consentVersion: text('consent_version').notNull(),
    ...timestamps,
  },
  (t) => [
    index('consent_user_idx').on(t.userId),
    uniqueIndex('consent_user_category_idx').on(t.userId, t.category, t.consentVersion),
  ],
);

/** block — total severance (RISK_ANALYSIS §location: no sharing/presence/visibility). */
export const block = pgTable(
  'block',
  {
    id: primaryId(),
    blockerId: uuid('blocker_id').notNull(),
    blockedId: uuid('blocked_id').notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('block_pair_idx').on(t.blockerId, t.blockedId)],
);

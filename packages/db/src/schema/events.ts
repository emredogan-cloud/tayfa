import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { primaryId, softDelete, timestamps, userIdColumn } from './_helpers.js';
import { geographyPoint, vector } from './columns.js';
import {
  eventMemberRoleEnum,
  eventStatusEnum,
  eventVisibilityEnum,
  rsvpStatusEnum,
} from './enums.js';

/**
 * event — the core object. `location` is PRECISE geography (server-only); clients
 * receive a fuzzed geocell centroid until approved + within the release window
 * (RISK_ANALYSIS §3.2). `embedding` powers pgvector matching.
 */
export const event = pgTable(
  'event',
  {
    id: primaryId(),
    hostId: userIdColumn('host_id'),
    title: varchar('title', { length: 80 }).notNull(),
    description: varchar('description', { length: 1000 }),
    category: varchar('category', { length: 60 }).notNull(),
    location: geographyPoint('location').notNull(),
    /** Fuzzed centroid + geocell exposed to non-approved members (see RLS view). */
    geocell: text('geocell').notNull(),
    venueName: varchar('venue_name', { length: 120 }),
    address: text('address'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    capacityMin: integer('capacity_min').notNull().default(2),
    capacityMax: integer('capacity_max').notNull().default(6),
    goingCount: integer('going_count').notNull().default(0),
    visibility: eventVisibilityEnum('visibility').notNull().default('public'),
    status: eventStatusEnum('status').notNull().default('open'),
    womenOnly: boolean('women_only').notNull().default(false),
    verifiedOnly: boolean('verified_only').notNull().default(false),
    embedding: vector('embedding'),
    ...timestamps,
    ...softDelete,
  },
  (t) => [
    index('event_host_idx').on(t.hostId),
    index('event_geocell_idx').on(t.geocell),
    index('event_feed_idx').on(t.status, t.startsAt),
  ],
);

/** event_member — RSVP + attendance ledger (Data Model §5). */
export const eventMember = pgTable(
  'event_member',
  {
    id: primaryId(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    userId: userIdColumn(),
    role: eventMemberRoleEnum('role').notNull().default('member'),
    rsvpStatus: rsvpStatusEnum('rsvp_status').notNull().default('requested'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    /** Mutual-confirm + geofence inputs for NSM (anti-gaming). */
    checkinAt: timestamp('checkin_at', { withTimezone: true }),
    checkinLocation: geographyPoint('checkin_location'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('event_member_unique_idx').on(t.eventId, t.userId),
    index('event_member_user_idx').on(t.userId, t.rsvpStatus),
    index('event_member_event_idx').on(t.eventId),
  ],
);

export type EventRow = typeof event.$inferSelect;
export type NewEventRow = typeof event.$inferInsert;
export type EventMemberRow = typeof eventMember.$inferSelect;

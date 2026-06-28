import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { primaryId, softDelete, timestamps, userIdColumn } from './_helpers.js';
import { conversationScopeEnum, moderationStatusEnum } from './enums.js';
import { event } from './events.js';

/** crew — recurring group formed from repeat co-attendance (the D30 engine). */
export const crew = pgTable('crew', {
  id: primaryId(),
  name: varchar('name', { length: 80 }).notNull(),
  cadence: varchar('cadence', { length: 16 }).notNull().default('weekly'),
  nextMeetupAt: timestamp('next_meetup_at', { withTimezone: true }),
  ...timestamps,
  ...softDelete,
});

export const crewMember = pgTable(
  'crew_member',
  {
    id: primaryId(),
    crewId: uuid('crew_id')
      .notNull()
      .references(() => crew.id, { onDelete: 'cascade' }),
    userId: userIdColumn(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('crew_member_idx').on(t.crewId, t.userId),
    index('crew_member_user_idx').on(t.userId),
  ],
);

/** crew_event — links a crew's recurring meetup to a concrete event. */
export const crewEvent = pgTable(
  'crew_event',
  {
    id: primaryId(),
    crewId: uuid('crew_id')
      .notNull()
      .references(() => crew.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (t) => [uniqueIndex('crew_event_idx').on(t.crewId, t.eventId)],
);

/** conversation — scoped to an event, crew, or DM (Data Model §5). */
export const conversation = pgTable(
  'conversation',
  {
    id: primaryId(),
    scope: conversationScopeEnum('scope').notNull(),
    scopeId: uuid('scope_id').notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('conversation_scope_idx').on(t.scope, t.scopeId)],
);

export const conversationMember = pgTable(
  'conversation_member',
  {
    id: primaryId(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversation.id, { onDelete: 'cascade' }),
    userId: userIdColumn(),
    lastReadAt: timestamp('last_read_at', { withTimezone: true }),
    muted: boolean('muted').notNull().default(false),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('conversation_member_idx').on(t.conversationId, t.userId),
    index('conversation_member_user_idx').on(t.userId),
  ],
);

/**
 * message — write-hot table (Data Model §scaling: partition by month at scale,
 * migrate to Stream at the ADR-006 trigger). Readable ONLY by conversation
 * members (RLS-enforced).
 */
export const message = pgTable(
  'message',
  {
    id: primaryId(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversation.id, { onDelete: 'cascade' }),
    senderId: userIdColumn('sender_id'),
    body: varchar('body', { length: 2000 }).notNull(),
    mediaUrl: text('media_url'),
    moderationStatus: moderationStatusEnum('moderation_status').notNull().default('clear'),
    /** Idempotency key for retry-safe sends. */
    idempotencyKey: uuid('idempotency_key'),
    ...timestamps,
    ...softDelete,
  },
  (t) => [
    index('message_conversation_idx').on(t.conversationId, t.createdAt),
    uniqueIndex('message_idempotency_idx').on(t.idempotencyKey),
  ],
);

export type MessageRow = typeof message.$inferSelect;

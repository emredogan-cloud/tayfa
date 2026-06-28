import {
  boolean,
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
import { primaryId, timestamps, userIdColumn } from './_helpers.js';
import {
  moderationActionEnum,
  moderationActorEnum,
  reportSeverityEnum,
  reportStatusEnum,
  reportTargetTypeEnum,
} from './enums.js';
import { event } from './events.js';

/** report — one-tap report into the moderation queue with an SLA deadline. */
export const report = pgTable(
  'report',
  {
    id: primaryId(),
    reporterId: userIdColumn('reporter_id'),
    targetType: reportTargetTypeEnum('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    reason: varchar('reason', { length: 60 }).notNull(),
    severity: reportSeverityEnum('severity').notNull(),
    detail: varchar('detail', { length: 1000 }),
    evidenceUrl: text('evidence_url'),
    status: reportStatusEnum('status').notNull().default('open'),
    /** SLA deadline computed at file time from severity (30m / 4h / 24h). */
    slaDeadline: timestamp('sla_deadline', { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [
    index('report_status_idx').on(t.status, t.slaDeadline),
    index('report_target_idx').on(t.targetType, t.targetId),
  ],
);

/** moderation_action — every action audited (actor ∈ {ai,human}). */
export const moderationAction = pgTable(
  'moderation_action',
  {
    id: primaryId(),
    reportId: uuid('report_id').references(() => report.id),
    targetUserId: uuid('target_user_id'),
    actor: moderationActorEnum('actor').notNull(),
    action: moderationActionEnum('action').notNull(),
    rationale: text('rationale'),
    confidence: integer('confidence'),
    ...timestamps,
  },
  (t) => [index('moderation_action_report_idx').on(t.reportId)],
);

/** rating — post-meetup vibe/showed-up/again; feeds reliability + safety scores. */
export const rating = pgTable(
  'rating',
  {
    id: primaryId(),
    raterId: userIdColumn('rater_id'),
    targetUserId: uuid('target_user_id').notNull(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    vibe: integer('vibe').notNull(),
    showedUp: boolean('showed_up').notNull(),
    wouldMeetAgain: boolean('would_meet_again').notNull(),
    /** Private safety flag — invisible to the rated user (anti-weaponization). */
    privateSafetyFlag: boolean('private_safety_flag').notNull().default(false),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('rating_unique_idx').on(t.raterId, t.targetUserId, t.eventId),
    index('rating_target_idx').on(t.targetUserId),
  ],
);

/**
 * audit_log — immutable record of every privileged/T&S action (legal + evidence
 * preservation). Append-only; enforced in the SQL layer (no UPDATE/DELETE policy).
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: primaryId(),
    actorUserId: uuid('actor_user_id'),
    actorType: varchar('actor_type', { length: 16 }).notNull().default('human'),
    action: varchar('action', { length: 80 }).notNull(),
    targetType: varchar('target_type', { length: 40 }),
    targetId: uuid('target_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('audit_log_target_idx').on(t.targetType, t.targetId),
    index('audit_log_actor_idx').on(t.actorUserId),
  ],
);

export type ReportRow = typeof report.$inferSelect;
export type NewReportRow = typeof report.$inferInsert;

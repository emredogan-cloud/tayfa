import { timestamp, uuid } from 'drizzle-orm/pg-core';

/** Shared column builders so every table is consistent (Data Model §5). */

export const primaryId = () => uuid('id').primaryKey().defaultRandom();

/** `auth.users.id` reference (Supabase-managed). FK added in SQL, not Drizzle. */
export const userIdColumn = (name = 'user_id') => uuid(name).notNull();

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

/** Soft-delete marker for user-generated content (Data Model §5). */
export const softDelete = {
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
};

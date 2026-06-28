import { doublePrecision, index, pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { primaryId, timestamps, userIdColumn } from './_helpers.js';
import { vector } from './columns.js';
import { interestDomainEnum, interestSourceEnum } from './enums.js';

/** interest_taxonomy — canonical tags with embeddings (Data Model §5). */
export const interestTaxonomy = pgTable(
  'interest_taxonomy',
  {
    id: primaryId(),
    domain: interestDomainEnum('domain').notNull(),
    label: varchar('label', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 140 }).notNull(),
    embedding: vector('embedding'),
    ...timestamps,
  },
  (t) => [uniqueIndex('interest_slug_idx').on(t.slug), index('interest_domain_idx').on(t.domain)],
);

/** user_interest — weighted edges from user → taxonomy. */
export const userInterest = pgTable(
  'user_interest',
  {
    id: primaryId(),
    userId: userIdColumn(),
    interestId: uuid('interest_id')
      .notNull()
      .references(() => interestTaxonomy.id),
    weight: doublePrecision('weight').notNull().default(1),
    source: interestSourceEnum('source').notNull().default('onboarding'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('user_interest_idx').on(t.userId, t.interestId),
    index('user_interest_user_idx').on(t.userId),
  ],
);

/** event_interest — tags an event for matching. */
export const eventInterest = pgTable(
  'event_interest',
  {
    id: primaryId(),
    eventId: uuid('event_id').notNull(),
    interestId: uuid('interest_id')
      .notNull()
      .references(() => interestTaxonomy.id),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('event_interest_idx').on(t.eventId, t.interestId),
    index('event_interest_event_idx').on(t.eventId),
  ],
);

export type InterestTaxonomyRow = typeof interestTaxonomy.$inferSelect;
export type NewInterestTaxonomyRow = typeof interestTaxonomy.$inferInsert;

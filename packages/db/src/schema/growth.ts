import {
  index,
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
  entitlementEnum,
  referralStateEnum,
  subscriptionStatusEnum,
  subscriptionStoreEnum,
} from './enums.js';

/** notification — sent ledger with frequency-cap accounting + open tracking. */
export const notification = pgTable(
  'notification',
  {
    id: primaryId(),
    userId: userIdColumn(),
    type: varchar('type', { length: 60 }).notNull(),
    category: varchar('category', { length: 24 }).notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    openedAt: timestamp('opened_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('notification_user_idx').on(t.userId, t.sentAt)],
);

/** subscription — mirrored from RevenueCat (server-side entitlement truth). */
export const subscription = pgTable(
  'subscription',
  {
    id: primaryId(),
    userId: userIdColumn(),
    product: text('product').notNull(),
    store: subscriptionStoreEnum('store').notNull(),
    entitlement: entitlementEnum('entitlement').notNull().default('free'),
    status: subscriptionStatusEnum('status').notNull().default('active'),
    renewsAt: timestamp('renews_at', { withTimezone: true }),
    /** RevenueCat transaction id — idempotency key for webhook application. */
    providerTxnId: text('provider_txn_id'),
    ...timestamps,
  },
  (t) => [
    index('subscription_user_idx').on(t.userId),
    uniqueIndex('subscription_txn_idx').on(t.providerTxnId),
  ],
);

/** referral — reward gated on referee's first completed meetup (anti-fraud). */
export const referral = pgTable(
  'referral',
  {
    id: primaryId(),
    referrerId: uuid('referrer_id').notNull(),
    refereeId: uuid('referee_id'),
    code: varchar('code', { length: 16 }).notNull(),
    state: referralStateEnum('state').notNull().default('created'),
    rewardedAt: timestamp('rewarded_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('referral_code_idx').on(t.code),
    index('referral_referrer_idx').on(t.referrerId),
  ],
);

export type SubscriptionRow = typeof subscription.$inferSelect;
export type ReferralRow = typeof referral.$inferSelect;

import { doublePrecision, index, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { primaryId, timestamps } from './_helpers.js';

/** City — liquidity ops + feed bucketing (Data Model §5). */
export const city = pgTable(
  'city',
  {
    id: primaryId(),
    name: varchar('name', { length: 120 }).notNull(),
    countryCode: varchar('country_code', { length: 2 }).notNull(),
    centerLat: doublePrecision('center_lat').notNull(),
    centerLng: doublePrecision('center_lng').notNull(),
    timezone: text('timezone').notNull().default('Europe/Istanbul'),
    ...timestamps,
  },
  (t) => [index('city_country_idx').on(t.countryCode)],
);

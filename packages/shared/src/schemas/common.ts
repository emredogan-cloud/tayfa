import { z } from 'zod';

/** Shared schema primitives — reused across every boundary schema. */

export const uuidSchema = z.uuid();

/** E.164 phone number (Supabase phone OTP). */
export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be E.164 format, e.g. +905321234567');

export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const isoDateTimeSchema = z.iso.datetime({ offset: true });

export const paginationSchema = z.object({
  cursor: z.string().nullish(),
  limit: z.number().int().min(1).max(50).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

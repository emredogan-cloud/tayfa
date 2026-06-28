import { z } from 'zod';
import { MIN_AGE_YEARS } from '../constants/safety.js';
import { phoneSchema } from './common.js';

/** Phone OTP request + verify (Supabase Auth, ADR-012). */
export const otpRequestSchema = z.object({
  phone: phoneSchema,
});
export type OtpRequest = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  token: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});
export type OtpVerify = z.infer<typeof otpVerifySchema>;

/**
 * Hard 18+ age gate (RISK_ANALYSIS, non-negotiable). Birthdate is validated
 * server-side against MIN_AGE_YEARS; the client never asserts age directly.
 */
export const ageGateSchema = z
  .object({
    birthdate: z.iso.date(),
  })
  .refine(
    (v) => {
      const dob = new Date(v.birthdate);
      const now = new Date();
      const age =
        now.getFullYear() -
        dob.getFullYear() -
        (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
      return age >= MIN_AGE_YEARS;
    },
    { message: `You must be at least ${MIN_AGE_YEARS} to use Tayfa`, path: ['birthdate'] },
  );
export type AgeGate = z.infer<typeof ageGateSchema>;

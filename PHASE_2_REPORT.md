# Phase 2 — Auth flow redesign (phone · OTP · age-gate)

**Status:** ✅ complete · mobile lint + typecheck green · Date: 2026-07-01

## Objective
Rebuild the three auth screens to match `o1-auth-phone`, `02-auth-otp`, `03-age-gate` (≥90% fidelity), preserving all verification logic (E.164 validation, Supabase OTP, fail-closed 18+ gate).

## Implementation
- **Shared scaffolding:** `components/AuthHeader.tsx` (back chip + context pill + step progress bar via `SegmentedProgress`); `components/OtpInput.tsx` (six-box code input over a single hidden field so OS SMS autofill works).
- **`phone.tsx`** — two-tone headline ("What's your **number?**"), clay mascot illustration, `TrustRow` (Verified profiles only / Your number is private / Safer meetups), fixed **+90 (TR)** country-prefix input, "We never share your number" reassurance, "Send code →". Logic unchanged (otpRequestSchema → Supabase `signInWithOtp`).
- **`otp.tsx`** — back + "Secure verification" pill, headline + phone (formatted, ember), clay envelope illustration, info card with a live **expiry countdown** (mm:ss) + "Your security is our priority", the 6-box `OtpInput` with auto-submit on the 6th digit, a resend card, "Verify →", "Your code is private and secure." Verify/hydrate/mock-fallback logic preserved.
- **`age-gate.tsx`** — back + "One-time check" pill + progress, "How old are you?", clay friends-on-couch illustration, `TrustRow` (18+ only / One-time check / Meet real people), calendar-icon date-of-birth input with the YYYY-MM-DD mask, "We don't store your age, only verify it.", "Continue →". **Fail-closed `ageGateSchema` validation unchanged** (under-18 / invalid cannot proceed; analytics `age_gate_passed/failed` preserved).
- **Assets (generated, ≥90% fidelity):** three 3D claymorphism illustrations via the `gpt-image-1` pipeline — `auth-phone-mascot` (ember blob + phone + shield + padlock), `auth-otp-envelope` (envelope + shield checkmark + sparkles), `auth-agegate-friends` (four friends on a couch with chat bubbles). Registered in `illustrations.ts`.

## Tests
- `@tayfa/mobile` typecheck ✅, lint ✅, Prettier clean.

## Device validation
**Device validation skipped (device unavailable)** — the Xiaomi disconnected during Phase 1 and did not return; `adb` cannot see it. Auth screens will be captured in the next device pass.

## Known issues / follow-ups
- Country picker is a fixed +90 (TR) prefix (beachhead) — a full picker is a later enhancement.
- Language selector pill is presentational (EN only) for now.
- On-device fidelity check pending device reconnection.

## OpenAI usage (cumulative)
4 high-quality `gpt-image-1` 1024² generations so far (1 welcome + 3 auth) ≈ **$0.68** of the $15 budget. Detailed log in `OPENAI_IMAGE_USAGE_REPORT.md` (Phase 11).

## Deliverables
`AuthHeader`, `OtpInput`, redesigned phone/otp/age-gate, 3 clay illustrations, this report.

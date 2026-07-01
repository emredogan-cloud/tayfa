# OpenAI Image Usage Report

**Program:** UI Redesign Execution · **Date:** 2026-07-01 · **Budget:** ≤ $15

## Summary

| | |
|---|---|
| Model | `gpt-image-1` |
| Quality / size / format | high · 1024×1024 · transparent PNG |
| Approx. unit cost | ~$0.17 / image (high, 1024²) |
| **Images generated this program** | **8** |
| **Estimated spend this program** | **≈ $1.36** |
| Budget remaining | ≈ $13.64 of $15 |
| External / stock assets used | **0** (policy: never use external assets) |
| API key handling | `OPENAI_API_KEY` read from `.env` only — gitignored, verified never committed |

## Images generated during the redesign (8)

Produced via `scripts/generate-assets.ts` (idempotent, `--only=<id>`), specs in
`docs/design-prompts/manifest.json`, output copied into `apps/mobile/assets/`:

| Manifest id | Asset | Used by |
|---|---|---|
| `onboarding-welcome-illustration` | `illustrations/welcome-people.png` | Welcome / first-run |
| `auth-phone-mascot` | `illustrations/auth-phone.png` | Phone entry · Verify-to-host hero |
| `auth-otp-envelope` | `illustrations/auth-otp.png` | OTP screen |
| `auth-agegate-friends` | `illustrations/auth-agegate.png` | Age gate |
| `onboarding-interests-mascots` | `illustrations/onboarding-interests.png` | Interests picker |
| `onboarding-consent-mascot` | `illustrations/onboarding-consent.png` | Consent |
| `onboarding-profile-card` | `illustrations/onboarding-profile.png` | Profile setup |
| `feed-liquidity-people` | `feed/liquidity-people.png` | Liquidity banner · host-prompt card |

## Reused (pre-existing, $0 this program)

Event category tiles (`events/cycling|bouldering|coffee|boardgames.png`), the
empty-state illustration (`events/empty-state.png`), the app icon and adaptive
foreground. Phases 6–10 (safety, paywall, profile, notifications, travel,
marketplace/host) added **no new generated assets** — they reused the existing
illustration set plus vector (Ionicons) glyphs, so spend did not increase after
the onboarding/auth/feed work.

## Controls honored

- Only `TAYFA_PROVIDER_MODE=mock` (keyless) is the default; image generation used
  the real key strictly from `.env`, which is gitignored and was verified absent
  from every commit (the CI `gitleaks` secret scan passed on every push).
- No generation was run for surfaces that could be served with vector glyphs or
  existing art — keeping spend at ~9% of the $15 ceiling.

# Environment Setup

Every environment variable in [`.env.example`](../.env.example), grouped by provider:
**name · purpose · required/optional · where to get it (dashboard + exact clicks) ·
pricing · where the value goes**.

> **Convention:** anything prefixed `EXPO_PUBLIC_*` or `NEXT_PUBLIC_*` is shipped to the
> client bundle — it must be safe to expose. Everything else is **server-only**.
>
> **You do not need any real keys to run the codebase.** `.env.example` ships with
> `TAYFA_PROVIDER_MODE=mock`, which forces every external provider into a deterministic
> mock (see the bottom of this doc). Fill in real keys only when you wire a live surface.
>
> Real secrets are **never committed** — `.env` is git-ignored. For production, secrets live
> in Vercel (web/BFF), EAS Secrets (mobile build), and GitHub Actions Secrets (CI). See
> [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md).

```bash
cp .env.example .env   # then edit; runs fully in mock mode out of the box
```

---

## Runtime

| Var | Purpose | Required | Where it goes |
|---|---|---|---|
| `NODE_ENV` | `development` / `production` / `test`. | Yes (defaults `development`). | All processes. |

---

## Supabase — Postgres + Auth + Realtime + Storage (EU / Frankfurt)

Account: <https://supabase.com> → **New project**. **Region: choose `Central EU (Frankfurt)`**
(ADR-014 — data residency is a one-way door; pick Frankfurt). Set a strong DB password.
After creation: **Project Settings → API** (URL + keys), **Project Settings → Database**
(connection string), **Authentication → Providers → Phone** (enable phone OTP, attach an SMS
provider). **Pricing:** Free tier (good for dev); **Pro ≈ $25/project/mo** for production
(daily backups, no pausing, more compute). SMS billed by the configured SMS provider.

| Var | Purpose | Required | Notes / where it goes |
|---|---|---|---|
| `SUPABASE_URL` | Project REST/Realtime base URL. | Yes | Server. **Settings → API → Project URL**. |
| `EXPO_PUBLIC_SUPABASE_URL` | Same URL for the mobile bundle. | Yes | Mobile client. Public-safe. |
| `NEXT_PUBLIC_SUPABASE_URL` | Same URL for the web bundle. | Yes | Web client. Public-safe. |
| `SUPABASE_ANON_KEY` | Public anon JWT. **Public-safe — RLS protects data.** | Yes | Server. **Settings → API → Project API keys → `anon` `public`**. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Anon key for mobile. | Yes | Mobile client. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key for web. | Yes | Web client. |
| `SUPABASE_SERVICE_ROLE_KEY` | **God-mode, RLS-bypass.** | Yes (BFF) | **SERVER-ONLY** — BFF service role only, **never** ship to a client. **Settings → API → `service_role` `secret`**. |
| `DATABASE_URL` | Direct Postgres connection for Drizzle migrations + RLS tests. | Yes (db ops/CI) | Server/CI. **Settings → Database → Connection string → URI** (use the pooler/`6543` for app runtime; direct/`5432` for migrations). Local dev/CI default: `postgresql://postgres:postgres@localhost:54322/postgres`. |

---

## AI — Vercel AI Gateway (generative) + OpenAI (embeddings, moderation, images)

**Vercel AI Gateway** routes generative calls (default model
`anthropic/claude-haiku-4.5`, ADR-011). Dashboard: <https://vercel.com> → your team →
**AI Gateway** → **API Keys → Create**. **Pricing:** pay-per-token at the underlying model
rate (Haiku ≈ $1/$5 per 1M in/out tokens); the gateway adds routing/observability, no
separate per-token markup on the included tier.

**OpenAI** provides embeddings (`text-embedding-3-small`, 1536-d), the Moderation API, and
the Images API (asset generation). Dashboard: <https://platform.openai.com> → **API keys →
Create new secret key**. **Pricing:** `text-embedding-3-small` ≈ $0.02 / 1M tokens;
Moderation API is **free**; image generation billed per image.

| Var | Purpose | Required | Notes |
|---|---|---|---|
| `AI_GATEWAY_API_KEY` | Auth to the Vercel AI Gateway (generative). | Optional (mock otherwise) | Server. Format `vck_...`. |
| `AI_GATEWAY_BASE_URL` | Gateway base URL. | Yes if using gateway | Server. Default `https://ai-gateway.vercel.sh/v1`. |
| `OPENAI_API_KEY` | Embeddings + Moderation + Images. | Optional (mock otherwise) | Server. Format `sk-proj-...`. Also powers mission §IMAGE GENERATION asset prompts. |

---

## Inngest — durable async workflows

Account: <https://www.inngest.com> → **New app**. Keys: **Dashboard → (env) → Manage →
Keys**. **Event Key** ingests events; **Signing Key** verifies inbound webhook signatures.
**Pricing:** generous **Free** tier; **Team** plan from ~$50/mo at higher volume.

| Var | Purpose | Required | Notes |
|---|---|---|---|
| `INNGEST_EVENT_KEY` | Send events into Inngest. | Optional (mock otherwise) | Server. |
| `INNGEST_SIGNING_KEY` | Verify inbound webhook signatures. | Optional (mock otherwise) | Server. |

---

## Upstash Redis — cache, rate-limits, idempotency

Account: <https://upstash.com> → **Create Database → Redis** → **Region: EU (Frankfurt)**
to match data residency → **Global/Regional**. Copy from **Details → REST API**. **Pricing:**
**Free** tier (10k commands/day); pay-per-request beyond. Used for hot feed cache, per-user/
IP/action rate-limits (`RATE_LIMITS`), and webhook idempotency keys.

| Var | Purpose | Required | Notes |
|---|---|---|---|
| `UPSTASH_REDIS_REST_URL` | REST endpoint. | Optional (mock otherwise) | Server. |
| `UPSTASH_REDIS_REST_TOKEN` | REST auth token. | Optional (mock otherwise) | Server. |

---

## Persona — ID + liveness verification

Account: <https://withpersona.com> → Dashboard. **API key: Settings → API Keys →
Create**. **Template:** build an Inquiry/Government-ID + Selfie flow under **Inquiry
Templates** → copy its `itmpl_...` id. **Webhook secret: Settings → Webhooks → add endpoint
→ copy the signing secret.** **Pricing:** per-verification (typically ~$1–2/verify; contact
sales for TR volume). Verification is deferred/tiered so cost scales with privileged
actions, not signups (ADR-010). **Stripe Identity is the documented fallback.**

| Var | Purpose | Required | Notes |
|---|---|---|---|
| `PERSONA_API_KEY` | Create inquiries / read results. | Optional (mock otherwise) | Server. |
| `PERSONA_WEBHOOK_SECRET` | Verify inbound webhook signatures. | Optional (mock otherwise) | Server. Fail-closed on bad signature. |
| `PERSONA_TEMPLATE_ID` | The verification flow to launch. | If using Persona | Server. Format `itmpl_...`. |

---

## RevenueCat — subscriptions (entitlement source of truth, ADR-009)

Account: <https://www.revenuecat.com> → **Project**. **Public SDK keys: Project Settings →
API Keys** (one per platform — Apple `appl_...`, Google `goog_...`). **Secret API key** +
**Webhook auth header secret: Project Settings → Webhooks**. Configure products/entitlement
(`tayfa_plus`) under **Entitlements / Offerings**. **Pricing:** **free up to $2.5k MTR/mo**,
then **1% of tracked revenue**. Entitlements are server-side truth; webhooks idempotent.

| Var | Purpose | Required | Notes |
|---|---|---|---|
| `REVENUECAT_API_KEY` | Server secret key (read entitlements / v2 API). | Optional (mock otherwise) | **SERVER-ONLY**. |
| `REVENUECAT_WEBHOOK_SECRET` | Verify RevenueCat webhooks. | Optional (mock otherwise) | Server. Idempotent handler. |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | iOS public SDK key. | If billing on iOS | Mobile client. `appl_...`. |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | Android public SDK key. | If billing on Android | Mobile client. `goog_...`. |

---

## Moderation — Hive (image NSFW / faces) or AWS Rekognition

**Hive:** <https://thehive.ai> → **Dashboard → API Keys**. **Pricing:** per-call, contact
sales. **AWS Rekognition (fallback):** <https://console.aws.amazon.com/iam> → **Users →
Create → Programmatic access** with a Rekognition policy; **Region `eu-central-1`** (EU
residency). **Pricing:** per-image (~$1 / 1000 images, tiered). Text moderation uses the
free OpenAI Moderation API (above); these cover image NSFW + face checks. **Fail-closed** on
provider outage (deny, never pass).

| Var | Purpose | Required | Notes |
|---|---|---|---|
| `HIVE_API_KEY` | Hive image moderation. | Optional (mock otherwise) | Server. |
| `AWS_REGION` | AWS region for Rekognition. | If using AWS | Server. Default `eu-central-1`. |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key. | If using AWS | Server. |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret. | If using AWS | **SERVER-ONLY**. |

---

## PostHog — analytics, flags & experiments (EU cloud, ADR-008)

Account: <https://eu.posthog.com> (use the **EU** cloud for residency). **Project API key:
Settings → Project → Project API Key** (`phc_...`, public/client-safe — write-only ingest).
**Pricing:** **free 1M events/mo**, then usage-based. The typed event schema lives in
`@tayfa/shared/events`; tracking is consent-gated.

| Var | Purpose | Required | Notes |
|---|---|---|---|
| `EXPO_PUBLIC_POSTHOG_KEY` | Mobile ingest key. | Optional | Mobile client. `phc_...`. |
| `NEXT_PUBLIC_POSTHOG_KEY` | Web ingest key. | Optional | Web client. `phc_...`. |
| `EXPO_PUBLIC_POSTHOG_HOST` | Mobile ingest host. | If using PostHog | Default `https://eu.i.posthog.com`. |
| `NEXT_PUBLIC_POSTHOG_HOST` | Web ingest host. | If using PostHog | Default `https://eu.i.posthog.com`. |

---

## Sentry — errors, performance, traces

Account: <https://sentry.io> → **Create project** (one for `react-native`, one for
`nextjs`). **DSN: Project → Settings → Client Keys (DSN)** (public-safe). **Auth token:
Settings → Auth Tokens → Create** (for sourcemap upload in CI/EAS). **Pricing:** **free
Developer** tier; **Team from ~$26/mo**.

| Var | Purpose | Required | Notes |
|---|---|---|---|
| `SENTRY_DSN` | Server/BFF error reporting. | Optional | Server. |
| `EXPO_PUBLIC_SENTRY_DSN` | Mobile error reporting. | Optional | Mobile client. |
| `NEXT_PUBLIC_SENTRY_DSN` | Web error reporting. | Optional | Web client. |
| `SENTRY_AUTH_TOKEN` | Upload sourcemaps in CI/EAS. | CI only | **SERVER/CI-ONLY**, never bundled. |

---

## Push — Expo Push (MVP) → Braze (lifecycle, P6)

**Expo Push** (transactional MVP pushes): <https://expo.dev> → **Account Settings →
Access Tokens → Create** (`EXPO_ACCESS_TOKEN`, also used by EAS — see DEPLOYMENT_GUIDE).
**Free.** **Braze** (lifecycle journeys, P6): <https://dashboard.braze.eu> → **Settings →
APIs and Identifiers** for the REST key; use the **EU REST endpoint**
(`https://rest.fra-01.braze.eu`). **Pricing:** Braze is enterprise/contract.

| Var | Purpose | Required | Notes |
|---|---|---|---|
| `EXPO_ACCESS_TOKEN` | Send Expo push + EAS automation. | Optional (mock otherwise) | **SERVER/CI-ONLY**. |
| `BRAZE_API_KEY` | Braze REST API (P6 journeys). | Optional (P6) | Server. |
| `BRAZE_REST_ENDPOINT` | Braze EU REST base. | If using Braze | Default `https://rest.fra-01.braze.eu`. |

---

## Stripe + Stripe Connect — web payments / payouts (P9)

Account: <https://dashboard.stripe.com>. **Secret key: Developers → API keys → Secret key**
(`sk_...`). **Webhook secret: Developers → Webhooks → add endpoint → Signing secret**
(`whsec_...`). Connect (marketplace payouts) is enabled under **Connect**. **Pricing:**
2.9% + fixed per charge (region-dependent); Connect adds payout fees.

| Var | Purpose | Required | Notes |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Charges / Connect payouts (P9). | Optional (P9) | **SERVER-ONLY**. |
| `STRIPE_WEBHOOK_SECRET` | Verify Stripe webhooks. | Optional (P9) | Server. Idempotent handler. |

---

## `TAYFA_PROVIDER_MODE` — the autonomy switch

| Var | Purpose | Required | Notes |
|---|---|---|---|
| `TAYFA_PROVIDER_MODE` | `mock` forces **all** external providers into deterministic mock mode. | No (defaults to `mock` in `.env.example`). | Server. |

- **`mock`** — every provider resolves through `createMockProviders()` (`@tayfa/shared/adapters`).
  No real keys needed. Used by **CI** and **keyless local dev**. Mocks honor the production
  contract: same shapes, **fail-closed** semantics (e.g. malformed verification webhook → deny),
  deterministic pseudo-embeddings. This is the mission AUTONOMY rule made concrete.
- **unset / any other value** — the BFF selects the **real adapter per provider when its key
  is present**, and transparently **falls back to the mock when a key is absent**. So you can
  bring providers online one at a time (e.g. real Supabase + Persona, mock everything else).

**Security note:** never trust a client-supplied entitlement/verification flag — those are
server-side truth (RevenueCat / Persona via the BFF). The mock mode never weakens a safety
control; it only removes the need for credentials.

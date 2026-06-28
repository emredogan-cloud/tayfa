<!--
Tayfa PR template. The title MUST be a Conventional Commit (validated by
pr-validation.yml), e.g. "feat(web): add interest picker" or "fix(db): tighten rsvp RLS".
-->

## What & why

<!-- One or two sentences. Link the issue/roadmap item. -->

Closes #

## Changes

-

## Type of change

- [ ] feat — new user-facing capability
- [ ] fix — bug fix
- [ ] refactor / perf — no behavior change
- [ ] docs / test / chore / ci
- [ ] breaking change (describe migration below)

## Safety & privacy checklist (RISK_ANALYSIS wins all conflicts)

> Tick every box that applies, or write "n/a — no user-facing/server/data change".

- [ ] **Safety is never paywalled** — block, report, verification, safety-center,
      and women-only/verified-only filters remain free. Premium is gated ONLY via
      `checkFeatureAccess`.
- [ ] **Precise location stays server-side** — clients receive fuzzed geocell
      centroids; any release goes through the BFF via `canReleasePreciseLocation`.
- [ ] **18+ age gate** preserved; verification/moderation **fail closed** on
      provider outage (deny, never pass).
- [ ] **Entitlements are server-side truth** (RevenueCat); no client flag trusted;
      webhooks remain idempotent.
- [ ] Every new server boundary is **Zod-validated**; no `any`; types exhaustive.
- [ ] **GDPR/KVKK & EU/Frankfurt residency** respected (no new PII egress, data
      kept in-region, data-rights SLAs honored).

## Testing

- [ ] `pnpm turbo run lint typecheck` passes locally
- [ ] `pnpm turbo run test:coverage` passes (≥80% overall, ≥90% domain)
- [ ] If schema/RLS touched: `pnpm --filter @tayfa/db test` with `TEST_DATABASE_URL` set
- [ ] If migration: it is idempotent and forward-only

## Screenshots / notes

<!-- UI diffs, query plans, anything reviewers should see. -->

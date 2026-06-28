# Release Process

How code goes from a branch to users. Two cadences run in parallel: **store release trains**
(native binaries, slow, reviewed) and **OTA hot-fixes** (JS/asset, fast, ADR-013).

---

## 1. Conventional commits

Every commit follows [Conventional Commits](https://www.conventionalcommits.org/). Existing
history already does (`feat(db): …`, `feat(shared): …`, `chore: …`).

```
<type>(<scope>): <subject>

[body]
[footer: BREAKING CHANGE / Refs #issue]
```

**Types:** `feat` · `fix` · `refactor` · `perf` · `docs` · `test` · `ci` · `chore` ·
`build` · `style`. **Scopes:** the package/app touched (`shared`, `db`, `mobile`, `web`,
`ci`, `infra`). The commit type drives the changelog and the semver bump.

Rules: no `TODO`-as-done, no dead/commented code, no `any` (mission Quality Bar). Each PR is
small, single-purpose, and references its issue.

---

## 2. Branching

- `main` is the default branch and is always releasable (CI green).
- Work happens on short-lived branches: `feat/…`, `fix/…`, `chore/…`.
- Merge via PR with squash (one conventional commit per PR onto `main`).
- Never commit or push directly to `main` for feature work.

---

## 3. CI gates — **CI green is a hard gate** (mission)

No PR merges and no release ships while CI is red. The pipeline (GitHub Actions):

**Per PR / push:**
- `lint` — ESLint (flat config, `typescript-eslint`).
- `typecheck` — `tsc --noEmit` across the workspace (strict; no `any`).
- `unit` — Vitest on the domain (DB-free; 78 tests; **90% critical-domain** threshold).
- `rls` — Vitest against a Postgres service (PostGIS + pgvector) with `TEST_DATABASE_URL`
  set; proves deny-by-default + FORCE on every table.
- `build` — production build of web + the package graph (Turborepo); mobile EAS build in
  the release workflow (debug APK / release APK / AAB).
- `coverage` — **80% overall**, **90% critical domain** thresholds enforced.

**Security (mission §MANDATORY CI/CD):**
- dependency audit · secret scanning · Trivy · CodeQL.

**Merge rule:** all checks mandatory, branch must be up to date, then squash-merge. Workflow
files live in `.github/workflows/`.

---

## 4. Semver & versioning

- The monorepo and packages are at `0.1.0` (pre-1.0 — minor may include breaking changes
  during MVP).
- Post-1.0 semver: `feat` → **minor**, `fix`/`perf` → **patch**, `BREAKING CHANGE` →
  **major**.
- **Mobile** carries two version axes: the user-facing app version (`expo.version`) and the
  **`runtimeVersion`** (the native-compatibility key for EAS Update — only bumped on native
  changes; OTA updates target an existing `runtimeVersion`).

---

## 5. Changelog

Generated from conventional commits (Changesets or `git-cliff`), grouped by type per
release tag. `BREAKING CHANGE` footers surface as a dedicated section. Tag format
`vMAJOR.MINOR.PATCH`; the GitHub Release notes are the human-facing changelog and link the
EAS build / Vercel deployment for that tag.

---

## 6. Release trains (store)

- **Cadence:** a regular train (e.g. weekly) cuts a release branch from `main`, runs EAS
  Build for `prod`, and submits to the stores via EAS Submit. Native changes (new
  permissions, SDK bumps, native modules) **must** ride a train — they need store review.
- A train is **go** only on green CI + a green staging soak (preview channel + staging
  Supabase). Tag the release commit; attach the build artifacts to the GitHub Release.

---

## 7. OTA hot-fix flow (EAS Update, ADR-013)

For a **JS/asset-only** bug that can't wait for a store review:

1. Branch `fix/…`, write a **failing test first**, fix, open PR — full CI must pass (the hard
   gate still applies to hot-fixes).
2. Merge to `main`.
3. Publish OTA to the target channel, **staged**:
   ```bash
   eas update --channel prod --message "fix(rsvp): last-seat UI race" --rollout 10
   ```
4. Watch Sentry crash-free rate + the relevant PostHog funnel between rollout steps
   (10 → 25 → 50 → 100).
5. **Rollback** if regressed: `eas update:republish` the previous good bundle (or set rollout
   to 0%). Clients pull the newest compatible update per `runtimeVersion` on next launch.

Constraint: an OTA can only fix what's expressible in JS/assets for the **already-shipped
native runtime**. Anything needing newer native code is a store train, not an OTA.

---

## 8. Definition of done for a release

A release ships only when (mission §DEFINITION OF DONE):

- implementation complete, tests passing, **CI green**;
- coverage thresholds met (80% / 90%);
- on-device validation done (emulator/simulator journeys) — *currently pending; see
  [`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md)*;
- docs + the relevant `PHASE_REPORTS/PHASE_X_REPORT.md` updated;
- no known critical bugs;
- tagged, changelog generated, artifacts attached.

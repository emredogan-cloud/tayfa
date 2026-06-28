# Commit & PR conventions

Tayfa uses [**Conventional Commits**](https://www.conventionalcommits.org/). This
keeps history machine-parseable so changelogs and semantic versioning are
automatable, and it makes review intent obvious.

## Format

```
<type>(<optional-scope>): <subject>

<optional body>

<optional footer(s)>
```

- **type** (required): `feat`, `fix`, `perf`, `refactor`, `docs`, `test`,
  `build`, `ci`, `chore`, `revert`.
- **scope** (optional): one of `shared`, `db`, `web`, `mobile`, `bff`, `infra`,
  `ci`, `deps`, `release`.
- **subject**: imperative mood, lowercase, no trailing period, ≤100 chars.
- **breaking change**: add `!` after the type/scope (`feat(db)!: ...`) **and** a
  `BREAKING CHANGE:` footer.

### Examples

```
feat(web): add interest picker to onboarding
fix(db): tighten rsvp RLS so non-members cannot read precise location
perf(shared): memoize feed candidate scoring
chore(deps): bump drizzle-orm to 0.45.3
```

## Where it is enforced

| Layer | Tool | Blocking? |
| --- | --- | --- |
| **PR title** (squash-merge subject) | `amannn/action-semantic-pull-request` in `.github/workflows/pr-validation.yml` | ✅ yes |
| **Local commit messages** | `commitlint.config.mjs` (root) via a `commit-msg` git hook | optional, recommended |

Because we squash-merge, the **PR title** is the commit that lands on `main`, so
that is the check branch protection requires. The local commitlint config is
provided for teams that want pre-push enforcement.

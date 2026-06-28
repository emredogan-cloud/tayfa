// Tayfa commit-message linting — Conventional Commits.
// This is the LOCAL counterpart to the PR-title check in
// .github/workflows/pr-validation.yml (amannn/action-semantic-pull-request).
// Wire it to a commit-msg hook (husky/lefthook) if you want pre-push enforcement:
//   echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg
//
// Requires devDependencies at the repo root:
//   @commitlint/cli @commitlint/config-conventional
//
// @type {import('@commitlint/types').UserConfig}
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Keep the type list identical to the workflow so local and CI agree.
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'perf',
        'refactor',
        'docs',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    // Optional scope, but when present it must match the monorepo map.
    'scope-enum': [
      2,
      'always',
      ['shared', 'db', 'web', 'mobile', 'bff', 'infra', 'ci', 'deps', 'release'],
    ],
    'scope-empty': [0],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 100],
  },
};

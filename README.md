# DB Change Review

DB Change Review checks pull requests for risky database changes before they are merged.

It looks at changed database-related files, runs deterministic rules, and leaves a pull request comment with the risks it found. It does not use an LLM to decide whether a change is risky.

DB Change Review currently understands common patterns in:

- SQL migrations
- EF Core migrations
- Prisma schema files

## What It Catches

DB Change Review is designed to catch changes that often need extra rollout care, such as:

- dropping tables or columns
- `UPDATE` or `DELETE` without a `WHERE`
- PostgreSQL indexes created without `CONCURRENTLY`
- columns added as `NOT NULL`
- columns added with defaults
- foreign keys or checks added without delayed validation patterns
- EF Core migration operations that map to risky database changes

The report includes a risk score, a severity summary, the rule that matched, and links back to the changed lines in the pull request.

## GitHub Actions Usage

Add this workflow to the repository you want DB Change Review to review:

```yaml
name: db-change-review

on:
  pull_request_target:
    types: [opened, synchronize, reopened, ready_for_review]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  db-change-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
          ref: ${{ github.event.pull_request.head.sha }}

      - uses: yunusuyanik/db-change-review@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          base: origin/${{ github.base_ref }}
```

DB Change Review updates the same pull request comment on every run instead of posting duplicates.

The workflow permissions matter. DB Change Review reads the diff and writes a pull request comment, so it needs:

- `contents: read`
- `pull-requests: write`
- `issues: write`

## Options

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `github-token` | Yes | | Token used to create or update the PR comment. Use `${{ secrets.GITHUB_TOKEN }}`. |
| `base` | No | `origin/main` | Git ref to compare against. |
| `comment-on-clean` | No | `false` | Post a clean report even when no database-related files changed. |

## Local Usage

Install dependencies:

```bash
pnpm install
```

Build the packages:

```bash
pnpm build
```

Print a Markdown report for the current branch:

```bash
node packages/cli/dist/index.js scan --base origin/main
```

Create or update a pull request comment:

```bash
GITHUB_TOKEN=$(gh auth token) \
node packages/cli/dist/index.js comment \
  --repo owner/repo \
  --pr 123 \
  --base origin/main
```

## Development

Run tests:

```bash
pnpm test
```

Run type checks:

```bash
pnpm typecheck
```

Build:

```bash
pnpm build
```

## Notes

- DB Change Review uses deterministic rules, not a full SQL parser.
- Findings are meant to flag changes that deserve review, not to prove a migration is unsafe.
- The default workflow is GitHub Actions plus a pull request comment.

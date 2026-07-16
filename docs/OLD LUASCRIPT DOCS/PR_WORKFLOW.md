# PR-first Workflow

This repo prefers a PR-first flow for changes to `main`.

## Quick start

Use the helper to branch, push, and open the PR page in one go:

```bash
npm run pr -- docs/pr-workflow-quickstart main "docs: add Quick Start to PR workflow"
```

Or do it manually:

```bash
git fetch -p
git switch -c docs/pr-workflow-quickstart origin/main
# edit files ...
git add -A && git commit -m "docs: add Quick Start to PR workflow"
git push -u origin docs/pr-workflow-quickstart
```

Policy highlights:

- Do not push directly to `main`. Create a feature branch and open a PR.
- The pre-push Husky hook will block direct pushes to `main` unless you explicitly override.
- Quick validation runs on push via `npm run test:smoke` (falls back to `npm test`).

## Create and push a feature branch

Option A: Use the helper script

```bash
scripts/pr.sh chore/update-readme main "Update README index"
```

This will:

- Ensure `main` is up-to-date
- Create or switch to the branch
- Push it to `origin`
- Print a PR URL you can open

Option B: Manual

```bash
git fetch -p
git checkout -b feature/my-change origin/main
# ... commit changes ...
git push -u origin feature/my-change
# Open PR URL:
echo "https://github.com/ssdajoker/LUASCRIPT/compare/main...feature/my-change?expand=1"
```

## Overrides

- One-time skip local tests: `git push --no-verify` or `HUSKY=0 git push`
- One-time allow push to main: `ALLOW_PUSH_MAIN=1 git push` (not recommended)

## CI considerations

This local hook is a convenience; server-side branch protection rules should enforce PRs and required checks.

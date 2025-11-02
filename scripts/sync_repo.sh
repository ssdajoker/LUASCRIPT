#!/usr/bin/env bash
set -euo pipefail

# Sync the local repo with its GitHub origin so both stay in sync.
# Safe for main branch; supports feature branches as well.

REPO_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$REPO_DIR"

REMOTE_NAME="origin"
DEFAULT_BRANCH="main"

echo "== Sync: verifying remotes =="
git remote -v

echo "== Sync: fetching =="
git fetch --all --prune

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "== Sync: current branch: $CURRENT_BRANCH =="

BASE_BRANCH=${1:-$DEFAULT_BRANCH}
echo "== Sync: base branch: $BASE_BRANCH =="

# Ensure local base branch exists and tracks remote
if ! git show-ref --verify --quiet refs/heads/$BASE_BRANCH; then
  echo "== Creating local $BASE_BRANCH from $REMOTE_NAME/$BASE_BRANCH =="
  git checkout -b "$BASE_BRANCH" "$REMOTE_NAME/$BASE_BRANCH"
fi

# Rebase or fast-forward base branch
echo "== Sync: fast-forward $BASE_BRANCH from $REMOTE_NAME/$BASE_BRANCH =="
git checkout "$BASE_BRANCH"
git merge --ff-only "$REMOTE_NAME/$BASE_BRANCH" || {
  echo "Fast-forward failed; attempting rebase"
  git rebase "$REMOTE_NAME/$BASE_BRANCH" || { echo "Rebase failed. Resolve conflicts and re-run."; exit 1; }
}

# Push base branch if ahead
if [ "$(git rev-list --count $REMOTE_NAME/$BASE_BRANCH..$BASE_BRANCH)" -gt 0 ]; then
  echo "== Sync: pushing $BASE_BRANCH to $REMOTE_NAME =="
  git push "$REMOTE_NAME" "$BASE_BRANCH"
else
  echo "== Sync: $BASE_BRANCH is up to date with $REMOTE_NAME/$BASE_BRANCH =="
fi

# If we started on another branch, rebase it onto updated base and push
if [ "$CURRENT_BRANCH" != "$BASE_BRANCH" ]; then
  echo "== Sync: updating feature branch $CURRENT_BRANCH onto $BASE_BRANCH =="
  git checkout "$CURRENT_BRANCH"
  git rebase "$BASE_BRANCH" || { echo "Rebase conflicts on $CURRENT_BRANCH. Resolve and re-run."; exit 1; }
  if git rev-parse --verify --quiet "$REMOTE_NAME/$CURRENT_BRANCH" >/dev/null; then
    echo "== Sync: pushing $CURRENT_BRANCH to $REMOTE_NAME =="
    git push --force-with-lease "$REMOTE_NAME" "$CURRENT_BRANCH"
  else
    echo "== Sync: setting upstream for $CURRENT_BRANCH =="
    git push -u "$REMOTE_NAME" "$CURRENT_BRANCH"
  fi
fi

echo "== Sync: done =="

#!/usr/bin/env bash
set -euo pipefail

# Simple PR helper: creates a branch from main (or current), pushes, and prints a PR URL.
# Usage: scripts/pr.sh <branch-name> [base=main] [title]

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

branch="${1:-}"
base="${2:-main}"
title="${3:-}"

if [[ -z "$branch" ]]; then
  echo "Usage: $0 <branch-name> [base=main] [title]" >&2
  exit 2
fi

# Ensure we have origin and we can fetch
git fetch -p origin

# Ensure base exists locally
if ! git rev-parse --verify "$base" >/dev/null 2>&1; then
  git checkout -b "$base" "origin/$base"
fi

# Ensure base is up-to-date
git checkout "$base"
git pull --ff-only || true

# Create branch from base if not exists
if git rev-parse --verify "$branch" >/dev/null 2>&1; then
  git checkout "$branch"
else
  git checkout -b "$branch" "$base"
fi

# Push and set upstream
git push -u origin "$branch"

# Build PR URL (works with GitHub)
owner_repo="ssdajoker/LUASCRIPT"
encoded_title="${title// /%20}"
pr_url="https://github.com/${owner_repo}/compare/${base}...${branch}?expand=1"
if [[ -n "$title" ]]; then
  pr_url+="&title=${encoded_title}"
fi

echo "\nOpen this URL to create a PR:\n  $pr_url\n"

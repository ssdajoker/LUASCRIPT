# Keeping Local and GitHub in Sync

This guide shows how to ensure your local repo (`LUASCRIPT`) and your GitHub repo (`origin`) stay mirrored.

## 1) Authentication

- SSH (recommended):
  - Generate key (if needed): `ssh-keygen -t ed25519 -C "you@example.com"`
  - Add public key to GitHub: Settings → SSH and GPG keys
  - Update remote: `git remote set-url origin git@github.com:<user>/LUASCRIPT.git`
- HTTPS + PAT:
  - Create a Personal Access Token with `repo` scope
  - Cache credentials: `git config --global credential.helper store`

## 2) One-shot sync

Use the provided script to fetch, fast-forward, rebase, and push as needed.

```bash
scripts/sync_repo.sh               # defaults to main
scripts/sync_repo.sh main          # explicit base
scripts/sync_repo.sh release/v1    # custom base
```

The script:

- Fetches all remotes and prunes branches
- FF/rebases your base branch onto origin
- Rebases your current feature branch onto the updated base
- Pushes changes (force-with-lease for feature branches)

## 3) Automate (cron)

```bash
crontab -e
```

Add (sync every hour):

```bash
0 * * * * cd "$HOME/LUASCRIPT" && bash scripts/sync_repo.sh main >> "$HOME/.luascript_sync.log" 2>&1
```

## 4) Branch protection

If `main` is protected on GitHub, avoid force pushes on main. The script uses fast-forward or rebase locally but pushes main normally (no force). Feature branches use force-with-lease.

## 5) Optional: upstream remote

If you also track another fork/upstream, add it and rebase main from it before pushing:

```bash
git remote add upstream git@github.com:org/LUASCRIPT.git
git fetch upstream
git checkout main && git rebase upstream/main && git push origin main
```

## 6) Troubleshooting

- Auth errors: verify SSH key or PAT configuration, and remote URL with `git remote -v`.
- Rebase conflicts: resolve, `git rebase --continue`, then re-run the sync.
- Protected branches: disable force pushes for main; use PRs for merging.

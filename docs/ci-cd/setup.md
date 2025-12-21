# CI/CD Setup (Canonical)
**Status**: ACTIVE  
**Phase**: Current  
**Last updated**: 2025-12-19  
**Related**: docs/ci-cd/README.md  
**Sources**: CI_CD_LEAN_SETUP.md + CI_CD_SETUP_CHECKLIST.md

---# CI/CD Lean Setup Guide

## Overview

This guide configures your repository for automated CI/CD with minimal GitHub UI interaction. The bot workflow:

1. **Run CI**: `npm run verify` + `npm run lint` (warning-only)
2. **Auto-Merge**: If CI passes + approved, squash merge to main
3. **No UI fishing**: Everything happens in VS Code and automated workflows

---

## Step 1: Configure Branch Protection Rules

Go to **Settings â†’ Branches â†’ Branch protection rules** â†’ **Add rule**

### Rule for `main` branch:

1. **Branch name pattern**: `main`

2. **Require status checks to pass**:
   - âœ… Check: `gate (18)` 
   - âœ… Check: `gate (20)`
   - âœ… Require branches to be up to date: YES

3. **Require code reviews**:
   - âœ… Require at least 1 approval
   - âœ… Dismiss stale reviews: YES
   - âœ… Require review of latest changes: YES

4. **Require status checks before merging**:
   - âœ… Require branches to be up to date before merging: YES
   - âœ… Require code review

5. **Allow auto-merge**:
   - âœ… Allow auto-merge: YES (squash)

6. **Dismiss pull request approvals when new commits are pushed**:
   - âœ… YES

7. **Require signed commits**:
   - â˜ NO (optional)

8. **Include administrators**:
   - â˜ NO (admins can bypass)

### CLI Alternative (for GitHub API):

```bash
# Enable branch protection via CLI
gh api repos/{owner}/{repo}/branches/main/protection \
  -X PUT \
  -f required_status_checks='{
    "strict": true,
    "contexts": ["gate (18)", "gate (20)"]
  }' \
  -f enforce_admins=false \
  -f required_pull_request_reviews='{
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  }' \
  -f allow_force_pushes=false \
  -f allow_deletions=false \
  -f allow_auto_merge=true
```

---

## Step 2: Enable Auto-Merge Workflow

The `auto-merge-lean.yml` workflow is triggered by:
- âœ… CI workflow completion (success)
- âœ… PR open/sync + manual trigger (for testing)

**Requirements for auto-merge**:
- âœ… All CI checks pass (`gate` jobs)
- âœ… PR approved by 1+ human reviewer
- âœ… Branch up to date with main
- âœ… Not a draft PR

---

## Step 3: Configure GitHub App Permissions (if needed)

If using a bot account for auto-merge:

1. Go to **Settings â†’ Developer settings â†’ GitHub Apps**
2. Ensure the app has:
   - âœ… `contents: write` (merge PRs)
   - âœ… `pull-requests: write` (comment on PRs)
   - âœ… `checks: read` (read CI status)

---

## Step 4: Workflow in Action

### Typical PR Flow:

```
1. Create PR on feature branch
   â””â”€> Triggers: ci-lean.yml

2. CI runs (both Node 18 & 20)
   â”œâ”€ npm run verify (fast)
   â”œâ”€ npm run lint (warning-only, passes even with 100+ warnings)
   â””â”€> Uploads: test results, coverage, reports

3. CI comments with results
   â””â”€> Shows: harness pass/fail, IR validation, parity status

4. You approve PR in VS Code (GitHub desktop/CLI)
   â””â”€> gh pr review -a  # or web UI

5. Auto-merge triggers
   â”œâ”€ Checks: CI passed? Yes âœ“
   â”œâ”€ Checks: Approved? Yes âœ“
   â”œâ”€ Checks: Draft? No âœ“
   â””â”€> Squash merges to main

6. PR closed + committed
   â””â”€> Done!
```

---

## Step 5: Local Development Workflow

### Before pushing:

```bash
# 1. Verify locally
npm run verify    # Fast: harness + IR + parity + determinism

# 2. Lint (warning-only, non-blocking)
npm run lint      # Reports issues but doesn't fail

# 3. Create PR
git checkout -b fix/my-change
git add .
git commit -m "fix: ..."
gh pr create --base main --draft=false
```

### While CI runs:

```bash
# Watch CI progress
gh run list --branch $(git rev-parse --abbrev-ref HEAD)

# Check PR status
gh pr view $(gh pr list --json number | jq -r '.[0].number')
```

### After approval (optional manual merge):

```bash
# Trigger auto-merge via workflow dispatch
gh workflow run auto-merge-lean.yml -f pr_number=<PR_NUMBER>

# Or let auto-merge workflow handle it automatically
```

---

## Step 6: Lint Backlog Strategy

**Current state**: `refactor:lint` allows 200 warnings (temporary)

**Phased approach**:

| Phase | Max Warnings | Timeline |
|-------|-------------|----------|
| **Phase 1** | 200 | Now (Codex/team cleanup) |
| **Phase 2** | 100 | 1-2 weeks |
| **Phase 3** | 50  | 3-4 weeks |
| **Phase 4** | 0   | Production-ready |

**Mechanism**: Update `package.json` `refactor:lint` as warnings decrease:

```json
"refactor:lint": "eslint src/**/*.js --max-warnings 200"  // Phase 1
"refactor:lint": "eslint src/**/*.js --max-warnings 100"  // Phase 2
"refactor:lint": "eslint src/**/*.js --max-warnings 50"   // Phase 3
"refactor:lint": "eslint src/**/*.js --max-warnings 0"    // Phase 4
```

---

## Step 7: Monitoring & Logs

### View recent CI runs:

```bash
gh run list --workflow ci-lean.yml --limit 10
```

### View specific run:

```bash
gh run view <RUN_ID>
```

### Download artifacts:

```bash
gh run download <RUN_ID> -D ./results
cat results/harness_results.json
```

### View PR comments from bot:

```bash
gh pr view <PR_NUMBER> --json comments
```

---

## Step 8: Troubleshooting

### "PR won't merge" after CI passes:

1. Check branch protection rules are configured
2. Verify PR is approved (1+ reviews with APPROVED state)
3. Verify branch is up to date: `git fetch origin main && git rebase origin/main`
4. Manually merge if needed: `gh pr merge <PR_NUMBER> --squash`

### "CI stuck or failed":

1. Check logs: `gh run view <RUN_ID> --log`
2. Common issues:
   - Node modules cache corruption: Clear cache in Actions settings
   - System dependency missing: Check `npm run verify` locally first
   - Lua/LuaJIT not installed: Handled automatically, but check OS-specific setup

### "Auto-merge workflow not triggering":

1. Verify workflow is enabled: Settings â†’ Actions â†’ All workflows
2. Check workflow file is in `.github/workflows/`
3. Ensure `on.workflow_run` references correct workflow name (`CI (Lean)`)
4. Check permissions: Workflows need `contents: write`

---

## Step 9: GitHub Actions Secrets (Optional)

If using bot account or external tools:

1. Go to **Settings â†’ Secrets and variables â†’ Actions**
2. Add if needed:
   - `GITHUB_TOKEN`: Auto-provided by Actions
   - `GH_TOKEN`: If using `gh` CLI inside workflows

---

## Advanced: Customizing CI Gate

### To run different checks on main vs PRs:

Edit `.github/workflows/ci-lean.yml`:

```yaml
on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]  # Only run full CI on main pushes
```

### To add coverage reports:

Add to CI job:

```yaml
- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

---

## Summary

**Before**: Manual GitHub UI review, merge, check CI status
**After**: Create PR â†’ CI runs â†’ Auto-merge when approved (no UI needed)

**Key benefits**:
- âœ… No UI fishing - all in workflows + VS Code
- âœ… Fast CI (Node 18/20 parallel)
- âœ… Artifacts uploaded for debugging
- âœ… Auto-merge on green + approved
- âœ… Clear lint backlog strategy
- âœ… Human review preserved (needed for merge)

---

## Next Steps

1. âœ… Configure branch protection rules (Step 1)
2. âœ… Test CI workflow on a feature branch
3. âœ… Review first auto-merge behavior
4. âœ… Adjust lint thresholds as warnings decrease
5. âœ… Document any custom checks/gates team needs
---
## Checklist (merged from CI_CD_SETUP_CHECKLIST.md)
# CI/CD Pipeline Deployment Checklist

## âœ… Phase 1: Code & Configuration (Complete)

- [x] ESLint config updated - 0 errors, 101 warnings
- [x] `npm run lint` allows 200 warnings (temporary Phase 1/4)
- [x] `npm run verify` works locally
- [x] Workflows created:
  - [x] `.github/workflows/ci-lean.yml` - Fast gate
  - [x] `.github/workflows/auto-merge-lean.yml` - Auto-merge logic
- [x] Documentation created:
  - [x] `CI_CD_LEAN_SETUP.md` - Full setup guide
  - [x] `CI_CD_QUICK_REF.md` - Developer reference
  - [x] `scripts/setup-branch-protection.sh` - CLI setup script

**Status**: âœ… DONE - Ready for GitHub configuration

---

## â³ Phase 2: GitHub Actions Setup (Manual - 5 min)

### 2.1 Enable Workflows

Go to: **Your repo â†’ Actions â†’ All workflows**

- [ ] `CI (Lean)` - Click **Enable** if disabled
- [ ] `Auto-Merge on CI Green` - Click **Enable** if disabled

**Or via CLI**:
```bash
gh workflow enable ci-lean.yml -R ssdajoker/LUASCRIPT
gh workflow enable auto-merge-lean.yml -R ssdajoker/LUASCRIPT
```

### 2.2 Configure Branch Protection for `main`

**Option A: Web UI (Recommended for first-time)**

Go to: **Settings â†’ Branches â†’ Add rule**

- [ ] Branch name: `main`
- [ ] âœ… Require status checks to pass
  - [ ] Add: `gate (18)`
  - [ ] Add: `gate (20)`
- [ ] âœ… Require 1 approval
- [ ] âœ… Dismiss stale reviews on new commits
- [ ] âœ… Require branches to be up to date
- [ ] âœ… Allow auto-merge
- [ ] â˜ Require signed commits (optional)
- [ ] â˜ Include administrators (leave unchecked)

**Option B: GitHub CLI (Scripted)**

```bash
bash scripts/setup-branch-protection.sh
```

---

## ðŸ§ª Phase 3: Test the Pipeline (10 min)

### 3.1 Create test PR

```bash
git checkout -b test/ci-demo
echo "# CI Test" > TEST_CI.md
git add .
git commit -m "test: verify CI pipeline"
git push origin test/ci-demo
gh pr create --base main --title "Test: CI Pipeline" --body "Validating CI/CD setup"
```

### 3.2 Watch CI run

```bash
# Monitor run status
gh run list --branch test/ci-demo

# View logs when complete
gh run view <RUN_ID> --log

# Check PR status
gh pr view
```

**Expected outcome**:
- [ ] Both `gate (18)` and `gate (20)` jobs pass âœ“
- [ ] Bot comments on PR with results
- [ ] No auto-merge yet (needs approval)

### 3.3 Test approval flow

```bash
# Approve the PR
gh pr review --approve

# Watch auto-merge trigger
gh run list --workflow auto-merge-lean.yml | head -3
```

**Expected outcome**:
- [ ] Auto-merge workflow starts
- [ ] PR merges automatically
- [ ] Branch closed with squash merge

### 3.4 Verify on main

```bash
git fetch origin main
git log --oneline origin/main | head -3
# Should show your test commit with "Test: CI Pipeline" message
```

---

## ðŸ“‹ Phase 4: Real-World Testing (Do with first real PR)

When you have a real feature/fix to merge:

1. [ ] Create branch: `git checkout -b fix/your-issue`
2. [ ] Make changes
3. [ ] Push and create PR: `gh pr create --base main`
4. [ ] Wait for CI (2-5 minutes)
5. [ ] Approve: `gh pr review --approve`
6. [ ] Auto-merge happens automatically âœ¨
7. [ ] Verify in `git log`

---

## ðŸ“Š Phase 5: Monitoring & Maintenance

### Weekly check

```bash
# See recent CI runs
gh run list --workflow ci-lean.yml --limit 10

# Check lint warning trend
npm run lint 2>&1 | grep "problems"
```

### Lint backlog phases

Currently at: **Phase 1/4**

| Phase | Warnings | When | Action |
|-------|----------|------|--------|
| 1 | 200 | NOW | Codex/team cleanup |
| 2 | 100 | 1-2w | Update `package.json` |
| 3 | 50 | 3-4w | Update `package.json` |
| 4 | 0 | 4-6w | Production ready |

**To upgrade phase**:
```json
// In package.json
"refactor:lint": "eslint src/**/*.js --max-warnings 100"  // Change 200 â†’ 100
```

---

## ðŸŽ¯ Success Criteria

All items checked = âœ… Pipeline Live:

- [ ] Workflows enabled in Actions
- [ ] Branch protection configured for `main`
- [ ] Test PR passed CI
- [ ] Auto-merge worked on test PR
- [ ] Team is notified
- [ ] First real PR tested

---

## ðŸ†˜ Troubleshooting

| Issue | Solution |
|-------|----------|
| **Workflows don't show in Actions** | Check `.github/workflows/` files exist and YAML is valid |
| **CI fails on Node setup** | Verify `npm ci` works locally first |
| **Auto-merge doesn't trigger** | Check: (1) PR approved, (2) Not draft, (3) Branch protection enabled |
| **Tests fail on Windows** | Check line endings: `git config core.autocrlf` |
| **Artifacts not uploading** | Verify paths exist: check `npm run verify` output locally |

---

## ðŸ“š References

- [CI_CD_LEAN_SETUP.md](CI_CD_LEAN_SETUP.md) - Detailed setup
- [CI_CD_QUICK_REF.md](CI_CD_QUICK_REF.md) - Developer quick start
- `.github/workflows/ci-lean.yml` - Workflow source
- `.github/workflows/auto-merge-lean.yml` - Auto-merge logic
- `package.json` - Scripts & config

---

## ðŸ“ Sign-Off

- [ ] All phases complete
- [ ] Team briefed on new workflow
- [ ] First PR tested successfully
- [ ] Ready for production use

**Started**: 2025-12-20
**Target completion**: Same day (Phase 2) + 1-2 days (Phase 3-4)


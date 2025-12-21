# CI/CD Lean Setup Guide

## Overview

This guide configures your repository for automated CI/CD with minimal GitHub UI interaction. The bot workflow:

1. **Run CI**: `npm run verify` + `npm run lint` (warning-only)
2. **Auto-Merge**: If CI passes + approved, squash merge to main
3. **No UI fishing**: Everything happens in VS Code and automated workflows

---

## Step 1: Configure Branch Protection Rules

Go to **Settings → Branches → Branch protection rules** → **Add rule**

### Rule for `main` branch:

1. **Branch name pattern**: `main`

2. **Require status checks to pass**:
   - ✅ Check: `gate (18)` 
   - ✅ Check: `gate (20)`
   - ✅ Require branches to be up to date: YES

3. **Require code reviews**:
   - ✅ Require at least 1 approval
   - ✅ Dismiss stale reviews: YES
   - ✅ Require review of latest changes: YES

4. **Require status checks before merging**:
   - ✅ Require branches to be up to date before merging: YES
   - ✅ Require code review

5. **Allow auto-merge**:
   - ✅ Allow auto-merge: YES (squash)

6. **Dismiss pull request approvals when new commits are pushed**:
   - ✅ YES

7. **Require signed commits**:
   - ☐ NO (optional)

8. **Include administrators**:
   - ☐ NO (admins can bypass)

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
- ✅ CI workflow completion (success)
- ✅ PR open/sync + manual trigger (for testing)

**Requirements for auto-merge**:
- ✅ All CI checks pass (`gate` jobs)
- ✅ PR approved by 1+ human reviewer
- ✅ Branch up to date with main
- ✅ Not a draft PR

---

## Step 3: Configure GitHub App Permissions (if needed)

If using a bot account for auto-merge:

1. Go to **Settings → Developer settings → GitHub Apps**
2. Ensure the app has:
   - ✅ `contents: write` (merge PRs)
   - ✅ `pull-requests: write` (comment on PRs)
   - ✅ `checks: read` (read CI status)

---

## Step 4: Workflow in Action

### Typical PR Flow:

```
1. Create PR on feature branch
   └─> Triggers: ci-lean.yml

2. CI runs (both Node 18 & 20)
   ├─ npm run verify (fast)
   ├─ npm run lint (warning-only, passes even with 100+ warnings)
   └─> Uploads: test results, coverage, reports

3. CI comments with results
   └─> Shows: harness pass/fail, IR validation, parity status

4. You approve PR in VS Code (GitHub desktop/CLI)
   └─> gh pr review -a  # or web UI

5. Auto-merge triggers
   ├─ Checks: CI passed? Yes ✓
   ├─ Checks: Approved? Yes ✓
   ├─ Checks: Draft? No ✓
   └─> Squash merges to main

6. PR closed + committed
   └─> Done!
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

1. Verify workflow is enabled: Settings → Actions → All workflows
2. Check workflow file is in `.github/workflows/`
3. Ensure `on.workflow_run` references correct workflow name (`CI (Lean)`)
4. Check permissions: Workflows need `contents: write`

---

## Step 9: GitHub Actions Secrets (Optional)

If using bot account or external tools:

1. Go to **Settings → Secrets and variables → Actions**
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
**After**: Create PR → CI runs → Auto-merge when approved (no UI needed)

**Key benefits**:
- ✅ No UI fishing - all in workflows + VS Code
- ✅ Fast CI (Node 18/20 parallel)
- ✅ Artifacts uploaded for debugging
- ✅ Auto-merge on green + approved
- ✅ Clear lint backlog strategy
- ✅ Human review preserved (needed for merge)

---

## Next Steps

1. ✅ Configure branch protection rules (Step 1)
2. ✅ Test CI workflow on a feature branch
3. ✅ Review first auto-merge behavior
4. ✅ Adjust lint thresholds as warnings decrease
5. ✅ Document any custom checks/gates team needs

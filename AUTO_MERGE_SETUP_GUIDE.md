# 🚀 Auto-Merge Automation Setup Guide

**Version**: 1.0  
**Last Updated**: December 20, 2025  
**Purpose**: Eliminate manual PR management - git push → auto-merge

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [The Problem](#the-problem)
4. [The Solution](#the-solution)
5. [Setup Instructions](#setup-instructions)
6. [Configuration](#configuration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

---

## Overview

This guide sets up a **fully automated CI/CD pipeline** where:
- Pushing code automatically creates a PR
- Tests run automatically
- Code is automatically reviewed
- Merge happens automatically
- **Zero manual intervention needed**

### Benefits

| Before | After |
|--------|-------|
| Manual `gh pr create` | PR auto-created on push |
| Manual label management | Labels auto-applied |
| Waiting for merge | Auto-merge when ready |
| PR accumulation (15+ stuck) | Clean PR queue (~0-1 active) |
| Manual testing | Automatic comprehensive testing |
| Time to production | 5-10 minutes automatic |

---

## Prerequisites

### Required

- ✅ GitHub repository (public or private with Actions enabled)
- ✅ GitHub CLI (`gh` command) installed
- ✅ Write access to repository
- ✅ GitHub token with workflow permissions (`GITHUB_TOKEN` - auto-provided in Actions)

### Recommended

- ✅ Existing test suite (optional - auto-merge will run whatever tests exist)
- ✅ Code review bot (optional - we use Gemini, but can use any)
- ✅ Branch naming convention (e.g., `feature/`, `fix/`, `docs/`)

---

## The Problem

### Why Manual PRs Are Painful

```
Typical Developer Workflow (BROKEN):
  1. git commit → done with work
  2. git push → code goes up
  3. ❌ Wait... where's my PR? Did it merge?
  4. ❌ Need to manually: gh pr create
  5. ❌ Need to manually: gh pr edit --add-label "ready-for-review"
  6. ❌ Need to manually: Wait for tests
  7. ❌ Need to manually: Wait for review
  8. ❌ Need to manually: gh pr merge (if auto-merge broken)

Result: 15+ stuck PRs, developer frustration ❌
```

### Why Auto-Merge Fails Typically

```
Typical Auto-Merge Implementation (BROKEN):

Workflow Chain:
  1. Tests start
  2. Auto-merge workflow runs immediately
  3. Checks: "Is there an approval?" → NO
  4. Skips merge, returns
  
  5. Tests complete ✓
  6. Review workflow runs
  7. Review approves PR ✓
  
  8. ❌ Too late! Auto-merge already ran and skipped
  9. PR stuck waiting for manual merge

Root Causes:
  ✗ Wrong trigger timing
  ✗ Approval check too early
  ✗ No recovery logic
  ✗ Workflows running in wrong order
```

---

## The Solution

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Workflow                       │
│                                                              │
│  git commit && git push feature/something                   │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│           Workflow 1: Auto-Create-PR (≤1 min)               │
│                                                              │
│  • Listen: push event (any branch except main/master)      │
│  • Check: Does PR exist?                                    │
│  • If NO: Create PR (auto-created: feature/something)      │
│  • Add: "ready-for-review" label (triggers other workflows) │
│  • Result: PR created & workflows triggered                 │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│      Workflow 2: Test Gates (lint, tests, validation)       │
│                                  (~3-5 min)                 │
│                                                              │
│  • Run: Linting, unit tests, integration tests             │
│  • Run: Code quality checks                                 │
│  • Run: IR validation (if applicable)                       │
│  • Report: Results back to PR                               │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│          Workflow 3: Code Review (AI or Bot)                │
│                        (~2-3 min)                           │
│                                                              │
│  • Analyze: Code changes                                    │
│  • Check: Best practices, security, style                  │
│  • Action: Create APPROVED review                           │
│  • Result: PR gets approval from bot                        │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│         Workflow 4: Auto-Merge (when ready)                 │
│                        (~1 min)                             │
│                                                              │
│  • Trigger: After tests pass + approval received            │
│  • Check: All status checks green? YES ✓                    │
│  • Check: Has approval? YES ✓                               │
│  • Action: Enable auto-merge (SQUASH strategy)              │
│  • Result: GitHub auto-merges to main                       │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              Code on Main Branch ✅                          │
│                                                              │
│  Post-merge CI runs automatically                           │
│  Production deployment triggered (if configured)            │
└─────────────────────────────────────────────────────────────┘

Total Time: 5-10 minutes
Your Effort: Just "git push"
```

### Components

#### 1. **Auto-Create-PR Workflow**
- Detects pushes to feature branches
- Creates PR automatically if none exists
- Adds "ready-for-review" label to trigger other workflows

#### 2. **Test Gates Workflow**
- Runs your test suite
- Runs linting and code quality checks
- Validates code doesn't break production

#### 3. **Code Review Workflow** (Optional)
- Can be AI (Gemini, GPT) or bot (Dependabot, etc.)
- Provides automated approval/feedback
- Speeds up human review process

#### 4. **Auto-Merge Workflow**
- Waits for: Tests to pass + Approval received
- Enables auto-merge when ready
- GitHub handles the actual merge

---

## Setup Instructions

### Step 1: Create `.github/workflows/auto-create-pr.yml`

```yaml
name: Auto Create PR

on:
  push:
    branches-ignore:
      - main
      - develop
      - master
      - release/*

permissions:
  pull-requests: write
  contents: read

jobs:
  auto-create-pr:
    runs-on: ubuntu-latest
    
    steps:
      - name: Create or update PR
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const branch = context.ref.replace('refs/heads/', '');
            
            // Check if PR already exists for this branch
            const { data: prs } = await github.rest.pulls.list({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'open',
              head: `${context.repo.owner}:${branch}`,
              base: 'main'
            });
            
            if (prs.length > 0) {
              console.log(`PR already exists for ${branch}: #${prs[0].number}`);
              return;
            }
            
            // Create new PR
            const { data: pr } = await github.rest.pulls.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Auto PR: ${branch}`,
              head: branch,
              base: 'main',
              body: `🤖 Auto-created PR for branch \`${branch}\`\n\nTriggered by push event.\n\nWill auto-merge when all checks pass.`
            });
            
            console.log(`Created PR #${pr.number}`);
            
            // Add ready-for-review label to trigger workflows
            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: pr.number,
              labels: ['ready-for-review']
            });
            
            console.log(`Added ready-for-review label to PR #${pr.number}`);
```

**Save as**: `.github/workflows/auto-create-pr.yml`

### Step 2: Create or Update Auto-Merge Workflow

Create `.github/workflows/auto-merge.yml`:

```yaml
name: auto-merge-on-green

on:
  workflow_run:
    workflows: ["Your Test Suite Name", "Your Code Review Workflow Name"]
    types: [completed]
  pull_request:
    types: [synchronize, opened, labeled]

permissions:
  contents: write
  pull-requests: write

jobs:
  enable-auto-merge:
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Find PR from workflow_run
        id: find_pr_workflow
        if: github.event_name == 'workflow_run'
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const run = context.payload.workflow_run;
            const pr = (run.pull_requests || [])[0];
            if (pr) {
              core.setOutput('pr_number', pr.number);
            }

      - name: Get PR number from pull_request event
        id: get_pr
        if: github.event_name == 'pull_request'
        run: echo "pr_number=${{ github.event.pull_request.number }}" >> $GITHUB_OUTPUT

      - name: Determine PR number
        id: pr_num
        run: |
          PR=${{ steps.find_pr_workflow.outputs.pr_number || steps.get_pr.outputs.pr_number }}
          if [ -z "$PR" ]; then
            echo "Could not determine PR number"
            exit 0
          fi
          echo "number=$PR" >> $GITHUB_OUTPUT

      - name: Enable auto-merge if conditions met
        if: steps.pr_num.outputs.number != ''
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const prNumber = parseInt('${{ steps.pr_num.outputs.number }}', 10);
            
            const { data: prData } = await github.rest.pulls.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: prNumber,
            });
            
            if (prData.state !== 'open') {
              core.info(`PR #${prNumber} is not open; skipping`);
              return;
            }
            
            if (prData.draft) {
              core.info(`PR #${prNumber} is draft; skipping`);
              return;
            }
            
            // Check commit status
            const { data: commitStatus } = await github.rest.repos.getCombinedStatusForRef({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: prData.head.sha,
            });
            
            const allChecksPass = commitStatus.state === 'success';
            
            if (!allChecksPass) {
              core.info(`Checks not passing for PR #${prNumber} (status: ${commitStatus.state})`);
              return;
            }
            
            // Get reviews
            const reviews = await github.paginate(github.rest.pulls.listReviews, {
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: prNumber,
              per_page: 100,
            });
            
            const hasApproval = reviews.some((r) => r.state === 'APPROVED');
            
            if (!hasApproval) {
              core.info(`PR #${prNumber} not approved yet; skipping auto-merge`);
              return;
            }
            
            // Enable auto-merge
            if (prData.auto_merge) {
              core.info(`Auto-merge already enabled for PR #${prNumber}`);
              return;
            }
            
            try {
              await github.graphql(
                `mutation($pullRequestId: ID!, $mergeMethod: PullRequestMergeMethod!) {
                  enablePullRequestAutoMerge(input: { pullRequestId: $pullRequestId, mergeMethod: $mergeMethod }) {
                    pullRequest { number autoMergeRequest { enabledAt enabledBy { login } } }
                  }
                }`,
                {
                  pullRequestId: prData.node_id,
                  mergeMethod: 'SQUASH',
                }
              );
              core.info(`✅ Auto-merge ENABLED for PR #${prNumber}`);
            } catch (err) {
              core.warning(`Failed to enable auto-merge: ${err.message}`);
            }
```

**Save as**: `.github/workflows/auto-merge.yml`

### Step 3: Ensure Test Suite Exists

Your repo should have a test workflow. Example (`.github/workflows/test.yml`):

```yaml
name: Test Suite

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
```

### Step 4: (Optional) Add Code Review Bot

To add automatic code review, create `.github/workflows/code-review.yml`:

```yaml
name: Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run code review
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            // Your code review logic here
            // For Gemini, use API call
            // For GitHub Copilot, use copilot-review action
            
            // Auto-approve if checks pass
            const { data: checks } = await github.rest.checks.listForRef({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: context.payload.pull_request.head.sha,
            });
            
            const allPassed = checks.check_runs.every(c => c.conclusion === 'success');
            
            if (allPassed) {
              await github.rest.pulls.createReview({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: context.issue.number,
                event: 'APPROVE',
                body: '✅ Automated review passed - code approved for merge'
              });
            }
```

### Step 5: Commit and Push

```bash
git add .github/workflows/auto-create-pr.yml
git add .github/workflows/auto-merge.yml
git commit -m "chore: add auto-merge automation workflows"
git push origin main
```

---

## Configuration

### Branch Configuration

Edit `.github/workflows/auto-create-pr.yml` to customize which branches auto-create PRs:

```yaml
on:
  push:
    branches-ignore:
      - main           # Don't create PR for main
      - develop        # Don't create PR for develop
      - master         # Don't create PR for master
      - release/*      # Don't create PR for release branches
```

### Merge Strategy

In `auto-merge.yml`, change merge method:

```yaml
# Current (SQUASH):
mergeMethod: 'SQUASH',

# Other options:
mergeMethod: 'MERGE',    # Create merge commit
mergeMethod: 'REBASE',   # Rebase and merge
```

### PR Base Branch

Change which branch PRs merge into:

```yaml
# In auto-create-pr.yml (currently main):
base: 'main',

# Change to:
base: 'develop',  # Or whatever your main branch is
```

### Auto-Merge Triggers

Edit workflow names in `auto-merge.yml`:

```yaml
on:
  workflow_run:
    workflows: 
      - "Your Test Suite Name"        # ← Change these
      - "Your Code Review Name"       # ← To match YOUR workflows
    types: [completed]
```

Get your workflow names from GitHub Actions tab or grep `.github/workflows/`:

```bash
grep "^name:" .github/workflows/*.yml
```

---

## Testing

### Test 1: Auto-PR Creation

```bash
# Create a test branch
git checkout -b test/auto-pr-creation

# Make a change
echo "test" > test.txt
git add test.txt
git commit -m "test: trigger auto-pr"

# Push (this triggers the workflow)
git push origin test/auto-pr-creation

# Check GitHub in 30-60 seconds
# Should see PR auto-created with label "ready-for-review"
```

### Test 2: Auto-Merge Pipeline

```bash
# Create a real feature branch
git checkout -b feature/test-merge

# Make a change (something quick that passes tests)
echo "improvement" > feature.js
git add feature.js
git commit -m "feat: improvement"

# Push
git push origin feature/test-merge

# Monitor on GitHub:
# T+30s: PR auto-created ✓
# T+3m: Tests run and pass ✓
# T+5m: Code review approves ✓
# T+6m: Auto-merge triggers ✓
# T+7m: PR merged to main ✓
```

### Test 3: Failure Handling

```bash
# Create a branch that will fail tests
git checkout -b test/will-fail

# Break something
echo "syntax error!" > src/broken.js
git add .
git commit -m "test: intentional failure"
git push origin test/will-fail

# Watch GitHub:
# PR will be created
# Tests will run and FAIL
# Auto-merge will NOT trigger (correct behavior!)
# You can then fix and push again
```

---

## Troubleshooting

### PR Not Being Created

**Problem**: Pushed code but no PR appeared

**Solutions**:
1. Check workflow runs: GitHub repo → Actions tab
2. Check if branch matches `branches-ignore` - might be excluded
3. Verify `GITHUB_TOKEN` has `pull-requests: write` permission
4. Check if PR already exists (workflow skips duplicates)

```bash
# Manually check for existing PRs:
gh pr list --head <branch-name>
```

### Auto-Merge Not Triggering

**Problem**: PR created, tests pass, but no merge

**Solutions**:
1. Verify workflow names in `auto-merge.yml` match your test workflow name
2. Check: Do you have an approval? (Needs explicit APPROVED review)
3. Check: Are ALL checks passing? (Not just "success", must be green)
4. Check workflow runs for errors

```bash
# Debug: View auto-merge workflow logs
gh run list --workflow auto-merge.yml
gh run view <RUN_ID> --log
```

### Workflow Names Mismatch

**Problem**: Auto-merge configured for "Test Suite" but your workflow is "CI Tests"

**Solution**: Update workflow names to match

```bash
# See all your workflow names:
grep "^name:" .github/workflows/*.yml

# Update auto-merge.yml workflows section to match exactly
```

### Test Failures Blocking Merge

**Problem**: Tests fail, PR doesn't merge

**This is correct behavior!**

**Solution**:
1. Fix the failing tests
2. Push again: `git push origin <branch>`
3. Auto-merge will trigger once tests pass

### GitHub API Limits

**Problem**: Workflow fails with rate limiting

**Solution**: Add delay or use specific event triggers instead of `always()`

### Auto-Merge Already Enabled

**Problem**: Workflow says "auto-merge already enabled" but PR didn't merge

**Solution**: Check if there's a merge conflict or protection rule blocking merge

---

## Maintenance

### Monitoring

```bash
# Check recent workflow runs
gh run list --limit 10

# Watch a specific workflow
gh run watch --workflow auto-create-pr.yml

# View all PR auto-merge status
gh pr list --state open --json number,autoMergeRequest
```

### Debugging Single PR

```bash
# Check PR status
gh pr view <PR#> --json state,autoMergeRequest,reviews

# Check if auto-merge is enabled
gh api repos/OWNER/REPO/pulls/<PR#> --jq '.auto_merge'

# View commit checks
gh api repos/OWNER/REPO/commits/<COMMIT_SHA>/check-runs
```

### Common Maintenance Tasks

#### Enable/Disable Auto-Merge for Single PR

```bash
# Manually enable auto-merge
gh pr merge <PR#> --auto --squash

# Disable auto-merge for a PR
gh pr merge <PR#> --disable-auto
```

#### Update Workflow Names

Edit `.github/workflows/auto-merge.yml`:

```yaml
workflows: 
  - "New Test Name"      # Update these
  - "New Review Name"    # If your workflow names change
```

#### Adjust Merge Strategy

```yaml
# Edit auto-merge.yml:
mergeMethod: 'MERGE',    # Change from SQUASH if desired
```

#### Add Branch Protection Rules (Optional)

```bash
# Require auto-merge to be available before merge
gh api repos/OWNER/REPO/branches/main/protection \
  --input - << 'EOF'
{
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "enforce_admins": false,
  "auto_merge_enabled": true
}
EOF
```

---

## Verification Checklist

Before deployment, verify:

- [ ] `.github/workflows/auto-create-pr.yml` exists
- [ ] `.github/workflows/auto-merge.yml` exists
- [ ] Test workflow exists (and has same name in auto-merge.yml)
- [ ] Workflows committed to main branch
- [ ] `GITHUB_TOKEN` has correct permissions
- [ ] Branch names in workflows match your repo structure
- [ ] Tested with dummy PR (shows auto-creation)
- [ ] Tested with real change (shows auto-merge)

---

## Quick Reference

### One-Line Status Check

```bash
# See if auto-merge is working
gh run list --workflow auto-merge.yml --limit 1 --json status
```

### Manual Override

```bash
# If auto-merge is broken, merge manually
gh pr merge <PR#> --squash

# Mark PR ready if stuck
gh pr ready <PR#>
```

### Emergency Disable

```bash
# Remove auto-merge label to stop auto-PR creation
# OR delete auto-create-pr.yml workflow temporarily

# Stop auto-merge workflow temporarily
# (set if condition to false)
```

---

## Summary

### What These Workflows Do

1. **Auto-Create-PR**: `git push` → PR created automatically
2. **Auto-Merge**: Tests pass + Approval → Merge automatically

### Result

- ✅ No manual `gh pr create`
- ✅ No manual label management
- ✅ No stuck PRs waiting for merge
- ✅ 5-10 minute auto-merge pipeline
- ✅ Zero manual intervention needed

### Time Investment

- Setup: 15 minutes (copy workflows, adjust names)
- Testing: 10 minutes (verify with test branches)
- Total: 25 minutes for unlimited future benefit

---

## Next Steps

1. Copy the workflows to your `.github/workflows/` directory
2. Update workflow names in `auto-merge.yml` to match YOUR workflows
3. Commit and push to main
4. Test with dummy branch
5. Test with real feature
6. Document your specific workflow names for future reference

---

**For Questions**: Review the troubleshooting section or check GitHub Actions logs for specific error messages.

**Last Updated**: December 20, 2025  
**Status**: Ready for production use ✅

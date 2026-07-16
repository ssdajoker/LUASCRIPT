# Codex + Gemini Integration Setup Guide

## Overview
This guide walks you through the fully automated three-agent development workflow for LUASCRIPT:
- **Copilot** (VS Code): Test expansion
- **Codex** (VS Code): Local implementation
- **Gemini** (GitHub): PR review & auto-merge

**No manual commits, no manual approvals, no manual buttons.**

---

## Prerequisites

### Required Setup
1. ✅ GitHub CLI installed: `gh auth status`
2. ✅ Node.js 20+ installed: `node --version`
3. ✅ Lua 5.4+ and LuaJIT installed (portable in `.tools/`)
4. ✅ Git configured: `git config --global user.name "your-name"`
5. ✅ VS Code with Codex extension (user already logged in)

### Verify Prerequisites
```bash
# Check GitHub authentication
gh auth status

# Check Node version
node --version  # Should be v20+

# Check Lua
lua -v
luajit -v

# Check git config
git config --list | grep "^user\."
```

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        VS Code (Local)                           │
├──────────────────────────┬──────────────────────────────────────┤
│  Copilot Agent           │  Codex Agent                         │
│  ─────────────────────   │  ──────────────────                  │
│  1. Expand tests         │  1. Poll GitHub for work             │
│  2. Create GitHub Issues │  2. Implement locally                │
│  3. Monitor PR approvals │  3. Validate (harness, IR, parity)  │
│  4. Check merge status   │  4. Push to feature branch           │
│     └─→ .codex/state.json                                       │
│  (persistent work state) │                                      │
└──────────────────────────┴──────────────────────────────────────┘
         │                         │
         │ Create Issues           │ Push codex/fix-* branch
         │ with #codex-work        │
         ↓                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub (Remote)                             │
├──────────────────────────┬──────────────────────────────────────┤
│  GitHub Actions          │  Gemini Agent                        │
│  ─────────────────────   │  ──────────────────                  │
│  1. Codex Test Gates     │  1. Poll for #ready-for-review PRs  │
│     - Run harness        │  2. Post code review                 │
│     - IR validation      │  3. Approve if passing              │
│     - Parity tests       │  4. Enable auto-merge                │
│  2. Create/update PR     │  5. PR merges automatically          │
│  3. Label PR             │                                      │
│     (#ready-for-review   │                                      │
│      or #codex-pending)  │                                      │
│  4. Auto-merge workflow  │                                      │
└──────────────────────────┴──────────────────────────────────────┘
```

---

## Day-to-Day Workflow

### Phase 1: Copilot Expands Tests

1. **Open harness test file**:
   ```bash
   code tests/ir/harness.test.js
   ```

2. **Uncomment a failing test** (or add new test case):
   ```javascript
   // Currently commented out:
   // {
   //   name: "async function declaration",
   //   source: `async function test() { await something(); }`,
   //   expectation: (ir) => { /* assertions */ }
   // }
   
   // Uncomment to enable test
   ```

3. **Run harness locally**:
   ```bash
   npm run harness
   ```

4. **See failure** → Copy error message, stack trace, test case

5. **Create GitHub Issue**:
   ```bash
   gh issue create \
     --title "fix: async function declaration parsing" \
     --body "TypeError: Cannot read property 'left' of null at parseAssignment
   
   Stack trace:
   ...
   
   Test case:
   async function test() { await something(); }
   
   Expected: Parsed successfully
   Actual: Error node" \
     --label "codex-work,priority:high"
   ```

6. **Wait for Codex**:
   - Codex polls GitHub every 5 seconds
   - Sees new issue with `#codex-work` label
   - Claims the issue automatically

### Phase 2: Codex Implements Fix

1. **Codex polls for work**:
   ```bash
   # In VS Code terminal (can be running continuously):
   npm run codex:poll
   ```

2. **Codex reads issue context** and implements fix:
   - Edits `src/phase1_core_parser.js`
   - Implements async function parsing logic
   - Saves changes

3. **Codex validates locally**:
   ```bash
   npm run codex:validate:local
   ```
   
   This runs:
   - `npm run harness` (determinism check)
   - `npm run ir:validate:all` (schema compliance)
   - `npm run test:parity` (JS→Lua semantics)

4. **Codex pushes automatically**:
   - Creates feature branch: `codex/fix-42`
   - Commits: `fix(#42): async function declaration parsing`
   - Pushes to GitHub
   - Waits for user confirmation (if running interactively)

5. **GitHub Actions validates**:
   - `.github/workflows/codex-test-gates.yml` triggers
   - Runs same tests (harness, IR, parity)
   - Creates PR if tests pass
   - Labels PR: `#ready-for-review` (or `#codex-pending` if fail)

### Phase 3: Gemini Reviews & Merges

1. **Gemini review agent polls** (GitHub Actions):
   - Sees PR with `#ready-for-review` label
   - Checks validation status
   - Posts review comment

2. **Gemini approves**:
   ```
   ✅ **Gemini Code Review - APPROVED**
   
   - Harness: PASS
   - IR Validation: PASS
   - Parity: PASS
   
   Ready for auto-merge.
   ```

3. **Auto-merge enabled**:
   - PR squash-merged to main automatically
   - Feature branch deleted
   - Copilot sees merged PR on main

4. **Back to Phase 1**: Copilot creates next test case, loop repeats

### Phase 4: Error Recovery & Fallback

**If Codex times out** (>30s):
1. `.codex/state.json` persists work state
2. On restart: Codex resumes from checkpoint
3. If fails 3+ times: Escalates to GitHub with `#escalation` tag
4. Copilot/Gemini handles escalation

**If Codex offline** (VS Code closed):
1. Copilot sees stalled PR
2. Copilot creates escalation issue
3. Gemini auto-implements on GitHub (fallback flow)
4. Merge proceeds without Codex

---

## Quick Start Commands

### For Copilot
```bash
# Check what's merged
npm run codex:pr-status

# See agent activity
npm run sync-status

# Check coordination status
npm run coordination:status

# Create issue for Codex to work on
gh issue create --title "fix: ..." --body "..." --label "codex-work,priority:high"

# Monitor PR merges
gh pr list --label merged-by-gemini --state closed --limit 10
```

### For Codex (Local Dev)
```bash
# Continuously poll for work
npm run codex:poll

# Or, run once and exit
npm run codex:poll:once

# Check current work status
npm run codex:status

# View recent Codex logs
npm run codex:logs

# Reset if stuck
npm run codex:reset

# Check PR ready for review
npm run codex:pr-status

# Validate locally before push
npm run codex:validate:local
```

### For Gemini (GitHub)
```bash
# View recent review agent runs
gh run list --workflow gemini-pr-review.yml --limit 5

# See logs for specific run
gh run view <run_id> --log

# Manual approval if needed (shouldn't need this)
gh pr review <PR_NUMBER> --approve

# Manual merge if needed (shouldn't need this)
gh pr merge <PR_NUMBER> --squash --auto
```

---

## Configuration

### Codex Config
Edit `.codex/config.yaml` to customize:

```yaml
local:
  timeout_ms: 30000  # Increase if hitting timeout
  max_retries: 3     # Retry count before escalation

github:
  poll_interval_ms: 5000  # Check GitHub every N ms
  
codex:
  error_telemetry: true   # Enable error tracking
  fallback_to_copilot: true  # Fallback if timeout
```

### Gemini Config
Edit `.github/workflows/gemini-pr-review.yml` to customize:

```yaml
# Approval gates (currently: all must pass)
if: harness == 'SUCCESS' && ir_validation == 'SUCCESS' && parity == 'SUCCESS'

# Retry strategy
continue-on-error: true
```

### Context Pack
Update context for agents:
```bash
npm run copilot:context
```

This generates:
- `context_pack_copilot.json`
- `context_pack_codex.json` (dual variant)
- Used by agents for reference

---

## Monitoring & Debugging

### Check Overall Status
```bash
# Summary dashboard
echo "=== LUASCRIPT Coordination Status ==="
gh issue list --label "codex-work" --state open
gh pr list --label "ready-for-review" --state open
gh pr list --label "merged-by-gemini" --state closed --limit 3
```

### Codex Debugging
```bash
# See persistent state
cat .codex/state.json

# See recent telemetry
tail -100 .codex/telemetry.jsonl

# See recent logs
tail -100 .codex/codex.log

# Clear state to retry
npm run codex:reset
```

### Gemini Debugging
```bash
# See recent review runs
gh run list --workflow gemini-pr-review.yml --limit 10

# See full logs
gh run view <run_id> --log

# Check if PR checks passing
gh pr checks <PR_NUMBER>

# Check auto-merge status
gh pr view <PR_NUMBER> --json autoMergeRequest
```

### GitHub Actions Logs
```bash
# Real-time: Watch workflow runs
gh run watch <run_id>

# Download artifacts
gh run download <run_id> --name test-results-*

# See failed steps
gh run view <run_id> --log | grep "ERROR\|FAIL"
```

---

## Troubleshooting

### Problem: Codex not claiming work
**Solution**:
1. Check polling: `npm run codex:logs | grep "polling"`
2. Verify issue exists: `gh issue list --label "codex-work"`
3. Check GitHub token: `gh auth status`
4. Restart polling: `npm run codex:reset && npm run codex:poll`

### Problem: PR not auto-merging after Gemini approval
**Solution**:
1. Check checks passing: `gh pr checks <PR_NUMBER>`
2. Verify auto-merge enabled: `gh pr view <PR_NUMBER> | grep -i auto`
3. Manually enable: `gh pr merge <PR_NUMBER> --squash --auto`
4. Check for merge conflicts: `git merge-base main codex/fix-*`

### Problem: Codex timeout
**Solution**:
1. Check `.codex/state.json` for `last_error`
2. View logs: `npm run codex:logs`
3. Increase timeout: Edit `.codex/config.yaml` → `local.timeout_ms`
4. Reset if stuck: `npm run codex:reset`
5. Escalation: Post GitHub issue with `#escalation` tag

### Problem: Tests failing after fix
**Solution**:
1. Check which test failed: See GitHub PR check results
2. Post comment in GitHub Issue: Include error details
3. Copilot sees comment, creates new work item or investigates
4. Loop continues

---

## Advanced: Manual Interventions

### Manually Claim a Task (if Codex offline)
```bash
# See pending work
gh issue list --label "codex-work" --state open

# Manually implement fix
# ...edit src/...

# Manually push
git checkout -b codex/fix-${issue_number}
git add -A
git commit -m "fix(#${issue_number}): description"
git push origin codex/fix-${issue_number}

# GitHub Actions will take it from here
```

### Manually Approve a PR (if Gemini offline)
```bash
# Review PR
gh pr view <PR_NUMBER>

# Check tests passing
gh pr checks <PR_NUMBER>

# Approve
gh pr review <PR_NUMBER> --approve

# Enable auto-merge
gh pr merge <PR_NUMBER> --squash --auto
```

### Manually Close a Work Item (if stuck)
```bash
# See issue
gh issue view <ISSUE_NUMBER>

# Post comment
gh issue comment <ISSUE_NUMBER> --body "Escalation: manual closure. Reason: ..."

# Close
gh issue close <ISSUE_NUMBER>
```

---

## Success Indicators

✅ **Working correctly when**:
- Copilot creates issue → Codex claims within 5 seconds
- Codex implements → GitHub Actions validates in 2-3 minutes
- GitHub Actions pass → Gemini review posted within 5 minutes
- Gemini approves → PR auto-merges within 1 minute
- **Total time: ~10 minutes per fix**

✅ **No manual interventions**:
- No `git commit` commands typed manually
- No PR approval buttons clicked
- No merge buttons clicked
- Everything driven by automation

✅ **Resilient to failures**:
- Codex crash → Resumes from `.codex/state.json`
- GitHub outage → Retry logic handles it
- Test failure → Escalates gracefully
- Manual fix → Loop continues

---

## Next Steps

1. **Start Codex polling**: `npm run codex:poll`
2. **Create first test case**: Uncomment harness test or add new one
3. **Run harness**: `npm run harness` → see failure
4. **Create GitHub Issue**: `gh issue create --label "codex-work" ...`
5. **Watch Codex work**: Polls GitHub, claims issue, implements fix
6. **Watch GitHub Actions**: Validates fix, creates PR, labels `#ready-for-review`
7. **Watch Gemini approve**: Reviews PR, approves, enables auto-merge
8. **Watch PR merge**: Auto-merged to main
9. **Repeat**: Create next test case

**Result**: Fully automated development workflow with zero manual commits or approvals.

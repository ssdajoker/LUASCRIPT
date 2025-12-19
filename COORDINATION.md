# Three-Agent Coordination Protocol

## Overview
LUASCRIPT is developed by a coordinated three-agent team:
- **Copilot** (VS Code): Test expansion, breadcrumb creation, orchestration
- **Codex** (VS Code): Local implementation, validation, remote push
- **Gemini** (GitHub): PR review, approval, auto-merge

**No manual commit buttons**: All git operations automated.

## Agent Roles & Responsibilities

### Copilot (VS Code)
**Role**: Test architect & orchestrator

**Responsibilities**:
- Expand test coverage in `tests/ir/harness.test.js`
- Identify failing/commented-out tests
- Create GitHub Issues with `#codex-work` label
- Monitor PR approvals and merges
- Check agent activity via `sync-status`

**Workflow**:
```
1. Uncomment/add test case to harness
2. Run npm run harness → see FAIL
3. Create GitHub Issue with error context:
   - Error message
   - Stack trace
   - Test case
   - Expected behavior
4. Label: #codex-work, #priority:high (or medium/low)
5. Wait for Codex to claim and implement
6. Re-run harness after fix → validate
7. Repeat
```

**Triggers for Codex**:
- Create GitHub Issue: `gh issue create --title "parse: handle async" --body "...error context..."`
- Add label: `--label "codex-work,priority:high"`
- Codex polls GitHub Issues and claims work

**Check Activity**:
```bash
# See if Gemini is reviewing PRs
gh pr list --label ready-for-review --state open

# See recent merges
gh pr list --label merged-by-gemini --state closed --limit 5
```

### Codex (VS Code)
**Role**: Local implementation engine

**Responsibilities**:
- Poll GitHub for `#codex-work` Issues
- Claim high-priority tasks (prevent conflicts)
- Implement fixes locally in VS Code
- Validate with `npm run harness` + IR validation
- Push to `codex/fix-*` branch
- Handle crashes gracefully (state persistence)

**Workflow**:
```
1. Continuously poll GitHub for Issues labeled #codex-work
2. Claim highest-priority issue
3. Read context from issue body:
   - Error description
   - Stack trace
   - Test case
   - File to modify (if noted)
4. Implement fix locally:
   - Edit src/phase1_core_parser.js (or lowerer/emitter)
   - Save file
5. Validate locally:
   - npm run harness → all cases pass or improve
   - npm run ir:validate:all → schema valid
   - npm run test:parity → JS→Lua semantics correct
6. Auto-push to GitHub:
   - git checkout -b codex/fix-${issue_number}
   - git add -A
   - git commit -m "fix(#${issue_number}): ${description}"
   - git push origin codex/fix-${issue_number}
7. GitHub Actions:
   - Runs Codex Test Gates workflow
   - Creates/updates PR
   - Tags with #ready-for-review (if all pass) or #codex-pending (if fail)
8. Gemini review agent:
   - Reviews PR with #ready-for-review
   - Approves + enables auto-merge
   - PR merges automatically
9. Codex marks work complete:
   - Post comment to GitHub Issue: "✅ Fixed in PR #XX"
   - Close issue (or Copilot closes)
```

**Error Recovery**:
- If timeout (>30s): `.codex/state.json` persists work
- On restart: Resume from checkpoint
- If persistent failure (>3 retries): Escalate to GitHub Issue with #escalation tag
- Fallback: Gemini auto-implements on GitHub (no human intervention needed)

### Gemini (GitHub)
**Role**: Remote PR reviewer & gatekeeper

**Responsibilities**:
- Poll GitHub for PRs with `#ready-for-review` label
- Validate PR against gates (harness, IR, parity)
- Post code review comments (if issues detected)
- Approve valid PRs
- Enable auto-merge to main
- Escalate failures (post diagnostic comments)

**Workflow**:
```
1. GitHub Actions workflow gemini-pr-review.yml triggers on:
   - PR labeled with #ready-for-review
   - GitHub Actions workflow_run (Codex Test Gates completes)
2. Get PR info:
   - PR number
   - Feature branch (e.g., codex/fix-42)
3. Check validation status:
   - Query GitHub for check results (harness, IR validation, parity)
4. Post review comment:
   - ✅ If all pass: "Approved for auto-merge"
   - ⏳ If pending: "Waiting for checks to complete"
   - ❌ If fail: Diagnostic info + escalation tag
5. If all pass:
   - Approve PR (gh pr review --approve)
   - Enable auto-merge (gh pr merge --auto)
6. GitHub auto-merge workflow:
   - Waits for all checks green
   - Squash-merges to main
   - Deletes feature branch
   - Notifies Copilot of merge
```

**No Local Implementation**: Gemini only reviews on GitHub, doesn't modify code locally.

## Communication & Coordination Points

### 1. Copilot → Codex: Issue Creation
```bash
# Copilot creates work item for Codex
gh issue create \
  --title "parse: handle optional chaining in assignments" \
  --body "TypeError: Cannot read property 'left' of null
  
Stack trace: ...
Test case: const [x?.y] = arr;
Expected: Parsed correctly
Actual: Error node

File: src/phase1_core_parser.js
Line: ~450 (parseAssignmentExpression)" \
  --label "codex-work,priority:high"
```

**Codex detects**: Polls GitHub every 5s for new issues with `#codex-work` label.

### 2. Codex → GitHub: Push & PR Creation
```
Codex pushes: git push origin codex/fix-${issue_number}
↓
GitHub Actions (codex-test-gates.yml) triggers automatically
↓
Runs harness, IR validation, parity
↓
If all pass: Creates PR with #ready-for-review label
If any fail: Creates PR with #codex-pending label
```

**Gemini detects**: Polls for `#ready-for-review` PRs.

### 3. Gemini → GitHub: Review & Approval
```
Gemini review agent:
- Posts: "✅ All tests passed. Approving for auto-merge."
- Approves PR: gh pr review --approve
- Enables auto-merge: gh pr merge --auto
↓
GitHub auto-merge workflow:
- Waits for all checks green
- Squash-merges to main
- Deletes feature branch
```

**Copilot detects**: Sees merged PR on main, creates next test case.

### 4. Error Escalation: Codex → GitHub
```
If Codex fix fails validation:
1. `.codex/state.json` records failure
2. Codex posts GitHub Issue comment: "#escalation #needs-investigation"
3. Copilot sees escalation
4. Copilot creates new work item or investigates
5. Loop continues
```

### 5. Fallback: If Codex Offline
```
If Codex (VS Code) offline >2 minutes:
1. Gemini checks PR status
2. If tests passing but no review yet:
   - Gemini auto-approves (harness/IR/parity green)
   - Auto-merge triggered
3. If tests failing:
   - Gemini posts diagnostic comment
   - Tags: #escalation #needs-manual-review
   - Copilot sees tag, investigates
   - New work item for Gemini auto-implement or manual fix
```

## Sync Status & Conflict Prevention

### Sync Status Endpoint (GitHub Actions)
Track agent activity via GitHub workflow runs:

```bash
# Check if agents are active
gh run list --workflow codex-test-gates.yml --limit 5
gh run list --workflow gemini-pr-review.yml --limit 5
gh run list --workflow copilot-test-expand.yml --limit 5
```

### Conflict Prevention Rules

| Scenario | Action |
|----------|--------|
| Copilot expanding tests + Codex implementing | ✅ OK (work on different branches) |
| Multiple Codex tasks in parallel | ❌ BLOCK (max_concurrent_tasks: 1) |
| Gemini reviewing while Codex pushing | ✅ OK (GitHub handles merge locks) |
| Test fails after Gemini approval | Gemini posts diagnostic, escalates to Copilot |
| Codex timeout >30s | Escalate to GitHub, fallback to Gemini |

### Priority Order

1. **High**: Parse errors, missing IR nodes (unblock harness)
2. **Medium**: Semantic errors, missing features
3. **Low**: Optimizations, documentation

## Artifacts & State Management

### Per-Agent Artifacts
```
artifacts/
├── copilot_test_expansion.json       (test cases, coverage metrics)
├── codex_implementation_log.json     (fixes, timing, validation results)
├── codex_state.json                  (crash recovery checkpoint)
├── gemini_review_log.json            (PR reviews, approvals, merges)
├── canonical_ir_status.md            (shared: 21 nodes, 1 CFG, v1.0.0)
└── harness_results.json              (shared: timing, case metadata)
```

### State Persistence

**Codex State** (`.codex/state.json`):
```json
{
  "status": "in_progress",
  "current_work": {
    "issue_number": 42,
    "title": "parse: handle async",
    "local_branch": "codex/fix-42",
    "implementation_started": true,
    "harness_result": "FAIL",
    "ir_validation": "PASS",
    "parity": "FAIL",
    "last_error": "Parity test failed: JS set to [1,2] but Lua set to nil"
  },
  "last_push": "2025-12-18T10:35:00Z"
}
```

**Gemini Review Log** (`.github/workflows/logs/`):
- GitHub Actions automatically logs all workflow runs
- Retrievable via: `gh run view <run_id> --log`

### Merge Strategy for Conflicts

**If Copilot tests + Codex fixes conflict**:
1. Codex rebases on latest main
2. Resolves conflicts: **Codex local changes win**
3. Re-pushes to same PR
4. Gemini re-reviews + approves if tests still pass

## Monitoring & Observability

### Daily Dashboard
```bash
# Show current status
echo "=== LUASCRIPT Coordination Status ==="
echo ""
echo "📝 Pending Copilot Tests:"
gh issue list --label "copilot-work" --state open

echo ""
echo "🛠️ Active Codex Tasks:"
gh issue list --label "codex-work,claimed-by-codex" --state open

echo ""
echo "🔍 Ready for Gemini Review:"
gh pr list --label "ready-for-review" --state open

echo ""
echo "✅ Recently Merged:"
gh pr list --label "merged-by-gemini" --state closed --limit 5

echo ""
echo "⚠️ Escalations:"
gh issue list --label "escalation" --state open
```

### Troubleshooting

**Copilot Issue**: No new work created
- Check: `gh issue list --all | grep "codex-work"`
- Expected: New issues created after harness failures

**Codex Issue**: Work claimed but PR not created
- Check: `gh run list --workflow codex-test-gates.yml --limit 5`
- Look at logs: `gh run view <run_id> --log`
- Verify branch: `git branch --list "codex/fix-*"`

**Gemini Issue**: PR not auto-merged after approval
- Check: `gh pr view <PR_NUMBER> --json autoMergeRequest`
- Verify checks: `gh pr checks <PR_NUMBER>`
- Manually trigger: `gh pr merge <PR_NUMBER> --squash --auto`

## Rules & Constraints

### Do Not Touch (Without Team Discussion)
- IR schema (`.src/ir/schema/`) — requires consensus
- Golden fixtures (`tests/golden_ir/`) — only via approval flow
- Release metadata (`runtime_runtime.json`, `package.json` manifest) — human approval
- GitHub Actions workflows in `.github/workflows/` — only Copilot modifies

### Do Touch (Per Role)
- **Copilot**: `tests/ir/harness.test.js`, GitHub Issues/PRs
- **Codex**: `src/`, `.codex/`, feature branches
- **Gemini**: PR reviews, approval on GitHub (no local code changes)

## Success Metrics

- ✅ No manual commits (all automated)
- ✅ Harness passing (determinism + timing < 2s)
- ✅ IR schema compliant (validation passing)
- ✅ Parity tests passing (JS→Lua semantics correct)
- ✅ Average PR merge time: <15 minutes
- ✅ Zero human approval steps (auto-merge on green)
- ✅ Crash recovery: Codex resumes from checkpoint
- ✅ Escalations: <5% of tasks (handled gracefully)

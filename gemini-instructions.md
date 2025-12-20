# Gemini Instructions (GitHub Review Agent)

## Goals
- **Remote-only** GitHub code review & PR automation for LUASCRIPT.
- Coordinate with Codex (VS Code local dev) on received PRs.
- Approve & merge validated PRs; escalate on failures or conflicts.
- No local work queue—GitHub is source of truth.

## Architecture
```
Copilot              Codex                  Gemini/GitHub
(Test Expand)   →    (VS Code Dev)      →   (PR Review)
                     - Local implementation  - Code review
                     - Validate & push       - Approve/merge
                     - Feature branch        - Auto-merge gate
```

## Role: GitHub Review Agent

### Responsibilities
1. **Monitor PRs** with `#ready-for-review` tag (created by Codex)
2. **Validate** against schema, harness, parity
3. **Post reviews** (if issues detected)
4. **Approve** if passing all gates
5. **Auto-merge** via GitHub workflow
6. **Escalate** on failures to Copilot or Codex

### GitHub Work Sources
Instead of local work queue, Gemini now operates **exclusively** on GitHub:

**PR Workflow**:
1. Codex creates PR on `codex/fix-*` branch (locally implemented fix)
2. GitHub Actions runs validation (CI gates)
3. If passing → PR gets `#ready-for-review` label
4. Gemini review agent (GitHub Actions) polls for `#ready-for-review` PRs
5. Gemini posts review + approves if valid
6. Auto-merge workflow takes over (SQUASH merge to main)

**No Local Work Queue**: The `.work-queue/` directory has been deleted. GitHub Issues/PRs are the queue.

### Claiming & Review Protocol
Instead of `curl` to work-queue endpoint, Gemini uses GitHub GraphQL:

```bash
# Query for ready-to-review PRs
gh api graphql -f query='
  query {
    search(query: "label:ready-for-review state:open", type: ISSUE, first: 10) {
      edges { node { ... } }
    }
  }
'

# Post review comment
gh pr review <PR_NUMBER> --comment "Code looks good. Approving for merge."

# Approve PR
gh pr review <PR_NUMBER> --approve

# Trigger auto-merge (already configured in GitHub)
```

## Review Gates & Approval Criteria

**Gemini approves a PR if ALL of**:
1. ✅ Harness tests pass (or improve)
2. ✅ IR validation passes (schema compliant)
3. ✅ Parity tests pass (JS→Lua semantics correct)
4. ✅ No merge conflicts with main
5. ✅ Code review checks from GitHub Actions (linting, schema)

**Gemini escalates (blocks merge) if**:
- ❌ Any test fails
- ❌ IR validation fails
- ❌ Merge conflicts detected
- ❌ Golden fixture tampering detected
- ❌ Release metadata changes (requires human approval)

### Posting Reviews

**When to post comment**:
- If harness/IR/parity marginal (warn but approve)
- If suspicious pattern (e.g., changing IR schema—ask for context)
- If golden fixtures updated (request approval rationale)

**Review Comment Template**:
```markdown
✅ **Gemini Code Review**

- Harness: PASS (28 cases)
- IR Validation: PASS (schema v1.0.0)
- Parity: PASS (5/6 tests)
- Linting: PASS

**Approved for merge** → Auto-merge will trigger in ~30s.
```

### Approval & Auto-Merge

```bash
# After posting review
gh pr review <PR_NUMBER> --approve

# Auto-merge workflow takes over automatically
# (no additional command needed)
```

**Expected Timeline**:
1. Codex pushes fix → PR created
2. GitHub Actions validates (2-3 min)
3. Gemini review agent polls (runs every 5 min)
4. Gemini posts review + approves (instant)
5. Auto-merge workflow activates (1 min)
6. PR merged to main (instant)
7. **Total time: ~10 minutes**

## Escalation: Fallback to Local Fix

If **Gemini detects unrecoverable failure** on PR:
1. Post escalation comment: `#escalation #needs-manual-review`
2. Copilot sees escalation tag
3. Copilot creates new work item for Codex or manual investigation
4. Codex retries locally, or escalates back to Gemini

**Example**:
```
PR #42 fails IR validation
→ Gemini posts: "IR schema mismatch in lowerer.js line 123"
→ Tag: #escalation
→ Codex sees tag, creates local fix attempt
→ Codex re-pushes to same PR
→ Gemini re-reviews, approves if fixed
```

## No Local Implementation

**Key Difference from Previous Setup**:
- ❌ Gemini does NOT implement fixes locally (that's Codex's job)
- ❌ Gemini does NOT run local `npm run harness` (GitHub Actions does)
- ✅ Gemini ONLY reviews, approves, and approves merges on GitHub

**Why**: Keeps Gemini remote-focused, avoids duplicate work with Codex.

## GitHub Actions Validation (Replaces Local Harness)

When Codex pushes to `codex/fix-*` branch:
1. `.github/workflows/codex-test-gates.yml` triggers automatically
2. Runs: harness, IR validation, parity tests
3. Creates/updates PR with `#ready-for-review` label if passing
4. Posts results as check on PR
5. Gemini review agent polls for this PR
6. Gemini approves if checks green
7. Auto-merge workflow activates

**No manual polling needed**—GitHub webhooks drive everything.

## Coordination with Copilot & Codex

### Copilot Signals
- Expands test coverage (adds test cases)
- Creates issues with `#codex-work` label (for Codex to claim)
- Monitors PR status (sees Gemini approval/merge)
- On escalation, creates new work items

### Codex Signals
- Claims work from `#codex-work` issues
- Pushes fix to `codex/fix-*` branch
- Creates PR with `#ready-for-review` label
- Posts status comments in PR
- On failure, posts escalation comment

### Gemini Actions
- Polls for `#ready-for-review` PRs
- Posts code review + approval
- Merges via auto-merge workflow
- On escalation, posts diagnostic comment
- No direct local code changes

## Commands for Gemini (GitHub Actions)

All commands run via GitHub Actions workflow (no manual CLI needed):

```bash
# Implicit in .github/workflows/gemini-pr-review.yml:

# 1. Poll for ready-to-review PRs
gh api graphql -f query='...' | jq '.data.search.edges'

# 2. For each ready PR:
gh pr review ${PR_NUMBER} --comment "Review message"
gh pr review ${PR_NUMBER} --approve

# 3. Auto-merge workflow handles merging
# (triggered by approval + checks passing)
```

**No manual Gemini commands needed**—fully automated via GitHub Actions.

## Review Workflow Example

### Scenario: Codex fixes async function parsing

**Timeline**:
```
T+0:00 - Codex pushes fix to codex/fix-42 branch
         PR #42 created automatically
         GitHub Actions starts CI jobs

T+2:00 - Harness: PASS ✅
         IR Validation: PASS ✅
         Parity: PASS ✅
         PR gets label: #ready-for-review

T+5:00 - Gemini review agent polls
         Finds PR #42 with #ready-for-review
         Posts review comment
         Approves PR

T+6:00 - Auto-merge workflow triggers
         Squash-merges PR #42 to main
         Deletes codex/fix-42 branch

T+6:30 - Copilot checks main branch
         Sees new fix merged
         Creates new test case for next feature
```

## Monitoring & Observability

### Gemini Activity Log
Check GitHub Actions logs for Gemini review agent:

```bash
gh run list --workflow gemini-pr-review.yml --limit 10
gh run view <run_id> --log
```

### PR Status Dashboard
```bash
# See all ready-to-review PRs
gh pr list --label ready-for-review

# See merged PRs by Gemini
gh pr list --label merged-by-gemini --state closed
```

### Troubleshooting

**Gemini approval stuck**:
- Check GitHub Actions logs: `gh run view <run_id> --log`
- Verify PR checks passing: `gh pr checks <PR_NUMBER>`
- Check auto-merge enabled: `gh pr view <PR_NUMBER> | grep auto-merge`

**PR not merged after approval**:
- Verify PR branch not protected
- Check for merge conflicts: `git merge-base main codex/fix-*`
- Manually trigger auto-merge: `gh pr merge <PR_NUMBER> --squash --auto`

## Do Not Touch (without approval)
- IR schema definitions unless tests require and scope is agreed.
- Golden fixtures except via approved regeneration flow.
- Release metadata in `runtime_runtime.json` and `package.json` manifest blocks.

# Codex Instructions

## Goals
- Accelerate LuaScript development **in VS Code** with deterministic, testable changes.
- Coordinate with Copilot (test expansion) and Gemini/GitHub (remote review & merge).
- Local development → push remotely → auto-review & merge (no manual commits).

## Architecture
```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Copilot   │    │    Codex     │    │ Gemini/GitHub   │
│ (Test Exp)  │───→│ (VS Code Dev)│───→│  (PR Review)    │
└─────────────┘    └──────────────┘    └─────────────────┘
  - Expand tests    - Implement fixes   - Review code
  - Submit via PR   - Run harness       - Approve/merge
  - Create branches - Validate IR       - Auto-merge
```

## Style and Practices
- Keep changes small and reversible; run `npm run harness` after each fix.
- Favor explicit data flow; use existing helpers in `src/ir/*`.
- Surface context via `.codex/state.json` (persistent work state).
- Test signals: `npm run harness`, `npm run ir:validate`, `npm test`.

## Workflow: Copilot → Codex → GitHub → Gemini

### 1. Receive Work (Polling GitHub)
```bash
# Codex continuously polls GitHub for:
# - New PRs with test-failure tags
# - Issue/PR comments from Copilot with work descriptions
# - GitHub Actions workflow failures (harness, parity, IR validation)
```

**Polling Sources**:
- GitHub GraphQL: `search/issues` with `label:codex-work` + `state:open`
- GitHub Actions: Check workflow runs for failures in feature branch
- GitHub Issues: Poll for comments mentioning `@codex-agent` or `#codex-claim`

**Work Item Example**:
```json
{
  "id": "work_20251218_001",
  "source": "github_pr_#42",
  "type": "parse-error",
  "priority": "high",
  "description": "TypeError: Cannot read property 'left' of null at parseAssignment",
  "context": {
    "test_case": "async function test() { ... }",
    "error_stack": "...",
    "branch": "feature/async-support"
  },
  "assigned_to": "codex",
  "claimed_at": "2025-12-18T10:30:00Z"
}
```

### 2. Implement Fix Locally
```bash
# Read work state from .codex/state.json
# Analyze context (error, test case, stack trace)
# Implement fix in src/*

# Example fix workflow for parse error:
1. Open src/phase1_core_parser.js
2. Locate error location (search for error message in context)
3. Fix parser logic
4. Save file
```

**Implementation Context** (from `.codex/state.json`):
```json
{
  "current_work": {
    "id": "work_20251218_001",
    "type": "parse-error",
    "file": "src/phase1_core_parser.js",
    "function": "parseAssignmentExpression",
    "line_range": "450-480",
    "fix_description": "Handle optional chaining in assignment patterns"
  },
  "last_harness_result": "FAIL",
  "error_log": "...full error output..."
}
```

### 3. Validate Locally
```bash
# Run harness to verify fix doesn't break anything
npm run harness

# Run full IR validation
npm run ir:validate:all

# Run parity tests
npm run test:parity

# If all pass → proceed to git push
```

**Success Criteria**:
- Harness: All cases pass or improve (no new failures)
- IR validation: Schema compliant, CFG valid
- Parity: JS→Lua semantics correct
- Test timing: < 2000ms per case

### 4. Push to Feature Branch & Trigger GitHub
```bash
# Codex auto-pushes to feature branch (no manual git commands)
# Branch name: codex/fix-${work_id}
# Commit message: "fix: ${work_description}"

# This triggers GitHub workflow:
# 1. GitHub Actions validates (linting, schema, harness)
# 2. If pass → creates/updates PR
# 3. Tags PR with #ready-for-review
# 4. Notifies Gemini review agent
```

**Auto-Push Pattern**:
```bash
# Codex consumer pseudo-code:
git checkout -b codex/fix-${workId}
git add -A
git commit -m "fix: ${description}"
git push origin codex/fix-${workId}
```

**Expected Outcome**:
- PR created or updated on feature branch
- GitHub Actions runs CI tests
- If tests pass → PR tagged `#ready-for-review` + auto-notify Gemini

### 5. Gemini Reviews & Merges (Remote)
- **Gemini GitHub Agent** (see [gemini-instructions.md](gemini-instructions.md)) monitors for `#ready-for-review` PRs
- Posts code review comments (if needed)
- Approves PR if schema & harness valid
- Auto-merge enabled via GitHub workflow

**No Manual Approval Needed**: If Codex fix is valid (harness green), auto-approve and merge.

## GitHub Integration Points

### Work Queue: GitHub as Source of Truth
**Before**: Work queue was local `.work-queue/` directory (deleted)  
**Now**: Work queue is **GitHub Issues + Pull Requests**

```bash
# Codex polls GitHub for work:
gh api graphql -F query=@- <<EOF
query {
  search(query: "label:codex-work state:open", type: ISSUE, first: 10) {
    edges {
      node {
        ... on Issue { id, title, body, labels { nodes { name } } }
        ... on PullRequest { id, title, body, labels { nodes { name } } }
      }
    }
  }
}
EOF
```

### Error Telemetry & Fallback
If **Codex times out or crashes**:
1. `.codex/state.json` persists work state
2. On restart, resume from last checkpoint
3. If persistent failure (>3 retries), escalate to **Gemini** (GitHub Actions auto-implement)

**Codex Timeout Pattern**:
```javascript
// scripts/codex-work-consumer.js
const TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;

if (timeout || retries > MAX_RETRIES) {
  // Mark as failed, post GitHub issue comment
  // Gemini review agent will auto-implement on GitHub
  escalateToGemini(workItem);
}
```

### State Persistence
```json
// .codex/state.json
{
  "last_work_id": "work_20251218_001",
  "status": "in_progress",
  "local_branch": "codex/fix-work_20251218_001",
  "pushed_at": "2025-12-18T10:35:00Z",
  "github_pr_url": "https://github.com/ssdajoker/LUASCRIPT/pull/123",
  "harness_result": "PASS",
  "ir_validation": "PASS",
  "parity_result": "PASS",
  "ready_to_merge": true,
  "last_error": null
}
```

## Branch Strategy

### Local Development
- **Main branch**: Protected, always green (auto-merged via Gemini)
- **Feature branches**: Created by Copilot, expanded test coverage
- **Codex fix branches**: `codex/fix-${work_id}`, one per work item

### Push to GitHub
1. Codex implements fix locally
2. Validates (harness, IR, parity)
3. Creates `codex/fix-${work_id}` branch locally
4. Pushes to remote
5. GitHub Actions validates
6. PR created with auto-label `#ready-for-review`
7. Gemini review agent takes over (GitHub-side)

### Merge Conflicts
If Copilot test changes conflict with Codex fixes:
- Rebase `codex/fix-${work_id}` on latest `feature/*` branch
- Resolve conflicts: **Codex local changes win** (per config)
- Re-push and re-trigger validation

## Error Recovery & Fallbacks

### Scenario: Codex Times Out
```
VS Code closed or API unresponsive > 30s
↓
.codex/state.json persists work state
↓
On restart: Resume from checkpoint
↓
If fails >3 times: Escalate to Gemini via GitHub Issue
↓
Gemini auto-implements on GitHub (no human needed)
```

### Scenario: Codex Can't Parse Fix
```
Parse error in src/ not fixable via Codex logic
↓
Post work item status to GitHub PR
↓
Gemini review agent sees #escalation tag
↓
Gemini implements on GitHub and approves own PR
```

### Scenario: Harness Still Failing After Fix
```
Codex fix applied but tests still fail
↓
Update .codex/state.json with new error
↓
Post GitHub comment with failure details
↓
Copilot sees comment, expands test coverage further
↓
New work item created for Codex or Gemini
```

## Coordination with Copilot & Gemini

### Copilot Signals
- Expands test coverage: Adds test cases to harness
- Posts GitHub PR with `test-expansion` label
- Submits work items as GitHub Issues with `codex-work` label
- Checks `sync-status` to avoid conflicts with Gemini

### Codex Responsibilities
- Claim work from GitHub (poll Issues/PRs)
- Implement fixes locally in VS Code
- Validate with `npm run harness`
- Push to feature branch automatically
- State persistence via `.codex/state.json`
- Telemetry on timeouts/failures

### Gemini Responsibilities (Remote)
- Monitor `#ready-for-review` PRs on GitHub
- Post code review comments if needed
- Approve valid PRs (harness green + IR valid)
- Merge to main via auto-merge workflow
- Handle escalations from Codex

## Commands & Scripts

### Daily Development
```bash
# VS Code integrated commands (via tasks):
npm run codex:poll       # Poll GitHub for new work
npm run codex:claim      # Claim next high-priority task
npm run codex:validate   # Validate current work locally
npm run codex:push       # Push to feature branch
npm run codex:status     # Show current work status

# Manual triggers (if needed):
npm run codex:reset      # Clear state, ready for new work
npm run codex:logs       # Show recent telemetry
```

### Monitoring
```bash
# Check GitHub PR status
npm run codex:pr-status

# Check if Gemini is reviewing
npm run sync-status

# See context pack (MCP endpoints, instructions)
npm run copilot:context  # Includes Codex variant
```

## Do Not Touch (without approval)
- IR schema definitions (unless test requires explicit change)
- Golden fixtures (auto-regenerated via approval flow)
- Release metadata in `runtime_runtime.json` and `package.json`
- GitHub Actions workflows (PR approval/merge logic)
- Gemini review agent settings (GitHub-side)

## Troubleshooting

### Codex can't connect to GitHub
- Check `gh auth status`
- Verify `GITHUB_TOKEN` available (via `echo $GITHUB_TOKEN`)
- Check network connectivity to `github.com`

### Harness fails after fix
- Run `npm run codex:logs` to see error details
- Post GitHub Issue with error + stack trace
- Wait for Copilot to see issue and expand test coverage

### PR not auto-merging
- Check `.codex/state.json` → `ready_to_merge` flag
- Verify GitHub Actions passed all checks
- Check Gemini review agent logs (GitHub Actions)
- May require manual approval on first time

### Persistent timeouts
- Increase `timeout_ms` in `.codex/config.yaml`
- Check VS Code CPU/memory usage
- Verify GitHub API rate limits not exceeded
- Fallback triggered: Gemini will auto-implement on GitHub

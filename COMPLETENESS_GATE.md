# Documentation & Test Completeness Gates

**Status**: ✅ ACTIVE  
**Enforcement Level**: Required for all PRs to `main` and `develop`  
**Configured**: `.github/workflows/pr-completeness-gate.yml`  
**Bot Logic**: `scripts/pr-completeness-bot.js`

## Overview

The **Completeness Gate** ensures that code changes are accompanied by appropriate documentation and test updates, maintaining consistency between implementation and documentation across the project.

This system:
- ✅ Flags missing documentation when code changes detected
- ✅ Flags missing tests when feature/fix code changes detected  
- ✅ Enforces status file consistency (single source of truth: `PROJECT_STATUS.md`)
- ✅ Suggests relevant wiki/timeline links for context
- ✅ Posts automated PR comments with specific guidance
- ✅ Prevents merge of incomplete PRs (can be blocking or advisory)

## How It Works

### 1. Detection Phase
When a PR is opened or updated, the bot:
- Extracts list of changed files from GitHub API
- Categorizes files by type (source code, tests, docs, status)
- Matches against completeness rules

### 2. Analysis Phase
For each PR, the bot checks:

#### Documentation Requirements
Files requiring doc updates (matching these patterns):
- `src/transpiler/*` → Update transpiler docs
- `src/ir/*` → Update IR spec or schema docs
- `src/backends/*` → Update backend docs
- `package.json` → Update project configuration docs
- `README.md`, `CONTRIBUTING.md` → High-level docs

**Rule**: If any of these files are modified, `docs/*.md` changes are expected
- ❌ Violation: Code changed, no docs changed → **FAIL** (can be waived by label)
- ⚠️ Warning: Code changed, minimal docs → **WARN** (info level)
- ✅ Pass: Code + docs updated together → **PASS**

#### Test Requirements  
Files requiring test updates:
- `src/transpiler/**/*.js` → Tests in `test/transpiler/`
- `src/ir/**/*.js` → Tests in `test/ir/`
- `src/backends/**/*.js` → Tests in `test/backends/`
- `scripts/*.js` → Tests or documentation

**Rule**: If source files modified, test updates expected
- ⚠️ Warning: Source changed, no tests → **WARN** (not blocking)
- ✅ Pass: Tests included/updated → **PASS**
- ℹ️ Info: Test info in PR body → **PASS**

#### Status Consistency
Files that trigger status update requirements:
- `package.json` → Must update `PROJECT_STATUS.md`, `DEVELOPMENT_WORKFLOW.md`
- `.github/workflows/*` → Must update `PROJECT_STATUS.md`, `docs/ci-cd/`
- `src/transpiler/*` → Should reference `ENHANCED_TRANSPILER_README.md`, `PROJECT_STATUS.md`

**Rule**: Status docs remain synchronized with code/process changes
- ⚠️ Warning: Multiple status files changed → Verify consistency
- ✅ Pass: Status docs reference PROJECT_STATUS.md as source of truth

### 3. Suggestion Phase
The bot suggests relevant wiki/timeline links based on PR scope:

| PR Type | Suggested Links |
|---------|-----------------|
| Major refactoring (10+ files) | timeline, architecture |
| Code structure changes | architecture, quick-start |
| Test modifications | testing guide |
| CI/workflow changes | CI/CD guide |
| Any PR | Project Status & Health |

Example suggestion in PR comment:
```
📚 Wiki References (for context):
- [Project Timeline](docs/timeline/README.md): Major changes should be contextualized
- [Architecture Guide](docs/architecture/README.md): Code structure decisions
- [Project Status & Health](docs/status/PROJECT_HEALTH.md): Current baseline
```

### 4. Feedback Phase
Bot posts automated PR comment with:
- ✅ Pass/Fail status
- 🔴 Required actions (violations)
- 🟡 Recommendations (warnings)
- 💡 Tips & resources (suggestions)

**Example PR Comment**:
```markdown
## 📋 Completeness Check

⚠️ **Completeness checks require attention:**

### 🔴 Required Actions

**📝 Missing Documentation**: Code changes detected but no documentation updates found.

Modified source files: src/transpiler/index.js, src/ir/builder.js

**Action Required**: Update relevant docs:
- PROJECT_STATUS.md (if status affected)
- Component README (if logic/API changed)  
- DEVELOPMENT_WORKFLOW.md (if process changed)

### 💡 Tips & Resources

✅ **Passing**: Test updates included with code changes.

📚 Wiki References (for context):
- [Architecture Guide](docs/architecture/README.md): Code structure decisions
- [Project Status & Health](docs/status/PROJECT_HEALTH.md): Current project health
```

## Completeness Rules Reference

### Code Files → Documentation Updates Required

```javascript
// These code pattern changes REQUIRE doc updates:
- src/transpiler/    → Transpiler core logic changes
- src/ir/            → IR pipeline/schema changes
- src/backends/      → Backend implementation changes
- package.json       → Project config/entry points
- README.md          → Primary documentation
```

### Code Files → Test Updates Recommended

```javascript
// These code changes should have test coverage:
- src/transpiler/*.js  → Add/update tests
- src/ir/*.js          → Add/update tests
- src/backends/*.js    → Add/update tests
- scripts/*.js         → Add/update or document
```

### Status Consistency Rules

```javascript
// These triggers require status file updates:
package.json        → Update PROJECT_STATUS.md + DEVELOPMENT_WORKFLOW.md
.github/workflows/* → Update PROJECT_STATUS.md + docs/ci-cd/
src/transpiler/*    → Update ENHANCED_TRANSPILER_README.md + PROJECT_STATUS.md
```

## Integration with Branch Protection

### Recommended GitHub Branch Protection Settings

For `main` and `develop` branches:

```yaml
Required Status Checks:
  ✅ completeness-check / Completeness & Status Check
  ✅ tests / lint
  ✅ tests / unit-tests
  ✅ perf-slo-gate / Performance SLO Check (if merged with perf gates)

Require:
  - ✅ At least 1 approval
  - ✅ Dismiss stale pull request approvals when new commits pushed
  - ✅ Require code owner review (if CODEOWNERS configured)
  - ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
```

### Enforcement Levels

**Option A: Strict (Blocking)**
- Violations prevent merge
- Warnings require review/waiver
- Suggestions are informational

```yaml
# In branch protection: "Require status checks to pass"
- completeness-check must have status: success
```

**Option B: Soft (Advisory)**
- All issues are informational
- Bot posts comment but doesn't block
- Manual review required for merge

```yaml
# In branch protection: "Allow stale status checks"
- completeness-check can have status: failure
```

**Recommendation**: Start with **Option B** (advisory), transition to **Option A** (strict) after 2 weeks of team feedback.

## Waiver/Override Labels

For special cases, PR author can add labels to waive checks:

| Label | Effect | Requires |
|-------|--------|----------|
| `skip-docs-check` | Waive documentation requirement | Code owner approval |
| `skip-tests-check` | Waive test requirement | Code owner approval + explanation |
| `docs-tbd` | Documentation deferred (with issue ref) | Link to follow-up issue |
| `refactor-no-tests` | Refactoring with no new tests | Code owner sign-off |

**Usage in PR**:
```markdown
## Description
Refactored transpiler for performance (no functionality changes).

## Labels
- `refactor-no-tests` (existing tests still pass)
- Requires code owner approval
```

## Best Practices

### 1. Include Docs from the Start
Update documentation **in the same commit** as code changes:
```bash
git add src/transpiler/index.js
git add docs/transpiler/README.md
git add test/transpiler/index.test.js
git commit -m "feat: add pattern support to transpiler

- Implement array/object destructuring patterns
- Add 14 comprehensive tests
- Update transpiler README with examples
- Update PROJECT_STATUS.md with feature status"
```

### 2. Reference Project Status
In PR description, reference the canonical status:
```markdown
## Changes
- Implemented feature X
- See PROJECT_STATUS.md for overall project health
- Docs: docs/architecture/README.md
```

### 3. Update Status Proactively
When `package.json` or workflows change:
```bash
# Always update:
PROJECT_STATUS.md          (main reference)
DEVELOPMENT_WORKFLOW.md    (process changes)
docs/ci-cd/README.md       (CI/workflow docs)
docs/status/PROJECT_HEALTH.md (health snapshot)
```

### 4. Test Coverage Requirements
- New code: ≥70% coverage on PR
- Existing code: maintain baseline (≥23.6% lines, ≥19% functions, ≥37% branches)
- Performance-critical: add benchmark tests

### 5. Link to Timeline/Context
For major changes, add context:
```markdown
## Context
- See [docs/timeline/README.md](docs/timeline/README.md) for Phase history
- Relates to [Architecture decisions](docs/architecture/README.md)
- Baseline: [Project Status](docs/status/PROJECT_HEALTH.md)
```

## Troubleshooting

### "Missing Documentation" Violation
**Problem**: Bot flags missing docs when you've updated docs

**Solutions**:
1. Verify doc files are included in PR (check GitHub PR files tab)
2. Check filename pattern - must end with `.md`
3. Ensure doc is in repo root or `docs/` folder
4. Try re-pushing to refresh bot analysis

### "No Test Updates" Warning
**Problem**: Tests aren't being recognized

**Solutions**:
1. Test files must be in `test/` or `tests/` folder
2. Add test instructions to PR body (e.g., "npm test passes locally")
3. If no new tests needed, explain in PR description
4. Use `skip-tests-check` label if code review agrees

### "Status File Consistency" Warning
**Problem**: Bot warns about status file updates

**Solutions**:
1. Update `PROJECT_STATUS.md` as primary reference
2. Update secondary files (workflow docs, component READMEs)
3. Ensure all status claims are consistent
4. Reference `PROJECT_STATUS.md` in PR body

### Bot Comment Not Posting
**Problem**: PR comment not appearing

**Solutions**:
1. Check GitHub Actions tab for workflow errors
2. Verify `GITHUB_TOKEN` has permissions
3. Check branch protection settings
4. Try adding a comment to re-trigger

## Monitoring & Metrics

### Track Completeness Issues
```bash
# Get recent PRs with completeness violations
gh pr list --search "is:merged label:completeness-violation" --json number,title,mergedAt

# Check average completeness score
curl -s https://api.github.com/repos/{owner}/{repo}/actions/workflows \
  | jq '.workflows[] | select(.name=="PR Completeness Gate")'
```

### Sample Dashboard Query
Track completeness gate pass rate:
```sql
SELECT 
  DATE(run_date) as date,
  COUNT(*) as total_runs,
  SUM(CASE WHEN conclusion='success' THEN 1 ELSE 0 END) as passed,
  ROUND(100.0 * SUM(CASE WHEN conclusion='success' THEN 1 ELSE 0 END) / COUNT(*), 2) as pass_rate
FROM workflow_runs
WHERE workflow_name = 'PR Completeness Gate'
GROUP BY DATE(run_date)
ORDER BY date DESC
LIMIT 30;
```

## Configuration

### Customize Rules
Edit `scripts/pr-completeness-bot.js`:
```javascript
const COMPLETENESS_RULES = {
  docsRequired: [
    { pattern: /your-pattern/, desc: 'Your description' },
    // Add custom patterns here
  ],
  testsRequired: [
    // Add test requirements
  ],
};
```

### Customize Wiki Links
```javascript
wikiLinks: {
  'your-section': 'docs/your-section/README.md',
  // Add links that should be suggested
}
```

### Adjust Enforcement Level
In `.github/workflows/pr-completeness-gate.yml`:
```yaml
- name: Check enforcement
  run: |
    # Option 1: Strict (fail on violations)
    if [ "$VIOLATIONS" -gt 0 ]; then exit 1; fi
    
    # Option 2: Warnings only (always pass)
    # exit 0
```

## Integration Points

### With Performance SLO Gate
Both gates can run together:
```yaml
workflows:
  - perf-slo-gate.yml        (runs after tests)
  - pr-completeness-gate.yml (runs in parallel)
```

### With Code Review
Suggested PR comment mentions:
```markdown
## Related Checks
- [Completeness Gate](...) - docs/tests status ✅/❌
- [Performance SLO](...) - perf regression check
- [Lint & Tests](...) - code quality
```

### With CI/CD Pipeline
Completeness check runs **before** merge:
```
1. Branch created → tests run
2. PR opened → completeness + perf gates run
3. Approved + gates pass → auto-merge eligible
4. Merge → deploy workflow runs
```

## Related Documentation

- [PROJECT_STATUS.md](../PROJECT_STATUS.md) - Canonical project health
- [PERFORMANCE_SLO.md](../PERFORMANCE_SLO.md) - Performance budgeting
- [DEVELOPMENT_WORKFLOW.md](../DEVELOPMENT_WORKFLOW.md) - Development process
- [docs/timeline/](../docs/timeline/README.md) - Project history
- [docs/ci-cd/](../docs/ci-cd/README.md) - CI/CD pipeline details

## Support

For completeness gate issues:
1. Check troubleshooting section above
2. Review PR comment for specific errors
3. Check GitHub Actions logs (Actions tab in PR)
4. Reference [COMPLETENESS_GATE.md](COMPLETENESS_GATE.md) guidelines
5. Reach out to team with specific violation details

---

**Last Updated**: 2025-12-20  
**Maintainer**: Quality Gates Team  
**Status**: ✅ Active & Enforced on main/develop

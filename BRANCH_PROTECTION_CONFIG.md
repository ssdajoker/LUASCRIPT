# GitHub Branch Protection Configuration

**Purpose**: Enforce completeness, performance, and quality gates on protected branches  
**Applies to**: `main`, `develop`  
**Updated**: 2025-12-20

## Quick Setup

### 1. Enable Branch Protection for `main`

Navigate to: **Settings → Branches → Branch protection rules → main**

```
Rule name: main
Require pull request reviews before merging:
  ☑ Require a pull request before merging
  ☑ Dismiss stale pull request approvals when new commits are pushed
  ☑ Require review from code owners
  Required approvals: 1

Require status checks to pass before merging:
  ☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging
  
  Required status checks:
    ☑ completeness-check / Completeness & Status Check
    ☑ tests / lint
    ☑ tests / unit-tests
    ☑ perf-slo-gate / Performance SLO Check

Restrict who can push to matching branches:
  ☑ Restrict who can push to matching branches
  Allow pushes from:
    ☑ Administrators

Other options:
  ☑ Require code scanning results before merging
  ☑ Allow force pushes: None
  ☑ Allow deletions: Unchecked
```

### 2. Enable Branch Protection for `develop`

Navigate to: **Settings → Branches → Branch protection rules → develop**

```
Rule name: develop
Require pull request reviews before merging:
  ☑ Require a pull request before merging
  ☑ Dismiss stale pull request approvals when new commits are pushed
  Required approvals: 1

Require status checks to pass before merging:
  ☑ Require status checks to pass before merging
  
  Required status checks:
    ☑ completeness-check / Completeness & Status Check
    ☑ tests / lint
    ☑ tests / unit-tests
    (perf-slo-gate optional on develop)

Restrict who can push to matching branches:
  ☑ Restrict who can push to matching branches
```

## Status Checks Explained

### `completeness-check` (NEW)
**Status**: ✅ Required  
**Purpose**: Enforce docs/test updates and status consistency  
**Source**: `.github/workflows/pr-completeness-gate.yml`  
**Fails on**: 
- Code changes without doc updates
- Breaking changes without status file updates

**Waivable**: Yes (with `skip-docs-check` or `skip-tests-check` labels + approval)

### `tests / lint`
**Status**: ✅ Required  
**Purpose**: ESLint static analysis  
**Fails on**: Linting errors in changed files

### `tests / unit-tests`
**Status**: ✅ Required  
**Purpose**: Jest/Mocha test suite  
**Fails on**: 
- Test failures
- Coverage below baseline (70% on new code)

### `perf-slo-gate` (RECOMMENDED)
**Status**: ✅ Recommended (optional on develop)  
**Purpose**: Performance SLO enforcement  
**Source**: `.github/workflows/perf-slo-gate.yml`  
**Fails on**: 
- >10% regression on key benchmarks
- Missing performance measurement data

## Complete Configuration Template

Save as `.github/branch-protection.yml` for reference:

```yaml
# GitHub Branch Protection Rules
# Apply to: main, develop
# Managed by: Quality Gates team
# Last updated: 2025-12-20

rules:
  main:
    description: "Primary production branch"
    require_pull_requests: true
    pull_request_reviews:
      required_approving_review_count: 1
      dismiss_stale_reviews: true
      require_code_owner_reviews: true
    
    required_status_checks:
      - "completeness-check / Completeness & Status Check"
      - "tests / lint"
      - "tests / unit-tests"
      - "perf-slo-gate / Performance SLO Check"
    
    require_branches_up_to_date: true
    restrict_pushes:
      - type: "users"
        users: ["github-actions[bot]"]
      - type: "teams"
        teams: ["core-maintainers"]
    
    allow_force_pushes: false
    allow_deletions: false
    allow_dismissals: true

  develop:
    description: "Development integration branch"
    require_pull_requests: true
    pull_request_reviews:
      required_approving_review_count: 1
      dismiss_stale_reviews: false
    
    required_status_checks:
      - "completeness-check / Completeness & Status Check"
      - "tests / lint"
      - "tests / unit-tests"
      - "perf-slo-gate / Performance SLO Check"
    
    require_branches_up_to_date: false
    allow_force_pushes: false
    allow_deletions: false
```

## Enforcement Workflow

```
Developer opens PR
    ↓
↙────────────────────────────────────────────┐
│  GitHub automatically runs checks:          │
│  1. Lint (eslint-env jest)                 │
│  2. Tests (jest/mocha)                     │
│  3. Completeness (docs/tests/status)       │
│  4. Performance SLO (if configured)        │
└────────────────────────────────────────────┘
    ↓
All checks pass? ──NO──→ Bot comments with issues → Dev fixes → Resubmit
    ↓
   YES
    ↓
Manual review required (1+ approval)
    ↓
Review approved? ──NO──→ Feedback → Dev responds → Re-review
    ↓
   YES
    ↓
Can be merged! (green button)
    ↓
PR merged to main/develop
    ↓
CD workflow triggers (deploy, publish, etc.)
```

## Common Scenarios

### Scenario 1: Doc Changes Without Code
**Status**: ✅ Pass (docs are not code)  
**Gate Result**: Completeness gate allows pure doc PRs

### Scenario 2: Code Changes Without Doc Updates
**Status**: ❌ Fail  
**Gate Result**: Completeness gate blocks merge  
**Fix Options**:
1. Add doc updates to PR
2. Add `skip-docs-check` label + wait for code owner approval
3. Create follow-up issue with `docs-tbd` label

### Scenario 3: Refactoring Without New Tests
**Status**: ⚠️ Warn (not blocking)  
**Gate Result**: Completeness gate warns, test gate passes if existing tests pass  
**Best Practice**: Add `refactor-no-tests` label + code owner sign-off

### Scenario 4: Performance Regression Detected
**Status**: ❌ Fail  
**Gate Result**: Perf-slo-gate blocks merge  
**Fix**: Optimize code OR adjust budget (with justification)

### Scenario 5: Status Files Out of Sync
**Status**: ⚠️ Warn  
**Gate Result**: Completeness gate flags inconsistency  
**Fix**: Update all status files to reference PROJECT_STATUS.md as source of truth

## Override/Waiver Process

### For Code Owners Only

To waive a check:
1. **Add label** to PR:
   - `skip-docs-check` - Documentation not needed
   - `skip-tests-check` - Tests deferred
   - `docs-tbd` - Docs planned in follow-up issue
   - `refactor-no-tests` - Refactoring only

2. **Comment in PR**:
   ```markdown
   @{code-owner}: Requesting waiver for [check-name]
   Reason: [brief explanation]
   Follow-up: [issue link if deferred]
   ```

3. **Code owner approves** with waiver comment:
   ```markdown
   ✅ Waiver approved for docs-check
   Reason: [explanation]
   Timeline: [when to resolve if deferred]
   ```

4. **Merge** - Status check is disabled for this PR only

## Monitoring & Reporting

### View Check Pass Rates
**GitHub Dashboard**:
1. Go to Insights → Workflow runs
2. Filter: `pr-completeness-gate.yml`
3. View success % over time

### Troubleshoot Check Failures
1. Click on PR's failed check
2. View detailed error message
3. Follow suggested fixes in bot comment
4. Resubmit PR

### Get Metrics
```bash
# Recent PRs by completeness status
gh pr list --search "is:merged" --json number,title,statusCheckRollup

# Failed checks by type
gh run list --workflow pr-completeness-gate.yml --status failure --json name,conclusion
```

## Maintenance

### When to Update Rules

| Scenario | Action | Who |
|----------|--------|-----|
| New status check added | Update required_status_checks list | QA Lead |
| Check becomes optional | Move to recommended, update docs | QA Lead |
| Coverage thresholds change | Update tests/config, note in CHANGELOG | Tech Lead |
| Waiver policy changes | Update override process, communicate to team | Team Lead |

### Annual Review Checklist
- [ ] Review all required status checks (still needed?)
- [ ] Check pass rate metrics (too strict? too loose?)
- [ ] Update documentation with lessons learned
- [ ] Gather team feedback on enforcement
- [ ] Adjust thresholds if needed

## Related Files

- [COMPLETENESS_GATE.md](COMPLETENESS_GATE.md) - Gate details
- [PERFORMANCE_SLO.md](PERFORMANCE_SLO.md) - Performance budgets
- [.github/workflows/pr-completeness-gate.yml](.github/workflows/pr-completeness-gate.yml) - Completeness workflow
- [.github/workflows/perf-slo-gate.yml](.github/workflows/perf-slo-gate.yml) - Performance workflow
- [scripts/pr-completeness-bot.js](scripts/pr-completeness-bot.js) - Bot logic

## Support

For branch protection issues:
1. Check if all required workflows exist and are passing
2. Verify branch name exactly matches rule
3. Confirm user has push access
4. Try dismissing and re-running checks
5. Contact repository administrator if blocked

---

**Last Updated**: 2025-12-20  
**Configured By**: Quality Gates Team  
**Status**: ✅ Active on main/develop

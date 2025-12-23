# CI/CD Architecture Overview

## System Design

```
                          GitHub Repository
                                 |
                    ┌────────────┼────────────┐
                    ↓            ↓            ↓
              Pull Request   Issue Comment   Webhook
                    |            |            |
                    └────────────┼────────────┘
                                 ↓
                      GitHub Actions Trigger
                                 |
                    ┌────────────┴────────────┐
                    ↓                         ↓
            ci-lean.yml               (PR created/synced)
         (Runs on: on: PR)                   |
                    |                        |
          ┌─────────┼─────────┐              |
          ↓         ↓         ↓              |
        Gate    Lint   Upload              |
        Jobs    Job    Artifacts           |
        (18)    (200)            |          |
        (20)    warns   ├─────────┼──────────┤
          |      only   │         │          │
          └─────────────┤         │          │
                        ↓         ↓          ↓
                  Artifacts   Test Results  PR Comment
                     Ready    Available      (Bot)
                        |         |          |
                        └─────────┼──────────┘
                                  ↓
                        Check Results
                        (Passing/Failing)
                                  |
                                  ↓
                        auto-merge-lean.yml
                        (Triggered on: CI success)
                                  |
                    ┌─────────────┼─────────────┐
                    ↓             ↓             ↓
                Check PR    Check Status   Verify
                Approved?   Passing?     Not Draft?
                    |             |             |
                    └─────────────┼─────────────┘
                                  ↓
                        All Checks Pass? → Merge
                            │
                    ┌───────┴────────┐
                    ↓                 ↓
                  YES              NO
                   |                |
                   ↓                ↓
            Auto-Merge       Wait for Fix
            (Squash)          or Manual
                   |                |
                   ↓                ↓
              PR Closed        PR Open
```

---

## Workflow Specifications

### ci-lean.yml (Primary Gate)

**Trigger**: Pull Request → opened, synchronize, reopened

**Jobs**:
1. **gate** (Parallel matrix: Node 18 + 20)
   - Checkout
   - Setup Node + npm cache
   - `npm ci` (install dependencies)
   - `npm run verify` (fast gate: harness + IR + parity + determinism)
   - `npm run lint` (warnings-only: max 200)
   - Upload artifacts (test results, reports)

**Duration**: ~5-10 minutes
**Cache**: npm packages (80% faster on second run)
**Artifacts**: 7-day retention

### auto-merge-lean.yml (Merge Gate)

**Trigger 1**: workflow_run → ci-lean.yml completes (success)
**Trigger 2**: pull_request → opened, synchronize, labeled (manual)

**Checks**:
1. PR not draft
2. PR not merged
3. All status checks passing (`gate (18)` + `gate (20)`)
4. At least 1 approval (non-bot)
5. Branch up to date with main

**Action**: Squash merge to main

**Comment**: Posts success message

**Duration**: <1 minute

---

## Data Flow

```
Source Code
    ↓
npm run verify ──────── Harness Tests
    ├─ harness_results.json
    ├─ IR Validation
    ├─ Parity Check
    └─ Determinism Test
    ↓
npm run lint ─────────── ESLint Check
    ├─ Max 200 warnings (Phase 1)
    ├─ 0 errors required
    └─ Lint report
    ↓
Artifacts Upload
    ├─ harness_results.json
    ├─ reports/
    ├─ perf_results.txt
    └─ (7-day retention)
    ↓
Bot PR Comment
    ├─ ✅ Gates passed
    ├─ Results summary
    └─ Ready for review
    ↓
Approval Required
    ├─ 1+ human review
    ├─ APPROVED state
    └─ Non-bot only
    ↓
Auto-Merge
    ├─ Squash to main
    ├─ Close PR
    └─ Update branch
```

---

## Configuration Strategy

### Branch Protection Rules

**For branch**: `main`

```
Required Status Checks:
  ├─ gate (18) ✓
  └─ gate (20) ✓

Require Code Review:
  ├─ 1 approval
  └─ Dismiss stale on new push

Require Branches Up To Date:
  └─ Before merge

Allow Auto-Merge:
  └─ Squash merge method
```

### npm Script Hierarchy

```
npm run verify (blocking)
  ├─ npm run harness
  ├─ npm run ir:validate:all
  ├─ npm run test:parity
  └─ npm run test:determinism
      └─ All must pass

npm run lint (warning-only, Phase 1)
  └─ eslint src/**/*.js --max-warnings 200
      └─ Can have up to 200 warnings
```

### Lint Backlog Phases

```
Phase 1/4 (Now): max-warnings 200
    ↓ 1-2 weeks
Phase 2/4: max-warnings 100
    ↓ 3-4 weeks
Phase 3/4: max-warnings 50
    ↓ 4-6 weeks
Phase 4/4 (Goal): max-warnings 0
```

---

## Performance Characteristics

### CI Runtime
- **Setup** (Node + npm cache): 1-2 min
- **npm ci** (with cache): 10-20 sec
- **npm run verify** (fast gate): 2-3 min
- **npm run lint** (ESLint): 30-60 sec
- **Artifacts upload**: <10 sec
- **Total**: 5-10 minutes per run

### Optimization
- npm cache: -80% on repeat installs
- Parallel matrix: 2 Node versions simultaneously
- Fast gate only: no full test suite
- Artifact cleanup: 7-day auto-delete

---

## Security Model

### Permissions
- `contents: write` - Merge PRs
- `pull-requests: write` - Comment on PRs
- `checks: read` - Read CI status

### Approval Gate
- Requires 1 human review (non-bot)
- APPROVED state required
- Stale reviews dismissed on new commits
- Admin bypass allowed but not required

### Branch Protection
- Force push disabled
- Deletion disabled
- Up-to-date check required
- Status checks required

---

## Error Handling

### If CI Fails
```
PR Created
    ↓
CI fails → Bot comments with status
    ↓
Developer fixes
    ↓
Push new commit
    ↓
CI runs again (fresh)
    ↓
Loop until passing
```

### If Approval Missing
```
CI passes
    ↓
auto-merge workflow triggers
    ↓
Check: PR approved?
    ├─ NO → Skip merge
    └─ YES → Proceed
```

### If Merge Conflict
```
CI passes
    ↓
auto-merge workflow triggers
    ↓
Attempt merge → CONFLICT
    ↓
Catch error → Post comment
    ↓
"PR needs manual resolution"
```

---

## Monitoring & Observability

### CI Runs
```bash
gh run list --workflow ci-lean.yml --limit 10
gh run view <RUN_ID> --log
```

### PR Status
```bash
gh pr view <PR_NUMBER>
gh pr status
```

### Artifacts
```bash
gh run download <RUN_ID> -D ./results
```

### Lint Trends
```bash
npm run lint 2>&1 | grep "problems"
# Track: 101 → 100 → 50 → 0
```

---

## Integration Points

### GitHub API
- Status checks: `repos.getCombinedStatusForRef()`
- PR reviews: `pulls.listReviews()`
- Merge: `pulls.merge()` (squash method)
- Comments: `issues.createComment()`

### GitHub Actions
- Workflow triggers: `on.workflow_run`, `on.pull_request`
- Cache: `actions/setup-node@v4` with `cache: 'npm'`
- Artifacts: `actions/upload-artifact@v4`
- Scripts: `actions/github-script@v7`

### External Tools
- ESLint: `npx eslint src/**/*.js --max-warnings 200`
- npm: `npm ci`, `npm run verify`, `npm run lint`
- gh CLI: `gh pr`, `gh run`, `gh workflow`

---

## Deployment Checklist

- [ ] Workflows enabled in Actions
- [ ] Branch protection configured
- [ ] Test PR passed CI
- [ ] Auto-merge tested
- [ ] Team briefed
- [ ] Production ready

---

## Future Enhancements

Potential additions (not included in Phase 1):

- [ ] Code coverage reports (Codecov integration)
- [ ] Performance regression detection
- [ ] Dependency updates (Dependabot)
- [ ] Security scanning (CodeQL)
- [ ] Docker build & push
- [ ] Deployment to staging/production
- [ ] Slack notifications
- [ ] GitHub checks API (detailed reporting)
- [ ] Custom gates (e.g., changelog check)
- [ ] Rollback workflow

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| CI runtime | <10 min | ~5-10 min |
| Lint errors | 0 | 0 ✓ |
| Lint warnings | <200 | 101 ✓ |
| Auto-merge accuracy | 99%+ | 100% |
| PR review time | <1 hour | Depends on team |
| Deployment frequency | 1+ per day | Unlimited (no throttle) |

---

## References

- [CI_CD_LEAN_SETUP.md](CI_CD_LEAN_SETUP.md) - Setup instructions
- [CI_CD_QUICK_REF.md](CI_CD_QUICK_REF.md) - Developer quick ref
- [CI_CD_SETUP_CHECKLIST.md](CI_CD_SETUP_CHECKLIST.md) - Implementation steps
- [CI_CD_COMPLETE_SUMMARY.md](CI_CD_COMPLETE_SUMMARY.md) - Project summary
- `.github/workflows/ci-lean.yml` - CI workflow
- `.github/workflows/auto-merge-lean.yml` - Auto-merge workflow

---

**Architecture Version**: 1.0  
**Date**: 2025-12-20  
**Status**: ✅ READY

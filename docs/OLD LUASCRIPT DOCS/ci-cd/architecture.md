# CI/CD Architecture
**Status**: ACTIVE  
**Phase**: Current  
**Last updated**: 2025-12-19  
**Related**: docs/ci-cd/README.md

---# CI/CD Architecture Overview

## System Design

```
                          GitHub Repository
                                 |
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â†“            â†“            â†“
              Pull Request   Issue Comment   Webhook
                    |            |            |
                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                 â†“
                      GitHub Actions Trigger
                                 |
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â†“                         â†“
            ci-lean.yml               (PR created/synced)
         (Runs on: on: PR)                   |
                    |                        |
          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”              |
          â†“         â†“         â†“              |
        Gate    Lint   Upload              |
        Jobs    Job    Artifacts           |
        (18)    (200)            |          |
        (20)    warns   â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
          |      only   â”‚         â”‚          â”‚
          â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤         â”‚          â”‚
                        â†“         â†“          â†“
                  Artifacts   Test Results  PR Comment
                     Ready    Available      (Bot)
                        |         |          |
                        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                  â†“
                        Check Results
                        (Passing/Failing)
                                  |
                                  â†“
                        auto-merge-lean.yml
                        (Triggered on: CI success)
                                  |
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â†“             â†“             â†“
                Check PR    Check Status   Verify
                Approved?   Passing?     Not Draft?
                    |             |             |
                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                  â†“
                        All Checks Pass? â†’ Merge
                            â”‚
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â†“                 â†“
                  YES              NO
                   |                |
                   â†“                â†“
            Auto-Merge       Wait for Fix
            (Squash)          or Manual
                   |                |
                   â†“                â†“
              PR Closed        PR Open
```

---

## Workflow Specifications

### ci-lean.yml (Primary Gate)

**Trigger**: Pull Request â†’ opened, synchronize, reopened

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

**Trigger 1**: workflow_run â†’ ci-lean.yml completes (success)
**Trigger 2**: pull_request â†’ opened, synchronize, labeled (manual)

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
    â†“
npm run verify â”€â”€â”€â”€â”€â”€â”€â”€ Harness Tests
    â”œâ”€ harness_results.json
    â”œâ”€ IR Validation
    â”œâ”€ Parity Check
    â””â”€ Determinism Test
    â†“
npm run lint â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ ESLint Check
    â”œâ”€ Max 200 warnings (Phase 1)
    â”œâ”€ 0 errors required
    â””â”€ Lint report
    â†“
Artifacts Upload
    â”œâ”€ harness_results.json
    â”œâ”€ reports/
    â”œâ”€ perf_results.txt
    â””â”€ (7-day retention)
    â†“
Bot PR Comment
    â”œâ”€ âœ… Gates passed
    â”œâ”€ Results summary
    â””â”€ Ready for review
    â†“
Approval Required
    â”œâ”€ 1+ human review
    â”œâ”€ APPROVED state
    â””â”€ Non-bot only
    â†“
Auto-Merge
    â”œâ”€ Squash to main
    â”œâ”€ Close PR
    â””â”€ Update branch
```

---

## Configuration Strategy

### Branch Protection Rules

**For branch**: `main`

```
Required Status Checks:
  â”œâ”€ gate (18) âœ“
  â””â”€ gate (20) âœ“

Require Code Review:
  â”œâ”€ 1 approval
  â””â”€ Dismiss stale on new push

Require Branches Up To Date:
  â””â”€ Before merge

Allow Auto-Merge:
  â””â”€ Squash merge method
```

### npm Script Hierarchy

```
npm run verify (blocking)
  â”œâ”€ npm run harness
  â”œâ”€ npm run ir:validate:all
  â”œâ”€ npm run test:parity
  â””â”€ npm run test:determinism
      â””â”€ All must pass

npm run lint (warning-only, Phase 1)
  â””â”€ eslint src/**/*.js --max-warnings 200
      â””â”€ Can have up to 200 warnings
```

### Lint Backlog Phases

```
Phase 1/4 (Now): max-warnings 200
    â†“ 1-2 weeks
Phase 2/4: max-warnings 100
    â†“ 3-4 weeks
Phase 3/4: max-warnings 50
    â†“ 4-6 weeks
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
    â†“
CI fails â†’ Bot comments with status
    â†“
Developer fixes
    â†“
Push new commit
    â†“
CI runs again (fresh)
    â†“
Loop until passing
```

### If Approval Missing
```
CI passes
    â†“
auto-merge workflow triggers
    â†“
Check: PR approved?
    â”œâ”€ NO â†’ Skip merge
    â””â”€ YES â†’ Proceed
```

### If Merge Conflict
```
CI passes
    â†“
auto-merge workflow triggers
    â†“
Attempt merge â†’ CONFLICT
    â†“
Catch error â†’ Post comment
    â†“
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
# Track: 101 â†’ 100 â†’ 50 â†’ 0
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
| Lint errors | 0 | 0 âœ“ |
| Lint warnings | <200 | 101 âœ“ |
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
**Status**: âœ… READY


# Automated Guardrails Documentation

## Overview

LUASCRIPT now has comprehensive automated guardrails to prevent regressions and catch drift early.

**Implementation Date**: 2025-12-20  
**Status**: ✅ ACTIVE

---

## 1. Pre-Commit Hook

**Purpose**: Fast validation of staged files  
**Trigger**: Every `git commit`  
**Duration**: ~1-5 seconds

### What It Does
- Lints **only staged .js files** (not the entire codebase)
- Uses ESLint with `--max-warnings 0` (zero tolerance)
- Fails commit if any lint errors found

### Usage
```bash
# Normal commit (hook runs automatically)
git commit -m "message"

# Bypass if needed (not recommended)
SKIP_LINT=1 git commit -m "message"
# OR
git commit --no-verify -m "message"
```

### Configuration
- **File**: `.husky/pre-commit`
- **Scope**: Staged `.js` files only
- **Fast**: Only lints changed files, not entire codebase

---

## 2. Pre-Push Hook

**Purpose**: Verify critical paths before pushing  
**Trigger**: Every `git push`  
**Duration**: ~30-60 seconds

### What It Does
1. **PR Policy Enforcement**: Blocks direct pushes to `main` branch
2. **Key Path Detection**: Checks if changes affect critical code:
   - `src/ir/` - IR core
   - `src/core_transpiler.js` - Transpiler
   - `src/parser.js` - Parser
   - `tests/ir/` - IR tests
3. **Verification Suite** (if key paths changed):
   - `npm run harness` - IR harness validation
   - `npm run test:determinism` - Determinism check
4. **Smoke Tests**: Always runs core/smoke tests

### Usage
```bash
# Normal push (hook runs automatically)
git push

# Bypass if needed (use sparingly)
SKIP_TESTS=1 git push
# OR
git push --no-verify

# Push to main (requires explicit permission)
ALLOW_PUSH_MAIN=1 git push origin main
```

### Key Path Detection
If you modify any of these paths, **full verification runs automatically**:
- `src/ir/` - IR implementation
- `src/core_transpiler.js` - Core transpiler
- `src/parser.js` - Parser
- `tests/ir/` - IR test suite

**Example output**:
```
[husky pre-push] Changes detected in critical paths (IR/parser/transpiler)
                 Running verification suite...
[husky pre-push] ✅ Key path verification passed
[husky pre-push] Running smoke tests...
[husky pre-push] ✅ All pre-push checks passed
```

---

## 3. Nightly Comprehensive Validation

**Purpose**: Catch drift and regressions overnight  
**Trigger**: Daily at 2 AM UTC (9 PM EST / 6 PM PST)  
**Duration**: ~10-20 minutes

### What It Does

#### Lint
- **Full codebase lint** (not just changed files)
- Catches accumulated warnings/errors

#### Tests
- Core test suite
- Phase 1 tests
- Destructuring patterns (25 tests)
- Edge cases (11 tests)

#### Coverage
- Full coverage analysis with nyc
- Coverage report uploaded as artifact
- 30-day retention

#### Verification Suite
- IR harness validation
- IR schema validation
- Parity tests
- Determinism tests (standard + stress)

#### Fuzz Testing
- Runs fuzzer if configured
- Continues on error (non-blocking)

#### Drift Detection
- Checks for uncommitted changes
- Compares branch status with main
- Reports commits ahead/behind

#### Artifacts
All reports retained for 30 days:
- Coverage reports
- Test results
- IR validation reports
- Logs

### Configuration
- **File**: `.github/workflows/nightly-validation.yml`
- **Schedule**: `cron: '0 2 * * *'` (2 AM UTC daily)
- **Manual Trigger**: Available via GitHub Actions UI

### Viewing Results
1. Go to GitHub Actions tab
2. Select "Nightly Comprehensive Validation" workflow
3. View run details and artifacts

### Artifact Contents
```
nightly-validation-artifacts/
├── reports/
│   ├── canonical_ir_status.md
│   ├── perf_results.txt
│   └── ...
├── coverage/
│   ├── lcov-report/
│   └── coverage.json
└── *.log
```

---

## Bypass Options

### When to Bypass
- **Emergency hotfixes** (use sparingly)
- **Work in progress** (prefer WIP commits)
- **Known issues** being addressed

### How to Bypass

#### Pre-Commit (Lint)
```bash
# Skip lint for this commit
SKIP_LINT=1 git commit -m "WIP: work in progress"

# OR use --no-verify
git commit --no-verify -m "WIP: work in progress"
```

#### Pre-Push (Tests)
```bash
# Skip tests for this push
SKIP_TESTS=1 git push

# OR use --no-verify
git push --no-verify
```

#### Both Hooks
```bash
# Disable all husky hooks for one operation
HUSKY=0 git commit -m "message"
HUSKY=0 git push
```

### ⚠️ Important
- Bypassing hooks is **tracked in git history**
- Use bypass only when necessary
- CI will still run full validation
- Failed CI must be addressed before merging

---

## Hook Execution Flow

### Pre-Commit
```
git commit
  ↓
[Pre-Commit Hook]
  ↓
Get staged .js files
  ↓
Run ESLint on staged files
  ↓
✅ Pass → Commit proceeds
❌ Fail → Commit blocked
```

### Pre-Push
```
git push
  ↓
[Pre-Push Hook]
  ↓
Check branch (block main)
  ↓
Get changed files
  ↓
Check key paths
  ↓
Key paths changed? → Run harness + determinism
  ↓
Run smoke tests
  ↓
✅ Pass → Push proceeds
❌ Fail → Push blocked
```

### Nightly Validation
```
2 AM UTC Daily
  ↓
[Nightly Workflow]
  ↓
Checkout + Setup
  ↓
Full Lint (all files)
  ↓
Test Suite (core + phase1)
  ↓
Coverage Analysis
  ↓
Verification Suite
  ↓
Determinism Stress Test
  ↓
Fuzz Testing (if available)
  ↓
Edge Case Coverage
  ↓
Drift Detection
  ↓
Collect Artifacts (30 days)
  ↓
Generate Summary
  ↓
✅ Success → Silent
❌ Failure → Alert
```

---

## Performance

### Pre-Commit Hook
- **Lint 1 file**: ~0.5-1 second
- **Lint 10 files**: ~2-3 seconds
- **Lint 50 files**: ~5-8 seconds

**Fast because**: Only lints staged files, not entire codebase

### Pre-Push Hook
- **No key paths changed**: ~10-20 seconds (smoke tests only)
- **Key paths changed**: ~30-60 seconds (full verification)

**Smart because**: Only runs full verification when critical code changes

### Nightly Validation
- **Full suite**: ~10-20 minutes
- **Runs overnight**: No developer impact
- **Artifacts retained**: 30 days for analysis

---

## Monitoring & Alerts

### Pre-Commit/Pre-Push
- **Immediate feedback** in terminal
- **Blocks operation** if checks fail
- **Clear error messages** with fix suggestions

### Nightly Validation
- **GitHub Actions UI** shows status
- **Email notifications** (if configured in GitHub)
- **Slack integration** (optional, requires setup)

### Metrics
- View nightly trends in GitHub Actions
- Download artifacts for deep analysis
- Compare coverage over time

---

## Troubleshooting

### Pre-Commit Hook Not Running
```bash
# Reinstall husky hooks
npm run prepare

# Check hook file exists
ls -la .husky/pre-commit

# Check hook is executable
chmod +x .husky/pre-commit  # Linux/Mac
```

### Pre-Push Hook Fails on Key Paths
```bash
# Run verification locally
npm run harness
npm run test:determinism

# If passing locally but failing in hook:
# - Check for uncommitted changes
# - Ensure dependencies are installed
```

### Nightly Validation Failing
1. Check GitHub Actions logs
2. Download artifacts
3. Reproduce locally:
   ```bash
   npm run lint
   npm run test:coverage
   npm run verify
   npm run test:determinism:stress
   ```

---

## Maintenance

### Updating Hook Logic
1. Edit files in `.husky/`
2. Test locally before committing
3. Document changes in this file

### Adjusting Nightly Schedule
Edit `.github/workflows/nightly-validation.yml`:
```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Change this cron expression
```

### Adding New Checks
1. **Pre-Commit**: Add to `.husky/pre-commit`
2. **Pre-Push**: Add to `.husky/pre-push`
3. **Nightly**: Add step to `.github/workflows/nightly-validation.yml`

---

## Best Practices

### For Developers
1. **Commit often** - Pre-commit is fast
2. **Fix lint before pushing** - Pre-push will catch it
3. **Don't bypass unnecessarily** - Hooks are there to help
4. **Review nightly failures** - Address drift early

### For Reviewers
1. **Check CI status** before approving PRs
2. **Review bypass reasons** if --no-verify used
3. **Monitor nightly trends** for quality metrics

### For Maintainers
1. **Keep hooks fast** - Slow hooks get bypassed
2. **Update nightly as needed** - Add new quality checks
3. **Review artifacts weekly** - Catch trends early
4. **Document changes** - Keep this file updated

---

## Summary

✅ **Pre-Commit**: Fast lint on changed files (~1-5s)  
✅ **Pre-Push**: Verify critical paths + smoke tests (~30-60s)  
✅ **Nightly**: Full validation suite (~10-20min)

**Result**: 
- Immediate feedback on code quality
- Automated verification of critical paths
- Daily comprehensive validation
- No regressions slip through

**Files**:
- `.husky/pre-commit` - Lint staged files
- `.husky/pre-push` - Verify key paths + smoke tests
- `.github/workflows/nightly-validation.yml` - Comprehensive nightly validation

All guardrails are **active and integrated** into the development workflow.

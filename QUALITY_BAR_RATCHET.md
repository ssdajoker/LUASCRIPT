# Quality Bar Ratchet System

**Status**: ✅ Active  
**Coverage Tool**: c8 (V8 native coverage)  
**Current Thresholds**: Lines 23.6%, Functions 19%, Branches 37%, Statements 23.6%  
**Diff Coverage Threshold**: 70% for new code

## Overview

The **Quality Bar Ratchet** system ensures code quality never decreases by:

1. **Coverage Thresholds**: Minimum coverage requirements that block failing builds
2. **Ratchet Mechanism**: Automatically increases thresholds as coverage improves
3. **Diff Coverage**: Ensures new code meets higher quality standards than legacy code
4. **CI Integration**: Automated checks on every PR and push

## How It Works

### 1. Coverage Thresholds

Current thresholds (`.c8rc.json`):
- **Lines**: 23.6% (ratcheted from 23%)
- **Functions**: 19% (ratcheted from 18%)
- **Branches**: 37% (ratcheted from 35%)
- **Statements**: 23.6% (ratcheted from 23%)

These are **hard gates** - builds fail if coverage drops below these levels.

### 2. Ratchet Mechanism

The ratchet automatically increases thresholds when coverage improves:

```bash
# Run tests with coverage
npm run test:coverage

# Check if coverage meets thresholds
npm run coverage:check

# Automatically update thresholds if coverage improved
npm run coverage:ratchet
```

**Ratchet Rules**:
- ✅ **Minimum improvement**: 0.5% above current threshold
- ✅ **Maximum increase**: 2.0% per ratchet
- ✅ **Grace period**: 0.5% below threshold temporarily allowed
- ✅ **Target goals**: Lines 80%, Functions 75%, Branches 70%, Statements 80%

**Example**:
```
Current coverage: 47.5%
Current threshold: 45.0%
Improvement: 2.5%
→ New threshold: 47.0% (increased by 2.0%)
```

### 3. Diff Coverage

New code must meet a **70% coverage threshold** (higher than legacy code):

```bash
# Check coverage of changed files (PRs only)
npm run coverage:diff
```

**What it checks**:
- Only analyzes files changed in the PR
- Compares coverage of modified lines vs. threshold
- Reports per-file and overall diff coverage
- **Fails** if new code coverage < 70%

**Benefits**:
- Prevents new technical debt
- Encourages writing tests for new features
- Legacy code can remain at lower coverage while new code has high quality

### 4. CI Integration

**On Every Push/PR**:
1. ✅ Run tests with coverage (`npm run coverage:full`)
2. ✅ Check coverage thresholds (fails if below)
3. ✅ Check diff coverage (PRs only, fails if new code < 70%)
4. ✅ Upload coverage reports as artifacts

**Nightly**:
- Ratchet mechanism can be run nightly to gradually increase thresholds

## Usage

### Running Coverage Locally

```bash
# Run tests with coverage and check thresholds
npm run coverage:full

# Just run coverage (no threshold check)
npm run test:coverage

# Check if coverage meets thresholds
npm run coverage:check

# View coverage report
npm run coverage:report

# Check diff coverage (for PRs)
npm run coverage:diff

# Update thresholds if coverage improved
npm run coverage:ratchet
```

### Coverage Reports

Coverage reports are generated in multiple formats:

- **Terminal**: Text summary with progress bars
- **HTML**: `coverage/lcov-report/index.html` (open in browser)
- **JSON**: `coverage/coverage-summary.json` (machine-readable)
- **LCOV**: `coverage/lcov.info` (for IDE integration)

### Viewing Coverage

```bash
# Open HTML report
open coverage/lcov-report/index.html       # macOS
xdg-open coverage/lcov-report/index.html   # Linux
start coverage/lcov-report/index.html      # Windows
```

## Ratchet State

The system maintains state in `.coverage-ratchet.json`:

```json
{
  "history": [
    {
      "timestamp": "2025-01-20T12:00:00Z",
      "coverage": { "lines": 47.5, "functions": 42.3, ... },
      "thresholds": { "lines": 45, "functions": 40, ... }
    }
  ],
  "lastUpdate": "2025-01-20T12:00:00Z",
  "highWaterMarks": {
    "lines": 47.5,
    "functions": 42.3,
    "branches": 38.2,
    "statements": 47.1
  }
}
```

**High Water Marks**: Track the best coverage ever achieved for each metric.

## CI Behavior

### Pull Requests

```yaml
CI Checks (PRs)
├── Run core verification gate
├── Run enhanced pipeline smoke test
├── Run coverage with quality bar check  ← Threshold check
├── Check diff coverage                  ← New code quality check
├── Generate coverage report
├── Lint IR code
└── Lint all code
```

**Failure Scenarios**:
- ❌ Overall coverage drops below thresholds
- ❌ New code coverage < 70%
- ❌ Tests fail

### Push to Main/Develop

Same checks as PRs, except diff coverage is skipped (no base comparison).

## Troubleshooting

### Coverage Below Threshold

```
❌ Coverage check FAILED

Failures:
  • lines: 43.20% < 45.00% (-1.80%)
  • statements: 42.50% < 45.00% (-2.50%)
```

**Fix**:
1. Run `npm run test:coverage` to see which files lack coverage
2. Add tests for uncovered files
3. Focus on files with 0% coverage first
4. Re-run `npm run coverage:check`

### Diff Coverage Failed

```
❌ Diff coverage check FAILED

❌ src/new-feature.js
   Coverage: 55.00% (11/20 statements)
   Changed lines: 35
   ⚠️  Below threshold by 15.00%
```

**Fix**:
1. Add unit tests for the new feature
2. Ensure edge cases are covered
3. Test error paths
4. Re-run `npm run coverage:diff`

### Ratchet Not Updating

If `npm run coverage:ratchet` doesn't update thresholds:

- Coverage improvement < 0.5% (minimum increment)
- Already at target thresholds (e.g., 80% for lines)
- Coverage decreased (ratchet only goes up, never down)

## Configuration

### `.c8rc.json`

```json
{
  "all": true,
  "include": ["src/**/*.js"],
  "exclude": ["test/**", "tests/**", "scripts/**"],
  "reporter": ["text", "lcov", "json", "json-summary"],
  "lines": 45,
  "functions": 40,
  "branches": 35,
  "statements": 45,
  "check-coverage": true
}
```

**Key Settings**:
- `all`: Include all files (even untested ones)
- `check-coverage`: Fail if below thresholds
- `lines/functions/branches/statements`: Threshold percentages

### Ratchet Configuration

In `scripts/coverage-ratchet.js`:

```javascript
const RATCHET_CONFIG = {
  minImprovement: 0.5,    // Min 0.5% improvement to ratchet
  maxIncrease: 2.0,       // Max 2.0% increase per ratchet
  gracePeriod: 0.5,       // Allow 0.5% below threshold
  targets: {
    lines: 80,            // Aspirational targets
    functions: 75,
    branches: 70,
    statements: 80
  }
};
```

### Diff Coverage Configuration

In `scripts/diff-coverage.js`:

```javascript
const DIFF_THRESHOLD = 70; // New code must have 70% coverage
```

## Workflow Integration

### Developer Workflow

```bash
# 1. Write code
vim src/new-feature.js

# 2. Write tests
vim tests/new-feature.test.js

# 3. Run coverage locally
npm run coverage:full

# 4. Check diff coverage (optional)
npm run coverage:diff

# 5. Commit and push
git commit -m "feat: add new feature"
git push
```

### CI Pipeline

```
Push/PR → Install deps → Run tests → Run coverage
          ↓
       Check thresholds ← FAIL if below
          ↓
     Check diff (PRs) ← FAIL if new code < 70%
          ↓
      Upload artifacts
          ↓
         Merge ✅
```

## Gradual Improvement Strategy

### Phase 1: Establish Baseline (Current)
- ✅ Set modest thresholds: 40-45%
- ✅ Enable CI checks
- ✅ Add diff coverage for new code

### Phase 2: Ratchet Gradually (Ongoing)
- 🔄 Run ratchet weekly/monthly
- 🔄 Increase thresholds as coverage improves
- 🔄 Celebrate milestones (50%, 60%, 70%)

### Phase 3: Reach Targets (Future)
- 🎯 Target: 80% lines, 75% functions, 70% branches
- 🎯 New code always meets target
- 🎯 Legacy code gradually improved

### Tips for Improvement

**Quick Wins**:
- Test utility functions (usually simple, high ROI)
- Add smoke tests for core features
- Test error handling paths

**Medium Effort**:
- Add integration tests for critical flows
- Test edge cases for complex logic
- Add tests for recently modified code

**Long-term**:
- Refactor untestable code
- Add tests for legacy code during refactoring
- Set team coverage goals

## Metrics & Monitoring

### Coverage History

View history in `.coverage-ratchet.json`:

```bash
# View last 5 ratchet updates
node -e "console.log(require('./.coverage-ratchet.json').history.slice(-5))"
```

### CI Artifacts

Coverage reports are uploaded to CI artifacts:
- Retention: 30 days
- Per platform and Node version
- Accessible via GitHub Actions UI

### High Water Marks

Track best coverage ever achieved:

```bash
# View high water marks
node -e "console.log(require('./.coverage-ratchet.json').highWaterMarks)"
```

## Examples

### Example: Passing Build

```
📊 Coverage Report
────────────────────────────────────────────────────────
✅ lines        : 47.50% ████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░
   threshold: 45.00% | target: 80.00%
✅ functions    : 42.30% █████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░
   threshold: 40.00% | target: 75.00%
✅ branches     : 38.20% ███████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
   threshold: 35.00% | target: 70.00%
✅ statements   : 47.10% ███████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░
   threshold: 45.00% | target: 80.00%
────────────────────────────────────────────────────────

✅ Coverage check PASSED
```

### Example: Failing Build

```
📊 Coverage Report
────────────────────────────────────────────────────────
❌ lines        : 43.20% █████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░
   threshold: 45.00% | target: 80.00%
✅ functions    : 42.30% █████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░
   threshold: 40.00% | target: 75.00%
✅ branches     : 38.20% ███████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
   threshold: 35.00% | target: 70.00%
❌ statements   : 42.50% █████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░
   threshold: 45.00% | target: 80.00%
────────────────────────────────────────────────────────

❌ Coverage check FAILED

Failures:
  • lines: 43.20% < 45.00% (-1.80%)
  • statements: 42.50% < 45.00% (-2.50%)
```

### Example: Ratchet Update

```
📈 Ratcheting lines: 45.0% → 47.0% (current: 47.50%)
📈 Ratcheting statements: 45.0% → 47.0% (current: 47.10%)
✅ Coverage thresholds updated
```

## See Also

- [GUARDRAILS.md](GUARDRAILS.md) - Pre-commit/pre-push hooks
- [.github/workflows/nightly-validation.yml](.github/workflows/nightly-validation.yml) - Nightly checks
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Overall project status

## Status

| Component | Status | Details |
|-----------|--------|---------|
| Coverage Tool | ✅ c8 v10+ | Modern V8 native coverage |
| Thresholds | ✅ Active | Lines 23.6%, Functions 19%, Branches 37%, Statements 23.6% |
| Ratchet | ✅ Active | Automatic threshold increases enabled |

---

**Last Updated**: December 20, 2025  
**Next Review**: Quarterly (or when targets reached)

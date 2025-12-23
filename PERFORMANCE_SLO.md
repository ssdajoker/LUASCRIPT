# Performance SLO & Budget System

## Overview

The **Performance SLO (Service Level Objective) & Budget System** automatically tracks LUASCRIPT transpiler performance against strict ±5% budgets. It detects regressions, warns on drift, and generates artifacts for trend visualization.

**Goal**: Maintain consistent, predictable performance across all code changes.

---

## SLO Budgets

All budgets enforced with **±5% tolerance bands**:

| SLO | Budget | Min | Max | Description |
|-----|--------|-----|-----|-------------|
| **transpile-simple** | 0.85ms | 0.8075 | 0.8925 | Single var declaration |
| **transpile-function** | 1.2ms | 1.14 | 1.26 | Function declaration |
| **transpile-objects** | 1.15ms | 1.0925 | 1.2075 | Objects & arrays |
| **ir-parse-simple** | 0.25ms | 0.2375 | 0.2625 | Basic IR parsing |
| **ir-parse-complex** | 0.95ms | 0.9025 | 0.9975 | Complex IR patterns |
| **lua-emit-simple** | 0.35ms | 0.3325 | 0.3675 | Simple Lua output |
| **lua-emit-complex** | 1.05ms | 0.9975 | 1.1025 | Complex Lua output |

---

## How It Works

### 1. **Measurement Collection**

During test runs, the system records timing data:

```javascript
const perf = new PerfMeasurement();
perf.measure('transpile-simple', 0.84);
perf.measure('transpile-function', 1.18);
// ... collect all metrics
```

### 2. **Budget Evaluation**

Each measurement is compared against its SLO:

```javascript
const check = perf.checkBudget('transpile-simple', 0.84);
// Result: { within: true, percentOfBudget: 98.8%, status: '✅' }
```

**Status Codes:**
- ✅ **PASS**: Within budget (< 100%)
- ⚠️ **DRIFT**: 100-110% of budget (warning)
- ❌ **VIOLATION**: > 110% of budget (blocking)

### 3. **Regression Detection**

Compares current measurements against baseline:

```javascript
const regression = perf.assessRegression(
  'transpile-simple',
  0.82,      // baseline
  0.87       // current
);
// Result: { percentChange: '+6.1%', severity: 'REGRESSION' }
```

**Decision Logic:**
- **+5% to +10%**: Warning (investigate)
- **> +10%**: Violation (must fix)

### 4. **Artifact Generation**

Results are uploaded to artifact storage for tracking:

```json
{
  "metadata": {
    "timestamp": "2025-12-20T...",
    "commit": "a1b2c3d",
    "branch": "codex/fix-134"
  },
  "summary": {
    "passingBudgets": 6,
    "failingBudgets": 1
  },
  "violations": [
    {
      "slo": "transpile-objects",
      "message": "1.27ms exceeds budget 1.15ms by 10.4%"
    }
  ]
}
```

### 5. **Visualization**

Auto-generated dashboard shows:
- Budget status for each SLO
- Trend graphs (30-day history)
- Violation details
- Regression analysis

---

## CI/CD Integration

### GitHub Actions Workflow

The `perf-slo-gate.yml` workflow:

1. ✅ **Runs after core tests** (performance data collected)
2. ✅ **Evaluates all SLOs** (against budgets)
3. ✅ **Detects regressions** (vs. baseline)
4. ✅ **Uploads artifacts** (for trend tracking)
5. ✅ **Posts PR comment** (with results summary)
6. ❌ **Fails on violations** (blocks merge)

### Triggering the Gate

**Automatically on:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Manual run:**
```bash
node scripts/perf-slo-budget.js
```

---

## Usage Guide

### Running Performance Tests Locally

```bash
# Run core tests with perf collection
PERF_COLLECT=true npm run test:core

# Check SLO budgets
node scripts/perf-slo-budget.js

# View results
open artifacts/perf-dashboard.html
```

### Interpreting Results

**All green ✅**:
```
✅ PASSED: All SLOs within budget
Passing budgets: 7/7
```

**With warnings ⚠️**:
```
⚠️  WARNING: Performance drift detected
Warnings: 2 (drift on transpile-function, ir-parse-complex)
Status: Merge allowed, but monitor performance
```

**With violations ❌**:
```
❌ FAILED: Performance SLO violations detected
Violations: 1 (transpile-objects exceeds budget by 10.4%)
Action: Must fix before merge
```

### Fixing Violations

If a benchmark violates its SLO:

1. **Analyze the change**:
   ```bash
   git diff HEAD~1 --stat
   ```

2. **Profile the code**:
   ```bash
   node --prof ./src/transpiler.js
   node --prof-process isolate-*.log > profile.txt
   ```

3. **Optimize**:
   - Reduce algorithmic complexity
   - Cache hot paths
   - Avoid unnecessary allocations

4. **Verify fix**:
   ```bash
   node scripts/perf-slo-budget.js
   ```

5. **Update baseline** (if intentional change):
   ```bash
   node scripts/perf-regression-gate.js --establish-baseline
   ```

---

## Artifact Structure

Performance artifacts are stored in `artifacts/`:

```
artifacts/
├── perf-a1b2c3d-1703081234567.json    # Single run results
├── perf-a1b2c3d-1703081294567.json    # Previous run
├── perf-dashboard.html                 # Visualization dashboard
├── perf-trend.json                     # 30-day trend data
└── .perf-baseline.json                 # Current baseline
```

### Accessing Results

**GitHub Actions**:
- Download from artifact storage (Artifacts tab)
- View dashboard link in PR comment

**Local machine**:
```bash
# Results from last run
cat artifacts/perf-*.json | jq '.summary'

# View dashboard
open artifacts/perf-dashboard.html
```

---

## Trend Visualization

Performance trends are tracked automatically:

### Dashboard Features

- **SLO Status Cards**: Current budget consumption
- **Trend Graph**: 30-day performance history
- **Regression Alert**: Highlights departures from baseline
- **Drift Indicator**: Shows performance creep over time

### Example Interpretation

```
Transpile Simple Budget:    95% ✅ (steady)
Transpile Function Budget:  102% ⚠️ (drifting +2% over 2 weeks)
IR Parse Complex Budget:    112% ❌ (regressed +7% from PR #XX)
```

---

## Tuning & Configuration

### Adjusting Tolerance Bands

Edit `SLO_BUDGETS` in `scripts/perf-slo-budget.js`:

```javascript
const SLO_BUDGETS = {
  'transpile-simple': {
    budget: 0.85,
    tolerance: 0.05,  // ±5%
    // ...
  }
};
```

**Common adjustments**:
- **Strict** (±2%): High-performance critical paths
- **Normal** (±5%): Most transpilation operations
- **Relaxed** (±10%): Complex optimization passes

### Changing Budget Values

After infrastructure improvements:

```bash
# Establish new baseline after optimization
node scripts/perf-regression-gate.js --establish-baseline

# Update SLO_BUDGETS with new values
# Re-run tests to verify
```

---

## Best Practices

### ✅ DO

- ✅ Keep budgets realistic & evidence-based
- ✅ Review violations immediately (don't skip)
- ✅ Monitor trends for gradual drift
- ✅ Update baseline after major optimizations
- ✅ Communicate performance impacts in PRs

### ❌ DON'T

- ❌ Ignore ⚠️ warnings (drift becomes regression)
- ❌ Relax budgets without cause
- ❌ Merge violations without fixing
- ❌ Skip baseline updates after refactors
- ❌ Trust single-run anomalies (needs 3+ confirmations)

---

## Troubleshooting

### High Variance in Results

**Symptom**: SLO fails intermittently
**Cause**: System load, thermal throttling, GC pauses
**Fix**:
- Run tests multiple times (3+ runs)
- Use isolated CI runner
- Increase sample size (iterations: 100→200)

### False Violations

**Symptom**: SLO fails but code didn't change
**Cause**: Different runner, Node version mismatch, unrelated changes
**Fix**:
```bash
# Run locally vs. on CI
PERF_ITERATIONS=200 node scripts/perf-slo-budget.js

# Check baseline staleness
git log -1 .perf-baseline.json
```

### Baseline Drift

**Symptom**: All SLOs slowly creeping higher
**Cause**: Accumulated small regressions
**Fix**:
1. Identify oldest violation
2. Analyze commit that introduced it
3. Optimize that specific path
4. Confirm improvement with 3 runs

---

## Integration Points

### Test Harness Integration

Hook measurement collection into test setup:

```javascript
// In test/setup.js
const { PerfMeasurement } = require('../scripts/perf-slo-budget');
global.perf = new PerfMeasurement();

// In each test
const start = process.hrtime.bigint();
// ... run test ...
const ms = Number(process.hrtime.bigint() - start) / 1e6;
global.perf.measure('test-name', ms);
```

### GitHub Pages Integration

Auto-publish performance reports:

```yaml
# .github/workflows/perf-pages.yml
- name: Deploy perf dashboard to Pages
  if: github.ref == 'refs/heads/main'
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./artifacts
```

Then view at: `https://ssdajoker.github.io/LUASCRIPT/perf-dashboard.html`

---

## Metrics & Goals

### Current Performance Baselines

| Operation | Target | Current | Status |
|-----------|--------|---------|--------|
| Transpile simple | < 1.0ms | 0.85ms | ✅ 85% of budget |
| Transpile function | < 1.5ms | 1.2ms | ✅ 80% of budget |
| Transpile objects | < 1.5ms | 1.15ms | ✅ 77% of budget |
| Parse IR simple | < 0.5ms | 0.25ms | ✅ 50% of budget |
| Parse IR complex | < 1.5ms | 0.95ms | ✅ 63% of budget |
| Emit Lua simple | < 0.5ms | 0.35ms | ✅ 70% of budget |
| Emit Lua complex | < 1.5ms | 1.05ms | ✅ 70% of budget |

### Improvement Goals

**Phase 4-6 targets**:
- Reduce transpile-objects to < 1.0ms (±5%)
- Optimize IR parser to < 0.2ms (simple)
- Improve Lua emitter throughput 2x

---

## References

- [GitHub Actions: Upload Artifacts](https://github.com/actions/upload-artifact)
- [Performance Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Node.js Profiling](https://nodejs.org/en/docs/guides/simple-profiling/)
- [SLO Best Practices](https://sre.google/sre-book/service-level-objectives/)

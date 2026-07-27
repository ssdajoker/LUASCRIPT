# Performance Regression Gate

Automated performance regression detection system for LUASCRIPT transpilation pipeline.

## Overview

The performance regression gate runs lightweight benchmark tests in CI to detect performance drift over time. It establishes a baseline, then fails the build if any benchmark regresses by more than **±15%**.

## How It Works

### Benchmarks

Five core transpilation patterns are measured:

1. **simple-assignment**: `local x = 5`
2. **function-call**: `print(42)`
3. **string-concat**: `"hello" .. "world"`
4. **array-literal**: `{1, 2, 3, 4, 5}`
5. **object-literal**: `{a = 1, b = 2, c = 3}`
6. **if-else**: `if (true) { let x = 1; } else { let x = 2; }`
7. **while-loop**: `let i = 0; while (i < 10) { i++; }`
8. **for-loop**: `for (let i = 0; i < 10; i++) { }`

Each benchmark:
- Runs 5 warm-up iterations (not measured)
- Executes 50 measured iterations
- Computes: **avg**, **median**, **p95**, **min**, **max**
- Compares avg against baseline with ±15% tolerance

### Baseline Management

**Initial Run:**
```bash
npm run perf:gate
```
- No baseline exists → creates `.perf-baseline.json`
- Run passes automatically (establishing reference)

**Subsequent Runs:**
- Compares current results against baseline
- **PASS** if all benchmarks within tolerance
- **FAIL** if any benchmark exceeds ±15% variance

**Update Baseline:**
```bash
UPDATE_BASELINE=1 npm run perf:gate
```
- Overwrites `.perf-baseline.json` with current results
- Use after intentional performance changes

### Tolerance Band

- **15% tolerance** chosen to:
  - Catch real regressions (not noise)
  - Account for CI environment variance
  - Balance sensitivity vs false positives

## CI Integration

### Workflow

```yaml
- name: Run performance regression gate
  run: npm run perf:gate
  continue-on-error: false  # Blocking gate
```

### Artifacts

Performance data is uploaded as CI artifacts:

- `artifacts/perf-regression-results.json` - Current run results
- `.perf-baseline.json` - Baseline reference

Artifacts enable:
- Trend analysis across builds
- Historical performance tracking
- Debugging regressions

## Using the Gate

### Daily Development

1. Work on features normally
2. CI runs perf gate automatically
3. If regression detected:
   - Review changes for perf impact
   - Optimize if unintentional
   - Update baseline if intentional

### Interpreting Results

**Regression Detected:**
```
❌ function-call REGRESSED
   Current:  0.085ms | Baseline: 0.047ms
   Change:   +80.9% (tolerance: ±15%)
```

**Actions:**
- Review recent changes to function call handling
- Profile with more detailed tools
- Optimize or update baseline

**All Clear:**
```
✅ Performance regression gate PASSED
Total benchmarks: 5
Successful: 5
Regressions: 0
```

### Updating Baseline

**When to update:**
- Intentional architectural changes
- Algorithm improvements
- Dependency upgrades affecting performance
- Known tradeoff (e.g., correctness over speed)

**How to update:**
```bash
# Locally
UPDATE_BASELINE=1 npm run perf:gate

# In CI (commit .perf-baseline.json)
git add .perf-baseline.json
git commit -m "perf: Update baseline after optimization"
```

**Important:** Always review the change in baseline values:
```bash
git diff .perf-baseline.json
```

## Baseline File Format

`.perf-baseline.json`:
```json
{
  "simple-assignment": {
    "avg": 0.018,
    "median": 0.015,
    "p95": 0.046,
    "min": 0.010,
    "max": 0.048
  },
  ...
}
```

## Configuration

In `scripts/perf-regression-gate.js`:

```javascript
const config = {
  iterations: 50,           // Measured iterations per benchmark
  warmupIterations: 5,      // Warm-up runs (not measured)
  tolerancePercent: 15,     // ±15% variance allowed
  baselineFile: '.perf-baseline.json',
  resultFile: 'artifacts/perf-regression-results.json'
};
```

## Troubleshooting

### False Positives

**Symptom:** Gate fails despite no code changes

**Causes:**
- CI environment variance
- Background load on runner
- First-run JIT effects

**Solutions:**
- Re-run CI (transient variance)
- Increase tolerance (if persistent)
- Review warm-up iterations

### No Baseline

**Symptom:** "No baseline found" on first run

**Expected:** Gate passes and creates baseline

**Action:** Commit `.perf-baseline.json` after first successful run

### Persistent Regression

**Symptom:** Gate consistently fails after merge

**Causes:**
- Real performance regression
- Baseline out of sync

**Solutions:**
1. Profile locally: `npm run perf:gate`
2. Compare results to baseline
3. Investigate code changes
4. Optimize or update baseline

## Best Practices

1. **Commit baseline:** Always commit `.perf-baseline.json` after updates
2. **Review diffs:** Check baseline changes in PR reviews
3. **Investigate failures:** Don't blindly update baseline
4. **Profile locally:** Reproduce regressions locally before fixing
5. **Update intentionally:** Document why baseline changed

## Integration with Quality Bar

Performance gate is part of the comprehensive quality bar:

1. **Status consistency** - Docs align with PROJECT_STATUS.md
2. **Performance regression gate** - No perf drift (this document)
3. **Coverage quality bar** - Meets baseline thresholds (23.6%+)
4. **Diff coverage** - New code meets 70% coverage

All gates are **blocking** in CI.

## Related

- [Quality Bar Ratchet](QUALITY_BAR_RATCHET.md) - Coverage thresholds
- [Development Workflow](DEVELOPMENT_WORKFLOW.md) - CI/CD process
- [Project Status](PROJECT_STATUS.md) - Source of truth

---

**Questions?** See `scripts/perf-regression-gate.js` for implementation details.

# PHASE 3.4 - QUICK REFERENCE GUIDE
## Algorithm Optimization for Developers

**Version**: 1.0  
**Last Updated**: January 31, 2026

---

## 🚀 QUICK START

### Running Gate Verification Tests

```bash
# Test all optimizations
node test/phase3.4/task4.1-lim/gate-verification.js
node test/phase3.4/task4.2-cse/gate-verification.js
node test/phase3.4/task4.3-sr/gate-verification.js
node test/phase3.4/task4.4-complexity/gate-verification.js

# Expected output for all: "🎉 ALL GATES PASSED"
```

### Using Optimizers in Code

```javascript
// Loop Invariant Motion
const { LoopInvariantMotionAnalyzer } = require('./src/optimizers/javascript/algorithm/loop-invariant-motion.js');
const limAnalyzer = new LoopInvariantMotionAnalyzer();
const analysis = limAnalyzer.analyzeLoopInvariantMotion(ir);

// Common Subexpression Elimination
const { CommonSubexpressionEliminationAnalyzer } = require('./src/optimizers/javascript/algorithm/common-subexpression-elimination.js');
const cseAnalyzer = new CommonSubexpressionEliminationAnalyzer();
const subexpressions = cseAnalyzer.analyzeCommonSubexpressions(ir);

// Strength Reduction
const { StrengthReductionAnalyzer } = require('./src/optimizers/javascript/algorithm/strength-reduction.js');
const srAnalyzer = new StrengthReductionAnalyzer();
const reductions = srAnalyzer.analyzeStrengthReduction(ir);

// Complexity Analysis
const { ComplexityAnalyzer } = require('./src/optimizers/javascript/algorithm/complexity-analyzer.js');
const complexityAnalyzer = new ComplexityAnalyzer();
const complexity = complexityAnalyzer.analyzeComplexity(ir);
```

---

## 📖 OPTIMIZATION PATTERNS

### Loop Invariant Motion (LIM)

**When to Use**: Loops with computations that don't change across iterations

```javascript
// BEFORE
for (let i = 0; i < 100; i++) {
  const x = Math.PI * 2;  // ← Loop invariant
  process(x, i);
}

// AFTER (hypothetical)
const x = Math.PI * 2;  // ← Hoisted
for (let i = 0; i < 100; i++) {
  process(x, i);
}
```

**Safety Rules**:
- ✅ Pure expressions only (no side effects)
- ❌ Never move loop-variable dependent expressions
- ❌ Never move mutation-dependent expressions

---

### Common Subexpression Elimination (CSE)

**When to Use**: Repeated computations that can be consolidated

```javascript
// BEFORE
const a = x + y;
const b = x + y;  // ← Redundant

// AFTER
const _temp0 = x + y;
const a = _temp0;
const b = _temp0;
```

**Safety Rules**:
- ✅ Pure arithmetic expressions
- ❌ Never consolidate function calls (unless proven pure)
- ❌ Never consolidate across mutations

---

### Strength Reduction (SR)

**When to Use**: Arithmetic with power-of-2 constants

```javascript
// BEFORE
const a = i * 8;
const b = i / 4;
const c = i % 2;

// AFTER
const a = i << 3;  // ← Faster bit-shift
const b = i >> 2;
const c = i & 1;
```

**Safety Rules**:
- ✅ Integers with power-of-2 constants only
- ❌ Never optimize floats
- ❌ Never optimize non-power-of-2 constants

---

### Complexity Analysis

**When to Use**: Verify optimizations preserve performance characteristics

```javascript
// Classify complexity
const analysis = complexityAnalyzer.analyzeComplexity(ir);
console.log(analysis.overall);  // "O(n²)"

// Verify preservation
const verification = complexityAnalyzer.verifyComplexityPreservation('O(n)', 'O(n)');
console.log(verification.verdict);  // "PASS"
```

**Complexity Classes**:
- O(1): Constant time (no loops)
- O(n): Linear (single loop)
- O(n²): Quadratic (nested loops)
- O(2^n): Exponential (binary recursion)

---

## 🚫 COMMON PITFALLS

### Pitfall 1: Moving Side Effects
```javascript
// ❌ WRONG - fetchData() has side effects
for (let i = 0; i < 100; i++) {
  const data = fetchData();  // Cannot hoist!
}
```

### Pitfall 2: Consolidating Across Mutations
```javascript
// ❌ WRONG - x changes between computations
let a = x + y;
x = 10;
let b = x + y;  // Different value than a!
```

### Pitfall 3: Strength Reducing Floats
```javascript
// ❌ WRONG - Float semantics differ from bit-shift
const result = floatValue * 2.0;  // Cannot use << 1
```

### Pitfall 4: Assuming O(log n)
```javascript
// ⚠️ WARNING - Analyzed as O(n), not O(log n)
function binarySearch(arr, target) {
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    // Divide-and-conquer not detected
  }
}
```

---

## 🔍 DEBUGGING TIPS

### Check Analysis Results
```javascript
const analysis = limAnalyzer.analyzeLoopInvariantMotion(ir);
console.log('Total Invariants:', analysis.analysis.totalInvariants);
console.log('Movable:', analysis.analysis.totalMovable);
console.log('Blocked:', analysis.analysis.safetyBlocked);

// Check blocking reasons
analysis.invariants.forEach(inv => {
  if (!inv.movable) {
    console.log('Blocked:', inv.forensicReason);
  }
});
```

### Verify Determinism
```bash
# Run multiple times, compare outputs
node test/phase3.4/task4.1-lim/gate-verification.js > run1.txt
node test/phase3.4/task4.1-lim/gate-verification.js > run2.txt
diff run1.txt run2.txt  # Should be identical
```

### Performance Profiling
```javascript
const start = process.hrtime.bigint();
const analysis = analyzer.analyze(ir);
const end = process.hrtime.bigint();
const durationMs = Number(end - start) / 1_000_000;
console.log(`Analysis time: ${durationMs.toFixed(2)}ms`);
```

---

## 📚 DOCUMENTATION QUICK LINKS

| Document | Purpose |
|----------|---------|
| [ALGORITHM_OPTIMIZATION_PHASE_JAVASCRIPT.md](ALGORITHM_OPTIMIZATION_PHASE_JAVASCRIPT.md) | Main reference (800+ lines) |
| [PHASE_3.4_COMPLETION_SUMMARY.md](PHASE_3.4_COMPLETION_SUMMARY.md) | Executive summary |
| [PHASE_3.4_GATE_VERIFICATION_SUCCESS.md](PHASE_3.4_GATE_VERIFICATION_SUCCESS.md) | Test results |
| [PHASE_3.4_FORENSIC_CHECKLIST.md](PHASE_3.4_FORENSIC_CHECKLIST.md) | Development checklist |

---

## 🎯 PERFORMANCE EXPECTATIONS

| Optimizer | Analysis Speed | Use Case |
|-----------|----------------|----------|
| **LIM** | 7.7 loops/ms | Hot loops |
| **CSE** | 22 expr/ms | Arithmetic code |
| **SR** | 25 expr/ms | Power-of-2 math |
| **Complexity** | 19.7 func/ms | Verification |

**Expected Compilation Overhead**: <1ms for typical functions

---

## ✅ PRODUCTION CHECKLIST

Before deploying optimizations:

- [ ] All gate tests passing (58/58)
- [ ] Performance benchmarks run
- [ ] Determinism verified (10 iterations)
- [ ] Known limitations reviewed
- [ ] Monitoring configured
- [ ] Rollback plan ready

---

## 🆘 SUPPORT

### Test Failures
1. Run gate verification: `node test/phase3.4/task4.X/gate-verification.js`
2. Check forensic reason in output
3. Review safety constraints in [main documentation](ALGORITHM_OPTIMIZATION_PHASE_JAVASCRIPT.md)

### Performance Issues
1. Profile analysis time (see "Performance Profiling" above)
2. Check input size (large IR may be slow)
3. Review performance baselines in forensic reports

### Documentation
- Main docs: `docs/ALGORITHM_OPTIMIZATION_PHASE_JAVASCRIPT.md`
- Forensic reports: `artifacts/forensics/phase3.4/task4.*/`
- Test suites: `test/phase3.4/`

---

*Last Updated: January 31, 2026*  
*Version: 1.0*  
*Status: Production Certified* ✅

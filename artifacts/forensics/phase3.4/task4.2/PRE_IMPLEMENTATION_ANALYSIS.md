# Phase 3.4 Task 4.2 - Common Subexpression Elimination (CSE)
## Pre-Implementation Forensic Analysis

**Task ID**: 3.4.4.2  
**Estimated Duration**: 14 hours  
**Forensic Start**: 2026-01-30  
**Status**: 🔬 PRE-IMPLEMENTATION ANALYSIS

---

## 🎯 OBJECTIVE

Implement Common Subexpression Elimination (CSE) optimization for JavaScript to reduce redundant computations by identifying and consolidating duplicate expressions.

**Definition**: CSE identifies expressions computed multiple times with the same operands and consolidates them into a single computation with reuse of the result.

**Example**:
```javascript
// Before CSE
let a = x * y + 5;
let b = x * y + 10;
let c = x * y * 2;

// After CSE
let temp1 = x * y;  // Computed once
let a = temp1 + 5;
let b = temp1 + 10;
let c = temp1 * 2;
```

---

## 📊 ROOT CAUSE ANALYSIS

### Why CSE is Needed
1. **Performance**: Redundant computations waste CPU cycles
2. **Memory Pressure**: Duplicate work creates unnecessary intermediate values
3. **Code Size**: Common expressions can be factored out
4. **Battery Life**: Reduced computations save energy (mobile/IoT)

### Historical Context
- Common optimization since 1960s compiler theory
- Proven effective for arithmetic-heavy code
- Risk: Over-aggressive CSE can increase register pressure
- Challenge: Determining "equivalence" of expressions

---

## 🔴 HIGH-RISK AREAS IDENTIFIED

### Risk #1: Side Effects (CRITICAL)
**Problem**: CSE must NOT consolidate impure expressions

**Bad Example**:
```javascript
let a = fetchData();    // Side effect: network I/O
let b = fetchData();    // Must NOT be consolidated!
// Each call may return different data
```

**Mitigation**:
- Reuse `SideEffectDetector` from Task 4.1
- Conservative purity analysis (assume impure when uncertain)
- NEVER consolidate functions with side effects

**Gate Risk**: Correctness Gate (40% failure risk)

---

### Risk #2: Value Numbering Collisions (HIGH)
**Problem**: Different expressions with same hash

**Bad Example**:
```javascript
let a = x + y;
let b = y + x;  // Commutative: should match
let c = x - y;  // Different: should NOT match
```

**Mitigation**:
- Canonical ordering for commutative operators (+, *, &&, ||)
- Careful hash function design
- Test corpus with near-collisions

**Gate Risk**: Determinism Gate (20% failure risk)

---

### Risk #3: Control Flow Sensitivity (HIGH)
**Problem**: Expressions valid in one scope may not be valid in another

**Bad Example**:
```javascript
if (condition) {
  let a = x * y;  // Valid here
}
let b = x * y;    // Cannot reuse 'a' (out of scope)
```

**Mitigation**:
- Dominance analysis (expression must dominate all uses)
- Scope tracking (reuse only within same scope or child scopes)
- Conservative: only consolidate within same block initially

**Gate Risk**: Correctness Gate (30% failure risk)

---

### Risk #4: Aliasing and Mutations (HIGH)
**Problem**: Variable values may change between uses

**Bad Example**:
```javascript
let a = obj.x + obj.y;
obj.x = 5;              // Mutation!
let b = obj.x + obj.y;  // Cannot reuse 'a' (obj.x changed)
```

**Mitigation**:
- Mutation tracking from Task 4.1 `DataflowAnalyzer`
- Invalidate cached expressions after mutations
- Conservative: assume object properties always mutate

**Gate Risk**: Correctness Gate (40% failure risk)

---

### Risk #5: Type Coercion (MEDIUM)
**Problem**: JavaScript's implicit type coercion can cause subtle bugs

**Example**:
```javascript
let a = "5" + 3;    // "53" (string concatenation)
let b = 5 + "3";    // "53" (looks similar but different operands)
let c = 5 + 3;      // 8 (numeric addition)
```

**Mitigation**:
- Include types in expression equivalence check
- Conservative: only consolidate if operand types match
- Test corpus with type coercion edge cases

**Gate Risk**: Correctness Gate (20% failure risk)

---

## 🧪 TEST CORPUS REQUIREMENTS

### Category 1: SAFE CSE (Positive Tests - 7 tests)
1. **Simple arithmetic**: `let a = x + y; let b = x + y;`
2. **Commutative operators**: `let a = x * y; let b = y * x;` (should match)
3. **Associative expressions**: `let a = (x + y) + z; let b = x + (y + z);`
4. **Multiple uses**: `let a = x * y; let b = x * y + 1; let c = x * y * 2;`
5. **Pure function calls**: `let a = Math.abs(x); let b = Math.abs(x);`
6. **String concatenation**: `let a = str1 + str2; let b = str1 + str2;`
7. **Array access (no mutation)**: `let a = arr[i]; let b = arr[i];` (conservative: NO mutation between)

### Category 2: UNSAFE CSE (Negative Tests - 8 tests)
1. **Impure functions**: `let a = Date.now(); let b = Date.now();` (different values)
2. **Side effects**: `let a = console.log(x); let b = console.log(x);` (must both execute)
3. **Mutations between uses**: `let a = obj.x; obj.x = 5; let b = obj.x;`
4. **Different types**: `let a = "5" + 3; let b = 5 + "3";` (both "53" but different expressions)
5. **Non-commutative**: `let a = x - y; let b = y - x;` (different results)
6. **Scope sensitivity**: `if (cond) { let a = x + y; } let b = x + y;` (cannot reuse)
7. **Control flow**: `let a = x / y; if (y === 0) return; let b = x / y;` (second is safe, first may error)
8. **Function calls with params**: `let a = foo(x); x++; let b = foo(x);` (different argument values)

### Category 3: EDGE CASES (6 tests)
1. **Empty expressions**: `let a = ; let b = ;` (syntax error, handle gracefully)
2. **Nested CSE opportunities**: `let a = (x + y) * (x + y);` (consolidate sub-expression)
3. **Chained member access**: `let a = obj.prop.subprop; let b = obj.prop.subprop;` (conservative: NO consolidation due to aliasing risk)
4. **Array mutation methods**: `let a = arr.push(x); let b = arr.push(x);` (side effects, must NOT consolidate)
5. **Ternary expressions**: `let a = cond ? x : y; let b = cond ? x : y;` (safe if cond is pure)
6. **Short-circuit evaluation**: `let a = x && y(); let b = x && y();` (if y() impure, cannot consolidate)

**Total Tests**: 21 (7 safe + 8 unsafe + 6 edge cases)

---

## 🛠️ IMPLEMENTATION STRATEGY

### Phase 1: Value Numbering
**Purpose**: Assign unique IDs to expressions based on structure

**Algorithm**:
1. Walk AST and hash each expression
2. Canonical ordering for commutative operators
3. Include operator, operands, and types in hash
4. Build expression→value map

**Output**: Map<expressionHash, valueNumber>

---

### Phase 2: Purity Analysis
**Purpose**: Identify which expressions are safe to consolidate

**Algorithm**:
1. Reuse `SideEffectDetector` from Task 4.1
2. Conservative: assume impure unless proven pure
3. Pure builtins: Math.*, String.*, Number.*
4. Impure builtins: Date.now, Math.random, console.*, fetch, etc.

**Output**: Set<expressionHash> (pure expressions only)

---

### Phase 3: Dominance Analysis (Simplified)
**Purpose**: Ensure consolidated expression dominates all uses

**Algorithm** (Conservative - Simplified for MVP):
1. Only consolidate within same block (no cross-block initially)
2. Track first occurrence of each expression
3. Replace subsequent occurrences in same block
4. Future: Add proper dominance tree analysis

**Output**: Map<expressionHash, firstOccurrenceLocation>

---

### Phase 4: Mutation Invalidation
**Purpose**: Invalidate cached expressions after variable mutations

**Algorithm**:
1. Reuse `DataflowAnalyzer` from Task 4.1
2. Track mutations within block
3. Invalidate expressions containing mutated variables
4. Conservative: invalidate all object property accesses after any mutation

**Output**: Set<expressionHash> (still valid after mutations)

---

### Phase 5: IR Metadata Annotation
**Purpose**: Attach CSE metadata to IR for later phases

**Algorithm**:
1. For each consolidated expression:
   - Original expression
   - Temp variable name
   - Consolidation locations
   - Safety reason (purity, no mutations, etc.)
2. Attach `_commonSubexpressionElimination` metadata
3. Include forensic reasoning for auditability

**Output**: IR with CSE metadata

---

## 📐 ALGORITHM PSEUDOCODE

```javascript
function analyzeCommonSubexpressions(ir, options = {}) {
  const analysis = {
    expressions: new Map(),      // hash → { expr, locations, tempVar }
    consolidated: [],            // Successfully consolidated
    blocked: [],                 // Blocked (with reasons)
  };

  // Phase 1: Value numbering
  const valueNumbers = buildValueNumbering(ir);

  // Phase 2: Purity analysis
  const pureExpressions = analyzePurity(valueNumbers);

  // Phase 3: Find consolidation opportunities
  for (const [hash, expr] of valueNumbers) {
    const locations = findAllOccurrences(ir, hash);
    
    if (locations.length < 2) continue;  // No consolidation needed
    
    // Safety checks
    const purityCheck = pureExpressions.has(hash);
    const mutationCheck = noMutationsBetween(locations);
    const scopeCheck = allInSameScope(locations);
    
    if (purityCheck && mutationCheck && scopeCheck) {
      analysis.consolidated.push({
        hash,
        expr,
        locations,
        tempVar: generateTempVar(),
        benefit: estimateSavings(expr, locations.length),
      });
    } else {
      analysis.blocked.push({
        hash,
        expr,
        reason: {
          purity: purityCheck,
          mutations: mutationCheck,
          scope: scopeCheck,
        },
      });
    }
  }

  return analysis;
}
```

---

## 🚨 FORENSIC CHECKPOINTS

### Checkpoint 1: Value Numbering (2 hours)
- [ ] Implemented expression hashing
- [ ] Canonical ordering for commutative operators
- [ ] Test: Verify `x + y` and `y + x` have same hash
- [ ] Test: Verify `x - y` and `y - x` have different hashes

### Checkpoint 2: Purity Analysis (2 hours)
- [ ] Integrated `SideEffectDetector`
- [ ] Conservative defaults (assume impure)
- [ ] Test: Pure expressions identified correctly
- [ ] Test: Impure expressions blocked

### Checkpoint 3: Mutation Tracking (3 hours)
- [ ] Integrated `DataflowAnalyzer`
- [ ] Mutation invalidation logic
- [ ] Test: Expressions invalidated after mutations
- [ ] Test: Object property accesses conservatively blocked

### Checkpoint 4: CSE Detection (3 hours)
- [ ] Full CSE algorithm implemented
- [ ] IR metadata annotation
- [ ] Test corpus: 7/7 safe tests passing
- [ ] Test corpus: 8/8 unsafe tests correctly blocked

### Checkpoint 5: Edge Cases (2 hours)
- [ ] All 6 edge case tests passing
- [ ] Error handling robust
- [ ] Forensic reasoning documented

### Checkpoint 6: Gate Verification (2 hours)
- [ ] Correctness gate (critical)
- [ ] Determinism gate
- [ ] IR validation gate
- [ ] Performance gate (measure savings)
- [ ] Integration gate

---

## 🎯 SUCCESS CRITERIA

### Functional Requirements
- [ ] 7/7 safe CSE tests passing (positive cases)
- [ ] 8/8 unsafe CSE tests blocked (negative cases)
- [ ] 6/6 edge case tests handled correctly
- [ ] Zero false positives (incorrect consolidations)
- [ ] Conservative false negatives acceptable (<20%)

### Safety Guarantees
- [ ] No side effect reordering
- [ ] No incorrect consolidations (purity verified)
- [ ] No cross-scope consolidation (dominance checked)
- [ ] No mutation invalidation missed
- [ ] Semantics preserved (correctness gate passes)

### Performance Goals
- [ ] 5-15% performance improvement on arithmetic-heavy code
- [ ] Zero performance regression on simple code
- [ ] Memory usage neutral or improved

### Documentation
- [ ] IR metadata format documented
- [ ] Forensic reasoning included
- [ ] Known limitations listed
- [ ] Test corpus documented

---

## 🔍 KNOWN LIMITATIONS (Documented Upfront)

### 1. Conservative Object Property Access
**Limitation**: Will NOT consolidate `obj.prop` expressions due to aliasing risk

**Reason**: Cannot statically prove `obj` doesn't alias another variable that's mutated

**Example**:
```javascript
let a = obj.x;
someFunc(obj);  // May mutate obj internally
let b = obj.x;  // Cannot consolidate (conservatively blocked)
```

**Future Work**: Add alias analysis in Phase 4.x

---

### 2. No Cross-Block CSE (MVP)
**Limitation**: Only consolidates within same basic block

**Reason**: Requires dominance analysis and control flow graph

**Example**:
```javascript
if (condition) {
  let a = x + y;
}
let b = x + y;  // Will NOT be consolidated (different blocks)
```

**Future Work**: Add dominance analysis in Task 4.2.1

---

### 3. No Inter-Procedural CSE
**Limitation**: Does not track expressions across function boundaries

**Reason**: Requires call graph analysis and inlining

**Example**:
```javascript
function foo() { return x + y; }
let a = x + y;
let b = foo();  // Will NOT detect as same expression
```

**Future Work**: Consider after function inlining (Phase 5.x)

---

### 4. Conservative Function Call Handling
**Limitation**: Only consolidates pure builtin functions (Math.*, String.*)

**Reason**: Cannot analyze third-party or user-defined functions for purity

**Example**:
```javascript
function pure(x) { return x * 2; }  // Actually pure
let a = pure(5);
let b = pure(5);  // Will NOT be consolidated (conservatively blocked)
```

**Future Work**: Add function purity annotations

---

## 📊 EXPECTED OUTCOMES

### Performance Impact
- **Best Case**: 15% speedup on arithmetic-heavy loop-free code
- **Average Case**: 5-8% speedup on typical code
- **Worst Case**: 0% impact (conservative approach avoids regressions)

### Test Results Prediction
- **Safe Tests**: 7/7 PASS (100%)
- **Unsafe Tests**: 8/8 BLOCKED (100% - correct rejections)
- **Edge Cases**: 6/6 HANDLED (100%)
- **False Positives**: 0 (critical requirement)
- **False Negatives**: <20% (acceptable - conservative approach)

### Gate Verification Prediction
- **Correctness**: ✅ PASS (semantics preserved)
- **Determinism**: ✅ PASS (canonical ordering ensures consistency)
- **IR Validation**: ✅ PASS (metadata schema valid)
- **Performance**: ✅ PASS (5-15% improvement)
- **Integration**: ✅ PASS (no FFI issues)

---

## 🧰 TOOLS & DEPENDENCIES

### Reused from Task 4.1
- `DataflowAnalyzer` (src/optimizers/javascript/algorithm/dataflow-analyzer.js)
- `SideEffectDetector` (src/optimizers/javascript/algorithm/side-effect-detector.js)

### New Modules (To Be Created)
- `ValueNumbering` (src/optimizers/javascript/algorithm/value-numbering.js) - Expression hashing
- `CommonSubexpressionElimination` (src/optimizers/javascript/algorithm/common-subexpression-elimination.js) - Main CSE logic

### Test Infrastructure
- `test/phase3.4/task4.2-cse/cse-tests.js` - Comprehensive test suite

---

## 📅 IMPLEMENTATION TIMELINE

| Phase | Duration | Checkpoint |
|-------|----------|------------|
| Pre-Implementation Analysis | ✅ 2h | This document |
| Test Corpus Creation | 2h | 21 tests ready |
| Value Numbering | 2h | Expression hashing working |
| Purity Analysis Integration | 2h | SideEffectDetector integrated |
| Mutation Tracking | 3h | DataflowAnalyzer integrated |
| CSE Detection | 3h | Main algorithm complete |
| Edge Cases & Polish | 2h | All tests passing |
| Gate Verification | 2h | 5/5 gates PASS |
| **Total** | **14h** | As estimated |

---

## 🚨 RISK MITIGATION SUMMARY

| Risk | Probability | Impact | Mitigation | Gate |
|------|-------------|--------|------------|------|
| Side Effect Consolidation | HIGH | CRITICAL | Conservative purity analysis | Correctness |
| Value Numbering Collisions | MEDIUM | HIGH | Canonical ordering + testing | Determinism |
| Mutation Invalidation Missed | MEDIUM | HIGH | DataflowAnalyzer tracking | Correctness |
| Scope Violation | MEDIUM | HIGH | Same-block-only (MVP) | Correctness |
| Type Coercion Bugs | LOW | MEDIUM | Include types in hash | Correctness |

**Overall Risk**: MEDIUM-HIGH (Due to semantic preservation criticality)

**Mitigation Confidence**: HIGH (Conservative approach + comprehensive testing)

---

## 📝 LESSONS FROM TASK 4.1 (Loop Invariant Motion)

### What Worked
1. ✅ **Test-first approach**: Caught edge cases before implementation
2. ✅ **Conservative safety**: Zero false positives achieved
3. ✅ **Reusable modules**: SideEffectDetector and DataflowAnalyzer proven valuable
4. ✅ **Forensic documentation**: Pre-implementation analysis saved debugging time

### What to Continue
1. ✅ Create test corpus BEFORE implementation
2. ✅ Conservative defaults (assume unsafe when uncertain)
3. ✅ Reuse existing modules (SideEffectDetector, DataflowAnalyzer)
4. ✅ IR metadata annotation for auditability
5. ✅ Comprehensive forensic reports

### What to Improve
1. ⚠️ **Add more edge case tests**: Task 4.1 had 6, Task 4.2 should have 6+
2. ⚠️ **Performance benchmarking**: Measure actual speedups, not just predictions
3. ⚠️ **Documentation**: Include more examples in test corpus

---

## 🎯 FORENSIC APPROVAL

**Pre-Implementation Analysis**: ✅ COMPLETE  
**Root Cause Identified**: ✅ Redundant computations  
**High-Risk Areas Mapped**: ✅ 5 critical risks documented  
**Test Corpus Designed**: ✅ 21 tests specified  
**Implementation Strategy**: ✅ 5-phase approach defined  
**Success Criteria**: ✅ Clear and measurable  
**Timeline**: ✅ 14 hours estimated  

**Approval Status**: ✅ **APPROVED TO PROCEED**

---

**Next Step**: Create test corpus (2 hours)  
**Next Document**: [task4.2-cse/cse-tests.js](../../../test/phase3.4/task4.2-cse/cse-tests.js)  
**Analysis Date**: 2026-01-30  
**Analyst**: Forensic Agent with Phase 3.4 expertise

# 🔬 Forensic Pre-Implementation Analysis: Loop Invariant Motion

**Phase**: 3.4 Algorithm Optimization  
**Task**: 4.1 Loop Invariant Motion (LIM)  
**Estimated Effort**: 14 hours  
**Date**: January 30, 2026  
**Status**: Pre-Implementation Analysis Complete

---

## 🎯 Root Cause Analysis: Why LIM is Needed

### Problem Statement

**Current State**: LUASCRIPT JavaScript transpiler does not optimize loop-invariant computations, leading to repeated unnecessary calculations inside loops.

**Example Problem**:
```javascript
// User writes this:
for (let i = 0; i < 100; i++) {
  const multiplier = 5 * 3;  // Computed 100 times (invariant!)
  const factor = arr.length;  // Computed 100 times (invariant!)
  result[i] = i * multiplier + factor;
}

// Should be optimized to:
const multiplier = 5 * 3;  // Computed once (hoisted)
const factor = arr.length;  // Computed once (hoisted)
for (let i = 0; i < 100; i++) {
  result[i] = i * multiplier + factor;
}
```

**Quantified Impact**:
- **Performance**: Wasted CPU cycles: O(n) redundant computations
- **Memory**: Potential register pressure from recomputation
- **Power**: Unnecessary energy consumption on mobile/embedded
- **User Experience**: Slower transpiled code execution

**Why This Wasn't Done Earlier**:
- Phases 1-3 focused on speed, memory, security fundamentals
- Phase 3.4 is first to implement advanced algorithmic optimizations
- LIM requires dataflow analysis infrastructure not yet built

---

## 📊 Constraints & Invariant Analysis

### What Makes a Computation Loop-Invariant?

**Definition**: An expression is loop-invariant if:
1. All operands are defined outside the loop
2. No operand is modified within the loop
3. The computation has no side effects
4. The computation always produces the same result

**Formally**:
```
Invariant(expr, loop) ⇔
  ∀ operand ∈ expr.operands:
    (operand.defPoint ∉ loop.body) ∧
    (operand ∉ loop.modifiedVars) ∧
  (expr.sideEffects = ∅)
```

### What CANNOT Be Moved (Critical Safety Constraints)

1. **Side Effects**:
   ```javascript
   for (...) {
     const x = readFile();  // I/O side effect - DO NOT MOVE
     const y = Math.random();  // Non-deterministic - DO NOT MOVE
     const z = counter++;  // Mutation - DO NOT MOVE
   }
   ```

2. **Dependencies on Loop Variables**:
   ```javascript
   for (let i = 0; i < 10; i++) {
     const x = i * 2;  // Depends on loop variable - DO NOT MOVE
   }
   ```

3. **Modified Variables**:
   ```javascript
   for (...) {
     arr.push(item);  // Mutates arr
     const len = arr.length;  // Depends on mutated arr - DO NOT MOVE
   }
   ```

4. **Control Flow Dependencies**:
   ```javascript
   for (...) {
     if (condition) break;
     const x = compute();  // Might not execute - CAREFUL
   }
   ```

---

## 🏗️ Architectural Design

### Phase 1: Dataflow Analysis Infrastructure (4 hours)

**Goal**: Build comprehensive dataflow analyzer to track:
- Variable definitions (where variables are assigned)
- Variable uses (where variables are read)
- Loop boundaries (entry, body, exit)
- Mutation tracking (which variables change in loop)

**Modules to Create**:
1. **`dataflow-analyzer.js`**: Core dataflow analysis
2. **`side-effect-detector.js`**: Identifies impure operations
3. **`loop-analyzer.js`**: Extracts loop structure and boundaries

**Key Data Structures**:
```javascript
{
  definitions: Map<varName, Set<defLocation>>,
  uses: Map<varName, Set<useLocation>>,
  mutations: Set<varName>,  // Variables modified in loop
  loopBoundaries: { start, end, body, header },
  invariantCandidates: Set<Expression>
}
```

### Phase 2: Loop Invariant Detection (3 hours)

**Goal**: Identify expressions safe to move out of loop

**Algorithm**:
```
function detectInvariants(loop, dataflow):
  candidates = []
  
  for each statement in loop.body:
    if statement is assignment:
      expr = statement.rightHandSide
      
      if isInvariant(expr, loop, dataflow):
        candidates.push({
          expr: expr,
          location: statement.location,
          dependencies: getOperands(expr)
        })
  
  return candidates

function isInvariant(expr, loop, dataflow):
  // Check all operands defined outside loop
  for operand in expr.operands:
    if dataflow.definitions[operand] intersects loop.body:
      return false  // Operand defined inside loop
    
    if operand in dataflow.mutations:
      return false  // Operand modified in loop
  
  // Check for side effects
  if hasSideEffects(expr):
    return false
  
  return true
```

### Phase 3: Code Motion Transformation (3 hours)

**Goal**: Safely move invariant code outside loop with IR metadata

**Transformation Strategy**:
```javascript
// 1. Identify hoist location (before loop)
const hoistPoint = loop.start;

// 2. For each invariant:
for (const inv of invariants) {
  // Create temporary variable
  const tempVar = generateTempVar();
  
  // Insert assignment before loop
  insertBefore(hoistPoint, {
    type: 'VariableDeclaration',
    id: tempVar,
    init: inv.expr
  });
  
  // Replace original expression with temp variable
  replace(inv.location, {
    type: 'Identifier',
    name: tempVar
  });
  
  // Add IR metadata for code generator
  addMetadata(inv.location, {
    _loopInvariantMotion: {
      originalExpr: serializeExpr(inv.expr),
      hoistedTo: hoistPoint,
      tempVar: tempVar,
      benefit: estimateBenefit(loop.iterations)
    }
  });
}
```

### Phase 4: Verification & Testing (2 hours)

**Goal**: Ensure correctness with comprehensive test suite

**Test Categories** (15+ tests):
1. **Safe Invariants** (5 tests):
   - Simple arithmetic: `const x = 5 * 3;`
   - Constant computation: `const y = Math.PI * 2;`
   - External variable: `const z = outerVar + 1;`
   - Property access: `const len = arr.length;` (if arr not modified)
   - Nested computation: `const w = (a + b) * (c - d);`

2. **Unsafe Non-Invariants** (5 tests):
   - Side effect: `const x = readFile();` (DO NOT MOVE)
   - Loop variable dependency: `const y = i * 2;` (DO NOT MOVE)
   - Mutation dependency: `arr.push(item); const z = arr.length;` (DO NOT MOVE)
   - Non-deterministic: `const w = Math.random();` (DO NOT MOVE)
   - Control flow: `if (...) break; const v = compute();` (CAREFUL)

3. **Edge Cases** (5+ tests):
   - Empty loop
   - Nested loops (inner/outer invariants)
   - Loop with break/continue
   - Loop with mutation after invariant
   - Infinite loop (while(true))

### Phase 5: Documentation (2 hours)

**Deliverables**:
- Forensic report documenting safety proofs
- Code comments explaining invariant detection logic
- Test coverage report
- Known limitations document

---

## 🚨 High-Risk Areas & Mitigation

### Risk 1: Moving Code with Side Effects (CRITICAL)

**Probability**: 40%  
**Impact**: Correctness failure, wrong program behavior

**Mitigation**:
- Comprehensive side effect detector checking for:
  - I/O operations (readFile, console.log, etc.)
  - Function calls (assume impure unless proven pure)
  - Array/object mutations (push, pop, property assignment)
  - Non-deterministic operations (Math.random, Date.now)
- Conservative approach: If uncertain, DO NOT MOVE
- Add `@pure` annotation support for user-marked pure functions

**Detection**:
- Correctness tests with side effect ordering
- Determinism tests (side effects should be consistent)
- Manual code review of side effect detector

### Risk 2: Missing Mutation Dependencies (HIGH)

**Probability**: 30%  
**Impact**: Wrong results after mutation

**Mitigation**:
- Track ALL mutations within loop body
- Invalidate any expression dependent on mutated variable
- Conservative: Assume worst case if aliasing unclear
- Test extensively with mutation scenarios

**Detection**:
- Test cases with array.push(), object mutation
- Verify expressions recomputed after mutation

### Risk 3: Control Flow Complexity (MEDIUM)

**Probability**: 20%  
**Impact**: Code moved that might not execute

**Mitigation**:
- Only move code from always-executed paths
- If break/continue present, analyze control flow carefully
- Conservative: Skip optimization if complex control flow

**Detection**:
- Tests with break/continue/return in loops
- Verify moved code always safe to execute

### Risk 4: Nested Loop Confusion (LOW)

**Probability**: 10%  
**Impact**: Inner loop invariant moved outside outer loop incorrectly

**Mitigation**:
- Clearly track loop nesting levels
- Only move to immediate outer scope
- Document nesting level in metadata

**Detection**:
- Nested loop test cases
- Verify correct hoist location

---

## ✅ Success Criteria (Forensic Verification)

### Correctness Gate

- [ ] All 15+ test cases passing
- [ ] No semantic changes detected in comparison tests
- [ ] Side effect ordering preserved in all scenarios
- [ ] Mutations do not invalidate hoisted code
- [ ] Baseline behavior preserved (diff against unoptimized output)

**Verification Method**:
```bash
# Run correctness tests
npm run test:core -- --grep "LIM"

# Compare optimized vs unoptimized
node transpile.js --optimize=lim input.js > output-opt.js
node transpile.js --optimize=none input.js > output-noopt.js
node verify-semantic-equivalence.js output-opt.js output-noopt.js
```

### Determinism Gate

- [ ] 10 consecutive runs produce identical hash
- [ ] Optimization order deterministic (canonical sort)
- [ ] No variation in which invariants are moved

**Verification Method**:
```bash
for i in {1..10}; do
  node transpile.js input.js | sha256sum >> hashes.txt
done
uniq hashes.txt | wc -l  # Must be 1
```

### IR Validation Gate

- [ ] All IR nodes have required fields
- [ ] NodeRef patterns match `^[^_]+_[T01]+$`
- [ ] Metadata properly attached
- [ ] No schema violations

**Verification Method**:
```bash
npm run ir:validate:all
node scripts/debug-ir-schema.js
```

### Performance Gate

- [ ] >5% speedup on loop-heavy benchmarks
- [ ] <2% slowdown on loop-free code (analysis overhead acceptable)
- [ ] Benefit proportional to loop iterations

**Verification Method**:
```bash
npm run test:performance -- --grep "LIM"
# Compare before/after benchmarks
# Profile to ensure optimization applied
```

### Integration Gate

- [ ] Cross-language interop maintained
- [ ] FFI compatibility preserved
- [ ] Round-trip transpilation works (JS→Lua→JS)

**Verification Method**:
```bash
npm run harness -- --grep "LIM"
node test-round-trip.js
```

---

## 📐 Implementation Timeline

| Phase | Duration | Deliverable | Forensic Checkpoint |
|-------|----------|-------------|---------------------|
| **Pre-Implementation** | 2h | This document, baselines established | Root cause analysis complete |
| **Dataflow Analysis** | 4h | dataflow-analyzer.js, side-effect-detector.js, loop-analyzer.js | All infrastructure passing unit tests |
| **Invariant Detection** | 3h | loop-invariant-motion.js (detection logic) | 15+ test cases identified |
| **Code Motion** | 3h | Transformation + IR metadata | First 5 tests passing |
| **Verification** | 2h | All tests passing, gates verified | Forensic reports generated |
| **Total** | 14h | Complete LIM implementation | Production-ready |

---

## 🚀 Quick-Start: First Implementation Step

**Task**: Create dataflow-analyzer.js module

**Why This First**: Foundation for all optimization decisions - must track variable definitions, uses, and mutations accurately.

**Deliverable**: ~400-line module with:
- `analyzeDataflow(ast)` - main entry point
- `collectDefinitions(node)` - find variable assignments
- `collectUses(node)` - find variable references
- `trackMutations(node)` - identify mutations
- Test suite with 10+ test cases

**Forensic Checkpoint**: Module passes all unit tests, ready for integration

**Time Estimate**: 4 hours

**User Prompt** (if pausing for feedback):
```
🚀 Ready to implement dataflow-analyzer.js (4 hours)

This module will:
- Track variable definitions across the AST
- Identify variable uses and dependencies
- Detect mutations within loops
- Provide foundation for invariant detection

Shall I proceed with implementation? [Y/N]
Or would you like to:
[A] Review design first
[B] Modify approach
[C] Start with smaller proof-of-concept
```

---

## 📝 Notes for Future Reference

**Key Insights**:
- Loop invariant motion is SAFE only with comprehensive dataflow analysis
- Conservative approach: When in doubt, don't move
- Side effects are the #1 source of incorrect optimizations
- Mutations must invalidate dependent expressions
- Always prefer correctness over performance

**Lessons from Phase 3.3 Security**:
- Creating test corpus BEFORE implementation caught edge cases early
- Forensic reports provided clear audit trail
- Metadata annotation worked well for downstream integration

**Apply to Phase 3.4**:
- Same test-first approach
- Generate forensic reports continuously
- Document all safety assumptions

---

**Root cause analysis complete. Ready to begin implementation with full forensic discipline.**

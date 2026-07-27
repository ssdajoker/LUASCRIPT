# Phase 3.4 Algorithm Optimization - Forensic Checklist

**Phase**: 3.4 Algorithm Optimization  
**Total Effort**: 60 hours (JavaScript), 50 hours (Lua), 50 hours (OCaml)  
**Status**: Ready for forensic-level implementation  
**Last Updated**: January 30, 2026

---

## 🎯 Phase 3.4 Overview

**Subtasks**:
1. **Task 4.1**: Loop Invariant Motion (LIM) - 14h
2. **Task 4.2**: Common Subexpression Elimination (CSE) - 14h
3. **Task 4.3**: Strength Reduction - 14h
4. **Task 4.4**: Algorithmic Complexity Analysis - 12h
5. **Task 4.5**: Documentation - 6h

**Success Criteria**:
- All optimizations preserve code semantics (correctness gate)
- Deterministic output across 10+ runs (determinism gate)
- Performance improvement >5% (performance gate)
- IR schema compliance (IR validation gate)
- Cross-language interop maintained (integration gate)

---

## 🚨 High-Risk Gate Interactions (Prioritized)

### 1. CORRECTNESS GATE (Priority: CRITICAL) ⚠️⚠️⚠️

**Risk Level**: 40% probability of failure  
**Impact**: Code semantics violated - BLOCKING

**Why This Fails in Phase 3.4**:
- Loop invariant motion moves code with side effects
- CSE consolidates expressions that shouldn't be (non-pure functions)
- Strength reduction changes semantics (overflow behavior)
- Dataflow analysis misses complex dependencies

**Forensic Preparation**:

```bash
# Before starting any optimization task
# 1. Document current behavior baseline
npm run test:core > baseline-correctness.txt

# 2. Create test corpus (15+ edge cases per task)
mkdir test/phase3.4/task4.1-lim/
# Add: empty loops, nested loops, side effects, dependencies

# 3. Enable strict correctness checking
export LUASCRIPT_STRICT_SEMANTICS=1

# 4. Set up continuous validation
watch -n 5 'npm run test:core'
```

**Failure Scenarios & Forensic Response**:

| Scenario | Detection | Forensic Action | Fix Strategy |
|----------|-----------|-----------------|--------------|
| **LIM moves code with side effect** | Test expects side effect before loop, gets it during loop | 1. Run dataflow analyzer<br>2. Trace variable usage<br>3. Check pure/impure annotation | Add effect tracking, mark impure expressions as non-movable |
| **CSE consolidates non-pure function** | Same function called twice, results differ | 1. Profile function calls<br>2. Check for I/O, state, random<br>3. Validate purity assumptions | Add purity analysis, never consolidate impure |
| **Strength reduction overflow** | Large number calculation wrong | 1. Check numeric ranges<br>2. Compare with/without opt<br>3. Validate type assumptions | Add overflow checks, disable for BigInt |

**Pre-Implementation Checklist**:
- [ ] Comprehensive dataflow analysis implemented
- [ ] Side effect tracking system in place
- [ ] Purity analysis for all functions
- [ ] 15+ edge case tests written BEFORE optimization
- [ ] Baseline behavior documented
- [ ] Forensic report template prepared

**During Implementation**:
- [ ] Run correctness tests after EVERY change
- [ ] Compare output with baseline continuously
- [ ] Document why each optimization is safe
- [ ] Add assertions for invariants

**Post-Implementation**:
- [ ] All 15+ tests passing
- [ ] No semantic changes detected
- [ ] Forensic report generated: `forensic_correctness_task4.X.md`
- [ ] Evidence artifacts archived

---

### 2. DETERMINISM GATE (Priority: HIGH) ⚠️⚠️

**Risk Level**: 20% probability of failure  
**Impact**: Inconsistent output across runs - BLOCKING

**Why This Fails in Phase 3.4**:
- Optimization order varies (LIM applied before/after CSE randomly)
- Hash map iteration for candidate selection
- Tie-breaking in benefit scoring non-deterministic
- Array.sort() without compare function

**Forensic Preparation**:

```bash
# Before starting
# 1. Establish determinism baseline
for i in {1..10}; do
  node transpile.js test/input.js | sha256sum >> hashes-before.txt
done
uniq hashes-before.txt | wc -l  # Should be 1

# 2. Set up determinism monitor
# Monitor script that runs 10 times and alerts on variation
```

**Failure Scenarios & Forensic Response**:

| Scenario | Detection | Forensic Action | Fix Strategy |
|----------|-----------|-----------------|--------------|
| **Optimization order varies** | Hash differs on run 5 vs run 1 | 1. Trace optimization sequence<br>2. Check for conditional ordering<br>3. Profile decision tree | Canonical sort: alphabetical by rule name |
| **Hash map iteration** | Different optimizations selected | 1. Search for Map/Set iteration<br>2. Check for Object.keys() | Convert to sorted array before iteration |
| **Tie-breaking random** | Benefit scores equal, choice varies | 1. Profile scoring function<br>2. Check for === comparisons | Add tie-breaker: lexicographic order |

**Pre-Implementation Checklist**:
- [ ] All optimization passes named deterministically
- [ ] Canonical ordering function implemented
- [ ] No Map/Set direct iteration (convert to sorted array)
- [ ] All sort() calls have explicit compare functions
- [ ] No Math.random(), Date.now(), or UUID generation
- [ ] RNG seeded for testing (if needed)

**During Implementation**:
- [ ] Test determinism after adding each optimization
- [ ] Run 10-iteration verification on every commit
- [ ] Document all sources of potential variation

**Post-Implementation**:
- [ ] 10+ consecutive runs produce identical hash
- [ ] Forensic report: `forensic_determinism_task4.X.md`
- [ ] Hash log archived as evidence

---

### 3. IR VALIDATION GATE (Priority: HIGH) ⚠️

**Risk Level**: 25% probability of failure  
**Impact**: Schema violations - BLOCKING

**Why This Fails in Phase 3.4**:
- Optimization creates new IR nodes without proper fields
- NodeRef patterns broken (missing _T0, _T1 suffix)
- Dead code elimination violates schema constraints
- Transformed nodes have invalid type enum values

**Forensic Preparation**:

```bash
# Before starting
# 1. Validate IR baseline
npm run ir:validate:all > ir-baseline.txt

# 2. Load schema definition
node -e "console.log(JSON.stringify(require('./src/ir/schema.json'), null, 2))" > schema-reference.json

# 3. Set up continuous validation
watch -n 10 'npm run ir:validate:all'
```

**Failure Scenarios & Forensic Response**:

| Scenario | Detection | Forensic Action | Fix Strategy |
|----------|-----------|-----------------|--------------|
| **Missing required field** | Schema validator error: "field 'type' required" | 1. node scripts/debug-ir-schema.js<br>2. Find nodes missing field<br>3. Trace to optimization | Add field during node creation |
| **NodeRef pattern invalid** | Validator: "NodeRef must match ^[^_]+_[T01]+$" | 1. grep for broken references<br>2. Check node naming<br>3. Validate tier suffix | Enforce naming convention in node factory |
| **Invalid type enum** | "type 'LoopInvariantNode' not in schema" | 1. Check schema allowed types<br>2. Verify new nodes registered<br>3. Update schema if needed | Use existing types or extend schema properly |

**Pre-Implementation Checklist**:
- [ ] IR schema studied and understood
- [ ] Node creation uses factory functions (ensures fields present)
- [ ] All new node types added to schema enum
- [ ] NodeRef naming enforced programmatically
- [ ] debug-ir-schema.js script tested and ready

**During Implementation**:
- [ ] Validate IR after each optimization pass
- [ ] Run debug-ir-schema.js on any validation error
- [ ] Never skip IR validation

**Post-Implementation**:
- [ ] All IR files pass validation
- [ ] No schema violations detected
- [ ] Forensic report: `forensic_ir_validation_task4.X.md`
- [ ] IR dumps archived as evidence

---

### 4. PERFORMANCE GATE (Priority: MEDIUM) ⚠️

**Risk Level**: 15% probability of failure  
**Impact**: Optimization makes code slower - WARNING

**Why This Fails in Phase 3.4**:
- Optimization adds more overhead than it saves
- Analysis cost (dataflow, liveness) exceeds benefit
- Strength reduction breaks CPU pipeline (branch mispredictions)
- CSE increases register pressure, causes spills

**Forensic Preparation**:

```bash
# Before starting
# 1. Establish performance baseline
npm run test:performance > perf-baseline.txt

# 2. Set up profiling
node --prof transpile.js test/input.js
node --prof-process isolate-*.log > profile-before.txt

# 3. Define SLO threshold
# Optimization MUST improve performance by >5% OR
# If slower, must be <2% slowdown with correctness benefit
```

**Failure Scenarios & Forensic Response**:

| Scenario | Detection | Forensic Action | Fix Strategy |
|----------|-----------|-----------------|--------------|
| **Optimization slower than baseline** | Benchmark: 120ms vs 100ms baseline | 1. Profile hot paths<br>2. Check analysis overhead<br>3. Measure opt vs no-opt | Add cost model, disable if benefit < threshold |
| **N² algorithm introduced** | Input size 100: 10s, size 200: 40s | 1. Complexity analysis<br>2. Trace nested loops<br>3. Check data structure access | Replace with O(n log n) or O(n) algorithm |
| **Register pressure** | More memory access, cache misses | 1. Count temporaries<br>2. Check register allocation<br>3. Profile memory access | Limit CSE consolidations, prefer stack |

**Pre-Implementation Checklist**:
- [ ] Performance baseline established (3+ runs, average)
- [ ] Profiling tools ready (--prof, flamegraph)
- [ ] Cost model for optimization benefit
- [ ] SLO threshold defined (>5% improvement OR <2% slowdown)

**During Implementation**:
- [ ] Benchmark after each major change
- [ ] Profile to identify bottlenecks
- [ ] Document why performance is acceptable

**Post-Implementation**:
- [ ] Performance meets SLO (>5% improvement or <2% slowdown)
- [ ] Forensic report: `forensic_performance_task4.X.md`
- [ ] Benchmark data and profiles archived

---

### 5. INTEGRATION GATE (Priority: HIGH) ⚠️

**Risk Level**: 30% probability of failure  
**Impact**: Cross-language interop broken - BLOCKING

**Why This Fails in Phase 3.4**:
- Optimization assumes single-language context
- Parameter order changed, FFI expects original
- Strength reduction breaks type conversions (int vs BigInt)
- Loop transformation incompatible with callback semantics

**Forensic Preparation**:

```bash
# Before starting
# 1. Test cross-language baseline
npm run harness > integration-baseline.txt

# 2. Set up round-trip tests
node transpile-js-to-lua.js input.js > output.lua
node transpile-lua-to-js.js output.lua > roundtrip.js
diff input.js roundtrip.js

# 3. Test FFI interop
node test-ffi-interop.js
```

**Failure Scenarios & Forensic Response**:

| Scenario | Detection | Forensic Action | Fix Strategy |
|----------|-----------|-----------------|--------------|
| **Parameter order changed** | FFI call fails, wrong arguments | 1. Trace parameter flow<br>2. Check optimization effect<br>3. Validate FFI expectations | Preserve parameter order or add mapping metadata |
| **Type conversion breaks** | Lua expects integer, gets float | 1. Check type transformations<br>2. Validate marshalling<br>3. Test type conversions | Add explicit type guards, document assumptions |
| **Callback semantics** | Callback not called or wrong timing | 1. Trace callback registration<br>2. Check optimization effect on control flow<br>3. Validate event ordering | Mark callback patterns as optimization-unsafe |

**Pre-Implementation Checklist**:
- [ ] Integration tests run successfully (baseline)
- [ ] FFI interop tested
- [ ] Round-trip transpilation verified (JS→Lua→JS)
- [ ] Callback patterns documented
- [ ] Type conversion rules understood

**During Implementation**:
- [ ] Run integration tests after each optimization
- [ ] Test round-trip on every commit
- [ ] Document interop assumptions

**Post-Implementation**:
- [ ] All integration tests passing
- [ ] Round-trip transpilation works
- [ ] FFI interop maintained
- [ ] Forensic report: `forensic_integration_task4.X.md`
- [ ] Interop test results archived

---

## 📋 Task-Specific Forensic Checklists

### Task 4.1: Loop Invariant Motion (14 hours)

**Goal**: Move loop-invariant computations outside loops

**Pre-Implementation** (2 hours):
- [ ] Study dataflow analysis algorithms
- [ ] Design side effect tracking system
- [ ] Create 15+ test cases:
  - [ ] Simple invariant: `for (...) { const x = 5 * 3; }`
  - [ ] Dependent computation: `for (...) { const y = x + 1; }`
  - [ ] Side effect: `for (...) { const z = readFile(); }` (DO NOT MOVE)
  - [ ] Nested loops with inner/outer invariants
  - [ ] Loop with no invariants
  - [ ] Empty loop
  - [ ] Infinite loop
  - [ ] Loop with break/continue
  - [ ] Loop with mutation: `for (...) { arr[i] = i; const x = arr.length; }`
- [ ] Document baseline behavior for all 15 tests

**Implementation** (8 hours):
- [ ] Implement dataflow analysis
- [ ] Build side effect detector
- [ ] Create loop invariant detector
- [ ] Implement code motion transformation
- [ ] Add IR metadata for moved code
- [ ] Run correctness tests after EACH step

**Verification** (2 hours):
- [ ] All 15 tests passing
- [ ] Determinism verified (10 runs)
- [ ] IR validation passing
- [ ] Performance improvement measured
- [ ] Integration tests passing

**Documentation** (2 hours):
- [ ] Forensic report: Why LIM is safe
- [ ] Evidence: Test results, benchmarks
- [ ] Known limitations documented
- [ ] Archive artifacts

---

### Task 4.2: Common Subexpression Elimination (14 hours)

**Goal**: Consolidate repeated computations

**Pre-Implementation** (2 hours):
- [ ] Study CSE algorithms (value numbering, hash-based)
- [ ] Design purity analysis system
- [ ] Create 15+ test cases:
  - [ ] Pure expression: `a = x+y; b = x+y;` → `t = x+y; a = t; b = t;`
  - [ ] Non-pure: `a = Math.random(); b = Math.random();` (DO NOT CONSOLIDATE)
  - [ ] Across basic blocks
  - [ ] With control flow (if/else)
  - [ ] Side effects between uses
  - [ ] Complex expressions: `a = (x+y)*(z-w); b = (x+y)*(z-w);`
  - [ ] Array access: `a = arr[i]; b = arr[i];`
  - [ ] Function call: `a = f(x); b = f(x);` (only if pure)
- [ ] Document baseline

**Implementation** (8 hours):
- [ ] Implement value numbering or hash-based CSE
- [ ] Build purity analysis
- [ ] Create expression hasher
- [ ] Implement consolidation transformation
- [ ] Add temporary variable generation
- [ ] Run tests continuously

**Verification** (2 hours):
- [ ] All 15 tests passing
- [ ] No non-pure consolidation
- [ ] Determinism verified
- [ ] Performance improvement measured

**Documentation** (2 hours):
- [ ] Forensic report
- [ ] Purity analysis documentation
- [ ] Archive evidence

---

### Task 4.3: Strength Reduction (14 hours)

**Goal**: Replace expensive operations with cheaper ones

**Pre-Implementation** (2 hours):
- [ ] Study strength reduction patterns
- [ ] Identify transformations:
  - [ ] `i * 2` → `i << 1` (bitshift)
  - [ ] `i / 2` → `i >> 1` (signed right shift)
  - [ ] `i * 8` → `i << 3`
  - [ ] `i % 2` → `i & 1`
- [ ] Create 20+ test cases:
  - [ ] Power of 2 multiplication
  - [ ] Power of 2 division
  - [ ] Modulo power of 2
  - [ ] Non-power of 2 (DO NOT TRANSFORM)
  - [ ] Negative numbers (check sign)
  - [ ] BigInt (BE CAREFUL)
  - [ ] Float (DO NOT TRANSFORM)
  - [ ] Overflow edge cases
- [ ] Document baseline

**Implementation** (8 hours):
- [ ] Implement pattern matcher for reduction opportunities
- [ ] Build type inference (int vs float vs BigInt)
- [ ] Create transformation rules
- [ ] Add overflow guards
- [ ] Implement replacement
- [ ] Test extensively

**Verification** (2 hours):
- [ ] All 20 tests passing
- [ ] No semantic changes (especially overflow)
- [ ] Type safety maintained
- [ ] Performance improvement measured

**Documentation** (2 hours):
- [ ] Forensic report
- [ ] Transformation rules documented
- [ ] Archive evidence

---

### Task 4.4: Algorithmic Complexity Analysis (12 hours)

**Goal**: Analyze and preserve algorithmic complexity

**Pre-Implementation** (2 hours):
- [ ] Study complexity analysis algorithms
- [ ] Design loop nest analyzer
- [ ] Create 10+ test cases for complexity classes:
  - [ ] O(1): constant time
  - [ ] O(log n): binary search
  - [ ] O(n): single loop
  - [ ] O(n log n): merge sort
  - [ ] O(n²): nested loops
  - [ ] O(2^n): recursive fibonacci
- [ ] Document baseline complexity

**Implementation** (7 hours):
- [ ] Implement loop nest counter
- [ ] Build recursion depth analyzer
- [ ] Create complexity classifier
- [ ] Add verification that optimizations preserve complexity
- [ ] Document complexity for each function

**Verification** (1 hour):
- [ ] All complexity classifications correct
- [ ] No optimizations degraded complexity
- [ ] Documentation complete

**Documentation** (2 hours):
- [ ] Forensic report
- [ ] Complexity preservation proof
- [ ] Archive evidence

---

### Task 4.5: Documentation (6 hours)

**Goal**: Comprehensive phase documentation

**Tasks**:
- [ ] Write `ALGORITHM_OPTIMIZATION_PHASE_JAVASCRIPT.md`
- [ ] Document all optimizations implemented
- [ ] Include forensic reports summary
- [ ] Provide examples and edge cases
- [ ] Document known limitations
- [ ] Sign-off statement

---

## 🚀 Quick-Start Workflow

### Before Starting ANY Task

```bash
# 1. Review forensic checklist for task
cat docs/PHASE_3.4_FORENSIC_CHECKLIST.md | grep -A 50 "Task 4.X"

# 2. Set up forensic environment
mkdir -p artifacts/forensics/phase3.4/task4.X/
mkdir -p test/phase3.4/task4.X/

# 3. Establish baselines
npm run test:core > artifacts/forensics/phase3.4/task4.X/baseline-correctness.txt
npm run test:determinism > artifacts/forensics/phase3.4/task4.X/baseline-determinism.txt
npm run test:performance > artifacts/forensics/phase3.4/task4.X/baseline-performance.txt
npm run ir:validate:all > artifacts/forensics/phase3.4/task4.X/baseline-ir.txt
npm run harness > artifacts/forensics/phase3.4/task4.X/baseline-integration.txt

# 4. Create test corpus BEFORE implementing
# See task-specific checklist for 15+ test cases

# 5. Enable forensic monitoring
export LUASCRIPT_FORENSIC_MODE=1
export LUASCRIPT_STRICT_SEMANTICS=1
```

### During Implementation

```bash
# Run after EVERY significant change
npm run verify

# If ANY gate fails:
# 1. STOP immediately
# 2. Run forensic diagnosis
node src/utils/diagnostic-framework.js "[Gate Name]" < error-output.txt

# 3. Review forensic report
cat artifacts/forensics/forensic_[gate]_[timestamp].md

# 4. Choose fix strategy [A/B/C/D]
# 5. Implement fix
# 6. Verify gate passes
npm run verify

# 7. Document in forensic report
# 8. Continue implementation
```

### After Completing Task

```bash
# 1. Run full verification suite
npm run verify
npm test

# 2. Generate final forensic report
node scripts/generate-forensic-summary.js --phase 3.4 --task 4.X

# 3. Archive evidence
git add artifacts/forensics/phase3.4/task4.X/
git add test/phase3.4/task4.X/

# 4. Commit with forensic reference
git commit -m "feat: Phase 3.4 Task 4.X - [Description]

Forensic Reports:
- forensic_correctness_task4.X.md
- forensic_determinism_task4.X.md
- forensic_ir_validation_task4.X.md
- forensic_performance_task4.X.md
- forensic_integration_task4.X.md

All gates passing:
- Correctness: ✅ 15/15 tests
- Determinism: ✅ 10/10 runs identical
- IR Validation: ✅ All schemas valid
- Performance: ✅ +12% improvement
- Integration: ✅ All interop tests passing
"
```

---

## ⚠️ Critical Rules for Phase 3.4

1. **NEVER** bypass a gate - fix the root cause
2. **ALWAYS** run forensic diagnosis on any failure
3. **ALWAYS** create test corpus BEFORE implementing optimization
4. **ALWAYS** document why optimization is safe
5. **ALWAYS** verify determinism (10+ runs)
6. **ALWAYS** preserve code semantics (correctness tests)
7. **ALWAYS** validate IR after changes
8. **NEVER** assume single-language context
9. **ALWAYS** archive forensic reports and evidence
10. **NEVER** move forward with failing gates

---

**This is forensic-level algorithm optimization. Every decision is documented, every change is verified, every failure is diagnosed completely.**

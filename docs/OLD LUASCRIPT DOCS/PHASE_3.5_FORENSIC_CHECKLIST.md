# Phase 3.5 Interoperability - Forensic Checklist

**Phase**: 3.5 Interoperability  
**Total Effort**: 50 hours (JavaScript), 50 hours (Lua), 50 hours (OCaml)  
**Status**: Ready for forensic-level implementation  
**Last Updated**: January 31, 2026

---

## 🎯 Phase 3.5 Overview

**Subtasks**:
1. **Task 5.1**: FFI (Foreign Function Interface) Analyzer - 12h
2. **Task 5.2**: Boundary Optimizer - 12h
3. **Task 5.3**: Marshaling Optimizer - 10h
4. **Task 5.4**: Type Converter - 10h
5. **Task 5.5**: Documentation - 6h

**Success Criteria**:
- All interop optimizations preserve cross-language semantics (correctness gate)
- Deterministic output across 10+ runs (determinism gate)
- FFI call overhead reduced >20% (performance gate)
- IR schema compliance with interop metadata (IR validation gate)
- Round-trip transpilation maintained (integration gate)

---

## 🚨 High-Risk Gate Interactions (Prioritized)

### 1. CORRECTNESS GATE (Priority: CRITICAL) ⚠️⚠️⚠️

**Risk Level**: 45% probability of failure  
**Impact**: Cross-language semantics violated - BLOCKING

**Why This Fails in Phase 3.5**:
- Type conversion changes semantics (JavaScript number vs Lua integer)
- FFI calling convention violated (parameter passing, stack alignment)
- Data marshaling loses information (precision, references, metadata)
- Boundary optimization changes execution order across languages
- Memory layout assumptions broken (pointer sizes, endianness)

**Forensic Preparation**:

```bash
# Before starting any interop optimization task
# 1. Document current interop behavior baseline
npm run test:interop > baseline-interop-correctness.txt

# 2. Create test corpus (20+ edge cases per task)
mkdir test/phase3.5/task5.1-ffi/
# Add: type conversions, callbacks, pointer passing, struct marshaling

# 3. Enable strict interop checking
export LUASCRIPT_STRICT_INTEROP=1

# 4. Set up continuous validation
watch -n 5 'npm run test:interop'
```

**Failure Scenarios & Forensic Response**:

| Scenario | Detection | Forensic Action | Fix Strategy |
|----------|-----------|-----------------|--------------|
| **Type conversion precision loss** | Lua receives 1.5, expects 2 (rounded) | 1. Trace type conversion path<br>2. Check number type semantics<br>3. Validate precision requirements | Add explicit conversion rules, document assumptions |
| **FFI calling convention violated** | Segfault or wrong return value | 1. Check stack alignment<br>2. Validate parameter order<br>3. Verify calling convention (cdecl/stdcall) | Follow platform ABI exactly, add validation |
| **Marshaling loses references** | Shared object becomes copies | 1. Trace object lifecycle<br>2. Check reference tracking<br>3. Validate ownership model | Implement reference counting or GC coordination |
| **Pointer size mismatch** | 32-bit pointer in 64-bit context | 1. Check platform assumptions<br>2. Validate pointer arithmetic<br>3. Test on multiple architectures | Use platform-agnostic types (intptr_t) |

**Pre-Implementation Checklist**:
- [ ] Cross-language type mapping documented
- [ ] FFI calling convention studied (Node.js N-API, LuaJIT FFI)
- [ ] Data marshaling rules defined
- [ ] 20+ edge case tests written BEFORE optimization
- [ ] Baseline interop behavior documented
- [ ] Forensic report template prepared

**During Implementation**:
- [ ] Run interop tests after EVERY change
- [ ] Test on multiple platforms (x64, ARM, 32-bit if applicable)
- [ ] Document why each optimization preserves semantics
- [ ] Add assertions for type conversion invariants

**Post-Implementation**:
- [ ] All 20+ tests passing
- [ ] No semantic changes detected across languages
- [ ] Platform compatibility verified
- [ ] Forensic report generated: `forensic_correctness_task5.X.md`
- [ ] Evidence artifacts archived

---

### 2. DETERMINISM GATE (Priority: HIGH) ⚠️⚠️

**Risk Level**: 25% probability of failure  
**Impact**: Inconsistent interop behavior across runs - BLOCKING

**Why This Fails in Phase 3.5**:
- FFI call ordering non-deterministic (async callbacks)
- Hash map iteration for boundary candidates
- Marshaling buffer allocation order varies
- Type converter tie-breaking non-deterministic
- Platform-specific pointer addresses affect decisions

**Forensic Preparation**:

```bash
# Before starting
# 1. Establish determinism baseline
for i in {1..10}; do
  node test-interop.js | sha256sum >> hashes-before.txt
done
uniq hashes-before.txt | wc -l  # Should be 1

# 2. Set up determinism monitor
# Test cross-language transpilation consistency
for i in {1..10}; do
  node transpile-js-to-lua.js input.js | sha256sum >> lua-hashes.txt
done
uniq lua-hashes.txt | wc -l  # Should be 1
```

**Failure Scenarios & Forensic Response**:

| Scenario | Detection | Forensic Action | Fix Strategy |
|----------|-----------|-----------------|--------------|
| **Async callback order varies** | Test run 3 differs from run 1 | 1. Trace callback scheduling<br>2. Check event loop interaction<br>3. Profile async operations | Sort callbacks deterministically, use stable queue |
| **Pointer address affects logic** | Hash differs due to pointer values | 1. Search for pointer-based decisions<br>2. Check hash functions<br>3. Validate address independence | Use content-based hashing, not address |
| **Buffer allocation non-deterministic** | Marshaling order varies | 1. Trace buffer allocation<br>2. Check memory allocator<br>3. Profile allocation patterns | Pre-allocate buffers, use deterministic allocator |

**Pre-Implementation Checklist**:
- [ ] All optimization passes use deterministic ordering
- [ ] No pointer address in hash functions
- [ ] Async operations ordered explicitly
- [ ] All sort() calls have explicit compare functions
- [ ] Buffer allocation pre-sized and ordered

**During Implementation**:
- [ ] Test determinism after adding each optimization
- [ ] Run 10-iteration verification on every commit
- [ ] Document all sources of potential variation

**Post-Implementation**:
- [ ] 10+ consecutive runs produce identical output
- [ ] Cross-language transpilation deterministic
- [ ] Forensic report: `forensic_determinism_task5.X.md`
- [ ] Hash log archived as evidence

---

### 3. IR VALIDATION GATE (Priority: HIGH) ⚠️

**Risk Level**: 20% probability of failure  
**Impact**: Schema violations with interop metadata - BLOCKING

**Why This Fails in Phase 3.5**:
- Interop nodes missing required metadata fields
- FFI signature format invalid
- Type mapping metadata malformed
- Boundary markers inconsistent
- NodeRef patterns broken for cross-language references

**Forensic Preparation**:

```bash
# Before starting
# 1. Validate IR baseline
npm run ir:validate:all > ir-baseline-interop.txt

# 2. Extend schema for interop metadata
# Add: ffiSignature, languageBoundary, marshalingHint, typeMapping

# 3. Set up continuous validation
watch -n 10 'npm run ir:validate:all'
```

**Failure Scenarios & Forensic Response**:

| Scenario | Detection | Forensic Action | Fix Strategy |
|----------|-----------|-----------------|--------------|
| **Missing ffiSignature** | Schema validator: "field 'ffiSignature' required" | 1. Find FFI nodes<br>2. Check metadata generation<br>3. Trace to optimization | Add ffiSignature during FFI node creation |
| **Type mapping malformed** | Validator: "typeMapping must have source and target" | 1. Check type conversion nodes<br>2. Validate mapping structure<br>3. Fix mapping generator | Use structured type mapping format |
| **Boundary marker inconsistent** | Validator: "languageBoundary must be 'js-lua' or 'lua-js'" | 1. Check boundary detection<br>2. Validate direction marking<br>3. Audit all boundaries | Enforce enum for boundary types |

**Pre-Implementation Checklist**:
- [ ] IR schema extended for interop (ffiSignature, typeMapping, etc.)
- [ ] Interop node factory functions created
- [ ] Metadata validation rules defined
- [ ] debug-ir-interop.js script created
- [ ] Schema compliance tested

**During Implementation**:
- [ ] Validate IR after each optimization pass
- [ ] Run debug-ir-interop.js on validation errors
- [ ] Never skip IR validation

**Post-Implementation**:
- [ ] All IR files pass interop validation
- [ ] No schema violations detected
- [ ] Forensic report: `forensic_ir_validation_task5.X.md`
- [ ] IR dumps archived as evidence

---

### 4. PERFORMANCE GATE (Priority: HIGH) ⚠️⚠️

**Risk Level**: 30% probability of failure  
**Impact**: FFI overhead not reduced sufficiently - WARNING

**Why This Fails in Phase 3.5**:
- FFI call batching adds coordination overhead
- Marshaling optimization increases memory allocations
- Type conversion analysis cost exceeds savings
- Boundary crossing still dominates (unavoidable overhead)

**Forensic Preparation**:

```bash
# Before starting
# 1. Establish FFI performance baseline
npm run test:ffi-performance > ffi-perf-baseline.txt

# 2. Measure FFI call overhead
node --prof test-ffi-calls.js
node --prof-process isolate-*.log > ffi-profile-before.txt

# 3. Define SLO threshold
# FFI optimization MUST reduce overhead by >20% OR
# If slower, must be <5% slowdown with correctness benefit
```

**Failure Scenarios & Forensic Response**:

| Scenario | Detection | Forensic Action | Fix Strategy |
|----------|-----------|-----------------|--------------|
| **FFI batching overhead dominates** | Batched: 120ms vs unbatched: 100ms | 1. Profile batching logic<br>2. Measure coordination cost<br>3. Check threshold tuning | Only batch if call count > threshold (e.g., >10) |
| **Marshaling allocations increase** | More memory pressure, GC pauses | 1. Count allocations<br>2. Check buffer reuse<br>3. Profile memory patterns | Add buffer pool, reuse marshaling buffers |
| **Type conversion overhead** | Analysis cost > conversion savings | 1. Profile conversion analysis<br>2. Measure hot paths<br>3. Check caching | Cache conversion decisions, inline trivial conversions |

**Pre-Implementation Checklist**:
- [ ] FFI performance baseline established (10+ runs, average)
- [ ] Profiling tools ready (--prof, flamegraph)
- [ ] Cost model for FFI optimization benefit
- [ ] SLO threshold defined (>20% FFI overhead reduction)

**During Implementation**:
- [ ] Benchmark FFI calls after each major change
- [ ] Profile to identify FFI bottlenecks
- [ ] Document why performance is acceptable

**Post-Implementation**:
- [ ] Performance meets SLO (>20% FFI overhead reduction OR <5% slowdown)
- [ ] Forensic report: `forensic_performance_task5.X.md`
- [ ] Benchmark data and profiles archived

---

### 5. INTEGRATION GATE (Priority: CRITICAL) ⚠️⚠️⚠️

**Risk Level**: 40% probability of failure  
**Impact**: Round-trip transpilation broken - BLOCKING

**Why This Fails in Phase 3.5**:
- Boundary optimization breaks round-trip (JS→Lua→JS ≠ JS)
- Type conversion not invertible (loss of precision)
- FFI metadata lost in transpilation
- Marshaling optimization changes data representation
- Cross-language reference tracking fails

**Forensic Preparation**:

```bash
# Before starting
# 1. Test round-trip baseline
node transpile-js-to-lua.js input.js > output.lua
node transpile-lua-to-js.js output.lua > roundtrip.js
npm run compare-semantics input.js roundtrip.js

# 2. Test all language pairs
for src in js lua ocaml; do
  for tgt in js lua ocaml; do
    node transpile-${src}-to-${tgt}.js test.${src} > test.${tgt}
  done
done

# 3. Test FFI interop
npm run test:ffi-roundtrip
```

**Failure Scenarios & Forensic Response**:

| Scenario | Detection | Forensic Action | Fix Strategy |
|----------|-----------|-----------------|--------------|
| **Round-trip fails** | JS→Lua→JS produces different output | 1. Trace transformations<br>2. Check type conversions<br>3. Validate metadata preservation | Ensure invertible transformations, preserve metadata |
| **Type conversion not invertible** | Number 42 becomes 42.0, can't convert back | 1. Check conversion rules<br>2. Validate precision<br>3. Test edge cases | Add type hints, preserve original types |
| **FFI metadata lost** | Transpiled code missing FFI annotations | 1. Trace metadata flow<br>2. Check IR preservation<br>3. Validate metadata serialization | Include metadata in IR, serialize properly |

**Pre-Implementation Checklist**:
- [ ] Round-trip tests run successfully (baseline)
- [ ] All language pairs tested (JS↔Lua, JS↔OCaml, Lua↔OCaml)
- [ ] Type conversion invertibility documented
- [ ] FFI metadata preservation verified
- [ ] Interop assumptions documented

**During Implementation**:
- [ ] Run round-trip tests after each optimization
- [ ] Test all language pairs on every commit
- [ ] Document interop assumptions

**Post-Implementation**:
- [ ] All round-trip tests passing
- [ ] Language pair transpilation works
- [ ] FFI metadata preserved
- [ ] Forensic report: `forensic_integration_task5.X.md`
- [ ] Interop test results archived

---

## 📋 Task-Specific Forensic Checklists

### Task 5.1: FFI (Foreign Function Interface) Analyzer (12 hours)

**Goal**: Analyze FFI calls and identify optimization opportunities

**Module**: `src/optimizers/javascript/interop/ffi-analyzer.js`

**Pre-Implementation** (2 hours):
- [ ] Study FFI patterns (Node.js N-API, LuaJIT FFI, OCaml FFI)
- [ ] Research FFI calling conventions (cdecl, stdcall)
- [ ] Design FFI signature analysis system
- [ ] Create 20+ test cases:
  - [ ] Simple FFI call: `ffi.call('external_func', arg1, arg2)`
  - [ ] FFI callback: `ffi.callback(jsFunc)`
  - [ ] Type conversion: `ffi.call('func', jsNumber) → luaInteger`
  - [ ] Pointer passing: `ffi.call('func', buffer.ptr)`
  - [ ] Struct marshaling: `ffi.call('func', { x: 1, y: 2 })`
  - [ ] Array passing: `ffi.call('func', [1, 2, 3])`
  - [ ] Return value handling: `const result = ffi.call('func')`
  - [ ] Error handling: `try { ffi.call() } catch (e) {}`
  - [ ] Nested FFI calls: `ffi.call('outer', ffi.call('inner'))`
  - [ ] FFI call in loop: `for (...) { ffi.call() }`
  - [ ] FFI with side effects: `ffi.call('writeFile', data)`
  - [ ] FFI with callback closure: `ffi.callback(() => { useVar(x); })`
  - [ ] FFI with async: `await ffi.callAsync('func')`
  - [ ] FFI with variadic args: `ffi.call('printf', fmt, ...args)`
  - [ ] FFI signature detection: C signature parsing
  - [ ] FFI call overhead measurement
  - [ ] FFI batching opportunity detection
  - [ ] FFI inline candidate detection
  - [ ] FFI error propagation analysis
  - [ ] FFI memory safety validation
- [ ] Document baseline FFI behavior for all 20 tests

**Implementation** (6 hours):
- [ ] Implement FFI call detection (identify ffi.call, ffi.callback patterns)
- [ ] Build FFI signature analyzer (parse C signatures, extract types)
- [ ] Create overhead estimator (count FFI calls, measure cost)
- [ ] Implement batching opportunity detector (find repeated FFI calls)
- [ ] Design inline candidate selector (trivial FFI wrappers)
- [ ] Add IR metadata for FFI calls:
  ```javascript
  {
    type: 'FfiCall',
    _ffiSignature: 'int func(int, float)',
    _overhead: 'high', // 'low', 'medium', 'high'
    _batchable: true,
    _inlineCandidate: false,
    _safetyLevel: 'safe' // 'safe', 'unsafe', 'unknown'
  }
  ```
- [ ] Run correctness tests after EACH step

**Verification** (2 hours):
- [ ] All 20 tests passing
- [ ] FFI signatures correctly detected
- [ ] Overhead estimates validated (compare with profiling)
- [ ] Batching opportunities identified correctly
- [ ] Determinism verified (10 runs)
- [ ] IR validation passing
- [ ] Integration tests passing (round-trip)

**Documentation** (2 hours):
- [ ] Forensic report: Why FFI analysis is safe
- [ ] Evidence: Test results, benchmarks
- [ ] Known limitations documented (variadic args, computed signatures)
- [ ] Archive artifacts

**Expected Deliverables**:
1. `src/optimizers/javascript/interop/ffi-analyzer.js` (300+ lines)
2. `test/phase3.5/task5.1-ffi/gate-verification.js` (14+ tests)
3. `artifacts/forensics/phase3.5/task5.1/GATE_VERIFICATION_COMPLETE.md`

---

### Task 5.2: Boundary Optimizer (12 hours)

**Goal**: Minimize language boundary crossings

**Module**: `src/optimizers/javascript/interop/boundary-optimizer.js`

**Pre-Implementation** (2 hours):
- [ ] Study boundary crossing patterns
- [ ] Design boundary detection algorithm
- [ ] Create 20+ test cases:
  - [ ] Sequential FFI calls: `ffi.call('a'); ffi.call('b');` → batch
  - [ ] FFI call in loop: hoist out if possible
  - [ ] Boundary with data dependency
  - [ ] Boundary with control flow dependency
  - [ ] Interleaved FFI and JS code
  - [ ] Callback across boundary
  - [ ] Async boundary crossing
  - [ ] Nested boundaries (JS→Lua→OCaml)
  - [ ] Boundary with shared data
  - [ ] Boundary with side effects
  - [ ] Boundary optimization opportunities
  - [ ] Boundary optimization blockers
- [ ] Document baseline boundary behavior

**Implementation** (6 hours):
- [ ] Implement boundary detection
- [ ] Build call batching optimizer
- [ ] Create boundary hoisting (move invariant boundaries out of loops)
- [ ] Design boundary fusion (merge adjacent FFI calls)
- [ ] Add IR metadata for boundaries
- [ ] Run correctness tests after EACH step

**Verification** (2 hours):
- [ ] All 20 tests passing
- [ ] Boundary optimizations verified
- [ ] Determinism verified (10 runs)
- [ ] IR validation passing
- [ ] Performance improvement measured (>20% reduction)
- [ ] Integration tests passing

**Documentation** (2 hours):
- [ ] Forensic report
- [ ] Evidence artifacts
- [ ] Known limitations

---

### Task 5.3: Marshaling Optimizer (10 hours)

**Goal**: Efficient data structure conversion across languages

**Module**: `src/optimizers/javascript/interop/marshaling-optimizer.js`

**Pre-Implementation** (2 hours):
- [ ] Study marshaling patterns (structs, arrays, strings, buffers)
- [ ] Design zero-copy opportunities
- [ ] Create 15+ test cases:
  - [ ] Simple type conversion: `jsNumber → luaNumber`
  - [ ] Array marshaling: `[1,2,3] → lua table`
  - [ ] Object/struct marshaling: `{x:1,y:2} → C struct`
  - [ ] String marshaling with encoding
  - [ ] Buffer/pointer marshaling
  - [ ] Nested structure marshaling
  - [ ] Circular reference handling
  - [ ] Large data marshaling (>1MB)
  - [ ] Zero-copy candidate detection
  - [ ] Buffer reuse opportunities
  - [ ] Shared memory optimization
- [ ] Document baseline marshaling behavior

**Implementation** (5 hours):
- [ ] Implement marshaling analyzer
- [ ] Build zero-copy detector
- [ ] Create buffer pool optimizer
- [ ] Design shared memory coordinator
- [ ] Add IR metadata
- [ ] Run tests after each step

**Verification** (2 hours):
- [ ] All 15 tests passing
- [ ] Zero-copy opportunities identified
- [ ] Memory efficiency measured
- [ ] Determinism verified
- [ ] IR validation passing

**Documentation** (1 hour):
- [ ] Forensic report
- [ ] Evidence artifacts

---

### Task 5.4: Type Converter (10 hours)

**Goal**: Safe and efficient type conversion across languages

**Module**: `src/optimizers/javascript/interop/type-converter.js`

**Pre-Implementation** (2 hours):
- [ ] Document type mapping rules (JS↔Lua↔OCaml)
- [ ] Design type safety validator
- [ ] Create 15+ test cases:
  - [ ] Number conversions (int, float, BigInt)
  - [ ] String conversions (UTF-8, UTF-16)
  - [ ] Boolean conversions
  - [ ] Null/undefined/nil handling
  - [ ] Array/table conversions
  - [ ] Object/record conversions
  - [ ] Function/closure conversions
  - [ ] Type inference across boundaries
  - [ ] Precision loss detection
  - [ ] Type error detection
- [ ] Document baseline conversion behavior

**Implementation** (5 hours):
- [ ] Implement type mapping analyzer
- [ ] Build type safety validator
- [ ] Create conversion optimizer (inline trivial conversions)
- [ ] Design precision preservation system
- [ ] Add IR metadata
- [ ] Run tests after each step

**Verification** (2 hours):
- [ ] All 15 tests passing
- [ ] Type safety verified
- [ ] Precision preservation validated
- [ ] Determinism verified
- [ ] IR validation passing

**Documentation** (1 hour):
- [ ] Forensic report
- [ ] Evidence artifacts

---

### Task 5.5: Documentation (6 hours)

**Goal**: Comprehensive Phase 3.5 documentation

**Implementation** (6 hours):
- [ ] Create main documentation: `docs/INTEROPERABILITY_OPTIMIZATION_PHASE_JAVASCRIPT.md` (600+ lines)
  - [ ] FFI Analyzer technical details
  - [ ] Boundary Optimizer algorithms
  - [ ] Marshaling Optimizer strategies
  - [ ] Type Converter rules
  - [ ] Integration with IR pipeline
  - [ ] Performance benchmarks
  - [ ] Known limitations
  - [ ] Best practices
  - [ ] Production certification criteria

- [ ] Create completion summary: `PHASE_3.5_COMPLETION_SUMMARY.md` (300+ lines)
  - [ ] Final scorecard (test counts, gate results)
  - [ ] Lessons learned
  - [ ] Technical highlights
  - [ ] Impact analysis

- [ ] Create quick reference: `docs/PHASE_3.5_QUICK_REFERENCE.md` (150+ lines)
  - [ ] Developer quick-start
  - [ ] Common patterns
  - [ ] Debugging tips
  - [ ] Troubleshooting

- [ ] Update master forensic reports
  - [ ] Consolidate all task forensic reports
  - [ ] Create master gate verification report
  - [ ] Archive all evidence

**Total Documentation**: 2,000+ lines across all files

---

## 🔍 VALIDATION CRITERIA

### All Tasks Must Pass These Gates

**Gate 1: Correctness** (20 tests minimum per task)
- Cross-language semantics preserved
- Type conversions correct
- FFI calling conventions followed
- No memory corruption
- Zero false optimizations

**Gate 2: Determinism** (10 iterations per task)
- Identical output across runs
- FFI call ordering stable
- Type conversion decisions consistent
- Boundary optimization deterministic
- Hash stability validated

**Gate 3: IR Validation** (Schema compliance)
- All interop metadata present
- FFI signatures valid
- Type mappings correct
- Boundary markers consistent
- NodeRef patterns preserved

**Gate 4: Performance** (>20% FFI overhead reduction)
- FFI call overhead measured
- Marshaling efficiency validated
- Type conversion cost measured
- Boundary crossing minimized
- Benchmarks archived

**Gate 5: Integration** (Round-trip transpilation)
- JS↔Lua round-trip works
- JS↔OCaml round-trip works
- Lua↔OCaml round-trip works
- FFI metadata preserved
- Type information retained

---

## 📊 SUCCESS METRICS

### Phase 3.5 Completion Criteria

```
Tasks Completed:       5/5    (100%)
Tests Passed:          85+/85 (100%)  [20+20+15+15+15]
Gates Verified:        25+/25 (100%)  [5 gates × 5 tasks]
False Positives:       0/85   (0%)
FFI Overhead:          -20%   (reduction)
Round-trip Success:    100%   (all language pairs)

Production Certified:  ✅ Required
Documentation:         ✅ Required (2,000+ lines)
Forensic Reports:      ✅ Required (all tasks)
```

---

## 🚀 GETTING STARTED

### Day 1: Task 5.1 - FFI Analyzer

1. **Read this checklist** (30 min)
2. **Study FFI patterns** (60 min)
3. **Create test corpus** (60 min)
4. **Begin implementation** (6 hours)
5. **Run gate verification** (2 hours)
6. **Write forensic report** (2 hours)

### Week 1: Tasks 5.1-5.3 (34 hours)

- Task 5.1: FFI Analyzer (12h)
- Task 5.2: Boundary Optimizer (12h)
- Task 5.3: Marshaling Optimizer (10h)

### Week 2: Tasks 5.4-5.5 (16 hours)

- Task 5.4: Type Converter (10h)
- Task 5.5: Documentation (6h)

---

## 📚 REFERENCE MATERIALS

### Required Reading

1. **Node.js N-API Documentation**: FFI patterns for JavaScript
2. **LuaJIT FFI Tutorial**: Low-level FFI patterns
3. **OCaml FFI Guide**: Type-safe FFI patterns
4. **Phase 3.4 Completion**: Proven forensic methodology

### Tools

- `node --prof`: Performance profiling
- `npm run test:interop`: Cross-language tests
- `npm run ir:validate:all`: IR validation
- `npm run test:ffi-performance`: FFI benchmarks

---

## ✅ FINAL CHECKLIST

Before declaring Phase 3.5 complete:

- [ ] All 5 tasks implemented
- [ ] All 85+ tests passing
- [ ] All 25+ gates verified
- [ ] FFI overhead reduced >20%
- [ ] Round-trip transpilation works (all language pairs)
- [ ] Documentation complete (2,000+ lines)
- [ ] Forensic reports complete (all tasks)
- [ ] Production certification obtained
- [ ] Artifacts archived

---

**END OF FORENSIC CHECKLIST**

**Status**: Ready for Phase 3.5 implementation  
**Methodology**: Proven in Phase 3.4 (100% success rate)  
**Expected Duration**: 50 hours  
**Risk Level**: Medium-High (interop complexity)  
**Confidence**: High (forensic approach)

---

**Document Version**: 1.0  
**Date**: January 31, 2026  
**Author**: LUASCRIPT Development Team  
**Based on**: Phase 3.4 forensic methodology (100% success rate)

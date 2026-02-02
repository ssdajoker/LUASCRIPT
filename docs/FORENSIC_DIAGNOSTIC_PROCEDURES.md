# 🔬 Forensic Diagnostic Procedures

**Version**: 2.0  
**Last Updated**: January 30, 2026  
**Purpose**: Enforce forensic-level polishing through comprehensive root cause analysis

---

## 🎯 Core Principle

**NEVER bypass a gate. Always fix the root cause.**

When any quality gate fails:
1. **STOP** - Do not proceed with workarounds
2. **TRIAGE** - Classify failure priority
3. **DIAGNOSE** - Perform deep root cause analysis
4. **EVIDENCE** - Collect comprehensive artifacts
5. **FIX** - Implement real solution (not gate bypass)
6. **VERIFY** - Confirm gate passes naturally
7. **DOCUMENT** - Archive forensic report

---

## 📋 Quick Reference Decision Tree

```
Gate Failure Detected
        ↓
    Is it CRITICAL? (Correctness/Semantics)
        ↓ YES
    STOP ALL WORK → Forensic Triage → Fix Immediately
        ↓ NO
    Is it HIGH? (Schema/Integration)
        ↓ YES
    Complete Current Task → Forensic Triage → Fix Before Merge
        ↓ NO
    Is it MEDIUM? (Performance)
        ↓ YES
    Document Issue → Forensic Triage → Fix In Next Iteration
        ↓ NO
    Is it LOW? (Lint/Style)
        ↓ YES
    Auto-Fix if Possible → Document → Track for Cleanup
```

---

## 🚨 Gate-Specific Diagnostic Procedures

### 1. Stub Detection Gate (Weight: 15) 🔴 CRITICAL

**When This Fails**:
- Code appears implemented but is actually comment-only
- Function bodies are empty or contain only TODO/FIXME
- Output is suspiciously small (<100 chars real code)
- Metrics are impossible (0.00ms compile time)

**Diagnostic Steps**:

```bash
# 1. Run hallucination detector
node src/utils/hallucination_detector.js

# 2. Examine flagged files
cat [flagged-file] | grep -v "^//" | wc -l  # Count non-comment lines

# 3. Check for stub patterns
grep -r "TODO\|FIXME\|STUB\|PLACEHOLDER" src/

# 4. Generate forensic report
node src/utils/diagnostic-framework.js "Stub Detection" < error-output.txt
```

**Root Cause Checklist**:
- [ ] Function declared but body is empty?
- [ ] Comments describe functionality but code missing?
- [ ] Copy-pasted signature without implementation?
- [ ] Test only validates structure, not behavior?
- [ ] Output file exists but contains only comments?

**Fix Strategy**:
1. **Option A - Implement Fully**: Write complete, tested implementation
2. **Option B - Remove Stub**: Delete incomplete code and references
3. **Option C - Mark WIP**: Add explicit `.wip` suffix and exclude from gates

**NEVER**: Change stub detection threshold to pass without implementing

**Evidence Required**:
- Before/after line counts (non-comment)
- Test coverage report showing behavior validation
- Execution trace proving code runs
- Forensic report documenting implementation

---

### 2. IR Validation Gate (Weight: 10) 🟠 HIGH

**When This Fails**:
- NodeRef pattern doesn't match `^[^_]+_[T01]+$`
- Required fields missing from IR nodes
- Type constraints violated
- Schema version mismatch

**Diagnostic Steps**:

```bash
# 1. Run deep IR analysis
node scripts/debug-ir-schema.js

# 2. Validate specific IR file
node scripts/debug-ir-schema.js --file test/ir/sample.json

# 3. Check NodeRef patterns
grep -r '"ref"' test/ir/*.json | grep -v "_[T01]"

# 4. Generate forensic report
node src/utils/diagnostic-framework.js "IR Validation" < ir-errors.txt
```

**Root Cause Checklist**:
- [ ] NodeRef format incorrect (should be `name_T0`, `name_T1`, etc.)?
- [ ] Missing required field (`type`, `value`, `children`)?
- [ ] Type field has invalid value (not in allowed enum)?
- [ ] Cyclic dependency in node tree?
- [ ] Schema version outdated (`irVersion` field)?

**Fix Strategy**:
1. **NodeRef Issues**: Update node naming to match pattern
2. **Missing Fields**: Add required fields with proper defaults
3. **Type Violations**: Correct type to match schema enum
4. **Cyclic Deps**: Restructure to remove cycles (use references)
5. **Version Mismatch**: Migrate IR to current schema version

**NEVER**: Loosen schema validation rules to pass

**Evidence Required**:
- IR dump showing problematic nodes
- Schema validation report with specific violations
- Before/after IR showing fixes
- Test confirming IR validity

---

### 3. Correctness Tests Gate (Weight: 10) 🔴 CRITICAL

**When This Fails**:
- Test expectations don't match actual output
- Algorithm changes code semantics
- Side effects occur in wrong order
- Edge cases not handled

**Diagnostic Steps**:

```bash
# 1. Run failing test in isolation
npm run test:core -- --grep "specific test name"

# 2. Compare expected vs actual
diff test/expected/output.txt test/actual/output.txt

# 3. Trace execution
node --inspect-brk test/run-specific-test.js

# 4. Generate forensic report
node src/utils/diagnostic-framework.js "Correctness Tests" < test-errors.txt
```

**Root Cause Checklist**:
- [ ] Algorithm optimization changed behavior?
- [ ] Side effect ordering incorrect?
- [ ] Edge case (null, empty, max int) not handled?
- [ ] Dataflow analysis missed dependency?
- [ ] Type coercion introduced unexpected result?

**Fix Strategy**:
1. **Optimization Issue**: Revert optimization, add conservative checks
2. **Ordering Issue**: Fix evaluation order, document dependencies
3. **Edge Case**: Add explicit handling with tests
4. **Dataflow**: Implement comprehensive dependency tracking
5. **Type Issue**: Add explicit type guards

**NEVER**: Change test expectations to match wrong behavior

**Evidence Required**:
- Test failure output with diff
- Dataflow analysis showing dependencies
- Before/after behavior comparison
- New test cases for edge cases
- Forensic report documenting fix

---

### 4. Determinism Verification Gate (Weight: 8) 🟠 HIGH

**When This Fails**:
- Hash differs between runs (run 1 vs run 10)
- Output order varies
- Non-deterministic algorithms used
- Uninitialized variables

**Diagnostic Steps**:

```bash
# 1. Run determinism test
npm run test:determinism

# 2. Generate 10 outputs and compare
for i in {1..10}; do
  node transpile.js input.js > output_$i.txt
done
diff output_*.txt

# 3. Check for random/timestamp usage
grep -r "Math.random\|Date.now\|new Date" src/

# 4. Generate forensic report
node src/utils/diagnostic-framework.js "Determinism Verification" < det-errors.txt
```

**Root Cause Checklist**:
- [ ] Optimization order not deterministic?
- [ ] Hash map iteration used (order varies)?
- [ ] Math.random() or Date.now() called?
- [ ] Uninitialized variable read?
- [ ] Array.sort() without compare function?

**Fix Strategy**:
1. **Optimization Order**: Sort optimizations canonically by rule name
2. **Hash Map**: Convert to sorted array before iteration
3. **Random/Time**: Seed RNG, use fixed timestamp for testing
4. **Uninitialized**: Always initialize variables explicitly
5. **Sort**: Add deterministic compare function

**NEVER**: Skip determinism check or reduce run count

**Evidence Required**:
- Hash values from 10+ runs
- Diff showing variations (if any)
- Source of non-determinism identified
- Fix verification (10 runs identical)
- Forensic report

---

### 5. Performance SLO Gate (Weight: 7) 🟡 MEDIUM

**When This Fails**:
- >5% slowdown from optimization
- Memory usage increased significantly
- O(n²) algorithm introduced
- Excessive allocations

**Diagnostic Steps**:

```bash
# 1. Run performance benchmarks
npm run test:performance

# 2. Profile before/after
node --prof transpile.js input.js
node --prof-process isolate-*.log > profile.txt

# 3. Memory profiling
node --inspect transpile.js
# Open chrome://inspect and take heap snapshot

# 4. Generate forensic report
node src/utils/diagnostic-framework.js "Performance SLO" < perf-errors.txt
```

**Root Cause Checklist**:
- [ ] Optimization adds more work than it saves?
- [ ] N² algorithm introduced accidentally?
- [ ] Excessive object allocations in hot path?
- [ ] Inefficient data structure (array instead of Set)?
- [ ] Missing memoization for repeated work?

**Fix Strategy**:
1. **Slower Optimization**: Disable for specific patterns, measure threshold
2. **N² Issue**: Replace with O(n) or O(n log n) algorithm
3. **Allocations**: Reuse objects, use object pools
4. **Data Structure**: Choose appropriate structure (Map, Set, Array)
5. **Repeated Work**: Add memoization with cache

**NEVER**: Disable performance gates or raise thresholds without justification

**Evidence Required**:
- Before/after benchmarks with statistical significance
- Profiling data showing bottleneck
- Complexity analysis (Big-O notation)
- Fix verification benchmarks
- Forensic report

---

### 6. Integration Tests Gate (Weight: 6) 🟠 HIGH

**When This Fails**:
- Cross-language interop broken
- FFI marshalling fails
- Callback signatures changed
- Round-trip fails (JS→Lua→JS)

**Diagnostic Steps**:

```bash
# 1. Run integration harness
npm run harness

# 2. Test round-trip transpilation
node transpile-js-to-lua.js input.js > output.lua
node transpile-lua-to-js.js output.lua > roundtrip.js
diff input.js roundtrip.js

# 3. Check FFI compatibility
node test-ffi-interop.js

# 4. Generate forensic report
node src/utils/diagnostic-framework.js "Integration Tests" < integration-errors.txt
```

**Root Cause Checklist**:
- [ ] Optimization changed parameter order?
- [ ] FFI expects specific calling convention?
- [ ] Callback signature incompatible?
- [ ] Type conversion breaks interop?
- [ ] Optimization assumes single-language context?

**Fix Strategy**:
1. **Parameter Order**: Preserve original order or add mapping
2. **Calling Convention**: Match FFI expectations (cdecl, stdcall)
3. **Callback Signature**: Maintain ABI compatibility
4. **Type Conversion**: Add explicit marshalling
5. **Single-Language**: Mark optimization as language-specific

**NEVER**: Skip integration tests for "single-language" changes

**Evidence Required**:
- Round-trip test results
- FFI call traces
- ABI compatibility verification
- Cross-language test suite passing
- Forensic report

---

### 7. Linting Rules Gate (Weight: 5) 🟢 LOW

**When This Fails**:
- Unused variables declared
- Missing imports
- Style violations (quotes, semicolons)
- Complexity warnings

**Diagnostic Steps**:

```bash
# 1. Run linter
npm run lint

# 2. Try auto-fix
npm run lint:fix

# 3. Check specific file
npx eslint src/specific-file.js

# 4. Generate forensic report (if manual fix needed)
node src/utils/diagnostic-framework.js "Linting Rules" < lint-errors.txt
```

**Root Cause Checklist**:
- [ ] Variable declared but never used?
- [ ] Function imported but not called?
- [ ] Inconsistent quote style?
- [ ] Function too complex (>15 branches)?
- [ ] Missing semicolons?

**Fix Strategy**:
1. **Unused Variables**: Delete or prefix with `_`
2. **Unused Imports**: Remove import statement
3. **Style**: Run auto-fix or manually correct
4. **Complexity**: Refactor into smaller functions
5. **Semicolons**: Add consistently

**NEVER**: Raise warning budget without fixing warnings first

**Evidence Required**:
- Lint report before/after
- Auto-fix application (if used)
- Manual refactoring (if complex)
- Warning count reduction

---

## 🎬 Forensic Workflow Template

For **every** gate failure, follow this workflow:

### Phase 1: STOP & TRIAGE (5 minutes)

```bash
# 1. Identify which gate failed
npm run verify 2>&1 | grep "FAILED"

# 2. Classify priority
# CRITICAL = correctness/stub → Stop all work
# HIGH = schema/integration → Fix before merge
# MEDIUM = performance → Fix next iteration
# LOW = lint/style → Auto-fix or document

# 3. Estimate effort
# <15 min = LOW complexity → Auto-diagnose
# 15-60 min = MEDIUM → Auto-diagnose with user review
# >60 min = HIGH → Pause for user decision
```

### Phase 2: DIAGNOSE (15-30 minutes)

```bash
# 1. Run diagnostic framework
node src/utils/diagnostic-framework.js "[Gate Name]" < error-output.txt

# 2. Review forensic report
cat artifacts/forensics/forensic_[gate]_[timestamp].md

# 3. Collect additional evidence
# - Git diff showing recent changes
# - Test output with specific failures
# - Profiling data (if performance issue)
# - IR dumps (if validation issue)

# 4. Identify root cause
# - Match against known patterns
# - Run gate-specific diagnostic script
# - Trace through code execution
```

### Phase 3: FIX (30-240 minutes)

```bash
# 1. Choose fix strategy from forensic report
# Option A: Auto-fix (if available and safe)
# Option B: Manual fix (most cases)
# Option C: Deep refactor (complex issues)
# Option D: Revert (if optimization broke things)

# 2. Implement fix
# - Follow gate-specific fix strategy
# - Add tests for edge cases
# - Document why original approach failed

# 3. Verify fix locally
npm run verify  # Should pass now

# 4. Run full test suite
npm test
```

### Phase 4: DOCUMENT (10 minutes)

```bash
# 1. Archive forensic report
git add artifacts/forensics/forensic_*.{json,md}

# 2. Update learned library
# Add pattern to .aitk/context/diagnostics_learned_library.json

# 3. Commit with forensic reference
git commit -m "fix: [description] - Forensic Report: forensic_[id]"

# 4. Update documentation (if needed)
# - Add edge case to test documentation
# - Update known issues list
# - Document fix for future reference
```

---

## 🚀 Quick-Start Prompts for User

When a gate fails with >60 min estimated effort, present these options:

```
🚨 GATE FAILURE: [Gate Name] (Estimated: [X] hours)

Root Cause: [Primary root cause from analysis]

Choose your action:

[A] 🤖 Auto-Diagnose & Fix
    → Agent will attempt automatic fix
    → Review and approve changes before commit
    → Estimated: [Y] minutes

[B] 🔧 Manual Fix (Guided)
    → Agent provides fix strategy and evidence
    → You implement fix manually
    → Agent verifies and documents
    → Estimated: [Z] hours

[C] 🔬 Deep Dive Analysis
    → Run comprehensive diagnostic suite
    → Generate detailed evidence report
    → Identify all contributing factors
    → Estimated: 30-60 minutes

[D] ⏮️  Revert to Last Good State
    → Roll back changes since last passing gate
    → Preserve work in separate branch
    → Start fresh with new approach
    → Estimated: 15 minutes

[E] 📋 Document & Defer
    → Mark as known issue in backlog
    → Continue with other work
    → ⚠️  NOT RECOMMENDED for CRITICAL/HIGH priority

Your choice [A/B/C/D/E]: _
```

---

## 📊 Forensic Report Structure

### JSON Format (Machine-Parseable)

```json
{
  "gate": "IR Validation",
  "priority": "HIGH",
  "timestamp": "2026-01-30T10:30:00Z",
  "errorOutput": "...",
  "rootCauses": [
    "NodeRef pattern mismatch",
    "Missing required field: type"
  ],
  "evidence": [
    {
      "type": "diagnostic_output",
      "source": "debug-ir-schema.js",
      "content": "..."
    }
  ],
  "recommendations": [
    {
      "priority": 1,
      "type": "primary_fix",
      "description": "Fix NodeRef patterns to match ^[^_]+_[T01]+$",
      "estimatedTime": "15-30 min"
    }
  ],
  "estimatedEffort": {
    "minutes": 30,
    "hours": 1,
    "complexity": "MEDIUM"
  }
}
```

### Markdown Format (Human-Readable)

See example in `artifacts/forensics/` directory after running diagnostic framework.

---

## 📚 Learned Patterns Library

**Location**: `.aitk/context/diagnostics_learned_library.json`

**Structure**:
```json
{
  "patterns": [
    {
      "gate": "IR Validation",
      "regex": "NodeRef.*invalid",
      "description": "NodeRef pattern must match ^[^_]+_[T01]+$",
      "confidence": 0.95,
      "fix": "Rename nodes to include tier suffix (_T0, _T1)"
    }
  ],
  "timeEstimates": {
    "NodeRef pattern mismatch": 20,
    "Missing required field": 15,
    "Type constraint violation": 25
  },
  "fixes": [
    {
      "problem": "Stub detected in src/optimizer.js",
      "solution": "Implemented full dataflow analysis",
      "effort": 120,
      "date": "2026-01-30"
    }
  ]
}
```

---

## ✅ Success Criteria

A gate failure is **properly resolved** when:

- [ ] Forensic report generated and archived
- [ ] Root cause identified with >80% confidence
- [ ] Fix implements real solution (not workaround)
- [ ] Gate passes naturally without modification
- [ ] Tests added for edge cases (if applicable)
- [ ] Evidence artifacts committed
- [ ] Learned library updated with pattern
- [ ] Documentation reflects fix

**NEVER** consider a gate "fixed" by:
- ❌ Changing gate requirements/thresholds
- ❌ Disabling validation checks
- ❌ Marking tests as skipped
- ❌ Bypassing with --no-verify
- ❌ Loosening schema constraints
- ❌ Raising warning budgets

---

## 🎓 Training: Forensic Mindset

**Anti-Pattern** (Gate Bypassing):
```bash
# ❌ WRONG: Change gate to pass without fixing
# Edit CI_CD_QUICK_REFERENCE.md:
# - Tier 1: 0 warnings
# + Tier 1: ≤50 warnings  # Loosened to pass
git commit -m "fix: adjust lint thresholds"
```

**Correct Pattern** (Forensic Polishing):
```bash
# ✅ RIGHT: Fix the underlying problem
node src/utils/diagnostic-framework.js "Linting Rules" < lint-errors.txt
# Review forensic report
npm run lint:fix  # Auto-fix what's possible
# Manually refactor complex issues
npm run lint  # Verify gate passes
git add src/ artifacts/forensics/
git commit -m "fix: resolve lint violations - Forensic Report: forensic_lint_20260130"
```

---

**This is forensic-level polishing. We fix problems, we don't hide them.**

# Phase 3: Lint/CI Unblock + Pipeline Hardening - EXECUTION PLAN

**Date**: 2025-12-20  
**Goal**: Unblock CI, harden pipeline, align docs, prepare for feature gaps closure

---

## Priority 1: Lint/CI Unblock (IMMEDIATE - 2-3 hours)

### 1.1 ESLint Status ✅ VERIFIED
- **Current**: 0 errors, 0 warnings (Phase 2 complete)
- **Action**: DONE - No lint backlog

### 1.2 Doc Alignment to PROJECT_STATUS.md (1-2 hours)
**Files to audit/fix**:
- [ ] README.md - Remove legacy claims, link to PROJECT_STATUS.md
- [ ] DEVELOPMENT_WORKFLOW.md - Point to PROJECT_STATUS.md  
- [ ] docs/quick-start/README.md - Add baseline JS→IR→Lua pipeline info
- [ ] docs/status/ - Update all PHASE*.md with honest metrics

**What needs fixing**:
- Remove/annotate Phase 9 "complete" claims
- Remove WASM "complete" claims (not in Phase 1)
- Add caveat: "Pattern/destructuring not yet supported"
- Link PROJECT_STATUS.md as canonical source

### 1.3 CI Pipeline Enhancements (CRITICAL PATH - 1.5 hours)
**Current CI state**: ci.yml, codex-test-gates.yml, parity-ir.yml exist
**Need to add**:
- [ ] npm cache in workflows
- [ ] Node 18/20 matrix
- [ ] Artifact upload (coverage, lint reports)
- [ ] Unified verify gate
- [ ] Lint blocking (already 0 warnings, but gate it)

---

## Priority 2: Pipeline Hardening (3-4 hours)

### 2.1 IR Determinism/Serialization Tests
**Current**: Some test infrastructure exists  
**Need**:
- [ ] Wire `npm run test:determinism` into CI
- [ ] Add serialization coverage for builder patterns
- [ ] Validate IR node IDs are stable across runs

### 2.2 Pattern/Destructuring Coverage
**Current**: Enhanced pipeline exists with pattern support  
**Need**:
- [ ] Add array destructuring parity tests
- [ ] Add object destructuring parity tests
- [ ] Add nested pattern tests
- [ ] Wire into `npm run test:parity`

### 2.3 Edge Case Tests
**Target**: Array/control-flow/function expressions  
**Need**:
- [ ] Array literal edge cases (empty, nested, spread)
- [ ] Control flow (break/continue in different contexts)
- [ ] Function expressions vs declarations
- [ ] Wire into harness

---

## Priority 3: Wiki Consolidation (2-3 hours)

### 3.1 Fill Quick-Start
- [ ] Add JS→IR→Lua pipeline walkthrough
- [ ] Add code example
- [ ] Link to architecture doc

### 3.2 Fill Phase Pages
- [ ] Phase 1: Baseline pipeline (done)
- [ ] Phase 2: Lint burn-down (done)
- [ ] Phase 3: Hardening (this phase)
- [ ] Phase 4+: Roadmap

### 3.3 Fill Timeline
- [ ] Add project milestones
- [ ] Add Phase 1-3 completion dates
- [ ] Add feature roadmap

### 3.4 Update Deprecated Markers
- [ ] Link old docs to new locations
- [ ] Add "See docs/status/" pointers

---

## Priority 4: Feature Gaps (5+ hours - PHASE 3B)

### 4.1 Implement Pattern/Destructuring in Enhanced Pipeline
- [ ] Array destructuring (already partial)
- [ ] Object destructuring (already partial)  
- [ ] Nested patterns
- [ ] Default values
- [ ] Rest elements

### 4.2 High-Signal Edge Case Fixes
- [ ] Array method calls (map, filter, reduce)
- [ ] Spread operator in function calls
- [ ] Control flow in arrow functions
- [ ] Proper scoping for case blocks

---

## Execution Order

1. **NOW (30 min)**: Audit README/status files for misalignment
2. **Next (30 min)**: Fix critical doc claims
3. **Next (1 hr)**: Add CI enhancements (cache, matrix, gating)
4. **Next (1 hr)**: Wire determinism tests into CI
5. **Next (1.5 hrs)**: Add pattern/edge case tests
6. **Next (2 hrs)**: Fill wiki sections
7. **Next (5+ hrs)**: Implement feature gaps

---

## Success Criteria

- [ ] README no longer over-claims
- [ ] PROJECT_STATUS.md is linked from README/DEVELOPMENT_WORKFLOW
- [ ] CI shows npm cache working
- [ ] CI shows Node 18/20 matrix
- [ ] Artifacts uploaded in CI
- [ ] npm run lint is gated in CI (blocking on failure)
- [ ] npm run test:determinism passes in CI
- [ ] Pattern tests integrated into parity
- [ ] Wiki quick-start filled with examples
- [ ] All Phase docs updated with honest metrics


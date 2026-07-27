# Phase 3.5 Quick Reference

**Phase**: 3.5 Interoperability  
**Date**: January 31, 2026  
**Status**: ✅ Complete

---

## Modules

### FFI Analyzer
- File: `src/optimizers/javascript/interop/ffi-analyzer.js`
- Purpose: Analyze foreign-function calls and estimate overhead.
- Key Output: `ffiCalls[]`

### Boundary Optimizer
- File: `src/optimizers/javascript/interop/boundary-optimizer.js`
- Purpose: Reduce boundary crossings (batching, hoisting, fusion).
- Key Output: `opportunities[]`, `estimatedReduction`

### Marshaling Optimizer
- File: `src/optimizers/javascript/interop/marshaling-optimizer.js`
- Purpose: Optimize data marshaling, zero-copy detection, pooling.
- Key Output: `strategy`, `metrics`, `estimatedReduction`

### Type Converter
- File: `src/optimizers/javascript/interop/type-converter.js`
- Purpose: Safe type mapping across JS/Lua/OCaml.
- Key Output: `conversions[]`, `recommendations[]`

---

## Typical Pipeline

1. **FFI Analyzer** → identify calls
2. **Boundary Optimizer** → reduce boundary crossings
3. **Marshaling Optimizer** → zero-copy & pooling
4. **Type Converter** → safe mapping + recommendations

---

## Inputs & Outputs (Quick View)

| Module | Required Inputs | Outputs |
|--------|-----------------|---------|
| FFI Analyzer | `ir.program` | `ffiCalls[]` |
| Boundary Optimizer | `ffiCalls[]` | `opportunities[]`, `estimatedReduction` |
| Marshaling Optimizer | `ffiCalls[]` | `strategy`, `metrics`, `estimatedReduction` |
| Type Converter | `typeConversions[]` or `ffiCalls[]` | `conversions[]`, `recommendations[]` |

---

## IR Inputs

- `ir.program` (required)
- `ir.ffiCalls[]` for boundary and marshaling
- `ir.typeConversions[]` for explicit type conversions

---

## Key Performance Metrics

- FFI Analyzer: 2.18ms (100 calls)
- Boundary Optimizer: 1.59ms (50 boundaries)
- Marshaling Optimizer: 0.72ms (100 calls)
- Type Converter: 1.29ms (100 conversions)

---

## Verification Artifacts

Per-task forensic reports:
- `artifacts/forensics/phase3.5/task5.1/GATE_VERIFICATION_COMPLETE.md`
- `artifacts/forensics/phase3.5/task5.2/GATE_VERIFICATION_COMPLETE.md`
- `artifacts/forensics/phase3.5/task5.3/GATE_VERIFICATION_COMPLETE.md`
- `artifacts/forensics/phase3.5/task5.4/GATE_VERIFICATION_COMPLETE.md`
- `artifacts/forensics/phase3.5/task5.5/GATE_VERIFICATION_COMPLETE.md`

---


---

## Gate Verification (5 Gates)

1. Correctness
2. Determinism
3. IR Validation
4. Performance
5. Integration

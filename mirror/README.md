# Project Mirror (Option B)

Project Mirror is the dogfooding path for LUASCRIPT: a minimal but evolving set of canon-like modules written in LUASCRIPT itself, verified by a harness that compiles (and optionally runs) each module. This starts with a limited canon slice and grows toward full Clarity Super Canon parity.

## What this is now (v1)
- **Harness + expanded canon modules** (Option B evolution)
- v0 modules: manifest, smoke, metrics, canary (Phase 1 baseline)
- v1 additions: edge cases, parity, determinism, IR stability, performance (canonical patterns)
- Designed to evolve as LUASCRIPT gains features and optimizations

## Current modules

### v0 (Baseline - Phase 1 safe)
- mirror_manifest.ls → metadata and readiness flags
- mirror_smoke.ls → loops, arithmetic, basic operators
- mirror_metrics.ls → string operations, simple state
- mirror_canary.ls → branching, equality, boolean logic

### v1 (Canon-aligned - enhanced patterns)
- mirror_edge_cases.ls → array operations, nested logic, iteration
- mirror_parity.ls → recursive functions, semantic equivalence (JS ↔ Lua)
- mirror_determinism.ls → reproducible computation, factorial
- mirror_ir_stable.ls → IR canonicalization, control flow analysis
- mirror_performance.ls → performance baseline, sum computation

## Harness behavior
The harness compiles each LUASCRIPT module using the Python compiler and can optionally execute the compiled Lua.

- **Compile-only (default):**
  - `npm run test:mirror`
- **Compile + run:**
  - `MIRROR_RUN=1 npm run test:mirror`

## Evolution roadmap

| Version | Modules | Focus | Timeline |
|---------|---------|-------|----------|
| v0 | 4 | Phase 1 baseline, compiler smoke tests | ✅ COMPLETE |
| v1 | 9 | Canon-aligned patterns, parity/determinism | 🔄 IN PROGRESS |
| v2 | 20+ | Destructuring, spread, enhanced IR | Near-term |
| v3 | 50+ | Full Canon parity, performance benchmarks | Future |
| v4 | Canon mirror | Complete Canon rewrite in LUASCRIPT | Long-term |

## Quality gates
- Must pass `npm run test:mirror` before changes are accepted.
- Must remain compatible with current parser capabilities.
- Optional run mode should remain green on systems with Lua/LuaJIT.
- Each new module tests a specific canon pattern or optimization.

## Implementation notes

### Module Categories
1. **Baseline (v0):** Compiler smoke tests and basic syntax verification
2. **Edge Cases:** Array/object access, nested conditions, iteration patterns
3. **Parity:** JS semantics → Lua semantics verification (recursive functions, closures)
4. **Determinism:** Reproducible computation across multiple runs
5. **IR Validation:** Intermediate representation canonicalization and lowering
6. **Performance:** Optimization baselines and pipeline efficiency
7. **Enhanced:** Destructuring, spread, template literals (future)

### Adding New Modules
1. Create `.ls` file in `mirror/modules/`
2. Use only syntax supported by current LUASCRIPT phase
3. Include brief comment with test goal and assertions
4. Run `npm run test:mirror` to verify compilation
5. Document in this README under appropriate category


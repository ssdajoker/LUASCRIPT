# LUASCRIPT Project Status (Canonical)
Last updated: 2025-01-XX (Quality Gates & Performance Tracking Active)  
Source of truth for project health, test posture, and feature gaps. Link back from `README.md` and `DEVELOPMENT_WORKFLOW.md` to avoid divergent claims.

## Snapshot
- Baseline JS→IR→Lua pipeline (Phase1) passes harness/parity smoke; array destructuring and richer patterns are not yet supported in the Phase1 parser.
- **Enhanced pipeline** (esprima + enhanced lowerer/emitter) **fully operational** with 73/73 tests passing (100%). Dedicated CI job runs smoke + parity subset + determinism under `LUASCRIPT_USE_ENHANCED_IR=1`. Enhanced IR lowering now preserves user identifiers across destructuring/async/generator/class constructs (see `src/ir/lowerer-enhanced.js`, `src/ir/lowerer.js`), and emitters auto-inject coroutine helpers only when required (`src/ir/emitter-enhanced.js`, `src/ir/emitter.js`). See [ENHANCED_MODE.md](ENHANCED_MODE.md) for details.
- **Refactoring Update**: `src/ir/emitter-enhanced.js` and `src/ir/lowerer-enhanced.js` have been refactored to remove duplicates and fix syntax errors. `src/ir/emitter.js` has been updated with missing helper methods to ensure compatibility with Phase 1 tests. Canonical IR nodes now validate JSON payloads and surface clearer factory errors (`src/ir/nodes.js`).
- Test+tools entry points live in `package.json`: `npm test`, `npm run harness`, `npm run ir:validate:all`, `npm run test:parity`, `npm run refactor:phase3`, `npm run refactor:all`, `npm run test:coverage`.
- Performance tracking via `luascript_performance_benchmark.py` and `run_bench.sh`; artifacts land in `artifacts/`.

## Health Checkpoints
- **Quality Gates (CI-enforced)**:
	- Status consistency: Docs must reference PROJECT_STATUS.md as source of truth
	- Performance regression gate: ±15% tolerance on 5 core benchmarks (`.perf-baseline.json`)
	- Coverage quality bar: Baseline thresholds (23.6% lines, 19% functions, 37% branches)
	- Diff coverage: New code must meet 70% coverage on PRs
- Determinism: `npm run test:determinism` (IR stability across runs).
- IR validity: `npm run ir:validate:all` (schema + semantic checks).
- Parity: `npm run test:parity` (JS↔Lua behavior checks).
- Refactor/Enhanced flow: `npm run refactor:all` (validator + lint + phase3 parity).
- Coverage: `npm run test:coverage` (nyc + test suite).

## Known Gaps / Risks
- **✅ RESOLVED**: Pattern/destructuring support fully implemented in enhanced pipeline with 14 comprehensive tests (array, object, nested, rest, computed properties). Phase1 still lacks pattern support.
- Static warnings backlog captured in `static_warnings*.txt`; lint/format enforcement is not yet CI-blocking.
- Documentation has legacy, contradictory claims (e.g., Phase9/WASM “complete”). Use this file as the single status source until README/docs are aligned.
- CI/permissions: review `GITHUB_INTEGRATION_STATUS.md` and `.github/workflows/` for current gating; determinism/fuzz gates are not enforced yet.

## Next Steps (priority-ordered)
1) Align docs to this canonical status; prune or annotate outdated claims in README and related status PDFs/MDs.  
2) Burn down static warnings; add lint/format gates (JS/Lua) and make them blocking in CI.  
3) Consolidate IR builder pattern (see `GENERATOR_IMPLEMENTATION.md`) and harden validation/determinism hooks along the main pipeline.  
4) Implement documented feature gaps (array/control-flow/function expression edges from `ENHANCED_TRANSPILER_README.md`) with tests wired into `npm run harness` + parity.  
5) Harden CI: determinism + fuzz smoke + parity + coverage gates; pin runtime configs (`runtime_runtime.json`, `src_transpiler.json`) with schema/hash checks.

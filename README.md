# LUASCRIPT

Status source of truth: see `PROJECT_STATUS.md` for current health, gaps, and roadmap. Documentation hub: `docs/INDEX.md`.

## Current status (snapshot)
- **Canonical/Phase1 pipeline**: Passes harness/parity smoke. Pattern/destructuring support remains an open gap reserved for the enhanced path.
- **Enhanced pipeline**: Fully operational with 73/73 tests passing under `LUASCRIPT_USE_ENHANCED_IR=1`; helper injection is conditional on coroutine usage and IR validation has stricter JSON checks.
- **Quality gates**: Determinism, IR validation, parity, coverage, and static Lua warnings now ship with blocking entry points in `package.json` (see `npm run static:warnings`). Lint/format remain tracked in CI and enforced for IR code.

### Doc truth source
- Canonical health, gaps, and roadmap: [PROJECT_STATUS.md](PROJECT_STATUS.md)
- Phase checklist source: [CHECKLIST_PHASES.md](CHECKLIST_PHASES.md)
- Note: Phase 1 (baseline) is still open for pattern/destructuring support, and static warnings/lint/format enforcement remain outstanding; defer to the above for current claims and avoid optimistic completion percentages elsewhere.

## What this is
LUASCRIPT is a JavaScript-to-Lua transpiler with an IR pipeline, parity tests, and validation gates.

### IR pipelines (what changed)
- **Canonical/Phase1 (`src/ir/lowerer.js`, `src/ir/emitter.js`)**: handles core syntax and includes basic destructuring support (array/object). Threads identifier-preserving class/async/generator lowering into the IR without losing naming.
- **Enhanced (`src/ir/lowerer-enhanced.js`, `src/ir/emitter-enhanced.js`)**: mirrors the canonical path but adds helper injection for coroutines only when async/await or async generators appear, reducing Lua preamble noise. Supports advanced patterns.
- **Shared IR definitions (`src/ir/nodes.js`)**: stricter JSON validation and clearer factory errors to catch malformed IR earlier in CI/local runs.
- **Canonical/Phase1 (`src/ir/lowerer.js`, `src/ir/emitter.js`)**: Handles core syntax for the baseline pipeline; pattern/destructuring support is deferred to the enhanced path. Helper preambles (await/async generator) are only injected when IR nodes or metadata request them.
- **Enhanced (`src/ir/lowerer-enhanced.js`, `src/ir/emitter-enhanced.js`)**: Mirrors the canonical path with a per-transpilation IRBuilder reset and coroutine helper injection that matches the canonical emitter gating, preserving user identifiers across destructuring/async/generator/class constructs and reducing Lua preamble noise.
- **Shared IR definitions (`src/ir/nodes.js`)**: Stricter JSON validation and clearer factory errors to catch malformed IR earlier in CI/local runs.

### Phase checklist deltas (from `CHECKLIST_PHASES.md`)
- **Phase 1 (Core transpiler)**: Baseline pipeline is operational and passes harness/parity smoke, but pattern/destructuring support remains open for the baseline parser.
- **Phase 1 acceptance (linting)**: Lua static warnings are at zero with a blocking `npm run static:warnings` gate; the snapshot files in the repo reflect clean runs.
- **Phase 2 (Runtime system)**: Runtime feature work and gating are pending; align future claims with `PROJECT_STATUS.md` before marking checklist items complete.
- **Phase 3 (Advanced features/CI hardening)**: Current focus. Active tasks track the `PROJECT_STATUS.md` next steps: doc alignment, lint/format gates, IR builder consolidation, feature-gap coverage, and CI determinism/parity/coverage gates. Static Lua warnings are fully burned down with a blocking CI gate.
- **Phase 4 (Ecosystem integration)**: Not started; defer claims until runtime hooks from Phases 2–3 are available.

## How to use locally
- Install: npm ci
- Quick gate (no lint): npm run verify (harness + IR validate + parity + determinism)
- Pre-commit helpers: npm run format:check and npm run test:smoke (also run automatically via Husky)
- Full tests: npm test
- More scripts: see package.json

## Documentation map
- Wiki home: docs/INDEX.md
- CI/CD: docs/ci-cd/README.md
- Quick start: docs/quick-start/README.md
- Architecture: docs/architecture/README.md
- Timeline / journey: docs/timeline/INDEX.md
- Deprecated/legacy: docs/deprecated/README.md

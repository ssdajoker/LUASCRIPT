# LUASCRIPT

Status source of truth: see `PROJECT_STATUS.md` for current health, gaps, and roadmap. Documentation hub: `docs/INDEX.md`.

## Current status (snapshot)
- **Canonical/Phase1 pipeline**: Passes harness/parity smoke, but the Phase1 parser still lacks pattern/destructuring support; see `PROJECT_STATUS.md` for open gaps.
- **Enhanced pipeline**: Fully operational with 73/73 tests passing under `LUASCRIPT_USE_ENHANCED_IR=1`; helper injection is conditional on coroutine usage and IR validation has stricter JSON checks.
- **Quality gates**: Determinism, IR validation, parity, and coverage entry points live in `package.json`; static warning cleanup and lint/format enforcement remain in progress.

## What this is
LUASCRIPT is a JavaScript-to-Lua transpiler with an IR pipeline, parity tests, and validation gates.

### IR pipelines (what changed)
- **Canonical/Phase1 (`src/ir/lowerer.js`, `src/ir/emitter.js`)**: handles core syntax and now threads identifier-preserving destructuring + class/async/generator lowering into the IR without losing naming. Helper preambles (await/async generator) are only injected when IR nodes or metadata request them.
- **Enhanced (`src/ir/lowerer-enhanced.js`, `src/ir/emitter-enhanced.js`)**: mirrors the canonical path with a per-transpilation IRBuilder reset and coroutine helper injection that matches the canonical emitter gating, reducing Lua preamble noise.
- **Canonical/Phase1 (`src/ir/lowerer.js`, `src/ir/emitter.js`)**: handles core syntax for the baseline pipeline; pattern/destructuring support is deferred to the enhanced path.
- **Enhanced (`src/ir/lowerer-enhanced.js`, `src/ir/emitter-enhanced.js`)**: mirrors the canonical path but adds helper injection for coroutines only when async/await or async generators appear, reducing Lua preamble noise and preserving user identifiers across destructuring/async/generator/class constructs.
- **Shared IR definitions (`src/ir/nodes.js`)**: stricter JSON validation and clearer factory errors to catch malformed IR earlier in CI/local runs.

## How to use locally
- Install: npm ci
- Quick gate: npm run verify (harness + IR validate + parity + determinism)
- Full tests: npm test
- More scripts: see package.json

## Documentation map
- Wiki home: docs/INDEX.md
- CI/CD: docs/ci-cd/README.md
- Quick start: docs/quick-start/README.md
- Architecture: docs/architecture/README.md
- Timeline / journey: docs/timeline/INDEX.md
- Deprecated/legacy: docs/deprecated/README.md

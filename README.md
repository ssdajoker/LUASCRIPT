# LUASCRIPT

Status source of truth: see `PROJECT_STATUS.md` for current health, gaps, and roadmap. Documentation hub: `docs/INDEX.md`.

## What this is
LUASCRIPT is a JavaScript-to-Lua transpiler with an IR pipeline, parity tests, and validation gates.

### IR pipelines (what changed)
- **Canonical/Phase1 (`src/ir/lowerer.js`, `src/ir/emitter.js`)**: handles core syntax and includes basic destructuring support (array/object). Threads identifier-preserving class/async/generator lowering into the IR without losing naming.
- **Enhanced (`src/ir/lowerer-enhanced.js`, `src/ir/emitter-enhanced.js`)**: mirrors the canonical path but adds helper injection for coroutines only when async/await or async generators appear, reducing Lua preamble noise. Supports advanced patterns.
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

# Quick Start

**Status**: ACTIVE  
**Phase**: Baseline pipeline operational (Phase 1)  
**Last updated**: 2025-12-20

Get set up, run a transpilation, and verify locally.

## What works (Phase 1)

- ✅ JavaScript → IR → Lua transpilation
- ✅ Basic expressions, statements, functions, classes
- ✅ Async/await, generators, try/catch
- ✅ Array and object literals
- ⏳ **Pattern/destructuring**: Planned Phase 3

## Install

1. Clone and cd into the repo
2. Install dependencies: `npm ci`
3. (Optional) Install Lua/LuaJIT for Lua-side verification

## Your first transpilation

### Quick sanity check

```bash
# Run full local gate (harness + IR validate + parity + determinism)
npm run verify

# Expected: All tests pass ✓
```

### Manual transpile example

```bash
# Transpile a simple function
node -e "
const transpiler = require('./src');
const js = 'function add(x,y) { return x+y; }';
const result = transpiler.transpile(js);
console.log(result);
"
```

### See IR pipeline in action

```bash
# Golden IR comparisons
npm run ir:emit:goldens

# IR validation on test cases
npm run ir:validate:all

# Parity check (JS vs Lua behavior)
npm run test:parity
```

## Common workflows

- **Full test suite**: `npm test`
- **Quick verification**: `npm run verify`
- **Coverage report**: `npm run test:coverage`
- **Determinism check**: `npm run test:determinism`
- **Lint check**: `npm run lint`

## Baseline pipeline walkthrough

### 1. Parser phase

- Input: JavaScript code string
- Process: ESTree AST parsing (via `src/parser.js`)
- Output: AST with id/symbol metadata

### 2. Lowering phase

- Input: AST
- Process: Convert to canonical IR (via `src/ir/lowerer.js`)
- IR operations: variable decl, function decl, blocks, expressions
- Output: Deterministic IR with stable IDs

### 3. Validation

- Check IR schema correctness
- Validate node references
- Determinism verification

### 4. Emission (Lua)

- Input: IR
- Process: Generate Lua code (via `src/ir/emitter.js`)
- Output: Lua code string

### 5. Execution (optional)

- Run Lua via LuaJIT
- Compare behavior with JavaScript

## Known limitations (Phase 1)

- No pattern/destructuring (`const [a,b] = arr`)
- No spread operator in complex contexts
- Limited module/import support (Phase 4+)
- No TypeScript support

See [PROJECT_STATUS.md](../../PROJECT_STATUS.md) for roadmap.

## Troubleshooting

**Tests failing?**
- Check Node version: `node --version` (need 16+)
- Run `npm run verify` for diagnostic output
- See [troubleshooting.md](../development/troubleshooting.md)

**Lua output looks wrong?**
- Check [docs/architecture/README.md](../architecture/README.md) for emission details
- Run `npm run test:parity` to compare JS vs Lua behavior

## What's next

- Explore [docs/architecture/README.md](../architecture/README.md) for IR design
- Read [docs/ci-cd/README.md](../ci-cd/README.md) for deployment
- Check [PROJECT_STATUS.md](../../PROJECT_STATUS.md) for Phase 3+ roadmap

---
**Navigation**: ← Home | ↑ Index | Architecture →

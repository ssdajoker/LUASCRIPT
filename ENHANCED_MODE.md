# Enhanced Pipeline Mode

The LuaScript transpiler includes an **Enhanced IR Pipeline** that provides advanced support for modern JavaScript features, including destructuring patterns, control-flow constructs, and complex expression handling.

## Features

The enhanced pipeline provides comprehensive support for:

### Pattern Support
- **Array Destructuring**: With defaults, rest elements, and nested patterns
- **Object Destructuring**: With renaming, defaults, computed properties, and rest elements
- **Parameter Destructuring**: In functions, arrow functions, and methods
- **Assignment Destructuring**: To existing variables

### Control Flow
- **For-of loops**: With destructuring support
- **For-in loops**: With proper iteration semantics
- **Try-catch-finally**: Complete exception handling
- **Throw statements**: Error propagation
- **Switch statements**: With fall-through support
- **Labeled statements**: With break/continue targeting

### Modern Syntax
- **Async/await**: Full async function support
- **Classes**: With inheritance, static methods, getters/setters
- **Template literals**: With expression interpolation
- **Spread/rest operators**: In arrays, objects, and parameters

## Usage

### Enabling Enhanced Mode

Set the `LUASCRIPT_USE_ENHANCED_IR` environment variable to enable enhanced pipeline:

```bash
# Unix/Linux/macOS
export LUASCRIPT_USE_ENHANCED_IR=1

# Windows PowerShell
$env:LUASCRIPT_USE_ENHANCED_IR=1

# Windows CMD
set LUASCRIPT_USE_ENHANCED_IR=1
```

### Running Enhanced Tests

```bash
# Run enhanced pipeline tests
npm run refactor:phase3

# Run with enhanced mode enabled
LUASCRIPT_USE_ENHANCED_IR=1 npm run verify
```

### Verify Command Integration

The enhanced pipeline is automatically tested when running `npm run verify` with the flag enabled:

```bash
# Standard verify (skips enhanced mode)
npm run verify

# Verify with enhanced mode
LUASCRIPT_USE_ENHANCED_IR=1 npm run verify
```

## Test Coverage

The enhanced pipeline includes **73 comprehensive tests** covering:

- **10 async/await tests**: Declaration, expressions, IIFE, error handling
- **10 class tests**: Declarations, methods, inheritance, static, getters/setters
- **14 destructuring tests**: Arrays, objects, nested, rest, computed properties
- **14 control-flow tests**: Loops, exceptions, switches, logical operators
- **11 template literal tests**: Expressions, newlines, nesting, complex interpolation
- **14 spread/rest tests**: Arrays, objects, functions, method calls

**Current Status**: ✅ **73/73 tests passing (100%)**

## CI Integration

The enhanced pipeline is tested in CI as a smoke test to ensure compatibility:

1. **On every push/PR**: Enhanced pipeline tests run on all platforms (Linux, macOS, Windows)
2. **Multiple Node versions**: Tested on Node 18 and 20
3. **Blocking status**: Enhanced tests must pass for CI to succeed

## Architecture

### Components

```
Enhanced Pipeline
├── src/ir/lowerer-enhanced.js    # AST → Enhanced IR
├── src/ir/emitter-enhanced.js    # Enhanced IR → Lua
└── tests/parity/                 # Parity test suite
    ├── run_phase3.js             # Test orchestrator
    ├── async-await.test.js
    ├── classes.test.js
    ├── destructuring.test.js
    ├── control-flow.test.js
    ├── template-literals.test.js
    └── spread-rest.test.js
```

### Enhanced Lowerer

The **EnhancedLowerer** (`src/ir/lowerer-enhanced.js`) converts JavaScript AST to enhanced IR with:

- **Scope Management**: Proper lexical scoping
- **Temp Variables**: Automatic temporary variable generation
- **Pattern Lowering**: Destructuring pattern expansion
- **Control-Flow Lowering**: Advanced loop and exception handling

Key methods:
- `lowerArrayPattern()`: Array destructuring
- `lowerObjectPattern()`: Object destructuring
- `lowerGeneratorDeclaration()`: Generator function support
- `lowerStatement()`: Statement lowering dispatch

### Enhanced Emitter

The **EnhancedEmitter** (`src/ir/emitter-enhanced.js`) generates Lua code from enhanced IR with optimizations for:

- Pattern destructuring
- Async/await constructs
- Class hierarchies
- Template literal interpolation

## Examples

### Array Destructuring

```javascript
// JavaScript
const [a, b, ...rest] = [1, 2, 3, 4];
const [x = 10, y = 20] = arr;
```

### Object Destructuring

```javascript
// JavaScript
const { name, age } = person;
const { firstName: first, lastName: last } = person;
const { user: { name, age } } = data;
```

### Async/Await

```javascript
// JavaScript
async function fetchData() {
    const result = await fetch(url);
    return result.json();
}
```

### Classes

```javascript
// JavaScript
class Animal {
    constructor(name) {
        this.name = name;
    }
    
    speak() {
        console.log(`${this.name} makes a sound`);
    }
}

class Dog extends Animal {
    speak() {
        console.log(`${this.name} barks`);
    }
}
```

## Development

### Adding Enhanced Features

1. **Implement lowering** in `src/ir/lowerer-enhanced.js`
2. **Add emission** in `src/ir/emitter-enhanced.js`
3. **Write tests** in `tests/parity/*.test.js`
4. **Run tests**: `npm run refactor:phase3`

### Testing Strategy

- **Parity tests**: Ensure enhanced mode produces valid output
- **Smoke tests**: Verify no regressions in CI
- **Determinism**: Enhanced IR generation is deterministic

## Troubleshooting

### Enhanced Tests Failing

```bash
# Run enhanced tests with verbose output
LUASCRIPT_USE_ENHANCED_IR=1 node tests/parity/run_phase3.js
```

### Feature Not Supported

Check test coverage:
- Review `tests/parity/*.test.js` for supported patterns
- Consult `src/ir/lowerer-enhanced.js` for implementation

### CI Failures

Enhanced pipeline failures in CI indicate:
- Platform-specific issues
- Node version incompatibilities
- Breaking changes to core transpiler

Check CI logs and run locally with matching Node version.

## Roadmap

- ✅ **Phase 3A**: Docs alignment, CI/CD polish
- ✅ **Phase 3B**: Destructuring patterns (36 tests, 100% passing)
- ✅ **Enhanced Pipeline**: Wire into verify with flag (73 tests, 100% passing)
- ⏳ **Phase 4**: Additional control-flow patterns
- ⏳ **Phase 5**: Performance optimizations

## Status

| Category | Tests | Status |
|----------|-------|--------|
| Async/Await | 10 | ✅ 100% |
| Classes | 10 | ✅ 100% |
| Destructuring | 14 | ✅ 100% |
| Control-Flow | 14 | ✅ 100% |
| Template Literals | 11 | ✅ 100% |
| Spread/Rest | 14 | ✅ 100% |
| **Total** | **73** | **✅ 100%** |

## See Also

- [PHASE3_COMPLETION_REPORT.md](PHASE3_COMPLETION_REPORT.md) - Phase 3 completion details
- [DESTRUCTURING_IMPLEMENTATION.md](DESTRUCTURING_IMPLEMENTATION.md) - Destructuring implementation guide
- [IR_INTEGRATION_PHASE4.md](IR_INTEGRATION_PHASE4.md) - Next phase roadmap
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Overall project status

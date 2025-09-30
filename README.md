
# LUASCRIPT

An experimental programming language that transpiles JavaScript-like syntax to Lua, designed for high-performance execution with LuaJIT.

## Phase 1B: Critical Runtime Compatibility Fixes ✅

LUASCRIPT has implemented critical runtime compatibility fixes to ensure seamless JavaScript-to-Lua transpilation:

### 🔧 Fixed Issues

1. **String Concatenation**: JavaScript `+` operator properly translates to Lua `..` for strings
2. **Logical Operators**: `||` → `or`, `&&` → `and`, `!` → `not`
3. **Equality Operators**: `===` → `==`, `!==` → `~=`, `!=` → `~=`
4. **Runtime Library**: Full integration of JavaScript-compatible functions like `console.log`

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/ssdajoker/LUASCRIPT.git
cd LUASCRIPT

# Make sure you have Node.js and LuaJIT installed
npm install
```

### Basic Usage

```bash
# Transpile a JavaScript file to Lua
node src/transpiler.js input.js output.lua

# Run the demo
npm run demo

# Run tests
npm test
```

### Example

**JavaScript Input:**
```javascript
let name = "World";
let message = "Hello, " + name + "!";
let isGreeting = message !== "" && name !== "";
console.log(message);
```

**Transpiled Lua Output:**
```lua
-- LUASCRIPT Runtime Library Integration
local runtime = require('runtime.runtime')
local console = runtime.console
local JSON = runtime.JSON
local Math = runtime.Math

local name = "World"
local message = "Hello, " .. name .. "!"
local isGreeting = message ~= "" and name ~= ""
console.log(message)
```

## Features

### ✅ Implemented (Phase 1B)

- **String Operations**: Proper concatenation with `..` operator
- **Logical Operations**: Full support for `or`, `and`, `not`
- **Equality Checks**: Correct `==` and `~=` operators
- **Console Functions**: `console.log()`, `console.error()`, `console.warn()`, `console.info()`
- **Variable Declarations**: `var`, `let`, `const` → `local`
- **Function Declarations**: JavaScript functions → Lua functions
- **Basic Control Flow**: `if/else`, `while`, `for` loops
- **Runtime Library**: JSON, Math, String, Array utilities

### 🔄 In Progress

- Advanced object handling
- Async/await support
- Module system
- Error handling improvements

### ⏳ Planned

- JIT compilation optimizations
- IDE tooling support
- Package manager
- Advanced type system

## Project Structure

```
LUASCRIPT/
├── src/
│   └── transpiler.js          # Main transpiler implementation
├── runtime/
│   └── runtime.lua           # Lua runtime library
├── test/
│   └── test_transpiler.js    # Test suite
├── examples/
│   └── phase1b_demo.js       # Demo showcasing Phase 1B fixes
├── package.json              # Node.js package configuration
└── README.md                 # This file
```

## Development Status

**Current Phase**: Week 5 - Phase 1A-1D Critical Stabilization  
**Phase 1B Status**: ✅ **COMPLETE** - All critical runtime compatibility fixes implemented

### Phase 1B Achievements

- ✅ String concatenation operator translation (`+` → `..`)
- ✅ Logical operator translation (`||` → `or`, `&&` → `and`)
- ✅ Equality operator translation (`===` → `==`, `!==` → `~=`)
- ✅ Runtime library integration (console.log, JSON, Math, etc.)
- ✅ Comprehensive test suite with execution validation
- ✅ Working demo examples

## Testing

Run the comprehensive test suite:

```bash
npm test
```

The test suite validates:
- String concatenation fixes
- Logical operator translations
- Equality operator translations
- Runtime library integration
- Complex expressions combining multiple fixes
- Actual LuaJIT execution of transpiled code

## Contributing

LUASCRIPT is in active development. For contributing:

1. Check the current phase status in `PROJECT_STATUS.md`
2. Review `TODO.md` for upcoming tasks
3. Ensure all tests pass before submitting changes
4. Follow the established code style and patterns

## Requirements

- **Node.js**: >= 12.0.0 (for transpiler)
- **LuaJIT**: Latest version (for execution)
- **Operating System**: Linux, macOS, Windows

## License

MIT License - see `LICENSE` file for details.

## Links

- **Repository**: https://github.com/ssdajoker/LUASCRIPT
- **Issues**: https://github.com/ssdajoker/LUASCRIPT/issues
- **Documentation**: Coming soon

---

**Note**: LUASCRIPT is an experimental language in active development. Phase 1B critical runtime compatibility fixes are now complete and tested. The transpiler successfully handles the most common JavaScript-to-Lua translation issues that prevent code execution in LuaJIT.

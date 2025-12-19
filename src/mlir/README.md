
# LUASCRIPT MLIR Dialect

This directory contains the MLIR (Multi-Level Intermediate Representation) dialect implementation for LUASCRIPT.

## Overview

The MLIR dialect provides a structured intermediate representation that enables:
- High-level optimizations
- Lowering to LLVM IR
- Multiple backend targets
- Extensible operation set

## Structure

```
src/mlir/
├── README.md           # This file
├── dialect.js          # Dialect definition and registration
├── operations.js       # Operation definitions
├── types.js            # Type system
├── lowering.js         # IR to MLIR lowering
├── passes/             # Optimization passes
│   ├── canonicalize.js
│   ├── inline.js
│   └── fold.js
└── llvm_lowering.js    # MLIR to LLVM IR lowering
```

## Operations

### Core Operations
- `luascript.func` - Function definition
- `luascript.call` - Function call
- `luascript.return` - Return statement
- `luascript.constant` - Constant value

### Memory Operations
- `luascript.alloc` - Variable allocation
- `luascript.load` - Variable load
- `luascript.store` - Variable store

### Arithmetic Operations
- `luascript.add` - Addition
- `luascript.sub` - Subtraction
- `luascript.mul` - Multiplication
- `luascript.div` - Division

### Control Flow
- `luascript.if` - Conditional
- `luascript.while` - Loop
- `luascript.br` - Branch

### Lua-Specific
- `luascript.table_new` - Create table
- `luascript.table_get` - Get table element
- `luascript.table_set` - Set table element

## Usage

```javascript
const { LuaScriptDialect } = require('./mlir/dialect');
const { lowerIRToMLIR } = require('./mlir/lowering');

// Parse JavaScript to canonical IR
const ir = parseAndLower(jsCode);

// Lower to MLIR
const mlir = lowerIRToMLIR(ir);

// Apply optimizations
const optimized = applyMLIRPasses(mlir);

// Lower to LLVM IR
const llvmIR = lowerMLIRToLLVM(optimized);
```

## Status

🚧 **Under Development** 🚧

Currently implementing:
- [ ] Dialect definition
- [ ] Operation set
- [ ] Type system
- [ ] IR to MLIR lowering
- [ ] Optimization passes
- [ ] LLVM lowering

Target completion: 3-4 weeks

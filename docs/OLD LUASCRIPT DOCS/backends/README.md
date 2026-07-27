# LUASCRIPT Compiler Backends

This directory contains documentation for the LUASCRIPT compiler backends.

## Overview

LUASCRIPT now features a complete multi-backend compilation system that can target:

1. **WebAssembly (WASM)** - Direct compilation to WebAssembly bytecode
2. **MLIR** - Multi-Level Intermediate Representation for advanced optimizations
3. **LLVM IR** - LLVM Intermediate Representation with SSA form

All backends consume the canonical LUASCRIPT IR and provide optimized code generation.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Source Languages                        │
│           (JavaScript, Lua, TypeScript)                   │
└────────────┬─────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────┐
│            Language-Specific Compilers                    │
│        (js-to-ir, lua-to-ir, ts-to-ir)                   │
└────────────┬─────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────┐
│               LUASCRIPT Canonical IR                      │
│         (Typed, Validated, Optimized)                     │
└────────┬──────────────┬──────────────┬───────────────────┘
         │              │              │
         ▼              ▼              ▼
┌────────────┐  ┌──────────┐  ┌──────────────┐
│  IR-to-    │  │ IR-to-   │  │  IR-to-      │
│   WASM     │  │  MLIR    │  │  LLVM        │
└────────┬───┘  └─────┬────┘  └──────┬───────┘
         │            │               │
         ▼            ▼               ▼
┌────────────┐  ┌──────────┐  ┌──────────────┐
│   WASM     │  │  MLIR    │  │  LLVM IR     │
│  Bytecode  │  │  Text    │  │  Text        │
└────────────┘  └──────────┘  └──────────────┘
```

## Backend Details

### WebAssembly Backend

**Location**: `src/backends/wasm/`

**Features**:
- Direct compilation to WASM bytecode
- Optimized for web deployment
- Memory-efficient code generation
- Support for WASM MVP and post-MVP features
- Integration with browser and Node.js runtimes

**Key Components**:
- `ir-to-wasm.js` - IR to WASM compiler
- WASM bytecode encoder
- Memory management
- Function table generation

**Example**:
```javascript
const { IRToWasmCompiler } = require('./backends/wasm/ir-to-wasm');
const compiler = new IRToWasmCompiler({ optimize: true });
const wasmBytecode = compiler.compile(irProgram);
```

### MLIR Backend

**Location**: `src/backends/mlir/`

**Features**:
- Multi-level intermediate representation
- Powerful optimization framework
- Dialect-based extensibility
- Progressive lowering capabilities
- Integration with MLIR ecosystem

**Key Components**:
- `dialect.js` - LUASCRIPT MLIR dialect definition
- `ir-to-mlir.js` - IR to MLIR compiler
- `optimizer.js` - MLIR optimization passes

**Dialect Operations**:
- Control flow: `luascript.if`, `luascript.while`, `luascript.for`
- Arithmetic: `luascript.add`, `luascript.mul`, etc.
- Memory: `luascript.alloc`, `luascript.load`, `luascript.store`
- Functions: `luascript.func`, `luascript.call`, `luascript.return`

**Example**:
```javascript
const { IRToMLIRCompiler } = require('./backends/mlir');
const compiler = new IRToMLIRCompiler({ debug: false });
const mlirCode = compiler.compile(irProgram);
```

### LLVM IR Backend

**Location**: `src/backends/llvm/`

**Features**:
- SSA (Static Single Assignment) form
- Rich type system
- Comprehensive optimization passes
- Target-independent code generation
- Integration with LLVM toolchain

**Key Components**:
- `ir-to-llvm.js` - IR to LLVM IR compiler
- `optimizer.js` - LLVM optimization passes
- SSA transformation
- Control flow graph construction

**Optimization Levels**:
- `-O0`: No optimizations
- `-O1`: Basic optimizations (mem2reg, simplifycfg, instcombine, dce)
- `-O2`: Standard optimizations (adds inlining, GVN, SCCP, loop opts)
- `-O3`: Aggressive optimizations (adds vectorization, unrolling)

**Example**:
```javascript
const { IRToLLVMCompiler } = require('./backends/llvm');
const compiler = new IRToLLVMCompiler({ 
    optimize: true,
    targetTriple: 'x86_64-unknown-linux-gnu'
});
const llvmIR = compiler.compile(irProgram);
```

## Backend Manager

The `BackendManager` provides a unified interface to all backends:

```javascript
const { BackendManager } = require('./backends');

const manager = new BackendManager({
    wasm: { optimize: true },
    mlir: { debug: false },
    llvm: { optimize: true }
});

// Compile to specific backend
const wasmResult = manager.compile(irProgram, 'wasm');

// Compile to all backends
const allResults = manager.compileAll(irProgram);
```

## Optimization Pipeline

### WASM Optimizations
1. Dead code elimination
2. Constant folding
3. Function inlining
4. Memory access optimization

### MLIR Optimizations
1. Canonicalization
2. Common subexpression elimination
3. Loop optimization
4. Memory-to-register promotion

### LLVM Optimizations
1. Mem2Reg (promote memory to registers)
2. SROA (Scalar Replacement of Aggregates)
3. GVN (Global Value Numbering)
4. SCCP (Sparse Conditional Constant Propagation)
5. Loop transformations (LICM, unrolling, vectorization)
6. Inlining and interprocedural optimizations

## Type Mapping

### IR Types → Backend Types

| IR Type | WASM Type | MLIR Type | LLVM Type |
|---------|-----------|-----------|-----------|
| number | f64 | luascript.number | double |
| integer | i32 | luascript.integer | i32 |
| boolean | i32 | luascript.boolean | i1 |
| string | ptr | luascript.string | ptr |
| array | ptr | luascript.array<T> | ptr |
| object | ptr | luascript.object | ptr |
| function | funcref | luascript.function | ptr |
| void | - | luascript.void | void |

## Testing

All backends include comprehensive test suites:

```bash
# Test individual backends
npm test test/backends/test_wasm_ir.js
npm test test/backends/test_mlir.js
npm test test/backends/test_llvm.js

# Test integration
npm test test/backends/test_integration.js
```

## Examples

See `examples/backends/` for complete examples:

- `example_all_backends.js` - Compile to all backends
- `example_wasm_execution.js` - Execute WASM in runtime
- `example_mlir_optimization.js` - MLIR optimization passes
- `example_llvm_codegen.js` - LLVM code generation

## Performance Comparison

| Backend | Compilation Speed | Output Size | Runtime Performance |
|---------|------------------|-------------|---------------------|
| WASM | Fast | Small | Excellent |
| MLIR | Medium | Text (debug) | Depends on lowering |
| LLVM | Slower (many opts) | Text | Excellent (after native codegen) |

## Future Enhancements

### Short-term
- ✅ WASM MVP support
- ✅ MLIR dialect definition
- ✅ LLVM IR generation
- 🔄 Advanced WASM features (SIMD, threads)
- 🔄 MLIR optimization passes implementation
- 🔄 LLVM optimization passes implementation

### Mid-term
- MLIR → LLVM lowering
- LLVM → native code generation
- Profile-guided optimization
- Link-time optimization

### Long-term
- JIT compilation support
- GPU code generation
- Distributed compilation
- Custom hardware backends

## Contributing

When adding new backends:

1. Create directory under `src/backends/<name>/`
2. Implement compiler class with `compile(ir)` method
3. Add tests in `test/backends/`
4. Update `BackendManager` to include new backend
5. Add documentation

## References

- [WebAssembly Specification](https://webassembly.github.io/spec/)
- [MLIR Documentation](https://mlir.llvm.org/)
- [LLVM Language Reference](https://llvm.org/docs/LangRef.html)
- [LUASCRIPT IR Specification](../ir/IR_SPECIFICATION.md)

---

**Last Updated**: November 2, 2025
**Version**: 2.0.0

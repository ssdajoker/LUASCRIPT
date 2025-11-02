
# LUASCRIPT LLVM IR Backend

This directory contains the LLVM IR backend implementation for LUASCRIPT.

## Overview

The LLVM IR backend compiles canonical IR (or MLIR) to LLVM IR, enabling:
- Native code generation for multiple architectures
- Powerful optimization passes
- JIT compilation support
- Integration with LLVM toolchain

## Structure

```
src/llvm/
├── README.md           # This file
├── codegen.js          # LLVM IR generation
├── types.js            # Type mapping
├── runtime.js          # Runtime library bindings
├── optimizer.js        # Optimization configuration
└── jit.js              # JIT compilation support
```

## Features

### Code Generation
- Function compilation
- Expression lowering
- Statement compilation
- Control flow generation

### Type System
- Dynamic type boxing/unboxing
- Tagged union representation
- Type inference
- Runtime type checks

### Optimization
- Standard LLVM passes
- Custom Lua-specific optimizations
- Profile-guided optimization
- Link-time optimization

### Runtime Integration
- C bindings for Lua runtime
- FFI layer
- Memory management
- Garbage collection hooks

## Usage

```javascript
const { LLVMCodegen } = require('./llvm/codegen');

// Create codegen instance
const codegen = new LLVMCodegen({
    targetTriple: 'x86_64-unknown-linux-gnu',
    optimizationLevel: 2
});

// Compile IR to LLVM IR
const llvmIR = codegen.compileModule(ir);

// Generate object file
const objectCode = codegen.generateObjectCode(llvmIR);

// Or JIT compile and execute
const result = codegen.jitExecute(llvmIR, 'main');
```

## Example LLVM IR Output

```llvm
; Function: add(a, b)
define double @add(double %a, double %b) {
entry:
  %sum = fadd double %a, %b
  ret double %sum
}

; Function: factorial(n)
define double @factorial(double %n) {
entry:
  %is_zero = fcmp oeq double %n, 0.0
  br i1 %is_zero, label %base_case, label %recursive_case

base_case:
  ret double 1.0

recursive_case:
  %n_minus_1 = fsub double %n, 1.0
  %recursive_result = call double @factorial(double %n_minus_1)
  %result = fmul double %n, %recursive_result
  ret double %result
}
```

## Status

🚧 **Under Development** 🚧

Currently implementing:
- [ ] Basic code generation
- [ ] Type system
- [ ] Runtime integration
- [ ] Optimization passes
- [ ] JIT compilation
- [ ] Multi-architecture support

Target completion: 4-6 weeks

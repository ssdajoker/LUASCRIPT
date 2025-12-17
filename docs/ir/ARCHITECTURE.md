
# LUASCRIPT IR Architecture

## System Overview

The LUASCRIPT IR system consists of several key components:

```
┌─────────────────────────────────────────────────────────┐
│                    LUASCRIPT IR System                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐          │
│  │  Types   │  │   Nodes   │  │  Builder   │          │
│  └──────────┘  └───────────┘  └────────────┘          │
│       │              │               │                  │
│       └──────────────┴───────────────┘                  │
│                      │                                   │
│         ┌────────────┴────────────┐                     │
│         │                         │                     │
│  ┌──────▼─────┐           ┌──────▼────────┐           │
│  │ Validator  │           │  Serializer   │           │
│  └────────────┘           └───────────────┘           │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                      Compilers                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ JS→IR    │  │ IR→JS    │  │ IR→Lua   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Component Descriptions

### 1. Type System (`src/ir/types.js`)

**Purpose**: Define and manipulate type information for IR nodes.

**Key Classes**:
- `Type`: Base class for all types
- `TPrimitive`: Primitive types (number, string, boolean, etc.)
- `TArray`: Array types with element type
- `TObject`: Object types with property types
- `TFunction`: Function types with parameter and return types
- `TUnion`: Union types
- `TOptional`: Optional types
- `TVoid`, `TAny`: Special types

**Features**:
- Type equality checking
- Type compatibility checking
- JSON serialization/deserialization
- Type factory functions

### 2. Node System (`src/ir/nodes.js`)

**Purpose**: Define all IR node types.

**Node Categories**:
- **Declarations**: Program, FunctionDecl, VarDecl, Parameter
- **Statements**: Block, Return, If, While, For, DoWhile, Switch, Case, Break, Continue
- **Expressions**: BinaryOp, UnaryOp, Call, Member, Assignment, Conditional
- **Literals**: ArrayLiteral, ObjectLiteral, Identifier, Literal

**Features**:
- Unified node representation
- Source location tracking
- Metadata support
- JSON serialization/deserialization

### 3. Builder (`src/ir/builder.js`)

**Purpose**: Convenience API for constructing IR nodes.

**Features**:
- Fluent API for node creation
- Type inference for literals
- Shorthand methods for common operations
- Helper functions for complex constructs

**Example Usage**:
```javascript
const { builder } = require('./ir');

// Create a simple program
const program = builder.program([
  builder.declareAndInit('x', builder.literal(5)),
  builder.declareAndInit('y', builder.literal(10)),
  builder.expressionStmt(
    builder.call(
      builder.identifier('print'),
      [builder.add(
        builder.identifier('x'),
        builder.identifier('y')
      )]
    )
  )
]);
```

### 4. Validator (`src/ir/validator.js`)

**Purpose**: Validate IR correctness and consistency.

**Features**:
- Structural validation
- Type checking (optional)
- Error collection and reporting
- Warning generation

**Validation Checks**:
- Node structure integrity
- Required fields presence
- Type consistency
- Reference validity

**Example Usage**:
```javascript
const { IRValidator } = require('./ir');

const validator = new IRValidator();
const result = validator.validate(irNode);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

### 5. Serializer (`src/ir/serializer.js`)

**Purpose**: Convert IR to/from JSON and other formats.

**Features**:
- JSON serialization with pretty printing
- Deserialization with node reconstruction
- File I/O support
- Tree visualization
- DOT graph generation

**Example Usage**:
```javascript
const { IRSerializer } = require('./ir');

const serializer = new IRSerializer({ prettyPrint: true });

// Serialize to JSON
const json = serializer.serialize(irNode);

// Deserialize from JSON
const node = serializer.deserialize(json);

// Visualize as tree
console.log(serializer.visualize(irNode));

// Generate DOT graph
const dot = serializer.toDotGraph(irNode);
```

## Compilers

### JavaScript to IR (`src/compilers/js-to-ir.js`)

**Purpose**: Parse JavaScript code and convert to IR.

**Dependencies**:
- `acorn`: JavaScript parser

**Process**:
1. Parse JavaScript to AST using Acorn
2. Walk the AST
3. Convert each node to corresponding IR node
4. Preserve source locations
5. Infer types where possible

**Supported Features**:
- Variable declarations (let, const, var)
- Function declarations and expressions
- Arrow functions
- Control flow (if, while, for, switch)
- Expressions (binary, unary, call, member, etc.)
- Arrays and objects
- Literals

### IR to JavaScript (`src/compilers/ir-to-js.js`)

**Purpose**: Generate JavaScript code from IR.

**Features**:
- Configurable indentation
- Optional semicolons
- ES6+ syntax when appropriate
- Source map support (planned)

**Generation Strategy**:
- Direct mapping for compatible constructs
- Minimal transformation
- Readable output

### IR to Lua (`src/compilers/ir-to-lua.js`)

**Purpose**: Generate Lua code from IR.

**Features**:
- Lua 5.1+ compatibility
- Idiomatic Lua output
- Operator translation
- Control flow adaptation

**Translation Rules**:
- Arrays: JavaScript arrays → Lua tables (1-indexed)
- Objects: JavaScript objects → Lua tables
- Operators: `&&` → `and`, `||` → `or`, `!` → `not`
- Nullish: `null`/`undefined` → `nil`
- Console: `console.log` → `print`
- Ternary: `a ? b : c` → `(a and b or c)`

## Data Flow

### JavaScript → Lua (via IR)

```
┌─────────────┐
│  JavaScript │
│    Code     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Acorn     │  Parse to AST
│   Parser    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  JS→IR      │  Convert AST to IR
│  Compiler   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Canonical   │  Validate and optimize
│     IR      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  IR→Lua     │  Generate Lua code
│  Generator  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│     Lua     │
│    Code     │
└─────────────┘
```

### Round-Trip Testing

```
JavaScript ──→ IR ──→ JavaScript'
                │
                └──→ Lua
                
JavaScript' should be semantically equivalent to JavaScript
```

## Design Decisions

### Why JSON-based IR?

1. **Human-readable**: Easy to inspect and debug
2. **Language-agnostic**: Works with any language
3. **Tooling**: Extensive JSON tooling available
4. **Serialization**: Simple persistence and transmission
5. **Extensibility**: Easy to add new fields

### Why Separate Types and Nodes?

1. **Modularity**: Independent type system evolution
2. **Reusability**: Types can be used in multiple contexts
3. **Clarity**: Clear separation of concerns
4. **Testing**: Easier to test independently

### Why Builder Pattern?

1. **Ergonomics**: Easier to construct complex IR
2. **Type Safety**: Reduces errors in IR construction
3. **Consistency**: Ensures well-formed IR
4. **Documentation**: Self-documenting API

## Performance Considerations

1. **Lazy Validation**: Validate only when necessary
2. **Immutability**: IR nodes are immutable after creation (planned)
3. **Caching**: Cache frequently computed properties
4. **Streaming**: Support for large programs (planned)

## Extension Points

### Adding New Node Types

1. Define node class in `src/ir/nodes.js`
2. Add to `NodeCategory` enum
3. Implement `toJSON()` and `fromJSON()`
4. Add builder methods
5. Add validation logic
6. Update generators

### Adding New Target Languages

1. Create new generator in `src/compilers/`
2. Implement visitor pattern for all node types
3. Handle language-specific translations
4. Add target-specific optimizations
5. Create tests

### Adding Type Features

1. Define type class in `src/ir/types.js`
2. Add to `TypeCategory` enum
3. Implement equality and compatibility
4. Add factory function
5. Update serialization

## Testing Strategy

1. **Unit Tests**: Test each component independently
2. **Integration Tests**: Test compilation pipelines
3. **Round-Trip Tests**: Ensure semantic preservation
4. **Property Tests**: Verify invariants
5. **Regression Tests**: Prevent known issues

## Backend Integration

### WASM Backend ✅
- **Status**: Fully Implemented
- **Location**: `src/backends/wasm/`
- **Features**: Direct compilation to WebAssembly bytecode
- **Compiler**: `IRToWasmCompiler`

### MLIR Backend ✅
- **Status**: Fully Implemented
- **Location**: `src/backends/mlir/`
- **Features**: Multi-level IR with dialect system
- **Compiler**: `IRToMLIRCompiler`
- **Dialect**: `LuascriptDialect` with 30+ operations

### LLVM IR Backend ✅
- **Status**: Fully Implemented
- **Location**: `src/backends/llvm/`
- **Features**: SSA-form IR with comprehensive type system
- **Compiler**: `IRToLLVMCompiler`

### Backend Manager
- **Unified Interface**: `BackendManager` class
- **Multi-target**: Compile to all backends simultaneously
- **Optimization**: Per-backend optimization configuration

See [Backend Documentation](../backends/README.md) for details.

## Future Enhancements

### Near-term
- ✅ Complete Lua-to-IR compiler
- ✅ MLIR dialect integration
- ✅ LLVM IR generation
- 🔄 Source map support
- 🔄 Advanced optimization passes
- 🔄 Error recovery

### Mid-term
- MLIR → LLVM lowering
- LLVM → native code generation
- Advanced type inference
- Control flow analysis
- Profile-guided optimization

### Long-term
- Incremental compilation
- Multi-threaded compilation
- JIT compilation support
- IDE integration
- GPU code generation

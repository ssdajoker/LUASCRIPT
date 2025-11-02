
# LUASCRIPT Canonical IR Specification

## Overview

The LUASCRIPT Canonical Intermediate Representation (IR) is a language-agnostic representation designed to bridge JavaScript, Lua, MLIR, and LLVM. It serves as a common format for program analysis, transformation, and code generation across multiple target languages.

## Design Principles

1. **Language Neutrality**: The IR is not biased toward any specific source or target language
2. **Expressiveness**: Capable of representing all common programming constructs
3. **Simplicity**: Easy to understand, generate, and transform
4. **Type Safety**: Includes a rich type system for static analysis
5. **Extensibility**: Designed to accommodate future language features

## Architecture

```
┌─────────────┐
│  JavaScript │───┐
└─────────────┘   │
                  │     ┌──────────────┐     ┌─────────────┐
┌─────────────┐   ├────>│ Canonical IR │────>│  JavaScript │
│     Lua     │───┘     └──────────────┘     └─────────────┘
└─────────────┘              │
                             │               ┌─────────────┐
┌─────────────┐              └──────────────>│     Lua     │
│    MLIR     │                               └─────────────┘
└─────────────┘                               
                                              ┌─────────────┐
┌─────────────┐                               │    MLIR     │
│    LLVM     │                               └─────────────┘
└─────────────┘                               
                                              ┌─────────────┐
                                              │    LLVM     │
                                              └─────────────┘
```

## Type System

### Type Categories

- **Primitive Types**: `number`, `string`, `boolean`, `null`, `undefined`
- **Compound Types**: 
  - `Array<T>`: Homogeneous arrays
  - `Object`: Key-value mappings with typed properties
  - `Function`: First-class functions with parameter and return types
- **Special Types**:
  - `Union`: Type unions (T1 | T2 | ...)
  - `Optional`: Optional types (T?)
  - `Any`: Dynamic typing escape hatch
  - `Void`: Absence of value
  - `Custom`: User-defined types

### Type Definition Examples

```javascript
// Primitive types
Types.number()
Types.string()
Types.boolean()

// Array types
Types.array(Types.number())  // Array<number>

// Object types
Types.object({
  name: Types.string(),
  age: Types.number()
})

// Function types
Types.function(
  [Types.number(), Types.number()],  // parameters
  Types.number()                      // return type
)

// Union types
Types.union(Types.string(), Types.number())

// Optional types
Types.optional(Types.string())  // string?
```

## Node Types

### Declarations

#### Program
Root node containing all top-level statements.

```json
{
  "kind": "Program",
  "body": [/* array of statements */]
}
```

#### FunctionDecl
Function declaration with parameters, body, and optional return type.

```json
{
  "kind": "FunctionDecl",
  "name": "add",
  "parameters": [
    { "kind": "Parameter", "name": "a", "type": {...} },
    { "kind": "Parameter", "name": "b", "type": {...} }
  ],
  "body": { "kind": "Block", "statements": [...] },
  "returnType": { "category": "primitive", "primitiveType": "number" }
}
```

#### VarDecl
Variable declaration with optional initialization.

```json
{
  "kind": "VarDecl",
  "name": "x",
  "varKind": "let",  // "let", "const", or "var"
  "init": { "kind": "Literal", "value": 5 },
  "type": { "category": "primitive", "primitiveType": "number" }
}
```

### Statements

#### Block
A sequence of statements.

```json
{
  "kind": "Block",
  "statements": [...]
}
```

#### If
Conditional statement with optional else clause.

```json
{
  "kind": "If",
  "condition": {...},
  "consequent": {...},
  "alternate": {...}  // optional
}
```

#### While
While loop.

```json
{
  "kind": "While",
  "condition": {...},
  "body": {...}
}
```

#### For
C-style for loop.

```json
{
  "kind": "For",
  "init": {...},       // optional
  "condition": {...},  // optional
  "update": {...},     // optional
  "body": {...}
}
```

#### Switch
Switch statement with cases.

```json
{
  "kind": "Switch",
  "discriminant": {...},
  "cases": [
    {
      "kind": "Case",
      "test": {...},      // null for default case
      "consequent": [...]
    }
  ]
}
```

#### Return
Return statement.

```json
{
  "kind": "Return",
  "value": {...}  // optional
}
```

#### Break/Continue
Loop control flow.

```json
{
  "kind": "Break"
}
```

### Expressions

#### BinaryOp
Binary operations (arithmetic, logical, comparison).

```json
{
  "kind": "BinaryOp",
  "operator": "+",
  "left": {...},
  "right": {...}
}
```

**Supported operators**:
- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Logical: `&&`, `||`
- Bitwise: `&`, `|`, `^`, `<<`, `>>`

#### UnaryOp
Unary operations.

```json
{
  "kind": "UnaryOp",
  "operator": "!",
  "operand": {...},
  "prefix": true
}
```

**Supported operators**: `!`, `-`, `+`, `~`, `++`, `--`, `typeof`

#### Call
Function call.

```json
{
  "kind": "Call",
  "callee": {...},
  "args": [...]
}
```

#### Member
Member access (property or index).

```json
{
  "kind": "Member",
  "object": {...},
  "property": {...},
  "computed": false  // true for obj[prop], false for obj.prop
}
```

#### Assignment
Assignment expression.

```json
{
  "kind": "Assignment",
  "left": {...},
  "right": {...},
  "operator": "="  // "=", "+=", "-=", etc.
}
```

#### Conditional
Ternary operator.

```json
{
  "kind": "Conditional",
  "condition": {...},
  "consequent": {...},
  "alternate": {...}
}
```

#### Literals

```json
{
  "kind": "ArrayLiteral",
  "elements": [...]
}
```

```json
{
  "kind": "ObjectLiteral",
  "properties": [
    {
      "kind": "Property",
      "key": {...},
      "value": {...}
    }
  ]
}
```

```json
{
  "kind": "Identifier",
  "name": "variableName"
}
```

```json
{
  "kind": "Literal",
  "value": 42,
  "type": { "category": "primitive", "primitiveType": "number" }
}
```

## Source Locations

All nodes can include optional source location information:

```json
{
  "kind": "...",
  "loc": {
    "start": { "line": 1, "column": 0 },
    "end": { "line": 1, "column": 10 }
  }
}
```

## Metadata

Nodes can carry arbitrary metadata:

```json
{
  "kind": "...",
  "metadata": {
    "optimizationHint": "inline",
    "sourceLanguage": "javascript"
  }
}
```

## Usage Examples

### Simple Program

JavaScript:
```javascript
let x = 5;
let y = 10;
function add(a, b) {
  return a + b;
}
console.log(add(x, y));
```

IR (simplified):
```json
{
  "kind": "Program",
  "body": [
    {
      "kind": "VarDecl",
      "name": "x",
      "varKind": "let",
      "init": { "kind": "Literal", "value": 5 }
    },
    {
      "kind": "VarDecl",
      "name": "y",
      "varKind": "let",
      "init": { "kind": "Literal", "value": 10 }
    },
    {
      "kind": "FunctionDecl",
      "name": "add",
      "parameters": [
        { "kind": "Parameter", "name": "a" },
        { "kind": "Parameter", "name": "b" }
      ],
      "body": {
        "kind": "Block",
        "statements": [
          {
            "kind": "Return",
            "value": {
              "kind": "BinaryOp",
              "operator": "+",
              "left": { "kind": "Identifier", "name": "a" },
              "right": { "kind": "Identifier", "name": "b" }
            }
          }
        ]
      }
    },
    {
      "kind": "ExpressionStmt",
      "expression": {
        "kind": "Call",
        "callee": {
          "kind": "Member",
          "object": { "kind": "Identifier", "name": "console" },
          "property": { "kind": "Identifier", "name": "log" }
        },
        "args": [
          {
            "kind": "Call",
            "callee": { "kind": "Identifier", "name": "add" },
            "args": [
              { "kind": "Identifier", "name": "x" },
              { "kind": "Identifier", "name": "y" }
            ]
          }
        ]
      }
    }
  ]
}
```

## Best Practices

1. **Type Annotations**: Always include type information when known
2. **Source Locations**: Preserve source locations for error reporting
3. **Metadata**: Use metadata for optimization hints and language-specific features
4. **Validation**: Always validate IR before code generation
5. **Serialization**: Use JSON for persistence and interchange

## Implementation Notes

### JavaScript to IR
- Arrow functions are converted to regular function declarations
- Template literals are converted to string concatenation
- Destructuring is expanded to individual assignments

### IR to Lua
- Ternary operators become inline functions
- Arrays become 1-indexed tables
- `console.log` becomes `print`
- `null` and `undefined` become `nil`

### IR to JavaScript
- Direct mapping for most constructs
- Preserves ES6+ features when possible

## Future Extensions

- **Async/Await**: Support for asynchronous operations
- **Generators**: Generator functions and iterators
- **Classes**: Object-oriented programming constructs
- **Modules**: Import/export system
- **Pattern Matching**: Advanced destructuring and matching
- **MLIR Integration**: Direct lowering to MLIR dialects
- **LLVM Integration**: SSA-based optimization passes

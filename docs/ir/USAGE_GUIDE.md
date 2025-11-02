
# LUASCRIPT IR Usage Guide

## Installation

```bash
npm install luascript
```

## Quick Start

### Basic JavaScript to Lua Compilation

```javascript
const { JSToIRCompiler, IRToLuaGenerator } = require('luascript/src/compilers');

// JavaScript source code
const jsCode = `
  let x = 5;
  let y = 10;
  function add(a, b) {
    return a + b;
  }
  console.log(add(x, y));
`;

// Compile to IR
const compiler = new JSToIRCompiler();
const ir = compiler.compile(jsCode);

// Generate Lua
const generator = new IRToLuaGenerator();
const luaCode = generator.generate(ir);

console.log(luaCode);
```

Output:
```lua
local x = 5
local y = 10
local function add(a, b)
  return a + b
end
print(add(x, y))
```

### Round-Trip Compilation (JS → IR → JS)

```javascript
const { JSToIRCompiler, IRToJSGenerator } = require('luascript/src/compilers');

const jsCode = `
  function factorial(n) {
    if (n <= 1) {
      return 1;
    }
    return n * factorial(n - 1);
  }
`;

// Compile to IR
const compiler = new JSToIRCompiler();
const ir = compiler.compile(jsCode);

// Generate JavaScript back
const generator = new IRToJSGenerator();
const jsOutput = generator.generate(ir);

console.log(jsOutput);
```

## Working with IR Nodes

### Creating IR Manually

```javascript
const { builder, Types } = require('luascript/src/ir');

// Create a simple function: function add(a, b) { return a + b; }
const addFunction = builder.functionDecl(
  'add',
  [
    builder.parameter('a', Types.number()),
    builder.parameter('b', Types.number())
  ],
  builder.block([
    builder.returnStmt(
      builder.add(
        builder.identifier('a'),
        builder.identifier('b')
      )
    )
  ]),
  Types.number()
);

// Create a program with the function
const program = builder.program([addFunction]);

// Generate JavaScript
const { IRToJSGenerator } = require('luascript/src/compilers');
const generator = new IRToJSGenerator();
console.log(generator.generate(program));
```

### Building Complex Expressions

```javascript
const { builder } = require('luascript/src/ir');

// Create: let result = (x + y) * (a - b);
const varDecl = builder.declareAndInit(
  'result',
  builder.multiply(
    builder.add(
      builder.identifier('x'),
      builder.identifier('y')
    ),
    builder.subtract(
      builder.identifier('a'),
      builder.identifier('b')
    )
  )
);
```

### Creating Control Flow

```javascript
const { builder } = require('luascript/src/ir');

// Create: if (x > 0) { console.log("positive"); } else { console.log("negative"); }
const ifStmt = builder.ifStmt(
  builder.greaterThan(
    builder.identifier('x'),
    builder.literal(0)
  ),
  builder.block([
    builder.expressionStmt(
      builder.namedCall('console.log', [
        builder.literal('positive')
      ])
    )
  ]),
  builder.block([
    builder.expressionStmt(
      builder.namedCall('console.log', [
        builder.literal('negative')
      ])
    )
  ])
);
```

### Creating Loops

```javascript
const { builder } = require('luascript/src/ir');

// Create: for (let i = 0; i < 10; i++) { console.log(i); }
const forLoop = builder.forStmt(
  builder.declareAndInit('i', builder.literal(0)),
  builder.lessThan(
    builder.identifier('i'),
    builder.literal(10)
  ),
  builder.unaryOp('++', builder.identifier('i')),
  builder.block([
    builder.expressionStmt(
      builder.namedCall('console.log', [
        builder.identifier('i')
      ])
    )
  ])
);
```

## Validation

### Basic Validation

```javascript
const { IRValidator } = require('luascript/src/ir');
const { JSToIRCompiler } = require('luascript/src/compilers');

const jsCode = `let x = 5;`;
const compiler = new JSToIRCompiler();
const ir = compiler.compile(jsCode);

// Validate IR
const validator = new IRValidator();
const result = validator.validate(ir);

if (result.valid) {
  console.log('IR is valid');
} else {
  console.error('Validation errors:', result.errors);
}

if (result.warnings.length > 0) {
  console.warn('Warnings:', result.warnings);
}
```

### Strict Type Checking

```javascript
const { IRValidator } = require('luascript/src/ir');

const validator = new IRValidator({
  strictTypes: true,
  allowImplicitConversions: false
});

const result = validator.validate(ir);
```

## Serialization

### JSON Serialization

```javascript
const { IRSerializer } = require('luascript/src/ir');
const { JSToIRCompiler } = require('luascript/src/compilers');

const jsCode = `let x = 5;`;
const compiler = new JSToIRCompiler();
const ir = compiler.compile(jsCode);

// Create serializer
const serializer = new IRSerializer({ prettyPrint: true });

// Serialize to JSON
const json = serializer.serialize(ir);
console.log(json);

// Save to file
serializer.serializeToFile(ir, 'output.ir.json');

// Load from file
const loadedIR = serializer.deserializeFromFile('output.ir.json');
```

### Visualization

```javascript
const { IRSerializer } = require('luascript/src/ir');

const serializer = new IRSerializer();

// Pretty print as tree
console.log(serializer.visualize(ir));
```

Output:
```
Program
  VarDecl "x"
    Literal = 5
```

### DOT Graph Generation

```javascript
const { IRSerializer } = require('luascript/src/ir');
const fs = require('fs');

const serializer = new IRSerializer();
const dotGraph = serializer.toDotGraph(ir);

// Save DOT file
fs.writeFileSync('ir.dot', dotGraph);

// Convert to image using Graphviz:
// $ dot -Tpng ir.dot -o ir.png
```

## Type System Usage

### Creating Types

```javascript
const { Types } = require('luascript/src/ir');

// Primitive types
const numberType = Types.number();
const stringType = Types.string();
const booleanType = Types.boolean();

// Array type
const numberArrayType = Types.array(Types.number());

// Object type
const personType = Types.object({
  name: Types.string(),
  age: Types.number(),
  email: Types.optional(Types.string())
});

// Function type
const addFunctionType = Types.function(
  [Types.number(), Types.number()],  // parameters
  Types.number()                      // return type
);

// Union type
const stringOrNumber = Types.union(Types.string(), Types.number());

// Optional type
const optionalString = Types.optional(Types.string());

// Custom type
const customType = Types.custom('MyCustomType');
```

### Type Checking

```javascript
const { Types } = require('luascript/src/ir');

const type1 = Types.number();
const type2 = Types.number();
const type3 = Types.string();

console.log(type1.equals(type2));  // true
console.log(type1.equals(type3));  // false

console.log(type1.isCompatibleWith(type3));  // false
console.log(type1.isCompatibleWith(Types.any()));  // true
```

### Type Serialization

```javascript
const { Types } = require('luascript/src/ir');

const type = Types.function(
  [Types.string(), Types.number()],
  Types.boolean()
);

// Serialize to JSON
const json = type.toJSON();
console.log(JSON.stringify(json, null, 2));

// Deserialize from JSON
const { Type } = require('luascript/src/ir/types');
const loadedType = Type.fromJSON(json);

console.log(loadedType.toString());  // (string, number) => boolean
```

## Advanced Usage

### Custom Compilation Pipeline

```javascript
const { JSToIRCompiler, IRToLuaGenerator } = require('luascript/src/compilers');
const { IRValidator, IRSerializer } = require('luascript/src/ir');

class CompilationPipeline {
  constructor() {
    this.compiler = new JSToIRCompiler();
    this.validator = new IRValidator();
    this.luaGenerator = new IRToLuaGenerator();
    this.serializer = new IRSerializer({ prettyPrint: true });
  }

  compile(jsCode, options = {}) {
    // Step 1: Parse JavaScript to IR
    console.log('Compiling JavaScript to IR...');
    const ir = this.compiler.compile(jsCode);

    // Step 2: Validate IR
    if (options.validate !== false) {
      console.log('Validating IR...');
      const validationResult = this.validator.validate(ir);
      
      if (!validationResult.valid) {
        throw new Error('Invalid IR: ' + JSON.stringify(validationResult.errors));
      }
    }

    // Step 3: Save IR if requested
    if (options.saveIR) {
      console.log('Saving IR to file...');
      this.serializer.serializeToFile(ir, options.saveIR);
    }

    // Step 4: Generate Lua
    console.log('Generating Lua code...');
    const luaCode = this.luaGenerator.generate(ir);

    return {
      ir,
      luaCode
    };
  }
}

// Usage
const pipeline = new CompilationPipeline();
const result = pipeline.compile(`
  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }
`, {
  validate: true,
  saveIR: 'fibonacci.ir.json'
});

console.log(result.luaCode);
```

### IR Transformation

```javascript
const { IRNode } = require('luascript/src/ir');

class IRTransformer {
  transform(node) {
    return this.visit(node);
  }

  visit(node) {
    if (!node) return null;

    const methodName = `visit${node.kind}`;
    if (typeof this[methodName] === 'function') {
      return this[methodName](node);
    }

    // Default: recursively transform children
    return this.visitGeneric(node);
  }

  visitGeneric(node) {
    // Transform children
    const transformed = { ...node };

    if (node.body) {
      if (Array.isArray(node.body)) {
        transformed.body = node.body.map(child => this.visit(child));
      } else {
        transformed.body = this.visit(node.body);
      }
    }

    if (node.statements) {
      transformed.statements = node.statements.map(stmt => this.visit(stmt));
    }

    // ... transform other children

    return transformed;
  }

  // Example: Transform all console.log calls to custom logger
  visitCall(node) {
    if (node.callee.kind === 'Member' &&
        node.callee.object.name === 'console' &&
        node.callee.property.name === 'log') {
      
      // Replace with logger.log
      return {
        ...node,
        callee: {
          ...node.callee,
          object: { kind: 'Identifier', name: 'logger' }
        }
      };
    }

    return this.visitGeneric(node);
  }
}

// Usage
const transformer = new IRTransformer();
const transformedIR = transformer.transform(originalIR);
```

## Error Handling

```javascript
const { JSToIRCompiler, IRToLuaGenerator } = require('luascript/src/compilers');
const { IRValidator } = require('luascript/src/ir');

function safeCompile(jsCode) {
  try {
    // Compile to IR
    const compiler = new JSToIRCompiler();
    const ir = compiler.compile(jsCode);

    // Validate
    const validator = new IRValidator();
    const validation = validator.validate(ir);

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors.map(e => e.message)
      };
    }

    // Generate Lua
    const generator = new IRToLuaGenerator();
    const luaCode = generator.generate(ir);

    return {
      success: true,
      luaCode,
      warnings: validation.warnings
    };

  } catch (error) {
    return {
      success: false,
      errors: [error.message]
    };
  }
}

// Usage
const result = safeCompile(`let x = 5;`);

if (result.success) {
  console.log('Lua code:', result.luaCode);
} else {
  console.error('Compilation failed:', result.errors);
}
```

## Testing

### Unit Testing IR Nodes

```javascript
const { builder } = require('luascript/src/ir');
const assert = require('assert');

// Test creating a variable declaration
const varDecl = builder.varDecl('x', builder.literal(5));
assert.strictEqual(varDecl.name, 'x');
assert.strictEqual(varDecl.init.value, 5);

// Test creating a function
const func = builder.functionDecl(
  'add',
  [builder.parameter('a'), builder.parameter('b')],
  builder.block([
    builder.returnStmt(
      builder.add(builder.identifier('a'), builder.identifier('b'))
    )
  ])
);
assert.strictEqual(func.name, 'add');
assert.strictEqual(func.parameters.length, 2);
```

### Round-Trip Testing

```javascript
const { JSToIRCompiler, IRToJSGenerator } = require('luascript/src/compilers');
const assert = require('assert');

function roundTripTest(jsCode) {
  const compiler = new JSToIRCompiler();
  const generator = new IRToJSGenerator();

  // JavaScript -> IR -> JavaScript
  const ir = compiler.compile(jsCode);
  const regenerated = generator.generate(ir);

  // Parse and compare (semantic equivalence, not textual)
  const ir1 = compiler.compile(jsCode);
  const ir2 = compiler.compile(regenerated);

  // Compare IR representations
  assert.deepStrictEqual(ir1.toJSON(), ir2.toJSON());
}

// Test cases
roundTripTest(`let x = 5;`);
roundTripTest(`function add(a, b) { return a + b; }`);
roundTripTest(`if (x > 0) { console.log("positive"); }`);
```

## Performance Tips

1. **Reuse Compilers**: Create compiler instances once and reuse
2. **Lazy Validation**: Only validate when necessary
3. **Streaming**: For large programs, consider streaming compilation (future)
4. **Caching**: Cache compiled IR for frequently used code

## Common Patterns

### Pattern 1: Simple Transpilation

```javascript
function transpile(jsCode) {
  const { JSToIRCompiler, IRToLuaGenerator } = require('luascript/src/compilers');
  
  const ir = new JSToIRCompiler().compile(jsCode);
  return new IRToLuaGenerator().generate(ir);
}
```

### Pattern 2: Validated Compilation

```javascript
function compileWithValidation(jsCode) {
  const { JSToIRCompiler, IRToLuaGenerator } = require('luascript/src/compilers');
  const { IRValidator } = require('luascript/src/ir');
  
  const ir = new JSToIRCompiler().compile(jsCode);
  
  const result = new IRValidator().validate(ir);
  if (!result.valid) {
    throw new Error('Invalid IR');
  }
  
  return new IRToLuaGenerator().generate(ir);
}
```

### Pattern 3: Multi-Target Compilation

```javascript
function compileToMultipleTargets(jsCode) {
  const { JSToIRCompiler, IRToJSGenerator, IRToLuaGenerator } = require('luascript/src/compilers');
  
  const ir = new JSToIRCompiler().compile(jsCode);
  
  return {
    javascript: new IRToJSGenerator().generate(ir),
    lua: new IRToLuaGenerator().generate(ir)
  };
}
```

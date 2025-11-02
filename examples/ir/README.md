
# LUASCRIPT IR Examples

This directory contains example programs demonstrating the LUASCRIPT IR system.

## Examples

### 1. Simple Example (`simple_example.js`)

Demonstrates basic IR usage:
- Compiling JavaScript to IR
- Validating IR
- Serializing IR to JSON
- Visualizing IR as a tree
- Generating JavaScript from IR
- Generating Lua from IR

**Run:**
```bash
node examples/ir/simple_example.js
```

### 2. Advanced Example (`advanced_example.js`)

Demonstrates advanced features:
- Building IR manually using the builder
- Creating complex data structures (arrays, objects)
- Advanced control flow (loops, conditionals, switch)
- Type annotations
- Multi-target compilation

**Run:**
```bash
node examples/ir/advanced_example.js
```

### 3. Fibonacci Example (`fibonacci_example.js`)

A complete end-to-end example showing:
- JavaScript fibonacci implementation
- Compilation to IR
- Validation
- Generation to multiple targets
- Round-trip compilation testing

**Run:**
```bash
node examples/ir/fibonacci_example.js
```

## Expected Output

Each example will show:
1. Original source code
2. IR representation
3. Validation results
4. Generated code in multiple languages

## Learning Path

1. Start with `simple_example.js` to understand the basic workflow
2. Move to `advanced_example.js` to see manual IR construction
3. Study `fibonacci_example.js` for a complete real-world example

## Tips

- Use `IRSerializer.visualize()` to understand IR structure
- Always validate IR before code generation
- Check validation warnings for potential issues
- Compare generated code across different targets

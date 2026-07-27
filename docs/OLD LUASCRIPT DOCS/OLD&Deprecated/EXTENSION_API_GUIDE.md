# LUASCRIPT Extension API Developer Guide

**API Version**: 1.0.0  
**Status**: ✅ Stable & Backward Compatible  
**Last Updated**: 2025-12-20

## Overview

The LUASCRIPT Extension API enables third-party developers to create custom transforms and passes that integrate seamlessly with the IR pipeline. This guide covers everything needed to build, test, and distribute extensions.

## Quick Start

### 1. Create Your First Transform

```javascript
// my-transform.js
const { IRTransform } = require('luascript/extensions/api');

class MyOptimization extends IRTransform {
  constructor() {
    super({
      name: 'my-optimization',
      version: '1.0.0',
      priority: 100,
      tags: ['optimization'],
    });
  }

  describe() {
    return {
      name: this.name,
      version: this.version,
      purpose: 'Removes unnecessary variables',
      inputTypes: ['VariableDeclaration'],
      outputTypes: ['VariableDeclaration'],
    };
  }

  transform(node, context) {
    if (node.unused) {
      // Remove unused variables
      return null; // Signal deletion
    }
    return node;
  }

  validate(original, transformed) {
    // Ensure semantics preserved
    return {
      valid: transformed === null || transformed.used,
      errors: [],
    };
  }
}

module.exports = MyOptimization;
```

### 2. Register and Use

```javascript
const { ExtensionRegistry } = require('luascript/extensions/api');
const MyOptimization = require('./my-transform');

const registry = new ExtensionRegistry();
registry.register(new MyOptimization());

// Use in pipeline
const irTree = { /* ... */ };
const result = registry.executeAll(irTree);
```

## API Reference

### Base Classes

#### `IRTransform`

Base class for all transforms. Implements the fundamental contract.

**Constructor Options:**
```javascript
{
  name: string,           // Unique identifier (required)
  version: string,        // Semantic version (required)
  priority: number,       // Execution order (lower = earlier, default: 100)
  tags: string[],        // Categorization (e.g., ['optimization'])
  config: object,        // Custom configuration
}
```

**Key Methods:**

```javascript
// Metadata
getMetadata()            // Returns transform metadata
describe()              // Returns detailed description

// Execution
transform(node, context) // Apply transform (required to implement)
validate(original, transformed) // Validate output
canProcess(node)        // Check if can handle node type
rollback(node)          // Undo transform (optional)

// Types (override these)
getInputTypes()         // What node types to accept
getOutputTypes()        // What types transform produces
hasSideEffects()        // Whether transform modifies outside state
getCapabilities()       // Additional capabilities object
```

#### `IRVisitor`

For tree-walking transforms using visitor pattern.

```javascript
class MyVisitor extends IRVisitor {
  onEnter(node, context) {
    // Called when entering a node
    return node; // or null to keep original
  }

  onExit(node, context) {
    // Called after children processed
    return node;
  }
}
```

#### `OptimizationPass`

Specialized for optimizations (tracks statistics).

```javascript
class MyPass extends OptimizationPass {
  transform(node) {
    if (canOptimize(node)) {
      this.statistics.optimizationsApplied++;
      return optimize(node);
    }
    return node;
  }

  // Get stats
  const stats = pass.getStatistics();
  // { nodesProcessed: N, optimizationsApplied: M, bytesReduced: B }
}
```

#### `LoweringPass`

Specialized for lowering transforms.

```javascript
class MyLowering extends LoweringPass {
  getInputTypes() {
    return ['ComplexNode'];
  }

  transform(node) {
    if (node.type === 'ComplexNode') {
      return { type: 'SimplerNode', /* ... */ };
    }
    return node;
  }
}
```

### Registry & Loading

#### `ExtensionRegistry`

Manages transform registration and execution.

```javascript
const registry = new ExtensionRegistry({
  compatibilityMode: true,  // Warn instead of error (default: true)
  maxDepth: 1000,          // Max traversal depth
  timeout: 30000,          // Execution timeout (ms)
});

// Register transforms
registry.register(transform);

// Plan execution (orders by priority)
const plan = registry.planExecution();

// Execute all
const result = registry.executeAll(node, context);

// Get statistics
const stats = registry.getStatistics();

// Unregister
registry.unregister('transform-name');
```

#### `ExtensionLoader`

Auto-discover and load transforms.

```javascript
const loader = new ExtensionLoader({
  searchPaths: [
    './transforms',
    './extensions',
  ],
  registry: myRegistry,
});

// Load from file
const transform = loader.loadFromFile('./my-transform.js');

// Load from npm package
const transform = loader.loadFromPackage('my-luascript-plugin');

// Auto-discover
const loaded = loader.autoDiscover();
```

#### `CompatibilityValidator`

Check third-party compatibility.

```javascript
const result = CompatibilityValidator.validate(transform);
if (!result.compatible) {
  console.error('Compatibility issues:', result.issues);
}

// Check version compatibility
const level = CompatibilityValidator.getCompatibilityLevel('1.1.0');
// 'full' | 'partial' | 'deprecated'
```

## Common Patterns

### Pattern 1: Simple Node Transformer

```javascript
const { IRTransform } = require('luascript/extensions/api');

class SimplifyLiterals extends IRTransform {
  constructor() {
    super({
      name: 'simplify-literals',
      version: '1.0.0',
      priority: 50,
    });
  }

  transform(node) {
    if (node.type === 'StringLiteral') {
      // Simplify escaped strings
      return {
        ...node,
        value: node.value.replace(/\\(.)/g, '$1'),
      };
    }
    return node;
  }

  getInputTypes() {
    return ['StringLiteral'];
  }
}
```

### Pattern 2: Visitor-Based Transform

```javascript
const { IRVisitor } = require('luascript/extensions/api');

class CountNodes extends IRVisitor {
  constructor() {
    super({
      name: 'count-nodes',
      version: '1.0.0',
    });
    this.counts = {};
  }

  onEnter(node) {
    this.counts[node.type] = (this.counts[node.type] || 0) + 1;
    return node;
  }

  getNodeCounts() {
    return this.counts;
  }
}
```

### Pattern 3: Optimization with Statistics

```javascript
const { OptimizationPass } = require('luascript/extensions/api');

class DeadCodeElimination extends OptimizationPass {
  constructor() {
    super({
      name: 'dead-code-elimination',
      version: '1.0.0',
      priority: 100,
    });
  }

  transform(node) {
    this.statistics.nodesProcessed++;

    if (isDeadCode(node)) {
      this.statistics.optimizationsApplied++;
      this.statistics.bytesReduced += estimateBytes(node);
      return null; // Remove
    }

    return node;
  }
}
```

### Pattern 4: Lowering Pass

```javascript
const { LoweringPass } = require('luascript/extensions/api');

class LowerComplexExpressions extends LoweringPass {
  constructor() {
    super({
      name: 'lower-complex-expr',
      version: '1.0.0',
      priority: 200,
    });
  }

  getInputTypes() {
    return ['ChainedComparison', 'ComplexArithmetic'];
  }

  transform(node) {
    if (node.type === 'ChainedComparison') {
      // a < b < c  →  (a < b) && (b < c)
      return {
        type: 'BinaryOp',
        operator: '&&',
        left: { /* ... */ },
        right: { /* ... */ },
      };
    }
    return node;
  }
}
```

## Testing Your Extension

### Unit Tests

```javascript
const MyTransform = require('./my-transform');
const { ExtensionRegistry } = require('luascript/extensions/api');

describe('MyTransform', function() {
  let registry;

  beforeEach(function() {
    registry = new ExtensionRegistry();
    registry.register(new MyTransform());
  });

  it('should transform nodes correctly', function() {
    const input = { type: 'Test', value: 5 };
    const output = registry.executeAll(input);
    assert(output.transformed === true);
  });

  it('should validate output', function() {
    const transform = registry.get('my-transform');
    const validation = transform.validate({}, {});
    assert(validation.valid === true);
  });
});
```

### Compatibility Testing

```javascript
const { CompatibilityValidator } = require('luascript/extensions/api');
const MyTransform = require('./my-transform');

const result = CompatibilityValidator.validate(new MyTransform());
assert(result.compatible);

// Check version
const level = CompatibilityValidator.getCompatibilityLevel('1.0.0');
assert.equal(level, 'full');
```

## Best Practices

### 1. Always Implement describe()

Helps with debugging and tool integration:

```javascript
describe() {
  return {
    name: this.name,
    version: this.version,
    purpose: 'Clear description of what this does',
    inputTypes: ['NodeType1', 'NodeType2'],
    outputTypes: ['OutputType'],
  };
}
```

### 2. Validate Output

Ensure transform correctness:

```javascript
validate(original, transformed) {
  const errors = [];
  
  if (!transformed) {
    errors.push('Transform produced null');
  }
  
  if (transformed.type !== 'ExpectedType') {
    errors.push(`Wrong output type: ${transformed.type}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### 3. Set Appropriate Priority

- Low priority (0-50): Foundational transforms (lowering)
- Medium priority (100-200): Standard transforms (optimization)
- High priority (300+): Final passes (analysis)

### 4. Handle Edge Cases

```javascript
transform(node, context) {
  // Check null/undefined
  if (!node) return null;

  // Check node type
  if (!this.canProcess(node)) return node;

  // Do work
  try {
    return doTransform(node);
  } catch (error) {
    console.error(`Transform failed: ${error}`);
    return node; // Return unchanged
  }
}
```

### 5. Use Tags for Discovery

```javascript
super({
  name: 'my-transform',
  version: '1.0.0',
  tags: [
    'optimization',
    'perf-sensitive',
    'experimental', // if applicable
  ],
});
```

### 6. Document Side Effects

```javascript
hasSideEffects() {
  return {
    modifiesInput: false,
    createsSharedReferences: false,
    throwsExceptions: true, // May throw on invalid input
    generatesStatistics: true,
  };
}
```

## Publishing Your Extension

### As NPM Package

1. Create package.json:
```json
{
  "name": "luascript-my-transform",
  "version": "1.0.0",
  "main": "index.js",
  "peerDependencies": {
    "luascript": "^1.0.0"
  },
  "keywords": ["luascript", "extension", "transform"]
}
```

2. Export transform from index.js:
```javascript
module.exports = require('./lib/my-transform');
```

3. Publish to npm:
```bash
npm publish
```

4. Users can then:
```javascript
const { ExtensionLoader } = require('luascript/extensions/api');
const loader = new ExtensionLoader();
const MyTransform = loader.loadFromPackage('luascript-my-transform');
registry.register(new MyTransform());
```

### As Local Extension

Users can register directly:

```javascript
const MyTransform = require('./extensions/my-transform');
registry.register(new MyTransform());
```

## Troubleshooting

### Transform Not Executing

1. Check that it's registered: `registry.get('name')`
2. Verify enabled: `transform.enabled === true`
3. Check priority: Lower priority runs first
4. Check input types: `canProcess(node)`

### Compatibility Errors

1. Run: `CompatibilityValidator.validate(transform)`
2. Check required methods implemented
3. Verify extends IRTransform base class
4. Check version compatibility level

### Node Validation Failures

1. Override `validate()` method
2. Check output node structure
3. Ensure type is set correctly
4. Verify all required fields present

## API Stability Guarantees

The Extension API guarantees:

✅ **Major Version Stability** (1.x):
- Base class interface remains stable
- Required methods won't change signature
- New methods only added, never removed

⚠️ **Minor Version Changes** (1.x → 1.y):
- New optional methods may be added
- Existing methods maintain backward compatibility
- Use CompatibilityValidator to check

🔄 **Patch Version** (1.x.y):
- Bug fixes only, no API changes
- Full backward compatibility

## Examples

See the examples directory for:
- [basic-transform.js](../../examples/extensions/basic-transform.js) - Simple transformation
- [optimization-pass.js](../../examples/extensions/optimization-pass.js) - Optimization example
- [visitor-pattern.js](../../examples/extensions/visitor-pattern.js) - Visitor-based transform
- [custom-registry.js](../../examples/extensions/custom-registry.js) - Custom registry setup

## Support & Feedback

- **Issues**: Report on GitHub with label `extension-api`
- **Discussions**: Start thread in Discussions for questions
- **Compatibility**: Check version against API_VERSION constant
- **Contact**: Open issue for compatibility concerns

## Related Documentation

- [COMPLETENESS_GATE.md](../COMPLETENESS_GATE.md) - PR requirements
- [PERFORMANCE_SLO.md](../PERFORMANCE_SLO.md) - Performance expectations
- [tests/compatibility/](../../test/compatibility/) - Regression test suite
- [Extension Architecture Design](EXTENSION_ARCHITECTURE.md) - Design details

---

**Last Updated**: 2025-12-20  
**Maintainer**: Architecture Team  
**Status**: ✅ Stable API v1.0.0

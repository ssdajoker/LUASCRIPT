/**
 * Extension Backward Compatibility Test Suite
 * 
 * Regression tests to ensure third-party transforms remain compatible
 * across API versions and pipeline changes.
 * 
 * Run with: npm run test:compatibility
 */

const assert = require('assert');
const {
  IRTransform,
  IRVisitor,
  OptimizationPass,
  LoweringPass,
  ExtensionRegistry,
  ExtensionLoader,
  CompatibilityValidator,
  API_VERSION,
} = require('../src/extensions/api');

/**
 * Mock transforms for testing
 */

class MockBasicTransform extends IRTransform {
  constructor() {
    super({
      name: 'mock-basic',
      version: '1.0.0',
      priority: 100,
    });
  }

  describe() {
    return {
      name: this.name,
      version: this.version,
      purpose: 'Test transform',
      inputTypes: ['IRNode'],
      outputTypes: ['IRNode'],
    };
  }

  transform(node) {
    return { ...node, _transformed: true };
  }

  validate(original, transformed) {
    return {
      valid: transformed._transformed === true,
      errors: [],
    };
  }
}

class MockVisitorTransform extends IRVisitor {
  constructor() {
    super({
      name: 'mock-visitor',
      version: '1.0.0',
    });
  }

  onEnter(node) {
    node._visited = true;
    return node;
  }

  getInputTypes() {
    return ['BinaryOp', 'UnaryOp'];
  }
}

class MockOptimizationPass extends OptimizationPass {
  constructor() {
    super({
      name: 'mock-optimization',
      version: '1.0.0',
      priority: 50,
    });
  }

  transform(node) {
    this.statistics.nodesProcessed++;
    if (node.type === 'Literal' && node.value > 100) {
      this.statistics.optimizationsApplied++;
      return { ...node, optimized: true };
    }
    return node;
  }
}

class MockLoweringPass extends LoweringPass {
  constructor() {
    super({
      name: 'mock-lowering',
      version: '1.0.0',
      priority: 200,
    });
  }

  getInputTypes() {
    return ['ComplexExpression'];
  }

  transform(node) {
    if (node.type === 'ComplexExpression') {
      return {
        type: 'SimpleStatement',
        body: node.operands,
      };
    }
    return node;
  }
}

// Test Suite

describe('Extension API Backward Compatibility', function() {
  this.timeout(5000);

  describe('IRTransform Base Class', function() {
    it('should create transform with required fields', function() {
      const transform = new MockBasicTransform();
      assert.strictEqual(transform.name, 'mock-basic');
      assert.strictEqual(transform.version, '1.0.0');
      assert.strictEqual(transform.priority, 100);
      assert(Array.isArray(transform.tags));
    });

    it('should require name and version', function() {
      assert.throws(() => {
        new IRTransform({ version: '1.0.0' });
      }, /name is required/);

      assert.throws(() => {
        new IRTransform({ name: 'test' });
      }, /version is required/);
    });

    it('should provide metadata', function() {
      const transform = new MockBasicTransform();
      const meta = transform.getMetadata();
      assert.strictEqual(meta.name, 'mock-basic');
      assert.strictEqual(meta.version, '1.0.0');
      assert(meta.enabled === true);
    });

    it('should describe itself', function() {
      const transform = new MockBasicTransform();
      const desc = transform.describe();
      assert(desc.name);
      assert(desc.version);
      assert(desc.purpose);
      assert(Array.isArray(desc.inputTypes));
      assert(Array.isArray(desc.outputTypes));
    });

    it('should check if it can process nodes', function() {
      const transform = new MockBasicTransform();
      assert(transform.canProcess({ type: 'IRNode' }));
      assert(!transform.canProcess(null));
    });

    it('should validate transform output', function() {
      const transform = new MockBasicTransform();
      const result = transform.validate({}, { _transformed: true });
      assert.strictEqual(result.valid, true);
    });

    it('should throw on default transform', function() {
      const transform = new IRTransform({
        name: 'test',
        version: '1.0.0',
      });
      assert.throws(() => {
        transform.transform({});
      }, /not implemented/);
    });
  });

  describe('IRVisitor Pattern', function() {
    it('should visit nodes depth-first', function() {
      const visitor = new MockVisitorTransform();
      const tree = {
        id: 1,
        type: 'BinaryOp',
        children: [
          { id: 2, type: 'Literal', value: 5 },
          { id: 3, type: 'UnaryOp' },
        ],
      };

      const result = visitor.visit(tree);
      assert(result._visited === true);
    });

    it('should prevent cycles', function() {
      const visitor = new MockVisitorTransform();
      const node = { id: 1, type: 'BinaryOp' };
      node.children = [node]; // Circular reference

      assert.doesNotThrow(() => {
        visitor.visit(node);
      });
    });

    it('should call onEnter and onExit hooks', function() {
      let enterCalled = false;
      let exitCalled = false;

      class HookVisitor extends IRVisitor {
        constructor() {
          super({ name: 'hook-visitor', version: '1.0.0' });
        }
        onEnter(node) {
          enterCalled = true;
          return node;
        }
        onExit(node) {
          exitCalled = true;
          return node;
        }
      }

      const visitor = new HookVisitor();
      visitor.visit({ id: 1, type: 'Test' });
      assert(enterCalled);
      assert(exitCalled);
    });
  });

  describe('OptimizationPass', function() {
    it('should track optimization statistics', function() {
      const pass = new MockOptimizationPass();
      const node = { type: 'Literal', value: 150 };
      
      pass.transform(node);
      const stats = pass.getStatistics();
      
      assert.strictEqual(stats.nodesProcessed, 1);
      assert.strictEqual(stats.optimizationsApplied, 1);
    });

    it('should reset statistics', function() {
      const pass = new MockOptimizationPass();
      pass.statistics.nodesProcessed = 10;
      pass.resetStatistics();
      
      assert.strictEqual(pass.statistics.nodesProcessed, 0);
    });

    it('should tag as optimization', function() {
      const pass = new MockOptimizationPass();
      assert(pass.tags.includes('optimization'));
    });
  });

  describe('LoweringPass', function() {
    it('should tag as lowering', function() {
      const pass = new MockLoweringPass();
      assert(pass.tags.includes('lowering'));
    });

    it('should require input types', function() {
      const pass = new MockLoweringPass();
      const inputs = pass.getInputTypes();
      assert(Array.isArray(inputs));
      assert(inputs.includes('ComplexExpression'));
    });

    it('should transform complex to simple', function() {
      const pass = new MockLoweringPass();
      const complex = {
        type: 'ComplexExpression',
        operands: [1, 2, 3],
      };
      const result = pass.transform(complex);
      assert.strictEqual(result.type, 'SimpleStatement');
    });
  });

  describe('ExtensionRegistry', function() {
    it('should register transforms', function() {
      const registry = new ExtensionRegistry();
      const transform = new MockBasicTransform();
      
      registry.register(transform);
      assert(registry.get('mock-basic'));
    });

    it('should prevent duplicate registration', function() {
      const registry = new ExtensionRegistry();
      const transform = new MockBasicTransform();
      
      registry.register(transform);
      assert.throws(() => {
        registry.register(transform);
      }, /already registered/);
    });

    it('should unregister transforms', function() {
      const registry = new ExtensionRegistry();
      const transform = new MockBasicTransform();
      
      registry.register(transform);
      registry.unregister('mock-basic');
      assert(!registry.get('mock-basic'));
    });

    it('should get all transforms', function() {
      const registry = new ExtensionRegistry();
      registry.register(new MockBasicTransform());
      registry.register(new MockVisitorTransform());
      
      const all = registry.getAll();
      assert.strictEqual(all.length, 2);
    });

    it('should plan execution by priority', function() {
      const registry = new ExtensionRegistry();
      registry.register(new MockLoweringPass()); // priority 200
      registry.register(new MockBasicTransform()); // priority 100
      
      const plan = registry.planExecution();
      assert.strictEqual(plan[0].name, 'mock-basic'); // Lower priority first
      assert.strictEqual(plan[1].name, 'mock-lowering');
    });

    it('should execute all transforms in order', function() {
      const registry = new ExtensionRegistry();
      registry.register(new MockBasicTransform());
      
      const node = { type: 'IRNode' };
      const result = registry.executeAll(node);
      
      assert(result._transformed === true);
    });

    it('should handle transform errors', function() {
      const registry = new ExtensionRegistry();
      
      class FailingTransform extends IRTransform {
        constructor() {
          super({ name: 'failing', version: '1.0.0' });
        }
        transform() {
          throw new Error('Transform failed');
        }
      }
      
      registry.register(new FailingTransform());
      
      assert.throws(() => {
        registry.executeAll({});
      }, /Transform failed/);
    });

    it('should collect statistics from all transforms', function() {
      const registry = new ExtensionRegistry();
      registry.register(new MockOptimizationPass());
      
      const node = { type: 'Literal', value: 150 };
      registry.executeAll(node);
      
      const stats = registry.getStatistics();
      assert(stats['mock-optimization']);
      assert.strictEqual(stats['mock-optimization'].nodesProcessed, 1);
    });
  });

  describe('CompatibilityValidator', function() {
    it('should validate compatible transforms', function() {
      const transform = new MockBasicTransform();
      const result = CompatibilityValidator.validate(transform);
      
      assert.strictEqual(result.compatible, true);
      assert.strictEqual(result.issues.length, 0);
    });

    it('should detect missing required methods', function() {
      class BadTransform extends IRTransform {
        constructor() {
          super({ name: 'bad', version: '1.0.0' });
        }
      }
      
      const transform = new BadTransform();
      const result = CompatibilityValidator.validate(transform);
      
      assert.strictEqual(result.compatible, false);
      assert(result.issues.some(i => i.includes('describe')));
    });

    it('should detect missing metadata', function() {
      class NoMetaTransform {
        transform() {}
        describe() {}
      }
      
      const transform = new NoMetaTransform();
      const result = CompatibilityValidator.validate(transform);
      
      assert.strictEqual(result.compatible, false);
    });

    it('should check compatibility level by version', function() {
      const full = CompatibilityValidator.getCompatibilityLevel('1.0.0');
      const partial = CompatibilityValidator.getCompatibilityLevel('1.1.0');
      const deprecated = CompatibilityValidator.getCompatibilityLevel('2.0.0');
      
      assert.strictEqual(full, 'full');
      assert.strictEqual(partial, 'partial');
      assert.strictEqual(deprecated, 'deprecated');
    });
  });

  describe('API Version Stability', function() {
    it('should maintain API version constant', function() {
      assert.strictEqual(API_VERSION, '1.0.0');
    });

    it('should ensure all base classes are exported', function() {
      assert(IRTransform);
      assert(IRVisitor);
      assert(OptimizationPass);
      assert(LoweringPass);
    });

    it('should ensure registry is exported', function() {
      assert(ExtensionRegistry);
    });

    it('should ensure compatibility validator is exported', function() {
      assert(CompatibilityValidator);
    });
  });

  describe('Regression: Third-Party Transform Scenarios', function() {
    it('should handle transform that adds metadata', function() {
      class AnnotatingTransform extends IRTransform {
        constructor() {
          super({
            name: 'annotating',
            version: '1.0.0',
          });
        }
        transform(node) {
          return {
            ...node,
            _metadata: {
              source: 'annotating-transform',
              timestamp: Date.now(),
            },
          };
        }
      }

      const registry = new ExtensionRegistry();
      registry.register(new AnnotatingTransform());
      
      const result = registry.executeAll({ type: 'test' });
      assert(result._metadata);
    });

    it('should handle transform that filters nodes', function() {
      class FilteringVisitor extends IRVisitor {
        constructor() {
          super({
            name: 'filtering-visitor',
            version: '1.0.0',
          });
        }
        onEnter(node) {
          if (node.type === 'Dead') return null; // Filter out
          return node;
        }
      }

      const registry = new ExtensionRegistry();
      registry.register(new FilteringVisitor());
      
      const tree = {
        type: 'Program',
        children: [
          { type: 'Statement' },
          { type: 'Dead' },
        ],
      };

      const result = registry.executeAll(tree);
      assert(result);
    });

    it('should handle chained transforms', function() {
      const registry = new ExtensionRegistry();
      
      class Transform1 extends IRTransform {
        constructor() {
          super({ name: 'transform1', version: '1.0.0', priority: 10 });
        }
        transform(node) {
          return { ...node, step1: true };
        }
      }

      class Transform2 extends IRTransform {
        constructor() {
          super({ name: 'transform2', version: '1.0.0', priority: 20 });
        }
        transform(node) {
          return { ...node, step2: true };
        }
      }

      registry.register(new Transform1());
      registry.register(new Transform2());

      const result = registry.executeAll({ type: 'test' });
      assert(result.step1 && result.step2);
    });

    it('should preserve node identity where appropriate', function() {
      const registry = new ExtensionRegistry();
      
      class IdentityTransform extends IRTransform {
        constructor() {
          super({ name: 'identity', version: '1.0.0' });
        }
        transform(node) {
          return node; // No changes
        }
      }

      registry.register(new IdentityTransform());
      const original = { type: 'test', id: 123 };
      const result = registry.executeAll(original);
      
      assert.strictEqual(result.id, original.id);
    });
  });
});

// Export for test runners
module.exports = {
  MockBasicTransform,
  MockVisitorTransform,
  MockOptimizationPass,
  MockLoweringPass,
};

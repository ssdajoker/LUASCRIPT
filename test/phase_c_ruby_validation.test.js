/**
 * ============================================================================
 * PHASE C: RUBY TIER 2A VALIDATION - CLARITY SUPER-CANON 6-PHASE GATE
 * ============================================================================
 * 
 * Validates that Ruby Tier 2A optimizer applies all 6 phases
 * 
 * RUBY TIER 2A IMPLEMENTATION:
 * - Location: src/backends/ruby/tier2_optimizer.js
 * - Target: ~700 lines of real implementation
 * - Features: Blocks, symbols, mixins, interpolation, iterators, operators
 * - Integration: Ruby transpiler + optimizer
 * 
 * Each test validates 6-phase canon with Ruby-specific patterns
 * 
 * SUCCESS CRITERIA: 43/48 tests passing (>90% pass rate)
 * 
 * ============================================================================
 */

const { RubyOptimizer } = require('../src/backends/ruby/tier2_optimizer');
const { AdvancedCache } = require('../src/optimizations/speed_optimization');
const { SecurityValidator } = require('../src/optimizations/security_algorithm_optimization');

describe('PHASE C: Ruby Tier 2A Optimizer - Clarity Super-Canon Validation', () => {

  // ============================================================================
  // RUBY OPTIMIZER VALIDATION
  // ============================================================================
  describe('Ruby Optimizer - 6-Phase Validation', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new RubyOptimizer({ cacheSize: 1000, strictMode: true });
    });

    test('RB.1: Ruby optimizer initializes', () => {
      expect(optimizer).toBeDefined();
      expect(optimizer.strictMode).toBe(true);
    });

    test('RB.2: Phase 1 - Speed: Ruby caching implemented', () => {
      expect(optimizer.rubyCache).toBeInstanceOf(AdvancedCache);
      expect(optimizer.transpilationCache).toBeInstanceOf(AdvancedCache);
      expect(optimizer.blockCache).toBeInstanceOf(AdvancedCache);
    });

    test('RB.3: Phase 1 - Speed: Symbol and mixin caching present', () => {
      expect(optimizer.symbolCache).toBeInstanceOf(AdvancedCache);
      expect(optimizer.mixinCache).toBeInstanceOf(AdvancedCache);
    });

    test('RB.4: Phase 1 - Speed: Interpolation and iterator caching', () => {
      expect(optimizer.interpolationCache).toBeInstanceOf(AdvancedCache);
      expect(optimizer.iteratorCache).toBeInstanceOf(AdvancedCache);
    });

    test('RB.5: Phase 2 - Memory: Memory pools for Ruby structures', () => {
      expect(optimizer.memoryPool).toBeDefined();
      // Should have RubyNode, Block, Symbol, Hash, Array, Method, Class, Module pools
    });

    test('RB.6: Phase 3 - Security: SecurityValidator accessible', () => {
      expect(optimizer.securityValidator).toBe(SecurityValidator);
    });

    test('RB.7: Phase 3 - Security: Ruby-specific security validation', () => {
      expect(typeof optimizer.validateRubySecurity).toBe('function');
      
      // Test that dangerous patterns are blocked
      expect(() => {
        optimizer.validateRubySecurity('eval("malicious code")');
      }).toThrow(/eval.*allows arbitrary code execution/);
    });

    test('RB.8: Phase 4 - Algorithms: AlgorithmOptimizer accessible', () => {
      expect(optimizer.algorithmOptimizer).toBeDefined();
    });

    test('RB.9: Phase 5 - Interop: Ruby-to-Lua cache present', () => {
      expect(optimizer.rubyToLuaCache).toBeInstanceOf(AdvancedCache);
    });

    test('RB.10: Phase 6 - Quality: Metrics tracking initialized', () => {
      expect(optimizer.metrics).toBeDefined();
      expect(optimizer.metrics.transpilations).toBe(0);
      expect(optimizer.metrics.cacheHits).toBe(0);
      expect(optimizer.metrics.methodsOptimized).toBe(0);
      expect(optimizer.metrics.classesOptimized).toBe(0);
    });

    test('RB.11: Transpilation method exists', () => {
      expect(typeof optimizer.optimizeTranspilation).toBe('function');
    });

    test('RB.12: Pattern extraction method exists', () => {
      expect(typeof optimizer.extractRubyPatterns).toBe('function');
    });

    test('RB.13: Ruby-specific optimizations documented', () => {
      // Should have block, symbol, mixin, interpolation optimization
      expect(optimizer.blockCache).toBeDefined();
      expect(optimizer.symbolCache).toBeDefined();
      expect(optimizer.mixinCache).toBeDefined();
      expect(optimizer.interpolationCache).toBeDefined();
      expect(optimizer.iteratorCache).toBeDefined();
    });

    test('RB.14: AST building with memory pools', () => {
      expect(typeof optimizer.buildOptimizedAST).toBe('function');
    });

    test('RB.15: Hash code generation', () => {
      expect(typeof optimizer.hashCode).toBe('function');
      const hash = optimizer.hashCode('test code');
      expect(hash).toMatch(/^rb_/);
    });

    test('RB.16: Metrics retrieval', () => {
      expect(typeof optimizer.getMetrics).toBe('function');
      const metrics = optimizer.getMetrics();
      expect(metrics.language).toBe('Ruby');
      expect(metrics.version).toBe('3.x');
      expect(metrics.tier).toBe('2A');
    });
  });

  // ============================================================================
  // RUBY PATTERN EXTRACTION VALIDATION
  // ============================================================================
  describe('Ruby Pattern Extraction - Feature Detection', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new RubyOptimizer();
    });

    test('RB.17: Extract method definitions', () => {
      const code = `
def greet(name)
  "Hello, \#{name}"
end

def calculate(x, y)
  x + y
end
`;
      const patterns = optimizer.extractRubyPatterns(code);
      expect(patterns.methods.length).toBeGreaterThanOrEqual(2);
      expect(patterns.methods.some(m => m.name === 'greet')).toBe(true);
      expect(patterns.methods.some(m => m.name === 'calculate')).toBe(true);
    });

    test('RB.18: Extract class definitions with inheritance', () => {
      const code = `
class Animal
  def speak
  end
end

class Dog < Animal
  def bark
  end
end
`;
      const patterns = optimizer.extractRubyPatterns(code);
      expect(patterns.classes.length).toBeGreaterThanOrEqual(2);
      expect(patterns.classes.some(c => c.name === 'Animal')).toBe(true);
      expect(patterns.classes.some(c => c.name === 'Dog' && c.superclass === 'Animal')).toBe(true);
    });

    test('RB.19: Extract module definitions', () => {
      const code = `
module Serializable
  def to_json
  end
end

module Cacheable
end
`;
      const patterns = optimizer.extractRubyPatterns(code);
      expect(patterns.modules.length).toBeGreaterThanOrEqual(2);
      expect(patterns.modules.some(m => m.name === 'Serializable')).toBe(true);
      expect(patterns.modules.some(m => m.name === 'Cacheable')).toBe(true);
    });

    test('RB.20: Extract blocks (braces style)', () => {
      const code = `
numbers.map { |x| x * 2 }
items.select { |item| item.valid? }
data.reduce { |acc, val| acc + val }
`;
      const patterns = optimizer.extractRubyPatterns(code);
      expect(patterns.blocks.length).toBeGreaterThanOrEqual(3);
      expect(patterns.blocks.some(b => b.style === 'braces')).toBe(true);
    });

    test('RB.21: Extract blocks (do...end style)', () => {
      const code = `
numbers.each do |n|
  puts n
  process(n)
end

files.each do |file|
  read(file)
end
`;
      const patterns = optimizer.extractRubyPatterns(code);
      expect(patterns.blocks.some(b => b.style === 'do_end')).toBe(true);
      expect(patterns.blocks.filter(b => b.style === 'do_end').length).toBeGreaterThanOrEqual(2);
    });

    test('RB.22: Extract symbols', () => {
      const code = `
hash = { :name => "John", :age => 30, :city => "NYC" }
options[:debug] = true
filter_by(:status)
`;
      const patterns = optimizer.extractRubyPatterns(code);
      expect(patterns.symbols.length).toBeGreaterThanOrEqual(3);
      expect(patterns.symbols.some(s => s.name === 'name')).toBe(true);
      expect(patterns.symbols.some(s => s.name === 'age')).toBe(true);
    });

    test('RB.23: Extract string interpolations', () => {
      const code = `
name = "Alice"
age = 25
msg = "Hello, \#{name}!"
info = "Person: \#{name}, Age: \#{age}"
`;
      const patterns = optimizer.extractRubyPatterns(code);
      expect(patterns.interpolations.length).toBeGreaterThanOrEqual(2);
    });

    test('RB.24: Extract mixins (include)', () => {
      const code = `
class MyClass
  include Enumerable
  include Comparable
  include MyModule
end
`;
      const patterns = optimizer.extractRubyPatterns(code);
      const includeMixins = patterns.mixins.filter(m => m.type === 'include');
      expect(includeMixins.length).toBeGreaterThanOrEqual(3);
      expect(includeMixins.some(m => m.module === 'Enumerable')).toBe(true);
    });

    test('RB.25: Extract mixins (extend)', () => {
      const code = `
class MyClass
  extend ClassMethods
  extend Forwardable
end
`;
      const patterns = optimizer.extractRubyPatterns(code);
      const extendMixins = patterns.mixins.filter(m => m.type === 'extend');
      expect(extendMixins.length).toBeGreaterThanOrEqual(2);
      expect(extendMixins.some(m => m.module === 'ClassMethods')).toBe(true);
    });

    test('RB.26: Extract iterators', () => {
      const code = `
[1, 2, 3].each { |n| puts n }
[1, 2, 3].map { |n| n * 2 }
[1, 2, 3].select { |n| n > 1 }
[1, 2, 3].reject { |n| n < 2 }
[1, 2, 3].find { |n| n == 2 }
`;
      const patterns = optimizer.extractRubyPatterns(code);
      expect(patterns.iterators.length).toBeGreaterThanOrEqual(5);
      expect(patterns.iterators.some(i => i.name === 'each')).toBe(true);
      expect(patterns.iterators.some(i => i.name === 'map')).toBe(true);
      expect(patterns.iterators.some(i => i.name === 'select')).toBe(true);
    });
  });

  // ============================================================================
  // RUBY TRANSPILATION VALIDATION
  // ============================================================================
  describe('Ruby Transpilation - Code Generation', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new RubyOptimizer();
    });

    test('RB.27: Transpile simple method to Lua', () => {
      const code = `
def greet(name)
  "Hello, \#{name}"
end
`;
      const result = optimizer.optimizeTranspilation(code);
      expect(result.code).toContain('function greet');
      expect(result.targetLanguage).toBe('Lua');
    });

    test('RB.28: Transpile class with inheritance to Lua', () => {
      const code = `
class Dog < Animal
  def bark
  end
end
`;
      const result = optimizer.optimizeTranspilation(code);
      expect(result.code).toContain('Dog');
      expect(result.code).toContain('setmetatable');
      expect(result.code).toContain('Animal');
    });

    test('RB.29: Transpile symbols to Lua', () => {
      const code = `
hash = { :name => "John", :age => 30 }
`;
      const result = optimizer.optimizeTranspilation(code);
      expect(result.code).toContain('Symbols');
      expect(result.metrics.symbols).toBeGreaterThanOrEqual(2);
    });

    test('RB.30: Transpile blocks to Lua', () => {
      const code = `
numbers.map { |x| x * 2 }
`;
      const result = optimizer.optimizeTranspilation(code);
      expect(result.code).toContain('ruby_block');
      expect(result.metrics.blocks).toBeGreaterThanOrEqual(1);
    });

    test('RB.31: Transpile modules to Lua', () => {
      const code = `
module Greeting
  def say_hello
  end
end
`;
      const result = optimizer.optimizeTranspilation(code);
      expect(result.code).toContain('Greeting');
      expect(result.metrics.modules).toBeGreaterThanOrEqual(1);
    });

    test('RB.32: Transpile mixins to Lua', () => {
      const code = `
class MyClass
  include Enumerable
  extend ClassMethods
end
`;
      const result = optimizer.optimizeTranspilation(code);
      expect(result.code).toContain('Mixin');
      expect(result.metrics.mixins).toBeGreaterThanOrEqual(2);
    });

    test('RB.33: Transpile iterators to Lua', () => {
      const code = `
[1, 2, 3].each { |n| puts n }
[1, 2, 3].map { |n| n * 2 }
`;
      const result = optimizer.optimizeTranspilation(code);
      expect(result.code).toContain('ruby_each');
      expect(result.code).toContain('ruby_map');
    });
  });

  // ============================================================================
  // RUBY CACHING VALIDATION
  // ============================================================================
  describe('Ruby Caching - Performance Optimization', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new RubyOptimizer();
    });

    test('RB.34: Cache transpilation results', () => {
      const code = `def test; end`;
      
      const result1 = optimizer.optimizeTranspilation(code);
      expect(result1.cacheHit).toBe(false);
      
      const result2 = optimizer.optimizeTranspilation(code);
      expect(result2.cacheHit).toBe(true);
      expect(optimizer.metrics.cacheHits).toBe(1);
    });

    test('RB.35: Cache hit rate tracking', () => {
      const code = `def func; end`;
      
      optimizer.optimizeTranspilation(code);
      optimizer.optimizeTranspilation(code);
      optimizer.optimizeTranspilation(code);
      
      const metrics = optimizer.getMetrics();
      expect(metrics.transpilations).toBe(3);
      expect(metrics.cacheHits).toBe(2);
    });

    test('RB.36: Multiple cache types active', () => {
      expect(optimizer.rubyCache).toBeDefined();
      expect(optimizer.transpilationCache).toBeDefined();
      expect(optimizer.blockCache).toBeDefined();
      expect(optimizer.symbolCache).toBeDefined();
      expect(optimizer.mixinCache).toBeDefined();
      expect(optimizer.interpolationCache).toBeDefined();
      expect(optimizer.iteratorCache).toBeDefined();
    });
  });

  // ============================================================================
  // RUBY SECURITY VALIDATION
  // ============================================================================
  describe('Ruby Security - Injection Prevention', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new RubyOptimizer();
    });

    test('RB.37: Block eval() usage', () => {
      const code = `eval("malicious = true")`;
      expect(() => {
        optimizer.optimizeTranspilation(code);
      }).toThrow(/eval.*allows arbitrary code execution/);
    });

    test('RB.38: Block instance_eval() usage', () => {
      const code = `obj.instance_eval("@secret = 'hacked'")`;
      expect(() => {
        optimizer.optimizeTranspilation(code);
      }).toThrow(/instance_eval.*allows arbitrary instance code execution/);
    });

    test('RB.39: Block send() usage', () => {
      const code = `obj.send(:private_method)`;
      expect(() => {
        optimizer.optimizeTranspilation(code);
      }).toThrow(/send.*can invoke any method bypassing visibility/);
    });

    test('RB.40: Block const_get() usage', () => {
      const code = `Object.const_get("SECRET")`;
      expect(() => {
        optimizer.optimizeTranspilation(code);
      }).toThrow(/const_get.*can access arbitrary constants/);
    });

    test('RB.41: Safe code passes validation', () => {
      const code = `
def safe_method(x, y)
  x + y
end
`;
      expect(() => {
        optimizer.optimizeTranspilation(code);
      }).not.toThrow();
    });
  });

  // ============================================================================
  // RUBY MEMORY POOL VALIDATION
  // ============================================================================
  describe('Ruby Memory Pools - Resource Management', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new RubyOptimizer();
    });

    test('RB.42: Memory pool manager exists', () => {
      expect(optimizer.memoryPool).toBeDefined();
      expect(typeof optimizer.memoryPool.acquire).toBe('function');
      expect(typeof optimizer.memoryPool.release).toBe('function');
    });

    test('RB.43: RubyNode pool available', () => {
      const node = optimizer.memoryPool.acquire('RubyNode');
      expect(node).toBeDefined();
      expect(node.type).toBe('node');
    });

    test('RB.44: Block pool available', () => {
      const block = optimizer.memoryPool.acquire('Block');
      expect(block).toBeDefined();
      expect(block.type).toBe('block');
    });

    test('RB.45: Symbol pool available', () => {
      const symbol = optimizer.memoryPool.acquire('Symbol');
      expect(symbol).toBeDefined();
      expect(symbol.type).toBe('symbol');
    });

    test('RB.46: Hash and Array pools available', () => {
      const hash = optimizer.memoryPool.acquire('Hash');
      const array = optimizer.memoryPool.acquire('Array');
      expect(hash).toBeDefined();
      expect(hash.type).toBe('hash');
      expect(array).toBeDefined();
      expect(array.type).toBe('array');
    });

    test('RB.47: AST building uses memory pools', () => {
      const code = `
def func1; end
class MyClass; end
module MyModule; end
`;
      const patterns = optimizer.extractRubyPatterns(code);
      const ast = optimizer.buildOptimizedAST(patterns);
      expect(ast.nodeCount).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // RUBY METRICS VALIDATION
  // ============================================================================
  describe('Ruby Metrics - Quality Tracking', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new RubyOptimizer();
    });

    test('RB.48: Comprehensive metrics tracking', () => {
      const code = `
class Dog < Animal
  include Comparable
  extend ClassMethods
  
  def bark
    "Woof"
  end
end

module Greeting
end

[1, 2, 3].map { |x| x * 2 }
hash = { :name => "John" }
msg = "Hello, \#{name}"
`;
      optimizer.optimizeTranspilation(code);
      
      const metrics = optimizer.getMetrics();
      expect(metrics.methodsOptimized).toBeGreaterThanOrEqual(1);
      expect(metrics.classesOptimized).toBeGreaterThanOrEqual(1);
      expect(metrics.modulesOptimized).toBeGreaterThanOrEqual(1);
      expect(metrics.blocksOptimized).toBeGreaterThanOrEqual(1);
      expect(metrics.symbolsInterned).toBeGreaterThanOrEqual(1);
      expect(metrics.mixinsApplied).toBeGreaterThanOrEqual(2);
      expect(metrics.interpolationsCompiled).toBeGreaterThanOrEqual(1);
    });
  });
});

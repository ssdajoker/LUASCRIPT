/**
 * ============================================================================
 * PHASE B: RUBY TIER 1 VALIDATION - CLARITY SUPER-CANON 6-PHASE GATE
 * ============================================================================
 * 
 * Validates that Ruby Tier 1 transpiler applies all 6 phases
 * 
 * RUBY TIER 1 IMPLEMENTATION:
 * - Location: src/backends/ruby/transpiler.js
 * - Target: ~1000 lines of real implementation
 * - Features: Blocks, symbols, mixins, interpolation, iterators
 * - Integration: Ruby parser + transpiler + optimizer
 * 
 * Each test validates 6-phase canon with Ruby-specific patterns
 * 
 * SUCCESS CRITERIA: 28/31 tests passing (>90% pass rate)
 * 
 * ============================================================================
 */

const { RubyTranspiler } = require('../src/backends/ruby/transpiler');
const { AdvancedCache } = require('../src/optimizations/speed_optimization');
const { SecurityValidator } = require('../src/optimizations/security_algorithm_optimization');

describe('PHASE B: Ruby Tier 1 Transpiler - Clarity Super-Canon Validation', () => {

  // ============================================================================
  // RUBY TRANSPILER VALIDATION
  // ============================================================================
  describe('Ruby Transpiler - 6-Phase Validation', () => {
    let transpiler;

    beforeEach(() => {
      transpiler = new RubyTranspiler({ cacheSize: 1000, enableOptimization: true });
    });

    test('RB.1: Ruby transpiler initializes', () => {
      expect(transpiler).toBeDefined();
      expect(transpiler.enableOptimization).toBe(true);
    });

    test('RB.2: Phase 1 - Speed: Ruby caching implemented', () => {
      expect(transpiler.rubyCache).toBeInstanceOf(AdvancedCache);
      expect(transpiler.transpilationCache).toBeInstanceOf(AdvancedCache);
    });

    test('RB.3: Phase 1 - Speed: Block caching present', () => {
      expect(transpiler.blockCache).toBeInstanceOf(AdvancedCache);
      expect(transpiler.symbolCache).toBeInstanceOf(AdvancedCache);
    });

    test('RB.4: Phase 1 - Speed: Mixin caching present', () => {
      expect(transpiler.mixinCache).toBeInstanceOf(AdvancedCache);
    });

    test('RB.5: Phase 2 - Memory: Memory pools for Ruby structures', () => {
      expect(transpiler.memoryPool).toBeDefined();
      // Should have RubyNode, Block, Symbol, Hash, Array, Method, Class, Module pools
    });

    test('RB.6: Phase 3 - Security: SecurityValidator accessible', () => {
      expect(transpiler.securityValidator).toBe(SecurityValidator);
    });

    test('RB.7: Phase 3 - Security: Ruby-specific security validation', () => {
      expect(typeof transpiler.validateRubySecurity).toBe('function');
      
      // Test that dangerous patterns are blocked
      expect(() => {
        transpiler.validateRubySecurity('eval("malicious code")');
      }).toThrow(/eval.*allows arbitrary code execution/);
    });

    test('RB.8: Phase 4 - Algorithms: AlgorithmOptimizer accessible', () => {
      expect(transpiler.algorithmOptimizer).toBeDefined();
    });

    test('RB.9: Phase 5 - Interop: Ruby-to-Lua cache present', () => {
      expect(transpiler.rubyToLuaCache).toBeInstanceOf(AdvancedCache);
    });

    test('RB.10: Phase 6 - Quality: Metrics tracking initialized', () => {
      expect(transpiler.metrics).toBeDefined();
      expect(transpiler.metrics.transpilations).toBe(0);
      expect(transpiler.metrics.cacheHits).toBe(0);
      expect(transpiler.metrics.blocksTranspiled).toBe(0);
      expect(transpiler.metrics.symbolsConverted).toBe(0);
    });

    test('RB.11: Transpilation method exists', () => {
      expect(typeof transpiler.transpile).toBe('function');
    });

    test('RB.12: Pattern extraction method exists', () => {
      expect(typeof transpiler.extractRubyPatterns).toBe('function');
    });

    test('RB.13: Ruby-specific optimizations documented', () => {
      // Should have block, symbol, mixin optimization
      expect(transpiler.blockCache).toBeDefined();
      expect(transpiler.symbolCache).toBeDefined();
      expect(transpiler.mixinCache).toBeDefined();
    });

    test('RB.14: AST building with memory pools', () => {
      expect(typeof transpiler.buildOptimizedAST).toBe('function');
    });

    test('RB.15: Hash code generation', () => {
      expect(typeof transpiler.hashCode).toBe('function');
      const hash = transpiler.hashCode('test code');
      expect(hash).toMatch(/^rb_/);
    });

    test('RB.16: Metrics retrieval', () => {
      expect(typeof transpiler.getMetrics).toBe('function');
      const metrics = transpiler.getMetrics();
      expect(metrics.language).toBe('Ruby');
      expect(metrics.version).toBe('3.x');
    });
  });

  // ============================================================================
  // RUBY PATTERN EXTRACTION VALIDATION
  // ============================================================================
  describe('Ruby Pattern Extraction - Feature Detection', () => {
    let transpiler;

    beforeEach(() => {
      transpiler = new RubyTranspiler();
    });

    test('RB.17: Extract method definitions', () => {
      const code = `
def greet(name)
  "Hello, \#{name}"
end

def add(x, y)
  x + y
end
`;
      const patterns = transpiler.extractRubyPatterns(code);
      expect(patterns.methods.length).toBeGreaterThanOrEqual(2);
      expect(patterns.methods.some(m => m.name === 'greet')).toBe(true);
      expect(patterns.methods.some(m => m.name === 'add')).toBe(true);
    });

    test('RB.18: Extract class definitions', () => {
      const code = `
class Person
  def initialize(name)
    @name = name
  end
end

class Student < Person
end
`;
      const patterns = transpiler.extractRubyPatterns(code);
      expect(patterns.classes.length).toBeGreaterThanOrEqual(2);
      expect(patterns.classes.some(c => c.name === 'Person')).toBe(true);
      expect(patterns.classes.some(c => c.name === 'Student')).toBe(true);
    });

    test('RB.19: Extract module definitions', () => {
      const code = `
module Greeting
  def say_hello
    puts "Hello"
  end
end

module Logger
end
`;
      const patterns = transpiler.extractRubyPatterns(code);
      expect(patterns.modules.length).toBeGreaterThanOrEqual(2);
      expect(patterns.modules.some(m => m.name === 'Greeting')).toBe(true);
      expect(patterns.modules.some(m => m.name === 'Logger')).toBe(true);
    });

    test('RB.20: Extract blocks (braces style)', () => {
      const code = `
numbers.map { |x| x * 2 }
items.select { |item| item.valid? }
`;
      const patterns = transpiler.extractRubyPatterns(code);
      expect(patterns.blocks.length).toBeGreaterThanOrEqual(2);
      expect(patterns.blocks.some(b => b.style === 'braces')).toBe(true);
    });

    test('RB.21: Extract blocks (do...end style)', () => {
      const code = `
numbers.each do |n|
  puts n
end
`;
      const patterns = transpiler.extractRubyPatterns(code);
      expect(patterns.blocks.some(b => b.style === 'do_end')).toBe(true);
    });

    test('RB.22: Extract symbols', () => {
      const code = `
hash = { :name => "John", :age => 30 }
options[:debug] = true
`;
      const patterns = transpiler.extractRubyPatterns(code);
      expect(patterns.symbols.length).toBeGreaterThanOrEqual(2);
      expect(patterns.symbols.some(s => s.name === 'name')).toBe(true);
      expect(patterns.symbols.some(s => s.name === 'age')).toBe(true);
    });

    test('RB.23: Extract string interpolations', () => {
      const code = `
name = "World"
msg = "Hello, \#{name}!"
info = "Value: \#{x}, Count: \#{count}"
`;
      const patterns = transpiler.extractRubyPatterns(code);
      expect(patterns.interpolations.length).toBeGreaterThanOrEqual(2);
    });

    test('RB.24: Extract mixins (include)', () => {
      const code = `
class MyClass
  include Enumerable
  include Comparable
end
`;
      const patterns = transpiler.extractRubyPatterns(code);
      expect(patterns.mixins.some(m => m.type === 'include' && m.module === 'Enumerable')).toBe(true);
    });

    test('RB.25: Extract mixins (extend)', () => {
      const code = `
class MyClass
  extend ClassMethods
end
`;
      const patterns = transpiler.extractRubyPatterns(code);
      expect(patterns.mixins.some(m => m.type === 'extend' && m.module === 'ClassMethods')).toBe(true);
    });

    test('RB.26: Extract iterators', () => {
      const code = `
[1, 2, 3].each { |n| puts n }
[1, 2, 3].map { |n| n * 2 }
[1, 2, 3].select { |n| n > 1 }
`;
      const patterns = transpiler.extractRubyPatterns(code);
      expect(patterns.iterators.length).toBeGreaterThanOrEqual(3);
      expect(patterns.iterators.some(i => i.name === 'each')).toBe(true);
      expect(patterns.iterators.some(i => i.name === 'map')).toBe(true);
    });
  });

  // ============================================================================
  // RUBY TRANSPILATION VALIDATION
  // ============================================================================
  describe('Ruby Transpilation - Code Generation', () => {
    let transpiler;

    beforeEach(() => {
      transpiler = new RubyTranspiler();
    });

    test('RB.27: Transpile simple method to Lua', () => {
      const code = `
def greet(name)
  "Hello, \#{name}"
end
`;
      const result = transpiler.transpile(code);
      expect(result.code).toContain('function greet');
      expect(result.targetLanguage).toBe('Lua');
    });

    test('RB.28: Transpile class to Lua', () => {
      const code = `
class MyClass
  def initialize
  end
end
`;
      const result = transpiler.transpile(code);
      expect(result.code).toContain('MyClass');
      expect(result.code).toContain('setmetatable');
    });

    test('RB.29: Transpile symbols to Lua', () => {
      const code = `
hash = { :name => "John" }
`;
      const result = transpiler.transpile(code);
      expect(result.code).toContain('Symbols');
      expect(result.metrics.symbols).toBeGreaterThanOrEqual(1);
    });

    test('RB.30: Cache transpilation results', () => {
      const code = `def test; end`;
      
      const result1 = transpiler.transpile(code);
      expect(result1.cacheHit).toBe(false);
      
      const result2 = transpiler.transpile(code);
      expect(result2.cacheHit).toBe(true);
      expect(transpiler.metrics.cacheHits).toBe(1);
    });

    test('RB.31: Security validation blocks dangerous patterns', () => {
      const code = `eval("malicious code")`;
      expect(() => {
        transpiler.transpile(code);
      }).toThrow(/eval.*allows arbitrary code execution/);
    });
  });
});

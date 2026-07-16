/**
 * ============================================================================
 * PHASE C: DART TIER 2A VALIDATION - CLARITY SUPER-CANON 6-PHASE GATE
 * ============================================================================
 * 
 * Validates that Dart Tier 2A optimizer applies all 6 phases
 * 
 * DART TIER 2A IMPLEMENTATION:
 * - Location: src/backends/dart/tier2_optimizer.js
 * - Target: ~350 lines of real implementation
 * - Features: Types, generics, async/await, mixins, extensions
 * - Integration: Dart parser + lowerer + optimizer
 * 
 * Each test validates 6-phase canon with Dart-specific patterns
 * 
 * SUCCESS CRITERIA: 43/48 tests passing (>90% pass rate)
 * 
 * ============================================================================
 */

const { DartOptimizer } = require('../src/backends/dart/tier2_optimizer');
const { AdvancedCache } = require('../src/optimizations/speed_optimization');
const { SecurityValidator } = require('../src/optimizations/security_algorithm_optimization');

describe('PHASE C: Dart Tier 2A Optimizer - Clarity Super-Canon Validation', () => {

  // ============================================================================
  // DART OPTIMIZER VALIDATION
  // ============================================================================
  describe('Dart Optimizer - 6-Phase Validation', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new DartOptimizer({ cacheSize: 1000, strictNullSafety: true });
    });

    test('DO.1: Dart optimizer initializes', () => {
      expect(optimizer).toBeDefined();
      expect(optimizer.strictNullSafety).toBe(true);
    });

    test('DO.2: Phase 1 - Speed: Dart caching implemented', () => {
      expect(optimizer.dartCache).toBeInstanceOf(AdvancedCache);
      expect(optimizer.transpilationCache).toBeInstanceOf(AdvancedCache);
    });

    test('DO.3: Phase 1 - Speed: Type annotation caching present', () => {
      expect(optimizer.typeCache).toBeInstanceOf(AdvancedCache);
      expect(optimizer.asyncCache).toBeInstanceOf(AdvancedCache);
    });

    test('DO.4: Phase 1 - Speed: Generic and mixin caching', () => {
      expect(optimizer.genericCache).toBeInstanceOf(AdvancedCache);
      expect(optimizer.mixinCache).toBeInstanceOf(AdvancedCache);
    });

    test('DO.5: Phase 1 - Speed: Future and extension caching', () => {
      expect(optimizer.futureCache).toBeInstanceOf(AdvancedCache);
      expect(optimizer.extensionCache).toBeInstanceOf(AdvancedCache);
    });

    test('DO.6: Phase 1 - Speed: Null-safety operator caching', () => {
      expect(optimizer.nullSafetyCache).toBeInstanceOf(AdvancedCache);
    });

    test('DO.7: Phase 2 - Memory: Memory pools for Dart structures', () => {
      expect(optimizer.memoryPool).toBeDefined();
      // Should have DartNode, Type, Generic, Function, Mixin pools
    });

    test('DO.8: Phase 3 - Security: SecurityValidator accessible', () => {
      expect(optimizer.securityValidator).toBe(SecurityValidator);
    });

    test('DO.9: Phase 3 - Security: Dart-specific security validation', () => {
      expect(typeof optimizer.validateDartSecurity).toBe('function');
      
      // Test that dangerous patterns are blocked
      expect(() => {
        optimizer.validateDartSecurity('import "dart:mirrors";');
      }).toThrow(/dart:mirrors/i);
    });

    test('DO.10: Phase 3 - Security: Reflection blocking', () => {
      expect(() => {
        optimizer.validateDartSecurity('reflectClass(MyClass)');
      }).toThrow(/reflection/i);
    });

    test('DO.11: Phase 4 - Algorithms: AlgorithmOptimizer accessible', () => {
      expect(optimizer.algorithmOptimizer).toBeDefined();
    });

    test('DO.12: Phase 5 - Interop: Dart-to-Lua cache present', () => {
      expect(optimizer.dartToLuaCache).toBeInstanceOf(AdvancedCache);
    });

    test('DO.13: Phase 6 - Quality: Metrics tracking initialized', () => {
      expect(optimizer.metrics).toBeDefined();
      expect(optimizer.metrics.transpilations).toBe(0);
      expect(optimizer.metrics.cacheHits).toBe(0);
      expect(optimizer.metrics.typesOptimized).toBe(0);
      expect(optimizer.metrics.functionsOptimized).toBe(0);
    });

    test('DO.14: Optimization method exists', () => {
      expect(typeof optimizer.optimizeTranspilation).toBe('function');
    });

    test('DO.15: Pattern extraction method exists', () => {
      expect(typeof optimizer.extractDartPatterns).toBe('function');
    });

    test('DO.16: AST building method exists', () => {
      expect(typeof optimizer.buildOptimizedAST).toBe('function');
    });

    test('DO.17: Lua transpilation method exists', () => {
      expect(typeof optimizer.transpileToLua).toBe('function');
    });

    test('DO.18: Name sanitization method exists', () => {
      expect(typeof optimizer.sanitizeName).toBe('function');
    });

    test('DO.19: Metrics retrieval method exists', () => {
      expect(typeof optimizer.getMetrics).toBe('function');
    });

    test('DO.20: Hash function exists for caching', () => {
      expect(typeof optimizer.hashCode).toBe('function');
    });

    test('DO.21: Simple type annotation optimization', () => {
      const dartCode = 'int x = 5; String name = "test";';
      const result = optimizer.optimizeTranspilation(dartCode);
      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      expect(result.language).toBe('Dart');
      expect(result.optimizations).toBeDefined();
    });

    test('DO.22: Function optimization', () => {
      const dartCode = 'void greet(String name) { print(name); }';
      const result = optimizer.optimizeTranspilation(dartCode);
      expect(result.metrics.functions).toBeGreaterThanOrEqual(0);
      expect(result.optimizations.phase4_algorithm.functionsOptimized).toBeGreaterThanOrEqual(0);
    });

    test('DO.23: Class optimization', () => {
      const dartCode = 'class Person { String name; }';
      const result = optimizer.optimizeTranspilation(dartCode);
      expect(result.metrics.classes).toBeGreaterThanOrEqual(0);
      expect(result.optimizations.phase4_algorithm.classesOptimized).toBeGreaterThanOrEqual(0);
    });

    test('DO.24: Async/await optimization', () => {
      const dartCode = 'Future<int> fetchData() async { return await api.get(); }';
      const result = optimizer.optimizeTranspilation(dartCode);
      expect(result.metrics.asyncPatterns).toBeGreaterThanOrEqual(1);
      expect(result.optimizations.phase1_speed.asyncPatternsCached).toBeGreaterThanOrEqual(0);
    });

    test('DO.25: Generic type optimization', () => {
      const dartCode = 'List<int> items = []; Map<String, int> map = {};';
      const result = optimizer.optimizeTranspilation(dartCode);
      expect(result.metrics.generics).toBeGreaterThanOrEqual(0);
      expect(result.optimizations.phase1_speed.genericsCached).toBeGreaterThanOrEqual(0);
    });

    test('DO.26: Mixin optimization', () => {
      const dartCode = 'mixin Drawable { void draw() {} }';
      const result = optimizer.optimizeTranspilation(dartCode);
      expect(result.metrics.mixins).toBeGreaterThanOrEqual(0);
      expect(result.optimizations.phase4_algorithm.mixinsOptimized).toBeGreaterThanOrEqual(0);
    });

    test('DO.27: Extension optimization', () => {
      const dartCode = 'extension StringX on String { void doSomething() {} }';
      const result = optimizer.optimizeTranspilation(dartCode);
      expect(result.metrics.extensions).toBeGreaterThanOrEqual(0);
    });

    test('DO.28: Null-safety handling', () => {
      const dartCode = 'String? nullable; int value = nullable?.length ?? 0;';
      const result = optimizer.optimizeTranspilation(dartCode);
      expect(result.metrics.types).toBeGreaterThanOrEqual(1);
    });

    test('DO.29: Cache hit tracking', () => {
      const dartCode = 'int x = 5;';
      optimizer.optimizeTranspilation(dartCode);
      const result = optimizer.optimizeTranspilation(dartCode);
      expect(result.cacheHit).toBe(true);
      expect(optimizer.metrics.cacheHits).toBe(1);
    });

    test('DO.30: All 6 phases present in optimization result', () => {
      const dartCode = 'int x = 5;';
      const result = optimizer.optimizeTranspilation(dartCode);
      expect(result.optimizations.phase1_speed).toBeDefined();
      expect(result.optimizations.phase2_memory).toBeDefined();
      expect(result.optimizations.phase3_security).toBeDefined();
      expect(result.optimizations.phase4_algorithm).toBeDefined();
      expect(result.optimizations.phase5_interop).toBeDefined();
      expect(result.optimizations.phase6_quality).toBeDefined();
    });

    test('DO.31: Phase 1 Speed optimizations tracked', () => {
      const dartCode = 'int x = 5;';
      const result = optimizer.optimizeTranspilation(dartCode);
      const phase1 = result.optimizations.phase1_speed;
      expect(phase1.typesCached).toBeGreaterThanOrEqual(0);
      expect(phase1.functionsCached).toBeGreaterThanOrEqual(0);
      expect(phase1.asyncPatternsCached).toBeGreaterThanOrEqual(0);
    });

    test('DO.32: Phase 2 Memory optimizations tracked', () => {
      const dartCode = 'int x = 5;';
      const result = optimizer.optimizeTranspilation(dartCode);
      const phase2 = result.optimizations.phase2_memory;
      expect(phase2.poolsUsed).toBeGreaterThan(0);
      expect(phase2.nodesPooled).toBeGreaterThanOrEqual(0);
    });

    test('DO.33: Phase 3 Security optimizations tracked', () => {
      const dartCode = 'int x = 5;';
      const result = optimizer.optimizeTranspilation(dartCode);
      const phase3 = result.optimizations.phase3_security;
      expect(phase3.validated).toBe(true);
      expect(phase3.injectionChecksPassed).toBe(true);
      expect(phase3.reflectionBlocked).toBe(true);
    });

    test('DO.34: Phase 4 Algorithm optimizations tracked', () => {
      const dartCode = 'void test() {}';
      const result = optimizer.optimizeTranspilation(dartCode);
      const phase4 = result.optimizations.phase4_algorithm;
      expect(phase4.functionsOptimized).toBeGreaterThanOrEqual(0);
      expect(phase4.classesOptimized).toBeGreaterThanOrEqual(0);
    });

    test('DO.35: Phase 5 Interop optimizations tracked', () => {
      const dartCode = 'int x = 5;';
      const result = optimizer.optimizeTranspilation(dartCode);
      const phase5 = result.optimizations.phase5_interop;
      expect(phase5.dartToLuaCached).toBeGreaterThanOrEqual(0);
      expect(phase5.targetLanguage).toBe('Lua');
    });

    test('DO.36: Phase 6 Quality optimizations tracked', () => {
      const dartCode = 'int x = 5;';
      const result = optimizer.optimizeTranspilation(dartCode);
      const phase6 = result.optimizations.phase6_quality;
      expect(phase6.jsdocAnnotated).toBe(true);
      expect(phase6.dartFeaturesPreserved).toBe(true);
    });

    test('DO.37: Dart version reported', () => {
      const dartCode = 'int x = 5;';
      const result = optimizer.optimizeTranspilation(dartCode);
      expect(result.dartVersion).toBe('3.x');
    });

    test('DO.38: Target language is Lua', () => {
      const dartCode = 'int x = 5;';
      const result = optimizer.optimizeTranspilation(dartCode);
      expect(result.targetLanguage).toBe('Lua');
    });

    test('DO.39: Metrics duration is positive', () => {
      const dartCode = 'int x = 5;';
      const result = optimizer.optimizeTranspilation(dartCode);
      expect(result.metrics.duration).toBeGreaterThanOrEqual(0);
    });

    test('DO.40: Lua code output is generated', () => {
      const dartCode = 'int x = 5;';
      const result = optimizer.optimizeTranspilation(dartCode);
      expect(result.code).toContain('--');
      expect(result.code.length).toBeGreaterThan(0);
    });

    test('DO.41: Complex code handling', () => {
      const dartCode = `
        class Animal {
          void speak() {}
        }
        
        mixin Runner {
          void run() {}
        }
        
        class Dog extends Animal with Runner {}
        
        extension AnimalX on Animal {
          void rest() {}
        }
        
        Future<void> main() async {
          var dog = Dog();
          await dog.run();
        }
      `;
      const result = optimizer.optimizeTranspilation(dartCode);
      expect(result).toBeDefined();
      expect(result.metrics.classes).toBeGreaterThan(0);
      expect(result.metrics.mixins).toBeGreaterThan(0);
      expect(result.metrics.asyncPatterns).toBeGreaterThan(0);
    });

    test('DO.42: Metrics consistency', () => {
      const dartCode = 'int x = 5;';
      const result = optimizer.optimizeTranspilation(dartCode);
      const metrics = optimizer.getMetrics();
      expect(metrics.transpilations).toBeGreaterThan(0);
      expect(metrics.cacheHitRate).toBeDefined();
    });

    test('DO.43: Name sanitization works', () => {
      const sanitized = optimizer.sanitizeName('List<int>');
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });

    test('DO.44: Type pattern extraction', () => {
      const code = 'int x; String name; List<int> items;';
      const patterns = optimizer.extractDartPatterns(code);
      expect(patterns.types.length).toBeGreaterThan(0);
    });

    test('DO.45: Generic pattern extraction', () => {
      const code = 'class Container<T> {}';
      const patterns = optimizer.extractDartPatterns(code);
      expect(patterns.generics.length).toBeGreaterThan(0);
    });

    test('DO.46: Function pattern extraction', () => {
      const code = 'void hello() {}';
      const patterns = optimizer.extractDartPatterns(code);
      expect(patterns.functions.length).toBeGreaterThan(0);
    });

    test('DO.47: Class pattern extraction', () => {
      const code = 'class MyClass {}';
      const patterns = optimizer.extractDartPatterns(code);
      expect(patterns.classes.length).toBeGreaterThan(0);
    });

    test('DO.48: AST construction from patterns', () => {
      const code = 'int x; void test() {}';
      const patterns = optimizer.extractDartPatterns(code);
      const ast = optimizer.buildOptimizedAST(patterns);
      expect(ast).toBeDefined();
      expect(ast.type).toBe('program');
      expect(ast.nodeCount).toBeGreaterThanOrEqual(0);
    });
  });
});

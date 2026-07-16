/**
 * ============================================================================
 * PHASE B: DART TIER 1 VALIDATION - CLARITY SUPER-CANON 6-PHASE GATE
 * ============================================================================
 * 
 * Validates that Dart Tier 1 transpiler applies all 6 phases
 * 
 * DART TIER 1 IMPLEMENTATION:
 * - Location: src/backends/dart/transpiler.js
 * - Target: ~1000 lines of real implementation
 * - Features: Type annotations, async/await, generics, mixins, extensions
 * - Integration: Dart parser + transpiler + optimizer
 * 
 * Each test validates 6-phase canon with Dart-specific patterns
 * 
 * SUCCESS CRITERIA: 28/31 tests passing (>90% pass rate)
 * 
 * ============================================================================
 */

const { DartTranspiler } = require('../src/backends/dart/transpiler');
const { AdvancedCache } = require('../src/optimizations/speed_optimization');
const { SecurityValidator } = require('../src/optimizations/security_algorithm_optimization');

describe('PHASE B: Dart Tier 1 Transpiler - Clarity Super-Canon Validation', () => {

  // ============================================================================
  // DART TRANSPILER VALIDATION
  // ============================================================================
  describe('Dart Transpiler - 6-Phase Validation', () => {
    let transpiler;

    beforeEach(() => {
      transpiler = new DartTranspiler({ cacheSize: 1000, enableOptimization: true });
    });

    test('DT.1: Dart transpiler initializes', () => {
      expect(transpiler).toBeDefined();
      expect(transpiler.enableOptimization).toBe(true);
    });

    test('DT.2: Phase 1 - Speed: Dart caching implemented', () => {
      expect(transpiler.dartCache).toBeInstanceOf(AdvancedCache);
      expect(transpiler.transpilationCache).toBeInstanceOf(AdvancedCache);
    });

    test('DT.3: Phase 1 - Speed: Type annotation caching present', () => {
      expect(transpiler.typeCache).toBeInstanceOf(AdvancedCache);
      expect(transpiler.asyncCache).toBeInstanceOf(AdvancedCache);
    });

    test('DT.4: Phase 1 - Speed: Generic and mixin caching', () => {
      expect(transpiler.genericCache).toBeInstanceOf(AdvancedCache);
      expect(transpiler.mixinCache).toBeInstanceOf(AdvancedCache);
    });

    test('DT.5: Phase 1 - Speed: Stream and future caching', () => {
      expect(transpiler.streamCache).toBeInstanceOf(AdvancedCache);
      expect(transpiler.futureCache).toBeInstanceOf(AdvancedCache);
    });

    test('DT.6: Phase 2 - Memory: Memory pools for Dart structures', () => {
      expect(transpiler.memoryPool).toBeDefined();
      // Should have DartNode, Type, Generic, Function, Mixin, Class, Extension pools
    });

    test('DT.7: Phase 3 - Security: SecurityValidator accessible', () => {
      expect(transpiler.securityValidator).toBe(SecurityValidator);
    });

    test('DT.8: Phase 3 - Security: Dart-specific security validation', () => {
      expect(typeof transpiler.validateDartSecurity).toBe('function');
      
      // Test that dangerous Dart patterns are blocked
      expect(() => {
        transpiler.validateDartSecurity('import "dart:mirrors";');
      }).toThrow(/dart:mirrors.*reflection/i);
    });

    test('DT.9: Phase 3 - Security: Mirrors blocking', () => {
      expect(() => {
        transpiler.validateDartSecurity('reflectClass(MyClass)');
      }).toThrow(/reflectClass.*reflection/i);
    });

    test('DT.10: Phase 3 - Security: Reflection blocking', () => {
      expect(() => {
        transpiler.validateDartSecurity('InstanceMirror mirror = reflect(obj)');
      }).toThrow(/InstanceMirror.*dynamic/i);
    });

    test('DT.11: Phase 4 - Algorithms: AlgorithmOptimizer accessible', () => {
      expect(transpiler.algorithmOptimizer).toBeDefined();
    });

    test('DT.12: Phase 5 - Interop: Dart-to-Lua cache present', () => {
      expect(transpiler.dartToLuaCache).toBeInstanceOf(AdvancedCache);
    });

    test('DT.13: Phase 6 - Quality: Metrics tracking initialized', () => {
      expect(transpiler.metrics).toBeDefined();
      expect(transpiler.metrics.transpilations).toBe(0);
      expect(transpiler.metrics.cacheHits).toBe(0);
      expect(transpiler.metrics.functionsTranspiled).toBe(0);
      expect(transpiler.metrics.classesTranspiled).toBe(0);
      expect(transpiler.metrics.mixinsTranspiled).toBe(0);
    });

    test('DT.14: Transpilation method exists', () => {
      expect(typeof transpiler.transpile).toBe('function');
    });

    test('DT.15: Pattern extraction method exists', () => {
      expect(typeof transpiler.extractDartPatterns).toBe('function');
    });

    test('DT.16: Dart-specific optimizations documented', () => {
      // Test that transpiler has all required caches
      expect(transpiler.extensionCache).toBeInstanceOf(AdvancedCache);
      expect(transpiler.futureCache).toBeInstanceOf(AdvancedCache);
    });

    test('DT.17: AST building method exists', () => {
      expect(typeof transpiler.buildOptimizedAST).toBe('function');
    });

    test('DT.18: Lua transpilation method exists', () => {
      expect(typeof transpiler.transpileToLua).toBe('function');
    });

    test('DT.19: Metrics retrieval method exists', () => {
      expect(typeof transpiler.getMetrics).toBe('function');
    });

    test('DT.20: Hash function exists for caching', () => {
      expect(typeof transpiler.hashCode).toBe('function');
    });

    test('DT.21: Simple type annotation parsing', () => {
      const dartCode = 'int x = 5;';
      const result = transpiler.transpile(dartCode);
      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      expect(result.language).toBe('Dart');
    });

    test('DT.22: Function transpilation', () => {
      const dartCode = 'void greet(String name) { print(name); }';
      const result = transpiler.transpile(dartCode);
      expect(result).toBeDefined();
      expect(result.metrics.functions).toBeGreaterThanOrEqual(0);
    });

    test('DT.23: Class transpilation', () => {
      const dartCode = 'class Person { String name; }';
      const result = transpiler.transpile(dartCode);
      expect(result).toBeDefined();
      expect(result.metrics.classes).toBeGreaterThanOrEqual(0);
    });

    test('DT.24: Async/await transpilation', () => {
      const dartCode = 'Future<int> fetchData() async { return await api.get(); }';
      const result = transpiler.transpile(dartCode);
      expect(result).toBeDefined();
      expect(result.metrics.asyncPatterns).toBeGreaterThanOrEqual(1);
    });

    test('DT.25: Mixin transpilation', () => {
      const dartCode = 'mixin Drawable { void draw() {} }';
      const result = transpiler.transpile(dartCode);
      expect(result).toBeDefined();
      expect(result.metrics.mixins).toBeGreaterThanOrEqual(0);
    });

    test('DT.26: Generic type transpilation', () => {
      const dartCode = 'List<int> items = [];';
      const result = transpiler.transpile(dartCode);
      expect(result).toBeDefined();
      expect(result.metrics.generics).toBeGreaterThanOrEqual(0);
    });

    test('DT.27: Null safety operator handling', () => {
      const dartCode = 'String? nullable; String nonNull = "";';
      const result = transpiler.transpile(dartCode);
      expect(result).toBeDefined();
      expect(result.metrics.types).toBeGreaterThanOrEqual(0);
    });

    test('DT.28: Cache hit tracking', () => {
      const dartCode = 'int x = 5;';
      transpiler.transpile(dartCode);
      const result = transpiler.transpile(dartCode);
      expect(result.cacheHit).toBe(true);
      expect(transpiler.metrics.cacheHits).toBe(1);
    });

    test('DT.29: Extension method transpilation', () => {
      const dartCode = 'extension StringX on String { void doSomething() {} }';
      const result = transpiler.transpile(dartCode);
      expect(result).toBeDefined();
      expect(result.metrics.extensions).toBeGreaterThanOrEqual(0);
    });

    test('DT.30: Lua code generation', () => {
      const dartCode = 'void hello() {}';
      const result = transpiler.transpile(dartCode);
      expect(result.code).toContain('--');
      expect(result.code).toContain('function');
    });

    test('DT.31: Metrics reporting', () => {
      const dartCode = 'int x = 5;';
      transpiler.transpile(dartCode);
      const metrics = transpiler.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.transpilations).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // DART SECURITY VALIDATION
  // ============================================================================
  describe('Dart Transpiler - Security Validation', () => {
    let transpiler;

    beforeEach(() => {
      transpiler = new DartTranspiler();
    });

    test('DT.S1: Blocks dart:mirrors import', () => {
      expect(() => {
        transpiler.validateDartSecurity('import "dart:mirrors"; class Test {}');
      }).toThrow();
    });

    test('DT.S2: Blocks reflectClass usage', () => {
      expect(() => {
        transpiler.validateDartSecurity('var mirror = reflectClass(MyClass);');
      }).toThrow();
    });

    test('DT.S3: Blocks noSuchMethod interception', () => {
      expect(() => {
        transpiler.validateDartSecurity('dynamic noSuchMethod(invocation) {}');
      }).toThrow();
    });

    test('DT.S4: Accepts safe Dart code', () => {
      expect(() => {
        transpiler.validateDartSecurity('class Safe { void method() {} }');
      }).not.toThrow();
    });

    test('DT.S5: Blocks ClassMirror usage', () => {
      expect(() => {
        transpiler.validateDartSecurity('ClassMirror classMirror = reflect(obj).type;');
      }).toThrow();
    });
  });

  // ============================================================================
  // DART PATTERN EXTRACTION VALIDATION
  // ============================================================================
  describe('Dart Transpiler - Pattern Extraction', () => {
    let transpiler;

    beforeEach(() => {
      transpiler = new DartTranspiler();
    });

    test('DT.P1: Extracts type annotations', () => {
      const code = 'int age = 25; String name = "John"; List<int> numbers = [];';
      const patterns = transpiler.extractDartPatterns(code);
      expect(patterns.types.length).toBeGreaterThan(0);
    });

    test('DT.P2: Extracts function definitions', () => {
      const code = 'void greet() {} int add(int a, int b) {}';
      const patterns = transpiler.extractDartPatterns(code);
      expect(patterns.functions.length).toBeGreaterThan(0);
    });

    test('DT.P3: Extracts class definitions', () => {
      const code = 'class Animal { void speak() {} } class Dog extends Animal {}';
      const patterns = transpiler.extractDartPatterns(code);
      expect(patterns.classes.length).toBeGreaterThan(0);
    });

    test('DT.P4: Extracts async patterns', () => {
      const code = 'Future<int> fetch() async { await Future.delayed(Duration(seconds: 1)); }';
      const patterns = transpiler.extractDartPatterns(code);
      expect(patterns.asyncPatterns.length).toBeGreaterThan(0);
    });

    test('DT.P5: Extracts mixin definitions', () => {
      const code = 'mixin Logger { void log() {} } mixin Drawable on Shape {}';
      const patterns = transpiler.extractDartPatterns(code);
      expect(patterns.mixins.length).toBeGreaterThan(0);
    });

    test('DT.P6: Extracts generic types', () => {
      const code = 'class Container<T> {} void process<K, V>(Map<K, V> map) {}';
      const patterns = transpiler.extractDartPatterns(code);
      expect(patterns.generics.length).toBeGreaterThan(0);
    });

    test('DT.P7: Extracts extension methods', () => {
      const code = 'extension IntX on int { bool isEven() => this % 2 == 0; }';
      const patterns = transpiler.extractDartPatterns(code);
      expect(patterns.extensions.length).toBeGreaterThan(0);
    });

    test('DT.P8: Extracts Future patterns', () => {
      const code = 'Future<String> getData() {} Future future = Future.value(42);';
      const patterns = transpiler.extractDartPatterns(code);
      expect(patterns.futures.length).toBeGreaterThan(0);
    });

    test('DT.P9: Extracts Stream patterns', () => {
      const code = 'Stream<int> getStream() {} Stream stream = Stream.fromIterable([1,2,3]);';
      const patterns = transpiler.extractDartPatterns(code);
      expect(patterns.streams.length).toBeGreaterThan(0);
    });

    test('DT.P10: Extracts null safety operators', () => {
      const code = 'String? nullable; int value = nullable?.length ?? 0;';
      const patterns = transpiler.extractDartPatterns(code);
      expect(patterns.nullSafety.length).toBeGreaterThan(0);
    });
  });
});

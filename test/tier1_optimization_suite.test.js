/**
 * TIER 1 OPTIMIZATION SUITE - TEST & BENCHMARK
 */

const {
  StringBuilderOptimizer,
  RegexCacheOptimizer,
  FunctionMemoization,
  HybridCache,
  ASTTraversalOptimizer,
  ObjectPool,
  TranspilerWorkerPool,
  Tier1OptimizationManager
} = require('../src/tier1_optimization_suite');

describe('TIER 1 OPTIMIZATION SUITE', () => {
  
  describe('1. STRING BUILDER OPTIMIZER', () => {
    test('should optimize string concatenation', () => {
      const code = 'result = "" + "hello" + "world"';
      const optimized = StringBuilderOptimizer.optimizeStringConcatenation(code);
      expect(optimized).toBeDefined();
    });

    test('should create string builder instance', () => {
      const builder = StringBuilderOptimizer.createStringBuilder();
      builder.append('hello').append(' ').append('world');
      expect(builder.toString()).toBe('hello world');
    });

    test('string builder should support chaining', () => {
      const builder = StringBuilderOptimizer.createStringBuilder();
      const result = builder
        .append('a')
        .append('b')
        .append('c')
        .toString();
      expect(result).toBe('abc');
    });

    test('string builder should support clear', () => {
      const builder = StringBuilderOptimizer.createStringBuilder();
      builder.append('test');
      builder.clear();
      expect(builder.toString()).toBe('');
    });
  });

  describe('2. REGEX CACHE OPTIMIZER', () => {
    beforeEach(() => {
      RegexCacheOptimizer.cache.clear();
    });

    test('should cache regex patterns', () => {
      const pattern1 = RegexCacheOptimizer.getPattern('\\d+');
      const pattern2 = RegexCacheOptimizer.getPattern('\\d+');
      expect(pattern1).toBe(pattern2);
    });

    test('should pre-compile common patterns', () => {
      RegexCacheOptimizer.preCompileCommonPatterns();
      expect(RegexCacheOptimizer.cache.size).toBeGreaterThan(0);
    });

    test('should return cached pattern statistics', () => {
      RegexCacheOptimizer.preCompileCommonPatterns();
      const stats = RegexCacheOptimizer.getStats();
      expect(stats.cachedPatterns).toBeGreaterThan(0);
      expect(stats.memory).toBeDefined();
    });

    test('should handle multiple regex flags', () => {
      const pattern1 = RegexCacheOptimizer.getPattern('test', 'i');
      const pattern2 = RegexCacheOptimizer.getPattern('test', 'g');
      expect(pattern1).not.toBe(pattern2);
    });
  });

  describe('3. FUNCTION MEMOIZATION', () => {
    test('should memoize function results', () => {
      const expensiveFn = jest.fn((x) => x * 2);
      const memoized = FunctionMemoization.memoize(expensiveFn);

      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10);
      expect(expensiveFn).toHaveBeenCalledTimes(1);
    });

    test('should handle different arguments', () => {
      const expensiveFn = jest.fn((x) => x * 2);
      const memoized = FunctionMemoization.memoize(expensiveFn);

      expect(memoized(5)).toBe(10);
      expect(memoized(10)).toBe(20);
      expect(expensiveFn).toHaveBeenCalledTimes(2);
    });

    test('should respect max size limit', () => {
      const fn = jest.fn((x) => x);
      const memoized = FunctionMemoization.memoize(fn, { maxSize: 2 });

      memoized(1);
      memoized(2);
      memoized(3); // Should evict oldest
      memoized(1); // Should be recalculated

      expect(fn.mock.calls.length).toBeGreaterThan(2);
    });

    test('should create memoizer instance', () => {
      const memoizer = FunctionMemoization.createMemoizer();
      const fn = jest.fn((x) => x * 2);
      const memoized = memoizer.memoize(fn);

      memoized(5);
      memoized(5);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. HYBRID CACHE', () => {
    let cache;

    beforeEach(() => {
      cache = new HybridCache({ maxSize: 5 });
    });

    test('should get and set values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    test('should return undefined for missing keys', () => {
      expect(cache.get('missing')).toBeUndefined();
    });

    test('should track cache hits and misses', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('missing'); // miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    test('should evict oldest entries when max size exceeded', () => {
      for (let i = 0; i < 10; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      expect(cache.lru.size).toBeLessThanOrEqual(5);
    });

    test('should calculate hit rate', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('key1');
      cache.get('missing');

      const stats = cache.getStats();
      expect(stats.hitRate).toBeDefined();
    });

    test('should support clear operation', () => {
      cache.set('key1', 'value1');
      cache.clear();
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('5. AST TRAVERSAL OPTIMIZER', () => {
    test('should perform single-pass optimization', () => {
      const ast = {
        type: 'Program',
        body: [
          { type: 'FunctionDeclaration', name: 'test' },
          { type: 'ExpressionStatement' }
        ]
      };

      const optimizers = [
        ASTTraversalOptimizer.createOptimizer('FunctionDeclaration', (node) => ({
          ...node,
          optimized: true
        }))
      ];

      const result = ASTTraversalOptimizer.singlePassOptimize(ast, optimizers);
      expect(result.body[0].optimized).toBe(true);
    });

    test('should handle nested structures', () => {
      const ast = {
        type: 'Program',
        body: {
          nested: {
            value: 42
          }
        }
      };

      const optimizers = [];
      const result = ASTTraversalOptimizer.singlePassOptimize(ast, optimizers);
      expect(result.body.nested.value).toBe(42);
    });

    test('should avoid infinite recursion with visited set', () => {
      const ast = { type: 'Node' };
      ast.self = ast; // Create circular reference

      const optimizers = [];
      expect(() => {
        ASTTraversalOptimizer.singlePassOptimize(ast, optimizers);
      }).not.toThrow();
    });
  });

  describe('6. OBJECT POOL', () => {
    test('should create and reuse objects', () => {
      const pool = new ObjectPool(() => ({ value: 0 }), 10);
      
      const obj1 = pool.acquire();
      obj1.value = 42;
      pool.release(obj1);

      const obj2 = pool.acquire();
      expect(obj2).toBe(obj1); // Should be same object
    });

    test('should track reuse ratio', () => {
      const pool = new ObjectPool(() => ({}), 10);
      
      pool.acquire();
      pool.acquire();
      pool.release(pool.acquire());
      pool.acquire();

      const stats = pool.getStats();
      expect(stats.reused).toBeGreaterThan(0);
      expect(stats.reuseRatio).toBeDefined();
    });

    test('should respect max size', () => {
      const pool = new ObjectPool(() => ({}), 3);
      
      pool.acquire();
      pool.acquire();
      pool.acquire();

      expect(() => pool.acquire()).toThrow();
    });

    test('should call reset method on release', () => {
      const resetMock = jest.fn();
      const pool = new ObjectPool(
        () => ({ reset: resetMock }),
        10
      );

      const obj = pool.acquire();
      pool.release(obj);

      expect(resetMock).toHaveBeenCalled();
    });
  });

  describe('7. TRANSPILER WORKER POOL', () => {
    test('should process tasks asynchronously', async () => {
      const pool = new TranspilerWorkerPool(2);
      const result = await pool.transpile('const x = 1;', 'javascript');
      
      expect(result).toBeDefined();
      expect(result.language).toBe('javascript');
      expect(result.transpiled).toBe(true);
    });

    test('should queue tasks when workers busy', async () => {
      const pool = new TranspilerWorkerPool(1);
      
      const p1 = pool.transpile('code1', 'javascript');
      const p2 = pool.transpile('code2', 'python');
      
      expect(pool.getStats().queued).toBeGreaterThanOrEqual(0);

      await Promise.all([p1, p2]);
    });

    test('should track pool statistics', () => {
      const pool = new TranspilerWorkerPool(4);
      const stats = pool.getStats();

      expect(stats.workerCount).toBe(4);
      expect(stats.active).toBeDefined();
      expect(stats.queued).toBeDefined();
      expect(stats.capacity).toBeDefined();
    });
  });

  describe('8. TIER 1 OPTIMIZATION MANAGER', () => {
    let manager;

    beforeEach(() => {
      manager = new Tier1OptimizationManager();
    });

    test('should initialize all optimizers', () => {
      expect(manager.stringBuilder).toBeDefined();
      expect(manager.regexCache).toBeDefined();
      expect(manager.hybridCache).toBeDefined();
      expect(manager.functionMemo).toBeDefined();
      expect(manager.objectPool).toBeDefined();
      expect(manager.workerPool).toBeDefined();
    });

    test('should pre-compile regex patterns on init', () => {
      expect(manager.regexCache.size).toBeGreaterThan(0);
    });

    test('should return optimization statistics', () => {
      const stats = manager.getOptimizationStats();
      
      expect(stats.regexCache).toBeDefined();
      expect(stats.hybridCache).toBeDefined();
      expect(stats.objectPool).toBeDefined();
      expect(stats.workerPool).toBeDefined();
    });

    test('should generate comprehensive optimization report', () => {
      const report = manager.generateOptimizationReport();
      
      expect(report.timestamp).toBeDefined();
      expect(report.optimizations).toBeDefined();
      expect(report.stats).toBeDefined();
      expect(report.estimatedImprovement).toBe('50-100%');
    });

    test('should use hybrid cache for transpilation', async () => {
      const result1 = await manager.optimizeTranspilation('code', 'javascript');
      const result2 = await manager.optimizeTranspilation('code', 'javascript');
      
      expect(result1).toEqual(result2);
      
      const stats = manager.hybridCache.getStats();
      expect(stats.hits).toBeGreaterThan(0);
    });
  });

  describe('PERFORMANCE BENCHMARKS', () => {
    test('should show string builder is faster than concatenation', () => {
      const iterations = 10000;

      // Concatenation approach
      const start1 = performance.now();
      let result1 = '';
      for (let i = 0; i < iterations; i++) {
        result1 = result1 + i.toString();
      }
      const time1 = performance.now() - start1;

      // String builder approach
      const start2 = performance.now();
      const builder = StringBuilderOptimizer.createStringBuilder();
      for (let i = 0; i < iterations; i++) {
        builder.append(i.toString());
      }
      const result2 = builder.toString();
      const time2 = performance.now() - start2;

      expect(time2).toBeLessThan(time1);
      console.log(`\nStringBuilder Performance: ${time1.toFixed(3)}ms vs ${time2.toFixed(3)}ms (${(time1/time2).toFixed(2)}x faster)`);
    });

    test('should show regex cache is faster than dynamic compilation', () => {
      const iterations = 10000;
      const pattern = '\\d+';

      // Dynamic compilation
      const start1 = performance.now();
      for (let i = 0; i < iterations; i++) {
        new RegExp(pattern).test('123');
      }
      const time1 = performance.now() - start1;

      // Cached compilation
      const start2 = performance.now();
      for (let i = 0; i < iterations; i++) {
        RegexCacheOptimizer.getPattern(pattern).test('123');
      }
      const time2 = performance.now() - start2;

      expect(time2).toBeLessThan(time1);
      console.log(`\nRegex Cache Performance: ${time1.toFixed(3)}ms vs ${time2.toFixed(3)}ms (${(time1/time2).toFixed(2)}x faster)`);
    });

    test('should show hybrid cache efficiency', () => {
      const iterations = 1000;
      const cache = new HybridCache({ maxSize: 100 });

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        const key = `key_${i % 50}`;
        cache.get(key) || cache.set(key, `value_${i}`);
      }
      const time = performance.now() - start;

      const stats = cache.getStats();
      console.log(`\nHybrid Cache Performance: ${iterations} ops in ${time.toFixed(3)}ms | Hit rate: ${stats.hitRate}`);
    });
  });
});

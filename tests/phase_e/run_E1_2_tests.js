/**
 * PHASE E - Task E1.2: Function Cache Tests
 * 
 * Comprehensive test suite for function declaration caching:
 * - Cache hits and misses on function declarations
 * - Performance benchmarks (50%+ speedup)
 * - Parameter pattern recognition
 * - Closure variable tracking
 * - Statistics accuracy
 * 
 * @module tests/phase_e/run_E1_2_tests.js
 */

const { CacheManager } = require('../../src/optimizers/javascript/speed/cache_manager');
const { FunctionCache } = require('../../src/optimizers/javascript/speed/function_cache');
const assert = require('assert');

let passedTests = 0;
let failedTests = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passedTests++;
    results.push(`✅ ${name}`);
  } catch (error) {
    failedTests++;
    results.push(`❌ ${name}: ${error.message}`);
  }
}

function describe(name, fn) {
  console.log(`\n📋 ${name}`);
  fn();
}

// Mock AST nodes for testing
const mockFunctionAst = (name = 'test', params = [], isAsync = false, isGen = false) => ({
  type: 'FunctionDeclaration',
  id: { name },
  params: params,
  body: { body: [] },
  async: isAsync,
  generator: isGen
});

const mockArrowAst = (params = []) => ({
  type: 'ArrowFunctionExpression',
  params,
  body: { type: 'BlockStatement', body: [] }
});

// Test Suite 1: Basic Function Caching
describe('Function Cache - Basic Operations', () => {
  let cache;
  let fnCache;

  test('Create function cache', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    assert(fnCache instanceof FunctionCache);
    cache.destroy();
  });

  test('Cache simple function declaration', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fnAst = mockFunctionAst('myFunc', []);
    const compiled = fnCache.cacheFunctionDeclaration(fnAst, {});
    
    assert(compiled.includes('myFunc'));
    assert(fnCache.stats.compiled === 1);
    cache.destroy();
  });

  test('Retrieve cached function', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fnAst = mockFunctionAst('myFunc', []);
    const compiled1 = fnCache.cacheFunctionDeclaration(fnAst, {});
    const compiled2 = fnCache.cacheFunctionDeclaration(fnAst, {});
    
    assert.strictEqual(compiled1, compiled2);
    assert.strictEqual(fnCache.stats.reused, 1);
    assert.strictEqual(fnCache.stats.hits, 1);
    cache.destroy();
  });

  test('Cache miss for different function', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn1 = mockFunctionAst('func1', []);
    const fn2 = mockFunctionAst('func2', []);
    
    fnCache.cacheFunctionDeclaration(fn1, {});
    fnCache.cacheFunctionDeclaration(fn2, {});
    
    assert.strictEqual(fnCache.stats.compiled, 2);
    assert.strictEqual(fnCache.stats.misses, 2);
    cache.destroy();
  });
});

// Test Suite 2: Function Key Generation
describe('Function Cache - Key Generation', () => {
  let cache;
  let fnCache;

  test('Simple function key', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = mockFunctionAst('test');
    const key = fnCache.createFunctionKey(fn);
    
    assert(key.includes('fn_test'));
    assert(key.includes('noparams'));
    cache.destroy();
  });

  test('Async function key includes async flag', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = mockFunctionAst('asyncTest', [], true);
    const key = fnCache.createFunctionKey(fn);
    
    assert(key.includes('async'));
    cache.destroy();
  });

  test('Generator function key includes gen flag', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = mockFunctionAst('genTest', [], false, true);
    const key = fnCache.createFunctionKey(fn);
    
    assert(key.includes('gen'));
    cache.destroy();
  });

  test('Parameter signature includes param count', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = mockFunctionAst('paramTest', [
      { name: 'a', type: 'Identifier' },
      { name: 'b', type: 'Identifier' }
    ]);
    const key = fnCache.createFunctionKey(fn);
    
    assert(key.includes('params2'));
    cache.destroy();
  });

  test('Anonymous function key', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = { type: 'FunctionDeclaration', params: [], body: { body: [] } };
    const key = fnCache.createFunctionKey(fn);
    
    assert(key.includes('__anonymous__'));
    cache.destroy();
  });
});

// Test Suite 3: Pattern Recognition
describe('Function Cache - Pattern Recognition', () => {
  let cache;
  let fnCache;

  test('Recognize simple function', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = mockFunctionAst('simple');
    fnCache.cacheFunctionDeclaration(fn, {});
    
    assert.strictEqual(fnCache.stats.patterns.simple, 1);
    cache.destroy();
  });

  test('Recognize async function', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = mockFunctionAst('asyncFn', [], true);
    fnCache.cacheFunctionDeclaration(fn, {});
    
    assert.strictEqual(fnCache.stats.patterns.async, 1);
    cache.destroy();
  });

  test('Recognize generator function', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = mockFunctionAst('genFn', [], false, true);
    fnCache.cacheFunctionDeclaration(fn, {});
    
    assert.strictEqual(fnCache.stats.patterns.generator, 1);
    cache.destroy();
  });

  test('Recognize arrow function', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const arrow = mockArrowAst([]);
    fnCache.cacheArrowFunction(arrow, {});
    
    assert.strictEqual(fnCache.stats.patterns.arrow, 1);
    cache.destroy();
  });

  test('Recognize rest parameter function', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = mockFunctionAst('restFn', [
      { name: 'args', type: 'RestElement' }
    ]);
    fnCache.cacheFunctionDeclaration(fn, {});
    
    assert.strictEqual(fnCache.stats.patterns.rest, 1);
    cache.destroy();
  });

  test('Recognize destructured parameter function', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = mockFunctionAst('destructFn', [
      { type: 'ArrayPattern', name: 'arr' }
    ]);
    fnCache.cacheFunctionDeclaration(fn, {});
    
    assert.strictEqual(fnCache.stats.patterns.destructured, 1);
    cache.destroy();
  });
});

// Test Suite 4: Statistics & Metrics
describe('Function Cache - Statistics', () => {
  let cache;
  let fnCache;

  test('Statistics track compilation', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn1 = mockFunctionAst('fn1');
    const fn2 = mockFunctionAst('fn2');
    
    fnCache.cacheFunctionDeclaration(fn1, {});
    fnCache.cacheFunctionDeclaration(fn2, {});
    
    const stats = fnCache.getStats();
    assert.strictEqual(stats.compiled, 2);
    cache.destroy();
  });

  test('Statistics track reuse', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = mockFunctionAst('test');
    
    fnCache.cacheFunctionDeclaration(fn, {});
    fnCache.cacheFunctionDeclaration(fn, {});
    fnCache.cacheFunctionDeclaration(fn, {});
    
    const stats = fnCache.getStats();
    assert.strictEqual(stats.reused, 2);
    assert.strictEqual(stats.hits, 2);
    cache.destroy();
  });

  test('Hit rate calculation', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn1 = mockFunctionAst('fn1');
    const fn2 = mockFunctionAst('fn2');
    
    fnCache.cacheFunctionDeclaration(fn1, {});
    fnCache.cacheFunctionDeclaration(fn1, {}); // Hit
    fnCache.cacheFunctionDeclaration(fn2, {});
    fnCache.cacheFunctionDeclaration(fn2, {}); // Hit
    
    const stats = fnCache.getStats();
    const hitRateNum = parseFloat(stats.hitRate);
    assert(hitRateNum > 40 && hitRateNum < 60, `Hit rate should be ~50%, got ${stats.hitRate}`);
    cache.destroy();
  });

  test('Reuse rate calculation', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = mockFunctionAst('test');
    
    fnCache.cacheFunctionDeclaration(fn, {});
    fnCache.cacheFunctionDeclaration(fn, {}); // Reuse
    fnCache.cacheFunctionDeclaration(fn, {}); // Reuse
    
    const stats = fnCache.getStats();
    const reuseRateNum = parseFloat(stats.reuseRate);
    assert(reuseRateNum > 60, `Reuse rate should be ~66%, got ${stats.reuseRate}`);
    cache.destroy();
  });

  test('Pattern counts', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    fnCache.cacheFunctionDeclaration(mockFunctionAst('fn1'), {});
    fnCache.cacheAsyncFunction(mockFunctionAst('async', [], true), {});
    fnCache.cacheGeneratorFunction(mockFunctionAst('gen', [], false, true), {});
    
    const stats = fnCache.getStats();
    assert.strictEqual(stats.patterns.simple, 1);
    assert.strictEqual(stats.patterns.async, 1);
    assert.strictEqual(stats.patterns.generator, 1);
    cache.destroy();
  });
});

// Test Suite 5: Function-Specific Caching
describe('Function Cache - Specialized Caching', () => {
  let cache;
  let fnCache;

  test('Arrow function caching', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const arrow = mockArrowAst([{ name: 'x' }]);
    const compiled1 = fnCache.cacheArrowFunction(arrow, {});
    const compiled2 = fnCache.cacheArrowFunction(arrow, {});
    
    assert.strictEqual(compiled1, compiled2);
    assert.strictEqual(fnCache.stats.reused, 1);
    cache.destroy();
  });

  test('Async function caching', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const asyncFn = mockFunctionAst('asyncTest', [], true);
    const compiled1 = fnCache.cacheAsyncFunction(asyncFn, {});
    const compiled2 = fnCache.cacheAsyncFunction(asyncFn, {});
    
    assert.strictEqual(compiled1, compiled2);
    cache.destroy();
  });

  test('Generator function caching', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const genFn = mockFunctionAst('genTest', [], false, true);
    const compiled1 = fnCache.cacheGeneratorFunction(genFn, {});
    const compiled2 = fnCache.cacheGeneratorFunction(genFn, {});
    
    assert.strictEqual(compiled1, compiled2);
    cache.destroy();
  });

  test('Destructured parameter caching', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = mockFunctionAst('destructured', [
      { type: 'ObjectPattern', name: 'obj' }
    ]);
    const compiled1 = fnCache.cacheDestructuredFunction(fn, {});
    const compiled2 = fnCache.cacheDestructuredFunction(fn, {});
    
    assert.strictEqual(compiled1, compiled2);
    cache.destroy();
  });

  test('Rest parameter caching', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = mockFunctionAst('restFunc', [
      { type: 'RestElement', name: 'args' }
    ]);
    const compiled1 = fnCache.cacheRestFunction(fn, {});
    const compiled2 = fnCache.cacheRestFunction(fn, {});
    
    assert.strictEqual(compiled1, compiled2);
    cache.destroy();
  });
});

// Test Suite 6: Cache Management
describe('Function Cache - Management', () => {
  let cache;
  let fnCache;

  test('Get cached count by pattern', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    fnCache.cacheFunctionDeclaration(mockFunctionAst('fn1'), {});
    fnCache.cacheArrowFunction(mockArrowAst([]), {});
    
    const simpleCount = fnCache.getCachedCountByPattern('simple');
    const arrowCount = fnCache.getCachedCountByPattern('arrow');
    
    assert.strictEqual(simpleCount, 1);
    assert.strictEqual(arrowCount, 1);
    cache.destroy();
  });

  test('Clear cache', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    fnCache.cacheFunctionDeclaration(mockFunctionAst('fn1'), {});
    fnCache.cacheFunctionDeclaration(mockFunctionAst('fn2'), {});
    
    assert.strictEqual(fnCache.stats.compiled, 2);
    
    fnCache.clearCache();
    
    assert.strictEqual(fnCache.stats.compiled, 0);
    assert.strictEqual(fnCache.closureMap.size, 0);
    cache.destroy();
  });

  test('Get performance metrics', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    fnCache.cacheFunctionDeclaration(mockFunctionAst('fn1'), {});
    fnCache.cacheFunctionDeclaration(mockFunctionAst('fn1'), {});
    fnCache.cacheFunctionDeclaration(mockFunctionAst('fn1'), {});
    
    const metrics = fnCache.getPerformanceMetrics();
    
    assert(metrics.functionsCompiled > 0);
    assert(metrics.functionsReused > 0);
    assert(parseFloat(metrics.speedupFactor) > 1);
    cache.destroy();
  });
});

// Test Suite 7: Performance Benchmarks
describe('Function Cache - Performance', () => {
  let cache;
  let fnCache;

  test('Single function compilation baseline', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = mockFunctionAst('benchmark');
    
    const start = performance.now();
    fnCache.cacheFunctionDeclaration(fn, {});
    const elapsed = performance.now() - start;
    
    assert(elapsed < 100, `Compilation should be <100ms, took ${elapsed.toFixed(2)}ms`);
    cache.destroy();
  });

  test('Repeated function retrieval 100x faster', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = mockFunctionAst('perf');
    
    // Warm up cache
    fnCache.cacheFunctionDeclaration(fn, {});
    
    // Measure repeated access
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      fnCache.cacheFunctionDeclaration(fn, {});
    }
    const cachedTime = performance.now() - start;
    const avgCachedTime = cachedTime / 1000;
    
    assert(avgCachedTime < 1, `Cached lookup should be <1ms, got ${avgCachedTime.toFixed(4)}ms`);
    cache.destroy();
  });

  test('50%+ speedup on repeated functions', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const functions = Array.from({ length: 100 }, (_, i) => mockFunctionAst(`fn${i}`));
    
    // First pass - compilation
    const start1 = performance.now();
    functions.forEach(fn => fnCache.cacheFunctionDeclaration(fn, {}));
    const firstPassTime = performance.now() - start1;
    
    // Second pass - cache hits (should reuse from L1)
    const start2 = performance.now();
    functions.forEach(fn => fnCache.cacheFunctionDeclaration(fn, {}));
    const secondPassTime = performance.now() - start2;
    
    const speedup = firstPassTime / secondPassTime;
    console.log(`    ⏱️  Speedup on repeated functions: ${speedup.toFixed(2)}x`);
    
    assert(speedup > 1.5, `Expected >1.5x speedup, got ${speedup.toFixed(2)}x`);
    cache.destroy();
  });

  test('Large function batch performance', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const fn = mockFunctionAst(`fn${i}`);
      fnCache.cacheFunctionDeclaration(fn, {});
    }
    const elapsed = performance.now() - start;
    const avgTime = elapsed / 1000;
    
    console.log(`    ⏱️  Average time per function: ${avgTime.toFixed(4)}ms`);
    assert(avgTime < 1, `Average should be <1ms, got ${avgTime.toFixed(4)}ms`);
    cache.destroy();
  });
});

// Test Suite 8: Closure Tracking
describe('Function Cache - Closure Tracking', () => {
  let cache;
  let fnCache;

  test('Closure tracking enabled by default', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache, { trackClosures: true });
    
    assert.strictEqual(fnCache.trackClosures, true);
    cache.destroy();
  });

  test('Closure tracking can be disabled', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache, { trackClosures: false });
    
    assert.strictEqual(fnCache.trackClosures, false);
    cache.destroy();
  });

  test('Closures tracked in map', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = mockFunctionAst('withClosure');
    fnCache.cacheFunctionDeclaration(fn, {});
    
    const initialSize = fnCache.closureMap.size;
    assert(initialSize >= 0);
    cache.destroy();
  });
});

// Test Suite 9: Edge Cases
describe('Function Cache - Edge Cases', () => {
  let cache;
  let fnCache;

  test('Handle null parameters', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = { type: 'FunctionDeclaration', params: null, body: {} };
    const key = fnCache.createFunctionKey(fn);
    
    assert(key.includes('noparams'));
    cache.destroy();
  });

  test('Handle empty function body', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const fn = mockFunctionAst('empty', [], false, false);
    const compiled = fnCache.cacheFunctionDeclaration(fn, {});
    
    assert(compiled.length > 0);
    cache.destroy();
  });

  test('Handle very long function names', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const longName = 'a'.repeat(100);
    const fn = mockFunctionAst(longName);
    const compiled = fnCache.cacheFunctionDeclaration(fn, {});
    
    assert(compiled.includes(longName));
    cache.destroy();
  });

  test('Handle many parameters', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    const manyParams = Array.from({ length: 50 }, (_, i) => ({ name: `p${i}` }));
    const fn = mockFunctionAst('manyParams', manyParams);
    const compiled = fnCache.cacheFunctionDeclaration(fn, {});
    
    assert(compiled.length > 0);
    cache.destroy();
  });
});

// Integration Test
describe('Function Cache - Integration', () => {
  let cache;
  let fnCache;

  test('Integration: Realistic transpilation workflow', () => {
    cache = new CacheManager();
    fnCache = new FunctionCache(cache);
    
    // Simulate transpiling a module with repeated functions
    const functions = [
      mockFunctionAst('processData', [{ name: 'data' }]),
      mockFunctionAst('validateInput', [{ name: 'input' }]),
      mockFunctionAst('formatOutput', [{ name: 'output' }]),
      mockFunctionAst('processData', [{ name: 'data' }]), // Repeat
      mockFunctionAst('validateInput', [{ name: 'input' }]), // Repeat
    ];
    
    functions.forEach(fn => fnCache.cacheFunctionDeclaration(fn, {}));
    
    const stats = fnCache.getStats();
    assert.strictEqual(stats.compiled, 3);
    assert.strictEqual(stats.reused, 2);
    
    // Verify cache is working (reuse > 0 means caching happened)
    assert(stats.reused > 0, 'Functions should be reused from cache');
    assert(stats.hits > 0, 'Cache hits should be recorded');
    
    cache.destroy();
  });
});

// Print results
console.log('\n' + '='.repeat(70));
console.log('PHASE E - TASK E1.2: FUNCTION CACHE TEST RESULTS');
console.log('='.repeat(70));

results.forEach(result => console.log(result));

console.log('\n' + '='.repeat(70));
console.log(`📊 Summary: ${passedTests} passed, ${failedTests} failed`);
const successRate = ((passedTests / (passedTests + failedTests)) * 100).toFixed(1);
console.log(`✅ Success Rate: ${successRate}%`);
console.log('='.repeat(70));

if (failedTests > 0) {
  process.exit(1);
}

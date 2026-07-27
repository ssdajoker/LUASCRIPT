/**
 * PHASE E - Task E1.3: Pattern Literal Caching Tests
 * 
 * Validates caching of:
 * - Destructuring patterns
 * - Template literals
 * - Array method patterns
 * 
 * @module tests/phase_e/run_E1_3_tests.js
 */

const { CacheManager } = require('../../src/optimizers/javascript/speed/cache_manager');
const { PatternCache } = require('../../src/optimizers/javascript/speed/pattern_cache');
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

// Mock AST nodes
const mockArrayPattern = (count = 2) => ({
  type: 'ArrayPattern',
  elements: Array.from({ length: count }, (_, i) => ({ name: `a${i}` }))
});

const mockObjectPattern = (count = 2) => ({
  type: 'ObjectPattern',
  properties: Array.from({ length: count }, (_, i) => ({ key: { name: `k${i}` } }))
});

const mockTemplateLiteral = (quasis = 2, expressions = 1, head = 'hello') => ({
  type: 'TemplateLiteral',
  quasis: Array.from({ length: quasis }, (_, i) => ({ value: { raw: i === 0 ? head : `q${i}` } })),
  expressions: Array.from({ length: expressions }, () => ({ type: 'Identifier', name: 'x' }))
});

const mockArrayMethodCall = (method = 'map', args = 1) => ({
  type: 'CallExpression',
  callee: {
    type: 'MemberExpression',
    object: { type: 'Identifier', name: 'arr' },
    property: { type: 'Identifier', name: method }
  },
  arguments: Array.from({ length: args }, () => ({ type: 'ArrowFunctionExpression', params: [{ name: 'x' }] }))
});

// Suite 1: Basic Operations
describe('Pattern Cache - Basic Operations', () => {
  let cache;
  let patternCache;

  test('Create pattern cache', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);
    assert(patternCache instanceof PatternCache);
    cache.destroy();
  });

  test('Cache destructuring pattern', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    const pattern = mockArrayPattern(3);
    const compiled = patternCache.cacheDestructuringPattern(pattern, {});

    assert(compiled.includes('destructuring'));
    assert.strictEqual(patternCache.stats.compiled, 1);
    cache.destroy();
  });

  test('Retrieve cached destructuring pattern', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    const pattern = mockObjectPattern(2);
    const compiled1 = patternCache.cacheDestructuringPattern(pattern, {});
    const compiled2 = patternCache.cacheDestructuringPattern(pattern, {});

    assert.strictEqual(compiled1, compiled2);
    assert.strictEqual(patternCache.stats.reused, 1);
    assert.strictEqual(patternCache.stats.hits, 1);
    cache.destroy();
  });
});

// Suite 2: Key Generation
describe('Pattern Cache - Key Generation', () => {
  let cache;
  let patternCache;

  test('Destructuring key for ArrayPattern', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    const key = patternCache.createDestructuringKey(mockArrayPattern(4));
    assert(key.includes('ArrayPattern'));
    assert(key.includes('arr_4'));
    cache.destroy();
  });

  test('Destructuring key for ObjectPattern', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    const key = patternCache.createDestructuringKey(mockObjectPattern(3));
    assert(key.includes('ObjectPattern'));
    assert(key.includes('obj_3'));
    cache.destroy();
  });

  test('Template key includes counts', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    const key = patternCache.createTemplateKey(mockTemplateLiteral(3, 2, 'start'));
    assert(key.includes('q3'));
    assert(key.includes('e2'));
    assert(key.includes('start'));
    cache.destroy();
  });

  test('Array method key includes method name', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    const key = patternCache.createArrayMethodKey(mockArrayMethodCall('filter', 1));
    assert(key.includes('filter'));
    assert(key.includes('args1'));
    cache.destroy();
  });
});

// Suite 3: Template Literal Caching
describe('Pattern Cache - Template Literals', () => {
  let cache;
  let patternCache;

  test('Cache template literal', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    const template = mockTemplateLiteral(2, 1, 'hello');
    const compiled = patternCache.cacheTemplateLiteral(template, {});

    assert(compiled.includes('template literal'));
    assert.strictEqual(patternCache.stats.compiled, 1);
    cache.destroy();
  });

  test('Retrieve cached template literal', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    const template = mockTemplateLiteral(2, 1, 'hello');
    const compiled1 = patternCache.cacheTemplateLiteral(template, {});
    const compiled2 = patternCache.cacheTemplateLiteral(template, {});

    assert.strictEqual(compiled1, compiled2);
    assert.strictEqual(patternCache.stats.reused, 1);
    assert.strictEqual(patternCache.stats.hits, 1);
    cache.destroy();
  });
});

// Suite 4: Array Method Caching
describe('Pattern Cache - Array Method Patterns', () => {
  let cache;
  let patternCache;

  test('Cache array method pattern', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    const call = mockArrayMethodCall('map', 1);
    const compiled = patternCache.cacheArrayMethodPattern(call, {});

    assert(compiled.includes('array method'));
    assert.strictEqual(patternCache.stats.compiled, 1);
    cache.destroy();
  });

  test('Retrieve cached array method pattern', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    const call = mockArrayMethodCall('reduce', 2);
    const compiled1 = patternCache.cacheArrayMethodPattern(call, {});
    const compiled2 = patternCache.cacheArrayMethodPattern(call, {});

    assert.strictEqual(compiled1, compiled2);
    assert.strictEqual(patternCache.stats.reused, 1);
    assert.strictEqual(patternCache.stats.hits, 1);
    cache.destroy();
  });
});

// Suite 5: Statistics & Metrics
describe('Pattern Cache - Statistics', () => {
  let cache;
  let patternCache;

  test('Stats track compiled patterns', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    patternCache.cacheDestructuringPattern(mockArrayPattern(2), {});
    patternCache.cacheTemplateLiteral(mockTemplateLiteral(2, 1, 'hello'), {});

    const stats = patternCache.getStats();
    assert.strictEqual(stats.compiled, 2);
    cache.destroy();
  });

  test('Hit rate calculation', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    const pattern = mockObjectPattern(2);
    patternCache.cacheDestructuringPattern(pattern, {});
    patternCache.cacheDestructuringPattern(pattern, {});

    const stats = patternCache.getStats();
    const hitRateNum = parseFloat(stats.hitRate);
    assert(hitRateNum > 40 && hitRateNum < 60, `Hit rate should be ~50%, got ${stats.hitRate}`);
    cache.destroy();
  });

  test('Reuse rate calculation', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    const template = mockTemplateLiteral(2, 1, 'hi');
    patternCache.cacheTemplateLiteral(template, {});
    patternCache.cacheTemplateLiteral(template, {});
    patternCache.cacheTemplateLiteral(template, {});

    const stats = patternCache.getStats();
    const reuseRateNum = parseFloat(stats.reuseRate);
    assert(reuseRateNum > 60, `Reuse rate should be ~66%, got ${stats.reuseRate}`);
    cache.destroy();
  });
});

// Suite 6: Cache Management
describe('Pattern Cache - Management', () => {
  let cache;
  let patternCache;

  test('Get cached count by pattern', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    patternCache.cacheDestructuringPattern(mockArrayPattern(2), {});
    patternCache.cacheTemplateLiteral(mockTemplateLiteral(2, 1, 'hello'), {});
    patternCache.cacheArrayMethodPattern(mockArrayMethodCall('map', 1), {});

    assert.strictEqual(patternCache.getCachedCountByPattern('destructuring'), 1);
    assert.strictEqual(patternCache.getCachedCountByPattern('template'), 1);
    assert.strictEqual(patternCache.getCachedCountByPattern('arrayMethod'), 1);
    cache.destroy();
  });

  test('Clear cache resets stats', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    patternCache.cacheDestructuringPattern(mockArrayPattern(2), {});
    patternCache.cacheDestructuringPattern(mockArrayPattern(2), {});

    assert.strictEqual(patternCache.stats.compiled, 1);
    assert.strictEqual(patternCache.stats.reused, 1);

    patternCache.clearCache();

    assert.strictEqual(patternCache.stats.compiled, 0);
    assert.strictEqual(patternCache.stats.reused, 0);
    cache.destroy();
  });

  test('Get performance metrics', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    patternCache.cacheTemplateLiteral(mockTemplateLiteral(2, 1, 'hello'), {});
    patternCache.cacheTemplateLiteral(mockTemplateLiteral(2, 1, 'hello'), {});
    patternCache.cacheTemplateLiteral(mockTemplateLiteral(2, 1, 'hello'), {});

    const metrics = patternCache.getPerformanceMetrics();
    assert(metrics.patternsCompiled > 0);
    assert(metrics.patternsReused > 0);
    assert(parseFloat(metrics.speedupFactor) > 1);
    cache.destroy();
  });
});

// Suite 7: Performance Benchmarks
describe('Pattern Cache - Performance', () => {
  let cache;
  let patternCache;

  test('Repeated pattern retrieval is fast', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    const pattern = mockArrayPattern(5);
    patternCache.cacheDestructuringPattern(pattern, {});

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      patternCache.cacheDestructuringPattern(pattern, {});
    }
    const elapsed = performance.now() - start;

    const avg = elapsed / 1000;
    assert(avg < 1, `Cached lookup should be <1ms, got ${avg.toFixed(4)}ms`);
    cache.destroy();
  });

  test('50%+ speedup on repeated patterns', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    const patterns = Array.from({ length: 200 }, (_, i) => mockObjectPattern((i % 5) + 1));

    const start1 = performance.now();
    patterns.forEach(p => patternCache.cacheDestructuringPattern(p, {}));
    const firstPass = performance.now() - start1;

    const start2 = performance.now();
    patterns.forEach(p => patternCache.cacheDestructuringPattern(p, {}));
    const secondPass = performance.now() - start2;

    const speedup = firstPass / secondPass;
    console.log(`    ⏱️  Speedup on repeated patterns: ${speedup.toFixed(2)}x`);

    assert(speedup > 1.5, `Expected >1.5x speedup, got ${speedup.toFixed(2)}x`);
    cache.destroy();
  });
});

// Suite 8: Edge Cases
describe('Pattern Cache - Edge Cases', () => {
  let cache;
  let patternCache;

  test('Handle null pattern', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    const compiled = patternCache.cacheDestructuringPattern(null, {});
    assert(compiled.includes('Pattern'));
    cache.destroy();
  });

  test('Handle template with no quasis', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    const compiled = patternCache.cacheTemplateLiteral({ type: 'TemplateLiteral', quasis: [], expressions: [] }, {});
    assert(compiled.includes('template literal'));
    cache.destroy();
  });

  test('Handle array method with unknown callee', () => {
    cache = new CacheManager();
    patternCache = new PatternCache(cache);

    const compiled = patternCache.cacheArrayMethodPattern({ type: 'CallExpression', arguments: [] }, {});
    assert(compiled.includes('array method'));
    cache.destroy();
  });
});

// Print results
console.log('\n' + '='.repeat(70));
console.log('PHASE E - TASK E1.3: PATTERN CACHE TEST RESULTS');
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

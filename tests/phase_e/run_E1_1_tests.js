/**
 * PHASE E - Task E1.1: Cache Manager - Standalone Test Runner
 * 
 * Runs cache manager tests without requiring Jest framework
 */

const { CacheManager, LRUCache } = require('../../src/optimizers/javascript/speed/cache_manager');
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

// Test Suite 1: L1 Cache
describe('L1 Cache (Hot Path)', () => {
  let cache;

  test('L1: Set and get value', () => {
    cache = new CacheManager();
    cache.set('key1', 'value1', 1);
    const result = cache.get('key1');
    assert.strictEqual(result, 'value1');
    cache.destroy();
  });

  test('L1: Latency measurement <1ms', () => {
    cache = new CacheManager();
    cache.set('key1', { data: 'object' }, 1);
    
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      cache.get('key1');
    }
    const elapsed = performance.now() - start;
    const avgLatency = elapsed / 1000;
    
    assert(avgLatency < 1, `L1 latency ${avgLatency.toFixed(3)}ms should be <1ms`);
    cache.destroy();
  });

  test('L1: Multiple values', () => {
    cache = new CacheManager();
    for (let i = 0; i < 5; i++) {
      cache.set(`key${i}`, `value${i}`, 1);
    }
    
    for (let i = 0; i < 5; i++) {
      assert.strictEqual(cache.get(`key${i}`), `value${i}`);
    }
    cache.destroy();
  });

  test('L1: Max capacity eviction', () => {
    cache = new CacheManager({ l1MaxSize: 10 });
    
    for (let i = 0; i < 10; i++) {
      cache.set(`key${i}`, `value${i}`, 1);
    }
    
    assert.strictEqual(cache.l1Cache.size, 10);
    cache.set('key10', 'value10', 1);
    assert.strictEqual(cache.l1Cache.size, 10);
    assert(cache.stats.evictions > 0);
    cache.destroy();
  });
});

// Test Suite 2: L2 Cache
describe('L2 Cache (Medium Frequency)', () => {
  let cache;

  test('L2: Set and get value', () => {
    cache = new CacheManager();
    cache.set('key1', 'value1', 2);
    const result = cache.get('key1');
    assert.strictEqual(result, 'value1');
    cache.destroy();
  });

  test('L2: Latency measurement <5ms', () => {
    cache = new CacheManager();
    cache.set('key1', { data: 'object' }, 2);
    
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      cache.get('key1');
    }
    const elapsed = performance.now() - start;
    const avgLatency = elapsed / 100;
    
    assert(avgLatency < 5, `L2 latency ${avgLatency.toFixed(3)}ms should be <5ms`);
    cache.destroy();
  });

  test('L2: Automatic promotion to L1 on hit', () => {
    cache = new CacheManager();
    cache.set('key1', 'value1', 2);
    assert(!cache.l1Cache.has('key1'));
    
    cache.get('key1');
    assert(cache.l1Cache.has('key1'));
    assert.strictEqual(cache.stats.l1Promotions, 1);
    cache.destroy();
  });
});

// Test Suite 3: L3 Cache
describe('L3 Cache (Cold Path)', () => {
  let cache;

  test('L3: Set and get value', () => {
    cache = new CacheManager();
    cache.set('key1', 'value1', 3);
    const result = cache.get('key1');
    assert.strictEqual(result, 'value1');
    cache.destroy();
  });

  test('L3: Latency measurement <20ms', () => {
    cache = new CacheManager();
    cache.set('key1', { data: 'object' }, 3);
    
    const start = performance.now();
    for (let i = 0; i < 10; i++) {
      cache.get('key1');
    }
    const elapsed = performance.now() - start;
    const avgLatency = elapsed / 10;
    
    assert(avgLatency < 20, `L3 latency ${avgLatency.toFixed(3)}ms should be <20ms`);
    cache.destroy();
  });

  test('L3: Automatic promotion to L1 on hit', () => {
    cache = new CacheManager();
    cache.set('key1', 'value1', 3);
    assert(!cache.l1Cache.has('key1'));
    
    cache.get('key1');
    assert(cache.l1Cache.has('key1'));
    cache.destroy();
  });
});

// Test Suite 4: Promotion Behavior
describe('Promotion Behavior', () => {
  let cache;

  test('Promotion: L2→L1 on hit', () => {
    cache = new CacheManager();
    cache.set('key1', 'value1', 2);
    assert(!cache.l1Cache.has('key1'));
    assert(cache.l2Cache.has('key1'));
    
    cache.get('key1');
    assert(cache.l1Cache.has('key1'));
    cache.destroy();
  });

  test('Promotion: L3→L1→L2 on hit', () => {
    cache = new CacheManager();
    cache.set('key1', 'value1', 3);
    assert(!cache.l1Cache.has('key1'));
    assert(!cache.l2Cache.has('key1'));
    
    cache.get('key1');
    assert(cache.l1Cache.has('key1'));
    cache.destroy();
  });
});

// Test Suite 5: Statistics
describe('Statistics & Metrics', () => {
  let cache;

  test('Statistics: Track hits and misses', () => {
    cache = new CacheManager();
    cache.set('key1', 'value1', 1);
    cache.set('key2', 'value2', 2);
    
    cache.get('key1'); // L1 hit
    cache.get('key2'); // L2 hit (promoted to L1)
    cache.get('key3'); // Miss
    
    const stats = cache.getStats();
    assert.strictEqual(stats.l1Hits, 1);
    assert.strictEqual(stats.l2Hits, 1);
    assert.strictEqual(stats.totalMisses, 1);
    cache.destroy();
  });

  test('Statistics: Calculate hit rate correctly', () => {
    cache = new CacheManager();
    cache.set('key1', 'value1', 1);
    cache.set('key2', 'value2', 1);
    
    cache.get('key1');
    cache.get('key1');
    cache.get('key2');
    cache.get('key3'); // Miss
    
    const stats = cache.getStats();
    const hitRateNum = parseFloat(stats.hitRate);
    assert(hitRateNum > 70 && hitRateNum < 80, `Hit rate should be ~75%, got ${stats.hitRate}`);
    cache.destroy();
  });

  test('Statistics: Track promotions', () => {
    cache = new CacheManager();
    cache.set('key1', 'value1', 2);
    cache.set('key2', 'value2', 3);
    
    cache.get('key1'); // Promote L2→L1
    cache.get('key2'); // Promote L3→L1
    
    const stats = cache.getStats();
    assert.strictEqual(stats.l1Promotions, 2);
    cache.destroy();
  });

  test('Statistics: Reset functionality', () => {
    cache = new CacheManager();
    cache.set('key1', 'value1', 1);
    cache.get('key1');
    cache.get('key2');
    
    const statsBefore = cache.getStats();
    assert(statsBefore.totalGets > 0);
    
    cache.resetStats();
    
    const statsAfter = cache.getStats();
    assert.strictEqual(statsAfter.totalGets, 0);
    assert.strictEqual(statsAfter.l1Hits, 0);
    cache.destroy();
  });
});

// Test Suite 6: Cache Operations
describe('Cache Operations', () => {
  let cache;

  test('Operations: Clear all caches', () => {
    cache = new CacheManager();
    cache.set('key1', 'value1', 1);
    cache.set('key2', 'value2', 2);
    cache.set('key3', 'value3', 3);
    
    cache.clear();
    
    assert.strictEqual(cache.l1Cache.size, 0);
    assert.strictEqual(cache.l2Cache.size, 0);
    assert.strictEqual(cache.l3Cache.size(), 0);
    cache.destroy();
  });

  test('Operations: Get missing key returns undefined', () => {
    cache = new CacheManager();
    const result = cache.get('nonexistent');
    assert.strictEqual(result, undefined);
    cache.destroy();
  });

  test('Operations: Overwrite existing key', () => {
    cache = new CacheManager();
    cache.set('key1', 'value1', 1);
    assert.strictEqual(cache.get('key1'), 'value1');
    
    cache.set('key1', 'value2', 1);
    assert.strictEqual(cache.get('key1'), 'value2');
    cache.destroy();
  });

  test('Operations: Handle complex objects', () => {
    cache = new CacheManager();
    const obj = { a: 1, b: { c: 2 }, d: [1, 2, 3] };
    cache.set('complex', obj, 1);
    
    const result = cache.get('complex');
    assert.deepStrictEqual(result, obj);
    cache.destroy();
  });

  test('Operations: Invalid cache level throws error', () => {
    cache = new CacheManager();
    try {
      cache.set('key', 'value', 4);
      throw new Error('Should have thrown error for invalid level');
    } catch (error) {
      assert(error.message.includes('Invalid cache level'));
    }
    cache.destroy();
  });
});

// Test Suite 7: Integration Scenarios
describe('Integration Scenarios', () => {
  let cache;

  test('Scenario: Real transpilation workflow', () => {
    cache = new CacheManager();
    
    const fnCode1 = 'function test1() { return 1; }';
    const fnCode2 = 'function test2() { return 2; }';
    
    cache.set(fnCode1, 'local function test1() return 1 end', 1);
    cache.set(fnCode2, 'local function test2() return 2 end', 1);
    
    const result1 = cache.get(fnCode1);
    const result2 = cache.get(fnCode2);
    
    assert.strictEqual(result1, 'local function test1() return 1 end');
    assert.strictEqual(result2, 'local function test2() return 2 end');
    
    const stats = cache.getStats();
    assert.strictEqual(stats.l1Hits, 2);
    cache.destroy();
  });

  test('Scenario: Cache hierarchy with realistic sizes', () => {
    cache = new CacheManager({
      l1MaxSize: 10,
      l2MaxSize: 50,
      l3MaxSize: 100
    });
    
    for (let i = 0; i < 10; i++) {
      cache.set(`l1_${i}`, `value_l1_${i}`, 1);
    }
    for (let i = 0; i < 50; i++) {
      cache.set(`l2_${i}`, `value_l2_${i}`, 2);
    }
    for (let i = 0; i < 100; i++) {
      cache.set(`l3_${i}`, `value_l3_${i}`, 3);
    }
    
    const stats = cache.getStats();
    assert.strictEqual(stats.l1Size, 10);
    assert.strictEqual(stats.l2Size, 50);
    assert.strictEqual(stats.l3Size, 100);
    cache.destroy();
  });

  test('Scenario: Performance degradation with many lookups', () => {
    cache = new CacheManager();
    cache.set('key1', 'value1', 1);
    cache.set('key2', 'value2', 2);
    cache.set('key3', 'value3', 3);
    
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      cache.get('key1');
      cache.get('key2');
      cache.get('key3');
    }
    const elapsed = performance.now() - start;
    const avgPerOp = elapsed / 30000;
    
    assert(avgPerOp < 1, `Bulk ops should average <1ms per get, got ${avgPerOp.toFixed(3)}ms`);
    cache.destroy();
  });
});

// Test Suite 8: Edge Cases
describe('Edge Cases', () => {
  let cache;

  test('Edge case: Null values', () => {
    cache = new CacheManager();
    cache.set('null_key', null, 1);
    const result = cache.get('null_key');
    assert.strictEqual(result, null);
    cache.destroy();
  });

  test('Edge case: Empty string key', () => {
    cache = new CacheManager();
    cache.set('', 'empty_key_value', 1);
    const result = cache.get('');
    assert.strictEqual(result, 'empty_key_value');
    cache.destroy();
  });

  test('Edge case: Large objects', () => {
    cache = new CacheManager();
    const largeObj = {
      data: new Array(10000).fill('x'),
      nested: {
        deep: {
          value: 42
        }
      }
    };
    
    cache.set('large', largeObj, 1);
    const result = cache.get('large');
    assert.strictEqual(result.nested.deep.value, 42);
    cache.destroy();
  });
});

// Performance Benchmarks
describe('Performance Benchmarks', () => {
  let cache;

  test('Benchmark: Single L1 get performance', () => {
    cache = new CacheManager();
    cache.set('bench_key', 'bench_value', 1);
    
    const iterations = 100000;
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      cache.get('bench_key');
    }
    
    const elapsed = performance.now() - start;
    const opsPerSecond = (iterations / elapsed * 1000).toFixed(0);
    
    console.log(`    ⏱️  Single L1 get: ${(elapsed / iterations).toFixed(4)}ms per op (${opsPerSecond} ops/sec)`);
    assert(elapsed / iterations < 1, 'Should be <1ms per L1 hit');
    cache.destroy();
  });

  test('Benchmark: Mixed cache level access', () => {
    cache = new CacheManager();
    cache.set('l1', 'value1', 1);
    cache.set('l2', 'value2', 2);
    cache.set('l3', 'value3', 3);
    
    const iterations = 10000;
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      cache.get('l1');
      cache.get('l2');
      cache.get('l3');
    }
    
    const elapsed = performance.now() - start;
    const avgPerOp = elapsed / (iterations * 3);
    
    console.log(`    ⏱️  Mixed level access: ${avgPerOp.toFixed(4)}ms per op average`);
    cache.destroy();
  });
});

// Print results
console.log('\n' + '='.repeat(70));
console.log('PHASE E - TASK E1.1: CACHE MANAGER TEST RESULTS');
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

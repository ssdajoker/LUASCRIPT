/**
 * E5.1 Test Suite: Interop Cache
 * Tests for cross-runtime optimization caching
 */

const InteropCache = require('../../src/optimizers/javascript/interop/interop_cache.js');

class E5_1_Tests {
  constructor() {
    this.tests = [];
    this.results = { passed: 0, failed: 0, errors: [] };
  }

  /**
   * Test 1: Basic store and retrieve
   */
  test_BasicStoreRetrieve() {
    const cache = new InteropCache();
    const input = { type: 'FunctionDeclaration', name: 'test' };
    const result = { transpiled: true, optimized: false };

    cache.store(input, result, { runtime: 'v8' });
    const retrieved = cache.retrieve(input, 'v8');

    return retrieved !== null && 
           retrieved.data.transpiled === true &&
           retrieved.metadata.runtime === 'v8';
  }

  /**
   * Test 2: Runtime compatibility tracking
   */
  test_RuntimeCompatibility() {
    const cache = new InteropCache();
    const input = { type: 'ArrowFunctionExpression' };
    const result = { optimized: true };

    cache.store(input, result, { 
      runtime: 'v8',
      compatible: ['v8', 'spidermonkey', 'jsc']
    });

    const compatible = cache.getCompatibleRuntimes(input);
    return compatible.includes('v8') && 
           compatible.includes('spidermonkey') &&
           compatible.includes('jsc');
  }

  /**
   * Test 3: Cross-runtime cache hits
   */
  test_CrossRuntimeHits() {
    const cache = new InteropCache();
    const input = { type: 'VariableDeclaration' };
    const result = { cached: true };

    cache.store(input, result, { 
      runtime: 'v8',
      compatible: ['v8', 'spidermonkey']
    });

    // Access from different runtime
    const retrieved = cache.retrieve(input, 'spidermonkey');
    
    return retrieved !== null && 
           retrieved.crossRuntime === true &&
           cache.metrics.crossRuntimeUses === 1;
  }

  /**
   * Test 4: TTL expiration
   */
  test_TTLExpiration() {
    const cache = new InteropCache({ ttl: 100 }); // 100ms TTL
    const input = { type: 'BlockStatement' };
    const result = { ttl: 'test' };

    cache.store(input, result);
    
    // Immediate retrieve should work
    let retrieved = cache.retrieve(input);
    const immediateHit = retrieved !== null;

    // Wait for expiration
    const start = Date.now();
    while (Date.now() - start < 150) {} // Busy wait
    
    retrieved = cache.retrieve(input);
    const afterExpiration = retrieved === null;

    return immediateHit && afterExpiration;
  }

  /**
   * Test 5: Optimization tracking
   */
  test_OptimizationTracking() {
    const cache = new InteropCache();
    const input1 = { type: 'CallExpression' };
    const input2 = { type: 'MemberExpression' };
    const result = { optimized: true };

    cache.store(input1, result, { optimization: 'inlining' });
    cache.store(input2, result, { optimization: 'inlining' });

    const invalidated = cache.invalidateOptimization('inlining');
    
    return invalidated === 2 && 
           cache.cache.size === 0;
  }

  /**
   * Test 6: Max size and LRU eviction
   */
  test_LRUEviction() {
    const cache = new InteropCache({ maxSize: 5 });
    
    // Fill cache beyond max
    for (let i = 0; i < 10; i++) {
      const input = { id: i };
      cache.store(input, { data: i });
    }

    // Should have evicted oldest entries
    return cache.cache.size <= 5 &&
           cache.metrics.evictions > 0;
  }

  /**
   * Test 7: Runtime profile intersection
   */
  test_RuntimeIntersection() {
    const cache = new InteropCache();
    const common = cache.computeRuntimeIntersection(['v8', 'spidermonkey', 'jsc']);

    // All three support these features
    return common.includes('async') &&
           common.includes('proxy') &&
           common.includes('weakmap') &&
           common.includes('bigint');
  }

  /**
   * Test 8: Cache export/import
   */
  test_ExportImport() {
    const cache1 = new InteropCache();
    const input = { type: 'FunctionExpression' };
    const result = { exported: true };

    cache1.store(input, result, { runtime: 'v8' });
    const exported = cache1.export({ includeMetadata: true });

    // Import to new cache
    const cache2 = new InteropCache();
    const importResult = cache2.import(exported);

    return importResult.imported === 1 &&
           cache2.retrieve(input) !== null;
  }

  /**
   * Test 9: Hit rate metrics
   */
  test_HitRateMetrics() {
    const cache = new InteropCache();
    const input = { type: 'BinaryExpression' };
    const result = { calculated: true };

    cache.store(input, result);

    // Multiple hits
    cache.retrieve(input);
    cache.retrieve(input);
    
    // One miss
    cache.retrieve({ type: 'NonExistent' });

    const stats = cache.getStats();
    
    return parseInt(stats.hitRate) === 66 && // 2 hits out of 3 calls
           stats.hits === 2 &&
           stats.misses === 1;
  }

  /**
   * Test 10: Shared optimization tracking
   */
  test_SharedOptimizations() {
    const cache = new InteropCache();
    
    // Store multiple results with same optimization
    for (let i = 0; i < 3; i++) {
      cache.store({ id: i }, { opt: i }, { optimization: 'constant-folding' });
    }

    const sharedKeys = cache.sharedOptimizations.get('constant-folding');
    
    return sharedKeys.length === 3 &&
           cache.cache.size === 3;
  }

  /**
   * Run all tests
   */
  run() {
    const testMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(name => name.startsWith('test_'));

    console.log('Running E5.1 Interop Cache Tests...\n');

    for (const method of testMethods) {
      try {
        const result = this[method]();
        if (result) {
          this.results.passed++;
          console.log(`✓ ${method}: PASS`);
        } else {
          this.results.failed++;
          console.log(`✗ ${method}: FAIL`);
          this.results.errors.push(`${method} returned false`);
        }
      } catch (error) {
        this.results.failed++;
        console.log(`✗ ${method}: ERROR`);
        this.results.errors.push(`${method}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`Summary: ${this.results.passed} passed, ${this.results.failed} failed`);
    console.log(`Success Rate: ${((this.results.passed / testMethods.length) * 100).toFixed(1)}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\nErrors:');
      this.results.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    return this.results;
  }
}

// Execute tests
const tests = new E5_1_Tests();
tests.run();

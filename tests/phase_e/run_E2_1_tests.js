/**
 * PHASE E - Task E2.1: Memory Pool Manager Tests
 * 
 * @module tests/phase_e/run_E2_1_tests.js
 */

const { MemoryPoolManager } = require('../../src/optimizers/javascript/memory/pool_manager');
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

const factory = () => ({ value: 0, data: [] });
const reset = obj => {
  obj.value = 0;
  obj.data = [];
};

// Suite 1: Basic Operations
describe('Memory Pool - Basic Operations', () => {
  let pool;

  test('Create pool manager', () => {
    pool = new MemoryPoolManager();
    assert(pool instanceof MemoryPoolManager);
  });

  test('Acquire creates new object', () => {
    pool = new MemoryPoolManager();
    const obj = pool.acquire('irNode', factory);
    assert(obj);
    const stats = pool.getStats();
    assert.strictEqual(stats.created, 1);
    assert.strictEqual(stats.reused, 0);
  });

  test('Release then reuse', () => {
    pool = new MemoryPoolManager();
    const obj1 = pool.acquire('irNode', factory);
    obj1.value = 42;
    pool.release('irNode', obj1, reset);

    const obj2 = pool.acquire('irNode', factory, reset);
    assert.strictEqual(obj1, obj2);
    assert.strictEqual(obj2.value, 0);

    const stats = pool.getStats();
    assert.strictEqual(stats.reused, 1);
  });
});

// Suite 2: Pool Sizing
describe('Memory Pool - Sizing', () => {
  let pool;

  test('Respects default max size', () => {
    pool = new MemoryPoolManager({ defaultMaxPerType: 2 });
    const a = pool.acquire('builder', factory);
    const b = pool.acquire('builder', factory);
    const c = pool.acquire('builder', factory);

    pool.release('builder', a);
    pool.release('builder', b);
    pool.release('builder', c);

    assert.strictEqual(pool.getPoolSize('builder'), 2);
  });

  test('Respects per-type max size', () => {
    pool = new MemoryPoolManager({
      defaultMaxPerType: 2,
      maxPerType: { validator: 1 }
    });

    const a = pool.acquire('validator', factory);
    const b = pool.acquire('validator', factory);

    pool.release('validator', a);
    pool.release('validator', b);

    assert.strictEqual(pool.getPoolSize('validator'), 1);
  });
});

// Suite 3: Warm Pool
describe('Memory Pool - Warm Pool', () => {
  let pool;

  test('Warm pool pre-allocates items', () => {
    pool = new MemoryPoolManager({ defaultMaxPerType: 5 });
    pool.warmPool('irNode', 3, factory);

    assert.strictEqual(pool.getPoolSize('irNode'), 3);
    const stats = pool.getStats();
    assert.strictEqual(stats.created, 3);
  });

  test('Warm pool respects max size', () => {
    pool = new MemoryPoolManager({ defaultMaxPerType: 2 });
    pool.warmPool('irNode', 10, factory);

    assert.strictEqual(pool.getPoolSize('irNode'), 2);
  });
});

// Suite 4: Stats & Reset
describe('Memory Pool - Stats & Reset', () => {
  let pool;

  test('Stats track acquire/release', () => {
    pool = new MemoryPoolManager();
    const obj = pool.acquire('irNode', factory);
    pool.release('irNode', obj);

    const stats = pool.getStats();
    assert.strictEqual(stats.acquired, 1);
    assert.strictEqual(stats.released, 1);
  });

  test('Clear resets pools and stats', () => {
    pool = new MemoryPoolManager();
    const obj = pool.acquire('irNode', factory);
    pool.release('irNode', obj);

    pool.clear();
    const stats = pool.getStats();

    assert.strictEqual(stats.acquired, 0);
    assert.strictEqual(stats.released, 0);
    assert.strictEqual(pool.getPoolSize('irNode'), 0);
  });
});

// Print results
console.log('\n' + '='.repeat(70));
console.log('PHASE E - TASK E2.1: MEMORY POOL TEST RESULTS');
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

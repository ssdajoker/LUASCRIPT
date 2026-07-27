/**
 * PHASE E - Task E2.2: GC Optimization & Mini Gates Tests
 * 
 * @module tests/phase_e/run_E2_2_tests.js
 */

const { GCOptimizer } = require('../../src/optimizers/javascript/memory/gc_optimizer');
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

const createMemoryProvider = (heapUsed, heapTotal, rss) => () => ({
  heapUsed,
  heapTotal,
  rss
});

// Suite 1: Basic operations
describe('GC Optimizer - Basic Operations', () => {
  test('Create GC optimizer', () => {
    const gcOpt = new GCOptimizer();
    assert(gcOpt instanceof GCOptimizer);
  });

  test('Sample returns heap usage metrics', () => {
    const gcOpt = new GCOptimizer({
      memoryProvider: createMemoryProvider(80, 100, 200)
    });

    const sample = gcOpt.sample();
    assert(sample.heapUsagePct > 0.7 && sample.heapUsagePct < 0.9);
    assert.strictEqual(sample.rss, 200);
  });
});

// Suite 2: GC triggering
describe('GC Optimizer - GC Triggering', () => {
  test('Triggers GC when threshold exceeded', () => {
    let gcCalls = 0;
    const gcOpt = new GCOptimizer({
      heapUsageThreshold: 0.5,
      memoryProvider: createMemoryProvider(80, 100, 200),
      gcProvider: () => { gcCalls++; }
    });

    gcOpt.optimize();
    assert.strictEqual(gcCalls, 1);
    const stats = gcOpt.getStats();
    assert.strictEqual(stats.gcTriggered, 1);
  });

  test('Does not trigger GC below threshold', () => {
    let gcCalls = 0;
    const gcOpt = new GCOptimizer({
      heapUsageThreshold: 0.9,
      memoryProvider: createMemoryProvider(50, 100, 200),
      gcProvider: () => { gcCalls++; }
    });

    gcOpt.optimize();
    assert.strictEqual(gcCalls, 0);
  });
});

// Suite 3: Mini gates
describe('GC Optimizer - Mini Gates', () => {
  test('Default heapUsageHigh gate triggers', () => {
    const gcOpt = new GCOptimizer({
      heapUsageThreshold: 0.6,
      memoryProvider: createMemoryProvider(80, 100, 200)
    });

    const triggered = gcOpt.evaluateGates();
    assert(triggered.includes('heapUsageHigh'));
  });

  test('Default rssHigh gate triggers', () => {
    const gcOpt = new GCOptimizer({
      rssLimitBytes: 150,
      memoryProvider: createMemoryProvider(10, 100, 200)
    });

    const triggered = gcOpt.evaluateGates();
    assert(triggered.includes('rssHigh'));
  });

  test('Custom gate triggers and increments stats', () => {
    const gcOpt = new GCOptimizer({
      memoryProvider: createMemoryProvider(10, 100, 200)
    });

    gcOpt.registerGate('customGate', sample => sample.rss === 200);
    const triggered = gcOpt.evaluateGates();

    assert(triggered.includes('customGate'));
    const stats = gcOpt.getStats();
    assert.strictEqual(stats.gateHits.customGate, 1);
  });
});

// Suite 4: Rate limiting
describe('GC Optimizer - Sampling Rate', () => {
  test('Rate-limits sampling', () => {
    const gcOpt = new GCOptimizer({
      sampleIntervalMs: 1000,
      memoryProvider: createMemoryProvider(80, 100, 200)
    });

    const sample1 = gcOpt.sample();
    const sample2 = gcOpt.sample();

    assert.strictEqual(sample1.heapUsagePct, sample2.heapUsagePct);
    const stats = gcOpt.getStats();
    assert.strictEqual(stats.samples, 1);
  });
});

// Print results
console.log('\n' + '='.repeat(70));
console.log('PHASE E - TASK E2.2: GC OPTIMIZATION TEST RESULTS');
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

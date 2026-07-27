/**
 * PHASE E - Task E4.1: Algorithm Optimizer Tests
 *
 * @module tests/phase_e/run_E4_1_tests.js
 */

const { AlgorithmOptimizer } = require('../../src/optimizers/javascript/algorithms/algorithm_optimizer');
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

// Mock nodes
const forLoop = (body = []) => ({ type: 'ForStatement', body: { type: 'BlockStatement', body } });
const whileLoop = (body = []) => ({ type: 'WhileStatement', body: { type: 'BlockStatement', body } });
const callMap = () => ({
  type: 'CallExpression',
  callee: { type: 'MemberExpression', object: { type: 'Identifier', name: 'arr' }, property: { type: 'Identifier', name: 'map' } },
  arguments: []
});

// Suite 1: Basic analysis

describe('Algorithm Optimizer - Analysis', () => {
  test('Detects no loops as O(1)', () => {
    const optimizer = new AlgorithmOptimizer();
    const report = optimizer.analyze({ type: 'Program', body: [] });
    assert.strictEqual(report.complexity, 'O(1)');
  });

  test('Detects single loop as O(n)', () => {
    const optimizer = new AlgorithmOptimizer();
    const report = optimizer.analyze({ type: 'Program', body: [forLoop()] });
    assert.strictEqual(report.complexity, 'O(n)');
    assert.strictEqual(report.loops, 1);
  });

  test('Detects nested loops as O(n^2)', () => {
    const optimizer = new AlgorithmOptimizer();
    const report = optimizer.analyze({ type: 'Program', body: [forLoop([whileLoop()])] });
    assert.strictEqual(report.complexity, 'O(n^2)');
    assert.strictEqual(report.nestedLoops, 1);
  });
});

// Suite 2: Suggestions

describe('Algorithm Optimizer - Suggestions', () => {
  test('Suggests for array method chains', () => {
    const optimizer = new AlgorithmOptimizer();
    const report = optimizer.analyze({ type: 'Program', body: [callMap()] });
    assert(report.suggestions.some(s => s.includes('array methods')));
  });

  test('Suggests for nested loops', () => {
    const optimizer = new AlgorithmOptimizer();
    const report = optimizer.analyze({ type: 'Program', body: [forLoop([forLoop()])] });
    assert(report.suggestions.some(s => s.includes('Nested loops')));
  });
});

// Suite 3: Optimize wrapper

describe('Algorithm Optimizer - Optimize', () => {
  test('Optimize returns recommendations', () => {
    const optimizer = new AlgorithmOptimizer();
    const result = optimizer.optimize({ type: 'Program', body: [callMap()] });
    assert(result.ok);
    assert(result.recommendations.length > 0);
  });
});

// Suite 4: Stats

describe('Algorithm Optimizer - Stats', () => {
  test('Stats track loops', () => {
    const optimizer = new AlgorithmOptimizer();
    optimizer.analyze({ type: 'Program', body: [forLoop()] });
    const stats = optimizer.getStats();
    assert.strictEqual(stats.loops, 1);
  });
});

// Print results
console.log('\n' + '='.repeat(70));
console.log('PHASE E - TASK E4.1: ALGORITHM OPTIMIZER TEST RESULTS');
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

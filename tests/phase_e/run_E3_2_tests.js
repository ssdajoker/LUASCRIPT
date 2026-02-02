/**
 * PHASE E - Task E3.2: Security Hardeners Tests
 *
 * @module tests/phase_e/run_E3_2_tests.js
 */

const { SecurityHardeners } = require('../../src/optimizers/javascript/security/security_hardeners');
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

const id = (name) => ({ type: 'Identifier', name });
const member = (objName, propName) => ({
  type: 'MemberExpression',
  object: id(objName),
  property: { type: 'Identifier', name: propName }
});
const call = (calleeName, args = []) => ({
  type: 'CallExpression',
  callee: id(calleeName),
  arguments: args
});
const str = (value) => ({ type: 'Literal', value });

// Suite 1: Dynamic execution

describe('Security Hardeners - Dynamic execution', () => {
  test('Blocks eval', () => {
    const hardener = new SecurityHardeners();
    const res = hardener.hardenNode(call('eval'));
    assert.strictEqual(res.ok, false);
  });

  test('Allows eval when enabled', () => {
    const hardener = new SecurityHardeners({ allowDynamicExecution: true });
    const res = hardener.hardenNode(call('eval'));
    assert.strictEqual(res.ok, true);
  });
});

// Suite 2: Module restrictions

describe('Security Hardeners - Module restrictions', () => {
  test('Blocks require of child_process', () => {
    const hardener = new SecurityHardeners();
    const res = hardener.hardenNode(call('require', [str('child_process')]));
    assert.strictEqual(res.ok, false);
  });
});

// Suite 3: Prototype pollution

describe('Security Hardeners - Prototype pollution', () => {
  test('Blocks constructor access', () => {
    const hardener = new SecurityHardeners();
    const res = hardener.hardenNode(member('obj', 'constructor'));
    assert.strictEqual(res.ok, false);
  });
});

// Suite 4: Process access

describe('Security Hardeners - Process access', () => {
  test('Blocks process.env access', () => {
    const hardener = new SecurityHardeners();
    const res = hardener.hardenNode(member('process', 'env'));
    assert.strictEqual(res.ok, false);
  });
});

// Suite 5: String literals

describe('Security Hardeners - String literals', () => {
  test('Warns on large literal', () => {
    const hardener = new SecurityHardeners({ maxLiteralLength: 5 });
    const res = hardener.hardenNode(str('123456'));
    assert.strictEqual(res.warnings[0].type, 'largeLiteral');
  });
});

// Suite 6: Program traversal

describe('Security Hardeners - Program traversal', () => {
  test('Detects max node threshold', () => {
    const hardener = new SecurityHardeners({ maxNodes: 2 });
    const ast = { type: 'Program', body: [id('a'), id('b'), id('c')] };
    const res = hardener.hardenProgram(ast);
    assert.strictEqual(res.ok, false);
    assert(res.violations.some(v => v.type === 'maxNodes'));
  });

  test('Detects max depth threshold', () => {
    const hardener = new SecurityHardeners({ maxDepth: 3 });
    const ast = { type: 'Program', body: { a: { b: { c: { d: id('x') } } } } };
    const res = hardener.hardenProgram(ast);
    assert.strictEqual(res.ok, false);
    assert(res.violations.some(v => v.type === 'maxDepth'));
  });

  test('Stats tracked', () => {
    const hardener = new SecurityHardeners();
    hardener.hardenProgram({ type: 'Program', body: [id('safe')] });
    const stats = hardener.getStats();
    assert(stats.nodesVisited > 0);
  });
});

// Print results
console.log('\n' + '='.repeat(70));
console.log('PHASE E - TASK E3.2: SECURITY HARDENERS TEST RESULTS');
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

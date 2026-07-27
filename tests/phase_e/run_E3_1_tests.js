/**
 * PHASE E - Task E3.1: Security Validators Tests
 * 
 * @module tests/phase_e/run_E3_1_tests.js
 */

const { SecurityValidators } = require('../../src/optimizers/javascript/security/security_validators');
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
const id = (name) => ({ type: 'Identifier', name });
const member = (objName, propName) => ({
  type: 'MemberExpression',
  object: id(objName),
  property: { type: 'Identifier', name: propName }
});
const call = (calleeName) => ({
  type: 'CallExpression',
  callee: id(calleeName),
  arguments: []
});
const callMember = (obj, prop) => ({
  type: 'CallExpression',
  callee: member(obj, prop),
  arguments: []
});
const str = (value) => ({ type: 'Literal', value });

// Suite 1: Basic validation
describe('Security Validators - Basic', () => {
  test('Create validator', () => {
    const validator = new SecurityValidators();
    assert(validator instanceof SecurityValidators);
  });

  test('Validate safe identifier', () => {
    const validator = new SecurityValidators();
    const res = validator.validate(id('safeName'));
    assert.strictEqual(res.ok, true);
  });
});

// Suite 2: Identifier checks
describe('Security Validators - Identifier checks', () => {
  test('Block __proto__ identifier', () => {
    const validator = new SecurityValidators();
    const res = validator.validate(id('__proto__'));
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.violations[0].type, 'blockedIdentifier');
  });
});

// Suite 3: Member expression checks
describe('Security Validators - Member checks', () => {
  test('Block prototype property', () => {
    const validator = new SecurityValidators();
    const res = validator.validate(member('obj', 'prototype'));
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.violations[0].type, 'blockedProperty');
  });
});

// Suite 4: Call expression checks
describe('Security Validators - Call checks', () => {
  test('Block eval() call', () => {
    const validator = new SecurityValidators();
    const res = validator.validate(call('eval'));
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.violations[0].type, 'blockedCall');
  });

  test('Block member call to constructor', () => {
    const validator = new SecurityValidators();
    const res = validator.validate(callMember('obj', 'constructor'));
    assert.strictEqual(res.ok, false);
  });
});

// Suite 5: String literal checks
describe('Security Validators - String checks', () => {
  test('Warn on null byte', () => {
    const validator = new SecurityValidators();
    const res = validator.validate(str('a\u0000b'));
    assert.strictEqual(res.warnings[0].type, 'nullByte');
  });

  test('Warn on large literal', () => {
    const validator = new SecurityValidators({ maxStringLength: 5 });
    const res = validator.validate(str('123456'));
    assert.strictEqual(res.warnings[0].type, 'largeLiteral');
  });
});

// Suite 6: Program validation
describe('Security Validators - Program validation', () => {
  test('Program aggregates results', () => {
    const validator = new SecurityValidators();
    const res = validator.validateProgram([
      id('safe'),
      id('__proto__'),
      call('eval'),
      str('ok')
    ]);

    assert.strictEqual(res.violations.length, 2);
    assert.strictEqual(res.ok, false);
  });

  test('Stats tracked correctly', () => {
    const validator = new SecurityValidators();
    validator.validate(id('__proto__'));
    validator.validate(call('eval'));
    const stats = validator.getStats();
    assert.strictEqual(stats.violations, 2);
  });
});

// Print results
console.log('\n' + '='.repeat(70));
console.log('PHASE E - TASK E3.1: SECURITY VALIDATORS TEST RESULTS');
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

/**
 * PHASE F - Task F1.1: Lua-side Optimization Tests
 *
 * Validates the conservative Lua peephole optimizer:
 * - Trims trailing whitespace on safe lines
 * - Collapses excessive blank lines
 * - Preserves long-string content
 */

const assert = require('assert');
const { LuaPeepholeOptimizer } = require('../../src/optimizers/lua/phase_f/lua_optimizer');

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

describe('Lua Peephole Optimizer', () => {
  test('Trims trailing whitespace on safe lines', () => {
    const optimizer = new LuaPeepholeOptimizer();
    const input = 'local x = 1   \nlocal y = 2\n';
    const output = optimizer.optimize(input).code;
    assert.strictEqual(output, 'local x = 1\nlocal y = 2\n');
  });

  test('Collapses excessive blank lines', () => {
    const optimizer = new LuaPeepholeOptimizer({ maxConsecutiveBlankLines: 1 });
    const input = 'local x = 1\n\n\nlocal y = 2\n';
    const output = optimizer.optimize(input).code;
    assert.strictEqual(output, 'local x = 1\n\nlocal y = 2\n');
  });

  test('Preserves long-string content', () => {
    const optimizer = new LuaPeepholeOptimizer();
    const input = 'local s = [[line with spaces   ]]\nlocal y = 2\n';
    const output = optimizer.optimize(input).code;
    assert.strictEqual(output, input);
  });
});

console.log('\n====================== SUMMARY ======================');
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
results.forEach(r => console.log(r));

if (failedTests > 0) {
  process.exit(1);
}

/**
 * PERFECT PARSER INITIATIVE - Phase 1 Negative Tests
 * Ensures parser recovery handles malformed input without OOM or hangs.
 */

const assert = require('assert');
const { parseAndLower } = require('../src/ir/pipeline');

function expectThrows(fn, message) {
  let threw = false;
  try { fn(); } catch (e) { threw = true; }
  assert(threw, message || 'Expected to throw');
}

function run() {
  console.log('\n===== PERFECT PARSER PHASE 1 NEGATIVE TESTS =====');

  // 1) Unterminated string
  expectThrows(() => parseAndLower('let s = "unterminated;'));

  // 2) Missing semicolons in various spots
  expectThrows(() => parseAndLower('let x = 1 let y = 2;'));

  // 3) Mismatched braces/brackets/parentheses
  expectThrows(() => parseAndLower('function f(a { return a; }'));
  expectThrows(() => parseAndLower('let arr = [1, 2, 3;'));
  expectThrows(() => parseAndLower('if (x > 1 { x++; }'));

  // 4) Invalid keywords usage
  expectThrows(() => parseAndLower('return 5;')); // return outside function

  // 5) Invalid operators
  expectThrows(() => parseAndLower('let x = 1 ===='));

  // 6) Deeply nested unmatched structure to test recovery path
  expectThrows(() => parseAndLower('if ((a + (b * (c) { console.log(a); }'));

  console.log('ALL PHASE 1 NEGATIVE TESTS PASSED');
}

if (require.main === module) {
  run();
}

module.exports = { run };

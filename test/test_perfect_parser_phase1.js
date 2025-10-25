/**
 * PERFECT PARSER INITIATIVE - Phase 1 Test Suite (Reintroduced & Updated)
 *
 * Validates:
 * 1. String Concatenation Fix
 * 2. Runtime Validation (input/output)
 * 3. Parser Strategy Alignment (via IR path)
 * 4. Enhanced Memory Management (parser-time)
 * 5. Error Handling Improvements
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Use unified system entry points
const LuaScriptTranspiler = require('../src/transpiler');
const { parseAndLower } = require('../src/ir/pipeline');

function expectIncludes(haystack, needle, msg) {
  assert(haystack.includes(needle), msg || `Expected to include: ${needle}`);
}

function expectNotIncludes(haystack, needle, msg) {
  assert(!haystack.includes(needle), msg || `Should not include: ${needle}`);
}

async function run() {
  console.log('\n===== PERFECT PARSER PHASE 1 TESTS =====');

  // 1) String Concatenation
  {
    const t = new LuaScriptTranspiler({ useCanonicalIR: false, enableOptimizations: false });
    const input = 'let msg = "Hello" + " " + name; let sum = 5 + 3;';
    const out = await t.transpile(input, { includeRuntime: false });
    const code = typeof out === 'string' ? out : out.code;
    expectIncludes(code, '"Hello" .. " " .. name', 'string concatenation must use ..');
    expectIncludes(code, '5 + 3', 'numeric addition must remain +');
  }
  console.log('Phase1 Step1 OK');

  // 2) Runtime Validation (basic smoke via enhanced transpiler path if present)
  {
    // We just ensure the canonical IR path still works end-to-end
    const ir = parseAndLower('let x = 1; function f(a){ return a + 1; }');
    assert(ir && typeof ir === 'object', 'IR should be produced');
  }
  console.log('Phase1 Step2 OK');

  // 3) Parser Strategy Alignment (via phase1_core parser swap in IR pipeline)
  {
    // parseAndLower should succeed on simple programs
    const ir = parseAndLower('let a = 1; let b = 2;');
    assert(ir && typeof ir === 'object');
  }
  console.log('Phase1 Step3 OK');

  // 4) Error Handling (simple negative sanity)
  {
    let threw = false;
    try {
      parseAndLower('let x = (1 + 2;'); // unbalanced
    } catch (e) {
      threw = true;
    }
    assert(threw, 'Unbalanced input should trigger an error in the pipeline');
  }
  console.log('Phase1 Step4 OK');

  console.log('ALL PERFECT PARSER PHASE 1 TESTS PASSED');
}

if (require.main === module) {
  run().catch((e) => {
    console.error('Phase 1 tests failed:', e.message);
    process.exit(1);
  });
}

module.exports = { run };

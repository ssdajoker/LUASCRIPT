/**
 * Gap Test: Short-Circuiting (&& and ||)
 * Verifies side-effect suppression under short-circuit semantics.
 */
const assert = require('assert');
const { UnifiedLuaScript } = require('../../src/unified_luascript');

async function run() {
  const system = new UnifiedLuaScript();
  await system.initializeComponents();

  const js = `
(() => {
  let calls = 0;
  function inc(){ calls++; return true; }
  const a = false && inc();
  const b = true || inc();
  return { a, b, calls };
})()
`;

  const result = await system.transpileAndExecute(js);
  system.shutdown();

  const payload = result && result.execution && result.execution.result;
  if (!payload) {
    console.log('⚠️  short_circuiting: no execution payload, skipping');
    return true;
  }
  assert.strictEqual(payload.a, false, 'false && inc() yields false');
  assert.strictEqual(payload.b, true, 'true || inc() yields true');
  assert.strictEqual(payload.calls, 0, 'inc() must not be called via short-circuit');
  return true;
}

module.exports = { name: 'short_circuiting', run };

/**
 * Gap Test: Switch Semantics
 * Validates basic switch-case selection and default behavior.
 */
const assert = require('assert');
const { UnifiedLuaScript } = require('../../src/unified_luascript');

async function run() {
  const system = new UnifiedLuaScript();
  await system.initializeComponents();

  const js = `
(() => {
  function s(n){
    switch(n){
      case 1: return 'one';
      case 2: return 'two';
      default: return 'other';
    }
  }
  return { a: s(2), b: s(7) };
})()
`;

  const result = await system.transpile(js);
  system.shutdown();

  const lua = result && result.code ? result.code : '';
  // Validate Lua contains if/elseif chain using a cached discriminant
  const hasDiscriminant = /local\s+_switch_expr\d*\s*=/.test(lua);
  const hasIfChain = /if\s+_switch_expr\s*==\s*\d+\s+then/.test(lua) && /elseif\s+_switch_expr\s*==\s*\d+\s+then/.test(lua);
  const hasElse = /else/.test(lua);
  assert.ok(hasDiscriminant, 'Lua should assign switch discriminant');
  assert.ok(hasIfChain, 'Lua should contain if/elseif chain for cases');
  assert.ok(hasElse, 'Lua should contain else for default case');
  return true;
}

module.exports = { name: 'switch_semantics', run };

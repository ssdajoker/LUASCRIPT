/**
 * Gap Test: Function Expressions & Arrow Functions
 * Validates named/anonymous function expressions and arrow function usage as callbacks.
 */
const assert = require('assert');
const { UnifiedLuaScript } = require('../../src/unified_luascript');

async function run() {
  const system = new UnifiedLuaScript();
  await system.initializeComponents();

  const js = `
(() => {
  const obj = {
    f: function(x){ return x + 1; },
    g: (y) => y * 2
  };
  function apply(cb, v){ return cb(v); }
  return { a: obj.f(1), b: obj.g(3), c: apply(obj.f, 5) };
})()
`;

  const result = await system.transpile(js);
  system.shutdown();

  const lua = result && result.code ? result.code : '';
  const hasFunctionKeyword = /function\s*\(/i.test(lua);
  const hasObjectAssignment = /\{[^}]*\w+\s*=\s*function\s*\(/.test(lua) || /\.\w+\s*=\s*function\s*\(/.test(lua);
  const hasReturn = /return\s+/i.test(lua);
  assert.ok(hasFunctionKeyword, 'Lua should contain function keyword');
  assert.ok(hasObjectAssignment, 'Lua should assign function to object/table');
  assert.ok(hasReturn, 'Lua should contain return statements within functions');
  return true;
}

module.exports = { name: 'function_expressions', run };

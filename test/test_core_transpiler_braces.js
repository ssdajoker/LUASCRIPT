const assert = require('assert');
const { CoreTranspiler } = require('../src/core_transpiler');

const code = `
function wrap() {
  const obj = { nested: { inner: 1 }, fn: function() { return { val: 2 }; } };
  return obj;
}
`;

(function run() {
  const transpiler = new CoreTranspiler({ optimize: false, sourceMap: false });
  const result = transpiler.transpile(code);
  const lua = typeof result === 'string' ? result : result.code;

  assert(lua.includes('local function wrap('), 'wrap function should be declared');
  assert(/local obj = \{ nested = \{ inner = 1 \}, fn = function\(\) return \{ val = 2 \} end \}/.test(lua),
    'object literal braces must remain intact');
  assert(!/end = \{/.test(lua), 'brace cleanup should not rewrite object literals');

  console.log('Core transpiler brace snapshot: PASS');
})();

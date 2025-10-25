const LuaScriptTranspiler = require('../src/transpiler');

(async () => {
  const t = new LuaScriptTranspiler({ useCanonicalIR: false, enableOptimizations: false });
  const src = 'let msg = "Hello" + " " + name; let sum = 5 + 3;';
  const out = await t.transpile(src, { includeRuntime: false });
  const code = typeof out === 'string' ? out : out.code;
  console.log('OUTPUT:\n' + code);
})().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});

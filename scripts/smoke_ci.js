// Minimal CI smoke check: parser + IR + emit + transpiler legacy path
const { parseAndLower } = require('../src/ir/pipeline');
const LuaScriptTranspiler = require('../src/transpiler');
const { emitLuaFromIR } = require('../src/ir/emitter');

(async () => {
  // 1) IR pipeline sanity
  const src = 'let x = 1; function f(a){ return a + 1; }';
  const ir = parseAndLower(src);
  if (!ir || typeof ir !== 'object' || !ir.nodes) {
    throw new Error('IR pipeline failed');
  }

  const t = new LuaScriptTranspiler({ useCanonicalIR: false, enableOptimizations: false });
  const result = await t.transpile('let msg = "Hello" + " " + name; let sum = 5 + 3;', { includeRuntime: false });
  const code = typeof result === 'string' ? result : result.code;

  if (!code.includes('"Hello" .. " " .. name')) throw new Error('Concat check failed');
  if (!code.includes('5 + 3')) throw new Error('Numeric addition check failed');

  // 2) Emit from IR and balance check via transpiler path
  const luaFromIr = emitLuaFromIR(ir, { indent: '  ' });

  // Validate balance using transpiler helper (option default is enabled)
  t.validateLuaBalanceOrThrow(luaFromIr, { phase: 'smoke-ci' });

  console.log('SMOKE: OK');
})().catch((e) => {
  console.error('SMOKE: FAIL', e.message);
  process.exit(1);
});

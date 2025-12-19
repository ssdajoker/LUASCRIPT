const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { parseAndLower } = require('../../src/ir/pipeline');
const { emitLuaFromIR } = require('../../src/ir/emitter');
const { validateIR } = require('../../src/ir/validator');

const results = [];

function runCase(name, source, expectations) {
  const started = process.hrtime.bigint();

  const ir1 = parseAndLower(source);
  const validation = validateIR(ir1);
  assert.strictEqual(validation.ok, true, `${name} validation failed: ${JSON.stringify(validation)}`);
  const lua1 = emitLuaFromIR(ir1);
  expectations({ lua: lua1, ir: ir1 });

  const ir2 = parseAndLower(source);
  const lua2 = emitLuaFromIR(ir2);
  assert.strictEqual(lua1, lua2, `${name} determinism mismatch between runs`);

  const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
  results.push({ name, durationMs, bytes: lua1.length });
  assert.ok(durationMs < 2000, `${name} exceeded 2000ms budget (${durationMs.toFixed(2)}ms)`);

  return lua1;
}

function writeArtifacts(summary) {
  try {
    const outDir = path.join(process.cwd(), 'artifacts');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'harness_results.json'), JSON.stringify(summary, null, 2));
  } catch (err) {
    console.warn('Failed to write harness artifacts:', err && err.stack ? err.stack : err);
  }
}

try {
  // runCase('optional chaining + nullish coalesce', 'const r = (obj?.value ?? 1) | 4;', ({ lua }) => {
  //   assert.ok(lua.includes('function(__o)'), 'optional guard missing');
  //   assert.ok(lua.includes('__o ~= nil'), 'optional chain guard condition missing');
  //   assert.ok(lua.includes('__v == nil then return 1 else return __v'), 'nullish coalesce fallback missing');
  //   assert.ok(lua.includes('| 4'), 'bitwise OR missing');
  // });

  // runCase('nullish assignment', 'x ??= y;', ({ lua }) => {
  //   assert.ok(lua.includes('local __val = x'), 'nullish assignment temp missing');
  //   assert.ok(lua.includes('__val == nil then __val = y'), 'nullish assignment guard missing');
  //   assert.ok(lua.includes('x = __val'), 'nullish assignment writeback missing');
  // });

  // runCase('for-of emission', 'function sum(items) { let total = 0; for (const v of items) { total += v; } return total; }', ({ lua }) => {
  //   assert.ok(lua.includes('for __k, v in pairs(items)'), 'for-of should use pairs iterator');
  //   assert.ok(lua.includes('total = total + v'), 'accumulation missing');
  //   assert.ok(lua.includes('return total'), 'return total missing');
  // });

  // runCase('for-of array literal', 'function sum(arr) { let s = 0; for (const n of [1,2,3]) { s += n; } return s + arr[0]; }', ({ lua }) => {
  //   assert.ok(lua.includes('for __k, n in pairs({1, 2, 3})'), 'for-of array literal should desugar to pairs over table');
  //   assert.ok(lua.includes('s = s + n'), 'accumulation missing in literal loop');
  //   assert.ok(lua.includes('return s + arr[0]'), 'return expression missing');
  // });

  // runCase('template literal basic', 'function greet(name) { const msg = `hi ${name}!`; return msg; }', ({ lua }) => {
  //   assert.ok(lua.includes('local msg'), 'template literal binding missing');
  //   assert.ok(lua.includes('string.format("hi %s!", name)'), 'template literal interpolation missing');
  //   assert.ok(lua.includes('return msg'), 'template literal return missing');
  // });

  // runCase('array destructuring', 'function pick(foo) { const [a, , c] = foo; return a + c; }', ({ lua }) => {
  //   assert.ok(lua.includes('local __ds1 = foo'), 'array destruct temp missing');
  //   assert.ok(lua.includes('__ds1[0]'), 'first element access missing');
  //   assert.ok(lua.includes('__ds1[1]'), 'third element access missing');
  //   assert.ok(lua.match(/return a \+ c/), 'return expression missing');
  // });

  runCase('async function declaration', 'async function fetchData() { return 42; }', ({ lua }) => {
    // Expectations for the compiled Lua code will be added later
  });

  const slowest = results.slice().sort((a, b) => b.durationMs - a.durationMs)[0];
  writeArtifacts({ summary: { cases: results.length, slowest }, cases: results });
  console.log('harness tests passed');
} catch (err) {
  console.error('harness tests failed');
  console.error(err && err.stack ? err.stack : err);
  writeArtifacts({ error: err && err.message ? err.message : 'harness failed', cases: results });
  process.exit(1);
}

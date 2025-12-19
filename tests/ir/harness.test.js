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
  runCase('simple variable declaration', 'const x = 5;', ({ lua }) => {
    assert.ok(lua.includes('local x'), 'variable declaration missing');
    assert.ok(lua.includes('5'), 'value missing');
  });

  runCase('function declaration', 'function add(a, b) { return a + b; }', ({ lua }) => {
    assert.ok(lua.includes('function add'), 'function declaration missing');
    assert.ok(lua.includes('return'), 'return statement missing');
  });

  runCase('arrow function', 'const double = x => x * 2;', ({ lua }) => {
    assert.ok(lua.includes('function'), 'arrow function not transpiled');
    assert.ok(lua.includes('* 2') || lua.includes('*2'), 'multiply operation missing');
  });

  runCase('binary expressions', 'const result = a + b * c;', ({ lua }) => {
    assert.ok(lua.includes('+') && lua.includes('*'), 'binary operations missing');
  });

  runCase('if statement', 'if (x > 0) { y = 1; }', ({ lua }) => {
    assert.ok(lua.includes('if') && lua.includes('then'), 'if statement missing');
    assert.ok(lua.includes('end'), 'if statement not closed');
  });

  runCase('while loop', 'while (i < 10) { i++; }', ({ lua }) => {
    assert.ok(lua.includes('while'), 'while loop missing');
    assert.ok(lua.includes('do'), 'while body missing');
  });

  runCase('array literal', 'const arr = [1, 2, 3];', ({ lua }) => {
    assert.ok(lua.includes('{') && lua.includes('}'), 'array literal missing');
  });

  runCase('object literal', 'const obj = {x: 1, y: 2};', ({ lua }) => {
    assert.ok(lua.includes('x') && lua.includes('y'), 'object properties missing');
  });

  runCase('member access', 'const value = obj.prop;', ({ lua }) => {
    assert.ok(lua.includes('.') || lua.includes('['), 'member access missing');
  });

  runCase('array destructuring with holes', 'const [a, , c] = arr;', ({ lua }) => {
    assert.ok(lua.includes('a') && lua.includes('c'), 'destructured variables missing');
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

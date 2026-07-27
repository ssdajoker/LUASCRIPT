const assert = require('assert');
const { IRPipeline } = require('../../src/ir/pipeline-integration');

const results = [];
const pipeline = new IRPipeline({ emitDebugInfo: true });

function runCase(name, source, expectations) {
  const started = process.hrtime.bigint();

  const first = pipeline.transpile(source, `${name}.js`);
  assert.strictEqual(first.success, true, `${name} failed: ${first.errors && first.errors.join('; ')}`);
  assert.ok(first.code && first.code.length > 0, `${name} emitted empty Lua`);

  const second = pipeline.transpile(source, `${name}.js`);
  assert.strictEqual(second.success, true, `${name} second run failed: ${second.errors && second.errors.join('; ')}`);
  assert.strictEqual(first.code, second.code, `${name} is not deterministic`);

  if (expectations && expectations.length) {
    for (const pattern of expectations) {
      const ok = pattern instanceof RegExp ? pattern.test(first.code) : first.code.includes(pattern);
      assert.ok(ok, `${name} missing pattern: ${pattern}`);
    }
  }

  const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
  results.push({ name, durationMs, bytes: first.code.length });
}

function main() {
  try {
    runCase('array destructuring with hole', 'function pick() { const [a, , c] = [1, 2, 3]; return a + c; } pick();', [
      /a/,
      /c/,
      /1/,
      /3/,
    ]);

    runCase('object destructuring with rename + default', 'function use(point) { const {x: left = 1, y: right = 2} = point; return left + right; } use({x:1,y:2});', [
      /left/,
      /right/,
      /1/,
      /2/,
    ]);

    runCase('nested destructuring', 'function pluck(payload) { const {user: {id, meta: {role}}} = payload; return id + role; } pluck({user:{id:1,meta:{role:2}}});', [
      /user/,
      /role/,
    ]);

    runCase('rest parameters + spread', 'function join(first, ...rest) { const items = [first, ...rest]; return items[1]; } join(1,2,3);', [
      /rest/,
      /items/,
    ]);

    const slowest = results.slice().sort((a, b) => b.durationMs - a.durationMs)[0];
    console.log('✅ Enhanced harness smoke passed');
    console.log(JSON.stringify({ summary: { cases: results.length, slowest }, cases: results }, null, 2));
  } catch (err) {
    console.error('❌ Enhanced harness smoke failed');
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();

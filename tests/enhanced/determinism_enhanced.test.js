const assert = require('assert');
const { IRPipeline } = require('../../src/ir/pipeline-integration');

function normalize(ir) {
  if (!ir || typeof ir !== 'object') return ir;
  if (Array.isArray(ir)) return ir.map(normalize);
  const out = {};
  for (const key of Object.keys(ir)) {
    if (key === 'createdAt' || key === 'metaPerf') continue;
    out[key] = normalize(ir[key]);
  }
  return out;
}

(function main() {
  const pipeline = new IRPipeline({ emitDebugInfo: true });
  const source = 'function main(input) { const [a, b] = input; function pick({x, y}) { return x + y; } return a + b + pick({x:1,y:2}); } main([1,2]);';

  const first = pipeline.transpile(source, 'determinism-enhanced.js');
  const second = pipeline.transpile(source, 'determinism-enhanced.js');

  assert.strictEqual(first.success, true, `first run failed: ${first.errors && first.errors.join('; ')}`);
  assert.strictEqual(second.success, true, `second run failed: ${second.errors && second.errors.join('; ')}`);
  assert.strictEqual(first.code, second.code, 'emitted Lua must be deterministic');
  assert.deepStrictEqual(normalize(first.ir), normalize(second.ir), 'IR must be deterministic after normalization');

  console.log('Determinism (enhanced) test: PASS');
})();

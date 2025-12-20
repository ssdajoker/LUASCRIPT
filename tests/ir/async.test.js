/**
 * Async/await edge-case coverage.
 * Focuses on nested awaits, promise orchestration, and error propagation.
 */

const assert = require('assert');
const { parseAndLower } = require('../../src/ir/pipeline');
const { validateIR } = require('../../src/ir/validator');

let passed = 0;
let failed = 0;

function countNodes(ir, kind) {
  return Object.values(ir.nodes || {}).filter((node) => node.kind === kind).length;
}

function runTest(name, source, expectations = {}) {
  try {
    const ir = parseAndLower(source);
    const validation = validateIR(ir);
    assert.strictEqual(validation.ok, true, 'IR validation failed');

    if (expectations.minAwaits !== undefined) {
      assert.ok(
        countNodes(ir, 'AwaitExpression') >= expectations.minAwaits,
        `Expected at least ${expectations.minAwaits} await nodes`,
      );
    }

    passed++;
    console.log(`  PASS ${name}`);
  } catch (error) {
    failed++;
    console.log(`  FAIL ${name}: ${error.message}`);
  }
}

console.log('\nAsync/Await Edge Case Suite\n');

runTest(
  'simple await in async function',
  `
  async function fetchData() {
    return await request();
  }
  `,
  { minAwaits: 1 },
);

runTest(
  'nested await expressions',
  `
  async function outer() {
    const inner = await getInner();
    return await inner;
  }
  `,
  { minAwaits: 2 },
);

runTest(
  'sequential awaits maintain order',
  `
  async function pipeline(x) {
    const first = await stepOne(x);
    const second = await stepTwo(first);
    return second;
  }
  `,
  { minAwaits: 2 },
);

runTest(
  'promise chain with await',
  `
  async function chain() {
    return await Promise.resolve(1).then((v) => v + 1);
  }
  `,
  { minAwaits: 1 },
);

runTest(
  'await inside loop body',
  `
  async function accumulate(items) {
    let total = 0;
    for (const item of items) {
      total += await cost(item);
    }
    return total;
  }
  `,
  { minAwaits: 1 },
);

runTest(
  'await inside try/catch',
  `
  async function guarded() {
    try {
      return await risky();
    } catch (err) {
      return await recover(err);
    }
  }
  `,
  { minAwaits: 2 },
);

runTest(
  'await in finally block',
  `
  async function finalize() {
    let flag = false;
    try {
      flag = await doWork();
    } finally {
      await teardown(flag);
    }
  }
  `,
  { minAwaits: 2 },
);

runTest(
  'await with Promise.all concurrency',
  `
  async function collect() {
    const [a, b] = await Promise.all([getA(), getB()]);
    return a + b;
  }
  `,
  { minAwaits: 1 },
);

runTest(
  'await with Promise.race',
  `
  async function first() {
    return await Promise.race([slow(), fast()]);
  }
  `,
  { minAwaits: 1 },
);

runTest(
  'timeout pattern with await',
  `
  async function withTimeout(ms) {
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), ms);
      work().then((value) => {
        clearTimeout(timer);
        resolve(value);
      });
    });
  }
  `,
  { minAwaits: 1 },
);

runTest(
  'async arrow functions nested',
  `
  async function callArrow(v) {
    const fn = async (x) => await expand(x);
    return await fn(v);
  }
  `,
  { minAwaits: 2 },
);

runTest(
  'async method in class',
  `
  class Worker {
    async run(job) {
      return await job();
    }
  }
  `,
  { minAwaits: 1 },
);

runTest(
  'await with destructuring result',
  `
  async function destructure() {
    const { value } = await loadConfig();
    return value;
  }
  `,
  { minAwaits: 1 },
);

runTest(
  'await inside nested callbacks',
  `
  async function nestedCallbacks() {
    return await Promise.resolve(1).then(async (v) => await transform(v));
  }
  `,
  { minAwaits: 2 },
);

runTest(
  'await immediate value for consistency',
  `
  async function immediate() {
    return await 42;
  }
  `,
  { minAwaits: 1 },
);

console.log('\n==============================');
console.log(`Total: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
if (failed > 0) {
  process.exitCode = 1;
}

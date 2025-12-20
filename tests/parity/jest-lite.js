// Minimal Jest-like test harness for parity suites
const tests = [];
let currentSuite = '';

function describe(name, fn) {
  const previousSuite = currentSuite;
  currentSuite = name;
  fn();
  currentSuite = previousSuite;
}

function it(name, fn) {
  tests.push({ name, suite: currentSuite, fn });
}

function expect(received) {
  return {
    toBe(expected) {
      if (received !== expected) {
        throw new Error(`Expected ${received} to be ${expected}`);
      }
    },
    toBeDefined() {
      if (received === undefined) {
        throw new Error(`Expected value to be defined`);
      }
    },
    toContain(sub) {
      if (typeof received === 'string' || Array.isArray(received)) {
        if (!received.includes(sub)) {
          throw new Error(`Expected ${JSON.stringify(received)} to contain ${JSON.stringify(sub)}`);
        }
      } else {
        throw new Error(`toContain not supported for type ${typeof received}`);
      }
    },
    toBeGreaterEqual(value) {
      if (!(received >= value)) {
        throw new Error(`Expected ${received} to be >= ${value}`);
      }
    },
    toBeGreaterThanOrEqual(value) {
      if (!(received >= value)) {
        throw new Error(`Expected ${received} to be >= ${value}`);
      }
    }
  };
}

async function run() {
  let passed = 0;
  for (const test of tests) {
    const label = test.suite ? `${test.suite} › ${test.name}` : test.name;
    try {
      const result = test.fn();
      if (result && typeof result.then === 'function') {
        await result;
      }
      passed += 1;
      console.log(`✅ ${label}`);
    } catch (err) {
      console.error(`❌ ${label}: ${err.message || err}`);
      process.exitCode = 1;
    }
  }
  console.log(`\nCompleted ${tests.length} tests; passed ${passed}/${tests.length}`);
  process.exit(process.exitCode || 0);
}

module.exports = { describe, it, expect, run };

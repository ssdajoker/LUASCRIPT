/**
 * PHASE E - Python Quality Gates Runner Tests
 *
 * Runs Phase E checks for Python pipeline determinism, performance,
 * and memory gate sampling.
 */

const assert = require("assert");
const { PythonPhaseEQualityRunner } = require("../../src/optimizers/python/quality/python_phase_e_quality_runner");

let passedTests = 0;
let failedTests = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passedTests++;
    results.push(`✅ ${name}`);
  } catch (error) {
    failedTests++;
    results.push(`❌ ${name}: ${error.message}`);
  }
}

function describe(name, fn) {
  console.log(`\n📋 ${name}`);
  fn();
}

const SAMPLE_CODE = `
class Counter:
    def __init__(self, value: int):
        self.value = value

    def inc(self):
        self.value += 1

    def get(self) -> int:
        return self.value

def main():
    c = Counter(0)
    for _ in range(3):
        c.inc()
    return c.get()
`;

// Suite 1: Basic pipeline success
describe("Python Phase E - Basic", () => {
  test("Runner completes successfully", () => {
    const runner = new PythonPhaseEQualityRunner({
      determinismRuns: 5,
      performanceBudgetMs: 1000,
    });

    const result = runner.run(SAMPLE_CODE, "counter.py");
    assert.strictEqual(result.success, true);
    assert(result.code.includes("class Counter"));
    assert.strictEqual(result.errors.length, 0);
  });
});

// Suite 2: Determinism verification
describe("Python Phase E - Determinism", () => {
  test("Determinism passes for repeated runs", () => {
    const runner = new PythonPhaseEQualityRunner({
      determinismRuns: 5,
      performanceBudgetMs: 1000,
    });

    const result = runner.run(SAMPLE_CODE, "determinism.py");
    assert.strictEqual(result.determinism.success, true);
    assert.strictEqual(result.determinism.uniqueHashes.length, 1);
  });
});

// Suite 3: Performance budget
describe("Python Phase E - Performance", () => {
  test("Pipeline meets performance budget", () => {
    const runner = new PythonPhaseEQualityRunner({
      determinismRuns: 3,
      performanceBudgetMs: 1000,
    });

    const result = runner.run(SAMPLE_CODE, "perf.py");
    assert.strictEqual(result.performance.withinBudget, true);
  });
});

// Suite 4: Memory gates
describe("Python Phase E - Memory Gates", () => {
  test("Memory sample includes heap usage", () => {
    const runner = new PythonPhaseEQualityRunner({
      determinismRuns: 3,
      performanceBudgetMs: 1000,
    });

    const result = runner.run(SAMPLE_CODE, "memory.py");
    assert(result.memory.sample.heapUsagePct >= 0);
  });
});

// Print results
console.log("\n" + "=".repeat(70));
console.log("PHASE E - PYTHON QUALITY RUNNER RESULTS");
console.log("=".repeat(70));

results.forEach(result => console.log(result));

console.log("\n" + "=".repeat(70));
console.log(`📊 Summary: ${passedTests} passed, ${failedTests} failed`);
const successRate = ((passedTests / (passedTests + failedTests)) * 100).toFixed(1);
console.log(`✅ Success Rate: ${successRate}%`);
console.log("=".repeat(70));

if (failedTests > 0) {
  process.exit(1);
}

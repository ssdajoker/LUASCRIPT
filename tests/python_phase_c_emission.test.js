// Phase C: Python Canonical IR Emission Tests

const assert = require("assert");
const PythonParser = require("../src/parsers/python_parser");
const PythonLowerer = require("../src/ir/lowerer_python");
const { PythonIRLowererPhaseB } = require("../src/ir/python_ir_lowerer_phase_b");
const { PythonPhaseBEmitter } = require("../src/ir/emitter_python_phase_b");

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

const parser = new PythonParser();
const phaseALowerer = new PythonLowerer();
const phaseBLowerer = new PythonIRLowererPhaseB();
const emitter = new PythonPhaseBEmitter();

// Test Suite 1: Basic Emission
describe("Python Phase C - Basic Emission", () => {
  test("emits simple variable", () => {
    const code = "x=1";

    try {
      const ast = parser.parse(code);
      const phaseAIR = phaseALowerer.lower(ast);
      const phaseB = phaseBLowerer.lower(phaseAIR);
      const output = emitter.emit(phaseB.ir);
      assert(typeof output === "string", "Should return string");
    } catch (err) {
      throw new Error(`Failed: ${err.message}`);
    }
  });

  test("emits function", () => {
    const code = "def f(a):\n    return a";

    try {
      const ast = parser.parse(code);
      const phaseAIR = phaseALowerer.lower(ast);
      const phaseB = phaseBLowerer.lower(phaseAIR);
      const output = emitter.emit(phaseB.ir);
      assert(typeof output === "string", "Should return string");
    } catch (err) {
      throw new Error(`Failed: ${err.message}`);
    }
  });
});

// Print results
console.log("\n" + "=".repeat(60));
results.forEach(r => console.log(r));
console.log("=".repeat(60));
console.log(
  `\n📊 Results: ${passedTests} passed, ${failedTests} failed\n`
);

if (failedTests > 0) {
  process.exit(1);
}

#!/usr/bin/env node

/**
 * Strict Phase D/E verifier for the current Python pipeline surface.
 *
 * This intentionally validates live behavior and current result shapes instead
 * of old report-era aliases such as phaseE.ffiBindings or securityReport.
 */

const assert = require("assert");
const { PythonPhaseDPipeline } = require("../src/ir/pipeline_python_phase_d.js");
const { PythonPhaseEPipeline } = require("../src/ir/pipeline_python_phase_e.js");

let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

function test(name, fn) {
  try {
    fn();
    testsPassed += 1;
    console.log(`  PASS ${name}`);
  } catch (error) {
    testsFailed += 1;
    failedTests.push({ name, error });
    console.log(`  FAIL ${name}`);
    console.log(`       ${error.message}`);
  }
}

function expectObject(value, label) {
  assert.ok(value && typeof value === "object", `${label} should be an object`);
}

console.log("\n" + "=".repeat(80));
console.log("CLARITY CANON PHASE D/E LIVE VERIFICATION");
console.log("=".repeat(80) + "\n");

console.log("PHASE D: Memory and performance pipeline\n");

const phaseD = new PythonPhaseDPipeline({
  enableMemoryOptimization: true,
  enablePooling: true,
  enableGCDetection: true,
  enableStackAnalysis: true,
  enableMemoryProfiling: true,
  maxMemoryOverheadMB: 10,
  emitDebugInfo: true
});

test("Phase D transpiles simple assignment", () => {
  const result = phaseD.transpile("x = 42");
  assert.strictEqual(result.success, true);
  assert.ok(result.code);
  expectObject(result.phaseD, "phaseD");
});

test("Phase D transpiles one-line function syntax", () => {
  const result = phaseD.transpile("def simple(): return 42");
  assert.strictEqual(result.success, true);
  assert.ok(result.code.includes("simple"));
});

test("Phase D reports syntax errors without throwing", () => {
  const result = phaseD.transpile("def broken(: return 42");
  assert.strictEqual(result.success, false);
  assert.ok(Array.isArray(result.errors));
  assert.ok(result.errors.length > 0);
});

test("Phase D exposes current analysis shape", () => {
  const result = phaseD.transpile("x = 42");
  expectObject(result.phaseD.gcAnalysis, "phaseD.gcAnalysis");
  expectObject(result.phaseD.stackAnalysis, "phaseD.stackAnalysis");
  expectObject(result.phaseD.poolingStats, "phaseD.poolingStats");
  expectObject(result.phaseD.memoryStatus, "phaseD.memoryStatus");
  assert.ok(Array.isArray(result.phaseD.gcAnalysis.patterns));
  expectObject(result.phaseD.stackAnalysis.stats, "phaseD.stackAnalysis.stats");
});

test("Phase D pooling stats remain bounded", () => {
  const result = phaseD.transpile("def simple(): return 42");
  expectObject(result.phaseD.poolingStats.memory, "phaseD.poolingStats.memory");
  assert.strictEqual(result.phaseD.poolingStats.memory.withinLimit, true);
});

console.log("\nPHASE E: Security and interoperability pipeline\n");

const phaseE = new PythonPhaseEPipeline({
  enableSecurityAnalysis: true,
  enableFFIBindings: true,
  enableBufferDetection: true,
  emitRecommendations: true
});

test("Phase E transpiles simple assignment", () => {
  const result = phaseE.transpile("x = 42");
  assert.strictEqual(result.success, true);
  assert.ok(result.code);
  expectObject(result.phaseE, "phaseE");
});

test("Phase E reports syntax errors without throwing", () => {
  const result = phaseE.transpile("def broken(: return 42");
  assert.strictEqual(result.success, false);
  assert.ok(Array.isArray(result.errors));
  assert.ok(result.errors.length > 0);
});

test("Phase E exposes current security shape", () => {
  const result = phaseE.transpile("def simple(): return 42");
  expectObject(result.phaseE.security, "phaseE.security");
  expectObject(result.phaseE.security.summary, "phaseE.security.summary");
  assert.strictEqual(result.phaseE.security.passed, true);
  assert.strictEqual(result.phaseE.security.summary.status, "PASS");
});

test("Phase E keeps unimplemented FFI honest", () => {
  const result = phaseE.transpile("import ctypes");
  expectObject(result.phaseE.qualityGates.ffi, "phaseE.qualityGates.ffi");
  assert.strictEqual(result.phaseE.ffi, null);
  assert.strictEqual(result.phaseE.qualityGates.ffi.status, "WARN");
});

test("Phase E exposes buffer and overall quality gates", () => {
  const result = phaseE.transpile("arr = [1, 2, 3]; value = arr[0]");
  expectObject(result.phaseE.qualityGates.bufferOverflow, "phaseE.qualityGates.bufferOverflow");
  expectObject(result.phaseE.qualityGates.overall, "phaseE.qualityGates.overall");
  assert.ok(["PASS", "FAIL", "WARN"].includes(result.phaseE.qualityGates.overall.status));
});

console.log("\nINTEGRATED D/E: Explicit Phase E pipeline\n");

test("Phase E includes Phase D and Phase E outputs", () => {
  const result = phaseE.transpile("def work(): return 42");
  assert.strictEqual(result.success, true);
  expectObject(result.phaseD, "phaseD");
  expectObject(result.phaseE, "phaseE");
});

test("Integrated pipeline returns statistics-compatible output", () => {
  const result = phaseE.transpile("x = 42");
  assert.strictEqual(result.success, true);
  assert.ok(Object.prototype.hasOwnProperty.call(result, "phaseAIR"));
  assert.ok(Object.prototype.hasOwnProperty.call(result, "phaseBIR"));
  assert.ok(Object.prototype.hasOwnProperty.call(result, "phaseCIR"));
});

console.log("\n" + "=".repeat(80));
console.log("PHASE D/E VERIFICATION REPORT");
console.log("=".repeat(80));
console.log(`Total Tests Run: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log("\nFailed Tests:");
  for (const { name, error } of failedTests) {
    console.log(`  - ${name}: ${error.message}`);
  }
  process.exit(1);
}

console.log("\nCLARITY CANON PHASE D/E VERIFICATION: PASS\n");
process.exit(0);

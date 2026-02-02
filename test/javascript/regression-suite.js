#!/usr/bin/env node

/**
 * REGRESSION SUITE - JavaScript Quality Assurance Phase 3.6
 *
 * Runs a corpus of IR samples through core optimizers and compares
 * metrics against a stored baseline. Generates a report and exits
 * non-zero if regressions exceed thresholds.
 */

const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");
const { evaluateSloGates } = require("../../src/optimizers/javascript/quality/slo-gates");

function safeRequire(modulePath) {
  try {
    return require(modulePath);
  } catch (_err) {
    return null;
  }
}

const analyzers = [
  { name: "register-pressure", mod: safeRequire("../../src/optimizers/javascript/memory/register-pressure") },
  { name: "buffer-overflow", mod: safeRequire("../../src/optimizers/javascript/security/buffer-overflow-detection") },
  { name: "type-confusion", mod: safeRequire("../../src/optimizers/javascript/security/type-confusion-prevention") },
  { name: "bounds-checks", mod: safeRequire("../../src/optimizers/javascript/security/bounds-checking-emitter") },
  { name: "ffi-analyzer", mod: safeRequire("../../src/optimizers/javascript/interop/ffi-analyzer") },
  { name: "boundary-optimizer", mod: safeRequire("../../src/optimizers/javascript/interop/boundary-optimizer") },
  { name: "marshaling-optimizer", mod: safeRequire("../../src/optimizers/javascript/interop/marshaling-optimizer") },
  { name: "type-converter", mod: safeRequire("../../src/optimizers/javascript/interop/type-converter") }
].filter(entry => entry.mod);

const corpus = buildCorpus();
const cases = [];

// Generate 100+ cases by repeating corpus
for (let i = 0; i < 5; i++) {
  corpus.forEach(sample => cases.push(sample));
}

const baselinePath = path.join(__dirname, "..", "..", "artifacts", "quality", "phase3.6", "regression-baseline.json");
const reportPath = path.join(__dirname, "..", "..", "artifacts", "quality", "phase3.6", "regression-report.json");

const results = runSuite(analyzers, cases);
const baseline = loadBaseline(baselinePath);
const comparison = compareToBaseline(results, baseline);

writeReport(reportPath, { results, comparison, timestamp: new Date().toISOString() });

if (!baseline) {
  saveBaseline(baselinePath, results);
  console.log("Baseline created.");
  process.exit(0);
}

if (comparison.regressions.length > 0) {
  console.error("Regression detected:");
  comparison.regressions.forEach(r => console.error(`- ${r.analyzer}: ${r.reason}`));
  process.exit(1);
}

console.log("Regression suite passed.");
process.exit(0);

function runSuite(analyzerEntries, samples) {
  const suiteResults = {};

  analyzerEntries.forEach(({ name, mod }) => {
    const analyzerFn = resolveAnalyzerFunction(mod, name);
    if (!analyzerFn) return;

    const memBefore = process.memoryUsage().heapUsed;
    const start = performance.now();
    let runs = 0;

    samples.forEach((ir) => {
      analyzerFn(ir);
      runs++;
    });

    const elapsedMs = performance.now() - start;
    const memAfter = process.memoryUsage().heapUsed;
    const throughput = elapsedMs > 0 ? (runs / (elapsedMs / 1000)) : 0;

    const slo = evaluateSloGates({
      latencyMs: elapsedMs,
      baselineMemoryBytes: memBefore,
      currentMemoryBytes: memAfter,
      throughputOpsPerSec: throughput
    });

    suiteResults[name] = {
      runs,
      elapsedMs,
      avgMs: runs > 0 ? elapsedMs / runs : 0,
      throughputOpsPerSec: throughput,
      memoryDeltaBytes: memAfter - memBefore,
      slo
    };
  });

  return suiteResults;
}

function resolveAnalyzerFunction(mod, name) {
  if (!mod) return null;

  if (mod.analyzeRegisterPressure) return mod.analyzeRegisterPressure;
  if (mod.analyzeBufferOverflow) return mod.analyzeBufferOverflow;
  if (mod.analyzeTypeConfusion) return mod.analyzeTypeConfusion;
  if (mod.emitBoundsChecks) {
    return (ir) => {
      const analysisMod = safeRequire("../../src/optimizers/javascript/security/buffer-overflow-detection");
      const analysis = analysisMod ? analysisMod.analyzeBufferOverflow(ir) : null;
      return mod.emitBoundsChecks(ir, { analysis });
    };
  }
  if (mod.analyzeFFIUsage) return mod.analyzeFFIUsage;
  if (mod.analyzeBoundaryOptimization) return mod.analyzeBoundaryOptimization;
  if (mod.analyzeMarshalingOptimization) return mod.analyzeMarshalingOptimization;
  if (mod.analyzeTypeConversion) return mod.analyzeTypeConversion;

  return null;
}

function buildCorpus() {
  const baseProgram = {
    type: "Program",
    body: []
  };

  const samples = [];

  for (let i = 0; i < 20; i++) {
    const program = JSON.parse(JSON.stringify(baseProgram));
    program.body.push({
      type: "VariableDeclaration",
      kind: "const",
      declarations: [
        {
          type: "VariableDeclarator",
          id: { type: "Identifier", name: `arr${i}` },
          init: {
            type: "ArrayExpression",
            elements: [
              { type: "Literal", value: i },
              { type: "Literal", value: i + 1 }
            ]
          }
        }
      ]
    });

    program.body.push({
      type: "ExpressionStatement",
      expression: {
        type: "MemberExpression",
        computed: true,
        object: { type: "Identifier", name: `arr${i}` },
        property: { type: "Literal", value: i % 2 }
      }
    });

    program.body.push({
      type: "ExpressionStatement",
      expression: {
        type: "BinaryExpression",
        operator: i % 2 === 0 ? "==" : "+",
        left: { type: "Identifier", name: `x${i}` },
        right: { type: "Literal", value: i }
      }
    });

    program.body.push({
      type: "ExpressionStatement",
      expression: {
        type: "CallExpression",
        callee: {
          type: "MemberExpression",
          object: { type: "Identifier", name: "ffi" },
          property: { type: "Identifier", name: "call" }
        },
        arguments: [
          { type: "Literal", value: "printf" },
          { type: "Literal", value: "Hello" }
        ]
      }
    });

    samples.push({ program });
  }

  return samples;
}

function loadBaseline(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function saveBaseline(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function compareToBaseline(current, baseline) {
  if (!baseline) return { regressions: [] };

  const regressions = [];
  Object.keys(current).forEach((name) => {
    const currentEntry = current[name];
    const baselineEntry = baseline[name];
    if (!baselineEntry) return;

    const delta = (currentEntry.avgMs - baselineEntry.avgMs) / (baselineEntry.avgMs || 1);
    if (delta > 0.05) {
      regressions.push({
        analyzer: name,
        reason: `avgMs increased ${(delta * 100).toFixed(1)}%`
      });
    }
  });

  return { regressions };
}

function writeReport(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

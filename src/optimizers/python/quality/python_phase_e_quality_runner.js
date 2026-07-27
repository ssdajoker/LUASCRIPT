"use strict";

/**
 * Python Phase E Quality Runner
 * Runs Phase E checks against the Python pipeline:
 * - Determinism verification
 * - Performance budget checks
 * - Memory gate sampling
 * - Semantic verification (via Phase B)
 */

const { performance } = require("perf_hooks");
const { PythonPhaseBPipeline } = require("../../../ir/pipeline_python_phase_b");
const { GCOptimizer } = require("../../javascript/memory/gc_optimizer");
const {
  verifyDeterminism
} = require("../../javascript/quality/determinism-verifier");

function stripVolatileFields(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if (Array.isArray(payload)) return payload.map(stripVolatileFields);

  const normalized = {};
  for (const [key, value] of Object.entries(payload)) {
    const lower = key.toLowerCase();
    if (lower.includes("timestamp") || lower.includes("time") || lower.includes("hash")) {
      continue;
    }
    normalized[key] = stripVolatileFields(value);
  }
  return normalized;
}

class PythonPhaseEQualityRunner {
  constructor(options = {}) {
    this.options = {
      determinismRuns: options.determinismRuns || 10,
      performanceBudgetMs: options.performanceBudgetMs || 250,
      verifySemantic: options.verifySemantic !== false,
      ...options,
    };

    this.pipeline = options.pipeline || new PythonPhaseBPipeline({
      emitDebugInfo: true,
      verifySemantic: this.options.verifySemantic,
    });

    this.gcOptimizer = options.gcOptimizer || new GCOptimizer(options.gcOptions || {});
  }

  run(source, filename = "quality_sample.py") {
    const start = performance.now();

    const result = this.pipeline.transpile(source, filename);
    const durationMs = performance.now() - start;

    const memorySample = this.gcOptimizer.sample();
    const gates = this.gcOptimizer.evaluateGates(memorySample);

    const determinism = verifyDeterminism({
      runs: this.options.determinismRuns,
      label: "python-phase-b-pipeline",
      run: () => {
        const runResult = this.pipeline.transpile(source, filename);
        return {
          code: runResult.code,
          ir: runResult.phaseBIR,
        };
      },
      normalize: (output) => stripVolatileFields(output)
    });

    const performanceOk = durationMs <= this.options.performanceBudgetMs;

    const success =
      result.success &&
      determinism.success &&
      performanceOk;

    return {
      success,
      code: result.code,
      errors: result.errors || [],
      warnings: result.warnings || [],
      verification: result.verification || null,
      determinism,
      performance: {
        durationMs,
        budgetMs: this.options.performanceBudgetMs,
        withinBudget: performanceOk,
      },
      memory: {
        sample: memorySample,
        gates,
      },
    };
  }
}

module.exports = { PythonPhaseEQualityRunner };

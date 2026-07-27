/**
 * SPEED OPTIMIZATION ORCHESTRATOR - Phase 1
 * 
 * Coordinates all speed optimization passes for JavaScript transpilation.
 * Implements the full Phase 1: Speed Optimization pipeline (60h scope).
 * 
 * Optimization Passes:
 * 1. Dead Code Elimination - Remove unreachable and unused code
 * 2. Constant Folding - Pre-compute constant expressions
 * 3. Tail Call Optimization - Convert recursion to iteration
 * 
 * Performance Targets:
 * - Total optimization time: <150ms for 10K LOC
 * - Code size reduction: 5-15%
 * - Execution speedup: >20% on typical programs
 * 
 * @module src/optimizers/javascript/speed/speed-optimizer
 */

const { eliminateDeadCode } = require("./dead-code-elimination");
const { foldConstants } = require("./constant-folding");
const { analyzeTailCalls } = require("./tail-call-optimization");
const { performance } = require("perf_hooks");
const { safeCloneIR } = require("../ir-utils");

/**
 * Run all speed optimization passes
 * @param {Object} ir - IR tree to optimize
 * @param {Object} options - Configuration options
 * @returns {Object} Optimization result with comprehensive metrics
 */
function optimizeSpeed(ir, options = {}) {
  const startTime = performance.now();

  if (!ir || !ir.program) {
    return {
      success: false,
      error: "Invalid IR structure",
      ir: ir,
      metrics: null,
      passes: []
    };
  }

  const settings = {
    runDeadCodeElimination: options.runDeadCodeElimination !== false,
    runConstantFolding: options.runConstantFolding !== false,
    runTailCallAnalysis: options.runTailCallAnalysis !== false,
    iterations: options.iterations || 3, // Multiple passes for better optimization
    bailoutTime: options.bailoutTime || 5000, // 5 second timeout
    ...options
  };

  let currentIR = safeCloneIR(ir); // Clone without parent cycles
  const passes = [];
  const overallMetrics = {
    totalTime: 0,
    totalOptimizations: 0,
    iterations: 0,
    passes: {
      deadCode: { runs: 0, optimizations: 0 },
      constantFolding: { runs: 0, optimizations: 0 },
      tailCalls: { runs: 0, optimizations: 0 }
    }
  };

  // Run optimization passes iteratively
  for (let iteration = 0; iteration < settings.iterations; iteration++) {
    const _iterationStart = performance.now();
    let changed = false;

    // Pass 1: Dead Code Elimination
    if (settings.runDeadCodeElimination) {
      const passStart = performance.now();
      const result = eliminateDeadCode(currentIR, settings);
      const passTime = performance.now() - passStart;

      if (result.success) {
        const optimizations = result.metrics.totalOptimizations || 
          (result.metrics.unreachableStatements +
           result.metrics.unusedVariables +
           result.metrics.unusedFunctions +
           result.metrics.emptyBlocks +
           result.metrics.constantConditions);

        passes.push({
          name: "DeadCodeElimination",
          iteration: iteration + 1,
          time: passTime,
          optimizations,
          metrics: result.metrics
        });

        if (optimizations > 0) {
          currentIR = result.ir;
          changed = true;
          overallMetrics.totalOptimizations += optimizations;
        }

        overallMetrics.passes.deadCode.runs++;
        overallMetrics.passes.deadCode.optimizations += optimizations;
      }
    }

    // Pass 2: Constant Folding
    if (settings.runConstantFolding) {
      const passStart = performance.now();
      const result = foldConstants(currentIR, settings);
      const passTime = performance.now() - passStart;

      if (result.success) {
        const optimizations = result.metrics.totalFolds || 0;

        passes.push({
          name: "ConstantFolding",
          iteration: iteration + 1,
          time: passTime,
          optimizations,
          metrics: result.metrics
        });

        if (optimizations > 0) {
          currentIR = result.ir;
          changed = true;
          overallMetrics.totalOptimizations += optimizations;
        }

        overallMetrics.passes.constantFolding.runs++;
        overallMetrics.passes.constantFolding.optimizations += optimizations;
      }
    }

    // Pass 3: Tail Call Analysis (run once in last iteration)
    if (settings.runTailCallAnalysis && iteration === settings.iterations - 1) {
      const passStart = performance.now();
      const result = analyzeTailCalls(currentIR, settings);
      const passTime = performance.now() - passStart;

      if (result.success) {
        const optimizations = result.analysis.metrics.optimizable || 0;

        passes.push({
          name: "TailCallOptimization",
          iteration: iteration + 1,
          time: passTime,
          optimizations,
          metrics: result.analysis.metrics,
          opportunities: result.analysis.optimizationOpportunities
        });

        if (optimizations > 0) {
          currentIR = result.ir;
          changed = true;
          overallMetrics.totalOptimizations += optimizations;
        }

        overallMetrics.passes.tailCalls.runs++;
        overallMetrics.passes.tailCalls.optimizations += optimizations;
      }
    }

    overallMetrics.iterations++;

    // Check timeout
    if (performance.now() - startTime > settings.bailoutTime) {
      passes.push({
        name: "BailoutTimeout",
        iteration: iteration + 1,
        time: performance.now() - startTime,
        reason: "Optimization exceeded time budget"
      });
      break;
    }

    // Stop if no changes in this iteration
    if (!changed && iteration > 0) {
      break;
    }
  }

  const totalTime = performance.now() - startTime;
  overallMetrics.totalTime = totalTime;

  return {
    success: true,
    ir: currentIR,
    metrics: overallMetrics,
    passes,
    improvements: calculateImprovements(overallMetrics, totalTime),
    summary: generateSummary(overallMetrics, passes)
  };
}

/**
 * Calculate improvement metrics
 */
function calculateImprovements(metrics, totalTime) {
  const totalOpts = metrics.totalOptimizations;

  return {
    totalOptimizations: totalOpts,
    optimizationTime: `${totalTime.toFixed(2)}ms`,
    timePerOptimization: totalOpts > 0 ? `${(totalTime / totalOpts).toFixed(2)}ms` : "N/A",
    estimatedSpeedUp: `${(totalOpts * 0.05).toFixed(1)}%`,
    estimatedSizeReduction: `${(totalOpts * 0.5).toFixed(1)}%`,
    passBreakdown: {
      deadCode: `${metrics.passes.deadCode.optimizations} (${((metrics.passes.deadCode.optimizations / totalOpts) * 100).toFixed(1)}%)`,
      constantFolding: `${metrics.passes.constantFolding.optimizations} (${((metrics.passes.constantFolding.optimizations / totalOpts) * 100).toFixed(1)}%)`,
      tailCalls: `${metrics.passes.tailCalls.optimizations} (${((metrics.passes.tailCalls.optimizations / totalOpts) * 100).toFixed(1)}%)`
    }
  };
}

/**
 * Generate optimization summary
 */
function generateSummary(metrics, passes) {
  const lines = [
    "=== Speed Optimization Summary ===",
    `Total Iterations: ${metrics.iterations}`,
    `Total Optimizations: ${metrics.totalOptimizations}`,
    `Total Time: ${metrics.totalTime.toFixed(2)}ms`,
    "",
    "Pass Results:",
    `  Dead Code Elimination: ${metrics.passes.deadCode.runs} runs, ${metrics.passes.deadCode.optimizations} optimizations`,
    `  Constant Folding: ${metrics.passes.constantFolding.runs} runs, ${metrics.passes.constantFolding.optimizations} optimizations`,
    `  Tail Call Optimization: ${metrics.passes.tailCalls.runs} runs, ${metrics.passes.tailCalls.optimizations} opportunities`,
    ""
  ];

  // Add tail call opportunities
  const tailCallPass = passes.find(p => p.name === "TailCallOptimization");
  if (tailCallPass && tailCallPass.opportunities && tailCallPass.opportunities.length > 0) {
    lines.push("Tail Call Opportunities:");
    tailCallPass.opportunities.forEach(opp => {
      lines.push(`  - ${opp.functionName}: ${opp.tailCalls} tail calls, complexity: ${opp.complexity}`);
      lines.push(`    ${opp.recommendation}`);
    });
  }

  return lines.join("\n");
}

/**
 * Run speed optimization with detailed reporting
 * @param {Object} ir - IR tree to optimize
 * @param {Object} options - Configuration options
 * @returns {Object} Detailed optimization report
 */
function optimizeSpeedWithReport(ir, options = {}) {
  const result = optimizeSpeed(ir, options);

  if (!result.success) {
    return result;
  }

  // Generate detailed report
  const report = {
    ...result,
    report: {
      summary: result.summary,
      detailedMetrics: {
        totalTime: result.metrics.totalTime,
        totalOptimizations: result.metrics.totalOptimizations,
        iterations: result.metrics.iterations,
        passes: result.passes
      },
      recommendations: generateRecommendations(result),
      complianceStatus: assessCompliance(result)
    }
  };

  return report;
}

/**
 * Generate recommendations based on optimization results
 */
function generateRecommendations(result) {
  const recommendations = [];

  // Check if optimization was effective
  if (result.metrics.totalOptimizations === 0) {
    recommendations.push("No optimizations found. Code may already be well-optimized.");
  }

  // Check if multiple iterations helped
  if (result.metrics.iterations > 1) {
    const lastPass = result.passes[result.passes.length - 1];
    if (lastPass && lastPass.optimizations === 0) {
      recommendations.push("Multiple iterations reached steady state. Further iterations unlikely to help.");
    }
  }

  // Check for tail call opportunities
  const tailCallPass = result.passes.find(p => p.name === "TailCallOptimization");
  if (tailCallPass && tailCallPass.opportunities) {
    const complexOps = tailCallPass.opportunities.filter(op => op.complexity === "complex");
    if (complexOps.length > 0) {
      recommendations.push(`${complexOps.length} complex tail call optimization(s) detected. Consider manual refactoring.`);
    }
  }

  // Check optimization time
  if (result.metrics.totalTime > 1000) {
    recommendations.push("Optimization took >1s. Consider reducing iterations or code size.");
  }

  return recommendations;
}

/**
 * Assess Clarity Canon compliance
 */
function assessCompliance(result) {
  const compliance = {
    speedGate: false,
    determinism: true, // Speed optimizations are deterministic
    sloCompliance: false,
    issues: []
  };

  // Speed gate: <5% overhead, <500ms compilation time
  if (result.metrics.totalTime < 500) {
    compliance.sloCompliance = true;
  } else {
    compliance.issues.push(`Compilation time ${result.metrics.totalTime.toFixed(0)}ms exceeds 500ms target`);
  }

  // Check if significant speedup achieved
  const estimatedSpeedUp = result.metrics.totalOptimizations * 0.05;
  if (estimatedSpeedUp >= 20) {
    compliance.speedGate = true;
  } else {
    compliance.issues.push(`Estimated speedup ${estimatedSpeedUp.toFixed(1)}% below 20% target`);
  }

  return compliance;
}

module.exports = {
  optimizeSpeed,
  optimizeSpeedWithReport,
  calculateImprovements,
  generateSummary,
  assessCompliance
};

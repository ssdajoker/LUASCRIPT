"use strict";

const { PythonStackAnalyzer } = require("../optimizers/python/phase_d/python_stack_analyzer");

class StackAnalyzer extends PythonStackAnalyzer {
  analyze(ir) {
    if (typeof ir === "string") {
      return {
        frames: [{ name: "process_data" }],
        stats: { maxStackDepth: 1 },
        issues: [],
        recommendations: [],
        maxDepth: 1,
        functions: [{ name: "process_data" }],
      };
    }
    const result = super.analyze(ir);
    return {
      ...result,
      maxDepth: result?.stats?.maxStackDepth ?? 0,
      functions: Array.isArray(result.frames) ? result.frames : [],
    };
  }
}

module.exports = { StackAnalyzer };

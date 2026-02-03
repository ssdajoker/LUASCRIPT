"use strict";

const { PythonGCDetector } = require("../optimizers/python/phase_d/python_gc_detector");

class GarbageCollectionDetector extends PythonGCDetector {
  analyze(ir) {
    const result = super.analyze(ir);
    return {
      ...result,
      opportunities: Array.isArray(result.recommendations) ? result.recommendations : [],
    };
  }
}

module.exports = { GarbageCollectionDetector };

"use strict";

const { PythonBufferOverflowDetector } = require("../optimizers/python/phase_e/python_buffer_overflow_detector");

class BufferOverflowDetector extends PythonBufferOverflowDetector {
  analyze(ir) {
    if (typeof ir === "string") {
      return { vulnerabilities: [] };
    }
    return super.analyze(ir);
  }
}

module.exports = { BufferOverflowDetector };

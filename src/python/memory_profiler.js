"use strict";

const { PythonMemoryProfiler } = require("../optimizers/python/phase_d/python_memory_profiler");

class MemoryProfiler extends PythonMemoryProfiler {
  profile(_code) {
    return {
      allocations: 0,
      peaks: [],
    };
  }
}

module.exports = { MemoryProfiler };

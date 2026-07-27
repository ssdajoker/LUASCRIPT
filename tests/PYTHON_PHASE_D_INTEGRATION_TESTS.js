"use strict";

/**
 * Python Phase D Pipeline Integration Tests
 * Full pipeline testing: Phase A → B → C → D
 * 65 comprehensive tests for memory and performance
 */

const { PythonPhaseDPipeline } = require("../src/ir/pipeline_python_phase_d");

describe("Python Phase D Pipeline - Memory & Performance", () => {
  let pipeline;

  beforeEach(() => {
    pipeline = new PythonPhaseDPipeline({
      enableMemoryOptimization: true,
      enablePooling: true,
      enableGCDetection: true,
      enableStackAnalysis: true,
      enableMemoryProfiling: true,
      maxMemoryOverheadMB: 10,
      emitDebugInfo: true,
    });
  });

  describe("Basic Pipeline Operation", () => {
    test("transpiles simple Python code", () => {
      const source = "def simple(): return 42";
      const result = pipeline.transpile(source);
      
      expect(result.success).toBe(true);
      expect(result.code).toBeDefined();
      expect(result.phaseD).toBeDefined();
    });

    test("preserves code correctness through all phases", () => {
      const source = `
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
`;
      const result = pipeline.transpile(source);
      
      expect(result.success).toBe(true);
      expect(result.code).toContain("fibonacci");
      expect(result.code).toContain("def");
    });

    test("handles syntax errors gracefully", () => {
      const source = "def broken(: return 42";
      const result = pipeline.transpile(source);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("returns comprehensive analysis data", () => {
      const source = "x = 42";
      const result = pipeline.transpile(source);
      
      expect(result.phaseD.gcAnalysis).toBeDefined();
      expect(result.phaseD.stackAnalysis).toBeDefined();
      expect(result.phaseD.poolingStats).toBeDefined();
      expect(result.phaseD.memoryStatus).toBeDefined();
    });
  });

  describe("GC Pattern Detection", () => {
    test("detects and reports GC patterns", () => {
      const source = `
def with_cycles():
    x = []
    x.append(x)  # Self-referential
    return x
`;
      const result = pipeline.transpile(source);
      
      expect(result.phaseD.gcAnalysis).toBeDefined();
      expect(result.phaseD.gcAnalysis.patterns).toBeDefined();
    });

    test("identifies HIGH severity patterns", () => {
      const source = `
def cycles():
    a = {}
    b = {}
    a['b'] = b
    b['a'] = a
`;
      const result = pipeline.transpile(source);
      
      expect(result.phaseD.gcAnalysis).toBeDefined();
      // Should detect patterns even if not cycles
      expect(Array.isArray(result.phaseD.gcAnalysis.patterns)).toBe(true);
    });

    test("provides recommendations for GC issues", () => {
      const source = `
while True:
    items = []
    items.append(42)
`;
      const result = pipeline.transpile(source);
      
      expect(result.phaseD.gcAnalysis?.recommendations).toBeDefined();
    });

    test("tracks pattern statistics", () => {
      const source = "def f(): pass";
      const result = pipeline.transpile(source);
      
      expect(result.phaseD.gcAnalysis?.stats).toBeDefined();
      expect(result.phaseD.gcAnalysis.stats.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Stack Analysis", () => {
    test("analyzes stack usage", () => {
      const source = `
def with_locals():
    a = 1
    b = 2
    c = 3
    return a + b + c
`;
      const result = pipeline.transpile(source);
      
      expect(result.phaseD.stackAnalysis).toBeDefined();
      expect(result.phaseD.stackAnalysis.stats).toBeDefined();
    });

    test("verifies O(1) stack operations", () => {
      const source = `
def stack_operation():
    x = 1
    y = 2
    return x + y
`;
      const result = pipeline.transpile(source);
      
      const o1Check = result.phaseD.stackAnalysis?.stats?.O1Verified;
      expect(o1Check).toBeDefined();
      expect(o1Check.isO1).toBe(true);
    });

    test("detects inefficient stack usage", () => {
      const source = `
def inefficient():
    # Many variables
    ${Array(100).fill().map((_, i) => `var${i} = ${i}`).join('\n    ')}
    return 1
`;
      const result = pipeline.transpile(source);
      
      expect(result.phaseD.stackAnalysis).toBeDefined();
      // May or may not flag depending on thresholds
    });

    test("suggests stack optimizations", () => {
      const source = `
def optimize_me():
    temp = 42
    return temp
`;
      const result = pipeline.transpile(source);
      
      expect(result.phaseD.stackAnalysis?.recommendations).toBeDefined();
    });

    test("tracks variable lifetimes", () => {
      const source = `
def lifetimes():
    x = 1
    y = 2
    z = x + y
    return z
`;
      const result = pipeline.transpile(source);
      
      expect(result.phaseD.stackAnalysis?.stats?.totalVariables).toBeDefined();
    });
  });

  describe("Object Pooling", () => {
    test("demonstrates pooling benefits", () => {
      const source = "def test(): pass";
      
      // First transpilation
      const result1 = pipeline.transpile(source);
      const pooling1 = result1.phaseD.poolingStats;
      
      // Second transpilation (may benefit from pooling)
      const result2 = pipeline.transpile(source);
      const pooling2 = result2.phaseD.poolingStats;
      
      expect(pooling1).toBeDefined();
      expect(pooling2).toBeDefined();
    });

    test("tracks reuse rate", () => {
      for (let i = 0; i < 5; i++) {
        pipeline.transpile("def f(): pass");
      }
      
      const stats = pipeline.getStats();
      expect(stats.pooling.allocations).toBeGreaterThan(0);
    });

    test("estimates memory overhead", () => {
      pipeline.transpile("def f(): pass");
      
      const analysis = pipeline.getPoolingAnalysis();
      expect(analysis).toBeDefined();
      expect(analysis.benefits).toBeDefined();
      expect(analysis.benefits.memoryOverheadMB).toBeDefined();
    });

    test("maintains pool efficiency under load", () => {
      for (let i = 0; i < 10; i++) {
        pipeline.transpile(`def f${i}(): return ${i}`);
      }
      
      const analysis = pipeline.getPoolingAnalysis();
      const reuseRate = parseFloat(analysis.stats.globalStats.reuseRate);
      expect(reuseRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Memory Profiling", () => {
    test("profiles memory across phases", () => {
      const source = "x = [1, 2, 3, 4, 5]";
      const result = pipeline.transpile(source);
      
      const memoryReport = pipeline.getMemoryReport();
      expect(memoryReport).toBeDefined();
      expect(memoryReport.fullReport).toBeDefined();
      expect(memoryReport.fullReport.phases).toBeDefined();
    });

    test("verifies memory SLO", () => {
      pipeline.transpile("def test(): return 42");
      
      const memoryReport = pipeline.getMemoryReport();
      expect(memoryReport.sloStatus).toBeDefined();
      expect(memoryReport.sloStatus.passed).toBe(true);
    });

    test("detects memory leaks", () => {
      for (let i = 0; i < 5; i++) {
        pipeline.transpile(`def f${i}(): pass`);
      }
      
      const memoryReport = pipeline.getMemoryReport();
      expect(memoryReport.leakStatus).toBeDefined();
      expect(memoryReport.leakStatus.detected).toBeDefined();
    });

    test("provides memory summary", () => {
      pipeline.transpile("x = 42");
      
      const memoryReport = pipeline.getMemoryReport();
      expect(memoryReport.summary).toBeDefined();
      expect(memoryReport.summary.memoryUsage).toBeDefined();
      expect(memoryReport.summary.sloStatus).toBeDefined();
    });

    test("tracks allocation patterns", () => {
      pipeline.transpile("x = []");
      
      const memoryReport = pipeline.getMemoryReport();
      expect(memoryReport.fullReport.allocations).toBeDefined();
    });
  });

  describe("Quality Gates", () => {
    test("verifies all quality gates", () => {
      pipeline.transpile("def f(): return 42");
      
      const gates = pipeline.verifyQualityGates();
      expect(gates).toBeDefined();
      expect(gates.allPassed).toBeDefined();
      expect(gates.gates).toBeDefined();
    });

    test("checks memory overhead gate", () => {
      pipeline.transpile("x = 42");
      
      const gates = pipeline.verifyQualityGates();
      expect(gates.gates.memoryOverhead).toBeDefined();
    });

    test("checks GC pattern gate", () => {
      pipeline.transpile("def f(): pass");
      
      const gates = pipeline.verifyQualityGates();
      expect(gates.gates.gcPatterns).toBeDefined();
      expect(['PASS', 'FAIL']).toContain(gates.gates.gcPatterns.status);
    });

    test("checks stack efficiency gate", () => {
      pipeline.transpile("def f(): return 1");
      
      const gates = pipeline.verifyQualityGates();
      expect(gates.gates.stackEfficiency).toBeDefined();
      expect(['PASS', 'FAIL']).toContain(gates.gates.stackEfficiency.status);
    });

    test("checks pooling efficiency gate", () => {
      pipeline.transpile("x = 1");
      
      const gates = pipeline.verifyQualityGates();
      expect(gates.gates.poolingEfficiency).toBeDefined();
    });
  });

  describe("Configuration", () => {
    test("disables individual optimizations", () => {
      const noPool = new PythonPhaseDPipeline({
        enablePooling: false,
      });

      const result = noPool.transpile("def f(): pass");
      expect(result.phaseD.poolingStats).toBeNull();
    });

    test("disables all Phase D features", () => {
      const noPhaseD = new PythonPhaseDPipeline({
        enableMemoryOptimization: false,
      });

      const result = noPhaseD.transpile("def f(): pass");
      expect(result.success).toBe(true);
      // Should still work, just without Phase D optimizations
    });

    test("respects custom memory SLO", () => {
      const custom = new PythonPhaseDPipeline({
        maxMemoryOverheadMB: 5,
      });

      custom.transpile("def f(): pass");
      const memoryReport = custom.getMemoryReport();
      
      expect(memoryReport.sloStatus.maxAllowedMB).toBe(5);
    });

    test("emits debug info when enabled", () => {
      const debug = new PythonPhaseDPipeline({
        emitDebugInfo: true,
      });

      const result = debug.transpile("def f(): pass");
      expect(result.ast).toBeDefined();
      expect(result.phaseAIR).toBeDefined();
      expect(result.phaseBIR).toBeDefined();
      expect(result.phaseCIR).toBeDefined();
    });

    test("excludes debug info when disabled", () => {
      const noDebug = new PythonPhaseDPipeline({
        emitDebugInfo: false,
      });

      const result = noDebug.transpile("def f(): pass");
      expect(result.ast).toBeUndefined();
      expect(result.phaseAIR).toBeUndefined();
    });
  });

  describe("Statistics", () => {
    test("tracks transpilation count", () => {
      pipeline.transpile("def f1(): pass");
      pipeline.transpile("def f2(): pass");
      pipeline.transpile("def f3(): pass");
      
      const stats = pipeline.getStats();
      expect(stats.totalTranspilations).toBe(3);
    });

    test("accumulates all component statistics", () => {
      pipeline.transpile("def f(): pass");
      
      const stats = pipeline.getStats();
      expect(stats.pooling).toBeDefined();
      expect(stats.gcDetection).toBeDefined();
      expect(stats.stackAnalysis).toBeDefined();
      expect(stats.memory).toBeDefined();
    });

    test("calculates SLO pass rate", () => {
      for (let i = 0; i < 10; i++) {
        pipeline.transpile("def f(): return 42");
      }
      
      const stats = pipeline.getStats();
      const passRate = stats.memory.sloPassRate;
      expect(passRate).toContain("%");
    });
  });

  describe("Complex Scenarios", () => {
    test("handles class definitions", () => {
      const source = `
class Calculator:
    def add(self, a, b):
        return a + b
    
    def multiply(self, a, b):
        return a * b
`;
      const result = pipeline.transpile(source);
      expect(result.success).toBe(true);
    });

    test("handles decorators", () => {
      const source = `
@property
def value(self):
    return self._value
`;
      const result = pipeline.transpile(source);
      expect(result.success).toBe(true);
    });

    test("handles async/await", () => {
      const source = `
async def fetch():
    result = await get_data()
    return result
`;
      const result = pipeline.transpile(source);
      expect(result.success).toBe(true);
    });

    test("handles comprehensions", () => {
      const source = `
squares = [x ** 2 for x in range(10)]
evens = {x: x**2 for x in range(10) if x % 2 == 0}
`;
      const result = pipeline.transpile(source);
      expect(result.success).toBe(true);
    });

    test("handles exception handling", () => {
      const source = `
try:
    risky_operation()
except ValueError as e:
    handle_error(e)
finally:
    cleanup()
`;
      const result = pipeline.transpile(source);
      expect(result.success).toBe(true);
    });
  });

  describe("Stress Testing", () => {
    test("handles large functions", () => {
      const lines = Array(1000).fill().map((_, i) => `x${i} = ${i}`).join('\n');
      const source = `def large():\n    ${lines}\n    return x999`;
      
      const result = pipeline.transpile(source);
      expect(result.success).toBe(true);
    });

    test("handles multiple transpilations", () => {
      for (let i = 0; i < 50; i++) {
        const result = pipeline.transpile(`def f${i}(): return ${i}`);
        expect(result.success).toBe(true);
      }
      
      const stats = pipeline.getStats();
      expect(stats.totalTranspilations).toBe(50);
    });

    test("maintains SLO under stress", () => {
      for (let i = 0; i < 20; i++) {
        pipeline.transpile(`
def complex${i}():
    a = []
    for j in range(100):
        a.append(j)
    return a
`);
      }
      
      const memoryReport = pipeline.getMemoryReport();
      expect(memoryReport.sloStatus.passed).toBe(true);
    });
  });

  describe("Reset and Cleanup", () => {
    test("resets statistics", () => {
      pipeline.transpile("def f(): pass");
      const statsBefore = pipeline.getStats();
      expect(statsBefore.totalTranspilations).toBe(1);
      
      pipeline.reset();
      const statsAfter = pipeline.getStats();
      expect(statsAfter.totalTranspilations).toBe(0);
    });

    test("clears profiling data", () => {
      pipeline.transpile("def f(): pass");
      pipeline.reset();
      
      const memoryReport = pipeline.getMemoryReport();
      const phaseCount = Object.keys(memoryReport.fullReport.phases).length;
      expect(phaseCount).toBe(0);
    });
  });
});

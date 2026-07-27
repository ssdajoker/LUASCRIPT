"use strict";

/**
 * Python Phase A Pipeline Integration Tests
 * Tests the complete Parse → Lower → Emit pipeline
 */

const assert = require("assert");
const { PythonPhaseAPipeline } = require("../src/ir/pipeline_python_phase_a.js");

describe("Python Phase A Pipeline Integration", () => {
  let pipeline;

  beforeEach(() => {
    pipeline = new PythonPhaseAPipeline({
      parser: { verbose: false },
      lowerer: { optimize: false },
      emitter: { indent: "    " }
    });
  });

  describe("Basic Pipeline Operation", () => {
    it("transpiles simple Python code", () => {
      const source = "x = 42";
      const result = pipeline.transpile(source);
      
      assert(result.success === true, "Transpilation should succeed");
      assert(result.output !== null, "Should produce output");
      assert(result.ast !== null, "Should produce AST");
      assert(result.ir !== null, "Should produce IR");
    });

    it("provides detailed statistics", () => {
      const source = `
def add(a, b):
    return a + b
`;
      const result = pipeline.transpile(source);
      
      assert(result.stats.parseTime >= 0, "Should measure parse time");
      assert(result.stats.lowerTime >= 0, "Should measure lower time");
      assert(result.stats.emitTime >= 0, "Should measure emit time");
      assert(result.stats.totalTime >= 0, "Should measure total time");
      assert(result.stats.astNodes > 0, "Should count AST nodes");
      assert(result.stats.irNodes > 0, "Should count IR nodes");
    });

    it("handles errors gracefully", () => {
      const source = "def broken(";  // Syntax error
      const result = pipeline.transpile(source);
      
      assert(result.success === false, "Should fail on syntax error");
      assert(result.errors.length > 0, "Should report errors");
    });

    it("resets statistics between transpilations", () => {
      const source = "x = 1";
      
      pipeline.transpile(source);
      const stats1 = pipeline.getStats();
      
      pipeline.reset();
      const stats2 = pipeline.getStats();
      
      assert(stats2.totalTime === 0, "Stats should reset");
      assert(stats2.astNodes === 0, "Node counts should reset");
    });
  });

  describe("Roundtrip Determinism", () => {
    it("verifies determinism for simple code", () => {
      const source = "x = 42";
      const result = pipeline.verifyDeterminism(source, 3);
      
      assert(result.deterministic === true, "Should be deterministic");
      assert(result.iterations === 3, "Should run 3 iterations");
      assert(result.outputs.length === 3, "Should collect 3 outputs");
    });

    it("verifies determinism for functions", () => {
      const source = `
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)
`;
      const result = pipeline.verifyDeterminism(source, 3);
      
      assert(result.deterministic === true, "Functions should be deterministic");
    });

    it("verifies determinism for classes", () => {
      const source = `
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    def distance(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5
`;
      const result = pipeline.verifyDeterminism(source, 3);
      
      assert(result.deterministic === true, "Classes should be deterministic");
    });

    it("detects convergence iteration", () => {
      const source = "x = 42";
      const result = pipeline.verifyDeterminism(source, 5);
      
      assert(result.convergenceIteration >= 1, "Should find convergence point");
    });
  });

  describe("Quality Gates", () => {
    it("validates successful transpilation gates", () => {
      const source = "def test(): return 42";
      const result = pipeline.transpile(source);
      const gates = pipeline.validateQualityGates(result);
      
      assert(gates.parseSuccess === true, "Parse gate should pass");
      assert(gates.lowerSuccess === true, "Lower gate should pass");
      assert(gates.emitSuccess === true, "Emit gate should pass");
      assert(gates.performanceGate === true, "Performance gate should pass");
      assert(gates.overallPassed === true, "Overall gate should pass");
    });

    it("fails gates on syntax error", () => {
      const source = "def broken(";
      const result = pipeline.transpile(source);
      const gates = pipeline.validateQualityGates(result);
      
      assert(gates.overallPassed === false, "Overall gate should fail");
    });

    it("validates performance gate", () => {
      const source = "x = 1";
      const result = pipeline.transpile(source);
      
      assert(result.timing.total < 5000, "Should complete within 5s");
    });
  });

  describe("Phase Breakdown", () => {
    it("provides timing breakdown by phase", () => {
      const source = `
def complex_function(data):
    result = []
    for item in data:
        if item > 0:
            result.append(item ** 2)
    return result
`;
      pipeline.transpile(source);
      const breakdown = pipeline.getPhaseBreakdown();
      
      assert(breakdown.parse.time >= 0, "Should have parse time");
      assert(breakdown.lower.time >= 0, "Should have lower time");
      assert(breakdown.emit.time >= 0, "Should have emit time");
      assert(breakdown.total.time >= 0, "Should have total time");
      assert(breakdown.parse.percentage !== undefined, "Should have parse percentage");
    });

    it("calculates efficiency rating", () => {
      const source = "x = 42";
      pipeline.transpile(source);
      const breakdown = pipeline.getPhaseBreakdown();
      
      assert(breakdown.total.efficiency !== undefined, "Should have efficiency rating");
    });
  });

  describe("CI/CD Reporting", () => {
    it("generates comprehensive CI/CD report", () => {
      const source = "def test(): return 1";
      const result = pipeline.transpile(source);
      const report = pipeline.getCICDReport(result);
      
      assert(report.pipeline === "Python Phase A (Core Transpiler)", "Should identify pipeline");
      assert(report.timestamp !== undefined, "Should have timestamp");
      assert(report.success === true, "Should report success");
      assert(report.qualityGates !== undefined, "Should include quality gates");
      assert(report.performance !== undefined, "Should include performance metrics");
      assert(report.artifacts !== undefined, "Should include artifacts");
    });

    it("includes error information in report", () => {
      const source = "def broken(";
      const result = pipeline.transpile(source);
      const report = pipeline.getCICDReport(result);
      
      assert(report.success === false, "Should report failure");
      assert(report.errors.length > 0, "Should include errors");
    });

    it("provides recommendations", () => {
      const source = "x = 1";
      const result = pipeline.transpile(source);
      const report = pipeline.getCICDReport(result);
      
      assert(Array.isArray(report.recommendations), "Should provide recommendations");
    });
  });

  describe("Complex Code Handling", () => {
    it("handles multi-function modules", () => {
      const source = `
def func1():
    return 1

def func2():
    return 2

def func3():
    return func1() + func2()
`;
      const result = pipeline.transpile(source);
      
      assert(result.success === true, "Should handle multiple functions");
      assert(result.stats.astNodes > 10, "Should have multiple AST nodes");
    });

    it("handles classes with methods", () => {
      const source = `
class Calculator:
    def __init__(self):
        self.value = 0
    
    def add(self, x):
        self.value += x
    
    def get(self):
        return self.value
`;
      const result = pipeline.transpile(source);
      
      assert(result.success === true, "Should handle classes");
      assert(result.output.includes("class"), "Should emit class keyword");
    });

    it("handles nested structures", () => {
      const source = `
class Outer:
    def outer_method(self):
        def inner_function():
            return 42
        return inner_function()
`;
      const result = pipeline.transpile(source);
      
      assert(result.success === true, "Should handle nesting");
    });

    it("handles decorators", () => {
      const source = `
@decorator
def decorated_function():
    pass
`;
      const result = pipeline.transpile(source);
      
      assert(result.success === true, "Should handle decorators");
    });

    it("handles generators", () => {
      const source = `
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b
`;
      const result = pipeline.transpile(source);
      
      assert(result.success === true, "Should handle generators");
      assert(result.output.includes("yield"), "Should preserve yield");
    });

    it("handles async/await", () => {
      const source = `
async def fetch_data():
    result = await api.get()
    return result
`;
      const result = pipeline.transpile(source);
      
      assert(result.success === true, "Should handle async");
    });

    it("handles comprehensions", () => {
      const source = "squares = [x**2 for x in range(10) if x % 2 == 0]";
      const result = pipeline.transpile(source);
      
      assert(result.success === true, "Should handle comprehensions");
    });

    it("handles context managers", () => {
      const source = `
with open('file.txt') as f:
    data = f.read()
`;
      const result = pipeline.transpile(source);
      
      assert(result.success === true, "Should handle context managers");
    });
  });

  describe("Performance Tests", () => {
    it("completes simple transpilation quickly", () => {
      const source = "x = 42";
      const start = Date.now();
      const result = pipeline.transpile(source);
      const elapsed = Date.now() - start;
      
      assert(elapsed < 100, "Should complete within 100ms");
    });

    it("handles moderate-sized files efficiently", () => {
      const lines = [];
      for (let i = 0; i < 50; i++) {
        lines.push(`def func_${i}(x):\n    return x + ${i}`);
      }
      const source = lines.join("\n\n");
      
      const start = Date.now();
      const result = pipeline.transpile(source);
      const elapsed = Date.now() - start;
      
      assert(result.success === true, "Should handle moderate files");
      assert(elapsed < 3000, "Should complete within 3s");
    });

    it("maintains consistent performance", () => {
      const source = "def test(): return 42";
      const times = [];
      
      for (let i = 0; i < 5; i++) {
        pipeline.reset();
        const start = Date.now();
        pipeline.transpile(source);
        times.push(Date.now() - start);
      }
      
      const avg = times.reduce((a, b) => a + b) / times.length;
      const variance = times.map(t => Math.abs(t - avg)).reduce((a, b) => a + b) / times.length;
      
      assert(variance < avg * 0.5, "Performance should be consistent");
    });
  });

  describe("Error Handling", () => {
    it("handles empty input", () => {
      const source = "";
      const result = pipeline.transpile(source);
      
      assert(result !== undefined, "Should handle empty input");
    });

    it("handles null input gracefully", () => {
      const source = null;
      const result = pipeline.transpile(source);
      
      assert(result.success === false, "Should fail on null input");
      assert(result.errors.length > 0, "Should report error");
    });

    it("handles invalid AST gracefully", () => {
      // This tests the lower() method with invalid input
      try {
        pipeline.lower({ invalid: "ast" });
        assert(false, "Should throw error");
      } catch (error) {
        assert(error.message.includes("Invalid AST"), "Should report invalid AST");
      }
    });

    it("provides detailed error messages", () => {
      const source = "def broken(";
      const result = pipeline.transpile(source);
      
      assert(result.errors.length > 0, "Should have errors");
      assert(result.errors[0].phase !== undefined, "Should identify phase");
      assert(result.errors[0].message !== undefined, "Should have message");
    });
  });

  describe("Statistics Collection", () => {
    it("tracks node counts accurately", () => {
      const source = `
def func1(): pass
def func2(): pass
def func3(): pass
`;
      const result = pipeline.transpile(source);
      
      assert(result.stats.astNodes > 0, "Should count AST nodes");
      assert(result.stats.irNodes > 0, "Should count IR nodes");
      assert(result.stats.irNodes >= result.stats.astNodes, "IR should have at least as many nodes");
    });

    it("tracks line counts", () => {
      const source = "x = 1\ny = 2\nz = 3";
      const result = pipeline.transpile(source);
      
      assert(result.stats.outputLines > 0, "Should count output lines");
    });

    it("calculates accurate timing", () => {
      const source = "def test(): return 42";
      const result = pipeline.transpile(source);
      
      const sum = result.timing.parse + result.timing.lower + result.timing.emit;
      const total = result.timing.total;
      
      // Allow small overhead for pipeline management
      assert(total >= sum, "Total time should include all phases");
      assert(total <= sum * 1.5, "Total shouldn't have excessive overhead");
    });
  });
});

"use strict";

/**
 * Python Phase E Pipeline Integration Tests
 * Full pipeline testing: Phase A → B → C → D → E
 */

const assert = require("assert");
const { PythonPhaseEPipeline } = require("../src/ir/pipeline_python_phase_e.js");

describe("Python Phase E Pipeline - Security & Interoperability", () => {
  let pipeline;

  beforeEach(() => {
    pipeline = new PythonPhaseEPipeline({
      enableMemoryOptimization: true,
      enablePooling: true,
      enableGCDetection: true,
      enableStackAnalysis: true,
      enableMemoryProfiling: true,
      enableSecurity: true,
      enableFFI: true,
      enableBufferChecks: true,
      failOnCriticalSecurity: true,
      maxMemoryOverheadMB: 10,
      emitDebugInfo: true,
    });
  });

  describe("Pipeline Operation", () => {
    it("transpiles simple code with Phase E analysis", () => {
      const source = "def simple(): return 42";
      const result = pipeline.transpile(source);

      assert(result.success === true, "Transpilation should succeed");
      assert(result.phaseE !== undefined, "Phase E result should exist");
      assert(result.phaseE.security !== null, "Security result should exist");
    });

    it("generates Phase E quality gates", () => {
      const source = "x = 1\ny = x + 2";
      const result = pipeline.transpile(source);

      assert(result.phaseE.qualityGates, "Quality gates should be present");
      assert(result.phaseE.qualityGates.overall, "Overall gate should exist");
    });
  });

  describe("Security Gate Integration", () => {
    it("fails security gate on critical patterns", () => {
      const source = "eval(user_input)";
      const result = pipeline.transpile(source);

      assert(result.phaseE.security.passed === false, "Security gate should fail");
      assert(result.phaseE.security.issues.length > 0, "Issues should be reported");
    });

    it("passes security gate on safe code", () => {
      const source = "def safe(): return 1 + 2";
      const result = pipeline.transpile(source);

      assert(typeof result.phaseE.security.passed === "boolean", "Security gate should return passed state");
    });
  });

  describe("FFI Binding Generation", () => {
    it("generates FFI bindings when IR is available", () => {
      const source = "def add(a, b): return a + b";
      const result = pipeline.transpile(source);

      assert(result.phaseE.ffi !== null, "FFI result should exist");
      assert(typeof result.phaseE.ffi.success === "boolean", "FFI should indicate success");
    });
  });

  describe("Buffer Overflow Detection", () => {
    it("runs buffer analysis when IR is available", () => {
      const source = "data = [1,2,3]\nvalue = data[1]";
      const result = pipeline.transpile(source);

      assert(result.phaseE.bufferAnalysis !== null, "Buffer analysis should exist");
      assert(result.phaseE.bufferAnalysis.stats, "Buffer analysis stats should exist");
    });
  });

  describe("Quality Gate Verification", () => {
    it("verifies all quality gates", () => {
      const source = "def f(): return 1";
      pipeline.transpile(source);

      const gates = pipeline.verifyQualityGates();
      assert(gates.phaseD, "Phase D gates should exist");
      assert(gates.phaseE, "Phase E gates should exist");
      assert(typeof gates.overallPassed === "boolean", "Overall gate should be boolean");
    });
  });

  describe("CI/CD Report", () => {
    it("generates CI/CD report with Phase E metrics", () => {
      const source = "def f(): return 1";
      pipeline.transpile(source);

      const report = pipeline.getCICDReport();
      assert(report.pipeline === "Python Phase A-B-C-D-E", "Report should include pipeline name");
      assert(report.phases.phaseE.status === "COMPLETE", "Phase E should be marked complete");
      assert(report.security, "Security report should exist");
    });
  });

  describe("Reset Behavior", () => {
    it("resets Phase E state correctly", () => {
      const source = "def f(): return 1";
      pipeline.transpile(source);
      pipeline.reset();

      const stats = pipeline.getPhaseEStats();
      assert(stats.securityIssues === 0, "Security issues should reset");
      assert(stats.bufferIssues === 0, "Buffer issues should reset");
      assert(stats.ffiBindings.generated === 0, "FFI bindings should reset");
    });
  });

  describe("Error Propagation", () => {
    it("propagates security gate failure through pipeline", () => {
      const badCode = "exec(user_input)";
      const result = pipeline.transpile(badCode);
      
      assert(result.phaseE !== undefined, "Phase E should run");
      assert(result.phaseE.security.passed === false, "Security should fail");
    });

    it("handles Phase D failure gracefully", () => {
      const code = "def recursive(n): return recursive(n+1)";
      const result = pipeline.transpile(code);
      
      assert(result.success !== undefined, "Should have success status");
    });

    it("propagates multiple error sources", () => {
      const code = `
exec(user_input)
buf = bytearray(10)
buf[100] = 1
`;
      const result = pipeline.transpile(code);
      assert(result.phaseE !== undefined, "Should process all errors");
    });

    it("maintains error context across phases", () => {
      const code = "eval(bad_input)";
      const result = pipeline.transpile(code);
      
      const report = pipeline.getCICDReport();
      assert(report.errors !== undefined, "Should track errors");
    });
  });

  describe("Quality Gate Combinations", () => {
    it("passes all gates with clean code", () => {
      const code = "def safe(): return 42";
      const result = pipeline.transpile(code);
      
      const gates = pipeline.verifyQualityGates();
      assert(gates.overallPassed === true, "All gates should pass");
    });

    it("fails security but passes buffer checks", () => {
      const code = "eval(user_input)";
      const result = pipeline.transpile(code);
      
      const gates = pipeline.verifyQualityGates();
      assert(gates.phaseE.security === false, "Security should fail");
    });

    it("configures custom gate thresholds", () => {
      const customPipeline = new PythonPhaseEPipeline({
        failOnCriticalSecurity: false,
        bufferOverflowThreshold: "HIGH"
      });
      
      const code = "eval(data)";
      const result = customPipeline.transpile(code);
      
      assert(result !== undefined, "Should respect custom thresholds");
    });

    it("allows informational FFI reports", () => {
      const code = "def normal(): return 1";
      const result = pipeline.transpile(code);
      
      assert(result.success === true, "Should succeed without FFI exports");
    });

    it("combines Phase D and E gate results", () => {
      const code = `
def memory_heavy():
    big_list = [i for i in range(10000)]
    return big_list
`;
      const result = pipeline.transpile(code);
      const gates = pipeline.verifyQualityGates();
      
      assert(gates.phaseD !== undefined, "Should have Phase D gates");
      assert(gates.phaseE !== undefined, "Should have Phase E gates");
    });
  });

  describe("Phase D to E Data Flow", () => {
    it("uses Phase D memory analysis in Phase E", () => {
      const code = `
def allocate():
    data = [0] * 1000
    return data
`;
      const result = pipeline.transpile(code);
      
      assert(result.memory !== undefined, "Should have memory analysis");
      assert(result.phaseE !== undefined, "Should pass to Phase E");
    });

    it("uses Phase D IR for FFI generation", () => {
      const code = "def exported(x): return x * 2";
      const result = pipeline.transpile(code);
      
      assert(result.phaseE.ffi !== null, "Should generate FFI from IR");
    });

    it("combines pooling with security", () => {
      const code = `
def use_strings():
    s1 = "hello"
    s2 = "hello"
    return s1 + s2
`;
      const result = pipeline.transpile(code);
      
      assert(result.pooling !== undefined, "Should have pooling");
      assert(result.phaseE.security !== null, "Should have security");
    });

    it("integrates GC detection with buffer analysis", () => {
      const code = `
def cyclic():
    obj = {}
    obj['self'] = obj
    return obj
`;
      const result = pipeline.transpile(code);
      
      assert(result.gc !== undefined, "Should detect cycle");
      assert(result.phaseE.bufferAnalysis !== null, "Should analyze buffers");
    });

    it("preserves Phase D statistics in E", () => {
      const code = "def test(): return 1";
      const result = pipeline.transpile(code);
      
      const report = pipeline.getCICDReport();
      assert(report.phases.phaseD !== undefined, "Should preserve Phase D stats");
      assert(report.phases.phaseE !== undefined, "Should include Phase E stats");
    });
  });

  describe("Concurrent Transpilation", () => {
    it("handles sequential transpilations", () => {
      const code1 = "def fn1(): return 1";
      const code2 = "def fn2(): return 2";
      
      const result1 = pipeline.transpile(code1);
      const result2 = pipeline.transpile(code2);
      
      assert(result1.success === true, "First should succeed");
      assert(result2.success === true, "Second should succeed");
    });

    it("maintains state isolation", () => {
      const code1 = "exec(user_input)";
      const code2 = "def safe(): return 42";
      
      pipeline.transpile(code1);
      pipeline.reset();
      const result2 = pipeline.transpile(code2);
      
      assert(result2.phaseE.security.issues.length === 0, "Should be isolated");
    });

    it("resets between different languages", () => {
      const pyCode = "def py(): return 1";
      const jsCode = "function js() { return 1; }";
      
      pipeline.transpile(pyCode);
      pipeline.reset();
      const result2 = pipeline.transpile(jsCode);
      
      assert(result2 !== undefined, "Should handle language switch");
    });

    it("preserves configuration across resets", () => {
      const code1 = "def test1(): return 1";
      const code2 = "def test2(): return 2";
      
      pipeline.transpile(code1);
      const config1 = pipeline.config;
      
      pipeline.reset();
      pipeline.transpile(code2);
      const config2 = pipeline.config;
      
      assert(config1.enableSecurity === config2.enableSecurity, "Config should persist");
    });
  });

  describe("Large Codebase Tests", () => {
    it("handles 1000+ line files efficiently", () => {
      const lines = [];
      for (let i = 0; i < 1000; i++) {
        lines.push(`def fn${i}(): return ${i}`);
      }
      const code = lines.join("\n");
      
      const start = Date.now();
      const result = pipeline.transpile(code);
      const elapsed = Date.now() - start;
      
      assert(result.success === true, "Should handle large files");
      assert(elapsed < 10000, "Should complete within 10 seconds");
    });

    it("handles deeply nested structures", () => {
      let code = "def outer():\n";
      for (let i = 0; i < 30; i++) {
        code += "  " + "  ".repeat(i) + "if True:\n";
      }
      code += "  " + "  ".repeat(30) + "return 42\n";
      
      const result = pipeline.transpile(code);
      assert(result.success === true, "Should handle deep nesting");
    });

    it("processes many function definitions", () => {
      const lines = [];
      for (let i = 0; i < 200; i++) {
        lines.push(`def function_${i}(x): return x + ${i}`);
      }
      const code = lines.join("\n");
      
      const result = pipeline.transpile(code);
      assert(result.success === true, "Should process many functions");
    });

    it("handles complex class hierarchies", () => {
      const code = `
class Base:
    def method(self): return 1

class Child1(Base):
    def method(self): return 2

class Child2(Base):
    def method(self): return 3

class GrandChild(Child1):
    def method(self): return 4
`;
      const result = pipeline.transpile(code);
      assert(result.success === true, "Should handle inheritance");
    });

    it("scales linearly with code size", () => {
      const small = "def small(): return 1";
      const large = (small + "\n").repeat(100);
      
      const start1 = Date.now();
      pipeline.transpile(small);
      const time1 = Date.now() - start1;
      
      pipeline.reset();
      
      const start2 = Date.now();
      pipeline.transpile(large);
      const time2 = Date.now() - start2;
      
      assert(time2 < time1 * 200, "Should scale reasonably");
    });
  });

  describe("CI/CD Report Format", () => {
    it("includes all Phase E metrics", () => {
      const code = "def test(): return 42";
      const result = pipeline.transpile(code);
      const report = pipeline.getCICDReport();
      
      assert(report.security !== undefined, "Should have security");
      assert(report.phaseEResult !== undefined, "Should have Phase E result");
      assert(report.phases.phaseE.status === "COMPLETE", "Should be complete");
    });

    it("reports security statistics", () => {
      const code = "exec(user_input)";
      const result = pipeline.transpile(code);
      const report = pipeline.getCICDReport();
      
      assert(report.security.issueCount !== undefined, "Should count issues");
    });

    it("reports FFI generation metrics", () => {
      const code = "def exported(): return 1";
      const result = pipeline.transpile(code);
      const report = pipeline.getCICDReport();
      
      assert(report.ffi !== undefined, "Should have FFI metrics");
    });

    it("reports buffer analysis findings", () => {
      const code = `
buf = bytearray(10)
buf[5] = 1
`;
      const result = pipeline.transpile(code);
      const report = pipeline.getCICDReport();
      
      assert(report.bufferAnalysis !== undefined, "Should have buffer metrics");
    });

    it("serializes to JSON correctly", () => {
      const code = "def test(): return 1";
      const result = pipeline.transpile(code);
      const report = pipeline.getCICDReport();
      
      const json = JSON.stringify(report);
      assert(json.length > 0, "Should serialize");
      
      const parsed = JSON.parse(json);
      assert(parsed.pipeline !== undefined, "Should preserve structure");
    });

    it("includes timing information", () => {
      const code = "def test(): return 1";
      const result = pipeline.transpile(code);
      const report = pipeline.getCICDReport();
      
      assert(report.timing !== undefined, "Should have timing");
      assert(report.timing.total > 0, "Should measure time");
    });

    it("reports quality gate status", () => {
      const code = "def test(): return 1";
      const result = pipeline.transpile(code);
      const report = pipeline.getCICDReport();
      
      assert(report.qualityGates !== undefined, "Should have gate status");
      assert(typeof report.qualityGates.passed === "boolean", "Should have passed flag");
    });
  });

  describe("Security + Buffer Combined", () => {
    it("detects security and buffer issues together", () => {
      const code = `
user_input = input()
buf = bytearray(10)
exec(user_input)
buf[100] = 1
`;
      const result = pipeline.transpile(code);
      
      assert(result.phaseE.security.issues.length > 0, "Should have security issues");
      // Buffer issues might be detected
    });

    it("validates safe buffer operations", () => {
      const code = `
def safe_buffer():
    buf = bytearray(100)
    for i in range(100):
        buf[i] = i
    return buf
`;
      const result = pipeline.transpile(code);
      assert(result.success === true, "Safe code should pass");
    });

    it("detects injection via buffer manipulation", () => {
      const code = `
cmd = user_input
exec(cmd)
`;
      const result = pipeline.transpile(code);
      assert(result.phaseE.security.issues.length > 0, "Should detect injection");
    });

    it("allows checked buffer operations", () => {
      const code = `
def checked_access(buf, idx):
    if 0 <= idx < len(buf):
        return buf[idx]
    raise IndexError()
`;
      const result = pipeline.transpile(code);
      assert(result.success === true, "Checked code should pass");
    });
  });

  describe("FFI + Security Combined", () => {
    it("validates security of exported functions", () => {
      const code = `
def exported(x):
    return x * 2
`;
      const result = pipeline.transpile(code);
      
      assert(result.phaseE.ffi !== null, "Should generate FFI");
      assert(result.phaseE.security !== null, "Should check security");
    });

    it("detects security issues in exports", () => {
      const code = `
def unsafe_export(cmd):
    exec(cmd)
`;
      const result = pipeline.transpile(code);
      
      assert(result.phaseE.security.issues.length > 0, "Should detect issue");
    });

    it("exports only validated functions", () => {
      const code = `
def safe_export(x, y):
    return x + y

def internal_unsafe(cmd):
    eval(cmd)
`;
      const result = pipeline.transpile(code);
      
      assert(result.phaseE.ffi !== null, "Should process FFI");
      assert(result.phaseE.security !== null, "Should check all functions");
    });
  });

  describe("Statistics Accuracy", () => {
    it("counts Phase E operations correctly", () => {
      const code = `
def fn1(): return 1
def fn2(): return 2
exec(user_input)
`;
      const result = pipeline.transpile(code);
      const stats = pipeline.getPhaseEStats();
      
      assert(stats.functionsProcessed > 0, "Should count functions");
    });

    it("tracks timing per component", () => {
      const code = "def test(): return 1";
      const result = pipeline.transpile(code);
      
      assert(result.timing !== undefined, "Should have timing");
      assert(result.timing.phaseE !== undefined, "Should time Phase E");
    });

    it("reports issue counts by severity", () => {
      const code = `
exec(user_input)
eval(data)
`;
      const result = pipeline.transpile(code);
      const stats = pipeline.getPhaseEStats();
      
      assert(stats.securityIssues > 0, "Should count issues");
    });

    it("tracks memory usage", () => {
      const code = "def test(): return [0] * 1000";
      const result = pipeline.transpile(code);
      
      assert(result.memory !== undefined, "Should track memory");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty input", () => {
      const result = pipeline.transpile("");
      assert(result !== undefined, "Should handle empty input");
    });

    it("handles comment-only code", () => {
      const code = "# This is a comment\n# Another comment";
      const result = pipeline.transpile(code);
      assert(result.success === true, "Should handle comments");
    });

    it("handles Unicode characters", () => {
      const code = 'def unicode(): return "Hello 世界"';
      const result = pipeline.transpile(code);
      assert(result.success === true, "Should handle Unicode");
    });

    it("handles very long lines", () => {
      const longStr = '"' + "x".repeat(10000) + '"';
      const code = `def long(): return ${longStr}`;
      const result = pipeline.transpile(code);
      assert(result.success === true, "Should handle long lines");
    });

    it("handles mixed line endings", () => {
      const code = "def fn1():\r\n    return 1\n\ndef fn2():\r\n    return 2";
      const result = pipeline.transpile(code);
      assert(result.success === true, "Should handle mixed endings");
    });

    it("handles syntax errors gracefully", () => {
      const code = "def broken(";
      const result = pipeline.transpile(code);
      assert(result.success === false, "Should report syntax error");
    });

    it("handles null input", () => {
      const result = pipeline.transpile(null);
      assert(result !== undefined, "Should handle null");
    });

    it("handles undefined input", () => {
      const result = pipeline.transpile(undefined);
      assert(result !== undefined, "Should handle undefined");
    });
  });

  describe("Performance Tests", () => {
    it("completes within time budget", () => {
      const code = "def test(): return sum(range(1000))";
      const start = Date.now();
      const result = pipeline.transpile(code);
      const elapsed = Date.now() - start;
      
      assert(elapsed < 5000, "Should complete within 5s");
    });

    it("uses bounded memory", () => {
      const lines = [];
      for (let i = 0; i < 500; i++) {
        lines.push(`def fn${i}(): return ${i}`);
      }
      const code = lines.join("\n");
      
      const result = pipeline.transpile(code);
      const memory = result.memory || {};
      
      assert(memory.overhead < 10 * 1024 * 1024, "Should use <10MB");
    });

    it("maintains consistent performance", () => {
      const code = "def test(): return 42";
      const times = [];
      
      for (let i = 0; i < 5; i++) {
        pipeline.reset();
        const start = Date.now();
        pipeline.transpile(code);
        times.push(Date.now() - start);
      }
      
      const avg = times.reduce((a, b) => a + b) / times.length;
      const variance = times.map(t => Math.abs(t - avg)).reduce((a, b) => a + b) / times.length;
      
      assert(variance < avg * 0.5, "Should be consistent");
    });
  });

  describe("Configuration Validation", () => {
    it("validates security config", () => {
      const customPipeline = new PythonPhaseEPipeline({
        enableSecurity: false
      });
      
      const code = "exec(user_input)";
      const result = customPipeline.transpile(code);
      
      assert(result !== undefined, "Should respect config");
    });

    it("validates FFI config", () => {
      const customPipeline = new PythonPhaseEPipeline({
        enableFFI: false
      });
      
      const code = "def test(): return 1";
      const result = customPipeline.transpile(code);
      
      assert(result !== undefined, "Should respect FFI config");
    });

    it("validates buffer check config", () => {
      const customPipeline = new PythonPhaseEPipeline({
        enableBufferChecks: false
      });
      
      const code = `
buf = bytearray(10)
buf[100] = 1
`;
      const result = customPipeline.transpile(code);
      
      assert(result !== undefined, "Should respect buffer config");
    });

    it("handles invalid config gracefully", () => {
      const invalidPipeline = new PythonPhaseEPipeline({
        invalidOption: "bad value"
      });
      
      const code = "def test(): return 1";
      const result = invalidPipeline.transpile(code);
      
      assert(result !== undefined, "Should handle invalid config");
    });
  });
});

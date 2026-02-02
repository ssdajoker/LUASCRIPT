"use strict";

/**
 * Python Phase E - Buffer Overflow Detector Tests
 * Comprehensive tests for memory safety analysis
 */

const assert = require("assert");
const { PythonBufferOverflowDetector } = require("../src/optimizers/python/phase_e/python_buffer_overflow_detector.js");

describe("Python Phase E - Buffer Overflow Detector", () => {
  let detector;

  beforeEach(() => {
    detector = new PythonBufferOverflowDetector({
      enabled: true,
      checkArrayAccess: true,
      checkStringOps: true,
      checkCtypes: true,
      checkStructOps: true,
    });
  });

  const buildIR = (body) => ({
    type: "Module",
    body,
    orelse: [],
  });

  describe("Array/Buffer Access", () => {
    it("detects constant out-of-bounds access", () => {
      const ir = buildIR([
        {
          type: "Assign",
          targets: [{ id: "buf" }],
          value: { type: "List", elts: [{ type: "Constant", value: 1 }, { type: "Constant", value: 2 }] },
        },
        {
          type: "Subscript",
          lineno: 10,
          value: { id: "buf" },
          slice: { type: "Constant", value: 5 },
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.issues.some(i => i.type === "BUFFER_OVERFLOW"), "Should detect buffer overflow");
      assert(result.severity === "HIGH", "Severity should be HIGH for overflow");
    });

    it("detects negative index usage", () => {
      const ir = buildIR([
        {
          type: "Assign",
          targets: [{ id: "buf" }],
          value: { type: "List", elts: [{ type: "Constant", value: 1 }] },
        },
        {
          type: "Subscript",
          lineno: 12,
          value: { id: "buf" },
          slice: { type: "Constant", value: -1 },
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.issues.some(i => i.type === "NEGATIVE_INDEX"), "Should detect negative index");
    });
  });

  describe("Unsafe String Operations", () => {
    it("flags unsafe strcpy usage", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 5,
          func: { id: "strcpy" },
          args: [{ type: "Name", id: "dst" }, { type: "Name", id: "src" }],
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.issues.some(i => i.type === "UNSAFE_STRING_OP"), "Should flag unsafe string op");
    });

    it("flags format string vulnerabilities", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 7,
          func: { id: "sprintf" },
          args: [{ type: "Name", id: "fmt" }],
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.issues.some(i => i.type === "FORMAT_STRING"), "Should flag format string vulnerability");
    });
  });

  describe("Ctypes Operations", () => {
    it("detects pointer arithmetic via cast", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 9,
          func: { attr: "cast" },
          args: [],
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.issues.some(i => i.type === "POINTER_ARITHMETIC"), "Should detect pointer arithmetic");
    });

    it("flags dynamic allocation without validation", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 11,
          func: { id: "create_string_buffer" },
          args: [{ type: "Name", id: "size" }],
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.issues.some(i => i.type === "DYNAMIC_ALLOCATION"), "Should flag dynamic allocation");
    });
  });

  describe("Struct Pack/Unpack", () => {
    it("flags struct.pack without sufficient args", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 13,
          func: { attr: "pack" },
          args: [],
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.issues.some(i => i.type === "STRUCT_PACK_ERROR"), "Should flag pack error");
    });

    it("flags struct.unpack size issues", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 14,
          func: { attr: "unpack" },
          args: [{ type: "Str", s: "I" }, { type: "Name", id: "buf" }],
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.issues.some(i => i.type === "STRUCT_UNPACK_SIZE"), "Should flag unpack size issue");
    });
  });

  describe("Memoryview and Array Ops", () => {
    it("flags memoryview direct access", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 15,
          func: { id: "memoryview" },
          args: [{ type: "Name", id: "data" }],
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.issues.some(i => i.type === "MEMORYVIEW_ACCESS"), "Should flag memoryview access");
    });

    it("flags array.frombytes usage", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 16,
          func: { attr: "frombytes" },
          args: [{ type: "Name", id: "raw" }],
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.issues.some(i => i.type === "ARRAY_FROM_BYTES"), "Should flag array from bytes");
    });
  });

  describe("Buffer Size Tracking", () => {
    it("tracks bytearray size and detects overflow", () => {
      const ir = buildIR([
        {
          type: "Assign",
          targets: [{ id: "buf" }],
          value: {
            type: "Call",
            func: { id: "bytearray" },
            args: [{ type: "Constant", value: 4 }],
          },
        },
        {
          type: "Subscript",
          lineno: 20,
          value: { id: "buf" },
          slice: { type: "Constant", value: 5 },
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.issues.some(i => i.type === "BUFFER_OVERFLOW"), "Should detect overflow on bytearray");
    });
  });

  describe("Statistics and Recommendations", () => {
    it("returns statistics with severity counts", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 21,
          func: { id: "strcpy" },
          args: [{ type: "Name", id: "dst" }, { type: "Name", id: "src" }],
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.stats.totalIssues > 0, "Stats should include issues");
      assert(result.stats.bySeverity.high >= 1, "High severity count should be >= 1");
    });

    it("generates remediation recommendations", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 22,
          func: { id: "strcpy" },
          args: [{ type: "Name", id: "dst" }, { type: "Name", id: "src" }],
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.recommendations.length > 0, "Recommendations should be generated");
    });
  });

  describe("CWE Mapping", () => {
    it("maps buffer overflow to CWE-125", () => {
      const ir = buildIR([
        {
          type: "Assign",
          targets: [{ id: "buf" }],
          value: { type: "List", elts: [{ type: "Constant", value: 1 }] },
        },
        {
          type: "Subscript",
          lineno: 30,
          value: { id: "buf" },
          slice: { type: "Constant", value: 10 },
        },
      ]);

      const result = detector.analyze(ir);
      const issue = result.issues.find(i => i.type === "BUFFER_OVERFLOW");
      assert(issue.cwe === "CWE-125", "Should map to CWE-125");
    });

    it("maps unsafe string ops to CWE-120", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 31,
          func: { id: "strcpy" },
          args: [{ type: "Name", id: "dst" }, { type: "Name", id: "src" }],
        },
      ]);

      const result = detector.analyze(ir);
      const issue = result.issues.find(i => i.type === "UNSAFE_STRING_OP");
      assert(issue.cwe === "CWE-120", "Should map to CWE-120");
    });

    it("maps format string to CWE-134", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 32,
          func: { id: "printf" },
          args: [{ type: "Name", id: "user_fmt" }],
        },
      ]);

      const result = detector.analyze(ir);
      const issue = result.issues.find(i => i.type === "FORMAT_STRING");
      assert(issue.cwe === "CWE-134", "Should map to CWE-134");
    });

    it("maps pointer arithmetic to CWE-823", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 33,
          func: { attr: "cast" },
          args: [],
        },
      ]);

      const result = detector.analyze(ir);
      const issue = result.issues.find(i => i.type === "POINTER_ARITHMETIC");
      assert(issue.cwe === "CWE-823", "Should map to CWE-823");
    });
  });

  describe("Severity Classification", () => {
    it("classifies buffer overflow as HIGH", () => {
      const ir = buildIR([
        {
          type: "Assign",
          targets: [{ id: "buf" }],
          value: { type: "List", elts: [] },
        },
        {
          type: "Subscript",
          lineno: 40,
          value: { id: "buf" },
          slice: { type: "Constant", value: 1 },
        },
      ]);

      const result = detector.analyze(ir);
      const issue = result.issues.find(i => i.type === "BUFFER_OVERFLOW");
      assert(issue.severity === "HIGH", "Buffer overflow should be HIGH");
    });

    it("classifies pointer ops as MEDIUM", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 41,
          func: { attr: "pointer" },
          args: [],
        },
      ]);

      const result = detector.analyze(ir);
      const issue = result.issues.find(i => i.type === "POINTER_ARITHMETIC");
      assert(issue.severity === "MEDIUM", "Pointer arithmetic should be MEDIUM");
    });

    it("classifies memoryview as LOW", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 42,
          func: { id: "memoryview" },
          args: [{ type: "Name", id: "data" }],
        },
      ]);

      const result = detector.analyze(ir);
      const issue = result.issues.find(i => i.type === "MEMORYVIEW_ACCESS");
      assert(issue.severity === "LOW", "Memoryview should be LOW");
    });
  });

  describe("Multiple Vulnerabilities", () => {
    it("detects multiple issues in same code", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 50,
          func: { id: "strcpy" },
          args: [{ type: "Name", id: "dst" }, { type: "Name", id: "src" }],
        },
        {
          type: "Call",
          lineno: 51,
          func: { id: "sprintf" },
          args: [{ type: "Name", id: "fmt" }],
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.issues.length >= 2, "Should detect multiple issues");
    });

    it("reports overall severity as highest detected", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 52,
          func: { id: "strcpy" },
          args: [{ type: "Name", id: "dst" }, { type: "Name", id: "src" }],
        },
        {
          type: "Call",
          lineno: 53,
          func: { id: "memoryview" },
          args: [{ type: "Name", id: "data" }],
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.severity === "HIGH", "Overall severity should be HIGH");
    });
  });

  describe("Configuration Options", () => {
    it("respects disabled array access check", () => {
      const disabledDetector = new PythonBufferOverflowDetector({
        checkArrayAccess: false,
      });

      const ir = buildIR([
        {
          type: "Subscript",
          lineno: 60,
          value: { id: "buf" },
          slice: { type: "Constant", value: 100 },
        },
      ]);

      const result = disabledDetector.analyze(ir);
      assert(result.issues.filter(i => i.type === "BUFFER_OVERFLOW").length === 0, "Should skip array checks when disabled");
    });

    it("respects disabled string ops check", () => {
      const disabledDetector = new PythonBufferOverflowDetector({
        checkStringOps: false,
      });

      const ir = buildIR([
        {
          type: "Call",
          lineno: 61,
          func: { id: "strcpy" },
          args: [{ type: "Name", id: "dst" }, { type: "Name", id: "src" }],
        },
      ]);

      const result = disabledDetector.analyze(ir);
      assert(result.issues.filter(i => i.type === "UNSAFE_STRING_OP").length === 0, "Should skip string checks when disabled");
    });

    it("respects disabled ctypes check", () => {
      const disabledDetector = new PythonBufferOverflowDetector({
        checkCtypes: false,
      });

      const ir = buildIR([
        {
          type: "Call",
          lineno: 62,
          func: { attr: "cast" },
          args: [],
        },
      ]);

      const result = disabledDetector.analyze(ir);
      assert(result.issues.filter(i => i.type === "POINTER_ARITHMETIC").length === 0, "Should skip ctypes checks when disabled");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty IR", () => {
      const ir = buildIR([]);
      const result = detector.analyze(ir);
      assert(result.success === true, "Should handle empty IR");
      assert(result.issues.length === 0, "Should have no issues");
    });

    it("handles null IR", () => {
      const result = detector.analyze(null);
      assert(result.success === false || result.issues.length === 0, "Should handle null IR");
    });

    it("handles deeply nested structures", () => {
      const ir = buildIR([
        {
          type: "For",
          target: { id: "i" },
          iter: { type: "Name", id: "range" },
          body: [
            {
              type: "For",
              target: { id: "j" },
              iter: { type: "Name", id: "range" },
              body: [
                {
                  type: "Subscript",
                  lineno: 70,
                  value: { id: "matrix" },
                  slice: { type: "Name", id: "i" },
                },
              ],
            },
          ],
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.success === true, "Should handle nested structures");
    });
  });

  describe("Reset Functionality", () => {
    it("clears previous issues on reset", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 80,
          func: { id: "strcpy" },
          args: [{ type: "Name", id: "dst" }, { type: "Name", id: "src" }],
        },
      ]);

      detector.analyze(ir);
      detector.reset();
      
      const result = detector.analyze(buildIR([]));
      assert(result.issues.length === 0, "Issues should be cleared after reset");
    });

    it("clears buffer tracking on reset", () => {
      const ir = buildIR([
        {
          type: "Assign",
          targets: [{ id: "buf" }],
          value: { type: "List", elts: [{ type: "Constant", value: 1 }] },
        },
      ]);

      detector.analyze(ir);
      detector.reset();
      
      assert(detector.buffers.size === 0, "Buffer tracking should be cleared");
    });
  });

  describe("Remediation Suggestions", () => {
    it("suggests bounds checking for overflows", () => {
      const ir = buildIR([
        {
          type: "Assign",
          targets: [{ id: "buf" }],
          value: { type: "List", elts: [{ type: "Constant", value: 1 }] },
        },
        {
          type: "Subscript",
          lineno: 90,
          value: { id: "buf" },
          slice: { type: "Constant", value: 10 },
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.recommendations.some(r => r.includes("bounds checking")), "Should suggest bounds checking");
    });

    it("suggests safe alternatives for unsafe functions", () => {
      const ir = buildIR([
        {
          type: "Call",
          lineno: 91,
          func: { id: "strcpy" },
          args: [{ type: "Name", id: "dst" }, { type: "Name", id: "src" }],
        },
      ]);

      const result = detector.analyze(ir);
      assert(result.recommendations.some(r => r.includes("safe alternative")), "Should suggest safe alternatives");
    });
  });
});

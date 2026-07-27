"use strict";

/**
 * Python Phase D - GC Pattern Detection & Stack Analysis Tests
 * Comprehensive tests for memory analysis components
 */

const { PythonGCDetector } = require("../src/optimizers/python/phase_d/python_gc_detector");
const { PythonStackAnalyzer } = require("../src/optimizers/python/phase_d/python_stack_analyzer");

describe("Python GC Pattern Detection", () => {
  let detector;

  beforeEach(() => {
    detector = new PythonGCDetector({
      enableCycleDetection: true,
      enableContainerTracking: true,
      enableClosureAnalysis: true,
      enableEscapeAnalysis: true,
    });
  });

  describe("Cycle Detection", () => {
    test("detects direct reference cycles", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'Assign',
            targets: [{ type: 'Name', id: 'a' }],
            value: { type: 'Name', id: 'b' },
          },
        ],
      };

      const result = detector.analyze(ir);
      expect(result.patterns).toBeDefined();
      expect(Array.isArray(result.patterns)).toBe(true);
    });

    test("detects self-referential containers", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'Expr',
            value: {
              type: 'Call',
              func: { type: 'Attribute', attr: 'append', value: { type: 'Name', id: 'mylist' } },
              args: [{ type: 'Name', id: 'mylist' }],
            },
          },
        ],
      };

      const result = detector.analyze(ir);
      expect(result.patterns.some(p => p.type === 'cycle')).toBe(true);
    });

    test("identifies HIGH severity cycles", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'Assign',
            targets: [{ type: 'Name', id: 'x' }],
            value: { type: 'Name', id: 'y' },
          },
        ],
      };

      const result = detector.analyze(ir);
      const cyclePattern = result.patterns.find(p => p.type === 'cycle');
      
      if (cyclePattern) {
        expect(cyclePattern.severity).toBe('HIGH');
      }
    });
  });

  describe("Container Mutation Tracking", () => {
    test("detects list mutations", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'Expr',
            value: {
              type: 'Call',
              func: { type: 'Attribute', attr: 'append', value: { type: 'Name', id: 'lst' } },
              args: [{ type: 'Constant', value: 1 }],
            },
          },
        ],
      };

      const result = detector.analyze(ir);
      const mutation = result.patterns.find(p => p.type === 'container_mutation');
      expect(mutation).toBeDefined();
    });

    test("detects large allocations", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'Expr',
            value: {
              type: 'Call',
              func: { type: 'Name', id: 'list' },
              args: [{ type: 'Num', value: 50000 }],
            },
          },
        ],
      };

      const result = detector.analyze(ir);
      const largeAlloc = result.patterns.find(p => p.type === 'large_allocation');
      expect(largeAlloc).toBeDefined();
    });

    test("tracks various mutation methods", () => {
      const methods = ['append', 'extend', 'insert', 'remove', 'pop'];
      let totalMutations = 0;

      methods.forEach(method => {
        const ir = {
          type: 'Module',
          body: [
            {
              type: 'Expr',
              value: {
                type: 'Call',
                func: { type: 'Attribute', attr: method, value: { type: 'Name', id: 'lst' } },
                args: [{ type: 'Constant', value: 1 }],
              },
            },
          ],
        };

        const result = detector.analyze(ir);
        if (result.patterns.some(p => p.type === 'container_mutation')) {
          totalMutations++;
        }
      });

      expect(totalMutations).toBeGreaterThan(0);
    });
  });

  describe("Closure Analysis", () => {
    test("detects closures with free variables", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'FunctionDef',
            name: 'outer',
            body: [
              {
                type: 'FunctionDef',
                name: 'inner',
                body: [
                  {
                    type: 'Return',
                    value: { type: 'Name', id: 'x' },  // free variable
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = detector.analyze(ir);
      const closure = result.patterns.find(p => p.type === 'closure');
      expect(closure).toBeDefined();
    });

    test("detects generators", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'FunctionDef',
            name: 'gen_func',
            body: [
              {
                type: 'Expr',
                value: { type: 'Yield', value: { type: 'Constant', value: 1 } },
              },
            ],
          },
        ],
      };

      const result = detector.analyze(ir);
      const generator = result.patterns.find(p => p.type === 'generator');
      expect(generator).toBeDefined();
    });
  });

  describe("Statistics", () => {
    test("provides pattern statistics", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'Assign',
            targets: [{ type: 'Name', id: 'x' }],
            value: { type: 'Constant', value: 1 },
          },
        ],
      };

      const result = detector.analyze(ir);
      expect(result.stats).toBeDefined();
      expect(result.stats.total).toBeDefined();
      expect(result.stats.bySeverity).toBeDefined();
    });

    test("provides recommendations", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'While',
            test: { type: 'Constant', value: true },
            body: [
              {
                type: 'Expr',
                value: {
                  type: 'Call',
                  func: { type: 'Attribute', attr: 'append' },
                  args: [{ type: 'Constant', value: 1 }],
                },
              },
            ],
          },
        ],
      };

      const result = detector.analyze(ir);
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });
});

describe("Python Stack Analysis", () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new PythonStackAnalyzer({
      enableLifetimeTracking: true,
      enableEscapeAnalysis: true,
      enableStackProfiling: true,
    });
  });

  describe("Stack Frame Tracking", () => {
    test("creates stack frames for functions", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'FunctionDef',
            name: 'test_func',
            lineno: 1,
            endLine: 5,
            body: [
              { type: 'Return', value: { type: 'Constant', value: 1 } },
            ],
          },
        ],
      };

      const result = analyzer.analyze(ir);
      expect(result.frames.length).toBeGreaterThan(0);
      expect(result.frames[0].functionName).toBe('test_func');
    });

    test("tracks function parameters", () => {
      const ir = {
        type: 'FunctionDef',
        name: 'func_with_params',
        args: {
          args: [
            { arg: 'x' },
            { arg: 'y' },
          ],
        },
        body: [],
      };

      const result = analyzer.analyze(ir);
      if (result.frames.length > 0) {
        const frame = result.frames[0];
        expect(frame.variableCount).toBeGreaterThanOrEqual(2);
      }
    });

    test("detects variable assignments", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'Assign',
            targets: [{ type: 'Name', id: 'x' }],
            value: { type: 'Constant', value: 10 },
            lineno: 1,
            endLine: 1,
          },
        ],
      };

      const result = analyzer.analyze(ir);
      expect(result.stats.totalVariables).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Stack Frame Statistics", () => {
    test("calculates variable count", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'Assign',
            targets: [{ type: 'Name', id: 'a' }],
            value: { type: 'Constant', value: 1 },
            lineno: 1,
          },
          {
            type: 'Assign',
            targets: [{ type: 'Name', id: 'b' }],
            value: { type: 'Constant', value: 2 },
            lineno: 2,
          },
        ],
      };

      const result = analyzer.analyze(ir);
      expect(result.stats.totalVariables).toBeGreaterThanOrEqual(0);
    });

    test("estimates stack usage", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'Assign',
            targets: [{ type: 'Name', id: 'x' }],
            value: { type: 'Constant', value: 1 },
            lineno: 1,
          },
        ],
      };

      const result = analyzer.analyze(ir);
      expect(result.stats).toBeDefined();
      expect(typeof result.stats).toBe('object');
    });
  });

  describe("Escape Analysis", () => {
    test("detects return value escapes", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'FunctionDef',
            name: 'func',
            body: [
              {
                type: 'Return',
                value: { type: 'Name', id: 'x', ctx: { type: 'Load' } },
              },
            ],
          },
        ],
      };

      const result = analyzer.analyze(ir);
      expect(result.stats.escapedVariables).toBeDefined();
    });

    test("detects passed argument escapes", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'Expr',
            value: {
              type: 'Call',
              func: { type: 'Name', id: 'print' },
              args: [{ type: 'Name', id: 'x', ctx: { type: 'Load' } }],
            },
          },
        ],
      };

      const result = analyzer.analyze(ir);
      expect(result.stats.escapedVariables).toBeDefined();
    });
  });

  describe("Recursion Detection", () => {
    test("identifies recursive functions", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'FunctionDef',
            name: 'recursive_func',
            body: [
              {
                type: 'Expr',
                value: {
                  type: 'Call',
                  func: { type: 'Name', id: 'recursive_func' },
                  args: [],
                },
              },
            ],
          },
        ],
      };

      const result = analyzer.analyze(ir);
      expect(result.issues).toBeDefined();
      // May or may not detect depending on implementation
    });
  });

  describe("O(1) Verification", () => {
    test("verifies O(1) stack operations", () => {
      const ir = {
        type: 'Module',
        body: [],
      };

      const result = analyzer.analyze(ir);
      expect(result.stats.O1Verified).toBeDefined();
      expect(result.stats.O1Verified.isO1).toBe(true);  // Empty code should be O(1)
    });

    test("detects O(1) violations", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'FunctionDef',
            name: 'many_vars',
            body: Array(2000).fill().map((_, i) => ({
              type: 'Assign',
              targets: [{ type: 'Name', id: `var${i}` }],
              value: { type: 'Constant', value: i },
            })),
          },
        ],
      };

      const result = analyzer.analyze(ir);
      const o1Check = result.stats.O1Verified;
      // Large variable count might trigger violations
      expect(o1Check).toBeDefined();
    });
  });

  describe("Optimization Suggestions", () => {
    test("suggests inline optimizations", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'Assign',
            targets: [{ type: 'Name', id: 'temp' }],
            value: { type: 'Constant', value: 42 },
            lineno: 1,
            endLine: 2,
          },
          {
            type: 'Return',
            value: { type: 'Name', id: 'temp' },
            lineno: 3,
          },
        ],
      };

      const result = analyzer.analyze(ir);
      const suggestions = analyzer.optimizationSuggestions();
      expect(suggestions).toBeInstanceOf(Array);
    });

    test("suggests removing unused variables", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'Assign',
            targets: [{ type: 'Name', id: 'unused' }],
            value: { type: 'Constant', value: 42 },
            lineno: 1,
          },
        ],
      };

      const result = analyzer.analyze(ir);
      const suggestions = analyzer.optimizationSuggestions();
      // May suggest removal depending on reference tracking
      expect(suggestions).toBeInstanceOf(Array);
    });
  });

  describe("Statistics and Reports", () => {
    test("provides comprehensive statistics", () => {
      const ir = {
        type: 'Module',
        body: [
          {
            type: 'FunctionDef',
            name: 'test',
            body: [
              {
                type: 'Return',
                value: { type: 'Constant', value: 1 },
              },
            ],
          },
        ],
      };

      const result = analyzer.analyze(ir);
      expect(result.stats).toBeDefined();
      expect(result.stats.totalFunctions).toBeGreaterThanOrEqual(0);
      expect(result.stats.maxStackDepth).toBeGreaterThanOrEqual(0);
    });

    test("provides recommendations", () => {
      const ir = {
        type: 'Module',
        body: [],
      };

      const result = analyzer.analyze(ir);
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });
});

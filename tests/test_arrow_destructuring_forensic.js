/**
 * LUASCRIPT Phase 4 - Arrow Function Parameter Destructuring
 * Forensic Edge Case Test Suite - 45 Advanced Tests
 * Professional Grade - CSC LM EVO-A Standard
 * Tests corner cases, boundary conditions, and integration scenarios
 */

const { LuaScriptParser } = require("../src/phase1_core_parser");
const { IRLowerer, lowerToIR } = require("../src/ir/lowerer");

class ForensicTestRunner {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
    this.startTime = Date.now();
  }

  test(name, code, shouldPass = true, category = "general") {
    this.tests.push({ name, code, shouldPass, category });
  }

  async run() {
    console.log(`\n${"=".repeat(100)}`);
    console.log(`FORENSIC EDGE CASE SUITE: ${this.name}`);
    console.log(`${"=".repeat(100)}\n`);

    const categoryStats = {};

    for (const test of this.tests) {
      try {
        const parser = new LuaScriptParser(test.code);
        const ast = parser.parse();
        const hasErrors = parser.errors && parser.errors.length > 0;

        let testPassed = false;
        if (test.shouldPass) {
          testPassed = !hasErrors && ast && ast.body.length > 0;
        } else {
          testPassed = hasErrors; // Should have errors
        }

        if (!categoryStats[test.category]) {
          categoryStats[test.category] = { passed: 0, total: 0 };
        }
        categoryStats[test.category].total++;

        if (testPassed) {
          console.log(`✅ ${test.name}`);
          this.passed++;
          categoryStats[test.category].passed++;
        } else {
          const errorMsg = hasErrors ? parser.errors[0].message : "No AST generated";
          console.log(`❌ ${test.name}: ${errorMsg}`);
          this.failed++;
          this.errors.push({ test: test.name, error: errorMsg });
        }
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        this.failed++;
        this.errors.push({ test: test.name, error: error.message });

        if (!categoryStats[test.category]) {
          categoryStats[test.category] = { passed: 0, total: 0 };
        }
        categoryStats[test.category].total++;
      }
    }

    // Summary by category
    console.log(`\n${"=".repeat(100)}`);
    console.log("CATEGORY BREAKDOWN:");
    for (const [category, stats] of Object.entries(categoryStats)) {
      const rate = ((stats.passed / stats.total) * 100).toFixed(2);
      console.log(
        `  ${category}: ${stats.passed}/${stats.total} (${rate}%)`
      );
    }

    const elapsed = Date.now() - this.startTime;
    console.log(`\n${"=".repeat(100)}`);
    console.log(
      `FINAL RESULTS: ${this.passed} passed, ${this.failed} failed out of ${this.tests.length}`
    );
    console.log(
      `Pass Rate: ${((this.passed / this.tests.length) * 100).toFixed(2)}%`
    );
    console.log(`Execution Time: ${elapsed}ms`);
    console.log(`Average Time per Test: ${(elapsed / this.tests.length).toFixed(2)}ms`);
    console.log(`${"=".repeat(100)}\n`);

    if (this.errors.length > 0 && this.errors.length <= 10) {
      console.log("FAILED TESTS:");
      this.errors.forEach((err) => {
        console.log(`  - ${err.test}: ${err.error}`);
      });
      console.log();
    }

    return this.failed === 0;
  }
}

// ============================================================================
// FORENSIC TESTS
// ============================================================================

const runner = new ForensicTestRunner(
  "Arrow Function Parameter Destructuring - Forensic Edge Cases"
);

// ============================================================================
// CATEGORY 1: DUPLICATE IDENTIFIERS (4 tests)
// ============================================================================

runner.test(
  "Forensic: Duplicate array indices",
  "const f = ([a, a]) => a; f([1, 2]);",
  true,
  "duplicate_identifiers"
);

runner.test(
  "Forensic: Duplicate object properties",
  "const f = ({x, x}) => x; f({x: 5});",
  true,
  "duplicate_identifiers"
);

runner.test(
  "Forensic: Renamed to existing name",
  "const f = ({x: y, y}) => x; f({x: 1, y: 2});",
  true,
  "duplicate_identifiers"
);

runner.test(
  "Forensic: Rest with same name as property",
  "const f = ([a, ...a]) => a; f([1, 2, 3]);",
  true,
  "duplicate_identifiers"
);

// ============================================================================
// CATEGORY 2: DEEPLY NESTED PATTERNS (5 tests)
// ============================================================================

runner.test(
  "Forensic: 4-level nested arrays",
  "const f = ([ [ [ [a] ] ] ]) => a; f([ [ [ [1] ] ] ]);",
  true,
  "deep_nesting"
);

runner.test(
  "Forensic: 4-level nested objects",
  "const f = ({a: {b: {c: {d}}}}) => d; f({a: {b: {c: {d: 42}}}});",
  true,
  "deep_nesting"
);

runner.test(
  "Forensic: Mixed 5-level nesting",
  "const f = ({a: [{b: {c: [{d}]}}]}) => d; f({a: [{b: {c: [{d: 8}]}}]});",
  true,
  "deep_nesting"
);

runner.test(
  "Forensic: Many properties at each level",
  "const f = ({a: {x, y, z}, b: {p, q, r}, c: {m, n}}) => x + p + m; f({a: {x: 1, y: 2, z: 3}, b: {p: 4, q: 5, r: 6}, c: {m: 7, n: 8}});",
  true,
  "deep_nesting"
);

runner.test(
  "Forensic: Nested patterns with rest",
  "const f = ([{x, ...rest}]) => x; f([{x: 1, y: 2, z: 3}]);",
  true,
  "deep_nesting"
);

// ============================================================================
// CATEGORY 3: DEFAULT VALUE EDGE CASES (6 tests)
// ============================================================================

runner.test(
  "Forensic: Default with falsy values",
  "const f = ([a = null, b = undefined, c = false]) => c; f([]);",
  true,
  "defaults"
);

runner.test(
  "Forensic: Default with complex expressions",
  "const f = ([a = 1 + 2 * 3]) => a; f([]);",
  true,
  "defaults"
);

runner.test(
  "Forensic: Default with function call",
  "const f = ([a = [].length]) => a; f([]);",
  true,
  "defaults"
);

runner.test(
  "Forensic: Default in nested pattern",
  "const f = ([[a = 5]]) => a; f([[]]);",
  true,
  "defaults"
);

runner.test(
  "Forensic: Object with default on renamed property",
  "const f = ({x: a = 10}) => a; f({});",
  true,
  "defaults"
);

runner.test(
  "Forensic: Multiple defaults in mixed pattern",
  "const f = ([a = 1, {b = 2, c: d = 3}]) => a + b + d; f([]);",
  true,
  "defaults"
);

// ============================================================================
// CATEGORY 4: REST ELEMENT SCENARIOS (5 tests)
// ============================================================================

runner.test(
  "Forensic: Rest with no elements",
  "const f = ([a, ...rest]) => rest; f([1]);",
  true,
  "rest_elements"
);

runner.test(
  "Forensic: Rest collects many elements",
  "const f = ([a, ...rest]) => rest.length; f(Array(100).fill(0));",
  true,
  "rest_elements"
);

runner.test(
  "Forensic: Nested array with rest",
  "const f = ([[a, ...b]]) => b; f([[1, 2, 3]]);",
  true,
  "rest_elements"
);

runner.test(
  "Forensic: Object rest with overlapping keys",
  "const f = ({a, b, ...rest}) => rest; f({a: 1, b: 2, c: 3, d: 4});",
  true,
  "rest_elements"
);

runner.test(
  "Forensic: Rest in middle position (invalid)",
  "const f = ([a, ...rest, b]) => a; f([1, 2, 3]);",
  false,
  "rest_elements"
);

// ============================================================================
// CATEGORY 5: SCOPE & BINDING (6 tests)
// ============================================================================

runner.test(
  "Forensic: Parameter shadows outer variable",
  "let x = 'outer'; const f = ([x]) => x; f([42]); return x;",
  true,
  "scope_binding"
);

runner.test(
  "Forensic: Closure captures parameter",
  "const f = ([x]) => () => x; const g = f([42]); return g();",
  true,
  "scope_binding"
);

runner.test(
  "Forensic: Loop with destructuring parameters",
  "for (let i = 0; i < 3; i++) { const f = ([x]) => i; f([10]); }",
  true,
  "scope_binding"
);

runner.test(
  "Forensic: Destructuring in nested arrow",
  "const f = ([a]) => ([b]) => ({a, b}); const g = f([1])([2]);",
  true,
  "scope_binding"
);

runner.test(
  "Forensic: Parameter used before fully destructured",
  "const f = ([a, b = a + 1]) => b; f([5]);",
  true,
  "scope_binding"
);

runner.test(
  "Forensic: Destructuring with hoisting",
  "const f = ([x = y, y = 10]) => x + y; f([]);",
  true,
  "scope_binding"
);

// ============================================================================
// CATEGORY 6: TYPE AND VALUE HANDLING (7 tests)
// ============================================================================

runner.test(
  "Forensic: Array-like object destructuring",
  "const f = ([a, b]) => a + b; f({0: 5, 1: 10, length: 2});",
  true,
  "type_handling"
);

runner.test(
  "Forensic: Null and undefined source",
  "const f = ([a]) => a; f(null);",
  false,
  "type_handling"
);

runner.test(
  "Forensic: Destructuring primitive types",
  "const f = ({valueOf}) => typeof valueOf; f(42);",
  true,
  "type_handling"
);

runner.test(
  "Forensic: Empty destructuring with non-empty source",
  "const f = ([]) => 99; f([1, 2, 3]);",
  true,
  "type_handling"
);

runner.test(
  "Forensic: String-like indexed destructuring",
  "const f = ([a, b]) => a + b; f('ab');",
  true,
  "type_handling"
);

runner.test(
  "Forensic: Sparse array destructuring",
  "const arr = []; arr[100] = 'value'; const f = ([a, b, c]) => c; f(arr);",
  true,
  "type_handling"
);

runner.test(
  "Forensic: Symbol keys in object destructuring",
  "const sym = Symbol('key'); const f = ({[sym]: x}) => x; f({[sym]: 42});",
  true,
  "type_handling"
);

// ============================================================================
// CATEGORY 7: SPECIFICATION COMPLIANCE (6 tests)
// ============================================================================

runner.test(
  "Forensic: Parameter list with trailing comma",
  "const f = ([a, b,]) => a + b; f([1, 2]);",
  true,
  "spec_compliance"
);

runner.test(
  "Forensic: Hole at end of array pattern",
  "const f = ([a, b,]) => a; f([1, 2,]);",
  true,
  "spec_compliance"
);

runner.test(
  "Forensic: Multiple holes in array",
  "const f = ([a, , , d]) => a + d; f([1, 2, 3, 4]);",
  true,
  "spec_compliance"
);

runner.test(
  "Forensic: Comments in destructuring (should not affect parsing)",
  "const f = ([a, /* comment */ b]) => a + b; f([1, 2]);",
  true,
  "spec_compliance"
);

runner.test(
  "Forensic: Unicode identifiers in patterns",
  "const f = ([α, β]) => α + β; f([1, 2]);",
  true,
  "spec_compliance"
);

runner.test(
  "Forensic: Reserved words as renamed properties",
  "const f = ({if: _if}) => _if; f({if: 42});",
  true,
  "spec_compliance"
);

// ============================================================================
// CATEGORY 8: PERFORMANCE & SCALE (4 tests)
// ============================================================================

runner.test(
  "Forensic: 50-element array pattern",
  "const f = ([" + Array(50).fill(null).map((_, i) => `a${i}`).join(', ') + "]) => a0; " +
  "f([" + Array(50).fill(null).map((_, i) => i).join(', ') + "]);",
  true,
  "performance"
);

runner.test(
  "Forensic: 30-property object pattern",
  "const f = ({" + Array(30).fill(null).map((_, i) => `a${i}`).join(', ') + "}) => a0; " +
  "f({" + Array(30).fill(null).map((_, i) => `a${i}: ${i}`).join(', ') + "});",
  true,
  "performance"
);

runner.test(
  "Forensic: Recursive destructuring pattern",
  "const f = ({a: {b: {c: {d: {e: {f: {g: {h: {i: {j}}}}}}}}}}}) => j; f({a: {b: {c: {d: {e: {f: {g: {h: {i: {j: 1}}}}}}}}}}});",
  true,
  "performance"
);

runner.test(
  "Forensic: Many default expressions",
  "const f = ([" + Array(20).fill(null).map((_, i) => `a${i} = ${i}`).join(', ') + "]) => a0 + a19; f([]);",
  true,
  "performance"
);

// ============================================================================
// CATEGORY 9: INTEGRATION SCENARIOS (6 tests)
// ============================================================================

runner.test(
  "Forensic: Destructuring in array map with index",
  "const arr = [{x: 1, y: 2}]; arr.map(({x, y}, i) => x + y);",
  true,
  "integration"
);

runner.test(
  "Forensic: Destructuring in array filter",
  "const arr = [{x: 1}, {x: 2}]; arr.filter(({x}) => x > 1);",
  true,
  "integration"
);

runner.test(
  "Forensic: Destructuring in array reduce",
  "const arr = [[1, 2], [3, 4]]; arr.reduce(([a, b], acc) => a + b + acc, 0);",
  true,
  "integration"
);

runner.test(
  "Forensic: Destructuring with setTimeout",
  "setTimeout(([x, y]) => x + y, 100, [1, 2]);",
  true,
  "integration"
);

runner.test(
  "Forensic: Destructuring with object method",
  "const obj = {method: ([x]) => x}; obj.method([42]);",
  true,
  "integration"
);

runner.test(
  "Forensic: Destructuring in conditional expression",
  "const f = (arg) => (([a, b]) => a + b)(arg); f([1, 2]);",
  true,
  "integration"
);

// ============================================================================
// RUN TESTS
// ============================================================================

runner.run().then((success) => {
  process.exit(success ? 0 : 1);
});

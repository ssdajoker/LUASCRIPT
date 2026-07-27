/**
 * LUASCRIPT Phase 4 - Control Flow Pattern Destructuring
 * Forensic Edge Case Test Suite - 40 Advanced Tests
 * Professional Grade - CSC LM EVO-A Standard
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
          testPassed = hasErrors;
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
          const errorMsg = hasErrors
            ? parser.errors[0].message
            : "No AST generated";
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
  "Control Flow Pattern Destructuring - Forensic Edge Cases"
);

// ============================================================================
// CATEGORY 1: FOR-OF EDGE CASES (10 tests)
// ============================================================================

runner.test(
  "Forensic: For-of with null iterator (should error)",
  "for (const [x] of null) { x; }",
  false,
  "for_of_edges"
);

runner.test(
  "Forensic: For-of with undefined iterator (should error)",
  "for (const [x] of undefined) { x; }",
  false,
  "for_of_edges"
);

runner.test(
  "Forensic: For-of with string iteration",
  "for (const [ch] of [['h'], ['i']]) { ch; }",
  true,
  "for_of_edges"
);

runner.test(
  "Forensic: For-of with generator",
  "function* gen() { yield [1, 2]; yield [3, 4]; } for (const [a, b] of gen()) { a + b; }",
  true,
  "for_of_edges"
);

runner.test(
  "Forensic: For-of with Map entries",
  "const map = new Map([[['a', 'b'], 1]]); for (const [[k, v], val] of map.entries()) { k; }",
  true,
  "for_of_edges"
);

runner.test(
  "Forensic: For-of with Set",
  "const set = new Set([[1, 2], [3, 4]]); for (const [a, b] of set) { a + b; }",
  true,
  "for_of_edges"
);

runner.test(
  "Forensic: For-of with very large array",
  "const arr = Array(10000).fill([1, 2]); for (const [a, b] of arr) { a + b; }",
  true,
  "for_of_edges"
);

runner.test(
  "Forensic: For-of with pattern mismatch",
  "for (const [a, b, c] of [[1, 2]]) { a + (b || 0) + (c || 0); }",
  true,
  "for_of_edges"
);

runner.test(
  "Forensic: For-of with break in pattern",
  "let found = false; for (const [{id}] of [[{id: 0}], [{id: 1}]]) { if (id === 1) { found = true; break; } }",
  true,
  "for_of_edges"
);

runner.test(
  "Forensic: For-of with continue",
  "for (const [x, y] of [[1, 2], [3, 4], [5, 6]]) { if (x === 3) continue; x + y; }",
  true,
  "for_of_edges"
);

// ============================================================================
// CATEGORY 2: IF STATEMENT EDGE CASES (10 tests)
// ============================================================================

runner.test(
  "Forensic: If pattern with null (should error)",
  "if ([x] = null) { x; }",
  false,
  "if_pattern_edges"
);

runner.test(
  "Forensic: If pattern with undefined (should error)",
  "if ([x] = undefined) { x; }",
  false,
  "if_pattern_edges"
);

runner.test(
  "Forensic: If pattern with number (truthy/falsy)",
  "if ([x] = [0]) { 'truthy'; } else { 'falsy'; }",
  true,
  "if_pattern_edges"
);

runner.test(
  "Forensic: If pattern with empty array",
  "if ([x, y] = []) { 'yes'; } else { 'no'; }",
  true,
  "if_pattern_edges"
);

runner.test(
  "Forensic: If pattern with multiple assignments",
  "let a, b; if (([a, b] = [1, 2]) && a > 0 && b > 0) { a + b; }",
  true,
  "if_pattern_edges"
);

runner.test(
  "Forensic: If-else-if-else pattern chain",
  "let x; if (false) { 1; } else if (([x] = [10])) { x; } else if (false) { 2; } else { 3; }",
  true,
  "if_pattern_edges"
);

runner.test(
  "Forensic: If pattern with ternary in body",
  "if (({x} = {x: 5})) { x > 3 ? 'big' : 'small'; }",
  true,
  "if_pattern_edges"
);

runner.test(
  "Forensic: Nested if with patterns",
  "if (({a} = {a: {b: 1}})) { if (({b} = a)) { b; } }",
  true,
  "if_pattern_edges"
);

runner.test(
  "Forensic: If pattern with default values",
  "if (([x = 10] = [])) { x; }",
  true,
  "if_pattern_edges"
);

runner.test(
  "Forensic: If pattern with complex expression",
  "if (([a, b] = [1, 2].map(x => x * 2))) { a + b; }",
  true,
  "if_pattern_edges"
);

// ============================================================================
// CATEGORY 3: WHILE STATEMENT EDGE CASES (10 tests)
// ============================================================================

runner.test(
  "Forensic: While with pattern terminator",
  "let data = [[1, 2], null]; let i = 0; while (([a, b] = data[i++])) { a + b; }",
  true,
  "while_edges"
);

runner.test(
  "Forensic: While pattern with counter overflow",
  "let arr = Array(100).fill([1, 2]); let i = 0; while (i < arr.length && ([a, b] = arr[i++])) { a + b; }",
  true,
  "while_edges"
);

runner.test(
  "Forensic: While with falsy pattern values",
  "let data = [[0, false], [null, undefined], [[], {}]]; let i = 0; while (([a, b] = data[i++])) { a; }",
  true,
  "while_edges"
);

runner.test(
  "Forensic: While pattern with break condition",
  "let arr = [[1], [2], [3]]; let i = 0; while (([x] = arr[i++]) && i < 10) { if (x === 2) break; x; }",
  true,
  "while_edges"
);

runner.test(
  "Forensic: While pattern with continue",
  "let arr = [[1], [2], [3]]; let i = 0; while (([x] = arr[i++])) { if (x === 2) continue; x; }",
  true,
  "while_edges"
);

runner.test(
  "Forensic: While infinite with pattern (should be valid syntax)",
  "let count = 0; while (([x] = [1])) { if (++count > 5) break; x; }",
  true,
  "while_edges"
);

runner.test(
  "Forensic: While with nested objects pattern",
  "let data = [{user: {name: 'a'}}, null]; let i = 0; while (({user: {name}} = data[i++]) && name) { name; }",
  true,
  "while_edges"
);

runner.test(
  "Forensic: While with array unpacking and operations",
  "let arr = [[10, 5], [8, 2], [0, 0]]; let i = 0; while (([a, b] = arr[i++]) && a > 0) { a - b; }",
  true,
  "while_edges"
);

runner.test(
  "Forensic: While with pattern and mutation",
  "let data = [[1, 2]]; while (([x, y] = data.pop()) && x) { x + y; }",
  true,
  "while_edges"
);

runner.test(
  "Forensic: While pattern with multiple conditions",
  "let items = [[5], [4], [3]]; let i = 0; while (([val] = items[i++]) && val > 0 && i < 10) { val; }",
  true,
  "while_edges"
);

// ============================================================================
// CATEGORY 4: DO-WHILE AND NESTED PATTERNS (5 tests)
// ============================================================================

runner.test(
  "Forensic: Do-while with pattern",
  "let i = 0; do { const [x] = [1]; x; } while (++i < 3);",
  true,
  "do_while_nested"
);

runner.test(
  "Forensic: Nested for-of loops with patterns",
  "const matrix = [[[1, 2]], [[3, 4]]]; for (const [[a, b]] of matrix) { for (const c of [a, b]) { c; } }",
  true,
  "do_while_nested"
);

runner.test(
  "Forensic: For loop with pattern in condition",
  "for (let i = 0, data = [[1, 2]]; ([a, b] = data[i]) && i < 1; i++) { a + b; }",
  true,
  "do_while_nested"
);

runner.test(
  "Forensic: Try-catch with pattern",
  "try { for (const [x] of [[1]]) { x; } } catch ({message}) { message; }",
  true,
  "do_while_nested"
);

runner.test(
  "Forensic: Switch with pattern in multiple cases",
  "const data = [{id: 1}, {id: 2}]; switch (data[0]) { case {id}: case {id}: 1; break; }",
  true,
  "do_while_nested"
);

// ============================================================================
// CATEGORY 5: PERFORMANCE & SCALE (5 tests)
// ============================================================================

runner.test(
  "Forensic: For-of with 5000 element iteration",
  "const arr = Array(5000).fill([1, 2]); let count = 0; for (const [a, b] of arr) { count++; if (count === 5000) break; }",
  true,
  "performance"
);

runner.test(
  "Forensic: While with large data structure",
  "const data = Array(1000).fill([1, 2, 3, 4, 5]); let i = 0; while (i < data.length && ([a, b, c, d, e] = data[i++])) { a; }",
  true,
  "performance"
);

runner.test(
  "Forensic: Nested patterns deeply nested",
  "for (const [{user: {profile: {settings: {theme}}}}] of [[{user: {profile: {settings: {theme: 'dark'}}}}]]) { theme; }",
  true,
  "performance"
);

runner.test(
  "Forensic: Many patterns in single for-of",
  "const arr = Array(1000).fill([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); for (const [a, b, c, d, e, f, g, h, i, j] of arr) { a + j; }",
  true,
  "performance"
);

runner.test(
  "Forensic: Chained pattern matching",
  "for (const data of [[{x: 1}]]) { for (const [{x}] of data) { x; } }",
  true,
  "performance"
);

// ============================================================================
// CATEGORY 6: SPECIFICATION COMPLIANCE (5 tests)
// ============================================================================

runner.test(
  "Forensic: For-of with strict mode",
  "'use strict'; for (const [x] of [[1]]) { x; }",
  true,
  "spec_compliance"
);

runner.test(
  "Forensic: If pattern in strict mode",
  "'use strict'; if (([x] = [1])) { x; }",
  true,
  "spec_compliance"
);

runner.test(
  "Forensic: While pattern in strict mode",
  "'use strict'; let data = [[1]]; while (([x] = data.shift())) { x; }",
  true,
  "spec_compliance"
);

runner.test(
  "Forensic: Pattern with TDZ (Temporal Dead Zone)",
  "if (([x] = [1]) && x > 0) { const x = 'shadow'; x; }",
  true,
  "spec_compliance"
);

runner.test(
  "Forensic: For-of with async iteration",
  "async function test() { for await (const [x] of [[[1]]]) { x; } }",
  true,
  "spec_compliance"
);

// ============================================================================
// RUN TESTS
// ============================================================================

runner.run().then((success) => {
  process.exit(success ? 0 : 1);
});

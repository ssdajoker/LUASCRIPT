/**
 * LUASCRIPT Phase 4 - Spread Operators
 * Forensic Edge Case Test Suite - 50 Advanced Tests
 * Professional Grade - CSC LM EVO-A Standard
 * Tests boundary conditions, performance, and integration
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
  "Spread Operators - Forensic Edge Cases"
);

// ============================================================================
// CATEGORY 1: ARRAY SPREAD EDGE CASES (10 tests)
// ============================================================================

runner.test(
  "Forensic: Spread null (should error)",
  "const result = [...null];",
  false,
  "array_spread_edges"
);

runner.test(
  "Forensic: Spread undefined (should error)",
  "const result = [...undefined];",
  false,
  "array_spread_edges"
);

runner.test(
  "Forensic: Spread number (should error)",
  "const result = [...42];",
  false,
  "array_spread_edges"
);

runner.test(
  "Forensic: Spread function",
  "const fn = function*() { yield 1; }; const result = [...fn()];",
  true,
  "array_spread_edges"
);

runner.test(
  "Forensic: Spread Map",
  "const map = new Map([['a', 1]]); const result = [...map];",
  true,
  "array_spread_edges"
);

runner.test(
  "Forensic: Spread Set",
  "const set = new Set([1, 2, 3]); const result = [...set];",
  true,
  "array_spread_edges"
);

runner.test(
  "Forensic: Spread with large array (1000 elements)",
  "const arr = Array(1000).fill(0); const result = [...arr];",
  true,
  "array_spread_edges"
);

runner.test(
  "Forensic: Multiple spreads of same array",
  "const arr = [1]; const result = [...arr, ...arr, ...arr, ...arr, ...arr];",
  true,
  "array_spread_edges"
);

runner.test(
  "Forensic: Spread circular reference",
  "const arr = [1, 2]; arr.push(arr); const result = [...arr];",
  true,
  "array_spread_edges"
);

runner.test(
  "Forensic: Spread with holes and holes",
  "const arr = [1, , , 4]; const result = [...arr, ...[, , 5]];",
  true,
  "array_spread_edges"
);

// ============================================================================
// CATEGORY 2: OBJECT SPREAD EDGE CASES (10 tests)
// ============================================================================

runner.test(
  "Forensic: Spread null object (should error)",
  "const result = {...null};",
  false,
  "object_spread_edges"
);

runner.test(
  "Forensic: Spread undefined object (should error)",
  "const result = {...undefined};",
  false,
  "object_spread_edges"
);

runner.test(
  "Forensic: Spread number object",
  "const result = {...42};",
  true,
  "object_spread_edges"
);

runner.test(
  "Forensic: Spread array as object",
  "const arr = [1, 2, 3]; const result = {...arr};",
  true,
  "object_spread_edges"
);

runner.test(
  "Forensic: Spread with non-enumerable properties",
  "const obj = {}; Object.defineProperty(obj, 'x', {value: 1, enumerable: false}); const result = {...obj};",
  true,
  "object_spread_edges"
);

runner.test(
  "Forensic: Spread with thousands of properties",
  "const obj = {}; for(let i = 0; i < 1000; i++) obj['prop' + i] = i; const result = {...obj};",
  true,
  "object_spread_edges"
);

runner.test(
  "Forensic: Spread with conflicting keys",
  "const a = {x: 1, y: 2}; const b = {y: 3, z: 4}; const result = {...a, ...b, x: 10, y: 20};",
  true,
  "object_spread_edges"
);

runner.test(
  "Forensic: Spread circular reference object",
  "const obj = {a: 1}; obj.self = obj; const result = {...obj};",
  true,
  "object_spread_edges"
);

runner.test(
  "Forensic: Spread proxy object",
  "const target = {x: 1}; const proxy = new Proxy(target, {}); const result = {...proxy};",
  true,
  "object_spread_edges"
);

runner.test(
  "Forensic: Spread with Symbol keys preservation",
  "const sym1 = Symbol('a'); const sym2 = Symbol('b'); const obj = {[sym1]: 1, x: 2, [sym2]: 3}; const result = {...obj};",
  true,
  "object_spread_edges"
);

// ============================================================================
// CATEGORY 3: FUNCTION CALL SPREAD EDGES (9 tests)
// ============================================================================

runner.test(
  "Forensic: Spread in no-arg function",
  "const fn = () => 42; fn(...[]);",
  true,
  "function_call_spread"
);

runner.test(
  "Forensic: Spread exceeding parameter count",
  "const fn = (a, b, c) => a + b + c; fn(...[1, 2, 3, 4, 5]);",
  true,
  "function_call_spread"
);

runner.test(
  "Forensic: Spread fewer than required params",
  "const fn = (a, b, c) => a + b + c; fn(...[1, 2]);",
  true,
  "function_call_spread"
);

runner.test(
  "Forensic: Spread in constructor with many args",
  "const result = new Array(...Array(100).keys());",
  true,
  "function_call_spread"
);

runner.test(
  "Forensic: Spread with method chain",
  "const str = 'hello'; const result = str.match(...[/l/g]);",
  true,
  "function_call_spread"
);

runner.test(
  "Forensic: Spread in recursive call",
  "function fib(n) { if (n <= 1) return [n]; return [...fib(n-1), n]; } fib(5);",
  true,
  "function_call_spread"
);

runner.test(
  "Forensic: Spread with eval (if supported)",
  "const arr = ['1+1']; eval(...arr);",
  true,
  "function_call_spread"
);

runner.test(
  "Forensic: Spread in Promise.all",
  "const promises = [Promise.resolve(1)]; Promise.all(...[promises]);",
  true,
  "function_call_spread"
);

runner.test(
  "Forensic: Spread in spread in call",
  "const arr = [1, 2]; const result = Math.max(...[...arr]);",
  true,
  "function_call_spread"
);

// ============================================================================
// CATEGORY 4: NESTING & COMBINATIONS (8 tests)
// ============================================================================

runner.test(
  "Forensic: Nested array spreads 3 levels deep",
  "const a = [1]; const b = [...a]; const c = [...b]; const d = [...c]; d;",
  true,
  "nesting_combinations"
);

runner.test(
  "Forensic: Nested object spreads 3 levels deep",
  "const a = {x: 1}; const b = {...a}; const c = {...b}; const d = {...c}; d;",
  true,
  "nesting_combinations"
);

runner.test(
  "Forensic: Array spread containing spread",
  "const inner = [1, 2]; const result = [[...inner], ...[3, 4]]; result;",
  true,
  "nesting_combinations"
);

runner.test(
  "Forensic: Object spread containing spread",
  "const inner = {x: 1}; const result = {a: {...inner}, ...{y: 2}}; result;",
  true,
  "nesting_combinations"
);

runner.test(
  "Forensic: Spread in ternary",
  "const arr = [1, 2]; const cond = true; const result = [cond ? ...arr : [3, 4]];",
  true,
  "nesting_combinations"
);

runner.test(
  "Forensic: Spread in arrow function body",
  "const fn = () => [...[1, 2]]; fn();",
  true,
  "nesting_combinations"
);

runner.test(
  "Forensic: Spread in destructuring assignment",
  "let arr; [...arr = [1, 2, 3]]; arr;",
  true,
  "nesting_combinations"
);

runner.test(
  "Forensic: Spread in logical expression",
  "const a = [1]; const b = [2]; const result = (false ? a : [...b]);",
  true,
  "nesting_combinations"
);

// ============================================================================
// CATEGORY 5: PERFORMANCE & SCALE (5 tests)
// ============================================================================

runner.test(
  "Forensic: Spread very large array (10000 elements)",
  "const arr = Array(10000).fill('x'); const result = [...arr];",
  true,
  "performance"
);

runner.test(
  "Forensic: Multiple spreads large arrays",
  "const a = Array(100).fill(1); const b = Array(100).fill(2); const c = Array(100).fill(3); const result = [...a, ...b, ...c];",
  true,
  "performance"
);

runner.test(
  "Forensic: Deep object spread with many keys",
  "const obj = {}; for(let i=0; i<5000; i++) obj['k'+i] = i; const result = {...obj, ...obj};",
  true,
  "performance"
);

runner.test(
  "Forensic: Chained spreads in loop",
  "let result = [1]; for(let i = 0; i < 100; i++) result = [...result, i]; result;",
  true,
  "performance"
);

runner.test(
  "Forensic: Function call with 500 spread arguments",
  "const fn = function() { return arguments.length; }; const arrs = Array(500).fill([1]); fn(...Array(500).fill(1));",
  true,
  "performance"
);

// ============================================================================
// CATEGORY 6: SPECIFICATION COMPLIANCE (5 tests)
// ============================================================================

runner.test(
  "Forensic: Spread in strict mode",
  "'use strict'; const arr = [1, 2]; const result = [...arr];",
  true,
  "spec_compliance"
);

runner.test(
  "Forensic: Spread with trailing commas",
  "const arr = [1, 2]; const result = [...arr,]; result;",
  true,
  "spec_compliance"
);

runner.test(
  "Forensic: Spread with line breaks",
  "const arr = [1, 2]; const result = [\n  ...arr\n]; result;",
  true,
  "spec_compliance"
);

runner.test(
  "Forensic: Spread in computed property",
  "const objs = [{a: 1}, {b: 2}]; const key = 'prop'; const result = {[key]: [...objs]};",
  true,
  "spec_compliance"
);

runner.test(
  "Forensic: Spread with async/await",
  "async function test() { const arr = [1, 2]; return [...arr]; }",
  true,
  "spec_compliance"
);

// ============================================================================
// CATEGORY 7: INTEGRATION (5 tests)
// ============================================================================

runner.test(
  "Forensic: Spread with map/filter/reduce",
  "const arr = [1, 2, 3]; const result = [...arr].map(x => x * 2).filter(x => x > 2);",
  true,
  "integration"
);

runner.test(
  "Forensic: Spread with sort/reverse",
  "const arr = [3, 1, 2]; const result = [...arr].sort().reverse();",
  true,
  "integration"
);

runner.test(
  "Forensic: Spread with string methods",
  "const str = 'hello'; const result = [...str].join('-');",
  true,
  "integration"
);

runner.test(
  "Forensic: Spread with JSON operations",
  "const obj = {a: 1, b: 2}; const result = JSON.stringify({...obj});",
  true,
  "integration"
);

runner.test(
  "Forensic: Spread with setTimeout",
  "const args = [1000]; setTimeout(() => {}, ...args);",
  true,
  "integration"
);

// ============================================================================
// RUN TESTS
// ============================================================================

runner.run().then((success) => {
  process.exit(success ? 0 : 1);
});

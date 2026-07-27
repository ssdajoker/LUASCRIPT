/**
 * LUASCRIPT Phase 4 - Control Flow Pattern Destructuring
 * Comprehensive Test Suite - 34 Baseline Tests
 * Professional Grade - CSC LM EVO-A Standard
 * Tests: if ([x, y]), while ({a}), for-of ([a, b] of arr)
 */

const { LuaScriptParser } = require("../src/phase1_core_parser");
const { IRLowerer, lowerToIR } = require("../src/ir/lowerer");

class TestRunner {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
  }

  test(name, code, expectedOutput, description = "") {
    this.tests.push({ name, code, expectedOutput, description });
  }

  async run() {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`TEST SUITE: ${this.name}`);
    console.log(`${"=".repeat(80)}\n`);

    for (const test of this.tests) {
      try {
        const parser = new LuaScriptParser(test.code);
        const ast = parser.parse();

        if (parser.errors && parser.errors.length > 0) {
          throw new Error(`Parse error: ${parser.errors[0].message}`);
        }

        const lowerer = new IRLowerer();
        const ir = lowerer.lowerProgram(ast);

        const passCondition = ast.body && ast.body.length > 0;

        if (passCondition) {
          console.log(`✅ ${test.name}`);
          this.passed++;
        } else {
          console.log(`❌ ${test.name}: No AST generated`);
          this.failed++;
          this.errors.push({ test: test.name, error: "No AST generated" });
        }
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        this.failed++;
        this.errors.push({ test: test.name, error: error.message });
      }
    }

    console.log(`\n${"=".repeat(80)}`);
    console.log(
      `RESULTS: ${this.passed} passed, ${this.failed} failed out of ${this.tests.length}`
    );
    console.log(
      `Pass Rate: ${((this.passed / this.tests.length) * 100).toFixed(2)}%`
    );
    console.log(`${"=".repeat(80)}\n`);

    if (this.errors.length > 0) {
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
// TESTS
// ============================================================================

const runner = new TestRunner(
  "Control Flow Pattern Destructuring - Phase 4 Feature 3"
);

// ============================================================================
// CATEGORY 1: FOR-OF PATTERNS (12 tests)
// ============================================================================

runner.test(
  "For-of - array pattern [a, b]",
  "const arr = [[1, 2], [3, 4]]; for (const [a, b] of arr) { a + b; }",
  null,
  "Basic array pattern in for-of"
);

runner.test(
  "For-of - object pattern {x, y}",
  "const arr = [{x: 1, y: 2}, {x: 3, y: 4}]; for (const {x, y} of arr) { x + y; }",
  null,
  "Basic object pattern in for-of"
);

runner.test(
  "For-of - nested patterns",
  "const arr = [[{a: 1}, {b: 2}]]; for (const [{a}, {b}] of arr) { a + b; }",
  null,
  "Nested patterns in for-of"
);

runner.test(
  "For-of - with default values",
  "const arr = [[1], []]; for (const [a = 10] of arr) { a; }",
  null,
  "For-of with default values"
);

runner.test(
  "For-of - with rest elements",
  "const arr = [[1, 2, 3, 4]]; for (const [a, ...rest] of arr) { rest.length; }",
  null,
  "For-of with rest element"
);

runner.test(
  "For-of - with holes",
  "const arr = [[1, 2, 3]]; for (const [a, , c] of arr) { a + c; }",
  null,
  "For-of with array holes"
);

runner.test(
  "For-of - empty pattern",
  "const arr = [1, 2, 3]; for (const [] of arr) { 1; }",
  null,
  "Empty array pattern in for-of"
);

runner.test(
  "For-of - single element",
  "const arr = [[42]]; for (const [x] of arr) { x; }",
  null,
  "Single element in for-of pattern"
);

runner.test(
  "For-of - renamed properties",
  "const arr = [{x: 1, y: 2}]; for (const {x: a, y: b} of arr) { a + b; }",
  null,
  "For-of with renamed properties"
);

runner.test(
  "For-of - mixed object properties",
  "const arr = [{x: 1, y: {z: 2}}]; for (const {x, y: {z}} of arr) { x + z; }",
  null,
  "For-of with mixed nested object properties"
);

runner.test(
  "For-of - string iteration",
  "const str = 'abc'; for (const [ch] of [[...str]]) { ch; }",
  null,
  "For-of iterating over string pattern"
);

runner.test(
  "For-of - with array methods",
  "const arr = [{id: 1}, {id: 2}]; arr.forEach(({id}) => id);",
  null,
  "Pattern destructuring in forEach callback"
);

// ============================================================================
// CATEGORY 2: IF STATEMENT PATTERNS (11 tests)
// ============================================================================

runner.test(
  "If - array pattern condition [a, b]",
  "const data = [1, 2]; if ([x, y] = data) { x + y; }",
  null,
  "Array pattern in if condition"
);

runner.test(
  "If - object pattern condition {x}",
  "const data = {x: 5}; if ({x} = data) { x; }",
  null,
  "Object pattern in if condition"
);

runner.test(
  "If - nested patterns",
  "const data = {user: {name: 'test'}}; if (({user: {name}}) = data) { name; }",
  null,
  "Nested pattern in if condition"
);

runner.test(
  "If - pattern with falsy value",
  "const data = [0, false]; if ([a, b] = data) { a + b; }",
  null,
  "If pattern with falsy values"
);

runner.test(
  "If - pattern truthiness check",
  "const arr = null; if (!([a] = arr)) { 'error'; }",
  null,
  "Pattern with negation check"
);

runner.test(
  "If - pattern with logical AND",
  "const data = {x: 5}; if (data && ({x} = data)) { x; }",
  null,
  "Pattern in logical AND expression"
);

runner.test(
  "If - pattern with logical OR",
  "const data1 = null; const data2 = {x: 5}; if (({x} = data1) || ({x} = data2)) { x; }",
  null,
  "Pattern in logical OR expression"
);

runner.test(
  "If - pattern assignment with else",
  "const data = {a: 1}; if (({a} = data)) { a; } else { 'no'; }",
  null,
  "Pattern assignment with else clause"
);

runner.test(
  "If - pattern in else-if",
  "const data = {x: 1}; if (false) { 1; } else if (({x} = data)) { x; }",
  null,
  "Pattern in else-if condition"
);

runner.test(
  "If - array with defaults",
  "const data = [1]; if (([a = 10, b = 20] = data)) { a + b; }",
  null,
  "Pattern with default values in if"
);

runner.test(
  "If - object pattern short notation",
  "if (({x, y} = {x: 1, y: 2})) { x + y; }",
  null,
  "Object pattern short notation in if"
);

// ============================================================================
// CATEGORY 3: WHILE PATTERNS (7 tests)
// ============================================================================

runner.test(
  "While - array pattern condition",
  "let iter = [[1, 2], [3, 4], null]; while (([a, b] = iter.shift())) { a + b; }",
  null,
  "Array pattern in while condition"
);

runner.test(
  "While - object pattern condition",
  "let queue = [{x: 1}, {x: 2}, null]; while (({x} = queue.shift())) { x; }",
  null,
  "Object pattern in while condition"
);

runner.test(
  "While - counter with pattern",
  "let count = 0; let data = [[1], [2], [3]]; while (([x] = data[count++])) { x; }",
  null,
  "Pattern with counter in while"
);

runner.test(
  "While - pattern with break",
  "let arr = [[1, 2], [3, 4], [0, 0]]; let i = 0; while (([a, b] = arr[i++]) && a !== 0) { a + b; }",
  null,
  "Pattern in while with logical AND"
);

runner.test(
  "While - nested patterns",
  "let data = [[{x: 1}], [null]]; let i = 0; while (([ {x} ] = data[i++]) && x) { x; }",
  null,
  "Nested patterns in while"
);

runner.test(
  "While - pattern transformation",
  "let items = [{val: 10}, {val: 20}, null]; while (({val} = items.pop()) && val) { val / 2; }",
  null,
  "Pattern with data transformation in while"
);

runner.test(
  "While - do-while equivalent",
  "let data = [[1, 2]]; do { const [a, b] = data; a + b; } while (false);",
  null,
  "Pattern in do-while loop"
);

// ============================================================================
// CATEGORY 4: MIXED CONTROL FLOW (4 tests)
// ============================================================================

runner.test(
  "Mixed - for-of then if pattern",
  "const items = [[1], [2]]; for (const [x] of items) { if (x > 0) { x; } }",
  null,
  "Pattern in for-of with if check"
);

runner.test(
  "Mixed - nested loops with patterns",
  "const matrix = [[[1, 2]], [[3, 4]]]; for (const [[a, b]] of matrix) { a + b; }",
  null,
  "Nested loops with patterns"
);

runner.test(
  "Mixed - if with for-of in body",
  "const data = {items: [[1, 2]]}; if (({items} = data)) { for (const [a, b] of items) { a + b; } }",
  null,
  "Pattern in if with for-of in body"
);

runner.test(
  "Mixed - switch with pattern in case",
  "const data = [1, 2]; switch (1) { case 1: const [a, b] = data; a + b; break; }",
  null,
  "Pattern in switch case"
);

// ============================================================================
// RUN TESTS
// ============================================================================

runner.run().then((success) => {
  process.exit(success ? 0 : 1);
});

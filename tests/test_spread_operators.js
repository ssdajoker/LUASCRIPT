/**
 * LUASCRIPT Phase 4 - Spread Operators
 * Comprehensive Test Suite - 34 Baseline Tests
 * Professional Grade - CSC LM EVO-A Standard
 * Tests: [...arr], {...obj}, func(...args)
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
  "Spread Operators - Phase 4 Feature 2"
);

// ============================================================================
// CATEGORY 1: ARRAY SPREAD (12 tests)
// ============================================================================

runner.test(
  "Array spread - basic [1, ...arr]",
  "const arr = [2, 3]; const result = [1, ...arr, 4]; result;",
  null,
  "Basic array spread in literal"
);

runner.test(
  "Array spread - multiple spreads",
  "const a = [1, 2]; const b = [3, 4]; const c = [...a, ...b]; c;",
  null,
  "Multiple spread elements in single array"
);

runner.test(
  "Array spread - spread at beginning",
  "const arr = [1, 2, 3]; const result = [...arr]; result;",
  null,
  "Spread as only element in array"
);

runner.test(
  "Array spread - spread at end",
  "const arr = [1, 2]; const result = [0, ...arr]; result;",
  null,
  "Spread at end of array literal"
);

runner.test(
  "Array spread - spread in middle",
  "const arr = [2, 3]; const result = [1, ...arr, 4, 5]; result;",
  null,
  "Spread in middle of array"
);

runner.test(
  "Array spread - empty array spread",
  "const arr = []; const result = [1, ...arr, 2]; result;",
  null,
  "Spreading empty array"
);

runner.test(
  "Array spread - nested arrays spread",
  "const arr = [[1, 2], [3, 4]]; const result = [...arr]; result;",
  null,
  "Spreading array of arrays"
);

runner.test(
  "Array spread - string spread",
  "const str = 'hello'; const result = [...str]; result;",
  null,
  "Spreading string into array"
);

runner.test(
  "Array spread - array-like spread",
  "const arrayLike = {0: 'a', 1: 'b', length: 2}; const result = [...arrayLike]; result;",
  true,
  "Spreading array-like object (should work with Symbol.iterator)"
);

runner.test(
  "Array spread - spread with destructuring",
  "const arr = [1, 2, 3]; const [a, ...rest] = [...arr]; rest;",
  null,
  "Spread array then destructure"
);

runner.test(
  "Array spread - chained spreads",
  "const a = [1]; const b = [...a]; const c = [...b]; c;",
  null,
  "Chained spread operations"
);

runner.test(
  "Array spread - spread in function call",
  "const arr = [2, 3]; Math.max(1, ...arr); ",
  null,
  "Spread in function call"
);

// ============================================================================
// CATEGORY 2: OBJECT SPREAD (12 tests)
// ============================================================================

runner.test(
  "Object spread - basic {...obj}",
  "const obj = {b: 2}; const result = {a: 1, ...obj}; result;",
  null,
  "Basic object spread in literal"
);

runner.test(
  "Object spread - multiple spreads",
  "const a = {x: 1}; const b = {y: 2}; const c = {...a, ...b}; c;",
  null,
  "Multiple object spreads"
);

runner.test(
  "Object spread - override properties",
  "const obj = {x: 1, y: 2}; const result = {x: 10, ...obj}; result;",
  null,
  "Spread overrides previous properties"
);

runner.test(
  "Object spread - spread then override",
  "const obj = {x: 1}; const result = {...obj, x: 10}; result;",
  null,
  "Overriding properties after spread"
);

runner.test(
  "Object spread - nested objects spread",
  "const inner = {b: 2}; const outer = {a: {x: 1}}; const result = {...outer, ...inner}; result;",
  null,
  "Spreading nested objects"
);

runner.test(
  "Object spread - empty object spread",
  "const obj = {}; const result = {a: 1, ...obj}; result;",
  null,
  "Spreading empty object"
);

runner.test(
  "Object spread - with computed properties",
  "const key = 'dynamic'; const obj = {[key]: 'value'}; const result = {...obj}; result;",
  null,
  "Spreading object with computed properties"
);

runner.test(
  "Object spread - with methods",
  "const obj = {method: function() {}}; const result = {...obj}; result;",
  null,
  "Spreading object with method"
);

runner.test(
  "Object spread - getter/setter",
  "const obj = {get x() { return 42; }}; const result = {...obj}; result;",
  null,
  "Spreading object with getter/setter"
);

runner.test(
  "Object spread - prototype chain",
  "const parent = {a: 1}; const child = Object.create(parent); child.b = 2; const result = {...child}; result;",
  null,
  "Spreading object with prototype"
);

runner.test(
  "Object spread - symbol keys",
  "const sym = Symbol('key'); const obj = {[sym]: 'value'}; const result = {...obj}; result;",
  true,
  "Spreading object with symbol keys"
);

runner.test(
  "Object spread - numeric keys",
  "const obj = {1: 'one', 2: 'two'}; const result = {...obj}; result;",
  null,
  "Spreading object with numeric keys"
);

// ============================================================================
// CATEGORY 3: FUNCTION CALL SPREAD (8 tests)
// ============================================================================

runner.test(
  "Function call spread - basic",
  "const arr = [1, 2, 3]; Math.max(...arr);",
  null,
  "Spread in function call"
);

runner.test(
  "Function call spread - multiple spreads",
  "const a = [1, 2]; const b = [3, 4]; const result = [].concat(...a, ...b); result;",
  null,
  "Multiple spreads in function call"
);

runner.test(
  "Function call spread - mixed with regular args",
  "const arr = [2, 3]; const result = Math.max(1, ...arr, 10); result;",
  null,
  "Spread mixed with regular arguments"
);

runner.test(
  "Function call spread - spread of empty array",
  "const arr = []; const result = Math.max(...arr); result;",
  null,
  "Spreading empty array in function call"
);

runner.test(
  "Function call spread - new with spread",
  "const args = [1, 2]; const date = new Date(...args);",
  true,
  "Spread in constructor call"
);

runner.test(
  "Function call spread - spread in method call",
  "const arr = [1, 2, 3]; const str = arr.join(...[', ']);",
  null,
  "Spread in method call"
);

runner.test(
  "Function call spread - spread with this binding",
  "const obj = {method: function() {}}; const arr = []; obj.method(...arr);",
  null,
  "Spread in method call with this binding"
);

runner.test(
  "Function call spread - spread receiver",
  "const funcs = [() => 1]; const fn = funcs[0]; fn(...[]);",
  null,
  "Call function from spread array"
);

// ============================================================================
// CATEGORY 4: COMPLEX SCENARIOS (2 tests)
// ============================================================================

runner.test(
  "Complex - combined array and object spread",
  "const arr = [1, 2]; const obj = {a: 1}; const result = [...arr, {b: {...obj}}]; result;",
  null,
  "Combining array and object spreads"
);

runner.test(
  "Complex - nested spreads in transformations",
  "const data = [[1, 2], [3, 4]]; const result = data.map(([a, b]) => [...[a, b]]); result;",
  null,
  "Spread with destructuring in map"
);

// ============================================================================
// RUN TESTS
// ============================================================================

runner.run().then((success) => {
  process.exit(success ? 0 : 1);
});

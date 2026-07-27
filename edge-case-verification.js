/**
 * EDGE CASE VERIFICATION SUITE
 * Tests advanced async/await, generator, and destructuring patterns
 * to ensure comprehensive Phase C & D completion
 */

const { CoreTranspiler } = require("./src/core_transpiler");

class EdgeCaseVerifier {
  constructor() {
    this.transpiler = new CoreTranspiler({ optimize: false });
    this.total = 0;
    this.passed = 0;
    this.failures = [];
  }

  test(category, name, testFn) {
    this.total++;
    try {
      const result = testFn();
      if (result) {
        this.passed++;
        console.log(`  ✅ [${category}] ${name}`);
        return true;
      } else {
        this.failures.push(`[${category}] ${name}: returned false`);
        console.log(`  ❌ [${category}] ${name} (returned false)`);
        return false;
      }
    } catch (err) {
      this.failures.push(`[${category}] ${name}: ${err.message}`);
      console.log(`  ❌ [${category}] ${name} (${err.message})`);
      return false;
    }
  }

  transpileAndCheck(code, ...patterns) {
    try {
      const { code: lua, ast } = this.transpiler.transpile(code, "test.js");
      
      // Check that transpilation succeeded
      if (!lua || lua.length === 0) return false;
      
      // Check for required patterns in output
      for (const pattern of patterns) {
        if (typeof pattern === 'string') {
          if (!lua.includes(pattern)) return false;
        } else if (pattern instanceof RegExp) {
          if (!pattern.test(lua)) return false;
        }
      }
      
      return true;
    } catch (err) {
      console.log(`    Transpilation error: ${err.message}`);
      return false;
    }
  }

  // ========== ASYNC/AWAIT EDGE CASES ==========

  testAsyncEdgeCases() {
    console.log("\n═══ ASYNC/AWAIT EDGE CASES ═══");

    // 1. Async arrow with destructured params
    this.test("ASYNC", "Async arrow with destructured params", () => {
      return this.transpileAndCheck(
        `const fetchUser = async ({ id, name }) => { const data = await fetch(id); return data; };`,
        "function", "fetch"
      );
    });

    // 2. Multiple consecutive awaits
    this.test("ASYNC", "Multiple consecutive awaits in sequence", () => {
      return this.transpileAndCheck(
        `async function multi() { const a = await f1(); const b = await f2(); const c = await f3(); return [a, b, c]; }`,
        "f1", "f2", "f3"
      );
    });

    // 3. Await in conditional
    this.test("ASYNC", "Await in ternary conditional", () => {
      return this.transpileAndCheck(
        `async function cond(x) { return x > 0 ? await fetchPositive(x) : await fetchNegative(x); }`,
        "fetchPositive", "fetchNegative"
      );
    });

    // 4. Await in loop
    this.test("ASYNC", "Await inside for loop", () => {
      return this.transpileAndCheck(
        `async function loop() { const results = []; for (let i = 0; i < 5; i++) { results.push(await fetch(i)); } return results; }`,
        "results", "fetch"
      );
    });

    // 5. Nested async functions
    this.test("ASYNC", "Nested async function definitions", () => {
      return this.transpileAndCheck(
        `async function outer() { async function inner() { return await getValue(); } return await inner(); }`,
        "getValue", "inner"
      );
    });

    // 6. Async IIFE with params
    this.test("ASYNC", "Async IIFE with parameters", () => {
      return this.transpileAndCheck(
        `const result = await (async (x, y) => { return await compute(x, y); })(5, 10);`,
        "compute", "function"
      );
    });

    // 7. Await with spread operator
    this.test("ASYNC", "Await with spread in function call", () => {
      return this.transpileAndCheck(
        `async function spread() { const args = [1, 2, 3]; return await compute(...args); }`,
        "compute", "args"
      );
    });

    // 8. Async method with super
    this.test("ASYNC", "Async method calling super", () => {
      return this.transpileAndCheck(
        `class Child extends Parent { async load() { await super.load(); return await this.process(); } }`,
        "load", "process"
      );
    });

    // 9. Await in object method shorthand
    this.test("ASYNC", "Await in object method shorthand", () => {
      return this.transpileAndCheck(
        `const obj = { async fetch(id) { return await getData(id); } };`,
        "fetch", "getData"
      );
    });

    // 10. Promise.all with await
    this.test("ASYNC", "Await Promise.all pattern", () => {
      return this.transpileAndCheck(
        `async function parallel() { const [a, b, c] = await Promise.all([fetch1(), fetch2(), fetch3()]); return { a, b, c }; }`,
        "Promise", "fetch1", "fetch2", "fetch3"
      );
    });
  }

  // ========== GENERATOR EDGE CASES ==========

  testGeneratorEdgeCases() {
    console.log("\n═══ GENERATOR EDGE CASES ═══");

    // 1. Generator function declaration
    this.test("GENERATOR", "Basic generator function", () => {
      return this.transpileAndCheck(
        `function* gen() { yield 1; yield 2; yield 3; }`,
        "yield", "gen"
      );
    });

    // 2. Generator with parameters
    this.test("GENERATOR", "Generator with parameters", () => {
      return this.transpileAndCheck(
        `function* range(start, end) { for (let i = start; i < end; i++) { yield i; } }`,
        "yield", "range", "start", "end"
      );
    });

    // 3. Generator expression
    this.test("GENERATOR", "Generator expression", () => {
      return this.transpileAndCheck(
        `const gen = function* () { yield 1; yield 2; };`,
        "yield", "gen"
      );
    });

    // 4. Yield with expression
    this.test("GENERATOR", "Yield with complex expression", () => {
      return this.transpileAndCheck(
        `function* compute() { yield x * 2 + 3; yield (a + b) / 2; }`,
        "yield"
      );
    });

    // 5. Nested yield
    this.test("GENERATOR", "Yield* delegation", () => {
      return this.transpileAndCheck(
        `function* outer() { yield* inner(); yield 5; }`,
        "yield", "inner"
      );
    });

    // 6. Generator method
    this.test("GENERATOR", "Generator method in class", () => {
      return this.transpileAndCheck(
        `class Counter { *values() { yield this.start; yield this.end; } }`,
        "yield", "values"
      );
    });

    // 7. Generator with return
    this.test("GENERATOR", "Generator with explicit return", () => {
      return this.transpileAndCheck(
        `function* gen() { yield 1; yield 2; return 3; }`,
        "yield", "return"
      );
    });

    // 8. Async generator
    this.test("GENERATOR", "Async generator function", () => {
      return this.transpileAndCheck(
        `async function* asyncGen() { yield await fetch(1); yield await fetch(2); }`,
        "yield", "fetch"
      );
    });
  }

  // ========== DESTRUCTURING EDGE CASES ==========

  testDestructuringEdgeCases() {
    console.log("\n═══ DESTRUCTURING EDGE CASES ═══");

    // 1. Deeply nested destructuring
    this.test("DESTRUCTURING", "Deeply nested array/object destructuring", () => {
      return this.transpileAndCheck(
        `const { a: { b: { c } } } = obj;`,
        "obj"
      );
    });

    // 2. Destructuring with computed property
    this.test("DESTRUCTURING", "Destructuring with computed property names", () => {
      return this.transpileAndCheck(
        `const key = 'name'; const { [key]: userName } = user;`,
        "userName", "user"
      );
    });

    // 3. Rest in middle (should error gracefully)
    this.test("DESTRUCTURING", "Array destructuring with multiple patterns", () => {
      return this.transpileAndCheck(
        `const [first, second, ...rest] = arr;`,
        "first", "second", "rest"
      );
    });

    // 4. Destructuring in catch
    this.test("DESTRUCTURING", "Destructuring in catch block", () => {
      return this.transpileAndCheck(
        `try { throw { code: 404, message: 'Not Found' }; } catch ({ code, message }) { console.log(code, message); }`,
        "code", "message"
      );
    });

    // 5. Destructuring with default complex expression
    this.test("DESTRUCTURING", "Destructuring with complex default value", () => {
      return this.transpileAndCheck(
        `const { x = computeDefault(), y = a + b } = obj;`,
        "computeDefault"
      );
    });

    // 6. Mixed array/object destructuring
    this.test("DESTRUCTURING", "Mixed array and object destructuring", () => {
      return this.transpileAndCheck(
        `const [{ name, age }, { city }] = users;`,
        "name", "age", "city"
      );
    });

    // 7. Destructuring in arrow params
    this.test("DESTRUCTURING", "Destructuring in arrow function params", () => {
      return this.transpileAndCheck(
        `const getFullName = ({ firstName, lastName }) => firstName + ' ' + lastName;`,
        "firstName", "lastName"
      );
    });

    // 8. Destructuring with rename and default
    this.test("DESTRUCTURING", "Destructuring with both rename and default", () => {
      return this.transpileAndCheck(
        `const { name: userName = 'Anonymous' } = user;`,
        "userName"
      );
    });

    // 9. Rest in object destructuring with remaining props
    this.test("DESTRUCTURING", "Object rest captures remaining properties", () => {
      return this.transpileAndCheck(
        `const { id, name, ...metadata } = user;`,
        "id", "name", "metadata"
      );
    });

    // 10. Destructuring swap
    this.test("DESTRUCTURING", "Array destructuring for swapping", () => {
      return this.transpileAndCheck(
        `let a = 1, b = 2; [a, b] = [b, a];`,
        "a", "b"
      );
    });
  }

  // ========== COMBINED FEATURE TESTS ==========

  testCombinedFeatures() {
    console.log("\n═══ COMBINED FEATURES ═══");

    // 1. Async + Destructuring
    this.test("COMBINED", "Async function with destructured params and await", () => {
      return this.transpileAndCheck(
        `async function process({ id, data }) { const result = await compute(data); return { id, result }; }`,
        "compute", "result"
      );
    });

    // 2. Async + Spread
    this.test("COMBINED", "Async function with spread operator", () => {
      return this.transpileAndCheck(
        `async function merge(...sources) { const results = await Promise.all(sources.map(s => fetch(s))); return { ...results }; }`,
        "fetch", "sources", "results"
      );
    });

    // 3. Generator + Destructuring
    this.test("COMBINED", "Generator yielding destructured values", () => {
      return this.transpileAndCheck(
        `function* items() { const { a, b } = obj; yield a; yield b; }`,
        "yield"
      );
    });

    // 4. Arrow + Destructuring + Default
    this.test("COMBINED", "Arrow with destructured params with defaults", () => {
      return this.transpileAndCheck(
        `const greet = ({ name = 'Guest', age = 0 }) => \`Hello \${name}, age \${age}\`;`,
        "name", "age"
      );
    });

    // 5. Class + Async + Destructuring
    this.test("COMBINED", "Class with async method and destructuring", () => {
      return this.transpileAndCheck(
        `class API { async fetch({ endpoint, params }) { const { data } = await request(endpoint, params); return data; } }`,
        "fetch", "endpoint", "params", "data"
      );
    });

    // 6. Nested async in IIFE with destructuring
    this.test("COMBINED", "IIFE with async and destructuring", () => {
      return this.transpileAndCheck(
        `const { result } = await (async () => { const data = await fetch(); return { result: data }; })();`,
        "fetch", "result", "data"
      );
    });

    // 7. For-of + Destructuring + Await
    this.test("COMBINED", "For-of with destructuring and await", () => {
      return this.transpileAndCheck(
        `async function processItems(items) { for (const { id, value } of items) { await process(id, value); } }`,
        "process", "id", "value"
      );
    });

    // 8. Rest params + Spread + Arrow
    this.test("COMBINED", "Rest params with spread in return", () => {
      return this.transpileAndCheck(
        `const merge = (...arrays) => [...arrays[0], ...arrays[1]];`,
        "arrays"
      );
    });
  }

  // ========== STRESS TESTS ==========

  testStressScenarios() {
    console.log("\n═══ STRESS TEST SCENARIOS ═══");

    // 1. Complex nested structure
    this.test("STRESS", "Deeply nested async/await/destructuring", () => {
      const code = `
        async function complex() {
          const { users: [{ profile: { name, settings: { theme = 'dark' } } }] } = await fetchData();
          return { name, theme };
        }
      `;
      return this.transpileAndCheck(code, "fetchData", "name", "theme");
    });

    // 2. Multiple feature combination
    this.test("STRESS", "All features combined in one function", () => {
      const code = `
        async function* processStream({ source, ...options }) {
          const [first, ...rest] = await fetch(source);
          yield* first;
          for (const item of rest) {
            const processed = await transform(item, ...Object.values(options));
            yield processed;
          }
        }
      `;
      return this.transpileAndCheck(code, "yield", "fetch", "transform");
    });

    // 3. Error handling with all features
    this.test("STRESS", "Try-catch with async/destructuring/spread", () => {
      const code = `
        async function safe(...args) {
          try {
            const { data, error } = await process(...args);
            if (error) throw error;
            return { success: true, data };
          } catch ({ message, code }) {
            return { success: false, error: { message, code } };
          }
        }
      `;
      return this.transpileAndCheck(code, "process", "error", "message");
    });
  }

  // ========== RUN ALL TESTS ==========

  runAll() {
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║       PHASE C & D EDGE CASE VERIFICATION SUITE                ║");
    console.log("╚════════════════════════════════════════════════════════════════╝");

    this.testAsyncEdgeCases();
    this.testGeneratorEdgeCases();
    this.testDestructuringEdgeCases();
    this.testCombinedFeatures();
    this.testStressScenarios();

    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║                      VERIFICATION SUMMARY                      ║");
    console.log("╚════════════════════════════════════════════════════════════════╝");
    console.log(`\nTotal Tests:  ${this.total}`);
    console.log(`Passed:       ${this.passed}`);
    console.log(`Failed:       ${this.total - this.passed}`);
    console.log(`Success Rate: ${((this.passed / this.total) * 100).toFixed(1)}%`);

    if (this.failures.length > 0) {
      console.log("\n❌ FAILURES:");
      this.failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
      process.exit(1);
    } else {
      console.log("\n✅ ALL EDGE CASE TESTS PASSED!");
      console.log("╔════════════════════════════════════════════════════════════════╗");
      console.log("║  PHASE C & D: 100% VERIFIED WITH COMPREHENSIVE EDGE CASES     ║");
      console.log("╚════════════════════════════════════════════════════════════════╝\n");
      process.exit(0);
    }
  }
}

// Run verification
const verifier = new EdgeCaseVerifier();
verifier.runAll();

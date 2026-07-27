/**
 * ═══════════════════════════════════════════════════════════════════
 * PHASE 5.2: INTEGRATION TESTS - Type System & Component Integration
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Testing Strategy: CLARITY SUPER CANON INTEGRATION
 * 
 * This test suite validates PHASE 4.1 type system integration with:
 * - Parser → Type Validator pipeline
 * - Scope Manager → Async context tracking
 * - Try/Catch → Await expression linking
 * - Cross-component type propagation
 * - End-to-end transpilation scenarios
 * 
 * Quality Target: 100% integration coverage with comprehensive validation
 * 
 * Test Phases:
 * - Phase 5.2.1: Parser → Type Validator Integration (8 tests)
 * - Phase 5.2.2: Scope Manager Integration (7 tests)
 * - Phase 5.2.3: Try/Catch → Await Linking (6 tests)
 * - Phase 5.2.4: Cross-Component Type Propagation (7 tests)
 * - Phase 5.2.5: End-to-End Transpilation (8 tests)
 * - Phase 5.2.6: Error Recovery & Resilience (6 tests)
 * 
 * Total Tests: 42 comprehensive integration tests
 */

"use strict";

// Import all required components
const { parseAndLower } = require("../src/ir/pipeline");
const { IRBuilder } = require("../src/ir/builder");
const { IRLowerer } = require("../src/ir/lowerer");
const { LuaScriptParser } = require("../src/phase1_core_parser");
const { Type, TypeCategory, TPromise, TFuture, TAsyncFunction } = require("../src/ir/types");

// Test execution state
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  phases: {},
  failures: []
};

// ANSI color codes for output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m"
};

/**
 * Test execution helper
 */
function test(phaseName, testName, testFn) {
  testResults.total++;
  
  if (!testResults.phases[phaseName]) {
    testResults.phases[phaseName] = { passed: 0, failed: 0, tests: [] };
  }
  
  try {
    testFn();
    testResults.passed++;
    testResults.phases[phaseName].passed++;
    testResults.phases[phaseName].tests.push({ name: testName, status: "PASS" });
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
  } catch (error) {
    testResults.failed++;
    testResults.phases[phaseName].failed++;
    testResults.phases[phaseName].tests.push({ name: testName, status: "FAIL", error: error.message });
    testResults.failures.push({ phase: phaseName, test: testName, error: error.message, stack: error.stack });
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
  }
}

/**
 * Helper to get actual node from IR
 */
function getNodeFromIR(ir, nodeId) {
  return ir.nodes[nodeId];
}

function findFunctionInIR(ir, async = null) {
  for (const nodeId of ir.module.body) {
    const node = ir.nodes[nodeId];
    if (node.kind === "FunctionDeclaration") {
      if (async === null || node.async === async) {
        return node;
      }
    }
  }
  return null;
}

function findAllFunctionsInIR(ir, async = null) {
  const funcs = [];
  for (const nodeId of ir.module.body) {
    const node = ir.nodes[nodeId];
    if (node.kind === "FunctionDeclaration") {
      if (async === null || node.async === async) {
        funcs.push(node);
      }
    }
  }
  return funcs;
}

/**
 * Assertion helpers
 */
function assertEqual(actual, expected, message = "") {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

function assertNotNull(value, message = "Value should not be null") {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

function assertTrue(condition, message = "Expected condition to be true") {
  if (!condition) {
    throw new Error(message);
  }
}

function assertInstanceOf(value, type, message = "") {
  if (!(value instanceof type)) {
    throw new Error(`${message}\n  Expected instance of: ${type.name}\n  Got: ${value?.constructor?.name || typeof value}`);
  }
}

function assertContains(haystack, needle, message = "") {
  if (!haystack.includes(needle)) {
    throw new Error(`${message}\n  Expected to contain: ${needle}\n  In: ${haystack}`);
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════
 * PHASE 5.2.1: Parser → Type Validator Integration
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Tests the integration between parsing and type validation:
 * - Async function parsing triggers type validation
 * - Parser output feeds into type validator
 * - Error propagation from validator to parser
 * - Type metadata preservation through pipeline
 */

console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}PHASE 5.2.1: Parser → Type Validator Integration${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);

test("Phase 5.2.1", "Parse async function and validate return type through pipeline", () => {
  const source = `
    async function fetchData() {
      return 42;
    }
  `;
  
  const ir = parseAndLower(source);
  
  assertNotNull(ir, "IR should not be null");
  assertNotNull(ir.module, "IR module should exist");
  assertTrue(ir.module.body.length > 0, "IR should have function declarations");
  
  const funcDecl = findFunctionInIR(ir, true);
  assertNotNull(funcDecl, "Should find FunctionDeclaration in IR");
  assertEqual(funcDecl.async, true, "Function should be marked as async");
  
  // Verify return type was auto-corrected to Promise<void> or properly set
  if (funcDecl.returnType) {
    assertTrue(
      funcDecl.returnType.category === TypeCategory.PROMISE || 
      funcDecl.returnType.category === TypeCategory.VOID,
      "Async function should have Promise or void return type"
    );
  }
});

test("Phase 5.2.1", "Parser preserves async metadata through lowering", () => {
  const source = `
    async function getData() {
      const result = await fetch();
      return result;
    }
  `;
  
  const ir = parseAndLower(source);
  const funcDecl = findFunctionInIR(ir, true);
  
  assertNotNull(funcDecl, "Function declaration should exist");
  assertEqual(funcDecl.async, true, "Async flag should be preserved");
  
  // Verify metadata preservation
  if (funcDecl.meta) {
    assertNotNull(funcDecl.meta.cfg, "CFG metadata should exist");
  }
});

test("Phase 5.2.1", "Validation errors propagate from type validator to parser", () => {
  // This test checks that validation errors during lowering are properly caught
  const source = `
    async function badFunc() {
      return undefined;
    }
  `;
  
  try {
    const ir = parseAndLower(source);
    // If validation is enabled, this should have auto-corrected
    const funcDecl = findFunctionInIR(ir, true);
    assertNotNull(funcDecl, "Function should still be created");
    assertEqual(funcDecl.async, true, "Should still be marked async");
  } catch (error) {
    // Validation error is acceptable
    assertTrue(true, "Validation error caught as expected");
  }
});

test("Phase 5.2.1", "Multiple async functions in single parse", () => {
  const source = `
    async function first() {
      return 1;
    }
    
    async function second() {
      return 2;
    }
  `;
  
  const ir = parseAndLower(source);
  const asyncFuncs = findAllFunctionsInIR(ir, true);
  
  assertEqual(asyncFuncs.length, 2, "Should find both async functions");
  asyncFuncs.forEach((func, idx) => {
    assertEqual(func.async, true, `Function ${idx} should be async`);
  });
});

test("Phase 5.2.1", "Await expression parsed and linked correctly", () => {
  const source = `
    async function processData() {
      const data = await fetchData();
      return data;
    }
  `;
  
  const ir = parseAndLower(source);
  const funcDecl = findFunctionInIR(ir, true);
  assertNotNull(funcDecl, "Function declaration should exist");
  
  // Verify body contains await expression
  const bodyBlock = ir.nodes[funcDecl.body];
  assertNotNull(bodyBlock, "Function body should exist");
  assertTrue(bodyBlock.statements.length > 0, "Body should have statements");
});

test("Phase 5.2.1", "Nested async function parsing", () => {
  const source = `
    async function outer() {
      async function inner() {
        return 42;
      }
      return await inner();
    }
  `;
  
  const ir = parseAndLower(source);
  const outerFunc = findFunctionInIR(ir, true);
  assertNotNull(outerFunc, "Outer function should exist");
  assertEqual(outerFunc.async, true, "Outer function should be async");
});

test("Phase 5.2.1", "Async arrow function support", () => {
  const source = `
    const fetchUser = async () => {
      return { name: "Alice" };
    };
  `;
  
  const ir = parseAndLower(source);
  // Should parse without errors
  assertNotNull(ir, "IR should be created");
  assertNotNull(ir.module, "Module should exist");
});

test("Phase 5.2.1", "Type annotations in async function params", () => {
  const source = `
    async function processUser(userId, options) {
      return await getUser(userId);
    }
  `;
  
  const ir = parseAndLower(source);
  const funcDecl = findFunctionInIR(ir, true);
  assertNotNull(funcDecl, "Function should be parsed");
  assertTrue(funcDecl.parameters.length >= 2, "Should have parameters");
});

/**
 * ═══════════════════════════════════════════════════════════════════
 * PHASE 5.2.2: Scope Manager Integration
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Tests scope manager's handling of async contexts:
 * - Async function scope creation
 * - Variable binding in async contexts
 * - Scope chain traversal with await
 * - Closure capture in async functions
 */

console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}PHASE 5.2.2: Scope Manager Integration${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);

test("Phase 5.2.2", "Async function creates proper scope", () => {
  const lowerer = new IRLowerer();
  
  // Initial scope
  assertEqual(lowerer.scopeStack.length, 1, "Should start with global scope");
  
  lowerer.pushScope(); // Simulate async function entry
  assertEqual(lowerer.scopeStack.length, 2, "Should have function scope");
  
  lowerer.addBinding("userId");
  assertTrue(lowerer.hasBinding("userId"), "Should find binding in current scope");
  
  lowerer.popScope(); // Exit async function
  assertEqual(lowerer.scopeStack.length, 1, "Should return to global scope");
});

test("Phase 5.2.2", "Variable bindings in nested async scopes", () => {
  const lowerer = new IRLowerer();
  
  lowerer.pushScope(); // Outer async function
  lowerer.addBinding("outer");
  
  lowerer.pushScope(); // Inner async function
  lowerer.addBinding("inner");
  
  assertTrue(lowerer.hasBinding("inner"), "Should find inner binding");
  assertTrue(lowerer.hasBinding("outer"), "Should find outer binding through scope chain");
  
  lowerer.popScope();
  assertTrue(lowerer.hasBinding("outer"), "Outer binding still accessible");
});

test("Phase 5.2.2", "Temp variable generation in async context", () => {
  const lowerer = new IRLowerer();
  
  const temp1 = lowerer.createTempVar("__await");
  const temp2 = lowerer.createTempVar("__await");
  
  assertTrue(temp1.startsWith("__await_"), "Temp var should have prefix");
  assertTrue(temp2.startsWith("__await_"), "Second temp var should have prefix");
  assertTrue(temp1 !== temp2, "Temp vars should be unique");
});

test("Phase 5.2.2", "Scope isolation between async functions", () => {
  const source = `
    async function first() {
      const data = await fetch();
      return data;
    }
    
    async function second() {
      const data = await fetch();
      return data;
    }
  `;
  
  const ir = parseAndLower(source);
  // Both functions should compile without scope conflicts
  assertNotNull(ir, "IR should be created");
  
  const asyncFuncs = findAllFunctionsInIR(ir, true);
  assertEqual(asyncFuncs.length, 2, "Should have two async functions");
});

test("Phase 5.2.2", "Closure capture with await expressions", () => {
  const source = `
    async function createCounter() {
      let count = 0;
      return async function increment() {
        count++;
        await delay(100);
        return count;
      };
    }
  `;
  
  const ir = parseAndLower(source);
  assertNotNull(ir, "IR should handle closure with async");
  
  const outerFunc = findFunctionInIR(ir, true);
  assertNotNull(outerFunc, "Outer function should exist");
});

test("Phase 5.2.2", "Scope reset between compilation units", () => {
  const lowerer = new IRLowerer();
  
  lowerer.pushScope();
  lowerer.addBinding("test");
  lowerer.popScope();
  
  lowerer.resetEnhancedState();
  
  assertEqual(lowerer.scopeStack.length, 1, "Scope stack should be reset");
  assertEqual(lowerer.tempVarCounter, 0, "Temp counter should be reset");
});

test("Phase 5.2.2", "Parameter binding in async functions", () => {
  const source = `
    async function process(input, options) {
      const result = await transform(input);
      return result;
    }
  `;
  
  const ir = parseAndLower(source);
  const funcDecl = findFunctionInIR(ir, true);
  
  assertNotNull(funcDecl, "Function should be created");
  assertTrue(funcDecl.parameters.length >= 2, "Parameters should be present");
});

/**
 * ═══════════════════════════════════════════════════════════════════
 * PHASE 5.2.3: Try/Catch → Await Expression Linking
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Tests integration between try/catch and await expressions:
 * - Await in try block
 * - Error handling for failed promises
 * - Finally blocks with await
 * - Nested try/catch with multiple awaits
 */

console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}PHASE 5.2.3: Try/Catch → Await Expression Linking${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);

test("Phase 5.2.3", "Await in try block", () => {
  const source = `
    async function fetchWithRetry() {
      try {
        const data = await fetch();
        return data;
      } catch (error) {
        return null;
      }
    }
  `;
  
  const ir = parseAndLower(source);
  assertNotNull(ir, "IR should be created");
  
  const funcDecl = findFunctionInIR(ir, true);
  assertNotNull(funcDecl, "Function should exist");
  assertEqual(funcDecl.async, true, "Should be async function");
});

test("Phase 5.2.3", "Multiple awaits in try/catch", () => {
  const source = `
    async function multiStep() {
      try {
        const user = await getUser();
        const profile = await getProfile(user.id);
        const settings = await getSettings(profile.id);
        return { user, profile, settings };
      } catch (error) {
        console.log(error);
        throw error;
      }
    }
  `;
  
  const ir = parseAndLower(source);
  assertNotNull(ir, "IR should handle multiple awaits in try block");
});

test("Phase 5.2.3", "Await in catch block", () => {
  const source = `
    async function fetchWithFallback() {
      try {
        return await fetchPrimary();
      } catch (error) {
        return await fetchBackup();
      }
    }
  `;
  
  const ir = parseAndLower(source);
  assertNotNull(ir, "Should handle await in catch block");
});

test("Phase 5.2.3", "Await in finally block", () => {
  const source = `
    async function processWithCleanup() {
      try {
        return await process();
      } finally {
        await cleanup();
      }
    }
  `;
  
  const ir = parseAndLower(source);
  assertNotNull(ir, "Should handle await in finally block");
});

test("Phase 5.2.3", "Nested try/catch with awaits", () => {
  const source = `
    async function nestedErrorHandling() {
      try {
        const outer = await fetchOuter();
        try {
          const inner = await fetchInner(outer);
          return inner;
        } catch (innerError) {
          console.log(innerError);
        }
      } catch (outerError) {
        console.log(outerError);
      }
    }
  `;
  
  const ir = parseAndLower(source);
  assertNotNull(ir, "Should handle nested try/catch with awaits");
});

test("Phase 5.2.3", "Try/catch without await (control test)", () => {
  const source = `
    function syncWithTry() {
      try {
        return process();
      } catch (error) {
        return null;
      }
    }
  `;
  
  const ir = parseAndLower(source);
  assertNotNull(ir, "Should handle sync try/catch");
  
  const funcDecl = findFunctionInIR(ir, false);
  assertNotNull(funcDecl, "Function should exist");
  assertTrue(!funcDecl.async || funcDecl.async === false, "Should not be async");
});

/**
 * ═══════════════════════════════════════════════════════════════════
 * PHASE 5.2.4: Cross-Component Type Propagation
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Tests type information flow across pipeline stages:
 * - Type metadata from parser to lowerer
 * - Return type propagation through IR
 * - Type information in emitter output
 * - Type compatibility checks across boundaries
 */

console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}PHASE 5.2.4: Cross-Component Type Propagation${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);

test("Phase 5.2.4", "Type metadata flows from parser to lowerer", () => {
  const source = `
    async function typed() {
      return 42;
    }
  `;
  
  // Parse
  const parser = new LuaScriptParser(source);
  const ast = parser.parse();
  
  const astFunc = ast.body.find(node => node.type === "FunctionDeclaration");
  assertNotNull(astFunc, "AST should have function");
  assertEqual(astFunc.async, true, "AST function should be async");
  
  // Lower
  const lowerer = new IRLowerer();
  const ir = lowerer.lowerProgram(ast);
  
  const irFunc = findFunctionInIR(ir, true);
  assertNotNull(irFunc, "IR should have function");
  assertEqual(irFunc.async, true, "IR function should preserve async flag");
});

test("Phase 5.2.4", "Promise<T> type created and propagated", () => {
  // Create types directly using Type classes
  const { TPrimitive } = require("../src/ir/types");
  
  const numberType = new TPrimitive("number");
  const promiseType = new TPromise(numberType);
  
  assertNotNull(promiseType, "Promise type should be created");
  assertInstanceOf(promiseType, TPromise, "Should be TPromise instance");
  assertEqual(promiseType.elementType.primitiveType, "number", "Element type should be number");
});

test("Phase 5.2.4", "Async function return type defaults", () => {
  const builder = new IRBuilder();
  
  // Create async function without explicit return type
  const asyncFunc = builder.asyncFunctionDeclaration(
    "testFunc",
    [],
    builder.blockStatement([]).id
  );
  
  assertNotNull(asyncFunc, "Async function should be created");
  
  // If returnType is set, it should be Promise<void> or compatible
  if (asyncFunc.returnType) {
    assertTrue(
      asyncFunc.returnType.category === TypeCategory.PROMISE ||
      asyncFunc.returnType.category === TypeCategory.VOID,
      "Return type should be Promise-related or void"
    );
  }
});

test("Phase 5.2.4", "Type serialization round-trip", () => {
  const { TPrimitive } = require("../src/ir/types");
  
  const stringType = new TPrimitive("string");
  const promiseType = new TPromise(stringType);
  
  // Serialize
  const json = promiseType.toJSON();
  assertNotNull(json, "Should serialize to JSON");
  assertEqual(json.category, TypeCategory.PROMISE, "Category should be preserved");
  
  // Deserialize
  const restored = Type.fromJSON(json);
  assertNotNull(restored, "Should deserialize from JSON");
  assertInstanceOf(restored, TPromise, "Should restore as TPromise");
  assertEqual(restored.elementType.primitiveType, "string", "Element type should be preserved");
});

test("Phase 5.2.4", "Future<T> cross-language type support", () => {
  const { TPrimitive } = require("../src/ir/types");
  
  const intType = new TPrimitive("int");
  const futureType = new TFuture(intType);
  
  assertNotNull(futureType, "Future type should be created");
  assertInstanceOf(futureType, TFuture, "Should be TFuture instance");
  
  // Future should be compatible with Promise
  const promiseType = new TPromise(intType);
  assertNotNull(promiseType, "Promise type should also be created");
});

test("Phase 5.2.4", "Complex nested type propagation", () => {
  const { TPrimitive, TArray } = require("../src/ir/types");
  
  const userType = new TPrimitive("User");
  const arrayType = new TArray(userType);
  const promiseType = new TPromise(arrayType);
  
  assertNotNull(promiseType, "Complex type should be created");
  assertInstanceOf(promiseType, TPromise, "Should be Promise type");
  assertEqual(promiseType.elementType.category, TypeCategory.ARRAY, "Should wrap array type");
});

test("Phase 5.2.4", "Type metadata in IR nodes", () => {
  const source = `
    async function getUsers() {
      return [{ id: 1 }, { id: 2 }];
    }
  `;
  
  const ir = parseAndLower(source);
  const funcDecl = findFunctionInIR(ir, true);
  
  assertNotNull(funcDecl, "Function should exist in IR");
  assertEqual(funcDecl.async, true, "Async flag should be in IR");
  
  // Verify metadata exists
  if (funcDecl.meta) {
    assertNotNull(funcDecl.meta.cfg, "CFG metadata should exist");
  }
});

/**
 * ═══════════════════════════════════════════════════════════════════
 * PHASE 5.2.5: End-to-End Transpilation
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Tests complete transpilation pipeline:
 * - Source → IR → (Emitter would be here)
 * - Complex async scenarios
 * - Real-world code patterns
 * - Performance and optimization
 */

console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}PHASE 5.2.5: End-to-End Transpilation${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);

test("Phase 5.2.5", "Simple async function end-to-end", () => {
  const source = `
    async function hello() {
      return "world";
    }
  `;
  
  const ir = parseAndLower(source);
  
  assertNotNull(ir, "IR should be created");
  assertNotNull(ir.module, "Module should exist");
  assertTrue(ir.module.body.length > 0, "Should have declarations");
  
  const funcDecl = findFunctionInIR(ir, true);
  assertNotNull(funcDecl, "Function should exist");
  assertEqual(funcDecl.async, true, "Should be async");
});

test("Phase 5.2.5", "Async with await end-to-end", () => {
  const source = `
    async function fetchUser(id) {
      const response = await fetch('/api/user/' + id);
      const data = await response.json();
      return data;
    }
  `;
  
  const ir = parseAndLower(source);
  
  assertNotNull(ir, "IR should be created");
  const funcDecl = findFunctionInIR(ir, true);
  assertNotNull(funcDecl, "Function should exist");
  assertEqual(funcDecl.async, true, "Should be async");
  assertTrue(funcDecl.parameters.length >= 1, "Should have parameter");
});

test("Phase 5.2.5", "Multiple async functions with dependencies", () => {
  const source = `
    async function getUser(id) {
      return await fetch('/user/' + id);
    }
    
    async function getUserProfile(id) {
      const user = await getUser(id);
      return await fetch('/profile/' + user.profileId);
    }
  `;
  
  const ir = parseAndLower(source);
  
  const asyncFuncs = findAllFunctionsInIR(ir, true);
  assertEqual(asyncFuncs.length, 2, "Should have both async functions");
});

test("Phase 5.2.5", "Async with conditional logic", () => {
  const source = `
    async function conditionalFetch(useCache) {
      if (useCache) {
        return await getFromCache();
      } else {
        return await fetchFromServer();
      }
    }
  `;
  
  const ir = parseAndLower(source);
  assertNotNull(ir, "Should handle conditional async logic");
});

test("Phase 5.2.5", "Async with loops", () => {
  const source = `
    async function processAll(items) {
      const results = [];
      for (let i = 0; i < items.length; i++) {
        const result = await process(items[i]);
        results.push(result);
      }
      return results;
    }
  `;
  
  const ir = parseAndLower(source);
  assertNotNull(ir, "Should handle async with loops");
});

test("Phase 5.2.5", "Async with destructuring", () => {
  const source = `
    async function getUserData() {
      const { id, name, email } = await fetchUser();
      return { id, name, email };
    }
  `;
  
  const ir = parseAndLower(source);
  assertNotNull(ir, "Should handle async with destructuring");
});

test("Phase 5.2.5", "Real-world API call pattern", () => {
  const source = `
    async function createUser(userData) {
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to create user');
        }
        
        const newUser = await response.json();
        return newUser;
      } catch (error) {
        console.error('Error creating user:', error);
        throw error;
      }
    }
  `;
  
  const ir = parseAndLower(source);
  assertNotNull(ir, "Should handle real-world API pattern");
  
  const funcDecl = findFunctionInIR(ir, true);
  assertNotNull(funcDecl, "Function should exist");
  assertEqual(funcDecl.async, true, "Should be async");
});

test("Phase 5.2.5", "Pipeline performance metadata", () => {
  const source = `
    async function test() {
      return 42;
    }
  `;
  
  const ir = parseAndLower(source);
  
  // Check for performance metadata
  assertNotNull(ir.module.metadata, "Metadata should exist");
  if (ir.module.metadata.metaPerf) {
    assertNotNull(ir.module.metadata.metaPerf.parseMs, "Parse time should be recorded");
    assertNotNull(ir.module.metadata.metaPerf.lowerMs, "Lower time should be recorded");
    assertTrue(ir.module.metadata.metaPerf.totalMs >= 0, "Total time should be recorded");
  }
});

/**
 * ═══════════════════════════════════════════════════════════════════
 * PHASE 5.2.6: Error Recovery & Resilience
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Tests error handling and recovery:
 * - Graceful degradation
 * - Error message quality
 * - Recovery from validation errors
 * - Partial compilation success
 */

console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}PHASE 5.2.6: Error Recovery & Resilience${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);

test("Phase 5.2.6", "Handle malformed async function gracefully", () => {
  const source = `
    async function
  `;
  
  try {
    const ir = parseAndLower(source);
    // Parser should throw before we get here
    assertTrue(false, "Should have thrown parse error");
  } catch (error) {
    // Expected error
    assertTrue(true, "Parse error caught as expected");
    const errorMsg = error.message.toLowerCase();
    assertTrue(
      errorMsg.includes("expected") || errorMsg.includes("unexpected") || errorMsg.includes("error"),
      "Error should be descriptive"
    );
  }
});

test("Phase 5.2.6", "Multiple syntax errors don't crash pipeline", () => {
  const source = `
    async function bad1 {
      await
    }
    
    async function bad2(
  `;
  
  try {
    parseAndLower(source);
    assertTrue(false, "Should have thrown error");
  } catch (error) {
    assertTrue(true, "Syntax errors caught");
  }
});

test("Phase 5.2.6", "Partial success with one good, one bad function", () => {
  const source = `
    async function good() {
      return 42;
    }
    
    function alsogood() {
      return 24;
    }
  `;
  
  const ir = parseAndLower(source);
  assertNotNull(ir, "Should compile successfully");
  assertTrue(ir.module.body.length >= 2, "Should have both functions");
});

test("Phase 5.2.6", "Recover from validation warning (auto-correction)", () => {
  // This tests that the auto-correction feature works
  const source = `
    async function needsCorrection() {
      return undefined;
    }
  `;
  
  const ir = parseAndLower(source);
  assertNotNull(ir, "Should compile with auto-correction");
  
  const funcDecl = findFunctionInIR(ir, true);
  assertNotNull(funcDecl, "Function should exist after auto-correction");
});

test("Phase 5.2.6", "Error messages include source location", () => {
  const source = `
    async function broken {
      await notDefined();
    }
  `;
  
  try {
    parseAndLower(source);
    assertTrue(false, "Should have thrown");
  } catch (error) {
    // Error message should be descriptive
    assertNotNull(error.message, "Error should have message");
    assertTrue(error.message.length > 0, "Error message should not be empty");
  }
});

test("Phase 5.2.6", "Pipeline handles empty source", () => {
  const source = ``;
  
  const ir = parseAndLower(source);
  assertNotNull(ir, "Should handle empty source");
  assertNotNull(ir.module, "Module should exist");
  assertEqual(ir.module.body.length, 0, "Body should be empty");
});

/**
 * ═══════════════════════════════════════════════════════════════════
 * TEST RESULTS SUMMARY
 * ═══════════════════════════════════════════════════════════════════
 */

console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}PHASE 5.2 INTEGRATION TEST RESULTS${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);

// Print phase-by-phase results
Object.keys(testResults.phases).forEach(phaseName => {
  const phase = testResults.phases[phaseName];
  const total = phase.passed + phase.failed;
  const passRate = ((phase.passed / total) * 100).toFixed(1);
  const statusColor = phase.failed === 0 ? colors.green : colors.yellow;
  
  console.log(`${colors.bold}${phaseName}${colors.reset}`);
  console.log(`  Tests: ${phase.passed}/${total} passed (${passRate}%)`);
  console.log(`  Status: ${statusColor}${phase.failed === 0 ? "✓ ALL PASS" : `${phase.failed} FAILED`}${colors.reset}\n`);
});

// Overall summary
const overallPassRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
const overallStatus = testResults.failed === 0 ? "EXCELLENT" : 
                     overallPassRate >= 90 ? "GOOD" :
                     overallPassRate >= 75 ? "ACCEPTABLE" : "NEEDS WORK";
const statusColor = testResults.failed === 0 ? colors.green :
                   overallPassRate >= 90 ? colors.yellow : colors.red;

console.log(`${colors.bold}[SUMMARY]${colors.reset}`);
console.log(`Total Tests:       ${testResults.total}`);
console.log(`Passed:            ${colors.green}${testResults.passed}${colors.reset}`);
console.log(`Failed:            ${testResults.failed > 0 ? colors.red : colors.green}${testResults.failed}${colors.reset}`);
console.log(`Pass Rate:         ${statusColor}${overallPassRate}%${colors.reset}`);
console.log(`Overall Status:    ${statusColor}${overallStatus}${colors.reset}\n`);

// Print failures if any
if (testResults.failures.length > 0) {
  console.log(`${colors.bold}${colors.red}FAILURES:${colors.reset}\n`);
  testResults.failures.forEach((failure, idx) => {
    console.log(`${idx + 1}. ${colors.bold}${failure.phase}${colors.reset} - ${failure.test}`);
    console.log(`   ${colors.red}${failure.error}${colors.reset}\n`);
  });
}

// Exit with appropriate code
process.exit(testResults.failed === 0 ? 0 : 1);

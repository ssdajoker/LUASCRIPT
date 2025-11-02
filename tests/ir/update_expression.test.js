"use strict";

const assert = require("assert");
const { parseAndLower } = require("../../src/ir/pipeline");
const { emitLuaFromIR } = require("../../src/ir/emitter");

console.log("Testing increment/decrement operators in expressions...\n");

(function testPrefixIncrementInAssignment() {
  console.log("Test 1: Prefix increment in assignment (let x = ++i)");
  const source = `let x = ++i;`;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  
  console.log("Generated Lua:");
  console.log(lua);
  console.log("");

  // Should wrap in IIFE to handle expression value correctly
  assert(lua.includes("function()"), "Prefix increment should use IIFE");
  assert(lua.includes("i = i + 1"), "Should increment the variable");
  assert(lua.includes("return i"), "Should return the incremented value");
  assert(!lua.match(/local x = i = i \+ 1/), "Should not generate invalid syntax");
  
  console.log("✓ Test 1 passed\n");
})();

(function testPostfixIncrementInAssignment() {
  console.log("Test 2: Postfix increment in assignment (let y = i++)");
  const source = `let y = i++;`;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  
  console.log("Generated Lua:");
  console.log(lua);
  console.log("");

  // Should wrap in IIFE with temporary variable for postfix
  assert(lua.includes("function()"), "Postfix increment should use IIFE");
  assert(lua.includes("local _t = i"), "Should save original value");
  assert(lua.includes("i = i + 1"), "Should increment the variable");
  assert(lua.includes("return _t"), "Should return the original value");
  assert(!lua.match(/local y = i = i \+ 1/), "Should not generate invalid syntax");
  
  console.log("✓ Test 2 passed\n");
})();

(function testPrefixDecrementInExpression() {
  console.log("Test 3: Prefix decrement in expression (let z = --j)");
  const source = `let z = --j;`;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  
  console.log("Generated Lua:");
  console.log(lua);
  console.log("");

  // Should wrap in IIFE to handle expression value correctly
  assert(lua.includes("function()"), "Prefix decrement should use IIFE");
  assert(lua.includes("return j"), "Should return the decremented value");
  assert(!lua.match(/local z = j = j/), "Should not generate invalid syntax");
  
  console.log("✓ Test 3 passed\n");
})();

(function testPostfixDecrementInExpression() {
  console.log("Test 4: Postfix decrement in expression (let w = j--)");
  const source = `let w = j--;`;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  
  console.log("Generated Lua:");
  console.log(lua);
  console.log("");

  // Should wrap in IIFE with temporary variable for postfix
  assert(lua.includes("function()"), "Postfix decrement should use IIFE");
  assert(lua.includes("local _t = j"), "Should save original value");
  assert(lua.includes("return _t"), "Should return the original value");
  assert(!lua.match(/local w = j = j/), "Should not generate invalid syntax");
  
  console.log("✓ Test 4 passed\n");
})();

(function testIncrementInFunctionCall() {
  console.log("Test 5: Increment in function call (foo(++i))");
  const source = `foo(++i);`;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  
  console.log("Generated Lua:");
  console.log(lua);
  console.log("");

  // Should wrap in IIFE even inside function call
  assert(lua.includes("function()"), "Increment in function call should use IIFE");
  assert(lua.includes("foo("), "Should preserve function call");
  assert(!lua.match(/foo\(i = i \+ 1\)/), "Should not generate invalid syntax");
  
  console.log("✓ Test 5 passed\n");
})();

(function testIncrementInBinaryExpression() {
  console.log("Test 6: Increment in binary expression (let x = ++i + 5)");
  const source = `let x = ++i + 5;`;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  
  console.log("Generated Lua:");
  console.log(lua);
  console.log("");

  // Should wrap increment in IIFE and add 5 to the result
  assert(lua.includes("function()"), "Increment should use IIFE");
  assert(lua.includes("+ 5"), "Should add 5 to the result");
  assert(!lua.match(/= i = i \+ 1 \+ 5/), "Should not generate invalid syntax");
  
  console.log("✓ Test 6 passed\n");
})();

(function testIncrementAsStatement() {
  console.log("Test 7: Increment as statement (i++)");
  const source = `i++;`;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  
  console.log("Generated Lua:");
  console.log(lua);
  console.log("");

  // Even as a statement, the current implementation uses IIFE
  assert(lua.includes("function()"), "Increment as statement uses IIFE in current implementation");
  
  console.log("✓ Test 7 passed\n");
})();

(function testNestedIncrementInExpression() {
  console.log("Test 8: Nested increment in expression (let x = (++i) * 2)");
  const source = `let x = (++i) * 2;`;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  
  console.log("Generated Lua:");
  console.log(lua);
  console.log("");

  // Should wrap increment in IIFE and multiply the result
  assert(lua.includes("function()"), "Increment should use IIFE");
  assert(lua.includes("* 2"), "Should multiply by 2");
  assert(!lua.match(/= \(i = i \+ 1\) \* 2/), "Should not generate invalid syntax");
  
  console.log("✓ Test 8 passed\n");
})();

console.log("All increment/decrement operator tests passed successfully!");

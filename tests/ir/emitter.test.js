"use strict";

const assert = require("assert");
const { parseAndLower } = require("../../src/ir/pipeline");
const { emitLuaFromIR } = require("../../src/ir/emitter");

(function testFunctionDeclarationEmission() {
  const source = `
    function add(a, b) {
      return a + b;
    }
  `;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);

  const expected = [
    "local function add(a, b)",
    "  return a + b",
    "end",
  ].join("\n");

  assert.strictEqual(lua.trim(), expected, "Function declaration should emit expected Lua");
})();

(function testArrowFunctionDeclarationEmission() {
  const source = `
    const double = (x) => x * 2;
    return double(21);
  `;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);

  const expected = [
    "local double = function(x)",
    "  return x * 2",
    "end",
    "",
    "return double(21)",
  ].join("\n");

  assert.strictEqual(lua.trim(), expected.trim(), "Arrow function emission should match Lua");
})();

(function testStringConcatenationEmission() {
  const source = `
    const greeting = "Hello, " + name + "!";
  `;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);

  const expected = [
    "local greeting = \"Hello, \" .. name .. \"!\"",
  ].join("\n");

  assert.strictEqual(lua.trim(), expected.trim(), "String concatenation should use Lua '..' operator");
})();

(function testPrefixIncrementInAssignment() {
  const source = `
    let x = ++i;
  `;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);

  // Should wrap in IIFE to handle expression value correctly
  assert(lua.includes("function()"), "Prefix increment should use IIFE");
  assert(lua.includes("i = i + 1"), "Should increment the variable");
  assert(lua.includes("return i"), "Should return the incremented value");
  assert(!lua.match(/local x = i = i \+ 1/), "Should not generate invalid syntax");
})();

(function testPostfixIncrementInAssignment() {
  const source = `
    let y = i++;
  `;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);

  // Should wrap in IIFE with temporary variable for postfix
  assert(lua.includes("function()"), "Postfix increment should use IIFE");
  assert(lua.includes("local _t = i"), "Should save original value");
  assert(lua.includes("i = i + 1"), "Should increment the variable");
  assert(lua.includes("return _t"), "Should return the original value");
  assert(!lua.match(/local y = i = i \+ 1/), "Should not generate invalid syntax");
})();

(function testPrefixDecrementInExpression() {
  const source = `
    let z = --j;
  `;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);

  // Should wrap in IIFE to handle expression value correctly
  assert(lua.includes("function()"), "Prefix decrement should use IIFE");
  assert(lua.includes("return j"), "Should return the decremented value");
  assert(!lua.match(/local z = j = j/), "Should not generate invalid syntax");
})();

(function testPostfixDecrementInExpression() {
  const source = `
    let w = j--;
  `;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);

  // Should wrap in IIFE with temporary variable for postfix
  assert(lua.includes("function()"), "Postfix decrement should use IIFE");
  assert(lua.includes("local _t = j"), "Should save original value");
  assert(lua.includes("return _t"), "Should return the original value");
  assert(!lua.match(/local w = j = j/), "Should not generate invalid syntax");
})();

(function testIncrementInFunctionCall() {
  const source = `
    foo(++i);
  `;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);

  // Should wrap in IIFE even inside function call
  assert(lua.includes("function()"), "Increment in function call should use IIFE");
  assert(lua.includes("foo("), "Should preserve function call");
  assert(!lua.match(/foo\(i = i \+ 1\)/), "Should not generate invalid syntax");
})();

(function testIncrementInBinaryExpression() {
  const source = `
    let x = ++i + 5;
  `;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);

  // Should wrap increment in IIFE and add 5 to the result
  assert(lua.includes("function()"), "Increment should use IIFE");
  assert(lua.includes("+ 5"), "Should add 5 to the result");
  assert(!lua.match(/= i = i \+ 1 \+ 5/), "Should not generate invalid syntax");
})();

(function testIncrementAsStatement() {
  const source = `
    i++;
  `;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);

  // Even as a statement, the current implementation uses IIFE
  assert(lua.includes("function()"), "Increment as statement uses IIFE in current implementation");
})();

(function testNestedIncrementInExpression() {
  const source = `
    let x = (++i) * 2;
  `;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);

  // Should wrap increment in IIFE and multiply the result
  assert(lua.includes("function()"), "Increment should use IIFE");
  assert(lua.includes("* 2"), "Should multiply by 2");
  assert(!lua.match(/= \(i = i \+ 1\) \* 2/), "Should not generate invalid syntax");
})();

console.log("IR emitter tests completed successfully.");

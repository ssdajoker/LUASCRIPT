"use strict";

/**
 * Tests for IR Emitter operator precedence optimization
 * 
 * This test suite verifies that the emitter generates clean Lua code
 * with minimal parentheses by respecting operator precedence rules.
 */

const assert = require("assert");
const { parseAndLower } = require("../../src/ir/pipeline");
const { emitLuaFromIR } = require("../../src/ir/emitter");

(function testSimpleBinaryExpression() {
  const source = `let x = a + b;`;
  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  assert.strictEqual(lua.trim(), "local x = a + b", "Simple addition should not have parentheses");
})();

(function testMultiplicationPrecedence() {
  const source = `let x = a + b * c;`;
  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  assert.strictEqual(lua.trim(), "local x = a + b * c", "Multiplication has higher precedence, no parens needed");
})();

(function testForcedPrecedence() {
  const source = `let x = (a + b) * c;`;
  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  assert.strictEqual(lua.trim(), "local x = (a + b) * c", "Parentheses should be preserved when needed");
})();

(function testMultipleAdditions() {
  const source = `let x = a + b + c + d;`;
  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  assert.strictEqual(lua.trim(), "local x = a + b + c + d", "Chained additions should not have extra parentheses");
})();

(function testMixedMultiplicationAndDivision() {
  const source = `let x = a * b / c * d;`;
  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  assert.strictEqual(lua.trim(), "local x = a * b / c * d", "Same precedence operations should not have extra parentheses");
})();

(function testMixedArithmeticOperators() {
  const source = `let x = a * b + c / d;`;
  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  assert.strictEqual(lua.trim(), "local x = a * b + c / d", "Mixed operators with same/higher precedence should not have extra parentheses");
})();

(function testLogicalAND() {
  const source = `let x = a && b;`;
  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  assert.strictEqual(lua.trim(), "local x = a and b", "Logical AND should be clean");
})();

(function testLogicalOR() {
  const source = `let x = a || b;`;
  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  assert.strictEqual(lua.trim(), "local x = a or b", "Logical OR should be clean");
})();

(function testLogicalANDBeforeOR() {
  const source = `let x = a && b || c;`;
  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  assert.strictEqual(lua.trim(), "local x = a and b or c", "AND has higher precedence than OR");
})();

(function testLogicalORBeforeAND() {
  const source = `let x = (a || b) && c;`;
  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  assert.strictEqual(lua.trim(), "local x = (a or b) and c", "Forced OR before AND should preserve parentheses");
})();

(function testComparisonOperator() {
  const source = `let x = a > b;`;
  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  assert.strictEqual(lua.trim(), "local x = a > b", "Comparison should be clean");
})();

(function testComparisonWithArithmetic() {
  const source = `let x = a + b > c * d;`;
  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  assert.strictEqual(lua.trim(), "local x = a + b > c * d", "Arithmetic has higher precedence than comparison");
})();

(function testComplexNestedExpression() {
  const source = `let x = a + b * c + d / e;`;
  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  assert.strictEqual(lua.trim(), "local x = a + b * c + d / e", "Complex expression should minimize parentheses");
})();

(function testLogicalChain() {
  const source = `let x = a && b && c && d;`;
  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  assert.strictEqual(lua.trim(), "local x = a and b and c and d", "Chained logical operations should not have extra parentheses");
})();

(function testMixedLogicalOperators() {
  const source = `let x = a && b || c && d;`;
  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  assert.strictEqual(lua.trim(), "local x = a and b or c and d", "Mixed logical operators should respect precedence");
})();

(function testFunctionWithComplexExpressions() {
  const source = `
    function calculate(a, b, c, d) {
      let x = a + b * c;
      let y = (a + b) * c;
      let z = a * b + c / d;
      return x + y + z;
    }
  `;
  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);
  
  // Verify the function compiles and contains expected patterns
  assert(lua.includes("local function calculate"), "Should emit function");
  assert(lua.includes("a + b * c"), "Should have clean expression");
  assert(lua.includes("(a + b) * c"), "Should preserve forced precedence");
  assert(lua.includes("a * b + c / d"), "Should have clean mixed expression");
})();

console.log("All IR emitter precedence tests passed successfully.");

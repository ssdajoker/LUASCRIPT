"use strict";

const assert = require("assert");
const { parseAndLower } = require("../../src/ir/pipeline");
const { emitLuaFromIR } = require("../../src/ir/emitter");

function buildTryIR({ includeCatch = true, includeFinally = false }) {
  const nodes = {
    try1: { kind: "TryStatement", id: "try1", block: "block_try" },
    block_try: { kind: "BlockStatement", id: "block_try", statements: ["call_risky"] },
    call_risky: { kind: "ExpressionStatement", expression: "call_risky_expr" },
    call_risky_expr: { kind: "CallExpression", callee: "risky_id", arguments: [] },
    risky_id: { kind: "Identifier", name: "risky" },
    cleanup_id: { kind: "Identifier", name: "cleanup" },
    cleanup_expr: { kind: "CallExpression", callee: "cleanup_id", arguments: [] },
    cleanup_call: { kind: "ExpressionStatement", expression: "cleanup_expr" },
  };

  if (includeCatch) {
    nodes.try1.handler = "catch1";
    nodes.catch1 = { kind: "CatchClause", param: "err_id", body: "block_catch" };
    nodes.err_id = { kind: "Identifier", name: "err" };
    nodes.block_catch = { kind: "BlockStatement", id: "block_catch", statements: ["handle_call"] };
    nodes.handle_id = { kind: "Identifier", name: "handle" };
    nodes.handle_expr = { kind: "CallExpression", callee: "handle_id", arguments: ["err_id"] };
    nodes.handle_call = { kind: "ExpressionStatement", expression: "handle_expr" };
  }

  if (includeFinally) {
    nodes.try1.finalizer = "finally1";
    nodes.finally1 = { kind: "BlockStatement", id: "finally1", statements: ["cleanup_call"] };
  }

  return {
    module: { body: ["try1"] },
    nodes,
  };
}

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

(function testTryCatchEmission() {
  const ir = buildTryIR({ includeCatch: true, includeFinally: false });
  const lua = emitLuaFromIR(ir).trim();
  const expected = [
    "local function __try_try1()",
    "  risky()",
    "end",
    "local __ok, __err = xpcall(__try_try1, function(e) return e end)",
    "if (not __ok) then",
    "  local err = __err",
    "  handle(err)",
    "end",
  ].join("\n");

  assert.strictEqual(lua, expected, "Try/catch emission should wrap call and bind error");
})();

(function testTryFinallyEmission() {
  const ir = buildTryIR({ includeCatch: false, includeFinally: true });
  const lua = emitLuaFromIR(ir).trim();
  const expected = [
    "local function __try_try1()",
    "  risky()",
    "end",
    "local __ok, __err = xpcall(__try_try1, function(e) return e end)",
    "  cleanup()",
  ].join("\n");

  assert.strictEqual(lua, expected, "Try/finally emission should always run finalizer");
})();

(function testTryCatchFinallyEmission() {
  const ir = buildTryIR({ includeCatch: true, includeFinally: true });
  const lua = emitLuaFromIR(ir).trim();
  const expected = [
    "local function __try_try1()",
    "  risky()",
    "end",
    "local __ok, __err = xpcall(__try_try1, function(e) return e end)",
    "if (not __ok) then",
    "  local err = __err",
    "  handle(err)",
    "end",
    "  cleanup()",
  ].join("\n");

  assert.strictEqual(lua, expected, "Try/catch/finally emission should preserve ordering");
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

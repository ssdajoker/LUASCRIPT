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

console.log("IR emitter tests completed successfully.");

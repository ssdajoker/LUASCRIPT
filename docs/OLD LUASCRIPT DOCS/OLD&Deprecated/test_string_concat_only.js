"use strict";

const assert = require("assert");
const { parseAndLower } = require("./src/ir/pipeline");
const { emitLuaFromIR } = require("./src/ir/emitter");

(function testStringConcatenationEmission() {
  const source = `
    const greeting = "Hello, " + name + "!";
  `;

  const ir = parseAndLower(source);
  const lua = emitLuaFromIR(ir);

  const expected = [
    "local greeting = \"Hello, \" .. name .. \"!\"",
  ].join("\n");

  console.log("Generated Lua:");
  console.log(lua);
  console.log("\nExpected:");
  console.log(expected);

  assert.strictEqual(lua.trim(), expected.trim(), "String concatenation should use Lua '..' operator");
  console.log("\n✓ Test passed");
})();

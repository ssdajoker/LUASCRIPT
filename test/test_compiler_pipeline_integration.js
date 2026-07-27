"use strict";

const assert = require("assert");
const { JSToIRCompiler } = require("../src/compilers/js-to-ir");
const { validateIR } = require("../src/ir/validator");
const { emitLuaFromIR } = require("../src/ir/emitter");
const { BackendManager } = require("../src/backends");

function compileSource(js) {
  const jsCompiler = new JSToIRCompiler();
  const ir = jsCompiler.compile(js);
  const validation = validateIR(ir);
  assert.ok(validation.ok, `IR validation failed: ${JSON.stringify(validation)}`);
  return ir;
}

(function testPipelineToLua() {
  const js = "function add(a, b) { return a + b; }";
  const ir = compileSource(js);
  const lua = emitLuaFromIR(ir);
  assert.ok(lua.includes("function add"), "Lua output should contain function name");
})();

(function testPipelineToWasmAndLlvm() {
  const js = `
    function square(n) {
      return n * n;
    }
  `;
  const ir = compileSource(js);
  const backends = new BackendManager({ wasm: { optimize: true }, llvm: { optimize: true } });

  const wasmResult = backends.compile(ir, "wasm");
  assert.ok(wasmResult.success, "WASM backend should succeed");
  assert.ok(wasmResult.output instanceof Uint8Array, "WASM output should be a Uint8Array");

  const llvmResult = backends.compile(ir, "llvm");
  assert.ok(llvmResult.success, "LLVM backend should succeed");
  assert.ok(typeof llvmResult.output === "string" && llvmResult.output.includes("@square"), "LLVM output should reference function");
})();

(function testDeterminismAcrossRuns() {
  const js = "function inc(x) { return x + 1; }";
  const first = compileSource(js);
  const second = compileSource(js);
  assert.deepStrictEqual(first, second, "IR should be deterministic for identical input");
})();

console.log("✅ Compiler pipeline integration tests passed");

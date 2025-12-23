"use strict";

const assert = require("assert");
const { IRNode } = require("../../src/ir/nodes");

function expectThrows(fn, message) {
  assert.throws(fn, err => {
    assert.ok(err instanceof Error, "Expected an Error to be thrown");
    assert.strictEqual(err.message, message);
    return true;
  });
}

(function runInvalidInputChecks() {
  console.log("\nIR fromJSON handler validation\n");

  expectThrows(
    () => IRNode.fromJSON(null),
    "Invalid IR JSON: expected a non-null object",
  );

  expectThrows(
    () => IRNode.fromJSON(42),
    "Invalid IR JSON: expected an object but received number",
  );

  expectThrows(
    () => IRNode.fromJSON({}),
    "Invalid IR JSON: missing 'kind' property",
  );

  expectThrows(
    () => IRNode.fromJSON({ kind: "UnknownNode" }),
    "No fromJSON handler registered for node kind: UnknownNode",
  );

  console.log("All IR fromJSON handler validation checks passed.\n");
})();

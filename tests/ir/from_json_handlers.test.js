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
    () => IRNode.fromJSON([]),
    "Invalid IR JSON: missing 'kind' property",
  );

  expectThrows(
    () => IRNode.fromJSON({ kind: "UnknownNode" }),
    "No fromJSON handler registered for node kind: UnknownNode",
  );

  console.log("All IR fromJSON handler validation checks passed.\n");
})();
/* eslint-env jest */

const { IRNode, NodeCategory, fromJsonHandlers } = require('../../src/ir/nodes');

describe('IRNode.fromJSON handler map', () => {
    test('includes a handler for every NodeCategory', () => {
        const missingHandlers = Object.values(NodeCategory).filter(
            kind => typeof fromJsonHandlers[kind] !== 'function'
        );

        expect(missingHandlers).toEqual([]);
    });

    test('throws a descriptive error when handler is missing', () => {
        expect(() => IRNode.fromJSON({ kind: 'NonExistentKind' }))
            .toThrow('No fromJSON handler registered for node kind: NonExistentKind');
    });
});

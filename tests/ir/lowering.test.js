"use strict";

const assert = require("assert");
const { parseAndLower } = require("../../src/ir/pipeline");
const { validateIR } = require("../../src/ir/validator");

const source = `
function add(a, b) {
  const result = a + b;
  return result;
}

const square = (n) => n * n;
`;

const ir = parseAndLower(source, {
  sourcePath: "sample.js",
  metadata: { authoredBy: "lowering-test" },
});

assert.ok(validateIR(ir).ok, "IR should validate");

const bodyNodeIds = ir.module.body;
assert.ok(bodyNodeIds.length >= 2, "Expected at least two top-level nodes");

const nodes = ir.nodes;
const functionNodes = bodyNodeIds
  .map((id) => nodes[id])
  .filter((node) => node && node.kind === "FunctionDeclaration");

assert.strictEqual(functionNodes.length, 1, "Expected one function declaration in IR");

const variableNodes = bodyNodeIds
  .map((id) => nodes[id])
  .filter((node) => node && node.kind === "VariableDeclaration");

assert.ok(variableNodes.length >= 1, "Expected variable declaration for arrow function assignment");

const arrowFunctionNode = Object.values(nodes).find(
  (node) => node.kind === "FunctionDeclaration" && node.arrow
);
assert.ok(arrowFunctionNode, "Arrow function expression should be lowered");

const cfgEntries = Object.keys(ir.controlFlowGraphs || {});
assert.ok(cfgEntries.length >= 1, "Function lowering should register a CFG");

console.log("IR lowering pipeline tests completed successfully.");

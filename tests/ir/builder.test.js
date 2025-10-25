"use strict";

const assert = require("assert");
const { IRBuilder } = require("../../src/ir/builder");
const { BalancedTernaryIdGenerator, encodeBalancedTernary } = require("../../src/ir/idGenerator");
const { decodeBalancedTernaryString } = require("../../src/ir/validator");

(function testBalancedTernaryEncoding() {
  const expected = [
    { n: 0, repr: "0" },
    { n: 1, repr: "1" },
    { n: 2, repr: "1T" },
    { n: 3, repr: "10" },
    { n: 4, repr: "11" },
    { n: 5, repr: "1TT" },
  ];

  expected.forEach(({ n, repr }) => {
    assert.strictEqual(encodeBalancedTernary(n), repr, `encodeBalancedTernary(${n})`);
    assert.strictEqual(decodeBalancedTernaryString(repr), n, `decodeBalancedTernaryString(${repr})`);
  });
})();

(function testIdGeneratorProducesBalancedIdentifiers() {
  const generator = new BalancedTernaryIdGenerator({ prefix: "test" });
  const ids = Array.from({ length: 6 }, () => generator.next());

  ids.forEach((id) => {
    const [, digits] = id.split("_");
    assert(/^[T01]+$/.test(digits), `ID ${id} should be balanced ternary`);
  });

  assert.strictEqual(ids[0], "test_0");
  assert.strictEqual(ids[1], "test_1");
})();

(function testIRBuilderProducesValidModule() {
  const builder = new IRBuilder({
    source: { path: "examples/add.js", hash: "sha256:demo" },
    directives: ["use strict"],
    metadata: { authoredBy: "unit-test" },
  });

  const idA = builder.identifier("a");
  const idB = builder.identifier("b");
  const sumExpr = builder.binaryExpression(idA.id, "+", idB.id);
  const decl = builder.variableDeclaration([
    builder.variableDeclarator(idA.id, idB.id, { kind: "const" }),
  ]);
  const block = builder.blockStatement([decl.id, sumExpr.id]);
  builder.functionDeclaration("add", [idA.id, idB.id], block.id, {
    meta: { auditTags: ["knuth:balanced-ternary"] },
  });

  const cfgId = `cfg_${encodeBalancedTernary(27)}`;
  const entryId = `bb_${encodeBalancedTernary(1)}`;
  const exitId = `bb_${encodeBalancedTernary(2)}`;

  builder.registerControlFlowGraph(cfgId, {
    id: cfgId,
    blocks: [
      {
        id: entryId,
        kind: "entry",
        statements: block.statements,
      },
      {
        id: exitId,
        kind: "exit",
        statements: [],
      },
    ],
    successors: {
      [entryId]: [exitId],
      [exitId]: [],
    },
    predecessors: {
      [entryId]: [],
      [exitId]: [entryId],
    },
  });

  const ir = builder.build();

  assert.strictEqual(ir.schemaVersion, "1.0.0");
  assert.ok(Array.isArray(ir.module.body), "module.body must be an array");
  assert.ok(ir.module.body.length > 0, "module.body should contain nodes");

  ir.module.body.forEach((nodeId) => {
    assert.ok(ir.nodes[nodeId], `node ${nodeId} must exist`);
  });

  const someNodeId = ir.module.body[0];
  const node = ir.nodes[someNodeId];
  assert.ok(node.meta, "node.meta should be defined");
  assert.ok(/^[T01]+$/.test(someNodeId.split("_")[1]));

  assert.ok(ir.controlFlowGraphs[cfgId], "CFG should be serialized");
  const cfg = ir.controlFlowGraphs[cfgId];
  assert.strictEqual(cfg.blocks.length, 2, "CFG should contain entry and exit blocks");
  assert.deepStrictEqual(cfg.successors[entryId], [exitId]);
})();

console.log("IR builder tests completed successfully.");

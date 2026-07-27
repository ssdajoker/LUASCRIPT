"use strict";

const assert = require("assert");
const { IRLowerer } = require("../../src/ir/lowerer");

function createLowerer() {
  return new IRLowerer({ validate: false });
}

function lowerSingleStatement(statement, options = { pushToBody: true }) {
  const lowerer = createLowerer();
  const lowered = lowerer.lowerStatement(statement, options);
  return { lowerer, lowered };
}

(function testDispatchMapCoverage() {
  const lowerer = createLowerer();
  const handlers = lowerer.statementDispatch;
  const expectedTypes = [
    "BlockStatement",
    "VariableDeclaration",
    "ExpressionStatement",
    "ReturnStatement",
    "IfStatement",
    "WhileStatement",
    "SwitchStatement",
    "ClassDeclaration",
    "TryStatement",
    "FunctionDeclaration",
  ];

  expectedTypes.forEach((type) => {
    assert.ok(handlers[type], `Dispatcher should include handler for ${type}`);
    assert.strictEqual(typeof handlers[type].lower, "function", `${type} handler should be callable`);
  });
})();

(function testBlockStatementNotPushedByDefault() {
  const { lowerer, lowered } = lowerSingleStatement({
    type: "BlockStatement",
    body: [
      {
        type: "ExpressionStatement",
        expression: { type: "Literal", value: 1 },
      },
    ],
  });

  assert.strictEqual(lowerer.builder.module.body.length, 0, "Blocks should remain inline");
  assert.strictEqual(lowered.kind, "BlockStatement");
  assert.strictEqual(lowered.statements.length, 1);
})();

(function testVariableDeclarationBinding() {
  const declaration = {
    type: "VariableDeclaration",
    declarations: [
      {
        type: "VariableDeclarator",
        id: { type: "Identifier", name: "x" },
        init: { type: "Literal", value: 42 },
      },
    ],
    kind: "let",
  };
  const { lowerer, lowered } = lowerSingleStatement(declaration);

  assert.strictEqual(lowerer.builder.module.body[0], lowered.id, "Variable declarations should be pushed");
  assert.strictEqual(lowered.kind, "VariableDeclaration");
  assert.strictEqual(lowered.declarations[0].name, "x");
  assert.strictEqual(lowered.declarations[0].varKind, "let");
})();

(function testExpressionAndReturnStatements() {
  const expr = {
    type: "ExpressionStatement",
    expression: { type: "Literal", value: "hello" },
  };
  const { lowerer: exprLowerer, lowered: exprLowered } = lowerSingleStatement(expr);
  assert.strictEqual(exprLowerer.builder.module.body[0], exprLowered.id, "Expression statements should be pushed");
  assert.strictEqual(exprLowered.kind, "ExpressionStatement");

  const { lowerer: returnLowerer, lowered: returnLowered } = lowerSingleStatement({
    type: "ReturnStatement",
    argument: { type: "Identifier", name: "result" },
  });
  assert.strictEqual(returnLowerer.builder.module.body[0], returnLowered.id, "Return statements should be pushed");
  assert.strictEqual(returnLowered.kind, "ReturnStatement");
})();

(function testConditionalAndLoopLowering() {
  const ifNode = {
    type: "IfStatement",
    test: { type: "Literal", value: true },
    consequent: { type: "ExpressionStatement", expression: { type: "Literal", value: 1 } },
    alternate: { type: "ExpressionStatement", expression: { type: "Literal", value: 0 } },
  };
  const { lowerer: ifLowerer, lowered: ifLowered } = lowerSingleStatement(ifNode);
  assert.strictEqual(ifLowerer.builder.module.body[0], ifLowered.id);
  assert.strictEqual(ifLowered.kind, "IfStatement");

  const whileNode = {
    type: "WhileStatement",
    test: { type: "Identifier", name: "flag" },
    body: { type: "ExpressionStatement", expression: { type: "Literal", value: 5 } },
  };
  const { lowerer: whileLowerer, lowered: whileLowered } = lowerSingleStatement(whileNode);
  assert.strictEqual(whileLowerer.builder.module.body[0], whileLowered.id);
  assert.strictEqual(whileLowered.kind, "WhileStatement");
})();

(function testSwitchLoweringProducesIfChain() {
  const switchNode = {
    type: "SwitchStatement",
    discriminant: { type: "Identifier", name: "value" },
    cases: [
      { test: { type: "Literal", value: 1 }, consequent: [] },
      { test: null, consequent: [] },
    ],
  };
  const { lowerer, lowered } = lowerSingleStatement(switchNode);
  assert.strictEqual(lowerer.builder.module.body[0], lowered.id);
  assert.strictEqual(lowered.kind, "IfStatement", "Switch should lower to conditional chain");
})();

(function testTryCatchLowering() {
  const tryNode = {
    type: "TryStatement",
    block: { type: "BlockStatement", body: [] },
    handler: {
      param: { type: "Identifier", name: "err" },
      body: { type: "BlockStatement", body: [] },
    },
    finalizer: { type: "BlockStatement", body: [] },
  };
  const { lowerer, lowered } = lowerSingleStatement(tryNode);
  assert.strictEqual(lowerer.builder.module.body[0], lowered.id);
  assert.strictEqual(lowered.kind, "TryStatement");
  assert.ok(lowered.handler.param, "Handler parameter should be preserved");
})();

(function testClassLoweringPreservesConstructorBinding() {
  const classNode = {
    type: "ClassDeclaration",
    id: { type: "Identifier", name: "Demo" },
    body: [
      {
        kind: "constructor",
        params: [{ type: "Identifier", name: "value" }],
        body: { type: "BlockStatement", body: [] },
      },
      {
        kind: "method",
        key: { type: "Identifier", name: "get" },
        params: [],
        body: { type: "BlockStatement", body: [] },
      },
    ],
  };
  const { lowerer, lowered } = lowerSingleStatement(classNode);
  assert.ok(lowerer.builder.module.body.includes(lowered.id), "Class constructor should be pushed to module body");
  assert.strictEqual(lowered.kind, "FunctionDeclaration", "Class lowering creates a constructor function");
  assert.strictEqual(lowered.name, "Demo");
  assert.strictEqual(lowered.metadata.classLike, true, "Class metadata should be flagged");
})();

(function testNestedFunctionDeclaration() {
  const fnNode = {
    type: "FunctionDeclaration",
    id: { type: "Identifier", name: "inner" },
    params: [{ type: "Identifier", name: "arg" }],
    body: {
      type: "BlockStatement",
      body: [
        { type: "ReturnStatement", argument: { type: "Identifier", name: "arg" } },
      ],
    },
  };

  const { lowerer, lowered } = lowerSingleStatement(fnNode);
  assert.ok(lowerer.builder.module.body.includes(lowered.id));
  assert.strictEqual(lowered.kind, "FunctionDeclaration");
  const paramNames = lowered.parameters.map((paramId) => lowerer.builder.nodes[paramId]?.name);
  assert.deepStrictEqual(paramNames, ["arg"], "Function params should carry bindings");
})();

console.log("Statement dispatch refactor tests passed.");

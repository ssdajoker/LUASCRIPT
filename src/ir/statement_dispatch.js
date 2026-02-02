"use strict";

function createStatementDispatch(irLowerer) {
  return {
    BlockStatement: {
      lower: (node) => irLowerer.lowerBlockStatement(node),
      pushToBody: false,
    },
    VariableDeclaration: {
      lower: (node) => irLowerer.lowerVariableDeclaration(node),
      pushToBody: true,
    },
    ExpressionStatement: {
      lower: (node) => irLowerer.lowerExpressionStatement(node),
      pushToBody: true,
    },
    ReturnStatement: {
      lower: (node) => irLowerer.lowerReturnStatement(node),
      pushToBody: true,
    },
    IfStatement: {
      lower: (node) => irLowerer.lowerIfStatement(node),
      pushToBody: true,
    },
    WhileStatement: {
      lower: (node) => irLowerer.loopLowerer.lowerWhileStatement(node),
      pushToBody: true,
    },
    ForStatement: {
      lower: (node) => irLowerer.loopLowerer.lowerForStatement(node),
      pushToBody: true,
    },
    ForOfStatement: {
      lower: (node) => irLowerer.loopLowerer.lowerForOfStatement(node),
      pushToBody: true,
    },
    ForInStatement: {
      lower: (node) => irLowerer.loopLowerer.lowerForInStatement(node),
      pushToBody: true,
    },
    DoWhileStatement: {
      lower: (node) => irLowerer.loopLowerer.lowerDoWhileStatement(node),
      pushToBody: true,
    },
    BreakStatement: {
      lower: () => irLowerer.builder.break(),
      pushToBody: true,
    },
    ContinueStatement: {
      lower: () => irLowerer.builder.continue(),
      pushToBody: true,
    },
    ThrowStatement: {
      lower: (node) => irLowerer.lowerThrowStatement(node),
      pushToBody: true,
    },
    SwitchStatement: {
      lower: (node) => irLowerer.lowerSwitchStatement(node),
      pushToBody: true,
    },
    ClassDeclaration: {
      lower: (node, context) => irLowerer.classLowerer.lowerClassDeclaration(node, context),
      pushToBody: false,
    },
    TryStatement: {
      lower: (node) => irLowerer.tryLowerer.lowerTryStatement(node),
      pushToBody: true,
    },
    FunctionDeclaration: {
      lower: (node, context) => {
        // Check if it's async
        if (node.async) {
          return irLowerer.lowerAsyncFunctionDeclaration(node, { pushToBody: context.pushToBody });
        }
        // Check if it's a generator
        if (node.generator) {
          return irLowerer.lowerGeneratorDeclaration(node, { pushToBody: context.pushToBody });
        }
        // Regular function declaration
        return irLowerer.lowerFunctionDeclaration(node, { pushToBody: context.pushToBody });
      },
      pushToBody: false,
    },
    AsyncFunctionDeclaration: {
      lower: (node, context) => irLowerer.lowerAsyncFunctionDeclaration(node, { pushToBody: context.pushToBody }),
      pushToBody: false,
    },
  };
}

module.exports = { createStatementDispatch };

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
      lower: (node, context) => irLowerer.lowerFunctionDeclaration(node, { pushToBody: context.pushToBody }),
      pushToBody: false,
    },
  };
}

module.exports = { createStatementDispatch };

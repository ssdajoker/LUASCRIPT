"use strict";

class LoopLowerer {
  constructor(irLowerer) {
    this.irLowerer = irLowerer;
  }

  lowerWhileStatement(node) {
    const testRef = this.irLowerer.lowerExpression(node.test);
    const bodyBlock = this.irLowerer.ensureBlock(node.body);
    return this.irLowerer.builder.whileStatement(testRef, bodyBlock.id);
  }

  lowerForStatement(node) {
    const initRef = node.init ? this.irLowerer.lowerStatement(node.init, { pushToBody: false }) : null;
    const testRef = node.test ? this.irLowerer.lowerExpression(node.test) : null;
    const updateRef = node.update ? this.irLowerer.lowerExpression(node.update) : null;
    const bodyBlock = this.irLowerer.ensureBlock(node.body);
    return this.irLowerer.builder.forStatement(initRef ? initRef.id : null, testRef, updateRef, bodyBlock.id);
  }

  lowerForOfStatement(node) {
    const left = node.left;
    let leftName = null;
    if (left && left.type === "VariableDeclaration" && left.declarations && left.declarations[0]) {
      leftName = left.declarations[0].id.name;
    } else if (left && left.type === "Identifier") {
      leftName = left.name;
    }
    const iterableRef = this.irLowerer.lowerExpression(node.right);
    const bodyBlock = this.irLowerer.ensureBlock(node.body);
    return this.irLowerer.builder.forOfStatement(leftName, iterableRef, bodyBlock.id, { await: Boolean(node.await) });
  }
}

module.exports = { LoopLowerer };

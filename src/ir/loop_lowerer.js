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
}

module.exports = { LoopLowerer };

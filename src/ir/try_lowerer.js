"use strict";

class TryLowerer {
  constructor(irLowerer) {
    this.irLowerer = irLowerer;
  }

  lowerTryStatement(node) {
    const block = this.irLowerer.ensureBlock(node.block);
    let handler = null;
    if (node.handler) {
      const paramRef = node.handler.param
        ? this.irLowerer.lowerExpression(node.handler.param)
        : null;
      const handlerBody = this.irLowerer.ensureBlock(node.handler.body);
      handler = { param: paramRef, body: handlerBody.id };
    }
    const finalizer = node.finalizer
      ? this.irLowerer.ensureBlock(node.finalizer).id
      : null;
    return this.irLowerer.builder.tryStatement(block.id, handler, finalizer);
  }
}

module.exports = { TryLowerer };

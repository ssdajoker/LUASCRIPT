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
      // Create proper CatchClause node using builder
      handler = this.irLowerer.builder.catchClause(paramRef, handlerBody.id);
    }
    let finalizer = null;
    if (node.finalizer) {
      const finalizerBody = this.irLowerer.ensureBlock(node.finalizer);
      finalizer = this.irLowerer.builder.finallyClause(finalizerBody.id);
    }
    return this.irLowerer.builder.tryStmt(block.id, handler ? handler.id : null, finalizer ? finalizer.id : null);
  }
}

module.exports = { TryLowerer };

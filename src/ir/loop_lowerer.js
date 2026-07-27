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
    const iterableRef = this.irLowerer.lowerExpression(node.right);
    const bodyBlock = this.irLowerer.ensureBlock(node.body);

    if (left && left.type === "VariableDeclaration" && left.declarations && left.declarations[0]) {
      const declarator = left.declarations[0];
      if (declarator.id.type === "Identifier") {
        leftName = declarator.id.name;
      } else if (declarator.id.type === "ArrayPattern" || declarator.id.type === "ObjectPattern") {
        leftName = this.irLowerer.createTempVar("__iter_val");
        const sourceId = this.irLowerer.builder.identifier(leftName).id;
        const declarations = [];
        const extraStatements = [];
        if (declarator.id.type === "ArrayPattern") {
          this.irLowerer.lowerArrayPatternBindings(declarator.id, sourceId, declarations, left.kind, extraStatements);
        } else {
          this.irLowerer.lowerObjectPatternBindings(declarator.id, sourceId, declarations, left.kind, extraStatements);
        }
        if (declarations.length > 0) {
          const varDecl = this.irLowerer.builder.variableDeclaration(declarations, { kind: left.kind });
          const prependIds = [varDecl.id, ...extraStatements.map(stmt => stmt.id)];
          this.irLowerer.prependStatementsToBlock(bodyBlock, prependIds);
        }
      }
    } else if (left && left.type === "Identifier") {
      leftName = left.name;
    }

    return this.irLowerer.builder.forOfStatement(leftName, iterableRef, bodyBlock.id, { await: Boolean(node.await) });
  }

  lowerForInStatement(node) {
    const left = node.left;
    let leftName = null;
    if (left && left.type === "VariableDeclaration" && left.declarations && left.declarations[0]) {
      leftName = left.declarations[0].id.name;
    } else if (left && left.type === "Identifier") {
      leftName = left.name;
    }
    const iterableRef = this.irLowerer.lowerExpression(node.right);
    const bodyBlock = this.irLowerer.ensureBlock(node.body);
    return this.irLowerer.builder.forInStatement(leftName, iterableRef, bodyBlock.id);
  }

  lowerDoWhileStatement(node) {
    const testRef = this.irLowerer.lowerExpression(node.test);
    const bodyBlock = this.irLowerer.ensureBlock(node.body);
    return this.irLowerer.builder.doWhileStatement(bodyBlock.id, testRef);
  }
}

module.exports = { LoopLowerer };

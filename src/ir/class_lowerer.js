"use strict";

class ClassLowerer {
  constructor(irLowerer) {
    this.irLowerer = irLowerer;
  }

  lowerClassDeclaration(node, { pushToBody } = {}) {
    const methods = node.body || [];
    const ctor = methods.find((m) => m.kind === "constructor");
    const idNode = this.irLowerer.lowerIdentifier(node.id, { binding: node.id?.name });
    let params = [];
    let bodyBlock;
    if (ctor) {
      params = (ctor.params || []).map((p) =>
        this.irLowerer.lowerIdentifier(p, { binding: p.name }).id
      );
      bodyBlock = this.irLowerer.ensureBlock(ctor.body);
    } else {
      bodyBlock = this.irLowerer.builder.blockStatement([]);
    }
    const fn = this.irLowerer.builder.functionDeclaration(
      idNode.name,
      params,
      bodyBlock.id,
      null,
      { pushToModule: false, metadata: { classLike: true } }
    );
    if (pushToBody !== false) this.irLowerer.builder.pushToBody(fn);

    for (const m of methods) {
      if (m.kind === "constructor") continue;
      const keyId = this.irLowerer.lowerIdentifier(m.key);
      const mParams = (m.params || []).map((p) =>
        this.irLowerer.lowerIdentifier(p, { binding: p.name }).id
      );
      const mBody = this.irLowerer.ensureBlock(m.body);
      const funcExprId = this.irLowerer.builder.arrowFunctionExpression(
        mParams,
        mBody.id,
        {}
      ).id;

      if (m.static) {
        const lhs = this.irLowerer.builder.createMemberExpression(
          idNode.id,
          keyId.id,
          { computed: false }
        ).id;
        const assign = this.irLowerer.builder.assignmentExpression(lhs, "=", funcExprId).id;
        const stmt = this.irLowerer.builder.expressionStatement(assign);
        this.irLowerer.builder.pushToBody(stmt);
      } else {
        const protoKey = this.irLowerer.builder.identifier("prototype").id;
        const proto = this.irLowerer.builder.createMemberExpression(
          idNode.id,
          protoKey,
          { computed: false }
        ).id;
        const lhs = this.irLowerer.builder.createMemberExpression(
          proto,
          keyId.id,
          { computed: false }
        ).id;
        const assign = this.irLowerer.builder.assignmentExpression(lhs, "=", funcExprId).id;
        const stmt = this.irLowerer.builder.expressionStatement(assign);
        this.irLowerer.builder.pushToBody(stmt);
      }
    }
    return fn;
  }
}

module.exports = { ClassLowerer };

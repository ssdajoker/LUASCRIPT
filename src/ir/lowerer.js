"use strict";

const { IRBuilder } = require("./builder");
const { normalizeProgram } = require("./normalizer");

class IRLowerer {
  constructor(options = {}) {
    const {
      sourcePath = null,
      sourceHash = null,
      directives = [],
      metadata = {},
      toolchain = {},
      schemaVersion = "1.0.0",
    } = options;

    this.options = options;
    this.builder = new IRBuilder({
      schemaVersion,
      source: { path: sourcePath, hash: sourceHash },
      directives,
      metadata,
      toolchain,
    });
  }

  lowerProgram(programNode) {
    const normalized = normalizeProgram(programNode);

    normalized.body.forEach((statement) => {
      this.lowerStatement(statement, { pushToBody: true });
    });

    return this.builder.build({ validate: this.options.validate !== false });
  }

  lowerStatement(node, context = {}) {
    if (!node) {
      return null;
    }

    const shouldPush = Boolean(context.pushToBody);

    switch (node.type) {
      case "BlockStatement": {
        return this.lowerBlockStatement(node);
      }
      case "VariableDeclaration": {
        const lowered = this.lowerVariableDeclaration(node);
        if (shouldPush) this.builder.pushToBody(lowered);
        return lowered;
      }
      case "ExpressionStatement": {
        const lowered = this.lowerExpressionStatement(node);
        if (shouldPush) this.builder.pushToBody(lowered);
        return lowered;
      }
      case "ReturnStatement": {
        const lowered = this.lowerReturnStatement(node);
        if (shouldPush) this.builder.pushToBody(lowered);
        return lowered;
      }
      case "IfStatement": {
        const lowered = this.lowerIfStatement(node);
        if (shouldPush) this.builder.pushToBody(lowered);
        return lowered;
      }
      case "WhileStatement": {
        const lowered = this.lowerWhileStatement(node);
        if (shouldPush) this.builder.pushToBody(lowered);
        return lowered;
      }
      case "FunctionDeclaration": {
        return this.lowerFunctionDeclaration(node, { pushToBody: shouldPush });
      }
      default: {
        const exprId = this.lowerExpression(node);
        const lowered = this.builder.expressionStatement(exprId);
        if (shouldPush) this.builder.pushToBody(lowered);
        return lowered;
      }
    }
  }

  lowerBlockStatement(node) {
    const statementIds = [];
    (node.body || []).forEach((statement) => {
      const lowered = this.lowerStatement(statement, { pushToBody: false });
      if (lowered) {
        statementIds.push(lowered.id);
      }
    });
    return this.builder.blockStatement(statementIds);
  }

  lowerVariableDeclaration(node) {
    const declarations = node.declarations.map((decl) => {
      const idNode = this.lowerIdentifier(decl.id, { binding: decl.id?.name });
      const initRef = decl.init ? this.lowerExpression(decl.init) : null;
      return this.builder.variableDeclarator(idNode.id, initRef, {
        kind: node.kind,
      });
    });

    return this.builder.variableDeclaration(declarations, { kind: node.kind });
  }

  lowerExpressionStatement(node) {
    const expressionId = this.lowerExpression(node.expression);
    return this.builder.expressionStatement(expressionId);
  }

  lowerReturnStatement(node) {
    const argumentRef = node.argument ? this.lowerExpression(node.argument) : null;
    return this.builder.returnStatement(argumentRef);
  }

  lowerIfStatement(node) {
    const testRef = this.lowerExpression(node.test);
    const consequent = this.ensureBlock(node.consequent);
    const alternate = node.alternate ? this.ensureBlock(node.alternate) : null;

    return this.builder.ifStatement(
      testRef,
      consequent.id,
      alternate ? alternate.id : null
    );
  }

  lowerWhileStatement(node) {
    const testRef = this.lowerExpression(node.test);
    const bodyBlock = this.ensureBlock(node.body);
    return this.builder.whileStatement(testRef, bodyBlock.id);
  }

  lowerFunctionDeclaration(node, { pushToBody }) {
    const idNode = this.lowerIdentifier(node.id, { binding: node.id?.name });
    const params = (node.params || []).map((param) =>
      this.lowerIdentifier(param, { binding: param.name }).id
    );

    const bodyBlock = this.lowerBlockStatement(
      this.normalizeBlockForFunction(node.body)
    );

    const cfgInfo = this.createFunctionCfg(bodyBlock);

    const meta = Object.assign({}, this.options.functionMeta || {}, {
      auditTags: ["knuth:awaiting-proof"],
      cfg: {
        id: cfgInfo.cfgId,
        entry: cfgInfo.entryBlockId,
        exit: cfgInfo.exitBlockId,
      },
    });

    return this.builder.functionDeclaration(
      idNode.name,
      params,
      bodyBlock.id,
      {
        meta,
        pushToModule: pushToBody !== false,
      }
    );
  }

  lowerExpression(node) {
    if (!node) {
      return null;
    }

    switch (node.type) {
      case "Identifier": {
        return this.lowerIdentifier(node).id;
      }
      case "Literal": {
        return this.builder.literal(node.value, { raw: node.raw }).id;
      }
      case "BinaryExpression": {
        const left = this.lowerExpression(node.left);
        const right = this.lowerExpression(node.right);
        return this.builder.binaryExpression(left, node.operator, right).id;
      }
      case "LogicalExpression": {
        const left = this.lowerExpression(node.left);
        const right = this.lowerExpression(node.right);
        return this.builder.logicalExpression(left, node.operator, right).id;
      }
      case "AssignmentExpression": {
        const left = this.lowerExpression(node.left);
        const right = this.lowerExpression(node.right);
        return this.builder.assignmentExpression(left, node.operator, right).id;
      }
      case "UnaryExpression": {
        const argument = this.lowerExpression(node.argument);
        return this.builder.unaryExpression(node.operator, argument).id;
      }
      case "CallExpression": {
        const callee = this.lowerExpression(node.callee);
        const args = (node.arguments || []).map((arg) => this.lowerExpression(arg));
        return this.builder.callExpression(callee, args).id;
      }
      case "ArrowFunctionExpression": {
        return this.lowerArrowFunctionExpression(node).id;
      }
      case "FunctionDeclaration": {
        const functionNode = this.lowerFunctionDeclaration(node, {
          pushToBody: false,
        });
        return functionNode.id;
      }
      case "ExpressionStatement": {
        return this.lowerExpression(node.expression);
      }
      default: {
        throw new Error(`Lowerer does not yet support expression type ${node.type}`);
      }
    }
  }

  lowerArrowFunctionExpression(node) {
    const params = (node.params || []).map((param) =>
      this.lowerIdentifier(param, { binding: param.name }).id
    );

    let bodyBlock;

    if (node.body && node.body.type === "BlockStatement") {
      bodyBlock = this.lowerBlockStatement(node.body);
    } else if (node.body) {
      const valueId = this.lowerExpression(node.body);
      const returnNode = this.builder.returnStatement(valueId);
      bodyBlock = this.builder.blockStatement([returnNode.id]);
    } else {
      bodyBlock = this.builder.blockStatement([]);
    }

    return this.builder.arrowFunctionExpression(params, bodyBlock.id, {
      async: node.async,
    });
  }

  lowerIdentifier(node, { binding } = {}) {
    if (!node || node.type !== "Identifier") {
      throw new Error("Expected Identifier node");
    }

    return this.builder.identifier(node.name, {
      binding: binding || node.name,
    });
  }

  ensureBlock(node) {
    if (!node) {
      return this.builder.blockStatement([]);
    }

    if (node.type === "BlockStatement") {
      return this.lowerBlockStatement(node);
    }

    const statement = this.lowerStatement(node, { pushToBody: false });
    return this.builder.blockStatement([statement.id]);
  }

  normalizeBlockForFunction(node) {
    if (!node) {
      return { type: "BlockStatement", body: [] };
    }
    if (node.type === "BlockStatement") {
      return node;
    }
    return {
      type: "BlockStatement",
      body: [node],
    };
  }

  createFunctionCfg(bodyNode) {
    const cfgId = this.builder.idGenerator.next("cfg");
    const entryBlockId = this.builder.idGenerator.next("bb");
    const exitBlockId = this.builder.idGenerator.next("bb");

    const blockStatements = bodyNode.statements || [];

    const cfg = {
      id: cfgId,
      blocks: [
        {
          id: entryBlockId,
          kind: "entry",
          statements: blockStatements,
        },
        {
          id: exitBlockId,
          kind: "exit",
          statements: [],
        },
      ],
      successors: {
        [entryBlockId]: [exitBlockId],
        [exitBlockId]: [],
      },
      predecessors: {
        [entryBlockId]: [],
        [exitBlockId]: [entryBlockId],
      },
    };

    this.builder.registerControlFlowGraph(cfgId, cfg);

    return { cfgId, entryBlockId, exitBlockId };
  }
}

function lowerToIR(programNode, options = {}) {
  const lowerer = new IRLowerer(options);
  return lowerer.lowerProgram(programNode);
}

module.exports = {
  IRLowerer,
  lowerToIR,
};

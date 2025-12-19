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
      case "SwitchStatement": {
        const lowered = this.lowerSwitchStatement(node);
        if (shouldPush) this.builder.pushToBody(lowered);
        return lowered;
      }
      case "ClassDeclaration": {
        const lowered = this.lowerClassDeclaration(node);
        if (shouldPush && lowered) this.builder.pushToBody(lowered);
        return lowered;
      }
      case "TryStatement": {
        const lowered = this.lowerTryStatement(node);
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
      return this.builder.varDecl(idNode.name, initRef, null, { // varDecl expects name, not id
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

  lowerSwitchStatement(node) {
    // Lower switch to if/elseif/else chain: if (disc==case1) {..} elseif (disc==case2) {..} else { default }
    const discRef = this.lowerExpression(node.discriminant);
    const cases = node.cases || [];
    // Build blocks for each case
    const buildCaseBlock = (conseq) => this.ensureBlock({ type: "BlockStatement", body: conseq });
    let defaultBlock = null;
    const casePairs = [];
    for (const c of cases) {
      if (!c.test) {
        defaultBlock = buildCaseBlock(c.consequent);
      } else {
        const rightRef = this.lowerExpression(c.test);
        const eqRef = this.builder.binaryExpression(discRef, "===", rightRef).id;
        const blk = buildCaseBlock(c.consequent);
        casePairs.push({ testRef: eqRef, block: blk });
      }
    }
    if (casePairs.length === 0) {
      return defaultBlock ? this.builder.blockStatement(defaultBlock.statements) : this.builder.blockStatement([]);
    }
    // Fold into nested ifs
    const buildIfChain = (index) => {
      const { testRef, block } = casePairs[index];
      const consequentRef = block.id;
      const alt = (index + 1 < casePairs.length)
        ? buildIfChain(index + 1)
        : (defaultBlock ? defaultBlock.id : null);
      return this.builder.ifStatement(testRef, consequentRef, alt);
    };
    return buildIfChain(0);
  }

  lowerClassDeclaration(node, { pushToBody } = {}) {
    // Build constructor function: either class constructor method or empty body
    const idNode = this.lowerIdentifier(node.id, { binding: node.id?.name });
    const methods = node.body || [];
    const ctor = methods.find((m) => m.kind === "constructor");
    let params = [];
    let bodyBlock;
    if (ctor) {
      params = (ctor.params || []).map((p) => this.lowerIdentifier(p, { binding: p.name }).id);
      bodyBlock = this.ensureBlock(ctor.body);
    } else {
      bodyBlock = this.builder.blockStatement([]);
    }
    const fn = this.builder.functionDeclaration(idNode.name, params, bodyBlock.id, { pushToModule: false, meta: { classLike: true } });
    if (pushToBody !== false) this.builder.pushToBody(fn);

    // Prototype methods: C.prototype.method = function(...) { ... }
    for (const m of methods) {
      if (m.kind === "constructor") continue;
      const keyId = this.lowerIdentifier(m.key);
      const mParams = (m.params || []).map((p) => this.lowerIdentifier(p, { binding: p.name }).id);
      const mBody = this.ensureBlock(m.body);
      const funcExprId = this.builder.arrowFunctionExpression(mParams, mBody.id, {}).id; // use arrow-like function body

      if (m.static) {
        // C.key = function
        const lhs = this.builder.createMemberExpression(idNode.id, keyId.id, { computed: false }).id;
        const assign = this.builder.assignmentExpression(lhs, "=", funcExprId).id;
        const stmt = this.builder.expressionStatement(assign);
        this.builder.pushToBody(stmt);
      } else {
        // (C.prototype).key = function
        const protoKey = this.builder.identifier("prototype").id;
        const proto = this.builder.createMemberExpression(idNode.id, protoKey, { computed: false }).id;
        const lhs = this.builder.createMemberExpression(proto, keyId.id, { computed: false }).id;
        const assign = this.builder.assignmentExpression(lhs, "=", funcExprId).id;
        const stmt = this.builder.expressionStatement(assign);
        this.builder.pushToBody(stmt);
      }
    }
    return fn;
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
        async: Boolean(node.async),
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
        return this.builder.binaryOp(left, node.operator, right).id;
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
      case "UpdateExpression": {
        const argument = this.lowerExpression(node.argument);
        return this.builder.updateExpression(node.operator, argument, { prefix: Boolean(node.prefix) }).id;
      }
      case "CallExpression": {
        const callee = this.lowerExpression(node.callee);
        const args = (node.arguments || []).map((arg) => this.lowerExpression(arg));
        return this.builder.callExpression(callee, args).id;
      }
      case "NewExpression": {
        const callee = this.lowerExpression(node.callee);
        const args = (node.arguments || []).map((arg) => this.lowerExpression(arg));
        return this.builder.newExpression(callee, args).id;
      }
      case "MemberExpression": {
        const objectRef = this.lowerExpression(node.object);
        // property can be Identifier or expression; if Identifier, we lower to Identifier and use its id.
        const propertyRef = this.lowerExpression(node.property);
        return this.builder.createMemberExpression
          ? this.builder.createMemberExpression(objectRef, propertyRef, { computed: Boolean(node.computed) }).id
          : this.builder.nodeFactory.createMemberExpression(objectRef, propertyRef, { computed: Boolean(node.computed) }).id;
      }
      case "ArrayExpression": {
        const elements = (node.elements || []).map((el) => (el ? this.lowerExpression(el) : null)).filter((x) => x !== null);
        return this.builder.arrayExpression(elements).id;
      }
      case "ObjectExpression": {
        const props = (node.properties || []).map((p) => {
          const key = this.lowerExpression(p.key);
          const value = this.lowerExpression(p.value);
          return this.builder.property(key, value, { propertyKind: p.kind || "init", computed: Boolean(p.computed), shorthand: Boolean(p.shorthand) });
        });
        const propIds = props.map((pr) => pr.id);
        return this.builder.objectExpression(propIds).id;
      }
      case "ConditionalExpression": {
        const test = this.lowerExpression(node.test);
        const cons = this.lowerExpression(node.consequent);
        const alt = this.lowerExpression(node.alternate);
        return this.builder.conditionalExpression(test, cons, alt).id;
      }
      case "ArrowFunctionExpression": {
        return this.lowerArrowFunctionExpression(node).id;
      }
      case "FunctionExpression": {
        return this.lowerFunctionExpression(node).id;
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
      case "ArrayPattern": {
        return this.lowerArrayPattern(node).id;
      }
      case "ObjectPattern": {
        return this.lowerObjectPattern(node).id;
      }
      case "RestElement": {
        return this.lowerRestElement(node).id;
      }
      case "AssignmentPattern": {
        return this.lowerAssignmentPattern(node).id;
      }
      default: {
        throw new Error(`Lowerer does not yet support expression type ${node.type}`);
      }
    }
  }

  lowerArrayPattern(node) {
    const elements = (node.elements || []).map((el) => 
      el ? this.lowerExpression(el) : null
    );
    return this.builder.arrayPattern(elements);
  }

  lowerObjectPattern(node) {
    const properties = (node.properties || []).map((prop) => {
      const key = this.lowerExpression(prop.key);
      const value = this.lowerExpression(prop.value);
      return this.builder.property(key, value, { 
        propertyKind: prop.kind || "init",
        computed: Boolean(prop.computed),
        shorthand: Boolean(prop.shorthand)
      }).id;
    });
    return this.builder.objectPattern(properties);
  }

  lowerRestElement(node) {
    const argument = this.lowerExpression(node.argument);
    return this.builder.restElement(argument);
  }

  lowerAssignmentPattern(node) {
    const left = this.lowerExpression(node.left);
    const right = this.lowerExpression(node.right);
    return this.builder.assignmentPattern(left, right);
  }

  lowerTryStatement(node) {
    // Ensure block/handler/finalizer are lowered to BlockStatements
    const block = this.ensureBlock(node.block);
    let handler = null;
    if (node.handler) {
      // Handler shape: { param, body }
      const paramRef = node.handler.param ? this.lowerExpression(node.handler.param) : null;
      const handlerBody = this.ensureBlock(node.handler.body);
      handler = { param: paramRef, body: handlerBody.id };
    }
    const finalizer = node.finalizer ? this.ensureBlock(node.finalizer).id : null;
    return this.builder.tryStatement(block.id, handler, finalizer);
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

  lowerFunctionExpression(node) {
    // Handle optional name (anonymous functions have id: null)
    const name = node.id ? this.lowerIdentifier(node.id, { binding: node.id.name }).name : null;
    const params = (node.params || []).map((param) =>
      this.lowerIdentifier(param, { binding: param.name }).id
    );

    const bodyBlock = this.lowerBlockStatement(
      this.normalizeBlockForFunction(node.body)
    );

    return this.builder.functionExpression(
      name,
      params,
      bodyBlock.id,
      {
        async: Boolean(node.async),
        generator: Boolean(node.generator),
      }
    );
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

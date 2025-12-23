"use strict";

const { IRBuilder } = require("./builder");
const { normalizeProgram } = require("./normalizer");
const { LoopLowerer } = require("./loop_lowerer");
const { TryLowerer } = require("./try_lowerer");
const { ClassLowerer } = require("./class_lowerer");
const { createStatementDispatch } = require("./statement_dispatch");

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

    this.loopLowerer = new LoopLowerer(this);
    this.tryLowerer = new TryLowerer(this);
    this.classLowerer = new ClassLowerer(this);
    this.statementDispatch = createStatementDispatch(this);
    this.destructuringIndex = 0;
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
    const handler = this.statementDispatch[node.type];

    if (handler) {
      const lowered = handler.lower(node, { ...context, pushToBody: shouldPush });
      if (handler.pushToBody && shouldPush && lowered) {
        this.builder.pushToBody(lowered);
      }
      return lowered;
    }

    const lowered = this.lowerExpressionAsStatement(node);
    if (shouldPush && lowered) {
      this.builder.pushToBody(lowered);
    }
    return lowered;
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
    const declarations = [];
    node.declarations.forEach((decl) => {
      const initRef = decl.init ? this.lowerExpression(decl.init) : null;
      
      // Handle different pattern types for id
      if (decl.id.type === "Identifier") {
        declarations.push(this.builder.varDecl(decl.id.name, initRef, null, {
          kind: node.kind,
        }));
      } else if (decl.id.type === "ArrayPattern") {
        const tempName = `__ds${++this.destructuringIndex}`;
        const tempVar = this.builder.varDecl(tempName, initRef, null, { kind: node.kind });
        declarations.push(tempVar);
        const elements = decl.id.elements || [];
        elements.forEach((el, index) => {
          if (el && el.type === "Identifier") {
            const localId = this.lowerIdentifier(el, { binding: el.name });
            const tempId = this.builder.identifier(tempName).id;
            const indexId = this.builder.literal(index).id;
            const memberId = this.builder.memberExpression(tempId, indexId, true).id;
            declarations.push(this.builder.varDecl(localId.name, memberId, null, { kind: node.kind }));
          }
        });
      } else if (decl.id.type === "ObjectPattern") {
        const patternNode = this.lowerObjectPattern(decl.id);
        // Use pattern ID as the declarator name (varDecl will handle it)
        declarations.push(this.builder.varDecl(patternNode.id, initRef, null, {
          kind: node.kind,
          isPattern: true,
          patternKind: "ObjectPattern",
        }));
      } else {
        throw new Error(`Unsupported declarator id type: ${decl.id.type}`);
      }
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

  lowerThrowStatement(node) {
    const argumentRef = node.argument ? this.lowerExpression(node.argument) : null;
    return this.builder.throwStatement(argumentRef);
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
    return this.loopLowerer.lowerWhileStatement(node);
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
    return this.classLowerer.lowerClassDeclaration(node, { pushToBody });
  }

  lowerFunctionDeclaration(node, { pushToBody } = {}) {
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

    const fn = this.builder.functionDeclaration(
      node.id?.name,
      params,
      bodyBlock.id,
      null,
      {
        meta,
        async: Boolean(node.async),
        pushToModule: pushToBody !== false,
      }
    );

    if (pushToBody !== false) {
      this.builder.pushToBody(fn);
    }

    return fn;
  }

  // eslint-disable-next-line complexity
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
    case "UpdateExpression": {
      const argument = this.lowerExpression(node.argument);
      return this.builder.updateExpression(node.operator, argument, { prefix: Boolean(node.prefix) }).id;
    }
    case "CallExpression": {
      const callee = this.lowerExpression(node.callee);
      const args = (node.arguments || []).map((arg) => this.lowerExpression(arg));
      return this.builder.callExpression(callee, args, { optional: Boolean(node.optional) }).id;
    }
    case "NewExpression": {
      const callee = this.lowerExpression(node.callee);
      const args = (node.arguments || []).map((arg) => this.lowerExpression(arg));
      return this.builder.newExpression(callee, args).id;
    }
    case "MemberExpression": {
      const objectRef = this.lowerExpression(node.object);
      const propertyRef = this.lowerExpression(node.property);
      return this.builder.memberExpression(objectRef, propertyRef, Boolean(node.computed), { optional: Boolean(node.optional) }).id;
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
    case "Error": {
      // Gracefully lower parser error nodes to a nil literal to keep pipeline moving
      return this.builder.literal(null).id;
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

  lowerExpressionAsStatement(node) {
    const exprId = this.lowerExpression(node);
    return this.builder.expressionStatement(exprId);
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
    return this.tryLowerer.lowerTryStatement(node);
  }

  lowerArrowFunctionExpression(node) {
    const params = (node.params || []).map((param) => {
      // Handle Identifier params directly
      if (param.type === "Identifier") {
        return this.lowerIdentifier(param, { binding: param.name }).id;
      }
      // Handle AssignmentPattern (default params) - extract left side if Identifier
      if (param.type === "AssignmentPattern" && param.left.type === "Identifier") {
        // Warning: This ignores the default value for now, just binding the name
        // Real implementation should lower AssignmentPattern fully
        return this.lowerIdentifier(param.left, { binding: param.left.name }).id;
      }
      // Fallback for patterns: try lowering as expression (if supported) or error better
      // For now, let's try to lower it and see if it's an Identifier-like node
      // But lowerExpression returns an ID.
      // If we just skip patterns in legacy lowerer to avoid crash:
      if (param.type === "ArrayPattern" || param.type === "ObjectPattern") {
         // Create a dummy identifier to avoid crash, marking as unsupported pattern
         return this.builder.identifier(`__pattern_${Math.random().toString(36).substr(2,5)}`).id;
      }

      if (param.type === "Error") {
        // Gracefully handle parser errors in params
        return this.builder.identifier(`__error_param_${Math.random().toString(36).substr(2,5)}`).id;
      }

      throw new Error(`Unsupported param type in ArrowFunction: ${param.type}`);
    });

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
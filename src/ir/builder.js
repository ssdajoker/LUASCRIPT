"use strict";

const { BalancedTernaryIdGenerator } = require("./idGenerator");
const { IRNodeFactory } = require("./nodes");
const { validateIR } = require("./validator");

/**
 * Canonical IR builder that produces artifacts aligned with docs/canonical_ir_spec.md.
 */
class IRBuilder {
  constructor(options = {}) {
    const {
      schemaVersion = "1.0.0",
      moduleId,
      source = { path: null, hash: null },
      directives = [],
      metadata = {},
      exports = { type: "named", entries: [] },
      toolchain = {},
      idPrefix = "id",
    } = options;

    this.schemaVersion = schemaVersion;
    this.idGenerator = new BalancedTernaryIdGenerator({ prefix: idPrefix });
    this.nodeFactory = new IRNodeFactory({ idGenerator: this.idGenerator });

    this.module = {
      schemaVersion: this.schemaVersion,
      module: {
        id: moduleId || this.idGenerator.next("mod"),
        source,
        directives: [...directives],
        body: [],
        exports,
        metadata: Object.assign(
          {
            authoredBy: metadata.authoredBy || "ir-builder",
            createdAt: metadata.createdAt || new Date().toISOString(),
            toolchain,
          },
          metadata
        ),
      },
      nodes: {},
      controlFlowGraphs: {},
    };
  }

  addDirective(directive) {
    this.module.module.directives.push(directive);
    return this;
  }

  addExport(entry) {
    this.module.module.exports.entries.push(entry);
    return this;
  }

  /**
   * Registers a node and returns it.
   */
  registerNode(node) {
    if (!node || !node.id) {
      throw new Error("Node must have an id");
    }
    this.module.nodes[node.id] = node;
    return node;
  }

  /**
   * Adds a node id to the module body (top-level order).
   */
  pushToBody(node) {
    this.module.module.body.push(node.id);
    return node;
  }

  /**
   * Creates and registers an identifier.
   */
  identifier(name, options) {
    return this.registerNode(this.nodeFactory.createIdentifier(name, options));
  }

  literal(value, options) {
    return this.registerNode(this.nodeFactory.createLiteral(value, options));
  }

  binaryExpression(leftRef, operator, rightRef, options) {
    return this.registerNode(
      this.nodeFactory.createBinaryExpression(leftRef, operator, rightRef, options)
    );
  }

  logicalExpression(leftRef, operator, rightRef, options) {
    return this.registerNode(
      this.nodeFactory.createLogicalExpression(leftRef, operator, rightRef, options)
    );
  }

  assignmentExpression(leftRef, operator, rightRef, options) {
    return this.registerNode(
      this.nodeFactory.createAssignmentExpression(leftRef, operator, rightRef, options)
    );
  }

  variableDeclaration(declarations, options) {
    const normalizedOptions = options || {};
    return this.registerNode(
      this.nodeFactory.createVariableDeclaration(declarations, {
        declarationKind: normalizedOptions.kind || normalizedOptions.declarationKind,
        span: normalizedOptions.span,
        meta: normalizedOptions.meta,
      })
    );
  }

  variableDeclarator(patternRef, initRef, options) {
    return this.nodeFactory.createVariableDeclarator(patternRef, initRef, options);
  }

  blockStatement(statementRefs, options) {
    return this.registerNode(
      this.nodeFactory.createBlockStatement(statementRefs, options)
    );
  }

  expressionStatement(expressionRef, options) {
    return this.registerNode(
      this.nodeFactory.createExpressionStatement(expressionRef, options)
    );
  }

  returnStatement(argumentRef, options) {
    return this.registerNode(
      this.nodeFactory.createReturnStatement(argumentRef, options)
    );
  }

  breakStatement(options) {
    return this.registerNode(
      this.nodeFactory.createBreakStatement(options)
    );
  }

  continueStatement(options) {
    return this.registerNode(
      this.nodeFactory.createContinueStatement(options)
    );
  }

  ifStatement(testRef, consequentRef, alternateRef, options) {
    return this.registerNode(
      this.nodeFactory.createIfStatement(testRef, consequentRef, alternateRef, options)
    );
  }

  whileStatement(testRef, bodyRef, options) {
    return this.registerNode(
      this.nodeFactory.createWhileStatement(testRef, bodyRef, options)
    );
  }

  arrowFunctionExpression(params, bodyRef, options) {
    return this.registerNode(
      this.nodeFactory.createArrowFunctionExpression(params, bodyRef, options)
    );
  }

  callExpression(calleeRef, argumentRefs, options) {
    return this.registerNode(
      this.nodeFactory.createCallExpression(calleeRef, argumentRefs, options)
    );
  }

  createMemberExpression(objectRef, propertyRef, options) {
    return this.registerNode(
      this.nodeFactory.createMemberExpression(objectRef, propertyRef, options)
    );
  }

  tryStatement(blockRef, handler, finalizerRef, options) {
    return this.registerNode(
      this.nodeFactory.createTryStatement(blockRef, handler, finalizerRef, options)
    );
  }

  unaryExpression(operator, argumentRef, options) {
    return this.registerNode(
      this.nodeFactory.createUnaryExpression(operator, argumentRef, options)
    );
  }

  updateExpression(operator, argumentRef, options) {
    return this.registerNode(
      this.nodeFactory.createUpdateExpression(operator, argumentRef, options)
    );
  }

  conditionalExpression(testRef, consequentRef, alternateRef, options) {
    return this.registerNode(
      this.nodeFactory.createConditionalExpression(testRef, consequentRef, alternateRef, options)
    );
  }

  newExpression(calleeRef, argumentRefs, options) {
    return this.registerNode(
      this.nodeFactory.createNewExpression(calleeRef, argumentRefs, options)
    );
  }

  arrayExpression(elementRefs, options) {
    return this.registerNode(
      this.nodeFactory.createArrayExpression(elementRefs, options)
    );
  }

  property(keyRef, valueRef, options) {
    return this.registerNode(
      this.nodeFactory.createProperty(keyRef, valueRef, options)
    );
  }

  objectExpression(propertyRefs, options) {
    return this.registerNode(
      this.nodeFactory.createObjectExpression(propertyRefs, options)
    );
  }

  functionDeclaration(name, params, bodyRef, options = {}) {
    const { pushToModule = true, meta = {} } = options;
    const node = this.registerNode(
      this.nodeFactory.createFunctionDeclaration(name, params, bodyRef, {
        ...options,
        meta,
      })
    );
    if (pushToModule) {
      return this.pushToBody(node);
    }
    return node;
  }

  /**
   * Records a control-flow graph for a given function.
   */
  registerControlFlowGraph(cfgId, cfg) {
    this.module.controlFlowGraphs[cfgId] = cfg;
    return this;
  }

  /**
   * Finalizes the IR artifact and optionally validates it.
   */
  build({ validate = true } = {}) {
    if (validate) {
      const result = validateIR(this.module);
      if (!result.ok) {
        const formatted = result.errors.join("\n");
        throw new Error(`IR validation failed:\n${formatted}`);
      }
    }
    return this.module;
  }
}

module.exports = {
  IRBuilder,
};

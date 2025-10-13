"use strict";

const { BalancedTernaryIdGenerator } = require("./idGenerator");

/**
 * Canonical IR node factory. Provides helpers aligned with docs/canonical_ir_spec.md.
 */
class IRNodeFactory {
  constructor(options = {}) {
    const { idGenerator = new BalancedTernaryIdGenerator() } = options;
    this.idGenerator = idGenerator;
  }

  /**
   * Creates a base node with the shared shape defined in the spec.
   */
  createBaseNode(kind, fields = {}) {
    const {
      id = this.idGenerator.next("node"),
      span = null,
      flags = {},
      doc = { leadingComments: [], trailingComments: [] },
      meta = {},
    } = fields;

    return {
      id,
      kind,
      span,
      flags,
      doc,
      meta,
    };
  }

  /**
   * Wraps createBaseNode and merges extra payload.
   */
  createNode(kind, payload = {}) {
    const base = this.createBaseNode(kind, payload);
    return Object.assign(base, payload);
  }

  createIdentifier(name, options = {}) {
    return this.createNode("Identifier", {
      name,
      binding: options.binding || null,
      span: options.span || null,
      meta: options.meta || {},
    });
  }

  createLiteral(value, options = {}) {
    const literalKind = options.literalKind || inferLiteralKind(value);
    return this.createNode("Literal", {
      value,
      raw: options.raw || JSON.stringify(value),
      literalKind,
      span: options.span || null,
      meta: options.meta || {},
    });
  }

  createBinaryExpression(leftRef, operator, rightRef, options = {}) {
    return this.createNode("BinaryExpression", {
      operator,
      left: leftRef,
      right: rightRef,
      span: options.span || null,
      meta: options.meta || {},
    });
  }

  createLogicalExpression(leftRef, operator, rightRef, options = {}) {
    return this.createNode("LogicalExpression", {
      operator,
      left: leftRef,
      right: rightRef,
      span: options.span || null,
      meta: options.meta || {},
    });
  }

  createAssignmentExpression(leftRef, operator, rightRef, options = {}) {
    return this.createNode("AssignmentExpression", {
      operator,
      left: leftRef,
      right: rightRef,
      span: options.span || null,
      meta: options.meta || {},
    });
  }

  createVariableDeclaration(declarations, options = {}) {
    return this.createNode("VariableDeclaration", {
      declarations,
      declarationKind: options.declarationKind || "let",
      span: options.span || null,
      meta: options.meta || {},
    });
  }

  createVariableDeclarator(patternRef, initRef, options = {}) {
    return {
      id: options.id || this.idGenerator.next("decl"),
      pattern: patternRef,
      init: initRef,
      kind: options.kind || "let",
    };
  }

  createBlockStatement(statementRefs, options = {}) {
    return this.createNode("BlockStatement", {
      statements: statementRefs,
      span: options.span || null,
      meta: options.meta || {},
    });
  }

  createExpressionStatement(expressionRef, options = {}) {
    return this.createNode("ExpressionStatement", {
      expression: expressionRef,
      span: options.span || null,
      meta: options.meta || {},
    });
  }

  createReturnStatement(argumentRef, options = {}) {
    return this.createNode("ReturnStatement", {
      argument: argumentRef,
      span: options.span || null,
      meta: options.meta || {},
    });
  }

  createIfStatement(testRef, consequentRef, alternateRef, options = {}) {
    return this.createNode("IfStatement", {
      test: testRef,
      consequent: consequentRef,
      alternate: alternateRef,
      span: options.span || null,
      meta: options.meta || {},
    });
  }

  createWhileStatement(testRef, bodyRef, options = {}) {
    return this.createNode("WhileStatement", {
      test: testRef,
      body: bodyRef,
      span: options.span || null,
      meta: options.meta || {},
    });
  }

  createArrowFunctionExpression(params, bodyRef, options = {}) {
    return this.createNode("ArrowFunctionExpression", {
      params,
      body: bodyRef,
      async: Boolean(options.async),
      span: options.span || null,
      meta: options.meta || {},
    });
  }

  createCallExpression(calleeRef, argumentRefs, options = {}) {
    return this.createNode("CallExpression", {
      callee: calleeRef,
      arguments: argumentRefs,
      span: options.span || null,
      meta: options.meta || {},
    });
  }

  createUnaryExpression(operator, argumentRef, options = {}) {
    return this.createNode("UnaryExpression", {
      operator,
      argument: argumentRef,
      prefix: options.prefix !== false,
      span: options.span || null,
      meta: options.meta || {},
    });
  }

  createFunctionDeclaration(name, params, bodyRef, options = {}) {
    return this.createNode("FunctionDeclaration", {
      name,
      params,
      body: bodyRef,
      async: Boolean(options.async),
      generator: Boolean(options.generator),
      returnType: options.returnType || null,
      span: options.span || null,
      meta: Object.assign({ cfg: options.cfg || null }, options.meta || {}),
    });
  }
}

function inferLiteralKind(value) {
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return Number.isInteger(value) ? "number" : "number";
    case "boolean":
      return "boolean";
    case "object":
      if (value === null) {
        return "null";
      }
      if (value instanceof RegExp) {
        return "regex";
      }
      break;
    default:
      break;
  }
  return "unknown";
}

module.exports = {
  IRNodeFactory,
  inferLiteralKind,
};

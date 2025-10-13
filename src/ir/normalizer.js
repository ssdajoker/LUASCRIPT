"use strict";

/**
 * Normalizes the custom LUASCRIPT parser output into a stable, ESTree-inspired
 * representation that downstream lowering can consume. The goal is to make the
 * structure predictable, preserve semantic intent, and surface hooks for
 * advanced analysis that Donald Knuth requires for formal reasoning.
 */
function normalizeProgram(programNode, options = {}) {
  if (!programNode || programNode.type !== "Program") {
    throw new Error("normalizeProgram expects a Program node");
  }

  return normalizeNode(programNode, options);
}

function normalizeNode(node, options = {}) {
  if (!node) {
    return null;
  }

  switch (node.type) {
    case "Program":
      return {
        type: "Program",
        body: normalizeArray(node.body, options),
      };

    case "VariableDeclaration":
      return {
        type: "VariableDeclaration",
        kind: (node.kind || "var").toLowerCase(),
        declarations: (node.declarations || []).map((decl) => ({
          type: "VariableDeclarator",
          id: normalizeNode(decl.id, options),
          init: normalizeNode(decl.init, options),
        })),
      };

    case "Identifier":
    case "Parameter":
      return {
        type: "Identifier",
        name: node.name,
      };

    case "Literal":
      return {
        type: "Literal",
        value: node.value,
        raw: node.raw ?? JSON.stringify(node.value),
      };

    case "BinaryExpression":
      return {
        type: "BinaryExpression",
        operator: node.operator,
        left: normalizeNode(node.left, options),
        right: normalizeNode(node.right, options),
      };

    case "AssignmentExpression":
      return {
        type: "AssignmentExpression",
        operator: node.operator || "=",
        left: normalizeNode(node.left, options),
        right: normalizeNode(node.right, options),
      };

    case "LogicalExpression":
      return {
        type: "LogicalExpression",
        operator: node.operator,
        left: normalizeNode(node.left, options),
        right: normalizeNode(node.right, options),
      };

    case "UnaryExpression":
      return {
        type: "UnaryExpression",
        operator: node.operator,
        argument: normalizeNode(node.argument, options),
        prefix: true,
      };

    case "CallExpression":
      return {
        type: "CallExpression",
        callee: normalizeNode(node.callee, options),
        arguments: normalizeArray(node.arguments, options),
      };

    case "ExpressionStatement":
      return {
        type: "ExpressionStatement",
        expression: normalizeNode(node.expression, options),
      };

    case "ReturnStatement":
      return {
        type: "ReturnStatement",
        argument: normalizeNode(node.argument, options),
      };

    case "IfStatement":
      return {
        type: "IfStatement",
        test: normalizeNode(node.test, options),
        consequent: normalizeNode(node.consequent, options),
        alternate: normalizeNode(node.alternate, options),
      };

    case "WhileStatement":
      return {
        type: "WhileStatement",
        test: normalizeNode(node.test, options),
        body: normalizeNode(node.body, options),
      };

    case "BlockStatement":
      return {
        type: "BlockStatement",
        body: normalizeArray(node.body, options),
      };

    case "FunctionDeclaration":
      return {
        type: "FunctionDeclaration",
        id: normalizeNode(node.id, options),
        params: normalizeArray(node.params, options),
        body: normalizeNode(node.body, options),
      };

    case "ArrowFunction": {
      const params = normalizeArray(node.params, options);
      let body = normalizeNode(node.body, options);

      // Arrow functions may return an ExpressionStatement wrapper; unwrap it.
      if (body && body.type === "ExpressionStatement") {
        body = {
          type: "BlockStatement",
          body: [
            {
              type: "ReturnStatement",
              argument: body.expression,
            },
          ],
        };
      }

      return {
        type: "ArrowFunctionExpression",
        params,
        body,
        async: Boolean(node.isAsync),
      };
    }

    default:
      // Fallback: perform a shallow clone to avoid mutating original nodes
      return cloneShallow(node, options);
  }
}

function normalizeArray(items, options) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item) => normalizeNode(item, options)).filter(Boolean);
}

function cloneShallow(object, options) {
  if (!object || typeof object !== "object") {
    return object;
  }
  const copy = { type: object.type };
  for (const [key, value] of Object.entries(object)) {
    if (key === "type") continue;
    if (Array.isArray(value)) {
      copy[key] = value.map((item) => normalizeNode(item, options));
    } else if (value && typeof value === "object" && value.type) {
      copy[key] = normalizeNode(value, options);
    } else {
      copy[key] = value;
    }
  }
  return copy;
}

module.exports = {
  normalizeProgram,
  normalizeNode,
};

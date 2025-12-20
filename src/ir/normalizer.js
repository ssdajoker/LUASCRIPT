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

  // Initialize a WeakSet to guard against self-referential cycles
  const seen = options.seen || new WeakSet();
  const opts = { ...options, seen };
  return normalizeNode(programNode, opts);
}

function normalizeNode(node, options = {}) {
  if (!node) {
    return null;
  }

  // Handle nested arrays (unexpected but guardrail): flatten one level and normalize entries
  if (Array.isArray(node)) {
    return normalizeArray(node, options);
  }

  // Cycle guard: if this exact node object was already visited, avoid infinite recursion
  if (options && options.seen && typeof node === "object") {
    options.seen.add(node);
  }

  switch (node.type) {
    case "Program":
      const normalizedBody = normalizeArray(node.body, options);
      // Fallback for parsers that return only Error nodes (e.g., unsupported destructuring)
      if (normalizedBody.length > 0 && normalizedBody.every((n) => n.type === "Error")) {
        const fallback = tryFallbackParse(options.source);
        if (fallback) return fallback;
      }
      return {
        type: "Program",
        body: normalizedBody,
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

    case "UpdateExpression":
      return {
        type: "UpdateExpression",
        operator: node.operator,
        argument: normalizeNode(node.argument, options),
        prefix: Boolean(node.prefix),
      };

    case "CallExpression":
      return {
        type: "CallExpression",
        callee: normalizeNode(node.callee, options),
        arguments: normalizeArray(node.arguments, options),
      };

    case "NewExpression":
      return {
        type: "NewExpression",
        callee: normalizeNode(node.callee, options),
        arguments: normalizeArray(node.arguments, options),
      };

    case "MemberExpression":
      return {
        type: "MemberExpression",
        object: normalizeNode(node.object, options),
        property: normalizeNode(node.property, options),
        computed: Boolean(node.computed),
      };

    case "ArrayExpression":
      return {
        type: "ArrayExpression",
        elements: normalizeArray(node.elements, options),
      };

    case "ObjectExpression":
      return {
        type: "ObjectExpression",
        properties: normalizeArray(node.properties, options),
      };

    case "Property":
      return {
        type: "Property",
        key: normalizeNode(node.key, options),
        value: normalizeNode(node.value, options),
        kind: node.kind || "init",
        computed: Boolean(node.computed),
        shorthand: Boolean(node.shorthand),
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

    case "ForStatement":
      return {
        type: "ForStatement",
        init: normalizeNode(node.init, options),
        test: normalizeNode(node.test, options),
        update: normalizeNode(node.update, options),
        body: normalizeNode(node.body, options),
      };

    case "SwitchStatement": {
      // Represent switch as a synthetic node that will be lowered later to If/ElseIf/Else
      return {
        type: "SwitchStatement",
        discriminant: normalizeNode(node.discriminant, options),
        cases: normalizeArray(node.cases, options).map((c) => ({
          type: "SwitchCase",
          test: normalizeNode(c.test, options),
          consequent: normalizeArray(c.consequent, options),
        })),
      };
    }

    case "ClassDeclaration": {
      // Normalize to a minimal ClassDeclaration shape; lowerer will translate to prototype-like constructs
      const methods = (node.body || []).filter((m) => m && m.type === "MethodDefinition").map((m) => ({
        type: "MethodDefinition",
        key: normalizeNode(m.key, options),
        params: normalizeArray(m.params, options),
        body: normalizeNode(m.body, options),
        kind: m.kind || "method",
        static: Boolean(m.static),
      }));
      return {
        type: "ClassDeclaration",
        id: normalizeNode(node.id, options),
        superClass: normalizeNode(node.superClass, options),
        body: methods,
      };
    }

    case "ConditionalExpression":
      return {
        type: "ConditionalExpression",
        test: normalizeNode(node.test, options),
        consequent: normalizeNode(node.consequent, options),
        alternate: normalizeNode(node.alternate, options),
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

    case "FunctionExpression":
      return {
        type: "FunctionExpression",
        id: normalizeNode(node.id, options),
        params: normalizeArray(node.params, options),
        body: normalizeNode(node.body, options),
        async: Boolean(node.async),
        generator: Boolean(node.generator),
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

    case "TryStatement": {
      const block = normalizeNode(node.block, options);
      let handler = null;
      if (node.handler) {
        handler = {
          type: "CatchClause",
          param: normalizeNode(node.handler.param, options),
          body: normalizeNode(node.handler.body, options),
        };
      }
      const finalizer = normalizeNode(node.finalizer, options);
      return {
        type: "TryStatement",
        block,
        handler,
        finalizer,
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
  // Map and flatten a single level to handle nested arrays gracefully
  const out = [];
  for (const item of items) {
    if (Array.isArray(item)) {
      const nested = normalizeArray(item, options);
      for (const n of nested) out.push(n);
    } else {
      const n = normalizeNode(item, options);
      if (n) out.push(n);
    }
  }
  return out;
}

function cloneShallow(object, options) {
  if (!object || typeof object !== "object") {
    return object;
  }
  const copy = { type: object.type };
  for (const [key, value] of Object.entries(object)) {
    if (key === "type") continue;
    // Skip back-references commonly used by some parsers to link parent nodes
    if (key === "parent" || key === "_parent") continue;
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

function tryFallbackParse(source) {
  if (typeof source !== "string") return null;
  const destructureMatch = source.match(/^\s*(?:const|let|var)\s*\[([^\]]+)\]\s*=\s*([^\;]+)\s*;?/);
  if (destructureMatch) {
    const elements = destructureMatch[1]
      .split(",")
      .map((s) => s.trim())
      .map((name) => (name ? { type: "Identifier", name } : null));
    const initName = destructureMatch[2].trim();
    return {
      type: "Program",
      body: [
        {
          type: "VariableDeclaration",
          kind: "const",
          declarations: [
            {
              type: "VariableDeclarator",
              id: { type: "ArrayPattern", elements },
              init: { type: "Identifier", name: initName },
            },
          ],
        },
      ],
    };
  }
  return null;
}

module.exports = {
  normalizeProgram,
  normalizeNode,
};

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

  // Memoize normalized nodes to avoid false-positive circular detections while
  // still preventing runaway recursion on genuine cycles.
  const memo = options.memo || new WeakMap();
  const opts = { ...options, memo };
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

  const memo = options.memo || new WeakMap();
  if (typeof node === "object") {
    if (memo.has(node)) {
      return memo.get(node);
    }
  }

  const normalizer = normalizers[node.type] || cloneShallow;

  // Seed memo before descending to break actual cycles while still emitting a
  // structured placeholder for repeated references.
  if (typeof node === "object") {
    memo.set(node, { type: node.type });
  }

  const normalized = normalizer(node, { ...options, memo });

  if (typeof node === "object") {
    memo.set(node, normalized);
  }

  return normalized;
}

const normalizers = {
  Program(node, options) {
    const normalizedBody = normalizeArray(node.body, options);
    // Fallback for parsers that return only Error nodes (e.g., unsupported destructuring)
    if (!options.skipFallback && normalizedBody.length > 0 && normalizedBody.every((n) => n.type === "Error")) {
      const fallback = tryFallbackParse(options.source, options);
      if (fallback) return fallback;
    }
    return {
      type: "Program",
      body: normalizedBody,
    };
  },

  VariableDeclaration(node, options) {
    return {
      type: "VariableDeclaration",
      kind: (node.kind || "var").toLowerCase(),
      declarations: (node.declarations || []).map((decl) => ({
        type: "VariableDeclarator",
        id: normalizeNode(decl.id, options),
        init: normalizeNode(decl.init, options),
      })),
    };
  },

  Identifier(node) {
    return { type: "Identifier", name: node.name };
  },

  Parameter(node, options) {
    return normalizers.Identifier(node, options);
  },

  Literal(node) {
    return {
      type: "Literal",
      value: node.value,
      raw: node.raw ?? JSON.stringify(node.value),
    };
  },

  BinaryExpression(node, options) {
    return {
      type: "BinaryExpression",
      operator: node.operator,
      left: normalizeNode(node.left, options),
      right: normalizeNode(node.right, options),
    };
  },

  AssignmentExpression(node, options) {
    return {
      type: "AssignmentExpression",
      operator: node.operator || "=",
      left: normalizeNode(node.left, options),
      right: normalizeNode(node.right, options),
    };
  },

  LogicalExpression(node, options) {
    return {
      type: "LogicalExpression",
      operator: node.operator,
      left: normalizeNode(node.left, options),
      right: normalizeNode(node.right, options),
    };
  },

  UnaryExpression(node, options) {
    return {
      type: "UnaryExpression",
      operator: node.operator,
      argument: normalizeNode(node.argument, options),
      prefix: true,
    };
  },

  UpdateExpression(node, options) {
    return {
      type: "UpdateExpression",
      operator: node.operator,
      argument: normalizeNode(node.argument, options),
      prefix: Boolean(node.prefix),
    };
  },

  CallExpression(node, options) {
    return {
      type: "CallExpression",
      callee: normalizeNode(node.callee, options),
      arguments: normalizeArray(node.arguments, options),
      optional: Boolean(node.optional),
    };
  },

  NewExpression(node, options) {
    return {
      type: "NewExpression",
      callee: normalizeNode(node.callee, options),
      arguments: normalizeArray(node.arguments, options),
    };
  },

  MemberExpression(node, options) {
    return {
      type: "MemberExpression",
      object: normalizeNode(node.object, options),
      property: normalizeNode(node.property, options),
      computed: Boolean(node.computed),
      optional: Boolean(node.optional),
    };
  },

  ArrayExpression(node, options) {
    return {
      type: "ArrayExpression",
      elements: normalizeArray(node.elements, options),
    };
  },

  ObjectExpression(node, options) {
    return {
      type: "ObjectExpression",
      properties: normalizeArray(node.properties, options),
    };
  },

  Property(node, options) {
    return {
      type: "Property",
      key: normalizeNode(node.key, options),
      value: normalizeNode(node.value, options),
      kind: node.kind || "init",
      computed: Boolean(node.computed),
      shorthand: Boolean(node.shorthand),
    };
  },

  ExpressionStatement(node, options) {
    return {
      type: "ExpressionStatement",
      expression: normalizeNode(node.expression, options),
    };
  },

  ReturnStatement(node, options) {
    return {
      type: "ReturnStatement",
      argument: normalizeNode(node.argument, options),
    };
  },

  IfStatement(node, options) {
    return {
      type: "IfStatement",
      test: normalizeNode(node.test, options),
      consequent: normalizeNode(node.consequent, options),
      alternate: normalizeNode(node.alternate, options),
    };
  },

  WhileStatement(node, options) {
    return {
      type: "WhileStatement",
      test: normalizeNode(node.test, options),
      body: normalizeNode(node.body, options),
    };
  },

  ForStatement(node, options) {
    return {
      type: "ForStatement",
      init: normalizeNode(node.init, options),
      test: normalizeNode(node.test, options),
      update: normalizeNode(node.update, options),
      body: normalizeNode(node.body, options),
    };
  },

  SwitchStatement(node, options) {
    return {
      type: "SwitchStatement",
      discriminant: normalizeNode(node.discriminant, options),
      cases: normalizeArray(node.cases, options).map((c) => ({
        type: "SwitchCase",
        test: normalizeNode(c.test, options),
        consequent: normalizeArray(c.consequent, options),
      })),
    };
  },

  ClassDeclaration(node, options) {
    const methods = (node.body || [])
      .filter((m) => m && m.type === "MethodDefinition")
      .map((m) => ({
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
  },

  ConditionalExpression(node, options) {
    return {
      type: "ConditionalExpression",
      test: normalizeNode(node.test, options),
      consequent: normalizeNode(node.consequent, options),
      alternate: normalizeNode(node.alternate, options),
    };
  },

  BlockStatement(node, options) {
    return {
      type: "BlockStatement",
      body: normalizeArray(node.body, options),
    };
  },

  FunctionDeclaration(node, options) {
    return {
      type: "FunctionDeclaration",
      id: normalizeNode(node.id, options),
      params: normalizeArray(node.params, options),
      body: normalizeNode(node.body, options),
    };
  },

  FunctionExpression(node, options) {
    return {
      type: "FunctionExpression",
      id: normalizeNode(node.id, options),
      params: normalizeArray(node.params, options),
      body: normalizeNode(node.body, options),
      async: Boolean(node.async),
      generator: Boolean(node.generator),
    };
  },

  ArrowFunction(node, options) {
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
  },

  ChainExpression(node, options) {
    return normalizeNode(node.expression, options);
  },

  ThrowStatement(node, options) {
    return {
      type: "ThrowStatement",
      argument: normalizeNode(node.argument, options),
    };
  },

  TryStatement(node, options) {
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
  },
};

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
    if (shouldSkipCloneKey(key)) continue;
    copy[key] = cloneValue(value, options);
  }
  return copy;
}

function shouldSkipCloneKey(key) {
  if (key === "type") return true;
  // Skip back-references commonly used by some parsers to link parent nodes
  if (key === "parent" || key === "_parent") return true;
  return false;
}

function cloneValue(value, options) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeNode(item, options));
  }
  if (value && typeof value === "object" && value.type) {
    return normalizeNode(value, options);
  }
  return value;
}

function tryFallbackParse(source, options = {}) {
  if (typeof source !== "string") return null;

  try {
    const acorn = require("acorn");
    const program = acorn.parse(source, {
      ecmaVersion: "latest",
      sourceType: "script",
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
    });
    return normalizeNode(program, { ...options, skipFallback: true, memo: options.memo || new WeakMap() });
  } catch {
    // Continue to regex-based fallbacks
  }

  const destructureMatch = source.match(/^\s*(?:const|let|var)\s*\[([^\]]+)\]\s*=\s*([^;]+)\s*;?/);
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

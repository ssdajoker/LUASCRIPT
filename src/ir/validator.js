"use strict";

const { encodeBalancedTernary } = require("./idGenerator");

/**
 * Lightweight structural validator for canonical IR artifacts.
 * Not a full JSON schema implementation, but enforces the invariants we care about today.
 */
function validateIR(ir) {
  const errors = [];

  if (!ir || typeof ir !== "object") {
    return { ok: false, errors: ["IR root must be an object"] };
  }

  if (!ir.schemaVersion) {
    errors.push("schemaVersion missing");
  }

  if (!ir.module || typeof ir.module !== "object") {
    errors.push("module missing");
    return { ok: false, errors };
  }

  const moduleBody = ir.module.body || [];
  const nodes = ir.nodes || {};

  if (!Array.isArray(moduleBody)) {
    errors.push("module.body must be an array");
  }

  if (typeof ir.module.id !== "string") {
    errors.push("module.id must be a string");
  } else if (!isBalancedTernaryIdentifier(ir.module.id)) {
    errors.push(`module.id is not balanced-ternary encoded: ${ir.module.id}`);
  }

  moduleBody.forEach((nodeId, idx) => {
    if (typeof nodeId !== "string") {
      errors.push(`module.body[${idx}] must be a string`);
      return;
    }
    if (!nodes[nodeId]) {
      errors.push(`module.body[${idx}] references missing node ${nodeId}`);
    }
  });

  // Allowed node kinds (keep permissive; extend as spec evolves)
  const allowedKinds = new Set([
    "Identifier",
    "Literal",
    "BinaryExpression",
    "LogicalExpression",
    "AssignmentExpression",
    "VariableDeclaration",
    "BlockStatement",
    "ExpressionStatement",
    "ReturnStatement",
    "IfStatement",
    "WhileStatement",
    "ArrowFunctionExpression",
    "CallExpression",
    "UnaryExpression",
    "FunctionDeclaration"
  ]);

  // Validate nodes
  Object.entries(nodes).forEach(([nodeId, node]) => {
    if (!isBalancedTernaryIdentifier(nodeId)) {
      errors.push(`Node id ${nodeId} is not balanced-ternary encoded`);
    }
    if (!node.kind || typeof node.kind !== "string") {
      errors.push(`Node ${nodeId} missing kind`);
    } else if (!allowedKinds.has(node.kind)) {
      // Do not hard-fail unknown kinds yet; record a soft error
      errors.push(`Node ${nodeId} has unknown kind ${node.kind}`);
    }

    // Basic span shape validation (if present)
    if (node.span != null) {
      const s = node.span;
      if (!s.start || !s.end) {
        errors.push(`Node ${nodeId} has malformed span (missing start/end)`);
      } else if (!isFiniteNumber(s.start.line) || !isFiniteNumber(s.start.column) || !isFiniteNumber(s.start.offset) ||
                 !isFiniteNumber(s.end.line)   || !isFiniteNumber(s.end.column)   || !isFiniteNumber(s.end.offset)) {
        errors.push(`Node ${nodeId} has invalid span numbers`);
      }
    }

    // Validate FunctionDeclaration meta.cfg shape when present
    if (node.kind === "FunctionDeclaration" && node.meta && node.meta.cfg != null && typeof node.meta.cfg !== "object") {
      errors.push(`Node ${nodeId} FunctionDeclaration meta.cfg must be an object when present`);
    }
  });

  // Optional: validate metaPerf if present
  if (ir.module && ir.module.metadata && ir.module.metadata.metaPerf) {
    const mp = ir.module.metadata.metaPerf;
    ["parseMs", "normalizeMs", "lowerMs", "totalMs", "nodeCount"].forEach((k) => {
      if (typeof mp[k] !== "number") {
        errors.push(`module.metadata.metaPerf.${k} must be a number`);
      }
    });
  }

  // Optional: Validate CFG linkage if controlFlowGraphs present
  const cfgs = ir.controlFlowGraphs || null;
  if (cfgs) {
    Object.entries(nodes).forEach(([nodeId, node]) => {
      if (node.kind === "FunctionDeclaration" && node.meta && node.meta.cfg) {
        const { id: cfgId, entry, exit } = node.meta.cfg;
        if (!cfgId || !cfgs[cfgId]) {
          errors.push(`Function ${nodeId} references missing CFG ${cfgId}`);
        } else {
          const graph = cfgs[cfgId];
          const blockIds = new Set((graph.blocks || []).map((b) => b.id));
          if (entry && !blockIds.has(entry)) errors.push(`Function ${nodeId} cfg.entry ${entry} not in CFG`);
          if (exit && !blockIds.has(exit)) errors.push(`Function ${nodeId} cfg.exit ${exit} not in CFG`);
        }
      }
    });
  }

  return { ok: errors.length === 0, errors };
}

function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * Checks whether an identifier follows the PREFIX_digits pattern with balanced ternary digits.
 */
function isBalancedTernaryIdentifier(identifier) {
  if (typeof identifier !== "string" || !identifier.includes("_")) {
    return false;
  }
  const [prefix, digits] = identifier.split("_");
  if (!prefix || !digits) {
    return false;
  }
  return /^[T01]+$/.test(digits);
}

// Exported for testing convenience.
function decodeBalancedTernaryString(encoded) {
  let value = 0;
  for (let i = 0; i < encoded.length; i += 1) {
    const digit = encoded[i];
    value *= 3;
    if (digit === "1") {
      value += 1;
    } else if (digit === "T") {
      value -= 1;
    } else if (digit !== "0") {
      throw new Error(`Invalid balanced ternary digit: ${digit}`);
    }
  }
  return value;
}

module.exports = {
  validateIR,
  isBalancedTernaryIdentifier,
  decodeBalancedTernaryString,
  encodeBalancedTernary,
};

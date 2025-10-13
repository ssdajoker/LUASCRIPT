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

  Object.entries(nodes).forEach(([nodeId, node]) => {
    if (!isBalancedTernaryIdentifier(nodeId)) {
      errors.push(`Node id ${nodeId} is not balanced-ternary encoded`);
    }
    if (!node.kind) {
      errors.push(`Node ${nodeId} missing kind`);
    }
  });

  return { ok: errors.length === 0, errors };
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

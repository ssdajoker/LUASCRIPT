/**
 * PHASE E - Task E3.1: Security Validators
 * 
 * Lightweight security validation utilities to detect risky patterns
 * during transpilation without altering IR behavior.
 * 
 * @module src/optimizers/javascript/security/security_validators
 */

class SecurityValidators {
  /**
   * @param {Object} options - Configuration options
   * @param {string[]} options.blockedIdentifiers - Disallowed identifiers
   * @param {string[]} options.blockedCallNames - Disallowed call names
   * @param {number} options.maxStringLength - Warn on large literals
   */
  constructor(options = {}) {
    this.blockedIdentifiers = options.blockedIdentifiers || [
      "__proto__",
      "prototype",
      "constructor"
    ];

    this.blockedCallNames = options.blockedCallNames || [
      "eval",
      "Function",
      "exec",
      "spawn",
      "spawnSync",
      "constructor"
    ];

    this.maxStringLength = options.maxStringLength || 10000;

    this.stats = {
      checked: 0,
      violations: 0,
      warnings: 0,
      byType: {}
    };
  }

  /**
   * Validate a single node
   * @param {Object} node - AST node
   * @returns {Object} result
   */
  validate(node) {
    const result = { ok: true, violations: [], warnings: [] };
    if (!node || typeof node !== "object") {
      return result;
    }

    this.stats.checked++;

    if (node.type === "Identifier") {
      this._checkIdentifier(node, result);
    }

    if (node.type === "MemberExpression") {
      this._checkMemberExpression(node, result);
    }

    if (node.type === "CallExpression") {
      this._checkCallExpression(node, result);
    }

    if (node.type === "Literal" || node.type === "StringLiteral") {
      this._checkStringLiteral(node, result);
    }

    result.ok = result.violations.length === 0;
    return result;
  }

  /**
   * Validate an array of nodes
   * @param {Object[]} nodes
   * @returns {Object}
   */
  validateProgram(nodes = []) {
    const combined = { ok: true, violations: [], warnings: [] };

    for (const node of nodes) {
      const res = this.validate(node);
      combined.violations.push(...res.violations);
      combined.warnings.push(...res.warnings);
    }

    combined.ok = combined.violations.length === 0;
    return combined;
  }

  /**
   * Get statistics
   * @returns {Object}
   */
  getStats() {
    return {
      ...this.stats,
      byType: { ...this.stats.byType }
    };
  }

  _checkIdentifier(node, result) {
    const name = node.name || "";
    if (this.blockedIdentifiers.includes(name)) {
      this._recordViolation("blockedIdentifier", `Blocked identifier: ${name}`, node, result);
    }
  }

  _checkMemberExpression(node, result) {
    const propName = node.property?.name || node.property?.value || "";
    if (this.blockedIdentifiers.includes(propName)) {
      this._recordViolation("blockedProperty", `Blocked property access: ${propName}`, node, result);
    }
  }

  _checkCallExpression(node, result) {
    let callName = null;
    if (node.callee?.type === "Identifier") {
      callName = node.callee.name;
    } else if (node.callee?.type === "MemberExpression") {
      callName = node.callee.property?.name || node.callee.property?.value || null;
    }

    if (callName && this.blockedCallNames.includes(callName)) {
      this._recordViolation("blockedCall", `Blocked call: ${callName}`, node, result);
    }

    if (node.callee?.type === "MemberExpression") {
      this._checkMemberExpression(node.callee, result);
    }
  }

  _checkStringLiteral(node, result) {
    const value = node.value ?? node.raw ?? "";
    const strValue = typeof value === "string" ? value : "";

    if (strValue.includes("\u0000") || strValue.includes("\0")) {
      this._recordWarning("nullByte", "String contains null byte", node, result);
    }

    if (strValue.length > this.maxStringLength) {
      this._recordWarning("largeLiteral", `String literal exceeds ${this.maxStringLength} chars`, node, result);
    }
  }

  _recordViolation(type, message, node, result) {
    result.violations.push({ type, message, nodeType: node.type });
    this.stats.violations++;
    this.stats.byType[type] = (this.stats.byType[type] || 0) + 1;
  }

  _recordWarning(type, message, node, result) {
    result.warnings.push({ type, message, nodeType: node.type });
    this.stats.warnings++;
    this.stats.byType[type] = (this.stats.byType[type] || 0) + 1;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SecurityValidators };
}

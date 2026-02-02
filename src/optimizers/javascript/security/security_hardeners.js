/**
 * PHASE E - Task E3.2: Security Hardeners
 *
 * Policy-based hardening checks for risky constructs without changing IR.
 *
 * @module src/optimizers/javascript/security/security_hardeners
 */

class SecurityHardeners {
  /**
   * @param {Object} options - Configuration options
   * @param {boolean} options.allowDynamicExecution - Allow eval/Function calls (default: false)
   * @param {boolean} options.blockPrototypePollution - Block __proto__/prototype/constructor (default: true)
   * @param {boolean} options.blockProcessAccess - Block process.* access (default: true)
   * @param {string[]} options.blockedModules - require() denylist
   * @param {number} options.maxLiteralLength - Warn on large strings (default: 10000)
   * @param {number} options.maxNodes - Maximum nodes to traverse (default: 100000)
   * @param {number} options.maxDepth - Maximum traversal depth (default: 200)
   */
  constructor(options = {}) {
    this.allowDynamicExecution = options.allowDynamicExecution === true;
    this.blockPrototypePollution = options.blockPrototypePollution !== false;
    this.blockProcessAccess = options.blockProcessAccess !== false;
    this.blockedModules = options.blockedModules || [
      'child_process',
      'fs',
      'net',
      'dgram',
      'worker_threads',
      'vm'
    ];
    this.maxLiteralLength = options.maxLiteralLength || 10000;
    this.maxNodes = options.maxNodes || 100000;
    this.maxDepth = options.maxDepth || 200;

    this.stats = {
      nodesVisited: 0,
      violations: 0,
      warnings: 0,
      byType: {}
    };
  }

  /**
   * Harden a single node
   * @param {Object} node
   * @returns {Object}
   */
  hardenNode(node) {
    const result = { ok: true, violations: [], warnings: [] };
    if (!node || typeof node !== 'object') {
      return result;
    }

    this._applyNodeRules(node, result);
    result.ok = result.violations.length === 0;
    return result;
  }

  /**
   * Harden an entire AST/program
   * @param {Object|Object[]} root
   * @returns {Object}
   */
  hardenProgram(root) {
    const result = { ok: true, violations: [], warnings: [] };
    const visited = new Set();

    const walk = (node, depth) => {
      if (!node || typeof node !== 'object') return;
      if (visited.has(node)) return;

      visited.add(node);
      this.stats.nodesVisited++;

      if (this.stats.nodesVisited > this.maxNodes) {
        this._recordViolation('maxNodes', `Node count exceeded ${this.maxNodes}`, node, result);
        return;
      }

      if (depth > this.maxDepth) {
        this._recordViolation('maxDepth', `Traversal depth exceeded ${this.maxDepth}`, node, result);
        return;
      }

      this._applyNodeRules(node, result);

      if (Array.isArray(node)) {
        for (const item of node) {
          walk(item, depth + 1);
        }
        return;
      }

      for (const value of Object.values(node)) {
        if (typeof value === 'object' && value !== null) {
          walk(value, depth + 1);
        }
      }
    };

    if (Array.isArray(root)) {
      for (const node of root) {
        walk(node, 1);
      }
    } else {
      walk(root, 1);
    }

    result.ok = result.violations.length === 0;
    return result;
  }

  /**
   * Get stats
   * @returns {Object}
   */
  getStats() {
    return {
      ...this.stats,
      byType: { ...this.stats.byType }
    };
  }

  _applyNodeRules(node, result) {
    if (node.type === 'Identifier') {
      this._checkIdentifier(node, result);
    }

    if (node.type === 'MemberExpression') {
      this._checkMemberExpression(node, result);
    }

    if (node.type === 'CallExpression') {
      this._checkCallExpression(node, result);
    }

    if (node.type === 'Literal' || node.type === 'StringLiteral') {
      this._checkStringLiteral(node, result);
    }
  }

  _checkIdentifier(node, result) {
    if (!this.blockPrototypePollution) return;

    const name = node.name || '';
    if (['__proto__', 'prototype', 'constructor'].includes(name)) {
      this._recordViolation('prototypePollution', `Blocked identifier: ${name}`, node, result);
    }
  }

  _checkMemberExpression(node, result) {
    const propName = node.property?.name || node.property?.value || '';

    if (this.blockPrototypePollution && ['__proto__', 'prototype', 'constructor'].includes(propName)) {
      this._recordViolation('prototypePollution', `Blocked property access: ${propName}`, node, result);
    }

    if (this.blockProcessAccess) {
      const base = this._getMemberBaseName(node);
      if (base === 'process') {
        this._recordViolation('processAccess', `Blocked process access: ${propName || 'process'}`, node, result);
      }
    }
  }

  _checkCallExpression(node, result) {
    let callName = null;

    if (node.callee?.type === 'Identifier') {
      callName = node.callee.name;
    } else if (node.callee?.type === 'MemberExpression') {
      callName = node.callee.property?.name || node.callee.property?.value || null;
      this._checkMemberExpression(node.callee, result);
    }

    if (!this.allowDynamicExecution && (callName === 'eval' || callName === 'Function')) {
      this._recordViolation('dynamicExecution', `Blocked call: ${callName}`, node, result);
    }

    if (callName === 'require') {
      const mod = node.arguments?.[0]?.value;
      if (typeof mod === 'string' && this.blockedModules.includes(mod)) {
        this._recordViolation('blockedModule', `Blocked require: ${mod}`, node, result);
      }
    }
  }

  _checkStringLiteral(node, result) {
    const value = node.value ?? node.raw ?? '';
    const strValue = typeof value === 'string' ? value : '';

    if (strValue.includes('\u0000') || strValue.includes('\0')) {
      this._recordWarning('nullByte', 'String contains null byte', node, result);
    }

    if (strValue.length > this.maxLiteralLength) {
      this._recordWarning('largeLiteral', `String literal exceeds ${this.maxLiteralLength} chars`, node, result);
    }
  }

  _getMemberBaseName(node) {
    let current = node;
    while (current?.type === 'MemberExpression' && current.object) {
      if (current.object.type === 'Identifier') {
        return current.object.name;
      }
      current = current.object;
    }
    return null;
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SecurityHardeners };
}

/**
 * PHASE E - Task E4.1: Algorithm Optimizer
 *
 * Provides lightweight analysis and optimization hints for algorithmic
 * complexity without mutating IR.
 *
 * @module src/optimizers/javascript/algorithms/algorithm_optimizer
 */

class AlgorithmOptimizer {
  /**
   * @param {Object} options
   * @param {number} options.maxNodes - traversal limit (default: 100000)
   * @param {number} options.maxDepth - traversal depth (default: 200)
   */
  constructor(options = {}) {
    this.maxNodes = options.maxNodes || 100000;
    this.maxDepth = options.maxDepth || 200;

    this.stats = {
      nodesVisited: 0,
      loops: 0,
      nestedLoops: 0,
      suggestions: 0
    };
  }

  /**
   * Analyze program AST for algorithmic hotspots
   * @param {Object|Object[]} root
   * @returns {Object}
   */
  analyze(root) {
    const report = {
      complexity: "O(1)",
      loops: 0,
      nestedLoops: 0,
      arrayMethodChains: 0,
      suggestions: []
    };

    const visited = new Set();

    const walk = (node, depth, loopDepth) => {
      if (!node || typeof node !== "object") return;
      if (visited.has(node)) return;

      visited.add(node);
      this.stats.nodesVisited++;

      if (this.stats.nodesVisited > this.maxNodes || depth > this.maxDepth) {
        report.suggestions.push("Traversal limits reached; consider simplifying AST.");
        this.stats.suggestions++;
        return;
      }

      if (this._isLoop(node)) {
        report.loops++;
        this.stats.loops++;
        if (loopDepth > 0) {
          report.nestedLoops++;
          this.stats.nestedLoops++;
        }
        loopDepth += 1;
      }

      if (this._isArrayMethodChain(node)) {
        report.arrayMethodChains++;
        report.suggestions.push("Consider fusing chained array methods (map/filter/reduce).");
        this.stats.suggestions++;
      }

      if (Array.isArray(node)) {
        node.forEach(child => walk(child, depth + 1, loopDepth));
        return;
      }

      Object.values(node).forEach(value => {
        if (typeof value === "object" && value !== null) {
          walk(value, depth + 1, loopDepth);
        }
      });
    };

    walk(root, 1, 0);

    report.complexity = this._estimateComplexity(report.loops, report.nestedLoops);

    if (report.nestedLoops > 0) {
      report.suggestions.push("Nested loops detected; consider indexing or precomputing.");
      this.stats.suggestions++;
    }

    return report;
  }

  /**
   * Provide high-level optimization hints
   * @param {Object|Object[]} root
   * @returns {Object}
   */
  optimize(root) {
    const analysis = this.analyze(root);

    return {
      ok: true,
      analysis,
      recommendations: analysis.suggestions
    };
  }

  /**
   * Get stats
   * @returns {Object}
   */
  getStats() {
    return { ...this.stats };
  }

  _isLoop(node) {
    return node.type === "ForStatement" ||
      node.type === "WhileStatement" ||
      node.type === "DoWhileStatement" ||
      node.type === "ForOfStatement" ||
      node.type === "ForInStatement";
  }

  _isArrayMethodChain(node) {
    if (node.type !== "CallExpression") return false;
    if (node.callee?.type !== "MemberExpression") return false;
    const name = node.callee.property?.name || node.callee.property?.value;
    return ["map", "filter", "reduce", "forEach"].includes(name);
  }

  _estimateComplexity(loopCount, nestedCount) {
    if (nestedCount > 0) return "O(n^2)";
    if (loopCount > 0) return "O(n)";
    return "O(1)";
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { AlgorithmOptimizer };
}

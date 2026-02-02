"use strict";

/**
 * Python Performance Optimization - Phase 2D
 * 
 * Optimizations:
 * - Dead code elimination
 * - Constant folding
 * - Loop optimization
 * - Memoization/caching
 */

class PythonPerformanceOptimizer {
  constructor(options = {}) {
    this.options = {
      deadCodeElimination: options.deadCodeElimination !== false,
      constantFolding: options.constantFolding !== false,
      loopOptimization: options.loopOptimization !== false,
      memoization: options.memoization !== false,
      cacheSize: options.cacheSize || 1000,
      verbose: options.verbose || false,
      ...options,
    };
    
    this.cache = new Map();
    this.stats = {
      deadCodeRemoved: 0,
      constantsFolded: 0,
      loopsOptimized: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * Optimize IR (Intermediate Representation)
   */
  optimize(ir) {
    let optimized = ir;
    
    if (this.options.deadCodeElimination) {
      optimized = this.eliminateDeadCode(optimized);
    }
    
    if (this.options.constantFolding) {
      optimized = this.foldConstants(optimized);
    }
    
    if (this.options.loopOptimization) {
      optimized = this.optimizeLoops(optimized);
    }
    
    return optimized;
  }

  /**
   * Dead Code Elimination
   * Removes unused variables and unreachable code
   */
  eliminateDeadCode(ir) {
    if (!ir || !ir.nodes) return ir;
    
    const usedVariables = new Set();
    const reachableCode = [];
    let foundReturn = false;

    // First pass: identify used variables
    ir.nodes.forEach(node => {
      this.collectUsedVariables(node, usedVariables);
    });

    // Second pass: remove unreachable and unused
    ir.nodes.forEach(node => {
      if (foundReturn && node.type !== "FunctionDeclaration") {
        this.stats.deadCodeRemoved++;
        return; // Skip unreachable code
      }

      if (node.type === "ReturnStatement") {
        foundReturn = true;
      }

      // Remove unused variable declarations
      if (node.type === "VariableDeclaration") {
        if (usedVariables.has(node.name)) {
          reachableCode.push(node);
        } else {
          this.stats.deadCodeRemoved++;
        }
      } else {
        reachableCode.push(node);
      }

      // Reset return flag at function boundaries
      if (node.type === "FunctionDeclaration") {
        foundReturn = false;
      }
    });

    return {
      ...ir,
      nodes: reachableCode,
    };
  }

  /**
   * Collect all variables used in a node
   */
  collectUsedVariables(node, used) {
    if (!node || typeof node !== 'object') return;

    if (node.type === "Identifier" && node.name) {
      used.add(node.name);
    }

    if (node.type === "VariableDeclaration" && node.name) {
      // Declaration itself
    }

    // Recursively check all properties
    for (const key in node) {
      if (key !== 'type' && key !== 'name') {
        const value = node[key];
        if (Array.isArray(value)) {
          value.forEach(item => this.collectUsedVariables(item, used));
        } else if (typeof value === 'object') {
          this.collectUsedVariables(value, used);
        }
      }
    }
  }

  /**
   * Constant Folding
   * Evaluates constant expressions at compile time
   */
  foldConstants(ir) {
    if (!ir || !ir.nodes) return ir;

    const foldedNodes = ir.nodes.map(node => this.foldNode(node));

    return {
      ...ir,
      nodes: foldedNodes,
    };
  }

  /**
   * Fold a single node
   */
  foldNode(node) {
    if (!node) return node;

    if (node.type === "BinaryExpression") {
      const left = this.foldNode(node.left);
      const right = this.foldNode(node.right);

      if (this.isConstant(left) && this.isConstant(right)) {
        const result = this.evaluateConstantExpression(node.operator, left, right);
        if (result !== undefined) {
          this.stats.constantsFolded++;
          return {
            type: "Literal",
            value: result,
            raw: String(result),
          };
        }
      }

      return {
        ...node,
        left,
        right,
      };
    }

    if (node.type === "UnaryExpression") {
      const argument = this.foldNode(node.argument);
      if (this.isConstant(argument)) {
        const result = this.evaluateUnaryExpression(node.operator, argument);
        if (result !== undefined) {
          this.stats.constantsFolded++;
          return {
            type: "Literal",
            value: result,
            raw: String(result),
          };
        }
      }
      return { ...node, argument };
    }

    // Recursively fold nested structures
    if (node.body && Array.isArray(node.body)) {
      return {
        ...node,
        body: node.body.map(n => this.foldNode(n)),
      };
    }

    return node;
  }

  /**
   * Check if node is constant
   */
  isConstant(node) {
    if (!node) return false;
    return node.type === "Literal" || node.type === "Number" || node.type === "String";
  }

  /**
   * Evaluate constant binary expression
   */
  evaluateConstantExpression(operator, left, right) {
    const leftVal = left.value !== undefined ? left.value : left;
    const rightVal = right.value !== undefined ? right.value : right;

    switch (operator) {
    case "+": return leftVal + rightVal;
    case "-": return leftVal - rightVal;
    case "*": return leftVal * rightVal;
    case "/": return leftVal / rightVal;
    case "%": return leftVal % rightVal;
    case "**": return Math.pow(leftVal, rightVal);
    case "==": return leftVal === rightVal;
    case "!=": return leftVal !== rightVal;
    case "<": return leftVal < rightVal;
    case ">": return leftVal > rightVal;
    case "<=": return leftVal <= rightVal;
    case ">=": return leftVal >= rightVal;
    case "and": return leftVal && rightVal;
    case "or": return leftVal || rightVal;
    default: return undefined;
    }
  }

  /**
   * Evaluate constant unary expression
   */
  evaluateUnaryExpression(operator, argument) {
    const val = argument.value !== undefined ? argument.value : argument;

    switch (operator) {
    case "-": return -val;
    case "+": return +val;
    case "not": return !val;
    case "~": return ~val;
    default: return undefined;
    }
  }

  /**
   * Loop Optimization
   * Optimizes loop structures
   */
  optimizeLoops(ir) {
    if (!ir || !ir.nodes) return ir;

    const optimized = ir.nodes.map(node => this.optimizeLoopNode(node));

    return {
      ...ir,
      nodes: optimized,
    };
  }

  /**
   * Optimize a single node for loops
   */
  optimizeLoopNode(node) {
    if (!node) return node;

    if (node.type === "ForStatement" || node.type === "WhileStatement") {
      this.stats.loopsOptimized++;
      
      // Try loop unrolling for small ranges
      if (node.type === "ForStatement" && this.canUnroll(node)) {
        return this.unrollLoop(node);
      }
    }

    // Recursively optimize nested nodes
    if (node.body && Array.isArray(node.body)) {
      return {
        ...node,
        body: node.body.map(n => this.optimizeLoopNode(n)),
      };
    }

    return node;
  }

  /**
   * Check if loop can be unrolled
   */
  canUnroll(loopNode) {
    // Can unroll if range is small and constant
    return loopNode.iterator && 
           loopNode.iterator.type === "FunctionCall" && 
           loopNode.iterator.function === "range" &&
           loopNode.iterator.arguments &&
           loopNode.iterator.arguments.length <= 2;
  }

  /**
   * Unroll a simple loop
   */
  unrollLoop(loopNode) {
    // This is a simplified version - full implementation would be more complex
    return loopNode; // Return as-is for now
  }

  /**
   * Memoization/Caching for transpilation
   */
  getCachedResult(codeHash) {
    if (!this.options.memoization) return null;

    if (this.cache.has(codeHash)) {
      this.stats.cacheHits++;
      return this.cache.get(codeHash);
    }

    this.stats.cacheMisses++;
    return null;
  }

  /**
   * Cache a transpilation result
   */
  cacheResult(codeHash, result) {
    if (!this.options.memoization) return;

    if (this.cache.size >= this.options.cacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(codeHash, result);
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    return {
      deadCodeRemoved: this.stats.deadCodeRemoved,
      constantsFolded: this.stats.constantsFolded,
      loopsOptimized: this.stats.loopsOptimized,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      cacheHitRate: this.stats.cacheHits + this.stats.cacheMisses > 0 
        ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(1) + '%'
        : 'N/A',
      totalOptimizations: this.stats.deadCodeRemoved + 
                         this.stats.constantsFolded + 
                         this.stats.loopsOptimized,
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      deadCodeRemoved: 0,
      constantsFolded: 0,
      loopsOptimized: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }
}

module.exports = PythonPerformanceOptimizer;

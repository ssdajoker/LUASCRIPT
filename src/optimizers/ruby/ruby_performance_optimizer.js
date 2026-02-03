"use strict";

/**
 * Ruby Performance Optimizer - Phase C Speed Optimization
 * 
 * Optimizations:
 * - Dead code elimination
 * - Constant folding
 * - Loop optimization (each/times unrolling)
 * - String optimization (freeze, concat)
 * - Symbol caching
 * - Method inlining for simple methods
 */

class RubyPerformanceOptimizer {
  constructor(options = {}) {
    this.options = {
      deadCodeElimination: options.deadCodeElimination !== false,
      constantFolding: options.constantFolding !== false,
      loopOptimization: options.loopOptimization !== false,
      stringOptimization: options.stringOptimization !== false,
      symbolCaching: options.symbolCaching !== false,
      cacheSize: options.cacheSize || 1000,
      verbose: options.verbose || false,
      ...options,
    };
    
    this.cache = new Map();
    this.symbolCache = new Map();
    this.stats = {
      deadCodeRemoved: 0,
      constantsFolded: 0,
      loopsOptimized: 0,
      stringsOptimized: 0,
      symbolsCached: 0,
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

    if (this.options.stringOptimization) {
      optimized = this.optimizeStrings(optimized);
    }

    if (this.options.symbolCaching) {
      optimized = this.cacheSymbols(optimized);
    }
    
    return optimized;
  }

  /**
   * Dead Code Elimination - Ruby specific
   * Removes unused variables, unreachable code after return/break/next
   */
  eliminateDeadCode(ir) {
    if (!ir || !ir.nodes) return ir;
    
    const usedVariables = new Set();
    const reachableCode = [];
    let foundTerminator = false;

    // First pass: identify used variables
    ir.nodes.forEach(node => {
      this.collectUsedVariables(node, usedVariables);
    });

    // Second pass: remove unreachable and unused
    for (const node of ir.nodes) {
      // Skip unreachable code after control flow terminators
      if (foundTerminator && node.type !== "FunctionDeclaration") {
        this.stats.deadCodeRemoved++;
        continue;
      }

      // Ruby terminators: return, break, next, raise
      if (this.isControlFlowTerminator(node)) {
        foundTerminator = true;
        reachableCode.push(node); // Keep the terminator itself
        continue;
      }

      // Remove unused variable declarations
      if (node.type === "VariableDeclaration" || node.type === "Assignment") {
        const varName = node.name || (node.left && node.left.name);
        if (varName && !usedVariables.has(varName) && !this.hasSideEffects(node)) {
          this.stats.deadCodeRemoved++;
          continue;
        }
      }

      // Remove if false blocks
      if (node.type === "IfStatement" && this.isConstantFalse(node.test)) {
        this.stats.deadCodeRemoved++;
        continue;
      }

      reachableCode.push(node);

      if (node.type === "FunctionDeclaration") {
        foundTerminator = false;
      }
    }

    return {
      ...ir,
      nodes: reachableCode,
    };
  }

  /**
   * Check if node terminates control flow (Ruby-specific)
   */
  isControlFlowTerminator(node) {
    if (!node || !node.type) return false;
    return node.type === "ReturnStatement" ||
           node.type === "RaiseStatement" ||
           node.type === "BreakStatement" ||
           node.type === "NextStatement";
  }

  /**
   * Check if node has side effects
   */
  hasSideEffects(node) {
    if (!node) return false;
    if (node.type === "CallExpression" || 
        node.type === "PrintStatement" ||
        node.type === "PutsStatement" ||
        node.type === "RaiseStatement") {
      return true;
    }
    if (node.value) return this.hasSideEffects(node.value);
    if (node.right) return this.hasSideEffects(node.right);
    return false;
  }

  /**
   * Check if expression is constant false/nil
   */
  isConstantFalse(node) {
    if (!node) return false;
    return (node.type === "Literal" || node.type === "Boolean") && 
           (node.value === false || node.value === null);
  }

  /**
   * Collect all variables used in a node
   */
  collectUsedVariables(node, used) {
    if (!node || typeof node !== "object") return;

    if (node.type === "Identifier" && node.name) {
      used.add(node.name);
    }

    for (const key in node) {
      if (key !== "type" && key !== "name") {
        const value = node[key];
        if (Array.isArray(value)) {
          value.forEach(item => this.collectUsedVariables(item, used));
        } else if (typeof value === "object") {
          this.collectUsedVariables(value, used);
        }
      }
    }
  }

  /**
   * Constant Folding - Ruby specific operators
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

      return { ...node, left, right };
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
   * Evaluate constant binary expression - Ruby operators
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
    case "&&": return leftVal && rightVal;
    case "||": return leftVal || rightVal;
    case "&": return leftVal & rightVal;
    case "|": return leftVal | rightVal;
    case "^": return leftVal ^ rightVal;
    case "<<": return leftVal << rightVal;
    case ">>": return leftVal >> rightVal;
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
    case "!": return !val;
    case "~": return ~val;
    default: return undefined;
    }
  }

  /**
   * Loop Optimization - Ruby specific
   * Optimize times/each loops with constant ranges
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
   * Optimize a single loop node
   */
  optimizeLoopNode(node) {
    if (!node) return node;

    // Ruby: n.times { |i| ... } - unroll for small n
    if (node.type === "CallExpression" && node.callee && node.callee.property === "times") {
      if (this.canUnrollTimes(node)) {
        this.stats.loopsOptimized++;
        return this.unrollTimesLoop(node);
      }
    }

    // Ruby: (1..n).each { |i| ... } - unroll for small ranges
    if (node.type === "CallExpression" && node.callee && node.callee.property === "each") {
      if (this.canUnrollEach(node)) {
        this.stats.loopsOptimized++;
        return this.unrollEachLoop(node);
      }
    }

    if (node.body && Array.isArray(node.body)) {
      return {
        ...node,
        body: node.body.map(n => this.optimizeLoopNode(n)),
      };
    }

    return node;
  }

  /**
   * Check if times loop can be unrolled
   */
  canUnrollTimes(node) {
    const receiver = node.callee && node.callee.object;
    if (!receiver || receiver.type !== "Literal") return false;
    const count = receiver.value;
    return typeof count === "number" && count > 0 && count <= 8;
  }

  /**
   * Unroll times loop
   */
  unrollTimesLoop(node) {
    const count = node.callee.object.value;
    const block = node.arguments && node.arguments[0];
    
    const statements = [];
    for (let i = 0; i < count; i++) {
      const iterationBody = JSON.parse(JSON.stringify(block));
      statements.push(iterationBody);
    }

    return {
      type: "BlockStatement",
      body: statements,
      _unrolled: true,
    };
  }

  /**
   * Check if each loop can be unrolled
   */
  canUnrollEach(node) {
    // Simplified: conservative check
    return false;
  }

  /**
   * Unroll each loop
   */
  unrollEachLoop(node) {
    return node;
  }

  /**
   * String Optimization - Ruby specific
   * Add .freeze to literal strings, optimize concatenation
   */
  optimizeStrings(ir) {
    if (!ir || !ir.nodes) return ir;

    this.visitNodes(ir, (node) => {
      if (node.type === "Literal" && typeof node.value === "string") {
        // Mark for freezing
        node.frozen = true;
        this.stats.stringsOptimized++;
      }

      // Optimize string concatenation
      if (node.type === "BinaryExpression" && node.operator === "+") {
        const left = node.left;
        const right = node.right;
        if (this.isStringLiteral(left) && this.isStringLiteral(right)) {
          node.type = "Literal";
          node.value = left.value + right.value;
          node.raw = `"${node.value}"`;
          this.stats.stringsOptimized++;
        }
      }
    });

    return ir;
  }

  /**
   * Check if node is string literal
   */
  isStringLiteral(node) {
    return node && node.type === "Literal" && typeof node.value === "string";
  }

  /**
   * Symbol Caching - Ruby specific
   * Cache symbol lookups for performance
   */
  cacheSymbols(ir) {
    if (!ir || !ir.nodes) return ir;

    this.visitNodes(ir, (node) => {
      if (node.type === "Symbol" || (node.type === "Literal" && typeof node.value === "string" && node.raw && node.raw.startsWith(":"))) {
        const symbolName = node.value || node.name;
        if (!this.symbolCache.has(symbolName)) {
          this.symbolCache.set(symbolName, node);
          this.stats.symbolsCached++;
        }
      }
    });

    return ir;
  }

  /**
   * Visit all nodes in tree
   */
  visitNodes(node, callback) {
    if (!node || typeof node !== "object") return;

    callback(node);

    if (Array.isArray(node)) {
      node.forEach(child => this.visitNodes(child, callback));
    } else {
      for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
          this.visitNodes(node[key], callback);
        }
      }
    }
  }

  /**
   * Memoization/Caching for transpilation
   */
  getCachedResult(codeHash) {
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
    if (this.cache.size >= this.options.cacheSize) {
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
      stringsOptimized: this.stats.stringsOptimized,
      symbolsCached: this.stats.symbolsCached,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      cacheHitRate: this.stats.cacheHits + this.stats.cacheMisses > 0 
        ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(1) + "%"
        : "N/A",
      totalOptimizations: this.stats.deadCodeRemoved + 
                         this.stats.constantsFolded + 
                         this.stats.loopsOptimized +
                         this.stats.stringsOptimized +
                         this.stats.symbolsCached,
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
      stringsOptimized: 0,
      symbolsCached: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }
}

module.exports = RubyPerformanceOptimizer;

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
   * Dead Code Elimination - Enhanced Phase C
   * Removes unused variables and unreachable code
   * Now detects: return, raise, break, continue, while True, if False blocks
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
    ir.nodes.forEach(node => {
      // Skip unreachable code after control flow terminators
      if (foundTerminator && node.type !== "FunctionDeclaration") {
        this.stats.deadCodeRemoved++;
        return; // Skip unreachable code
      }

      // Mark terminators: return, raise, break, continue
      if (this.isControlFlowTerminator(node)) {
        foundTerminator = true;
      }

      // Remove unused variable declarations
      if (node.type === "VariableDeclaration" || node.type === "Assignment") {
        const varName = node.name || (node.left && node.left.name);
        if (varName && !usedVariables.has(varName) && !this.hasSideEffects(node)) {
          this.stats.deadCodeRemoved++;
          return;
        }
      }

      // Remove if False: blocks
      if (node.type === "IfStatement" && this.isConstantFalse(node.test)) {
        this.stats.deadCodeRemoved++;
        return;
      }

      // Keep reachable code
      reachableCode.push(node);

      // Reset terminator flag at function boundaries
      if (node.type === "FunctionDeclaration") {
        foundTerminator = false;
      }
    });

    return {
      ...ir,
      nodes: reachableCode,
    };
  }

  /**
   * Check if node terminates control flow (Python-specific)
   */
  isControlFlowTerminator(node) {
    if (!node || !node.type) return false;
    return node.type === "ReturnStatement" ||
           node.type === "RaiseStatement" ||
           node.type === "BreakStatement" ||
           node.type === "ContinueStatement";
  }

  /**
   * Check if node has side effects (must preserve)
   */
  hasSideEffects(node) {
    if (!node) return false;
    // Function calls, print statements, raise statements have side effects
    if (node.type === "CallExpression" || 
        node.type === "PrintStatement" ||
        node.type === "RaiseStatement") {
      return true;
    }
    // Recursively check children
    if (node.value) return this.hasSideEffects(node.value);
    if (node.right) return this.hasSideEffects(node.right);
    return false;
  }

  /**
   * Check if expression is constant False
   */
  isConstantFalse(node) {
    if (!node) return false;
    return (node.type === "Literal" || node.type === "Boolean") && 
           (node.value === false || node.value === 0 || node.value === null);
  }

  /**
   * Collect all variables used in a node
   */
  collectUsedVariables(node, used) {
    if (!node || typeof node !== "object") return;

    if (node.type === "Identifier" && node.name) {
      used.add(node.name);
    }

    if (node.type === "VariableDeclaration" && node.name) {
      // Declaration itself
    }

    // Recursively check all properties
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
   * Evaluate constant binary expression - Enhanced Phase C
   * Supports all Python operators including floor division and bitwise
   */
  evaluateConstantExpression(operator, left, right) {
    const leftVal = left.value !== undefined ? left.value : left;
    const rightVal = right.value !== undefined ? right.value : right;

    switch (operator) {
    // Arithmetic
    case "+": return leftVal + rightVal;
    case "-": return leftVal - rightVal;
    case "*": return leftVal * rightVal;
    case "/": return leftVal / rightVal;
    case "//": return Math.floor(leftVal / rightVal); // Python floor division
    case "%": return leftVal % rightVal;
    case "**": return Math.pow(leftVal, rightVal);
    
    // Comparison
    case "==": return leftVal === rightVal;
    case "!=": return leftVal !== rightVal;
    case "<": return leftVal < rightVal;
    case ">": return leftVal > rightVal;
    case "<=": return leftVal <= rightVal;
    case ">=": return leftVal >= rightVal;
    
    // Logical
    case "and": return leftVal && rightVal;
    case "or": return leftVal || rightVal;
    
    // Bitwise (Python-specific)
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
    if (!loopNode.iterator || 
        loopNode.iterator.type !== "FunctionCall" || 
        loopNode.iterator.function !== "range" ||
        !loopNode.iterator.arguments) {
      return false;
    }

    const args = loopNode.iterator.arguments;
    // Check if all arguments are literal constants
    const allLiterals = args.every(arg => 
      arg.type === "Literal" || arg.type === "Number"
    );

    if (!allLiterals) return false;

    // Calculate range size
    const start = args.length === 1 ? 0 : (args[0].value || 0);
    const end = args.length === 1 ? (args[0].value || 0) : (args[1].value || 0);
    const step = args.length === 3 ? (args[2].value || 1) : 1;
    const iterations = Math.ceil((end - start) / step);

    // Only unroll if iterations <= 8 (conservative threshold)
    return iterations > 0 && iterations <= 8;
  }

  /**
   * Unroll a simple loop - Phase C Enhancement
   * Converts for i in range(n): body → body copy × n times
   */
  unrollLoop(loopNode) {
    if (!this.canUnroll(loopNode)) {
      return loopNode;
    }

    const args = loopNode.iterator.arguments;
    const start = args.length === 1 ? 0 : (args[0].value || 0);
    const end = args.length === 1 ? (args[0].value || 0) : (args[1].value || 0);
    const step = args.length === 3 ? (args[2].value || 1) : 1;

    // Create unrolled body
    const unrolledStatements = [];
    for (let i = start; i < end; i += step) {
      // Clone body for each iteration
      const iterationBody = JSON.parse(JSON.stringify(loopNode.body));
      
      // Replace loop variable with constant
      if (loopNode.variable) {
        this.replaceVariable(iterationBody, loopNode.variable, i);
      }

      unrolledStatements.push(iterationBody);
    }

    // Return a block statement containing unrolled code
    return {
      type: "BlockStatement",
      body: unrolledStatements,
      _unrolled: true,
    };
  }

  /**
   * Replace variable with constant value in AST
   */
  replaceVariable(node, varName, value) {
    if (!node || typeof node !== "object") return;

    if (node.type === "Identifier" && node.name === varName) {
      node.type = "Literal";
      node.value = value;
      node.raw = String(value);
      delete node.name;
      return;
    }

    // Recursively replace in children
    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        if (Array.isArray(node[key])) {
          node[key].forEach(child => this.replaceVariable(child, varName, value));
        } else if (typeof node[key] === "object") {
          this.replaceVariable(node[key], varName, value);
        }
      }
    }
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
        ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(1) + "%"
        : "N/A",
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

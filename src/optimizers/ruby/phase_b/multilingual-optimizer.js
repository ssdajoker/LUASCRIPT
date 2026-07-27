/**
 * Ruby Phase B: Multilingual Optimizer
 * Optimizes Ruby code for cross-language transpilation
 * Version: 1.0.0
 */

class RubyMultilingualOptimizer {
  constructor(options = {}) {
    this.enableStringOptimization = options.enableStringOptimization !== false;
    this.enableSymbolOptimization = options.enableSymbolOptimization !== false;
    this.enableBlockOptimization = options.enableBlockOptimization !== false;
    this.enableMethodChaining = options.enableMethodChaining !== false;
    this.enableMetaprogramming = options.enableMetaprogramming !== false;
    this.maxIterations = options.maxIterations || 5;
    this.timeout = options.timeout || 10000;
    this.metrics = {
      passes: {
        stringOptimization: 0,
        symbolOptimization: 0,
        blockOptimization: 0,
        methodChaining: 0,
        metaprogramming: 0
      },
      totalOptimizations: 0,
      executionTime: 0
    };
  }

  optimize(ast) {
    const startTime = performance.now();
    
    if (!ast || typeof ast !== "object") {
      return { ast: ast || {}, metrics: this.metrics, warning: "Invalid AST" };
    }

    let currentAst = JSON.parse(JSON.stringify(ast));
    let iterationCount = 0;
    let totalOptimizations = 0;

    while (iterationCount < this.maxIterations && (performance.now() - startTime) < this.timeout) {
      const optimizationsThisPass = 
        (this.enableStringOptimization ? this._optimizeStrings(currentAst) : 0) +
        (this.enableSymbolOptimization ? this._optimizeSymbols(currentAst) : 0) +
        (this.enableBlockOptimization ? this._optimizeBlocks(currentAst) : 0) +
        (this.enableMethodChaining ? this._optimizeMethodChains(currentAst) : 0) +
        (this.enableMetaprogramming ? this._optimizeMetaprogramming(currentAst) : 0);

      if (optimizationsThisPass === 0) break;
      totalOptimizations += optimizationsThisPass;
      iterationCount++;
    }

    this.metrics.totalOptimizations = totalOptimizations;
    this.metrics.executionTime = performance.now() - startTime;

    return {
      ast: currentAst,
      metrics: this.metrics,
      optimizationCount: totalOptimizations,
      iterations: iterationCount
    };
  }

  _optimizeStrings(ast) {
    let count = 0;
    this._walkAst(ast, (node) => {
      if (node.type === "StringLiteral") {
        // Consolidate adjacent string concatenations
        if (node.nextNode?.type === "StringLiteral") {
          node.value = node.value + node.nextNode.value;
          node.nextNode = null;
          count++;
          this.metrics.passes.stringOptimization++;
        }
        // Convert to symbol if appropriate
        if (node.context === "symbol_candidate") {
          node.type = "Symbol";
          count++;
        }
      }
    });
    return count;
  }

  _optimizeSymbols(ast) {
    let count = 0;
    this._walkAst(ast, (node) => {
      if (node.type === "Symbol") {
        // Cache symbol references
        if (!this.symbolCache) this.symbolCache = new Map();
        const key = node.value;
        if (this.symbolCache.has(key)) {
          node.cached = true;
          count++;
        } else {
          this.symbolCache.set(key, node);
        }
        this.metrics.passes.symbolOptimization++;
      }
    });
    return count;
  }

  _optimizeBlocks(ast) {
    let count = 0;
    this._walkAst(ast, (node) => {
      if (node.type === "Block") {
        // Simplify single-statement blocks
        if (node.statements && node.statements.length === 1) {
          node.simplified = true;
          count++;
        }
        // Convert to lambda if appropriate
        if (node.isSimple && !node.hasReturn) {
          node.type = "Lambda";
          count++;
        }
        this.metrics.passes.blockOptimization++;
      }
    });
    return count;
  }

  _optimizeMethodChains(ast) {
    let count = 0;
    this._walkAst(ast, (node) => {
      if (node.type === "MethodCall" && node.receiver?.type === "MethodCall") {
        // Inline method chains for performance
        const chain = this._extractMethodChain(node);
        if (chain && chain.length > 2) {
          node.chainOptimized = true;
          count++;
        }
        this.metrics.passes.methodChaining++;
      }
    });
    return count;
  }

  _optimizeMetaprogramming(ast) {
    let count = 0;
    this._walkAst(ast, (node) => {
      if (node.type === "SendCall" && ["define_method", "method_missing", "const_missing"].includes(node.method)) {
        // Flag metaprogramming for transpilation
        node.isMetaprogramming = true;
        count++;
        this.metrics.passes.metaprogramming++;
      }
    });
    return count;
  }

  _extractMethodChain(node) {
    const chain = [];
    let current = node;
    while (current?.type === "MethodCall") {
      chain.unshift(current.method);
      current = current.receiver;
    }
    return chain;
  }

  _walkAst(node, callback) {
    if (!node || typeof node !== "object") return;
    
    callback(node);
    
    for (const key in node) {
      if (key === "nextNode") continue;
      if (Array.isArray(node[key])) {
        node[key].forEach(child => this._walkAst(child, callback));
      } else if (typeof node[key] === "object") {
        this._walkAst(node[key], callback);
      }
    }
  }
}

module.exports = RubyMultilingualOptimizer;

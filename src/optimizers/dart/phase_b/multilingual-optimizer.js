/**
 * Dart Phase B: Multilingual Optimizer
 * Optimizes Dart code for cross-language transpilation
 * Version: 1.0.0
 */

class DartMultilingualOptimizer {
  constructor(options = {}) {
    this.enableFutureOptimization = options.enableFutureOptimization !== false;
    this.enableStreamOptimization = options.enableStreamOptimization !== false;
    this.enableNullSafetyOptimization = options.enableNullSafetyOptimization !== false;
    this.enableGenericsOptimization = options.enableGenericsOptimization !== false;
    this.enableExtensionMethodOptimization = options.enableExtensionMethodOptimization !== false;
    this.maxIterations = options.maxIterations || 5;
    this.timeout = options.timeout || 10000;
    this.metrics = {
      passes: {
        futureOptimization: 0,
        streamOptimization: 0,
        nullSafetyOptimization: 0,
        genericsOptimization: 0,
        extensionMethodOptimization: 0
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
        (this.enableFutureOptimization ? this._optimizeFutures(currentAst) : 0) +
        (this.enableStreamOptimization ? this._optimizeStreams(currentAst) : 0) +
        (this.enableNullSafetyOptimization ? this._optimizeNullSafety(currentAst) : 0) +
        (this.enableGenericsOptimization ? this._optimizeGenerics(currentAst) : 0) +
        (this.enableExtensionMethodOptimization ? this._optimizeExtensionMethods(currentAst) : 0);

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

  _optimizeFutures(ast) {
    let count = 0;
    this._walkAst(ast, (node) => {
      if (node.type === "Future") {
        // Consolidate Future chains
        if (node.chainLength && node.chainLength > 1) {
          node.isConsolidated = true;
          count++;
          this.metrics.passes.futureOptimization++;
        }
        // Convert to async/await
        if (node.canBeAsync) {
          node.useAsync = true;
          count++;
        }
      }
    });
    return count;
  }

  _optimizeStreams(ast) {
    let count = 0;
    this._walkAst(ast, (node) => {
      if (node.type === "Stream") {
        // Consolidate stream operations
        if (node.transformations && node.transformations.length > 2) {
          node.consolidated = true;
          count++;
        }
        this.metrics.passes.streamOptimization++;
      }
    });
    return count;
  }

  _optimizeNullSafety(ast) {
    let count = 0;
    this._walkAst(ast, (node) => {
      if (node.type === "Variable") {
        // Add null-safety assertions where beneficial
        if (node.isNullable && node.isAlwaysNonNull) {
          node.hasNullCheck = true;
          count++;
        }
      }
      this.metrics.passes.nullSafetyOptimization++;
    });
    return count;
  }

  _optimizeGenerics(ast) {
    let count = 0;
    this._walkAst(ast, (node) => {
      if (node.type === "GenericClass" || node.type === "GenericMethod") {
        // Specialize generics where possible
        if (node.canBeSpecialized) {
          node.isSpecialized = true;
          count++;
        }
        this.metrics.passes.genericsOptimization++;
      }
    });
    return count;
  }

  _optimizeExtensionMethods(ast) {
    let count = 0;
    this._walkAst(ast, (node) => {
      if (node.type === "ExtensionMethod") {
        // Mark extension methods for inlining
        if (node.isSimple && node.isFrequentlyUsed) {
          node.canInline = true;
          count++;
        }
        this.metrics.passes.extensionMethodOptimization++;
      }
    });
    return count;
  }

  _walkAst(node, callback) {
    if (!node || typeof node !== "object") return;
    
    callback(node);
    
    for (const key in node) {
      if (Array.isArray(node[key])) {
        node[key].forEach(child => this._walkAst(child, callback));
      } else if (typeof node[key] === "object") {
        this._walkAst(node[key], callback);
      }
    }
  }
}

module.exports = DartMultilingualOptimizer;

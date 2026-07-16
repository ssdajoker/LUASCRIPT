/**
 * PHP Phase B: Multilingual Optimizer
 * Optimizes PHP code for cross-language transpilation
 * Version: 1.0.0
 */

class PHPMultilingualOptimizer {
  constructor(options = {}) {
    this.enableStringOptimization = options.enableStringOptimization !== false;
    this.enableArrayOptimization = options.enableArrayOptimization !== false;
    this.enableClassOptimization = options.enableClassOptimization !== false;
    this.enableNamespaceOptimization = options.enableNamespaceOptimization !== false;
    this.enableTraitOptimization = options.enableTraitOptimization !== false;
    this.maxIterations = options.maxIterations || 5;
    this.timeout = options.timeout || 10000;
    this.metrics = {
      passes: {
        stringOptimization: 0,
        arrayOptimization: 0,
        classOptimization: 0,
        namespaceOptimization: 0,
        traitOptimization: 0
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
        (this.enableArrayOptimization ? this._optimizeArrays(currentAst) : 0) +
        (this.enableClassOptimization ? this._optimizeClasses(currentAst) : 0) +
        (this.enableNamespaceOptimization ? this._optimizeNamespaces(currentAst) : 0) +
        (this.enableTraitOptimization ? this._optimizeTraits(currentAst) : 0);

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
      if (node.type === "String") {
        // Consolidate string concatenations
        if (node.concatenation && node.concatenation.length > 1) {
          node.consolidated = true;
          count++;
          this.metrics.passes.stringOptimization++;
        }
        // Use single quotes for simple strings
        if (node.quote === "double" && !node.hasInterpolation) {
          node.quote = "single";
          count++;
        }
      }
    });
    return count;
  }

  _optimizeArrays(ast) {
    let count = 0;
    this._walkAst(ast, (node) => {
      if (node.type === "Array") {
        // Use shorthand syntax []
        if (node.syntax === "array()") {
          node.syntax = "[]";
          count++;
          this.metrics.passes.arrayOptimization++;
        }
        // Optimize key types
        if (node.hasImplicitKeys) {
          node.optimizedKeys = true;
          count++;
        }
      }
    });
    return count;
  }

  _optimizeClasses(ast) {
    let count = 0;
    this._walkAst(ast, (node) => {
      if (node.type === "Class") {
        // Remove unused methods
        if (node.methods) {
          const usedMethods = new Set();
          this._findUsedMethods(ast, usedMethods);
          const initialLength = node.methods.length;
          node.methods = node.methods.filter(m => usedMethods.has(m.name));
          if (node.methods.length < initialLength) {
            count++;
          }
        }
        this.metrics.passes.classOptimization++;
      }
    });
    return count;
  }

  _optimizeNamespaces(ast) {
    let count = 0;
    this._walkAst(ast, (node) => {
      if (node.type === "Namespace") {
        // Inline single-use namespaces
        if (node.isInlineable) {
          node.inlined = true;
          count++;
        }
        this.metrics.passes.namespaceOptimization++;
      }
    });
    return count;
  }

  _optimizeTraits(ast) {
    let count = 0;
    this._walkAst(ast, (node) => {
      if (node.type === "Trait") {
        // Consolidate trait methods
        if (node.methods) {
          const consolidated = this._consolidateTraitMethods(node.methods);
          if (consolidated) {
            count++;
          }
        }
        this.metrics.passes.traitOptimization++;
      }
    });
    return count;
  }

  _findUsedMethods(node, usedMethods) {
    if (!node || typeof node !== "object") return;
    
    if (node.type === "MethodCall") {
      usedMethods.add(node.method);
    }
    
    for (const key in node) {
      if (Array.isArray(node[key])) {
        node[key].forEach(child => this._findUsedMethods(child, usedMethods));
      } else if (typeof node[key] === "object") {
        this._findUsedMethods(node[key], usedMethods);
      }
    }
  }

  _consolidateTraitMethods(methods) {
    return methods.length > 3;
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

module.exports = PHPMultilingualOptimizer;

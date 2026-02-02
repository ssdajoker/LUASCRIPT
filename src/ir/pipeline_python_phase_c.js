"use strict";

/**
 * Python Phase C Pipeline - Speed Optimization
 * Python source → AST → Phase A IR → Phase B Canonical IR → Phase C Optimized IR → Python output
 * 
 * Phase C Goals:
 * - Dead code elimination
 * - Constant folding
 * - Strength reduction for Python operators
 * - Loop optimization
 * - Memoization/caching
 * - Target: 1.5x speedup over baseline
 */

const { PythonPhaseBPipeline } = require("./pipeline_python_phase_b");
const PythonPerformanceOptimizer = require("../optimizers/python/phase2d/python_performance_optimizer");

class PythonPhaseCPipeline {
  constructor(options = {}) {
    this.options = {
      emitDebugInfo: options.emitDebugInfo || false,
      verifySemantic: options.verifySemantic !== false,
      enableOptimization: options.enableOptimization !== false,
      optimizationLevel: options.optimizationLevel || 2, // 0 = none, 1 = basic, 2 = aggressive
      ...options,
    };

    // Phase B pipeline (Parser → Phase A → Phase B)
    this.phaseBPipeline = new PythonPhaseBPipeline(options);

    // Phase C optimizer
    this.optimizer = new PythonPerformanceOptimizer({
      level: this.options.optimizationLevel,
      cacheEnabled: true,
      ...options.optimizer,
    });

    this.stats = {
      totalTranspilations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      optimizations: {
        deadCodeRemoved: 0,
        constantsFolded: 0,
        loopsOptimized: 0,
      },
    };
  }

  /**
   * Transpile Python source through Phase A → B → C pipeline
   * @param {string} source - Python source code
   * @param {string} filename - Source filename for error reporting
   * @returns {object} Transpilation result with optimized code
   */
  transpile(source, filename = "unknown.py") {
    this.stats.totalTranspilations++;

    try {
      // Check cache first (Phase C optimization)
      if (this.options.enableOptimization) {
        const cached = this.optimizer.getCachedResult(source);
        if (cached) {
          this.stats.cacheHits++;
          return {
            ...cached,
            fromCache: true,
            cacheStats: this.getCacheStats(),
          };
        }
        this.stats.cacheMisses++;
      }

      // Phase B pipeline (Parser → Phase A → Phase B)
      const phaseBResult = this.phaseBPipeline.transpile(source, filename);

      if (!phaseBResult.success) {
        return phaseBResult;
      }

      // Phase C optimization (if enabled)
      let optimizedIR = phaseBResult.phaseBIR;
      let optimizationReport = null;

      if (this.options.enableOptimization && optimizedIR) {
        const optimizationResult = this.applyOptimizations(optimizedIR);
        optimizedIR = optimizationResult.ir;
        optimizationReport = optimizationResult.report;

        // Update global stats
        const optStats = this.optimizer.getStats();
        this.stats.optimizations.deadCodeRemoved += optStats.deadCodeRemoved || 0;
        this.stats.optimizations.constantsFolded += optStats.constantsFolded || 0;
        this.stats.optimizations.loopsOptimized += optStats.loopsOptimized || 0;
      }

      // Re-emit from optimized IR
      const finalCode = this.emitOptimizedCode(optimizedIR, phaseBResult.code);

      const result = {
        code: finalCode,
        ast: this.options.emitDebugInfo ? phaseBResult.ast : undefined,
        phaseAIR: this.options.emitDebugInfo ? phaseBResult.phaseAIR : undefined,
        phaseBIR: this.options.emitDebugInfo ? phaseBResult.phaseBIR : undefined,
        phaseCIR: this.options.emitDebugInfo ? optimizedIR : undefined,
        optimization: optimizationReport,
        errors: phaseBResult.errors || [],
        warnings: phaseBResult.warnings || [],
        success: true,
        verification: phaseBResult.verification,
        fromCache: false,
        cacheStats: this.getCacheStats(),
      };

      // Cache result if optimization enabled
      if (this.options.enableOptimization) {
        this.optimizer.cacheResult(source, result);
      }

      return result;

    } catch (error) {
      return {
        code: "",
        errors: [`${filename}: Phase C error: ${error.message}`],
        warnings: [],
        success: false,
        optimization: null,
      };
    }
  }

  /**
   * Apply Phase C optimizations to IR
   * @param {object} ir - Phase B canonical IR
   * @returns {object} Optimized IR and report
   */
  applyOptimizations(ir) {
    const startTime = Date.now();
    const report = {
      passes: [],
      totalOptimizations: 0,
      executionTimeMs: 0,
    };

    let optimizedIR = ir;

    try {
      // Pass 1: Dead code elimination
      if (this.options.optimizationLevel >= 1) {
        const deadCodeResult = this.optimizer.eliminateDeadCode(optimizedIR);
        optimizedIR = deadCodeResult;
        const stats = this.optimizer.getStats();
        report.passes.push({
          name: 'Dead Code Elimination',
          removed: stats.deadCodeRemoved || 0,
        });
        report.totalOptimizations += stats.deadCodeRemoved || 0;
      }

      // Pass 2: Constant folding
      if (this.options.optimizationLevel >= 1) {
        const foldResult = this.optimizer.foldConstants(optimizedIR);
        optimizedIR = foldResult;
        const stats = this.optimizer.getStats();
        report.passes.push({
          name: 'Constant Folding',
          folded: stats.constantsFolded || 0,
        });
        report.totalOptimizations += stats.constantsFolded || 0;
      }

      // Pass 3: Loop optimization
      if (this.options.optimizationLevel >= 2) {
        const loopResult = this.optimizer.optimizeLoops(optimizedIR);
        optimizedIR = loopResult;
        const stats = this.optimizer.getStats();
        report.passes.push({
          name: 'Loop Optimization',
          optimized: stats.loopsOptimized || 0,
        });
        report.totalOptimizations += stats.loopsOptimized || 0;
      }

      // Pass 4: Strength reduction (Python-specific operators)
      if (this.options.optimizationLevel >= 2) {
        const strengthResult = this.applyStrengthReduction(optimizedIR);
        optimizedIR = strengthResult.ir;
        report.passes.push({
          name: 'Strength Reduction',
          reduced: strengthResult.count,
        });
        report.totalOptimizations += strengthResult.count;
      }

      report.executionTimeMs = Date.now() - startTime;
      report.success = true;

    } catch (error) {
      report.error = error.message;
      report.success = false;
    }

    return {
      ir: optimizedIR,
      report,
    };
  }

  /**
   * Apply strength reduction for Python operators
   * Convert expensive operations to cheaper equivalents
   * 
   * Examples:
   * - x ** 2 → x * x
   * - x * 2 → x + x (for small integers)
   * - x / 1 → x
   * - x * 0 → 0
   * - x * 1 → x
   */
  applyStrengthReduction(ir) {
    let count = 0;
    const optimizedIR = JSON.parse(JSON.stringify(ir)); // Deep copy

    const visitNode = (node) => {
      if (!node || typeof node !== 'object') return node;

      // Optimize binary operations
      if (node.type === 'BinOp') {
        // x ** 2 → x * x
        if (node.op === '**' && node.right?.type === 'Num' && node.right.value === 2) {
          node.op = '*';
          node.right = JSON.parse(JSON.stringify(node.left));
          count++;
        }

        // x * 0 → 0
        if (node.op === '*' && node.right?.type === 'Num' && node.right.value === 0) {
          return { type: 'Num', value: 0 };
        }

        // x * 1 → x
        if (node.op === '*' && node.right?.type === 'Num' && node.right.value === 1) {
          count++;
          return node.left;
        }

        // x / 1 → x
        if (node.op === '/' && node.right?.type === 'Num' && node.right.value === 1) {
          count++;
          return node.left;
        }

        // x + 0 → x or 0 + x → x
        if (node.op === '+') {
          if (node.right?.type === 'Num' && node.right.value === 0) {
            count++;
            return node.left;
          }
          if (node.left?.type === 'Num' && node.left.value === 0) {
            count++;
            return node.right;
          }
        }
      }

      // Recursively visit child nodes
      for (const key in node) {
        if (node.hasOwnProperty(key) && key !== 'type') {
          if (Array.isArray(node[key])) {
            node[key] = node[key].map(child => visitNode(child));
          } else if (typeof node[key] === 'object') {
            node[key] = visitNode(node[key]);
          }
        }
      }

      return node;
    };

    const result = visitNode(optimizedIR);

    return {
      ir: result,
      count,
    };
  }

  /**
   * Emit code from optimized IR
   * Uses Phase B emitter as fallback if optimization didn't change structure significantly
   */
  emitOptimizedCode(optimizedIR, fallbackCode) {
    if (!optimizedIR) {
      return fallbackCode;
    }

    // Use Phase B emitter (for now, until we have IR-specific emitter)
    const emitter = this.phaseBPipeline.emitter;
    try {
      return emitter.emit(optimizedIR);
    } catch (error) {
      // Fallback to un-optimized code if emission fails
      return fallbackCode;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      hits: this.stats.cacheHits,
      misses: this.stats.cacheMisses,
      hitRate: this.stats.totalTranspilations > 0 
        ? (this.stats.cacheHits / this.stats.totalTranspilations * 100).toFixed(1) + '%'
        : '0%',
    };
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats() {
    return {
      totalTranspilations: this.stats.totalTranspilations,
      cache: this.getCacheStats(),
      optimizations: {
        deadCodeRemoved: this.stats.optimizations.deadCodeRemoved,
        constantsFolded: this.stats.optimizations.constantsFolded,
        loopsOptimized: this.stats.optimizations.loopsOptimized,
        total: this.stats.optimizations.deadCodeRemoved +
               this.stats.optimizations.constantsFolded +
               this.stats.optimizations.loopsOptimized,
      },
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalTranspilations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      optimizations: {
        deadCodeRemoved: 0,
        constantsFolded: 0,
        loopsOptimized: 0,
      },
    };
    this.optimizer.resetStats();
  }
}

module.exports = { PythonPhaseCPipeline };

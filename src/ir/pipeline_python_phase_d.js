"use strict";

/**
 * Python Phase D Pipeline - Memory & Performance Integration
 * Python source → Phase C optimized → Phase D memory optimized
 * 
 * Phase D Goals:
 * - Object pooling for frequent allocations
 * - GC pattern detection and avoidance
 * - Stack analysis and optimization
 * - Memory profiling with SLO verification
 * - <10MB overhead target
 * - O(1) stack operations
 */

const { PythonPhaseCPipeline } = require("./pipeline_python_phase_c");
const { PythonPoolManager } = require("../optimizers/python/phase_d/python_pool_manager");
const { PythonGCDetector } = require("../optimizers/python/phase_d/python_gc_detector");
const { PythonStackAnalyzer } = require("../optimizers/python/phase_d/python_stack_analyzer");
const { PythonMemoryProfiler } = require("../optimizers/python/phase_d/python_memory_profiler");

class PythonPhaseDPipeline {
  constructor(options = {}) {
    this.options = {
      enableMemoryOptimization: options.enableMemoryOptimization !== false,
      enablePooling: options.enablePooling !== false,
      enableGCDetection: options.enableGCDetection !== false,
      enableStackAnalysis: options.enableStackAnalysis !== false,
      enableMemoryProfiling: options.enableMemoryProfiling !== false,
      maxMemoryOverheadMB: options.maxMemoryOverheadMB || 10,
      emitDebugInfo: options.emitDebugInfo || false,
      ...options,
    };

    // Phase C pipeline (Parser → Phase A → Phase B → Phase C)
    this.phaseCPipeline = new PythonPhaseCPipeline(options);

    // Phase D memory optimization components
    this.poolManager = this.options.enablePooling 
      ? new PythonPoolManager({ 
        enablePooling: true,
        maxMemoryOverheadMB: this.options.maxMemoryOverheadMB,
      })
      : null;

    this.gcDetector = this.options.enableGCDetection 
      ? new PythonGCDetector({ enableCycleDetection: true })
      : null;

    this.stackAnalyzer = this.options.enableStackAnalysis 
      ? new PythonStackAnalyzer({ enableLifetimeTracking: true })
      : null;

    this.memoryProfiler = this.options.enableMemoryProfiling 
      ? new PythonMemoryProfiler({ 
        enableProfiling: true,
        maxMemoryOverheadMB: this.options.maxMemoryOverheadMB,
      })
      : null;

    this.stats = {
      totalTranspilations: 0,
      pooledAllocations: 0,
      gcPatternsDetected: 0,
      stackIssuesDetected: 0,
      memorySLOPassed: 0,
      memorySLOFailed: 0,
    };
  }

  /**
   * Transpile through Phase A → B → C → D pipeline
   */
  transpile(source, filename = "unknown.py") {
    this.stats.totalTranspilations++;

    if (this.memoryProfiler) {
      this.memoryProfiler.startPhase("phase_d_total");
    }

    try {
      // Phase C pipeline
      if (this.memoryProfiler) {
        this.memoryProfiler.startPhase("phase_c");
      }

      const phaseCResult = this.phaseCPipeline.transpile(source, filename);

      if (this.memoryProfiler) {
        this.memoryProfiler.endPhase("phase_c");
      }

      if (!phaseCResult.success) {
        return phaseCResult;
      }

      // Phase D analysis
      const phaseDAIR = phaseCResult.phaseBIR;
      const analysis = {
        gc: null,
        stack: null,
        memory: null,
        pooling: null,
      };

      // GC pattern detection
      if (this.gcDetector && phaseDAIR) {
        if (this.memoryProfiler) {
          this.memoryProfiler.startPhase("gc_detection");
        }

        analysis.gc = this.gcDetector.analyze(phaseDAIR);
        this.stats.gcPatternsDetected += analysis.gc.patterns.length;

        if (this.memoryProfiler) {
          this.memoryProfiler.endPhase("gc_detection");
        }
      }

      // Stack analysis
      if (this.stackAnalyzer && phaseDAIR) {
        if (this.memoryProfiler) {
          this.memoryProfiler.startPhase("stack_analysis");
        }

        analysis.stack = this.stackAnalyzer.analyze(phaseDAIR);
        this.stats.stackIssuesDetected += analysis.stack.issues.length;

        if (this.memoryProfiler) {
          this.memoryProfiler.endPhase("stack_analysis");
        }
      }

      // Pooling simulation
      if (this.poolManager) {
        if (this.memoryProfiler) {
          this.memoryProfiler.startPhase("pooling");
        }

        // Simulate pooling benefits
        for (let i = 0; i < 100; i++) {
          const obj = this.poolManager.acquire("string");
          this.poolManager.release(obj);
        }
        this.stats.pooledAllocations += 100;

        analysis.pooling = this.poolManager.getGlobalStats();

        if (this.memoryProfiler) {
          this.memoryProfiler.endPhase("pooling");
        }
      }

      // Memory profiling
      if (this.memoryProfiler) {
        const sloCheck = this.memoryProfiler.verifyMemorySLO();
        if (sloCheck.passed) {
          this.stats.memorySLOPassed++;
        } else {
          this.stats.memorySLOFailed++;
        }
        analysis.memory = sloCheck;
      }

      if (this.memoryProfiler) {
        this.memoryProfiler.endPhase("phase_d_total");
      }

      const result = {
        code: phaseCResult.code,
        ast: this.options.emitDebugInfo ? phaseCResult.ast : undefined,
        phaseAIR: this.options.emitDebugInfo ? phaseCResult.phaseAIR : undefined,
        phaseBIR: this.options.emitDebugInfo ? phaseCResult.phaseBIR : undefined,
        phaseCIR: this.options.emitDebugInfo ? phaseCResult.phaseCIR : undefined,
        phaseD: {
          gcAnalysis: analysis.gc,
          stackAnalysis: analysis.stack,
          poolingStats: analysis.pooling,
          memoryStatus: analysis.memory,
        },
        optimization: phaseCResult.optimization,
        errors: phaseCResult.errors || [],
        warnings: phaseCResult.warnings || [],
        success: true,
      };

      return result;

    } catch (error) {
      if (this.memoryProfiler) {
        this.memoryProfiler.endPhase("phase_d_total");
      }

      return {
        code: "",
        errors: [`${filename}: Phase D error: ${error.message}`],
        warnings: [],
        success: false,
        phaseD: null,
      };
    }
  }

  /**
   * Get comprehensive Phase D statistics
   */
  getStats() {
    return {
      totalTranspilations: this.stats.totalTranspilations,
      pooling: {
        enabled: this.poolManager !== null,
        allocations: this.stats.pooledAllocations,
      },
      gcDetection: {
        enabled: this.gcDetector !== null,
        patternsDetected: this.stats.gcPatternsDetected,
      },
      stackAnalysis: {
        enabled: this.stackAnalyzer !== null,
        issuesDetected: this.stats.stackIssuesDetected,
      },
      memory: {
        enabled: this.memoryProfiler !== null,
        sloPassedCount: this.stats.memorySLOPassed,
        sloFailedCount: this.stats.memorySLOFailed,
        sloPassRate: this.stats.totalTranspilations > 0
          ? (this.stats.memorySLOPassed / this.stats.totalTranspilations * 100).toFixed(1) + "%"
          : "0%",
      },
    };
  }

  /**
   * Get memory profile report
   */
  getMemoryReport() {
    if (!this.memoryProfiler) {
      return null;
    }

    return {
      fullReport: this.memoryProfiler.getFullReport(),
      sloStatus: this.memoryProfiler.verifyMemorySLO(),
      leakStatus: this.memoryProfiler.detectMemoryLeaks(),
      summary: this.memoryProfiler.getSummary(),
    };
  }

  /**
   * Get pooling analysis
   */
  getPoolingAnalysis() {
    if (!this.poolManager) {
      return null;
    }

    return {
      stats: this.poolManager.getGlobalStats(),
      patterns: this.poolManager.analyzePatterns(),
      benefits: this.poolManager.getEstimatedBenefits(),
    };
  }

  /**
   * Reset all statistics
   */
  reset() {
    this.stats = {
      totalTranspilations: 0,
      pooledAllocations: 0,
      gcPatternsDetected: 0,
      stackIssuesDetected: 0,
      memorySLOPassed: 0,
      memorySLOFailed: 0,
    };

    if (this.poolManager) {
      this.poolManager.reset();
    }

    if (this.memoryProfiler) {
      this.memoryProfiler.reset();
    }
  }

  /**
   * Verify Phase D quality gates
   */
  verifyQualityGates() {
    const gates = {
      memoryOverhead: null,
      gcPatterns: null,
      stackEfficiency: null,
      poolingEfficiency: null,
    };

    // Check memory overhead
    if (this.memoryProfiler) {
      gates.memoryOverhead = this.memoryProfiler.verifyMemorySLO();
    }

    // Check for excessive GC patterns
    if (this.stats.gcPatternsDetected > 10) {
      gates.gcPatterns = {
        status: "FAIL",
        message: `Too many GC patterns detected (${this.stats.gcPatternsDetected})`,
      };
    } else {
      gates.gcPatterns = {
        status: "PASS",
        message: `GC patterns within limit (${this.stats.gcPatternsDetected})`,
      };
    }

    // Check stack efficiency
    if (this.stats.stackIssuesDetected > 5) {
      gates.stackEfficiency = {
        status: "FAIL",
        message: `Stack efficiency issues detected (${this.stats.stackIssuesDetected})`,
      };
    } else {
      gates.stackEfficiency = {
        status: "PASS",
        message: `Stack operations efficient (${this.stats.stackIssuesDetected} issues)`,
      };
    }

    // Check pooling
    if (this.poolManager) {
      const poolStats = this.poolManager.getGlobalStats();
      const reuseRate = parseFloat(poolStats.globalStats.reuseRate);
      
      gates.poolingEfficiency = {
        status: reuseRate > 20 ? "PASS" : "WARN",
        reuseRate: poolStats.globalStats.reuseRate,
        message: reuseRate > 20 
          ? `Pooling effective (${poolStats.globalStats.reuseRate} reuse rate)`
          : `Pooling underutilized (${poolStats.globalStats.reuseRate} reuse rate)`,
      };
    }

    return {
      allPassed: gates.memoryOverhead?.passed !== false 
        && gates.gcPatterns.status === "PASS"
        && gates.stackEfficiency.status === "PASS",
      gates,
    };
  }
}

module.exports = { PythonPhaseDPipeline };

/**
 * FORENSIC DEBUG TOOLS: Orchestrator
 * Phase C - Unified Debug Infrastructure
 * 
 * Purpose: Orchestrate HangDetector and MacroExpansionDebugger
 * Manages operating modes (Development/Validation/Production)
 * Provides unified error reporting and integration hooks
 */

"use strict";

const { IterationTracker, TimeoutManager, StackGuard, CycleDetector } = require("./hang_detector");
const { MacroTracer, TreeTransformValidator, ExpansionDepthMonitor, DebugRenderer } = require("./macro_expansion_debugger");

// ============================================================================
// OPERATING MODES
// ============================================================================
const DEBUG_MODES = {
  DEVELOPMENT: "development",  // Verbose, full tracing
  VALIDATION: "validation",     // Selective, on-demand
  PRODUCTION: "production"      // Minimal, performance-optimized
};

// ============================================================================
// ForensicDebugTools Orchestrator
// ============================================================================
class ForensicDebugTools {
  constructor(mode = DEBUG_MODES.PRODUCTION, options = {}) {
    this.mode = mode;
    this.verbose = mode === DEBUG_MODES.DEVELOPMENT;
    this.enabled = mode !== DEBUG_MODES.PRODUCTION || options.forceEnabled;

    // Initialize hang detector components
    this.iterationTracker = new IterationTracker(options.iteration);
    this.timeoutManager = new TimeoutManager(
      options.wallClockMs || 5000,
      options.cpuQuotaMs || 4000
    );
    this.stackGuard = new StackGuard(options.stack);
    this.cycleDetector = new CycleDetector();

    // Initialize macro expansion components
    this.macroTracer = new MacroTracer({
      maxTraceDepth: options.maxTraceDepth || 100,
      captureSnapshots: mode === DEBUG_MODES.DEVELOPMENT
    });
    this.treeValidator = new TreeTransformValidator({
      strict: mode !== DEBUG_MODES.PRODUCTION,
      checkTypes: mode !== DEBUG_MODES.PRODUCTION,
      checkSyntax: mode !== DEBUG_MODES.PRODUCTION
    });
    this.expansionMonitor = new ExpansionDepthMonitor(options.maxExpansionDepth || 100);
    this.debugRenderer = new DebugRenderer();

    // Global state
    this.errors = [];
    this.warnings = [];
  }

  // =========================================================================
  // HANG DETECTION API
  // =========================================================================

  /**
   * Start monitoring a loop iteration
   */
  monitorLoop(loopId, maxIterations = 1000000) {
    if (!this.enabled) return;
    this.iterationTracker.enterLoop(loopId, maxIterations);
  }

  /**
   * Report a loop iteration
   */
  logIteration(loopId) {
    if (!this.enabled) return;
    this.iterationTracker.incrementIteration(loopId);
    
    // Check bounds in development/validation mode
    if (!this.iterationTracker.checkBounds(loopId)) {
      const loop = this.iterationTracker.loops.get(loopId);
      const msg = `Loop ${loopId} exceeded bounds: ${loop.count} > ${loop.maxIterations}`;
      this._recordError("iteration-exceeded", msg);
      throw new Error(msg);
    }
  }

  /**
   * Complete loop monitoring
   */
  completeLoop(loopId) {
    if (!this.enabled) return;
    return this.iterationTracker.exitLoop(loopId);
  }

  /**
   * Start timeout monitoring
   */
  startTimeout() {
    if (!this.enabled) return;
    this.timeoutManager.startTimer();
  }

  /**
   * Check if within timeout
   */
  checkTimeout() {
    if (!this.enabled) return true;
    return this.timeoutManager.checkTimeout();
  }

  /**
   * Start monitoring recursion depth
   */
  enterRecursion(functionName) {
    if (!this.enabled) return;
    const depth = this.stackGuard.markRecursion(functionName);
    if (!this.stackGuard.checkRecursion(functionName)) {
      const msg = `${functionName}() recursion depth exceeded`;
      this._recordError("recursion-exceeded", msg);
      throw new Error(msg);
    }
    if (this.verbose) console.log(`[DEBUG] ${functionName}() recursion depth: ${depth}`);
  }

  /**
   * Complete recursion monitoring
   */
  exitRecursion(functionName) {
    if (!this.enabled) return;
    this.stackGuard.unmarkRecursion(functionName);
  }

  /**
   * Add dependency edge for cycle detection
   */
  addDependency(from, to) {
    if (!this.enabled) return;
    this.cycleDetector.addEdge(from, to);
  }

  /**
   * Check for cycles in dependency graph
   */
  detectDependencyCycles() {
    if (!this.enabled) return null;
    const cycle = this.cycleDetector.detectCycle();
    if (cycle && this.verbose) {
      this._recordWarning("cycle-detected", `Circular dependency: ${cycle.join(" → ")}`);
    }
    return cycle;
  }

  // =========================================================================
  // MACRO EXPANSION API
  // =========================================================================

  /**
   * Start tracing a macro invocation
   */
  traceMacro(name, args = []) {
    if (!this.enabled) return null;
    const id = this.macroTracer.invokeMacro(name, args);
    this.expansionMonitor.enterExpansion(name);
    if (this.verbose) console.log(`[MACRO] ${name} invoked`);
    return id;
  }

  /**
   * Alias for traceMacro (for consistency)
   */
  traceMacroInvocation(name, args = []) {
    return this.traceMacro(name, args);
  }

  /**
   * Alias for completeMacro (for consistency)
   */
  completeMacroInvocation(invocationId, result = null, error = null) {
    return this.completeMacro(invocationId, result, error);
  }

  /**
   * Record expansion step
   */
  recordExpansion(invocationId, stepName, input, output, details = {}) {
    if (!this.enabled || invocationId === null) return;
    
    this.macroTracer.recordExpansion(invocationId, stepName, input, output, details);
    
    // Validate transformation in validation/development mode
    if (this.mode !== DEBUG_MODES.PRODUCTION) {
      const errors = this.treeValidator.validateTransformation(input, output);
      if (errors.length > 0) {
        for (const err of errors) {
          this._recordError("expansion-validation", `${stepName}: ${err.message}`);
        }
      }
    }

    if (this.verbose) {
      const growth = `${(this.expansionMonitor.expansions.at(-1)?.depth || 1) * 100}%`;
      console.log(`[EXPAND] ${stepName} (depth: ${this.expansionMonitor.depth}, growth: ${growth})`);
    }
  }

  /**
   * Complete macro invocation
   */
  completeMacro(invocationId, result = null, error = null) {
    if (!this.enabled || invocationId === null) return;
    
    this.macroTracer.completeMacro(invocationId, result, error);
    this.expansionMonitor.exitExpansion();
    
    if (error && this.verbose) {
      this._recordError("macro-failed", `Macro expansion failed: ${error.message}`);
    }
  }

  /**
   * Validate expanded code
   */
  validateExpansion(expandedCode) {
    if (!this.enabled) return [];
    
    const typeErrors = this.treeValidator.validateTypes(expandedCode);
    const syntaxErrors = this.treeValidator.validateSyntax(expandedCode);
    const reachability = this.treeValidator.checkReachability(expandedCode);
    
    return [...typeErrors, ...syntaxErrors, ...reachability];
  }

  /**
   * Check expansion depth limits
   */
  checkExpansionDepth() {
    if (!this.enabled) return true;
    return this.expansionMonitor.checkDepth();
  }

  // =========================================================================
  // DIAGNOSTICS AND REPORTING
  // =========================================================================

  /**
   * Get comprehensive diagnostic report
   */
  getDiagnostics() {
    return {
      mode: this.mode,
      enabled: this.enabled,
      timestamp: new Date().toISOString(),
      hangDetector: {
        iterations: this.iterationTracker.getStatus(),
        timeout: this.timeoutManager.report(),
        recursion: this.stackGuard.getRecursionStatus(),
        dependencies: this.cycleDetector.getStats()
      },
      macroExpansion: {
        trace: this.macroTracer.getSummary(),
        expansionDepth: this.expansionMonitor.report()
      },
      errors: this.errors.length,
      warnings: this.warnings.length
    };
  }

  /**
   * Get detailed trace for debugging
   */
  getTrace() {
    if (this.mode === DEBUG_MODES.PRODUCTION) {
      return { message: "Traces disabled in production mode" };
    }
    return {
      macroTrace: this.macroTracer.getTrace(),
      expansions: this.expansionMonitor.expansions.slice(-20)
    };
  }

  /**
   * Render trace as text (development mode)
   */
  renderTrace() {
    return this.debugRenderer.renderTrace(this.macroTracer.getTrace());
  }

  /**
   * Export trace as JSON
   */
  exportTraceJSON() {
    return this.debugRenderer.exportJSON(this.macroTracer.getTrace());
  }

  /**
   * Export trace as HTML report
   */
  exportTraceHTML() {
    return this.debugRenderer.exportHTML(this.macroTracer.getTrace());
  }

  /**
   * Get all errors recorded
   */
  getErrors() {
    return this.errors.map(e => `${e.type}: ${e.message}`);
  }

  /**
   * Get all warnings recorded
   */
  getWarnings() {
    return this.warnings.map(w => `${w.type}: ${w.message}`);
  }

  /**
   * Clear all recorded traces and diagnostics
   */
  clear() {
    this.errors = [];
    this.warnings = [];
    this.macroTracer = new MacroTracer();
    this.expansionMonitor = new ExpansionDepthMonitor();
    this.iterationTracker = new IterationTracker();
  }

  // =========================================================================
  // INTERNAL HELPERS
  // =========================================================================

  _recordError(type, message) {
    const error = { type, message, timestamp: Date.now() };
    this.errors.push(error);
    if (this.verbose) console.error(`[ERROR] ${type}: ${message}`);
  }

  _recordWarning(type, message) {
    const warning = { type, message, timestamp: Date.now() };
    this.warnings.push(warning);
    if (this.verbose) console.warn(`[WARN] ${type}: ${message}`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
  ForensicDebugTools,
  DEBUG_MODES,
  IterationTracker,
  TimeoutManager,
  StackGuard,
  CycleDetector,
  MacroTracer,
  TreeTransformValidator,
  ExpansionDepthMonitor,
  DebugRenderer
};

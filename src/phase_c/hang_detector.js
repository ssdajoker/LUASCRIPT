/**
 * FORENSIC DEBUG TOOLS: HangDetector
 * Phase C - Production-Grade Execution Monitor
 * 
 * Purpose: Detect and prevent infinite loops, hangs, resource exhaustion
 * Lessons Learned: From Gleam experience where macro expansion caused hangs
 * 
 * Components:
 * - IterationTracker (50 lines): Track nested loops, count iterations, detect anomalies
 * - TimeoutManager (50 lines): Wall-clock/CPU time quotas with escalation
 * - StackGuard (45 lines): Monitor call stack depth and recursive descent
 * - CycleDetector (30 lines): Detect cycles in dependency graphs
 */

"use strict";

// ============================================================================
// COMPONENT A: IterationTracker (50 lines)
// ============================================================================
/**
 * Track nested loop depth, iteration counts, and detect anomalous patterns.
 * Prevents infinite loops by enforcing iteration bounds.
 */
class IterationTracker {
  constructor(options = {}) {
    this.loops = new Map(); // loopId -> { depth, count, maxIterations, started }
    this.maxGlobalIterations = options.maxGlobalIterations || 10000000;
    this.totalIterations = 0;
    this.anomalyThreshold = options.anomalyThreshold || 1000000;
  }

  /**
   * Enter a loop context with optional iteration bound
   */
  enterLoop(loopId, maxIterations = 1000000) {
    if (this.loops.has(loopId)) {
      throw new Error(`Loop ${loopId} already entered (nested same-id loops)`);
    }
    this.loops.set(loopId, {
      maxIterations,
      count: 0,
      startTime: Date.now(),
      startStack: new Error().stack
    });
  }

  /**
   * Increment iteration counter for a loop
   */
  incrementIteration(loopId) {
    if (!this.loops.has(loopId)) {
      throw new Error(`Loop ${loopId} not found - did you call enterLoop()?`);
    }
    const loop = this.loops.get(loopId);
    loop.count++;
    this.totalIterations++;
    return loop.count;
  }

  /**
   * Check if loop is within bounds
   */
  checkBounds(loopId) {
    const loop = this.loops.get(loopId);
    if (!loop) return false;
    
    // Check both loop-specific and global bounds
    if (loop.count > loop.maxIterations) return false;
    if (this.totalIterations > this.maxGlobalIterations) return false;
    
    return true;
  }

  /**
   * Exit a loop context
   */
  exitLoop(loopId) {
    const loop = this.loops.get(loopId);
    if (!loop) {
      throw new Error(`Loop ${loopId} not found`);
    }
    const elapsed = Date.now() - loop.startTime;
    const result = {
      loopId,
      iterations: loop.count,
      elapsed,
      opsPerMs: elapsed > 0 ? (loop.count / elapsed).toFixed(2) : "instant"
    };
    this.loops.delete(loopId);
    return result;
  }

  /**
   * Get current state of all active loops
   */
  getStatus() {
    const active = Array.from(this.loops.entries()).map(([id, data]) => ({
      id,
      iterations: data.count,
      maxIterations: data.maxIterations,
      percentUsed: ((data.count / data.maxIterations) * 100).toFixed(1),
      exceedsThreshold: data.count > this.anomalyThreshold
    }));
    return { totalIterations: this.totalIterations, activeLoops: active };
  }
}

// ============================================================================
// COMPONENT B: TimeoutManager (50 lines)
// ============================================================================
/**
 * Manage wall-clock timeout and CPU time quotas.
 * Provides escalation from warning to error with graceful cleanup.
 */
class TimeoutManager {
  constructor(wallClockMs = 5000, cpuQuotaMs = 4000) {
    this.wallClockMs = wallClockMs;
    this.cpuQuotaMs = cpuQuotaMs;
    this.startTime = null;
    this.cpuTime = 0;
    this.startCpuTime = process.cpuUsage ? process.cpuUsage() : null;
    this.state = "pending"; // pending | running | warning | error | aborted
    this.warningThreshold = 0.8; // Warn at 80% timeout
    this.warnings = [];
  }

  /**
   * Start the timer
   */
  startTimer() {
    this.startTime = Date.now();
    this.state = "running";
    if (process.cpuUsage) {
      this.startCpuTime = process.cpuUsage();
    }
  }

  /**
   * Check if still within time budget. Returns false when timeout imminent.
   */
  checkTimeout() {
    if (!this.startTime) return true;
    if (this.state === "aborted" || this.state === "error") return false;

    const elapsed = Date.now() - this.startTime;
    const percentUsed = elapsed / this.wallClockMs;

    // Escalate to warning at threshold
    if (percentUsed >= this.warningThreshold && this.state === "running") {
      this.state = "warning";
      this.warn(`Timeout approaching: ${elapsed}/${this.wallClockMs}ms used`);
    }

    // Hard timeout
    if (elapsed > this.wallClockMs) {
      this.state = "error";
      return false;
    }

    return true;
  }

  /**
   * Record a warning message
   */
  warn(message) {
    const warning = {
      timestamp: Date.now(),
      elapsed: Date.now() - this.startTime,
      message
    };
    this.warnings.push(warning);
  }

  /**
   * Abort execution with reason
   */
  abort(reason) {
    this.state = "aborted";
    return {
      reason,
      elapsed: Date.now() - this.startTime,
      warnings: this.warnings
    };
  }

  /**
   * Get remaining time in milliseconds
   */
  getRemaining() {
    if (!this.startTime) return this.wallClockMs;
    const elapsed = Date.now() - this.startTime;
    return Math.max(0, this.wallClockMs - elapsed);
  }

  /**
   * Get diagnostic report
   */
  report() {
    const elapsed = this.startTime ? Date.now() - this.startTime : 0;
    return {
      state: this.state,
      wallClockMs: this.wallClockMs,
      elapsed,
      percentUsed: ((elapsed / this.wallClockMs) * 100).toFixed(1),
      remaining: this.getRemaining(),
      warnings: this.warnings.length
    };
  }
}

// ============================================================================
// COMPONENT C: StackGuard (45 lines)
// ============================================================================
/**
 * Monitor call stack depth and detect stack overflow risks.
 * Tracks recursive descent and enforces depth limits.
 */
class StackGuard {
  constructor(options = {}) {
    this.maxDepth = options.maxDepth || 10000;
    this.recursionMap = new Map(); // functionName -> count
    this.maxRecursionDepth = options.maxRecursionDepth || 5000;
    this.baseline = new Error().stack.split("\n").length;
  }

  /**
   * Get current call stack depth
   */
  getDepth() {
    try {
      return new Error().stack.split("\n").length - this.baseline;
    } catch {
      return 0;
    }
  }

  /**
   * Check if depth is within safe limits
   */
  checkDepth(maxDepth = this.maxDepth) {
    return this.getDepth() < maxDepth;
  }

  /**
   * Mark entry into recursive function
   */
  markRecursion(functionName) {
    const count = (this.recursionMap.get(functionName) || 0) + 1;
    this.recursionMap.set(functionName, count);
    return count;
  }

  /**
   * Mark exit from recursive function
   */
  unmarkRecursion(functionName) {
    const count = (this.recursionMap.get(functionName) || 1) - 1;
    if (count <= 0) {
      this.recursionMap.delete(functionName);
    } else {
      this.recursionMap.set(functionName, count);
    }
  }

  /**
   * Check if recursion is within safe limits
   */
  checkRecursion(functionName, maxDepth = this.maxRecursionDepth) {
    const count = this.recursionMap.get(functionName) || 0;
    return count < maxDepth;
  }

  /**
   * Get recursion status for all functions
   */
  getRecursionStatus() {
    return Array.from(this.recursionMap.entries()).map(([name, depth]) => ({
      function: name,
      depth,
      maxDepth: this.maxRecursionDepth,
      percentUsed: ((depth / this.maxRecursionDepth) * 100).toFixed(1)
    }));
  }
}

// ============================================================================
// COMPONENT D: CycleDetector (30 lines)
// ============================================================================
/**
 * Detect cycles in dependency graphs using DFS.
 * Used for implicit resolution, module instantiation, type inference.
 */
class CycleDetector {
  constructor() {
    this.edges = new Map(); // node -> Set<dependencies>
    this.visited = new Set();
    this.recStack = new Set();
  }

  /**
   * Add directed edge from -> to
   */
  addEdge(from, to) {
    if (!this.edges.has(from)) {
      this.edges.set(from, new Set());
    }
    this.edges.get(from).add(to);
  }

  /**
   * Detect if graph contains cycles using DFS
   */
  detectCycle() {
    this.visited.clear();
    this.recStack.clear();

    for (const node of this.edges.keys()) {
      if (!this.visited.has(node)) {
        const cycle = this._dfs(node);
        if (cycle) return cycle;
      }
    }
    return null;
  }

  /**
   * Internal DFS for cycle detection
   */
  _dfs(node, path = []) {
    this.visited.add(node);
    this.recStack.add(node);
    path = [...path, node];

    const neighbors = this.edges.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!this.visited.has(neighbor)) {
        const cycle = this._dfs(neighbor, path);
        if (cycle) return cycle;
      } else if (this.recStack.has(neighbor)) {
        // Found cycle
        const cycleStart = path.indexOf(neighbor);
        return path.slice(cycleStart).concat([neighbor]);
      }
    }

    this.recStack.delete(node);
    return null;
  }

  /**
   * Validate that graph is a DAG (no cycles)
   */
  validateDAG() {
    return this.detectCycle() === null;
  }

  /**
   * Get diagnostic info
   */
  getStats() {
    const nodeCount = this.edges.size;
    const edgeCount = Array.from(this.edges.values()).reduce((sum, set) => sum + set.size, 0);
    return { nodes: nodeCount, edges: edgeCount, isDAG: this.validateDAG() };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
  IterationTracker,
  TimeoutManager,
  StackGuard,
  CycleDetector
};

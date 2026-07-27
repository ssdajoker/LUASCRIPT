"use strict";

/**
 * Memory Profiling Integration - Phase D
 * Tracks memory usage during transpilation and optimization
 * 
 * Goals:
 * - Profile memory usage across all phases
 * - Detect memory leaks
 * - Track allocation patterns
 * - Verify <10MB overhead SLO
 * - Generate memory reports
 */

class MemorySnapshot {
  constructor(label = "snapshot") {
    this.label = label;
    this.timestamp = Date.now();
    this.heapUsed = process.memoryUsage().heapUsed;
    this.heapTotal = process.memoryUsage().heapTotal;
    this.external = process.memoryUsage().external;
    this.rss = process.memoryUsage().rss;
  }

  getDiffMB(previous) {
    if (!previous) return null;

    return {
      heapUsedMB: ((this.heapUsed - previous.heapUsed) / (1024 * 1024)).toFixed(2),
      heapTotalMB: ((this.heapTotal - previous.heapTotal) / (1024 * 1024)).toFixed(2),
      externalMB: ((this.external - previous.external) / (1024 * 1024)).toFixed(2),
      rssMB: ((this.rss - previous.rss) / (1024 * 1024)).toFixed(2),
      timeDeltaMs: this.timestamp - previous.timestamp,
    };
  }

  getStats() {
    return {
      label: this.label,
      timestamp: this.timestamp,
      heapUsedMB: (this.heapUsed / (1024 * 1024)).toFixed(2),
      heapTotalMB: (this.heapTotal / (1024 * 1024)).toFixed(2),
      externalMB: (this.external / (1024 * 1024)).toFixed(2),
      rssMB: (this.rss / (1024 * 1024)).toFixed(2),
    };
  }
}

class AllocationTracker {
  constructor(maxTrackedAllocations = 10000) {
    this.allocations = [];
    this.maxTracked = maxTrackedAllocations;
    this.currentSize = 0;
    this.peakSize = 0;
    this.totalAllocations = 0;
    this.totalDeallocations = 0;
  }

  recordAllocation(size, category = "unknown") {
    const alloc = {
      size,
      category,
      timestamp: Date.now(),
      stackTrace: new Error().stack,
    };

    this.allocations.push(alloc);
    this.currentSize += size;
    this.totalAllocations++;

    if (this.currentSize > this.peakSize) {
      this.peakSize = this.currentSize;
    }

    // Keep history bounded
    if (this.allocations.length > this.maxTracked) {
      const removed = this.allocations.shift();
      this.currentSize -= removed.size;
      this.totalDeallocations++;
    }
  }

  getStats() {
    const byCategory = {};
    this.allocations.forEach(alloc => {
      if (!byCategory[alloc.category]) {
        byCategory[alloc.category] = { count: 0, totalBytes: 0 };
      }
      byCategory[alloc.category].count++;
      byCategory[alloc.category].totalBytes += alloc.size;
    });

    return {
      currentSizeMB: (this.currentSize / (1024 * 1024)).toFixed(2),
      peakSizeMB: (this.peakSize / (1024 * 1024)).toFixed(2),
      totalAllocations: this.totalAllocations,
      totalDeallocations: this.totalDeallocations,
      trackedAllocations: this.allocations.length,
      byCategory,
    };
  }

  getLargestAllocations(count = 10) {
    return this.allocations
      .sort((a, b) => b.size - a.size)
      .slice(0, count)
      .map(alloc => ({
        sizeMB: (alloc.size / (1024 * 1024)).toFixed(2),
        category: alloc.category,
        timestamp: new Date(alloc.timestamp).toISOString(),
      }));
  }

  clear() {
    this.allocations = [];
    this.currentSize = 0;
  }
}

class PythonMemoryProfiler {
  constructor(options = {}) {
    this.options = {
      enableProfiling: options.enableProfiling !== false,
      enableAllocationTracking: options.enableAllocationTracking !== false,
      maxMemoryOverheadMB: options.maxMemoryOverheadMB || 10,
      gcIntervalMs: options.gcIntervalMs || 5000,
    };

    this.snapshots = [];
    this.tracker = new AllocationTracker();
    this.phases = {};  // Phase -> array of snapshots
    this.maxMemoryMB = 0;
    this.startMemory = null;
  }

  /**
   * Start profiling a phase
   */
  startPhase(phaseName) {
    if (!this.options.enableProfiling) return;

    if (!this.phases[phaseName]) {
      this.phases[phaseName] = [];
    }

    const snapshot = new MemorySnapshot(`${phaseName}_start`);
    this.phases[phaseName].push(snapshot);

    if (this.startMemory === null) {
      this.startMemory = snapshot;
    }

    return snapshot;
  }

  /**
   * End profiling a phase
   */
  endPhase(phaseName) {
    if (!this.options.enableProfiling) return;

    if (!this.phases[phaseName]) {
      this.phases[phaseName] = [];
    }

    const snapshot = new MemorySnapshot(`${phaseName}_end`);
    this.phases[phaseName].push(snapshot);
    this.snapshots.push(snapshot);

    const heapMB = parseFloat(snapshot.getStats().heapUsedMB);
    if (heapMB > this.maxMemoryMB) {
      this.maxMemoryMB = heapMB;
    }

    return snapshot;
  }

  /**
   * Record an allocation within a phase
   */
  recordAllocation(size, category = "unknown", phase = null) {
    if (!this.options.enableAllocationTracking) return;

    const fullCategory = phase ? `${phase}_${category}` : category;
    this.tracker.recordAllocation(size, fullCategory);
  }

  /**
   * Get memory usage for a specific phase
   */
  getPhaseMemory(phaseName) {
    if (!this.phases[phaseName] || this.phases[phaseName].length < 2) {
      return null;
    }

    const snapshots = this.phases[phaseName];
    const start = snapshots[0];
    const end = snapshots[snapshots.length - 1];

    return {
      phase: phaseName,
      duration: end.timestamp - start.timestamp,
      ...end.getDiffMB(start),
      startStats: start.getStats(),
      endStats: end.getStats(),
    };
  }

  /**
   * Get memory report for all phases
   */
  getFullReport() {
    const phaseReports = {};

    Object.keys(this.phases).forEach(phase => {
      phaseReports[phase] = this.getPhaseMemory(phase);
    });

    const totalDuration = this.snapshots.length > 0 
      ? this.snapshots[this.snapshots.length - 1].timestamp - (this.startMemory?.timestamp || 0)
      : 0;

    return {
      overallStats: {
        totalDurationMs: totalDuration,
        maxMemoryMB: this.maxMemoryMB.toFixed(2),
        maxAllowedMB: this.options.maxMemoryOverheadMB,
        withinSLO: this.maxMemoryMB <= this.options.maxMemoryOverheadMB,
      },
      phases: phaseReports,
      allocations: this.tracker.getStats(),
      snapshots: this.snapshots.map(s => s.getStats()),
    };
  }

  /**
   * Verify memory SLO
   */
  verifyMemorySLO() {
    const report = this.getFullReport();
    const within = report.overallStats.withinSLO;
    const message = within 
      ? `Memory usage within SLO (${report.overallStats.maxMemoryMB}MB / ${report.overallStats.maxAllowedMB}MB)`
      : `Memory SLO exceeded (${report.overallStats.maxMemoryMB}MB > ${report.overallStats.maxAllowedMB}MB)`;

    return {
      passed: within,
      message,
      maxMemoryMB: parseFloat(report.overallStats.maxMemoryMB),
      maxAllowedMB: report.overallStats.maxAllowedMB,
      percentOfLimit: (parseFloat(report.overallStats.maxMemoryMB) / report.overallStats.maxAllowedMB * 100).toFixed(1) + "%",
    };
  }

  /**
   * Detect memory leaks
   */
  detectMemoryLeaks() {
    const leaks = [];
    const phaseNames = Object.keys(this.phases);

    for (let i = 0; i < phaseNames.length - 1; i++) {
      const current = this.getPhaseMemory(phaseNames[i]);
      const next = this.getPhaseMemory(phaseNames[i + 1]);

      if (current && next) {
        // If memory keeps growing between phases, flag as potential leak
        const growthMB = parseFloat(next.endStats.heapUsedMB) - parseFloat(current.endStats.heapUsedMB);
        
        if (growthMB > 1) {  // More than 1MB growth
          leaks.push({
            between: `${phaseNames[i]} -> ${phaseNames[i + 1]}`,
            growthMB: growthMB.toFixed(2),
            severity: growthMB > 5 ? "HIGH" : "MEDIUM",
          });
        }
      }
    }

    return {
      detected: leaks.length > 0,
      leaks,
      recommendation: leaks.length > 0 
        ? "Check memory cleanup in phase transitions"
        : "No memory leaks detected",
    };
  }

  /**
   * Get top memory consumers
   */
  getTopConsumers(count = 10) {
    return this.tracker.getLargestAllocations(count);
  }

  /**
   * Force garbage collection (if available)
   */
  forceGC() {
    if (global.gc) {
      global.gc();
      return { success: true, message: "Garbage collection performed" };
    }
    return { 
      success: false, 
      message: "GC not available. Run with --expose-gc flag",
    };
  }

  /**
   * Reset profiler state
   */
  reset() {
    this.snapshots = [];
    this.tracker.clear();
    this.phases = {};
    this.maxMemoryMB = 0;
    this.startMemory = null;
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const report = this.getFullReport();
    const sloCheck = this.verifyMemorySLO();
    const leakCheck = this.detectMemoryLeaks();

    return {
      memoryUsage: {
        maxMB: sloCheck.maxMemoryMB,
        allowed: sloCheck.maxAllowedMB,
        percent: sloCheck.percentOfLimit,
      },
      sloStatus: sloCheck.passed ? "PASS" : "FAIL",
      leakStatus: leakCheck.detected ? "LEAKS_DETECTED" : "CLEAN",
      phaseCount: Object.keys(this.phases).length,
      recommendations: [
        !sloCheck.passed && "Reduce memory overhead or increase SLO",
        leakCheck.detected && "Investigate memory leaks in phase transitions",
        report.allocations.byCategory && "Review allocation patterns",
      ].filter(Boolean),
    };
  }
}

module.exports = { PythonMemoryProfiler, AllocationTracker, MemorySnapshot };

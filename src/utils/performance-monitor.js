/**
 * PERFORMANCE MONITOR UTILITY
 * 
 * Provides comprehensive performance monitoring and metrics collection
 * for the LUASCRIPT transpilation and optimization pipeline.
 * 
 * @module src/utils/performance-monitor
 * @version 1.0.0
 * @requires perf_hooks
 */

const { performance } = require("perf_hooks");
const fs = require("fs");
const path = require("path");

/**
 * Performance Monitor
 */
class PerformanceMonitor {
  constructor(options = {}) {
    this.metrics = new Map();
    this.timers = new Map();
    this.checkpoints = [];
    this.enabled = options.enabled !== false;
    this.detailed = options.detailed || false;
    this.exportPath = options.exportPath || path.join(process.cwd(), "metrics");
  }

  /**
   * Start a timer
   */
  startTimer(label, metadata = {}) {
    if (!this.enabled) return null;

    this.timers.set(label, {
      start: performance.now(),
      metadata,
      paused: false,
      pausedTime: 0
    });

    return label;
  }

  /**
   * Pause a timer
   */
  pauseTimer(label) {
    if (!this.enabled || !this.timers.has(label)) return null;

    const timer = this.timers.get(label);
    timer.paused = true;
    timer.pauseStart = performance.now();

    return label;
  }

  /**
   * Resume a paused timer
   */
  resumeTimer(label) {
    if (!this.enabled || !this.timers.has(label)) return null;

    const timer = this.timers.get(label);
    if (timer.paused) {
      timer.pausedTime += performance.now() - timer.pauseStart;
      timer.paused = false;
    }

    return label;
  }

  /**
   * End a timer and record metric
   */
  endTimer(label) {
    if (!this.enabled || !this.timers.has(label)) return null;

    const timer = this.timers.get(label);
    const duration = performance.now() - timer.start - timer.pausedTime;

    this.recordMetric(label, duration, timer.metadata);
    this.timers.delete(label);

    return duration;
  }

  /**
   * Record a metric directly
   */
  recordMetric(label, value, metadata = {}) {
    if (!this.enabled) return;

    if (!this.metrics.has(label)) {
      this.metrics.set(label, {
        values: [],
        metadata: metadata
      });
    }

    const metric = this.metrics.get(label);
    metric.values.push({
      value,
      timestamp: new Date().toISOString(),
      metadata
    });
  }

  /**
   * Create a checkpoint
   */
  checkpoint(label, metadata = {}) {
    this.checkpoints.push({
      label,
      timestamp: performance.now(),
      time: new Date().toISOString(),
      metadata,
      memory: process.memoryUsage()
    });

    return this.checkpoints.length;
  }

  /**
   * Get metrics for a label
   */
  getMetrics(label) {
    if (!this.metrics.has(label)) {
      return null;
    }

    const metric = this.metrics.get(label);
    const values = metric.values.map(v => v.value);

    return {
      label,
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      sum: values.reduce((a, b) => a + b, 0),
      p50: this._percentile(values, 50),
      p95: this._percentile(values, 95),
      p99: this._percentile(values, 99),
      stdDev: this._standardDeviation(values),
      metadata: metric.metadata
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const report = {};
    for (const label of this.metrics.keys()) {
      report[label] = this.getMetrics(label);
    }
    return report;
  }

  /**
   * Get comprehensive report
   */
  getReport() {
    return {
      generated: new Date().toISOString(),
      metrics: this.getAllMetrics(),
      checkpoints: this.checkpoints,
      summary: this._generateSummary()
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics.clear();
    this.timers.clear();
    this.checkpoints = [];
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(filename = "metrics.json") {
    try {
      if (!fs.existsSync(this.exportPath)) {
        fs.mkdirSync(this.exportPath, { recursive: true });
      }

      const filepath = path.join(this.exportPath, filename);
      const report = this.getReport();

      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

      return { success: true, filepath, metrics: this.metrics.size };
    } catch (e) {
      console.error("Failed to export metrics:", e.message);
      return { success: false, error: e.message };
    }
  }

  /**
   * Export as CSV for analysis
   */
  exportCSV(filename = "metrics.csv") {
    try {
      if (!fs.existsSync(this.exportPath)) {
        fs.mkdirSync(this.exportPath, { recursive: true });
      }

      const filepath = path.join(this.exportPath, filename);
      let csv = "Label,Count,Min,Max,Average,StdDev,P50,P95,P99\n";

      for (const label of this.metrics.keys()) {
        const metrics = this.getMetrics(label);
        csv += `${label},${metrics.count},${metrics.min.toFixed(2)},${metrics.max.toFixed(2)},${metrics.avg.toFixed(2)},${metrics.stdDev.toFixed(2)},${metrics.p50.toFixed(2)},${metrics.p95.toFixed(2)},${metrics.p99.toFixed(2)}\n`;
      }

      fs.writeFileSync(filepath, csv);

      return { success: true, filepath };
    } catch (e) {
      console.error("Failed to export CSV:", e.message);
      return { success: false, error: e.message };
    }
  }

  /**
   * Private: Calculate percentile
   */
  _percentile(values, p) {
    if (values.length === 0) return 0;

    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;

    return sorted[Math.max(0, index)];
  }

  /**
   * Private: Calculate standard deviation
   */
  _standardDeviation(values) {
    if (values.length === 0) return 0;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Private: Generate summary
   */
  _generateSummary() {
    const summary = {
      totalMetrics: this.metrics.size,
      totalCheckpoints: this.checkpoints.length,
      totalRecordings: Array.from(this.metrics.values()).reduce((sum, m) => sum + m.values.length, 0),
      startTime: this.checkpoints.length > 0 ? this.checkpoints[0].time : null,
      endTime: this.checkpoints.length > 0 ? this.checkpoints[this.checkpoints.length - 1].time : null
    };

    // Calculate slowest metrics
    const allMetrics = this.getAllMetrics();
    const sorted = Object.entries(allMetrics)
      .sort((a, b) => b[1].avg - a[1].avg)
      .slice(0, 5);

    summary.slowestOperations = Object.fromEntries(sorted);

    return summary;
  }
}

/**
 * Health Check System
 */
class HealthChecker {
  constructor() {
    this.checks = new Map();
    this.status = "unknown";
    this.lastCheck = null;
  }

  /**
   * Register a health check
   */
  registerCheck(name, checkFn, options = {}) {
    this.checks.set(name, {
      fn: checkFn,
      timeout: options.timeout || 5000,
      critical: options.critical || false
    });
  }

  /**
   * Run all health checks
   */
  async runChecks() {
    const results = {};
    let allHealthy = true;
    let hasCriticalFailure = false;

    for (const [name, check] of this.checks) {
      try {
        const result = await Promise.race([
          Promise.resolve(check.fn()),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), check.timeout)
          )
        ]);

        results[name] = {
          healthy: result === true || (result && result.healthy !== false),
          status: result === true ? "healthy" : result?.status || "unknown"
        };

        if (!results[name].healthy) {
          allHealthy = false;
          if (check.critical) {
            hasCriticalFailure = true;
          }
        }
      } catch (e) {
        results[name] = {
          healthy: false,
          status: "error",
          error: e.message
        };
        allHealthy = false;
        if (check.critical) {
          hasCriticalFailure = true;
        }
      }
    }

    this.status = hasCriticalFailure ? "critical" : allHealthy ? "healthy" : "degraded";
    this.lastCheck = {
      timestamp: new Date().toISOString(),
      status: this.status,
      results
    };

    return this.lastCheck;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      status: this.status,
      lastCheck: this.lastCheck,
      checks: this.checks.size
    };
  }
}

module.exports = {
  PerformanceMonitor,
  HealthChecker
};

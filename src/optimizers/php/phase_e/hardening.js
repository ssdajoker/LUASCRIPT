/**
 * PHP Phase E: Polish & Hardening - Error Handler & Performance Monitor
 * Production-ready error handling and monitoring for PHP optimizers
 * Version: 1.0.0
 */

class PHPErrorHandler {
  constructor() {
    this.logs = [];
    this.errorCount = 0;
    this.warningCount = 0;
  }

  handle(error, context = {}) {
    const errorInfo = {
      type: error.name,
      message: error.message,
      timestamp: new Date().toISOString(),
      context,
      stack: error.stack
    };

    this.logs.push(errorInfo);
    this.errorCount++;

    return {
      recovered: true,
      strategy: "graceful_degradation",
      details: errorInfo
    };
  }

  warn(message, severity = "medium") {
    const warning = {
      message,
      severity,
      timestamp: new Date().toISOString()
    };

    this.logs.push(warning);
    this.warningCount++;

    return warning;
  }

  getLogs() {
    return this.logs;
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

class PHPHealthChecker {
  constructor() {
    this.checks = new Map();
    this.status = "healthy";
    this.lastCheck = null;
  }

  registerCheck(name, checkFn) {
    this.checks.set(name, checkFn);
  }

  async runChecks() {
    const results = {};

    for (const [name, checkFn] of this.checks) {
      try {
        results[name] = await Promise.race([
          checkFn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Check timeout")), 5000)
          )
        ]);
      } catch (error) {
        results[name] = { status: "failed", error: error.message };
      }
    }

    this.lastCheck = new Date();
    this.status = Object.values(results).every(r => r.status !== "failed") ? "healthy" : "degraded";

    return results;
  }

  getStatus() {
    return {
      status: this.status,
      lastCheck: this.lastCheck,
      checkCount: this.checks.size
    };
  }
}

class PHPPerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.timers = new Map();
    this.checkpoints = [];
  }

  startTimer(name) {
    this.timers.set(name, performance.now());
  }

  endTimer(name) {
    if (this.timers.has(name)) {
      const elapsed = performance.now() - this.timers.get(name);
      
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }

      this.metrics.get(name).push(elapsed);
      this.timers.delete(name);

      return elapsed;
    }

    return null;
  }

  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name).push(value);
  }

  checkpoint(name) {
    this.checkpoints.push({
      name,
      timestamp: new Date().toISOString(),
      metrics: Object.fromEntries(this.metrics)
    });
  }

  getMetrics(name) {
    if (!this.metrics.has(name)) return null;

    const values = this.metrics.get(name);
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  exportMetrics() {
    const result = {};

    for (const [name, _] of this.metrics) {
      result[name] = this.getMetrics(name);
    }

    return result;
  }
}

module.exports = {
  PHPErrorHandler,
  PHPHealthChecker,
  PHPPerformanceMonitor
};

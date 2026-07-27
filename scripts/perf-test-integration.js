#!/usr/bin/env node
/**
 * Test Harness Integration for Performance SLO Measurement
 * 
 * Hooks into Jest/Mocha test runs to collect performance metrics.
 * Measures transpilation time, IR parsing, and Lua emission.
 * 
 * Usage:
 *   // In test setup
 *   const { setupPerfCollection } = require('./perf-test-integration');
 *   setupPerfCollection();
 *   
 *   // In tests
 *   const { measurePerf } = require('./perf-test-integration');
 *   const result = await measurePerf('transpile-simple', () => {
 *     return transpiler.transpile('let x = 5;');
 *   });
 */

const fs = require('fs');
const path = require('path');

class TestHarnessIntegration {
  constructor() {
    this.measurements = {};
    this.enabled = process.env.PERF_COLLECT === 'true';
    this.verbose = process.env.PERF_VERBOSE === 'true';
  }

  /**
   * Measure execution time of an async or sync function
   * @param {string} label - SLO label (e.g., 'transpile-simple')
   * @param {Function} fn - Function to measure (can be async)
   * @param {object} metadata - Additional metadata
   * @returns {Promise<any>} - Result of fn()
   */
  async measurePerf(label, fn, metadata = {}) {
    if (!this.enabled) {
      return fn();
    }

    const isAsync = fn.constructor.name === 'AsyncFunction';
    const start = process.hrtime.bigint();
    
    let result;
    try {
      result = isAsync ? await fn() : fn();
    } catch (err) {
      this.recordFailure(label, err);
      throw err;
    }

    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    this.recordMeasurement(label, durationMs, metadata);
    return result;
  }

  /**
   * Record a measurement (used when timing is already available)
   * @param {string} label - SLO label
   * @param {number} durationMs - Duration in milliseconds
   * @param {object} metadata - Additional metadata
   */
  recordMeasurement(label, durationMs, metadata = {}) {
    if (!this.measurements[label]) {
      this.measurements[label] = [];
    }

    this.measurements[label].push({
      durationMs: parseFloat(durationMs.toFixed(4)),
      timestamp: Date.now(),
      ...metadata
    });

    if (this.verbose) {
      console.log(`[PERF] ${label}: ${durationMs.toFixed(3)}ms`);
    }
  }

  /**
   * Record a measurement failure
   * @param {string} label - SLO label
   * @param {Error} error - Error that occurred
   */
  recordFailure(label, error) {
    if (!this.measurements[label]) {
      this.measurements[label] = [];
    }

    this.measurements[label].push({
      error: error.message,
      timestamp: Date.now(),
      status: 'FAILED'
    });

    if (this.verbose) {
      console.error(`[PERF] ${label}: FAILED - ${error.message}`);
    }
  }

  /**
   * Get statistics for a label
   * @param {string} label - SLO label
   * @returns {object|null} - Stats object or null if no data
   */
  getStats(label) {
    const measurements = (this.measurements[label] || [])
      .filter(m => typeof m.durationMs === 'number');

    if (measurements.length === 0) return null;

    const times = measurements.map(m => m.durationMs).sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);

    return {
      count: times.length,
      min: times[0],
      max: times[times.length - 1],
      avg: sum / times.length,
      median: times[Math.floor(times.length / 2)],
      p95: times[Math.floor(times.length * 0.95)],
      p99: times[Math.floor(times.length * 0.99)],
      sum
    };
  }

  /**
   * Save measurements to file
   * @param {string} filepath - Where to save
   */
  saveMeasurements(filepath) {
    const data = {
      timestamp: new Date().toISOString(),
      measurements: this.measurements,
      stats: this._computeAllStats()
    };

    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`✅ Performance measurements saved to ${filepath}`);
  }

  /**
   * Compute all stats
   */
  _computeAllStats() {
    const stats = {};
    for (const label of Object.keys(this.measurements)) {
      stats[label] = this.getStats(label);
    }
    return stats;
  }

  /**
   * Get summary report
   */
  getSummary() {
    const report = {
      timestamp: new Date().toISOString(),
      totalMeasurements: Object.values(this.measurements)
        .reduce((sum, arr) => sum + arr.length, 0),
      labels: Object.keys(this.measurements),
      stats: this._computeAllStats()
    };

    return report;
  }

  /**
   * Print summary to console
   */
  printSummary() {
    const summary = this.getSummary();

    console.log('\n📊 Performance Measurement Summary');
    console.log('===================================\n');

    for (const [label, stats] of Object.entries(summary.stats)) {
      if (!stats) {
        console.log(`⚠️  ${label}: No data collected`);
        continue;
      }

      console.log(`${label}:`);
      console.log(`  Samples: ${stats.count}`);
      console.log(`  Avg:     ${stats.avg.toFixed(3)}ms`);
      console.log(`  Median:  ${stats.median.toFixed(3)}ms`);
      console.log(`  P95:     ${stats.p95.toFixed(3)}ms`);
      console.log(`  P99:     ${stats.p99.toFixed(3)}ms`);
      console.log(`  Range:   ${stats.min.toFixed(3)}ms - ${stats.max.toFixed(3)}ms`);
      console.log();
    }
  }
}

// ============================================================================
// JEST REPORTER PLUGIN
// ============================================================================

class PerfTestReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options;
    this.integration = global.__perfIntegration;
  }

  onTestResult(test, testResult) {
    if (this.integration && this.integration.verbose) {
      const fileName = test.path.replace(process.cwd(), '');
      console.log(`\n[PERF] Test suite: ${fileName}`);
      
      const stats = this.integration.getStats('test-suite');
      if (stats) {
        console.log(`  Duration: ${stats.avg.toFixed(3)}ms avg`);
      }
    }
  }

  onRunComplete() {
    if (this.integration) {
      this.integration.printSummary();
      
      // Auto-save if configured
      if (process.env.PERF_SAVE_FILE) {
        this.integration.saveMeasurements(process.env.PERF_SAVE_FILE);
      }
    }
  }
}

// ============================================================================
// SETUP & EXPORTS
// ============================================================================

let globalIntegration = null;

function setupPerfCollection() {
  if (!globalIntegration) {
    globalIntegration = new TestHarnessIntegration();
    global.__perfIntegration = globalIntegration;

    if (process.env.PERF_COLLECT === 'true') {
      console.log('✅ Performance measurement enabled');
    }
  }
  return globalIntegration;
}

function getIntegration() {
  return globalIntegration || setupPerfCollection();
}

async function measurePerf(label, fn, metadata) {
  return getIntegration().measurePerf(label, fn, metadata);
}

// Export for direct usage
module.exports = {
  TestHarnessIntegration,
  PerfTestReporter,
  setupPerfCollection,
  getIntegration,
  measurePerf
};

// CLI usage
if (require.main === module) {
  const integration = setupPerfCollection();
  
  // Example measurements
  integration.recordMeasurement('transpile-simple', 0.84);
  integration.recordMeasurement('transpile-function', 1.18);
  integration.recordMeasurement('transpile-objects', 1.22);
  integration.recordMeasurement('ir-parse-simple', 0.24);
  
  integration.printSummary();
  integration.saveMeasurements('artifacts/perf-measurements.json');
}

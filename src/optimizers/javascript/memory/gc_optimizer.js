/**
 * PHASE E - Task E2.2: GC Optimization & Mini Gates
 * 
 * Provides GC-aware memory monitoring and high-risk mini gates for
 * deterministic transpilation behavior under memory pressure.
 * 
 * Features:
 * - Memory sampling with heap usage thresholds
 * - Optional GC triggering when thresholds exceeded
 * - Mini gates for high-risk operations
 * - Stats tracking for GC pressure and gate activations
 * 
 * @module src/optimizers/javascript/memory/gc_optimizer
 */

const v8 = require('v8');

class GCOptimizer {
  /**
   * @param {Object} options - Configuration options
   * @param {number} options.heapUsageThreshold - Trigger GC if heap used > threshold (default: 0.8)
   * @param {number} options.rssLimitBytes - Trigger gate if RSS > limit (default: 512MB)
   * @param {number} options.sampleIntervalMs - Minimum interval between samples (default: 50ms)
   * @param {Function} options.memoryProvider - Custom memory provider
   * @param {Function} options.gcProvider - Custom GC trigger
   */
  constructor(options = {}) {
    this.heapUsageThreshold = options.heapUsageThreshold || 0.8;
    this.rssLimitBytes = options.rssLimitBytes || 512 * 1024 * 1024;
    this.sampleIntervalMs = options.sampleIntervalMs || 50;
    this.memoryProvider = options.memoryProvider || (() => process.memoryUsage());
    this.gcProvider = options.gcProvider || (() => (global.gc ? global.gc() : null));

    this.stats = {
      samples: 0,
      gcTriggered: 0,
      gatesTriggered: 0,
      lastHeapUsagePct: 0,
      lastRssBytes: 0,
      lastSampleAt: 0,
      gateHits: {}
    };

    this.gates = new Map();
    this._registerDefaultGates();
  }

  /**
   * Collect a memory sample (rate-limited)
   * @returns {Object} Sample data
   */
  sample() {
    const now = Date.now();
    if (now - this.stats.lastSampleAt < this.sampleIntervalMs) {
      return this._snapshot();
    }

    const usage = this.memoryProvider();
    const heapStats = v8.getHeapStatistics();

    const heapUsed = usage.heapUsed || 0;
    const heapTotal = usage.heapTotal || heapStats.total_heap_size || 1;
    const heapUsagePct = heapTotal > 0 ? heapUsed / heapTotal : 0;
    const rss = usage.rss || 0;

    this.stats.samples++;
    this.stats.lastHeapUsagePct = heapUsagePct;
    this.stats.lastRssBytes = rss;
    this.stats.lastSampleAt = now;

    return {
      heapUsed,
      heapTotal,
      heapUsagePct,
      rss,
      timestamp: now
    };
  }

  /**
   * Decide whether to trigger GC based on current sample
   * @param {Object} sample - Memory sample
   * @returns {boolean}
   */
  shouldTriggerGC(sample) {
    return sample.heapUsagePct >= this.heapUsageThreshold;
  }

  /**
   * Trigger GC if needed and return snapshot
   * @returns {Object}
   */
  optimize() {
    const sample = this.sample();
    if (this.shouldTriggerGC(sample)) {
      this.gcProvider();
      this.stats.gcTriggered++;
    }

    return this._snapshot();
  }

  /**
   * Register a mini gate
   * @param {string} name - Gate name
   * @param {Function} predicate - Gate predicate
   */
  registerGate(name, predicate) {
    this.gates.set(name, predicate);
    if (!this.stats.gateHits[name]) {
      this.stats.gateHits[name] = 0;
    }
  }

  /**
   * Evaluate all gates; returns array of triggered gates
   * @param {Object} sample - Memory sample
   * @returns {string[]}
   */
  evaluateGates(sample = this.sample()) {
    const triggered = [];

    for (const [name, predicate] of this.gates.entries()) {
      const hit = Boolean(predicate(sample, this._snapshot()));
      if (hit) {
        triggered.push(name);
        this.stats.gatesTriggered++;
        this.stats.gateHits[name] = (this.stats.gateHits[name] || 0) + 1;
      }
    }

    return triggered;
  }

  /**
   * Get current stats
   * @returns {Object}
   */
  getStats() {
    return {
      ...this.stats,
      gateHits: { ...this.stats.gateHits }
    };
  }

  _snapshot() {
    return {
      heapUsagePct: this.stats.lastHeapUsagePct,
      rssBytes: this.stats.lastRssBytes,
      samples: this.stats.samples,
      gcTriggered: this.stats.gcTriggered
    };
  }

  _registerDefaultGates() {
    this.registerGate('heapUsageHigh', (sample) => sample.heapUsagePct >= this.heapUsageThreshold);
    this.registerGate('rssHigh', (sample) => sample.rss >= this.rssLimitBytes);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GCOptimizer };
}

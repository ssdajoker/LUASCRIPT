"use strict";

/**
 * Lightweight Object Pool Manager wrapper for Phase D verification.
 * Provides a minimal API expected by tests/run_phase_verification.js.
 */
class ObjectPoolManager {
  constructor({ maxPoolSize = 100 } = {}) {
    this.maxPoolSize = maxPoolSize;
    this.pool = [];
    this.acquisitions = 0;
    this.releases = 0;
  }

  acquire() {
    this.acquisitions++;
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return {};
  }

  release(obj) {
    if (!obj) return;
    this.releases++;
    if (this.pool.length < this.maxPoolSize) {
      this.pool.push(obj);
    }
  }

  getStats() {
    return {
      poolSize: this.pool.length,
      maxPoolSize: this.maxPoolSize,
      acquisitions: this.acquisitions,
      releases: this.releases,
    };
  }
}

module.exports = { ObjectPoolManager };

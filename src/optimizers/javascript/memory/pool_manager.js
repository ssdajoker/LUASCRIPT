/**
 * PHASE E - Task E2.1: Memory Pool Manager
 * 
 * Provides pooled object reuse to reduce allocation pressure during transpilation:
 * - IR node pooling
 * - Builder/validator reuse
 * - Configurable per-type pool sizing
 * 
 * Performance Targets:
 * - Reduce allocation churn by 30%+
 * - Consistent pool hit rate on hot paths
 * - O(1) acquire/release operations
 * 
 * @module src/optimizers/javascript/memory/pool_manager
 */

/**
 * Simple object pool implementation
 */
class ObjectPool {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.items = [];
  }

  acquire(factory) {
    if (this.items.length > 0) {
      return this.items.pop();
    }
    return factory();
  }

  release(item) {
    if (this.items.length < this.maxSize) {
      this.items.push(item);
    }
  }

  size() {
    return this.items.length;
  }

  clear() {
    this.items.length = 0;
  }
}

/**
 * Memory Pool Manager
 */
class MemoryPoolManager {
  /**
   * @param {Object} options - Configuration options
   * @param {number} options.defaultMaxPerType - Default pool size per type (default: 256)
   * @param {Object} options.maxPerType - Per-type pool size overrides
   */
  constructor(options = {}) {
    this.defaultMaxPerType = options.defaultMaxPerType || 256;
    this.maxPerType = options.maxPerType || {};
    this.pools = new Map();

    this.stats = {
      acquired: 0,
      released: 0,
      created: 0,
      reused: 0,
      pools: {}
    };
  }

  /**
   * Acquire an object from a pool
   * @param {string} type - Pool type
   * @param {Function} factory - Factory to create new objects
   * @param {Function} [reset] - Optional reset function for reused objects
   * @returns {Object}
   */
  acquire(type, factory, reset) {
    const pool = this._getPool(type);
    const beforeSize = pool.size();
    const item = pool.acquire(factory);

    this.stats.acquired++;

    if (beforeSize > pool.size()) {
      this.stats.reused++;
      if (typeof reset === "function") {
        reset(item);
      }
    } else {
      this.stats.created++;
    }

    return item;
  }

  /**
   * Release an object back to its pool
   * @param {string} type - Pool type
   * @param {Object} item - Object to release
   * @param {Function} [reset] - Optional reset function before pooling
   */
  release(type, item, reset) {
    const pool = this._getPool(type);

    if (typeof reset === "function") {
      reset(item);
    }

    pool.release(item);
    this.stats.released++;
  }

  /**
   * Warm a pool with pre-allocated objects
   * @param {string} type - Pool type
   * @param {number} count - Number of items to pre-allocate
   * @param {Function} factory - Factory to create new objects
   */
  warmPool(type, count, factory) {
    const pool = this._getPool(type);
    const target = Math.min(count, pool.maxSize - pool.size());

    for (let i = 0; i < target; i++) {
      pool.release(factory());
      this.stats.created++;
    }
  }

  /**
   * Get pool size for a type
   * @param {string} type - Pool type
   * @returns {number}
   */
  getPoolSize(type) {
    return this._getPool(type).size();
  }

  /**
   * Clear all pools
   */
  clear() {
    for (const pool of this.pools.values()) {
      pool.clear();
    }

    Object.keys(this.stats).forEach(key => {
      if (typeof this.stats[key] === "number") {
        this.stats[key] = 0;
      }
    });

    this.stats.pools = {};
  }

  /**
   * Get statistics
   * @returns {Object}
   */
  getStats() {
    const poolStats = {};
    for (const [type, pool] of this.pools.entries()) {
      poolStats[type] = {
        size: pool.size(),
        maxSize: pool.maxSize
      };
    }

    return {
      ...this.stats,
      pools: poolStats
    };
  }

  _getPool(type) {
    if (!this.pools.has(type)) {
      const maxSize = this.maxPerType[type] || this.defaultMaxPerType;
      this.pools.set(type, new ObjectPool(maxSize));
    }

    return this.pools.get(type);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MemoryPoolManager };
}

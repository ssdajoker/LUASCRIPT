/**
 * PHASE E - Task E1.1: Multi-Level Caching Architecture
 * 
 * Implements a 3-level cache hierarchy for JavaScript transpilation optimization:
 * - L1 Cache: Hot path, most recently used items (unlimited size, TTL-based)
 * - L2 Cache: Medium frequency access (1000 items, LRU eviction)
 * - L3 Cache: Cold path, long-lived items (5000 items, disk-like behavior)
 * 
 * Performance Targets:
 * - L1 hit latency: <1ms
 * - L2 hit latency: <5ms
 * - L3 hit latency: <20ms
 * - Cache hit rate: >80% on repeat transpilations
 * 
 * @example
 * const cache = new CacheManager();
 * cache.set('fn_main', compiledAST, 1); // L1 (hot)
 * const result = cache.get('fn_main');
 * 
 * @module src/optimizers/javascript/speed/cache_manager
 */

/**
 * Simple LRU Cache implementation for cold storage
 * @class LRUCache
 */
class LRUCache {
  /**
   * Creates an LRU cache with maximum capacity
   * @param {number} maxSize - Maximum number of items to store
   */
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.accessOrder = [];
  }

  /**
   * Get item from LRU cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or undefined
   */
  get(key) {
    if (!this.cache.has(key)) return undefined;
    
    // Move to end (most recently used)
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
    
    return this.cache.get(key);
  }

  /**
   * Set item in LRU cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  set(key, value) {
    if (this.cache.has(key)) {
      // Update existing, move to end
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.cache.set(key, value);
      this.accessOrder.push(key);
    } else {
      // Add new
      if (this.cache.size >= this.maxSize) {
        // Evict oldest
        const oldest = this.accessOrder.shift();
        this.cache.delete(oldest);
      }
      this.cache.set(key, value);
      this.accessOrder.push(key);
    }
  }

  /**
   * Get cache size
   * @returns {number} Number of items in cache
   */
  size() {
    return this.cache.size;
  }

  /**
   * Clear all items
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }
}

/**
 * Multi-level cache with automatic promotion and demotion
 * @class CacheManager
 */
class CacheManager {
  /**
   * Creates a 3-level cache hierarchy
   * @param {Object} options - Configuration options
   * @param {number} options.l1MaxSize - L1 cache max items (default: 100)
   * @param {number} options.l2MaxSize - L2 cache max items (default: 1000)
   * @param {number} options.l3MaxSize - L3 cache max items (default: 5000)
   * @param {number} options.l1TTL - L1 item TTL in ms (default: 60000)
   */
  constructor(options = {}) {
    this.l1Cache = new Map();
    this.l2Cache = new Map();
    this.l3Cache = new LRUCache(options.l3MaxSize || 5000);
    
    this.l1MaxSize = options.l1MaxSize || 100;
    this.l2MaxSize = options.l2MaxSize || 1000;
    this.l1TTL = options.l1TTL || 60000; // 60 second TTL
    
    // Statistics
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      l1Misses: 0,
      l2Misses: 0,
      l3Misses: 0,
      evictions: 0,
      totalGets: 0,
      totalSets: 0,
      l1Promotions: 0,
      l2Promotions: 0
    };
    
    // Cleanup L1 TTL items periodically
    this.cleanupInterval = setInterval(() => this._cleanupExpiredL1(), 5000);
  }

  /**
   * Get value from cache, checking levels 1->2->3
   * Promotes hit values up the cache hierarchy
   * 
   * @param {string} key - Cache key
   * @returns {any} Cached value or undefined
   * @performance <1ms for L1 hit, <5ms for L2, <20ms for L3
   */
  get(key) {
    this.stats.totalGets++;
    
    // Check L1
    if (this.l1Cache.has(key)) {
      const item = this.l1Cache.get(key);
      if (!item.expired) {
        this.stats.l1Hits++;
        return item.value;
      }
    }
    
    // Check L2
    if (this.l2Cache.has(key)) {
      const value = this.l2Cache.get(key);
      this.stats.l2Hits++;
      // Promote to L1
      this._promoteToL1(key, value);
      this.stats.l1Promotions++;
      return value;
    }
    
    // Check L3
    const l3Value = this.l3Cache.get(key);
    if (l3Value !== undefined) {
      this.stats.l3Hits++;
      // Promote to L1
      this._promoteToL1(key, l3Value);
      this.stats.l1Promotions++;
      return l3Value;
    }
    
    // Overall miss
    this.stats.l1Misses++;
    return undefined;
  }

  /**
   * Set value in cache at specified level
   * 
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} level - Cache level (1, 2, or 3)
   * @returns {void}
   */
  set(key, value, level = 1) {
    this.stats.totalSets++;
    
    if (level === 1) {
      this._setL1(key, value);
    } else if (level === 2) {
      this._setL2(key, value);
    } else if (level === 3) {
      this._setL3(key, value);
    } else {
      throw new Error(`Invalid cache level: ${level}. Must be 1, 2, or 3.`);
    }
  }

  /**
   * Set in L1 cache with TTL
   * @private
   */
  _setL1(key, value) {
    // Evict oldest if at capacity
    if (this.l1Cache.size >= this.l1MaxSize && !this.l1Cache.has(key)) {
      const firstKey = this.l1Cache.keys().next().value;
      const firstValue = this.l1Cache.get(firstKey);
      
      // Demote to L2 if not expired
      if (!firstValue.expired) {
        this.l2Cache.set(firstKey, firstValue.value);
      }
      
      this.l1Cache.delete(firstKey);
      this.stats.evictions++;
    }
    
    this.l1Cache.set(key, {
      value,
      timestamp: Date.now(),
      expired: false
    });
  }

  /**
   * Set in L2 cache
   * @private
   */
  _setL2(key, value) {
    // Evict oldest if at capacity
    if (this.l2Cache.size >= this.l2MaxSize && !this.l2Cache.has(key)) {
      const firstKey = this.l2Cache.keys().next().value;
      const firstValue = this.l2Cache.get(firstKey);
      
      // Demote to L3
      this.l3Cache.set(firstKey, firstValue);
      this.l2Cache.delete(firstKey);
      this.stats.evictions++;
    }
    
    this.l2Cache.set(key, value);
  }

  /**
   * Set in L3 cache
   * @private
   */
  _setL3(key, value) {
    this.l3Cache.set(key, value);
  }

  /**
   * Promote value from lower level to L1
   * @private
   */
  _promoteToL1(key, value) {
    // Remove from lower levels
    this.l2Cache.delete(key);
    // Note: L3 promotion is via get(), so we don't delete
    
    // Set in L1
    this._setL1(key, value);
  }

  /**
   * Clean up expired L1 items
   * @private
   */
  _cleanupExpiredL1() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.l1Cache.entries()) {
      if (now - item.timestamp > this.l1TTL) {
        item.expired = true;
        cleaned++;
        
        // Optionally remove from cache
        if (cleaned > 10) { // Don't clean too aggressively
          break;
        }
      }
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Statistics object with hit rates and metrics
   */
  getStats() {
    const totalHits = this.stats.l1Hits + this.stats.l2Hits + this.stats.l3Hits;
    const totalMisses = this.stats.l1Misses + this.stats.l2Misses + this.stats.l3Misses;
    const totalLookups = totalHits + totalMisses;
    
    return {
      ...this.stats,
      l1Size: this.l1Cache.size,
      l2Size: this.l2Cache.size,
      l3Size: this.l3Cache.size(),
      hitRate: totalLookups > 0 ? (totalHits / totalLookups * 100).toFixed(2) + '%' : '0%',
      l1HitRate: this.stats.totalGets > 0 ? (this.stats.l1Hits / this.stats.totalGets * 100).toFixed(2) + '%' : '0%',
      totalLookups,
      totalHits,
      totalMisses
    };
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.l1Cache.clear();
    this.l2Cache.clear();
    this.l3Cache.clear();
  }

  /**
   * Destroy cache and cleanup intervals
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.clear();
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      l1Misses: 0,
      l2Misses: 0,
      l3Misses: 0,
      evictions: 0,
      totalGets: 0,
      totalSets: 0,
      l1Promotions: 0,
      l2Promotions: 0
    };
  }
}

// Export for use in Node.js and browsers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CacheManager, LRUCache };
}

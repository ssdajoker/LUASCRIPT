"use strict";

/**
 * Python Pool Manager - Phase D Memory & Performance
 * Manages object pooling for Python transpilation to reduce GC pressure
 * 
 * Goals:
 * - Reuse frequently allocated objects (strings, lists, dicts)
 * - Reduce GC overhead
 * - Track object lifetimes
 * - Optimize memory allocation patterns
 * - Verify <10MB pool overhead
 */

class PooledObject {
  constructor(type, value = null) {
    this.type = type;           // 'string', 'list', 'dict', 'tuple', 'set', 'object'
    this.value = value;
    this.allocated = Date.now();
    this.accessed = Date.now();
    this.references = 0;
    this.lifetime = null;       // Duration object has been pooled
  }

  touch() {
    this.accessed = Date.now();
  }

  addReference() {
    this.references++;
  }

  removeReference() {
    this.references = Math.max(0, this.references - 1);
  }

  isIdle(timeoutMs = 5000) {
    return (Date.now() - this.accessed) > timeoutMs && this.references === 0;
  }

  getStats() {
    return {
      type: this.type,
      allocated: this.allocated,
      accessed: this.accessed,
      references: this.references,
      idleTimeMs: Date.now() - this.accessed,
      lifetime: this.lifetime,
    };
  }
}

class ObjectPool {
  constructor(type, initialCapacity = 100) {
    this.type = type;
    this.capacity = initialCapacity;
    this.available = [];
    this.inUse = new Set();
    this.stats = {
      allocations: 0,
      deallocations: 0,
      reuses: 0,
      evictions: 0,
    };
  }

  acquire(value = null) {
    let obj;
    
    if (this.available.length > 0) {
      obj = this.available.pop();
      obj.value = value;
      obj.references = 1;
      obj.accessed = Date.now();
      this.stats.reuses++;
    } else {
      obj = new PooledObject(this.type, value);
      this.stats.allocations++;
    }
    
    this.inUse.add(obj);
    return obj;
  }

  release(obj) {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj);
      
      if (this.available.length < this.capacity) {
        obj.value = null;
        obj.references = 0;
        obj.lifetime = Date.now() - obj.allocated;
        this.available.push(obj);
      } else {
        this.stats.evictions++;
      }
      
      this.stats.deallocations++;
    }
  }

  evictIdle(timeoutMs = 5000) {
    const idleObjects = this.available.filter(obj => obj.isIdle(timeoutMs));
    this.available = this.available.filter(obj => !obj.isIdle(timeoutMs));
    this.stats.evictions += idleObjects.length;
    return idleObjects.length;
  }

  getStats() {
    return {
      type: this.type,
      capacity: this.capacity,
      available: this.available.length,
      inUse: this.inUse.size,
      utilization: (this.inUse.size / this.capacity * 100).toFixed(1) + "%",
      stats: this.stats,
    };
  }

  clear() {
    this.available = [];
    this.inUse.clear();
  }

  getEstimatedMemoryBytes() {
    // Estimate memory usage per object type (rough estimates)
    const typeSize = {
      "string": 50,      // 40 bytes overhead + avg content
      "list": 56,        // List object overhead
      "dict": 240,       // Dict object overhead
      "tuple": 40,       // Tuple object overhead
      "set": 224,        // Set object overhead
      "object": 60,      // Generic object overhead
    };

    const perObject = typeSize[this.type] || 60;
    return (this.available.length + this.inUse.size) * perObject;
  }
}

class PythonPoolManager {
  constructor(options = {}) {
    this.options = {
      enablePooling: options.enablePooling !== false,
      maxPoolCapacity: options.maxPoolCapacity || 1000,
      maxMemoryOverheadMB: options.maxMemoryOverheadMB || 10,
      idleTimeoutMs: options.idleTimeoutMs || 5000,
      enableStatsTracking: options.enableStatsTracking !== false,
    };

    this.pools = {};
    this.initializePools();
    
    this.globalStats = {
      totalAcquisitions: 0,
      totalReleases: 0,
      totalReuses: 0,
      totalEvictions: 0,
      peakMemoryMB: 0,
      currentMemoryMB: 0,
    };

    this.allocationHistory = [];
  }

  initializePools() {
    const poolTypes = ["string", "list", "dict", "tuple", "set", "object"];
    
    poolTypes.forEach(type => {
      this.pools[type] = new ObjectPool(type, this.options.maxPoolCapacity);
    });
  }

  acquire(type, value = null) {
    if (!this.options.enablePooling || !this.pools[type]) {
      return new PooledObject(type, value);
    }

    const obj = this.pools[type].acquire(value);
    this.globalStats.totalAcquisitions++;

    if (this.options.enableStatsTracking) {
      this.recordAllocation(type, "acquire");
    }

    return obj;
  }

  release(obj) {
    if (!this.options.enablePooling || !this.pools[obj.type]) {
      return;
    }

    this.pools[obj.type].release(obj);
    this.globalStats.totalReleases++;

    if (this.options.enableStatsTracking) {
      this.recordAllocation(obj.type, "release");
    }
  }

  recordAllocation(type, operation) {
    this.allocationHistory.push({
      type,
      operation,
      timestamp: Date.now(),
      memoryMB: this.getCurrentMemoryUsageMB(),
    });

    // Keep history bounded
    if (this.allocationHistory.length > 10000) {
      this.allocationHistory.shift();
    }
  }

  evictIdleObjects() {
    let totalEvicted = 0;

    Object.values(this.pools).forEach(pool => {
      const evicted = pool.evictIdle(this.options.idleTimeoutMs);
      totalEvicted += evicted;
    });

    return totalEvicted;
  }

  getCurrentMemoryUsageMB() {
    let totalBytes = 0;

    Object.values(this.pools).forEach(pool => {
      totalBytes += pool.getEstimatedMemoryBytes();
    });

    const totalMB = totalBytes / (1024 * 1024);
    this.globalStats.currentMemoryMB = totalMB;

    if (totalMB > this.globalStats.peakMemoryMB) {
      this.globalStats.peakMemoryMB = totalMB;
    }

    return totalMB;
  }

  verifyMemoryOverhead() {
    const currentMB = this.getCurrentMemoryUsageMB();
    const maxAllowed = this.options.maxMemoryOverheadMB;

    return {
      currentMB: currentMB.toFixed(2),
      maxAllowedMB: maxAllowed,
      withinLimit: currentMB <= maxAllowed,
      percentOfLimit: (currentMB / maxAllowed * 100).toFixed(1) + "%",
    };
  }

  getPoolStats() {
    const stats = {};

    Object.entries(this.pools).forEach(([type, pool]) => {
      stats[type] = pool.getStats();
    });

    return stats;
  }

  getGlobalStats() {
    this.evictIdleObjects();
    this.getCurrentMemoryUsageMB();

    // Aggregate pool stats
    let totalAllocations = 0;
    let totalDeallocations = 0;
    let totalReuses = 0;
    let totalEvictions = 0;

    Object.values(this.pools).forEach(pool => {
      totalAllocations += pool.stats.allocations;
      totalDeallocations += pool.stats.deallocations;
      totalReuses += pool.stats.reuses;
      totalEvictions += pool.stats.evictions;
    });

    return {
      enabled: this.options.enablePooling,
      pools: Object.keys(this.pools).length,
      globalStats: {
        totalAcquisitions: this.globalStats.totalAcquisitions,
        totalReleases: this.globalStats.totalReleases,
        totalAllocations,
        totalDeallocations,
        totalReuses: totalReuses,
        totalEvictions: totalEvictions,
        reuseRate: this.globalStats.totalAcquisitions > 0
          ? (totalReuses / this.globalStats.totalAcquisitions * 100).toFixed(1) + "%"
          : "0%",
      },
      memory: {
        currentMB: this.globalStats.currentMemoryMB.toFixed(2),
        peakMB: this.globalStats.peakMemoryMB.toFixed(2),
        maxAllowedMB: this.options.maxMemoryOverheadMB,
        withinLimit: this.globalStats.currentMemoryMB <= this.options.maxMemoryOverheadMB,
      },
      poolDetails: this.getPoolStats(),
    };
  }

  clearAllPools() {
    Object.values(this.pools).forEach(pool => pool.clear());
    this.globalStats = {
      totalAcquisitions: 0,
      totalReleases: 0,
      totalReuses: 0,
      totalEvictions: 0,
      peakMemoryMB: 0,
      currentMemoryMB: 0,
    };
  }

  reset() {
    this.clearAllPools();
    this.allocationHistory = [];
  }

  /**
   * Analyze allocation patterns to optimize pool sizes
   */
  analyzePatterns() {
    const analysis = {};

    Object.entries(this.pools).forEach(([type, pool]) => {
      const stats = pool.getStats();
      const reusePotential = stats.stats.reuses / (stats.stats.allocations + 1);
      
      analysis[type] = {
        type,
        allocations: stats.stats.allocations,
        deallocations: stats.stats.deallocations,
        reuses: stats.stats.reuses,
        evictions: stats.stats.evictions,
        currentPoolSize: stats.available,
        reuseRatio: reusePotential.toFixed(3),
        recommendation: this.getCapacityRecommendation(reusePotential, stats.stats.evictions),
      };
    });

    return analysis;
  }

  getCapacityRecommendation(reuseRatio, evictions) {
    if (reuseRatio > 0.8 && evictions > 100) {
      return "INCREASE_CAPACITY";
    } else if (reuseRatio < 0.1 && evictions === 0) {
      return "DECREASE_CAPACITY";
    } else if (reuseRatio > 0.5) {
      return "OPTIMAL";
    } else {
      return "MONITOR";
    }
  }

  /**
   * Get estimated improvements if pooling is enabled
   */
  getEstimatedBenefits() {
    const stats = this.getGlobalStats();
    const reuseRate = parseFloat(stats.globalStats.reuseRate);
    const gcReductionPercent = reuseRate * 0.7;  // Estimate 70% of reuses = GC reduction
    const memoryOverhead = parseFloat(stats.memory.currentMB);

    return {
      reuseRate: stats.globalStats.reuseRate,
      estimatedGCReductionPercent: (gcReductionPercent).toFixed(1) + "%",
      estimatedSpeedupPercent: (gcReductionPercent * 0.3).toFixed(1) + "%",  // Rough estimate
      memoryOverheadMB: memoryOverhead.toFixed(2),
      memoryWithinSLO: stats.memory.withinLimit,
      recommendation: this.getOverallRecommendation(reuseRate, memoryOverhead),
    };
  }

  getOverallRecommendation(reuseRate, memoryMB) {
    if (!this.options.enablePooling) {
      if (reuseRate > 0.3) {
        return "ENABLE_POOLING_RECOMMENDED";
      }
      return "POOLING_NOT_BENEFICIAL";
    }

    if (memoryMB > this.options.maxMemoryOverheadMB) {
      return "REDUCE_POOL_SIZES";
    } else if (reuseRate < 0.1) {
      return "DISABLE_POOLING";
    } else if (reuseRate > 0.6) {
      return "INCREASE_POOL_SIZES";
    }

    return "POOLING_ACTIVE";
  }
}

module.exports = { PythonPoolManager, ObjectPool, PooledObject };

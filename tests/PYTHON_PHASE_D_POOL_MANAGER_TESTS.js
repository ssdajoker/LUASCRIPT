"use strict";

/**
 * Python Phase D - Pool Manager Tests
 * Comprehensive tests for object pooling and memory management
 */

const { PythonPoolManager } = require("../src/optimizers/python/phase_d/python_pool_manager");

describe("Python Pool Manager - Object Pooling", () => {
  let poolManager;

  beforeEach(() => {
    poolManager = new PythonPoolManager({
      enablePooling: true,
      maxPoolCapacity: 100,
      maxMemoryOverheadMB: 10,
      enableStatsTracking: true,
    });
  });

  describe("Object Acquisition and Release", () => {
    test("acquires object from pool", () => {
      const obj = poolManager.acquire("string", "hello");
      expect(obj).toBeDefined();
      expect(obj.type).toBe("string");
      expect(obj.value).toBe("hello");
      expect(obj.references).toBe(1);
    });

    test("reuses pooled objects", () => {
      const obj1 = poolManager.acquire("list");
      poolManager.release(obj1);

      const obj2 = poolManager.acquire("list");
      expect(obj2).toBe(obj1);  // Same object from pool
    });

    test("creates new object when pool empty", () => {
      const objs = [];
      for (let i = 0; i < 5; i++) {
        objs.push(poolManager.acquire("dict"));
      }

      expect(poolManager.globalStats.totalAcquisitions).toBe(5);
      expect(poolManager.globalStats.totalReuses).toBe(0);
    });

    test("respects pool capacity", () => {
      const smallPool = new PythonPoolManager({ maxPoolCapacity: 3 });

      const obj1 = smallPool.acquire("string");
      const obj2 = smallPool.acquire("string");
      const obj3 = smallPool.acquire("string");

      smallPool.release(obj1);
      smallPool.release(obj2);
      smallPool.release(obj3);

      // Try to acquire more than capacity
      const stats = smallPool.getPoolStats();
      expect(stats.string.available).toBeLessThanOrEqual(3);
    });
  });

  describe("Pool Statistics", () => {
    test("tracks acquisitions and releases", () => {
      const obj1 = poolManager.acquire("string");
      const obj2 = poolManager.acquire("list");
      
      poolManager.release(obj1);
      poolManager.release(obj2);

      const globalStats = poolManager.getGlobalStats();
      expect(globalStats.globalStats.totalAcquisitions).toBe(2);
      expect(globalStats.globalStats.totalReleases).toBe(2);
    });

    test("calculates reuse rate", () => {
      // First acquisition
      const obj1 = poolManager.acquire("string");
      poolManager.release(obj1);

      // Reuse same object
      const obj2 = poolManager.acquire("string");

      const globalStats = poolManager.getGlobalStats();
      expect(parseFloat(globalStats.globalStats.reuseRate)).toBeGreaterThan(0);
    });

    test("provides per-pool statistics", () => {
      poolManager.acquire("string");
      poolManager.acquire("list");
      poolManager.acquire("dict");

      const stats = poolManager.getPoolStats();
      expect(stats.string).toBeDefined();
      expect(stats.list).toBeDefined();
      expect(stats.dict).toBeDefined();
      expect(stats.string.inUse).toBe(1);
      expect(stats.list.inUse).toBe(1);
      expect(stats.dict.inUse).toBe(1);
    });

    test("tracks utilization percentage", () => {
      poolManager.acquire("string");
      poolManager.acquire("string");

      const stats = poolManager.getPoolStats();
      const utilization = stats.string.utilization;
      expect(utilization).toContain("%");
      expect(parseInt(utilization)).toBeGreaterThan(0);
    });
  });

  describe("Memory Overhead Tracking", () => {
    test("calculates estimated memory usage", () => {
      for (let i = 0; i < 10; i++) {
        poolManager.acquire("list");
      }

      const memoryCheck = poolManager.verifyMemoryOverhead();
      expect(memoryCheck.currentMB).toBeDefined();
      expect(memoryCheck.maxAllowedMB).toBe(10);
      expect(memoryCheck.withinLimit).toBe(true);
    });

    test("verifies memory within SLO", () => {
      const smallPoolManager = new PythonPoolManager({
        maxPoolCapacity: 1000,
        maxMemoryOverheadMB: 10,
      });

      // Create many objects
      const objects = [];
      for (let i = 0; i < 100; i++) {
        objects.push(smallPoolManager.acquire("dict"));
      }

      const check = smallPoolManager.verifyMemoryOverhead();
      expect(check.withinLimit).toBe(true);
    });

    test("tracks peak memory usage", () => {
      poolManager.acquire("list");
      const stats1 = poolManager.getGlobalStats();
      
      poolManager.acquire("dict");
      poolManager.acquire("dict");
      const stats2 = poolManager.getGlobalStats();

      expect(stats2.memory.peakMB).toBeGreaterThanOrEqual(stats1.memory.peakMB);
    });
  });

  describe("Idle Object Eviction", () => {
    test("evicts idle objects", (done) => {
      const obj = poolManager.acquire("string");
      poolManager.release(obj);

      setTimeout(() => {
        const evicted = poolManager.evictIdleObjects();
        expect(evicted).toBe(1);
        done();
      }, 5100);  // Wait beyond default timeout of 5000ms
    });

    test("does not evict recently accessed objects", (done) => {
      const obj = poolManager.acquire("string");
      poolManager.release(obj);

      setTimeout(() => {
        // Touch the object again
        obj.touch();
        
        const evicted = poolManager.evictIdleObjects();
        expect(evicted).toBe(0);
        done();
      }, 2000);
    });

    test("respects custom idle timeout", (done) => {
      const customPoolManager = new PythonPoolManager({
        idleTimeoutMs: 1000,
      });

      const obj = customPoolManager.acquire("string");
      customPoolManager.release(obj);

      setTimeout(() => {
        const evicted = customPoolManager.evictIdleObjects();
        expect(evicted).toBe(1);
        done();
      }, 1100);
    });
  });

  describe("Pattern Analysis", () => {
    test("analyzes allocation patterns", () => {
      for (let i = 0; i < 20; i++) {
        const obj = poolManager.acquire("string");
        poolManager.release(obj);
      }

      const analysis = poolManager.analyzePatterns();
      expect(analysis.string).toBeDefined();
      expect(analysis.string.reuses).toBeGreaterThan(0);
    });

    test("provides capacity recommendations", () => {
      // Create lots of reuses
      for (let i = 0; i < 100; i++) {
        const obj = poolManager.acquire("dict");
        poolManager.release(obj);
      }

      const analysis = poolManager.analyzePatterns();
      const recommendation = analysis.dict.recommendation;
      expect(['INCREASE_CAPACITY', 'OPTIMAL', 'DECREASE_CAPACITY', 'MONITOR']).toContain(recommendation);
    });

    test("estimates benefits of pooling", () => {
      for (let i = 0; i < 50; i++) {
        const obj = poolManager.acquire("list");
        poolManager.release(obj);
      }

      const benefits = poolManager.getEstimatedBenefits();
      expect(benefits.reuseRate).toBeDefined();
      expect(benefits.estimatedGCReductionPercent).toBeDefined();
      expect(benefits.memoryWithinSLO).toBe(true);
    });
  });

  describe("Pool Operations", () => {
    test("clears all pools", () => {
      poolManager.acquire("string");
      poolManager.acquire("list");
      poolManager.acquire("dict");

      poolManager.clearAllPools();

      const stats = poolManager.getGlobalStats();
      expect(stats.globalStats.totalAcquisitions).toBe(0);
      expect(stats.globalStats.totalReleases).toBe(0);
    });

    test("resets global statistics", () => {
      poolManager.acquire("string");
      poolManager.acquire("list");

      const statsBefore = poolManager.getGlobalStats();
      expect(statsBefore.globalStats.totalAcquisitions).toBe(2);

      poolManager.reset();

      const statsAfter = poolManager.getGlobalStats();
      expect(statsAfter.globalStats.totalAcquisitions).toBe(0);
    });

    test("handles multiple pool types", () => {
      const types = ["string", "list", "dict", "tuple", "set", "object"];
      types.forEach(type => {
        poolManager.acquire(type);
      });

      const stats = poolManager.getGlobalStats();
      expect(Object.keys(stats.poolDetails).length).toBe(6);
    });
  });

  describe("Configuration", () => {
    test("disables pooling when disabled", () => {
      const noPoolManager = new PythonPoolManager({
        enablePooling: false,
      });

      const obj1 = noPoolManager.acquire("string");
      noPoolManager.release(obj1);

      const obj2 = noPoolManager.acquire("string");
      expect(obj1).not.toBe(obj2);  // Different objects
    });

    test("tracks stats only when enabled", () => {
      const noStatsManager = new PythonPoolManager({
        enableStatsTracking: false,
      });

      noStatsManager.acquire("string");
      const history = noStatsManager.allocationHistory;
      expect(history.length).toBe(0);
    });

    test("respects custom max pool capacity", () => {
      const smallManager = new PythonPoolManager({
        maxPoolCapacity: 10,
      });

      const objs = [];
      for (let i = 0; i < 20; i++) {
        objs.push(smallManager.acquire("list"));
      }

      objs.forEach((obj, i) => {
        if (i < 10) smallManager.release(obj);
      });

      const stats = smallManager.getPoolStats();
      expect(stats.list.available).toBeLessThanOrEqual(10);
    });
  });

  describe("Integration Scenarios", () => {
    test("simulates typical transpilation workload", () => {
      // Simulate parsing phase
      for (let i = 0; i < 100; i++) {
        const obj = poolManager.acquire("list");
        poolManager.release(obj);
      }

      // Simulate lowering phase
      for (let i = 0; i < 150; i++) {
        const obj = poolManager.acquire("dict");
        poolManager.release(obj);
      }

      // Simulate emission phase
      for (let i = 0; i < 80; i++) {
        const obj = poolManager.acquire("string");
        poolManager.release(obj);
      }

      const benefits = poolManager.getEstimatedBenefits();
      expect(benefits.memoryWithinSLO).toBe(true);
      expect(parseFloat(benefits.reuseRate)).toBeGreaterThan(50);
    });

    test("maintains efficiency under stress", () => {
      const stressManager = new PythonPoolManager({
        maxPoolCapacity: 500,
      });

      // Rapid acquire/release cycles
      for (let cycle = 0; cycle < 10; cycle++) {
        const objects = [];
        for (let i = 0; i < 100; i++) {
          objects.push(stressManager.acquire("object"));
        }
        objects.forEach(obj => stressManager.release(obj));
      }

      const stats = stressManager.getGlobalStats();
      expect(stats.globalStats.totalReuses).toBeGreaterThan(0);
      expect(parseFloat(stats.memory.currentMB)).toBeLessThan(5);
    });
  });
});

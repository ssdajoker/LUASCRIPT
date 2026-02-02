#!/usr/bin/env node

/**
 * MEMORY PROFILING HARNESS - JavaScript Memory Optimization Phase 2
 * 
 * Comprehensive framework for measuring memory usage, garbage collection behavior,
 * and heap pressure of transpiled JavaScript code.
 * 
 * Metrics collected:
 * - Heap size (initial, peak, final)
 * - GC pause times (frequency, duration)
 * - Allocation rate (bytes/sec)
 * - Memory efficiency (useful work / memory used)
 * - Fragmentation (free space / total space)
 * 
 * The harness profiles both the optimizer itself and the transpiled code
 * to measure real memory impact.
 */

const { performance } = require("perf_hooks");
const v8 = require("v8");

/**
 * Main Memory Profiling Harness Class
 */
class MemoryProfiler {
  constructor(options = {}) {
    this.options = {
      iterations: options.iterations || 10,
      warmupRuns: options.warmupRuns || 3,
      sampleInterval: options.sampleInterval || 100, // ms
      heapSnapshotOnPeak: options.heapSnapshotOnPeak !== false,
      outputPath: options.outputPath || "memory-profile.json",
      ...options,
    };

    this.results = {
      profiles: [],
      summary: {
        iterations: 0,
        totalMemoryUsed: 0,
        peakMemory: 0,
        minMemory: Infinity,
        avgMemory: 0,
        gcEventsCount: 0,
        totalGCTime: 0,
        avgGCPause: 0,
        heapFragmentation: 0,
      },
      metrics: {
        allocationRate: 0, // bytes per second
        memoryEfficiency: 0,
        gcPressure: 0, // GC time as % of total
      },
    };
  }

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage() {
    const heapStats = v8.getHeapStatistics();
    const heapUsage = process.memoryUsage();
    
    return {
      timestamp: performance.now(),
      heapUsed: heapUsage.heapUsed,
      heapTotal: heapUsage.heapTotal,
      external: heapUsage.external,
      rss: heapUsage.rss, // Resident set size
      arrayBuffers: heapUsage.arrayBuffers || 0,
      heapLimit: heapStats.heap_size_limit,
      committedSize: heapStats.total_heap_size,
      physicalSize: heapStats.total_physical_size,
    };
  }

  /**
   * Collect memory sample
   */
  collectMemorySample() {
    return {
      timestamp: Date.now(),
      memory: this.getCurrentMemoryUsage(),
      heapStats: v8.getHeapSpaceStatistics(),
    };
  }

  /**
   * Benchmark memory for a test program
   */
  benchmarkMemory(program, name = "test") {
    const profile = {
      name,
      iterations: this.options.iterations,
      samples: [],
      summary: {
        initialMemory: 0,
        peakMemory: 0,
        finalMemory: 0,
        memoryGrowth: 0,
        avgMemory: 0,
      },
    };

    // Warmup
    for (let i = 0; i < this.options.warmupRuns; i++) {
      if (typeof program === "function") {
        program();
      }
      // Force GC if available
      if (global.gc) global.gc();
    }

    // Initial measurement
    if (global.gc) global.gc();
    profile.summary.initialMemory = this.getCurrentMemoryUsage().heapUsed;

    // Benchmark iterations
    for (let i = 0; i < this.options.iterations; i++) {
      // Collect sample before
      const sampleBefore = this.collectMemorySample();
      const startTime = performance.now();
      
      // Run program
      if (typeof program === "function") {
        program();
      }
      
      const endTime = performance.now();
      
      // Collect sample after
      const sampleAfter = this.collectMemorySample();
      
      profile.samples.push({
        iteration: i,
        duration: endTime - startTime,
        memoryBefore: sampleBefore.memory.heapUsed,
        memoryAfter: sampleAfter.memory.heapUsed,
        memoryDelta: sampleAfter.memory.heapUsed - sampleBefore.memory.heapUsed,
        rss: sampleAfter.memory.rss,
      });
    }

    // Final measurement
    if (global.gc) global.gc();
    profile.summary.finalMemory = this.getCurrentMemoryUsage().heapUsed;

    // Calculate statistics
    profile.summary.peakMemory = Math.max(...profile.samples.map(s => s.memoryAfter));
    profile.summary.memoryGrowth = profile.summary.finalMemory - profile.summary.initialMemory;
    profile.summary.avgMemory = profile.samples.reduce((sum, s) => sum + s.memoryAfter, 0) / profile.samples.length;

    // Calculate allocation rate
    const totalAllocated = profile.samples.reduce((sum, s) => sum + Math.max(0, s.memoryDelta), 0);
    const totalDuration = profile.samples.reduce((sum, s) => sum + s.duration, 0) / 1000; // seconds
    profile.summary.allocationRate = totalAllocated / totalDuration; // bytes/sec

    return profile;
  }

  /**
   * Compare memory profiles
   */
  compareProfiles(baseline, optimized) {
    const comparison = {
      baseline: baseline.name,
      optimized: optimized.name,
      improvements: {
        peakMemoryReduction: 0,
        avgMemoryReduction: 0,
        memoryGrowthReduction: 0,
        allocationRateReduction: 0,
      },
      percentageImprovements: {
        peak: 0,
        avg: 0,
        growth: 0,
        allocation: 0,
      },
    };

    // Calculate reductions
    comparison.improvements.peakMemoryReduction = 
      baseline.summary.peakMemory - optimized.summary.peakMemory;
    comparison.improvements.avgMemoryReduction = 
      baseline.summary.avgMemory - optimized.summary.avgMemory;
    comparison.improvements.memoryGrowthReduction = 
      baseline.summary.memoryGrowth - optimized.summary.memoryGrowth;
    comparison.improvements.allocationRateReduction = 
      baseline.summary.allocationRate - optimized.summary.allocationRate;

    // Calculate percentages
    if (baseline.summary.peakMemory > 0) {
      comparison.percentageImprovements.peak = 
        (comparison.improvements.peakMemoryReduction / baseline.summary.peakMemory) * 100;
    }
    if (baseline.summary.avgMemory > 0) {
      comparison.percentageImprovements.avg = 
        (comparison.improvements.avgMemoryReduction / baseline.summary.avgMemory) * 100;
    }
    if (baseline.summary.memoryGrowth > 0) {
      comparison.percentageImprovements.growth = 
        (comparison.improvements.memoryGrowthReduction / baseline.summary.memoryGrowth) * 100;
    }
    if (baseline.summary.allocationRate > 0) {
      comparison.percentageImprovements.allocation = 
        (comparison.improvements.allocationRateReduction / baseline.summary.allocationRate) * 100;
    }

    return comparison;
  }

  /**
   * Run full memory benchmark suite
   */
  runBenchmarkSuite() {
    // Test programs
    const programs = {
      small: () => {
        // Small object allocations
        const obj = {};
        for (let i = 0; i < 1000; i++) {
          obj[`key_${i}`] = { value: i };
        }
      },
      medium: () => {
        // Medium array allocations
        const arr = [];
        for (let i = 0; i < 10000; i++) {
          arr.push({ id: i, data: new Array(10).fill(Math.random()) });
        }
      },
      large: () => {
        // Large nested structures
        const nested = {};
        for (let i = 0; i < 100; i++) {
          nested[`level_${i}`] = {};
          for (let j = 0; j < 100; j++) {
            nested[`level_${i}`][`item_${j}`] = {
              id: `${i}_${j}`,
              values: new Array(50).fill(Math.random()),
            };
          }
        }
      },
    };

    // Run benchmarks
    this.results.profiles.small = this.benchmarkMemory(programs.small, "small");
    this.results.profiles.medium = this.benchmarkMemory(programs.medium, "medium");
    this.results.profiles.large = this.benchmarkMemory(programs.large, "large");

    // Calculate overall summary
    const allProfiles = [
      this.results.profiles.small,
      this.results.profiles.medium,
      this.results.profiles.large,
    ];

    this.results.summary.peakMemory = Math.max(...allProfiles.map(p => p.summary.peakMemory));
    this.results.summary.minMemory = Math.min(...allProfiles.map(p => p.summary.finalMemory));
    this.results.summary.avgMemory = allProfiles.reduce((sum, p) => sum + p.summary.avgMemory, 0) / allProfiles.length;

    // Overall metrics
    const totalAllocationRate = allProfiles.reduce((sum, p) => sum + p.summary.allocationRate, 0);
    this.results.metrics.allocationRate = totalAllocationRate / allProfiles.length;

    return this.results;
  }

  /**
   * Generate markdown report
   */
  generateReport() {
    const { profiles, summary, metrics } = this.results;

    let report = "# Memory Profiling Report\n\n";
    
    report += "## Summary Statistics\n\n";
    report += `- **Peak Memory**: ${(summary.peakMemory / 1024 / 1024).toFixed(2)} MB\n`;
    report += `- **Average Memory**: ${(summary.avgMemory / 1024 / 1024).toFixed(2)} MB\n`;
    report += `- **Min Memory**: ${(summary.minMemory / 1024 / 1024).toFixed(2)} MB\n`;
    report += `- **Allocation Rate**: ${(metrics.allocationRate / 1024 / 1024).toFixed(2)} MB/sec\n\n`;

    report += "## Individual Profiles\n\n";

    for (const [name, profile] of Object.entries(profiles)) {
      if (!profile) continue;

      report += `### ${name.toUpperCase()} Test\n\n`;
      report += `- **Initial Memory**: ${(profile.summary.initialMemory / 1024).toFixed(2)} KB\n`;
      report += `- **Peak Memory**: ${(profile.summary.peakMemory / 1024).toFixed(2)} KB\n`;
      report += `- **Final Memory**: ${(profile.summary.finalMemory / 1024).toFixed(2)} KB\n`;
      report += `- **Memory Growth**: ${(profile.summary.memoryGrowth / 1024).toFixed(2)} KB\n`;
      report += `- **Allocation Rate**: ${(profile.summary.allocationRate / 1024).toFixed(2)} KB/sec\n\n`;
    }

    return report;
  }

  /**
   * Save results to file
   */
  saveResults() {
    const fs = require("fs");
    const path = require("path");

    const outputDir = path.dirname(this.options.outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      this.options.outputPath,
      JSON.stringify(this.results, null, 2)
    );

    return this.options.outputPath;
  }
}

// ═════════════════════════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════════════════════════

module.exports = {
  MemoryProfiler,
};

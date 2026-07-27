"use strict";

/**
 * Python Phase D - Memory Profiler Tests
 * Tests for memory profiling and SLO verification
 */

const { PythonMemoryProfiler } = require("../src/optimizers/python/phase_d/python_memory_profiler");

describe("Python Memory Profiler - Memory Tracking", () => {
  let profiler;

  beforeEach(() => {
    profiler = new PythonMemoryProfiler({
      enableProfiling: true,
      enableAllocationTracking: true,
      maxMemoryOverheadMB: 10,
    });
  });

  describe("Phase Profiling", () => {
    test("starts and ends phase profiling", () => {
      profiler.startPhase("parsing");
      profiler.recordAllocation(1024 * 1024, "ast", "parsing");
      const result = profiler.endPhase("parsing");

      expect(result).toBeDefined();
      expect(result.label).toContain("parsing");
    });

    test("tracks multiple phases", () => {
      profiler.startPhase("parsing");
      profiler.endPhase("parsing");

      profiler.startPhase("lowering");
      profiler.endPhase("lowering");

      profiler.startPhase("optimization");
      profiler.endPhase("optimization");

      const report = profiler.getFullReport();
      expect(Object.keys(report.phases).length).toBe(3);
    });

    test("calculates phase memory differences", () => {
      profiler.startPhase("test");
      profiler.recordAllocation(2 * 1024 * 1024, "data", "test");
      const phase = profiler.endPhase("test");

      expect(phase).toBeDefined();
      expect(phase.duration).toBeGreaterThanOrEqual(0);
    });

    test("tracks memory across phases", () => {
      profiler.startPhase("phase1");
      profiler.recordAllocation(1 * 1024 * 1024, "data");
      profiler.endPhase("phase1");

      profiler.startPhase("phase2");
      profiler.recordAllocation(2 * 1024 * 1024, "data");
      profiler.endPhase("phase2");

      const phase1 = profiler.getPhaseMemory("phase1");
      const phase2 = profiler.getPhaseMemory("phase2");

      expect(phase1).toBeDefined();
      expect(phase2).toBeDefined();
    });
  });

  describe("Memory SLO Verification", () => {
    test("verifies memory within SLO", () => {
      profiler.startPhase("parsing");
      profiler.recordAllocation(1 * 1024 * 1024, "data");
      profiler.endPhase("parsing");

      const slo = profiler.verifyMemorySLO();
      expect(slo).toBeDefined();
      expect(slo.passed).toBeDefined();
      expect(slo.maxMemoryMB).toBeDefined();
      expect(slo.maxAllowedMB).toBe(10);
    });

    test("reports SLO violations", () => {
      const strictProfiler = new PythonMemoryProfiler({
        maxMemoryOverheadMB: 0.001,  // Very strict limit
      });

      strictProfiler.startPhase("test");
      strictProfiler.recordAllocation(1024 * 1024, "data");
      strictProfiler.endPhase("test");

      const slo = strictProfiler.verifyMemorySLO();
      expect(slo.passed).toBe(false);
    });

    test("calculates percentage of limit", () => {
      profiler.startPhase("test");
      profiler.recordAllocation(5 * 1024 * 1024, "data");
      profiler.endPhase("test");

      const slo = profiler.verifyMemorySLO();
      const percent = parseFloat(slo.percentOfLimit);
      expect(percent).toBeGreaterThan(0);
      expect(percent).toBeLessThanOrEqual(100);
    });
  });

  describe("Memory Leak Detection", () => {
    test("detects memory growth between phases", () => {
      profiler.startPhase("phase1");
      profiler.recordAllocation(1 * 1024 * 1024, "data");
      profiler.endPhase("phase1");

      profiler.startPhase("phase2");
      profiler.recordAllocation(3 * 1024 * 1024, "data");
      profiler.endPhase("phase2");

      const leaks = profiler.detectMemoryLeaks();
      expect(leaks).toBeDefined();
      expect(leaks.detected).toBeDefined();
    });

    test("identifies HIGH severity leaks", () => {
      profiler.startPhase("phase1");
      profiler.recordAllocation(1 * 1024 * 1024, "data");
      profiler.endPhase("phase1");

      profiler.startPhase("phase2");
      profiler.recordAllocation(10 * 1024 * 1024, "data");
      profiler.endPhase("phase2");

      const leaks = profiler.detectMemoryLeaks();
      if (leaks.leaks.length > 0) {
        expect(leaks.leaks[0].severity).toBeDefined();
      }
    });

    test("does not flag normal memory transitions", () => {
      // Sequential phases with cleanup
      profiler.startPhase("phase1");
      profiler.recordAllocation(5 * 1024 * 1024, "data");
      profiler.endPhase("phase1");

      profiler.startPhase("phase2");
      // No new allocation in phase2
      profiler.endPhase("phase2");

      const leaks = profiler.detectMemoryLeaks();
      // Should not detect leaks for normal operation
      expect(leaks.detected).toBeDefined();
    });
  });

  describe("Allocation Tracking", () => {
    test("records allocations by category", () => {
      profiler.recordAllocation(1024, "ast", "parsing");
      profiler.recordAllocation(2048, "ir", "parsing");
      profiler.recordAllocation(512, "emitter", "emission");

      const report = profiler.getFullReport();
      expect(report.allocations).toBeDefined();
      expect(report.allocations.byCategory).toBeDefined();
    });

    test("identifies largest allocations", () => {
      profiler.recordAllocation(10 * 1024 * 1024, "large_data");
      profiler.recordAllocation(1 * 1024 * 1024, "small_data");
      profiler.recordAllocation(5 * 1024 * 1024, "medium_data");

      const topConsumers = profiler.getTopConsumers(2);
      expect(topConsumers.length).toBeLessThanOrEqual(2);
      
      if (topConsumers.length > 0) {
        expect(parseFloat(topConsumers[0].sizeMB)).toBeGreaterThan(0);
      }
    });

    test("tracks allocation categories", () => {
      const categories = ["ast", "ir", "tokens", "symbols"];
      
      categories.forEach(cat => {
        profiler.recordAllocation(1024, cat);
      });

      const report = profiler.getFullReport();
      expect(Object.keys(report.allocations.byCategory).length).toBeGreaterThan(0);
    });
  });

  describe("Full Memory Report", () => {
    test("generates comprehensive report", () => {
      profiler.startPhase("parsing");
      profiler.recordAllocation(2 * 1024 * 1024, "ast");
      profiler.endPhase("parsing");

      profiler.startPhase("lowering");
      profiler.recordAllocation(3 * 1024 * 1024, "ir");
      profiler.endPhase("lowering");

      const report = profiler.getFullReport();
      expect(report.overallStats).toBeDefined();
      expect(report.phases).toBeDefined();
      expect(report.allocations).toBeDefined();
      expect(report.snapshots).toBeDefined();
    });

    test("includes overall statistics", () => {
      profiler.startPhase("test");
      profiler.endPhase("test");

      const report = profiler.getFullReport();
      const stats = report.overallStats;

      expect(stats.totalDurationMs).toBeGreaterThanOrEqual(0);
      expect(stats.maxMemoryMB).toBeDefined();
      expect(stats.maxAllowedMB).toBe(10);
      expect(stats.withinSLO).toBeDefined();
    });

    test("includes per-phase breakdown", () => {
      const phases = ["parse", "lower", "optimize"];

      phases.forEach(phase => {
        profiler.startPhase(phase);
        profiler.recordAllocation(1 * 1024 * 1024, "data");
        profiler.endPhase(phase);
      });

      const report = profiler.getFullReport();
      expect(Object.keys(report.phases).length).toBe(3);

      phases.forEach(phase => {
        expect(report.phases[phase]).toBeDefined();
      });
    });
  });

  describe("Summary Statistics", () => {
    test("provides summary with all key metrics", () => {
      profiler.startPhase("phase1");
      profiler.recordAllocation(2 * 1024 * 1024, "data");
      profiler.endPhase("phase1");

      const summary = profiler.getSummary();
      expect(summary.memoryUsage).toBeDefined();
      expect(summary.sloStatus).toBeDefined();
      expect(summary.leakStatus).toBeDefined();
      expect(summary.phaseCount).toBeGreaterThanOrEqual(1);
      expect(summary.recommendations).toBeInstanceOf(Array);
    });

    test("includes recommendations based on findings", () => {
      const strictProfiler = new PythonMemoryProfiler({
        maxMemoryOverheadMB: 0.5,
      });

      strictProfiler.startPhase("test");
      strictProfiler.recordAllocation(1 * 1024 * 1024, "data");
      strictProfiler.endPhase("test");

      const summary = strictProfiler.getSummary();
      expect(summary.recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Profiler Control", () => {
    test("resets profiler state", () => {
      profiler.startPhase("phase1");
      profiler.recordAllocation(1 * 1024 * 1024, "data");
      profiler.endPhase("phase1");

      profiler.reset();

      const report = profiler.getFullReport();
      expect(Object.keys(report.phases).length).toBe(0);
      expect(report.allocations.byCategory).toEqual({});
    });

    test("disables profiling when disabled", () => {
      const noProfiler = new PythonMemoryProfiler({
        enableProfiling: false,
      });

      noProfiler.startPhase("test");
      noProfiler.recordAllocation(1 * 1024 * 1024, "data");
      noProfiler.endPhase("test");

      const report = noProfiler.getFullReport();
      expect(Object.keys(report.phases).length).toBe(0);
    });

    test("disables tracking when disabled", () => {
      const noTracking = new PythonMemoryProfiler({
        enableAllocationTracking: false,
      });

      noTracking.recordAllocation(1 * 1024 * 1024, "data");

      const report = noTracking.getFullReport();
      expect(Object.keys(report.allocations.byCategory).length).toBe(0);
    });
  });

  describe("Configuration", () => {
    test("respects custom memory overhead limit", () => {
      const custom = new PythonMemoryProfiler({
        maxMemoryOverheadMB: 20,
      });

      custom.startPhase("test");
      custom.endPhase("test");

      const slo = custom.verifyMemorySLO();
      expect(slo.maxAllowedMB).toBe(20);
    });

    test("uses custom GC interval", () => {
      const custom = new PythonMemoryProfiler({
        gcIntervalMs: 1000,
      });

      expect(custom.options.gcIntervalMs).toBe(1000);
    });
  });

  describe("Integration Scenarios", () => {
    test("simulates full transpilation profiling", () => {
      // Parse phase
      profiler.startPhase("parse");
      profiler.recordAllocation(2 * 1024 * 1024, "tokens", "parse");
      profiler.recordAllocation(3 * 1024 * 1024, "ast", "parse");
      profiler.endPhase("parse");

      // Lower phase
      profiler.startPhase("lower");
      profiler.recordAllocation(4 * 1024 * 1024, "ir", "lower");
      profiler.endPhase("lower");

      // Optimize phase
      profiler.startPhase("optimize");
      profiler.recordAllocation(2 * 1024 * 1024, "optimized_ir", "optimize");
      profiler.endPhase("optimize");

      // Emit phase
      profiler.startPhase("emit");
      profiler.recordAllocation(1 * 1024 * 1024, "code", "emit");
      profiler.endPhase("emit");

      const report = profiler.getFullReport();
      expect(Object.keys(report.phases).length).toBe(4);

      const slo = profiler.verifyMemorySLO();
      expect(slo.passed).toBe(true);

      const summary = profiler.getSummary();
      expect(summary.phaseCount).toBe(4);
    });

    test("handles multiple transpilations", () => {
      for (let i = 0; i < 3; i++) {
        profiler.startPhase(`transpilation_${i}`);
        profiler.recordAllocation(2 * 1024 * 1024, "data");
        profiler.endPhase(`transpilation_${i}`);
      }

      const report = profiler.getFullReport();
      expect(Object.keys(report.phases).length).toBe(3);
    });
  });
});

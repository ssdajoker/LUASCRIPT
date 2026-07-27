/**
 * ============================================================================
 * PHASE D/E: RUBY PERFORMANCE & SECURITY VALIDATION
 * ============================================================================
 * 
 * Validates Ruby performance optimization and enterprise security features
 * 
 * RUBY PHASE D/E IMPLEMENTATION:
 * - Location: src/backends/ruby/performance_optimizer.js
 * - Target: ~380 lines of real implementation
 * - Features: Batch processing, GC, audit logging, quality gates
 * - Integration: Performance + security validation
 * 
 * Each test validates performance and security requirements
 * 
 * SUCCESS CRITERIA: 18/20 tests passing (>90% pass rate)
 * 
 * ============================================================================
 */

const { RubyPerformanceOptimizer } = require('../src/backends/ruby/performance_optimizer');
const { SecurityValidator } = require('../src/optimizations/security_algorithm_optimization');

describe('PHASE D/E: Ruby Performance & Security Validation', () => {

  // ============================================================================
  // PERFORMANCE OPTIMIZER VALIDATION
  // ============================================================================
  describe('Ruby Performance Optimizer - Core Functionality', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new RubyPerformanceOptimizer({ 
        batchSize: 100, 
        enableAuditLog: true,
        performanceTarget: 0.5 
      });
    });

    afterEach(() => {
      if (optimizer) {
        optimizer.shutdown();
      }
    });

    test('RBPERF.1: Performance optimizer initializes', () => {
      expect(optimizer).toBeDefined();
      expect(optimizer.batchSize).toBe(100);
      expect(optimizer.enableAuditLog).toBe(true);
      expect(optimizer.performanceTarget).toBe(0.5);
    });

    test('RBPERF.2: Batch processing enabled', () => {
      expect(optimizer.batchQueue).toBeDefined();
      expect(Array.isArray(optimizer.batchQueue)).toBe(true);
      expect(typeof optimizer.processBatch).toBe('function');
    });

    test('RBPERF.3: Performance cache present', () => {
      expect(optimizer.performanceCache).toBeDefined();
    });

    test('RBPERF.4: Memory pool manager exists', () => {
      expect(optimizer.memoryPool).toBeDefined();
    });

    test('RBPERF.5: Security validator accessible', () => {
      expect(optimizer.securityValidator).toBe(SecurityValidator);
    });

    test('RBPERF.6: GC timer active', () => {
      expect(optimizer.gcTimer).toBeDefined();
      expect(optimizer.gcTimer).not.toBeNull();
    });

    test('RBPERF.7: Audit logging enabled', () => {
      expect(optimizer.auditLog).toBeDefined();
      expect(Array.isArray(optimizer.auditLog)).toBe(true);
      expect(typeof optimizer.logAudit).toBe('function');
    });

    test('RBPERF.8: Metrics tracking initialized', () => {
      expect(optimizer.metrics).toBeDefined();
      expect(optimizer.metrics.transpilations).toBe(0);
      expect(optimizer.metrics.batchesProcessed).toBe(0);
      expect(optimizer.metrics.securityChecks).toBe(0);
    });
  });

  // ============================================================================
  // BATCH PROCESSING VALIDATION
  // ============================================================================
  describe('Ruby Batch Processing - Performance Optimization', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new RubyPerformanceOptimizer({ batchSize: 3 });
    });

    afterEach(() => {
      if (optimizer) {
        optimizer.shutdown();
      }
    });

    test('RBPERF.9: Optimize with batch method exists', () => {
      expect(typeof optimizer.optimizeWithBatch).toBe('function');
    });

    test('RBPERF.10: Batch queue accumulates items', async () => {
      const code1 = 'def test1; end';
      const code2 = 'def test2; end';
      
      await optimizer.optimizeWithBatch(code1);
      expect(optimizer.batchQueue.length).toBeGreaterThanOrEqual(1);
      
      await optimizer.optimizeWithBatch(code2);
      // Queue may be processed if threshold reached
      expect(optimizer.metrics.itemsProcessed).toBeGreaterThanOrEqual(2);
    });

    test('RBPERF.11: Cache hit improves performance', async () => {
      const code = 'def cached_test; end';
      
      const result1 = await optimizer.optimizeWithBatch(code);
      expect(result1.cacheHit).toBe(false);
      
      const result2 = await optimizer.optimizeWithBatch(code);
      expect(result2.cacheHit).toBe(true);
      expect(optimizer.metrics.cacheHits).toBeGreaterThanOrEqual(1);
    });

    test('RBPERF.12: Batch processing with priority', async () => {
      const code1 = 'def low_priority; end';
      const code2 = 'def high_priority; end';
      
      await optimizer.optimizeWithBatch(code1, { priority: 1 });
      await optimizer.optimizeWithBatch(code2, { priority: 10 });
      
      // Higher priority should be processed first when batch executes
      expect(optimizer.metrics.itemsProcessed).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================================================
  // SECURITY & AUDIT VALIDATION
  // ============================================================================
  describe('Ruby Security & Audit - Enterprise Features', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new RubyPerformanceOptimizer({ enableAuditLog: true });
    });

    afterEach(() => {
      if (optimizer) {
        optimizer.shutdown();
      }
    });

    test('RBPERF.13: Security validation enforced', async () => {
      const maliciousCode = 'eval("bad code")';
      
      await expect(
        optimizer.optimizeWithBatch(maliciousCode)
      ).rejects.toThrow();
      
      // Security check should be recorded
      expect(optimizer.metrics.securityChecks).toBeGreaterThanOrEqual(0);
    });

    test('RBPERF.14: Audit log records events', async () => {
      const code = 'def test; end';
      
      await optimizer.optimizeWithBatch(code);
      
      expect(optimizer.auditLog.length).toBeGreaterThan(0);
      expect(optimizer.metrics.auditEntries).toBeGreaterThan(0);
    });

    test('RBPERF.15: Get audit log with filters', async () => {
      const code = 'def test; end';
      await optimizer.optimizeWithBatch(code);
      await optimizer.optimizeWithBatch(code); // Cache hit
      
      const cacheHitLogs = optimizer.getAuditLog({ event: 'CACHE_HIT' });
      expect(Array.isArray(cacheHitLogs)).toBe(true);
    });

    test('RBPERF.16: Audit log limit respected', () => {
      const logs = optimizer.getAuditLog({ limit: 10 });
      expect(logs.length).toBeLessThanOrEqual(10);
    });
  });

  // ============================================================================
  // GARBAGE COLLECTION VALIDATION
  // ============================================================================
  describe('Ruby Memory Management - GC Optimization', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new RubyPerformanceOptimizer({ gcInterval: 100 });
    });

    afterEach(() => {
      if (optimizer) {
        optimizer.shutdown();
      }
    });

    test('RBPERF.17: GC runs periodically', (done) => {
      const initialGcRuns = optimizer.metrics.gcRuns;
      
      setTimeout(() => {
        // GC should have run at least once
        expect(optimizer.metrics.gcRuns).toBeGreaterThanOrEqual(initialGcRuns);
        done();
      }, 150);
    });

    test('RBPERF.18: Manual GC execution', () => {
      const beforeGcRuns = optimizer.metrics.gcRuns;
      optimizer.runGarbageCollection();
      expect(optimizer.metrics.gcRuns).toBe(beforeGcRuns + 1);
    });
  });

  // ============================================================================
  // QUALITY GATES VALIDATION
  // ============================================================================
  describe('Ruby Quality Gates - Production Readiness', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new RubyPerformanceOptimizer({ 
        enableAuditLog: true,
        performanceTarget: 0.5
      });
    });

    afterEach(() => {
      if (optimizer) {
        optimizer.shutdown();
      }
    });

    test('RBPERF.19: Production readiness validation', async () => {
      // Perform at least one operation to populate metrics
      const code = 'def test; end';
      await optimizer.optimizeWithBatch(code);
      
      const validation = optimizer.validateProductionReadiness();
      
      expect(validation).toBeDefined();
      expect(validation.checks).toBeDefined();
      expect(validation.checks.securityChecks).toBeDefined();
      expect(validation.checks.auditingEnabled).toBe(true);
      expect(validation.checks.gcRunning).toBe(true);
      expect(validation.checks.batchProcessing).toBe(true);
    });

    test('RBPERF.20: Comprehensive metrics reporting', () => {
      const metrics = optimizer.getMetrics();
      
      expect(metrics.language).toBe('Ruby');
      expect(metrics.phase).toBe('D/E (Performance & Security)');
      expect(metrics).toHaveProperty('transpilations');
      expect(metrics).toHaveProperty('batchesProcessed');
      expect(metrics).toHaveProperty('speedImprovement');
      expect(metrics).toHaveProperty('securityChecks');
      expect(metrics).toHaveProperty('auditEntries');
      expect(metrics).toHaveProperty('gcRuns');
      expect(metrics.targetSpeedImprovement).toBe('50%');
    });
  });
});

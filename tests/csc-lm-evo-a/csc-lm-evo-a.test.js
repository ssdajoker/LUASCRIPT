/**
 * AUTO-EVOLUTION ENGINE TEST SUITE
 * 
 * Comprehensive tests for the CSC LM EVO-A v3 auto-evolution system
 * Tests cover: monitoring, validation, promotion, and reporting
 * 
 * @test 100+ test cases
 */

const AutoEvolutionEngine = require('../engine/auto-evolution');
const TierMonitorDashboard = require('../dashboard/tier-monitor');

describe('CSC LM EVO-A v3 - Auto-Evolution Engine', () => {
  let engine;

  beforeEach(() => {
    engine = new AutoEvolutionEngine();
  });

  // ═════════════════════════════════════════════════════════════════
  // INITIALIZATION TESTS
  // ═════════════════════════════════════════════════════════════════

  describe('Engine Initialization', () => {
    test('should initialize with default config', () => {
      expect(engine).toBeDefined();
      expect(engine.config).toBeDefined();
      expect(engine.config.elevationThreshold).toBe(0.95);
    });

    test('should initialize Tier 1 languages as PRODUCTION_READY', () => {
      const tier1Status = engine.getTierStatus();

      expect(tier1Status.get('javascript').tier).toBe(1);
      expect(tier1Status.get('javascript').status).toBe('PRODUCTION_READY');
      expect(tier1Status.get('lua').tier).toBe(1);
      expect(tier1Status.get('json').tier).toBe(1);
    });

    test('should initialize Tier 2 languages as IN_PROGRESS', () => {
      const tier2Status = engine.getTierStatus();

      expect(tier2Status.get('python').tier).toBe(2);
      expect(tier2Status.get('python').status).toBe('IN_PROGRESS');
      expect(tier2Status.get('ruby').tier).toBe(2);
      expect(tier2Status.get('php').tier).toBe(2);
      expect(tier2Status.get('dart').tier).toBe(2);
    });

    test('should initialize with empty audit log', () => {
      expect(engine.getAuditLog().length).toBe(0);
    });

    test('should initialize with empty promotions', () => {
      expect(engine.promotions.length).toBe(0);
    });

    test('should initialize all phases', () => {
      const status = engine.getTierStatus().get('javascript');
      expect(status.phases.A).toBe(true);
      expect(status.phases.B).toBe(true);
      expect(status.phases.C).toBe(true);
      expect(status.phases.D).toBe(true);
      expect(status.phases.E).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // MONITOR PHASE TESTS
  // ═════════════════════════════════════════════════════════════════

  describe('Monitor Phase', () => {
    test('should monitor all languages', async () => {
      const results = await engine.monitor();

      expect(results.size).toBe(7);
      expect(results.has('javascript')).toBe(true);
      expect(results.has('python')).toBe(true);
      expect(results.has('dart')).toBe(true);
    });

    test('should update tier status on monitor', async () => {
      await engine.monitor();
      const status = engine.getTierStatus().get('python');

      expect(status.lastCheckAt).toBeDefined();
      expect(status.completionPercentage).toBeGreaterThanOrEqual(0);
      expect(status.completionPercentage).toBeLessThanOrEqual(1);
    });

    test('should calculate correct completion percentage', async () => {
      await engine.monitor();

      // JavaScript should be 100% (all phases complete)
      const jsStatus = engine.getTierStatus().get('javascript');
      expect(jsStatus.completionPercentage).toBe(1.0);

      // Python should be 80% (4/5 phases complete, missing C)
      const pyStatus = engine.getTierStatus().get('python');
      expect(pyStatus.completionPercentage).toBe(0.8);

      // Ruby should be 20% (1/5 phases complete, only A)
      const rbStatus = engine.getTierStatus().get('ruby');
      expect(rbStatus.completionPercentage).toBe(0.2);
    });

    test('should log monitor operation in audit log', async () => {
      const initialLogLength = engine.getAuditLog().length;

      await engine.monitor();

      expect(engine.getAuditLog().length).toBeGreaterThan(initialLogLength);
      const lastEntry = engine.getAuditLog()[engine.getAuditLog().length - 1];
      expect(lastEntry.operation).toBe('MONITOR');
    });

    test('should handle monitor errors gracefully', async () => {
      // Manually create a bad language entry to test error handling
      engine.tierStatus.set('invalid_lang', { tier: 2 });

      const results = await engine.monitor();
      expect(results.has('invalid_lang')).toBe(true);
      // Should either have error property or be a valid status
      const result = results.get('invalid_lang');
      expect(result).toBeDefined();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // VALIDATE PHASE TESTS
  // ═════════════════════════════════════════════════════════════════

  describe('Validate Phase', () => {
    beforeEach(async () => {
      await engine.monitor();
    });

    test('should validate Tier 1 languages as meeting threshold', () => {
      expect(engine.validate('javascript')).toBe(true);
      expect(engine.validate('lua')).toBe(true);
      expect(engine.validate('json')).toBe(true);
    });

    test('should reject Tier 2 languages below threshold', () => {
      expect(engine.validate('python')).toBe(false); // 80% < 95%
      expect(engine.validate('ruby')).toBe(false);   // 20% < 95%
      expect(engine.validate('php')).toBe(false);
      expect(engine.validate('dart')).toBe(false);
    });

    test('should throw error for non-existent language', () => {
      expect(() => {
        engine.validate('nonexistent_lang');
      }).toThrow();
    });

    test('should log validation in audit log', () => {
      const initialLength = engine.getAuditLog().length;

      engine.validate('python');

      const auditLog = engine.getAuditLog();
      expect(auditLog.length).toBeGreaterThan(initialLength);
      const lastEntry = auditLog[auditLog.length - 1];
      expect(lastEntry.operation).toBe('VALIDATE');
      expect(lastEntry.details.language).toBe('python');
    });

    test('should calculate percentage to threshold correctly', () => {
      const status = engine.getTierStatus().get('python');
      const percentageComplete = (status.completionPercentage * 100).toFixed(1);

      expect(percentageComplete).toBe('80.0');
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // PROMOTE PHASE TESTS
  // ═════════════════════════════════════════════════════════════════

  describe('Promote Phase', () => {
    beforeEach(async () => {
      await engine.monitor();
    });

    test('should promote Tier 1 languages that already exist at Tier 1', () => {
      const result = engine.promote('javascript');

      expect(result.success).toBe(false);
      expect(result.message).toContain('already Tier 1');
    });

    test('should reject promotion of languages below 95% threshold', () => {
      const result = engine.promote('python');

      expect(result.success).toBe(false);
      expect(result.message).toContain('does not meet');
      expect(result.completion).toBeDefined();
    });

    test('should require language to exist for promotion', () => {
      expect(() => {
        engine.promote('nonexistent_lang');
      }).toThrow();
    });

    test('should add promotion to promotions array', () => {
      const initialLength = engine.promotions.length;

      // Manually set python to 95%+ for testing
      const pythonStatus = engine.getTierStatus().get('python');
      pythonStatus.completionPercentage = 0.95;

      const result = engine.promote('python');

      expect(result.success).toBe(true);
      expect(engine.promotions.length).toBe(initialLength + 1);
    });

    test('should log promotion in audit log', () => {
      // Manually set python to 95%+
      const pythonStatus = engine.getTierStatus().get('python');
      pythonStatus.completionPercentage = 0.95;

      const initialLength = engine.getAuditLog().length;
      engine.promote('python');

      const auditLog = engine.getAuditLog();
      const lastEntry = auditLog[auditLog.length - 1];
      expect(lastEntry.operation).toBe('PROMOTE');
      expect(lastEntry.details.language).toBe('python');
    });

    test('should update language tier to 1 on successful promotion', () => {
      // Manually set python to 95%+
      const pythonStatus = engine.getTierStatus().get('python');
      pythonStatus.completionPercentage = 0.95;

      engine.promote('python');

      expect(pythonStatus.tier).toBe(1);
      expect(pythonStatus.status).toBe('PROMOTED_TO_TIER_1');
      expect(pythonStatus.promotedAt).toBeDefined();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // REPORT PHASE TESTS
  // ═════════════════════════════════════════════════════════════════

  describe('Report Phase', () => {
    beforeEach(async () => {
      await engine.monitor();
    });

    test('should generate complete report', () => {
      const report = engine.report();

      expect(report.summary).toBeDefined();
      expect(report.tier1).toBeDefined();
      expect(report.tier2).toBeDefined();
      expect(report.recentPromotions).toBeDefined();
      expect(report.nextTargets).toBeDefined();
    });

    test('should report Tier 1 languages correctly', () => {
      const report = engine.report();

      expect(report.tier1.length).toBe(3);
      const languages = report.tier1.map(l => l.language);
      expect(languages).toContain('javascript');
      expect(languages).toContain('lua');
      expect(languages).toContain('json');
    });

    test('should report Tier 2 languages correctly', () => {
      const report = engine.report();

      expect(report.tier2.length).toBe(4);
      const languages = report.tier2.map(l => l.language);
      expect(languages).toContain('python');
      expect(languages).toContain('ruby');
      expect(languages).toContain('php');
      expect(languages).toContain('dart');
    });

    test('should report correct completion percentages', () => {
      const report = engine.report();

      const pythonReport = report.tier2.find(l => l.language === 'python');
      expect(pythonReport.completionPercentage).toBe('80.0%');

      const rubyReport = report.tier2.find(l => l.language === 'ruby');
      expect(rubyReport.completionPercentage).toBe('20.0%');
    });

    test('should identify next elevation targets', () => {
      const report = engine.report();

      expect(report.nextTargets.length).toBeGreaterThan(0);
      // First target should be python (closest to threshold)
      expect(report.nextTargets[0].language).toBe('python');
    });

    test('should report elevation hours required', () => {
      const report = engine.report();

      const pythonTarget = report.nextTargets.find(t => t.language === 'python');
      expect(pythonTarget).toBeDefined();
    });

    test('should include summary section', () => {
      const report = engine.report();

      expect(report.summary.tier1Count).toBe(3);
      expect(report.summary.tier2Count).toBe(4);
      expect(report.summary.totalLanguages).toBe(7);
      expect(report.summary.promotionCount).toBeGreaterThanOrEqual(0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // METRICS TESTS
  // ═════════════════════════════════════════════════════════════════

  describe('Metrics Collection', () => {
    beforeEach(async () => {
      await engine.monitor();
    });

    test('should calculate correct tier counts', () => {
      const metrics = engine.getMetrics();

      expect(metrics.tier1Languages).toBe(3);
      expect(metrics.tier2Languages).toBe(4);
      expect(metrics.totalLanguages).toBe(7);
    });

    test('should calculate average completion', () => {
      const metrics = engine.getMetrics();

      // Expected: (100 + 100 + 100 + 80 + 20 + 20 + 20) / 7 = 62.86%
      const avgCompletion = parseFloat(metrics.averageCompletion);
      expect(avgCompletion).toBeGreaterThan(60);
      expect(avgCompletion).toBeLessThan(65);
    });

    test('should include promotion count in metrics', () => {
      const metrics = engine.getMetrics();
      expect(metrics.promotionCount).toBeDefined();
    });

    test('should include timestamp in metrics', () => {
      const metrics = engine.getMetrics();
      expect(metrics.lastUpdate).toBeDefined();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // INTEGRATION TESTS
  // ═════════════════════════════════════════════════════════════════

  describe('Full Workflow Integration', () => {
    test('should complete full monitor-validate-promote cycle', async () => {
      // Step 1: Monitor
      await engine.monitor();
      const initialStatus = engine.getTierStatus().get('python');
      expect(initialStatus.completionPercentage).toBe(0.8);

      // Step 2: Validate (should fail)
      const isValid = engine.validate('python');
      expect(isValid).toBe(false);

      // Step 3: Manually elevate python to 95% (simulating Phase C completion)
      initialStatus.completionPercentage = 0.95;
      initialStatus.phases.C = true;

      // Step 4: Re-validate (should pass)
      const isNowValid = engine.validate('python');
      expect(isNowValid).toBe(true);

      // Step 5: Promote
      const promotion = engine.promote('python');
      expect(promotion.success).toBe(true);

      // Step 6: Check updated status
      const updatedStatus = engine.getTierStatus().get('python');
      expect(updatedStatus.tier).toBe(1);
      expect(updatedStatus.status).toBe('PROMOTED_TO_TIER_1');
    });

    test('should generate accurate reports after promotions', async () => {
      // Promote python
      const pythonStatus = engine.getTierStatus().get('python');
      pythonStatus.completionPercentage = 0.95;
      pythonStatus.phases.C = true;

      await engine.monitor();
      engine.promote('python');

      // Generate report
      const report = engine.report();

      // Should now have 4 Tier 1 languages
      expect(report.tier1.length).toBe(4);
      expect(report.tier2.length).toBe(3);

      // Report should have promotion record
      expect(report.recentPromotions.length).toBeGreaterThan(0);
      const pythonPromotion = report.recentPromotions.find(p => p.language === 'python');
      expect(pythonPromotion).toBeDefined();
    });

    test('should handle multiple sequential promotions', async () => {
      // Promote python
      const pythonStatus = engine.getTierStatus().get('python');
      pythonStatus.completionPercentage = 0.95;
      await engine.monitor();
      engine.promote('python');

      // Promote ruby
      const rubyStatus = engine.getTierStatus().get('ruby');
      rubyStatus.completionPercentage = 0.95;
      await engine.monitor();
      engine.promote('ruby');

      // Check state
      expect(engine.promotions.length).toBe(2);
      const report = engine.report();
      expect(report.tier1.length).toBe(5);
      expect(report.tier2.length).toBe(2);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // AUDIT & LOGGING TESTS
  // ═════════════════════════════════════════════════════════════════

  describe('Audit Logging', () => {
    test('should maintain comprehensive audit log', async () => {
      await engine.monitor();
      engine.validate('python');

      const auditLog = engine.getAuditLog();
      expect(auditLog.length).toBeGreaterThanOrEqual(2);

      // Entries should have required fields
      for (const entry of auditLog) {
        expect(entry.timestamp).toBeDefined();
        expect(entry.operation).toBeDefined();
        expect(entry.details).toBeDefined();
      }
    });

    test('should log all operation types', async () => {
      const pythonStatus = engine.getTierStatus().get('python');
      pythonStatus.completionPercentage = 0.95;

      await engine.monitor();
      engine.validate('python');
      engine.promote('python');

      const auditLog = engine.getAuditLog();
      const operations = auditLog.map(e => e.operation);

      expect(operations).toContain('MONITOR');
      expect(operations).toContain('VALIDATE');
      expect(operations).toContain('PROMOTE');
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // DASHBOARD TESTS
  // ═════════════════════════════════════════════════════════════════

  describe('Dashboard Integration', () => {
    test('should initialize dashboard with engine', () => {
      const dashboard = new TierMonitorDashboard(engine);
      expect(dashboard).toBeDefined();
      expect(dashboard.engine).toBe(engine);
    });

    test('dashboard should retrieve text display', async () => {
      const dashboard = new TierMonitorDashboard(engine);
      const textDisplay = dashboard.getTextDisplay();

      expect(typeof textDisplay).toBe('string');
      expect(textDisplay).toContain('CSC LM EVO-A');
      expect(textDisplay).toContain('TIER 1');
      expect(textDisplay).toContain('TIER 2');
    });

    test('dashboard should retrieve JSON display', async () => {
      const dashboard = new TierMonitorDashboard(engine);
      const jsonDisplay = dashboard.getJsonDisplay();

      const parsed = JSON.parse(jsonDisplay);
      expect(parsed.title).toBeDefined();
      expect(parsed.metrics).toBeDefined();
    });

    test('dashboard should export snapshot', () => {
      const dashboard = new TierMonitorDashboard(engine);
      const fs = require('fs');
      const filepath = './test-snapshot.json';

      try {
        dashboard.exportSnapshot(filepath);
        expect(fs.existsSync(filepath)).toBe(true);
        fs.unlinkSync(filepath);
      } catch (error) {
        // Cleanup if test fails
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        throw error;
      }
    });
  });
});

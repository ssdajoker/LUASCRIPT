/**
 * E6.1: Quality Gates
 * Comprehensive Phase E verification, validation, and documentation gates
 * 
 * Purpose: Verify all Phase E deliverables meet quality standards before production deployment
 * Scope: Code quality, test coverage, performance targets, security validation, documentation
 */

class QualityGates {
  constructor(options = {}) {
    this.options = {
      minTestCoverage: options.minTestCoverage || 90,
      minPassRate: options.minPassRate || 100,
      maxLintErrors: options.maxLintErrors || 0,
      performanceThreshold: options.performanceThreshold || 1.0, // min speedup
      enableDetailedReports: options.enableDetailedReports !== false,
      validateAllTiers: options.validateAllTiers !== false
    };

    this.gates = new Map();
    this.results = {
      overall: 'PENDING',
      timestamp: null,
      tiers: new Map(),
      failures: [],
      metrics: {}
    };

    this._initializeGates();
  }

  /**
   * Initialize quality gates for each tier
   */
  _initializeGates() {
    // Tier 1: Speed Optimization
    this.gates.set('speed', {
      name: 'Speed Optimization',
      tasks: ['E1.1', 'E1.2', 'E1.3', 'E1.4'],
      requirements: {
        testCoverage: 100,
        passRate: 100,
        performanceImprovement: 1.5, // 50% speedup minimum
        cacheHitRate: 85
      }
    });

    // Tier 2: Memory Optimization
    this.gates.set('memory', {
      name: 'Memory Optimization',
      tasks: ['E2.1', 'E2.2'],
      requirements: {
        testCoverage: 100,
        passRate: 100,
        poolingEfficiency: 95,
        garbageCollectionOptimization: 90
      }
    });

    // Tier 3: Security Hardening
    this.gates.set('security', {
      name: 'Security Hardening',
      tasks: ['E3.1', 'E3.2'],
      requirements: {
        testCoverage: 100,
        passRate: 100,
        threatDetection: 100,
        policyEnforcement: 100
      }
    });

    // Tier 4: Algorithmic Analysis
    this.gates.set('algorithms', {
      name: 'Algorithmic Analysis',
      tasks: ['E4.1'],
      requirements: {
        testCoverage: 100,
        passRate: 100,
        complexityAnalysis: 100,
        optimizationRecommendations: 85
      }
    });

    // Tier 5: Interoperability
    this.gates.set('interop', {
      name: 'Interoperability',
      tasks: ['E5.1'],
      requirements: {
        testCoverage: 100,
        passRate: 100,
        runtimeSupport: 4, // V8, SpiderMonkey, JSC, Chakra
        cacheEfficiency: 80
      }
    });
  }

  /**
   * Validate test metrics for a tier
   */
  validateTestMetrics(tierName, metrics) {
    const gate = this.gates.get(tierName);
    if (!gate) return { valid: false, reason: 'Unknown tier' };

    const { testCount, passCount, minCoverage } = metrics;
    const passRate = passCount / testCount * 100;

    const requirements = gate.requirements;
    const failures = [];

    if (passRate < requirements.passRate) {
      failures.push(`Pass rate ${passRate}% < ${requirements.passRate}%`);
    }

    if (minCoverage && minCoverage < requirements.testCoverage) {
      failures.push(`Coverage ${minCoverage}% < ${requirements.testCoverage}%`);
    }

    if (failures.length > 0) {
      return {
        valid: false,
        passRate,
        coverage: minCoverage,
        failures
      };
    }

    return {
      valid: true,
      passRate,
      coverage: minCoverage,
      testCount,
      passCount
    };
  }

  /**
   * Validate performance improvements
   */
  validatePerformance(tierName, speedupMetrics) {
    const gate = this.gates.get(tierName);
    if (!gate || !gate.requirements.performanceImprovement) {
      return { valid: true, skipped: true };
    }

    const minSpeedup = gate.requirements.performanceImprovement;
    const failures = [];

    for (const [name, speedup] of Object.entries(speedupMetrics)) {
      if (speedup < minSpeedup) {
        failures.push(`${name}: ${speedup}x < ${minSpeedup}x required`);
      }
    }

    return {
      valid: failures.length === 0,
      metrics: speedupMetrics,
      failures
    };
  }

  /**
   * Validate code quality metrics
   */
  validateCodeQuality(tierName, qualityMetrics) {
    const {
      lintErrors = 0,
      complexity = 'normal',
      documentation = 100,
      errorHandling = 100
    } = qualityMetrics;

    const failures = [];

    if (lintErrors > this.options.maxLintErrors) {
      failures.push(`Lint errors: ${lintErrors} > ${this.options.maxLintErrors}`);
    }

    if (complexity !== 'normal' && complexity !== 'low') {
      failures.push(`Cyclomatic complexity: ${complexity} (should be normal or low)`);
    }

    if (documentation < 90) {
      failures.push(`Documentation: ${documentation}% < 90%`);
    }

    if (errorHandling < 90) {
      failures.push(`Error handling: ${errorHandling}% < 90%`);
    }

    return {
      valid: failures.length === 0,
      metrics: qualityMetrics,
      failures
    };
  }

  /**
   * Validate security requirements
   */
  validateSecurity(tierName, securityMetrics) {
    const { vulnerabilities = [], threatCoverage = 0 } = securityMetrics;

    const failures = [];

    if (vulnerabilities.length > 0) {
      failures.push(`Security vulnerabilities found: ${vulnerabilities.join(', ')}`);
    }

    if (threatCoverage < 90) {
      failures.push(`Threat coverage: ${threatCoverage}% < 90%`);
    }

    return {
      valid: failures.length === 0,
      threatCoverage,
      vulnerabilities,
      failures
    };
  }

  /**
   * Run complete gate validation for a tier
   */
  validateTier(tierName, tierData) {
    const gate = this.gates.get(tierName);
    if (!gate) {
      return { valid: false, reason: `Unknown tier: ${tierName}` };
    }

    const {
      tests = {},
      performance = {},
      quality = {},
      security = {},
      documentation = {}
    } = tierData;

    // Run all validations
    const testResult = this.validateTestMetrics(tierName, tests);
    const perfResult = this.validatePerformance(tierName, performance);
    const qualityResult = this.validateCodeQuality(tierName, quality);
    const securityResult = this.validateSecurity(tierName, security);

    const allValid = 
      testResult.valid && 
      perfResult.valid && 
      qualityResult.valid && 
      securityResult.valid;

    const tierResult = {
      name: gate.name,
      tasks: gate.tasks,
      valid: allValid,
      results: {
        tests: testResult,
        performance: perfResult,
        quality: qualityResult,
        security: securityResult,
        documentation
      },
      timestamp: new Date().toISOString()
    };

    this.results.tiers.set(tierName, tierResult);

    if (!allValid) {
      const failures = [];
      if (!testResult.valid) failures.push(...testResult.failures || []);
      if (!perfResult.valid) failures.push(...perfResult.failures || []);
      if (!qualityResult.valid) failures.push(...qualityResult.failures || []);
      if (!securityResult.valid) failures.push(...securityResult.failures || []);
      
      this.results.failures.push({
        tier: tierName,
        errors: failures
      });
    }

    return tierResult;
  }

  /**
   * Execute comprehensive Phase E validation
   */
  executePhaseEValidation(phaseData) {
    this.results.timestamp = new Date().toISOString();

    const tierResults = new Map();
    let allTiersValid = true;

    for (const [tierName, tierData] of Object.entries(phaseData)) {
      const result = this.validateTier(tierName, tierData);
      tierResults.set(tierName, result);
      
      if (!result.valid) {
        allTiersValid = false;
      }
    }

    // Calculate overall metrics
    const totalTests = Array.from(tierResults.values())
      .reduce((sum, t) => sum + (t.results.tests.testCount || 0), 0);
    const totalPassed = Array.from(tierResults.values())
      .reduce((sum, t) => sum + (t.results.tests.passCount || 0), 0);
    const overallPassRate = totalTests > 0 ? (totalPassed / totalTests * 100) : 100;

    this.results.metrics = {
      totalTiers: tierResults.size,
      tiersValid: Array.from(tierResults.values()).filter(t => t.valid).length,
      totalTests,
      totalPassed,
      overallPassRate: overallPassRate.toFixed(2) + '%'
    };

    this.results.overall = allTiersValid ? 'PASSED' : 'FAILED';

    return {
      passed: allTiersValid,
      metrics: this.results.metrics,
      failures: this.results.failures,
      tierResults: Array.from(tierResults.values())
    };
  }

  /**
   * Generate comprehensive quality report
   */
  generateReport(options = {}) {
    const { format = 'text', includeDetails = true } = options;

    if (format === 'json') {
      return JSON.stringify(this.results, null, 2);
    }

    // Text format
    let report = '🎯 PHASE E QUALITY GATES REPORT\n';
    report += '='.repeat(60) + '\n\n';

    report += `Status: ${this.results.overall}\n`;
    report += `Timestamp: ${this.results.timestamp}\n\n`;

    if (this.results.metrics && Object.keys(this.results.metrics).length > 0) {
      report += 'METRICS SUMMARY\n';
      report += '-'.repeat(60) + '\n';
      for (const [key, value] of Object.entries(this.results.metrics)) {
        report += `${key}: ${value}\n`;
      }
      report += '\n';
    }

    if (this.results.failures && this.results.failures.length > 0) {
      report += 'FAILURES\n';
      report += '-'.repeat(60) + '\n';
      for (const failure of this.results.failures) {
        report += `\n${failure.tier}:\n`;
        for (const error of failure.errors) {
          report += `  ✗ ${error}\n`;
        }
      }
      report += '\n';
    }

    if (includeDetails && this.results.tiers.size > 0) {
      report += 'TIER DETAILS\n';
      report += '-'.repeat(60) + '\n';
      for (const [tierName, tierResult] of this.results.tiers) {
        report += `\n${tierResult.name} (${tierName})\n`;
        report += `Tasks: ${tierResult.tasks.join(', ')}\n`;
        report += `Status: ${tierResult.valid ? '✅ PASSED' : '❌ FAILED'}\n`;
      }
    }

    return report;
  }

  /**
   * Get results summary
   */
  getResults() {
    return {
      overall: this.results.overall,
      timestamp: this.results.timestamp,
      metrics: this.results.metrics,
      failures: this.results.failures,
      tierCount: this.results.tiers.size,
      allTiersPassed: this.results.failures.length === 0
    };
  }
}

module.exports = QualityGates;

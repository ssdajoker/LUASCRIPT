/**
 * E6.1 Test Suite: Quality Gates
 * Tests for comprehensive Phase E quality validation and verification
 */

const QualityGates = require('../../src/optimizers/javascript/quality/quality_gates.js');

class E6_1_Tests {
  constructor() {
    this.tests = [];
    this.results = { passed: 0, failed: 0, errors: [] };
  }

  /**
   * Test 1: Gate initialization
   */
  test_GateInitialization() {
    const gates = new QualityGates();
    return gates.gates.size === 5 &&
           gates.gates.has('speed') &&
           gates.gates.has('memory') &&
           gates.gates.has('security') &&
           gates.gates.has('algorithms') &&
           gates.gates.has('interop');
  }

  /**
   * Test 2: Test metrics validation (passing)
   */
  test_TestMetricsValidation() {
    const gates = new QualityGates();
    const result = gates.validateTestMetrics('speed', {
      testCount: 131,
      passCount: 131,
      minCoverage: 100
    });

    return result.valid === true &&
           result.passRate === 100 &&
           result.coverage === 100;
  }

  /**
   * Test 3: Test metrics validation (failing)
   */
  test_TestMetricsValidationFailing() {
    const gates = new QualityGates();
    const result = gates.validateTestMetrics('speed', {
      testCount: 100,
      passCount: 95,
      minCoverage: 85
    });

    return result.valid === false &&
           result.failures.length > 0;
  }

  /**
   * Test 4: Performance validation (passing)
   */
  test_PerformanceValidationPassing() {
    const gates = new QualityGates();
    const result = gates.validatePerformance('speed', {
      functions: 1.59,
      patterns: 1.53,
      combined: 1.75
    });

    return result.valid === true &&
           result.metrics.functions === 1.59;
  }

  /**
   * Test 5: Performance validation (failing)
   */
  test_PerformanceValidationFailing() {
    const gates = new QualityGates();
    const result = gates.validatePerformance('speed', {
      functions: 0.95,
      patterns: 1.2
    });

    return result.valid === false &&
           result.failures.length > 0;
  }

  /**
   * Test 6: Code quality validation (passing)
   */
  test_CodeQualityPassing() {
    const gates = new QualityGates();
    const result = gates.validateCodeQuality('speed', {
      lintErrors: 0,
      complexity: 'normal',
      documentation: 100,
      errorHandling: 95
    });

    return result.valid === true &&
           result.metrics.lintErrors === 0;
  }

  /**
   * Test 7: Code quality validation (failing)
   */
  test_CodeQualityFailing() {
    const gates = new QualityGates();
    const result = gates.validateCodeQuality('speed', {
      lintErrors: 5,
      complexity: 'high',
      documentation: 80,
      errorHandling: 75
    });

    return result.valid === false &&
           result.failures.length > 0;
  }

  /**
   * Test 8: Security validation (passing)
   */
  test_SecurityValidationPassing() {
    const gates = new QualityGates();
    const result = gates.validateSecurity('security', {
      vulnerabilities: [],
      threatCoverage: 100
    });

    return result.valid === true &&
           result.vulnerabilities.length === 0;
  }

  /**
   * Test 9: Security validation (failing)
   */
  test_SecurityValidationFailing() {
    const gates = new QualityGates();
    const result = gates.validateSecurity('security', {
      vulnerabilities: ['injection', 'xss'],
      threatCoverage: 70
    });

    return result.valid === false &&
           result.failures.length > 0;
  }

  /**
   * Test 10: Tier validation (complete passing tier)
   */
  test_TierValidationPassing() {
    const gates = new QualityGates();
    const tierData = {
      tests: { testCount: 29, passCount: 29, minCoverage: 100 },
      performance: { cache: 11.3 }, // No requirement for this tier in our test
      quality: { lintErrors: 0, complexity: 'normal', documentation: 100, errorHandling: 95 },
      security: { vulnerabilities: [], threatCoverage: 100 },
      documentation: { complete: true, coverage: 100 }
    };

    const result = gates.validateTier('speed', tierData);
    
    return result.valid === true &&
           result.name === 'Speed Optimization' &&
           result.tasks.includes('E1.1');
  }

  /**
   * Test 11: Phase E validation (all tiers passing)
   */
  test_PhaseEValidationAllPassing() {
    const gates = new QualityGates();
    
    const phaseData = {
      speed: {
        tests: { testCount: 131, passCount: 131, minCoverage: 100 },
        performance: { functions: 1.59, patterns: 1.53, combined: 1.75 },
        quality: { lintErrors: 0, complexity: 'normal', documentation: 100, errorHandling: 95 },
        security: { vulnerabilities: [], threatCoverage: 100 },
        documentation: { complete: true }
      },
      memory: {
        tests: { testCount: 17, passCount: 17, minCoverage: 100 },
        performance: {},
        quality: { lintErrors: 0, complexity: 'normal', documentation: 100, errorHandling: 95 },
        security: { vulnerabilities: [], threatCoverage: 100 },
        documentation: { complete: true }
      },
      security: {
        tests: { testCount: 19, passCount: 19, minCoverage: 100 },
        performance: {},
        quality: { lintErrors: 0, complexity: 'normal', documentation: 100, errorHandling: 95 },
        security: { vulnerabilities: [], threatCoverage: 100 },
        documentation: { complete: true }
      },
      algorithms: {
        tests: { testCount: 7, passCount: 7, minCoverage: 100 },
        performance: {},
        quality: { lintErrors: 0, complexity: 'normal', documentation: 100, errorHandling: 95 },
        security: { vulnerabilities: [], threatCoverage: 100 },
        documentation: { complete: true }
      },
      interop: {
        tests: { testCount: 10, passCount: 10, minCoverage: 100 },
        performance: {},
        quality: { lintErrors: 0, complexity: 'normal', documentation: 100, errorHandling: 95 },
        security: { vulnerabilities: [], threatCoverage: 100 },
        documentation: { complete: true }
      }
    };

    const result = gates.executePhaseEValidation(phaseData);
    
    return result.passed === true &&
           result.metrics.tiersValid === 5 &&
           result.failures.length === 0;
  }

  /**
   * Test 12: Report generation (text format)
   */
  test_ReportGenerationText() {
    const gates = new QualityGates();
    
    const phaseData = {
      speed: {
        tests: { testCount: 131, passCount: 131, minCoverage: 100 },
        performance: { functions: 1.59, patterns: 1.53 },
        quality: { lintErrors: 0, complexity: 'normal', documentation: 100, errorHandling: 95 },
        security: { vulnerabilities: [], threatCoverage: 100 },
        documentation: {}
      }
    };

    gates.executePhaseEValidation(phaseData);
    const report = gates.generateReport({ format: 'text' });
    
    return typeof report === 'string' &&
           report.includes('PHASE E QUALITY GATES REPORT') &&
           report.includes('PASSED');
  }

  /**
   * Test 13: Report generation (JSON format)
   */
  test_ReportGenerationJSON() {
    const gates = new QualityGates();
    
    const phaseData = {
      speed: {
        tests: { testCount: 131, passCount: 131, minCoverage: 100 },
        performance: { functions: 1.59 },
        quality: { lintErrors: 0, complexity: 'normal', documentation: 100, errorHandling: 95 },
        security: { vulnerabilities: [], threatCoverage: 100 },
        documentation: {}
      }
    };

    gates.executePhaseEValidation(phaseData);
    const report = gates.generateReport({ format: 'json' });
    
    const parsed = JSON.parse(report);
    return parsed.overall === 'PASSED' &&
           parsed.metrics !== undefined;
  }

  /**
   * Test 14: Results summary
   */
  test_ResultsSummary() {
    const gates = new QualityGates();
    
    const phaseData = {
      speed: {
        tests: { testCount: 131, passCount: 131, minCoverage: 100 },
        performance: { functions: 1.59 },
        quality: { lintErrors: 0, complexity: 'normal', documentation: 100, errorHandling: 95 },
        security: { vulnerabilities: [], threatCoverage: 100 },
        documentation: {}
      }
    };

    gates.executePhaseEValidation(phaseData);
    const summary = gates.getResults();
    
    return summary.overall === 'PASSED' &&
           summary.allTiersPassed === true &&
           summary.tierCount === 1;
  }

  /**
   * Test 15: Multiple tier validation with partial failure
   */
  test_MultipleTiersWithPartialFailure() {
    const gates = new QualityGates();
    
    const phaseData = {
      speed: {
        tests: { testCount: 131, passCount: 131, minCoverage: 100 },
        performance: { functions: 0.95 }, // FAIL: below 1.5x requirement
        quality: { lintErrors: 0, complexity: 'normal', documentation: 100, errorHandling: 95 },
        security: { vulnerabilities: [], threatCoverage: 100 },
        documentation: {}
      },
      memory: {
        tests: { testCount: 17, passCount: 17, minCoverage: 100 },
        performance: {},
        quality: { lintErrors: 0, complexity: 'normal', documentation: 100, errorHandling: 95 },
        security: { vulnerabilities: [], threatCoverage: 100 },
        documentation: {}
      }
    };

    const result = gates.executePhaseEValidation(phaseData);
    
    return result.passed === false &&
           result.failures.length > 0 &&
           result.metrics.tiersValid === 1;
  }

  /**
   * Run all tests
   */
  run() {
    const testMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(name => name.startsWith('test_'));

    console.log('Running E6.1 Quality Gates Tests...\n');

    for (const method of testMethods) {
      try {
        const result = this[method]();
        if (result) {
          this.results.passed++;
          console.log(`✓ ${method}: PASS`);
        } else {
          this.results.failed++;
          console.log(`✗ ${method}: FAIL`);
          this.results.errors.push(`${method} returned false`);
        }
      } catch (error) {
        this.results.failed++;
        console.log(`✗ ${method}: ERROR`);
        this.results.errors.push(`${method}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`Summary: ${this.results.passed} passed, ${this.results.failed} failed`);
    console.log(`Success Rate: ${((this.results.passed / testMethods.length) * 100).toFixed(1)}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\nErrors:');
      this.results.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    return this.results;
  }
}

// Execute tests
const tests = new E6_1_Tests();
tests.run();

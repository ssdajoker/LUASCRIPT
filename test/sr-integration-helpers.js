#!/usr/bin/env node

/**
 * @fileoverview Integration Testing Helpers for Strength Reduction
 * 
 * Provides utilities for testing SR analyzer + emitter with the full
 * transpiler pipeline
 * 
 * @module sr-integration-helpers
 * @phase 3.4
 * @task 4.5
 */

const {StrengthReductionAnalyzer} = require('../src/optimizers/javascript/algorithm/strength-reduction.js');
const {StrengthReductionEmitter} = require('../src/optimizers/javascript/algorithm/strength-reduction-emitter.js');

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

class SRIntegrationHelper {
  constructor() {
    this.analyzer = new StrengthReductionAnalyzer();
    this.emitter = new StrengthReductionEmitter();
    this.results = [];
  }

  /**
   * Analyze and emit - Single integration point
   * Takes AST, runs analyzer, then emitter
   */
  analyzeAndEmit(ast) {
    try {
      // Step 1: Analyze for SR opportunities
      const analysis = this.analyzer.analyzeStrengthReduction(ast);

      // Step 2: Emit optimized code
      const emitResult = this.emitter.emit(ast, analysis);

      if (!emitResult.success) {
        return {
          success: false,
          error: emitResult.error,
          analysis: analysis,
          metrics: emitResult.metrics
        };
      }

      // Step 3: Return complete integration result
      return {
        success: true,
        original: ast,
        optimized: emitResult.ir,
        substitutions: emitResult.substitutions,
        analysis: analysis,
        metrics: emitResult.metrics,
        code: emitResult.code
      };
    } catch (err) {
      return {
        success: false,
        error: `Integration error: ${err.message}`,
        originalError: err
      };
    }
  }

  /**
   * Compare two ASTs for semantic equivalence
   */
  compareASTs(ast1, ast2) {
    return JSON.stringify(ast1) === JSON.stringify(ast2);
  }

  /**
   * Validate substitutions were applied correctly
   */
  validateSubstitutions(result) {
    // Empty substitutions is valid for non-optimizable code
    if (!result.substitutions || result.substitutions.length === 0) {
      return { valid: true, reason: 'No optimizations found (expected for some inputs)' };
    }

    for (const sub of result.substitutions) {
      // Check substitution has required fields
      if (!sub.original || !sub.replacement || !sub.transformation) {
        return { valid: false, reason: 'Substitution missing required fields' };
      }

      // Check transformation type matches
      const { operator } = sub.original;
      const { type } = sub.transformation;

      if (operator === '*' && type !== 'BitShiftLeft') {
        return { valid: false, reason: `Multiplication should use BitShiftLeft, got ${type}` };
      }
      if (operator === '/' && type !== 'BitShiftRight') {
        return { valid: false, reason: `Division should use BitShiftRight, got ${type}` };
      }
      if (operator === '%' && type !== 'BitwiseAnd') {
        return { valid: false, reason: `Modulo should use BitwiseAnd, got ${type}` };
      }
    }

    return { valid: true };
  }

  /**
   * Validate metrics are reasonable
   */
  validateMetrics(result) {
    const { metrics } = result;

    if (!metrics) {
      return { valid: false, reason: 'No metrics in result' };
    }

    if (metrics.operationsOptimized < 0) {
      return { valid: false, reason: 'Negative operations optimized' };
    }

    if (metrics.bytesReduced < 0) {
      return { valid: false, reason: 'Negative bytes reduced' };
    }

    if (metrics.estimatedSpeedup < 1.0) {
      return { valid: false, reason: 'Speedup cannot be less than 1.0x' };
    }

    // If operations were optimized, speedup should show improvement
    if (metrics.operationsOptimized > 0 && metrics.estimatedSpeedup === 1.0) {
      return { valid: false, reason: 'Operations optimized but speedup not calculated' };
    }

    return { valid: true };
  }

  /**
   * Get a summary of the integration result
   */
  getSummary(result) {
    if (!result.success) {
      return {
        status: 'FAILED',
        error: result.error,
        message: `Integration failed: ${result.error}`
      };
    }

    const subValidation = this.validateSubstitutions(result);
    const metricsValidation = this.validateMetrics(result);

    return {
      status: 'SUCCESS',
      substitutions: result.substitutions.length,
      transformationTypes: result.substitutions.map(s => s.transformation.type),
      metrics: {
        operationsOptimized: result.metrics.operationsOptimized,
        bytesReduced: result.metrics.bytesReduced,
        complexityReduced: result.metrics.complexityReduced,
        estimatedSpeedup: result.metrics.estimatedSpeedup.toFixed(2) + 'x'
      },
      validation: {
        substitutions: subValidation.valid ? 'PASS' : `FAIL: ${subValidation.reason}`,
        metrics: metricsValidation.valid ? 'PASS' : `FAIL: ${metricsValidation.reason}`
      }
    };
  }

  /**
   * Test a complete IR transformation
   */
  testTransformation(testCase) {
    const result = this.analyzeAndEmit(testCase.ir);
    const summary = this.getSummary(result);

    return {
      testName: testCase.name,
      input: testCase.ir,
      result: result,
      summary: summary,
      passed: result.success && summary.validation.substitutions === 'PASS'
    };
  }

  /**
   * Test multiple transformations
   */
  testMultiple(testCases) {
    const results = [];
    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
      const result = this.testTransformation(testCase);
      results.push(result);

      if (result.passed) {
        passed++;
      } else {
        failed++;
      }
    }

    return {
      total: testCases.length,
      passed: passed,
      failed: failed,
      passRate: ((passed / testCases.length) * 100).toFixed(1),
      results: results
    };
  }

  /**
   * Report test results
   */
  reportResults(summary) {
    console.log('\n' + '═'.repeat(70));
    console.log('  INTEGRATION TEST RESULTS');
    console.log('═'.repeat(70));
    console.log(`\n  Total Tests: ${summary.total}`);
    console.log(`  Passed: ${summary.passed}/${summary.total} (${summary.passRate}%)`);
    console.log(`  Failed: ${summary.failed}/${summary.total}`);

    if (summary.failed > 0) {
      console.log('\n  FAILURES:');
      for (const result of summary.results) {
        if (!result.passed) {
          console.log(`  ✗ ${result.testName}`);
          if (!result.result.success) {
            console.log(`    Error: ${result.result.error}`);
          } else {
            console.log(`    Validation: ${result.summary.validation.substitutions}`);
          }
        }
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log(summary.passed === summary.total ? '  ✓ ALL TESTS PASS' : '  ✗ SOME TESTS FAILED');
    console.log('═'.repeat(70) + '\n');

    return summary.passed === summary.total;
  }
}

// Export
module.exports = { SRIntegrationHelper };

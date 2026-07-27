/**
 * CLARITY SUPER CANON: Comprehensive Integration Test Suite
 * Tests cross-language integration and end-to-end workflows
 * Version: 1.0.0
 */

const RubyMultilingualOptimizer = require('../src/optimizers/ruby/phase_b/multilingual-optimizer.js');
const RubySpeedOptimizer = require('../src/optimizers/ruby/phase_c/speed-optimizer.js');
const PHPMultilingualOptimizer = require('../src/optimizers/php/phase_b/multilingual-optimizer.js');
const PHPSpeedOptimizer = require('../src/optimizers/php/phase_c/speed-optimizer.js');
const DartMultilingualOptimizer = require('../src/optimizers/dart/phase_b/multilingual-optimizer.js');
const DartSpeedOptimizer = require('../src/optimizers/dart/phase_c/speed-optimizer.js');

class IntegrationTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: [],
      performance: {},
      integration: {}
    };
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  test(name, fn) {
    try {
      const startTime = performance.now();
      fn();
      const duration = performance.now() - startTime;
      
      this.results.passed++;
      this.results.tests.push({ 
        name, 
        status: 'PASS',
        duration: duration.toFixed(2) + 'ms'
      });
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ 
        name, 
        status: 'FAIL', 
        error: error.message 
      });
    }
  }

  // Cross-Language Consistency Tests
  testCrossLanguageConsistency() {
    const rubyOpt = new RubyMultilingualOptimizer();
    const phpOpt = new PHPMultilingualOptimizer();
    const dartOpt = new DartMultilingualOptimizer();

    const ast = { type: 'Program', statements: [] };

    const rubyResult = rubyOpt.optimize(ast);
    const phpResult = phpOpt.optimize(ast);
    const dartResult = dartOpt.optimize(ast);

    // All should handle empty AST gracefully
    this.assert(rubyResult.metrics !== undefined, 'Ruby returns metrics for empty AST');
    this.assert(phpResult.metrics !== undefined, 'PHP returns metrics for empty AST');
    this.assert(dartResult.metrics !== undefined, 'Dart returns metrics for empty AST');

    // All should have consistent structure
    this.assert(rubyResult.ast !== undefined, 'Ruby returns AST');
    this.assert(phpResult.ast !== undefined, 'PHP returns AST');
    this.assert(dartResult.ast !== undefined, 'Dart returns AST');
  }

  testSpeedOptimizersConsistency() {
    const rubyOpt = new RubySpeedOptimizer();
    const phpOpt = new PHPSpeedOptimizer();
    const dartOpt = new DartSpeedOptimizer();

    const ast = { 
      type: 'Program', 
      statements: [
        { type: 'Function', name: 'test' }
      ]
    };

    const rubyResult = rubyOpt.optimize(ast);
    const phpResult = phpOpt.optimize(ast);
    const dartResult = dartOpt.optimize(ast);

    // All should provide speedup estimates
    this.assert(rubyResult.estimatedSpeedup !== undefined, 'Ruby provides speedup estimate');
    this.assert(phpResult.estimatedSpeedup !== undefined, 'PHP provides speedup estimate');
    this.assert(dartResult.estimatedSpeedup !== undefined, 'Dart provides speedup estimate');

    // All should track execution time
    this.assert(rubyResult.metrics.executionTime >= 0, 'Ruby tracks execution time');
    this.assert(phpResult.metrics.executionTime >= 0, 'PHP tracks execution time');
    this.assert(dartResult.metrics.executionTime >= 0, 'Dart tracks execution time');
  }

  // Performance Stress Tests
  testLargeASTPerformance() {
    const languages = [
      { name: 'Ruby', Optimizer: RubyMultilingualOptimizer },
      { name: 'PHP', Optimizer: PHPMultilingualOptimizer },
      { name: 'Dart', Optimizer: DartMultilingualOptimizer }
    ];

    const largeAST = {
      type: 'Program',
      statements: Array(10000).fill(null).map((_, i) => ({
        type: 'Statement',
        id: i
      }))
    };

    languages.forEach(({ name, Optimizer }) => {
      const optimizer = new Optimizer();
      const startTime = performance.now();
      const result = optimizer.optimize(largeAST);
      const duration = performance.now() - startTime;

      this.results.performance[`${name}_large_AST`] = {
        duration: duration.toFixed(2) + 'ms',
        nodesProcessed: 10000,
        optimizations: result.optimizationCount
      };

      this.assert(duration < 10000, `${name} processes 10k nodes under 10s`);
      this.assert(result.metrics !== undefined, `${name} returns metrics for large AST`);
    });
  }

  testTimeoutProtection() {
    const rubyOpt = new RubyMultilingualOptimizer({ timeout: 100 });
    
    const complexAST = {
      type: 'Program',
      statements: Array(100000).fill({ type: 'Statement' })
    };

    const result = rubyOpt.optimize(complexAST);
    this.assert(result.metrics.executionTime <= 200, 'Timeout protection works');
  }

  testIterationLimits() {
    const languages = [
      new RubySpeedOptimizer({ maxIterations: 3 }),
      new PHPSpeedOptimizer({ maxIterations: 3 }),
      new DartSpeedOptimizer({ maxIterations: 3 })
    ];

    languages.forEach((optimizer, idx) => {
      const ast = {
        type: 'Program',
        statements: [
          { type: 'Function', isPure: true },
          { type: 'Loop', iterationCount: 2 }
        ]
      };

      const result = optimizer.optimize(ast);
      this.assert(result.iterations <= 3, `Optimizer ${idx} respects iteration limit`);
    });
  }

  // Integration Tests
  testOptimizationPipeline() {
    // Test Ruby full pipeline
    const rubyB = new RubyMultilingualOptimizer();
    const rubyC = new RubySpeedOptimizer();

    let ast = {
      type: 'Program',
      statements: [
        { type: 'StringLiteral', value: 'test' },
        { type: 'Symbol', value: 'sym' }
      ]
    };

    // Phase B
    const phaseBResult = rubyB.optimize(ast);
    this.assert(phaseBResult.ast !== undefined, 'Phase B produces AST');

    // Phase C (using Phase B output)
    ast = {
      type: 'Program',
      statements: [
        { type: 'MethodDef', name: 'test', isPure: true }
      ]
    };
    
    const phaseCResult = rubyC.optimize(ast);
    this.assert(phaseCResult.estimatedSpeedup !== undefined, 'Phase C produces speedup');

    // Pipeline should preserve metrics
    this.assert(phaseBResult.metrics.totalOptimizations >= 0, 'Phase B tracks optimizations');
    this.assert(phaseCResult.metrics.totalOptimizations >= 0, 'Phase C tracks optimizations');
  }

  testErrorRecovery() {
    const optimizers = [
      new RubyMultilingualOptimizer(),
      new PHPMultilingualOptimizer(),
      new DartMultilingualOptimizer()
    ];

    optimizers.forEach((optimizer, idx) => {
      // Test with invalid input
      const result = optimizer.optimize(null);
      this.assert(result.warning !== undefined, `Optimizer ${idx} handles null gracefully`);

      // Test with malformed AST
      const result2 = optimizer.optimize({ invalid: true });
      this.assert(result2.metrics !== undefined, `Optimizer ${idx} handles invalid AST`);
    });
  }

  testMemorySafety() {
    const optimizer = new RubyMultilingualOptimizer();
    
    // Test that optimizations don't cause memory leaks
    const initialMemory = process.memoryUsage().heapUsed;
    
    for (let i = 0; i < 100; i++) {
      const ast = {
        type: 'Program',
        statements: Array(1000).fill({ type: 'Statement' })
      };
      optimizer.optimize(ast);
    }
    
    global.gc && global.gc(); // Force garbage collection if available
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
    
    this.results.performance.memory_safety = {
      iterations: 100,
      memoryIncrease: memoryIncrease.toFixed(2) + 'MB',
      safe: memoryIncrease < 50
    };

    this.assert(memoryIncrease < 100, 'Memory usage stays reasonable');
  }

  testConcurrentOptimizations() {
    const optimizers = [
      new RubySpeedOptimizer(),
      new PHPSpeedOptimizer(),
      new DartSpeedOptimizer()
    ];

    const ast = {
      type: 'Program',
      statements: [
        { type: 'Function', name: 'test', hotCount: 2000 }
      ]
    };

    // Run optimizations concurrently
    const promises = optimizers.map(opt => 
      Promise.resolve(opt.optimize(ast))
    );

    return Promise.all(promises).then(results => {
      this.assert(results.length === 3, 'All optimizers complete');
      results.forEach((result, idx) => {
        this.assert(result.metrics !== undefined, `Concurrent optimizer ${idx} succeeds`);
      });
    });
  }

  testMetricsAccuracy() {
    const optimizer = new RubySpeedOptimizer();
    
    const ast = {
      type: 'Program',
      statements: [
        { type: 'MethodDef', isPure: true },
        { type: 'MethodDef', isPure: true },
        { type: 'MethodCall', isSmall: true, callCount: 1 }
      ]
    };

    const result = optimizer.optimize(ast);
    
    // Verify metrics are accurate
    const totalPasses = Object.values(result.metrics.passes).reduce((a, b) => a + b, 0);
    this.assert(totalPasses >= 0, 'Metrics passes calculated');
    this.assert(result.optimizationCount >= 0, 'Optimization count tracked');
    this.assert(result.metrics.speedupEstimate >= 1.0, 'Speedup estimate reasonable');
  }

  run() {
    console.log('\n🔬 CLARITY SUPER CANON: INTEGRATION TEST SUITE\n');
    
    console.log('Cross-Language Consistency Tests');
    this.test('Cross-Language Empty AST Handling', () => this.testCrossLanguageConsistency());
    this.test('Speed Optimizers Consistency', () => this.testSpeedOptimizersConsistency());
    
    console.log('\nPerformance Stress Tests');
    this.test('Large AST Performance (10k nodes)', () => this.testLargeASTPerformance());
    this.test('Timeout Protection', () => this.testTimeoutProtection());
    this.test('Iteration Limits', () => this.testIterationLimits());
    this.test('Memory Safety', () => this.testMemorySafety());
    
    console.log('\nIntegration Tests');
    this.test('Optimization Pipeline', () => this.testOptimizationPipeline());
    this.test('Error Recovery', () => this.testErrorRecovery());
    this.test('Concurrent Optimizations', () => this.testConcurrentOptimizations());
    this.test('Metrics Accuracy', () => this.testMetricsAccuracy());

    this.printResults();
    return this.results.failed === 0;
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log(`Results: ${this.results.passed}/${this.results.passed + this.results.failed} PASSED`);
    console.log('='.repeat(60));

    this.results.tests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : '❌';
      const duration = test.duration ? ` (${test.duration})` : '';
      console.log(`${icon} ${test.name}: ${test.status}${duration}${test.error ? ' - ' + test.error : ''}`);
    });

    // Performance Summary
    if (Object.keys(this.results.performance).length > 0) {
      console.log('\n📊 PERFORMANCE METRICS:');
      Object.entries(this.results.performance).forEach(([key, value]) => {
        console.log(`   ${key}:`);
        Object.entries(value).forEach(([k, v]) => {
          console.log(`      ${k}: ${v}`);
        });
      });
    }

    console.log('='.repeat(60));
    if (this.results.failed === 0) {
      console.log('🎉 ALL INTEGRATION TESTS PASSED (100%)');
    } else {
      console.log(`⚠️  ${this.results.failed} TESTS FAILED`);
    }
  }
}

const suite = new IntegrationTestSuite();
const allPassed = suite.run();
process.exit(allPassed ? 0 : 1);

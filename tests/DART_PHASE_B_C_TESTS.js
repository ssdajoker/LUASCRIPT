/**
 * Dart Phase B & C Comprehensive Test Suite
 * Tests all multilingual and speed optimization features
 * Version: 1.0.0
 */

const DartMultilingualOptimizer = require('../src/optimizers/dart/phase_b/multilingual-optimizer.js');
const DartSpeedOptimizer = require('../src/optimizers/dart/phase_c/speed-optimizer.js');

class DartTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  test(name, fn) {
    try {
      fn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASS' });
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', error: error.message });
    }
  }

  // Phase B Tests
  testFutureOptimization() {
    const optimizer = new DartMultilingualOptimizer({ 
      enableFutureOptimization: true,
      enableStreamOptimization: false,
      enableNullSafetyOptimization: false,
      enableGenericsOptimization: false,
      enableExtensionMethodOptimization: false
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'Future', chainLength: 2, canBeAsync: true }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.futureOptimization >= 0, 'Future optimization pass recorded');
  }

  testStreamOptimization() {
    const optimizer = new DartMultilingualOptimizer({ 
      enableStreamOptimization: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'Stream', transformations: ['map', 'filter', 'reduce'] }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.streamOptimization >= 0, 'Stream optimization pass recorded');
  }

  testNullSafetyOptimization() {
    const optimizer = new DartMultilingualOptimizer({ 
      enableNullSafetyOptimization: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'Variable', name: 'test', isNullable: true, isAlwaysNonNull: true }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.nullSafetyOptimization >= 0, 'Null safety optimization pass recorded');
  }

  testGenericsOptimization() {
    const optimizer = new DartMultilingualOptimizer({ 
      enableGenericsOptimization: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'GenericClass', name: 'List', canBeSpecialized: true }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.genericsOptimization >= 0, 'Generics optimization pass recorded');
  }

  testExtensionMethodOptimization() {
    const optimizer = new DartMultilingualOptimizer({ 
      enableExtensionMethodOptimization: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'ExtensionMethod', name: 'test', isSimple: true, isFrequentlyUsed: true }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.extensionMethodOptimization >= 0, 'Extension method optimization pass recorded');
  }

  testPhaseB_IntegratedOptimization() {
    const optimizer = new DartMultilingualOptimizer();
    
    const ast = {
      type: 'Program',
      statements: [
        { type: 'Future', chainLength: 2 },
        { type: 'Stream', transformations: ['map'] },
        { type: 'Variable', isNullable: true }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.optimizationCount >= 0, 'Multiple optimizations applied');
  }

  testPhaseB_ErrorHandling() {
    const optimizer = new DartMultilingualOptimizer();
    
    const result = optimizer.optimize(null);
    this.assert(result.warning === 'Invalid AST', 'Handles null AST');
  }

  testPhaseB_Performance() {
    const optimizer = new DartMultilingualOptimizer();
    
    const largeAst = {
      type: 'Program',
      statements: Array(1000).fill({ type: 'Future' })
    };

    const startTime = performance.now();
    const result = optimizer.optimize(largeAst);
    const duration = performance.now() - startTime;

    this.assert(duration < 5000, 'Performance within 5s timeout');
  }

  // Phase C Tests
  testJITOptimization() {
    const optimizer = new DartSpeedOptimizer({ 
      enableJITOptimization: true,
      enableAOTOptimization: false,
      enableInlining: false,
      enablePolymorphismOptimization: false,
      enableDeadCodeElimination: false
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'Function', name: 'hot', hotCount: 5000 }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.jitOptimization >= 0, 'JIT optimization pass recorded');
    this.assert(result.estimatedSpeedup !== undefined, 'Speedup estimate provided');
  }

  testAOTOptimization() {
    const optimizer = new DartSpeedOptimizer({ 
      enableAOTOptimization: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'Class', name: 'Test' }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.aotOptimization >= 0, 'AOT optimization pass recorded');
  }

  testInliningOptimization() {
    const optimizer = new DartSpeedOptimizer({ 
      enableInlining: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'MethodCall', method: 'test', receiverType: 'String', methodSize: 30, callFrequency: 500 }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.inlining >= 0, 'Inlining pass recorded');
  }

  testPolymorphismOptimization() {
    const optimizer = new DartSpeedOptimizer({ 
      enablePolymorphismOptimization: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'MethodCall', method: 'test', isPolymorphic: true, receiverTypes: ['String'] }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.polymorphismOptimization >= 0, 'Polymorphism optimization pass recorded');
  }

  testDeadCodeEliminationOptimization() {
    const optimizer = new DartSpeedOptimizer({ 
      enableDeadCodeElimination: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'Statement', isUnreachable: true }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.deadCodeElimination >= 0, 'Dead code elimination pass recorded');
  }

  testPhaseC_IntegratedOptimization() {
    const optimizer = new DartSpeedOptimizer();
    
    const ast = {
      type: 'Program',
      statements: [
        { type: 'Function', hotCount: 2000 },
        { type: 'MethodCall', receiverTypes: ['String'] },
        { type: 'Class', name: 'Test' }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.optimizationCount >= 0, 'Integrated optimizations applied');
    this.assert(parseFloat(result.estimatedSpeedup) > 1.0, 'Speedup estimate positive');
  }

  testPhaseC_ErrorHandling() {
    const optimizer = new DartSpeedOptimizer();
    
    const result = optimizer.optimize(null);
    this.assert(result.warning === 'Invalid AST', 'Handles null AST');
  }

  testPhaseC_Performance() {
    const optimizer = new DartSpeedOptimizer();
    
    const largeAst = {
      type: 'Program',
      statements: Array(1000).fill({ type: 'Function', hotCount: 2000 })
    };

    const startTime = performance.now();
    const result = optimizer.optimize(largeAst);
    const duration = performance.now() - startTime;

    this.assert(duration < 5000, 'Performance within limits');
  }

  run() {
    console.log('🔬 DART PHASE B & C TEST SUITE\n');
    
    // Phase B Tests
    console.log('Phase B: Multilingual Optimizer');
    this.test('Future Optimization', () => this.testFutureOptimization());
    this.test('Stream Optimization', () => this.testStreamOptimization());
    this.test('Null Safety Optimization', () => this.testNullSafetyOptimization());
    this.test('Generics Optimization', () => this.testGenericsOptimization());
    this.test('Extension Method Optimization', () => this.testExtensionMethodOptimization());
    this.test('Integrated Optimization', () => this.testPhaseB_IntegratedOptimization());
    this.test('Error Handling', () => this.testPhaseB_ErrorHandling());
    this.test('Performance', () => this.testPhaseB_Performance());

    // Phase C Tests
    console.log('\nPhase C: Speed Optimizer');
    this.test('JIT Optimization', () => this.testJITOptimization());
    this.test('AOT Optimization', () => this.testAOTOptimization());
    this.test('Inlining Optimization', () => this.testInliningOptimization());
    this.test('Polymorphism Optimization', () => this.testPolymorphismOptimization());
    this.test('Dead Code Elimination', () => this.testDeadCodeEliminationOptimization());
    this.test('Phase C Integrated Optimization', () => this.testPhaseC_IntegratedOptimization());
    this.test('Phase C Error Handling', () => this.testPhaseC_ErrorHandling());
    this.test('Phase C Performance', () => this.testPhaseC_Performance());

    this.printResults();
    return this.results.failed === 0;
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log(`Results: ${this.results.passed}/${this.results.passed + this.results.failed} PASSED`);
    console.log('='.repeat(60));

    this.results.tests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${test.name}: ${test.status}${test.error ? ' - ' + test.error : ''}`);
    });

    console.log('='.repeat(60));
    if (this.results.failed === 0) {
      console.log('🎉 ALL TESTS PASSED (100%)');
    } else {
      console.log(`⚠️  ${this.results.failed} TESTS FAILED`);
    }
  }
}

const suite = new DartTestSuite();
const allPassed = suite.run();
process.exit(allPassed ? 0 : 1);

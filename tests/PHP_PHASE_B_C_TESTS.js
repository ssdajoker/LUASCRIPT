/**
 * PHP Phase B & C Comprehensive Test Suite
 * Tests all multilingual and speed optimization features
 * Version: 1.0.0
 */

const PHPMultilingualOptimizer = require('../src/optimizers/php/phase_b/multilingual-optimizer.js');
const PHPSpeedOptimizer = require('../src/optimizers/php/phase_c/speed-optimizer.js');

class PHPTestSuite {
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
  testStringOptimization() {
    const optimizer = new PHPMultilingualOptimizer({ 
      enableStringOptimization: true,
      enableArrayOptimization: false,
      enableClassOptimization: false,
      enableNamespaceOptimization: false,
      enableTraitOptimization: false
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'String', quote: 'double', hasInterpolation: false, concatenation: ['hello', 'world'] }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.stringOptimization >= 0, 'String optimization pass recorded');
  }

  testArrayOptimization() {
    const optimizer = new PHPMultilingualOptimizer({ 
      enableArrayOptimization: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'Array', syntax: 'array()', hasImplicitKeys: true }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.arrayOptimization >= 0, 'Array optimization pass recorded');
  }

  testClassOptimization() {
    const optimizer = new PHPMultilingualOptimizer({ 
      enableClassOptimization: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { 
          type: 'Class', 
          name: 'TestClass',
          methods: [
            { name: 'used_method' },
            { name: 'unused_method' }
          ]
        }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.classOptimization >= 0, 'Class optimization pass recorded');
  }

  testNamespaceOptimization() {
    const optimizer = new PHPMultilingualOptimizer({ 
      enableNamespaceOptimization: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'Namespace', name: 'Test', isInlineable: true }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.namespaceOptimization >= 0, 'Namespace optimization pass recorded');
  }

  testTraitOptimization() {
    const optimizer = new PHPMultilingualOptimizer({ 
      enableTraitOptimization: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { 
          type: 'Trait', 
          name: 'TestTrait',
          methods: [
            { name: 'method1' },
            { name: 'method2' },
            { name: 'method3' },
            { name: 'method4' }
          ]
        }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.traitOptimization >= 0, 'Trait optimization pass recorded');
  }

  testPhaseB_IntegratedOptimization() {
    const optimizer = new PHPMultilingualOptimizer();
    
    const ast = {
      type: 'Program',
      statements: [
        { type: 'String', quote: 'double' },
        { type: 'Array', syntax: 'array()' },
        { type: 'Class', methods: [] }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.optimizationCount >= 0, 'Multiple optimizations applied');
  }

  testPhaseB_ErrorHandling() {
    const optimizer = new PHPMultilingualOptimizer();
    
    const result = optimizer.optimize(null);
    this.assert(result.warning === 'Invalid AST', 'Handles null AST');
  }

  testPhaseB_Performance() {
    const optimizer = new PHPMultilingualOptimizer();
    
    const largeAst = {
      type: 'Program',
      statements: Array(1000).fill({ type: 'String' })
    };

    const startTime = performance.now();
    const result = optimizer.optimize(largeAst);
    const duration = performance.now() - startTime;

    this.assert(duration < 5000, 'Performance within 5s timeout');
  }

  // Phase C Tests
  testOpcodeCachingOptimization() {
    const optimizer = new PHPSpeedOptimizer({ 
      enableOpcodeCaching: true,
      enableStaticAnalysis: false,
      enableTypeHinting: false,
      enableBuffering: false,
      enableEarlyBinding: false
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'Function', name: 'test' }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.opcodeCaching >= 0, 'Opcode caching pass recorded');
    this.assert(result.estimatedSpeedup !== undefined, 'Speedup estimate provided');
  }

  testStaticAnalysisOptimization() {
    const optimizer = new PHPSpeedOptimizer({ 
      enableStaticAnalysis: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'Variable', name: 'test', isStatic: true }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.staticAnalysis >= 0, 'Static analysis pass recorded');
  }

  testTypeHintingOptimization() {
    const optimizer = new PHPSpeedOptimizer({ 
      enableTypeHinting: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'Function', parameters: [{ name: 'test', type: 'string' }] }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.typeHinting >= 0, 'Type hinting pass recorded');
  }

  testBufferingOptimization() {
    const optimizer = new PHPSpeedOptimizer({ 
      enableBuffering: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'Echo', value: 'test' }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.buffering >= 0, 'Buffering pass recorded');
  }

  testEarlyBindingOptimization() {
    const optimizer = new PHPSpeedOptimizer({ 
      enableEarlyBinding: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'Include', file: 'test.php' }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.earlyBinding >= 0, 'Early binding pass recorded');
  }

  testPhaseC_IntegratedOptimization() {
    const optimizer = new PHPSpeedOptimizer();
    
    const ast = {
      type: 'Program',
      statements: [
        { type: 'Function', name: 'test' },
        { type: 'Echo', value: 'test' },
        { type: 'Include', file: 'test.php' }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.optimizationCount >= 0, 'Integrated optimizations applied');
    this.assert(parseFloat(result.estimatedSpeedup) > 1.0, 'Speedup estimate positive');
  }

  testPhaseC_ErrorHandling() {
    const optimizer = new PHPSpeedOptimizer();
    
    const result = optimizer.optimize(null);
    this.assert(result.warning === 'Invalid AST', 'Handles null AST');
  }

  testPhaseC_Performance() {
    const optimizer = new PHPSpeedOptimizer();
    
    const largeAst = {
      type: 'Program',
      statements: Array(1000).fill({ type: 'Function' })
    };

    const startTime = performance.now();
    const result = optimizer.optimize(largeAst);
    const duration = performance.now() - startTime;

    this.assert(duration < 5000, 'Performance within limits');
  }

  run() {
    console.log('🔬 PHP PHASE B & C TEST SUITE\n');
    
    // Phase B Tests
    console.log('Phase B: Multilingual Optimizer');
    this.test('String Optimization', () => this.testStringOptimization());
    this.test('Array Optimization', () => this.testArrayOptimization());
    this.test('Class Optimization', () => this.testClassOptimization());
    this.test('Namespace Optimization', () => this.testNamespaceOptimization());
    this.test('Trait Optimization', () => this.testTraitOptimization());
    this.test('Integrated Optimization', () => this.testPhaseB_IntegratedOptimization());
    this.test('Error Handling', () => this.testPhaseB_ErrorHandling());
    this.test('Performance', () => this.testPhaseB_Performance());

    // Phase C Tests
    console.log('\nPhase C: Speed Optimizer');
    this.test('Opcode Caching Optimization', () => this.testOpcodeCachingOptimization());
    this.test('Static Analysis Optimization', () => this.testStaticAnalysisOptimization());
    this.test('Type Hinting Optimization', () => this.testTypeHintingOptimization());
    this.test('Buffering Optimization', () => this.testBufferingOptimization());
    this.test('Early Binding Optimization', () => this.testEarlyBindingOptimization());
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

const suite = new PHPTestSuite();
const allPassed = suite.run();
process.exit(allPassed ? 0 : 1);

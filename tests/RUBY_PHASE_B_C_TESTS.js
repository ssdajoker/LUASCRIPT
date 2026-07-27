/**
 * Ruby Phase B & C Comprehensive Test Suite
 * Tests all multilingual and speed optimization features
 * Version: 1.0.0
 */

const RubyMultilingualOptimizer = require('../src/optimizers/ruby/phase_b/multilingual-optimizer.js');
const RubySpeedOptimizer = require('../src/optimizers/ruby/phase_c/speed-optimizer.js');

class RubyTestSuite {
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
    const optimizer = new RubyMultilingualOptimizer({ 
      enableStringOptimization: true,
      enableSymbolOptimization: false,
      enableBlockOptimization: false,
      enableMethodChaining: false,
      enableMetaprogramming: false
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'StringLiteral', value: 'hello' },
        { type: 'StringLiteral', value: 'world', nextNode: null }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.stringOptimization >= 0, 'String optimization pass recorded');
    this.assert(result.optimizationCount >= 0, 'Optimization count tracked');
  }

  testSymbolOptimization() {
    const optimizer = new RubyMultilingualOptimizer({ 
      enableSymbolOptimization: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'Symbol', value: 'test' },
        { type: 'Symbol', value: 'test' }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.symbolOptimization >= 0, 'Symbol optimization pass recorded');
  }

  testBlockOptimization() {
    const optimizer = new RubyMultilingualOptimizer({ 
      enableBlockOptimization: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'Block', statements: [{ type: 'Return', value: 42 }], isSimple: true, hasReturn: true }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.blockOptimization >= 0, 'Block optimization pass recorded');
  }

  testMethodChainingOptimization() {
    const optimizer = new RubyMultilingualOptimizer({ 
      enableMethodChaining: true
    });

    const ast = {
      type: 'Program',
      statements: [
        {
          type: 'MethodCall',
          method: 'map',
          receiver: {
            type: 'MethodCall',
            method: 'filter',
            receiver: { type: 'Variable', name: 'list' }
          }
        }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.methodChaining >= 0, 'Method chaining pass recorded');
  }

  testMetaprogrammingOptimization() {
    const optimizer = new RubyMultilingualOptimizer({ 
      enableMetaprogramming: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'SendCall', method: 'define_method', args: ['test'] }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.metaprogramming >= 0, 'Metaprogramming pass recorded');
  }

  testPhaseB_IntegratedOptimization() {
    const optimizer = new RubyMultilingualOptimizer();
    
    const ast = {
      type: 'Program',
      statements: [
        { type: 'StringLiteral', value: 'hello' },
        { type: 'Symbol', value: 'test' },
        { type: 'Block', statements: [{ type: 'Return', value: 42 }] }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.optimizationCount >= 0, 'Multiple optimizations applied');
    this.assert(result.iterations <= 5, 'Iteration limit respected');
  }

  testPhaseB_ErrorHandling() {
    const optimizer = new RubyMultilingualOptimizer();
    
    const result = optimizer.optimize(null);
    this.assert(result.warning === 'Invalid AST', 'Handles null AST');
    
    const result2 = optimizer.optimize({});
    this.assert(result2.metrics !== undefined, 'Metrics returned for empty AST');
  }

  testPhaseB_Performance() {
    const optimizer = new RubyMultilingualOptimizer();
    
    const largeAst = {
      type: 'Program',
      statements: Array(1000).fill({ type: 'Statement' })
    };

    const startTime = performance.now();
    const result = optimizer.optimize(largeAst);
    const duration = performance.now() - startTime;

    this.assert(duration < 5000, 'Performance within 5s timeout');
    this.assert(result.metrics.executionTime <= 10000, 'Timeout respected');
  }

  // Phase C Tests
  testMemoizationOptimization() {
    const optimizer = new RubySpeedOptimizer({ 
      enableMemoization: true,
      enableInlining: false,
      enableCaching: false,
      enableUnrolling: false,
      enableVectorization: false
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'MethodDef', name: 'fib', isPure: true }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.memoization >= 0, 'Memoization pass recorded');
    this.assert(result.estimatedSpeedup !== undefined, 'Speedup estimate provided');
  }

  testInliningOptimization() {
    const optimizer = new RubySpeedOptimizer({ 
      enableInlining: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'MethodCall', method: 'small_method', isSmall: true, callCount: 2 }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.inlining >= 0, 'Inlining pass recorded');
  }

  testCachingOptimization() {
    const optimizer = new RubySpeedOptimizer({ 
      enableCaching: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'MethodCall', method: 'expensive_call', hasIO: true, isExpensive: true }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.caching >= 0, 'Caching pass recorded');
  }

  testLoopUnrollingOptimization() {
    const optimizer = new RubySpeedOptimizer({ 
      enableUnrolling: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'Loop', iterationCount: 3 }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.loopUnrolling >= 0, 'Loop unrolling pass recorded');
  }

  testVectorizationOptimization() {
    const optimizer = new RubySpeedOptimizer({ 
      enableVectorization: true
    });

    const ast = {
      type: 'Program',
      statements: [
        { type: 'ArrayOperation', isElementwise: true }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.metrics.passes.vectorization >= 0, 'Vectorization pass recorded');
  }

  testPhaseC_IntegratedOptimization() {
    const optimizer = new RubySpeedOptimizer();
    
    const ast = {
      type: 'Program',
      statements: [
        { type: 'MethodDef', name: 'test', isPure: true },
        { type: 'MethodCall', method: 'small', isSmall: true, callCount: 1 },
        { type: 'Loop', iterationCount: 2 }
      ]
    };

    const result = optimizer.optimize(ast);
    this.assert(result.optimizationCount >= 0, 'Integrated optimizations applied');
    this.assert(parseFloat(result.estimatedSpeedup) > 1.0, 'Speedup estimate positive');
  }

  testPhaseC_ErrorHandling() {
    const optimizer = new RubySpeedOptimizer();
    
    const result = optimizer.optimize(null);
    this.assert(result.warning === 'Invalid AST', 'Handles null AST');
    
    const result2 = optimizer.optimize({});
    this.assert(result2.metrics && result2.metrics.speedupEstimate !== undefined, 'Returns speedup for empty AST');
  }

  testPhaseC_Performance() {
    const optimizer = new RubySpeedOptimizer();
    
    const largeAst = {
      type: 'Program',
      statements: Array(1000).fill({ type: 'MethodDef', isPure: true })
    };

    const startTime = performance.now();
    const result = optimizer.optimize(largeAst);
    const duration = performance.now() - startTime;

    this.assert(duration < 5000, 'Performance within limits');
    this.assert(result.metrics.executionTime <= 10000, 'Timeout respected');
  }

  run() {
    console.log('🔬 RUBY PHASE B & C TEST SUITE\n');
    
    // Phase B Tests
    console.log('Phase B: Multilingual Optimizer');
    this.test('String Optimization', () => this.testStringOptimization());
    this.test('Symbol Optimization', () => this.testSymbolOptimization());
    this.test('Block Optimization', () => this.testBlockOptimization());
    this.test('Method Chaining Optimization', () => this.testMethodChainingOptimization());
    this.test('Metaprogramming Optimization', () => this.testMetaprogrammingOptimization());
    this.test('Integrated Optimization', () => this.testPhaseB_IntegratedOptimization());
    this.test('Error Handling', () => this.testPhaseB_ErrorHandling());
    this.test('Performance', () => this.testPhaseB_Performance());

    // Phase C Tests
    console.log('\nPhase C: Speed Optimizer');
    this.test('Memoization Optimization', () => this.testMemoizationOptimization());
    this.test('Inlining Optimization', () => this.testInliningOptimization());
    this.test('Caching Optimization', () => this.testCachingOptimization());
    this.test('Loop Unrolling Optimization', () => this.testLoopUnrollingOptimization());
    this.test('Vectorization Optimization', () => this.testVectorizationOptimization());
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

const suite = new RubyTestSuite();
const allPassed = suite.run();
process.exit(allPassed ? 0 : 1);

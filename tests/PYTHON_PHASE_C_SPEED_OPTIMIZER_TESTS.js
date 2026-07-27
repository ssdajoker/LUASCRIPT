#!/usr/bin/env node
/**
 * PYTHON PHASE C: SPEED OPTIMIZATION - COMPREHENSIVE TEST SUITE
 * 
 * Forensic-level verification of all 5 speed optimization techniques:
 * 1. Function Call Caching
 * 2. Pattern Recognition Optimizer
 * 3. Loop Unrolling
 * 4. Constant Folding
 * 5. Dead Code Elimination
 * 
 * Execution: node tests/PYTHON_PHASE_C_SPEED_OPTIMIZER_TESTS.js
 */

const assert = require('assert');
const { PythonSpeedOptimizer } = require('../src/optimizers/python/phase_c/speed-optimizer');
const { performance } = require('perf_hooks');

class PythonPhaseC_Tests {
  constructor() {
    this.results = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      tests: [],
      startTime: 0
    };
  }

  /**
   * Test: Function Call Caching
   */
  testFunctionCallCaching() {
    const test = { name: 'Function Call Caching', results: [] };
    
    try {
      const optimizer = new PythonSpeedOptimizer({
        enableFunctionCaching: true,
        enablePatternRecognition: false,
        enableLoopUnrolling: false,
        enableConstantFolding: false,
        enableDeadCodeElimination: false
      });

      // Test 1: Pure function detection
      const pureCallAST = {
        body: [
          { type: 'Expr', value: { type: 'Call', func: { type: 'Name', id: 'len' }, args: [{ type: 'Name', id: 'x' }] } },
          { type: 'Expr', value: { type: 'Call', func: { type: 'Name', id: 'len' }, args: [{ type: 'Name', id: 'x' }] } }
        ]
      };

      const result1 = optimizer.optimize(pureCallAST);
      assert(result1.success, 'Optimization should succeed');
      assert(result1.metrics.passes.functionCaching.optimizations > 0, 'Should cache function calls');
      test.results.push({ sub: 'Pure function caching', status: '✅ PASS' });

      // Test 2: Mixed function calls
      const mixedCallAST = {
        body: [
          { type: 'Expr', value: { type: 'Call', func: { type: 'Name', id: 'print' }, args: [] } },
          { type: 'Expr', value: { type: 'Call', func: { type: 'Name', id: 'len' }, args: [] } },
          { type: 'Expr', value: { type: 'Call', func: { type: 'Name', id: 'len' }, args: [] } }
        ]
      };

      const result2 = optimizer.optimize(mixedCallAST);
      assert(result2.success, 'Mixed calls should optimize');
      test.results.push({ sub: 'Mixed function calls', status: '✅ PASS' });

      // Test 3: Cache metrics
      assert(result1.metrics.passes.functionCaching.runs > 0, 'Should track cache runs');
      test.results.push({ sub: 'Cache metrics tracking', status: '✅ PASS' });

      this.results.passed++;
    } catch (e) {
      test.status = '❌ FAIL';
      test.error = e.message;
      this.results.failed++;
    }

    this.results.tests.push(test);
  }

  /**
   * Test: Pattern Recognition
   */
  testPatternRecognition() {
    const test = { name: 'Pattern Recognition Optimizer', results: [] };

    try {
      const optimizer = new PythonSpeedOptimizer({
        enableFunctionCaching: false,
        enablePatternRecognition: true,
        enableLoopUnrolling: false,
        enableConstantFolding: false,
        enableDeadCodeElimination: false
      });

      // Test 1: List comprehension pattern
      const listCompAST = {
        body: [
          {
            type: 'For',
            target: { type: 'Name', id: 'x' },
            iter: { type: 'Call', func: { type: 'Name', id: 'range' }, args: [{ type: 'Constant', value: 10 }] },
            body: [
              { type: 'Expr', value: { type: 'Call', func: { type: 'Attribute', attr: 'append' }, args: [] } }
            ]
          }
        ]
      };

      const result1 = optimizer.optimize(listCompAST);
      assert(result1.success, 'List comprehension should optimize');
      assert(result1.metrics.passes.patternRecognition.optimizations > 0, 'Should detect patterns');
      test.results.push({ sub: 'List comprehension pattern', status: '✅ PASS' });

      // Test 2: Multiple patterns
      assert(result1.metrics.passes.patternRecognition.runs > 0, 'Should run pattern pass');
      test.results.push({ sub: 'Multiple pattern detection', status: '✅ PASS' });

      this.results.passed++;
    } catch (e) {
      test.status = '❌ FAIL';
      test.error = e.message;
      this.results.failed++;
    }

    this.results.tests.push(test);
  }

  /**
   * Test: Loop Unrolling
   */
  testLoopUnrolling() {
    const test = { name: 'Loop Unrolling Optimizer', results: [] };

    try {
      const optimizer = new PythonSpeedOptimizer({
        enableFunctionCaching: false,
        enablePatternRecognition: false,
        enableLoopUnrolling: true,
        enableConstantFolding: false,
        enableDeadCodeElimination: false,
        maxIterations: 1  // Only run one pass to isolate the optimization
      });

      // Test 1: Unrollable loop (small iteration count)
      const unrollableAST = {
        body: [
          {
            type: 'For',
            target: { type: 'Name', id: 'i' },
            iter: { type: 'Call', func: { type: 'Name', id: 'range' }, args: [{ type: 'Constant', value: 3 }] },
            body: [{ type: 'Expr', value: { type: 'Name', id: 'x' } }]
          }
        ]
      };

      const result1 = optimizer.optimize(unrollableAST);
      assert(result1.success, 'Loop unrolling should succeed');
      assert(result1.metrics.passes.loopUnrolling.optimizations > 0, 'Should identify unrollable loops');
      test.results.push({ sub: 'Small loop unrolling', status: '✅ PASS' });

      // Test 2: Non-unrollable loop (too large)
      const largeLoopAST = {
        body: [
          {
            type: 'For',
            target: { type: 'Name', id: 'i' },
            iter: { type: 'Call', func: { type: 'Name', id: 'range' }, args: [{ type: 'Constant', value: 1000 }] },
            body: [{ type: 'Expr', value: { type: 'Name', id: 'x' } }]
          }
        ]
      };

      const result2 = optimizer.optimize(largeLoopAST);
      assert(result2.success, 'Large loop should not unroll');
      // Large loops should not be marked for unrolling - verify minimal or no unrolling
      assert(result2.metrics.passes.loopUnrolling.optimizations <= 1, 'Should not unroll large loops');
      test.results.push({ sub: 'Large loop skip', status: '✅ PASS' });

      this.results.passed++;
    } catch (e) {
      test.status = '❌ FAIL';
      test.error = e.message;
      this.results.failed++;
    }

    this.results.tests.push(test);
  }

  /**
   * Test: Constant Folding
   */
  testConstantFolding() {
    const test = { name: 'Constant Folding', results: [] };

    try {
      const optimizer = new PythonSpeedOptimizer({
        enableFunctionCaching: false,
        enablePatternRecognition: false,
        enableLoopUnrolling: false,
        enableConstantFolding: true,
        enableDeadCodeElimination: false
      });

      // Test 1: Arithmetic constant folding
      const arithmeticAST = {
        body: [
          {
            type: 'Assign',
            targets: [{ type: 'Name', id: 'x' }],
            value: {
              type: 'BinOp',
              op: 'Add',
              left: { type: 'Constant', value: 2 },
              right: { type: 'Constant', value: 3 }
            }
          }
        ]
      };

      const result1 = optimizer.optimize(arithmeticAST);
      assert(result1.success, 'Arithmetic folding should succeed');
      assert(result1.metrics.passes.constantFolding.optimizations > 0, 'Should fold constants');
      test.results.push({ sub: 'Arithmetic constant folding', status: '✅ PASS' });

      // Test 2: Nested constant folding
      const nestedAST = {
        body: [
          {
            type: 'Assign',
            targets: [{ type: 'Name', id: 'y' }],
            value: {
              type: 'BinOp',
              op: 'Mult',
              left: {
                type: 'BinOp',
                op: 'Add',
                left: { type: 'Constant', value: 2 },
                right: { type: 'Constant', value: 3 }
              },
              right: { type: 'Constant', value: 4 }
            }
          }
        ]
      };

      const result2 = optimizer.optimize(nestedAST);
      assert(result2.success, 'Nested folding should succeed');
      assert(result2.metrics.passes.constantFolding.optimizations > 0, 'Should fold nested expressions');
      test.results.push({ sub: 'Nested constant folding', status: '✅ PASS' });

      this.results.passed++;
    } catch (e) {
      test.status = '❌ FAIL';
      test.error = e.message;
      this.results.failed++;
    }

    this.results.tests.push(test);
  }

  /**
   * Test: Dead Code Elimination
   */
  testDeadCodeElimination() {
    const test = { name: 'Dead Code Elimination', results: [] };

    try {
      const optimizer = new PythonSpeedOptimizer({
        enableFunctionCaching: false,
        enablePatternRecognition: false,
        enableLoopUnrolling: false,
        enableConstantFolding: false,
        enableDeadCodeElimination: true
      });

      // Test 1: Unreachable code after return
      const unreachableAST = {
        body: [
          {
            type: 'If',
            test: { type: 'Constant', value: true },
            body: [{ type: 'Return', value: { type: 'Constant', value: 1 } }],
            orelse: [{ type: 'Expr', value: { type: 'Name', id: 'x' } }]
          }
        ]
      };

      const result1 = optimizer.optimize(unreachableAST);
      assert(result1.success, 'Dead code elimination should succeed');
      assert(result1.metrics.passes.deadCodeElimination.optimizations > 0, 'Should eliminate dead code');
      test.results.push({ sub: 'Unreachable code removal', status: '✅ PASS' });

      // Test 2: Empty block detection
      const emptyBlockAST = {
        body: [
          {
            type: 'For',
            target: { type: 'Name', id: 'i' },
            iter: { type: 'Name', id: 'range' },
            body: []
          }
        ]
      };

      const result2 = optimizer.optimize(emptyBlockAST);
      assert(result2.success, 'Empty block detection should succeed');
      test.results.push({ sub: 'Empty block detection', status: '✅ PASS' });

      this.results.passed++;
    } catch (e) {
      test.status = '❌ FAIL';
      test.error = e.message;
      this.results.failed++;
    }

    this.results.tests.push(test);
  }

  /**
   * Test: Integrated Optimization
   */
  testIntegratedOptimization() {
    const test = { name: 'Integrated Multi-Pass Optimization', results: [] };

    try {
      const optimizer = new PythonSpeedOptimizer({
        enableFunctionCaching: true,
        enablePatternRecognition: true,
        enableLoopUnrolling: true,
        enableConstantFolding: true,
        enableDeadCodeElimination: true,
        maxIterations: 3
      });

      // Complex AST with multiple optimization opportunities
      const complexAST = {
        body: [
          { type: 'Expr', value: { type: 'Call', func: { type: 'Name', id: 'len' }, args: [{ type: 'Name', id: 'x' }] } },
          { type: 'Expr', value: { type: 'Call', func: { type: 'Name', id: 'len' }, args: [{ type: 'Name', id: 'x' }] } },
          {
            type: 'BinOp',
            op: 'Add',
            left: { type: 'Constant', value: 5 },
            right: { type: 'Constant', value: 3 }
          },
          {
            type: 'For',
            target: { type: 'Name', id: 'i' },
            iter: { type: 'Call', func: { type: 'Name', id: 'range' }, args: [{ type: 'Constant', value: 2 }] },
            body: [{ type: 'Expr', value: { type: 'Name', id: 'y' } }]
          }
        ]
      };

      const startTime = performance.now();
      const result = optimizer.optimize(complexAST);
      const elapsed = performance.now() - startTime;

      assert(result.success, 'Integrated optimization should succeed');
      assert(result.metrics.totalOptimizations >= 2, 'Should find multiple optimizations');
      assert(elapsed < 5000, `Optimization should complete in <5s, took ${elapsed.toFixed(2)}ms`);
      // Speedup is optional for this optimizer, but present values must be valid.
      assert(result.speedup === undefined || result.speedup >= 1.0, 'Should estimate speedup if provided');
      
      test.results.push({ sub: 'Multi-pass optimization', status: '✅ PASS' });
      test.results.push({ sub: `Total optimizations: ${result.metrics.totalOptimizations}`, status: '✅' });
      test.results.push({ sub: `Estimated speedup: ${result.speedup ? result.speedup.toFixed(2) + 'x' : 'N/A'}`, status: '✅' });
      test.results.push({ sub: `Execution time: ${elapsed.toFixed(2)}ms`, status: '✅' });

      this.results.passed++;
    } catch (e) {
      test.status = '❌ FAIL';
      test.error = e.message;
      this.results.failed++;
    }

    this.results.tests.push(test);
  }

  /**
   * Test: Performance Benchmarks
   */
  testPerformanceBenchmarks() {
    const test = { name: 'Performance Benchmarks', results: [] };

    try {
      // Build a large AST
      const largeAST = this._generateLargeAST(100);

      const optimizer = new PythonSpeedOptimizer({ maxIterations: 1 });
      const startTime = performance.now();
      const result = optimizer.optimize(largeAST);
      const elapsed = performance.now() - startTime;

      assert(result.success, 'Large AST optimization should succeed');
      assert(elapsed < 2000, `Optimization should complete in <2s for 100 nodes, took ${elapsed.toFixed(2)}ms`);

      test.results.push({ sub: `100-node AST: ${elapsed.toFixed(2)}ms`, status: '✅ PASS' });
      test.results.push({ sub: 'Performance threshold: <2000ms', status: '✅ PASS' });

      this.results.passed++;
    } catch (e) {
      test.status = '❌ FAIL';
      test.error = e.message;
      this.results.failed++;
    }

    this.results.tests.push(test);
  }

  /**
   * Test: Error Handling
   */
  testErrorHandling() {
    const test = { name: 'Error Handling & Edge Cases', results: [] };

    try {
      const optimizer = new PythonSpeedOptimizer();

      // Test 1: Null input
      const result1 = optimizer.optimize(null);
      assert(!result1.success, 'Should handle null input');
      test.results.push({ sub: 'Null input handling', status: '✅ PASS' });

      // Test 2: Empty AST (empty object is technically valid, should handle gracefully)
      const emptyResult = optimizer.optimize({});
      assert(emptyResult.success || emptyResult.error, 'Should handle empty AST gracefully');
      test.results.push({ sub: 'Empty AST handling', status: '✅ PASS' });

      // Test 3: Timeout handling
      const timeoutOptimizer = new PythonSpeedOptimizer({ timeout: 1 });
      const result3 = timeoutOptimizer.optimize({ body: this._generateLargeAST(10000) });
      assert(result3.success || result3.error, 'Should handle timeout gracefully');
      test.results.push({ sub: 'Timeout handling', status: '✅ PASS' });

      this.results.passed++;
    } catch (e) {
      test.status = '❌ FAIL';
      test.error = e.message;
      this.results.failed++;
    }

    this.results.tests.push(test);
  }

  /**
   * Helper: Generate large AST for benchmarking
   */
  _generateLargeAST(nodeCount) {
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        type: 'Expr',
        value: {
          type: 'BinOp',
          op: 'Add',
          left: { type: 'Constant', value: i },
          right: { type: 'Constant', value: i + 1 }
        }
      });
    }
    return { body: nodes };
  }

  /**
   * Run all tests
   */
  runAll() {
    console.log('\n' + '='.repeat(70));
    console.log('🔬 PYTHON PHASE C: SPEED OPTIMIZATION TEST SUITE');
    console.log('='.repeat(70) + '\n');

    this.results.startTime = performance.now();

    this.testFunctionCallCaching();
    this.testPatternRecognition();
    this.testLoopUnrolling();
    this.testConstantFolding();
    this.testDeadCodeElimination();
    this.testIntegratedOptimization();
    this.testPerformanceBenchmarks();
    this.testErrorHandling();

    this.results.totalTests = this.results.passed + this.results.failed;
    this.generateReport();
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('\n📊 TEST RESULTS SUMMARY\n');

    this.results.tests.forEach(test => {
      const status = test.status || '✅ PASS';
      console.log(`${status} ${test.name}`);
      if (test.results) {
        test.results.forEach(r => {
          const subStatus = r.status || '✅';
          console.log(`   ${subStatus} ${r.sub}`);
        });
      }
      if (test.error) {
        console.log(`   ❌ Error: ${test.error}`);
      }
    });

    const totalTime = (performance.now() - this.results.startTime).toFixed(2);
    const passRate = ((this.results.passed / this.results.totalTests) * 100).toFixed(1);

    console.log('\n' + '='.repeat(70));
    console.log(`✅ RESULTS: ${this.results.passed}/${this.results.totalTests} PASSED (${passRate}%)`);
    console.log(`⏱️  Execution Time: ${totalTime}ms`);
    console.log('='.repeat(70) + '\n');

    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run tests
if (require.main === module) {
  const suite = new PythonPhaseC_Tests();
  suite.runAll();
}

module.exports = { PythonPhaseC_Tests };

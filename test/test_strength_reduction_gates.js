/**
 * ============================================================================
 * STRENGTH REDUCTION OPTIMIZER - 5-GATE VERIFICATION SUITE
 * ============================================================================
 * 
 * This gate test suite verifies the Strength Reduction Optimizer against
 * 5 critical gates:
 * 
 * Gate 1: DETECTION - Can it find all SR opportunities?
 * Gate 2: ACCURACY - Does it correctly classify operations?
 * Gate 3: SAFETY - Does it properly block unsafe transformations?
 * Gate 4: TRANSFORMATION - Does it generate correct replacement code?
 * Gate 5: PERFORMANCE - Does it improve runtime performance metrics?
 * 
 * Each gate must pass 100% to proceed to next phase
 */

const {StrengthReductionAnalyzer} = require('../src/optimizers/javascript/algorithm/strength-reduction.js');

class StrengthReductionGateSuite {
  constructor() {
    this.analyzer = new StrengthReductionAnalyzer();
    this.gateResults = {
      gate1: { passed: 0, failed: 0, tests: [] },
      gate2: { passed: 0, failed: 0, tests: [] },
      gate3: { passed: 0, failed: 0, tests: [] },
      gate4: { passed: 0, failed: 0, tests: [] },
      gate5: { passed: 0, failed: 0, tests: [] }
    };
    this.totalMetrics = {
      correctDetections: 0,
      falsePositives: 0,
      falseNegatives: 0,
      safeBlockages: 0,
      unsafeAllows: 0
    };
  }

  // =========================================================================
  // GATE 1: DETECTION
  // =========================================================================
  // Test: Can it find all SR opportunities?
  // Target: 100% detection rate on valid operations

  testGate1_Detection() {
    console.log('\n' + '═'.repeat(70));
    console.log('  GATE 1: DETECTION - Finding all SR opportunities');
    console.log('═'.repeat(70));

    const tests = [
      {
        name: 'Detects multiplication by 8',
        ir: this.buildIR_BinOp('*', 8),
        expectCount: 1
      },
      {
        name: 'Detects division by 16',
        ir: this.buildIR_BinOp('/', 16),
        expectCount: 1
      },
      {
        name: 'Detects modulo by 32',
        ir: this.buildIR_BinOp('%', 32),
        expectCount: 1
      },
      {
        name: 'Detects multiple operations (2+1+1)',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [
              this.makeVarDecl('a', '*', 4),
              this.makeVarDecl('b', '/', 8),
              this.makeVarDecl('c', '%', 16)
            ]
          }]
        },
        expectCount: 3
      },
      {
        name: 'Detects all 5 basic powers (2,4,8,16,32)',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [2, 4, 8, 16, 32].map(p => this.makeVarDecl(`v${p}`, '*', p))
          }]
        },
        expectCount: 5
      }
    ];

    return this.runGateTests(tests, 'gate1');
  }

  // =========================================================================
  // GATE 2: ACCURACY
  // =========================================================================
  // Test: Does it correctly classify operations?
  // Target: 100% accuracy on classification

  testGate2_Accuracy() {
    console.log('\n' + '═'.repeat(70));
    console.log('  GATE 2: ACCURACY - Correct classification of operations');
    console.log('═'.repeat(70));

    const tests = [
      {
        name: 'Correctly identifies operator: multiply',
        ir: this.buildIR_BinOp('*', 8),
        check: (result) => result.reductions.length > 0 && result.reductions[0].operator === '*'
      },
      {
        name: 'Correctly identifies operator: divide',
        ir: this.buildIR_BinOp('/', 8),
        check: (result) => result.reductions.length > 0 && result.reductions[0].operator === '/'
      },
      {
        name: 'Correctly identifies operator: modulo',
        ir: this.buildIR_BinOp('%', 8),
        check: (result) => result.reductions.length > 0 && result.reductions[0].operator === '%'
      },
      {
        name: 'Correctly extracts constant: 2',
        ir: this.buildIR_BinOp('*', 2),
        check: (result) => result.reductions.length > 0 && result.reductions[0].constant === 2
      },
      {
        name: 'Correctly extracts constant: 128',
        ir: this.buildIR_BinOp('*', 128),
        check: (result) => result.reductions.length > 0 && result.reductions[0].constant === 128
      },
      {
        name: 'Correctly calculates exponent: log2(8) = 3',
        ir: this.buildIR_BinOp('*', 8),
        check: (result) => result.reductions.length > 0 && result.reductions[0].exponent === 3
      },
      {
        name: 'Correctly calculates exponent: log2(256) = 8',
        ir: this.buildIR_BinOp('*', 256),
        check: (result) => result.reductions.length > 0 && result.reductions[0].exponent === 8
      },
      {
        name: 'Statistics: multiplication count',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [
              this.makeVarDecl('a', '*', 4),
              this.makeVarDecl('b', '/', 8),
              this.makeVarDecl('c', '*', 16)
            ]
          }]
        },
        check: (result) => result.analysis.timesMultiplication === 2
      },
      {
        name: 'Statistics: division count',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [
              this.makeVarDecl('a', '*', 4),
              this.makeVarDecl('b', '/', 8),
              this.makeVarDecl('c', '*', 16)
            ]
          }]
        },
        check: (result) => result.analysis.timesDivision === 1
      }
    ];

    return this.runGateTestsWithCheck(tests, 'gate2');
  }

  // =========================================================================
  // GATE 3: SAFETY
  // =========================================================================
  // Test: Does it properly block unsafe transformations?
  // Target: 100% safety - no false positives, no unsafe reductions

  testGate3_Safety() {
    console.log('\n' + '═'.repeat(70));
    console.log('  GATE 3: SAFETY - Blocking unsafe transformations');
    console.log('═'.repeat(70));

    const tests = [
      {
        name: 'Blocks non-power-of-2: multiply by 3',
        ir: this.buildIR_BinOp('*', 3),
        expectCount: 0
      },
      {
        name: 'Blocks non-power-of-2: multiply by 7',
        ir: this.buildIR_BinOp('*', 7),
        expectCount: 0
      },
      {
        name: 'Blocks non-power-of-2: multiply by 100',
        ir: this.buildIR_BinOp('*', 100),
        expectCount: 0
      },
      {
        name: 'Blocks non-power-of-2: divide by 5',
        ir: this.buildIR_BinOp('/', 5),
        expectCount: 0
      },
      {
        name: 'Blocks non-power-of-2: modulo by 10',
        ir: this.buildIR_BinOp('%', 10),
        expectCount: 0
      },
      {
        name: 'Allows power-of-2 after blocking non-PoT',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [
              this.makeVarDecl('a', '*', 3),   // Should be blocked
              this.makeVarDecl('b', '*', 8)    // Should be allowed
            ]
          }]
        },
        expectCount: 1  // Only the 8 multiplication
      },
      {
        name: 'Blocks very large exponents (overflow risk)',
        ir: this.buildIR_BinOp('*', Math.pow(2, 31)),  // 2^31
        expectCount: 0  // Too large, potential overflow
      }
    ];

    return this.runGateTests(tests, 'gate3');
  }

  // =========================================================================
  // GATE 4: TRANSFORMATION
  // =========================================================================
  // Test: Does it generate correct replacement code?
  // Target: 100% correct transformations

  testGate4_Transformation() {
    console.log('\n' + '═'.repeat(70));
    console.log('  GATE 4: TRANSFORMATION - Correct replacement generation');
    console.log('═'.repeat(70));

    const tests = [
      {
        name: 'Multiply by 2 -> shift left by 1',
        ir: this.buildIR_BinOp('*', 2),
        check: (result) => {
          const t = result.reductions[0].transformation;
          return t.operator === '<<' && t.operand === 1;
        }
      },
      {
        name: 'Multiply by 4 -> shift left by 2',
        ir: this.buildIR_BinOp('*', 4),
        check: (result) => {
          const t = result.reductions[0].transformation;
          return t.operator === '<<' && t.operand === 2;
        }
      },
      {
        name: 'Multiply by 8 -> shift left by 3',
        ir: this.buildIR_BinOp('*', 8),
        check: (result) => {
          const t = result.reductions[0].transformation;
          return t.operator === '<<' && t.operand === 3;
        }
      },
      {
        name: 'Divide by 2 -> shift right by 1',
        ir: this.buildIR_BinOp('/', 2),
        check: (result) => {
          const t = result.reductions[0].transformation;
          return t.operator === '>>' && t.operand === 1;
        }
      },
      {
        name: 'Divide by 4 -> shift right by 2',
        ir: this.buildIR_BinOp('/', 4),
        check: (result) => {
          const t = result.reductions[0].transformation;
          return t.operator === '>>' && t.operand === 2;
        }
      },
      {
        name: 'Divide by 16 -> shift right by 4',
        ir: this.buildIR_BinOp('/', 16),
        check: (result) => {
          const t = result.reductions[0].transformation;
          return t.operator === '>>' && t.operand === 4;
        }
      },
      {
        name: 'Modulo by 8 -> bitwise AND by 7 (2^3-1)',
        ir: this.buildIR_BinOp('%', 8),
        check: (result) => {
          const t = result.reductions[0].transformation;
          return t.operator === '&' && t.operand === 7;
        }
      },
      {
        name: 'Modulo by 16 -> bitwise AND by 15 (2^4-1)',
        ir: this.buildIR_BinOp('%', 16),
        check: (result) => {
          const t = result.reductions[0].transformation;
          return t.operator === '&' && t.operand === 15;
        }
      },
      {
        name: 'Modulo by 32 -> bitwise AND by 31 (2^5-1)',
        ir: this.buildIR_BinOp('%', 32),
        check: (result) => {
          const t = result.reductions[0].transformation;
          return t.operator === '&' && t.operand === 31;
        }
      },
      {
        name: 'Transformation has description',
        ir: this.buildIR_BinOp('*', 8),
        check: (result) => {
          const t = result.reductions[0].transformation;
          return t.description && t.description.length > 0;
        }
      }
    ];

    return this.runGateTestsWithCheck(tests, 'gate4');
  }

  // =========================================================================
  // GATE 5: PERFORMANCE
  // =========================================================================
  // Test: Does it provide performance metrics/estimates?
  // Target: 100% complete metrics

  testGate5_Performance() {
    console.log('\n' + '═'.repeat(70));
    console.log('  GATE 5: PERFORMANCE - Valid metrics and estimates');
    console.log('═'.repeat(70));

    const tests = [
      {
        name: 'Analysis includes totalReduced count',
        ir: this.buildIR_BinOp('*', 8),
        check: (result) => typeof result.analysis.totalReduced === 'number' && result.analysis.totalReduced > 0
      },
      {
        name: 'Analysis includes totalOperations count',
        ir: this.buildIR_BinOp('*', 8),
        check: (result) => typeof result.analysis.totalOperations === 'number'
      },
      {
        name: 'Analysis includes timing stats',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [
              this.makeVarDecl('a', '*', 4),
              this.makeVarDecl('b', '/', 8),
              this.makeVarDecl('c', '%', 16)
            ]
          }]
        },
        check: (result) => {
          return result.analysis.timesMultiplication === 1 &&
                 result.analysis.timesDivision === 1 &&
                 result.analysis.timesModulo === 1;
        }
      },
      {
        name: 'Each reduction includes reason',
        ir: this.buildIR_BinOp('*', 8),
        check: (result) => result.reductions[0].reason && result.reductions[0].reason.length > 0
      },
      {
        name: 'Reduction includes locations array',
        ir: this.buildIR_BinOp('*', 8),
        check: (result) => Array.isArray(result.reductions[0].locations) && result.reductions[0].locations.length > 0
      },
      {
        name: 'Large batch: 100 multiplications',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: Array(100).fill(null).map((_, i) => this.makeVarDecl(`v${i}`, '*', 8))
          }]
        },
        check: (result) => result.reductions.length === 100
      }
    ];

    return this.runGateTestsWithCheck(tests, 'gate5');
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  buildIR_BinOp(operator, constant) {
    return {
      type: 'Program',
      body: [{
        type: 'BlockStatement',
        body: [{
          type: 'VariableDeclaration',
          kind: 'let',
          declarations: [{
            type: 'VariableDeclarator',
            id: {type: 'Identifier', name: 'result'},
            init: {
              type: 'BinaryExpression',
              operator,
              left: {type: 'Identifier', name: 'x'},
              right: {type: 'Literal', value: constant}
            }
          }]
        }]
      }]
    };
  }

  makeVarDecl(varName, operator, constant) {
    return {
      type: 'VariableDeclaration',
      kind: 'let',
      declarations: [{
        type: 'VariableDeclarator',
        id: {type: 'Identifier', name: varName},
        init: {
          type: 'BinaryExpression',
          operator,
          left: {type: 'Identifier', name: 'x'},
          right: {type: 'Literal', value: constant}
        }
      }]
    };
  }

  runGateTests(tests, gateName) {
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = this.analyzer.analyzeStrengthReduction(test.ir);
        const actualCount = result.reductions.length;
        const success = actualCount === test.expectCount;

        if (success) {
          console.log(`  ✓ ${test.name}`);
          passed++;
          this.gateResults[gateName].passed++;
          this.gateResults[gateName].tests.push({name: test.name, status: 'PASS'});
        } else {
          console.log(`  ✗ ${test.name}`);
          console.log(`    Expected: ${test.expectCount}, Found: ${actualCount}`);
          failed++;
          this.gateResults[gateName].failed++;
          this.gateResults[gateName].tests.push({name: test.name, status: 'FAIL'});
        }
      } catch (err) {
        console.log(`  ✗ ${test.name} (ERROR: ${err.message})`);
        failed++;
        this.gateResults[gateName].failed++;
        this.gateResults[gateName].tests.push({name: test.name, status: 'ERROR', error: err.message});
      }
    }

    return {passed, failed};
  }

  runGateTestsWithCheck(tests, gateName) {
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = this.analyzer.analyzeStrengthReduction(test.ir);
        const success = test.check(result);

        if (success) {
          console.log(`  ✓ ${test.name}`);
          passed++;
          this.gateResults[gateName].passed++;
          this.gateResults[gateName].tests.push({name: test.name, status: 'PASS'});
        } else {
          console.log(`  ✗ ${test.name}`);
          failed++;
          this.gateResults[gateName].failed++;
          this.gateResults[gateName].tests.push({name: test.name, status: 'FAIL'});
        }
      } catch (err) {
        console.log(`  ✗ ${test.name} (ERROR: ${err.message})`);
        failed++;
        this.gateResults[gateName].failed++;
        this.gateResults[gateName].tests.push({name: test.name, status: 'ERROR', error: err.message});
      }
    }

    return {passed, failed};
  }

  // =========================================================================
  // GATE SEQUENCING & REPORTING
  // =========================================================================

  runAllGates() {
    console.log('\n' + '═'.repeat(70));
    console.log('  STRENGTH REDUCTION OPTIMIZER - 5-GATE TEST SUITE');
    console.log('═'.repeat(70));

    // Run gates in sequence
    let g1 = this.testGate1_Detection();
    let g2 = this.testGate2_Accuracy();
    let g3 = this.testGate3_Safety();
    let g4 = this.testGate4_Transformation();
    let g5 = this.testGate5_Performance();

    // Generate report
    this.printGateReport(g1, g2, g3, g4, g5);

    // Determine if all gates pass
    const allPass = [g1, g2, g3, g4, g5].every(g => g.failed === 0);

    return {
      passed: allPass,
      gates: [g1, g2, g3, g4, g5],
      details: this.gateResults
    };
  }

  printGateReport(g1, g2, g3, g4, g5) {
    console.log('\n' + '═'.repeat(70));
    console.log('  GATE RESULTS SUMMARY');
    console.log('═'.repeat(70));

    const gates = [
      {num: 1, name: 'DETECTION', stats: g1},
      {num: 2, name: 'ACCURACY', stats: g2},
      {num: 3, name: 'SAFETY', stats: g3},
      {num: 4, name: 'TRANSFORMATION', stats: g4},
      {num: 5, name: 'PERFORMANCE', stats: g5}
    ];

    for (const gate of gates) {
      const total = gate.stats.passed + gate.stats.failed;
      const rate = ((gate.stats.passed / total) * 100).toFixed(1);
      const status = gate.stats.failed === 0 ? '✓ PASS' : '✗ FAIL';
      console.log(`  Gate ${gate.num} [${gate.name}]     ${status}`);
      console.log(`    Passed: ${gate.stats.passed}/${total} (${rate}%)`);
    }

    console.log('\n' + '─'.repeat(70));
    const totalPassed = gates.reduce((s, g) => s + g.stats.passed, 0);
    const totalTests = gates.reduce((s, g) => s + g.stats.passed + g.stats.failed, 0);
    const totalRate = ((totalPassed / totalTests) * 100).toFixed(1);
    console.log(`  TOTAL: ${totalPassed}/${totalTests} tests passed (${totalRate}%)`);
    const allPass = gates.every(g => g.stats.failed === 0);
    console.log(`  FINAL: ${allPass ? '✓ ALL GATES PASS' : '✗ GATES FAILED'}`);
    console.log('═'.repeat(70));
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

if (require.main === module) {
  const suite = new StrengthReductionGateSuite();
  const result = suite.runAllGates();

  process.exit(result.passed ? 0 : 1);
}

module.exports = {StrengthReductionGateSuite};

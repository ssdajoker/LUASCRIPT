/**
 * ============================================================================
 * STRENGTH REDUCTION CODE EMISSION - 5-GATE VERIFICATION SUITE
 * ============================================================================
 * 
 * This gate test suite verifies the Code Emission system against
 * 5 critical gates:
 * 
 * Gate 1: CODE GENERATION - Can it generate valid optimized code?
 * Gate 2: SUBSTITUTION - Are AST nodes correctly replaced?
 * Gate 3: CORRECTNESS - Are transformations semantically correct?
 * Gate 4: METRICS - Are performance metrics accurate?
 * Gate 5: RELIABILITY - Does it handle edge cases properly?
 * 
 * Each gate must pass 100% to proceed
 */

const {StrengthReductionAnalyzer} = require('../src/optimizers/javascript/algorithm/strength-reduction.js');
const {StrengthReductionEmitter} = require('../src/optimizers/javascript/algorithm/strength-reduction-emitter.js');

class StrengthReductionEmissionGateSuite {
  constructor() {
    this.analyzer = new StrengthReductionAnalyzer();
    this.emitter = new StrengthReductionEmitter();
    this.gateResults = {
      gate1: { passed: 0, failed: 0, tests: [] },
      gate2: { passed: 0, failed: 0, tests: [] },
      gate3: { passed: 0, failed: 0, tests: [] },
      gate4: { passed: 0, failed: 0, tests: [] },
      gate5: { passed: 0, failed: 0, tests: [] }
    };
  }

  // =========================================================================
  // GATE 1: CODE GENERATION
  // =========================================================================
  testGate1_CodeGeneration() {
    console.log('\n' + '═'.repeat(70));
    console.log('  GATE 1: CODE GENERATION - Valid optimized code output');
    console.log('═'.repeat(70));

    const tests = [
      {
        name: 'Generates code from optimized IR',
        ir: this.buildBinOpIR('*', 8),
        check: (result) => result.success && result.code && result.code.length > 0
      },
      {
        name: 'Multiplication emitted as shift left',
        ir: this.buildBinOpIR('*', 8),
        check: (result) => result.code.includes('<<') && !result.code.includes('*')
      },
      {
        name: 'Division emitted as shift right',
        ir: this.buildBinOpIR('/', 16),
        check: (result) => result.code.includes('>>') && !result.code.includes('/')
      },
      {
        name: 'Modulo emitted as bitwise AND',
        ir: this.buildBinOpIR('%', 32),
        check: (result) => result.code.includes('&') && !result.code.includes('%')
      },
      {
        name: 'Multiple operations emitted',
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
          return result.code.includes('<<') &&
                 result.code.includes('>>') &&
                 result.code.includes('&');
        }
      }
    ];

    return this.runTests(tests, 'gate1');
  }

  // =========================================================================
  // GATE 2: SUBSTITUTION
  // =========================================================================
  testGate2_Substitution() {
    console.log('\n' + '═'.repeat(70));
    console.log('  GATE 2: SUBSTITUTION - Correct AST node replacement');
    console.log('═'.repeat(70));

    const tests = [
      {
        name: 'Substitution object created',
        ir: this.buildBinOpIR('*', 8),
        check: (result) => {
          return result.substitutions &&
                 result.substitutions.length > 0;
        }
      },
      {
        name: 'Original node preserved',
        ir: this.buildBinOpIR('*', 8),
        check: (result) => {
          const sub = result.substitutions[0];
          return sub.original &&
                 sub.original.type === 'BinaryExpression' &&
                 sub.original.operator === '*';
        }
      },
      {
        name: 'Replacement node correct',
        ir: this.buildBinOpIR('*', 8),
        check: (result) => {
          const sub = result.substitutions[0];
          return sub.replacement &&
                 sub.replacement.type === 'BinaryExpression' &&
                 sub.replacement.operator === '<<';
        }
      },
      {
        name: 'Replacement has correct operand',
        ir: this.buildBinOpIR('*', 8),
        check: (result) => {
          const sub = result.substitutions[0];
          return sub.replacement.right.value === 3; // log2(8)
        }
      },
      {
        name: 'Multiple substitutions tracked',
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
        check: (result) => result.substitutions.length === 3
      },
      {
        name: 'Non-power-of-2 not substituted',
        ir: this.buildBinOpIR('*', 3),
        check: (result) => result.substitutions.length === 0
      }
    ];

    return this.runTests(tests, 'gate2');
  }

  // =========================================================================
  // GATE 3: CORRECTNESS
  // =========================================================================
  testGate3_Correctness() {
    console.log('\n' + '═'.repeat(70));
    console.log('  GATE 3: CORRECTNESS - Semantically correct transformations');
    console.log('═'.repeat(70));

    const tests = [
      {
        name: 'Bit shift left exponent: 2^1 → 1',
        ir: this.buildBinOpIR('*', 2),
        check: (result) => {
          const sub = result.substitutions[0];
          return sub.replacement.right.value === 1;
        }
      },
      {
        name: 'Bit shift left exponent: 2^3 → 3',
        ir: this.buildBinOpIR('*', 8),
        check: (result) => {
          const sub = result.substitutions[0];
          return sub.replacement.right.value === 3;
        }
      },
      {
        name: 'Bit shift right exponent: 2^4 → 4',
        ir: this.buildBinOpIR('/', 16),
        check: (result) => {
          const sub = result.substitutions[0];
          return sub.replacement.right.value === 4;
        }
      },
      {
        name: 'Bitwise AND mask: 2^5-1 → 31',
        ir: this.buildBinOpIR('%', 32),
        check: (result) => {
          const sub = result.substitutions[0];
          return sub.replacement.right.value === 31;
        }
      },
      {
        name: 'Bitwise AND mask: 2^8-1 → 255',
        ir: this.buildBinOpIR('%', 256),
        check: (result) => {
          const sub = result.substitutions[0];
          return sub.replacement.right.value === 255;
        }
      },
      {
        name: 'Left operand unchanged',
        ir: this.buildBinOpIR('*', 8),
        check: (result) => {
          const sub = result.substitutions[0];
          const origLeft = sub.original.left;
          const replLeft = sub.replacement.left;
          return replLeft.type === origLeft.type &&
                 replLeft.name === origLeft.name;
        }
      }
    ];

    return this.runTests(tests, 'gate3');
  }

  // =========================================================================
  // GATE 4: METRICS
  // =========================================================================
  testGate4_Metrics() {
    console.log('\n' + '═'.repeat(70));
    console.log('  GATE 4: METRICS - Accurate performance estimation');
    console.log('═'.repeat(70));

    const tests = [
      {
        name: 'Operations optimized count correct',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [
              this.makeVarDecl('a', '*', 8),
              this.makeVarDecl('b', '/', 16)
            ]
          }]
        },
        check: (result) => result.metrics.operationsOptimized === 2
      },
      {
        name: 'Bytes reduced estimated',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [this.makeVarDecl('a', '*', 8)]
          }]
        },
        check: (result) => result.metrics.bytesReduced > 0
      },
      {
        name: 'Complexity reduction calculated',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [this.makeVarDecl('a', '*', 8)]
          }]
        },
        check: (result) => result.metrics.complexityReduced > 0
      },
      {
        name: 'Speedup estimation generated',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [this.makeVarDecl('a', '*', 8)]
          }]
        },
        check: (result) => result.metrics.estimatedSpeedup > 1.0
      },
      {
        name: 'Speedup scales with operations',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [
              this.makeVarDecl('a', '*', 8),
              this.makeVarDecl('b', '/', 16),
              this.makeVarDecl('c', '%', 32)
            ]
          }]
        },
        check: (result) => {
          // More operations should give higher speedup
          return result.metrics.estimatedSpeedup > 1.05;
        }
      },
      {
        name: 'Code size metrics tracked',
        ir: this.buildBinOpIR('*', 8),
        check: (result) => {
          return result.metrics.emittedCode &&
                 result.metrics.emittedCode.length > 0 &&
                 result.metrics.emittedCode[0].size > 0;
        }
      }
    ];

    return this.runTests(tests, 'gate4');
  }

  // =========================================================================
  // GATE 5: RELIABILITY
  // =========================================================================
  testGate5_Reliability() {
    console.log('\n' + '═'.repeat(70));
    console.log('  GATE 5: RELIABILITY - Robust edge case handling');
    console.log('═'.repeat(70));

    const tests = [
      {
        name: 'Empty program handled',
        ir: {type: 'Program', body: []},
        check: (result) => result.success
      },
      {
        name: 'Single operation handled',
        ir: this.buildBinOpIR('*', 8),
        check: (result) => result.success
      },
      {
        name: 'Large batch (10 operations)',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: Array(10).fill(null).map((_, i) => this.makeVarDecl(`v${i}`, '*', 8))
          }]
        },
        check: (result) => {
          return result.success &&
                 result.substitutions.length === 10 &&
                 result.metrics.operationsOptimized === 10;
        }
      },
      {
        name: 'Mixed operations handled',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [
              this.makeVarDecl('a', '*', 3),   // Non-PoT
              this.makeVarDecl('b', '*', 8),   // PoT
              this.makeVarDecl('c', '*', 7),   // Non-PoT
              this.makeVarDecl('d', '*', 16)   // PoT
            ]
          }]
        },
        check: (result) => {
          return result.success &&
                 result.substitutions.length === 2 &&
                 result.metrics.operationsOptimized === 2;
        }
      },
      {
        name: 'Invalid input returns error',
        ir: null,
        check: (result) => !result.success && result.error
      },
      {
        name: 'Large exponent handled (2^10)',
        ir: this.buildBinOpIR('*', 1024),
        check: (result) => {
          return result.success &&
                 result.substitutions.length > 0 &&
                 result.substitutions[0].exponent === 10;
        }
      }
    ];

    return this.runTests(tests, 'gate5');
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  buildBinOpIR(operator, constant) {
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

  runTests(tests, gateName) {
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const analysis = this.analyzer.analyzeStrengthReduction(test.ir);
        const result = this.emitter.emit(test.ir, analysis);

        const success = test.check(result);

        if (success) {
          console.log(`  ✓ ${test.name}`);
          passed++;
          this.gateResults[gateName].passed++;
        } else {
          console.log(`  ✗ ${test.name}`);
          failed++;
          this.gateResults[gateName].failed++;
        }
      } catch (err) {
        console.log(`  ✗ ${test.name} (ERROR: ${err.message})`);
        failed++;
        this.gateResults[gateName].failed++;
      }
    }

    return {passed, failed};
  }

  // =========================================================================
  // REPORTING
  // =========================================================================

  runAllGates() {
    console.log('\n' + '═'.repeat(70));
    console.log('  STRENGTH REDUCTION EMISSION - 5-GATE TEST SUITE');
    console.log('═'.repeat(70));

    let g1 = this.testGate1_CodeGeneration();
    let g2 = this.testGate2_Substitution();
    let g3 = this.testGate3_Correctness();
    let g4 = this.testGate4_Metrics();
    let g5 = this.testGate5_Reliability();

    this.printGateReport(g1, g2, g3, g4, g5);

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
      {num: 1, name: 'CODE GENERATION', stats: g1},
      {num: 2, name: 'SUBSTITUTION', stats: g2},
      {num: 3, name: 'CORRECTNESS', stats: g3},
      {num: 4, name: 'METRICS', stats: g4},
      {num: 5, name: 'RELIABILITY', stats: g5}
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
  const suite = new StrengthReductionEmissionGateSuite();
  const result = suite.runAllGates();

  process.exit(result.passed ? 0 : 1);
}

module.exports = {StrengthReductionEmissionGateSuite};

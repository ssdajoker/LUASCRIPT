/**
 * Comprehensive Test Corpus for Strength Reduction Code Emission
 * Tests all categories: basic emission, transformations, metrics, and integration
 * 
 * Category Coverage:
 * 1. Basic Emission - Simple transformations with correct output
 * 2. Code Substitution - Proper AST node replacement
 * 3. Transformation Correctness - All 3 transformation types
 * 4. Metrics Calculation - Performance metrics accuracy
 * 5. Integration - SR analysis + Emission pipeline
 * 6. Edge Cases - Complex expressions, nested operations
 */

const {StrengthReductionAnalyzer} = require('../src/optimizers/javascript/algorithm/strength-reduction.js');
const {StrengthReductionEmitter} = require('../src/optimizers/javascript/algorithm/strength-reduction-emitter.js');

class StrengthReductionEmissionCorpus {
  constructor() {
    this.analyzer = new StrengthReductionAnalyzer();
    this.emitter = new StrengthReductionEmitter();
    this.testCases = [];
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  /**
   * ===== CATEGORY 1: BASIC EMISSION =====
   */
  testCategory1_BasicEmission() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║ Category 1: Basic Code Emission                   ║');
    console.log('╚════════════════════════════════════════════════════╝');

    const tests = [
      {
        name: 'Emit multiplication to shift left',
        ir: {
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
                  operator: '*',
                  left: {type: 'Identifier', name: 'x'},
                  right: {type: 'Literal', value: 8}
                }
              }]
            }]
          }]
        },
        check: (result) => {
          return result.success &&
                 result.code &&
                 result.code.includes('<<') &&
                 result.code.includes('3') &&
                 !result.code.includes('*');
        }
      },
      {
        name: 'Emit division to shift right',
        ir: {
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
                  operator: '/',
                  left: {type: 'Identifier', name: 'x'},
                  right: {type: 'Literal', value: 16}
                }
              }]
            }]
          }]
        },
        check: (result) => {
          return result.success &&
                 result.code &&
                 result.code.includes('>>') &&
                 result.code.includes('4') &&
                 !result.code.includes('/');
        }
      },
      {
        name: 'Emit modulo to bitwise AND',
        ir: {
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
                  operator: '%',
                  left: {type: 'Identifier', name: 'x'},
                  right: {type: 'Literal', value: 32}
                }
              }]
            }]
          }]
        },
        check: (result) => {
          return result.success &&
                 result.code &&
                 result.code.includes('&') &&
                 (result.code.includes('0x1f') || result.code.includes('31')) &&
                 !result.code.includes('%');
        }
      }
    ];

    return this.runTests(tests, 'category1');
  }

  /**
   * ===== CATEGORY 2: CODE SUBSTITUTION =====
   */
  testCategory2_Substitution() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║ Category 2: Code Substitution & AST Replacement   ║');
    console.log('╚════════════════════════════════════════════════════╝');

    const tests = [
      {
        name: 'Substitution creates new IR',
        ir: this.buildBinOpIR('*', 8),
        check: (result) => result.ir && result.ir.type === 'Program'
      },
      {
        name: 'Original node preserved in substitution',
        ir: this.buildBinOpIR('*', 8),
        check: (result) => {
          return result.substitutions &&
                 result.substitutions.length > 0 &&
                 result.substitutions[0].original &&
                 result.substitutions[0].original.type === 'BinaryExpression';
        }
      },
      {
        name: 'Replacement node properly formed',
        ir: this.buildBinOpIR('*', 8),
        check: (result) => {
          return result.substitutions &&
                 result.substitutions.length > 0 &&
                 result.substitutions[0].replacement &&
                 result.substitutions[0].replacement.operator === '<<';
        }
      },
      {
        name: 'Multiple substitutions applied',
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
          return result.substitutions &&
                 result.substitutions.length === 3;
        }
      }
    ];

    return this.runTests(tests, 'category2');
  }

  /**
   * ===== CATEGORY 3: TRANSFORMATION CORRECTNESS =====
   */
  testCategory3_Transformations() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║ Category 3: Transformation Correctness             ║');
    console.log('╚════════════════════════════════════════════════════╝');

    const tests = [
      {
        name: 'Bit shift left exponent correct',
        ir: this.buildBinOpIR('*', 8),
        check: (result) => {
          const sub = result.substitutions[0];
          return sub.transformation.operator === '<<' &&
                 sub.replacement.right.value === 3;
        }
      },
      {
        name: 'Bit shift right exponent correct',
        ir: this.buildBinOpIR('/', 16),
        check: (result) => {
          const sub = result.substitutions[0];
          return sub.transformation.operator === '>>' &&
                 sub.replacement.right.value === 4;
        }
      },
      {
        name: 'Bitwise AND mask correct (32)',
        ir: this.buildBinOpIR('%', 32),
        check: (result) => {
          const sub = result.substitutions[0];
          return sub.transformation.operator === '&' &&
                 sub.replacement.right.value === 31;
        }
      },
      {
        name: 'Bitwise AND mask correct (256)',
        ir: this.buildBinOpIR('%', 256),
        check: (result) => {
          const sub = result.substitutions[0];
          return sub.transformation.operator === '&' &&
                 sub.replacement.right.value === 255;
        }
      },
      {
        name: 'Left operand preserved',
        ir: this.buildBinOpIR('*', 8),
        check: (result) => {
          const sub = result.substitutions[0];
          const origLeft = sub.original.left;
          const replLeft = sub.replacement.left;
          return replLeft.name === origLeft.name;
        }
      }
    ];

    return this.runTests(tests, 'category3');
  }

  /**
   * ===== CATEGORY 4: METRICS =====
   */
  testCategory4_Metrics() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║ Category 4: Metrics Calculation                   ║');
    console.log('╚════════════════════════════════════════════════════╝');

    const tests = [
      {
        name: 'Operations optimized count',
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
        name: 'Bytes reduced calculated',
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
        check: (result) => result.metrics.bytesReduced > 0
      },
      {
        name: 'Complexity reduction estimated',
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
        check: (result) => result.metrics.complexityReduced > 0
      },
      {
        name: 'Speedup estimation',
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
        check: (result) => result.metrics.estimatedSpeedup > 1.0
      }
    ];

    return this.runTests(tests, 'category4');
  }

  /**
   * ===== CATEGORY 5: INTEGRATION =====
   */
  testCategory5_Integration() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║ Category 5: Analyzer + Emitter Integration         ║');
    console.log('╚════════════════════════════════════════════════════╝');

    const tests = [
      {
        name: 'Full pipeline: analyze then emit',
        ir: this.buildBinOpIR('*', 8),
        fullPipeline: true,
        check: (analysis, emissionResult) => {
          return analysis.reductions.length > 0 &&
                 emissionResult.success &&
                 emissionResult.code.includes('<<');
        }
      },
      {
        name: 'Multiple operations pipeline',
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
        fullPipeline: true,
        check: (analysis, emissionResult) => {
          return analysis.reductions.length === 3 &&
                 emissionResult.substitutions.length === 3 &&
                 emissionResult.metrics.operationsOptimized === 3;
        }
      },
      {
        name: 'Analysis metrics match emission',
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
        fullPipeline: true,
        check: (analysis, emissionResult) => {
          return analysis.analysis.totalReduced === emissionResult.metrics.operationsOptimized;
        }
      }
    ];

    return this.runIntegrationTests(tests, 'category5');
  }

  /**
   * ===== CATEGORY 6: EDGE CASES =====
   */
  testCategory6_EdgeCases() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║ Category 6: Edge Cases & Complex Expressions      ║');
    console.log('╚════════════════════════════════════════════════════╝');

    const tests = [
      {
        name: 'Non-power-of-2 not emitted',
        ir: this.buildBinOpIR('*', 3),
        check: (result) => {
          return result.substitutions.length === 0;
        }
      },
      {
        name: 'Mixed safe/unsafe operations',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [
              this.makeVarDecl('a', '*', 3),   // Blocked
              this.makeVarDecl('b', '*', 8),   // Emitted
              this.makeVarDecl('c', '*', 7)    // Blocked
            ]
          }]
        },
        check: (result) => {
          return result.substitutions.length === 1;
        }
      },
      {
        name: 'Large exponent handling',
        ir: this.buildBinOpIR('*', 1024),  // 2^10
        check: (result) => {
          return result.substitutions.length > 0 &&
                 result.substitutions[0].exponent === 10;
        }
      },
      {
        name: 'Empty IR handling',
        ir: {type: 'Program', body: []},
        check: (result) => result.success
      }
    ];

    return this.runTests(tests, 'category6');
  }

  /**
   * Utility Methods
   */

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

  runTests(tests, category) {
    let passed = 0;
    let failed = 0;
    const label = category ? `[${category}] ` : "";

    for (const test of tests) {
      try {
        const analysis = this.analyzer.analyzeStrengthReduction(test.ir);
        const emissionResult = this.emitter.emit(test.ir, analysis);

        const success = test.check(emissionResult);

        if (success) {
          console.log(`  ✓ ${label}${test.name}`);
          passed++;
          this.results.passed.push(`${label}${test.name}`);
        } else {
          console.log(`  ✗ ${label}${test.name}`);
          failed++;
          this.results.failed.push(`${label}${test.name}`);
        }
      } catch (err) {
        console.log(`  ✗ ${label}${test.name} (ERROR: ${err.message})`);
        failed++;
        this.results.failed.push(`${label}${test.name}`);
      }
    }

    return { passed, failed };
  }

  runIntegrationTests(tests, category) {
    let passed = 0;
    let failed = 0;
    const label = category ? `[${category}] ` : "";

    for (const test of tests) {
      try {
        const analysis = this.analyzer.analyzeStrengthReduction(test.ir);
        const emissionResult = this.emitter.emit(test.ir, analysis);

        const success = test.check(analysis, emissionResult);

        if (success) {
          console.log(`  ✓ ${label}${test.name}`);
          passed++;
          this.results.passed.push(`${label}${test.name}`);
        } else {
          console.log(`  ✗ ${label}${test.name}`);
          failed++;
          this.results.failed.push(`${label}${test.name}`);
        }
      } catch (err) {
        console.log(`  ✗ ${label}${test.name} (ERROR: ${err.message})`);
        failed++;
        this.results.failed.push(`${label}${test.name}`);
      }
    }

    return { passed, failed };
  }

  /**
   * Run all tests
   */
  runAllTests() {
    console.log('\n════════════════════════════════════════════════════');
    console.log('   STRENGTH REDUCTION EMISSION - TEST CORPUS');
    console.log('════════════════════════════════════════════════════');

    const stats = {
      totalPassed: 0,
      totalFailed: 0
    };

    let result;

    result = this.testCategory1_BasicEmission();
    stats.totalPassed += result.passed;
    stats.totalFailed += result.failed;

    result = this.testCategory2_Substitution();
    stats.totalPassed += result.passed;
    stats.totalFailed += result.failed;

    result = this.testCategory3_Transformations();
    stats.totalPassed += result.passed;
    stats.totalFailed += result.failed;

    result = this.testCategory4_Metrics();
    stats.totalPassed += result.passed;
    stats.totalFailed += result.failed;

    result = this.testCategory5_Integration();
    stats.totalPassed += result.passed;
    stats.totalFailed += result.failed;

    result = this.testCategory6_EdgeCases();
    stats.totalPassed += result.passed;
    stats.totalFailed += result.failed;

    // Summary
    console.log('\n════════════════════════════════════════════════════');
    console.log('                   TEST SUMMARY');
    console.log('════════════════════════════════════════════════════');
    console.log(`  Total Passed: ${stats.totalPassed}`);
    console.log(`  Total Failed: ${stats.totalFailed}`);
    console.log(`  Success Rate: ${((stats.totalPassed / (stats.totalPassed + stats.totalFailed)) * 100).toFixed(1)}%`);

    if (stats.totalFailed > 0) {
      console.log('\nFailed Tests:');
      this.results.failed.forEach(name => console.log(`  - ${name}`));
    }

    return {
      passed: stats.totalPassed,
      failed: stats.totalFailed,
      total: stats.totalPassed + stats.totalFailed
    };
  }
}

// Export and run
if (require.main === module) {
  const corpus = new StrengthReductionEmissionCorpus();
  const results = corpus.runAllTests();

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = {StrengthReductionEmissionCorpus};

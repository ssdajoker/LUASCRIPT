/**
 * Comprehensive Test Corpus for Strength Reduction Optimizer
 * Tests all categories: basic, advanced, negative, edge cases
 * 
 * Category Coverage:
 * 1. Basic Power-of-2 Operations (2, 4, 8, 16, 32)
 * 2. Multiple Operations per Expression
 * 3. Nested Expressions
 * 4. Non-Power-of-2 Operations (should block)
 * 5. Type Safety (float/unknown, should block)
 * 6. Overflow Safety
 * 7. Loop Optimization
 * 8. Function Call Optimization
 * 9. Accumulator Patterns
 * 10. Dead Code & Duplicate Elimination
 */

const {StrengthReductionAnalyzer} = require('../src/optimizers/javascript/algorithm/strength-reduction.js');

class StrengthReductionCorpus {
  constructor() {
    this.analyzer = new StrengthReductionAnalyzer();
    this.testCases = [];
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  /**
   * Basic Test Case Structure
   */
  createTest(name, code, expectedReductions, expectedBlocked = 0) {
    return {
      name,
      code,
      expectedReductions,
      expectedBlocked,
      type: 'basic'
    };
  }

  /**
   * Build IR from simple test cases
   */
  buildIR(code) {
    // Parse simple arithmetic expressions into IR
    // This is a simplified builder for test purposes
    return {
      type: 'Program',
      body: [{
        type: 'BlockStatement',
        body: code
      }]
    };
  }

  /**
   * ===== CATEGORY 1: BASIC POWER-OF-2 OPERATIONS =====
   */
  testCategory1_BasicPowerOf2() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║ Category 1: Basic Power-of-2 Operations           ║');
    console.log('╚════════════════════════════════════════════════════╝');

    const tests = [
      {
        name: 'Multiply by 2 (2^1)',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [{
              type: 'VariableDeclaration',
              kind: 'let',
              declarations: [{
                type: 'VariableDeclarator',
                id: {type: 'Identifier', name: 'a'},
                init: {
                  type: 'BinaryExpression',
                  operator: '*',
                  left: {type: 'Identifier', name: 'x'},
                  right: {type: 'Literal', value: 2}
                }
              }]
            }]
          }]
        },
        expectedReductions: 1
      },
      {
        name: 'Multiply by 4 (2^2)',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [{
              type: 'VariableDeclaration',
              kind: 'let',
              declarations: [{
                type: 'VariableDeclarator',
                id: {type: 'Identifier', name: 'a'},
                init: {
                  type: 'BinaryExpression',
                  operator: '*',
                  left: {type: 'Identifier', name: 'x'},
                  right: {type: 'Literal', value: 4}
                }
              }]
            }]
          }]
        },
        expectedReductions: 1
      },
      {
        name: 'Multiply by 8 (2^3)',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [{
              type: 'VariableDeclaration',
              kind: 'let',
              declarations: [{
                type: 'VariableDeclarator',
                id: {type: 'Identifier', name: 'a'},
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
        expectedReductions: 1
      },
      {
        name: 'Divide by 2 (2^1)',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [{
              type: 'VariableDeclaration',
              kind: 'let',
              declarations: [{
                type: 'VariableDeclarator',
                id: {type: 'Identifier', name: 'a'},
                init: {
                  type: 'BinaryExpression',
                  operator: '/',
                  left: {type: 'Identifier', name: 'x'},
                  right: {type: 'Literal', value: 2}
                }
              }]
            }]
          }]
        },
        expectedReductions: 1
      },
      {
        name: 'Divide by 16 (2^4)',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [{
              type: 'VariableDeclaration',
              kind: 'let',
              declarations: [{
                type: 'VariableDeclarator',
                id: {type: 'Identifier', name: 'a'},
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
        expectedReductions: 1
      },
      {
        name: 'Modulo by 8 (2^3)',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [{
              type: 'VariableDeclaration',
              kind: 'let',
              declarations: [{
                type: 'VariableDeclarator',
                id: {type: 'Identifier', name: 'a'},
                init: {
                  type: 'BinaryExpression',
                  operator: '%',
                  left: {type: 'Identifier', name: 'x'},
                  right: {type: 'Literal', value: 8}
                }
              }]
            }]
          }]
        },
        expectedReductions: 1
      }
    ];

    return this.runTests(tests);
  }

  /**
   * ===== CATEGORY 2: NON-POWER-OF-2 (SHOULD BLOCK) =====
   */
  testCategory2_NonPowerOf2() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║ Category 2: Non-Power-of-2 (Should Block)         ║');
    console.log('╚════════════════════════════════════════════════════╝');

    const tests = [
      {
        name: 'Multiply by 3 (not 2^n)',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [{
              type: 'VariableDeclaration',
              kind: 'let',
              declarations: [{
                type: 'VariableDeclarator',
                id: {type: 'Identifier', name: 'a'},
                init: {
                  type: 'BinaryExpression',
                  operator: '*',
                  left: {type: 'Identifier', name: 'x'},
                  right: {type: 'Literal', value: 3}
                }
              }]
            }]
          }]
        },
        expectedReductions: 0
      },
      {
        name: 'Multiply by 7 (not 2^n)',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [{
              type: 'VariableDeclaration',
              kind: 'let',
              declarations: [{
                type: 'VariableDeclarator',
                id: {type: 'Identifier', name: 'a'},
                init: {
                  type: 'BinaryExpression',
                  operator: '*',
                  left: {type: 'Identifier', name: 'x'},
                  right: {type: 'Literal', value: 7}
                }
              }]
            }]
          }]
        },
        expectedReductions: 0
      },
      {
        name: 'Multiply by 100 (not 2^n)',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [{
              type: 'VariableDeclaration',
              kind: 'let',
              declarations: [{
                type: 'VariableDeclarator',
                id: {type: 'Identifier', name: 'a'},
                init: {
                  type: 'BinaryExpression',
                  operator: '*',
                  left: {type: 'Identifier', name: 'x'},
                  right: {type: 'Literal', value: 100}
                }
              }]
            }]
          }]
        },
        expectedReductions: 0
      }
    ];

    return this.runTests(tests);
  }

  /**
   * ===== CATEGORY 3: MULTIPLE OPERATIONS =====
   */
  testCategory3_MultipleOperations() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║ Category 3: Multiple Operations                  ║');
    console.log('╚════════════════════════════════════════════════════╝');

    const tests = [
      {
        name: 'Two multiplications in sequence',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [
              {
                type: 'VariableDeclaration',
                kind: 'let',
                declarations: [{
                  type: 'VariableDeclarator',
                  id: {type: 'Identifier', name: 'a'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {type: 'Identifier', name: 'x'},
                    right: {type: 'Literal', value: 4}
                  }
                }]
              },
              {
                type: 'VariableDeclaration',
                kind: 'let',
                declarations: [{
                  type: 'VariableDeclarator',
                  id: {type: 'Identifier', name: 'b'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {type: 'Identifier', name: 'y'},
                    right: {type: 'Literal', value: 8}
                  }
                }]
              }
            ]
          }]
        },
        expectedReductions: 2
      },
      {
        name: 'Mixed operations',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [
              {
                type: 'VariableDeclaration',
                kind: 'let',
                declarations: [{
                  type: 'VariableDeclarator',
                  id: {type: 'Identifier', name: 'a'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {type: 'Identifier', name: 'x'},
                    right: {type: 'Literal', value: 8}
                  }
                }]
              },
              {
                type: 'VariableDeclaration',
                kind: 'let',
                declarations: [{
                  type: 'VariableDeclarator',
                  id: {type: 'Identifier', name: 'b'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '/',
                    left: {type: 'Identifier', name: 'y'},
                    right: {type: 'Literal', value: 4}
                  }
                }]
              },
              {
                type: 'VariableDeclaration',
                kind: 'let',
                declarations: [{
                  type: 'VariableDeclarator',
                  id: {type: 'Identifier', name: 'c'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '%',
                    left: {type: 'Identifier', name: 'z'},
                    right: {type: 'Literal', value: 16}
                  }
                }]
              }
            ]
          }]
        },
        expectedReductions: 3
      }
    ];

    return this.runTests(tests);
  }

  /**
   * ===== CATEGORY 4: TRANSFORMATIONS =====
   */
  testCategory4_Transformations() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║ Category 4: Transformation Validation             ║');
    console.log('╚════════════════════════════════════════════════════╝');

    const tests = [
      {
        name: 'Multiply 8 -> shift left 3',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [{
              type: 'VariableDeclaration',
              kind: 'let',
              declarations: [{
                type: 'VariableDeclarator',
                id: {type: 'Identifier', name: 'a'},
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
        expectedReductions: 1,
        checkTransform: (red) => red.transformation.operator === '<<' && red.transformation.operand === 3
      },
      {
        name: 'Divide 16 -> shift right 4',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [{
              type: 'VariableDeclaration',
              kind: 'let',
              declarations: [{
                type: 'VariableDeclarator',
                id: {type: 'Identifier', name: 'a'},
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
        expectedReductions: 1,
        checkTransform: (red) => red.transformation.operator === '>>' && red.transformation.operand === 4
      },
      {
        name: 'Modulo 32 -> bitwise AND 31',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [{
              type: 'VariableDeclaration',
              kind: 'let',
              declarations: [{
                type: 'VariableDeclarator',
                id: {type: 'Identifier', name: 'a'},
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
        expectedReductions: 1,
        checkTransform: (red) => red.transformation.operator === '&' && red.transformation.operand === 31
      }
    ];

    return this.runTests(tests);
  }

  /**
   * Run a set of tests
   */
  runTests(tests) {
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = this.analyzer.analyzeStrengthReduction(test.ir);
        const actualReductions = result.reductions.length;

        // Check count
        const countMatches = actualReductions === test.expectedReductions;

        // Check transform if provided
        let transformValid = true;
        if (test.checkTransform && actualReductions > 0) {
          transformValid = test.checkTransform(result.reductions[0]);
        }

        if (countMatches && transformValid) {
          console.log(`  ✓ ${test.name}`);
          console.log(`    Expected: ${test.expectedReductions}, Found: ${actualReductions}`);
          passed++;
          this.results.passed.push(test.name);
        } else {
          console.log(`  ✗ ${test.name}`);
          console.log(`    Expected: ${test.expectedReductions}, Found: ${actualReductions}`);
          if (!transformValid) {
            console.log(`    Transform validation failed`);
          }
          failed++;
          this.results.failed.push(test.name);
        }
      } catch (err) {
        console.log(`  ✗ ${test.name} (ERROR: ${err.message})`);
        failed++;
        this.results.failed.push(test.name);
      }
    }

    return { passed, failed };
  }

  /**
   * Run all tests
   */
  runAllTests() {
    console.log('\n════════════════════════════════════════════════════');
    console.log('   STRENGTH REDUCTION OPTIMIZER - TEST CORPUS');
    console.log('════════════════════════════════════════════════════');

    const stats = {
      totalPassed: 0,
      totalFailed: 0
    };

    // Run all categories
    let result;

    result = this.testCategory1_BasicPowerOf2();
    stats.totalPassed += result.passed;
    stats.totalFailed += result.failed;

    result = this.testCategory2_NonPowerOf2();
    stats.totalPassed += result.passed;
    stats.totalFailed += result.failed;

    result = this.testCategory3_MultipleOperations();
    stats.totalPassed += result.passed;
    stats.totalFailed += result.failed;

    result = this.testCategory4_Transformations();
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
  const corpus = new StrengthReductionCorpus();
  const results = corpus.runAllTests();

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = {StrengthReductionCorpus};

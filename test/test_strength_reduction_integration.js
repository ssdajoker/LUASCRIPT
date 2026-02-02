#!/usr/bin/env node

/**
 * @fileoverview Strength Reduction Integration Tests
 * 
 * Tests the full integration of analyzer + emitter with transpiler pipeline
 * 
 * @module test-sr-integration
 * @phase 3.4
 * @task 4.5
 */

const {SRIntegrationHelper} = require('./sr-integration-helpers.js');

class SRIntegrationTestSuite {
  constructor() {
    this.helper = new SRIntegrationHelper();
    this.testResults = {};
  }

  // =========================================================================
  // CATEGORY 1: BASIC TRANSFORMATIONS
  // =========================================================================
  testCategory1_BasicTransformations() {
    console.log('\n' + '═'.repeat(70));
    console.log('  CATEGORY 1: BASIC TRANSFORMATIONS');
    console.log('═'.repeat(70));

    const tests = [
      {
        name: 'Simple multiplication: x * 2 → x << 1',
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
        }
      },
      {
        name: 'Simple division: x / 4 → x >> 2',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [{
              type: 'VariableDeclaration',
              kind: 'let',
              declarations: [{
                type: 'VariableDeclarator',
                id: {type: 'Identifier', name: 'b'},
                init: {
                  type: 'BinaryExpression',
                  operator: '/',
                  left: {type: 'Identifier', name: 'x'},
                  right: {type: 'Literal', value: 4}
                }
              }]
            }]
          }]
        }
      },
      {
        name: 'Simple modulo: x % 8 → x & 7',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [{
              type: 'VariableDeclaration',
              kind: 'let',
              declarations: [{
                type: 'VariableDeclarator',
                id: {type: 'Identifier', name: 'c'},
                init: {
                  type: 'BinaryExpression',
                  operator: '%',
                  left: {type: 'Identifier', name: 'x'},
                  right: {type: 'Literal', value: 8}
                }
              }]
            }]
          }]
        }
      },
      {
        name: 'Multiple operations in same scope',
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
                    operator: '/',
                    left: {type: 'Identifier', name: 'y'},
                    right: {type: 'Literal', value: 8}
                  }
                }]
              }
            ]
          }]
        }
      },
      {
        name: 'Nested in ExpressionStatement',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [{
              type: 'ExpressionStatement',
              expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {type: 'Identifier', name: 'result'},
                right: {
                  type: 'BinaryExpression',
                  operator: '*',
                  left: {type: 'Identifier', name: 'value'},
                  right: {type: 'Literal', value: 16}
                }
              }
            }]
          }]
        }
      }
    ];

    return this.helper.testMultiple(tests);
  }

  // =========================================================================
  // CATEGORY 2: MULTIPLE OPERATIONS
  // =========================================================================
  testCategory2_MultipleOperations() {
    console.log('\n' + '═'.repeat(70));
    console.log('  CATEGORY 2: MULTIPLE OPERATIONS');
    console.log('═'.repeat(70));

    const tests = [
      {
        name: 'All three types in one function',
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
                  id: {type: 'Identifier', name: 'mul'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {type: 'Identifier', name: 'a'},
                    right: {type: 'Literal', value: 8}
                  }
                }]
              },
              {
                type: 'VariableDeclaration',
                kind: 'let',
                declarations: [{
                  type: 'VariableDeclarator',
                  id: {type: 'Identifier', name: 'div'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '/',
                    left: {type: 'Identifier', name: 'b'},
                    right: {type: 'Literal', value: 16}
                  }
                }]
              },
              {
                type: 'VariableDeclaration',
                kind: 'let',
                declarations: [{
                  type: 'VariableDeclarator',
                  id: {type: 'Identifier', name: 'mod'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '%',
                    left: {type: 'Identifier', name: 'c'},
                    right: {type: 'Literal', value: 32}
                  }
                }]
              }
            ]
          }]
        }
      },
      {
        name: 'Sequential operations',
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
                    right: {type: 'Literal', value: 2}
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
                    left: {type: 'Identifier', name: 'a'},
                    right: {type: 'Literal', value: 4}
                  }
                }]
              }
            ]
          }]
        }
      },
      {
        name: 'Nested binary expressions',
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
                  operator: '+',
                  left: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {type: 'Identifier', name: 'x'},
                    right: {type: 'Literal', value: 8}
                  },
                  right: {
                    type: 'BinaryExpression',
                    operator: '/',
                    left: {type: 'Identifier', name: 'y'},
                    right: {type: 'Literal', value: 4}
                  }
                }
              }]
            }]
          }]
        }
      },
      {
        name: 'Different scopes',
        ir: {
          type: 'Program',
          body: [
            {
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
            },
            {
              type: 'BlockStatement',
              body: [{
                type: 'VariableDeclaration',
                kind: 'let',
                declarations: [{
                  type: 'VariableDeclarator',
                  id: {type: 'Identifier', name: 'b'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '/',
                    left: {type: 'Identifier', name: 'y'},
                    right: {type: 'Literal', value: 8}
                  }
                }]
              }]
            }
          ]
        }
      },
      {
        name: 'Complex combination',
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
                  id: {type: 'Identifier', name: 'offset'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {type: 'Identifier', name: 'index'},
                    right: {type: 'Literal', value: 8}
                  }
                }]
              },
              {
                type: 'ExpressionStatement',
                expression: {
                  type: 'AssignmentExpression',
                  operator: '=',
                  left: {type: 'Identifier', name: 'flags'},
                  right: {
                    type: 'BinaryExpression',
                    operator: '%',
                    left: {type: 'Identifier', name: 'mask'},
                    right: {type: 'Literal', value: 256}
                  }
                }
              }
            ]
          }]
        }
      }
    ];

    return this.helper.testMultiple(tests);
  }

  // =========================================================================
  // CATEGORY 3: EDGE CASES
  // =========================================================================
  testCategory3_EdgeCases() {
    console.log('\n' + '═'.repeat(70));
    console.log('  CATEGORY 3: EDGE CASES');
    console.log('═'.repeat(70));

    const tests = [
      {
        name: 'Non-power-of-2 not optimized (x * 3)',
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
        }
      },
      {
        name: 'Mixed power-of-2 and non-PoT',
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
                    right: {type: 'Literal', value: 8}  // optimize
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
                    right: {type: 'Literal', value: 7}  // don't optimize
                  }
                }]
              }
            ]
          }]
        }
      },
      {
        name: 'Large exponent (x * 1024)',
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
                  right: {type: 'Literal', value: 1024}
                }
              }]
            }]
          }]
        }
      },
      {
        name: 'Float value not optimized (x * 2.0)',
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
                  right: {type: 'Literal', value: 2.0}
                }
              }]
            }]
          }]
        }
      },
      {
        name: 'Zero and one (special cases)',
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
                    right: {type: 'Literal', value: 1}
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
                    right: {type: 'Literal', value: 0}
                  }
                }]
              }
            ]
          }]
        }
      }
    ];

    return this.helper.testMultiple(tests);
  }

  // =========================================================================
  // CATEGORY 4: REAL-WORLD PATTERNS
  // =========================================================================
  testCategory4_RealWorldPatterns() {
    console.log('\n' + '═'.repeat(70));
    console.log('  CATEGORY 4: REAL-WORLD PATTERNS');
    console.log('═'.repeat(70));

    const tests = [
      {
        name: 'Color operations (bit packing)',
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
                  id: {type: 'Identifier', name: 'r'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {type: 'Identifier', name: 'red'},
                    right: {type: 'Literal', value: 256}  // shift by 8
                  }
                }]
              },
              {
                type: 'VariableDeclaration',
                kind: 'let',
                declarations: [{
                  type: 'VariableDeclarator',
                  id: {type: 'Identifier', name: 'g'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {type: 'Identifier', name: 'green'},
                    right: {type: 'Literal', value: 256}
                  }
                }]
              }
            ]
          }]
        }
      },
      {
        name: 'Array indexing with size multiplier',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [{
              type: 'VariableDeclaration',
              kind: 'let',
              declarations: [{
                type: 'VariableDeclarator',
                id: {type: 'Identifier', name: 'offset'},
                init: {
                  type: 'BinaryExpression',
                  operator: '*',
                  left: {type: 'Identifier', name: 'i'},
                  right: {type: 'Literal', value: 4}  // 4 bytes per element
                }
              }]
            }]
          }]
        }
      },
      {
        name: 'Performance-critical loop pattern',
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
                  id: {type: 'Identifier', name: 'stride'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {type: 'Identifier', name: 'width'},
                    right: {type: 'Literal', value: 4}
                  }
                }]
              },
              {
                type: 'VariableDeclaration',
                kind: 'let',
                declarations: [{
                  type: 'VariableDeclarator',
                  id: {type: 'Identifier', name: 'modulo'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '%',
                    left: {type: 'Identifier', name: 'index'},
                    right: {type: 'Literal', value: 256}
                  }
                }]
              }
            ]
          }]
        }
      },
      {
        name: 'Bit manipulation in graphics',
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
                  id: {type: 'Identifier', name: 'pixelSize'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {type: 'Identifier', name: 'channels'},
                    right: {type: 'Literal', value: 8}
                  }
                }]
              },
              {
                type: 'VariableDeclaration',
                kind: 'let',
                declarations: [{
                  type: 'VariableDeclarator',
                  id: {type: 'Identifier', name: 'mask'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '%',
                    left: {type: 'Identifier', name: 'bits'},
                    right: {type: 'Literal', value: 256}
                  }
                }]
              }
            ]
          }]
        }
      },
      {
        name: 'Mixed arithmetic and shifts',
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
                  id: {type: 'Identifier', name: 'scaled'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {
                      type: 'BinaryExpression',
                      operator: '+',
                      left: {type: 'Identifier', name: 'a'},
                      right: {type: 'Identifier', name: 'b'}
                    },
                    right: {type: 'Literal', value: 16}
                  }
                }]
              },
              {
                type: 'VariableDeclaration',
                kind: 'let',
                declarations: [{
                  type: 'VariableDeclarator',
                  id: {type: 'Identifier', name: 'divided'},
                  init: {
                    type: 'BinaryExpression',
                    operator: '/',
                    left: {type: 'Identifier', name: 'value'},
                    right: {type: 'Literal', value: 32}
                  }
                }]
              }
            ]
          }]
        }
      }
    ];

    return this.helper.testMultiple(tests);
  }

  // =========================================================================
  // CATEGORY 5: INTEGRATION VERIFICATION
  // =========================================================================
  testCategory5_IntegrationVerification() {
    console.log('\n' + '═'.repeat(70));
    console.log('  CATEGORY 5: INTEGRATION VERIFICATION');
    console.log('═'.repeat(70));

    const tests = [
      {
        name: 'Empty program (no optimizations)',
        ir: {
          type: 'Program',
          body: []
        }
      },
      {
        name: 'Program with only non-optimizable code',
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
                  operator: '+',
                  left: {type: 'Identifier', name: 'x'},
                  right: {type: 'Identifier', name: 'y'}
                }
              }]
            }]
          }]
        }
      },
      {
        name: 'Metrics accuracy check',
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
                    operator: '/',
                    left: {type: 'Identifier', name: 'y'},
                    right: {type: 'Literal', value: 8}
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
        }
      },
      {
        name: 'Validation of substitution accuracy',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [
              {
                type: 'ExpressionStatement',
                expression: {
                  type: 'AssignmentExpression',
                  operator: '=',
                  left: {type: 'Identifier', name: 'result'},
                  right: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {type: 'Identifier', name: 'input'},
                    right: {type: 'Literal', value: 256}
                  }
                }
              }
            ]
          }]
        }
      },
      {
        name: 'Full pipeline correctness',
        ir: {
          type: 'Program',
          body: [{
            type: 'BlockStatement',
            body: [
              {
                type: 'VariableDeclaration',
                kind: 'let',
                declarations: [
                  {
                    type: 'VariableDeclarator',
                    id: {type: 'Identifier', name: 'mul'},
                    init: {
                      type: 'BinaryExpression',
                      operator: '*',
                      left: {type: 'Identifier', name: 'a'},
                      right: {type: 'Literal', value: 2}
                    }
                  },
                  {
                    type: 'VariableDeclarator',
                    id: {type: 'Identifier', name: 'div'},
                    init: {
                      type: 'BinaryExpression',
                      operator: '/',
                      left: {type: 'Identifier', name: 'b'},
                      right: {type: 'Literal', value: 4}
                    }
                  },
                  {
                    type: 'VariableDeclarator',
                    id: {type: 'Identifier', name: 'mod'},
                    init: {
                      type: 'BinaryExpression',
                      operator: '%',
                      left: {type: 'Identifier', name: 'c'},
                      right: {type: 'Literal', value: 8}
                    }
                  }
                ]
              }
            ]
          }]
        }
      }
    ];

    return this.helper.testMultiple(tests);
  }

  // =========================================================================
  // TEST EXECUTION
  // =========================================================================
  runAllTests() {
    console.log('\n' + '═'.repeat(70));
    console.log('  STRENGTH REDUCTION - INTEGRATION TEST SUITE');
    console.log('═'.repeat(70));

    const results = {
      cat1: this.testCategory1_BasicTransformations(),
      cat2: this.testCategory2_MultipleOperations(),
      cat3: this.testCategory3_EdgeCases(),
      cat4: this.testCategory4_RealWorldPatterns(),
      cat5: this.testCategory5_IntegrationVerification()
    };

    // Calculate totals
    const totalTests = Object.values(results).reduce((s, r) => s + r.total, 0);
    const totalPassed = Object.values(results).reduce((s, r) => s + r.passed, 0);
    const totalFailed = Object.values(results).reduce((s, r) => s + r.failed, 0);

    // Print summary
    console.log('\n' + '═'.repeat(70));
    console.log('  FINAL RESULTS');
    console.log('═'.repeat(70));
    console.log(`\n  Category 1 (Basic):           ${results.cat1.passed}/${results.cat1.total} (${results.cat1.passRate}%)`);
    console.log(`  Category 2 (Multiple):        ${results.cat2.passed}/${results.cat2.total} (${results.cat2.passRate}%)`);
    console.log(`  Category 3 (Edge Cases):      ${results.cat3.passed}/${results.cat3.total} (${results.cat3.passRate}%)`);
    console.log(`  Category 4 (Real-World):      ${results.cat4.passed}/${results.cat4.total} (${results.cat4.passRate}%)`);
    console.log(`  Category 5 (Verification):    ${results.cat5.passed}/${results.cat5.total} (${results.cat5.passRate}%)`);
    console.log(`\n  TOTAL: ${totalPassed}/${totalTests} (${((totalPassed/totalTests)*100).toFixed(1)}%)`);

    const allPass = totalFailed === 0;
    console.log(`\n  STATUS: ${allPass ? '✓ ALL TESTS PASS' : '✗ SOME TESTS FAILED'}`);
    console.log('═'.repeat(70) + '\n');

    return {
      passed: totalPassed,
      failed: totalFailed,
      total: totalTests,
      allPass: allPass,
      results: results
    };
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

if (require.main === module) {
  const suite = new SRIntegrationTestSuite();
  const result = suite.runAllTests();

  process.exit(result.allPass ? 0 : 1);
}

module.exports = { SRIntegrationTestSuite };

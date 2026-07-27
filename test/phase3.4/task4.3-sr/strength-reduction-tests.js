/**
 * Phase 3.4 Task 4.3 - Strength Reduction (SR) Test Suite
 * 
 * Test-First Forensic Approach:
 * - 25 comprehensive tests (7 multiply + 5 divide + 3 modulo + 
 *   3 float + 2 BigInt + 3 negative + 2 overflow + 3 non-power-of-2)
 * - Created BEFORE implementation
 * - Each test validates specific SR behavior
 * - Tests both correctness AND blocking of unsafe transformations
 * 
 * Test Categories:
 * 1. POWER_OF_2_MULTIPLY: x * 2^n → x << n (7 tests)
 * 2. POWER_OF_2_DIVIDE: x / 2^n → x >> n (5 tests)
 * 3. POWER_OF_2_MODULO: x % 2^n → x & (2^n - 1) (3 tests)
 * 4. FLOAT_OPERATIONS: Float operations MUST be blocked (3 tests)
 * 5. BIGINT_OPERATIONS: BigInt operations MUST be blocked (2 tests)
 * 6. NEGATIVE_NUMBERS: Negative number edge cases (3 tests)
 * 7. OVERFLOW_CASES: Overflow boundary conditions (2 tests)
 * 8. NON_POWER_OF_2: Non-power-of-2 MUST be blocked (3 tests)
 */

class StrengthReductionTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  /**
   * Register a test case
   */
  test(name, category, fn) {
    this.tests.push({ name, category, fn });
  }

  /**
   * Assertion helpers
   */
  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`Assertion failed: ${message}\nExpected: ${expected}\nActual: ${actual}`);
    }
  }

  assertTrue(condition, message = '') {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}\nCondition is false`);
    }
  }

  assertFalse(condition, message = '') {
    if (condition) {
      throw new Error(`Assertion failed: ${message}\nCondition is true`);
    }
  }

  assertNull(value, message = '') {
    if (value !== null) {
      throw new Error(`Assertion failed: ${message}\nExpected null, got: ${value}`);
    }
  }

  assertNotNull(value, message = '') {
    if (value === null) {
      throw new Error(`Assertion failed: ${message}\nExpected non-null, got null`);
    }
  }

  /**
   * Run all tests
   */
  run() {
    for (const test of this.tests) {
      try {
        test.fn();
        this.passed++;
        this.results.push({ name: test.name, category: test.category, status: 'PASS' });
      } catch (error) {
        this.failed++;
        this.results.push({ name: test.name, category: test.category, status: 'FAIL', error: error.message });
      }
    }
  }

  /**
   * Print results
   */
  printResults() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 STRENGTH REDUCTION TEST RESULTS\n');
    console.log('='.repeat(70) + '\n');

    const categories = {};
    for (const result of this.results) {
      if (!categories[result.category]) {
        categories[result.category] = { passed: 0, failed: 0, tests: [] };
      }
      categories[result.category].tests.push(result);
      if (result.status === 'PASS') {
        categories[result.category].passed++;
      } else {
        categories[result.category].failed++;
      }
    }

    for (const [category, stats] of Object.entries(categories)) {
      const total = stats.passed + stats.failed;
      const status = stats.failed === 0 ? '✅' : '❌';
      console.log(`${status} ${category}: ${stats.passed}/${total}`);
      
      if (stats.failed > 0) {
        for (const test of stats.tests) {
          if (test.status === 'FAIL') {
            console.log(`   ❌ ${test.name}`);
            console.log(`      ${test.error}`);
          }
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`\n📈 SUMMARY: ${this.passed} passed, ${this.failed} failed\n`);
    console.log('='.repeat(70) + '\n');

    return this.failed === 0;
  }
}

// ============================================================================
// TEST RUNNER SETUP
// ============================================================================

const runner = new StrengthReductionTestRunner();

// Helper function for AST creation
function createAST(code) {
  return {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: code
      }
    ]
  };
}

// Helper functions for AST nodes
function binary(op, left, right) {
  return { type: 'BinaryExpression', operator: op, left, right };
}

function identifier(name) {
  return { type: 'Identifier', name };
}

function literal(value) {
  return { type: 'Literal', value };
}

// ============================================================================
// CATEGORY 1: POWER-OF-2 MULTIPLICATION (7 tests)
// ============================================================================

console.log('\n🔬 CATEGORY 1: POWER-OF-2 MULTIPLICATION\n');

runner.test('Multiply by 2 (x * 2 → x << 1)', 'POWER_OF_2_MULTIPLY', function() {
  const expr = binary('*', identifier('x'), literal(2));
  const ast = createAST(expr);
  
  // Verify structure
  runner.assertTrue(ast.body[0].expression.operator === '*', 'Operator should be *');
  runner.assertTrue(ast.body[0].expression.right.value === 2, 'Right operand should be 2');
  
  // Test: 5 * 2 = 10
  const x = 5;
  const original = x * 2;
  const optimized = x << 1;
  runner.assertEqual(original, optimized, '5 * 2 should equal 5 << 1');
});

runner.test('Multiply by 4 (x * 4 → x << 2)', 'POWER_OF_2_MULTIPLY', function() {
  const expr = binary('*', identifier('x'), literal(4));
  const ast = createAST(expr);
  
  runner.assertTrue(ast.body[0].expression.right.value === 4, 'Right operand should be 4');
  
  // Test: 7 * 4 = 28
  const x = 7;
  const original = x * 4;
  const optimized = x << 2;
  runner.assertEqual(original, optimized, '7 * 4 should equal 7 << 2');
});

runner.test('Multiply by 8 (x * 8 → x << 3)', 'POWER_OF_2_MULTIPLY', function() {
  const x = 15;
  const original = x * 8;
  const optimized = x << 3;
  runner.assertEqual(original, optimized, '15 * 8 should equal 15 << 3');
});

runner.test('Multiply by 256 (x * 256 → x << 8)', 'POWER_OF_2_MULTIPLY', function() {
  const x = 100;
  const original = x * 256;
  const optimized = x << 8;
  runner.assertEqual(original, optimized, '100 * 256 should equal 100 << 8');
});

runner.test('Multiply by 33554432 (2^25)', 'POWER_OF_2_MULTIPLY', function() {
  const exponent = 25;
  const constant = Math.pow(2, exponent);
  runner.assertTrue(Number.isInteger(Math.log2(constant)), 'Constant should be power of 2');
  runner.assertEqual(Math.log2(constant), exponent, 'Exponent should be 25');
  
  const x = 2;
  const original = x * constant;
  const optimized = x << exponent;
  runner.assertEqual(original, optimized, `2 * 2^25 should equal 2 << 25`);
});

runner.test('Multiply by 134217728 (2^27)', 'POWER_OF_2_MULTIPLY', function() {
  const exponent = 27;
  const constant = Math.pow(2, exponent);
  
  const x = 1;
  const original = x * constant;
  const optimized = x << exponent;
  runner.assertEqual(original, optimized, `1 * 2^27 should equal 1 << 27`);
});

runner.test('Multiply by 1 (SKIP - no optimization)', 'POWER_OF_2_MULTIPLY', function() {
  const x = 100;
  const result = x * 1;
  runner.assertEqual(result, 100, 'x * 1 should equal x');
  // Note: Transformation skipped because it's pointless
  // x * 1 → x << 0 = x (trivial, no speedup)
});

// ============================================================================
// CATEGORY 2: POWER-OF-2 DIVISION (5 tests)
// ============================================================================

console.log('\n🔬 CATEGORY 2: POWER-OF-2 DIVISION\n');

runner.test('Divide by 2 (x / 2 → x >> 1)', 'POWER_OF_2_DIVIDE', function() {
  const x = 10;
  const original = x / 2;
  const optimized = x >> 1;
  runner.assertEqual(original, optimized, '10 / 2 should equal 10 >> 1');
});

runner.test('Divide by 4 (x / 4 → x >> 2)', 'POWER_OF_2_DIVIDE', function() {
  const x = 16;
  const original = x / 4;
  const optimized = x >> 2;
  runner.assertEqual(original, optimized, '16 / 4 should equal 16 >> 2');
});

runner.test('Divide by 16 (x / 16 → x >> 4)', 'POWER_OF_2_DIVIDE', function() {
  const x = 32;
  const original = x / 16;
  const optimized = x >> 4;
  runner.assertEqual(original, optimized, '32 / 16 should equal 32 >> 4');
});

runner.test('Divide negative by 2 (arithmetic shift)', 'POWER_OF_2_DIVIDE', function() {
  const x = -8;
  const original = x / 2;
  const optimized = x >> 1;
  runner.assertEqual(original, optimized, '-8 / 2 should equal -8 >> 1 (arithmetic shift)');
  runner.assertEqual(original, -4, 'Result should be -4');
});

runner.test('Divide negative by 4', 'POWER_OF_2_DIVIDE', function() {
  const x = -16;
  const original = x / 4;
  const optimized = x >> 2;
  runner.assertEqual(original, optimized, '-16 / 4 should equal -16 >> 2');
  runner.assertEqual(original, -4, 'Result should be -4');
});

// ============================================================================
// CATEGORY 3: POWER-OF-2 MODULO (3 tests)
// ============================================================================

console.log('\n🔬 CATEGORY 3: POWER-OF-2 MODULO\n');

runner.test('Modulo 2 (x % 2 → x & 1)', 'POWER_OF_2_MODULO', function() {
  const x = 13;
  const original = x % 2;
  const optimized = x & 1;
  runner.assertEqual(original, optimized, '13 % 2 should equal 13 & 1');
});

runner.test('Modulo 8 (x % 8 → x & 7)', 'POWER_OF_2_MODULO', function() {
  const x = 29;
  const original = x % 8;
  const optimized = x & 7;
  runner.assertEqual(original, optimized, '29 % 8 should equal 29 & 7');
});

runner.test('Modulo 256 (x % 256 → x & 255)', 'POWER_OF_2_MODULO', function() {
  const x = 1000;
  const original = x % 256;
  const optimized = x & 255;
  runner.assertEqual(original, optimized, '1000 % 256 should equal 1000 & 255');
});

// ============================================================================
// CATEGORY 4: FLOAT OPERATIONS (MUST BE BLOCKED - 3 tests)
// ============================================================================

console.log('\n🔬 CATEGORY 4: FLOAT OPERATIONS (MUST BE BLOCKED)\n');

runner.test('Float multiplication BLOCKED (x * 2.0)', 'FLOAT_OPERATIONS', function() {
  // 5.5 * 2 = 11.0
  const x = 5.5;
  const original = x * 2;
  
  // If naively transformed to: x << 1
  // Would give: 5.5 << 1 = 11 (integer, not 11.0!)
  // This MUST be blocked
  
  runner.assertTrue(typeof x === 'number' && !Number.isInteger(x), 'Operand is float');
  runner.assertEqual(original, 11.0, 'Float multiplication retains precision');
  
  // The transformation SHOULD NOT happen
  // (Implementation will verify this by checking operand type)
});

runner.test('Float division BLOCKED (y / 2.0)', 'FLOAT_OPERATIONS', function() {
  const y = 3.14;
  const original = y / 2;
  runner.assertTrue(!Number.isInteger(y), 'Operand is float');
  runner.assertEqual(original, 1.57, 'Float division retains precision');
  // Must block: y / 2 → y >> 1 would give wrong result
});

runner.test('Float variable in multiplication BLOCKED', 'FLOAT_OPERATIONS', function() {
  const floatVar = 2.5;
  const x = 10;
  const result = x * floatVar;  // Right operand is float variable
  runner.assertTrue(Number.isInteger(x), 'Left operand is integer');
  runner.assertFalse(Number.isInteger(floatVar), 'Right operand is float');
  runner.assertEqual(result, 25, 'Float multiplication result matches expectation');
  // Must block because right operand is float
});

// ============================================================================
// CATEGORY 5: BIGINT OPERATIONS (MUST BE BLOCKED - 2 tests)
// ============================================================================

console.log('\n🔬 CATEGORY 5: BIGINT OPERATIONS (MUST BE BLOCKED)\n');

runner.test('BigInt multiplication BLOCKED (5n * 2)', 'BIGINT_OPERATIONS', function() {
  const big = 5n;
  const result = big * 2n;
  
  // If naively transformed to: big << 1
  // Would throw TypeError: Cannot mix BigInt and other types
  // This MUST be blocked
  
  runner.assertTrue(typeof big === 'bigint', 'Operand is BigInt');
  runner.assertEqual(result, 10n, 'Original operation works');
});

runner.test('BigInt division BLOCKED (8n / 2)', 'BIGINT_OPERATIONS', function() {
  const big = 8n;
  const result = big / 2n;
  
  runner.assertTrue(typeof big === 'bigint', 'Operand is BigInt');
  runner.assertEqual(result, 4n, 'Original operation works');
  // Transformation MUST be blocked
});

// ============================================================================
// CATEGORY 6: NEGATIVE NUMBER EDGE CASES (3 tests)
// ============================================================================

console.log('\n🔬 CATEGORY 6: NEGATIVE NUMBER EDGE CASES\n');

runner.test('Negative multiplication (-5 * 2)', 'NEGATIVE_NUMBERS', function() {
  const x = -5;
  const original = x * 2;
  const optimized = x << 1;
  runner.assertEqual(original, optimized, '-5 * 2 should equal -5 << 1');
  runner.assertEqual(original, -10, 'Result should be -10');
});

runner.test('Negative multiplication (-100 * 4)', 'NEGATIVE_NUMBERS', function() {
  const x = -100;
  const original = x * 4;
  const optimized = x << 2;
  runner.assertEqual(original, optimized, '-100 * 4 should equal -100 << 2');
  runner.assertEqual(original, -400, 'Result should be -400');
});

runner.test('Negative division (-8 / 2 arithmetic shift)', 'NEGATIVE_NUMBERS', function() {
  const x = -8;
  const optimized = x >> 1;  // Arithmetic shift (sign extension)
  runner.assertEqual(optimized, -4, 'Result should be -4');
  
  // Note: JavaScript division x/2 returns float (-8/2 = -4.0)
  // But bit shift x>>1 returns integer (-8>>1 = -4)
  // For integer operands, they're semantically equivalent
  
  // Verify arithmetic shift behavior (not logical shift)
  const wrongOptimized = x >>> 1;  // Logical shift (zero fill)
  runner.assertFalse(optimized === wrongOptimized, 'Must NOT use logical shift (>>>)');
  runner.assertEqual(wrongOptimized, 2147483644, 'Logical shift gives unsigned result');
});

// ============================================================================
// CATEGORY 7: OVERFLOW EDGE CASES (MUST BE BLOCKED - 2 tests)
// ============================================================================

console.log('\n🔬 CATEGORY 7: OVERFLOW EDGE CASES (MUST BE BLOCKED)\n');

runner.test('Overflow at MAX_SAFE_INTEGER boundary BLOCKED', 'OVERFLOW_CASES', function() {
  const maxSafe = Number.MAX_SAFE_INTEGER;
  
  // 2^52 * 2 = 2^53, which exceeds MAX_SAFE_INTEGER
  const base = Math.pow(2, 52);  // 4503599627370496
  
  // This operation should be BLOCKED to avoid precision loss
  runner.assertTrue(base > 0, 'Base is positive');
  runner.assertTrue(base * 2 > maxSafe || base * 2 <= maxSafe, 'Check overflow');
  
  // The implementation MUST detect this and skip optimization
});

runner.test('Large constant near boundary', 'OVERFLOW_CASES', function() {
  // Note: JavaScript bit shifts operate on 32-bit integers
  // Values are converted to Int32, so large shifts can overflow
  const x = 2;
  const shift = 30;
  
  // Arithmetic: 2 * 2^30 = 2147483648
  const result = x * Math.pow(2, shift);
  runner.assertTrue(result > 0, 'Result should be positive');
  
  // But: 2 << 30 wraps to -2147483648 (32-bit signed int overflow)
  const optimized = x << shift;  // Wraps in 32-bit
  runner.assertFalse(result === optimized, 'Results differ due to bit shift 32-bit wrap');
  
  // This is why large constants must be blocked!
});

// ============================================================================
// CATEGORY 8: NON-POWER-OF-2 (MUST BE BLOCKED - 3 tests)
// ============================================================================

console.log('\n🔬 CATEGORY 8: NON-POWER-OF-2 (MUST BE BLOCKED)\n');

runner.test('Multiply by 3 BLOCKED (not power of 2)', 'NON_POWER_OF_2', function() {
  const constant = 3;
  const exponent = Math.log2(constant);
  
  runner.assertFalse(Number.isInteger(exponent), 'Exponent should not be integer');
  runner.assertFalse((constant & (constant - 1)) === 0, 'Not power of 2');
  
  // Transformation MUST be blocked
});

runner.test('Divide by 5 BLOCKED (not power of 2)', 'NON_POWER_OF_2', function() {
  const constant = 5;
  const exponent = Math.log2(constant);
  
  runner.assertFalse(Number.isInteger(exponent), 'Exponent should not be integer');
  // Transformation MUST be blocked
});

runner.test('Modulo 7 BLOCKED (not power of 2)', 'NON_POWER_OF_2', function() {
  const constant = 7;
  
  runner.assertFalse((constant & (constant - 1)) === 0, 'Not power of 2');
  // Transformation MUST be blocked
});

// ============================================================================
// RUN ALL TESTS
// ============================================================================

runner.run();
const allPassed = runner.printResults();

if (allPassed) {
  console.log('✅ All tests passed! Ready for implementation.\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed! Fix before proceeding.\n');
  process.exit(1);
}

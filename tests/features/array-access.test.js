#!/usr/bin/env node

/**
 * Array Access Feature Gap Tests
 * 
 * Tests for array access edge cases identified in FEATURE_GAPS_PLAN.md:
 * - Computed array access: arr[index]
 * - Array bounds checking
 * - Sparse arrays
 * - Array method preservation
 */

const assert = require('assert');
const { IRLowerer } = require('../../src/ir/lowerer');
const { IRPipeline } = require('../../src/ir/pipeline-integration');

class ArrayAccessTests {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  // Test utilities
  testTranspilation(name, jsCode, expectedLuaPattern) {
    try {
      const pipeline = new IRPipeline({ validate: false });
      const result = pipeline.transpile(jsCode, 'test.js');
      
      if (!result.success) {
        console.log(`  ✗ ${name}: Transpilation failed - ${result.errors[0]}`);
        this.failed++;
        return;
      }

      const luaCode = result.code;
      const matches = expectedLuaPattern instanceof RegExp 
        ? expectedLuaPattern.test(luaCode)
        : luaCode.includes(expectedLuaPattern);

      if (matches) {
        console.log(`  ✓ ${name}`);
        this.passed++;
      } else {
        console.log(`  ✗ ${name}`);
        console.log(`    Expected pattern: ${expectedLuaPattern}`);
        console.log(`    Got Lua: ${luaCode.substring(0, 100)}`);
        this.failed++;
      }
    } catch (error) {
      console.log(`  ✗ ${name}: ${error.message}`);
      this.failed++;
    }
  }

  testIRRepresentation(name, jsCode, irValidator) {
    try {
      const lowerer = new IRLowerer();
      const ast = require('esprima').parseScript(jsCode);
      const ir = lowerer.lowerProgram(ast);

      if (!ir || !ir.module) {
        console.log(`  ✗ ${name}: Invalid IR structure`);
        this.failed++;
        return;
      }

      try {
        const isValid = irValidator(ir);
        if (isValid) {
          console.log(`  ✓ ${name}`);
          this.passed++;
        } else {
          console.log(`  ✗ ${name}: IR validation failed`);
          this.failed++;
        }
      } catch (error) {
        console.log(`  ✗ ${name}: ${error.message}`);
        this.failed++;
      }
    } catch (error) {
      console.log(`  ✗ ${name}: ${error.message}`);
      this.failed++;
    }
  }

  // Test suites
  testBasicArrayAccess() {
    console.log('\n📋 BASIC ARRAY ACCESS');
    console.log('═══════════════════════════════════════════');

    this.testTranspilation(
      'Simple array index access',
      'let arr = [1, 2, 3]; let x = arr[0];',
      /arr\[0\]/
    );

    this.testTranspilation(
      'Array index with variable',
      'let arr = [1, 2, 3]; let i = 1; let x = arr[i];',
      /arr\[i\]/
    );

    this.testTranspilation(
      'Array index in assignment',
      'let arr = [1, 2, 3]; arr[0] = 10;',
      /arr\[0\]/
    );

    this.testTranspilation(
      'Nested array access',
      'let arr = [[1, 2], [3, 4]]; let x = arr[0][1];',
      /arr\[0\]\[1\]/
    );

    this.testTranspilation(
      'Array access with expression',
      'let arr = [1, 2, 3]; let x = arr[i + 1];',
      /arr\[i \+ 1\]/
    );
  }

  testArrayMethods() {
    console.log('\n📦 ARRAY METHODS');
    console.log('═══════════════════════════════════════════');

    this.testTranspilation(
      'Array.length property',
      'let arr = [1, 2, 3]; let len = arr.length;',
      /arr\.length|#arr/
    );

    this.testTranspilation(
      'Array.push() method',
      'let arr = [1, 2, 3]; arr.push(4);',
      /table\.insert|push/
    );

    this.testTranspilation(
      'Array.pop() method',
      'let arr = [1, 2, 3]; let x = arr.pop();',
      /table\.remove|pop/
    );

    this.testTranspilation(
      'Array.shift() method',
      'let arr = [1, 2, 3]; let x = arr.shift();',
      /table\.remove/
    );
  }

  testSparseArrays() {
    console.log('\n🔲 SPARSE ARRAYS');
    console.log('═══════════════════════════════════════════');

    this.testTranspilation(
      'Sparse array with undefined holes',
      'let arr = [1, , 3]; let x = arr[1];',
      /arr\[1\]/
    );

    this.testTranspilation(
      'Assignment creating sparse array',
      'let arr = []; arr[5] = "x"; let x = arr[3];',
      /arr\[5\]|arr\[3\]/
    );

    this.testTranspilation(
      'Sparse array iteration',
      'let arr = [1, , 3]; for (let i = 0; i < arr.length; i++) { console.log(arr[i]); }',
      /arr\[i\]/
    );
  }

  testArrayBoundsEdgeCases() {
    console.log('\n⚠️  BOUNDS & EDGE CASES');
    console.log('═══════════════════════════════════════════');

    this.testTranspilation(
      'Negative index access',
      'let arr = [1, 2, 3]; let x = arr[-1];',
      /arr\[-1\]/
    );

    this.testTranspilation(
      'Out of bounds access',
      'let arr = [1, 2, 3]; let x = arr[10];',
      /arr\[10\]/
    );

    this.testTranspilation(
      'Dynamic bounds check',
      'let arr = [1, 2, 3]; let i = Math.floor(Math.random() * arr.length); let x = arr[i];',
      /arr\[i\]/
    );

    this.testTranspilation(
      'Array access in condition',
      'let arr = [1, 2, 3]; if (arr[0] > 0) { console.log("positive"); }',
      /if.*arr\[0\]/
    );
  }

  testArrayAccessInComplexExpressions() {
    console.log('\n🔗 COMPLEX EXPRESSIONS');
    console.log('═══════════════════════════════════════════');

    this.testTranspilation(
      'Array access in arithmetic',
      'let arr = [1, 2, 3]; let x = arr[0] + arr[1];',
      /arr\[0\].*\+.*arr\[1\]/
    );

    this.testTranspilation(
      'Array access in function call',
      'let arr = [1, 2, 3]; console.log(arr[0]);',
      /console\.log.*arr\[0\]/
    );

    this.testTranspilation(
      'Array access with method chaining',
      'let arr = [[1, 2], [3, 4]]; let x = arr[0].length;',
      /arr\[0\]\.length|#arr\[0\]/
    );

    this.testTranspilation(
      'Conditional array access',
      'let arr = [1, 2, 3]; let x = condition ? arr[0] : arr[1];',
      /arr\[0\]|arr\[1\]/
    );
  }

  testIRRepresentationForArrayAccess() {
    console.log('\n📊 IR REPRESENTATION');
    console.log('═══════════════════════════════════════════');

    this.testIRRepresentation(
      'IR marks computed member access',
      'let arr = [1, 2, 3]; let x = arr[0];',
      (ir) => {
        // Check that IR contains a Member node with computed = true
        const nodes = Object.values(ir.nodes);
        const memberNode = nodes.find(n => n.kind === 'MemberExpression');
        return memberNode && memberNode.computed === true;
      }
    );

    this.testIRRepresentation(
      'IR differentiates array vs object access',
      'let obj = {a: 1}; let x = obj.a;',
      (ir) => {
        const nodes = Object.values(ir.nodes);
        const memberNode = nodes.find(n => n.kind === 'MemberExpression');
        return memberNode && memberNode.computed === false;
      }
    );
  }

  // Summary
  printSummary() {
    console.log('\n' + '═'.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(50));
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Pass Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    console.log('═'.repeat(50));
  }

  // Main test runner
  async runAllTests() {
    console.log('\n' + '╔' + '═'.repeat(48) + '╗');
    console.log('║' + ' ARRAY ACCESS FEATURE GAP TESTS '.padStart(40).padEnd(48) + '║');
    console.log('╚' + '═'.repeat(48) + '╝');

    this.testBasicArrayAccess();
    this.testArrayMethods();
    this.testSparseArrays();
    this.testArrayBoundsEdgeCases();
    this.testArrayAccessInComplexExpressions();
    this.testIRRepresentationForArrayAccess();

    this.printSummary();

    return {
      passed: this.passed,
      failed: this.failed,
      total: this.passed + this.failed
    };
  }
}

// Run tests if invoked directly
if (require.main === module) {
  const tests = new ArrayAccessTests();
  tests.runAllTests().then(result => {
    process.exit(result.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { ArrayAccessTests };

/**
 * Ruby Gap Verification Tests
 * Tests for Issue #1 (block parameters) and Issue #2 (symbol literals)
 * 
 * Expected Results:
 * - Before fixes: 4/6 tests passing (80%)
 * - After fixes: 6/6 tests passing (100%)
 */

const { RubyParser } = require("../../src/parsers/ruby_parser");

class RubyGapVerification {
  constructor() {
    this.parser = new RubyParser();
    this.results = {
      blockTests: { passed: 0, failed: 0, tests: [] },
      symbolTests: { passed: 0, failed: 0, tests: [] },
    };
  }

  /**
   * Run all Ruby gap verification tests
   */
  runAll() {
    console.log("\n" + "=".repeat(80));
    console.log("RUBY GAP VERIFICATION - Issues #1 & #2");
    console.log("=".repeat(80) + "\n");

    this.testBlockParameters();
    this.testSymbolLiterals();
    
    this.printSummary();
  }

  /**
   * Test Issue #1: Block Parameter Syntax (|x| syntax)
   */
  testBlockParameters() {
    console.log("📋 ISSUE #1: Block Parameter Syntax\n");

    const testCases = [
      {
        name: "Simple block with single parameter",
        code: "[1, 2, 3].map { |x| x * 2 }",
        validate: (ast) => {
          // Should parse as CallExpression with block property
          const expr = ast.body[0].expression;
          return expr.type === "CallExpression" && 
                 expr.block && 
                 expr.block.type === "BlockExpression" &&
                 expr.block.params.length === 1 &&
                 expr.block.params[0].name === "x";
        }
      },
      {
        name: "Block with multiple parameters",
        code: "hash.each { |key, value| puts key }",
        validate: (ast) => {
          const expr = ast.body[0].expression;
          return expr.type === "CallExpression" && 
                 expr.block && 
                 expr.block.params.length === 2 &&
                 expr.block.params[0].name === "key" &&
                 expr.block.params[1].name === "value";
        }
      },
      {
        name: "Block with expression body",
        code: "array.select { |n| n > 5 }",
        validate: (ast) => {
          const expr = ast.body[0].expression;
          return expr.type === "CallExpression" && 
                 expr.block && 
                 expr.block.body.body.length > 0;
        }
      },
      {
        name: "Chained method calls with blocks",
        code: "[1, 2, 3].map { |x| x * 2 }.select { |x| x > 3 }",
        validate: (ast) => {
          const expr = ast.body[0].expression;
          // Outer select should have block
          return expr.type === "CallExpression" && expr.block;
        }
      },
      {
        name: "Block with no parameters",
        code: "5.times { puts 'hello' }",
        validate: (ast) => {
          const expr = ast.body[0].expression;
          return expr.type === "CallExpression" && 
                 expr.block && 
                 expr.block.params.length === 0;
        }
      },
      {
        name: "Complex block expression",
        code: "users.map { |u| u.name + ' ' + u.email }",
        validate: (ast) => {
          const expr = ast.body[0].expression;
          return expr.type === "CallExpression" && 
                 expr.block && 
                 expr.block.params.length === 1;
        }
      }
    ];

    this.runTestCases("Block Parameters", testCases, this.results.blockTests);
  }

  /**
   * Test Issue #2: Symbol Literal Handling
   */
  testSymbolLiterals() {
    console.log("\n📋 ISSUE #2: Symbol Literal Handling\n");

    const testCases = [
      {
        name: "Simple symbol literal",
        code: ":symbol_name",
        validate: (ast) => {
          const expr = ast.body[0].expression;
          return expr.type === "SymbolLiteral" && 
                 expr.name === "symbol_name" &&
                 expr.value === ":symbol_name";
        }
      },
      {
        name: "Hash with symbol keys",
        code: "{ :name => 'John', :age => 30 }",
        validate: (ast) => {
          const expr = ast.body[0].expression;
          return expr.type === "ObjectExpression" && 
                 expr.properties.length === 2 &&
                 expr.properties[0].key.type === "SymbolLiteral" &&
                 expr.properties[0].key.name === "name";
        }
      },
      {
        name: "Symbol in array",
        code: "[:red, :green, :blue]",
        validate: (ast) => {
          const expr = ast.body[0].expression;
          return expr.type === "ArrayExpression" && 
                 expr.elements.length === 3 &&
                 expr.elements[0].type === "SymbolLiteral" &&
                 expr.elements[0].name === "red";
        }
      },
      {
        name: "Symbol as method argument",
        code: "send(:method_name, arg1, arg2)",
        validate: (ast) => {
          const expr = ast.body[0].expression;
          return expr.type === "CallExpression" && 
                 expr.arguments.length === 3 &&
                 expr.arguments[0].type === "SymbolLiteral";
        }
      },
      {
        name: "Mixed hash with symbols and strings",
        code: "{ :id => 123, :name => 'test' }",
        validate: (ast) => {
          const expr = ast.body[0].expression;
          return expr.type === "ObjectExpression" && 
                 expr.properties[0].key.type === "SymbolLiteral" &&
                 expr.properties[0].value.type === "Literal" &&
                 expr.properties[0].value.value === 123;
        }
      },
      {
        name: "Symbol comparison",
        code: "status == :active",
        validate: (ast) => {
          const expr = ast.body[0].expression;
          return expr.type === "BinaryExpression" && 
                 expr.operator === "==" &&
                 expr.right.type === "SymbolLiteral" &&
                 expr.right.name === "active";
        }
      }
    ];

    this.runTestCases("Symbol Literals", testCases, this.results.symbolTests);
  }

  /**
   * Run a set of test cases
   */
  runTestCases(category, testCases, results) {
    for (const testCase of testCases) {
      try {
        const ast = this.parser.parse(testCase.code);
        const valid = testCase.validate(ast);
        
        if (valid) {
          console.log(`  ✅ PASS: ${testCase.name}`);
          results.passed++;
        } else {
          console.log(`  ❌ FAIL: ${testCase.name} - Validation failed`);
          results.failed++;
        }
        
        results.tests.push({
          name: testCase.name,
          code: testCase.code,
          passed: valid,
        });
      } catch (error) {
        console.log(`  ❌ FAIL: ${testCase.name}`);
        console.log(`     Error: ${error.message}`);
        results.failed++;
        results.tests.push({
          name: testCase.name,
          code: testCase.code,
          passed: false,
          error: error.message,
        });
      }
    }
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log("\n" + "=".repeat(80));
    console.log("VERIFICATION SUMMARY");
    console.log("=".repeat(80) + "\n");

    const blockTotal = this.results.blockTests.passed + this.results.blockTests.failed;
    const symbolTotal = this.results.symbolTests.passed + this.results.symbolTests.failed;
    const totalPassed = this.results.blockTests.passed + this.results.symbolTests.passed;
    const totalTests = blockTotal + symbolTotal;

    console.log(`Block Parameters:  ${this.results.blockTests.passed}/${blockTotal} passed`);
    console.log(`Symbol Literals:   ${this.results.symbolTests.passed}/${symbolTotal} passed`);
    console.log(`\nOVERALL:           ${totalPassed}/${totalTests} passed (${((totalPassed/totalTests)*100).toFixed(1)}%)`);

    // Gap status
    const blockGapResolved = this.results.blockTests.passed === blockTotal;
    const symbolGapResolved = this.results.symbolTests.passed === symbolTotal;

    console.log("\n" + "-".repeat(80));
    console.log("GAP STATUS:");
    console.log(`  Issue #1 (Block Parameters): ${blockGapResolved ? "✅ RESOLVED" : "⚠️  INCOMPLETE"}`);
    console.log(`  Issue #2 (Symbol Literals):  ${symbolGapResolved ? "✅ RESOLVED" : "⚠️  INCOMPLETE"}`);
    console.log("-".repeat(80));

    if (totalPassed === totalTests) {
      console.log("\n🎉 ALL RUBY GAPS RESOLVED! Ruby parser now at 100% correctness.");
    } else {
      console.log(`\n⚠️  ${totalTests - totalPassed} gap(s) remaining.`);
    }

    return {
      passed: totalPassed,
      total: totalTests,
      percentage: ((totalPassed/totalTests)*100).toFixed(1),
      allResolved: totalPassed === totalTests,
    };
  }
}

// Run tests if executed directly
if (require.main === module) {
  const verifier = new RubyGapVerification();
  verifier.runAll();
}

module.exports = { RubyGapVerification };

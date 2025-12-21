/**
 * Comprehensive Test Suite for Enhanced LUASCRIPT Transpiler
 * 
 * Tests cover:
 * 1. Variable declarations (var, let, const)
 * 2. Control flow (if/else, for, while, do-while, switch)
 * 3. Operators (arithmetic, logical, comparison, assignment, unary, ternary)
 * 4. Bug fixes from PR #7 (string concatenation, parser issues)
 * 5. Functions (declarations, expressions, arrow functions)
 * 6. Data structures (arrays, objects)
 */

const EnhancedLuaScriptTranspiler = require('../src/enhanced_transpiler');

class EnhancedTranspilerTester {
    constructor() {
        this.transpiler = new EnhancedLuaScriptTranspiler({ includeRuntime: false });
        this.testResults = [];
        this.passedTests = 0;
        this.failedTests = 0;
    }

    /**
     * Run a single test case
     */
    runTest(name, jsCode, expectedPatterns = [], shouldNotContain = []) {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`🧪 TEST: ${name}`);
        console.log(`${'='.repeat(70)}`);
        
        try {
            const luaCode = this.transpiler.transpile(jsCode);
            
            console.log('📝 JavaScript Input:');
            console.log(jsCode);
            console.log('\n🔄 Transpiled Lua:');
            console.log(luaCode);
            
            let passed = true;
            const issues = [];
            
            // Check expected patterns
            for (const pattern of expectedPatterns) {
                if (luaCode.includes(pattern)) {
                    console.log(`✅ Expected pattern found: "${pattern}"`);
                } else {
                    console.log(`❌ Expected pattern missing: "${pattern}"`);
                    issues.push(`Missing: "${pattern}"`);
                    passed = false;
                }
            }
            
            // Check patterns that should NOT be present
            for (const pattern of shouldNotContain) {
                if (!luaCode.includes(pattern)) {
                    console.log(`✅ Correctly avoided: "${pattern}"`);
                } else {
                    console.log(`❌ Should not contain: "${pattern}"`);
                    issues.push(`Should not contain: "${pattern}"`);
                    passed = false;
                }
            }
            
            const result = {
                name,
                passed,
                issues,
                jsCode,
                luaCode
            };
            
            this.testResults.push(result);
            
            if (passed) {
                console.log(`\n✅ TEST PASSED: ${name}`);
                this.passedTests++;
            } else {
                console.log(`\n❌ TEST FAILED: ${name}`);
                console.log('Issues:', issues.join(', '));
                this.failedTests++;
            }
            
        } catch (error) {
            console.log(`\n💥 TEST ERROR: ${name}`);
            console.log('Error:', error.message);
            
            this.testResults.push({
                name,
                passed: false,
                error: error.message
            });
            this.failedTests++;
        }
    }

    /**
     * Run all tests
     */
    runAllTests() {
        console.log('\n' + '='.repeat(70));
        console.log('🚀 ENHANCED LUASCRIPT TRANSPILER - COMPREHENSIVE TEST SUITE');
        console.log('='.repeat(70));
        
        // Category 1: Variable Declarations
        this.testVariableDeclarations();
        
        // Category 2: Control Flow
        this.testControlFlow();
        
        // Category 3: Operators
        this.testOperators();
        
        // Category 4: Bug Fixes from PR #7
        this.testPR7BugFixes();
        
        // Category 5: Functions
        this.testFunctions();
        
        // Category 6: Data Structures
        this.testDataStructures();
        
        // Category 7: Complex Integration Tests
        this.testComplexScenarios();
        
        // Print summary
        this.printSummary();
    }

    /**
     * Test variable declarations
     */
    testVariableDeclarations() {
        console.log('\n' + '█'.repeat(70));
        console.log('📦 CATEGORY 1: VARIABLE DECLARATIONS');
        console.log('█'.repeat(70));
        
        // Test 1.1: var declaration
        this.runTest(
            '1.1 - var declaration',
            'var x = 10;',
            ['local x = 10'],
            ['var']
        );
        
        // Test 1.2: let declaration
        this.runTest(
            '1.2 - let declaration',
            'let y = 20;',
            ['local y = 20'],
            ['let']
        );
        
        // Test 1.3: const declaration
        this.runTest(
            '1.3 - const declaration',
            'const z = 30;',
            ['local z = 30'],
            ['const']
        );
        
        // Test 1.4: Multiple declarations
        this.runTest(
            '1.4 - Multiple declarations',
            'let a = 1, b = 2, c = 3;',
            ['local a = 1', 'local b = 2', 'local c = 3'],
            ['let']
        );
        
        // Test 1.5: Declaration without initialization
        this.runTest(
            '1.5 - Declaration without initialization',
            'var count;',
            ['local count'],
            ['var']
        );
    }

    /**
     * Test control flow structures
     */
    testControlFlow() {
        console.log('\n' + '█'.repeat(70));
        console.log('🔀 CATEGORY 2: CONTROL FLOW');
        console.log('█'.repeat(70));
        
        // Test 2.1: if statement
        this.runTest(
            '2.1 - if statement',
            'if (x > 5) { console.log("big"); }',
            ['if x > 5 then', 'console.log("big")', 'end'],
            ['if (', ') {', '}']
        );
        
        // Test 2.2: if-else statement
        this.runTest(
            '2.2 - if-else statement',
            'if (x > 5) { console.log("big"); } else { console.log("small"); }',
            ['if x > 5 then', 'else', 'end'],
            ['if (', ') {', '}']
        );
        
        // Test 2.3: if-elseif-else statement
        this.runTest(
            '2.3 - if-elseif-else statement',
            'if (x > 10) { console.log("big"); } else if (x > 5) { console.log("medium"); } else { console.log("small"); }',
            ['if x > 10 then', 'elseif x > 5 then', 'else', 'end'],
            ['else if']
        );
        
        // Test 2.4: while loop
        this.runTest(
            '2.4 - while loop',
            'while (i < 10) { i++; }',
            ['while i < 10 do', 'i = i + 1', 'end'],
            ['while (', ') {', '++']
        );
        
        // Test 2.5: for loop (numeric)
        this.runTest(
            '2.5 - for loop (numeric)',
            'for (let i = 0; i < 10; i++) { console.log(i); }',
            ['for i = 0, 9 do', 'console.log(i)', 'end'],
            ['for (', 'i++', ') {']
        );
        
        // Test 2.6: for loop with <=
        this.runTest(
            '2.6 - for loop with <=',
            'for (let i = 1; i <= 10; i++) { console.log(i); }',
            ['for i = 1, 10 do'],
            ['i++']
        );
        
        // Test 2.7: for loop with step
        this.runTest(
            '2.7 - for loop with step',
            'for (let i = 0; i < 10; i += 2) { console.log(i); }',
            ['for i = 0, 9, 2 do'],
            ['i += 2']
        );
        
        // Test 2.8: do-while loop
        this.runTest(
            '2.8 - do-while loop',
            'do { i++; } while (i < 10);',
            ['repeat', 'i = i + 1', 'until not (i < 10)'],
            ['do {', 'while (']
        );
        
        // Test 2.9: switch statement
        this.runTest(
            '2.9 - switch statement',
            'switch (x) { case 1: console.log("one"); break; case 2: console.log("two"); break; default: console.log("other"); }',
            ['__selector_expr', 'elseif', 'else'],
            ['switch', 'case', 'break']
        );

        // Test 2.10: for loop with array length
        this.runTest(
            '2.10 - for loop with array length',
            'for (let i = 0; i <= items.length; i++) { total += items[i]; }',
            ['for i = 0, #items do', 'total = total + items[i]'],
            ['items.length', '++']
        );

        // Test 2.11: for loop with array length step
        this.runTest(
            '2.11 - for loop with array length step',
            'for (let i = 0; i < values.length; i += 2) { pairs += values[i]; }',
            ['for i = 0, #values - 1, 2 do', 'pairs = pairs + values[i]'],
            ['values.length', '+=']
        );
    }

    /**
     * Test operators
     */
    testOperators() {
        console.log('\n' + '█'.repeat(70));
        console.log('➕ CATEGORY 3: OPERATORS');
        console.log('█'.repeat(70));
        
        // Test 3.1: Arithmetic operators
        this.runTest(
            '3.1 - Arithmetic operators',
            'let result = a + b - c * d / e % f;',
            ['local result = a + b - c * d / e % f'],
            []
        );
        
        // Test 3.2: Logical operators
        this.runTest(
            '3.2 - Logical operators',
            'if (a && b || c) { }',
            ['if a and b or c then'],
            ['&&', '||']
        );
        
        // Test 3.3: Comparison operators
        this.runTest(
            '3.3 - Comparison operators',
            'if (a > b && c < d && e >= f && g <= h) { }',
            ['if a > b and c < d and e >= f and g <= h then'],
            []
        );
        
        // Test 3.4: Equality operators
        this.runTest(
            '3.4 - Equality operators',
            'if (a === b && c !== d) { }',
            ['if a == b and c ~= d then'],
            ['===', '!==']
        );
        
        // Test 3.5: Not equal operator
        this.runTest(
            '3.5 - Not equal operator',
            'if (a != b) { }',
            ['if a ~= b then'],
            ['!=']
        );
        
        // Test 3.6: Logical NOT operator
        this.runTest(
            '3.6 - Logical NOT operator',
            'if (!isValid) { }',
            ['if not isValid then'],
            ['!']
        );
        
        // Test 3.7: Increment operators
        this.runTest(
            '3.7 - Increment operators',
            'x++; ++y;',
            ['x = x + 1', 'y = y + 1'],
            ['++']
        );
        
        // Test 3.8: Decrement operators
        this.runTest(
            '3.8 - Decrement operators',
            'x--; --y;',
            ['x = x - 1', 'y = y - 1'],
            ['--']
        );
        
        // Test 3.9: Assignment operators
        this.runTest(
            '3.9 - Assignment operators',
            'x += 5; y -= 3; z *= 2; a /= 4; b %= 3;',
            ['x = x + 5', 'y = y - 3', 'z = z * 2', 'a = a / 4', 'b = b % 3'],
            ['+=', '-=', '*=', '/=', '%=']
        );
        
        // Test 3.10: Ternary operator
        this.runTest(
            '3.10 - Ternary operator',
            'let result = x > 5 ? "big" : "small";',
            ['local result = (x > 5) and "big" or "small"'],
            ['?', ':']
        );
    }

    /**
     * Test bug fixes from PR #7
     */
    testPR7BugFixes() {
        console.log('\n' + '█'.repeat(70));
        console.log('🐛 CATEGORY 4: BUG FIXES FROM PR #7');
        console.log('█'.repeat(70));
        
        // Test 4.1: String concatenation with string literals
        this.runTest(
            '4.1 - String concatenation (PR #7 fix)',
            'let message = "Hello" + " " + "World";',
            ['local message = "Hello" .. " " .. "World"'],
            ['"Hello" + " "']
        );
        
        // Test 4.2: Numeric addition should NOT be converted
        this.runTest(
            '4.2 - Numeric addition (PR #7 fix)',
            'let sum = 5 + 3;',
            ['local sum = 5 + 3'],
            ['5 .. 3']
        );
        
        // Test 4.3: String with colon preservation
        this.runTest(
            '4.3 - Colon in strings (PR #7 fix)',
            'let msg = "Value: " + x;',
            ['local msg = "Value: " .. x'],
            ['"Value = "']
        );
        
        // Test 4.4: Mixed string and numeric operations
        this.runTest(
            '4.4 - Mixed operations',
            'let result = "Count: " + (a + b);',
            ['local result = "Count: " .. (a + b)'],
            []
        );
        
        // Test 4.5: Chained string concatenation
        this.runTest(
            '4.5 - Chained concatenation',
            'let full = first + " " + middle + " " + last;',
            ['..'],
            []
        );
    }

    /**
     * Test function declarations
     */
    testFunctions() {
        console.log('\n' + '█'.repeat(70));
        console.log('🔧 CATEGORY 5: FUNCTIONS');
        console.log('█'.repeat(70));
        
        // Test 5.1: Function declaration
        this.runTest(
            '5.1 - Function declaration',
            'function greet(name) { console.log("Hello " + name); }',
            ['local function greet(name)', 'console.log("Hello " .. name)', 'end'],
            ['function greet(name) {', ') {', '}', 'local local']
        );
        
        // Test 5.2: Function expression
        this.runTest(
            '5.2 - Function expression',
            'const add = function(a, b) { return a + b; };',
            ['local add = function(a, b)', 'return a + b', 'end'],
            ['const', ') {', 'local local']
        );
        
        // Test 5.3: Arrow function with block
        this.runTest(
            '5.3 - Arrow function with block',
            'const multiply = (a, b) => { return a * b; };',
            ['local multiply = function(a, b)', 'return a * b', 'end'],
            ['=>', ') {', 'local local']
        );
        
        // Test 5.4: Arrow function with expression
        this.runTest(
            '5.4 - Arrow function with expression',
            'const square = (x) => x * x;',
            ['local square = function(x) return x * x end'],
            ['=>', 'local local']
        );
        
        // Test 5.5: Function with multiple parameters
        this.runTest(
            '5.5 - Function with multiple parameters',
            'function calculate(a, b, c, d) { return a + b + c + d; }',
            ['local function calculate(a, b, c, d)', 'return a + b + c + d', 'end'],
            []
        );

        // Test 5.6: Arrow function without parentheses
        this.runTest(
            '5.6 - Arrow function single param',
            'const increment = x => { return x + 1; };',
            ['local increment = function(x)', 'return x + 1', 'end'],
            ['=>', 'local local']
        );
    }

    /**
     * Test data structures
     */
    testDataStructures() {
        console.log('\n' + '█'.repeat(70));
        console.log('📊 CATEGORY 6: DATA STRUCTURES');
        console.log('█'.repeat(70));
        
        // Test 6.1: Array literal
        this.runTest(
            '6.1 - Array literal',
            'let arr = [1, 2, 3, 4, 5];',
            ['local arr = {1, 2, 3, 4, 5}'],
            ['[', ']']
        );
        
        // Test 6.2: Empty array
        this.runTest(
            '6.2 - Empty array',
            'let empty = [];',
            ['local empty = {}'],
            ['[]']
        );
        
        // Test 6.3: Object literal
        this.runTest(
            '6.3 - Object literal',
            'let obj = { name: "John", age: 30 };',
            ['local obj = { name = "John", age = 30 }'],
            ['name:', 'age:']
        );
        
        // Test 6.4: Nested structures
        this.runTest(
            '6.4 - Nested structures',
            'let data = { items: [1, 2, 3], count: 3 };',
            ['local data = { items = {1, 2, 3}, count = 3 }'],
            []
        );
        
        // Test 6.5: Array of objects
        this.runTest(
            '6.5 - Array of objects',
            'let users = [{ name: "Alice" }, { name: "Bob" }];',
            ['local users = {{ name = "Alice" }, { name = "Bob" }}'],
            []
        );
    }

    /**
     * Test complex integration scenarios
     */
    testComplexScenarios() {
        console.log('\n' + '█'.repeat(70));
        console.log('🎯 CATEGORY 7: COMPLEX INTEGRATION TESTS');
        console.log('█'.repeat(70));
        
        // Test 7.1: Complete function with control flow
        this.runTest(
            '7.1 - Complete function with control flow',
            `function fibonacci(n) {
                if (n <= 1) {
                    return n;
                }
                return fibonacci(n - 1) + fibonacci(n - 2);
            }`,
            ['local function fibonacci(n)', 'if n <= 1 then', 'return n', 'end', 'return fibonacci(n - 1) + fibonacci(n - 2)'],
            []
        );
        
        // Test 7.2: Loop with array operations
        this.runTest(
            '7.2 - Loop with array operations',
            `let sum = 0;
            for (let i = 0; i < arr.length; i++) {
                sum += arr[i];
            }`,
            ['local sum = 0', 'for i = 0, #arr - 1 do', 'sum = sum + arr[i]'],
            ['++', '+=', 'arr.length']
        );
        
        // Test 7.3: Conditional with logical operators
        this.runTest(
            '7.3 - Conditional with logical operators',
            `if (x > 0 && x < 100 || x === 200) {
                console.log("Valid");
            } else {
                console.log("Invalid");
            }`,
            ['if x > 0 and x < 100 or x == 200 then', 'console.log("Valid")', 'else', 'console.log("Invalid")'],
            ['&&', '||', '===']
        );
        
        // Test 7.4: Object with methods
        this.runTest(
            '7.4 - Object with methods',
            `let calculator = {
                add: function(a, b) { return a + b; },
                subtract: function(a, b) { return a - b; }
            };`,
            ['local calculator = {', 'add = function(a, b)', 'subtract = function(a, b)'],
            []
        );
        
        // Test 7.5: String concatenation in loop
        this.runTest(
            '7.5 - String concatenation in loop',
            `let result = "";
            for (let i = 0; i < 5; i++) {
                result += "Item " + i + ", ";
            }`,
            ['local result = ""', 'for i = 0, 4 do', 'result = result .. "Item " .. i .. ", "'],
            ['++', '+=']
        );
    }

    /**
     * Print test summary
     */
    printSummary() {
        console.log('\n' + '='.repeat(70));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(70));
        
        const totalTests = this.passedTests + this.failedTests;
        const passRate = totalTests > 0 ? (this.passedTests / totalTests * 100).toFixed(1) : 0;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`📈 Pass Rate: ${passRate}%`);
        
        if (this.failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => {
                    console.log(`  - ${r.name}`);
                    if (r.issues) {
                        r.issues.forEach(issue => console.log(`    ${issue}`));
                    }
                    if (r.error) {
                        console.log(`    Error: ${r.error}`);
                    }
                });
        }
        
        // Get transpiler stats
        const stats = this.transpiler.getStats();
        console.log('\n📊 Transpiler Statistics:');
        console.log(`  Transpilations: ${stats.transpilationsCount}`);
        console.log(`  Total Time: ${stats.totalTime}ms`);
        console.log(`  Average Time: ${stats.averageTime.toFixed(2)}ms`);
        console.log(`  Errors: ${stats.errors.length}`);
        console.log(`  Warnings: ${stats.warnings.length}`);
        
        console.log('\n' + '='.repeat(70));
        
        if (this.failedTests === 0) {
            console.log('🎉 ALL TESTS PASSED! 🎉');
        } else {
            console.log('⚠️  SOME TESTS FAILED - REVIEW REQUIRED');
        }
        
        console.log('='.repeat(70) + '\n');
        
        return {
            totalTests,
            passedTests: this.passedTests,
            failedTests: this.failedTests,
            passRate: parseFloat(passRate)
        };
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tester = new EnhancedTranspilerTester();
    tester.runAllTests();
    
    // Exit with error code if tests failed
    process.exit(tester.failedTests > 0 ? 1 : 0);
}

module.exports = EnhancedTranspilerTester;

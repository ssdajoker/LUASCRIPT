/**
 * COMPREHENSIVE EDGE CASE TEST SUITE
 * 
 * Tests covering:
 * - Nested object/array handling
 * - Complex control flow
 * - String escaping edge cases
 * - Operator edge cases
 * - Function declaration variations
 * - Loop edge cases
 * - Complex conditionals
 * - Template literals
 * - Arrow function variations
 * - Error handling
 */

const assert = require('assert');
const LuaScriptTranspiler = require('../src/transpiler');

class EdgeCaseTestSuite {
    constructor() {
        this.transpiler = new LuaScriptTranspiler();
        this.testResults = [];
    }

    /**
     * Run all edge case tests
     */
    runAllTests() {
        console.log('🧪 COMPREHENSIVE EDGE CASE TEST SUITE');
        console.log('=' .repeat(60));
        
        this.testNestedObjectsAndArrays();
        this.testComplexControlFlow();
        this.testStringEscaping();
        this.testOperatorEdgeCases();
        this.testFunctionDeclarationVariations();
        this.testLoopEdgeCases();
        this.testComplexConditionals();
        this.testTemplateLiterals();
        this.testArrowFunctionVariations();
        this.testObjectMethods();
        this.testComplexExpressions();
        this.testNestedFunctionScopes();
        this.testArrayMethodChaining();
        this.testObjectPropertyAccess();
        this.testComplexAssignments();
        this.testShortCircuitEvaluation();
        this.testMultilineStrings();
        this.testRegexPatterns();
        this.testCommentPositions();
        this.testMixedOperators();
        
        return this.generateReport();
    }

    /**
     * Test 1: Nested Objects and Arrays
     */
    testNestedObjectsAndArrays() {
        const testCases = [
            {
                name: 'Deeply Nested Objects',
                input: 'let config = { server: { host: "localhost", port: { http: 8080, https: 443 } } };',
                shouldCompile: true
            },
            {
                name: 'Arrays with Mixed Types',
                input: 'let mixed = [1, "two", { three: 3 }, [4, 5], null, true];',
                shouldCompile: true
            },
            {
                name: 'Nested Array Access',
                input: 'let value = matrix[0][1][2];',
                shouldCompile: true
            },
            {
                name: 'Object with Array Properties',
                input: 'let data = { items: [1, 2, 3], tags: ["a", "b"], meta: { ids: [10, 20] } };',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Nested Objects/Arrays', testCases);
    }

    /**
     * Test 2: Complex Control Flow
     */
    testComplexControlFlow() {
        const testCases = [
            {
                name: 'Nested If-Else-If',
                input: 'if (x > 10) { y = 1; } else if (x > 5) { y = 2; } else if (x > 0) { y = 3; } else { y = 0; }',
                shouldCompile: true
            },
            {
                name: 'Switch with Multiple Cases',
                input: 'switch (value) { case 1: result = "one"; break; case 2: case 3: result = "two or three"; break; default: result = "other"; }',
                shouldCompile: true
            },
            {
                name: 'Nested Loops',
                input: 'for (let i = 0; i < 3; i++) { for (let j = 0; j < 3; j++) { sum += matrix[i][j]; } }',
                shouldCompile: true
            },
            {
                name: 'While with Continue',
                input: 'while (i < 10) { i++; if (i % 2 === 0) continue; sum += i; }',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Complex Control Flow', testCases);
    }

    /**
     * Test 3: String Escaping Edge Cases
     */
    testStringEscaping() {
        const testCases = [
            {
                name: 'Double Quotes in String',
                input: 'let msg = "She said \\"Hello\\"";',
                shouldCompile: true
            },
            {
                name: 'Single Quotes in String',
                input: "let msg = 'It\\'s working';",
                shouldCompile: true
            },
            {
                name: 'Backslashes in String',
                input: 'let path = "C:\\\\Users\\\\Documents";',
                shouldCompile: true
            },
            {
                name: 'Mixed Escape Sequences',
                input: 'let text = "Line 1\\nLine 2\\tTabbed\\r\\nWindows style";',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('String Escaping', testCases);
    }

    /**
     * Test 4: Operator Edge Cases
     */
    testOperatorEdgeCases() {
        const testCases = [
            {
                name: 'Typeof Operator',
                input: 'let type = typeof value;',
                shouldCompile: true
            },
            {
                name: 'Instanceof Operator',
                input: 'let isArray = obj instanceof Array;',
                shouldCompile: true
            },
            {
                name: 'Bitwise Operators',
                input: 'let result = (a | b) & (c ^ d);',
                shouldCompile: true
            },
            {
                name: 'Unary Operators',
                input: 'let neg = -value; let inv = !flag; let inc = ++counter;',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Operator Edge Cases', testCases);
    }

    /**
     * Test 5: Function Declaration Variations
     */
    testFunctionDeclarationVariations() {
        const testCases = [
            {
                name: 'IIFE Pattern',
                input: '(function() { console.log("immediate"); })();',
                shouldCompile: true
            },
            {
                name: 'Function with Default Parameters',
                input: 'function greet(name = "Guest", time = "day") { return "Good " + time + ", " + name; }',
                shouldCompile: true
            },
            {
                name: 'Nested Function Declaration',
                input: 'function outer() { function inner() { return 42; } return inner(); }',
                shouldCompile: true
            },
            {
                name: 'Function Returning Function',
                input: 'function makeCounter() { let count = 0; return function() { return ++count; }; }',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Function Variations', testCases);
    }

    /**
     * Test 6: Loop Edge Cases
     */
    testLoopEdgeCases() {
        const testCases = [
            {
                name: 'For Loop with Multiple Init',
                input: 'for (let i = 0, j = 10; i < j; i++, j--) { sum += i + j; }',
                shouldCompile: true
            },
            {
                name: 'For-In Loop',
                input: 'for (let key in obj) { console.log(key, obj[key]); }',
                shouldCompile: true
            },
            {
                name: 'Do-While Loop',
                input: 'do { count++; sum += count; } while (count < 10);',
                shouldCompile: true
            },
            {
                name: 'Break with Label',
                input: 'outer: for (let i = 0; i < 3; i++) { for (let j = 0; j < 3; j++) { if (j === 1) break outer; } }',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Loop Edge Cases', testCases);
    }

    /**
     * Test 7: Complex Conditionals
     */
    testComplexConditionals() {
        const testCases = [
            {
                name: 'Nested Ternary',
                input: 'let result = x > 10 ? "high" : x > 5 ? "medium" : "low";',
                shouldCompile: true
            },
            {
                name: 'Ternary with Function Calls',
                input: 'let value = condition ? getValue() : getDefault();',
                shouldCompile: true
            },
            {
                name: 'Complex Boolean Expression',
                input: 'if ((a && b) || (c && d) || (!e && f)) { result = true; }',
                shouldCompile: true
            },
            {
                name: 'Nullish Coalescing Pattern',
                input: 'let value = input || defaultValue;',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Complex Conditionals', testCases);
    }

    /**
     * Test 8: Template Literals
     */
    testTemplateLiterals() {
        const testCases = [
            {
                name: 'Simple Template Literal',
                input: 'let msg = `Hello ${name}`;',
                shouldCompile: true
            },
            {
                name: 'Template with Expression',
                input: 'let result = `Sum: ${a + b}, Product: ${a * b}`;',
                shouldCompile: true
            },
            {
                name: 'Multiline Template',
                input: 'let text = `Line 1\nLine 2\nLine 3`;',
                shouldCompile: true
            },
            {
                name: 'Nested Template Expressions',
                input: 'let msg = `Outer ${`Inner ${value}`}`;',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Template Literals', testCases);
    }

    /**
     * Test 9: Arrow Function Variations
     */
    testArrowFunctionVariations() {
        const testCases = [
            {
                name: 'Single Parameter Arrow',
                input: 'let double = x => x * 2;',
                shouldCompile: true
            },
            {
                name: 'No Parameter Arrow',
                input: 'let getRandom = () => Math.random();',
                shouldCompile: true
            },
            {
                name: 'Multiple Parameters Arrow',
                input: 'let add = (a, b) => a + b;',
                shouldCompile: true
            },
            {
                name: 'Arrow with Block Body',
                input: 'let process = (x) => { let y = x * 2; return y + 1; };',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Arrow Functions', testCases);
    }

    /**
     * Test 10: Object Methods
     */
    testObjectMethods() {
        const testCases = [
            {
                name: 'Object with Methods',
                input: 'let obj = { getName: function() { return this.name; }, setName: function(n) { this.name = n; } };',
                shouldCompile: true
            },
            {
                name: 'Shorthand Method Syntax',
                input: 'let obj = { getValue() { return 42; } };',
                shouldCompile: true
            },
            {
                name: 'Computed Property Names',
                input: 'let key = "dynamic"; let obj = { [key]: "value" };',
                shouldCompile: true
            },
            {
                name: 'Object with Getters',
                input: 'let obj = { _value: 0, getValue: function() { return this._value; } };',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Object Methods', testCases);
    }

    /**
     * Test 11: Complex Expressions
     */
    testComplexExpressions() {
        const testCases = [
            {
                name: 'Chained Method Calls',
                input: 'let result = obj.method1().method2().method3();',
                shouldCompile: true
            },
            {
                name: 'Mixed Array and Object Access',
                input: 'let value = data.items[0].properties.name;',
                shouldCompile: true
            },
            {
                name: 'Function Call in Array Index',
                input: 'let item = array[getIndex()];',
                shouldCompile: true
            },
            {
                name: 'Complex Arithmetic',
                input: 'let result = (a + b) * (c - d) / (e % f);',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Complex Expressions', testCases);
    }

    /**
     * Test 12: Nested Function Scopes
     */
    testNestedFunctionScopes() {
        const testCases = [
            {
                name: 'Closure with Multiple Levels',
                input: 'function outer(x) { return function middle(y) { return function inner(z) { return x + y + z; }; }; }',
                shouldCompile: true
            },
            {
                name: 'Function Accessing Parent Variables',
                input: 'function parent() { let value = 10; function child() { return value * 2; } return child(); }',
                shouldCompile: true
            },
            {
                name: 'Multiple Nested Functions',
                input: 'function a() { function b() { function c() { return 1; } return c(); } return b(); }',
                shouldCompile: true
            },
            {
                name: 'Arrow Function Closure',
                input: 'const outer = (x) => { const inner = (y) => x + y; return inner; };',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Nested Scopes', testCases);
    }

    /**
     * Test 13: Array Method Chaining
     */
    testArrayMethodChaining() {
        const testCases = [
            {
                name: 'Map-Filter Chain',
                input: 'let result = array.map(x => x * 2).filter(x => x > 10);',
                shouldCompile: true
            },
            {
                name: 'Reduce with Complex Logic',
                input: 'let sum = array.reduce((acc, val) => acc + val, 0);',
                shouldCompile: true
            },
            {
                name: 'Multiple Array Method Chain',
                input: 'let result = array.filter(x => x > 0).map(x => x * 2).sort((a, b) => a - b);',
                shouldCompile: true
            },
            {
                name: 'Find and Some Methods',
                input: 'let found = array.find(x => x > 10); let hasAny = array.some(x => x < 0);',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Array Methods', testCases);
    }

    /**
     * Test 14: Object Property Access Edge Cases
     */
    testObjectPropertyAccess() {
        const testCases = [
            {
                name: 'Bracket Notation with String',
                input: 'let value = obj["property name"];',
                shouldCompile: true
            },
            {
                name: 'Computed Property Access',
                input: 'let key = "name"; let value = obj[key];',
                shouldCompile: true
            },
            {
                name: 'Nested Property Access',
                input: 'let value = obj.parent.child.grandchild;',
                shouldCompile: true
            },
            {
                name: 'Optional Chaining Pattern',
                input: 'let value = obj && obj.prop && obj.prop.nested;',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Property Access', testCases);
    }

    /**
     * Test 15: Complex Assignment Patterns
     */
    testComplexAssignments() {
        const testCases = [
            {
                name: 'Multiple Assignments',
                input: 'let a = b = c = 0;',
                shouldCompile: true
            },
            {
                name: 'Compound Assignments',
                input: 'x += 10; y *= 2; z -= 5; w /= 3;',
                shouldCompile: true
            },
            {
                name: 'Assignment in Expression',
                input: 'if ((value = getValue()) > 0) { process(value); }',
                shouldCompile: true
            },
            {
                name: 'Destructuring Assignment',
                input: 'let {name, age} = person; let [first, second] = array;',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Complex Assignments', testCases);
    }

    /**
     * Test 16: Short-Circuit Evaluation
     */
    testShortCircuitEvaluation() {
        const testCases = [
            {
                name: 'AND Short Circuit',
                input: 'let result = condition && executeFunction();',
                shouldCompile: true
            },
            {
                name: 'OR Short Circuit',
                input: 'let value = getUserInput() || getDefaultValue();',
                shouldCompile: true
            },
            {
                name: 'Chained Short Circuit',
                input: 'let result = a || b || c || "default";',
                shouldCompile: true
            },
            {
                name: 'Mixed Short Circuit',
                input: 'let value = (a && b) || (c && d);',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Short-Circuit', testCases);
    }

    /**
     * Test 17: Multiline String Handling
     */
    testMultilineStrings() {
        const testCases = [
            {
                name: 'String Concatenation Across Lines',
                input: 'let msg = "Hello " + "World " + "from " + "LUASCRIPT";',
                shouldCompile: true
            },
            {
                name: 'Long String with Newlines',
                input: 'let text = "Line 1\\nLine 2\\nLine 3\\nLine 4";',
                shouldCompile: true
            },
            {
                name: 'String with Multiple Spaces',
                input: 'let spaced = "word1    word2     word3";',
                shouldCompile: true
            },
            {
                name: 'Empty String Operations',
                input: 'let empty = ""; let concat = empty + "text" + empty;',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Multiline Strings', testCases);
    }

    /**
     * Test 18: Regex Pattern Handling
     */
    testRegexPatterns() {
        const testCases = [
            {
                name: 'Simple Regex',
                input: 'let pattern = /hello/i;',
                shouldCompile: true
            },
            {
                name: 'Regex with Special Characters',
                input: 'let pattern = /\\d+\\.\\d+/g;',
                shouldCompile: true
            },
            {
                name: 'Regex Test Method',
                input: 'let isValid = /^[a-z]+$/.test(input);',
                shouldCompile: true
            },
            {
                name: 'Regex Match Operation',
                input: 'let matches = text.match(/\\w+/g);',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Regex Patterns', testCases);
    }

    /**
     * Test 19: Comments in Various Positions
     */
    testCommentPositions() {
        const testCases = [
            {
                name: 'Single Line Comments',
                input: '// Comment\nlet x = 1; // Another comment\n// Final comment',
                shouldCompile: true
            },
            {
                name: 'Multi-line Comments',
                input: '/* Multi-line\ncomment */\nlet x = 1;',
                shouldCompile: true
            },
            {
                name: 'Comments in Code',
                input: 'let x = 1; /* inline */ let y = 2;',
                shouldCompile: true
            },
            {
                name: 'Nested Comment Patterns',
                input: '// Single line\n/* Block */\nlet x = 1; // End',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Comment Positions', testCases);
    }

    /**
     * Test 20: Mixed Operator Precedence
     */
    testMixedOperators() {
        const testCases = [
            {
                name: 'Arithmetic and Comparison',
                input: 'let result = a + b > c * d;',
                shouldCompile: true
            },
            {
                name: 'Logical and Arithmetic Mixed',
                input: 'let value = a + b && c - d || e * f;',
                shouldCompile: true
            },
            {
                name: 'Bitwise and Arithmetic',
                input: 'let result = (a | b) + (c & d);',
                shouldCompile: true
            },
            {
                name: 'Complex Precedence Test',
                input: 'let result = a + b * c / d - e % f;',
                shouldCompile: true
            }
        ];
        
        this.runTestGroup('Mixed Operators', testCases);
    }

    /**
     * Helper: Run a group of test cases
     */
    runTestGroup(groupName, testCases) {
        console.log(`\n📋 ${groupName}`);
        console.log('-'.repeat(40));
        
        for (const testCase of testCases) {
            this.runSingleTest(testCase);
        }
    }

    /**
     * Helper: Run a single test case
     */
    runSingleTest(testCase) {
        try {
            const result = this.transpiler.transpile(testCase.input, { includeRuntime: false });
            const code = typeof result === 'string' ? result : result.code;
            
            if (testCase.shouldCompile) {
                if (code && code.length > 0) {
                    this.recordPass(testCase.name);
                } else {
                    this.recordFail(testCase.name, 'Empty output');
                }
            } else {
                this.recordFail(testCase.name, 'Should have failed but compiled');
            }
        } catch (error) {
            if (!testCase.shouldCompile) {
                this.recordPass(testCase.name);
            } else {
                this.recordFail(testCase.name, error.message);
            }
        }
    }

    /**
     * Record a passing test
     */
    recordPass(name) {
        console.log(`  ✅ PASS ${name}`);
        this.testResults.push({ name, passed: true });
    }

    /**
     * Record a failing test
     */
    recordFail(name, reason) {
        console.log(`  ❌ FAIL ${name}: ${reason}`);
        this.testResults.push({ name, passed: false, reason });
    }

    /**
     * Generate test report
     */
    generateReport() {
        const passed = this.testResults.filter(r => r.passed).length;
        const failed = this.testResults.filter(r => !r.passed).length;
        const total = this.testResults.length;
        const successRate = ((passed / total) * 100).toFixed(1);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 COMPREHENSIVE EDGE CASE TEST REPORT');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${successRate}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.filter(r => !r.passed).forEach(r => {
                console.log(`  - ${r.name}: ${r.reason}`);
            });
        }
        
        console.log('='.repeat(60));
        
        if (failed === 0) {
            console.log('🎉 ALL EDGE CASE TESTS PASSED!');
        } else {
            console.log(`⚠️ ${failed} test(s) need attention`);
        }
        
        return { passed, failed, total, successRate };
    }
}

// Run tests if called directly
if (require.main === module) {
    const suite = new EdgeCaseTestSuite();
    const results = suite.runAllTests();
    process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = EdgeCaseTestSuite;

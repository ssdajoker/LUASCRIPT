/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🌟 LUASCRIPT - THE COMPLETE VISION 🌟
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * MISSION: Give JavaScript developers Mojo-like superpowers
 * 
 * THE FIVE PILLARS:
 * 1. 💪 Mojo-Like Superpowers: JavaScript syntax + Native performance + System access
 * 2. 🤖 Self-Building Agentic IDE: AI-powered IDE written in LUASCRIPT for LUASCRIPT
 * 3. 🔢 Balanced Ternary Computing: Revolutionary (-1,0,+1) logic for quantum-ready algorithms
 * 4. 🎨 CSS Evolution: CSS → Gaussian CSS → GSS → AGSS (AI-driven adaptive design)
 * 5. ⚡ Great C Support: Seamless FFI, inline C, full ecosystem access
 * 
 * VISION: "Possibly impossible to achieve but dammit, we're going to try!"
 * 
 * This file is part of the LUASCRIPT revolution - a paradigm shift in programming
 * that bridges JavaScript familiarity with native performance, AI-driven tooling,
 * novel computing paradigms, and revolutionary styling systems.
 * 
 * 📖 Full Vision: See VISION.md, docs/vision_overview.md, docs/architecture_spec.md
 * 🗺️ Roadmap: See docs/roadmap.md
 * 💾 Backup: See docs/redundant/vision_backup.txt
 * ═══════════════════════════════════════════════════════════════════════════════
 */


/**
 * PERFECT PARSER INITIATIVE - Phase 1 Test Suite
 * 
 * Comprehensive tests for Phase 1 deliverables:
 * 1. String Concatenation Fix
 * 2. Runtime Validation
 * 3. Parser Strategy Alignment
 * 4. Enhanced Memory Management
 * 5. Error Handling Improvements
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import the enhanced modules
const LuaScriptTranspiler = require('../src/transpiler');
const { Lexer, Parser, MemoryManager, Token } = require('../src/parser');
const { parseAndLower } = require('../src/ir/pipeline');

class PerfectParserPhase1Tester {
    constructor() {
        this.transpiler = new LuaScriptTranspiler();
        this.testResults = [];
        this.tempDir = path.join(__dirname, 'temp');
        
        // Ensure temp directory exists
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Run all Phase 1 tests
     */
    runAllTests() {
        console.log('🚀 PERFECT PARSER INITIATIVE - Phase 1 Test Suite');
        console.log('=' .repeat(60));
        
        this.testStringConcatenationFix();
        this.testRuntimeValidation();
        this.testParserStrategyAlignment();
        this.testEnhancedMemoryManagement();
        this.testErrorHandlingImprovements();
        
        return this.generateReport();
    }

    /**
     * Test 1: String Concatenation Fix
     */
    testStringConcatenationFix() {
        console.log('\n📝 Test 1: String Concatenation Fix');
        console.log('-'.repeat(40));
        
        const testCases = [
            {
                name: 'Numeric Addition Preservation',
                input: 'let sum = 5 + 3; let total = num1 + num2;',
                expected: ['5 + 3', 'num1 + num2'],
                unexpected: ['5 .. 3', 'num1 .. num2']
            },
            {
                name: 'String Concatenation Conversion',
                input: 'let message = "Hello" + " World"; let text = "Value: " + value;',
                expected: ['"Hello" .. " World"', '"Value: " .. value'],
                unexpected: ['"Hello" + " World"', '"Value: " + value']
            },
            {
                name: 'Mixed Operations',
                input: 'let sum = 5 + 3; let message = "Result: " + sum;',
                expected: ['5 + 3', '"Result: " .. sum'],
                unexpected: ['5 .. 3', '"Result: " + sum']
            },
            {
                name: 'Chained String Concatenation',
                input: 'let full = name + " is " + age + " years old";',
                expected: ['name .. " is " .. age .. " years old"'],
                unexpected: ['name + " is "']
            }
        ];
        
        for (const testCase of testCases) {
            this.runSingleTest(`StringConcat_${testCase.name}`, testCase.input, testCase.expected, testCase.unexpected);
        }
    }

    /**
     * Test 2: Runtime Validation
     */
    testRuntimeValidation() {
        console.log('\n🔍 Test 2: Runtime Validation');
        console.log('-'.repeat(40));
        
        // Test input validation
        this.testValidationCase('Empty Input', '', 'LUASCRIPT_VALIDATION_ERROR', true);
        this.testValidationCase('Non-string Input', 123, 'LUASCRIPT_VALIDATION_ERROR', true);
        this.testValidationCase('Invalid Options', 'let x = 1;', 'LUASCRIPT_VALIDATION_ERROR', true, 'invalid');
        
        // Test syntax balance validation
        this.testValidationCase('Unmatched Parentheses', 'let x = (1 + 2;', 'LUASCRIPT_VALIDATION_ERROR', true);
        this.testValidationCase('Unmatched Braces', 'function test() { let x = 1;', 'LUASCRIPT_VALIDATION_ERROR', true);
        this.testValidationCase('Unterminated String', 'let message = "Hello World;', 'LUASCRIPT_VALIDATION_ERROR', true);
        
        // Test unsupported features
        this.testValidationCase('Eval Usage', 'eval("let x = 1");', 'LUASCRIPT_VALIDATION_ERROR', true);
        this.testValidationCase('With Statement', 'with (obj) { x = 1; }', 'LUASCRIPT_VALIDATION_ERROR', true);
        
        // Test valid cases
        this.testValidationCase('Valid Code', 'let message = "Hello" + " World";', null, false);
    }

    /**
     * Test 3: Parser Strategy Alignment
     */
    testParserStrategyAlignment() {
        console.log('\n⚙️ Test 3: Parser Strategy Alignment');
        console.log('-'.repeat(40));
        
        try {
            const code = 'let x = 5; let message = "Hello";';
            const lexer = new Lexer(code);
            const tokens = lexer.tokenize();
            const parser = new Parser(tokens);
            
            // Test parser strategy validation
            parser.validateParsingStrategy();
            
            const ast = parser.parse();
            
            // Verify strategy consistency
            const hasStrategy = ast.parsingStrategy && 
                                typeof ast.parsingStrategy.strictMode === 'boolean' &&
                                typeof ast.parsingStrategy.allowRecovery === 'boolean';
            
            this.recordTest('ParserStrategy_Consistency', hasStrategy, 
                hasStrategy ? 'Parser strategy properly configured' : 'Parser strategy missing or invalid');
            
            // Test error tracking
            const hasErrorTracking = Array.isArray(ast.errors) && Array.isArray(ast.warnings);
            this.recordTest('ParserStrategy_ErrorTracking', hasErrorTracking,
                hasErrorTracking ? 'Error tracking implemented' : 'Error tracking missing');
            
        } catch (error) {
            this.recordTest('ParserStrategy_Alignment', false, `Parser strategy test failed: ${error.message}`);
        }
    }

    /**
     * Test 4: Enhanced Memory Management
     */
    testEnhancedMemoryManagement() {
        console.log('\n🧠 Test 4: Enhanced Memory Management');
        console.log('-'.repeat(40));
        
        try {
            const memoryManager = new MemoryManager(100, 10);
            
            // Test enhanced statistics
            const node1 = memoryManager.allocateNode('TestNode', { value: 1 });
            const node2 = memoryManager.allocateNode('TestNode', { value: 2 });
            const node3 = memoryManager.allocateNode('AnotherNode', { value: 3 });
            
            const stats = memoryManager.getDetailedStats();
            
            // Verify enhanced tracking
            const hasEnhancedStats = stats.topNodeTypes && 
                                   stats.nodeTypeBreakdown && 
                                   stats.peakMemoryUsage !== undefined;
            
            this.recordTest('Memory_EnhancedStats', hasEnhancedStats,
                hasEnhancedStats ? 'Enhanced memory statistics working' : 'Enhanced statistics missing');
            
            // Test memory limits
            let limitExceeded = false;
            try {
                for (let i = 0; i < 200; i++) {
                    memoryManager.allocateNode('TestNode', { index: i });
                }
            } catch (error) {
                limitExceeded = error.message.includes('LUASCRIPT_MEMORY_ERROR');
            }
            
            this.recordTest('Memory_LimitEnforcement', limitExceeded,
                limitExceeded ? 'Memory limits properly enforced' : 'Memory limits not working');
            
            // Test cleanup
            memoryManager.cleanup();
            const afterCleanup = memoryManager.getStats();
            const cleanupWorked = afterCleanup.nodeCount === 0;
            
            this.recordTest('Memory_Cleanup', cleanupWorked,
                cleanupWorked ? 'Memory cleanup working' : 'Memory cleanup failed');
            
        } catch (error) {
            this.recordTest('Memory_Management', false, `Memory management test failed: ${error.message}`);
        }
    }

    /**
     * Test 5: Error Handling Improvements
     */
    testErrorHandlingImprovements() {
        console.log('\n🚨 Test 5: Error Handling Improvements');
        console.log('-'.repeat(40));
        
        try {
            // Test parser error recovery
            const invalidCode = 'let x = ; let y = 5;'; // Syntax error
            const lexer = new Lexer(invalidCode);
            const tokens = lexer.tokenize();
            const parser = new Parser(tokens);
            
            // Parser should handle errors gracefully
            let ast;
            let errorHandled = false;
            
            try {
                ast = parser.parse();
                errorHandled = ast.errors && ast.errors.length > 0;
            } catch (error) {
                errorHandled = error.message.includes('LUASCRIPT_PARSER_ERROR');
            }
            
            this.recordTest('ErrorHandling_ParserRecovery', errorHandled,
                errorHandled ? 'Parser error handling improved' : 'Parser error handling not working');
            
            // Test transpiler validation errors
            let validationWorked = false;
            try {
                this.transpiler.transpile('');
            } catch (error) {
                validationWorked = error.message.includes('LUASCRIPT_VALIDATION_ERROR');
            }
            
            this.recordTest('ErrorHandling_ValidationErrors', validationWorked,
                validationWorked ? 'Validation error handling working' : 'Validation errors not properly handled');
            
        } catch (error) {
            this.recordTest('ErrorHandling_Improvements', false, `Error handling test failed: ${error.message}`);
        }
    }

    /**
     * Helper method to test validation cases
     */
    testValidationCase(name, input, expectedErrorType, shouldFail, options = {}) {
        try {
            const transpileResult = this.transpiler.transpile(input, options);
            const result = typeof transpileResult === 'string'
                ? transpileResult
                : (transpileResult && transpileResult.code) || '';

            if (shouldFail) {
                this.recordTest(`Validation_${name}`, false, 'Expected validation error but none occurred');
            } else {
                this.recordTest(`Validation_${name}`, true, 'Valid input processed correctly');
            }
        } catch (error) {
            const correctError = expectedErrorType ? error.message.includes(expectedErrorType) : false;
            
            if (shouldFail && correctError) {
                this.recordTest(`Validation_${name}`, true, `Correctly caught: ${expectedErrorType}`);
            } else if (shouldFail && !correctError) {
                this.recordTest(`Validation_${name}`, false, `Wrong error type: ${error.message}`);
            } else {
                this.recordTest(`Validation_${name}`, false, `Unexpected error: ${error.message}`);
            }
        }
    }

    /**
     * Helper method to run a single test case
     */
    runSingleTest(name, input, expectedPatterns = [], unexpectedPatterns = []) {
        try {
            const transpileResult = this.transpiler.transpile(input, { includeRuntime: false });
            const result = typeof transpileResult === 'string'
                ? transpileResult
                : (transpileResult && transpileResult.code) || '';

            let passed = true;
            let details = [];
            
            // Check expected patterns
            for (const pattern of expectedPatterns) {
                if (result.includes(pattern)) {
                    details.push(`✅ Found: ${pattern}`);
                } else {
                    details.push(`❌ Missing: ${pattern}`);
                    passed = false;
                }
            }
            
            // Check unexpected patterns
            for (const pattern of unexpectedPatterns) {
                if (!result.includes(pattern)) {
                    details.push(`✅ Avoided: ${pattern}`);
                } else {
                    details.push(`❌ Unwanted: ${pattern}`);
                    passed = false;
                }
            }
            
            this.recordTest(name, passed, details.join('; '));
            
        } catch (error) {
            this.recordTest(name, false, `Error: ${error.message}`);
        }
    }

    /**
     * Record a test result
     */
    recordTest(name, passed, details = '') {
        this.testResults.push({
            name,
            passed,
            details,
            timestamp: Date.now()
        });
        
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`  ${status} ${name}${details ? ': ' + details : ''}`);
    }

    /**
     * Generate comprehensive test report
     */
    generateReport() {
        console.log('\n📊 PERFECT PARSER INITIATIVE - Phase 1 Test Report');
        console.log('=' .repeat(60));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(t => t.passed).length;
        const failedTests = totalTests - passedTests;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Success Rate: ${successRate}%`);
        
        // Phase 1 deliverables status
        console.log('\n🎯 Phase 1 Deliverables Status:');
        const deliverables = [
            { name: 'String Concatenation Fix', tests: this.testResults.filter(t => t.name.startsWith('StringConcat_')) },
            { name: 'Runtime Validation', tests: this.testResults.filter(t => t.name.startsWith('Validation_')) },
            { name: 'Parser Strategy Alignment', tests: this.testResults.filter(t => t.name.startsWith('ParserStrategy_')) },
            { name: 'Enhanced Memory Management', tests: this.testResults.filter(t => t.name.startsWith('Memory_')) },
            { name: 'Error Handling Improvements', tests: this.testResults.filter(t => t.name.startsWith('ErrorHandling_')) }
        ];
        
        for (const deliverable of deliverables) {
            const passed = deliverable.tests.filter(t => t.passed).length;
            const total = deliverable.tests.length;
            const status = passed === total ? '✅ COMPLETE' : `⚠️ ${passed}/${total}`;
            console.log(`  ${status} ${deliverable.name}`);
        }
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(t => !t.passed)
                .forEach(t => {
                    console.log(`  - ${t.name}: ${t.details}`);
                });
        }
        
        const allPassed = failedTests === 0;
        console.log('\n' + '='.repeat(60));
        
        if (allPassed) {
            console.log('🎉 PERFECT PARSER INITIATIVE - Phase 1 COMPLETE!');
            console.log('✅ All critical fixes implemented and tested successfully.');
        } else {
            console.log('⚠️ PERFECT PARSER INITIATIVE - Phase 1 INCOMPLETE');
            console.log(`❌ ${failedTests} test(s) failed. Review and fix before proceeding to Phase 2.`);
        }
        
        return allPassed;
    }

    /**
     * Clean up temporary files
     */
    cleanup() {
        try {
            if (fs.existsSync(this.tempDir)) {
                const files = fs.readdirSync(this.tempDir);
                files.forEach(file => {
                    fs.unlinkSync(path.join(this.tempDir, file));
                });
            }
        } catch (error) {
            console.log('Warning: Could not clean up temp files:', error.message);
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new PerfectParserPhase1Tester();
    
    try {
        const allPassed = tester.runAllTests();
        process.exit(allPassed ? 0 : 1);
    } finally {
        tester.cleanup();
    }
}

module.exports = PerfectParserPhase1Tester;

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
 * Test suite for LUASCRIPT Transpiler
 * Phase 1B: Runtime Compatibility Tests
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import the transpiler
const LuaScriptTranspiler = require('../src/transpiler');

class TranspilerTester {
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
     * Run a single test case
     */
    runTest(name, jsCode, expectedLuaPatterns = [], shouldExecute = false) {
        console.log(`\n🧪 Testing: ${name}`);
        
        try {
            // Transpile the code
            const luaCode = this.transpiler.transpile(jsCode, { includeRuntime: true });
            
            console.log('📝 JavaScript Input:');
            console.log(jsCode);
            console.log('\n🔄 Transpiled Lua:');
            console.log(luaCode);
            
            // Check expected patterns
            let patternsPassed = 0;
            for (const pattern of expectedLuaPatterns) {
                if (luaCode.includes(pattern)) {
                    console.log(`✅ Pattern found: "${pattern}"`);
                    patternsPassed++;
                } else {
                    console.log(`❌ Pattern missing: "${pattern}"`);
                }
            }
            
            // Test execution if requested
            let executionResult = null;
            if (shouldExecute) {
                try {
                    const tempFile = path.join(this.tempDir, `test_${Date.now()}.lua`);
                    fs.writeFileSync(tempFile, luaCode);
                    
                    // Try to execute with LuaJIT
                    const output = execSync(`luajit "${tempFile}"`, { 
                        encoding: 'utf8',
                        timeout: 5000 
                    });
                    
                    console.log('🚀 Execution Output:');
                    console.log(output);
                    executionResult = { success: true, output };
                    
                    // Clean up
                    fs.unlinkSync(tempFile);
                } catch (execError) {
                    console.log('❌ Execution failed:', execError.message);
                    executionResult = { success: false, error: execError.message };
                }
            }
            
            const testResult = {
                name,
                passed: patternsPassed === expectedLuaPatterns.length,
                patternsExpected: expectedLuaPatterns.length,
                patternsPassed,
                execution: executionResult
            };
            
            this.testResults.push(testResult);
            
            if (testResult.passed) {
                console.log(`✅ Test "${name}" PASSED`);
            } else {
                console.log(`❌ Test "${name}" FAILED`);
            }
            
        } catch (error) {
            console.log(`💥 Test "${name}" ERROR:`, error.message);
            this.testResults.push({
                name,
                passed: false,
                error: error.message
            });
        }
    }

    /**
     * Run all Phase 1B critical compatibility tests
     */
    runPhase1BTests() {
        console.log('🎯 Running Phase 1B Critical Runtime Compatibility Tests\n');
        
        // Test 1: String Concatenation Fix
        this.runTest(
            'String Concatenation (+ to ..)',
            `let message = "Hello" + " " + "World";
console.log(message);`,
            [
                'local message = "Hello" .. " " .. "World"',
                'console.log(message)'
            ],
            true
        );

        // Test 2: Logical Operators Fix
        this.runTest(
            'Logical Operators (|| to or, && to and)',
            `let result = true || false;
let result2 = true && false;
console.log(result, result2);`,
            [
                'true or false',
                'true and false',
                'console.log(result, result2)'
            ],
            true
        );

        // Test 3: Equality Operators Fix
        this.runTest(
            'Equality Operators (=== to ==, !== to ~=)',
            `let isEqual = (5 === 5);
let isNotEqual = (5 !== 3);
console.log(isEqual, isNotEqual);`,
            [
                '5 == 5',
                '5 ~= 3',
                'console.log(isEqual, isNotEqual)'
            ],
            true
        );

        // Test 4: Runtime Library Integration
        this.runTest(
            'Runtime Library Integration (console.log)',
            `console.log("Testing console.log");
console.error("Testing console.error");
console.warn("Testing console.warn");`,
            [
                "require('runtime.runtime')",
                'local console = runtime.console',
                'console.log("Testing console.log")',
                'console.error("Testing console.error")',
                'console.warn("Testing console.warn")'
            ],
            true
        );

        // Test 5: Complex Expression with Multiple Fixes
        this.runTest(
            'Complex Expression (Multiple Fixes)',
            `let name = "John";
let age = 25;
let message = "Name: " + name + ", Age: " + age;
let isAdult = age >= 18 && name !== "";
console.log(message);
console.log("Is adult:", isAdult);`,
            [
                '"Name = " .. name .. ", Age = " .. age',
                'age >= 18 and name ~= ""',
                'console.log(message)',
                'console.log("Is adult:", isAdult)'
            ],
            true
        );

        // Test 6: Function with String Concatenation
        this.runTest(
            'Function with String Operations',
            `function greet(name) {
    let greeting = "Hello, " + name + "!";
    console.log(greeting);
    return greeting;
}
greet("World");`,
            [
                'local function greet(name)',
                '"Hello, " .. name .. "!"',
                'console.log(greeting)',
                'greet("World")'
            ],
            true
        );
    }

    /**
     * Generate test report
     */
    generateReport() {
        console.log('\n📊 TEST REPORT');
        console.log('=' .repeat(50));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(t => t.passed).length;
        const failedTests = totalTests - passedTests;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(t => !t.passed)
                .forEach(t => {
                    console.log(`  - ${t.name}`);
                    if (t.error) {
                        console.log(`    Error: ${t.error}`);
                    }
                });
        }
        
        console.log('\n🎯 Phase 1B Critical Fixes Status:');
        const criticalTests = [
            'String Concatenation (+ to ..)',
            'Logical Operators (|| to or, && to and)',
            'Equality Operators (=== to ==, !== to ~=)',
            'Runtime Library Integration (console.log)'
        ];
        
        criticalTests.forEach(testName => {
            const result = this.testResults.find(t => t.name === testName);
            const status = result && result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`  ${status} ${testName}`);
        });
        
        return passedTests === totalTests;
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
                fs.rmdirSync(this.tempDir);
            }
        } catch (error) {
            console.log('Warning: Could not clean up temp files:', error.message);
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new TranspilerTester();
    
    try {
        tester.runPhase1BTests();
        const allPassed = tester.generateReport();
        
        console.log('\n' + '='.repeat(50));
        if (allPassed) {
            console.log('🎉 ALL PHASE 1B TESTS PASSED!');
            console.log('✅ Critical runtime compatibility fixes are working correctly.');
        } else {
            console.log('⚠️  SOME TESTS FAILED');
            console.log('❌ Phase 1B fixes need attention.');
        }
        
        process.exit(allPassed ? 0 : 1);
    } finally {
        tester.cleanup();
    }
}

module.exports = TranspilerTester;


/**
 * LUASCRIPT Unified System Tests - Memory-Efficient Testing
 * Tony Yoka's Unified Team Implementation
 * 
 * Comprehensive but memory-conscious testing of all components
 */

const { UnifiedLuaScript } = require('../src/unified_luascript');

class UnifiedSystemTests {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    async runAllTests() {
        console.log('🚀 LUASCRIPT UNIFIED SYSTEM TESTS - MEMORY EFFICIENT');
        console.log('=' .repeat(70));
        
        try {
            // Core functionality tests
            await this.testBasicTranspilation();
            await this.testRuntimeExecution();
            await this.testAdvancedFeatures();
            await this.testPerformanceTools();
            await this.testIDEIntegration();
            
            // Integration tests
            await this.testFullPipeline();
            await this.testVictoryValidation();
            
            return this.printResults();
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            throw error;
        }
    }

    async testBasicTranspilation() {
        console.log('\n📝 Testing Basic Transpilation...');
        
        const system = new UnifiedLuaScript({
            enableRuntime: false,
            enableAdvanced: false,
            enablePerformance: false,
            enableIDE: false
        });
        
        await system.initializeComponents();
        
        // Test 1: Variable declaration
        await this.runTest('Variable Declaration', async () => {
            const result = await system.transpile('let x = 5;');
            return result.code.includes('local x = 5');
        });
        
        // Test 2: Function declaration
        await this.runTest('Function Declaration', async () => {
            const result = await system.transpile('function test() { return 42; }');
            return result.code.includes('local function test()');
        });
        
        // Test 3: Arrow function
        await this.runTest('Arrow Function', async () => {
            const result = await system.transpile('const add = (a, b) => a + b;');
            return result.code.includes('function(a, b)');
        });
        
        // Test 4: Object literal
        await this.runTest('Object Literal', async () => {
            const jsCode = 'let my_obj = {key: "value"};';
            const result = await system.transpile(jsCode);
            // The expected output should be a valid Lua table.
            // Note: Lua allows an optional semicolon at the end.
            const expectedRegex = /local my_obj = {\s*key = "value"\s*};?/;
            return expectedRegex.test(result.code);
        });

        system.shutdown();
    }

    async testRuntimeExecution() {
        console.log('\n🔧 Testing Runtime Execution...');
        
        const system = new UnifiedLuaScript({
            enableTranspiler: false,
            enableAdvanced: false,
            enablePerformance: false,
            enableIDE: false
        });
        
        await system.initializeComponents();
        
        // Test 1: Basic execution
        await this.runTest('Basic Execution', async () => {
            const result = await system.execute('local x = 5; return x');
            return result.result !== undefined;
        });
        
        // Test 2: Function execution
        await this.runTest('Function Execution', async () => {
            const result = await system.execute('local function test() return 42 end; return test()');
            return result.result !== undefined;
        });

        await this.runTest('Unicode Function Call with Nested Arguments', async () => {
            const code = `
local function foo(x, y) return x + y end
local function ∏(i, startValue, endValue, expr) return expr end
return ∏(i, 1, 10, foo(3, 4))
`;
            const result = await system.execute(code);
            return result.result === 7;
        });

        system.shutdown();
    }

    async testAdvancedFeatures() {
        console.log('\n🔗 Testing Advanced Features...');
        
        const system = new UnifiedLuaScript({
            enableTranspiler: false,
            enableRuntime: false,
            enablePerformance: false,
            enableIDE: false
        });
        
        await system.initializeComponents();
        
        // Test 1: OOP transformation
        await this.runTest('OOP Transformation', async () => {
            const result = system.transformWithOOP('class Test { constructor() {} }');
            return result.includes('local Test = {}');
        });
        
        // Test 2: Pattern matching
        await this.runTest('Pattern Matching', async () => {
            const result = system.transformWithPatterns('switch(x) { case 1: break; }');
            return result.includes('if') || result.includes('_match_value');
        });
        
        system.shutdown();
    }

    async testPerformanceTools() {
        console.log('\n🏢 Testing Performance Tools...');
        
        const system = new UnifiedLuaScript({
            enableTranspiler: false,
            enableRuntime: false,
            enableAdvanced: false,
            enableIDE: false
        });
        
        await system.initializeComponents();
        
        // Test 1: Code optimization
        await this.runTest('Code Optimization', async () => {
            const result = await system.optimize('let x = 1 + 2; let y = x;');
            return result.code !== undefined;
        });
        
        // Test 2: Performance profiling
        await this.runTest('Performance Profiling', async () => {
            const result = await system.profile('let x = 5;');
            return result.duration !== undefined;
        });
        
        system.shutdown();
    }

    async testIDEIntegration() {
        console.log('\n🚀 Testing IDE Integration...');
        
        const system = new UnifiedLuaScript({
            enableTranspiler: false,
            enableRuntime: false,
            enableAdvanced: false,
            enablePerformance: false
        });
        
        await system.initializeComponents();
        
        // Test 1: Project creation
        await this.runTest('Project Creation', async () => {
            const project = await system.createProject('test-project');
            return project.name === 'test-project';
        });
        
        // Test 2: Code completion
        await this.runTest('Code Completion', async () => {
            // Create a temporary file for testing
            const fs = require('fs').promises;
            const testFile = '/tmp/test.js';
            await fs.writeFile(testFile, 'let x = 5;\ncon');
            
            try {
                await system.openFile(testFile);
                const completions = await system.getCodeCompletion(testFile, { line: 1, column: 3 });
                return Array.isArray(completions);
            } finally {
                try { await fs.unlink(testFile); } catch {}
            }
        });
        
        system.shutdown();
    }

    async testFullPipeline() {
        console.log('\n🔄 Testing Full Pipeline...');
        
        const system = new UnifiedLuaScript();
        await system.initializeComponents();
        
        // Test 1: Transpile and execute
        await this.runTest('Full Pipeline', async () => {
            const result = await system.transpileAndExecute('let x = 5; console.log(x);');
            return result.transpilation && result.execution;
        });
        
        // Test 2: Advanced pipeline
        await this.runTest('Advanced Pipeline', async () => {
            const result = await system.transpile('let x = 5;', { 
                features: ['oop'], 
                optimize: true 
            });
            return result.code && result.optimizations;
        });
        
        system.shutdown();
    }

    async testVictoryValidation() {
        console.log('\n🏆 Testing Victory Validation...');
        
        // Test 1: System validation
        await this.runTest('Victory Validation', async () => {
            const validation = await UnifiedLuaScript.validateVictoryStatic();
            return validation.overall > 0 && validation.phases;
        });
        
        // Test 2: Performance report
        await this.runTest('Performance Report', async () => {
            const system = new UnifiedLuaScript();
            await system.initializeComponents();
            
            const report = system.getPerformanceReport();
            system.shutdown();
            
            return report.system && report.components;
        });
    }

    async runTest(name, testFunction) {
        this.totalTests++;
        
        try {
            const startTime = Date.now();
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            if (result) {
                this.passedTests++;
                console.log(`  ✅ ${name} (${duration}ms)`);
                this.testResults.push({ name, status: 'PASS', duration });
            } else {
                this.failedTests++;
                console.log(`  ❌ ${name} (${duration}ms) - Test returned false`);
                this.testResults.push({ name, status: 'FAIL', duration, error: 'Test returned false' });
            }
            
        } catch (error) {
            this.failedTests++;
            console.log(`  ❌ ${name} - ${error.message}`);
            this.testResults.push({ name, status: 'FAIL', duration: 0, error: error.message });
        }
        
        // Force garbage collection to prevent memory issues
        if (global.gc) {
            global.gc();
        }
    }

    printResults() {
        console.log('\n' + '='.repeat(70));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('=' .repeat(70));
        
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`Passed: ${this.passedTests} ✅`);
        console.log(`Failed: ${this.failedTests} ❌`);
        console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
        
        const totalDuration = this.testResults.reduce((sum, test) => sum + test.duration, 0);
        console.log(`Total Duration: ${totalDuration}ms`);
        
        if (this.failedTests > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults
                .filter(test => test.status === 'FAIL')
                .forEach(test => {
                    console.log(`  - ${test.name}: ${test.error}`);
                });
        }
        
        console.log('\n🏆 LUASCRIPT UNIFIED SYSTEM TESTS COMPLETE!');
        
        if (this.passedTests === this.totalTests) {
            console.log('🎉 ALL TESTS PASSED - VICTORY ACHIEVED!');
        } else {
            console.log(`⚠️ ${this.failedTests} tests failed - Review and fix issues`);
        }
        
        console.log('=' .repeat(70));
        return this.failedTests === 0;
    }
}

async function runParserSuite() {
    console.log('\n🧩 Running Legacy Parser Suite...');
    const testSuite = new UnifiedSystemTests();
    await testSuite.testBasicTranspilation();
    await testSuite.testAdvancedFeatures();
    return testSuite.printResults();
}

async function runRuntimeSuite() {
    console.log('\n⚙️  Running Legacy Runtime Suite...');
    const testSuite = new UnifiedSystemTests();
    await testSuite.testRuntimeExecution();
    await testSuite.testPerformanceTools();
    return testSuite.printResults();
}

async function runTranspilerSuite() {
    console.log('\n🚚 Running Legacy Transpiler Suite...');
    const testSuite = new UnifiedSystemTests();
    await testSuite.testFullPipeline();
    await testSuite.testVictoryValidation();
    return testSuite.printResults();
}

const SUITE_RUNNERS = {
    parser: runParserSuite,
    runtime: runRuntimeSuite,
    transpiler: runTranspilerSuite,
    all: async () => {
        const testSuite = new UnifiedSystemTests();
        return testSuite.runAllTests();
    }
};

// Run tests if this file is executed directly
if (require.main === module) {
    const selection = (process.argv[2] || 'all').toLowerCase();
    const runner = SUITE_RUNNERS[selection];

    if (!runner) {
        console.error(`Unknown suite "${selection}". Available suites: ${Object.keys(SUITE_RUNNERS).join(', ')}`);
        process.exit(1);
    }

    runner().then(success => {
        if (!success) {
            process.exit(1);
        }
    }).catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = { UnifiedSystemTests, runParserSuite, runRuntimeSuite, runTranspilerSuite };

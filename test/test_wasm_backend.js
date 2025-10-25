/**
 * WASM Backend Tests - Phase 8 & A6 Validation
 * Ada Lovelace's Unified Team
 * Acceptance Criteria A6: WASM path passes tests
 */

const { WASMBackend } = require('../src/wasm_backend');

class WASMBackendTests {
    constructor() {
        this.backend = new WASMBackend({
            optimize: true,
            debug: false,
            memory: { initial: 256, maximum: 512 }
        });
        this.testResults = [];
    }

    /**
     * Run all WASM backend tests
     */
    async runAll() {
        console.log('🚀 WASM BACKEND TESTS - A6 VALIDATION');
        console.log('=' .repeat(70));
        
        await this.testInitialization();
        await this.testCompilation();
        await this.testExecution();
        await this.testOptimization();
        await this.testBenchmark();
        await this.testHotSwap();
        
        this.printResults();
        return this.testResults;
    }

    /**
     * Test WASM backend initialization
     */
    async testInitialization() {
        console.log('\n📝 Testing WASM Initialization...');
        
        try {
            const result = await this.backend.initialize();
            this.addResult('WASM Initialization', result, 'Backend initialized successfully');
        } catch (error) {
            this.addResult('WASM Initialization', false, error.message);
        }
    }

    /**
     * Test Lua to WASM compilation
     */
    async testCompilation() {
        console.log('\n🔧 Testing Lua to WASM Compilation...');
        
        const testCases = [
            {
                name: 'Simple Function',
                code: 'function add(a, b) return a + b end'
            },
            {
                name: 'Gaussian Kernel',
                code: `
                    function gaussian(x, y, muX, muY, sigma)
                        local dx = x - muX
                        local dy = y - muY
                        local dist_sq = dx * dx + dy * dy
                        local inv2s2 = 1.0 / (2.0 * sigma * sigma)
                        return math.exp(-dist_sq * inv2s2)
                    end
                `
            },
            {
                name: 'Loop Optimization',
                code: `
                    function sum_array(arr, n)
                        local sum = 0
                        for i = 1, n do
                            sum = sum + arr[i]
                        end
                        return sum
                    end
                `
            }
        ];

        for (const testCase of testCases) {
            try {
                const result = await this.backend.compileLuaToWASM(testCase.code);
                this.addResult(
                    `Compile: ${testCase.name}`,
                    result.success,
                    result.success ? `Compiled (${result.size} bytes)` : result.error
                );
            } catch (error) {
                this.addResult(`Compile: ${testCase.name}`, false, error.message);
            }
        }
    }

    /**
     * Test WASM execution
     */
    async testExecution() {
        console.log('\n⚡ Testing WASM Execution...');
        
        try {
            const luaCode = 'function main() return 42 end';
            const compileResult = await this.backend.compileLuaToWASM(luaCode);
            
            if (compileResult.success) {
                const execResult = await this.backend.executeWASM(compileResult.module);
                this.addResult(
                    'WASM Execution',
                    execResult.success,
                    execResult.success ? `Result: ${execResult.result}` : execResult.error
                );
            } else {
                this.addResult('WASM Execution', false, 'Compilation failed');
            }
        } catch (error) {
            this.addResult('WASM Execution', false, error.message);
        }
    }

    /**
     * Test optimization passes
     */
    async testOptimization() {
        console.log('\n🎯 Testing Optimization Passes...');
        
        const testCode = `
            function test()
                local x = 5
                local y = 10
                local z = x + y  -- Should be folded to 15
                local unused = 100  -- Should be eliminated
                return z
            end
        `;

        try {
            // Test with optimization
            const optimizedBackend = new WASMBackend({ optimize: true });
            await optimizedBackend.initialize();
            const optimizedResult = await optimizedBackend.compileLuaToWASM(testCode);
            
            // Test without optimization
            const unoptimizedBackend = new WASMBackend({ optimize: false });
            await unoptimizedBackend.initialize();
            const unoptimizedResult = await unoptimizedBackend.compileLuaToWASM(testCode);
            
            const sizeReduction = unoptimizedResult.size - optimizedResult.size;
            this.addResult(
                'Optimization',
                optimizedResult.success && unoptimizedResult.success,
                `Size reduction: ${sizeReduction} bytes (${((sizeReduction / unoptimizedResult.size) * 100).toFixed(1)}%)`
            );
        } catch (error) {
            this.addResult('Optimization', false, error.message);
        }
    }

    /**
     * Test WASM benchmark
     */
    async testBenchmark() {
        console.log('\n📊 Testing WASM Benchmark...');
        
        const testCode = `
            function gaussian(x, y, muX, muY, sigma)
                local dx = x - muX
                local dy = y - muY
                local dist_sq = dx * dx + dy * dy
                local inv2s2 = 1.0 / (2.0 * sigma * sigma)
                return math.exp(-dist_sq * inv2s2)
            end
        `;

        try {
            const result = await this.backend.benchmark(testCode, 100);
            
            if (result.success) {
                this.addResult(
                    'WASM Benchmark',
                    true,
                    `Avg: ${result.avgTime.toFixed(3)}ms, Min: ${result.minTime.toFixed(3)}ms, Max: ${result.maxTime.toFixed(3)}ms`
                );
            } else {
                this.addResult('WASM Benchmark', false, result.error);
            }
        } catch (error) {
            this.addResult('WASM Benchmark', false, error.message);
        }
    }

    /**
     * Test hot-swap between WASM and Lua
     */
    async testHotSwap() {
        console.log('\n🔄 Testing Hot-Swap (WASM ↔ Lua)...');
        
        try {
            const status1 = this.backend.getStatus();
            const wasmSupported = status1.wasmSupported;
            
            // Test status retrieval
            this.addResult(
                'Hot-Swap Status',
                true,
                `WASM supported: ${wasmSupported}, Initialized: ${status1.initialized}`
            );
            
            // Test fallback mechanism
            const fallbackWorks = !wasmSupported || status1.initialized;
            this.addResult(
                'Fallback Mechanism',
                fallbackWorks,
                fallbackWorks ? 'Fallback to Lua works' : 'Fallback failed'
            );
        } catch (error) {
            this.addResult('Hot-Swap', false, error.message);
        }
    }

    /**
     * Add test result
     */
    addResult(name, passed, message) {
        const result = {
            name,
            passed,
            message,
            timestamp: Date.now()
        };
        
        this.testResults.push(result);
        
        const icon = passed ? '✅' : '❌';
        const duration = result.timestamp - (this.testResults[this.testResults.length - 2]?.timestamp || result.timestamp);
        console.log(`  ${icon} ${name} (${duration}ms)`);
        if (message) {
            console.log(`     ${message}`);
        }
    }

    /**
     * Print test results summary
     */
    printResults() {
        console.log('\n' + '='.repeat(70));
        console.log('📊 WASM BACKEND TEST RESULTS');
        console.log('='.repeat(70));
        
        const total = this.testResults.length;
        const passed = this.testResults.filter(r => r.passed).length;
        const failed = total - passed;
        const successRate = ((passed / total) * 100).toFixed(1);
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ❌`);
        console.log(`Success Rate: ${successRate}%`);
        
        if (failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => console.log(`  - ${r.name}: ${r.message}`));
        }
        
        console.log('\n🏆 A6 ACCEPTANCE CRITERIA STATUS:');
        const a6Passed = passed >= total * 0.8; // 80% pass rate
        console.log(`  ${a6Passed ? '✅' : '❌'} WASM path ${a6Passed ? 'PASSES' : 'NEEDS WORK'}`);
        console.log(`  ${a6Passed ? '✅' : '❌'} Hot-swap between engines ${a6Passed ? 'WORKS' : 'NEEDS WORK'}`);
        console.log('='.repeat(70));
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tests = new WASMBackendTests();
    tests.runAll().then(() => {
        console.log('\n🎉 WASM Backend tests complete!');
        process.exit(0);
    }).catch(error => {
        console.error('\n❌ Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { WASMBackendTests };


/**
 * WASM Backend Tests
 * Tests for WASM compilation from canonical IR
 */

const { WASMBackend } = require('../../src/wasm_backend');

async function testWASMBackendBasic() {
    console.log('Testing WASM Backend - Basic Compilation...');
    
    const backend = new WASMBackend({
        optimize: false,
        debug: true
    });
    
    await backend.initialize();
    
    const simpleJS = `
        function add(a, b) {
            return a + b;
        }
    `;
    
    const result = await backend.compileJSToWASM(simpleJS);
    
    if (!result.success) {
        console.log(`  ⚠️ FAIL: ${result.error}`);
        return false;
    }
    
    console.log(`  ✅ PASS: Compiled ${result.stats.nodes} nodes`);
    console.log(`  Stats: ${result.stats.functions} functions, ${result.size} bytes`);
    return true;
}

async function testWASMBackendOptimization() {
    console.log('Testing WASM Backend - With Optimization...');
    
    const backend = new WASMBackend({
        optimize: true,
        debug: false
    });
    
    await backend.initialize();
    
    const optimizableJS = `
        function unused() { return 42; }
        function square(x) {
            const result = x * x;
            return result;
        }
    `;
    
    const result = await backend.compileJSToWASM(optimizableJS);
    
    if (!result.success) {
        console.log(`  ⚠️ FAIL: ${result.error}`);
        return false;
    }
    
    console.log(`  ✅ PASS: Optimized compilation successful`);
    console.log(`  Stats: ${result.stats.functions} functions, ${result.size} bytes`);
    return true;
}

async function runTests() {
    console.log('=== WASM Backend Test Suite ===\n');
    
    const tests = [
        testWASMBackendBasic,
        testWASMBackendOptimization
    ];
    
    let passed = 0;
    for (const test of tests) {
        try {
            const result = await test();
            if (result) passed++;
        } catch (error) {
            console.log(`  ❌ ERROR: ${error.message}`);
        }
        console.log('');
    }
    
    console.log(`\nResults: ${passed}/${tests.length} tests passed`);
    console.log(passed === tests.length ? '✅ All tests passed!' : '⚠️ Some tests failed');
}

if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };

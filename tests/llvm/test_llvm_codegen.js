
/**
 * LLVM IR Codegen Tests
 * Tests for LLVM IR code generation
 */

const { LLVMCodegen } = require('../../src/llvm/codegen');
const { parseAndLower } = require('../../src/ir/pipeline');

function testCodegenInit() {
    console.log('Testing LLVM Codegen - Initialization...');
    
    const codegen = new LLVMCodegen({
        targetTriple: 'x86_64-unknown-linux-gnu',
        optimizationLevel: 2
    });
    
    if (!codegen.options) {
        console.log('  ⚠️ FAIL: Options not initialized');
        return false;
    }
    
    console.log(`  ✅ PASS: Codegen initialized for ${codegen.options.targetTriple}`);
    return true;
}

function testSimpleFunction() {
    console.log('Testing LLVM Codegen - Simple Function...');
    
    try {
        const jsCode = `
            function add(a, b) {
                return a + b;
            }
        `;
        
        const ir = parseAndLower(jsCode);
        const codegen = new LLVMCodegen();
        const llvmIR = codegen.compileModule(ir);
        
        if (!llvmIR.includes('define')) {
            console.log('  ⚠️ FAIL: No function definition in output');
            return false;
        }
        
        if (!llvmIR.includes('fadd')) {
            console.log('  ⚠️ FAIL: Addition operation not found');
            return false;
        }
        
        console.log(`  ✅ PASS: Generated LLVM IR (${llvmIR.length} chars)`);
        return true;
    } catch (error) {
        console.log(`  ⚠️ FAIL: ${error.message}`);
        return false;
    }
}

function testModuleGeneration() {
    console.log('Testing LLVM Codegen - Module Generation...');
    
    try {
        const jsCode = `
            function multiply(x, y) {
                return x * y;
            }
            function divide(a, b) {
                return a / b;
            }
        `;
        
        const ir = parseAndLower(jsCode);
        const codegen = new LLVMCodegen();
        const llvmIR = codegen.compileModule(ir);
        
        if (!llvmIR.includes('ModuleID')) {
            console.log('  ⚠️ FAIL: No module ID in output');
            return false;
        }
        
        if (!llvmIR.includes('target triple')) {
            console.log('  ⚠️ FAIL: No target triple specified');
            return false;
        }
        
        // Should have both functions
        const funcCount = (llvmIR.match(/define /g) || []).length;
        if (funcCount < 2) {
            console.log(`  ⚠️ FAIL: Expected 2 functions, found ${funcCount}`);
            return false;
        }
        
        console.log(`  ✅ PASS: Module generated with ${funcCount} functions`);
        return true;
    } catch (error) {
        console.log(`  ⚠️ FAIL: ${error.message}`);
        return false;
    }
}

function runTests() {
    console.log('=== LLVM Codegen Test Suite ===\n');
    
    const tests = [
        testCodegenInit,
        testSimpleFunction,
        testModuleGeneration
    ];
    
    let passed = 0;
    for (const test of tests) {
        try {
            const result = test();
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
    runTests();
}

module.exports = { runTests };

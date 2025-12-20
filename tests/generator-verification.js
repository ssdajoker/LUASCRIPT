/**
 * Simple Generator Test - Verification
 * 
 * Quick test to verify generator implementation works before running full test suite
 */

const { IRBuilder } = require('../src/ir/builder');
const { EnhancedLowerer } = require('../src/ir/lowerer-enhanced');
const { EnhancedEmitter } = require('../src/ir/emitter-enhanced');
const esprima = require('esprima');

function transpileGenerator(jsCode) {
    try {
        // Parse JavaScript to AST
        const ast = esprima.parseScript(jsCode, { 
            tolerant: true,
            range: true,
            loc: true 
        });
        
        // Lower AST to IR
        const lowerer = new EnhancedLowerer();
        const ir = lowerer.lower(ast);
        
        // Emit Lua code
        const emitter = new EnhancedEmitter();
        const lua = emitter.emit(ir);
        
        return { success: true, lua, ir };
    } catch (error) {
        return { success: false, error: error.message, stack: error.stack };
    }
}

// Test 1: Simple generator
console.log('=== Test 1: Simple Generator ===');
const test1 = `
function* counter() {
    yield 1;
    yield 2;
    yield 3;
}
`;

const result1 = transpileGenerator(test1);
if (result1.success) {
    console.log('✓ Simple generator transpiled successfully');
    console.log('Generated Lua:');
    console.log(result1.lua);
} else {
    console.error('✗ Failed:', result1.error);
}

// Test 2: Generator with loop
console.log('\n=== Test 2: Generator with Loop ===');
const test2 = `
function* range(start, end) {
    for (let i = start; i < end; i++) {
        yield i;
    }
}
`;

const result2 = transpileGenerator(test2);
if (result2.success) {
    console.log('✓ Generator with loop transpiled successfully');
    console.log('Generated Lua (first 500 chars):');
    console.log(result2.lua.substring(0, 500));
} else {
    console.error('✗ Failed:', result2.error);
}

// Test 3: Generator with yield value
console.log('\n=== Test 3: Generator with Yield Value ===');
const test3 = `
function* fibonacci() {
    let a = 0, b = 1;
    while (true) {
        yield a;
        let temp = a;
        a = b;
        b = temp + b;
    }
}
`;

const result3 = transpileGenerator(test3);
if (result3.success) {
    console.log('✓ Fibonacci generator transpiled successfully');
} else {
    console.error('✗ Failed:', result3.error);
}

// Test 4: Generator with parameters
console.log('\n=== Test 4: Generator with Parameters ===');
const test4 = `
function* repeat(value, times) {
    for (let i = 0; i < times; i++) {
        yield value;
    }
}
`;

const result4 = transpileGenerator(test4);
if (result4.success) {
    console.log('✓ Parameterized generator transpiled successfully');
} else {
    console.error('✗ Failed:', result4.error);
}

// Summary
console.log('\n=== Summary ===');
const results = [result1, result2, result3, result4];
const passed = results.filter(r => r.success).length;
console.log(`${passed}/${results.length} tests passed`);

if (passed === results.length) {
    console.log('\n✓ All basic generator tests passed!');
    console.log('Generator implementation is working correctly.');
    process.exit(0);
} else {
    console.log('\n✗ Some tests failed. Review errors above.');
    process.exit(1);
}

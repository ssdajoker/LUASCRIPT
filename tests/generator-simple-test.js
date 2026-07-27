/**
 * Simplified Generator Test - Check Lua Output
 */

const esprima = require('esprima');
const { EnhancedLowerer } = require('../src/ir/lowerer-enhanced');
const { EnhancedEmitter } = require('../src/ir/emitter-enhanced');

function transpile(jsCode) {
    const ast = esprima.parseScript(jsCode, { tolerant: true });
    const lowerer = new EnhancedLowerer();
    const ir = lowerer.lower(ast);
    const emitter = new EnhancedEmitter();
    return emitter.emit(ir);
}

console.log('=== Test 1: Simple Generator with Yields ===');
const code1 = `
function* counter() {
    yield 1;
    yield 2;
    yield 3;
}
`;

try {
    const lua1 = transpile(code1);
    console.log(lua1);
    
    if (lua1.includes('coroutine.yield')) {
        console.log('\n✓ Generator with yields transpiled successfully!');
        console.log('✓ Yield statements are being emitted as coroutine.yield()');
    } else {
        console.log('\n✗ Warning: Yield statements not found in output');
    }
} catch (e) {
    console.error('Error:', e.message);
}

console.log('\n=== Test 2: Generator with Loop ===');
const code2 = `
function* range(n) {
    for (let i = 0; i < n; i++) {
        yield i;
    }
}
`;

try {
    const lua2 = transpile(code2);
    console.log(lua2.substring(0, 1000));
} catch (e) {
    console.error('Error:', e.message);
}

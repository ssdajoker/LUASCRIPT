/**
 * Full Generator Transpilation Test
 * Tests complete transpilation pipeline including yield statements
 */

const esprima = require('esprima');
const { EnhancedLowerer } = require('../src/ir/lowerer-enhanced');
const { EnhancedEmitter } = require('../src/ir/emitter-enhanced');

function fullTranspile(jsCode) {
    try {
        // Step 1: Parse
        console.log('Parsing JavaScript...');
        const ast = esprima.parseScript(jsCode, { 
            tolerant: true,
            range: true,
            loc: true 
        });
        console.log('AST:', JSON.stringify(ast, null, 2).substring(0, 500));
        
        // Step 2: Lower to IR
        console.log('\nLowering to IR...');
        const lowerer = new EnhancedLowerer();
        const ir = lowerer.lower(ast);
        console.log('IR:', JSON.stringify(ir, null, 2).substring(0, 800));
        
        // Step 3: Emit Lua
        console.log('\nEmitting Lua...');
        const emitter = new EnhancedEmitter();
        const lua = emitter.emit(ir);
        
        return { success: true, lua, ir, ast };
    } catch (error) {
        return { success: false, error: error.message, stack: error.stack };
    }
}

// Test simple generator with yields
const code = `
function* counter() {
    yield 1;
    yield 2;
    yield 3;
}
`;

console.log('=== Testing Generator with Yield Statements ===\n');
console.log('JavaScript Input:');
console.log(code);

const result = fullTranspile(code);

if (result.success) {
    console.log('\n=== Generated Lua ===');
    console.log(result.lua);
} else {
    console.error('\n✗ Error:', result.error);
    console.error(result.stack);
}

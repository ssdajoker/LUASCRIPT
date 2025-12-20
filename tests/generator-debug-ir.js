/**
 * Debug Generator IR
 */

const esprima = require('esprima');
const { EnhancedLowerer } = require('../src/ir/lowerer-enhanced');
const util = require('util');

const code = `
function* counter() {
    yield 1;
}
`;

console.log('=== Parsing ===');
const ast = esprima.parseScript(code, { tolerant: true });
console.log('AST generator flag:', ast.body[0].generator);
console.log('AST body type:', ast.body[0].body.type);
console.log('AST body statements:', ast.body[0].body.body.length);
console.log('First statement type:', ast.body[0].body.body[0].type);

console.log('\n=== Lowering ===');
const lowerer = new EnhancedLowerer();
const ir = lowerer.lower(ast);

// Safe stringify - avoid circular references
function safeStringify(obj, depth = 0) {
    if (depth > 3) return '[...]';
    if (obj === null) return 'null';
    if (typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) {
        return '[' + obj.map(item => safeStringify(item, depth + 1)).join(', ') + ']';
    }
    
    const pairs = [];
    for (const [key, value] of Object.entries(obj)) {
        if (key === 'loc' || key === 'metadata' || key === 'parent') continue;
        pairs.push(`"${key}": ${safeStringify(value, depth + 1)}`);
    }
    return '{' + pairs.join(', ') + '}';
}

console.log('IR structure:');
console.log(safeStringify(ir));

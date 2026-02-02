const Transpiler = require('./src/transpiler');
const transpiler = new Transpiler();

const js = `const add = function(a, b) {
    return a + b;
};`;

const result = transpiler.transpile(js, 'test.js');
console.log('=== OUTPUT ===');
console.log(result.code);
console.log('\n=== CONTAINS "function"? ===');
console.log(result.code.includes('function'));

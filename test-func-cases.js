const { describe, it, expect } = require('./tests/parity/jest-lite');
const Transpiler = require('./src/transpiler');

const tests = [
  {
    name: 'function expression',
    code: `const add = function(a, b) {
    return a + b;
};`
  },
  {
    name: 'function expression not hoisted',
    code: `const notHoisted = function(x) {
  return x * 2;
};
const result = notHoisted(5);`
  },
  {
    name: 'named function expression',
    code: `const factorial = function fact(n) {
  if (n <= 1) {
    return 1;
  }
  return n * fact(n - 1);
};`
  }
];

const transpiler = new Transpiler();

tests.forEach(test => {
  try {
    console.log(`\n=== ${test.name} ===`);
    const result = transpiler.transpile(test.code, 'test.js');
    if (result.code.includes('function')) {
      console.log('✅ PASS');
    } else {
      console.log('❌ FAIL: No function keyword in output');
      console.log('Output:', result.code.substring(200, 400));
    }
  } catch (e) {
    console.log('❌ ERROR:', e.message);
  }
});

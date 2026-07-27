/**
 * STEP 1 & 2: PARSER DIAGNOSTICS
 * Identify exact failures in PHP and Dart parsers
 */

const { PHPParser } = require('../src/parsers/php_parser');
const { DartParser } = require('../src/parsers/dart_parser');

console.log('\n' + '═'.repeat(90));
console.log('DIAGNOSTIC: IDENTIFYING PHP AND DART PARSER FAILURES');
console.log('═'.repeat(90) + '\n');

const phpTests = [
  { name: 'Variable', code: '$x = 10;' },
  { name: 'String concat', code: '"Hello" . "World"' },
  { name: 'Array', code: '[1, 2, 3]' },
  { name: 'Function call', code: 'echo "test";' },
  { name: 'Object access', code: '$obj->method()' },
  { name: 'Ternary', code: '$x ? "yes" : "no"' },
  { name: 'Assignment ops', code: '$x += 5;' },
  { name: 'Comparison', code: '$a == $b' },
  { name: 'Logical', code: '$x && $y' },
  { name: 'New instance', code: 'new User("name")' }
];

console.log('📍 PHP PARSER - DETAILED FAILURE ANALYSIS\n');

for (const test of phpTests) {
  try {
    const parser = new PHPParser(test.code);
    const ast = parser.parse(test.code);
    console.log(`✅ ${test.name.padEnd(20)} PASS`);
  } catch (error) {
    console.log(`❌ ${test.name.padEnd(20)} FAIL`);
    console.log(`   Code: ${test.code}`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Stack: ${error.stack.split('\n')[1].trim()}\n`);
  }
}

const dartTests = [
  { name: 'Variable', code: 'var x = 10;' },
  { name: 'String', code: '"Hello Dart"' },
  { name: 'List', code: '[1, 2, 3]' },
  { name: 'Map', code: '{"key": "value"}' },
  { name: 'Function call', code: 'print("hello");' },
  { name: 'Cascade', code: 'obj..method1()..method2()' },
  { name: 'Null coalesce', code: 'x ?? "default"' },
  { name: 'Null safe', code: 'obj?.method()' },
  { name: 'Spread', code: '[...list1, ...list2]' },
  { name: 'Type', code: 'int x = 42;' }
];

console.log('\n📍 DART PARSER - DETAILED FAILURE ANALYSIS\n');

for (const test of dartTests) {
  try {
    const parser = new DartParser(test.code);
    const ast = parser.parse(test.code);
    console.log(`✅ ${test.name.padEnd(20)} PASS`);
  } catch (error) {
    console.log(`❌ ${test.name.padEnd(20)} FAIL`);
    console.log(`   Code: ${test.code}`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Stack: ${error.stack.split('\n')[1].trim()}\n`);
  }
}

console.log('\n' + '═'.repeat(90));
console.log('Diagnostics complete. See failures above for fix targets.');
console.log('═'.repeat(90) + '\n');

/**
 * CASCADE OPERATOR DIAGNOSTIC
 * Deep analysis of Dart cascade operator parsing
 */

const { DartParser } = require('../src/parsers/dart_parser');

console.log('='.repeat(80));
console.log('CASCADE OPERATOR DIAGNOSTIC');
console.log('='.repeat(80));

function analyzeCode(code, description) {
  console.log(`\n[TEST] ${description}`);
  console.log(`Code: ${code}`);
  
  try {
    const parser = new DartParser(code);
    const ast = parser.parse();
    const stats = parser.getMemoryStats();
    
    console.log(`\nAST Structure:`);
    console.log(JSON.stringify(ast, null, 2));
    console.log(`\nMemory: ${stats.objectCount} objects`);
    console.log(`Status: PASS`);
  } catch (error) {
    console.log(`\nStatus: FAIL`);
    console.log(`Error: ${error.message}`);
  }
}

// Test 1: Simple cascade
analyzeCode('obj..method1()', 'Simple cascade - single method');

// Test 2: Double cascade
analyzeCode('obj..method1()..method2()', 'Double cascade - two methods');

// Test 3: Triple cascade
analyzeCode('obj..method1()..method2()..method3()', 'Triple cascade - three methods');

// Test 4: Cascade with arguments
analyzeCode('obj..method1(5)..method2("test")', 'Cascade with arguments');

// Test 5: Cascade with property access
analyzeCode('obj..prop1..method1()', 'Cascade with property then method');

// Test 6: Full statement
analyzeCode('var x = obj..method1()..method2();', 'Cascade in variable declaration');

console.log('\n' + '='.repeat(80));
console.log('DIAGNOSTIC COMPLETE');
console.log('='.repeat(80));

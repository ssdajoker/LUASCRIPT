/**
 * True Memory Leak Test - Parse the same code repeatedly
 * This properly measures memory leaks vs variability
 */

const { PHPParser } = require('../src/parsers/php_parser');
const { DartParser } = require('../src/parsers/dart_parser');
const { RubyParser } = require('../src/parsers/ruby_parser');

console.log('\n' + '═'.repeat(90));
console.log('  TRUE MEMORY LEAK TEST - Parsing Same Code Repeatedly'.padStart(70));
console.log('═'.repeat(90) + '\n');

const testCode = {
  PHP: '$x = 10; $y = "hello"; echo $x;',
  Dart: 'var x = 10; var y = "hello"; print(x);',
  Ruby: 'x = 10; y = "hello"; puts x'
};

const parsers = [
  { name: 'PHP', Class: PHPParser, code: testCode.PHP },
  { name: 'Dart', Class: DartParser, code: testCode.Dart },
  { name: 'Ruby', Class: RubyParser, code: testCode.Ruby }
];

for (const parserDef of parsers) {
  console.log(`\n📊 ${parserDef.name} Parser - 200 Sequential Parses of SAME code`);
  console.log(`Code: ${parserDef.code}\n`);
  
  const snapshots = [];
  const times = [];
  
  for (let i = 0; i < 200; i++) {
    const start = Date.now();
    
    try {
      const parser = new parserDef.Class(parserDef.code);
      parser.parse();
      const stats = parser.getMemoryStats();
      snapshots.push(stats.objectCount);
    } catch (e) {
      snapshots.push(0);
    }
    
    times.push(Date.now() - start);
    
    if (i === 0 || i === 99 || i === 199) {
      console.log(`  Iteration ${i.toString().padEnd(3)}: ${snapshots[i].toString().padEnd(3)} objects`);
    }
  }
  
  const first = snapshots[0];
  const last = snapshots[199];
  const growth = ((last - first) / first * 100).toFixed(1);
  const min = Math.min(...snapshots);
  const max = Math.max(...snapshots);
  const avg = snapshots.reduce((a, b) => a + b) / snapshots.length;
  const avgTime = times.reduce((a, b) => a + b) / times.length;
  
  console.log(`\n  Statistics:`);
  console.log(`    First:  ${first} objects`);
  console.log(`    Last:   ${last} objects`);
  console.log(`    Growth: ${growth}%`);
  console.log(`    Min/Max: ${min} / ${max}`);
  console.log(`    Average: ${avg.toFixed(1)}`);
  console.log(`    Avg time per parse: ${avgTime.toFixed(2)}ms`);
  
  const status = Math.abs(parseFloat(growth)) < 15 ? '✅ PASS' : '❌ FAIL';
  console.log(`  ${status} (${growth}% growth threshold: 15%)`);
}

console.log('\n' + '═'.repeat(90) + '\n');

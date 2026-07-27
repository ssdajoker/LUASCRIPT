/**
 * Dart Parser Memory Test
 */

const { DartParser } = require('../src/parsers/dart_parser');

console.log('\n🧪 DART PARSER MEMORY TEST\n' + '='.repeat(70));

const tests = [
    {name: 'Variable', code: 'var x = 10;'},
    {name: 'String', code: '"Hello Dart"'},
    {name: 'Number', code: '42'},
    {name: 'Boolean', code: 'true'}
];

for (const test of tests) {
    console.log(`\n📝 ${test.name}: ${test.code}`);
    try {
        const parser = new DartParser(test.code);
        const ast = parser.parse();
        const stats = parser.getMemoryStats();
        console.log(`   ✅ Memory: ${stats.objectCount} objects, ${stats.utilization}`);
    } catch (error) {
        console.log(`   ⚠️  ${error.message}`);
    }
}

console.log(`\n\n📊 MEMORY LEAK TEST\n` + '='.repeat(70));

const snapshots = [];
for (let i = 0; i < 20; i++) {
    const parser = new DartParser(`var value${i} = ${i};`);
    parser.parse();
    snapshots.push(parser.getMemoryStats().objectCount);
    if (i % 5 === 0) console.log(`  Iteration ${i}: ${snapshots[i]} objects`);
}

const growth = ((snapshots[19] - snapshots[0]) / snapshots[0] * 100).toFixed(1);
console.log(`\n📈 Growth: ${snapshots[0]} → ${snapshots[19]} objects (${growth}%) ${Math.abs(growth) < 10 ? '✅' : '❌'}`);
console.log(`\n✅ DART PARSER TEST COMPLETE\n` + '='.repeat(70) + '\n');

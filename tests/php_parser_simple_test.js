/**
 * Simple PHP Parser Test (without PHP tags)
 */

const { PHPParser } = require('../src/parsers/php_parser');

console.log('\n🧪 PHP PARSER SIMPLE TEST\n' + '='.repeat(70));

// Test without PHP tags
const simpleTests = [
    {
        name: 'Variable assignment',
        code: '$x = 10;'
    },
    {
        name: 'String literal',
        code: '"Hello World"'
    },
    {
        name: 'Number',
        code: '42'
    },
    {
        name: 'Boolean',
        code: 'true'
    }
];

for (const test of simpleTests) {
    console.log(`\n📝 Test: ${test.name}`);
    console.log(`   Code: ${test.code}`);
    
    try {
        const parser = new PHPParser(test.code);
        const ast = parser.parse();
        const stats = parser.getMemoryStats();
        
        console.log(`   ✅ Parsed successfully`);
        console.log(`   📊 Memory: ${stats.objectCount} objects, ${stats.utilization} utilization`);
        console.log(`   📦 Pool: ${stats.pool.nodesPooled} nodes pooled`);
    } catch (error) {
        console.log(`   ⚠️  Parse error: ${error.message}`);
    }
}

// Memory leak test
console.log(`\n\n📊 MEMORY LEAK TEST\n` + '='.repeat(70));
console.log(`Running 20 sequential parses...\n`);

const memorySnapshots = [];

for (let i = 0; i < 20; i++) {
    const code = `$value${i} = ${i * 10};`;
    const parser = new PHPParser(code);
    const ast = parser.parse();
    const stats = parser.getMemoryStats();
    memorySnapshots.push(stats.objectCount);
    
    if (i % 5 === 0) {
        console.log(`  Iteration ${i}: ${stats.objectCount} objects`);
    }
}

const firstCount = memorySnapshots[0];
const lastCount = memorySnapshots[memorySnapshots.length - 1];
const growth = ((lastCount - firstCount) / firstCount * 100).toFixed(1);

console.log(`\n📈 Memory Growth Analysis:`);
console.log(`   First iteration: ${firstCount} objects`);
console.log(`   Last iteration:  ${lastCount} objects`);
console.log(`   Growth: ${growth}% ${Math.abs(growth) < 10 ? '✅ PASS' : '❌ FAIL'}`);

console.log(`\n✅ PHP PARSER TEST COMPLETE\n` + '='.repeat(70) + '\n');

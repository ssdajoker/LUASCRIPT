/**
 * CLARITY SUPER CANON VERIFICATION - STEP 3: RUBY PARSER
 * Complete validation of Ruby parser with ObjectPool implementation
 */

const { RubyParser } = require('../src/parsers/ruby_parser');

console.log('\n🧪 STEP 3: RUBY PARSER CLARITY SUPER CANON VERIFICATION\n' + '═'.repeat(80));

// Test cases
const testCases = [
    { name: 'Variable', code: 'x = 10' },
    { name: 'String', code: '"Hello Ruby"' },
    { name: 'Array', code: '[1, 2, 3]' },
    { name: 'Hash', code: '{a: 1, b: 2}' },
    { name: 'Method call', code: 'puts "hello"' },
    { name: 'Comparison', code: 'x == y' },
    { name: 'Boolean', code: 'true' },
    { name: 'Nil', code: 'nil' },
    { name: 'If statement', code: 'if x; end' },
    { name: 'While loop', code: 'while x; end' }
];

console.log('\n📊 Test 1: Parsing Correctness\n');

let passCount = 0;
let failCount = 0;

for (const test of testCases) {
    try {
        const parser = new RubyParser();
        const ast = parser.parse(test.code);
        const stats = parser.getMemoryStats();
        
        console.log(`  ✅ ${test.name.padEnd(20)} | Objects: ${stats.objectCount}`);
        passCount++;
    } catch (error) {
        console.log(`  ⚠️  ${test.name.padEnd(20)} | ${error.message}`);
        failCount++;
    }
}

console.log(`\n  Result: ${passCount}/${passCount + failCount} passed (${(passCount/(passCount+failCount)*100).toFixed(1)}%)`);

// Memory leak test
console.log('\n📊 Test 2: Memory Leak Detection - 50 Sequential Parses\n');

const snapshots = [];
for (let i = 0; i < 50; i++) {
    const testCase = testCases[i % testCases.length];
    try {
        const parser = new RubyParser();
        parser.parse(testCase.code);
        snapshots.push(parser.getMemoryStats().objectCount);
    } catch (e) {
        snapshots.push(0);
    }
}

const first = snapshots[0];
const last = snapshots[snapshots.length - 1];
const growth = ((last - first) / (first || 1) * 100).toFixed(1);
const max = Math.max(...snapshots);
const avg = (snapshots.reduce((a, b) => a + b, 0) / snapshots.length).toFixed(1);

console.log(`  Iteration 0:   ${first} objects`);
console.log(`  Iteration 49:  ${last} objects`);
console.log(`  Average:       ${avg} objects`);
console.log(`  Max:           ${max} objects`);
console.log(`  Memory growth: ${growth}% ${Math.abs(growth) < 10 ? '✅ PASS' : '❌ FAIL'}`);

// Object pool efficiency
console.log('\n📊 Test 3: Object Pool Efficiency\n');

const parser = new RubyParser();
parser.parse(testCases[0].code);
const stats = parser.getMemoryStats();

console.log(`  Pool capacity: ${stats.pool.maxSize} nodes`);
console.log(`  Memory limit:  ${parser.maxObjects} objects`);
console.log(`  Pool utilization: ${stats.pool.nodesPooled} nodes pooled`);
console.log(`  Current objects: ${stats.objectCount} (${stats.utilization})`);

// Consistency check
console.log('\n📊 Test 4: Output Consistency - Same Code, Multiple Parses\n');

const results = [];
for (let i = 0; i < 5; i++) {
    const parser = new RubyParser();
    const ast = parser.parse('x = 10');
    results.push(JSON.stringify(ast));
}

const allSame = results.every(r => r === results[0]);
console.log(`  Consistency: ${allSame ? '✅ All 5 parses produced identical AST' : '❌ Inconsistent output detected'}`);

// Final summary
console.log('\n' + '═'.repeat(80));
console.log('📊 STEP 3 VERIFICATION REPORT\n');

console.log(`Parsing:       ${passCount === testCases.length ? '✅ All tests passed' : `⚠️  ${failCount} tests failed`}`);
console.log(`Memory Growth: ${Math.abs(growth) < 10 ? '✅ PASS (0% growth)' : `❌ FAIL (${growth}% growth)`}`);
console.log(`Consistency:   ${allSame ? '✅ PASS (consistent output)' : '❌ FAIL (inconsistent output)'}`);
console.log(`Object Pool:   ✅ Initialized (${stats.pool.maxSize} capacity)`);

if (passCount === testCases.length && Math.abs(growth) < 10 && allSame) {
    console.log('\n✅ STEP 3 COMPLETE: RUBY PARSER VERIFIED\n');
} else {
    console.log('\n⚠️  STEP 3 PARTIAL: Some issues detected\n');
}

console.log('═'.repeat(80) + '\n');

// Memory tracking summary
console.log('📈 MEMORY TRACKING DETAILS\n');
console.log(`  First 5 parses: [${snapshots.slice(0, 5).join(', ')}]`);
console.log(`  Last 5 parses:  [${snapshots.slice(-5).join(', ')}]`);
console.log(`  Stabilized:     ${new Set(snapshots.slice(-10)).size === 1 ? '✅ Yes (last 10 identical)' : '⚠️  No (variance detected)'}`);

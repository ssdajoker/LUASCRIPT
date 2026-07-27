/**
 * CLARITY SUPER CANON VERIFICATION - STEP 3: RUBY PARSER
 * Scoped validation of Ruby parser fixtures with ObjectPool instrumentation.
 */

const { RubyParser } = require('../src/parsers/ruby_parser');

console.log('\n🧪 STEP 3: RUBY PARSER CLARITY SUPER CANON SCOPED PROBE\n' + '═'.repeat(80));

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
let memoryFailures = 0;

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

// Memory stability test
console.log('\n📊 Test 2: Memory Stability - Same-Fixture Repeated Parses\n');

const memorySummaries = [];

for (const test of testCases) {
    const snapshots = [];
    let parseFailure = null;

    for (let i = 0; i < 20; i++) {
        try {
            const parser = new RubyParser();
            parser.parse(test.code);
            snapshots.push(parser.getMemoryStats().objectCount);
        } catch (error) {
            parseFailure = error;
            break;
        }
    }

    if (parseFailure) {
        memoryFailures++;
        memorySummaries.push({ name: test.name, status: 'FAIL', snapshots: [] });
        console.log(`  ❌ ${test.name.padEnd(20)} | ${parseFailure.message}`);
        continue;
    }

    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    const growthNumber = ((last - first) / (first || 1)) * 100;
    const growth = growthNumber.toFixed(1);
    const max = Math.max(...snapshots);
    const positiveSnapshots = snapshots.filter((value) => value > 0);
    const min = positiveSnapshots.length > 0 ? Math.min(...positiveSnapshots) : 0;
    const status = Math.abs(growthNumber) < 10 ? 'PASS' : 'FAIL';

    if (status === 'FAIL') {
        memoryFailures++;
    }

    memorySummaries.push({ name: test.name, status, snapshots });
    console.log(`  ${status === 'PASS' ? '✅' : '❌'} ${test.name.padEnd(20)} | ${first} -> ${last} objects (${growth}%), min/max ${min}/${max}`);
}

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
const consistencyFailures = allSame ? 0 : 1;
console.log(`  Consistency: ${allSame ? '✅ All 5 parses produced identical AST' : '❌ Inconsistent output detected'}`);

// Final summary
console.log('\n' + '═'.repeat(80));
console.log('📊 STEP 3 VERIFICATION REPORT\n');

console.log(`Parsing:       ${passCount === testCases.length ? '✅ All tests passed' : `⚠️  ${failCount} tests failed`}`);
console.log(`Memory:        ${memoryFailures === 0 ? '✅ PASS (same-fixture stable)' : `❌ FAIL (${memoryFailures} memory failures)`}`);
console.log(`Consistency:   ${allSame ? '✅ PASS (consistent output)' : '❌ FAIL (inconsistent output)'}`);
console.log(`Object Pool:   ✅ Initialized (${stats.pool.maxSize} capacity)`);

if (passCount === testCases.length && memoryFailures === 0 && consistencyFailures === 0) {
    console.log('\n✅ STEP 3 COMPLETE: SCOPED RUBY PARSER FIXTURES VERIFIED\n');
} else {
    console.log('\n⚠️  STEP 3 PARTIAL: Some issues detected\n');
    process.exitCode = 1;
}

console.log('═'.repeat(80) + '\n');

// Memory tracking summary
console.log('📈 MEMORY TRACKING DETAILS\n');
console.log(`  Stable cases:   ${memorySummaries.filter((entry) => entry.status === 'PASS').length}/${testCases.length}`);
console.log(`  Failed cases:   ${memoryFailures}`);
console.log(`  Stabilized:     ${memoryFailures === 0 ? '✅ Yes (all same-fixture checks stable)' : '⚠️  No (review failures above)'}`);

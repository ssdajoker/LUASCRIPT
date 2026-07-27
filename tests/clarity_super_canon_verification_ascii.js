/**
 * CLARITY SUPER CANON VERIFICATION - ASCII VERSION
 * Comprehensive validation suite for PHP and Dart parsers
 * Plain ASCII output - no Unicode characters for maximum terminal compatibility
 */

const { PHPParser } = require('../src/parsers/php_parser');
const { DartParser } = require('../src/parsers/dart_parser');

const COLORS = {
  RESET: '\x1b[0m',
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m'
};

function log(message, color = 'RESET') {
  console.log(`${COLORS[color]}${message}${COLORS.RESET}`);
}

function header(title) {
  console.log(`\n${COLORS.CYAN}${'='.repeat(80)}${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}[HEADER] ${title.padEnd(70)}${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}${'='.repeat(80)}${COLORS.RESET}\n`);
}

function testSection(name) {
  console.log(`\n${COLORS.BLUE}[TEST] ${name}${COLORS.RESET}`);
}

// ============================================================================
// STEP 1: CLARITY SUPER CANON VERIFICATION - PHP AND DART
// ============================================================================

header('STEP 1: CLARITY SUPER CANON VERIFICATION - PHP & DART');

const parserTests = [
  {
    name: 'PHP Parser',
    ParserClass: PHPParser,
    testCases: [
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
    ]
  },
  {
    name: 'Dart Parser',
    ParserClass: DartParser,
    testCases: [
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
    ]
  }
];

const results = {};
let memoryFailures = 0;
let consistencyFailures = 0;

for (const parserTest of parserTests) {
  testSection(`${parserTest.name} - Parsing Correctness`);
  results[parserTest.name] = {
    passed: 0,
    failed: 0,
    tests: []
  };

  for (const test of parserTest.testCases) {
    try {
      const parser = new parserTest.ParserClass(test.code);
      const ast = parser.parse();
      const stats = parser.getMemoryStats();
      
      results[parserTest.name].tests.push({
        name: test.name,
        passed: true,
        objects: stats.objectCount
      });
      results[parserTest.name].passed++;
      
      log(`  [OK] ${test.name.padEnd(20)} | Objects: ${stats.objectCount}`, 'GREEN');
    } catch (error) {
      results[parserTest.name].tests.push({
        name: test.name,
        passed: false,
        error: error.message
      });
      results[parserTest.name].failed++;
      
      log(`  [FAIL] ${test.name.padEnd(20)} | ${error.message}`, 'RED');
    }
  }
}

// ============================================================================
// MEMORY LEAK VERIFICATION
// ============================================================================

testSection('Memory Stability Verification - Same-Fixture Repeated Parses');

for (const parserTest of parserTests) {
  const Parser = parserTest.ParserClass;
  let parserMemoryFailures = 0;

  log(`\n${parserTest.name}:`);

  for (const testCase of parserTest.testCases) {
    const snapshots = [];
    let parseFailure = null;

    for (let i = 0; i < 20; i++) {
      try {
        const parser = new Parser(testCase.code);
        parser.parse();
        snapshots.push(parser.getMemoryStats().objectCount);
      } catch (error) {
        parseFailure = error;
        break;
      }
    }

    if (parseFailure) {
      memoryFailures++;
      parserMemoryFailures++;
      log(`  [FAIL] ${testCase.name.padEnd(20)} | ${parseFailure.message}`, 'RED');
      continue;
    }

    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    const growthNumber = ((last - first) / (first || 1)) * 100;
    const growth = growthNumber.toFixed(1);
    const max = Math.max(...snapshots);
    const positiveSnapshots = snapshots.filter(x => x > 0);
    const min = positiveSnapshots.length > 0 ? Math.min(...positiveSnapshots) : 0;
    const status = Math.abs(growthNumber) < 10 ? 'PASS' : 'FAIL';

    if (status === 'FAIL') {
      memoryFailures++;
      parserMemoryFailures++;
    }

    log(
      `  [${status}] ${testCase.name.padEnd(20)} | ${first} -> ${last} objects (${growth}%), min/max ${min}/${max}`,
      status === 'PASS' ? 'GREEN' : 'RED'
    );
  }

  if (parserMemoryFailures === 0) {
    log(`  [OK] Same-fixture memory stable across ${parserTest.testCases.length} cases`, 'GREEN');
  }
}

// ============================================================================
// OBJECT POOL EFFICIENCY
// ============================================================================

testSection('Object Pool Efficiency Analysis');

for (const parserTest of parserTests) {
  const Parser = parserTest.ParserClass;
  const parser = new Parser('test');
  const stats = parser.getMemoryStats();
  
  log(`\n${parserTest.name}:`);
  log(`  Pool capacity: ${stats.pool.maxSize} nodes`);
  log(`  Memory limit: ${parser.maxObjects} objects`);
  log(`  Current pool: ${stats.pool.nodesPooled} nodes pooled`);
}

// ============================================================================
// TOKENIZER VALIDATION
// ============================================================================

testSection('Tokenizer Validation - No Infinite Loops');

for (const parserTest of parserTests) {
  const Parser = parserTest.ParserClass;
  const testCase = parserTest.testCases[0];
  
  try {
    const parser = new Parser(testCase.code);
    const startTime = Date.now();
    const tokens = parser.tokenize();
    const duration = Date.now() - startTime;
    
    log(`\n${parserTest.name}:`);
    log(`  Tokens: ${tokens.length}`, 'GREEN');
    log(`  Duration: ${duration}ms`);
    
    if (tokens.length > 1000) {
      log(`  [WARN] Token count exceeds 1000 - potential loop risk`, 'YELLOW');
    } else if (duration > 1000) {
      log(`  [WARN] Tokenization took > 1000ms - potential loop risk`, 'YELLOW');
    } else {
      log(`  [OK] Tokenizer healthy`, 'GREEN');
    }
  } catch (error) {
    log(`\n${parserTest.name}: ${error.message}`, 'RED');
  }
}

// ============================================================================
// CONSISTENCY CHECKS
// ============================================================================

testSection('Consistency Checks - Repeated Parsing');

for (const parserTest of parserTests) {
  const Parser = parserTest.ParserClass;
  const testCase = parserTest.testCases[0];
  const results = [];
  
  for (let i = 0; i < 5; i++) {
    const parser = new Parser(testCase.code);
    const ast = parser.parse();
    results.push(JSON.stringify(ast));
  }
  
  const allSame = results.every(r => r === results[0]);
  
  log(`\n${parserTest.name}:`);
  if (allSame) {
    log(`  [OK] Consistent AST output over 5 parses`, 'GREEN');
  } else {
    consistencyFailures++;
    log(`  [FAIL] Inconsistent AST output`, 'RED');
  }
}

// ============================================================================
// FINAL VERIFICATION REPORT
// ============================================================================

header('STEP 1 VERIFICATION REPORT');

let totalPassed = 0;
let totalFailed = 0;

for (const [name, result] of Object.entries(results)) {
  totalPassed += result.passed;
  totalFailed += result.failed;
  
  const rate = ((result.passed / (result.passed + result.failed)) * 100).toFixed(1);
  const status = result.failed === 0 ? '[PASS]' : '[PARTIAL]';
  
  log(`\n${name}: ${status}`);
  log(`  Passed: ${result.passed}/${result.passed + result.failed} (${rate}%)`);
}

log(`\n${'─'.repeat(80)}`);
log(`Total: ${totalPassed} passed, ${totalFailed} failed`);
log(`Auxiliary: ${memoryFailures} memory failures, ${consistencyFailures} consistency failures`);

if (totalFailed === 0 && memoryFailures === 0 && consistencyFailures === 0) {
  log(`\n[OK] STEP 1 COMPLETE: PHP AND DART VERIFIED`, 'GREEN');
} else {
  log(`\n[WARN] STEP 1 PARTIAL: Some tests failed`, 'YELLOW');
  process.exitCode = 1;
}

// Export for next steps
module.exports = { results, memoryFailures, consistencyFailures };

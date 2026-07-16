/**
 * CLARITY SUPER CANON - COMPREHENSIVE MULTI-PARSER + JSON VERIFICATION
 * Master verification suite combining all language parsers + JSON support
 * Level: METICULOUS FORENSIC HARDENING
 */

const { PHPParser } = require('../src/parsers/php_parser');
const { DartParser } = require('../src/parsers/dart_parser');
const { RubyParser } = require('../src/parsers/ruby_parser');
const { PythonParser } = require('../src/parsers/python_parser');
const { JSONParser } = require('../src/parsers/json_parser');

const COLORS = {
  RESET: '\x1b[0m',
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m'
};

function log(msg, color = 'RESET') {
  console.log(`${COLORS[color]}${msg}${COLORS.RESET}`);
}

function header(title) {
  console.log(`\n${COLORS.CYAN}${'='.repeat(80)}${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}[MASTER VERIFICATION] ${title}${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}${'='.repeat(80)}${COLORS.RESET}\n`);
}

// ==================================================================================
// PHASE 1: ALL LANGUAGE PARSERS VERIFICATION
// ==================================================================================

header('PHASE 1: MULTI-LANGUAGE PARSER VERIFICATION');

const allParsers = [
  {
    name: 'PHP',
    tests: [
      '$x = 10;',
      '[1, 2, 3]',
      '"string"',
      'foreach ($arr as $v) { echo $v; }',
      'new User("name")'
    ]
  },
  {
    name: 'Dart',
    tests: [
      'var x = 10;',
      '[1, 2, 3]',
      '{"key": "value"}',
      'obj..method1()..method2()',
      'print("hello");'
    ]
  },
  {
    name: 'Ruby',
    tests: [
      'x = 10',
      '[1, 2, 3]',
      '{a: 1, b: 2}',
      'puts "hello"',
      'obj.method'
    ]
  },
  {
    name: 'Python',
    tests: [
      'x = 10',
      '[1, 2, 3]',
      '{"a": 1}',
      'print("hello")',
      'obj.method()'
    ]
  }
];

let langPassed = 0;
let langFailed = 0;

for (const parser of allParsers) {
  log(`\n[TESTING] ${parser.name} Parser`, 'BLUE');
  
  for (const code of parser.tests) {
    try {
      let p;
      if (parser.name === 'PHP' || parser.name === 'Dart') {
        p = parser.name === 'PHP' ? new PHPParser(code) : new DartParser(code);
        p.parse();
      } else if (parser.name === 'Ruby') {
        p = new RubyParser();
        p.parse(code);
      } else if (parser.name === 'Python') {
        p = new PythonParser();
        p.parse(code);
      }
      
      log(`  [OK] ${code.padEnd(40)}`, 'GREEN');
      langPassed++;
    } catch (error) {
      log(`  [FAIL] ${code.padEnd(40)} ${error.message}`, 'RED');
      langFailed++;
    }
  }
}

log(`\n[LANGUAGES] ${langPassed}/${langPassed + langFailed} tests passed`, langFailed === 0 ? 'GREEN' : 'RED');

// ==================================================================================
// PHASE 2: JSON PARSER STANDALONE VERIFICATION
// ==================================================================================

header('PHASE 2: JSON PARSER VERIFICATION');

const jsonTests = [
  { name: 'Simple object', json: '{"key": "value"}' },
  { name: 'Array of objects', json: '[{"id": 1}, {"id": 2}]' },
  { name: 'Nested structures', json: '{"users": [{"name": "Alice", "age": 30}]}' },
  { name: 'Strings with escapes', json: '"Say \\"Hello\\", World!"' },
  { name: 'Numbers', json: '[1, -2, 3.14, 1e5]' },
  { name: 'Booleans and null', json: '[true, false, null]' }
];

let jsonPassed = 0;
let jsonFailed = 0;

log(`\n[TESTING] JSON Parser`, 'BLUE');

for (const test of jsonTests) {
  try {
    const parser = new JSONParser();
    parser.parse(test.json);
    log(`  [OK] ${test.name.padEnd(40)}`, 'GREEN');
    jsonPassed++;
  } catch (error) {
    log(`  [FAIL] ${test.name.padEnd(40)} ${error.message}`, 'RED');
    jsonFailed++;
  }
}

log(`\n[JSON PARSER] ${jsonPassed}/${jsonPassed + jsonFailed} tests passed`, jsonFailed === 0 ? 'GREEN' : 'RED');

// ==================================================================================
// PHASE 3: DART + JSON INTEROPERABILITY
// ==================================================================================

header('PHASE 3: DART + JSON INTEROPERABILITY (Dart map as JSON)');

const dartJsonTests = [
  {
    name: 'Dart with JSON-like map (string keys)',
    code: '{"key": "value", "nested": {"inner": "data"}}'
  },
  {
    name: 'Dart with JSON-like map (multiple properties)',
    code: '{"a": 1, "b": 2, "c": 3}'
  },
  {
    name: 'Dart with JSON-like array',
    code: '[{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]'
  }
];

let dartJsonPassed = 0;
let dartJsonFailed = 0;

log(`\n[TESTING] Dart Parser with JSON-like syntax`, 'BLUE');

for (const test of dartJsonTests) {
  try {
    const dartParser = new DartParser(test.code);
    dartParser.parse();
    
    const jsonParser = new JSONParser();
    jsonParser.parse(test.code);
    
    log(`  [OK] ${test.name.padEnd(50)}`, 'GREEN');
    dartJsonPassed++;
  } catch (error) {
    log(`  [FAIL] ${test.name.padEnd(50)} ${error.message}`, 'RED');
    dartJsonFailed++;
  }
}

log(`\n[DART + JSON] ${dartJsonPassed}/${dartJsonPassed + dartJsonFailed} compatibility tests passed`, dartJsonFailed === 0 ? 'GREEN' : 'RED');

// ==================================================================================
// PHASE 4: JSON ROUND-TRIP VERIFICATION
// ==================================================================================

header('PHASE 4: JSON ROUND-TRIP VERIFICATION (AST -> JSON -> AST)');

const roundTripTests = [
  '{"name":"Alice","age":30,"active":true}',
  '[1,2,3,4,5]',
  '{"data":[{"id":1},{"id":2}]}',
  '{"empty_array":[],"empty_object":{}}',
  '{"string":"with\\"quotes","path":"C:\\\\Users"}'
];

let rtPassed = 0;
let rtFailed = 0;

log(`\n[TESTING] JSON Round-trip Fidelity`, 'BLUE');

for (const jsonStr of roundTripTests) {
  try {
    const parser = new JSONParser();
    
    // Parse to AST
    const ast1 = parser.parse(jsonStr);
    
    // Convert AST back to JSON
    const regenerated = parser.astToJSON(ast1);
    
    // Parse regenerated JSON to AST
    const ast2 = parser.parse(regenerated);
    
    // Compare structure
    const json1 = JSON.stringify(JSON.parse(jsonStr));
    const json2 = JSON.stringify(JSON.parse(regenerated));
    
    if (json1 === json2) {
      log(`  [OK] ${jsonStr.substring(0, 50).padEnd(50)}`, 'GREEN');
      rtPassed++;
    } else {
      log(`  [FAIL] ${jsonStr.substring(0, 50).padEnd(50)} Round-trip mismatch`, 'RED');
      rtFailed++;
    }
  } catch (error) {
    log(`  [FAIL] ${jsonStr.substring(0, 50).padEnd(50)} ${error.message}`, 'RED');
    rtFailed++;
  }
}

log(`\n[ROUND-TRIP] ${rtPassed}/${rtPassed + rtFailed} round-trip tests passed`, rtFailed === 0 ? 'GREEN' : 'RED');

// ==================================================================================
// PHASE 5: MEMORY STABILITY ACROSS ALL PARSERS + JSON
// ==================================================================================

header('PHASE 5: MEMORY STABILITY - ALL PARSERS + JSON');

const allParsersList = [
  { name: 'PHP', class: PHPParser, code: '$x = 10;' },
  { name: 'Dart', class: DartParser, code: 'var x = 10;' },
  { name: 'Ruby', class: RubyParser, code: 'x = 10', isRuby: true },
  { name: 'Python', class: PythonParser, code: 'x = 10', isPython: true },
  { name: 'JSON', class: JSONParser, code: '{"x": 10}', isJSON: true }
];

log(`\n[TESTING] Memory stability (50 sequential parses each)\n`, 'BLUE');

let memoryFailed = 0;

for (const parser of allParsersList) {
  const snapshots = [];
  
  for (let i = 0; i < 50; i++) {
    let p;
    if (parser.isRuby) {
      p = new parser.class();
      p.parse(parser.code);
    } else if (parser.isPython) {
      p = new parser.class();
      p.parse(parser.code);
    } else if (parser.isJSON) {
      p = new parser.class();
      p.parse(parser.code);
    } else {
      p = new parser.class(parser.code);
      p.parse();
    }
    
    snapshots.push(p.getMemoryStats().objectCount);
  }
  
  const first = snapshots[0];
  const last = snapshots[49];
  const growth = ((last - first) / (first || 1) * 100).toFixed(1);
  
  const status = Math.abs(growth) < 10 ? 'OK' : 'FAIL';
  if (status === 'FAIL') {
    memoryFailed++;
  }
  log(`${parser.name.padEnd(10)} | Start: ${first.toString().padEnd(3)} | End: ${last.toString().padEnd(3)} | Growth: ${growth.padEnd(5)}% | [${status}]`, 
      Math.abs(growth) < 10 ? 'GREEN' : 'RED');
}

// ==================================================================================
// PHASE 6: ERROR HANDLING CONSISTENCY
// ==================================================================================

header('PHASE 6: ERROR HANDLING - MALFORMED INPUT');

const errorTests = [
  { name: 'JSON with trailing comma', code: '[1,2,3,]', parser: 'JSON' },
  { name: 'JSON with unquoted keys', code: '{key: 1}', parser: 'JSON' },
  { name: 'Incomplete JSON', code: '{"a":1', parser: 'JSON' }
];

let errorsPassed = 0;
let errorsFailed = 0;

log(`\n[TESTING] Error handling for malformed input\n`, 'BLUE');

for (const test of errorTests) {
  try {
    const parser = new JSONParser();
    parser.parse(test.code);
    
    log(`[FAIL] ${test.name.padEnd(40)} Should have thrown error`, 'RED');
    errorsFailed++;
  } catch (error) {
    log(`[OK] ${test.name.padEnd(40)} Error: ${error.message.substring(0, 30)}`, 'GREEN');
    errorsPassed++;
  }
}

log(`\n[ERROR HANDLING] ${errorsPassed}/${errorsPassed + errorsFailed} correctly handled\n`, errorsFailed === 0 ? 'GREEN' : 'RED');

// ==================================================================================
// FINAL MASTER SUMMARY
// ==================================================================================

header('MASTER VERIFICATION SUMMARY');

const allTests = langPassed + langFailed + jsonPassed + jsonFailed + 
                 dartJsonPassed + dartJsonFailed + rtPassed + rtFailed + 
                 errorsPassed + errorsFailed;

const allPassed = langPassed + jsonPassed + dartJsonPassed + rtPassed + errorsPassed;
const passRate = ((allPassed / allTests) * 100).toFixed(1);

log(`\n[COMPREHENSIVE RESULTS]`, 'CYAN');
log(`  Phase 1 (Languages):          ${langPassed}/${langPassed + langFailed}`, langFailed === 0 ? 'GREEN' : 'YELLOW');
log(`  Phase 2 (JSON):               ${jsonPassed}/${jsonPassed + jsonFailed}`, jsonFailed === 0 ? 'GREEN' : 'YELLOW');
log(`  Phase 3 (Dart + JSON):        ${dartJsonPassed}/${dartJsonPassed + dartJsonFailed}`, dartJsonFailed === 0 ? 'GREEN' : 'YELLOW');
log(`  Phase 4 (Round-trip):         ${rtPassed}/${rtPassed + rtFailed}`, rtFailed === 0 ? 'GREEN' : 'YELLOW');
log(`  Phase 5 (Memory):             ${memoryFailed === 0 ? 'VERIFIED (all stable)' : `${memoryFailed} failures`}`, memoryFailed === 0 ? 'GREEN' : 'YELLOW');
log(`  Phase 6 (Error Handling):     ${errorsPassed}/${errorsPassed + errorsFailed}`, errorsFailed === 0 ? 'GREEN' : 'YELLOW');

log(`\n[TOTAL] ${allPassed}/${allTests} (${passRate}%)`, passRate >= 98 ? 'GREEN' : 'YELLOW');

if (passRate >= 99 && langFailed === 0 && jsonFailed === 0 && dartJsonFailed === 0 && rtFailed === 0 && memoryFailed === 0 && errorsFailed === 0) {
  log(`

╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║       [CLARITY SUPER CANON] SCOPED PARSER + JSON FIXTURE PROBE            ║
║                                                                            ║
║  Status: ✓ SCOPED FIXTURE GATE PASS                                       ║
║  ├─ PHP Parser:          ✓ VERIFIED (5/5 tests)                          ║
║  ├─ Dart Parser:         ✓ VERIFIED (5/5 tests)                          ║
║  ├─ Ruby Parser:         ✓ VERIFIED (5/5 tests)                          ║
║  ├─ Python Parser:       ✓ VERIFIED (5/5 tests)                          ║
║  ├─ JSON Parser:         ✓ VERIFIED (6/6 tests)                          ║
║  ├─ Interoperability:    ✓ VERIFIED (Dart + JSON compatible)             ║
║  ├─ Round-trip:          ✓ VERIFIED (100% fidelity)                      ║
║  ├─ Memory Stability:    ✓ VERIFIED (all parsers stable)                 ║
║  └─ Error Handling:      ✓ VERIFIED (comprehensive)                      ║
║                                                                            ║
║  This direct legacy probe verifies the listed parser and JSON fixtures     ║
║  only. It is not a production, broad-language, or canonical 1.0 claim.     ║
║  Use npm run clarity:canon for the current governed canon gate.            ║
║                                                                            ║
║  Fixture Health: ${passRate}% (EXCELLENT)                                            ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
  `, 'GREEN');
} else {
  log(`\n[ALERT] Review failures above. ${langFailed + jsonFailed + dartJsonFailed + rtFailed + memoryFailed + errorsFailed} issues found.`, 'YELLOW');
  process.exitCode = 1;
}

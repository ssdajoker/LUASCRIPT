/**
 * Gleam Phase B - Comprehensive Test Suite
 * Tests: Opaque Types, Error Handling, Public Types, Pattern Matching, Guards
 */

const GleamTokenizerExtended = require('../src/tokenizers/gleam_tokenizer_extended');
const GleamParserExtended = require('../src/parsers/gleam_parser_extended');
const GleamCodeGeneratorExtended = require('../src/generators/gleam_codegen_extended');

let passCount = 0;
let failCount = 0;

function testPass(testName, message = '') {
  passCount++;
  console.log(`TEST ${passCount}: ${testName} ✅ PASS${message ? ' - ' + message : ''}`);
}

function testFail(testName, message = '') {
  failCount++;
  console.log(`TEST ${failCount + passCount}: ${testName} ❌ FAIL${message ? ' - ' + message : ''}`);
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  Gleam Phase B - Advanced Features Test Suite             ║');
console.log('║  Features: Opaques, Error Handling, Types, Patterns       ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// TEST 1: Opaque Type Definition
(() => {
  const gleamCode = `
pub opaque type UserId = Int

pub opaque type Name = String
`;
  
  const tokenizer = new GleamTokenizerExtended(gleamCode);
  const tokens = tokenizer.tokenize();
  const parser = new GleamParserExtended(gleamCode);
  const ast = parser.parse(tokens);
  
  if (ast.opaqueTypes.length === 2 &&
      ast.opaqueTypes[0].name === 'UserId' &&
      ast.opaqueTypes[1].name === 'Name') {
    testPass('Opaque Type Definition', '2 opaque types recognized');
  } else {
    testFail('Opaque Type Definition', `Expected 2 opaque types, got ${ast.opaqueTypes.length}`);
  }
})();

// TEST 2: Public Type with Variants
(() => {
  const gleamCode = `
pub type Result(a, b) {
  Ok(a)
  Error(b)
}

pub type Bool {
  True
  False
}
`;
  
  const tokenizer = new GleamTokenizerExtended(gleamCode);
  const tokens = tokenizer.tokenize();
  const parser = new GleamParserExtended(gleamCode);
  const ast = parser.parse(tokens);
  
  if (ast.publicTypes.length === 2) {
    testPass('Public Type with Variants', '2 public types found');
  } else {
    testFail('Public Type with Variants', `Expected 2 types, got ${ast.publicTypes.length}`);
  }
})();

// TEST 3: Function with Error Handling
(() => {
  const gleamCode = `
pub fn divide(x: Int, y: Int) -> Result(Int, String) {
  case y {
    0 -> Error("Division by zero")
    _ -> Ok(x / y)
  }
}

pub fn safe_parse(s: String) -> Result(Int, Nil) {
  try int.parse(s)
}
`;
  
  const tokenizer = new GleamTokenizerExtended(gleamCode);
  const tokens = tokenizer.tokenize();
  const parser = new GleamParserExtended(gleamCode);
  const ast = parser.parse(tokens);
  
  const errorHandling = ast.handlers.length > 0 || ast.functions.some(f => f.errorHandling);
  if (errorHandling) {
    testPass('Function with Error Handling', 'Error handling detected');
  } else {
    testFail('Function with Error Handling', 'No error handling found');
  }
})();

// TEST 4: Type Parameters
(() => {
  const gleamCode = `
pub type Box(a) {
  Box(a)
}

pub type Pair(a, b) {
  Pair(a, b)
}

pub type Tree(a) {
  Leaf(a)
  Branch(Tree(a), Tree(a))
}
`;
  
  const tokenizer = new GleamTokenizerExtended(gleamCode);
  const tokens = tokenizer.tokenize();
  const parser = new GleamParserExtended(gleamCode);
  const ast = parser.parse(tokens);
  
  const allHaveParams = ast.publicTypes.every(t => t.typeParams && t.typeParams.length > 0);
  if (allHaveParams) {
    testPass('Type Parameters', 'Parameterized types recognized');
  } else {
    testFail('Type Parameters', 'Not all types have parameters');
  }
})();

// TEST 5: Pattern Matching in Functions
(() => {
  const gleamCode = `
pub fn process(msg: Msg) -> String {
  case msg {
    Click -> "clicked"
    Submit(text) -> "submitted: " <> text
    Reset -> "reset"
  }
}
`;
  
  const tokenizer = new GleamTokenizerExtended(gleamCode);
  const tokens = tokenizer.tokenize();
  
  const arrowCount = tokens.filter(t => t.value === '->').length;
  if (arrowCount >= 3) {
    testPass('Pattern Matching in Functions', `${arrowCount} pattern arrows found`);
  } else {
    testFail('Pattern Matching in Functions', 'Expected 3+ arrows');
  }
})();

// TEST 6: Try Expression Recognition
(() => {
  const gleamCode = `
pub fn read_file(path: String) -> Result(String, Error) {
  try data = file.read(path)
  Ok(data)
}
`;
  
  const tokenizer = new GleamTokenizerExtended(gleamCode);
  const tokens = tokenizer.tokenize();
  
  const tryCount = tokens.filter(t => t.value === 'try').length;
  if (tryCount >= 1) {
    testPass('Try Expression Recognition', 'try keyword recognized');
  } else {
    testFail('Try Expression Recognition', 'try not found');
  }
})();

// TEST 7: Lua Code Generation
(() => {
  const gleamCode = `
pub opaque type UserId = Int

pub type Result(a, b) {
  Ok(a)
  Error(b)
}

pub fn process() -> String {
  "done"
}
`;
  
  const tokenizer = new GleamTokenizerExtended(gleamCode);
  const tokens = tokenizer.tokenize();
  const parser = new GleamParserExtended(gleamCode);
  const generator = new GleamCodeGeneratorExtended();
  
  const ast = parser.parse(tokens);
  generator.ast = ast;
  
  const luaCode = generator.generate('lua');
  
  if (luaCode.includes('-- Generated Lua from Gleam') &&
      luaCode.includes('UserId') &&
      luaCode.includes('Result')) {
    const lineCount = luaCode.split('\n').filter(l => l.trim().length > 0).length;
    testPass('Lua Code Generation', `${lineCount} lines generated`);
  } else {
    testFail('Lua Code Generation', 'Lua output incomplete');
  }
})();

// TEST 8: JavaScript Code Generation
(() => {
  const gleamCode = `
pub opaque type Config = String

pub type Status {
  Active
  Inactive
}
`;
  
  const tokenizer = new GleamTokenizerExtended(gleamCode);
  const tokens = tokenizer.tokenize();
  const parser = new GleamParserExtended(gleamCode);
  const generator = new GleamCodeGeneratorExtended();
  
  const ast = parser.parse(tokens);
  generator.ast = ast;
  
  const jsCode = generator.generate('javascript');
  
  if (jsCode.includes('// Generated JavaScript from Gleam') &&
      jsCode.includes('Config') &&
      jsCode.includes('Status')) {
    const lineCount = jsCode.split('\n').filter(l => l.trim().length > 0).length;
    testPass('JavaScript Code Generation', `${lineCount} lines generated`);
  } else {
    testFail('JavaScript Code Generation', 'JavaScript output incomplete');
  }
})();

// TEST 9: Import Parsing
(() => {
  const gleamCode = `
import gleam/io
import gleam/list.{map, filter}
import gleam/result
`;
  
  const tokenizer = new GleamTokenizerExtended(gleamCode);
  const tokens = tokenizer.tokenize();
  const parser = new GleamParserExtended(gleamCode);
  const ast = parser.parse(tokens);
  
  if (ast.imports.length === 3) {
    testPass('Import Parsing', '3 imports recognized');
  } else {
    testFail('Import Parsing', `Expected 3 imports, got ${ast.imports.length}`);
  }
})();

// TEST 10: Performance Benchmark
(() => {
  const complexGleamCode = `
pub opaque type UserId = Int
pub opaque type Email = String

pub type Result(a, b) {
  Ok(a)
  Error(b)
}

pub type Status {
  Active
  Inactive
  Pending
  Deleted
}

pub fn validate_user(id: Int, email: String) -> Result(Nil, String) {
  case id {
    0 -> Error("Invalid ID")
    _ -> Ok(Nil)
  }
}

pub fn process_result(r: Result(Int, String)) -> String {
  case r {
    Ok(val) -> "Success: " <> int.to_string(val)
    Error(msg) -> "Error: " <> msg
  }
}

pub fn try_read(path: String) -> Result(String, Nil) {
  try data = file.read(path)
  Ok(data)
}
`;
  
  const start = Date.now();
  
  const tokenizer = new GleamTokenizerExtended(complexGleamCode);
  const tokens = tokenizer.tokenize();
  const parser = new GleamParserExtended(complexGleamCode);
  const generator = new GleamCodeGeneratorExtended();
  
  const ast = parser.parse(tokens);
  generator.ast = ast;
  
  const luaOut = generator.generate('lua');
  const jsOut = generator.generate('javascript');
  
  const elapsed = Date.now() - start;
  
  if (elapsed < 100) {
    testPass('Performance Benchmark', `${elapsed}ms (target <100ms)`);
  } else if (elapsed < 500) {
    testPass('Performance Benchmark', `${elapsed}ms (acceptable)`);
  } else {
    testFail('Performance Benchmark', `${elapsed}ms exceeds threshold`);
  }
})();

// SUMMARY
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                    TEST SUMMARY                            ║');
console.log('╠════════════════════════════════════════════════════════════╣');
console.log(`║ Total Tests: ${(passCount + failCount).toString().padEnd(49)}║`);
console.log(`║ ✅ Passed:   ${passCount.toString().padEnd(49)}║`);
console.log(`║ ❌ Failed:   ${failCount.toString().padEnd(49)}║`);
console.log('╠════════════════════════════════════════════════════════════╣');

if (failCount === 0) {
  console.log('║ 📊 Results: ALL TESTS PASSED ✅                          ║');
  console.log('║ 🏆 SUCCESS: Gleam Phase B - READY FOR INTEGRATION         ║');
} else {
  console.log(`║ 📊 Results: ${passCount}/${passCount + failCount} TESTS PASSED                        ║`);
  console.log('║ ⚠️  REVIEW: Some tests need investigation                 ║');
}

console.log('╚════════════════════════════════════════════════════════════╝\n');

process.exit(failCount > 0 ? 1 : 0);

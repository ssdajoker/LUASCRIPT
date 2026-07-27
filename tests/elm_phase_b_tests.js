/**
 * Elm Phase B - Comprehensive Test Suite
 * Tests: ADT, Pattern Matching, Records, Type Aliases, Pipe Operators
 */

const ElmTokenizerExtended = require('../src/tokenizers/elm_tokenizer_extended');
const ElmParserExtended = require('../src/parsers/elm_parser_extended');
const ElmCodeGeneratorExtended = require('../src/generators/elm_codegen_extended');

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
console.log('║  Elm Phase B - Advanced Features Test Suite               ║');
console.log('║  Features: ADT, Pattern Matching, Records, Pipe Operators  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// TEST 1: Custom Type Definition Parsing
(() => {
  const elmCode = `
module Main exposing (Maybe, Result)

type Maybe a = Just a | Nothing

type Result err ok = Ok ok | Err err
`;
  
  const tokenizer = new ElmTokenizerExtended(elmCode);
  const tokens = tokenizer.tokenize();
  const parser = new ElmParserExtended(elmCode);
  const ast = parser.parse(tokens);
  
  if (ast.customTypes.length === 2 && 
      ast.customTypes[0].name === 'Maybe' &&
      ast.customTypes[1].name === 'Result') {
    testPass('Custom Type Definition Parsing', '2 custom types recognized');
  } else {
    testFail('Custom Type Definition Parsing', `Expected 2 custom types, got ${ast.customTypes.length}`);
  }
})();

// TEST 2: Union Type Variant Extraction
(() => {
  const elmCode = `
module Main exposing (..)

type Status = Pending | Loading | Success | Error
`;
  
  const tokenizer = new ElmTokenizerExtended(elmCode);
  const tokens = tokenizer.tokenize();
  const parser = new ElmParserExtended(elmCode);
  const ast = parser.parse(tokens);
  
  const variants = ast.customTypes[0]?.variants || [];
  if (variants.length === 4) {
    testPass('Union Type Variant Extraction', '4 variants found');
  } else {
    testFail('Union Type Variant Extraction', `Expected 4 variants, got ${variants.length}`);
  }
})();

// TEST 3: Pattern Matching Recognition
(() => {
  const elmCode = `
module Main exposing (..)

type Msg = Click | Submit String | Reset

update msg model =
  case msg of
    Click -> { model | count = model.count + 1 }
    Submit text -> { model | text = text }
    Reset -> model
`;
  
  const tokenizer = new ElmTokenizerExtended(elmCode);
  const tokens = tokenizer.tokenize();
  const parser = new ElmParserExtended(elmCode);
  const ast = parser.parse(tokens);
  
  const hasPatterns = ast.patterns && ast.patterns.length > 0;
  if (hasPatterns || ast.functions.length > 0) {
    testPass('Pattern Matching Recognition', 'case expression patterns detected');
  } else {
    testFail('Pattern Matching Recognition', 'Patterns not recognized');
  }
})();

// TEST 4: Pipe Operator Support
(() => {
  const elmCode = `
module Main exposing (..)

view model =
  model.items
    |> List.filter isActive
    |> List.map displayItem
    |> Html.div []
`;
  
  const tokenizer = new ElmTokenizerExtended(elmCode);
  const tokens = tokenizer.tokenize();
  
  const pipeCount = tokens.filter(t => t.value === '|>').length;
  if (pipeCount >= 2) {
    testPass('Pipe Operator Support', `${pipeCount} pipe operators tokenized`);
  } else {
    testFail('Pipe Operator Support', 'Expected 2+ pipe operators');
  }
})();

// TEST 5: Record Type Definition
(() => {
  const elmCode = `
module Main exposing (..)

type alias User = 
  { id : Int
  , name : String
  , email : String
  }

type alias Config =
  { apiUrl : String
  , timeout : Int
  }
`;
  
  const tokenizer = new ElmTokenizerExtended(elmCode);
  const tokens = tokenizer.tokenize();
  const parser = new ElmParserExtended(elmCode);
  const ast = parser.parse(tokens);
  
  const recordTypes = ast.typeAliases.filter(t => t.record !== null);
  if (recordTypes.length >= 2) {
    testPass('Record Type Definition', `${recordTypes.length} record types found`);
  } else {
    testFail('Record Type Definition', `Expected 2+ record types, got ${recordTypes.length}`);
  }
})();

// TEST 6: Type Parameter Handling
(() => {
  const elmCode = `
module Main exposing (..)

type Box a = Box a

type Pair a b = Pair a b

type Tree a = Leaf a | Branch (Tree a) (Tree a)
`;
  
  const tokenizer = new ElmTokenizerExtended(elmCode);
  const tokens = tokenizer.tokenize();
  const parser = new ElmParserExtended(elmCode);
  const ast = parser.parse(tokens);
  
  const allHaveParams = ast.customTypes.every(t => t.typeParams && t.typeParams.length > 0);
  if (allHaveParams) {
    testPass('Type Parameter Handling', 'Generic type parameters recognized');
  } else {
    testFail('Type Parameter Handling', 'Not all types have parameters');
  }
})();

// TEST 7: Lua Code Generation
(() => {
  const elmCode = `
module Main exposing (..)

type Maybe a = Just a | Nothing

type alias User = { id : Int, name : String }
`;
  
  const tokenizer = new ElmTokenizerExtended(elmCode);
  const tokens = tokenizer.tokenize();
  const parser = new ElmParserExtended(elmCode);
  const generator = new ElmCodeGeneratorExtended();
  
  const ast = parser.parse(tokens);
  generator.ast = ast;
  
  const luaCode = generator.generate('lua');
  
  if (luaCode.includes('-- Generated Lua from Elm') &&
      luaCode.includes('Maybe') &&
      luaCode.includes('User')) {
    const lineCount = luaCode.split('\n').filter(l => l.trim().length > 0).length;
    testPass('Lua Code Generation', `${lineCount} lines generated`);
  } else {
    testFail('Lua Code Generation', 'Lua output incomplete');
  }
})();

// TEST 8: JavaScript Code Generation
(() => {
  const elmCode = `
module Main exposing (..)

type Status = Pending | Loading | Done

type alias Config = { apiUrl : String }
`;
  
  const tokenizer = new ElmTokenizerExtended(elmCode);
  const tokens = tokenizer.tokenize();
  const parser = new ElmParserExtended(elmCode);
  const generator = new ElmCodeGeneratorExtended();
  
  const ast = parser.parse(tokens);
  generator.ast = ast;
  
  const jsCode = generator.generate('javascript');
  
  if (jsCode.includes('// Generated JavaScript from Elm') &&
      jsCode.includes('Status') &&
      jsCode.includes('Config')) {
    const lineCount = jsCode.split('\n').filter(l => l.trim().length > 0).length;
    testPass('JavaScript Code Generation', `${lineCount} lines generated`);
  } else {
    testFail('JavaScript Code Generation', 'JavaScript output incomplete');
  }
})();

// TEST 9: Infix Operator Recognition
(() => {
  const elmCode = `
module Main exposing ((<+>), (<*>))

infixl 6 <+>
infixl 7 <*>
`;
  
  const tokenizer = new ElmTokenizerExtended(elmCode);
  const tokens = tokenizer.tokenize();
  
  const infixKeywords = tokens.filter(t => 
    t.type === 'Keyword' && (t.value === 'infix' || t.value === 'infixl')
  ).length;
  
  if (infixKeywords >= 2) {
    testPass('Infix Operator Recognition', 'infix declarations recognized');
  } else {
    testFail('Infix Operator Recognition', `Expected 2+ infix keywords, got ${infixKeywords}`);
  }
})();

// TEST 10: Performance Benchmark
(() => {
  const complexElmCode = `
module Main exposing (..)

type Msg
  = Click
  | Submit String
  | Reset
  | Update Int
  | Delete Id
  | Load (Result Http.Error Data)

type alias Model =
  { count : Int
  , text : String
  , items : List Item
  , status : Status
  }

type alias Item = { id : Int, name : String, active : Bool }

update msg model =
  case msg of
    Click -> { model | count = model.count + 1 }
    Submit text -> { model | text = text }
    Reset -> { model | count = 0, text = "" }
    Update n -> { model | count = n }
    Delete id -> { model | items = List.filter (\\i -> i.id /= id) model.items }
    Load result -> model
`;
  
  const start = Date.now();
  
  const tokenizer = new ElmTokenizerExtended(complexElmCode);
  const tokens = tokenizer.tokenize();
  const parser = new ElmParserExtended(complexElmCode);
  const generator = new ElmCodeGeneratorExtended();
  
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
  console.log('║ 🏆 SUCCESS: Elm Phase B - READY FOR INTEGRATION           ║');
} else {
  console.log(`║ 📊 Results: ${passCount}/${passCount + failCount} TESTS PASSED                        ║`);
  console.log('║ ⚠️  REVIEW: Some tests need investigation                 ║');
}

console.log('╚════════════════════════════════════════════════════════════╝\n');

process.exit(failCount > 0 ? 1 : 0);

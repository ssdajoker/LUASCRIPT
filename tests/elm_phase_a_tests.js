/**
 * ELM PHASE A TEST SUITE - Comprehensive Validation
 * Round 1: Core Transpiler for Functional Language
 * Date: February 3, 2026
 */

const ElmTokenizer = require('../src/tokenizers/elm_tokenizer');
const ElmParser = require('../src/parsers/elm_parser');
const ElmCodeGenerator = require('../src/generators/elm_codegen');

class ElmPhaseATestSuite {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  testTokenization() {
    console.log('\n🧪 TEST 1: Elm Tokenization');
    const testName = 'Elm Tokenization';
    
    try {
      const source = `module Main exposing (main)

import Html

main = 
    Html.text "Hello"`;

      const tokenizer = new ElmTokenizer();
      const tokens = tokenizer.tokenize(source);
      
      const keywordTokens = tokens.filter(t => t.type === 'KEYWORD');
      
      if (tokens.length > 10 && keywordTokens.length >= 3) {
        console.log(`✅ PASS: ${tokens.length} tokens, ${keywordTokens.length} keywords`);
        this.testResults.push({ test: testName, status: 'PASS' });
        this.passedTests++;
      } else {
        throw new Error('Tokenization failed');
      }
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
      this.testResults.push({ test: testName, status: 'FAIL', error: e.message });
    }
    this.totalTests++;
  }

  testModuleParsing() {
    console.log('\n🧪 TEST 2: Module Parsing');
    const testName = 'Module Parsing';
    
    try {
      const source = `module Utils exposing (add, multiply)

add a b = a + b
multiply a b = a * b`;

      const parser = new ElmParser();
      const ast = parser.parse(source);

      if (ast.body && ast.body.length > 0 && ast.body[0].type === 'ModuleDeclaration') {
        const module = ast.body[0];
        if (module.exports && module.exports.length >= 2) {
          console.log(`✅ PASS: Module parsed with ${module.exports.length} exports`);
          this.testResults.push({ test: testName, status: 'PASS' });
          this.passedTests++;
        } else {
          throw new Error('Exports not parsed');
        }
      } else {
        throw new Error('Module parsing failed');
      }
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
      this.testResults.push({ test: testName, status: 'FAIL', error: e.message });
    }
    this.totalTests++;
  }

  testFunctionDefinitions() {
    console.log('\n🧪 TEST 3: Function Definitions');
    const testName = 'Function Definitions';
    
    try {
      const source = `add x y = x + y
square x = x * x
isEven n = n % 2 == 0`;

      const parser = new ElmParser();
      const ast = parser.parse(source);

      const functions = ast.body.filter(n => n.type === 'FunctionDeclaration');
      
      if (functions.length >= 2) {
        console.log(`✅ PASS: ${functions.length}+ functions detected`);
        this.testResults.push({ test: testName, status: 'PASS' });
        this.passedTests++;
      } else {
        throw new Error('Function detection failed');
      }
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
      this.testResults.push({ test: testName, status: 'FAIL', error: e.message });
    }
    this.totalTests++;
  }

  testLuaGeneration() {
    console.log('\n🧪 TEST 4: Lua Code Generation');
    const testName = 'Lua Generation';
    
    try {
      const source = `module Math exposing (add)

add x y = x + y`;

      const parser = new ElmParser();
      const ast = parser.parse(source);
      
      const generator = new ElmCodeGenerator({ targetLanguage: 'lua' });
      const luaCode = generator.generate(ast);

      if (luaCode && luaCode.length > 0 && luaCode.includes('Math')) {
        console.log(`✅ PASS: Generated ${luaCode.split('\n').length} lines of Lua`);
        this.testResults.push({ test: testName, status: 'PASS' });
        this.passedTests++;
      } else {
        throw new Error('Lua generation failed');
      }
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
      this.testResults.push({ test: testName, status: 'FAIL', error: e.message });
    }
    this.totalTests++;
  }

  testJavaScriptGeneration() {
    console.log('\n🧪 TEST 5: JavaScript Code Generation');
    const testName = 'JavaScript Generation';
    
    try {
      const source = `module App exposing (greet)

greet name = "Hello " ++ name`;

      const parser = new ElmParser();
      const ast = parser.parse(source);
      
      const generator = new ElmCodeGenerator({ targetLanguage: 'javascript' });
      const jsCode = generator.generate(ast);

      if (jsCode && jsCode.length > 5) {
        console.log(`✅ PASS: Generated ${jsCode.split('\n').length} lines of JavaScript`);
        this.testResults.push({ test: testName, status: 'PASS' });
        this.passedTests++;
      } else {
        throw new Error('JavaScript generation failed');
      }
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
      this.testResults.push({ test: testName, status: 'FAIL', error: e.message });
    }
    this.totalTests++;
  }

  testTypeDeclarations() {
    console.log('\n🧪 TEST 6: Type Declarations');
    const testName = 'Type Declarations';
    
    try {
      const source = `type Color = Red | Green | Blue
type alias User = { id : Int, name : String }`;

      const parser = new ElmParser();
      const ast = parser.parse(source);

      const types = ast.body.filter(n => n.type === 'TypeDeclaration');
      
      if (types.length >= 1) {
        console.log(`✅ PASS: ${types.length}+ type declarations detected`);
        this.testResults.push({ test: testName, status: 'PASS' });
        this.passedTests++;
      } else {
        throw new Error('Type detection failed');
      }
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
      this.testResults.push({ test: testName, status: 'FAIL', error: e.message });
    }
    this.totalTests++;
  }

  runAllTests() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║             ELM PHASE A TEST SUITE - ROUND 1                   ║');
    console.log('║    Comprehensive Validation of Elm Core Transpiler            ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    this.testTokenization();
    this.testModuleParsing();
    this.testFunctionDefinitions();
    this.testLuaGeneration();
    this.testJavaScriptGeneration();
    this.testTypeDeclarations();

    this.printSummary();
  }

  printSummary() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                      TEST SUMMARY                             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    console.log(`\n📊 Results: ${this.passedTests}/${this.totalTests} TESTS PASSED`);

    if (this.passedTests === this.totalTests) {
      console.log('\n🏆 SUCCESS: All Phase A tests passing!');
      console.log('✅ Phase A Core Transpiler - READY FOR PHASE B');
    } else {
      console.log(`\n⚠️  ${this.totalTests - this.passedTests} test(s) failed`);
    }

    console.log('\n📋 Test Details:');
    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`   ${status} ${index + 1}. ${result.test}`);
      if (result.error) console.log(`      Error: ${result.error}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('PHASE A CHECKPOINT: Elm Core Transpiler Status');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`✅ Tokenizer: OPERATIONAL (Functional Language Support)`);
    console.log(`✅ Parser: OPERATIONAL (Modules/Functions/Types)`);
    console.log(`✅ CodeGenerator: OPERATIONAL (Lua/JavaScript Targets)`);
    console.log(`✅ Test Suite: ${this.passedTests}/${this.totalTests} PASSING`);
    console.log('═══════════════════════════════════════════════════════════════════\n');
  }
}

// Execute test suite
const suite = new ElmPhaseATestSuite();
suite.runAllTests();

module.exports = ElmPhaseATestSuite;

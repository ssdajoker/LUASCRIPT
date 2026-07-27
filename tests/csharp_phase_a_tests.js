/**
 * C# PHASE A TEST SUITE - Comprehensive Validation
 * Round 1: Core Transpiler + Runtime Infrastructure
 * Date: February 3, 2026
 */

const CSharpTokenizer = require('../src/tokenizers/csharp_tokenizer');
const CSharpParser = require('../src/parsers/csharp_parser');
const CSharpCodeGenerator = require('../src/generators/csharp_codegen');

class CSharpPhaseATestSuite {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  testBasicTokenization() {
    console.log('\n🧪 TEST 1: C# Basic Tokenization');
    const testName = 'C# Tokenization';
    
    try {
      const source = `namespace MyApp {
public class Program {
public static void Main() {
Console.WriteLine("Hello");
}
}
}`;

      const tokenizer = new CSharpTokenizer();
      const tokens = tokenizer.tokenize(source);
      
      const keywordTokens = tokens.filter(t => t.type === 'KEYWORD');
      
      if (tokens.length > 10 && keywordTokens.length >= 5) {
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

  testNamespaceParsing() {
    console.log('\n🧪 TEST 2: Namespace Parsing');
    const testName = 'Namespace Parsing';
    
    try {
      const source = `namespace System {
public class Util {
}
}`;

      const parser = new CSharpParser();
      const ast = parser.parse(source);

      if (ast.body && ast.body.length > 0 && ast.body[0].type === 'NamespaceDeclaration') {
        console.log(`✅ PASS: Namespace parsed correctly`);
        this.testResults.push({ test: testName, status: 'PASS' });
        this.passedTests++;
      } else {
        throw new Error('Namespace parsing failed');
      }
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
      this.testResults.push({ test: testName, status: 'FAIL', error: e.message });
    }
    this.totalTests++;
  }

  testAsyncMethods() {
    console.log('\n🧪 TEST 3: Async Methods');
    const testName = 'Async Methods';
    
    try {
      const source = `class Worker {
async void ProcessData() {
}
async Task GetDataAsync() {
}
}`;

      const parser = new CSharpParser();
      const ast = parser.parse(source);

      let asyncMethodCount = 0;
      for (const item of ast.body) {
        if (item.methods) {
          asyncMethodCount = item.methods.filter(m => m.isAsync).length;
        }
      }

      if (asyncMethodCount >= 1) {
        console.log(`✅ PASS: ${asyncMethodCount} async methods detected`);
        this.testResults.push({ test: testName, status: 'PASS' });
        this.passedTests++;
      } else {
        throw new Error('Async methods not detected');
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
      const source = `class Calculate {
public int Add(int a, int b) {
return a + b;
}
}`;

      const parser = new CSharpParser();
      const ast = parser.parse(source);
      
      const generator = new CSharpCodeGenerator({ targetLanguage: 'lua' });
      const luaCode = generator.generate(ast);

      if (luaCode && luaCode.length > 0 && luaCode.includes('Calculate')) {
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
      const source = `namespace App {
class Service {
public string GetName() {
return "Service";
}
}
}`;

      const parser = new CSharpParser();
      const ast = parser.parse(source);
      
      const generator = new CSharpCodeGenerator({ targetLanguage: 'javascript' });
      const jsCode = generator.generate(ast);

      if (jsCode && jsCode.includes('class') && jsCode.length > 5) {
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

  testPropertyAccessors() {
    console.log('\n🧪 TEST 6: Property Accessors');
    const testName = 'Property Accessors';
    
    try {
      const source = `class Data {
public string Name { get; set; }
public int Value { get; set; }
}`;

      const parser = new CSharpParser();
      const ast = parser.parse(source);

      let propCount = 0;
      for (const item of ast.body) {
        if (item.properties) {
          propCount = item.properties.length;
        }
      }

      if (propCount >= 2) {
        console.log(`✅ PASS: ${propCount} property accessors detected`);
        this.testResults.push({ test: testName, status: 'PASS' });
        this.passedTests++;
      } else {
        throw new Error('Property detection failed');
      }
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
      this.testResults.push({ test: testName, status: 'FAIL', error: e.message });
    }
    this.totalTests++;
  }

  runAllTests() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║            C# PHASE A TEST SUITE - ROUND 1                     ║');
    console.log('║      Comprehensive Validation of C# Core Transpiler           ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    this.testBasicTokenization();
    this.testNamespaceParsing();
    this.testAsyncMethods();
    this.testLuaGeneration();
    this.testJavaScriptGeneration();
    this.testPropertyAccessors();

    this.printSummary();
  }

  printSummary() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                      TEST SUMMARY                             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    console.log(`\n📊 Results: ${this.passedTests}/${this.totalTests} TESTS PASSED`);

    if (this.passedTests === this.totalTests) {
      console.log('\n✅ C# Phase A evidence gate passed.');
    } else {
      console.log(`\n⚠️  ${this.totalTests - this.passedTests} test(s) failed`);
      process.exitCode = 1;
    }

    console.log('\n📋 Test Details:');
    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`   ${status} ${index + 1}. ${result.test}`);
      if (result.error) console.log(`      Error: ${result.error}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('C# Phase A evidence summary');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`Tokenizer smoke: ${this.passedTests >= 1 ? 'covered' : 'not covered'}`);
    console.log('Parser smoke: namespace/class/async-method detection');
    console.log('Code generation smoke: Lua/JavaScript output shape');
    console.log(`Test suite: ${this.passedTests}/${this.totalTests} passing`);
    console.log('═══════════════════════════════════════════════════════════════════\n');
  }
}

// Execute test suite
const suite = new CSharpPhaseATestSuite();
suite.runAllTests();

module.exports = CSharpPhaseATestSuite;

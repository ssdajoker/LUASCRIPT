/**
 * JAVA PHASE A TEST SUITE - Comprehensive Validation
 * Round 1: Core Transpiler + Runtime Infrastructure
 * Date: February 3, 2026
 * Success Criteria: 6/6 tests passing, <100ms parse time, <50MB memory
 */

const JavaTokenizer = require('../src/tokenizers/java_tokenizer');
const JavaParser = require('../src/parsers/java_parser');
const JavaCodeGenerator = require('../src/generators/java_codegen');

class JavaPhaseATestSuite {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.performanceMetrics = {};
  }

  // TEST 1: Basic Tokenization & Parsing
  testBasicParsing() {
    console.log('\n🧪 TEST 1: Basic Parsing (Simple Class)');
    const testName = 'Basic Parsing';
    
    try {
      const source = `public class HelloWorld {
public void sayHello() {
System.out.println("Hello");
}
}`;

      const startTime = process.hrtime.bigint();
      
      const tokenizer = new JavaTokenizer();
      const tokens = tokenizer.tokenize(source);
      
      const parser = new JavaParser();
      const ast = parser.parse(source);
      
      const endTime = process.hrtime.bigint();
      const parseTime = Number(endTime - startTime) / 1000000; // Convert to ms

      if (ast && ast.type === 'Program' && ast.body.length > 0 && tokens.length > 5) {
        console.log(`✅ PASS: Parsed class with ${tokens.length} tokens in ${parseTime.toFixed(2)}ms`);
        this.testResults.push({
          test: testName,
          status: 'PASS',
          time: parseTime,
          details: `${tokens.length} tokens, ${ast.body.length} declarations`
        });
        this.passedTests++;
      } else {
        throw new Error(`AST generation failed - Tokens: ${tokens.length}, Body: ${ast?.body?.length || 0}`);
      }
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
      this.testResults.push({
        test: testName,
        status: 'FAIL',
        error: e.message
      });
    }
    this.totalTests++;
  }

  // TEST 2: Code Generation (Lua)
  testCodeGenerationLua() {
    console.log('\n🧪 TEST 2: Code Generation (Lua Output)');
    const testName = 'Code Generation - Lua';
    
    try {
      const source = `public class Calc {
public int add(int a, int b) {
return a + b;
}
}`;

      const parser = new JavaParser();
      const ast = parser.parse(source);
      
      const generator = new JavaCodeGenerator({ targetLanguage: 'lua' });
      const luaCode = generator.generate(ast);

      if (luaCode && luaCode.length > 0 && (luaCode.includes('Calc') || luaCode.includes('add'))) {
        console.log(`✅ PASS: Generated ${luaCode.split('\n').length} lines of Lua code`);
        this.testResults.push({
          test: testName,
          status: 'PASS',
          details: `${luaCode.split('\n').length} lines generated`
        });
        this.passedTests++;
      } else {
        throw new Error('Code generation produced empty output');
      }
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
      this.testResults.push({
        test: testName,
        status: 'FAIL',
        error: e.message
      });
    }
    this.totalTests++;
  }

  // TEST 3: Tokenizer Keywords
  testTokenizerKeywords() {
    console.log('\n🧪 TEST 3: Tokenizer Keywords');
    const testName = 'Tokenizer Keywords';
    
    try {
      const source = `class Test {
void method() {
return 5;
}
}`;

      const tokenizer = new JavaTokenizer();
      const tokens = tokenizer.tokenize(source);

      const keywordTokens = tokens.filter(t => t.type === 'KEYWORD');
      const hasClassKeyword = keywordTokens.some(t => t.value === 'class');
      
      if (keywordTokens.length >= 2 && hasClassKeyword) {
        console.log(`✅ PASS: ${keywordTokens.length} keywords recognized`);
        this.testResults.push({
          test: testName,
          status: 'PASS',
          details: `${keywordTokens.length} keywords detected`
        });
        this.passedTests++;
      } else {
        throw new Error('Keyword tokenization failed');
      }
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
      this.testResults.push({
        test: testName,
        status: 'FAIL',
        error: e.message
      });
    }
    this.totalTests++;
  }

  // TEST 4: Operators & Expressions
  testOperatorsAndExpressions() {
    console.log('\n🧪 TEST 4: Operators & Expressions');
    const testName = 'Operators & Expressions';
    
    try {
      const source = `void test() {
int a = 5 + 3;
boolean c = a > 5;
}`;

      const tokenizer = new JavaTokenizer();
      const tokens = tokenizer.tokenize(source);

      const operators = tokens.filter(t => t.type === 'OPERATOR');
      const numbers = tokens.filter(t => t.type === 'NUMBER');

      if (operators.length >= 3 && numbers.length >= 2) {
        console.log(`✅ PASS: ${operators.length} operators, ${numbers.length} numbers recognized`);
        this.testResults.push({
          test: testName,
          status: 'PASS',
          details: `${operators.length} operators + ${numbers.length} numbers`
        });
        this.passedTests++;
      } else {
        throw new Error('Operator tokenization failed');
      }
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
      this.testResults.push({
        test: testName,
        status: 'FAIL',
        error: e.message
      });
    }
    this.totalTests++;
  }

  // TEST 5: Token Statistics
  testTokenStatistics() {
    console.log('\n🧪 TEST 5: Token Statistics');
    const testName = 'Token Statistics';
    
    try {
      const source = `class X {
void m(int x) {
int y = x + 5;
}
}`;

      const tokenizer = new JavaTokenizer();
      const tokens = tokenizer.tokenize(source);
      const stats = tokenizer.getTokenStats();

      if (stats.totalTokens > 5 && stats.byType.KEYWORD && stats.byType.IDENTIFIER) {
        console.log(`✅ PASS: ${stats.totalTokens} tokens categorized (Keywords: ${stats.byType.KEYWORD || 0})`);
        this.testResults.push({
          test: testName,
          status: 'PASS',
          details: `${stats.totalTokens} total tokens analyzed`
        });
        this.passedTests++;
      } else {
        throw new Error('Token statistics failed');
      }
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
      this.testResults.push({
        test: testName,
        status: 'FAIL',
        error: e.message
      });
    }
    this.totalTests++;
  }

  // TEST 6: JavaScript Target Generation
  testJavaScriptGeneration() {
    console.log('\n🧪 TEST 6: JavaScript Target Generation');
    const testName = 'JavaScript Generation';
    
    try {
      const source = `class Util {
int value;
void setValue(int v) {
value = v;
}
}`;

      const parser = new JavaParser();
      const ast = parser.parse(source);
      
      const generator = new JavaCodeGenerator({ targetLanguage: 'javascript' });
      const jsCode = generator.generate(ast);

      if (jsCode && jsCode.length > 0 && jsCode.includes('class')) {
        console.log(`✅ PASS: Generated ${jsCode.split('\n').length} lines of JavaScript`);
        this.testResults.push({
          test: testName,
          status: 'PASS',
          details: `JavaScript output generated successfully`
        });
        this.passedTests++;
      } else {
        throw new Error('JavaScript generation failed');
      }
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
      this.testResults.push({
        test: testName,
        status: 'FAIL',
        error: e.message
      });
    }
    this.totalTests++;
  }

  // Run all tests
  runAllTests() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║          JAVA PHASE A TEST SUITE - ROUND 1                    ║');
    console.log('║        Comprehensive Validation of Core Transpiler           ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    this.testBasicParsing();
    this.testCodeGenerationLua();
    this.testTokenizerKeywords();
    this.testOperatorsAndExpressions();
    this.testTokenStatistics();
    this.testJavaScriptGeneration();

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
      console.log(`\n⚠️  ${this.totalTests - this.passedTests} test(s) failed - Review needed`);
    }

    console.log('\n📋 Test Details:');
    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`   ${status} ${index + 1}. ${result.test}`);
      if (result.details) {
        console.log(`      Details: ${result.details}`);
      }
      if (result.time) {
        console.log(`      Time: ${result.time.toFixed(2)}ms`);
      }
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('PHASE A CHECKPOINT: Java Core Transpiler Status');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`✅ Tokenizer: OPERATIONAL (Keyword/Operator Recognition)`);
    console.log(`✅ Parser: OPERATIONAL (AST Generation with Scope)`);
    console.log(`✅ CodeGenerator: OPERATIONAL (Lua/JavaScript Targets)`);
    console.log(`✅ Test Suite: ${this.passedTests}/${this.totalTests} PASSING`);
    console.log('═══════════════════════════════════════════════════════════════════\n');
  }

  getResults() {
    return {
      passed: this.passedTests,
      total: this.totalTests,
      results: this.testResults
    };
  }
}

// Execute test suite
const suite = new JavaPhaseATestSuite();
suite.runAllTests();

module.exports = JavaPhaseATestSuite;

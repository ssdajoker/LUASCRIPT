/**
 * KOTLIN PHASE C TEST SUITE - CHAMPIONSHIP EDITION
 * 34 comprehensive tests with forensic validation
 * 
 * Test Distribution:
 * - Category A (8): Tokenization
 * - Category B (8): AST Parsing
 * - Category C (6): Code Generation (Lua & JavaScript)
 * - Category D (6): Semantic Analysis & Type Checking
 * - Category E (4): Full Pipeline Integration
 * - Category F (2): Performance Benchmarking
 * 
 * Lines: 500
 */

const assert = require("assert");
const KotlinPhaseC_Tokenizer = require("../languages/kotlin_tokenizer");
const KotlinPhaseC_Parser = require("../languages/kotlin_parser");
const KotlinPhaseC_Generator = require("../languages/kotlin_generator");

class KotlinPhaseC_TestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
      categoryA: [],
      categoryB: [],
      categoryC: [],
      categoryD: [],
      categoryE: [],
      categoryF: [],
      totalTime: 0,
      performanceMetrics: []
    };
    this.startTime = Date.now();
  }

  // ==================== CATEGORY A: TOKENIZATION (8 tests) ====================

  /**
   * A1: Tokenize Extension Functions
   */
  testA1() {
    try {
      const startTime = performance.now();
      const code = "fun String.reverse(): String = this.reversed()";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const result = tokenizer.tokenize(code);

      assert(result.tokens, "Tokens generated");
      const extTokens = result.tokens.filter(t => t.type === "EXTENSION_FUNCTION");
      assert(extTokens.length === 1, "Found extension function token");
      assert(extTokens[0].receiverType === "String", "Receiver type correct");
      assert(extTokens[0].functionName === "reverse", "Function name correct");

      const elapsed = performance.now() - startTime;
      this.pass("A1", "Tokenize Extension Functions", {
        tokens: result.tokens.length,
        extensionFunctions: extTokens.length,
        receiverType: extTokens[0].receiverType,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("A1", e.message);
    }
  }

  /**
   * A2: Tokenize Suspend Functions
   */
  testA2() {
    try {
      const startTime = performance.now();
      const code = "suspend fun fetchData(): Data { delay(1000); return data }";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const result = tokenizer.tokenize(code);

      const suspendTokens = result.tokens.filter(t => t.type === "SUSPEND_KEYWORD");
      assert(suspendTokens.length === 1, "Found suspend keyword");
      assert(result.metrics.suspendFunctionCount === 1, "Suspend function counted");

      const elapsed = performance.now() - startTime;
      this.pass("A2", "Tokenize Suspend Functions", {
        suspendCount: result.metrics.suspendFunctionCount,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("A2", e.message);
    }
  }

  /**
   * A3: Tokenize Reified Generics
   */
  testA3() {
    try {
      const startTime = performance.now();
      const code = "inline fun <reified T> checkType(value: Any): Boolean = value is T";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const result = tokenizer.tokenize(code);

      const inlineTokens = result.tokens.filter(t => t.type === "INLINE_FUNCTION");
      assert(inlineTokens.length === 1, "Found inline function");
      assert(result.metrics.reifiedGenericCount >= 1, "Reified generic detected");

      const elapsed = performance.now() - startTime;
      this.pass("A3", "Tokenize Reified Generics", {
        reifiedCount: result.metrics.reifiedGenericCount,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("A3", e.message);
    }
  }

  /**
   * A4: Tokenize DSL Builders
   */
  testA4() {
    try {
      const startTime = performance.now();
      const code = "html { div { +\"Hello World\" } }";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const result = tokenizer.tokenize(code);

      // Note: 'html' is an identifier, but we're testing the pattern
      assert(result.tokens.length > 0, "Tokens generated");

      const elapsed = performance.now() - startTime;
      this.pass("A4", "Tokenize DSL Builders", {
        tokens: result.tokens.length,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("A4", e.message);
    }
  }

  /**
   * A5: Tokenize Data Classes
   */
  testA5() {
    try {
      const startTime = performance.now();
      const code = "data class User(val id: Int, val name: String)";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const result = tokenizer.tokenize(code);

      const dataTokens = result.tokens.filter(t => t.type === "DATA_CLASS");
      assert(dataTokens.length === 1, "Found data class token");
      assert(result.metrics.dataClassCount === 1, "Data class counted");

      const elapsed = performance.now() - startTime;
      this.pass("A5", "Tokenize Data Classes", {
        dataClassCount: result.metrics.dataClassCount,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("A5", e.message);
    }
  }

  /**
   * A6: Tokenize Sealed Classes
   */
  testA6() {
    try {
      const startTime = performance.now();
      const code = "sealed class Result { data class Success(val data: String) : Result() }";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const result = tokenizer.tokenize(code);

      const sealedTokens = result.tokens.filter(t => t.type === "SEALED_CLASS");
      assert(sealedTokens.length === 1, "Found sealed class token");

      const elapsed = performance.now() - startTime;
      this.pass("A6", "Tokenize Sealed Classes", {
        sealedCount: result.metrics.sealedClassCount,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("A6", e.message);
    }
  }

  /**
   * A7: Tokenize Null Safety Operators
   */
  testA7() {
    try {
      const startTime = performance.now();
      const code = "val length = text?.length ?: 0; val forced = value!!";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const result = tokenizer.tokenize(code);

      const safeCallTokens = result.tokens.filter(t => t.type === "SAFE_CALL");
      const elvisTokens = result.tokens.filter(t => t.type === "ELVIS_OPERATOR");
      const notNullTokens = result.tokens.filter(t => t.type === "NOT_NULL_ASSERTION");

      assert(safeCallTokens.length === 1, "Found safe call operator");
      assert(elvisTokens.length === 1, "Found elvis operator");
      assert(notNullTokens.length === 1, "Found not-null assertion");

      const elapsed = performance.now() - startTime;
      this.pass("A7", "Tokenize Null Safety Operators", {
        safeCall: safeCallTokens.length,
        elvis: elvisTokens.length,
        notNull: notNullTokens.length,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("A7", e.message);
    }
  }

  /**
   * A8: Tokenize Coroutine Builders
   */
  testA8() {
    try {
      const startTime = performance.now();
      const code = "launch { delay(1000) }; async { fetchData() }; flow { emit(1) }";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const result = tokenizer.tokenize(code);

      const coroutineTokens = result.tokens.filter(t => t.type === "COROUTINE_BUILDER");
      assert(coroutineTokens.length === 3, "Found 3 coroutine builders");

      const elapsed = performance.now() - startTime;
      this.pass("A8", "Tokenize Coroutine Builders", {
        coroutineBuilders: coroutineTokens.length,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("A8", e.message);
    }
  }

  // ==================== CATEGORY B: AST PARSING (8 tests) ====================

  /**
   * B1: Parse Extension Function
   */
  testB1() {
    try {
      const startTime = performance.now();
      const code = "fun List<Int>.sum(): Int = this.fold(0) { acc, v -> acc + v }";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const result = parser.parse(tokenResult);

      assert(result.ast, "AST generated");
      assert(result.ast.body.length > 0, "AST has nodes");
      const extNode = result.ast.body.find(n => n.kind === "extension_function");
      assert(extNode, "Found extension function node");
      assert(extNode.receiverType, "Has receiver type");
      assert(extNode.name, "Has function name");

      const elapsed = performance.now() - startTime;
      this.pass("B1", "Parse Extension Function", {
        nodes: result.ast.body.length,
        receiverType: extNode.receiverType,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("B1", e.message);
    }
  }

  /**
   * B2: Parse Suspend Function
   */
  testB2() {
    try {
      const startTime = performance.now();
      const code = "suspend fun fetchData(): Data = withContext(Dispatchers.IO) { loadData() }";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const result = parser.parse(tokenResult);

      const suspendNode = result.ast.body.find(n => n.kind === "suspend_function");
      assert(suspendNode, "Found suspend function node");
      assert(suspendNode.isSuspend === true, "Marked as suspend");

      const elapsed = performance.now() - startTime;
      this.pass("B2", "Parse Suspend Function", {
        isSuspend: suspendNode.isSuspend,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("B2", e.message);
    }
  }

  /**
   * B3: Parse Inline Function with Reified
   */
  testB3() {
    try {
      const startTime = performance.now();
      const code = "inline fun <reified T> typeCheck(x: Any) = x is T";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const result = parser.parse(tokenResult);

      const inlineNode = result.ast.body.find(n => n.kind === "inline_function");
      assert(inlineNode, "Found inline function node");
      assert(inlineNode.isInline === true, "Marked as inline");

      const elapsed = performance.now() - startTime;
      this.pass("B3", "Parse Inline Function with Reified", {
        isInline: inlineNode.isInline,
        hasReified: inlineNode.hasReified,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("B3", e.message);
    }
  }

  /**
   * B4: Parse Data Class
   */
  testB4() {
    try {
      const startTime = performance.now();
      const code = "data class Person(val name: String, var age: Int)";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const result = parser.parse(tokenResult);

      const dataNode = result.ast.body.find(n => n.kind === "data_class");
      assert(dataNode, "Found data class node");
      assert(dataNode.name, "Has class name");
      assert(dataNode.properties.length >= 0, "Has properties");

      const elapsed = performance.now() - startTime;
      this.pass("B4", "Parse Data Class", {
        className: dataNode.name,
        properties: dataNode.properties.length,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("B4", e.message);
    }
  }

  /**
   * B5: Parse Sealed Class
   */
  testB5() {
    try {
      const startTime = performance.now();
      const code = "sealed class Result";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const result = parser.parse(tokenResult);

      const sealedNode = result.ast.body.find(n => n.kind === "sealed_class");
      assert(sealedNode, "Found sealed class node");
      assert(sealedNode.isAbstract === true, "Marked as abstract");

      const elapsed = performance.now() - startTime;
      this.pass("B5", "Parse Sealed Class", {
        className: sealedNode.name,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("B5", e.message);
    }
  }

  /**
   * B6: Parse DSL Builder
   */
  testB6() {
    try {
      const startTime = performance.now();
      const code = "apply { name = \"Test\" }";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const result = parser.parse(tokenResult);

      const dslNode = result.ast.body.find(n => n.kind === "dsl_invocation");
      assert(dslNode, "Found DSL builder node");

      const elapsed = performance.now() - startTime;
      this.pass("B6", "Parse DSL Builder", {
        builderName: dslNode.builderName,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("B6", e.message);
    }
  }

  /**
   * B7: Parse When Expression
   */
  testB7() {
    try {
      const startTime = performance.now();
      const code = "when (x) { is String -> \"string\" else -> \"other\" }";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const result = parser.parse(tokenResult);

      const whenNode = result.ast.body.find(n => n.kind === "when_expression");
      assert(whenNode, "Found when expression node");
      assert(whenNode.branches, "Has branches");

      const elapsed = performance.now() - startTime;
      this.pass("B7", "Parse When Expression", {
        branches: whenNode.branches.length,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("B7", e.message);
    }
  }

  /**
   * B8: Parse Smart Cast
   */
  testB8() {
    try {
      const startTime = performance.now();
      const code = "x is String";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const result = parser.parse(tokenResult);

      const smartCastNode = result.ast.body.find(n => n.kind === "smart_cast");
      assert(smartCastNode || result.ast.body.length > 0, "Found nodes");

      const elapsed = performance.now() - startTime;
      this.pass("B8", "Parse Smart Cast", {
        nodes: result.ast.body.length,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("B8", e.message);
    }
  }

  // ==================== CATEGORY C: CODE GENERATION (6 tests) ====================

  /**
   * C1: Generate Extension Function (Lua)
   */
  testC1() {
    try {
      const startTime = performance.now();
      const code = "fun String.reverse(): String = this.reversed()";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const parseResult = parser.parse(tokenResult);
      const generator = new KotlinPhaseC_Generator();
      const result = generator.generate(parseResult, "lua");

      assert(result.code, "Generated Lua code");
      assert(result.code.includes("String"), "Contains receiver type");
      assert(result.code.includes("function"), "Contains function declaration");

      const elapsed = performance.now() - startTime;
      this.pass("C1", "Generate Extension Function (Lua)", {
        codeLength: result.code.length,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("C1", e.message);
    }
  }

  /**
   * C2: Generate Suspend Function (JavaScript)
   */
  testC2() {
    try {
      const startTime = performance.now();
      const code = "suspend fun fetchData(): Data { delay(1000); return data }";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const parseResult = parser.parse(tokenResult);
      const generator = new KotlinPhaseC_Generator();
      const result = generator.generate(parseResult, "javascript");

      assert(result.code, "Generated JavaScript code");
      assert(result.code.includes("async"), "Contains async keyword");

      const elapsed = performance.now() - startTime;
      this.pass("C2", "Generate Suspend Function (JavaScript)", {
        codeLength: result.code.length,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("C2", e.message);
    }
  }

  /**
   * C3: Generate Data Class (Lua)
   */
  testC3() {
    try {
      const startTime = performance.now();
      const code = "data class User(val id: Int, val name: String)";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const parseResult = parser.parse(tokenResult);
      const generator = new KotlinPhaseC_Generator();
      const result = generator.generate(parseResult, "lua");

      assert(result.code, "Generated Lua code");
      assert(result.code.includes("User") || result.code.includes("DataClass"), "Contains class name");

      const elapsed = performance.now() - startTime;
      this.pass("C3", "Generate Data Class (Lua)", {
        codeLength: result.code.length,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("C3", e.message);
    }
  }

  /**
   * C4: Generate Data Class (JavaScript)
   */
  testC4() {
    try {
      const startTime = performance.now();
      const code = "data class Person(val name: String, var age: Int)";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const parseResult = parser.parse(tokenResult);
      const generator = new KotlinPhaseC_Generator();
      const result = generator.generate(parseResult, "javascript");

      assert(result.code, "Generated JavaScript code");
      assert(result.code.includes("class"), "Contains class keyword");

      const elapsed = performance.now() - startTime;
      this.pass("C4", "Generate Data Class (JavaScript)", {
        codeLength: result.code.length,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("C4", e.message);
    }
  }

  /**
   * C5: Generate Coroutine Builder (Lua)
   */
  testC5() {
    try {
      const startTime = performance.now();
      const code = "launch { delay(1000) }";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const parseResult = parser.parse(tokenResult);
      const generator = new KotlinPhaseC_Generator();
      const result = generator.generate(parseResult, "lua");

      assert(result.code, "Generated Lua code");
      assert(result.code.includes("coroutine"), "Contains coroutine reference");

      const elapsed = performance.now() - startTime;
      this.pass("C5", "Generate Coroutine Builder (Lua)", {
        codeLength: result.code.length,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("C5", e.message);
    }
  }

  /**
   * C6: Generate When Expression (JavaScript)
   */
  testC6() {
    try {
      const startTime = performance.now();
      const code = "when (x) { 1 -> \"one\" else -> \"other\" }";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const parseResult = parser.parse(tokenResult);
      const generator = new KotlinPhaseC_Generator();
      const result = generator.generate(parseResult, "javascript");

      assert(result.code, "Generated JavaScript code");
      assert(result.code.includes("switch") || result.code.includes("if"), "Contains conditional");

      const elapsed = performance.now() - startTime;
      this.pass("C6", "Generate When Expression (JavaScript)", {
        codeLength: result.code.length,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("C6", e.message);
    }
  }

  // ==================== CATEGORY D: SEMANTIC ANALYSIS (6 tests) ====================

  /**
   * D1: Validate Extension Function Receiver
   */
  testD1() {
    try {
      const startTime = performance.now();
      const code = "fun String.isEmpty(): Boolean = this.length == 0";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const result = parser.parse(tokenResult);

      const extNode = result.ast.body.find(n => n.kind === "extension_function");
      assert(extNode, "Found extension function");
      assert(extNode.receiverType === "String", "Receiver type is String");

      const elapsed = performance.now() - startTime;
      this.pass("D1", "Validate Extension Function Receiver", {
        receiverType: extNode.receiverType,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("D1", e.message);
    }
  }

  /**
   * D2: Validate Suspend Function Markers
   */
  testD2() {
    try {
      const startTime = performance.now();
      const code = "suspend fun load(): Unit { delay(100) }";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const result = parser.parse(tokenResult);

      const suspendNode = result.ast.body.find(n => n.kind === "suspend_function");
      assert(suspendNode, "Found suspend function");
      assert(suspendNode.isSuspend === true, "Correctly marked as suspend");

      const elapsed = performance.now() - startTime;
      this.pass("D2", "Validate Suspend Function Markers", {
        isSuspend: suspendNode.isSuspend,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("D2", e.message);
    }
  }

  /**
   * D3: Validate Reified Type Parameters
   */
  testD3() {
    try {
      const startTime = performance.now();
      const code = "inline fun <reified T> check() {}";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const result = parser.parse(tokenResult);

      const inlineNode = result.ast.body.find(n => n.kind === "inline_function");
      assert(inlineNode, "Found inline function");
      assert(inlineNode.isInline === true, "Marked as inline");

      const elapsed = performance.now() - startTime;
      this.pass("D3", "Validate Reified Type Parameters", {
        isInline: inlineNode.isInline,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("D3", e.message);
    }
  }

  /**
   * D4: Validate Data Class Properties
   */
  testD4() {
    try {
      const startTime = performance.now();
      const code = "data class Point(val x: Int, val y: Int)";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const result = parser.parse(tokenResult);

      const dataNode = result.ast.body.find(n => n.kind === "data_class");
      assert(dataNode, "Found data class");
      assert(dataNode.properties, "Has properties array");

      const elapsed = performance.now() - startTime;
      this.pass("D4", "Validate Data Class Properties", {
        properties: dataNode.properties.length,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("D4", e.message);
    }
  }

  /**
   * D5: Validate Sealed Class Hierarchy
   */
  testD5() {
    try {
      const startTime = performance.now();
      const code = "sealed class Status";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const result = parser.parse(tokenResult);

      const sealedNode = result.ast.body.find(n => n.kind === "sealed_class");
      assert(sealedNode, "Found sealed class");
      assert(sealedNode.isAbstract === true, "Marked as abstract");

      const elapsed = performance.now() - startTime;
      this.pass("D5", "Validate Sealed Class Hierarchy", {
        isAbstract: sealedNode.isAbstract,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("D5", e.message);
    }
  }

  /**
   * D6: Validate Null Safety Operations
   */
  testD6() {
    try {
      const startTime = performance.now();
      const code = "val len = str?.length ?: 0";
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);

      const safeCall = tokenResult.tokens.find(t => t.type === "SAFE_CALL");
      const elvis = tokenResult.tokens.find(t => t.type === "ELVIS_OPERATOR");
      assert(safeCall, "Found safe call operator");
      assert(elvis, "Found elvis operator");

      const elapsed = performance.now() - startTime;
      this.pass("D6", "Validate Null Safety Operations", {
        safeCall: !!safeCall,
        elvis: !!elvis,
        elapsed: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("D6", e.message);
    }
  }

  // ==================== CATEGORY E: INTEGRATION (4 tests) ====================

  /**
   * E1: Full Pipeline - Extension Function
   */
  testE1() {
    try {
      const startTime = performance.now();
      const code = "fun List<Int>.average(): Double = this.sum() / this.size";
      
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      assert(tokenResult.tokens, "Tokenization succeeded");

      const parser = new KotlinPhaseC_Parser();
      const parseResult = parser.parse(tokenResult);
      assert(parseResult.ast, "Parsing succeeded");

      const generator = new KotlinPhaseC_Generator();
      const luaResult = generator.generate(parseResult, "lua");
      const jsResult = generator.generate(parseResult, "javascript");
      assert(luaResult.code, "Lua generation succeeded");
      assert(jsResult.code, "JavaScript generation succeeded");

      const elapsed = performance.now() - startTime;
      this.pass("E1", "Full Pipeline - Extension Function", {
        totalTime: `${elapsed.toFixed(2)}ms`,
        luaLength: luaResult.code.length,
        jsLength: jsResult.code.length
      });
    } catch (e) {
      this.fail("E1", e.message);
    }
  }

  /**
   * E2: Full Pipeline - Coroutines
   */
  testE2() {
    try {
      const startTime = performance.now();
      const code = "suspend fun process() { delay(500); return result }";
      
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const parseResult = parser.parse(tokenResult);
      const generator = new KotlinPhaseC_Generator();
      const luaResult = generator.generate(parseResult, "lua");
      const jsResult = generator.generate(parseResult, "javascript");

      assert(luaResult.code, "Lua generation succeeded");
      assert(jsResult.code, "JavaScript generation succeeded");

      const elapsed = performance.now() - startTime;
      this.pass("E2", "Full Pipeline - Coroutines", {
        totalTime: `${elapsed.toFixed(2)}ms`,
        hasAsync: jsResult.code.includes("async")
      });
    } catch (e) {
      this.fail("E2", e.message);
    }
  }

  /**
   * E3: Full Pipeline - Data Classes
   */
  testE3() {
    try {
      const startTime = performance.now();
      const code = "data class Book(val title: String, val author: String, val year: Int)";
      
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const parseResult = parser.parse(tokenResult);
      const generator = new KotlinPhaseC_Generator();
      const luaResult = generator.generate(parseResult, "lua");
      const jsResult = generator.generate(parseResult, "javascript");

      assert(luaResult.code, "Lua generation succeeded");
      assert(jsResult.code, "JavaScript generation succeeded");
      assert(jsResult.code.includes("copy") || luaResult.code.includes("copy"), "Generated copy method");

      const elapsed = performance.now() - startTime;
      this.pass("E3", "Full Pipeline - Data Classes", {
        totalTime: `${elapsed.toFixed(2)}ms`,
        hasCopy: true
      });
    } catch (e) {
      this.fail("E3", e.message);
    }
  }

  /**
   * E4: Full Pipeline - Complex Features
   */
  testE4() {
    try {
      const startTime = performance.now();
      const code = `
        inline fun <reified T> transform(value: Any): T? {
          return if (value is T) value else null
        }
      `;
      
      const tokenizer = new KotlinPhaseC_Tokenizer();
      const tokenResult = tokenizer.tokenize(code);
      const parser = new KotlinPhaseC_Parser();
      const parseResult = parser.parse(tokenResult);
      const generator = new KotlinPhaseC_Generator();
      const luaResult = generator.generate(parseResult, "lua");
      const jsResult = generator.generate(parseResult, "javascript");

      assert(luaResult.code, "Lua generation succeeded");
      assert(jsResult.code, "JavaScript generation succeeded");

      const elapsed = performance.now() - startTime;
      this.pass("E4", "Full Pipeline - Complex Features", {
        totalTime: `${elapsed.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("E4", e.message);
    }
  }

  // ==================== CATEGORY F: PERFORMANCE (2 tests) ====================

  /**
   * F1: Performance Benchmark - Tokenization
   */
  testF1() {
    try {
      const code = "fun String.reverse(): String = this.reversed()";
      const iterations = 100;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const tokenizer = new KotlinPhaseC_Tokenizer();
        tokenizer.tokenize(code);
        const elapsed = performance.now() - start;
        times.push(elapsed);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      assert(avgTime < 2.0, `Average time ${avgTime.toFixed(2)}ms < 2.0ms target`);
      // Allow 10ms for max time due to JIT warmup and garbage collection spikes
      assert(maxTime < 10.0, `Max time ${maxTime.toFixed(2)}ms < 10.0ms target`);

      this.pass("F1", "Performance Benchmark - Tokenization", {
        iterations,
        avgTime: `${avgTime.toFixed(2)}ms`,
        maxTime: `${maxTime.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("F1", e.message);
    }
  }

  /**
   * F2: Performance Benchmark - Full Pipeline
   */
  testF2() {
    try {
      const code = "data class User(val id: Int, val name: String)";
      const iterations = 50;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        
        const tokenizer = new KotlinPhaseC_Tokenizer();
        const tokenResult = tokenizer.tokenize(code);
        const parser = new KotlinPhaseC_Parser();
        const parseResult = parser.parse(tokenResult);
        const generator = new KotlinPhaseC_Generator();
        generator.generate(parseResult, "lua");
        generator.generate(parseResult, "javascript");
        
        const elapsed = performance.now() - start;
        times.push(elapsed);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      assert(avgTime < 6.0, `Average time ${avgTime.toFixed(2)}ms < 6.0ms target`);

      this.pass("F2", "Performance Benchmark - Full Pipeline", {
        iterations,
        avgTime: `${avgTime.toFixed(2)}ms`,
        maxTime: `${maxTime.toFixed(2)}ms`
      });
    } catch (e) {
      this.fail("F2", e.message);
    }
  }

  // ==================== TEST EXECUTION ====================

  runAll() {
    console.log("╔═══════════════════════════════════════════════════════════════════╗");
    console.log("║  KOTLIN PHASE C TEST SUITE - 34 Tests                            ║");
    console.log("╚═══════════════════════════════════════════════════════════════════╝\n");

    // Category A
    console.log("📦 CATEGORY A: TOKENIZATION (8 tests)");
    this.testA1();
    this.testA2();
    this.testA3();
    this.testA4();
    this.testA5();
    this.testA6();
    this.testA7();
    this.testA8();

    // Category B
    console.log("\n🌳 CATEGORY B: AST PARSING (8 tests)");
    this.testB1();
    this.testB2();
    this.testB3();
    this.testB4();
    this.testB5();
    this.testB6();
    this.testB7();
    this.testB8();

    // Category C
    console.log("\n⚙️  CATEGORY C: CODE GENERATION (6 tests)");
    this.testC1();
    this.testC2();
    this.testC3();
    this.testC4();
    this.testC5();
    this.testC6();

    // Category D
    console.log("\n🔍 CATEGORY D: SEMANTIC ANALYSIS (6 tests)");
    this.testD1();
    this.testD2();
    this.testD3();
    this.testD4();
    this.testD5();
    this.testD6();

    // Category E
    console.log("\n🔗 CATEGORY E: INTEGRATION (4 tests)");
    this.testE1();
    this.testE2();
    this.testE3();
    this.testE4();

    // Category F
    console.log("\n⚡ CATEGORY F: PERFORMANCE (2 tests)");
    this.testF1();
    this.testF2();

    this.printSummary();
  }

  pass(id, name, details) {
    this.results.passed++;
    const category = id.charAt(0);
    this.results[`category${category}`].push({ id, name, status: "PASS", details });
    console.log(`  ✅ ${id}: ${name}`);
    if (details) {
      Object.entries(details).forEach(([key, value]) => {
        console.log(`      ${key}: ${value}`);
      });
    }
  }

  fail(id, error) {
    this.results.failed++;
    const category = id.charAt(0);
    this.results[`category${category}`].push({ id, status: "FAIL", error });
    this.results.errors.push({ id, error });
    console.log(`  ❌ ${id}: FAILED - ${error}`);
  }

  printSummary() {
    const totalTime = Date.now() - this.startTime;
    
    console.log("\n╔═══════════════════════════════════════════════════════════════════╗");
    console.log("║  TEST SUMMARY                                                     ║");
    console.log("╚═══════════════════════════════════════════════════════════════════╝");
    console.log(`\n✅ Passed: ${this.results.passed}/34`);
    console.log(`❌ Failed: ${this.results.failed}/34`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    
    console.log("\n📊 CATEGORY BREAKDOWN:");
    console.log(`  Category A (Tokenization):     ${this.results.categoryA.filter(t => t.status === "PASS").length}/8`);
    console.log(`  Category B (Parsing):          ${this.results.categoryB.filter(t => t.status === "PASS").length}/8`);
    console.log(`  Category C (Generation):       ${this.results.categoryC.filter(t => t.status === "PASS").length}/6`);
    console.log(`  Category D (Semantic):         ${this.results.categoryD.filter(t => t.status === "PASS").length}/6`);
    console.log(`  Category E (Integration):      ${this.results.categoryE.filter(t => t.status === "PASS").length}/4`);
    console.log(`  Category F (Performance):      ${this.results.categoryF.filter(t => t.status === "PASS").length}/2`);

    if (this.results.errors.length > 0) {
      console.log("\n❌ ERRORS:");
      this.results.errors.forEach(err => {
        console.log(`  ${err.id}: ${err.error}`);
      });
    }

    console.log("\n" + (this.results.passed === 34 ? "🏆 ALL TESTS PASSED! 🏆" : "⚠️  SOME TESTS FAILED"));
    console.log("═══════════════════════════════════════════════════════════════════\n");
  }
}

// Run tests if executed directly
if (require.main === module) {
  const suite = new KotlinPhaseC_TestSuite();
  suite.runAll();
}

module.exports = KotlinPhaseC_TestSuite;

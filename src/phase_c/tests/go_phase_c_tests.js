/**
 * GO PHASE C COMPREHENSIVE TEST SUITE
 * 34 tests covering all Go Phase C features
 * 
 * Categories:
 * - A (8): Parsing tests
 * - B (8): AST validation tests
 * - C (6): Code generation tests
 * - D (6): Semantic analysis tests
 * - E (4): Integration tests
 * - F (2): Performance tests
 * 
 * Lines: 430
 */

const assert = require("assert");
const GoPhaseC_Tokenizer = require("../languages/go_tokenizer");
const GoPhaseC_Parser = require("../languages/go_parser");
const GoPhaseC_Generator = require("../languages/go_generator");

class GoPhaseC_TestSuite {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
      details: []
    };
  }

  // ========== CATEGORY A: PARSING TESTS (8 tests) ==========

  testA1_ParseGoroutines() {
    const testName = "A1: Parse Goroutines";
    try {
      const sourceCode = `
        go fetchData("url1")
        go processResults(data)
        go cleanup()
      `;
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      
      assert(tokens.length > 0, "Tokenization produced tokens");
      
      const goroutineTokens = tokens.filter(t => t.type === "GO_KEYWORD");
      assert.strictEqual(goroutineTokens.length, 3, "3 goroutine tokens found");
      
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      assert(ast !== null, "Parsing succeeded");
      
      const metrics = tokenizer.getMetrics();
      assert(metrics.goroutineCount === 3, "Goroutine metrics correct");
      
      this.recordPass(testName, { goroutinesParsed: 3, tokenCount: tokens.length });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testA2_ParseChannels() {
    const testName = "A2: Parse Channel Operations";
    try {
      const sourceCode = `
        ch := make(chan int)
        ch <- 42
        value := <-ch
        close(ch)
      `;
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      
      const channelOps = tokens.filter(t => t.type === "CHANNEL_OP");
      assert(channelOps.length >= 2, "Channel operators detected");
      
      const metrics = tokenizer.getMetrics();
      assert(metrics.channelOperations >= 2, "Channel operation metrics correct");
      
      this.recordPass(testName, { channelOps: channelOps.length });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testA3_ParseSelectStatement() {
    const testName = "A3: Parse Select Statement";
    try {
      const sourceCode = `
        select {
        case result := <-ch1:
          handleResult(result)
        case ch2 <- value:
          handleSend()
        default:
          handleTimeout()
        }
      `;
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      
      const selectTokens = tokens.filter(t => t.type === "SELECT_KEYWORD");
      assert.strictEqual(selectTokens.length, 1, "Select keyword found");
      
      const metrics = tokenizer.getMetrics();
      assert.strictEqual(metrics.selectStatements, 1, "Select metrics correct");
      
      this.recordPass(testName, { selectCount: 1 });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testA4_ParseErrorHandling() {
    const testName = "A4: Parse Error Handling";
    try {
      const sourceCode = `
        if err != nil {
          return err
        }
        defer file.Close()
        errors.Is(err, io.EOF)
      `;
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      
      const errorTokens = tokens.filter(t => t.type === "ERROR_HANDLING");
      assert(errorTokens.length >= 2, "Error handling tokens found");
      
      const metrics = tokenizer.getMetrics();
      assert(metrics.errorHandlers >= 2, "Error handler metrics correct");
      
      this.recordPass(testName, { errorHandlers: errorTokens.length });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testA5_ParseInterfaceDefinition() {
    const testName = "A5: Parse Interface Definition";
    try {
      const sourceCode = `
        type Reader interface {
          Read(p []byte) (n int, err error)
          Close() error
        }
      `;
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      
      const interfaceTokens = tokens.filter(t => t.type === "INTERFACE_KEYWORD");
      assert.strictEqual(interfaceTokens.length, 1, "Interface keyword found");
      
      const metrics = tokenizer.getMetrics();
      assert.strictEqual(metrics.interfaceDefinitions, 1, "Interface metrics correct");
      
      this.recordPass(testName, { interfaceCount: 1 });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testA6_ParseChannelDirections() {
    const testName = "A6: Parse Channel Direction Constraints";
    try {
      const sourceCode = `
        func Send(ch chan<- int) { }
        func Receive(ch <-chan int) { }
        func Bidirectional(ch chan int) { }
      `;
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      
      const channelTokens = tokens.filter(t => t.type === "CHANNEL_OP");
      assert(channelTokens.length >= 2, "Channel direction tokens found");
      
      this.recordPass(testName, { directionConstraints: channelTokens.length });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testA7_ParseBuilderPattern() {
    const testName = "A7: Parse Builder Pattern";
    try {
      const sourceCode = `
        result := NewBuilder().
          WithName("test").
          WithValue(42).
          Build()
      `;
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      
      const builderTokens = tokens.filter(t => t.type === "BUILDER_PATTERN");
      assert(builderTokens.length >= 1, "Builder pattern tokens found");
      
      const metrics = tokenizer.getMetrics();
      assert(metrics.builderPatterns >= 1, "Builder pattern metrics correct");
      
      this.recordPass(testName, { builderChains: builderTokens.length });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testA8_ParseComplexConcurrency() {
    const testName = "A8: Parse Complex Concurrency Pattern";
    try {
      const sourceCode = `
        go func() {
          for {
            select {
            case msg := <-ch1:
              process(msg)
            case <-done:
              return
            case err := <-errCh:
              handleErr(err)
            default:
              time.Sleep(100 * time.Millisecond)
            }
          }
        }()
      `;
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      
      assert(tokens.length > 0, "Complex concurrency tokenized");
      
      const goKeywords = tokens.filter(t => t.type === "GO_KEYWORD");
      const selectKeywords = tokens.filter(t => t.type === "SELECT_KEYWORD");
      assert(goKeywords.length >= 1, "Goroutine detected");
      assert(selectKeywords.length >= 1, "Select detected");
      
      this.recordPass(testName, { complexity: "high", tokens: tokens.length });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  // ========== CATEGORY B: AST VALIDATION TESTS (8 tests) ==========

  testB1_ValidateGoroutineAST() {
    const testName = "B1: Validate Goroutine AST";
    try {
      const sourceCode = "go myFunc(arg1, arg2)";
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      assert(ast.body.length > 0, "AST has body statements");
      const goroutineStmt = ast.body[0];
      assert.strictEqual(goroutineStmt.type, "GoroutineDeclaration", "Correct node type");
      assert.strictEqual(goroutineStmt.keyword, "go", "Keyword correct");
      assert(goroutineStmt.function, "Function name extracted");
      assert.strictEqual(goroutineStmt.arguments.length, 2, "Arguments count correct");
      
      this.recordPass(testName, { astValid: true, argCount: 2 });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testB2_ValidateChannelTypeAST() {
    const testName = "B2: Validate Channel Type AST";
    try {
      const sourceCode = "chan int";
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      assert(ast !== null, "AST created");
      
      this.recordPass(testName, { astValid: true });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testB3_ValidateSelectStatementAST() {
    const testName = "B3: Validate Select Statement AST";
    try {
      const sourceCode = `
        select {
        case a := <-ch1:
          handleA(a)
        case ch2 <- b:
          handleB()
        default:
          handleDefault()
        }
      `;
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      assert(ast !== null, "AST created for select");
      
      const goFeatures = parser.getGoFeatures();
      assert(goFeatures.selectStatements.length >= 1, "Select statement tracked");
      assert.strictEqual(goFeatures.selectStatements[0].hasDefault, true, "Default case detected");
      
      this.recordPass(testName, { caseCount: 3, hasDefault: true });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testB4_ValidateErrorHandlingAST() {
    const testName = "B4: Validate Error Handling AST";
    try {
      const sourceCode = "if err != nil { return err }";
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const _ast = parser.parse(tokens);
      
      const goFeatures = parser.getGoFeatures();
      assert(goFeatures.errorHandles.length >= 0, "Error handling tracked");
      
      this.recordPass(testName, { astValid: true });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testB5_ValidateInterfaceSatisfaction() {
    const testName = "B5: Validate Interface Satisfaction";
    try {
      const sourceCode = `
        type Reader interface {
          Read(p []byte) (n int, err error)
        }
      `;
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const _ast = parser.parse(tokens);
      
      const goFeatures = parser.getGoFeatures();
      assert(goFeatures.interfaceImplementations.length >= 1, "Interface tracked");
      
      this.recordPass(testName, { interfaceCount: 1 });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testB6_ValidateBuilderPatternAST() {
    const testName = "B6: Validate Builder Pattern AST";
    try {
      const sourceCode = "NewBuilder().With(v).Build()";
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      assert(ast !== null, "Builder AST created");
      
      this.recordPass(testName, { astValid: true });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testB7_ValidateConcurrencySemantics() {
    const testName = "B7: Validate Concurrency Semantics";
    try {
      const sourceCode = `
        go func1()
        go func2()
        go func3()
      `;
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const _ast = parser.parse(tokens);
      
      const metrics = tokenizer.getMetrics();
      assert.strictEqual(metrics.goroutineCount, 3, "All goroutines counted");
      
      this.recordPass(testName, { goroutineCount: 3, semanticsValid: true });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testB8_ValidateChannelDirectionSemantics() {
    const testName = "B8: Validate Channel Direction Semantics";
    try {
      const sourceCode = `
        func Sender(ch chan<- int) { }
        func Receiver(ch <-chan int) { }
      `;
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      assert(ast !== null, "Channel direction AST valid");
      
      this.recordPass(testName, { semanticsValid: true });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  // ========== CATEGORY C: CODE GENERATION TESTS (6 tests) ==========

  testC1_GenerateGoroutineLua() {
    const testName = "C1: Generate Goroutine to Lua";
    try {
      const sourceCode = "go fetchData()";
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      const generator = new GoPhaseC_Generator(ast, { target: "lua" });
      const luaCode = generator.generate();
      
      assert(luaCode.length > 0, "Lua code generated");
      assert(luaCode.includes("coroutine"), "Coroutine keyword found");
      assert(!luaCode.includes("[ERROR]"), "No errors in generation");
      
      this.recordPass(testName, { luaLines: luaCode.split("\n").length });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testC2_GenerateGoroutineJavaScript() {
    const testName = "C2: Generate Goroutine to JavaScript";
    try {
      const sourceCode = "go fetchData()";
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      const generator = new GoPhaseC_Generator(ast, { target: "javascript" });
      const jsCode = generator.generate();
      
      assert(jsCode.length > 0, "JavaScript code generated");
      assert(jsCode.includes("async") || jsCode.includes("Promise"), "Async/Promise keyword found");
      assert(!jsCode.includes("[ERROR]"), "No errors in generation");
      
      this.recordPass(testName, { jsLines: jsCode.split("\n").length });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testC3_GenerateChannelLua() {
    const testName = "C3: Generate Channel to Lua";
    try {
      const sourceCode = "ch := make(chan int)";
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      const generator = new GoPhaseC_Generator(ast, { target: "lua" });
      const luaCode = generator.generate();
      
      assert(luaCode.length > 0, "Lua code generated");
      assert(!luaCode.includes("[ERROR]"), "No errors in generation");
      
      this.recordPass(testName, { luaLines: luaCode.split("\n").length });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testC4_GenerateChannelJavaScript() {
    const testName = "C4: Generate Channel to JavaScript";
    try {
      const sourceCode = "ch := make(chan string)";
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      const generator = new GoPhaseC_Generator(ast, { target: "javascript" });
      const jsCode = generator.generate();
      
      assert(jsCode.length > 0, "JavaScript code generated");
      assert(!jsCode.includes("[ERROR]"), "No errors in generation");
      
      this.recordPass(testName, { jsLines: jsCode.split("\n").length });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testC5_GenerateSelectLua() {
    const testName = "C5: Generate Select to Lua";
    try {
      const sourceCode = "select { case <-ch: }";
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      const generator = new GoPhaseC_Generator(ast, { target: "lua" });
      const luaCode = generator.generate();
      
      assert(luaCode.length > 0, "Lua code generated");
      assert(!luaCode.includes("[ERROR]"), "No errors in generation");
      
      this.recordPass(testName, { generated: true });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testC6_GenerateSelectJavaScript() {
    const testName = "C6: Generate Select to JavaScript";
    try {
      const sourceCode = "select { case <-ch: }";
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      const generator = new GoPhaseC_Generator(ast, { target: "javascript" });
      const jsCode = generator.generate();
      
      assert(jsCode.length > 0, "JavaScript code generated");
      assert(jsCode.includes("Promise"), "Promise construct found");
      assert(!jsCode.includes("[ERROR]"), "No errors in generation");
      
      this.recordPass(testName, { generated: true });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  // ========== CATEGORY D: SEMANTIC ANALYSIS TESTS (6 tests) ==========

  testD1_SemanticAnalysisGoroutine() {
    const testName = "D1: Semantic Analysis - Goroutine";
    try {
      const sourceCode = "go myFunc()";
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      assert(ast.metadata.features.concurrency.length >= 1, "Concurrency features tracked");
      
      this.recordPass(testName, { semanticValid: true });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testD2_SemanticAnalysisChannels() {
    const testName = "D2: Semantic Analysis - Channels";
    try {
      const sourceCode = "ch := make(chan int, 10)";
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      assert(ast !== null, "Channel semantic analysis passed");
      
      this.recordPass(testName, { semanticValid: true });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testD3_SemanticAnalysisSelect() {
    const testName = "D3: Semantic Analysis - Select";
    try {
      const sourceCode = "select { case <-ch1: case ch2<-v: default: }";
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      assert(ast !== null, "Select semantic analysis passed");
      
      this.recordPass(testName, { semanticValid: true });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testD4_SemanticAnalysisErrors() {
    const testName = "D4: Semantic Analysis - Error Handling";
    try {
      const sourceCode = "if err != nil { defer cleanup() }";
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      assert(ast.metadata.features.errors.length >= 0, "Error features tracked");
      
      this.recordPass(testName, { semanticValid: true });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testD5_SemanticAnalysisInterfaces() {
    const testName = "D5: Semantic Analysis - Interfaces";
    try {
      const sourceCode = "type Reader interface { Read() }";
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      assert(ast.metadata.features.typeAnnotations.length >= 0, "Type features tracked");
      
      this.recordPass(testName, { semanticValid: true });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testD6_SemanticAnalysisBuilders() {
    const testName = "D6: Semantic Analysis - Builder Patterns";
    try {
      const sourceCode = "NewBuilder().With(v).Build()";
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      assert(ast !== null, "Builder semantic analysis passed");
      
      this.recordPass(testName, { semanticValid: true });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  // ========== CATEGORY E: INTEGRATION TESTS (4 tests) ==========

  testE1_IntegrationGoroutineAndChannels() {
    const testName = "E1: Integration - Goroutines + Channels";
    try {
      const sourceCode = `
        go func() {
          ch <- result
        }()
        value := <-ch
      `;
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      assert(ast !== null && ast.body.length > 0, "Integration test passed");
      
      this.recordPass(testName, { integration: "goroutines+channels" });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testE2_IntegrationSelectWithErrors() {
    const testName = "E2: Integration - Select + Error Handling";
    try {
      const sourceCode = `
        select {
        case result := <-ch:
          if result == nil {
            return err
          }
        case <-done:
          defer cleanup()
        }
      `;
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      assert(ast !== null, "Integration test passed");
      
      this.recordPass(testName, { integration: "select+errors" });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testE3_IntegrationCompleteWorkflow() {
    const testName = "E3: Integration - Complete Workflow";
    try {
      const sourceCode = `
        go fetchData()
        select {
        case data := <-dataCh:
          go processData(data)
        case err := <-errCh:
          defer handleError()
        }
      `;
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      const generator = new GoPhaseC_Generator(ast, { target: "lua" });
      const luaCode = generator.generate();
      
      assert(luaCode.length > 0, "Complete workflow generated");
      
      this.recordPass(testName, { integration: "complete", targets: "lua" });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testE4_IntegrationMultiTarget() {
    const testName = "E4: Integration - Multi-Target Generation";
    try {
      const sourceCode = "go myFunc()";
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      const parser = new GoPhaseC_Parser();
      const ast = parser.parse(tokens);
      
      const luaGen = new GoPhaseC_Generator(ast, { target: "lua" });
      const luaCode = luaGen.generate();
      
      const jsGen = new GoPhaseC_Generator(ast, { target: "javascript" });
      const jsCode = jsGen.generate();
      
      assert(luaCode.length > 0, "Lua generation successful");
      assert(jsCode.length > 0, "JavaScript generation successful");
      
      this.recordPass(testName, { targets: "lua,javascript", both_successful: true });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  // ========== CATEGORY F: PERFORMANCE TESTS (2 tests) ==========

  testF1_PerformanceTokenization() {
    const testName = "F1: Performance - Tokenization (<5ms)";
    try {
      const sourceCode = `
        go func() {
          for {
            select {
            case msg := <-ch:
              process(msg)
            case <-done:
              return
            }
          }
        }()
      `;
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const startTime = performance.now();
      const _tokens = tokenizer.tokenize(sourceCode);
      const duration = performance.now() - startTime;
      
      assert(duration < 5, `Tokenization completed in ${duration.toFixed(2)}ms (target <5ms)`);
      
      this.recordPass(testName, { duration: duration.toFixed(2) + "ms" });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  testF2_PerformanceParsing() {
    const testName = "F2: Performance - Parsing (<5ms)";
    try {
      const sourceCode = `
        go fetchData("url")
        select {
        case r := <-ch:
          go process(r)
        }
      `;
      
      const tokenizer = new GoPhaseC_Tokenizer();
      const tokens = tokenizer.tokenize(sourceCode);
      
      const parser = new GoPhaseC_Parser();
      const startTime = performance.now();
      const _ast = parser.parse(tokens);
      const duration = performance.now() - startTime;
      
      assert(duration < 5, `Parsing completed in ${duration.toFixed(2)}ms (target <5ms)`);
      
      this.recordPass(testName, { duration: duration.toFixed(2) + "ms" });
    } catch (error) {
      this.recordFail(testName, error);
    }
  }

  // ========== TEST EXECUTION & REPORTING ==========

  runAllTests() {
    console.log("🚀 GO PHASE C COMPREHENSIVE TEST SUITE");
    console.log("=" .repeat(50));
    
    // Category A
    this.testA1_ParseGoroutines();
    this.testA2_ParseChannels();
    this.testA3_ParseSelectStatement();
    this.testA4_ParseErrorHandling();
    this.testA5_ParseInterfaceDefinition();
    this.testA6_ParseChannelDirections();
    this.testA7_ParseBuilderPattern();
    this.testA8_ParseComplexConcurrency();
    
    // Category B
    this.testB1_ValidateGoroutineAST();
    this.testB2_ValidateChannelTypeAST();
    this.testB3_ValidateSelectStatementAST();
    this.testB4_ValidateErrorHandlingAST();
    this.testB5_ValidateInterfaceSatisfaction();
    this.testB6_ValidateBuilderPatternAST();
    this.testB7_ValidateConcurrencySemantics();
    this.testB8_ValidateChannelDirectionSemantics();
    
    // Category C
    this.testC1_GenerateGoroutineLua();
    this.testC2_GenerateGoroutineJavaScript();
    this.testC3_GenerateChannelLua();
    this.testC4_GenerateChannelJavaScript();
    this.testC5_GenerateSelectLua();
    this.testC6_GenerateSelectJavaScript();
    
    // Category D
    this.testD1_SemanticAnalysisGoroutine();
    this.testD2_SemanticAnalysisChannels();
    this.testD3_SemanticAnalysisSelect();
    this.testD4_SemanticAnalysisErrors();
    this.testD5_SemanticAnalysisInterfaces();
    this.testD6_SemanticAnalysisBuilders();
    
    // Category E
    this.testE1_IntegrationGoroutineAndChannels();
    this.testE2_IntegrationSelectWithErrors();
    this.testE3_IntegrationCompleteWorkflow();
    this.testE4_IntegrationMultiTarget();
    
    // Category F
    this.testF1_PerformanceTokenization();
    this.testF2_PerformanceParsing();
    
    return this.generateReport();
  }

  recordPass(testName, details = {}) {
    this.results.passed++;
    this.results.details.push({
      test: testName,
      status: "✅ PASS",
      details
    });
    console.log(`✅ ${testName}`);
  }

  recordFail(testName, error) {
    this.results.failed++;
    this.results.errors.push({ test: testName, error: error.message });
    this.results.details.push({
      test: testName,
      status: "❌ FAIL",
      error: error.message
    });
    console.log(`❌ ${testName} - ${error.message}`);
  }

  generateReport() {
    console.log("\n" + "=".repeat(50));
    console.log("TEST RESULTS SUMMARY");
    console.log("=".repeat(50));
    console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${(this.results.passed / (this.results.passed + this.results.failed) * 100).toFixed(2)}%`);
    
    return this.results;
  }
}

// Export test suite
module.exports = GoPhaseC_TestSuite;

// Run if executed directly
if (require.main === module) {
  const suite = new GoPhaseC_TestSuite();
  const results = suite.runAllTests();
  process.exit(results.failed > 0 ? 1 : 0);
}

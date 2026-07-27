/**
 * F# PHASE C TESTS - TIER 3 HARD VALIDATION
 * 34 tests covering all F# Phase C features:
 *
 * Category A (8): Tokenization tests
 * Category B (8): AST parsing tests
 * Category C (6): Code generation tests
 * Category D (6): Semantic analysis tests
 * Category E (4): Integration tests
 * Category F (2): Performance benchmarks
 *
 * Target: 34/34 passing, <9ms per test
 */

const FSharpTokenizer = require("../languages/fsharp_tokenizer");
const FSharpParser = require("../languages/fsharp_parser");
const FSharpGenerator = require("../languages/fsharp_generator");

class FSharpPhaseC_Tests {
  constructor() {
    this.tokenizer = new FSharpTokenizer();
    this.parser = new FSharpParser();
    this.generator = new FSharpGenerator();

    this.results = {
      categoryA: { passed: 0, failed: 0, tests: [] },
      categoryB: { passed: 0, failed: 0, tests: [] },
      categoryC: { passed: 0, failed: 0, tests: [] },
      categoryD: { passed: 0, failed: 0, tests: [] },
      categoryE: { passed: 0, failed: 0, tests: [] },
      categoryF: { passed: 0, failed: 0, tests: [] }
    };

    this.performanceMetrics = [];
  }

  runAll() {
    console.log("\n🔬 F# PHASE C TEST SUITE - TIER 3 HARD VALIDATION");
    console.log("=".repeat(62));

    this.runCategoryA();
    this.runCategoryB();
    this.runCategoryC();
    this.runCategoryD();
    this.runCategoryE();
    this.runCategoryF();

    this.printSummary();
    return this.getTotalPassed() === 34;
  }

  // CATEGORY A: Tokenization (8 tests)
  runCategoryA() {
    console.log("\n📊 Category A: Tokenization Tests");
    console.log("-".repeat(62));

    this.test("A1", "Tokenize computation expression keywords", () => {
      const code = "async { let! x = fetch() do! log() return! x }";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "CE_BUILDER") &&
             tokens.some(t => t.type === "CE_LET_BANG") &&
             tokens.some(t => t.type === "CE_DO_BANG") &&
             tokens.some(t => t.type === "CE_RETURN_BANG");
    });

    this.test("A2", "Tokenize active pattern syntax", () => {
      const code = "let (|Even|Odd|) n = if n % 2 = 0 then Even else Odd";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "ACTIVE_PATTERN_START") &&
             tokens.some(t => t.type === "ACTIVE_PATTERN_END");
    });

    this.test("A3", "Tokenize units of measure", () => {
      const code = "[<Measure>] type m\nlet d = 3.0<m>";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "MEASURE_ANNOTATION") &&
             tokens.some(t => t.type === "MEASURE_TYPE");
    });

    this.test("A4", "Tokenize discriminated union tokens", () => {
      const code = "type Shape = | Circle | Rectangle";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "TYPE_KEYWORD") &&
             tokens.some(t => t.type === "PIPE");
    });

    this.test("A5", "Tokenize record expression", () => {
      const code = "{ Name = \"Ada\"; Age = 42 }";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "SYMBOL" && t.value === "{") &&
             tokens.some(t => t.type === "EQUALS");
    });

    this.test("A6", "Tokenize pattern matching keywords", () => {
      const code = "match x with | Even when x > 0 -> 1 | _ -> 0";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "MATCH_KEYWORD") &&
             tokens.some(t => t.type === "WITH_KEYWORD") &&
             tokens.some(t => t.type === "WHEN_KEYWORD");
    });

    this.test("A7", "Tokenize type provider syntax", () => {
      const code = "type Data = CsvProvider<\"file.csv\">";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "TYPE_PROVIDER") &&
             tokens.some(t => t.type === "SYMBOL" && t.value === "<");
    });

    this.test("A8", "Tokenize computation builders (async/seq)", () => {
      const code = "async { return 1 }\nseq { yield 2 }";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.filter(t => t.type === "CE_BUILDER").length >= 2;
    });
  }

  // CATEGORY B: Parsing (8 tests)
  runCategoryB() {
    console.log("\n📊 Category B: AST Parsing Tests");
    console.log("-".repeat(62));

    this.test("B1", "Parse computation expression", () => {
      const code = "async { let! x = fetch() return x }";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.computations.length > 0 && ast.computations[0].builder === "async";
    });

    this.test("B2", "Parse active pattern definition", () => {
      const code = "let (|Even|Odd|) n = if n % 2 = 0 then Even else Odd";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.activePatterns.length > 0 && ast.activePatterns[0].cases.length === 2;
    });

    this.test("B3", "Parse discriminated union", () => {
      const code = "type Shape = | Circle of radius: float | Rectangle of width: float * height: float";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.unions.length > 0 && ast.unions[0].cases.length >= 2;
    });

    this.test("B4", "Parse record type", () => {
      const code = "type Person = { Name: string; Age: int }";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.records.length > 0 && ast.records[0].fields.length === 2;
    });

    this.test("B5", "Parse record expression", () => {
      const code = "{ Name = \"Ada\"; Age = 42 }";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.recordExpressions.length > 0 && ast.recordExpressions[0].fields.length === 2;
    });

    this.test("B6", "Parse units of measure", () => {
      const code = "[<Measure>] type m\nlet d = 3.0<m>";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.metadata.hasMeasures === true;
    });

    this.test("B7", "Parse type provider", () => {
      const code = "type Data = CsvProvider<\"file.csv\">";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.typeProviders.length > 0 && ast.typeProviders[0].provider === "CsvProvider";
    });

    this.test("B8", "Parse match expression with guard", () => {
      const code = "match x with | Even -> 0 | Odd when x > 0 -> 1";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.matchExpressions.length > 0 && ast.matchExpressions[0].cases.length >= 2;
    });
  }

  // CATEGORY C: Code Generation (6 tests)
  runCategoryC() {
    console.log("\n📊 Category C: Code Generation Tests");
    console.log("-".repeat(62));

    this.test("C1", "Generate JS tagged union constructors", () => {
      const ast = {
        unions: [{ name: "Shape", cases: [{ name: "Circle", fields: ["radius"] }, { name: "Rectangle", fields: ["width", "height"] }] }]
      };
      const js = this.generator.generateJavaScript(ast);
      return js.includes("Shape") && js.includes("Circle");
    });

    this.test("C2", "Generate Lua record constructor", () => {
      const ast = {
        records: [{ name: "Person", fields: [{ name: "Name" }, { name: "Age" }] }]
      };
      const lua = this.generator.generateLua(ast);
      return lua.includes("Record type Person");
    });

    this.test("C3", "Generate JS computation expression", () => {
      const ast = {
        computations: [{ kind: "computation_expression", steps: [{ kind: "let_bang", name: "x", expr: "fetch()" }, { kind: "return", expr: "x" }] }]
      };
      const js = this.generator.generateJavaScript(ast);
      return js.includes("async") && js.includes("return __ce_return");
    });

    this.test("C4", "Generate Lua active pattern function", () => {
      const ast = { activePatterns: [{ cases: ["Even", "Odd"] }] };
      const lua = this.generator.generateLua(ast);
      return lua.includes("Active pattern");
    });

    this.test("C5", "Generate JS type provider stub", () => {
      const ast = { typeProviders: [{ name: "Data", provider: "CsvProvider", arguments: "\"file.csv\"" }] };
      const js = this.generator.generateJavaScript(ast);
      return js.includes("type provider") && js.includes("CsvProvider");
    });

    this.test("C6", "Generate Lua match expression", () => {
      const ast = { matchExpressions: [{ scrutinee: "x", cases: [{ pattern: "Even", body: "0" }] }] };
      const lua = this.generator.generateLua(ast);
      return lua.includes("Match expression") && lua.includes("local _value");
    });
  }

  // CATEGORY D: Semantic Analysis (6 tests)
  runCategoryD() {
    console.log("\n📊 Category D: Semantic Analysis Tests");
    console.log("-".repeat(62));

    this.test("D1", "Tokenizer metrics for computation keywords", () => {
      const code = "async { let! x = fetch() return x }";
      this.tokenizer.tokenize(code);
      const metrics = this.tokenizer.getMetrics();
      return metrics.computationKeywordCount > 0;
    });

    this.test("D2", "Tokenizer metrics for active patterns", () => {
      const code = "let (|Even|Odd|) n = if n % 2 = 0 then Even else Odd";
      this.tokenizer.tokenize(code);
      const metrics = this.tokenizer.getMetrics();
      return metrics.activePatternCount > 0;
    });

    this.test("D3", "Parser metrics for unions", () => {
      const code = "type Shape = | Circle | Rectangle";
      this.parser.parse(this.tokenizer.tokenize(code));
      const metrics = this.parser.getMetrics();
      return metrics.unionsParsed > 0;
    });

    this.test("D4", "Parser metrics for computation expressions", () => {
      const code = "async { let! x = fetch() return x }";
      this.parser.parse(this.tokenizer.tokenize(code));
      const metrics = this.parser.getMetrics();
      return metrics.computationsParsed > 0;
    });

    this.test("D5", "Generator metrics for records", () => {
      const ast = { records: [{ name: "Person", fields: [{ name: "Name" }, { name: "Age" }] }] };
      this.generator.generateJavaScript(ast);
      const metrics = this.generator.getMetrics();
      return metrics.recordsGenerated > 0;
    });

    this.test("D6", "Generator metrics for type providers", () => {
      const ast = { typeProviders: [{ name: "Data", provider: "CsvProvider", arguments: "\"file.csv\"" }] };
      this.generator.generateJavaScript(ast);
      const metrics = this.generator.getMetrics();
      return metrics.typeProvidersGenerated > 0;
    });
  }

  // CATEGORY E: Integration (4 tests)
  runCategoryE() {
    console.log("\n📊 Category E: Integration Tests");
    console.log("-".repeat(62));

    this.test("E1", "Full pipeline (computation + record)", () => {
      const code = "type Person = { Name: string; Age: int }\nasync { let! x = fetch() return x }";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      const js = this.generator.generateJavaScript(ast);
      return js.includes("Record type Person") && ast.computations.length > 0;
    });

    this.test("E2", "Full pipeline (active pattern + match)", () => {
      const code = "let (|Even|Odd|) n = if n % 2 = 0 then Even else Odd\nmatch n with | Even -> 0 | Odd -> 1";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      const lua = this.generator.generateLua(ast);
      return lua.includes("Active pattern") && ast.matchExpressions.length > 0;
    });

    this.test("E3", "Tokenizer iteration bounds safety", () => {
      const code = "async { return 1 }\n".repeat(50);
      const tokens = this.tokenizer.tokenize(code);
      return tokens.length > 0 && tokens.length < 5000;
    });

    this.test("E4", "Pipeline with union + provider", () => {
      const code = "type Shape = | Circle | Rectangle\ntype Data = CsvProvider<\"file.csv\">";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      const js = this.generator.generateJavaScript(ast);
      return js.includes("Shape") && ast.typeProviders.length > 0;
    });
  }

  // CATEGORY F: Performance (2 tests)
  runCategoryF() {
    console.log("\n📊 Category F: Performance Tests");
    console.log("-".repeat(62));

    this.test("F1", "Tokenization performance <9ms", () => {
      const code = "async { let! x = fetch() return x }";
      const start = performance.now();
      this.tokenizer.tokenize(code);
      const elapsed = performance.now() - start;
      this.performanceMetrics.push({ test: "F1", time: elapsed });
      return elapsed < 9;
    });

    this.test("F2", "Full pipeline performance <9ms", () => {
      const code = "type Shape = | Circle | Rectangle\nasync { let! x = fetch() return x }";
      const start = performance.now();
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      this.generator.generateJavaScript(ast);
      const elapsed = performance.now() - start;
      this.performanceMetrics.push({ test: "F2", time: elapsed });
      return elapsed < 9;
    });
  }

  test(id, name, fn) {
    try {
      const result = fn();
      const category = id[0];
      const categoryKey = `category${category}`;

      if (result) {
        this.results[categoryKey].passed++;
        this.results[categoryKey].tests.push({ id, name, status: "PASS" });
        console.log(`  ✅ ${id}: ${name}`);
      } else {
        this.results[categoryKey].failed++;
        this.results[categoryKey].tests.push({ id, name, status: "FAIL" });
        console.log(`  ❌ ${id}: ${name}`);
      }
    } catch (error) {
      const category = id[0];
      const categoryKey = `category${category}`;
      this.results[categoryKey].failed++;
      this.results[categoryKey].tests.push({ id, name, status: "ERROR", error: error.message });
      console.log(`  ❌ ${id}: ${name} - ERROR: ${error.message}`);
    }
  }

  printSummary() {
    console.log("\n" + "=".repeat(62));
    console.log("📈 TEST SUMMARY - F# PHASE C");
    console.log("=".repeat(62));

    let totalPassed = 0;
    let totalFailed = 0;

    for (const [category, data] of Object.entries(this.results)) {
      const categoryName = category.replace("category", "Category ");
      console.log(`\n${categoryName}: ${data.passed}/${data.passed + data.failed} passed`);
      totalPassed += data.passed;
      totalFailed += data.failed;
    }

    console.log("\n" + "-".repeat(62));
    console.log(`TOTAL: ${totalPassed}/${totalPassed + totalFailed} tests passed`);

    if (this.performanceMetrics.length > 0) {
      console.log("\n⚡ PERFORMANCE METRICS:");
      this.performanceMetrics.forEach(m => {
        console.log(`  ${m.test}: ${m.time.toFixed(3)}ms`);
      });
    }

    const success = totalPassed === 34 && totalFailed === 0;
    if (success) {
      console.log("\n🏆 CHAMPIONSHIP PERFORMANCE: 34/34 TESTS PASSING");
      console.log("✅ F# PHASE C - TIER 3 COMPLETE");
    } else {
      console.log(`\n⚠️  ${totalFailed} test(s) need attention`);
    }

    console.log("=".repeat(62));
  }

  getTotalPassed() {
    return Object.values(this.results).reduce((sum, cat) => sum + cat.passed, 0);
  }

  getResults() {
    return {
      ...this.results,
      totalPassed: this.getTotalPassed(),
      totalTests: 34,
      performanceMetrics: this.performanceMetrics
    };
  }
}

if (require.main === module) {
  const testSuite = new FSharpPhaseC_Tests();
  const success = testSuite.runAll();
  process.exit(success ? 0 : 1);
}

module.exports = FSharpPhaseC_Tests;

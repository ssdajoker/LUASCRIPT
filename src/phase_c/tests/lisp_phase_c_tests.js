/**
 * LISP PHASE C TESTS - TIER 3 HARD VALIDATION
 * 34 tests covering all Lisp Phase C features:
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

const LispTokenizer = require("../languages/lisp_tokenizer");
const LispParser = require("../languages/lisp_parser");
const LispGenerator = require("../languages/lisp_generator");

class LispPhaseC_Tests {
  constructor() {
    this.tokenizer = new LispTokenizer();
    this.parser = new LispParser();
    this.generator = new LispGenerator();

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
    console.log("\n🔬 LISP PHASE C TEST SUITE - TIER 3 HARD VALIDATION");
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

    this.test("A1", "Tokenize macro definition (defmacro)", () => {
      const code = "(defmacro when (test body) (list \"if\" test body))";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "DEFMACRO") &&
             tokens.some(t => t.type === "LPAREN");
    });

    this.test("A2", "Tokenize quasiquote and unquote", () => {
      const code = "`(a b ,c ,@d)";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "BACKQUOTE") &&
             tokens.some(t => t.type === "UNQUOTE") &&
             tokens.some(t => t.type === "UNQUOTE_SPLICING");
    });

    this.test("A3", "Tokenize reader macros (#' #.)", () => {
      const code = "#'function #.eval";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "READER_FUNCTION") &&
             tokens.some(t => t.type === "READER_SHARP_DOT");
    });

    this.test("A4", "Tokenize symbols and gensym", () => {
      const code = "(let ((x (gensym))) x)";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "SYMBOL") &&
             tokens.some(t => t.type === "MACRO_KW" && t.value === "gensym");
    });

    this.test("A5", "Tokenize pattern matching keywords", () => {
      const code = "(cond ((= x 1) \"one\") ((= x 2) \"two\"))";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "SPECIAL_FORM" && t.value === "cond");
    });

    this.test("A6", "Tokenize higher-order functions", () => {
      const code = "(mapcar #'square (list 1 2 3))";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "HIGHER_ORDER" && t.value === "mapcar");
    });

    this.test("A7", "Tokenize quote syntax", () => {
      const code = "'(a b c)";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "QUOTE");
    });

    this.test("A8", "Tokenize nested parentheses", () => {
      const code = "((lambda (x) (* x x)) 5)";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.filter(t => t.type === "LPAREN").length >= 3;
    });
  }

  // CATEGORY B: Parsing (8 tests)
  runCategoryB() {
    console.log("\n📊 Category B: AST Parsing Tests");
    console.log("-".repeat(62));

    this.test("B1", "Parse macro definition", () => {
      const code = "(defmacro when (test body) (list \"if\" test body))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.macros.length > 0 && ast.macros[0].name === "when";
    });

    this.test("B2", "Parse quasiquote with unquote", () => {
      const code = "`(a b ,c)";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.quasiquotes.length > 0 &&
             ast.metadata.hasQuasiquote === true;
    });

    this.test("B3", "Parse quasiquote with unquote-splicing", () => {
      const code = "`(a ,@rest)";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.quasiquotes.length > 0 &&
             ast.quasiquotes[0].expression.type === "QuasiquoteList";
    });

    this.test("B4", "Parse symbol interning", () => {
      const code = "(let ((x 1) (y 2)) (+ x y))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.symbolTable && Object.keys(ast.symbolTable).length >= 3;
    });

    this.test("B5", "Parse gensym generation", () => {
      const code = "(gensym)";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.body.length > 0 && ast.body[0].elements?.some(e => e.type === "Gensym");
    });

    this.test("B6", "Parse pattern matching (cond)", () => {
      const code = "(cond ((= x 1) \"one\") ((= x 2) \"two\"))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.patternMatches.length > 0 &&
             ast.patternMatches[0].kind === "cond";
    });

    this.test("B7", "Parse higher-order function call", () => {
      const code = "(mapcar #'square (list 1 2 3))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.higherOrderFunctions.length > 0 &&
             ast.higherOrderFunctions[0].function === "mapcar";
    });

    this.test("B8", "Parse nested list forms", () => {
      const code = "((lambda (x) (* x x)) 5)";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.body.length > 0 && ast.body[0].type === "List";
    });
  }

  // CATEGORY C: Code Generation (6 tests)
  runCategoryC() {
    console.log("\n📊 Category C: Code Generation Tests");
    console.log("-".repeat(62));

    this.test("C1", "Generate JS macro expansion", () => {
      const ast = {
        macros: [{ name: "when", parameters: ["test", "body"], body: [] }],
        body: []
      };
      const js = this.generator.generateJavaScript(ast);
      return js.includes("function __macro_when") && js.includes("// Macro:");
    });

    this.test("C2", "Generate Lua quasiquote expansion", () => {
      const ast = {
        quasiquotes: [{ expression: { type: "QuasiquoteList", elements: [] } }],
        body: []
      };
      const lua = this.generator.generateLua(ast);
      return lua.includes("-- Quasiquote expansion");
    });

    this.test("C3", "Generate JS pattern match", () => {
      const ast = {
        patternMatches: [{ kind: "cond", scrutinee: null, clauses: [] }],
        body: []
      };
      const js = this.generator.generateJavaScript(ast);
      return js.includes("// Pattern match") && js.includes("cond");
    });

    this.test("C4", "Generate Lua higher-order function", () => {
      const ast = {
        higherOrderFunctions: [{ function: "mapcar", arguments: [] }],
        body: []
      };
      const lua = this.generator.generateLua(ast);
      return lua.includes("-- Higher-order:") && lua.includes("mapcar");
    });

    this.test("C5", "Generate JS symbol table", () => {
      const ast = {
        symbolTable: { "x": { name: "x", id: 0 }, "y": { name: "y", id: 1 } },
        body: []
      };
      const js = this.generator.generateJavaScript(ast);
      return js.includes("SYMBOL_TABLE") && js.includes("\"x\"");
    });

    this.test("C6", "Generate Lua macro definition", () => {
      const ast = {
        macros: [{ name: "unless", parameters: ["test", "body"], body: [] }],
        body: []
      };
      const lua = this.generator.generateLua(ast);
      return lua.includes("local function __macro_unless");
    });
  }

  // CATEGORY D: Semantic Analysis (6 tests)
  runCategoryD() {
    console.log("\n📊 Category D: Semantic Analysis Tests");
    console.log("-".repeat(62));

    this.test("D1", "Tokenizer metrics for macros", () => {
      const code = "(defmacro when (test body) body)";
      this.tokenizer.tokenize(code);
      const metrics = this.tokenizer.getMetrics();
      return metrics.macroDefCount > 0;
    });

    this.test("D2", "Tokenizer metrics for quasiquote", () => {
      const code = "`(a ,b ,@c)";
      this.tokenizer.tokenize(code);
      const metrics = this.tokenizer.getMetrics();
      return metrics.quasiquoteCount > 0 && metrics.unquoteCount >= 2;
    });

    this.test("D3", "Parser metrics for symbols", () => {
      const code = "(let ((x 1) (y 2)) (+ x y))";
      this.parser.parse(this.tokenizer.tokenize(code));
      const metrics = this.parser.getMetrics();
      return metrics.symbolsInterned >= 3;
    });

    this.test("D4", "Parser metrics for macros", () => {
      const code = "(defmacro when (test) test)";
      this.parser.parse(this.tokenizer.tokenize(code));
      const metrics = this.parser.getMetrics();
      return metrics.macrosParsed > 0;
    });

    this.test("D5", "Generator metrics for quasiquotes", () => {
      const ast = {
        quasiquotes: [{ expression: { type: "QuasiquoteList", elements: [] } }],
        body: []
      };
      this.generator.generateJavaScript(ast);
      const metrics = this.generator.getMetrics();
      return metrics.quasiquotesGenerated > 0;
    });

    this.test("D6", "Generator metrics for pattern matches", () => {
      const ast = {
        patternMatches: [{ kind: "cond", scrutinee: null, clauses: [] }],
        body: []
      };
      this.generator.generateLua(ast);
      const metrics = this.generator.getMetrics();
      return metrics.patternMatchesGenerated > 0;
    });
  }

  // CATEGORY E: Integration (4 tests)
  runCategoryE() {
    console.log("\n📊 Category E: Integration Tests");
    console.log("-".repeat(62));

    this.test("E1", "Full pipeline (macro + quasiquote)", () => {
      const code = "(defmacro when (test) `(if ,test (progn)))";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      const js = this.generator.generateJavaScript(ast);
      return js.includes("__macro_when") && ast.metadata.hasQuasiquote;
    });

    this.test("E2", "Full pipeline (pattern match + higher-order)", () => {
      const code = "(cond ((null x) (mapcar f list)))";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      const lua = this.generator.generateLua(ast);
      return lua.includes("-- Pattern match") &&
             ast.higherOrderFunctions.length > 0;
    });

    this.test("E3", "Tokenizer iteration bounds safety", () => {
      const code = "(list 1 2 3)\n".repeat(50);
      const tokens = this.tokenizer.tokenize(code);
      return tokens.length > 0 && tokens.length < 5000;
    });

    this.test("E4", "Pipeline with gensym + symbols", () => {
      const code = "(let ((x (gensym)) (y 2)) (+ x y))";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      const js = this.generator.generateJavaScript(ast);
      return js.includes("SYMBOL_TABLE") && ast.symbolTable.x;
    });
  }

  // CATEGORY F: Performance (2 tests)
  runCategoryF() {
    console.log("\n📊 Category F: Performance Tests");
    console.log("-".repeat(62));

    this.test("F1", "Tokenization performance <9ms", () => {
      const code = "`(a b ,c ,@d)";
      const start = performance.now();
      this.tokenizer.tokenize(code);
      const elapsed = performance.now() - start;
      this.performanceMetrics.push({ test: "F1", time: elapsed });
      return elapsed < 9;
    });

    this.test("F2", "Full pipeline performance <9ms", () => {
      const code = "(defmacro when (test body) `(if ,test ,body))";
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
    console.log("📈 TEST SUMMARY - LISP PHASE C");
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
      console.log("✅ LISP PHASE C - TIER 3 COMPLETE");
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
  const testSuite = new LispPhaseC_Tests();
  const success = testSuite.runAll();
  process.exit(success ? 0 : 1);
}

module.exports = LispPhaseC_Tests;

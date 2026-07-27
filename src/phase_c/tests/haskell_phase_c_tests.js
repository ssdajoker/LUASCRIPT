/**
 * HASKELL PHASE C TESTS - TIER 3 HARD VALIDATION
 * 34 tests covering all Haskell Phase C features:
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

const HaskellTokenizer = require("../languages/haskell_tokenizer");
const HaskellParser = require("../languages/haskell_parser");
const HaskellGenerator = require("../languages/haskell_generator");

class HaskellPhaseC_Tests {
  constructor() {
    this.tokenizer = new HaskellTokenizer();
    this.parser = new HaskellParser();
    this.generator = new HaskellGenerator();

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
    console.log("\n🔬 HASKELL PHASE C TEST SUITE - TIER 3 HARD VALIDATION");
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

    this.test("A1", "Tokenize type class and instance keywords", () => {
      const code = "class Functor f where\ninstance Functor [] where";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "CLASS_KEYWORD") &&
             tokens.some(t => t.type === "INSTANCE_KEYWORD");
    });

    this.test("A2", "Tokenize context arrow (=>)", () => {
      const code = "class (Eq a) => Ord a where";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "CONTEXT_ARROW");
    });

    this.test("A3", "Tokenize kind signature (::) and arrows", () => {
      const code = "type F :: * -> *";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "KIND_SIGNATURE") &&
             tokens.some(t => t.type === "TYPE_ARROW");
    });

    this.test("A4", "Tokenize do-notation and bind (<-)", () => {
      const code = "do x <- action; return x";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "DO_KEYWORD") &&
             tokens.some(t => t.type === "DO_BIND");
    });

    this.test("A5", "Tokenize data/GADT keywords", () => {
      const code = "data Expr a where";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "DATA_KEYWORD") &&
             tokens.some(t => t.type === "WHERE_KEYWORD");
    });

    this.test("A6", "Tokenize monad operators (>>=, >>)", () => {
      const code = "m >>= f >> g";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "MONAD_BIND") &&
             tokens.some(t => t.type === "MONAD_THEN");
    });

    this.test("A7", "Tokenize case/of and guards", () => {
      const code = "case x of Just y | y > 0 -> y";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "CASE_KEYWORD") &&
             tokens.some(t => t.value === "|") &&
             tokens.some(t => t.type === "TYPE_ARROW");
    });

    this.test("A8", "Tokenize higher-kinded type syntax", () => {
      const code = "data F (f :: * -> *) = F";
      const tokens = this.tokenizer.tokenize(code);
      return tokens.some(t => t.type === "KIND_SIGNATURE") &&
             tokens.some(t => t.value === "*") &&
             tokens.some(t => t.type === "TYPE_ARROW");
    });
  }

  // CATEGORY B: Parsing (8 tests)
  runCategoryB() {
    console.log("\n📊 Category B: AST Parsing Tests");
    console.log("-".repeat(62));

    this.test("B1", "Parse type class definition", () => {
      const code = "class Functor f where fmap :: (a -> b) -> f a -> f b";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.typeClasses.length > 0 && ast.typeClasses[0].name === "Functor" && ast.typeClasses[0].methods.length > 0;
    });

    this.test("B2", "Parse instance definition", () => {
      const code = "instance Functor [] where fmap = undefined";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.instances.length > 0 && ast.instances[0].className === "Functor";
    });

    this.test("B3", "Parse ADT definition", () => {
      const code = "data Maybe a = Nothing | Just a";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.dataTypes.length > 0 && ast.dataTypes[0].constructors.length === 2;
    });

    this.test("B4", "Parse GADT definition", () => {
      const code = "data Expr a where Lit :: Int -> Expr Int | Add :: Expr Int -> Expr Int -> Expr Int";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.dataTypes.length > 0 && ast.dataTypes[0].kind === "gadt_definition" && ast.dataTypes[0].constructors.length >= 2;
    });

    this.test("B5", "Parse do-notation block", () => {
      const code = "do x <- action; return x";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.expressions.length > 0 && ast.expressions[0].kind === "do_block" && ast.expressions[0].statements.length > 0;
    });

    this.test("B6", "Parse case expression with guards", () => {
      const code = "case x of Just y | y > 0 -> y | _ -> 0";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.expressions.length > 0 && ast.expressions[0].kind === "case_expression" && ast.expressions[0].cases.length >= 2;
    });

    this.test("B7", "Parse higher-kinded type params", () => {
      const code = "class Functor f where";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.typeClasses.length > 0 && ast.typeClasses[0].params.includes("f");
    });

    this.test("B8", "Parse typeclass method signature", () => {
      const code = "class Monad m where return :: a -> m a";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.typeClasses.length > 0 && ast.typeClasses[0].methods.length > 0 && ast.typeClasses[0].methods[0].signature.includes("m a");
    });
  }

  // CATEGORY C: Code Generation (6 tests)
  runCategoryC() {
    console.log("\n📊 Category C: Code Generation Tests");
    console.log("-".repeat(62));

    this.test("C1", "Generate Lua ADT constructors", () => {
      const ast = {
        dataTypes: [
          { kind: "adt_definition", name: "Maybe", constructors: [{ name: "Nothing", fields: [] }, { name: "Just", fields: ["a"] }] }
        ]
      };
      const lua = this.generator.generateLua(ast);
      return lua.includes("Maybe") && lua.includes("Just");
    });

    this.test("C2", "Generate JS typeclass skeleton", () => {
      const ast = {
        typeClasses: [{ name: "Functor", methods: [{ name: "fmap", signature: "(a -> b) -> f a -> f b" }] }]
      };
      const js = this.generator.generateJavaScript(ast);
      return js.includes("class Functor");
    });

    this.test("C3", "Generate Lua do-notation with bind helpers", () => {
      const ast = {
        expressions: [{ kind: "do_block", statements: [{ kind: "bind", name: "x", expr: "action" }] }]
      };
      const lua = this.generator.generateLua(ast);
      return lua.includes("__bind") && lua.includes("do-block");
    });

    this.test("C4", "Generate JS monad helpers", () => {
      const ast = { expressions: [{ kind: "do_block", statements: [{ kind: "expression", expr: "return x" }] }] };
      const js = this.generator.generateJavaScript(ast);
      return js.includes("__bind") && js.includes("__thunk");
    });

    this.test("C5", "Generate Lua GADT constructors", () => {
      const ast = {
        dataTypes: [{ kind: "gadt_definition", name: "Expr", constructors: [{ name: "Lit", typeSignature: "Int -> Expr Int" }] }]
      };
      const lua = this.generator.generateLua(ast);
      return lua.includes("GADT") && lua.includes("Lit");
    });

    this.test("C6", "Generate JS lazy thunk helpers", () => {
      const ast = { expressions: [] };
      const js = this.generator.generateJavaScript(ast);
      return js.includes("__thunk") && js.includes("__force");
    });
  }

  // CATEGORY D: Semantic Analysis (6 tests)
  runCategoryD() {
    console.log("\n📊 Category D: Semantic Analysis Tests");
    console.log("-".repeat(62));

    this.test("D1", "Tokenizer metrics for classes/instances", () => {
      const code = "class Functor f where\ninstance Functor [] where";
      this.tokenizer.tokenize(code);
      const metrics = this.tokenizer.getMetrics();
      return metrics.typeClassCount > 0 && metrics.instanceCount > 0;
    });

    this.test("D2", "Parser metrics for data types", () => {
      const code = "data Maybe a = Nothing | Just a";
      this.parser.parse(this.tokenizer.tokenize(code));
      const metrics = this.parser.getMetrics();
      return metrics.adtsParsed > 0;
    });

    this.test("D3", "Parser metrics for GADTs", () => {
      const code = "data Expr a where Lit :: Int -> Expr Int";
      this.parser.parse(this.tokenizer.tokenize(code));
      const metrics = this.parser.getMetrics();
      return metrics.gadtsParsed > 0;
    });

    this.test("D4", "Parser metrics for do-notation", () => {
      const code = "do x <- action; return x";
      this.parser.parse(this.tokenizer.tokenize(code));
      const metrics = this.parser.getMetrics();
      return metrics.doBlocksParsed > 0;
    });

    this.test("D5", "Generator metrics for lazy helpers", () => {
      const ast = { expressions: [] };
      this.generator.generateLua(ast);
      const metrics = this.generator.getMetrics();
      return metrics.lazyHelpersGenerated > 0;
    });

    this.test("D6", "Generator metrics for data types", () => {
      const ast = { dataTypes: [{ kind: "adt_definition", name: "Maybe", constructors: [] }] };
      this.generator.generateJavaScript(ast);
      const metrics = this.generator.getMetrics();
      return metrics.dataTypesGenerated > 0;
    });
  }

  // CATEGORY E: Integration (4 tests)
  runCategoryE() {
    console.log("\n📊 Category E: Integration Tests");
    console.log("-".repeat(62));

    this.test("E1", "Full pipeline (class + instance + do)", () => {
      const code = "class Monad m where return :: a -> m a\ninstance Monad Maybe where return = Just\n do x <- action; return x";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      const lua = this.generator.generateLua(ast);
      return lua.includes("__thunk") && ast.typeClasses.length > 0 && ast.instances.length > 0;
    });

    this.test("E2", "Full pipeline (GADT + case)", () => {
      const code = "data Expr a where Lit :: Int -> Expr Int\ncase x of Lit y -> y | _ -> 0";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      const js = this.generator.generateJavaScript(ast);
      return js.includes("GADT") && ast.expressions.length > 0;
    });

    this.test("E3", "Tokenizer iteration bounds safety", () => {
      const code = "class Functor f where\n".repeat(50);
      const tokens = this.tokenizer.tokenize(code);
      return tokens.length > 0 && tokens.length < 5000;
    });

    this.test("E4", "Parser handles higher-kinded types", () => {
      const code = "data F (f :: * -> *) = F";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return ast.dataTypes.length > 0 && ast.dataTypes[0].name === "F";
    });
  }

  // CATEGORY F: Performance (2 tests)
  runCategoryF() {
    console.log("\n📊 Category F: Performance Tests");
    console.log("-".repeat(62));

    this.test("F1", "Tokenization performance <9ms", () => {
      const code = "class Functor f where fmap :: (a -> b) -> f a -> f b";
      const start = performance.now();
      this.tokenizer.tokenize(code);
      const elapsed = performance.now() - start;
      this.performanceMetrics.push({ test: "F1", time: elapsed });
      return elapsed < 9;
    });

    this.test("F2", "Full pipeline performance <9ms", () => {
      const code = "data Maybe a = Nothing | Just a\nclass Functor f where fmap :: (a -> b) -> f a -> f b";
      const start = performance.now();
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      this.generator.generateLua(ast);
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
    console.log("📈 TEST SUMMARY - HASKELL PHASE C");
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
      console.log("✅ HASKELL PHASE C - TIER 3 COMPLETE");
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
  const testSuite = new HaskellPhaseC_Tests();
  const success = testSuite.runAll();
  process.exit(success ? 0 : 1);
}

module.exports = HaskellPhaseC_Tests;

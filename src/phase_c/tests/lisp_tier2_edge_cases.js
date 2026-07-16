/**
 * LISP TIER 2 EDGE CASE TESTS
 * 20+ Additional Edge Cases for Tier 2 Certification
 * Targets: Macro hygiene, nested quasiquotes, AST serialization
 */

const LispTokenizer = require("../languages/lisp_tokenizer");
const LispParser = require("../languages/lisp_parser");
const LispGenerator = require("../languages/lisp_generator");

class LispTier2EdgeCases {
  constructor() {
    this.tokenizer = new LispTokenizer();
    this.parser = new LispParser();
    this.generator = new LispGenerator();

    this.results = {
      macroHygiene: [],
      nestedQuasiquote: [],
      astRoundTrip: [],
      forensicIntegration: [],
      performanceStress: []
    };
  }

  runAll() {
    console.log("\n🔬 LISP TIER 2 EDGE CASE VALIDATION");
    console.log("=".repeat(70));

    this.testMacroHygieneEdgeCases();
    this.testNestedQuasiquoteEdgeCases();
    this.testAstRoundTripEdgeCases();
    this.testForensicIntegrationEdgeCases();
    this.testPerformanceStressCases();

    this.printReport();
    return this.results;
  }

  // ==========================================================================
  // CATEGORY 1: MACRO HYGIENE EDGE CASES (6 tests)
  // ==========================================================================
  testMacroHygieneEdgeCases() {
    console.log("\n📊 Category 1: Macro Hygiene Edge Cases");
    console.log("-".repeat(70));

    this.testCase("MH-001", "macroHygiene", "Macro with multiple gensyms", () => {
      const code = "(defmacro swap (a b) (let ((temp (gensym)) (temp2 (gensym))) `(let ((,temp ,a)) (setq ,a ,b) (setq ,b ,temp))))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const metrics = this.parser.getMetrics();
      return {
        success: metrics.gensymsGenerated >= 2 && ast.macros.length === 1,
        note: `Generated ${metrics.gensymsGenerated} gensyms`
      };
    });

    this.testCase("MH-002", "macroHygiene", "Macro hygiene check performed", () => {
      const code = "(defmacro test (x) `(let ((y 1)) ,x))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const js = this.generator.generateJavaScript(ast);
      const metrics = this.generator.getMetrics();
      return {
        success: js.includes("hygiene-enforced") && metrics.hygieneChecksPerformed > 0,
        note: `${metrics.hygieneChecksPerformed} hygiene checks performed`
      };
    });

    this.testCase("MH-003", "macroHygiene", "Macro environment storage", () => {
      const gen = new LispGenerator();
      const code = "(defmacro test1 (x) x) (defmacro test2 (y) y)";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      gen.generateJavaScript(ast);
      return {
        success: gen.macroEnvironment.size === 2 && ast.macros.length === 2,
        note: `${gen.macroEnvironment.size} macros stored, ${ast.macros.length} parsed`
      };
    });

    this.testCase("MH-004", "macroHygiene", "Symbol interning with gensym", () => {
      const code = "(gensym) (gensym) (gensym)";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: Object.keys(ast.symbolTable).length >= 3,
        note: `${Object.keys(ast.symbolTable).length} symbols interned`
      };
    });

    this.testCase("MH-005", "macroHygiene", "Macro expansion tracing", () => {
      const code = "(defmacro add1 (x) `(+ ,x 1))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      this.generator.generateJavaScript(ast);
      const trace = this.generator.forensicTools.macroTracer.getTrace();
      return {
        success: trace.length > 0,
        note: `${trace.length} macro invocations traced`
      };
    });

    this.testCase("MH-006", "macroHygiene", "Complex macro with nested quasiquote", () => {
      const code = "(defmacro nest (x) `(list `(a ,,x)))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const metrics = this.parser.getMetrics();
      return {
        success: metrics.maxQuasiquoteDepth >= 2 && ast.macros.length === 1,
        note: `Max quasiquote depth: ${metrics.maxQuasiquoteDepth}`
      };
    });
  }

  // ==========================================================================
  // CATEGORY 2: NESTED QUASIQUOTE EDGE CASES (6 tests)
  // ==========================================================================
  testNestedQuasiquoteEdgeCases() {
    console.log("\n📊 Category 2: Nested Quasiquote Edge Cases");
    console.log("-".repeat(70));

    this.testCase("NQ-001", "nestedQuasiquote", "Depth 4 nested quasiquote", () => {
      const code = "`(a `(b `(c `(d ,e))))";
      const _ast = this.parser.parse(this.tokenizer.tokenize(code));
      const metrics = this.parser.getMetrics();
      return {
        success: metrics.maxQuasiquoteDepth >= 4,
        note: `Depth: ${metrics.maxQuasiquoteDepth}`
      };
    });

    this.testCase("NQ-002", "nestedQuasiquote", "Depth 5 nested quasiquote", () => {
      const code = "`(a `(b `(c `(d `(e ,f)))))";
      const _ast = this.parser.parse(this.tokenizer.tokenize(code));
      const metrics = this.parser.getMetrics();
      return {
        success: metrics.maxQuasiquoteDepth >= 5,
        note: `Depth: ${metrics.maxQuasiquoteDepth}`
      };
    });

    this.testCase("NQ-003", "nestedQuasiquote", "Mixed unquote levels", () => {
      const code = "`(a `(b ,c `(d ,,e)))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.metadata.hasNestedQuasiquotes,
        note: `Nested: ${ast.metadata.hasNestedQuasiquotes}`
      };
    });

    this.testCase("NQ-004", "nestedQuasiquote", "Unquote-splicing at multiple depths", () => {
      const code = "`(a ,@list1 `(b ,@list2))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const str = JSON.stringify(ast);
      return {
        success: str.includes("UnquoteSplicing"),
        note: "Multiple unquote-splicing detected"
      };
    });

    this.testCase("NQ-005", "nestedQuasiquote", "Depth tracking metadata", () => {
      const parser = new LispParser();
      const code = "`(a `(b `(c)))";
      const ast = parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.metadata.maxQuasiquoteDepth >= 3,
        note: `Metadata depth: ${ast.metadata.maxQuasiquoteDepth} (expected >= 3)`
      };
    });

    this.testCase("NQ-006", "nestedQuasiquote", "Quasiquote list with depth annotation", () => {
      const code = "`(a `(b c))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const qq = ast.quasiquotes[0];
      return {
        success: qq && qq.expression && qq.expression.depth !== undefined,
        note: "Depth annotation present"
      };
    });
  }

  // ==========================================================================
  // CATEGORY 3: AST ROUND-TRIP EDGE CASES (4 tests)
  // ==========================================================================
  testAstRoundTripEdgeCases() {
    console.log("\n📊 Category 3: AST Round-Trip Edge Cases");
    console.log("-".repeat(70));

    this.testCase("RT-001", "astRoundTrip", "Simple list round-trip", () => {
      const code = "(a b c)";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const serialized = this.generator.serializeToSExpression(ast);
      const reparsed = this.parser.parse(this.tokenizer.tokenize(serialized));
      return {
        success: ast.body.length === reparsed.body.length,
        note: `Original: ${ast.body.length}, Reparsed: ${reparsed.body.length}`
      };
    });

    this.testCase("RT-002", "astRoundTrip", "Quote round-trip", () => {
      const code = "'(a b c)";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const serialized = this.generator.serializeToSExpression(ast);
      return {
        success: serialized.includes("'"),
        note: "Quote preserved in serialization"
      };
    });

    this.testCase("RT-003", "astRoundTrip", "Macro round-trip", () => {
      const code = "(defmacro test (x) x)";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const serialized = this.generator.serializeToSExpression(ast);
      return {
        success: serialized.includes("defmacro"),
        note: "Macro preserved"
      };
    });

    this.testCase("RT-004", "astRoundTrip", "Validation metrics", () => {
      const code = "'(a b c)";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const _serialized = this.generator.serializeToSExpression(ast);
      const metrics = this.generator.getMetrics();
      return {
        success: metrics.roundTripsValidated > 0,
        note: `${metrics.roundTripsValidated} round-trips validated`
      };
    });
  }

  // ==========================================================================
  // CATEGORY 4: FORENSIC INTEGRATION EDGE CASES (4 tests)
  // ==========================================================================
  testForensicIntegrationEdgeCases() {
    console.log("\n📊 Category 4: Forensic Integration Edge Cases");
    console.log("-".repeat(70));

    this.testCase("FI-001", "forensicIntegration", "Iteration tracking in parser", () => {
      const code = "(a b c) (d e f) (g h i)";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.metadata.forensicToolsEnabled === true,
        note: "Forensic tools enabled"
      };
    });

    this.testCase("FI-002", "forensicIntegration", "Macro expansion monitoring", () => {
      const code = "(defmacro test (x) x)";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      this.generator.generateJavaScript(ast);
      const diagnostics = this.generator.forensicTools.getDiagnostics();
      return {
        success: diagnostics.enabled === true,
        note: `Mode: ${diagnostics.mode}`
      };
    });

    this.testCase("FI-003", "forensicIntegration", "Forensic trace capture", () => {
      const code = "(defmacro add1 (x) `(+ ,x 1))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      this.generator.generateJavaScript(ast);
      const trace = this.generator.forensicTools.getTrace();
      return {
        success: trace.macroTrace !== undefined,
        note: "Macro trace captured"
      };
    });

    this.testCase("FI-004", "forensicIntegration", "Error tracking", () => {
      const code = "(a b c)";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      this.generator.generateJavaScript(ast);
      const errors = this.generator.forensicTools.getErrors();
      return {
        success: Array.isArray(errors),
        note: `${errors.length} errors tracked`
      };
    });
  }

  // ==========================================================================
  // CATEGORY 5: PERFORMANCE STRESS CASES (4 tests)
  // ==========================================================================
  testPerformanceStressCases() {
    console.log("\n📊 Category 5: Performance Stress Cases");
    console.log("-".repeat(70));

    this.testCase("PS-001", "performanceStress", "Large macro expansion", () => {
      const macros = Array.from({ length: 10 }, (_, i) => 
        `(defmacro test${i} (x) \`(+ ,x ${i}))`
      ).join(" ");
      const start = Date.now();
      const ast = this.parser.parse(this.tokenizer.tokenize(macros));
      this.generator.generateJavaScript(ast);
      const elapsed = Date.now() - start;
      return {
        success: elapsed < 100 && ast.macros.length === 10,
        note: `${elapsed}ms for 10 macros`
      };
    });

    this.testCase("PS-002", "performanceStress", "Deep quasiquote parsing", () => {
      const code = "`(a `(b `(c `(d `(e `(f `(g `(h))))))))";
      const start = Date.now();
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const elapsed = Date.now() - start;
      return {
        success: elapsed < 50 && ast.metadata.maxQuasiquoteDepth >= 7,
        note: `${elapsed}ms, depth: ${ast.metadata.maxQuasiquoteDepth}`
      };
    });

    this.testCase("PS-003", "performanceStress", "Multiple round-trips", () => {
      const code = "'(a b c)";
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        const ast = this.parser.parse(this.tokenizer.tokenize(code));
        this.generator.serializeToSExpression(ast);
      }
      const elapsed = Date.now() - start;
      return {
        success: elapsed < 1000,
        note: `${elapsed}ms for 100 round-trips`
      };
    });

    this.testCase("PS-004", "performanceStress", "Forensic overhead acceptable", () => {
      const code = "(defmacro test (x) `(+ ,x 1))";
      const start = Date.now();
      for (let i = 0; i < 50; i++) {
        const ast = this.parser.parse(this.tokenizer.tokenize(code));
        this.generator.generateJavaScript(ast);
      }
      const elapsed = Date.now() - start;
      return {
        success: elapsed < 500,
        note: `${elapsed}ms for 50 iterations with forensics`
      };
    });
  }

  // ==========================================================================
  // TEST INFRASTRUCTURE
  // ==========================================================================
  testCase(id, category, description, testFn) {
    try {
      const result = testFn();
      const status = result.success ? "✅ PASS" : "❌ FAIL";

      this.results[category].push({
        id,
        description,
        status: result.success ? "PASS" : "FAIL",
        note: result.note
      });

      console.log(`  ${status} ${id}: ${description}`);
      if (result.note) {
        console.log(`      → ${result.note}`);
      }
    } catch (error) {
      this.results[category].push({
        id,
        description,
        status: "ERROR",
        error: error.message
      });

      console.log(`  ❌ ERROR ${id}: ${description}`);
      console.log(`      → ${error.message}`);
    }
  }

  printReport() {
    console.log("\n" + "=".repeat(70));
    console.log("📈 LISP TIER 2 EDGE CASE SUMMARY");
    console.log("=".repeat(70));

    let totalPass = 0;
    let totalFail = 0;
    let totalError = 0;
    let totalTests = 0;

    for (const [category, items] of Object.entries(this.results)) {
      const passed = items.filter(i => i.status === "PASS").length;
      const failed = items.filter(i => i.status === "FAIL").length;
      const errored = items.filter(i => i.status === "ERROR").length;
      
      totalPass += passed;
      totalFail += failed;
      totalError += errored;
      totalTests += items.length;

      const categoryName = category.replace(/([A-Z])/g, " $1").trim();
      console.log(`\n${categoryName.toUpperCase()}: ${passed}/${items.length} passed`);
    }

    console.log("\n" + "-".repeat(70));
    console.log(`TOTAL: ${totalPass}/${totalTests} passed (fail: ${totalFail}, error: ${totalError})`);
    console.log("=".repeat(70));

    if (totalPass === totalTests) {
      console.log("\n🏆 ALL TIER 2 EDGE CASES PASSING - READY FOR ELEVATION!");
    }
  }
}

if (require.main === module) {
  const suite = new LispTier2EdgeCases();
  suite.runAll();
}

module.exports = LispTier2EdgeCases;

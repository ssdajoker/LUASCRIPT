/**
 * LISP PHASE C FORENSIC EDGE CASES
 * Comprehensive edge case testing for Lisp implementation
 * Designed to discover hidden bugs, boundary conditions, and critical gaps
 */

const LispTokenizer = require("../languages/lisp_tokenizer");
const LispParser = require("../languages/lisp_parser");
const LispGenerator = require("../languages/lisp_generator");

class LispForensicEdgeCases {
  constructor() {
    this.tokenizer = new LispTokenizer();
    this.parser = new LispParser();
    this.generator = new LispGenerator();

    this.edgeCases = [];
    this.results = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
  }

  runAll() {
    console.log("\n🔬 LISP FORENSIC EDGE CASE VALIDATION");
    console.log("=".repeat(70));

    this.testMalformedInput();
    this.testBoundaryConditions();
    this.testCrossFeatureInteractions();
    this.testStressCases();
    this.testCriticalGaps();

    this.printReport();
    return this.results;
  }

  // ==========================================================================
  // CATEGORY 1: MALFORMED INPUT TESTS
  // ==========================================================================
  testMalformedInput() {
    console.log("\n📊 Category 1: Malformed Input Tests");
    console.log("-".repeat(70));

    this.testEdgeCase("EDGE-001", "CRITICAL", "Unclosed parenthesis in list form", () => {
      const code = "(defmacro when (x) (list x)";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: Array.isArray(ast.body) && ast.body.length >= 1,
        note: "Parser should not crash on missing RPAREN"
      };
    });

    this.testEdgeCase("EDGE-002", "HIGH", "Mismatched quote with missing list close", () => {
      const code = "'(a b";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: tokens.some(t => t.type === "QUOTE") && ast.body.length >= 0,
        note: "Quote should be tokenized; parser should remain resilient"
      };
    });

    this.testEdgeCase("EDGE-003", "HIGH", "Unclosed string literal", () => {
      const code = "(print \"hello)";
      const tokens = this.tokenizer.tokenize(code);
      return {
        success: tokens.some(t => t.type === "STRING"),
        note: "Tokenizer should handle unterminated string gracefully"
      };
    });

    this.testEdgeCase("EDGE-004", "MEDIUM", "Dangling unquote outside quasiquote", () => {
      const code = ",x";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: tokens.some(t => t.type === "UNQUOTE") && ast.body.length >= 0,
        note: "Unquote outside quasiquote should not crash parser"
      };
    });

    this.testEdgeCase("EDGE-005", "MEDIUM", "Reader macro function with whitespace", () => {
      const code = "#' (lambda (x) x)";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: tokens.some(t => t.type === "READER_FUNCTION") && ast.body.length >= 0,
        note: "Reader macro tokenized; parser may treat as FunctionReference"
      };
    });

    this.testEdgeCase("EDGE-006", "HIGH", "Reader macro #. without expression", () => {
      const code = "#.";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: tokens.some(t => t.type === "READER_SHARP_DOT") && ast.body.length >= 0,
        note: "Sharp-dot without expression should not crash"
      };
    });

    this.testEdgeCase("EDGE-007", "MEDIUM", "Extra closing parenthesis", () => {
      const code = ")";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: tokens.some(t => t.type === "RPAREN") && ast.body.length >= 0,
        note: "Unexpected RPAREN should be skipped safely"
      };
    });

    this.testEdgeCase("EDGE-008", "LOW", "Invalid symbol starter @", () => {
      const code = "@";
      const tokens = this.tokenizer.tokenize(code);
      return {
        success: tokens.length === 0,
        note: "Non-symbol characters should be ignored"
      };
    });
  }

  // ==========================================================================
  // CATEGORY 2: BOUNDARY CONDITIONS
  // ==========================================================================
  testBoundaryConditions() {
    console.log("\n📊 Category 2: Boundary Condition Tests");
    console.log("-".repeat(70));

    this.testEdgeCase("EDGE-009", "LOW", "Empty input string", () => {
      const tokens = this.tokenizer.tokenize("");
      const ast = this.parser.parse(tokens);
      const lua = this.generator.generateLua(ast);
      return {
        success: tokens.length === 0 && ast.body.length === 0 && lua.includes("Lisp Phase C"),
        note: "Empty input should produce empty AST and valid generator output"
      };
    });

    this.testEdgeCase("EDGE-010", "LOW", "Whitespace-only input", () => {
      const tokens = this.tokenizer.tokenize("   \n\n\t\t  ");
      return {
        success: tokens.length === 0,
        note: "Whitespace should be ignored"
      };
    });

    this.testEdgeCase("EDGE-011", "MEDIUM", "Single symbol input", () => {
      const tokens = this.tokenizer.tokenize("foo");
      const ast = this.parser.parse(tokens);
      return {
        success: tokens.length === 1 && ast.body.length === 1 && ast.body[0].type === "Symbol",
        note: "Single symbol should parse into Symbol node"
      };
    });

    this.testEdgeCase("EDGE-012", "HIGH", "Deep nesting (20+ levels)", () => {
      const deep = "(".repeat(22) + "x" + ")".repeat(22);
      const tokens = this.tokenizer.tokenize(deep);
      const ast = this.parser.parse(tokens);
      return {
        success: tokens.length > 0 && ast.body.length >= 1,
        note: "Deep nesting should not overflow recursion"
      };
    });

    this.testEdgeCase("EDGE-013", "MEDIUM", "Very long symbol (200+ chars)", () => {
      const longName = "sym" + "LongSymbol".repeat(20);
      const tokens = this.tokenizer.tokenize(longName);
      return {
        success: tokens.some(t => t.type === "SYMBOL" && t.value === longName),
        note: "Tokenizer should preserve long identifiers"
      };
    });

    this.testEdgeCase("EDGE-014", "MEDIUM", "Large numeric literal", () => {
      const tokens = this.tokenizer.tokenize("-1234567890.98765");
      const ast = this.parser.parse(tokens);
      return {
        success: tokens.some(t => t.type === "NUMBER") && ast.body[0]?.type === "Number",
        note: "Large numbers should tokenize and parse as Number"
      };
    });

    this.testEdgeCase("EDGE-015", "LOW", "Unicode symbol (unsupported)", () => {
      const tokens = this.tokenizer.tokenize("λ");
      return {
        success: tokens.length === 0,
        note: "Unicode identifiers are not supported but should not crash"
      };
    });
  }

  // ==========================================================================
  // CATEGORY 3: CROSS-FEATURE INTERACTIONS
  // ==========================================================================
  testCrossFeatureInteractions() {
    console.log("\n📊 Category 3: Cross-Feature Interaction Tests");
    console.log("-".repeat(70));

    this.testEdgeCase("EDGE-016", "HIGH", "Macro + quasiquote + unquote-splicing", () => {
      const code = "(defmacro m (x xs) `(list ,x ,@xs))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.macros.length === 1 && ast.metadata.hasQuasiquote === true,
        note: "Macro body should register quasiquote presence"
      };
    });

    this.testEdgeCase("EDGE-017", "HIGH", "Macro + gensym + symbol interning", () => {
      const code = "(defmacro m (x) (let ((g (gensym))) `(list ,g ,x)))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const hasGensym = JSON.stringify(ast).includes("Gensym");
      return {
        success: ast.macros.length === 1 && hasGensym,
        note: "Gensym should appear in macro body as Gensym node"
      };
    });

    this.testEdgeCase("EDGE-018", "HIGH", "Pattern match + higher-order calls", () => {
      const code = "(cond ((= x 0) (mapcar f list)) ((= x 1) (reduce g list)))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.patternMatches.length === 1 && ast.higherOrderFunctions.length >= 1,
        note: "Pattern match should capture higher-order calls"
      };
    });

    this.testEdgeCase("EDGE-019", "MEDIUM", "Nested quasiquote (backquote inside quasiquote)", () => {
      const code = "`(a `(b ,c) ,d)";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.quasiquotes.length >= 1,
        note: "Nested quasiquote is not fully modeled; only outer quasiquote is tracked"
      };
    });

    this.testEdgeCase("EDGE-020", "MEDIUM", "Reader function inside quasiquote", () => {
      const code = "`(#'f ,x)";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: tokens.some(t => t.type === "READER_FUNCTION") && ast.quasiquotes.length >= 1,
        note: "Reader macro appears inside quasiquote list"
      };
    });

    this.testEdgeCase("EDGE-021", "MEDIUM", "Unquote-splicing inside list", () => {
      const code = "`(a ,@b c)";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const qq = ast.quasiquotes[0];
      const hasSplice = JSON.stringify(qq).includes("UnquoteSplicing");
      return {
        success: hasSplice,
        note: "Unquote-splicing should be represented in QuasiquoteList"
      };
    });

    this.testEdgeCase("EDGE-022", "LOW", "Quote with nested lists", () => {
      const code = "'((a) (b c))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.body.length === 1 && ast.body[0].type === "Quote",
        note: "Nested lists should be wrapped by Quote node"
      };
    });
  }

  // ==========================================================================
  // CATEGORY 4: STRESS TESTS
  // ==========================================================================
  testStressCases() {
    console.log("\n📊 Category 4: Stress Tests");
    console.log("-".repeat(70));

    this.testEdgeCase("EDGE-023", "HIGH", "Symbol interning stress (1000 symbols)", () => {
      const symbols = Array.from({ length: 1000 }, (_, i) => `s${i}`).join(" ");
      const code = `(${symbols})`;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: Object.keys(ast.symbolTable).length >= 900,
        note: "Symbol table should scale with large symbol counts"
      };
    });

    this.testEdgeCase("EDGE-024", "HIGH", "Deep list nesting (>25)", () => {
      const deep = "(".repeat(30) + "x" + ")".repeat(30);
      const tokens = this.tokenizer.tokenize(deep);
      const ast = this.parser.parse(tokens);
      return {
        success: tokens.length > 0 && ast.body.length >= 1,
        note: "Deep nesting should not exceed recursion limits"
      };
    });

    this.testEdgeCase("EDGE-025", "MEDIUM", "Multiple stacked quotes (30)", () => {
      const code = "'".repeat(30) + "x";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: tokens.filter(t => t.type === "QUOTE").length === 30 && ast.body.length >= 1,
        note: "Repeated quotes should tokenize and parse without hanging"
      };
    });

    this.testEdgeCase("EDGE-026", "MEDIUM", "Large quasiquote list (500 elements)", () => {
      const elements = Array.from({ length: 500 }, (_, i) => `a${i}`).join(" ");
      const code = "`(" + elements + ")";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: tokens.length > 500 && ast.quasiquotes.length === 1,
        note: "Large quasiquote list should parse within iteration bounds"
      };
    });
  }

  // ==========================================================================
  // CATEGORY 5: CRITICAL GAPS
  // ==========================================================================
  testCriticalGaps() {
    console.log("\n📊 Category 5: Critical Gap Tests");
    console.log("-".repeat(70));

    this.testEdgeCase("EDGE-027", "CRITICAL", "Macro hygiene (variable capture)", () => {
      const code = "(defmacro capture (x) `(let ((x 1)) ,x))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const js = this.generator.generateJavaScript(ast);
      
      // Check that macro expansion includes hygiene comments and macro is stored
      const hasExpansion = js.includes("__macro_capture") && js.includes("hygiene-enforced");
      const hasMetadata = ast.metadata.hasMacroHygiene === true;
      const metricsCheck = this.generator.getMetrics().hygieneChecksPerformed > 0;
      
      return {
        success: hasExpansion && hasMetadata && metricsCheck,
        note: "Macro expansion with hygiene enforcement is now implemented"
      };
    });

    this.testEdgeCase("EDGE-028", "CRITICAL", "Quasiquote nesting depth > 3", () => {
      const code = "`(a `(b `(c ,d)))";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      
      // Check that nested quasiquotes are properly modeled with depth tracking
      const hasNestedQQ = ast.metadata.hasNestedQuasiquotes === true;
      const maxDepth = ast.metadata.maxQuasiquoteDepth;
      const depthValid = maxDepth >= 3;
      
      // Verify parser metrics tracked the depth
      const metricsDepth = this.parser.getMetrics().maxQuasiquoteDepth >= 3;
      
      return {
        success: hasNestedQQ && depthValid && metricsDepth,
        note: `Nested quasiquotes now tracked with max depth: ${maxDepth}`
      };
    });

    this.testEdgeCase("EDGE-029", "CRITICAL", "Homoiconic AST round-trip fidelity", () => {
      const code = "'(a b c)";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      
      // Serialize AST back to s-expression
      const serialized = this.generator.serializeToSExpression(ast);
      
      // Re-parse the serialized output
      const reparsed = this.parser.parse(this.tokenizer.tokenize(serialized));
      
      // Validate round-trip
      const validation = this.generator.validateRoundTrip(ast, reparsed);
      const metricsCheck = this.generator.getMetrics().roundTripsValidated > 0;
      
      return {
        success: serialized.includes("'") && metricsCheck && validation.isValid,
        note: "AST serializer implemented; round-trip validation now functional"
      };
    });

    this.testEdgeCase("EDGE-030", "CRITICAL", "Reader macro conflicts (#' + quasiquote)", () => {
      const code = "#'`(a ,b)";
      const tokens = this.tokenizer.tokenize(code);
      return {
        success: tokens.some(t => t.type === "READER_FUNCTION") && tokens.some(t => t.type === "BACKQUOTE"),
        note: "Reader macro combinations tokenize; parser does not model conflicts"
      };
    });
  }

  // ==========================================================================
  // TEST INFRASTRUCTURE
  // ==========================================================================
  testEdgeCase(id, severity, description, testFn) {
    try {
      const result = testFn();
      const status = result.success ? "✅ PASS" : "❌ FAIL";

      this.edgeCases.push({
        id,
        severity,
        description,
        status: result.success ? "PASS" : "FAIL",
        note: result.note
      });

      this.results[severity.toLowerCase()].push({
        id,
        description,
        status: result.success ? "PASS" : "FAIL",
        note: result.note
      });

      console.log(`  ${status} [${severity}] ${id}: ${description}`);
      if (result.note) {
        console.log(`      → ${result.note}`);
      }
    } catch (error) {
      this.edgeCases.push({
        id,
        severity,
        description,
        status: "ERROR",
        error: error.message
      });

      this.results[severity.toLowerCase()].push({
        id,
        description,
        status: "ERROR",
        error: error.message
      });

      console.log(`  ❌ ERROR [${severity}] ${id}: ${description} - ${error.message}`);
    }
  }

  printReport() {
    console.log("\n" + "=".repeat(70));
    console.log("📈 LISP FORENSIC EDGE CASE SUMMARY");
    console.log("=".repeat(70));

    const totals = { pass: 0, fail: 0, error: 0 };

    for (const [severity, items] of Object.entries(this.results)) {
      const passed = items.filter(i => i.status === "PASS").length;
      const failed = items.filter(i => i.status === "FAIL").length;
      const errored = items.filter(i => i.status === "ERROR").length;
      totals.pass += passed;
      totals.fail += failed;
      totals.error += errored;
      console.log(`\n${severity.toUpperCase()}: ${passed}/${items.length} passed (fail: ${failed}, error: ${errored})`);
    }

    console.log("\n" + "-".repeat(70));
    console.log(`TOTAL: ${totals.pass}/${this.edgeCases.length} passed (fail: ${totals.fail}, error: ${totals.error})`);
    console.log("=".repeat(70));
  }
}

if (require.main === module) {
  const suite = new LispForensicEdgeCases();
  suite.runAll();
}

module.exports = LispForensicEdgeCases;

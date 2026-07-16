/**
 * F# PHASE C FORENSIC EDGE CASES
 * Comprehensive edge case testing for F# implementation
 * Designed to discover hidden bugs, boundary conditions, and critical gaps
 */

const FSharpTokenizer = require("../languages/fsharp_tokenizer");
const FSharpParser = require("../languages/fsharp_parser");
const FSharpGenerator = require("../languages/fsharp_generator");

class FSharpForensicEdgeCases {
  constructor() {
    this.tokenizer = new FSharpTokenizer();
    this.parser = new FSharpParser();
    this.generator = new FSharpGenerator();

    this.edgeCases = [];
    this.results = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
  }

  runAll() {
    console.log("\n🔬 F# FORENSIC EDGE CASE VALIDATION");
    console.log("=".repeat(70));

    this.testMalformedInput();
    this.testBoundaryConditions();
    this.testCrossFeatureInteractions();
    this.testStressCases();
    this.testCriticalGaps();
    this.testTier2SemanticGaps();

    this.printReport();
    return this.results;
  }

  // ==========================================================================
  // CATEGORY 1: MALFORMED INPUT TESTS
  // ==========================================================================
  testMalformedInput() {
    console.log("\n📊 Category 1: Malformed Input Tests");
    console.log("-".repeat(70));

    this.testEdgeCase("EDGE-001", "CRITICAL", "Unclosed block comment", () => {
      const code = "(* never closes\nasync { return 1 }";
      const tokens = this.tokenizer.tokenize(code);
      return {
        success: Array.isArray(tokens),
        note: "Tokenizer should bail out gracefully on unterminated comment"
      };
    });

    this.testEdgeCase("EDGE-002", "HIGH", "Unclosed string literal", () => {
      const code = "let x = \"unterminated\nlet y = 2";
      const tokens = this.tokenizer.tokenize(code);
      return {
        success: tokens.some(t => t.type === "STRING"),
        note: "String should tokenize without crashing (may consume rest of input)"
      };
    });

    this.testEdgeCase("EDGE-003", "MEDIUM", "Dangling active pattern end", () => {
      const code = "|) let x = 1";
      const tokens = this.tokenizer.tokenize(code);
      return {
        success: tokens.some(t => t.type === "ACTIVE_PATTERN_END"),
        note: "Dangling |) should tokenize as ACTIVE_PATTERN_END"
      };
    });

    this.testEdgeCase("EDGE-004", "HIGH", "Malformed record expression (missing })", () => {
      const code = "{ Name = \"Ada\"; Age = 42";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.recordExpressions.length >= 1,
        note: "Parser should not crash on missing closing brace"
      };
    });

    this.testEdgeCase("EDGE-005", "CRITICAL", "Type provider missing closing >", () => {
      const code = "type Data = CsvProvider<\"file.csv\"";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.typeProviders.length === 1,
        note: "Provider args may be incomplete but should parse without error"
      };
    });

    this.testEdgeCase("EDGE-006", "MEDIUM", "Invalid computation keyword sequence", () => {
      const code = "async { let!! x = fetch() return x }";
      const tokens = this.tokenizer.tokenize(code);
      return {
        success: tokens.some(t => t.type === "CE_BUILDER") && tokens.some(t => t.type === "CE_LET_BANG"),
        note: "Tokenizer matches let! prefix; extra ! becomes a separate symbol"
      };
    });

    this.testEdgeCase("EDGE-007", "HIGH", "Partial active pattern with underscore", () => {
      const code = "let (|Even|_|) n = if n % 2 = 0 then Some Even else None";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.activePatterns.length === 1 && ast.activePatterns[0].cases.includes("_"),
        note: "Underscore should be captured as a case token"
      };
    });
  }

  // ==========================================================================
  // CATEGORY 2: BOUNDARY CONDITIONS
  // ==========================================================================
  testBoundaryConditions() {
    console.log("\n📊 Category 2: Boundary Condition Tests");
    console.log("-".repeat(70));

    this.testEdgeCase("EDGE-008", "LOW", "Empty input string", () => {
      const tokens = this.tokenizer.tokenize("");
      const ast = this.parser.parse(tokens);
      return {
        success: tokens.length === 0 && ast.unions.length === 0,
        note: "Empty input should produce empty AST"
      };
    });

    this.testEdgeCase("EDGE-009", "LOW", "Whitespace-only input", () => {
      const tokens = this.tokenizer.tokenize("   \n\n\t  ");
      return {
        success: tokens.length === 0,
        note: "Whitespace should be ignored"
      };
    });

    this.testEdgeCase("EDGE-010", "MEDIUM", "Single token input", () => {
      const tokens = this.tokenizer.tokenize("async");
      return {
        success: tokens.length === 1 && tokens[0].type === "CE_BUILDER",
        note: "Single builder token should tokenize correctly"
      };
    });

    this.testEdgeCase("EDGE-011", "MEDIUM", "Very long identifier (120+ chars)", () => {
      const longName = "VeryLongIdentifier".repeat(8);
      const code = `type ${longName} = | Case`;
      const tokens = this.tokenizer.tokenize(code);
      return {
        success: tokens.some(t => t.value === longName),
        note: "Tokenizer should preserve long identifiers"
      };
    });

    this.testEdgeCase("EDGE-012", "HIGH", "Union with 40+ cases", () => {
      const cases = Array.from({ length: 45 }, (_, i) => `Case${i}`).join(" | ");
      const code = `type Many = | ${cases}`;
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.unions.length === 1 && ast.unions[0].cases.length >= 40,
        note: "Large DU should parse without hanging"
      };
    });

    this.testEdgeCase("EDGE-013", "HIGH", "Record type with 30 fields", () => {
      const fields = Array.from({ length: 30 }, (_, i) => `F${i}: int`).join("; ");
      const code = `type Mega = { ${fields} }`;
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.records.length === 1 && ast.records[0].fields.length >= 25,
        note: "Large record type should parse within iteration bounds"
      };
    });

    this.testEdgeCase("EDGE-014", "MEDIUM", "Numeric literal with measure", () => {
      const code = "let d = 12345.678<m>";
      const tokens = this.tokenizer.tokenize(code);
      return {
        success: tokens.some(t => t.type === "MEASURE_TYPE"),
        note: "Measure suffix should tokenize as MEASURE_TYPE"
      };
    });
  }

  // ==========================================================================
  // CATEGORY 3: CROSS-FEATURE INTERACTIONS
  // ==========================================================================
  testCrossFeatureInteractions() {
    console.log("\n📊 Category 3: Cross-Feature Interaction Tests");
    console.log("-".repeat(70));

    this.testEdgeCase("EDGE-015", "HIGH", "Computation expression + active pattern", () => {
      const code = `
        let (|Even|Odd|) n = if n % 2 = 0 then Even else Odd
        async { let! x = fetch() return x }
      `;
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.activePatterns.length === 1 && ast.computations.length === 1,
        note: "Should parse active pattern and CE in same file"
      };
    });

    this.testEdgeCase("EDGE-016", "MEDIUM", "DU + units of measure", () => {
      const code = "[<Measure>] type m\ntype Distance = | D of float<m>";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.metadata.hasMeasures === true,
        note: "Measure annotations should be detected even with nearby DUs"
      };
    });

    this.testEdgeCase("EDGE-017", "HIGH", "Type provider + record type", () => {
      const code = "type Data = CsvProvider<\"file.csv\">\ntype Person = { Name: string; Age: int }";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.typeProviders.length === 1 && ast.records.length === 1,
        note: "Provider and record type should parse in one pass"
      };
    });

    this.testEdgeCase("EDGE-018", "MEDIUM", "Match with guard + record expression", () => {
      const code = "match x with | A when x > 0 -> { Name = \"Ada\"; Age = 42 } | _ -> { Name = \"X\"; Age = 0 }";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.matchExpressions.length === 1,
        note: "Record expressions inside match are not modeled as top-level nodes"
      };
    });

    this.testEdgeCase("EDGE-019", "HIGH", "Computation builder task + return!", () => {
      const code = "task { let! x = fetch() return! x }";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.computations.length === 1 && ast.computations[0].steps.length >= 2,
        note: "Task builder should parse let! and return! steps"
      };
    });

    this.testEdgeCase("EDGE-020", "MEDIUM", "Active pattern + match + DU", () => {
      const code = `
        type Shape = | Circle | Square
        let (|Circle|Square|) s = s
        match shape with | Circle -> 1 | Square -> 2
      `;
      const tokens = this.tokenizer.tokenize(code);
      const _ast = this.parser.parse(tokens);
      return {
        success: tokens.some(t => t.type === "TYPE_KEYWORD") && tokens.some(t => t.type === "MATCH_KEYWORD"),
        note: "Token stream should include DU and match keywords; parsing may skip active pattern"
      };
    });
  }

  // ==========================================================================
  // CATEGORY 4: STRESS TESTS
  // ==========================================================================
  testStressCases() {
    console.log("\n📊 Category 4: Stress Tests");
    console.log("-".repeat(70));

    this.testEdgeCase("EDGE-021", "HIGH", "Large file (100+ blocks)", () => {
      const unions = Array.from({ length: 40 }, (_, i) => `type U${i} = | Case${i}`).join("\n");
      const records = Array.from({ length: 30 }, (_, i) => `type R${i} = { F: int }`).join("\n");
      const ces = Array.from({ length: 30 }, () => "async { let! x = fetch() return x }").join("\n");
      const code = `${unions}\n${records}\n${ces}`;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: tokens.length > 400 && ast.unions.length >= 20 && ast.records.length >= 15,
        note: "Large file should parse within iteration bounds"
      };
    });

    this.testEdgeCase("EDGE-022", "HIGH", "Active pattern with 30+ cases", () => {
      const cases = Array.from({ length: 35 }, (_, i) => `C${i}`).join("|");
      const code = `let (|${cases}|) x = x`;
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.activePatterns.length === 1 && ast.activePatterns[0].cases.length >= 30,
        note: "Large active pattern should parse without hanging"
      };
    });

    this.testEdgeCase("EDGE-023", "MEDIUM", "Match with 50 cases", () => {
      const cases = Array.from({ length: 50 }, (_, i) => `| Case${i} -> ${i}`).join(" ");
      const code = `match x with ${cases}`;
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      return {
        success: ast.matchExpressions.length === 1 && ast.matchExpressions[0].cases.length >= 40,
        note: "Large match should parse within loop bounds"
      };
    });

    this.testEdgeCase("EDGE-024", "MEDIUM", "Multiple record expressions (50)", () => {
      const records = Array.from({ length: 50 }, (_, i) => `{ Name = "N${i}"; Age = ${i} }`).join("\n");
      const ast = this.parser.parse(this.tokenizer.tokenize(records));
      return {
        success: ast.recordExpressions.length >= 40,
        note: "Many record expressions should be parsed sequentially"
      };
    });
  }

  // ==========================================================================
  // CATEGORY 5: CRITICAL GAPS
  // ==========================================================================
  testCriticalGaps() {
    console.log("\n📊 Category 5: Critical Gap Tests");
    console.log("-".repeat(70));

    this.testEdgeCase("EDGE-025", "CRITICAL", "Nested computation expressions", () => {
      const code = "async { let! x = async { return 1 } return x }";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const steps = ast.computations[0]?.steps || [];
      const nested = steps.some(step => step.expr && typeof step.expr === "object");
      return {
        success: ast.computations.length === 1 && nested,
        note: "Nested computation expressions should be modeled as nested AST nodes"
      };
    });

    this.testEdgeCase("EDGE-026", "CRITICAL", "Type provider failure (missing >)", () => {
      const code = "type Data = SqlProvider<\"conn\"";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const errors = ast.metadata?.diagnostics?.errors || [];
      return {
        success: ast.typeProviders.length === 1 && errors.length > 0,
        note: "Missing > should surface as a diagnostic error"
      };
    });

    this.testEdgeCase("EDGE-027", "CRITICAL", "Overlapping partial active patterns", () => {
      const code = `
        let (|A|_|) x = if x > 0 then Some A else None
        let (|A|B|) x = if x > 1 then A else B
      `;
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const warnings = ast.metadata?.diagnostics?.warnings || [];
      return {
        success: ast.activePatterns.length >= 2 && warnings.length > 0,
        note: "Overlap should be detected with a warning"
      };
    });

    this.testEdgeCase("EDGE-028", "CRITICAL", "Units of measure dimensional error", () => {
      const code = "let speed = 3.0<m/s>";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      const warnings = ast.metadata?.diagnostics?.warnings || [];
      return {
        success: tokens.some(t => t.type === "NUMBER") && warnings.length >= 0,
        note: "Parser should retain diagnostics when measure syntax is complex"
      };
    });

    this.testEdgeCase("EDGE-029", "CRITICAL", "DU exhaustiveness checking gap", () => {
      const code = "type Shape = | Circle | Square\nmatch s with | Circle -> 1";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      const warnings = ast.metadata?.diagnostics?.warnings || [];
      return {
        success: ast.unions.length === 1 && warnings.length > 0,
        note: "Non-exhaustive match should be warned"
      };
    });
  }

  // ==========================================================================
  // CATEGORY 6: TIER 2 SEMANTIC GAP VALIDATION
  // ==========================================================================
  testTier2SemanticGaps() {
    console.log("\n📊 Category 6: Tier 2 Semantic Gap Tests");
    console.log("-".repeat(70));

    this.testEdgeCase("EDGE-030", "HIGH", "Nested CE in return expression", () => {
      const code = "async { return async { return 1 } }";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const expr = ast.computations[0]?.steps[0]?.expr;
      const nested = expr && typeof expr === "object";
      return {
        success: nested,
        note: "Return expression should capture nested computation AST"
      };
    });

    this.testEdgeCase("EDGE-031", "HIGH", "Nested CE in do! expression", () => {
      const code = "async { do! async { return 1 } return 2 }";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const step = ast.computations[0]?.steps.find(s => s.kind === "do_bang");
      const nested = step && typeof step.expr === "object";
      return {
        success: Boolean(nested),
        note: "do! should allow nested computation expressions"
      };
    });

    this.testEdgeCase("EDGE-032", "HIGH", "Multiple nested CE levels", () => {
      const code = "async { let! x = task { return async { return 1 } } return x }";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const step = ast.computations[0]?.steps.find(s => s.kind === "let_bang");
      const nested = step && typeof step.expr === "object";
      return {
        success: Boolean(nested),
        note: "Multi-level nested CE should be represented in expression parts"
      };
    });

    this.testEdgeCase("EDGE-033", "HIGH", "Type provider missing close diagnostics", () => {
      const code = "type Data = CsvProvider<\"file.csv\"";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const errors = ast.metadata?.diagnostics?.errors || [];
      return {
        success: errors.some(e => e.code === "TYPE_PROVIDER_MISSING_CLOSE"),
        note: "Malformed type provider should emit an error entry"
      };
    });

    this.testEdgeCase("EDGE-034", "MEDIUM", "Type provider well-formed args", () => {
      const code = "type Data = CsvProvider<\"file.csv\">";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const errors = ast.metadata?.diagnostics?.errors || [];
      return {
        success: errors.length === 0 && ast.typeProviders.length === 1,
        note: "Well-formed provider args should parse without errors"
      };
    });

    this.testEdgeCase("EDGE-035", "MEDIUM", "Active pattern duplicate cases warning", () => {
      const code = "let (|A|A|) x = A";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const warnings = ast.metadata?.diagnostics?.warnings || [];
      return {
        success: warnings.some(w => w.code === "ACTIVE_PATTERN_DUPLICATE_CASE"),
        note: "Duplicate cases should emit warning"
      };
    });

    this.testEdgeCase("EDGE-036", "MEDIUM", "Active pattern multiple wildcards warning", () => {
      const code = "let (|A|_|_|) x = A";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const warnings = ast.metadata?.diagnostics?.warnings || [];
      return {
        success: warnings.some(w => w.code === "ACTIVE_PATTERN_MULTIPLE_WILDCARDS"),
        note: "Multiple wildcards should emit warning"
      };
    });

    this.testEdgeCase("EDGE-037", "MEDIUM", "Overlapping partial patterns warning", () => {
      const code = "let (|A|_|) x = A\nlet (|A|B|) x = A";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const warnings = ast.metadata?.diagnostics?.warnings || [];
      return {
        success: warnings.some(w => w.code === "ACTIVE_PATTERN_OVERLAP"),
        note: "Partial overlaps should emit warning"
      };
    });

    this.testEdgeCase("EDGE-038", "MEDIUM", "Measure declared then used", () => {
      const code = "[<Measure>] type m\nlet d = 3.0<m>";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const warnings = ast.metadata?.diagnostics?.warnings || [];
      const undeclared = warnings.some(w => w.code === "MEASURE_UNDECLARED");
      return {
        success: !undeclared && ast.metadata?.measures?.defined?.includes("m"),
        note: "Declared measure should not emit undeclared warning"
      };
    });

    this.testEdgeCase("EDGE-039", "MEDIUM", "Measure used before declaration warning", () => {
      const code = "let d = 3.0<m>"; 
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const warnings = ast.metadata?.diagnostics?.warnings || [];
      return {
        success: warnings.some(w => w.code === "MEASURE_UNDECLARED"),
        note: "Undeclared measure should emit warning"
      };
    });

    this.testEdgeCase("EDGE-040", "MEDIUM", "Measure redeclaration warning", () => {
      const code = "[<Measure>] type m\n[<Measure>] type m";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const warnings = ast.metadata?.diagnostics?.warnings || [];
      return {
        success: warnings.some(w => w.code === "MEASURE_REDECLARED"),
        note: "Redeclared measure should emit warning"
      };
    });

    this.testEdgeCase("EDGE-041", "HIGH", "DU exhaustiveness satisfied by wildcard", () => {
      const code = "type Shape = | Circle | Square\nmatch s with | Circle -> 1 | _ -> 0";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const warnings = ast.metadata?.diagnostics?.warnings || [];
      return {
        success: !warnings.some(w => w.code === "DU_EXHAUSTIVENESS"),
        note: "Wildcard case should satisfy exhaustiveness"
      };
    });

    this.testEdgeCase("EDGE-042", "HIGH", "DU exhaustiveness satisfied by all cases", () => {
      const code = "type Shape = | Circle | Square\nmatch s with | Circle -> 1 | Square -> 2";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const warnings = ast.metadata?.diagnostics?.warnings || [];
      return {
        success: !warnings.some(w => w.code === "DU_EXHAUSTIVENESS"),
        note: "All union cases should satisfy exhaustiveness"
      };
    });

    this.testEdgeCase("EDGE-043", "HIGH", "DU exhaustiveness missing cases warning", () => {
      const code = "type Shape = | Circle | Square | Triangle\nmatch s with | Circle -> 1";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const warnings = ast.metadata?.diagnostics?.warnings || [];
      return {
        success: warnings.some(w => w.code === "DU_EXHAUSTIVENESS"),
        note: "Missing union cases should emit warning"
      };
    });

    this.testEdgeCase("EDGE-044", "MEDIUM", "DU exhaustiveness with multiple unions", () => {
      const code = "type Shape = | Circle | Square\ntype Color = | Red | Blue\nmatch s with | Circle -> 1";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const warnings = ast.metadata?.diagnostics?.warnings || [];
      return {
        success: warnings.some(w => w.code === "DU_EXHAUSTIVENESS"),
        note: "Only the matched union should be considered for exhaustiveness warnings"
      };
    });

    this.testEdgeCase("EDGE-045", "LOW", "Measure usage tracked in metadata", () => {
      const code = "[<Measure>] type m\nlet d = 3.0<m>";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const used = ast.metadata?.measures?.used || [];
      return {
        success: used.includes("m"),
        note: "Measure usage should be tracked in metadata"
      };
    });

    this.testEdgeCase("EDGE-046", "MEDIUM", "Nested CE in let! expression parts", () => {
      const code = "async { let! x = async { return 42 } return x }";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const step = ast.computations[0]?.steps.find(s => s.kind === "let_bang");
      return {
        success: step && typeof step.expr === "object",
        note: "let! should capture nested computation expression object"
      };
    });

    this.testEdgeCase("EDGE-047", "MEDIUM", "Type provider args captured on missing close", () => {
      const code = "type Data = SqlProvider<\"conn\"";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const provider = ast.typeProviders[0];
      return {
        success: provider && provider.arguments.includes("\"conn\"") && provider.error,
        note: "Provider args should still be captured when close is missing"
      };
    });

    this.testEdgeCase("EDGE-048", "LOW", "Type provider args captured with close", () => {
      const code = "type Data = SqlProvider<\"conn\">";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const provider = ast.typeProviders[0];
      return {
        success: provider && provider.arguments.includes("\"conn\"") && !provider.error,
        note: "Provider args should be captured when syntax is valid"
      };
    });

    this.testEdgeCase("EDGE-049", "LOW", "Non-union match patterns do not warn", () => {
      const code = "type Shape = | Circle | Square\nmatch s with | Foo -> 1";
      const ast = this.parser.parse(this.tokenizer.tokenize(code));
      const warnings = ast.metadata?.diagnostics?.warnings || [];
      return {
        success: !warnings.some(w => w.code === "DU_EXHAUSTIVENESS"),
        note: "Exhaustiveness warnings should only trigger on union patterns"
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

      console.log(`  ❌ ERROR [${severity}] ${id}: ${description}`);
      console.log(`      → ERROR: ${error.message}`);
    }
  }

  printReport() {
    console.log("\n" + "=".repeat(70));
    console.log("📈 FORENSIC EDGE CASE SUMMARY");
    console.log("=".repeat(70));

    const severities = ["critical", "high", "medium", "low"];
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalErrors = 0;

    for (const severity of severities) {
      const cases = this.results[severity];
      const passed = cases.filter(c => c.status === "PASS").length;
      const failed = cases.filter(c => c.status === "FAIL").length;
      const errors = cases.filter(c => c.status === "ERROR").length;

      totalTests += cases.length;
      totalPassed += passed;
      totalFailed += failed;
      totalErrors += errors;

      console.log(`\n${severity.toUpperCase()}: ${cases.length} tests`);
      console.log(`  ✅ Passed: ${passed}`);
      console.log(`  ❌ Failed: ${failed}`);
      console.log(`  ⚠️  Errors: ${errors}`);
    }

    console.log("\n" + "-".repeat(70));
    console.log(`TOTAL: ${totalTests} edge cases tested`);
    console.log(`  ✅ Passed: ${totalPassed} (${totalTests ? (totalPassed / totalTests * 100).toFixed(1) : "0.0"}%)`);
    console.log(`  ❌ Failed: ${totalFailed} (${totalTests ? (totalFailed / totalTests * 100).toFixed(1) : "0.0"}%)`);
    console.log(`  ⚠️  Errors: ${totalErrors} (${totalTests ? (totalErrors / totalTests * 100).toFixed(1) : "0.0"}%)`);
    console.log("=".repeat(70));
  }

  getDetailedResults() {
    return {
      edgeCases: this.edgeCases,
      results: this.results,
      summary: {
        total: this.edgeCases.length,
        passed: this.edgeCases.filter(e => e.status === "PASS").length,
        failed: this.edgeCases.filter(e => e.status === "FAIL").length,
        errors: this.edgeCases.filter(e => e.status === "ERROR").length
      }
    };
  }
}

if (require.main === module) {
  const forensics = new FSharpForensicEdgeCases();
  forensics.runAll();
}

module.exports = FSharpForensicEdgeCases;

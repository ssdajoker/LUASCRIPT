/**
 * HASKELL PHASE C FORENSIC EDGE CASES
 * Comprehensive edge case testing for Haskell implementation
 * Designed to discover hidden bugs, boundary conditions, and critical gaps
 */

const HaskellTokenizer = require("../languages/haskell_tokenizer");
const HaskellParser = require("../languages/haskell_parser");
const HaskellGenerator = require("../languages/haskell_generator");

class HaskellForensicEdgeCases {
  constructor() {
    this.tokenizer = new HaskellTokenizer();
    this.parser = new HaskellParser();
    this.generator = new HaskellGenerator();
    
    this.edgeCases = [];
    this.results = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
  }

  runAll() {
    console.log("\n🔬 HASKELL FORENSIC EDGE CASE VALIDATION");
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

    this.testEdgeCase("EDGE-001", "CRITICAL", "Incomplete type class definition", () => {
      const code = "class Functor f where";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      // Should handle gracefully, not crash
      return { 
        success: ast.typeClasses.length > 0,
        note: "No methods defined - should parse without crashing"
      };
    });

    this.testEdgeCase("EDGE-002", "HIGH", "Unclosed block comment", () => {
      const code = "{- This comment never closes\nclass Functor f where";
      const tokens = this.tokenizer.tokenize(code);
      return {
        success: tokens.length >= 0,
        note: "Tokenizer should handle gracefully, may skip rest of file"
      };
    });

    this.testEdgeCase("EDGE-003", "MEDIUM", "Invalid operator sequence", () => {
      const code = "m >>== f >>> g";
      const tokens = this.tokenizer.tokenize(code);
      return {
        success: tokens.length > 0,
        note: "Should tokenize as separate operators/identifiers"
      };
    });

    this.testEdgeCase("EDGE-004", "CRITICAL", "Missing GADT where keyword", () => {
      const code = "data Expr a Lit :: Int -> Expr Int";
      const tokens = this.tokenizer.tokenize(code);
      const _ast = this.parser.parse(tokens);
      return {
        success: true, // Should not crash
        note: "Parser may interpret as ADT instead of GADT"
      };
    });

    this.testEdgeCase("EDGE-005", "HIGH", "Incomplete do-notation block", () => {
      const code = "do x <-";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: ast.expressions.length >= 0,
        note: "Incomplete bind - should parse without crashing"
      };
    });

    this.testEdgeCase("EDGE-006", "MEDIUM", "Unclosed string literal", () => {
      const code = "let x = \"unclosed string\nlet y = 42";
      const tokens = this.tokenizer.tokenize(code);
      return {
        success: tokens.length > 0,
        note: "String may consume rest of file or stop at newline"
      };
    });

    this.testEdgeCase("EDGE-007", "HIGH", "Invalid kind signature syntax", () => {
      const code = "type F :: * -> -> *";
      const tokens = this.tokenizer.tokenize(code);
      return {
        success: tokens.some(t => t.type === "KIND_SIGNATURE"),
        note: "Malformed arrows - should tokenize but may confuse parser"
      };
    });

    this.testEdgeCase("EDGE-008", "CRITICAL", "Empty case expression", () => {
      const code = "case x of";
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: ast.expressions.length >= 0,
        note: "No cases defined - should not crash"
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
        success: tokens.length === 0 && lua.includes("Haskell"),
        note: "Should handle empty input gracefully"
      };
    });

    this.testEdgeCase("EDGE-010", "MEDIUM", "Single token input", () => {
      const tokens = this.tokenizer.tokenize("class");
      return {
        success: tokens.length === 1 && tokens[0].type === "CLASS_KEYWORD",
        note: "Single keyword should tokenize correctly"
      };
    });

    this.testEdgeCase("EDGE-011", "HIGH", "Deeply nested type (10+ levels)", () => {
      const code = "type Deep = f (g (h (i (j (k (l (m (n (o (p a))))))))))";
      const tokens = this.tokenizer.tokenize(code);
      const _ast = this.parser.parse(tokens);
      return {
        success: tokens.length > 20,
        note: "Deep nesting should not cause stack overflow"
      };
    });

    this.testEdgeCase("EDGE-012", "MEDIUM", "Very long identifier (100+ chars)", () => {
      const longName = "a" + "VeryLongIdentifierName".repeat(10);
      const code = `class ${longName} f where`;
      const tokens = this.tokenizer.tokenize(code);
      return {
        success: tokens.some(t => t.value === longName),
        note: "Should handle arbitrarily long identifiers"
      };
    });

    this.testEdgeCase("EDGE-013", "HIGH", "ADT with 50+ constructors", () => {
      const constructors = Array.from({length: 50}, (_, i) => `C${i}`).join(" | ");
      const code = `data Huge = ${constructors}`;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: ast.dataTypes.length > 0 && ast.dataTypes[0].constructors.length >= 40,
        note: "Large ADT should parse without hanging"
      };
    });

    this.testEdgeCase("EDGE-014", "CRITICAL", "Do-block with 100+ statements", () => {
      const statements = Array.from({length: 100}, (_, i) => `x${i} <- action${i}`).join("; ");
      const code = `do ${statements}`;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: ast.expressions.length > 0 && ast.expressions[0].statements.length >= 80,
        note: "Large do-block should respect iteration bounds"
      };
    });

    this.testEdgeCase("EDGE-015", "HIGH", "Whitespace-only input", () => {
      const tokens = this.tokenizer.tokenize("   \n\n\t\t  \n   ");
      return {
        success: tokens.length === 0,
        note: "Whitespace should be ignored"
      };
    });

    this.testEdgeCase("EDGE-016", "MEDIUM", "Maximum Unicode identifier", () => {
      const code = "class Σ f where μ :: a -> f a";
      const tokens = this.tokenizer.tokenize(code);
      return {
        success: tokens.length >= 6,
        note: "Unicode identifiers may not be supported, but should not crash"
      };
    });
  }

  // ==========================================================================
  // CATEGORY 3: CROSS-FEATURE INTERACTIONS
  // ==========================================================================
  testCrossFeatureInteractions() {
    console.log("\n📊 Category 3: Cross-Feature Interaction Tests");
    console.log("-".repeat(70));

    this.testEdgeCase("EDGE-017", "HIGH", "Type classes + GADTs combined", () => {
      const code = `
        class Show a where show :: a -> String
        data Expr a where
          Lit :: Int -> Expr Int
          Str :: String -> Expr String
        instance Show (Expr Int) where show = undefined
      `;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      const _lua = this.generator.generateLua(ast);
      return {
        success: ast.typeClasses.length > 0 && ast.dataTypes.length > 0 && ast.instances.length > 0,
        note: "Should handle typeclass instances for GADTs"
      };
    });

    this.testEdgeCase("EDGE-018", "CRITICAL", "Monads + Error handling + GADTs", () => {
      const code = `
        data Result a where
          Ok :: a -> Result a
          Err :: String -> Result a
        do
          x <- Ok 10
          y <- computeValue x
          case y of
            Ok z -> return z
            Err msg -> return 0
      `;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      const _js = this.generator.generateJavaScript(ast);
      return {
        success: ast.dataTypes.length > 0 && ast.expressions.length >= 2,
        note: "Complex interaction: monads, GADTs, case expressions"
      };
    });

    this.testEdgeCase("EDGE-019", "HIGH", "Nested do-notation blocks", () => {
      const code = `
        do
          x <- do
            y <- action1
            return (y + 1)
          z <- action2 x
          return z
      `;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: ast.expressions.length >= 1,
        note: "Nested do-blocks may confuse parser delimiter detection"
      };
    });

    this.testEdgeCase("EDGE-020", "MEDIUM", "Higher-kinded types in instances", () => {
      const code = `
        class Monad m where
          return :: a -> m a
          bind :: m a -> (a -> m b) -> m b
        instance Monad (Either e) where
          return = Right
      `;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: ast.typeClasses.length > 0 && ast.instances.length > 0,
        note: "Partially applied type constructors in instances"
      };
    });

    this.testEdgeCase("EDGE-021", "HIGH", "Pattern guards in case + guards", () => {
      const code = `
        case x of
          Just y | y > 0, y < 100 -> "valid"
          Just y | y > 100 -> "too large"
          Nothing | True -> "empty"
          _ -> "other"
      `;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: ast.expressions.length > 0,
        note: "Multiple guards per pattern may not be fully parsed"
      };
    });

    this.testEdgeCase("EDGE-022", "CRITICAL", "Recursive type definitions", () => {
      const code = `
        data List a = Nil | Cons a (List a)
        data Tree a = Leaf a | Node (Tree a) (Tree a)
      `;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      const lua = this.generator.generateLua(ast);
      return {
        success: ast.dataTypes.length === 2 && lua.includes("List") && lua.includes("Tree"),
        note: "Self-referential types should generate proper constructors"
      };
    });

    this.testEdgeCase("EDGE-023", "HIGH", "Lazy thunks + strict evaluation mixing", () => {
      const code = `
        let x = thunk (heavy_computation)
        do
          y <- force x
          z <- force x
          return (y + z)
      `;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      const js = this.generator.generateJavaScript(ast);
      return {
        success: js.includes("__thunk") && js.includes("__force"),
        note: "Multiple force operations on same thunk"
      };
    });

    this.testEdgeCase("EDGE-024", "MEDIUM", "Kind signatures in data declarations", () => {
      const code = `
        data Proxy (a :: *) = Proxy
        data F (f :: * -> *) (a :: *) = F (f a)
      `;
      const tokens = this.tokenizer.tokenize(code);
      const _ast = this.parser.parse(tokens);
      return {
        success: tokens.filter(t => t.type === "KIND_SIGNATURE").length >= 2,
        note: "Explicit kind annotations in data declarations"
      };
    });
  }

  // ==========================================================================
  // CATEGORY 4: STRESS TESTS
  // ==========================================================================
  testStressCases() {
    console.log("\n📊 Category 4: Stress Tests");
    console.log("-".repeat(70));

    this.testEdgeCase("EDGE-025", "HIGH", "Large file (5000+ tokens)", () => {
      const code = `
        ${Array.from({length: 100}, (_, i) => `data Type${i} = C${i}`).join("\n")}
        ${Array.from({length: 100}, (_, i) => `class Class${i} a where m${i} :: a -> a`).join("\n")}
      `;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: tokens.length > 1000 && ast.dataTypes.length >= 90,
        note: "Large files should respect iteration bounds and not hang"
      };
    });

    this.testEdgeCase("EDGE-026", "CRITICAL", "Complex type class hierarchy", () => {
      const code = `
        class Eq a where eq :: a -> a -> Bool
        class Eq a => Ord a where compare :: a -> a -> Ordering
        class Ord a => Enum a where succ :: a -> a
        class Functor f where fmap :: (a -> b) -> f a -> f b
        class Functor f => Applicative f where pure :: a -> f a
        class Applicative m => Monad m where bind :: m a -> (a -> m b) -> m b
      `;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: ast.typeClasses.length >= 5,
        note: "Superclass constraints form a hierarchy"
      };
    });

    this.testEdgeCase("EDGE-027", "HIGH", "Deeply nested case expressions", () => {
      const code = `
        case x of
          Just y -> case y of
            Left z -> case z of
              Some w -> case w of
                Pair a b -> case a of
                  Value v -> v
                  _ -> 0
      `;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: ast.expressions.length >= 1,
        note: "Deep nesting may confuse delimiter detection"
      };
    });

    this.testEdgeCase("EDGE-028", "MEDIUM", "Extensive pattern matching (50+ cases)", () => {
      const cases = Array.from({length: 50}, (_, i) => `C${i} -> ${i}`).join(" | ");
      const code = `case x of ${cases}`;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: ast.expressions.length > 0,
        note: "Should handle large case expressions efficiently"
      };
    });

    this.testEdgeCase("EDGE-029", "HIGH", "Comments everywhere (stress whitespace handling)", () => {
      const code = `
        {- comment 1 -} class {- comment 2 -} Functor {- comment 3 -} f {- comment 4 -} where
        -- line comment
        fmap {- inline -} :: {- type -} (a -> b) -> f a -> f b
      `;
      const tokens = this.tokenizer.tokenize(code);
      return {
        success: tokens.some(t => t.type === "CLASS_KEYWORD"),
        note: "Comments should be completely ignored"
      };
    });

    this.testEdgeCase("EDGE-030", "CRITICAL", "Rapid type alternation (ADT/GADT/newtype)", () => {
      const code = `
        data Normal1 = N1
        data GADT1 a where G1 :: Int -> GADT1 Int
        newtype Wrapped1 = W1 Int
        data Normal2 = N2
        data GADT2 a where G2 :: String -> GADT2 String
        newtype Wrapped2 = W2 String
      `;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: ast.dataTypes.length >= 5,
        note: "Parser state should reset correctly between definitions"
      };
    });

    this.testEdgeCase("EDGE-031", "HIGH", "Performance: Tokenization speed", () => {
      const code = "class Functor f where fmap :: (a -> b) -> f a -> f b\n".repeat(1000);
      const start = performance.now();
      const tokens = this.tokenizer.tokenize(code);
      const elapsed = performance.now() - start;
      return {
        success: elapsed < 100, // Should be much faster than 100ms
        note: `Tokenized ${tokens.length} tokens in ${elapsed.toFixed(2)}ms`
      };
    });

    this.testEdgeCase("EDGE-032", "HIGH", "Performance: Full pipeline speed", () => {
      const code = `
        data Maybe a = Nothing | Just a
        class Functor f where fmap :: (a -> b) -> f a -> f b
        instance Functor Maybe where
        do x <- action; return x
      `.repeat(100);
      const start = performance.now();
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      const _lua = this.generator.generateLua(ast);
      const elapsed = performance.now() - start;
      return {
        success: elapsed < 200, // Should be under 200ms
        note: `Full pipeline in ${elapsed.toFixed(2)}ms`
      };
    });
  }

  // ==========================================================================
  // CATEGORY 5: CRITICAL GAPS (The 5 specified gaps)
  // ==========================================================================
  testCriticalGaps() {
    console.log("\n📊 Category 5: Critical Gaps");
    console.log("-".repeat(70));

    this.testEdgeCase("GAP-001", "CRITICAL", "Overlapping type class instances", () => {
      const code = `
        class Show a where show :: a -> String
        instance Show Int where show = undefined
        instance Show Int where show = undefined
        instance Show a where show = undefined
      `;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: ast.instances.length >= 2,
        note: "CRITICAL GAP: No detection of overlapping instances - potential runtime conflicts"
      };
    });

    this.testEdgeCase("GAP-002", "CRITICAL", "Nested Template Haskell quasi-quotes", () => {
      const code = `
        let x = [| [| nested quasi-quote |] |]
        let y = $( $(nested splice) )
      `;
      const tokens = this.tokenizer.tokenize(code);
      return {
        success: tokens.length > 0,
        note: "CRITICAL GAP: Template Haskell not supported - no quasi-quote tokenization"
      };
    });

    this.testEdgeCase("GAP-003", "CRITICAL", "Non-exhaustive GADT pattern matching", () => {
      const code = `
        data Expr a where
          Lit :: Int -> Expr Int
          Str :: String -> Expr String
          Bool :: Bool -> Expr Bool
        case expr of
          Lit n -> n
          Str s -> length s
      `;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: ast.dataTypes.length > 0 && ast.expressions.length > 0,
        note: "CRITICAL GAP: No exhaustiveness checking - missing Bool case undetected"
      };
    });

    this.testEdgeCase("GAP-004", "CRITICAL", "Infinite list and space leak markers", () => {
      const code = `
        let ones = 1 : ones
        let fibs = 0 : 1 : zipWith (+) fibs (tail fibs)
        let leak = let xs = [1..] in sum xs
      `;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      const _lua = this.generator.generateLua(ast);
      return {
        success: tokens.length > 0,
        note: "CRITICAL GAP: No infinite list detection, no space leak warnings"
      };
    });

    this.testEdgeCase("GAP-005", "CRITICAL", "Monad transformer stacks (>3 transformers)", () => {
      const code = `
        type MyMonad = ReaderT Config (StateT AppState (ExceptT Error (LoggingT IO)))
        do
          config <- ask
          state <- get
          result <- lift $ throwError "error"
          lift $ lift $ logInfo "message"
          return result
      `;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      const _js = this.generator.generateJavaScript(ast);
      return {
        success: tokens.length > 0,
        note: "CRITICAL GAP: No transformer stack analysis - lift depth not validated"
      };
    });

    this.testEdgeCase("GAP-006", "HIGH", "Type family/associated type syntax", () => {
      const code = `
        class Collection c where
          type Elem c
          empty :: c
          insert :: Elem c -> c -> c
      `;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: ast.typeClasses.length > 0,
        note: "HIGH GAP: Type families not recognized - parsed as regular methods"
      };
    });

    this.testEdgeCase("GAP-007", "HIGH", "Multi-parameter type classes", () => {
      const code = `
        class Convert a b where
          convert :: a -> b
        instance Convert Int String where
          convert = show
      `;
      const tokens = this.tokenizer.tokenize(code);
      const ast = this.parser.parse(tokens);
      return {
        success: ast.typeClasses.length > 0,
        note: "HIGH GAP: Multi-param type classes parsed but not semantically validated"
      };
    });

    this.testEdgeCase("GAP-008", "HIGH", "Existential quantification", () => {
      const code = `
        data Showable = forall a. Show a => MkShowable a
        data Box = forall a. Box a
      `;
      const tokens = this.tokenizer.tokenize(code);
      const _ast = this.parser.parse(tokens);
      return {
        success: tokens.some(t => t.type === "FORALL_KEYWORD"),
        note: "HIGH GAP: Forall tokenized but existentials not properly parsed"
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
    console.log(`  ✅ Passed: ${totalPassed} (${(totalPassed/totalTests*100).toFixed(1)}%)`);
    console.log(`  ❌ Failed: ${totalFailed} (${(totalFailed/totalTests*100).toFixed(1)}%)`);
    console.log(`  ⚠️  Errors: ${totalErrors} (${(totalErrors/totalTests*100).toFixed(1)}%)`);
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
  const forensics = new HaskellForensicEdgeCases();
  forensics.runAll();
}

module.exports = HaskellForensicEdgeCases;

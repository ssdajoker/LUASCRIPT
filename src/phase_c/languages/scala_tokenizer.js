/**
 * SCALA PHASE C TOKENIZER - CHAMPIONSHIP EDITION
 * Extends tokenizer with Scala-specific Phase C features (MOST COMPLEX):
 * - Implicit resolution (implicit parameters, conversions, evidence)
 * - Type refinement (structural types, path-dependent types, type projections)
 * - Scala macros (def macros, tree manipulation, compile-time code gen)
 * - Context bounds & type classes (context bounds, evidence parameters)
 * - Advanced pattern matching (extractor objects, guards, variable binding)
 * - For-comprehensions & monadic operations (map/flatMap desugaring)
 * 
 * Complexity: TIER 2 - VERY HARD (Hardest language in Phase C)
 * Lines: 340
 */

const AbstractPhaseCtokenizer = require("../framework/abstract_tokenizer");

class ScalaPhaseC_Tokenizer extends AbstractPhaseCtokenizer {
  constructor(config = {}) {
    super({
      language: "Scala",
      ...config
    });

    // Scala-specific Phase C keywords (most extensive)
    this.scalaKeywords = {
      implicit: [
        "implicit", "implicitly", "implicitNotFound"
      ],
      typeRefinement: [
        "type", "with", "forSome", "existential", "_root_"
      ],
      macro: [
        "macro", "Context", "Expr", "Tree", "TypeTag", "WeakTypeTag",
        "reify", "splice", "universe", "quasiquote"
      ],
      contextBounds: [
        "using", "given", "summon", "evidence", "witness"
      ],
      patternMatch: [
        "unapply", "unapplySeq", "case", "match", "@"
      ],
      forComprehension: [
        "for", "yield", "map", "flatMap", "filter", "withFilter", "foreach"
      ],
      types: [
        "Int", "Long", "Short", "Byte", "Float", "Double", "Boolean",
        "Char", "String", "Unit", "Any", "AnyRef", "AnyVal", "Nothing",
        "Null", "Option", "Some", "None", "Either", "Left", "Right",
        "List", "Seq", "Map", "Set", "Vector", "Array", "Stream",
        "Future", "Try", "Success", "Failure"
      ],
      modifiers: [
        "abstract", "final", "sealed", "open", "lazy", "private",
        "protected", "override", "package", "object"
      ]
    };

    // Scala-specific operators (most complex symbol system)
    this.scalaOperators = {
      // Type operators
      typeProjection: "#",
      structuralType: { start: "{", end: "}" },
      existentialType: "_",
      pathSeparator: ".",
      singletonType: ".type",
      
      // Context bound operators
      contextBound: ":",
      viewBound: "<%",
      upperBound: "<:",
      lowerBound: ">:",
      
      // Pattern matching operators
      at: "@",
      guard: "if",
      extractor: "unapply",
      
      // For-comprehension operators
      generator: "<-",
      forGuard: "if",
      definition: "=",
      
      // Other Scala operators
      lambda: "=>",
      byName: ": =>",
      wildcard: "_",
      placeholder: "_",
      splat: "_*"
    };

    this.tokenMetrics = {
      implicitCount: 0,
      implicitConversionCount: 0,
      implicitClassCount: 0,
      typeRefinementCount: 0,
      pathDependentTypeCount: 0,
      typeProjectionCount: 0,
      macroCount: 0,
      contextBoundCount: 0,
      extractorCount: 0,
      forComprehensionCount: 0,
      structuralTypeCount: 0,
      singletonTypeCount: 0,
      existentialTypeCount: 0
    };
  }

  /**
   * MAIN TOKENIZE METHOD
   */
  tokenize(code) {
    const startTime = performance.now();
    this.tokens = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.code = code;

    const maxIterations = code.length * 2;
    let iterations = 0;

    while (this.position < code.length && iterations < maxIterations) {
      iterations++;
      this.skipWhitespaceAndComments();
      
      if (this.position >= code.length) break;

      const token = this.scanToken();
      if (token) {
        this.tokens.push(token);
      }
    }

    if (iterations >= maxIterations) {
      throw new Error("Tokenization exceeded max iterations (possible infinite loop)");
    }

    const elapsed = performance.now() - startTime;
    return {
      tokens: this.tokens,
      metrics: this.tokenMetrics,
      elapsed,
      iterations
    };
  }

  /**
   * SCAN TOKEN (Scala-specific)
   */
  scanToken() {
    const char = this.code[this.position];

    // Implicit keywords
    if (this.match("implicit")) {
      return this.scanImplicit();
    }

    // Macro keywords
    if (this.match("macro")) {
      return this.scanMacro();
    }

    // Context bounds
    if (this.match("using") || this.match("given")) {
      return this.scanContextBound();
    }

    // Type refinement
    if (char === "{" && this.isStructuralType()) {
      return this.scanStructuralType();
    }

    // Type projection (#)
    if (char === "#") {
      return this.scanTypeProjection();
    }

    // Path-dependent type (.)
    if (char === "." && this.isPathDependent()) {
      return this.scanPathDependentType();
    }

    // Extractor pattern (unapply)
    if (this.match("unapply")) {
      return this.scanExtractor();
    }

    // For-comprehension
    if (this.match("for")) {
      return this.scanForComprehension();
    }

    // Case pattern
    if (this.match("case") && this.inMatchExpression()) {
      return this.scanCasePattern();
    }

    // Context bound operators
    if (this.match("<%") || this.match("<:") || this.match(">:")) {
      return this.scanContextBoundOperator();
    }

    // Default scanning
    return this.scanDefault();
  }

  /**
   * SCAN IMPLICIT (CRITICAL FOR SCALA)
   */
  scanImplicit() {
    const start = this.position;
    this.consume("implicit");
    
    this.skipWhitespace();
    
    // Check what follows: parameter, conversion, class, or value
    const next = this.peekWord();
    
    let implicitType = "IMPLICIT_PARAMETER";
    if (next === "def") {
      implicitType = "IMPLICIT_CONVERSION";
      this.tokenMetrics.implicitConversionCount++;
    } else if (next === "class") {
      implicitType = "IMPLICIT_CLASS";
      this.tokenMetrics.implicitClassCount++;
    } else if (next === "val" || next === "var") {
      implicitType = "IMPLICIT_VALUE";
    }
    
    this.tokenMetrics.implicitCount++;
    
    return {
      type: implicitType,
      value: "implicit",
      start,
      end: this.position,
      line: this.line,
      column: this.column - 8
    };
  }

  /**
   * SCAN STRUCTURAL TYPE (Type Refinement)
   */
  scanStructuralType() {
    const start = this.position;
    this.position++; // consume '{'
    
    const members = [];
    let depth = 1;
    
    while (this.position < this.code.length && depth > 0) {
      const char = this.code[this.position];
      if (char === "{") depth++;
      if (char === "}") depth--;
      if (depth > 0) {
        // Parse structural type members (def, val, var, type)
        if (this.match("def") || this.match("val") || this.match("var") || this.match("type")) {
          members.push(this.parseStructuralMember());
        }
      }
      this.position++;
    }
    
    this.tokenMetrics.structuralTypeCount++;
    this.tokenMetrics.typeRefinementCount++;
    
    return {
      type: "STRUCTURAL_TYPE",
      value: this.code.substring(start, this.position),
      members,
      start,
      end: this.position,
      line: this.line,
      column: this.column - (this.position - start)
    };
  }

  /**
   * SCAN TYPE PROJECTION (Type#Member)
   */
  scanTypeProjection() {
    const start = this.position;
    this.position++; // consume '#'
    
    const memberName = this.readIdentifier();
    
    this.tokenMetrics.typeProjectionCount++;
    this.tokenMetrics.typeRefinementCount++;
    
    return {
      type: "TYPE_PROJECTION",
      operator: "#",
      member: memberName,
      start,
      end: this.position,
      line: this.line,
      column: this.column - (this.position - start)
    };
  }

  /**
   * SCAN PATH-DEPENDENT TYPE (outer.Inner)
   */
  scanPathDependentType() {
    const start = this.position;
    const path = [];
    
    while (this.position < this.code.length) {
      path.push(this.readIdentifier());
      if (this.code[this.position] === ".") {
        this.position++;
        if (this.match("type")) {
          // Singleton type: value.type
          this.consume("type");
          this.tokenMetrics.singletonTypeCount++;
          break;
        }
      } else {
        break;
      }
    }
    
    this.tokenMetrics.pathDependentTypeCount++;
    this.tokenMetrics.typeRefinementCount++;
    
    return {
      type: "PATH_DEPENDENT_TYPE",
      path,
      start,
      end: this.position,
      line: this.line,
      column: this.column - (this.position - start)
    };
  }

  /**
   * SCAN MACRO
   */
  scanMacro() {
    const start = this.position;
    this.consume("macro");
    
    this.skipWhitespace();
    const implementationName = this.readIdentifier();
    
    this.tokenMetrics.macroCount++;
    
    return {
      type: "MACRO_KEYWORD",
      value: "macro",
      implementation: implementationName,
      start,
      end: this.position,
      line: this.line,
      column: this.column - (this.position - start)
    };
  }

  /**
   * SCAN CONTEXT BOUND (def func[T: Ordering])
   */
  scanContextBound() {
    const start = this.position;
    const keyword = this.readIdentifier(); // 'using' or 'given'
    
    this.skipWhitespace();
    
    // Parse context bound syntax
    // Scala 2: def func[T: Ordering]
    // Scala 3: def func[T: Ordering](using ord: Ordering[T])
    
    this.tokenMetrics.contextBoundCount++;
    
    return {
      type: "CONTEXT_BOUND_KEYWORD",
      value: keyword,
      start,
      end: this.position,
      line: this.line,
      column: this.column - (this.position - start)
    };
  }

  /**
   * SCAN CONTEXT BOUND OPERATOR (<:, >:, <%)
   */
  scanContextBoundOperator() {
    const start = this.position;
    let operator = "";
    
    if (this.match("<%")) {
      operator = "<%";
      this.position += 2;
    } else if (this.match("<:")) {
      operator = "<:";
      this.position += 2;
    } else if (this.match(">:")) {
      operator = ">:";
      this.position += 2;
    }
    
    return {
      type: "CONTEXT_BOUND_OPERATOR",
      operator,
      start,
      end: this.position,
      line: this.line,
      column: this.column - (this.position - start)
    };
  }

  /**
   * SCAN EXTRACTOR (unapply)
   */
  scanExtractor() {
    const start = this.position;
    this.consume("unapply");
    
    this.tokenMetrics.extractorCount++;
    
    return {
      type: "EXTRACTOR_KEYWORD",
      value: "unapply",
      start,
      end: this.position,
      line: this.line,
      column: this.column - (this.position - start)
    };
  }

  /**
   * SCAN FOR-COMPREHENSION
   */
  scanForComprehension() {
    const start = this.position;
    this.consume("for");
    
    this.skipWhitespace();
    
    // Parse for-comprehension components
    // for { generator; guard; definition } yield result
    
    this.tokenMetrics.forComprehensionCount++;
    
    return {
      type: "FOR_COMPREHENSION",
      value: "for",
      start,
      end: this.position,
      line: this.line,
      column: this.column - 3
    };
  }

  /**
   * SCAN CASE PATTERN
   */
  scanCasePattern() {
    const start = this.position;
    this.consume("case");
    
    return {
      type: "CASE_PATTERN",
      value: "case",
      start,
      end: this.position,
      line: this.line,
      column: this.column - 4
    };
  }

  // ===== HELPER METHODS =====

  isStructuralType() {
    // Check if '{' starts a structural type (not a block)
    // Look ahead for 'def', 'val', 'var', 'type'
    const saved = this.position;
    this.position++;
    this.skipWhitespace();
    const isStruct = this.match("def") || this.match("val") || 
                     this.match("var") || this.match("type");
    this.position = saved;
    return isStruct;
  }

  isPathDependent() {
    // Check if '.' is part of a path-dependent type
    const saved = this.position;
    this.position++;
    const next = this.peekWord();
    this.position = saved;
    return /^[A-Z]/.test(next); // Type starts with uppercase
  }

  inMatchExpression() {
    // Simple heuristic: check if we've seen 'match' recently
    const recentTokens = this.tokens.slice(-5);
    return recentTokens.some(t => t.value === "match");
  }

  parseStructuralMember() {
    const kind = this.readIdentifier();
    this.skipWhitespace();
    const name = this.readIdentifier();
    return { kind, name };
  }

  skipWhitespaceAndComments() {
    while (this.position < this.code.length) {
      const char = this.code[this.position];
      
      if (char === " " || char === "\t" || char === "\r") {
        this.position++;
        this.column++;
        continue;
      }
      
      if (char === "\n") {
        this.position++;
        this.line++;
        this.column = 1;
        continue;
      }
      
      // Single-line comment
      if (this.match("//")) {
        while (this.position < this.code.length && this.code[this.position] !== "\n") {
          this.position++;
        }
        continue;
      }
      
      // Multi-line comment
      if (this.match("/*")) {
        this.position += 2;
        while (this.position < this.code.length - 1) {
          if (this.match("*/")) {
            this.position += 2;
            break;
          }
          if (this.code[this.position] === "\n") {
            this.line++;
            this.column = 1;
          }
          this.position++;
        }
        continue;
      }
      
      break;
    }
  }

  skipWhitespace() {
    while (this.position < this.code.length) {
      const char = this.code[this.position];
      if (char === " " || char === "\t" || char === "\r" || char === "\n") {
        if (char === "\n") {
          this.line++;
          this.column = 1;
        } else {
          this.column++;
        }
        this.position++;
      } else {
        break;
      }
    }
  }

  match(str) {
    return this.code.substring(this.position, this.position + str.length) === str;
  }

  consume(str) {
    if (this.match(str)) {
      this.position += str.length;
      this.column += str.length;
      return true;
    }
    return false;
  }

  peekWord() {
    const saved = this.position;
    const word = this.readIdentifier();
    this.position = saved;
    return word;
  }

  readIdentifier() {
    const start = this.position;
    while (this.position < this.code.length) {
      const char = this.code[this.position];
      if (/[a-zA-Z0-9_$]/.test(char)) {
        this.position++;
      } else {
        break;
      }
    }
    return this.code.substring(start, this.position);
  }

  scanDefault() {
    const char = this.code[this.position];
    this.position++;
    this.column++;
    
    return {
      type: "DEFAULT",
      value: char,
      start: this.position - 1,
      end: this.position,
      line: this.line,
      column: this.column - 1
    };
  }
}

module.exports = ScalaPhaseC_Tokenizer;

/**
 * RUST PHASE C TOKENIZER
 * Extends tokenizer with Rust-specific Phase C features:
 * - Trait bounds (<T: Trait>, where clauses)
 * - Lifetime annotations ('a syntax, lifetime constraints)
 * - Macro system (!, macro_rules!, declarative macros)
 * - Pattern matching (match, if let, destructuring)
 * - Ownership/borrowing (&, &mut, move semantics)
 * - Unsafe blocks and raw pointers
 * 
 * Lines: 290
 */

const AbstractPhaseCtokenizer = require("../framework/abstract_tokenizer");

class RustPhaseC_Tokenizer extends AbstractPhaseCtokenizer {
  constructor(config = {}) {
    super({
      language: "Rust",
      ...config
    });

    // Rust-specific Phase C keywords
    this.rustKeywords = {
      traits: [
        "trait", "impl", "dyn", "Self", "self",
        "where", "for", "unsafe", "async", "await"
      ],
      ownership: [
        "move", "ref", "mut", "const", "static",
        "owned", "borrowed", "mutable_borrow", "immutable_borrow"
      ],
      patterns: [
        "match", "if", "let", "else", "arm",
        "pattern", "guard", "refutable", "irrefutable"
      ],
      types: [
        "fn", "struct", "enum", "union", "type",
        "as", "Generic", "Trait", "impl", "dyn"
      ],
      macros: [
        "macro_rules", "macro", "compile_time", "runtime",
        "println", "vec", "assert", "panic", "unwrap"
      ],
      lifetimes: [
        "lifetime", "outlives", "elidable", "static",
        "reference", "borrow_checker", "lifetime_elision"
      ]
    };

    // Rust-specific operators and symbols
    this.rustOperators = {
      lifetime: "'",
      genericOpen: "<",
      genericClose: ">",
      traitBound: ":",
      multiTraitBound: "+",
      whereKeyword: "where",
      dereference: "*",
      reference: "&",
      mutableRef: "&mut",
      macroInvoke: "!",
      arrow: "->",
      fatArrow: "=>",
      scopeResolution: "::",
      fieldAccess: ".",
      methodCall: "()",
      turbofish: "::<"
    };

    this.tokenMetrics = {
      traitBoundsCount: 0,
      lifetimeAnnotationsCount: 0,
      macroInvocationsCount: 0,
      patternMatchCount: 0,
      ownershipMarkerCount: 0,
      genericParameterCount: 0
    };
  }

  /**
   * RUST-SPECIFIC TOKENIZATION
   * Extends base tokenization with Rust features
   */
  tokenize(sourceCode) {
    const startTime = performance.now();
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    this.tokenMetrics = {
      traitBoundsCount: 0,
      lifetimeAnnotationsCount: 0,
      macroInvocationsCount: 0,
      patternMatchCount: 0,
      ownershipMarkerCount: 0,
      genericParameterCount: 0
    };

    if (!sourceCode || sourceCode.length === 0) {
      return [];
    }

    try {
      let iterationCount = 0;
      const maxIterations = sourceCode.length * 2;

      while (this.position < sourceCode.length && iterationCount < maxIterations) {
        iterationCount++;

        // Skip whitespace
        if (this.isWhitespace(sourceCode[this.position])) {
          this.skipWhitespace(sourceCode);
          continue;
        }

        // Skip comments
        if (this.isCommentStart(sourceCode)) {
          this.skipComment(sourceCode);
          continue;
        }

        // Rust-specific: Lifetime annotation ('a, 'static)
        if (this.isLifetimeStart(sourceCode)) {
          this.tokenizeLifetime(sourceCode);
          this.tokenMetrics.lifetimeAnnotationsCount++;
          continue;
        }

        // Rust-specific: Macro invocation (println!, vec!, macro_rules!)
        if (this.isMacroInvocation(sourceCode)) {
          this.tokenizeMacroInvocation(sourceCode);
          this.tokenMetrics.macroInvocationsCount++;
          continue;
        }

        // Rust-specific: Pattern matching (match, if let)
        if (this.isPatternMatchingStart(sourceCode)) {
          this.tokenizePatternMatching(sourceCode);
          this.tokenMetrics.patternMatchCount++;
          continue;
        }

        // Rust-specific: Trait bounds (T: Trait, where T: Trait)
        if (this.isTraitBoundStart(sourceCode)) {
          this.tokenizeTraitBound(sourceCode);
          this.tokenMetrics.traitBoundsCount++;
          continue;
        }

        // Rust-specific: Ownership markers (&, &mut, move)
        if (this.isOwnershipMarker(sourceCode)) {
          this.tokenizeOwnershipMarker(sourceCode);
          this.tokenMetrics.ownershipMarkerCount++;
          continue;
        }

        // Rust-specific: Generic parameters (<T>, <'a>)
        if (this.isGenericParameterStart(sourceCode)) {
          this.tokenizeGenericParameter(sourceCode);
          this.tokenMetrics.genericParameterCount++;
          continue;
        }

        // Standard tokenization
        this.tokenizeStandard(sourceCode);
      }

      if (iterationCount >= maxIterations) {
        this.profiling.errors.push(`Tokenization iteration limit reached at position ${this.position}`);
      }

      this.profiling.tokenizeTime = performance.now() - startTime;
      this.profiling.tokenCount = this.tokens.length;

      return this.tokens;
    } catch (error) {
      this.profiling.errors.push(`Tokenization error: ${error.message}`);
      throw new Error(`Rust tokenization failed at line ${this.line}, col ${this.column}: ${error.message}`);
    }
  }

  /**
   * LIFETIME ANNOTATION TOKENIZATION
   * Detects and tokenizes 'a, 'static, etc.
   */
  tokenizeLifetime(sourceCode) {
    const lifetimeToken = {
      type: "LIFETIME",
      start: this.position,
      line: this.line,
      column: this.column,
      value: "'",
      name: ""
    };

    this.position++; // consume '
    this.column++;

    // Collect lifetime name (a-z, A-Z, _)
    while (this.position < sourceCode.length && /[a-zA-Z_]/.test(sourceCode[this.position])) {
      lifetimeToken.value += sourceCode[this.position];
      lifetimeToken.name += sourceCode[this.position];
      this.position++;
      this.column++;
    }

    this.tokens.push(lifetimeToken);
  }

  /**
   * MACRO INVOCATION TOKENIZATION
   * Detects println!, vec!, macro_rules!, etc.
   */
  tokenizeMacroInvocation(sourceCode) {
    const macroToken = {
      type: "MACRO_INVOCATION",
      start: this.position,
      line: this.line,
      column: this.column,
      value: "",
      macroName: "",
      category: "invocation"
    };

    // Check if starts with keyword like "macro_rules"
    if (sourceCode.substr(this.position, 11) === "macro_rules") {
      macroToken.value = "macro_rules";
      macroToken.macroName = "macro_rules";
      macroToken.category = "definition";
      this.position += 11;
      this.column += 11;
    } else {
      // Collect macro name
      while (this.position < sourceCode.length && /[a-zA-Z_]/.test(sourceCode[this.position])) {
        macroToken.value += sourceCode[this.position];
        macroToken.macroName += sourceCode[this.position];
        this.position++;
        this.column++;
      }

      // Must be followed by !
      if (this.position < sourceCode.length && sourceCode[this.position] === "!") {
        macroToken.value += "!";
        this.position++;
        this.column++;
      }
    }

    this.tokens.push(macroToken);
  }

  /**
   * PATTERN MATCHING TOKENIZATION
   * Detects match, if let, patterns
   */
  tokenizePatternMatching(sourceCode) {
    const patternToken = {
      type: "PATTERN_KEYWORD",
      start: this.position,
      line: this.line,
      column: this.column,
      value: "",
      keyword: ""
    };

    // Match "match"
    if (sourceCode.substr(this.position, 5) === "match") {
      patternToken.value = "match";
      patternToken.keyword = "match";
      this.position += 5;
      this.column += 5;
    }
    // Match "if"
    else if (sourceCode.substr(this.position, 2) === "if") {
      patternToken.value = "if";
      patternToken.keyword = "if";
      this.position += 2;
      this.column += 2;
    }
    // Match "let"
    else if (sourceCode.substr(this.position, 3) === "let") {
      patternToken.value = "let";
      patternToken.keyword = "let";
      this.position += 3;
      this.column += 3;
    }

    this.tokens.push(patternToken);
  }

  /**
   * TRAIT BOUND TOKENIZATION
   * Detects T: Trait syntax and where clauses
   */
  tokenizeTraitBound(sourceCode) {
    const traitToken = {
      type: "TRAIT_BOUND",
      start: this.position,
      line: this.line,
      column: this.column,
      value: ":",
      hasWhere: false,
      bounds: []
    };

    // Match "where"
    if (sourceCode.substr(this.position, 5) === "where") {
      traitToken.value = "where";
      traitToken.hasWhere = true;
      this.position += 5;
      this.column += 5;
    }
    // Match "trait"
    else if (sourceCode.substr(this.position, 5) === "trait") {
      traitToken.value = "trait";
      this.position += 5;
      this.column += 5;
    }
    // Match bare ':'
    else if (sourceCode[this.position] === ":") {
      this.position++;
      this.column++;

      // Collect trait bounds until we hit something else
      let boundCount = 0;
      while (this.position < sourceCode.length && boundCount < 50) {
        const ch = sourceCode[this.position];
        
        // Collect trait name
        if (/[a-zA-Z_]/.test(ch)) {
          let traitName = "";
          while (this.position < sourceCode.length && /[a-zA-Z0-9_]/.test(sourceCode[this.position])) {
            traitName += sourceCode[this.position];
            this.position++;
            this.column++;
          }
          traitToken.bounds.push(traitName);
        } else if (ch === "+") {
          // Separator between traits
          this.position++;
          this.column++;
        } else if (ch === "," || ch === ">" || ch === "{" || ch === "}" || ch === ")") {
          // End of bounds
          break;
        } else {
          this.position++;
          this.column++;
        }
        
        boundCount++;
      }
    }

    this.tokens.push(traitToken);
  }

  /**
   * OWNERSHIP MARKER TOKENIZATION
   * Detects &, &mut, move
   */
  tokenizeOwnershipMarker(sourceCode) {
    const ownershipToken = {
      type: "OWNERSHIP_MARKER",
      start: this.position,
      line: this.line,
      column: this.column,
      value: "",
      kind: "reference"
    };

    // Match "&mut"
    if (sourceCode.substr(this.position, 4) === "&mut") {
      ownershipToken.value = "&mut";
      ownershipToken.kind = "mutable_borrow";
      this.position += 4;
      this.column += 4;
    }
    // Match "&"
    else if (sourceCode[this.position] === "&") {
      ownershipToken.value = "&";
      ownershipToken.kind = "immutable_borrow";
      this.position++;
      this.column++;
    }
    // Match "*" (dereference)
    else if (sourceCode[this.position] === "*") {
      ownershipToken.value = "*";
      ownershipToken.kind = "dereference";
      this.position++;
      this.column++;
    }
    // Match "move"
    else if (sourceCode.substr(this.position, 4) === "move") {
      ownershipToken.value = "move";
      ownershipToken.kind = "move_semantics";
      this.position += 4;
      this.column += 4;
    }

    this.tokens.push(ownershipToken);
  }

  /**
   * GENERIC PARAMETER TOKENIZATION
   * Detects <T>, <'a>, <T: Trait>
   */
  tokenizeGenericParameter(sourceCode) {
    const genericToken = {
      type: "GENERIC_PARAMETER_BRACKET",
      start: this.position,
      line: this.line,
      column: this.column,
      value: "<",
      isTurbofish: false
    };

    // Check for "::<" (turbofish syntax)
    if (this.position > 0 && sourceCode[this.position - 1] === ":" && sourceCode[this.position] === "<") {
      genericToken.isTurbofish = true;
    }

    this.position++;
    this.column++;
    this.tokens.push(genericToken);
  }

  /**
   * HELPER: Check if lifetime starts
   */
  isLifetimeStart(sourceCode) {
    if (sourceCode[this.position] !== "'") return false;
    // Lifetime must be followed by letter or underscore
    if (this.position + 1 >= sourceCode.length) return false;
    const nextChar = sourceCode[this.position + 1];
    return /[a-zA-Z_]/.test(nextChar);
  }

  /**
   * HELPER: Check if macro invocation starts
   */
  isMacroInvocation(sourceCode) {
    // macro_rules
    if (sourceCode.substr(this.position, 11) === "macro_rules") return true;
    
    // Check for identifier followed by !
    if (/[a-zA-Z_]/.test(sourceCode[this.position])) {
      let pos = this.position;
      while (pos < sourceCode.length && /[a-zA-Z0-9_]/.test(sourceCode[pos])) {
        pos++;
      }
      if (pos < sourceCode.length && sourceCode[pos] === "!") {
        return true;
      }
    }
    return false;
  }

  /**
   * HELPER: Check if pattern matching starts
   */
  isPatternMatchingStart(sourceCode) {
    if (sourceCode.substr(this.position, 5) === "match") return true;
    if (sourceCode.substr(this.position, 3) === "let") return true;
    if (sourceCode.substr(this.position, 2) === "if" && sourceCode.substr(this.position + 2, 4) === " let") return true;
    return false;
  }

  /**
   * HELPER: Check if trait bound starts
   */
  isTraitBoundStart(sourceCode) {
    if (sourceCode.substr(this.position, 5) === "where") return true;
    if (sourceCode.substr(this.position, 5) === "trait") return true;
    // Check for `: Trait` pattern (trait bound in generics)
    if (sourceCode[this.position] === ":" && this.position > 0) {
      const prevChar = sourceCode[this.position - 1];
      // If preceded by identifier or >, we might be in a trait bound context
      if (/[a-zA-Z0-9_>]/.test(prevChar)) {
        return true;
      }
    }
    return false;
  }

  /**
   * HELPER: Check if ownership marker starts
   */
  isOwnershipMarker(sourceCode) {
    if (sourceCode.substr(this.position, 4) === "&mut") return true;
    if (sourceCode[this.position] === "&") return true;
    if (sourceCode[this.position] === "*") return true;
    if (sourceCode.substr(this.position, 4) === "move") return true;
    return false;
  }

  /**
   * HELPER: Check if generic parameter bracket starts
   */
  isGenericParameterStart(sourceCode) {
    if (sourceCode[this.position] === "<") {
      // Only treat as generic if it's actually preceded by a valid context
      // Avoid matching comparison operators
      if (this.position > 0 && /[a-zA-Z0-9_)]/.test(sourceCode[this.position - 1])) {
        return true; // Function or type name before <
      }
      if (this.position > 1 && sourceCode.substr(this.position - 2, 2) === "::") {
        return true; // Turbofish syntax ::< 
      }
    }
    return false;
  }

  /**
   * HELPER: Skip whitespace
   */
  skipWhitespace(sourceCode) {
    while (this.position < sourceCode.length && this.isWhitespace(sourceCode[this.position])) {
      if (sourceCode[this.position] === "\n") {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.position++;
    }
  }

  /**
   * HELPER: Check if whitespace
   */
  isWhitespace(char) {
    return /\s/.test(char);
  }

  /**
   * HELPER: Check if comment starts
   */
  isCommentStart(sourceCode) {
    return sourceCode.substr(this.position, 2) === "//" ||
           sourceCode.substr(this.position, 2) === "/*";
  }

  /**
   * HELPER: Skip comment
   */
  skipComment(sourceCode) {
    if (sourceCode.substr(this.position, 2) === "//") {
      while (this.position < sourceCode.length && sourceCode[this.position] !== "\n") {
        this.position++;
      }
    } else if (sourceCode.substr(this.position, 2) === "/*") {
      this.position += 2;
      while (this.position < sourceCode.length - 1) {
        if (sourceCode.substr(this.position, 2) === "*/") {
          this.position += 2;
          break;
        }
        if (sourceCode[this.position] === "\n") {
          this.line++;
          this.column = 1;
        } else {
          this.column++;
        }
        this.position++;
      }
    }
  }

  /**
   * HELPER: Tokenize standard tokens
   */
  tokenizeStandard(sourceCode) {
    const token = {
      type: "OTHER",
      start: this.position,
      line: this.line,
      column: this.column,
      value: ""
    };

    // Collect token
    if (/[a-zA-Z_]/.test(sourceCode[this.position])) {
      token.type = "IDENTIFIER";
      while (this.position < sourceCode.length && /[a-zA-Z0-9_]/.test(sourceCode[this.position])) {
        token.value += sourceCode[this.position];
        this.position++;
        this.column++;
      }
    } else if (/[0-9]/.test(sourceCode[this.position])) {
      token.type = "NUMBER";
      while (this.position < sourceCode.length && /[0-9.]/.test(sourceCode[this.position])) {
        token.value += sourceCode[this.position];
        this.position++;
        this.column++;
      }
    } else {
      token.value = sourceCode[this.position];
      this.position++;
      this.column++;
    }

    this.tokens.push(token);
  }

  /**
   * HELPER: Record keyword match
   */
  recordKeywordMatch(keyword) {
    if (!this.profiling.keywordMatches[keyword]) {
      this.profiling.keywordMatches[keyword] = 0;
    }
    this.profiling.keywordMatches[keyword]++;
  }

  /**
   * GET METRICS
   */
  getMetrics() {
    return {
      tokenCount: this.tokens.length,
      tokenizeTime: this.profiling.tokenizeTime,
      features: this.tokenMetrics,
      errors: this.profiling.errors
    };
  }
}

module.exports = RustPhaseC_Tokenizer;

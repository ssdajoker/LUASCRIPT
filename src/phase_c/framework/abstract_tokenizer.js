/**
 * PHASE C ABSTRACT TOKENIZER
 * Extends existing tokenizers with Phase C keyword recognition
 * 
 * Features:
 * - Macro tokens and annotation recognition
 * - Concurrency keywords (goroutines, async, channels, etc.)
 * - DSL syntax support
 * - Advanced type system tokens
 * - Error handling for unrecognized Phase C features
 * - Performance profiling hooks
 * 
 * Lines: 180
 */

class AbstractPhaseCtokenizer {
  constructor(config = {}) {
    this.config = {
      language: config.language || "generic",
      enableMacros: config.enableMacros !== false,
      enableConcurrency: config.enableConcurrency !== false,
      enableDSL: config.enableDSL !== false,
      performanceProfiling: config.performanceProfiling || false,
      maxTokenCount: config.maxTokenCount || 100000,
      ...config
    };
    
    this.tokens = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.profiling = {
      tokenizeTime: 0,
      tokenCount: 0,
      keywordMatches: {},
      errors: []
    };
    
    // Phase C keyword mappings by category
    this.phaseC_Keywords = {
      macros: ["macro", "macro_rules", "@", "#[", "@@", "pragma"],
      concurrency: [
        "go", "async", "await", "goroutine", "channel", "chan", "select",
        "coroutine", "Promise", "Task", "thread", "spawn", "par", "parallel",
        "sync", "lock", "mutex", "semaphore", "barrier", "atomic", "volatile"
      ],
      dsl: ["dsl", "grammar", "rule", "syntax", "operator", "precedence"],
      typeSystem: [
        "trait", "where", "bound", "constraint", "lifetime", "borrow", "own",
        "generic", "typeof", "keyof", "infer", "conditional", "mapped",
        "interface", "abstract", "sealed", "enum"
      ],
      errorHandling: ["try", "catch", "finally", "throw", "defer", "error", "except"]
    };
  }

  /**
   * PHASE C TOKENIZATION
   * Extends base tokenization with Phase C feature detection
   */
  tokenize(sourceCode) {
    const startTime = performance.now();
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    
    if (!sourceCode || sourceCode.length === 0) {
      return [];
    }

    try {
      while (this.position < sourceCode.length) {
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

        // Check for macro tokens (Phase C)
        if (this.enableMacros && this.isMacroStart(sourceCode)) {
          this.tokenizeMacro(sourceCode);
          continue;
        }

        // Check for concurrency keywords (Phase C)
        if (this.enableConcurrency && this.isConcurrencyKeyword(sourceCode)) {
          this.tokenizeConcurrency(sourceCode);
          continue;
        }

        // Check for DSL syntax (Phase C)
        if (this.enableDSL && this.isDSLStart(sourceCode)) {
          this.tokenizeDSL(sourceCode);
          continue;
        }

        // Tokenize standard tokens
        this.tokenizeStandard(sourceCode);
      }

      this.profiling.tokenizeTime = performance.now() - startTime;
      this.profiling.tokenCount = this.tokens.length;

      if (this.tokens.length > this.config.maxTokenCount) {
        this.profiling.errors.push(
          `Token count (${this.tokens.length}) exceeds maximum (${this.config.maxTokenCount})`
        );
      }

      return this.tokens;
    } catch (error) {
      this.profiling.errors.push(`Tokenization error: ${error.message}`);
      throw new Error(`Tokenization failed at line ${this.line}, col ${this.column}: ${error.message}`);
    }
  }

  /**
   * MACRO TOKEN RECOGNITION
   * Detects and tokenizes macro definitions and invocations
   */
  tokenizeMacro(sourceCode) {
    const macroToken = {
      type: "MACRO",
      start: this.position,
      line: this.line,
      column: this.column,
      value: "",
      category: "unknown"
    };

    // Detect macro_rules! syntax
    if (sourceCode.substr(this.position, 11) === "macro_rules") {
      macroToken.value = "macro_rules";
      macroToken.category = "definition";
      this.position += 11;
      this.column += 11;
      this.recordKeywordMatch("macro_rules");
    }
    // Detect @decorator syntax
    else if (sourceCode[this.position] === "@") {
      macroToken.value = "@";
      macroToken.category = "decorator";
      this.position++;
      this.column++;
      
      // Collect decorator name
      while (this.position < sourceCode.length && /[a-zA-Z0-9_]/.test(sourceCode[this.position])) {
        macroToken.value += sourceCode[this.position];
        this.position++;
        this.column++;
      }
      this.recordKeywordMatch(macroToken.value);
    }
    // Detect #[attribute] syntax
    else if (sourceCode.substr(this.position, 2) === "#[") {
      macroToken.value = "#[";
      macroToken.category = "attribute";
      this.position += 2;
      this.column += 2;
      
      // Collect attribute name
      while (this.position < sourceCode.length && sourceCode[this.position] !== "]") {
        macroToken.value += sourceCode[this.position];
        this.position++;
        this.column++;
      }
      if (sourceCode[this.position] === "]") {
        macroToken.value += "]";
        this.position++;
        this.column++;
      }
      this.recordKeywordMatch("attribute");
    }

    this.tokens.push(macroToken);
  }

  /**
   * CONCURRENCY TOKEN RECOGNITION
   * Detects goroutines, channels, async/await, etc.
   */
  tokenizeConcurrency(sourceCode) {
    const concurrencyToken = {
      type: "CONCURRENCY",
      start: this.position,
      line: this.line,
      column: this.column,
      value: "",
      keyword: ""
    };

    // Match concurrency keywords
    for (const keyword of this.phaseC_keywords.concurrency) {
      if (sourceCode.substr(this.position, keyword.length) === keyword) {
        concurrencyToken.value = keyword;
        concurrencyToken.keyword = keyword;
        this.position += keyword.length;
        this.column += keyword.length;
        this.recordKeywordMatch(keyword);
        this.tokens.push(concurrencyToken);
        return;
      }
    }

    // Check for channel operators <- and ->
    if (sourceCode[this.position] === "<" && sourceCode[this.position + 1] === "-") {
      concurrencyToken.type = "CHANNEL_OP";
      concurrencyToken.value = "<-";
      concurrencyToken.keyword = "receive";
      this.position += 2;
      this.column += 2;
      this.recordKeywordMatch("channel_receive");
      this.tokens.push(concurrencyToken);
      return;
    }

    if (sourceCode[this.position] === "-" && sourceCode[this.position + 1] === ">") {
      concurrencyToken.type = "CHANNEL_OP";
      concurrencyToken.value = "->";
      concurrencyToken.keyword = "send";
      this.position += 2;
      this.column += 2;
      this.recordKeywordMatch("channel_send");
      this.tokens.push(concurrencyToken);
    }
  }

  /**
   * DSL TOKEN RECOGNITION
   * Detects DSL keywords and syntax
   */
  tokenizeDSL(sourceCode) {
    const dslToken = {
      type: "DSL",
      start: this.position,
      line: this.line,
      column: this.column,
      value: ""
    };

    // Match DSL keywords
    for (const keyword of this.phaseC_keywords.dsl) {
      if (sourceCode.substr(this.position, keyword.length) === keyword &&
          !this.isIdentifierContinuation(sourceCode[this.position + keyword.length])) {
        dslToken.value = keyword;
        this.position += keyword.length;
        this.column += keyword.length;
        this.recordKeywordMatch(keyword);
        this.tokens.push(dslToken);
        return;
      }
    }
  }

  /**
   * STANDARD TOKEN RECOGNITION
   * Fallback for non-Phase C tokens
   */
  tokenizeStandard(sourceCode) {
    const char = sourceCode[this.position];

    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(char)) {
      const token = {
        type: "IDENTIFIER",
        start: this.position,
        line: this.line,
        column: this.column,
        value: ""
      };

      while (this.position < sourceCode.length && /[a-zA-Z0-9_$]/.test(sourceCode[this.position])) {
        token.value += sourceCode[this.position];
        this.position++;
        this.column++;
      }

      // Check if it's a type system keyword
      if (this.phaseC_keywords.typeSystem.includes(token.value)) {
        token.type = "TYPE_KEYWORD";
        this.recordKeywordMatch(token.value);
      }
      // Check if it's an error handling keyword
      else if (this.phaseC_keywords.errorHandling.includes(token.value)) {
        token.type = "ERROR_KEYWORD";
        this.recordKeywordMatch(token.value);
      }

      this.tokens.push(token);
      return;
    }

    // Numbers
    if (/[0-9]/.test(char)) {
      const token = {
        type: "NUMBER",
        start: this.position,
        line: this.line,
        column: this.column,
        value: ""
      };

      while (this.position < sourceCode.length && /[0-9.]/.test(sourceCode[this.position])) {
        token.value += sourceCode[this.position];
        this.position++;
        this.column++;
      }

      this.tokens.push(token);
      return;
    }

    // Strings
    if (char === "\"" || char === "'" || char === "`") {
      const quote = char;
      const token = {
        type: "STRING",
        start: this.position,
        line: this.line,
        column: this.column,
        value: quote
      };

      this.position++;
      this.column++;

      while (this.position < sourceCode.length && sourceCode[this.position] !== quote) {
        if (sourceCode[this.position] === "\\") {
          token.value += sourceCode[this.position];
          this.position++;
          this.column++;
        }
        token.value += sourceCode[this.position];
        this.position++;
        this.column++;
      }

      if (sourceCode[this.position] === quote) {
        token.value += quote;
        this.position++;
        this.column++;
      }

      this.tokens.push(token);
      return;
    }

    // Operators and punctuation
    const token = {
      type: "OPERATOR",
      start: this.position,
      line: this.line,
      column: this.column,
      value: char
    };

    this.position++;
    this.column++;

    // Track two-character operators
    if (this.position < sourceCode.length) {
      const twoChar = token.value + sourceCode[this.position];
      if (["==", "!=", "<=", ">=", "&&", "||", ":=", "=>", "::"].includes(twoChar)) {
        token.value = twoChar;
        this.position++;
        this.column++;
      }
    }

    this.tokens.push(token);
  }

  // HELPER METHODS

  isWhitespace(char) {
    return /\s/.test(char);
  }

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

  isCommentStart(sourceCode) {
    return sourceCode.substr(this.position, 2) === "//" ||
           sourceCode.substr(this.position, 2) === "/*" ||
           sourceCode[this.position] === "#";
  }

  skipComment(sourceCode) {
    if (sourceCode.substr(this.position, 2) === "//") {
      while (this.position < sourceCode.length && sourceCode[this.position] !== "\n") {
        this.position++;
        this.column++;
      }
    } else if (sourceCode.substr(this.position, 2) === "/*") {
      this.position += 2;
      this.column += 2;
      while (this.position < sourceCode.length - 1) {
        if (sourceCode.substr(this.position, 2) === "*/") {
          this.position += 2;
          this.column += 2;
          return;
        }
        if (sourceCode[this.position] === "\n") {
          this.line++;
          this.column = 1;
        } else {
          this.column++;
        }
        this.position++;
      }
    } else if (sourceCode[this.position] === "#") {
      while (this.position < sourceCode.length && sourceCode[this.position] !== "\n") {
        this.position++;
        this.column++;
      }
    }
  }

  isMacroStart(sourceCode) {
    return sourceCode[this.position] === "@" ||
           sourceCode.substr(this.position, 2) === "#[" ||
           sourceCode.substr(this.position, 11) === "macro_rules";
  }

  isConcurrencyKeyword(sourceCode) {
    for (const keyword of this.phaseC_Keywords.concurrency) {
      if (sourceCode.substr(this.position, keyword.length) === keyword) {
        return true;
      }
    }
    return sourceCode.substr(this.position, 2) === "<-" ||
           sourceCode.substr(this.position, 2) === "->";
  }

  isDSLStart(sourceCode) {
    for (const keyword of this.phaseC_Keywords.dsl) {
      if (sourceCode.substr(this.position, keyword.length) === keyword) {
        return true;
      }
    }
    return false;
  }

  isIdentifierContinuation(char) {
    return /[a-zA-Z0-9_$]/.test(char);
  }

  recordKeywordMatch(keyword) {
    this.profiling.keywordMatches[keyword] = (this.profiling.keywordMatches[keyword] || 0) + 1;
  }

  getProfilingReport() {
    return {
      tokenizeTime: `${this.profiling.tokenizeTime.toFixed(2)}ms`,
      tokenCount: this.profiling.tokenCount,
      keywordMatches: this.profiling.keywordMatches,
      errors: this.profiling.errors,
      averageTokenTime: `${(this.profiling.tokenizeTime / this.profiling.tokenCount).toFixed(4)}ms`
    };
  }
}

module.exports = AbstractPhaseCtokenizer;

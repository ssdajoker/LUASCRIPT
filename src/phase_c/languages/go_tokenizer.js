/**
 * GO PHASE C TOKENIZER
 * Extends tokenizer with Go-specific Phase C features:
 * - Goroutines (go keyword, channel ops)
 * - Channels (<- operator, channel creation)
 * - Select statements (case/default)
 * - Error handling (err interface)
 * - Interfaces (interface{}, type assertion)
 * - DSL support (template syntax)
 * 
 * Lines: 280
 */

const AbstractPhaseCtokenizer = require("../framework/abstract_tokenizer");

class GoPhaseC_Tokenizer extends AbstractPhaseCtokenizer {
  constructor(config = {}) {
    super({
      language: "Go",
      ...config
    });

    // Go-specific Phase C keywords
    this.goKeywords = {
      concurrency: [
        "go", "chan", "select", "case", "default",
        "send", "receive", "close",
        "sync", "WaitGroup", "Mutex", "RWMutex",
        "Cond", "Semaphore", "Barrier"
      ],
      errorHandling: [
        "error", "nil", "defer", "panic", "recover",
        "fmt.Errorf", "errors.Is", "errors.As", "errors.Wrap"
      ],
      interfaces: [
        "interface", "Reader", "Writer", "ReadWriter",
        "Closer", "Seeker", "implements", "satisfies"
      ],
      types: [
        "interface{}", "any", "struct", "type",
        "func", "map", "slice", "array", "chan"
      ],
      builders: [
        "Builder", "With", "Build", "New",
        "functional", "options", "chaining"
      ]
    };

    // Go-specific operators
    this.goOperators = {
      channelSend: "<-",
      channelReceive: "<-",
      methodReceiver: ".",
      typeAssertion: ".",
      methodCall: "()",
      fieldAccess: ".",
      variadic: "...",
      blank: "_"
    };

    this.tokenMetrics = {
      goroutineCount: 0,
      channelOperations: 0,
      selectStatements: 0,
      errorHandlers: 0,
      interfaceDefinitions: 0,
      builderPatterns: 0
    };
  }

  /**
   * GO-SPECIFIC TOKENIZATION
   * Extends base tokenization with Go features
   */
  tokenize(sourceCode) {
    const startTime = performance.now();
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    this.tokenMetrics = {
      goroutineCount: 0,
      channelOperations: 0,
      selectStatements: 0,
      errorHandlers: 0,
      interfaceDefinitions: 0,
      builderPatterns: 0
    };

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

        // Go-specific: Goroutine detection
        if (this.isGoroutineStart(sourceCode)) {
          this.tokenizeGoroutine(sourceCode);
          this.tokenMetrics.goroutineCount++;
          continue;
        }

        // Go-specific: Channel operations
        if (this.isChannelOperator(sourceCode)) {
          this.tokenizeChannelOp(sourceCode);
          this.tokenMetrics.channelOperations++;
          continue;
        }

        // Go-specific: Select statement
        if (this.isSelectStart(sourceCode)) {
          this.tokenizeSelect(sourceCode);
          this.tokenMetrics.selectStatements++;
          continue;
        }

        // Go-specific: Error handling
        if (this.isErrorHandling(sourceCode)) {
          this.tokenizeErrorHandling(sourceCode);
          this.tokenMetrics.errorHandlers++;
          continue;
        }

        // Go-specific: Interface definitions
        if (this.isInterfaceStart(sourceCode)) {
          this.tokenizeInterface(sourceCode);
          this.tokenMetrics.interfaceDefinitions++;
          continue;
        }

        // Go-specific: Builder pattern
        if (this.isBuilderPattern(sourceCode)) {
          this.tokenizeBuilder(sourceCode);
          this.tokenMetrics.builderPatterns++;
          continue;
        }

        // Standard tokenization
        this.tokenizeStandard(sourceCode);
      }

      this.profiling.tokenizeTime = performance.now() - startTime;
      this.profiling.tokenCount = this.tokens.length;

      return this.tokens;
    } catch (error) {
      this.profiling.errors.push(`Go tokenization error: ${error.message}`);
      throw new Error(`Go tokenization failed at line ${this.line}, col ${this.column}: ${error.message}`);
    }
  }

  /**
   * GOROUTINE DETECTION
   * Identifies: go functionCall()
   */
  tokenizeGoroutine(sourceCode) {
    const goroutineToken = {
      type: "GO_KEYWORD",
      start: this.position,
      line: this.line,
      column: this.column,
      value: "go"
    };

    this.position += 2; // 'go'
    this.column += 2;

    // Skip whitespace
    while (this.position < sourceCode.length && this.isWhitespace(sourceCode[this.position])) {
      this.skipWhitespace(sourceCode);
    }

    this.tokens.push(goroutineToken);
  }

  /**
   * CHANNEL OPERATOR DETECTION
   * Identifies: <- for both send and receive
   */
  tokenizeChannelOp(sourceCode) {
    const channelOpToken = {
      type: "CHANNEL_OP",
      start: this.position,
      line: this.line,
      column: this.column,
      value: "<-",
      direction: "receive"
    };

    // Check if it's <-chan (receive-only channel type)
    if (sourceCode.substr(this.position + 2, 4) === "chan") {
      channelOpToken.direction = "receive_only";
      channelOpToken.value = "<-chan";
      this.position += 6;
      this.column += 6;
    }
    // Check if it's chan<- (send-only channel type)
    else if (sourceCode.substr(this.position - 4, 4) === "chan") {
      channelOpToken.direction = "send_only";
      channelOpToken.value = "chan<-";
      this.position += 2;
      this.column += 2;
    }
    // Standard receive operation
    else {
      this.position += 2;
      this.column += 2;
    }

    this.tokens.push(channelOpToken);
  }

  /**
   * SELECT STATEMENT DETECTION
   * Identifies: select { case ... }
   */
  tokenizeSelect(sourceCode) {
    const selectToken = {
      type: "SELECT_KEYWORD",
      start: this.position,
      line: this.line,
      column: this.column,
      value: "select"
    };

    this.position += 6; // 'select'
    this.column += 6;

    this.tokens.push(selectToken);

    // Look for opening brace
    while (this.position < sourceCode.length && 
           (this.isWhitespace(sourceCode[this.position]) || sourceCode[this.position] !== "{")) {
      if (sourceCode[this.position] === "{") {
        break;
      }
      this.position++;
      this.column++;
    }
  }

  /**
   * ERROR HANDLING DETECTION
   * Identifies: if err != nil, errors.Is(), errors.As(), defer cleanup
   */
  tokenizeErrorHandling(sourceCode) {
    const errorToken = {
      type: "ERROR_HANDLING",
      start: this.position,
      line: this.line,
      column: this.column,
      value: "",
      category: ""
    };

    // Detect 'defer' keyword
    if (sourceCode.substr(this.position, 5) === "defer") {
      errorToken.value = "defer";
      errorToken.category = "defer";
      this.position += 5;
      this.column += 5;
    }
    // Detect error interface
    else if (sourceCode.substr(this.position, 5) === "error") {
      errorToken.value = "error";
      errorToken.category = "error_type";
      this.position += 5;
      this.column += 5;
    }
    // Detect errors.Is pattern
    else if (sourceCode.substr(this.position, 9) === "errors.Is") {
      errorToken.value = "errors.Is";
      errorToken.category = "error_check";
      this.position += 9;
      this.column += 9;
    }
    // Detect errors.As pattern
    else if (sourceCode.substr(this.position, 9) === "errors.As") {
      errorToken.value = "errors.As";
      errorToken.category = "error_extract";
      this.position += 9;
      this.column += 9;
    }

    this.tokens.push(errorToken);
  }

  /**
   * INTERFACE DEFINITION DETECTION
   * Identifies: type Reader interface { }, implicit satisfaction
   */
  tokenizeInterface(sourceCode) {
    const interfaceToken = {
      type: "INTERFACE_KEYWORD",
      start: this.position,
      line: this.line,
      column: this.column,
      value: "interface",
      category: "definition"
    };

    this.position += 9; // 'interface'
    this.column += 9;

    // Check for interface{} (empty interface)
    if (sourceCode[this.position] === "{") {
      interfaceToken.category = "empty_interface";
    }

    this.tokens.push(interfaceToken);
  }

  /**
   * BUILDER PATTERN DETECTION
   * Identifies: Method(arg).Method(arg).Build() patterns
   */
  tokenizeBuilder(sourceCode) {
    const builderToken = {
      type: "BUILDER_PATTERN",
      start: this.position,
      line: this.line,
      column: this.column,
      value: "Builder",
      category: "builder"
    };

    // Collect builder name if present
    while (this.position < sourceCode.length && /[a-zA-Z0-9_]/.test(sourceCode[this.position])) {
      builderToken.value += sourceCode[this.position];
      this.position++;
      this.column++;
    }

    this.tokens.push(builderToken);
  }

  // HELPER METHODS FOR GO DETECTION

  isGoroutineStart(sourceCode) {
    return sourceCode.substr(this.position, 2) === "go" &&
           !this.isIdentifierContinuation(sourceCode[this.position + 2]);
  }

  isChannelOperator(sourceCode) {
    return sourceCode.substr(this.position, 2) === "<-";
  }

  isSelectStart(sourceCode) {
    return sourceCode.substr(this.position, 6) === "select" &&
           !this.isIdentifierContinuation(sourceCode[this.position + 6]);
  }

  isErrorHandling(sourceCode) {
    return sourceCode.substr(this.position, 5) === "defer" ||
           sourceCode.substr(this.position, 5) === "error" ||
           sourceCode.substr(this.position, 9) === "errors.Is" ||
           sourceCode.substr(this.position, 9) === "errors.As";
  }

  isInterfaceStart(sourceCode) {
    return sourceCode.substr(this.position, 9) === "interface";
  }

  isBuilderPattern(sourceCode) {
    // Heuristic: look for Builder or With keywords followed by (
    const builderMatch = sourceCode.substr(this.position, 20).match(/^(Builder|With[A-Z])/);
    if (builderMatch) {
      // Verify followed by method call pattern
      const nextParen = sourceCode.indexOf("(", this.position + builderMatch[0].length);
      const nextDot = sourceCode.indexOf(".", this.position);
      return nextParen !== -1 && (nextDot === -1 || nextParen < nextDot);
    }
    return false;
  }

  isWhitespace(char) {
    return /\s/.test(char);
  }

  isCommentStart(sourceCode) {
    return sourceCode.substr(this.position, 2) === "//" ||
           sourceCode.substr(this.position, 2) === "/*";
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
    }
  }

  tokenizeStandard(sourceCode) {
    const char = sourceCode[this.position];

    // Identifiers and keywords
    if (/[a-zA-Z_]/.test(char)) {
      const token = {
        type: "IDENTIFIER",
        start: this.position,
        line: this.line,
        column: this.column,
        value: ""
      };

      while (this.position < sourceCode.length && /[a-zA-Z0-9_]/.test(sourceCode[this.position])) {
        token.value += sourceCode[this.position];
        this.position++;
        this.column++;
      }

      // Check if it's a Go keyword
      if (this.goKeywords.concurrency.includes(token.value)) {
        token.type = "GO_CONCURRENCY";
      } else if (this.goKeywords.errorHandling.includes(token.value)) {
        token.type = "GO_ERROR";
      } else if (this.goKeywords.interfaces.includes(token.value)) {
        token.type = "GO_INTERFACE";
      }

      this.tokens.push(token);
      return;
    }

    // Numbers
    if (/[0-9]/.test(char)) {
      const token = {
        type: "NUMBER",
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
    if (char === "\"" || char === "`") {
      const quote = char;
      const token = {
        type: "STRING",
        value: ""
      };
      this.position++;
      this.column++;
      while (this.position < sourceCode.length && sourceCode[this.position] !== quote) {
        token.value += sourceCode[this.position];
        this.position++;
        this.column++;
      }
      if (sourceCode[this.position] === quote) {
        this.position++;
        this.column++;
      }
      this.tokens.push(token);
      return;
    }

    // Operators
    const token = {
      type: "OPERATOR",
      value: char
    };
    this.position++;
    this.column++;
    this.tokens.push(token);
  }

  isIdentifierContinuation(char) {
    return /[a-zA-Z0-9_]/.test(char);
  }

  getMetrics() {
    return {
      ...this.profiling,
      goroutineCount: this.tokenMetrics.goroutineCount,
      channelOperations: this.tokenMetrics.channelOperations,
      selectStatements: this.tokenMetrics.selectStatements,
      errorHandlers: this.tokenMetrics.errorHandlers,
      interfaceDefinitions: this.tokenMetrics.interfaceDefinitions,
      builderPatterns: this.tokenMetrics.builderPatterns
    };
  }
}

module.exports = GoPhaseC_Tokenizer;

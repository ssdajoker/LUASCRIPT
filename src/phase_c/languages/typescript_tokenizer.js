/**
 * TYPESCRIPT PHASE C TOKENIZER
 * Extends tokenizer with TypeScript-specific Phase C features:
 * - Mapped types (readonly [K in keyof T]: T[K])
 * - Decorators (@Component, @Inject, @decorator)
 * - Generic constraints (<T extends string>)
 * - Union & intersection types (Type | Other, Type & Mixin)
 * - Module system (import/export)
 * - Async/await patterns
 * - Conditional types (T extends U ? X : Y)
 * 
 * Lines: 270
 */

const AbstractPhaseCtokenizer = require("../framework/abstract_tokenizer");

class TypeScriptPhaseC_Tokenizer extends AbstractPhaseCtokenizer {
  constructor(config = {}) {
    super({
      language: "TypeScript",
      ...config
    });

    // TypeScript-specific Phase C keywords
    this.typeScriptKeywords = {
      mapped: [
        "mapped", "readonly", "in", "keyof", "typeof", "infer",
        "type", "interface", "namespace", "module"
      ],
      decorators: [
        "decorator", "@", "Component", "Directive", "Pipe", "Injectable",
        "Inject", "Input", "Output", "HostListener", "ViewChild",
        "ContentChild", "HostBinding"
      ],
      generics: [
        "generic", "extends", "constraint", "default", "T", "K", "U",
        "V", "P", "R", "E"
      ],
      types: [
        "string", "number", "boolean", "symbol", "bigint", "void",
        "any", "unknown", "never", "object", "null", "undefined"
      ],
      unions: [
        "union", "intersection", "discriminated", "literal", "conditional"
      ],
      modules: [
        "import", "export", "from", "as", "namespace", "declare",
        "default", "named", "re-export"
      ],
      async: [
        "async", "await", "Promise", "resolve", "reject", "pending",
        "fulfilled", "rejected", "settled", "race", "all"
      ]
    };

    // TypeScript-specific operators and symbols
    this.typeScriptOperators = {
      decorator: "@",
      genericOpen: "<",
      genericClose: ">",
      typeAnnotation: ":",
      union: "|",
      intersection: "&",
      conditional: "?",
      nullishCoalesce: "??",
      optionalChain: "?.",
      typeof: "typeof",
      keyof: "keyof",
      infer: "infer",
      extends: "extends",
      readonly: "readonly",
      mappedIn: "in",
      as: "as",
      import: "import",
      export: "export",
      async: "async",
      await: "await"
    };

    this.tokenMetrics = {
      mappedTypeCount: 0,
      decoratorCount: 0,
      genericConstraintCount: 0,
      unionTypeCount: 0,
      intersectionTypeCount: 0,
      conditionalTypeCount: 0,
      importExportCount: 0,
      asyncAwaitCount: 0,
      decoratorMetadataCount: 0
    };
  }

  /**
   * MAIN TOKENIZATION
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
        if (this.isWhitespace(sourceCode[this.position])) {
          this.skipWhitespace(sourceCode);
          continue;
        }

        if (this.isCommentStart(sourceCode)) {
          this.skipComment(sourceCode);
          continue;
        }

        // Decorators
        if (sourceCode[this.position] === "@") {
          this.tokenizeDecorator(sourceCode);
          continue;
        }

        // Generic types
        if (sourceCode[this.position] === "<") {
          this.tokenizeGeneric(sourceCode);
          continue;
        }

        // Ternary/conditional operator
        if (sourceCode[this.position] === "?") {
          this.tokens.push({
            type: "CONDITIONAL_OPERATOR",
            value: "?",
            line: this.line,
            column: this.column
          });
          this.advance();
          continue;
        }

        // Union/Intersection
        if (sourceCode[this.position] === "|") {
          this.tokens.push({
            type: "UNION_OPERATOR",
            value: "|",
            line: this.line,
            column: this.column
          });
          this.advance();
          continue;
        }

        if (sourceCode[this.position] === "&") {
          this.tokens.push({
            type: "INTERSECTION_OPERATOR",
            value: "&",
            line: this.line,
            column: this.column
          });
          this.advance();
          continue;
        }

        // Keywords
        if (this.isIdentifierStart(sourceCode[this.position])) {
          this.tokenizeKeywordOrIdentifier(sourceCode);
          continue;
        }

        // Literals
        if (sourceCode[this.position] === "\"" || sourceCode[this.position] === "'") {
          this.tokenizeString(sourceCode);
          continue;
        }

        if (this.isDigit(sourceCode[this.position])) {
          this.tokenizeNumber(sourceCode);
          continue;
        }

        // Operators
        this.tokenizeOperator(sourceCode);
      }

      this.profiling.tokenizeTime = performance.now() - startTime;
      this.profiling.tokenCount = this.tokens.length;

      return this.tokens;
    } catch (error) {
      this.profiling.errors.push({
        message: error.message,
        position: this.position,
        line: this.line,
        column: this.column
      });
      return this.tokens;
    }
  }

  /**
   * TOKENIZE DECORATOR (@Component, @Inject, etc.)
   */
  tokenizeDecorator(sourceCode) {
    const startCol = this.column;
    this.advance(); // Skip @

    let decoratorName = "";
    while (this.position < sourceCode.length && this.isIdentifierChar(sourceCode[this.position])) {
      decoratorName += sourceCode[this.position];
      this.advance();
    }

    this.tokens.push({
      type: "DECORATOR",
      name: decoratorName,
      value: "@" + decoratorName,
      line: this.line,
      column: startCol,
      hasMeta: this.isDecorationMeta(decoratorName)
    });

    this.tokenMetrics.decoratorCount++;
  }

  /**
   * TOKENIZE GENERIC TYPES WITH CONSTRAINTS
   */
  tokenizeGeneric(sourceCode) {
    const startCol = this.column;
    let depth = 0;
    let genericContent = "";

    this.advance(); // Skip <
    depth++;

    while (this.position < sourceCode.length && depth > 0) {
      if (sourceCode[this.position] === "<") {
        depth++;
      } else if (sourceCode[this.position] === ">") {
        depth--;
        if (depth === 0) break;
      }

      genericContent += sourceCode[this.position];
      this.advance();
    }

    if (depth > 0) {
      this.profiling.errors.push({
        message: "Unclosed generic type",
        line: this.line,
        column: startCol
      });
      return;
    }

    this.advance(); // Skip >

    // Detect mapped types
    if (genericContent.includes("in") && genericContent.includes("keyof")) {
      this.tokens.push({
        type: "MAPPED_TYPE_GENERIC",
        content: genericContent,
        line: this.line,
        column: startCol,
        isMapped: true
      });
      this.tokenMetrics.mappedTypeCount++;
    }
    // Detect conditional types (T extends U ? X : Y or similar)
    else if ((genericContent.includes("extends") || genericContent.includes("infer")) && 
             (genericContent.includes("?") || sourceCode.substring(this.position).includes("?"))) {
      this.tokens.push({
        type: "CONDITIONAL_TYPE_GENERIC",
        content: genericContent,
        line: this.line,
        column: startCol,
        isConditional: true
      });
      this.tokenMetrics.conditionalTypeCount++;
    }
    // Detect generic constraints
    else if (genericContent.includes("extends")) {
      this.tokens.push({
        type: "GENERIC_CONSTRAINT",
        content: genericContent,
        line: this.line,
        column: startCol,
        hasConstraint: true
      });
      this.tokenMetrics.genericConstraintCount++;
    }
    // Regular generic
    else {
      this.tokens.push({
        type: "GENERIC_TYPE",
        content: genericContent,
        line: this.line,
        column: startCol
      });
    }
  }

  /**
   * TOKENIZE KEYWORDS AND IDENTIFIERS
   */
  tokenizeKeywordOrIdentifier(sourceCode) {
    const startCol = this.column;
    let text = "";

    while (this.position < sourceCode.length && this.isIdentifierChar(sourceCode[this.position])) {
      text += sourceCode[this.position];
      this.advance();
    }

    // Check for keywords
    if (text === "import" || text === "export") {
      this.tokens.push({
        type: "MODULE_KEYWORD",
        value: text,
        line: this.line,
        column: startCol
      });
      this.tokenMetrics.importExportCount++;
    } else if (text === "async" || text === "await") {
      this.tokens.push({
        type: "ASYNC_KEYWORD",
        value: text,
        line: this.line,
        column: startCol
      });
      this.tokenMetrics.asyncAwaitCount++;
    } else if (text === "readonly" || text === "keyof" || text === "typeof" || text === "infer") {
      this.tokens.push({
        type: "TYPE_OPERATOR",
        value: text,
        line: this.line,
        column: startCol
      });
    } else if (text === "extends" || text === "in" || text === "as") {
      this.tokens.push({
        type: "TYPE_KEYWORD",
        value: text,
        line: this.line,
        column: startCol
      });
    } else if (text === "type" || text === "interface" || text === "namespace") {
      this.tokens.push({
        type: "TYPE_DECLARATION",
        value: text,
        line: this.line,
        column: startCol
      });
    } else {
      this.tokens.push({
        type: "IDENTIFIER",
        value: text,
        line: this.line,
        column: startCol
      });
    }
  }

  /**
   * TOKENIZE STRING LITERALS
   */
  tokenizeString(sourceCode) {
    const startCol = this.column;
    const quote = sourceCode[this.position];
    let value = "";

    this.advance(); // Skip opening quote

    while (this.position < sourceCode.length && sourceCode[this.position] !== quote) {
      if (sourceCode[this.position] === "\\") {
        this.advance();
      }
      value += sourceCode[this.position];
      this.advance();
    }

    if (this.position < sourceCode.length) {
      this.advance(); // Skip closing quote
    }

    this.tokens.push({
      type: "STRING_LITERAL",
      value: value,
      quote: quote,
      line: this.line,
      column: startCol
    });
  }

  /**
   * TOKENIZE NUMBERS
   */
  tokenizeNumber(sourceCode) {
    const startCol = this.column;
    let value = "";

    while (this.position < sourceCode.length && this.isDigit(sourceCode[this.position])) {
      value += sourceCode[this.position];
      this.advance();
    }

    this.tokens.push({
      type: "NUMBER",
      value: value,
      line: this.line,
      column: startCol
    });
  }

  /**
   * TOKENIZE OPERATORS
   */
  tokenizeOperator(sourceCode) {
    const startCol = this.column;
    const char = sourceCode[this.position];

    this.tokens.push({
      type: "OPERATOR",
      value: char,
      line: this.line,
      column: startCol
    });

    this.advance();
  }

  // ==================== HELPER METHODS ====================

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
    return (sourceCode[this.position] === "/" &&
            (sourceCode[this.position + 1] === "/" || sourceCode[this.position + 1] === "*"));
  }

  skipComment(sourceCode) {
    if (sourceCode[this.position] === "/" && sourceCode[this.position + 1] === "/") {
      while (this.position < sourceCode.length && sourceCode[this.position] !== "\n") {
        this.position++;
      }
    } else if (sourceCode[this.position] === "/" && sourceCode[this.position + 1] === "*") {
      this.position += 2;
      while (this.position < sourceCode.length - 1 &&
             !(sourceCode[this.position] === "*" && sourceCode[this.position + 1] === "/")) {
        if (sourceCode[this.position] === "\n") {
          this.line++;
          this.column = 1;
        } else {
          this.column++;
        }
        this.position++;
      }
      if (this.position < sourceCode.length - 1) {
        this.position += 2;
      }
    }
  }

  isIdentifierStart(char) {
    return /[a-zA-Z_$]/.test(char);
  }

  isIdentifierChar(char) {
    return /[a-zA-Z0-9_$]/.test(char);
  }

  isDigit(char) {
    return /[0-9]/.test(char);
  }

  isDecorationMeta(name) {
    return ["Component", "Directive", "Pipe", "Injectable", "Inject"].includes(name);
  }

  advance() {
    this.position++;
    this.column++;
  }

  getMetrics() {
    return {
      ...this.tokenMetrics,
      profiling: this.profiling
    };
  }
}

module.exports = TypeScriptPhaseC_Tokenizer;

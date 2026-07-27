/**
 * PYTHON PHASE C TOKENIZER
 * 
 * Extends Phase C tokenizer with Python-specific features:
 * - Indentation-based block structure (INDENT/DEDENT tokens)
 * - Comprehension syntax (list, dict, set comprehensions)
 * - Decorators (@syntax)
 * - F-strings and raw strings
 * - Operator keywords (in, not, and, or)
 * - Context managers (with, async)
 * - Async/await support
 * 
 * CSC LM EVO-A Standard: Professional grade with forensic validation
 */

const AbstractPhaseCtokenizer = require("../framework/abstract_tokenizer");

class PythonPhaseC_Tokenizer extends AbstractPhaseCtokenizer {
  constructor(config = {}) {
    super({
      language: "Python",
      version: "3.8+",
      ...config
    });

    // Python-specific keyword classifications
    this.pythonKeywords = {
      // Control flow
      control: ["if", "elif", "else", "while", "for", "break", "continue", "pass"],
      // Definitions
      definition: ["def", "class", "async", "await", "lambda", "return", "yield"],
      // Error handling
      errorHandling: ["try", "except", "finally", "raise", "assert"],
      // Context management
      context: ["with", "as"],
      // Comprehension-related
      comprehension: ["for", "in", "if"],
      // Import statements
      import: ["import", "from"],
      // Boolean/Logic
      boolean: ["True", "False", "None", "and", "or", "not", "is", "in"],
      // Special
      special: ["del", "global", "nonlocal", "lambda", "yield", "return"]
    };

    // Python-specific operators
    this.pythonOperators = {
      comparison: ["==", "!=", "<", ">", "<=", ">=", "is", "is not", "in", "not in"],
      arithmetic: ["+", "-", "*", "/", "//", "%", "**", "@"],
      assignment: ["=", "+=", "-=", "*=", "/=", "//=", "%=", "**=", "@=", "&=", "|=", "^=", ">>=", "<<="],
      logical: ["and", "or", "not"],
      bitwise: ["&", "|", "^", "~", "<<", ">>"],
      special: [".", "...", "->", ":=", "->"]
    };

    // Indentation state machine
    this.indentStack = [0];
    this.tokens = [];
    this.pendingIndentTokens = [];
    this.lineStart = true;
    this.currentIndent = 0;

    // String tracking
    this.stringState = {
      inString: false,
      stringChar: null,
      isRaw: false,
      isFormatted: false,
      isTriple: false
    };

    // Metrics for forensic validation
    this.profiling = {
      indentStack: [],
      comprehensionCount: 0,
      decoratorCount: 0,
      asyncCount: 0,
      stringVariations: [],
      errors: []
    };
  }

  /**
   * MAIN TOKENIZATION
   * Extends base tokenization with Python-specific handling
   */
  tokenize(sourceCode) {
    try {
      this.tokens = [];
      this.pendingIndentTokens = [];
      this.indentStack = [0];
      this.lineStart = true;
      this.position = 0;
      this.line = 1;
      this.column = 1;

      // Process line by line to handle indentation
      const lines = sourceCode.split("\n");
      
      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        
        // Handle indentation at line start
        if (line.length > 0) {
          const indent = this.getLineIndentation(line);
          this.handleIndentationChange(indent);
          
          // Tokenize rest of line
          this.tokenizeLine(line.substring(indent));
        }
        
        if (lineNum < lines.length - 1) {
          this.position += 1; // newline
          this.line++;
          this.column = 1;
        }
      }

      // Add final DEDENT tokens for remaining indent stack
      while (this.indentStack.length > 1) {
        this.indentStack.pop();
        this.tokens.push({
          type: "DEDENT",
          lexeme: "",
          line: this.line,
          column: this.column,
          value: "",
          metadata: { indentLevel: this.indentStack[this.indentStack.length - 1] }
        });
      }

      // Add EOF token
      this.tokens.push({
        type: "EOF",
        lexeme: "",
        line: this.line,
        column: this.column,
        value: "",
        metadata: {}
      });

      return this.tokens;
    } catch (error) {
      this.profiling.errors.push(`Tokenization error: ${error.message}`);
      throw new Error(`Python tokenization failed at line ${this.line}, col ${this.column}: ${error.message}`);
    }
  }

  /**
   * INDENTATION DETECTION
   * Returns number of spaces at line start (handles tabs as 8 spaces)
   */
  getLineIndentation(line) {
    let indent = 0;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === " ") {
        indent += 1;
      } else if (line[i] === "\t") {
        indent += 8; // Tab = 8 spaces
      } else {
        break;
      }
    }
    return indent;
  }

  /**
   * INDENTATION HANDLING
   * Generates INDENT/DEDENT tokens based on indentation changes
   */
  handleIndentationChange(newIndent) {
    const currentIndent = this.indentStack[this.indentStack.length - 1];

    if (newIndent > currentIndent) {
      // Increasing indent - generate INDENT token
      this.indentStack.push(newIndent);
      this.tokens.push({
        type: "INDENT",
        lexeme: " ".repeat(newIndent),
        line: this.line,
        column: 1,
        value: newIndent,
        metadata: { indentLevel: newIndent }
      });
      this.profiling.indentStack.push({ level: newIndent, type: "INDENT" });
    } else if (newIndent < currentIndent) {
      // Decreasing indent - generate DEDENT tokens
      while (this.indentStack.length > 1 && this.indentStack[this.indentStack.length - 1] > newIndent) {
        this.indentStack.pop();
        this.tokens.push({
          type: "DEDENT",
          lexeme: "",
          line: this.line,
          column: 1,
          value: "",
          metadata: { indentLevel: this.indentStack[this.indentStack.length - 1] }
        });
        this.profiling.indentStack.push({ level: newIndent, type: "DEDENT" });
      }

      // Consistency check
      if (this.indentStack[this.indentStack.length - 1] !== newIndent) {
        this.profiling.errors.push(`Indentation mismatch at line ${this.line}: expected ${newIndent}, got ${this.indentStack[this.indentStack.length - 1]}`);
      }
    }
  }

  /**
   * LINE TOKENIZATION
   * Tokenizes a single line (after indentation stripping)
   */
  tokenizeLine(line) {
    let i = 0;
    const lineLen = line.length;

    while (i < lineLen) {
      const char = line[i];

      // Skip whitespace (except indentation, already handled)
      if (char === " " || char === "\t") {
        i++;
        this.column++;
        continue;
      }

      // Comments
      if (char === "#") {
        // Rest of line is comment
        break;
      }

      // Strings
      if (char === "\"" || char === "'") {
        const _stringStart = i;
        i = this.tokenizeString(line, i);
        continue;
      }

      // Decorators
      if (char === "@") {
        this.profiling.decoratorCount++;
        this.tokens.push({
          type: "DECORATOR_START",
          lexeme: "@",
          line: this.line,
          column: this.column,
          value: "@",
          category: "decorator"
        });
        i++;
        this.column++;
        continue;
      }

      // Numbers
      if (this.isDigit(char)) {
        i = this.tokenizeNumber(line, i);
        continue;
      }

      // Identifiers and keywords
      if (this.isAlpha(char) || char === "_") {
        i = this.tokenizeIdentifier(line, i);
        continue;
      }

      // Operators and punctuation
      i = this.tokenizeOperator(line, i);
    }
  }

  /**
   * STRING TOKENIZATION
   * Handles Python strings: regular, raw, f-strings, triple-quoted
   */
  tokenizeString(line, startPos) {
    const quote = line[startPos];
    let i = startPos + 1;
    let isRaw = false;
    let isFormatted = false;

    // Check for raw (r) or formatted (f) prefix
    if (startPos > 0) {
      const prevChar = line[startPos - 1];
      if (prevChar === "r" || prevChar === "R") isRaw = true;
      if (prevChar === "f" || prevChar === "F") isFormatted = true;
    }

    // Check for triple-quoted string
    let isTriple = false;
    if (i + 1 < line.length && line[i] === quote && line[i + 1] === quote) {
      isTriple = true;
      i += 2;
    }

    this.profiling.stringVariations.push({ raw: isRaw, formatted: isFormatted, triple: isTriple });

    // Find string end
    while (i < line.length) {
      if (line[i] === "\\" && !isRaw) {
        i += 2; // Skip escaped character
        continue;
      }

      if (isTriple) {
        if (line[i] === quote && i + 2 < line.length && line[i + 1] === quote && line[i + 2] === quote) {
          i += 3;
          break;
        }
      } else {
        if (line[i] === quote) {
          i++;
          break;
        }
      }

      i++;
    }

    const stringValue = line.substring(startPos, i);
    this.tokens.push({
      type: "STRING",
      lexeme: stringValue,
      line: this.line,
      column: this.column,
      value: stringValue,
      metadata: { raw: isRaw, formatted: isFormatted, triple: isTriple }
    });

    this.column += i - startPos;
    return i;
  }

  /**
   * NUMBER TOKENIZATION
   * Handles integers, floats, complex numbers, underscores
   */
  tokenizeNumber(line, startPos) {
    let i = startPos;
    let hasDecimal = false;
    let hasExponent = false;
    let isComplex = false;

    while (i < line.length) {
      const char = line[i];

      if (this.isDigit(char)) {
        i++;
      } else if (char === "_" && i > startPos) {
        // Underscores allowed in numbers (Python 3.6+)
        i++;
      } else if (char === "." && !hasDecimal && !hasExponent) {
        hasDecimal = true;
        i++;
      } else if ((char === "e" || char === "E") && !hasExponent) {
        hasExponent = true;
        if (i + 1 < line.length && (line[i + 1] === "+" || line[i + 1] === "-")) {
          i += 2;
        } else {
          i++;
        }
      } else if ((char === "j" || char === "J") && !isComplex) {
        isComplex = true;
        i++;
        break;
      } else {
        break;
      }
    }

    const numValue = line.substring(startPos, i);
    this.tokens.push({
      type: "NUMBER",
      lexeme: numValue,
      line: this.line,
      column: this.column,
      value: numValue,
      metadata: { hasDecimal, hasExponent, isComplex }
    });

    this.column += i - startPos;
    return i;
  }

  /**
   * IDENTIFIER/KEYWORD TOKENIZATION
   */
  tokenizeIdentifier(line, startPos) {
    let i = startPos;

    while (i < line.length && (this.isAlphaNumeric(line[i]) || line[i] === "_")) {
      i++;
    }

    const identifier = line.substring(startPos, i);
    let tokenType = "IDENTIFIER";
    let category = "";

    // Check if it's a keyword
    for (const [cat, keywords] of Object.entries(this.pythonKeywords)) {
      if (keywords.includes(identifier)) {
        tokenType = "KEYWORD";
        category = cat;
        break;
      }
    }

    // Detect comprehensions
    if (identifier === "for" && this.isInComprehension(line, i)) {
      this.profiling.comprehensionCount++;
      category = "comprehension";
    }

    // Detect async/await
    if (identifier === "async" || identifier === "await") {
      this.profiling.asyncCount++;
      category = "async";
    }

    this.tokens.push({
      type: tokenType,
      lexeme: identifier,
      line: this.line,
      column: this.column,
      value: identifier,
      category: category
    });

    this.column += i - startPos;
    return i;
  }

  /**
   * OPERATOR/PUNCTUATION TOKENIZATION
   */
  tokenizeOperator(line, startPos) {
    let i = startPos;
    let operator = "";

    // Try two-character operators first
    if (startPos + 1 < line.length) {
      const twoChar = line.substring(startPos, startPos + 2);
      for (const ops of Object.values(this.pythonOperators)) {
        if (ops.includes(twoChar)) {
          operator = twoChar;
          i = startPos + 2;
          break;
        }
      }
    }

    // Fall back to single character
    if (!operator) {
      operator = line[startPos];
      i = startPos + 1;
    }

    let tokenType = "OPERATOR";
    if (operator === "(" || operator === "[" || operator === "{") {
      tokenType = "LPAREN";
    } else if (operator === ")" || operator === "]" || operator === "}") {
      tokenType = "RPAREN";
    } else if (operator === ":") {
      tokenType = "COLON";
    } else if (operator === ",") {
      tokenType = "COMMA";
    } else if (operator === "=") {
      tokenType = "ASSIGN";
    }

    this.tokens.push({
      type: tokenType,
      lexeme: operator,
      line: this.line,
      column: this.column,
      value: operator
    });

    this.column += operator.length;
    return i;
  }

  /**
   * HELPER: Check if we're in a comprehension context
   */
  isInComprehension(line, pos) {
    // Simple heuristic: look for '[' before 'for'
    const beforeFor = line.substring(0, pos);
    const openBrackets = (beforeFor.match(/\[/g) || []).length;
    const closeBrackets = (beforeFor.match(/\]/g) || []).length;
    return openBrackets > closeBrackets;
  }

  /**
   * HELPER: Character type checks
   */
  isAlpha(char) {
    return /[a-zA-Z_]/.test(char);
  }

  isAlphaNumeric(char) {
    return /[a-zA-Z0-9_]/.test(char);
  }

  isDigit(char) {
    return /[0-9]/.test(char);
  }

  /**
   * GET TOKENIZATION METRICS
   */
  getMetrics() {
    return {
      totalTokens: this.tokens.length,
      comprehensions: this.profiling.comprehensionCount,
      decorators: this.profiling.decoratorCount,
      asyncAwait: this.profiling.asyncCount,
      stringVariations: this.profiling.stringVariations.length,
      indentLevels: this.indentStack.length,
      errors: this.profiling.errors
    };
  }
}

module.exports = PythonPhaseC_Tokenizer;

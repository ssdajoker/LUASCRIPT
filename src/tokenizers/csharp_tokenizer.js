/**
 * C# TOKENIZER - Phase A Core Infrastructure
 * Round 1: C# Language Transpilation Pipeline
 * Date: February 3, 2026
 * Status: Implementation
 */

class CSharpTokenizer {
  constructor(_options = {}) {
    this.source = "";
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    
    // C# keywords
    this.keywords = new Set([
      "abstract", "as", "base", "bool", "break", "byte", "case", "catch", "char",
      "checked", "class", "const", "continue", "decimal", "default", "delegate",
      "do", "double", "else", "enum", "event", "explicit", "extern", "false",
      "finally", "fixed", "float", "for", "foreach", "goto", "if", "implicit",
      "in", "int", "interface", "internal", "is", "lock", "long", "namespace",
      "new", "null", "object", "operator", "out", "override", "params", "private",
      "protected", "public", "readonly", "ref", "return", "sbyte", "sealed",
      "short", "sizeof", "stackalloc", "static", "string", "struct", "switch",
      "this", "throw", "true", "try", "typeof", "uint", "ulong", "unchecked",
      "unsafe", "ushort", "using", "virtual", "void", "volatile", "while",
      "async", "await", "dynamic", "from", "get", "global", "group", "into",
      "join", "let", "orderby", "partial", "remove", "select", "set", "value",
      "var", "where", "yield"
    ]);
    
    // Operators (ordered by length, longest first)
    this.operators = [
      "??=", "??", "=>", "<=", ">=", "==", "!=", "&&", "||", "++", "--",
      "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<=", ">>=",
      "<<", ">>", "+", "-", "*", "/", "%", "&", "|", "^", "~", "!",
      "<", ">", "=", "?", ":", ".", ",", ";", "(", ")", "[", "]", "{", "}"
    ];
  }

  tokenize(source) {
    this.source = source;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];

    while (this.position < this.source.length) {
      this.skipWhitespaceAndComments();
      
      if (this.position >= this.source.length) break;

      const char = this.source[this.position];

      // String literals (including verbatim strings @"...")
      if ((char === "\"" || char === "'") || (char === "@" && this.source[this.position + 1] === "\"")) {
        this.tokenizeString();
      }
      // Numbers
      else if (/\d/.test(char)) {
        this.tokenizeNumber();
      }
      // Identifiers and keywords
      else if (/[a-zA-Z_@]/.test(char)) {
        this.tokenizeIdentifier();
      }
      // Operators and delimiters
      else {
        this.tokenizeOperator();
      }
    }

    return this.tokens;
  }

  skipWhitespaceAndComments() {
    while (this.position < this.source.length) {
      const char = this.source[this.position];
      const nextChar = this.source[this.position + 1];

      // Whitespace
      if (/\s/.test(char)) {
        if (char === "\n") {
          this.line++;
          this.column = 1;
        } else {
          this.column++;
        }
        this.position++;
      }
      // Line comment
      else if (char === "/" && nextChar === "/") {
        this.position += 2;
        while (this.position < this.source.length && this.source[this.position] !== "\n") {
          this.position++;
        }
      }
      // Block comment
      else if (char === "/" && nextChar === "*") {
        this.position += 2;
        while (this.position < this.source.length) {
          if (this.source[this.position] === "*" && this.source[this.position + 1] === "/") {
            this.position += 2;
            break;
          }
          if (this.source[this.position] === "\n") {
            this.line++;
            this.column = 1;
          } else {
            this.column++;
          }
          this.position++;
        }
      } else {
        break;
      }
    }
  }

  tokenizeString() {
    let startColumn = this.column;
    let isVerbatim = false;

    if (this.source[this.position] === "@" && this.source[this.position + 1] === "\"") {
      isVerbatim = true;
      this.position += 2;
      this.column += 2;
    } else {
      this.position++; // Skip opening quote
      this.column++;
    }

    let value = "";

    if (isVerbatim) {
      // Verbatim string - backslashes are literal
      while (this.position < this.source.length && this.source[this.position] !== "\"") {
        value += this.source[this.position];
        this.position++;
        this.column++;
      }
    } else {
      // Regular string - handle escape sequences
      while (this.position < this.source.length && this.source[this.position] !== this.source[this.position - 1]) {
        if (this.source[this.position] === "\\") {
          this.position++;
          if (this.position < this.source.length) {
            value += this.source[this.position];
            this.position++;
            this.column++;
          }
        } else if (this.source[this.position] === "\"" || this.source[this.position] === "'") {
          break;
        } else {
          value += this.source[this.position];
          this.position++;
          this.column++;
        }
      }
    }

    if (this.position < this.source.length) {
      this.position++; // Skip closing quote
      this.column++;
    }

    this.tokens.push({
      type: "STRING",
      value: value,
      line: this.line,
      column: startColumn,
      isVerbatim: isVerbatim
    });
  }

  tokenizeNumber() {
    let value = "";
    let startColumn = this.column;
    let hasDecimal = false;

    while (this.position < this.source.length) {
      const char = this.source[this.position];
      if (/\d/.test(char)) {
        value += char;
        this.position++;
        this.column++;
      } else if (char === "." && !hasDecimal && /\d/.test(this.source[this.position + 1])) {
        hasDecimal = true;
        value += char;
        this.position++;
        this.column++;
      } else if (/[dDfFmM]/.test(char)) {
        // Numeric suffix
        value += char;
        this.position++;
        this.column++;
        break;
      } else {
        break;
      }
    }

    this.tokens.push({
      type: "NUMBER",
      value: value,
      line: this.line,
      column: startColumn
    });
  }

  tokenizeIdentifier() {
    let value = "";
    let startColumn = this.column;

    while (this.position < this.source.length && /[a-zA-Z_$0-9]/.test(this.source[this.position])) {
      value += this.source[this.position];
      this.position++;
      this.column++;
    }

    const type = this.keywords.has(value) ? "KEYWORD" : "IDENTIFIER";
    
    this.tokens.push({
      type: type,
      value: value,
      line: this.line,
      column: startColumn
    });
  }

  tokenizeOperator() {
    let startColumn = this.column;
    
    // Try to match longest operator first
    for (const op of this.operators) {
      if (this.source.substr(this.position, op.length) === op) {
        this.tokens.push({
          type: "OPERATOR",
          value: op,
          line: this.line,
          column: startColumn
        });
        
        this.position += op.length;
        this.column += op.length;
        return;
      }
    }

    // Fallback: single character operator
    const char = this.source[this.position];
    this.tokens.push({
      type: "OPERATOR",
      value: char,
      line: this.line,
      column: startColumn
    });

    this.position++;
    this.column++;
  }

  getTokens() {
    return this.tokens;
  }

  getTokenStats() {
    const stats = {
      totalTokens: this.tokens.length,
      byType: {}
    };

    for (const token of this.tokens) {
      stats.byType[token.type] = (stats.byType[token.type] || 0) + 1;
    }

    return stats;
  }
}

module.exports = CSharpTokenizer;
module.exports.CSharpTokenizer = CSharpTokenizer;

/**
 * JAVA TOKENIZER - Phase A Core Infrastructure
 * Round 1: Java Language Transpilation Pipeline
 * Date: February 3, 2026
 * Status: Initial Implementation
 */

class JavaTokenizer {
  constructor(_options = {}) {
    this.source = "";
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    
    // Java keywords
    this.keywords = new Set([
      "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char",
      "class", "const", "continue", "default", "do", "double", "else", "enum",
      "extends", "final", "finally", "float", "for", "goto", "if", "implements",
      "import", "instanceof", "int", "interface", "long", "native", "new", "null",
      "package", "private", "protected", "public", "return", "short", "static",
      "strictfp", "super", "switch", "synchronized", "this", "throw", "throws",
      "transient", "try", "void", "volatile", "while",
      "String", "List", "Map", "Set", "ArrayList", "HashMap"
    ]);
    
    // Operators (ordered by length, longest first)
    this.operators = [
      ">>>", ">>=", "<<=", "&=", "^=", "|=", "+=", "-=", "*=", "/=", "%=",
      "==", "!=", "<=", ">=", "&&", "||", "++", "--", "<<", ">>", "->",
      "+", "-", "*", "/", "%", "&", "|", "^", "~", "!", "<", ">", "=",
      "?", ":", ".", ",", ";", "(", ")", "[", "]", "{", "}"
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

      // String literals
      if (char === "\"" || char === "'") {
        this.tokenizeString();
      }
      // Numbers
      else if (/\d/.test(char)) {
        this.tokenizeNumber();
      }
      // Identifiers and keywords
      else if (/[a-zA-Z_$]/.test(char)) {
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
    const quote = this.source[this.position];
    this.position++; // Skip opening quote
    let value = "";

    while (this.position < this.source.length && this.source[this.position] !== quote) {
      if (this.source[this.position] === "\\") {
        // Handle escape sequences
        this.position++;
        if (this.position < this.source.length) {
          value += this.source[this.position];
          this.position++;
        }
      } else {
        value += this.source[this.position];
        this.position++;
      }
    }

    if (this.position < this.source.length) {
      this.position++; // Skip closing quote
    }

    this.tokens.push({
      type: "STRING",
      value: value,
      line: this.line,
      column: this.column
    });

    this.column += value.length + 2;
  }

  tokenizeNumber() {
    let value = "";
    let startColumn = this.column;

    while (this.position < this.source.length && /[\d.]/.test(this.source[this.position])) {
      value += this.source[this.position];
      this.position++;
      this.column++;
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

module.exports = JavaTokenizer;
module.exports.JavaTokenizer = JavaTokenizer;

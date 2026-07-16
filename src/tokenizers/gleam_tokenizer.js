/**
 * GLEAM TOKENIZER - Phase A Core Infrastructure
 * Round 1: Gleam Language Transpilation (Modern ML-style)
 * Date: February 3, 2026
 */

class GleamTokenizer {
  constructor(_options = {}) {
    this.source = "";
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    
    // Gleam keywords (modern ML-style)
    this.keywords = new Set([
      "pub", "const", "fn", "assert", "let", "case", "if", "use", "try",
      "todo", "panic", "external", "type", "opaque", "import", "as", 
      "True", "False", "Ok", "Error", "Nil", "List", "Result"
    ]);
    
    // Operators
    this.operators = [
      "|>", "<-", "==", "!=", "<=", ">=", "||", "&&", "++", "<>", "->",
      "+", "-", "*", "/", "%", "|", "&", "<", ">", "=", "!", "?",
      ":", ".", ",", ";", "(", ")", "[", "]", "{", "}", "#"
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

      if (char === "\"") {
        this.tokenizeString();
      } else if (/\d/.test(char)) {
        this.tokenizeNumber();
      } else if (/[a-z_A-Z]/.test(char)) {
        this.tokenizeIdentifier();
      } else {
        this.tokenizeOperator();
      }
    }

    return this.tokens;
  }

  skipWhitespaceAndComments() {
    while (this.position < this.source.length) {
      const char = this.source[this.position];
      const nextChar = this.source[this.position + 1];

      if (/\s/.test(char)) {
        if (char === "\n") {
          this.line++;
          this.column = 1;
        } else {
          this.column++;
        }
        this.position++;
      } else if (char === "/" && nextChar === "/") {
        this.position += 2;
        while (this.position < this.source.length && this.source[this.position] !== "\n") {
          this.position++;
        }
      } else {
        break;
      }
    }
  }

  tokenizeString() {
    this.position++;
    let value = "";
    while (this.position < this.source.length && this.source[this.position] !== "\"") {
      if (this.source[this.position] === "\\") {
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
    if (this.position < this.source.length) this.position++;

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
    while (this.position < this.source.length && /[a-zA-Z0-9_]/.test(this.source[this.position])) {
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

module.exports = GleamTokenizer;

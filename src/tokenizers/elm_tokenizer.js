/**
 * ELM TOKENIZER - Phase A Core Infrastructure
 * Round 1: Elm Language Transpilation Pipeline (Functional)
 * Date: February 3, 2026
 */

class ElmTokenizer {
  constructor(_options = {}) {
    this.source = "";
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    
    // Elm keywords (functional programming)
    this.keywords = new Set([
      "module", "import", "exposing", "as", "if", "then", "else", "case", "of",
      "let", "in", "type", "alias", "port", "effect", "command", "subscription",
      "where", "infix", "infixl", "infixr", "and", "or", "not", "xor",
      "True", "False", "Nothing", "Just", "Ok", "Err", "LT", "EQ", "GT"
    ]);
    
    // Operators (ordered by length, longest first)
    this.operators = [
      "|>", "<|", "<<", ">>", "==", "/=", "<=", ">=", "++", "&&", "||",
      "+", "-", "*", "/", "%", "^", "|", "&", "<", ">", "=", "!", "?",
      ":", ".", ",", ";", "(", ")", "[", "]", "{", "}", "->",
      "_"
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

      // Triple-quoted strings (multiline)
      if (char === "\"" && this.source.substr(this.position, 3) === "\"\"\"") {
        this.tokenizeMultilineString();
      }
      // String literals (single and double quoted)
      else if (char === "\"" || char === "'") {
        this.tokenizeString();
      }
      // Numbers
      else if (/\d/.test(char)) {
        this.tokenizeNumber();
      }
      // Identifiers and keywords
      else if (/[a-z_A-Z]/.test(char)) {
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
      // Line comment (--)
      else if (char === "-" && nextChar === "-") {
        this.position += 2;
        while (this.position < this.source.length && this.source[this.position] !== "\n") {
          this.position++;
        }
      }
      // Block comment ({- ... -})
      else if (char === "{" && nextChar === "-") {
        this.position += 2;
        let depth = 1;
        while (this.position < this.source.length && depth > 0) {
          if (this.source[this.position] === "{" && this.source[this.position + 1] === "-") {
            depth++;
            this.position += 2;
          } else if (this.source[this.position] === "-" && this.source[this.position + 1] === "}") {
            depth--;
            this.position += 2;
          } else {
            if (this.source[this.position] === "\n") {
              this.line++;
              this.column = 1;
            } else {
              this.column++;
            }
            this.position++;
          }
        }
      } else {
        break;
      }
    }
  }

  tokenizeString() {
    const quote = this.source[this.position];
    this.position++;
    let value = "";

    while (this.position < this.source.length && this.source[this.position] !== quote) {
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

  tokenizeMultilineString() {
    this.position += 3; // Skip opening """
    let value = "";

    while (this.position < this.source.length) {
      if (this.source.substr(this.position, 3) === "\"\"\"") {
        this.position += 3;
        break;
      }
      value += this.source[this.position];
      if (this.source[this.position] === "\n") {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.position++;
    }

    this.tokens.push({
      type: "STRING",
      value: value,
      line: this.line,
      column: this.column,
      isMultiline: true
    });
  }

  tokenizeNumber() {
    let value = "";
    let startColumn = this.column;
    let hasDecimal = false;

    // Check for hex (0x...)
    if (this.source[this.position] === "0" && /[xX]/.test(this.source[this.position + 1])) {
      value += this.source[this.position];
      this.position++;
      value += this.source[this.position];
      this.position++;
      
      while (this.position < this.source.length && /[0-9a-fA-F]/.test(this.source[this.position])) {
        value += this.source[this.position];
        this.position++;
      }
    } else {
      // Regular decimal number
      while (this.position < this.source.length) {
        const char = this.source[this.position];
        if (/\d/.test(char)) {
          value += char;
          this.position++;
        } else if (char === "." && !hasDecimal && /\d/.test(this.source[this.position + 1])) {
          hasDecimal = true;
          value += char;
          this.position++;
        } else if (/[eE]/.test(char)) {
          value += char;
          this.position++;
          if (/[+-]/.test(this.source[this.position])) {
            value += this.source[this.position];
            this.position++;
          }
        } else {
          break;
        }
      }
    }

    this.tokens.push({
      type: "NUMBER",
      value: value,
      line: this.line,
      column: startColumn
    });

    this.column += value.length;
  }

  tokenizeIdentifier() {
    let value = "";
    let startColumn = this.column;

    while (this.position < this.source.length && /[a-zA-Z0-9_']/.test(this.source[this.position])) {
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

    // Fallback: single character
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

module.exports = ElmTokenizer;
module.exports.ElmTokenizer = ElmTokenizer;

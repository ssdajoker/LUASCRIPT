/**
 * GleamTokenizerExtended - Phase B
 * Advanced Gleam Tokenization with Pattern Matching, Error Handling, Opaques
 * Supports parameterized types, patterns, guards, error results
 */

class GleamTokenizerExtended {
  constructor(input = "") {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    
    // Extended keywords for Phase B
    this.keywords = new Set([
      // Phase A keywords
      "pub", "fn", "let", "assert", "use", "case", "if", "try",
      "todo", "panic", "as", "import", "external", "type",
      // Phase B keywords - Error handling & opaques
      "pub", "opaque", "type", "fn", "let", "case", "assert",
      "try", "error", "ok", "Result", "Error", "Ok",
      // Gleam built-in types
      "Int", "Float", "Bool", "String", "List", "Option", "Nil",
      "Result", "Never", "BitArray", "Dynamic"
    ]);
    
    // Phase B operators
    this.operators = [
      "|>", // pipe forward
      "<|", // pipe backward  
      "||", "&&", // logical
      "==", "!=", "<", ">", "<=", ">=", // comparison
      "+", "-", "*", "/", "%", // arithmetic
      "<>", // string concat
      "..", // range
      "|", // pattern separator
      "=", ":", "->", // assignment, type, arrow
      "?", // error propagation
    ];
  }
  
  current() {
    return this.pos < this.input.length ? this.input[this.pos] : null;
  }
  
  peek(offset = 1) {
    return this.pos + offset < this.input.length ? this.input[this.pos + offset] : null;
  }
  
  advance() {
    if (this.pos < this.input.length) {
      if (this.input[this.pos] === "\n") {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.pos++;
    }
  }
  
  skipWhitespace() {
    while (this.current() && /\s/.test(this.current())) {
      this.advance();
    }
  }
  
  skipLineComment() {
    // Skip //
    this.advance();
    this.advance();
    while (this.current() && this.current() !== "\n") {
      this.advance();
    }
  }
  
  readString() {
    const quote = this.current();
    let value = "";
    this.advance(); // Skip opening quote
    
    while (this.current() && this.current() !== quote) {
      if (this.current() === "\\") {
        this.advance();
        if (this.current()) {
          value += this.current();
          this.advance();
        }
      } else {
        value += this.current();
        this.advance();
      }
    }
    
    if (this.current() === quote) {
      this.advance(); // Skip closing quote
    }
    
    return { type: "String", value };
  }
  
  readNumber() {
    let value = "";
    const isHex = this.current() === "0" && (this.peek() === "x" || this.peek() === "X");
    
    if (isHex) {
      value += this.current();
      this.advance();
      value += this.current();
      this.advance();
      while (this.current() && /[0-9a-fA-F]/.test(this.current())) {
        value += this.current();
        this.advance();
      }
    } else {
      while (this.current() && /\d/.test(this.current())) {
        value += this.current();
        this.advance();
      }
      
      // Float
      if (this.current() === "." && this.peek() && /\d/.test(this.peek())) {
        value += this.current();
        this.advance();
        while (this.current() && /\d/.test(this.current())) {
          value += this.current();
          this.advance();
        }
      }
    }
    
    return { type: "Number", value, isHex };
  }
  
  readIdentifier() {
    let value = "";
    while (this.current() && /[a-zA-Z0-9_]/.test(this.current())) {
      value += this.current();
      this.advance();
    }
    return value;
  }
  
  tokenize() {
    this.tokens = [];
    this.pos = 0;
    
    while (this.pos < this.input.length) {
      this.skipWhitespace();
      
      if (this.pos >= this.input.length) break;
      
      const ch = this.current();
      
      // Line comments
      if (ch === "/" && this.peek() === "/") {
        this.skipLineComment();
        continue;
      }
      
      // Strings
      if (ch === "\"" || ch === "'") {
        const token = this.readString();
        this.tokens.push({
          type: token.type,
          value: token.value,
          line: this.line,
          column: this.column
        });
        continue;
      }
      
      // Numbers
      if (/\d/.test(ch)) {
        const token = this.readNumber();
        this.tokens.push({
          type: token.type,
          value: token.value,
          line: this.line,
          column: this.column,
          isHex: token.isHex
        });
        continue;
      }
      
      // Identifiers and Keywords
      if (/[a-zA-Z_]/.test(ch)) {
        const identifier = this.readIdentifier();
        const type = this.keywords.has(identifier) ? "Keyword" : "Identifier";
        
        this.tokens.push({
          type,
          value: identifier,
          line: this.line,
          column: this.column
        });
        continue;
      }
      
      // Operators (multi-char first)
      let matched = false;
      for (const op of this.operators.sort((a, b) => b.length - a.length)) {
        if (this.input.substr(this.pos, op.length) === op) {
          this.tokens.push({
            type: "Operator",
            value: op,
            line: this.line,
            column: this.column
          });
          for (let i = 0; i < op.length; i++) {
            this.advance();
          }
          matched = true;
          break;
        }
      }
      
      if (matched) continue;
      
      // Single character operators and delimiters
      if (/[[\]{}();,.]/.test(ch)) {
        this.tokens.push({
          type: "Delimiter",
          value: ch,
          line: this.line,
          column: this.column
        });
        this.advance();
        continue;
      }
      
      // Unknown character
      this.advance();
    }
    
    return this.tokens;
  }
  
  getPatternMatchCount() {
    return this.tokens.filter(t => t.value === "->").length;
  }
  
  getErrorHandlingCount() {
    return this.tokens.filter(t => t.value === "?" || t.value === "try").length;
  }
}

module.exports = GleamTokenizerExtended;

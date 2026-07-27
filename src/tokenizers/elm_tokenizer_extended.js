/**
 * ElmTokenizerExtended - Phase B
 * Advanced Elm Tokenization with ADT, Pattern Matching, Records
 * Supports custom types, algebraic data types, patterns, records
 */

class ElmTokenizerExtended {
  constructor(input = "") {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    
    // Extended keywords for Phase B
    this.keywords = new Set([
      // Phase A keywords
      "module", "exposing", "import", "as", "if", "then", "else", "let", "in", "case", "of",
      "type", "alias", "where", "port", "subscriptions", "main",
      "True", "False", "Nothing", "Just",
      // Phase B keywords - ADT and patterns
      "type", "alias", "infix", "infixl", "infixr",
      // Common types
      "Bool", "Int", "Float", "String", "List", "Maybe", "Result", "Cmd", "Sub"
    ]);
    
    // Phase B operators
    this.operators = [
      "|>", // pipe
      "<|", // backward pipe
      "<<", ">>", // function composition
      "=>", // function arrow (lambda)
      "->", // type arrow
      "::", // cons
      "++", // string/list concat
      "==", "/=", "<", ">", "<=", ">=", // comparison
      "&&", "||", "not", // logical
      "+", "-", "*", "/", "//", "%", // arithmetic
      "=", "..", // assignment, range
      "|", // union type marker, pattern separator
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
    // Skip --
    this.advance();
    this.advance();
    while (this.current() && this.current() !== "\n") {
      this.advance();
    }
  }
  
  skipBlockComment() {
    // Skip {-
    this.advance();
    this.advance();
    while (this.current()) {
      if (this.current() === "-" && this.peek() === "}") {
        this.advance();
        this.advance();
        break;
      }
      this.advance();
    }
  }
  
  readString() {
    const quote = this.current();
    let value = "";
    this.advance(); // Skip opening quote
    
    // Check for triple quote (multiline)
    const isTripleQuote = this.current() === quote && this.peek() === quote;
    if (isTripleQuote) {
      this.advance();
      this.advance();
    }
    
    while (this.current()) {
      if (isTripleQuote) {
        if (this.current() === quote && this.peek() === quote && this.peek(2) === quote) {
          this.advance();
          this.advance();
          this.advance();
          break;
        }
      } else {
        if (this.current() === quote) {
          this.advance();
          break;
        }
      }
      
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
    
    return { value, type: "String", isTripleQuote };
  }
  
  readNumber() {
    let value = "";
    let hasDecimal = false;
    let isHex = false;
    
    // Check for hex
    if (this.current() === "0" && (this.peek() === "x" || this.peek() === "X")) {
      isHex = true;
      value += this.current();
      this.advance();
      value += this.current();
      this.advance();
      
      while (this.current() && /[0-9a-fA-F]/.test(this.current())) {
        value += this.current();
        this.advance();
      }
    } else {
      while (this.current() && /[\d.]/.test(this.current())) {
        if (this.current() === ".") {
          if (hasDecimal) break;
          hasDecimal = true;
        }
        value += this.current();
        this.advance();
      }
    }
    
    return { value, type: "Number", isHex };
  }
  
  readIdentifier() {
    let value = "";
    
    while (this.current() && /[a-zA-Z0-9_']/.test(this.current())) {
      value += this.current();
      this.advance();
    }
    
    return value;
  }
  
  tokenize() {
    this.tokens = [];
    
    while (this.pos < this.input.length) {
      this.skipWhitespace();
      
      if (this.pos >= this.input.length) break;
      
      const ch = this.current();
      
      // Comments
      if (ch === "-" && this.peek() === "-") {
        this.skipLineComment();
        continue;
      }
      
      if (ch === "{" && this.peek() === "-") {
        this.skipBlockComment();
        continue;
      }
      
      // Strings
      if (ch === "\"" || ch === "'") {
        const token = this.readString();
        this.tokens.push({
          type: token.type,
          value: token.value,
          line: this.line,
          column: this.column,
          isTripleQuote: token.isTripleQuote
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
  
  getTokenCount() {
    return this.tokens.length;
  }
  
  getKeywordCount() {
    return this.tokens.filter(t => t.type === "Keyword").length;
  }
  
  getTypeDefinitionCount() {
    return this.tokens.filter(t => t.value === "type").length;
  }
  
  getPipeOperatorCount() {
    return this.tokens.filter(t => t.value === "|>").length;
  }
}

module.exports = ElmTokenizerExtended;

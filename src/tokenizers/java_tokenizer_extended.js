/**
 * JavaTokenizerExtended - Phase B
 * Advanced Java Tokenization with Generics, Annotations, Advanced Modifiers
 * Supports inheritance, interfaces, generics, annotations, nested classes
 */

class JavaTokenizerExtended {
  constructor(input = "") {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    
    // Extended keywords for Phase B
    this.keywords = new Set([
      // Phase A keywords
      "class", "interface", "enum", "void", "int", "double", "float", "boolean", "char", "long", "short", "byte",
      "public", "private", "protected", "static", "final", "abstract", "synchronized", "volatile", "transient", "native",
      "if", "else", "for", "while", "do", "switch", "case", "default", "break", "continue", "return", "throw", "try", "catch", "finally",
      "new", "extends", "implements", "this", "super", "package", "import", "instanceof",
      // Phase B keywords
      "sealed", "permits", "record", "var",
      "strictfp", "const", "goto"
    ]);
    
    // Phase B operators
    this.operators = [
      "...", // varargs
      "<<", ">>", ">>>", // bitwise shifts
      "<=", ">=", "==", "!=", "&&", "||",
      "++", "--", "+=", "-=", "*=", "/=", "%=",
      "&=", "|=", "^=", "<<=", ">>=", ">>>=",
      "+", "-", "*", "/", "%", "&", "|", "^", "~", "<", ">", "=", "!", "?", ":",
      "@" // annotation marker
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
  
  skipBlockComment() {
    // Skip /*
    this.advance();
    this.advance();
    while (this.current()) {
      if (this.current() === "*" && this.peek() === "/") {
        this.advance();
        this.advance();
        break;
      }
      this.advance();
    }
  }
  
  readString(quote) {
    const _start = this.pos;
    this.advance(); // Skip opening quote
    let value = "";
    
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
      this.advance();
    }
    
    return { value, type: "String", literal: value };
  }
  
  readNumber() {
    let value = "";
    let hasDecimal = false;

    while (this.current() && /[\d.]/.test(this.current())) {
      if (this.current() === ".") {
        if (hasDecimal) break;
        hasDecimal = true;
      }
      value += this.current();
      this.advance();
    }
    
    // Handle number suffixes: L, F, D, f, d, l
    if (this.current() && /[LlFfDd]/.test(this.current())) {
      value += this.current();
      this.advance();
    }
    
    return { value, type: "Number" };
  }
  
  readIdentifier() {
    let value = "";
    
    while (this.current() && /[a-zA-Z0-9_$]/.test(this.current())) {
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
      if (ch === "/" && this.peek() === "/") {
        this.skipLineComment();
        continue;
      }
      
      if (ch === "/" && this.peek() === "*") {
        this.skipBlockComment();
        continue;
      }
      
      // Strings
      if (ch === "\"" || ch === "'") {
        const token = this.readString(ch);
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
          column: this.column
        });
        continue;
      }
      
      // Annotations (Phase B)
      if (ch === "@") {
        this.tokens.push({
          type: "Annotation",
          value: "@",
          line: this.line,
          column: this.column
        });
        this.advance();
        continue;
      }
      
      // Identifiers and Keywords
      if (/[a-zA-Z_$]/.test(ch)) {
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
  
  getAnnotationCount() {
    return this.tokens.filter(t => t.type === "Annotation").length;
  }
}

module.exports = JavaTokenizerExtended;

/**
 * CSharpTokenizerExtended - Phase B
 * Advanced C# Tokenization with LINQ, Advanced Generics, Properties
 */

class CSharpTokenizerExtended {
  constructor(input = "") {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    
    // Extended keywords for Phase B
    this.keywords = new Set([
      // Phase A keywords
      "using", "namespace", "class", "interface", "enum", "struct", "delegate",
      "public", "private", "protected", "internal", "sealed", "abstract", "static", "readonly", "const",
      "void", "bool", "byte", "char", "decimal", "double", "float", "int", "long", "object", "sbyte", "short", "string", "uint", "ulong", "ushort",
      "if", "else", "switch", "case", "default", "for", "foreach", "while", "do", "break", "continue", "return", "throw", "try", "catch", "finally",
      "new", "null", "true", "false", "this", "base", "typeof", "sizeof", "is", "as",
      "get", "set", "value", "async", "await", "yield",
      // Phase B keywords - LINQ and advanced features
      "from", "where", "select", "group", "by", "into", "join", "on", "equals", "orderby", "ascending", "descending",
      "let", "in", "dynamic", "var", "partial", "virtual", "override", "new", "explicit", "implicit",
      "checked", "unchecked", "fixed", "unsafe", "stackalloc", "params"
    ]);
    
    // Phase B operators
    this.operators = [
      "??", "?.", "?[", "??=", // null coalescing, null conditional
      "=>", // lambda, arrow
      "<<", ">>", // bitwise shifts
      "<=", ">=", "==", "!=", "&&", "||",
      "++", "--", "+=", "-=", "*=", "/=", "%=",
      "&=", "|=", "^=", "<<=", ">>=",
      "+", "-", "*", "/", "%", "&", "|", "^", "~", "<", ">", "=", "!", "?", ":", ".."
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
    this.advance();
    this.advance();
    while (this.current() && this.current() !== "\n") {
      this.advance();
    }
  }
  
  skipBlockComment() {
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
    
    // Check for verbatim string @"..."
    let isVerbatim = false;
    if (quote === "\"" && this.pos > 0 && this.input[this.pos - 1] === "@") {
      isVerbatim = true;
    }
    
    this.advance(); // Skip opening quote
    let value = "";
    
    while (this.current() && this.current() !== quote) {
      if (!isVerbatim && this.current() === "\\") {
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
    
    return { value, type: "String", verbatim: isVerbatim };
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
    
    // Handle numeric suffixes: f, d, m, F, D, M, l, L, ul, UL, etc.
    if (this.current() && /[fFdDmMlLuU]/.test(this.current())) {
      value += this.current();
      this.advance();
      if (this.current() && /[lLuU]/.test(this.current())) {
        value += this.current();
        this.advance();
      }
    }
    
    return { value, type: "Number" };
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
      
      // Verbatim strings @"..."
      if (ch === "@" && this.peek() === "\"") {
        this.advance();
        const token = this.readString("\"");
        this.tokens.push({
          type: "String",
          value: token.value,
          verbatim: true,
          line: this.line,
          column: this.column
        });
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
  
  getLINQKeywordCount() {
    return this.tokens.filter(t => 
      t.type === "Keyword" && ["from", "where", "select", "group", "join", "orderby"].includes(t.value)
    ).length;
  }
}

module.exports = CSharpTokenizerExtended;

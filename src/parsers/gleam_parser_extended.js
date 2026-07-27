/**
 * GleamParserExtended - Phase B
 * Advanced Gleam Parsing with Parameterized Types, Error Handling, Opaques
 * Parses: opaque types, error handling patterns, guards, function signatures
 */

const GleamTokenizerExtended = require("../tokenizers/gleam_tokenizer_extended");

class GleamParserExtended {
  constructor(code = "") {
    this.code = code;
    this.tokenizer = new GleamTokenizerExtended(code);
    this.tokens = [];
    this.pos = 0;
    this.ast = {
      type: "Program",
      module: null,
      imports: [],
      publicTypes: [],
      opaqueTypes: [],
      functions: [],
      handlers: [],
      patterns: [],
      body: []
    };
  }
  
  parse(tokens = null) {
    // Support both direct code parsing and pre-tokenized array parsing
    if (tokens && Array.isArray(tokens)) {
      this.tokens = tokens;
    } else {
      this.tokens = this.tokenizer.tokenize();
    }
    
    this.pos = 0;
    
    this.ast = {
      type: "Program",
      module: null,
      imports: [],
      publicTypes: [],
      opaqueTypes: [],
      functions: [],
      handlers: [],
      patterns: [],
      body: []
    };
    
    while (this.pos < this.tokens.length) {
      const token = this.current();
      
      if (!token) break;
      
      if (token.value === "import") {
        this.parseImport();
        continue;
      }
      
      if (token.value === "pub" && this.peek(1) && this.peek(1).value === "opaque") {
        const opaqueType = this.parseOpaqueType();
        if (opaqueType) this.ast.opaqueTypes.push(opaqueType);
        continue;
      }
      
      if (token.value === "pub" && this.peek(1) && this.peek(1).value === "type") {
        const publicType = this.parsePublicType();
        if (publicType) this.ast.publicTypes.push(publicType);
        continue;
      }
      
      if (token.value === "pub" && this.peek(1) && this.peek(1).value === "fn") {
        const func = this.parseFunction();
        if (func) this.ast.functions.push(func);
        continue;
      }
      
      if (token.value === "fn") {
        const func = this.parseFunction();
        if (func) this.ast.functions.push(func);
        continue;
      }
      
      if (token.value === "try" || token.value === "case") {
        const handler = this.parseErrorHandler();
        if (handler) this.ast.handlers.push(handler);
        continue;
      }
      
      this.advance();
    }
    
    return this.ast;
  }
  
  current() {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
  }
  
  peek(offset = 1) {
    return this.pos + offset < this.tokens.length ? this.tokens[this.pos + offset] : null;
  }
  
  advance() {
    this.pos++;
  }
  
  parseImport() {
    this.advance(); // skip 'import'
    
    let importModule = "";
    if (this.current()) {
      importModule = this.current().value;
      this.advance();
    }
    
    // Handle nested imports
    while (this.current() && this.current().value === ".") {
      importModule += ".";
      this.advance();
      if (this.current()) {
        importModule += this.current().value;
        this.advance();
      }
    }
    
    if (importModule) {
      this.ast.imports.push({ module: importModule });
    }
  }
  
  parseOpaqueType() {
    const opaqueNode = {
      type: "OpaqueType",
      name: "",
      typeParams: [],
      implementation: ""
    };
    
    this.advance(); // skip 'pub'
    this.advance(); // skip 'opaque'
    
    if (this.current() && this.current().value === "type") {
      this.advance();
    }
    
    // Opaque type name
    if (this.current()) {
      opaqueNode.name = this.current().value;
      this.advance();
    }
    
    // Type parameters
    while (this.current() && this.current().type === "Identifier") {
      opaqueNode.typeParams.push(this.current().value);
      this.advance();
    }
    
    // Implementation type
    if (this.current() && this.current().value === "=") {
      this.advance();
      if (this.current()) {
        opaqueNode.implementation = this.current().value;
        this.advance();
      }
    }
    
    return opaqueNode;
  }
  
  parsePublicType() {
    const typeNode = {
      type: "PublicType",
      name: "",
      typeParams: [],
      variants: []
    };
    
    this.advance(); // skip 'pub'
    this.advance(); // skip 'type'
    
    // Type name
    if (this.current()) {
      typeNode.name = this.current().value;
      this.advance();
    }
    
    // Type parameters in parentheses (a, b)
    if (this.current() && this.current().value === "(") {
      this.advance(); // skip '('
      
      while (this.current() && this.current().value !== ")") {
        if (this.current().type === "Identifier") {
          typeNode.typeParams.push(this.current().value);
        }
        this.advance();
      }
      
      if (this.current() && this.current().value === ")") {
        this.advance(); // skip ')'
      }
    }
    
    // Variants in braces { Ok(a) Error(b) }
    if (this.current() && this.current().value === "{") {
      this.advance(); // skip '{'
      
      let variantLoopCount = 0;
      while (this.current() && this.current().value !== "}" && variantLoopCount < 1000) {
        variantLoopCount++;
        
        // Variant name can be keyword or identifier
        if (this.current().type === "Identifier" || 
            (this.current().type === "Keyword" && !["pub", "type", "fn", "case", "let"].includes(this.current().value))) {
          
          const variant = {
            name: this.current().value,
            fields: []
          };
          this.advance();
          
          // Parse variant fields in parentheses
          if (this.current() && this.current().value === "(") {
            this.advance(); // skip '('
            
            let fieldLoopCount = 0;
            while (this.current() && this.current().value !== ")" && fieldLoopCount < 1000) {
              fieldLoopCount++;
              
              if (this.current().type === "Identifier") {
                variant.fields.push(this.current().value);
              }
              this.advance();
            }
            
            if (this.current() && this.current().value === ")") {
              this.advance(); // skip ')'
            }
          }
          
          typeNode.variants.push(variant);
        } else {
          // Skip whitespace/delimiters
          this.advance();
        }
      }
      
      if (this.current() && this.current().value === "}") {
        this.advance(); // skip '}'
      }
    }
    
    return typeNode;
  }
  
  parseFunction() {
    const funcNode = {
      type: "Function",
      name: "",
      isPublic: false,
      signature: "",
      params: [],
      guards: [],
      patterns: [],
      errorHandling: false
    };
    
    // Check if public
    if (this.current() && this.current().value === "pub") {
      funcNode.isPublic = true;
      this.advance();
    }
    
    // Skip 'fn'
    if (this.current() && this.current().value === "fn") {
      this.advance();
    }
    
    // Function name
    if (this.current()) {
      funcNode.name = this.current().value;
      this.advance();
    }
    
    // Parameters in parentheses
    if (this.current() && this.current().value === "(") {
      this.advance();
      
      while (this.current() && this.current().value !== ")") {
        if (this.current().type === "Identifier") {
          funcNode.params.push(this.current().value);
        }
        this.advance();
      }
      
      if (this.current() && this.current().value === ")") {
        this.advance();
      }
    }
    
    // Parse function body for patterns and error handling
    while (this.current() && this.pos < this.tokens.length && this.current().value !== "fn") {
      if (this.current().value === "->") {
        funcNode.patterns.push("->");
      }
      if (this.current().value === "try" || this.current().value === "?") {
        funcNode.errorHandling = true;
      }
      this.advance();
    }
    
    return funcNode;
  }
  
  parseErrorHandler() {
    const handler = {
      type: "ErrorHandler",
      kind: "",
      patterns: []
    };
    
    if (this.current()) {
      handler.kind = this.current().value; // 'try' or 'case'
      this.advance();
    }
    
    // Parse error patterns
    while (this.current() && this.current().value !== "fn" && this.pos < this.tokens.length) {
      if (this.current().value === "Ok" || this.current().value === "Error") {
        handler.patterns.push(this.current().value);
      }
      this.advance();
    }
    
    return handler;
  }
}

module.exports = GleamParserExtended;

/**
 * ElmParserExtended - Phase B
 * Advanced Elm Parsing with ADT, Pattern Matching, Records
 * Parses: custom types, union types, pattern matching, records
 */

const ElmTokenizerExtended = require("../tokenizers/elm_tokenizer_extended");

class ElmParserExtended {
  constructor(code = "") {
    this.code = code;
    this.tokenizer = new ElmTokenizerExtended(code);
    this.tokens = [];
    this.pos = 0;
    this.ast = {
      type: "Program",
      module: null,
      exposing: [],
      imports: [],
      customTypes: [],
      typeAliases: [],
      functions: [],
      patterns: [],
      records: [],
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
      exposing: [],
      imports: [],
      customTypes: [],
      typeAliases: [],
      functions: [],
      patterns: [],
      records: [],
      body: []
    };
    
    while (this.pos < this.tokens.length) {
      const token = this.current();
      
      if (!token) break;
      
      if (token.value === "module") {
        this.parseModule();
        continue;
      }
      
      if (token.value === "import") {
        this.parseImport();
        continue;
      }
      
      if (token.value === "type") {
        // Check if it's a custom type or alias
        const nextToken = this.peek(1);
        if (nextToken && nextToken.value === "alias") {
          const typeAlias = this.parseTypeAlias();
          if (typeAlias) this.ast.typeAliases.push(typeAlias);
        } else {
          const customType = this.parseCustomType();
          if (customType) this.ast.customTypes.push(customType);
        }
        continue;
      }
      
      if (token.type === "Identifier") {
        this.parseFunction();
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
  
  peekAhead(offset) {
    return this.pos + offset < this.tokens.length ? this.tokens[this.pos + offset] : null;
  }
  
  advance() {
    this.pos++;
  }
  
  parseModule() {
    this.advance(); // skip 'module'
    
    // Module name
    if (this.current() && this.current().type === "Identifier") {
      this.ast.module = this.current().value;
      this.advance();
    }
    
    // Exposing list
    if (this.current() && this.current().value === "exposing") {
      this.advance();
      
      if (this.current() && this.current().value === "(") {
        this.advance();
        
        while (this.current() && this.current().value !== ")") {
          if (this.current().type === "Identifier" || this.current().value === "..") {
            this.ast.exposing.push(this.current().value);
          }
          this.advance();
        }
        
        if (this.current() && this.current().value === ")") {
          this.advance();
        }
      }
    }
  }
  
  parseImport() {
    this.advance(); // skip 'import'
    
    let importName = "";
    if (this.current() && this.current().type === "Identifier") {
      importName = this.current().value;
      this.advance();
    }
    
    // Handle sub-imports
    while (this.current() && this.current().value === ".") {
      importName += ".";
      this.advance();
      if (this.current() && this.current().type === "Identifier") {
        importName += this.current().value;
        this.advance();
      }
    }
    
    // Handle 'as' alias
    let alias = null;
    if (this.current() && this.current().value === "as") {
      this.advance();
      if (this.current() && this.current().type === "Identifier") {
        alias = this.current().value;
        this.advance();
      }
    }
    
    if (importName) {
      this.ast.imports.push({ name: importName, alias });
    }
  }
  
  parseCustomType() {
    const typeNode = {
      type: "CustomType",
      name: "",
      typeParams: [],
      variants: [],
      body: []
    };
    
    this.advance(); // skip 'type'
    
    // Type name (can be keyword or identifier)
    if (this.current()) {
      typeNode.name = this.current().value;
      this.advance();
    }
    
    // Type parameters
    while (this.current() && this.current().type === "Identifier") {
      typeNode.typeParams.push(this.current().value);
      this.advance();
    }
    
    // Union operator
    if (this.current() && this.current().value === "=") {
      this.advance();
    }
    
    // Parse variants
    while (this.current() && this.current().value !== "\n" && this.pos < this.tokens.length) {
      if (this.current().type === "Identifier" || 
          (this.current().type === "Keyword" && !["type", "alias", "infix", "if", "then", "else"].includes(this.current().value))) {
        const variant = {
          name: this.current().value,
          fields: []
        };
        this.advance();
        
        // Parse variant fields
        while (this.current() && 
               (this.current().type === "Identifier" || this.current().type === "Keyword") && 
               this.current().value !== "|" &&
               !["type", "alias"].includes(this.current().value)) {
          variant.fields.push(this.current().value);
          this.advance();
        }
        
        typeNode.variants.push(variant);
      }
      
      if (this.current() && this.current().value === "|") {
        this.advance();
      } else {
        break;
      }
    }
    
    return typeNode;
  }
  
  parseTypeAlias() {
    const aliasNode = {
      type: "TypeAlias",
      name: "",
      typeParams: [],
      aliasType: "",
      record: null
    };
    
    this.advance(); // skip 'type'
    
    // Skip 'alias'
    if (this.current() && this.current().value === "alias") {
      this.advance();
    }
    
    // Alias name (can be keyword or identifier)
    if (this.current()) {
      aliasNode.name = this.current().value;
      this.advance();
    }
    
    // Type parameters
    while (this.current() && this.current().type === "Identifier") {
      aliasNode.typeParams.push(this.current().value);
      this.advance();
    }
    
    // Equals sign
    if (this.current() && this.current().value === "=") {
      this.advance();
    }
    
    // Parse aliased type
    if (this.current() && this.current().value === "{") {
      aliasNode.record = this.parseRecord();
    } else {
      // Simple type alias
      if (this.current()) {
        aliasNode.aliasType = this.current().value;
        this.advance();
      }
    }
    
    return aliasNode;
  }
  
  parseRecord() {
    const record = {
      type: "Record",
      fields: [],
      update: null
    };
    
    if (this.current() && this.current().value === "{") {
      this.advance();
    }
    
    // Parse fields
    while (this.current() && this.current().value !== "}") {
      if (this.current().type === "Identifier") {
        const fieldName = this.current().value;
        this.advance();
        
        let fieldType = "";
        if (this.current() && this.current().value === ":") {
          this.advance();
          if (this.current()) {
            fieldType = this.current().value;
            this.advance();
          }
        }
        
        record.fields.push({ name: fieldName, type: fieldType });
      }
      
      if (this.current() && this.current().value === ",") {
        this.advance();
      } else if (this.current() && this.current().value === "}") {
        break;
      } else {
        this.advance();
      }
    }
    
    if (this.current() && this.current().value === "}") {
      this.advance();
    }
    
    return record;
  }
  
  parseFunction() {
    const funcNode = {
      type: "Function",
      name: "",
      signature: "",
      params: [],
      patterns: []
    };
    
    // Function name
    if (this.current() && this.current().type === "Identifier") {
      funcNode.name = this.current().value;
      this.advance();
    }
    
    // Skip to pattern matching or equals
    while (this.current() && this.current().value !== "=" && this.current().value !== ":") {
      // Collect patterns
      if (this.current().type === "Identifier" || this.current().value === "(") {
        funcNode.patterns.push(this.current().value);
      }
      this.advance();
    }
    
    // Skip function body (skip until next function or type definition)
    while (this.current() && !(["type", "module", "import"].includes(this.current().value) && this.pos > 0)) {
      this.advance();
    }
    
    if (funcNode.name) {
      this.ast.functions.push(funcNode);
    }
  }
}

module.exports = ElmParserExtended;

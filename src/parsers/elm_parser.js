/**
 * ELM PARSER - Phase A Core Infrastructure
 * Round 1: Elm Language AST Generation (Functional)
 * Date: February 3, 2026
 */

const ElmTokenizer = require("../tokenizers/elm_tokenizer");

class ElmParser {
  constructor(options = {}) {
    this.options = options;
    this.tokenizer = new ElmTokenizer(options);
    this.tokens = [];
    this.ast = null;
    this.errors = [];
  }

  parse(source) {
    // Tokenize source
    this.tokens = this.tokenizer.tokenize(source);
    this.errors = [];

    // Build minimal AST
    const body = [];
    let moduleDecl = null;
    
    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      
      // Module declaration
      if (token.value === "module" && i + 1 < this.tokens.length) {
        moduleDecl = {
          type: "ModuleDeclaration",
          name: this.tokens[i + 1].value,
          exports: [],
          imports: []
        };
        body.push(moduleDecl);
      }
      
      // Exposing list
      if (token.value === "exposing" && moduleDecl) {
        i++; // Skip 'exposing'
        while (i < this.tokens.length && this.tokens[i].value !== "import") {
          if (this.tokens[i].type === "IDENTIFIER") {
            moduleDecl.exports.push(this.tokens[i].value);
          }
          i++;
        }
      }
      
      // Import declarations
      if (token.value === "import" && i + 1 < this.tokens.length) {
        const importName = this.tokens[i + 1].value;
        const importDecl = {
          type: "ImportDeclaration",
          module: importName,
          alias: null,
          exposing: []
        };
        if (moduleDecl) {
          moduleDecl.imports.push(importDecl);
        }
      }
      
      // Type declarations
      if (token.value === "type" && i + 1 < this.tokens.length) {
        const typeName = this.tokens[i + 1].value;
        const typeDecl = {
          type: "TypeDeclaration",
          name: typeName,
          constructors: []
        };
        body.push(typeDecl);
      }
      
      // Function definitions (look for identifier followed by equals)
      if (token.type === "IDENTIFIER" && i + 1 < this.tokens.length && 
          this.tokens[i + 1].value === "=" && token.value[0] === token.value[0].toLowerCase()) {
        const funcName = token.value;
        const funcDecl = {
          type: "FunctionDeclaration",
          name: funcName,
          parameters: [],
          body: null
        };
        body.push(funcDecl);
      }
    }

    this.ast = {
      type: "Program",
      body: body,
      errors: this.errors
    };

    return this.ast;
  }

  getTokens() {
    return this.tokens;
  }

  getAST() {
    return this.ast;
  }
}

module.exports = ElmParser;
module.exports.ElmParser = ElmParser;

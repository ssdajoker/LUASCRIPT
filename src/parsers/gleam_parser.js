/**
 * GLEAM PARSER - Phase A Core Infrastructure
 * Round 1: Gleam Language AST Generation
 * Date: February 3, 2026
 */

const GleamTokenizer = require("../tokenizers/gleam_tokenizer");

class GleamParser {
  constructor(options = {}) {
    this.options = options;
    this.tokenizer = new GleamTokenizer(options);
    this.tokens = [];
    this.ast = null;
    this.errors = [];
  }

  parse(source) {
    this.tokens = this.tokenizer.tokenize(source);
    this.errors = [];

    const body = [];
    
    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      
      // Type definitions
      if (token.value === "type" && i + 1 < this.tokens.length) {
        const typeName = this.tokens[i + 1].value;
        body.push({
          type: "TypeDeclaration",
          name: typeName
        });
      }
      
      // Function definitions
      if ((token.value === "pub" || token.value === "fn") && i + 1 < this.tokens.length) {
        const funcName = this.tokens[i + 1].value;
        body.push({
          type: "FunctionDeclaration",
          name: funcName,
          isPublic: token.value === "pub"
        });
      }
      
      // Const declarations
      if (token.value === "const" && i + 1 < this.tokens.length) {
        const constName = this.tokens[i + 1].value;
        body.push({
          type: "ConstDeclaration",
          name: constName
        });
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

module.exports = GleamParser;

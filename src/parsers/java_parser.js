/**
 * JAVA PARSER - Simplified Phase A Implementation
 * Round 1: Robust Tokenization and Basic Parsing
 * Date: February 3, 2026
 */

const JavaTokenizer = require("../tokenizers/java_tokenizer");

class JavaParser {
  constructor(options = {}) {
    this.options = options;
    this.tokenizer = new JavaTokenizer(options);
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
    let className = "";
    let classDecl = null;
    
    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      
      if (token.value === "class" && i + 1 < this.tokens.length) {
        className = this.tokens[i + 1].value;
        classDecl = {
          type: "ClassDeclaration",
          name: className,
          methods: []
        };
        body.push(classDecl);
      }
      
      if ((token.value === "void" || token.value === "int" || token.value === "String") && 
          i + 1 < this.tokens.length && 
          this.tokens[i + 1].type === "IDENTIFIER") {
        const methodName = this.tokens[i + 1].value;
        if (classDecl && classDecl.methods) {
          classDecl.methods.push({
            type: "MethodDeclaration",
            name: methodName,
            returnType: token.value
          });
        }
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

module.exports = JavaParser;
module.exports.JavaParser = JavaParser;

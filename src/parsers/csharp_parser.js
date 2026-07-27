/**
 * C# PARSER - Phase A Core Infrastructure
 * Round 1: C# Language AST Generation
 * Date: February 3, 2026
 */

const CSharpTokenizer = require("../tokenizers/csharp_tokenizer");

class CSharpParser {
  constructor(options = {}) {
    this.options = options;
    this.tokenizer = new CSharpTokenizer(options);
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
    let classDecl = null;
    let namespaceDecl = null;
    
    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      
      // Namespace declaration
      if (token.value === "namespace" && i + 1 < this.tokens.length) {
        namespaceDecl = {
          type: "NamespaceDeclaration",
          name: this.tokens[i + 1].value,
          declarations: []
        };
        body.push(namespaceDecl);
      }
      
      // Class declaration
      if (token.value === "class" && i + 1 < this.tokens.length) {
        classDecl = {
          type: "ClassDeclaration",
          name: this.tokens[i + 1].value,
          modifiers: [],
          methods: [],
          properties: []
        };
        
        if (namespaceDecl) {
          namespaceDecl.declarations.push(classDecl);
        } else {
          body.push(classDecl);
        }
      }
      
      // Method declarations
      if ((token.value === "void" || token.value === "int" || token.value === "string" || 
           token.value === "bool" || token.value === "double" || token.value === "async") && 
          i + 1 < this.tokens.length && 
          this.tokens[i + 1].type === "IDENTIFIER") {
        const methodName = this.tokens[i + 1].value;
        const isAsync = token.value === "async";
        
        if (classDecl && classDecl.methods) {
          classDecl.methods.push({
            type: "MethodDeclaration",
            name: methodName,
            returnType: token.value === "async" ? "Task" : token.value,
            isAsync: isAsync,
            parameters: []
          });
        }
      }
      
      // Property declarations (get/set)
      if (token.value === "get" || token.value === "set") {
        if (classDecl && classDecl.properties) {
          classDecl.properties.push({
            type: "PropertyAccessor",
            accessor: token.value
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

module.exports = CSharpParser;
module.exports.CSharpParser = CSharpParser;

"use strict";

/**
 * Ruby Parser - Converts Ruby code to canonical IR AST
 * Tier 2 Language Support for LUASCRIPT Multi-Language Transpilation
 * Memory: Object pooling for AST nodes (Phase B pattern)
 * 
 * Parses Ruby code and generates AST nodes compatible with the canonical IR.
 * Handles Ruby-specific syntax and converts to standardized IR format.
 */

const { IRBuilder } = require("../ir/builder");

/**
 * Object pool for memory-efficient AST node reuse
 * Prevents memory leaks during transpilation
 */
class ObjectPool {
  constructor(maxSize = 5000) {
    this.nodes = [];
    this.maxSize = maxSize;
  }

  getNode(type, data) {
    let node = this.nodes.pop() || {};
    // Clear previous properties
    for (const key in node) delete node[key];
    node.type = type;
    if (data) Object.assign(node, data);
    return node;
  }

  returnNode(node) {
    if (this.nodes.length < this.maxSize) {
      this.nodes.push(node);
    }
  }

  clear() {
    this.nodes = [];
  }

  getStats() {
    return {
      nodesPooled: this.nodes.length,
      maxSize: this.maxSize,
    };
  }
}

class RubyParser {
  constructor(options = {}) {
    this.options = options;
    this.tokens = [];
    this.current = 0;
    this.builder = new IRBuilder(options);
    
    // Memory management (Phase B pattern)
    this.pool = new ObjectPool(5000);
    this.objectCount = 0;
    this.maxObjects = 50000;
  }

  parse(rubyCode) {
    // Reset memory tracking for new parse
    this.objectCount = 0;
    
    // Tokenize Ruby code
    this.tokens = this.tokenize(rubyCode);
    this.current = 0;

    const program = this.parseProgram();
    return this.createNode("Program", { body: program });
  }

  tokenize(code) {
    // Simple tokenizer for Ruby
    const tokens = [];
    const lines = code.split("\n");

    for (let line of lines) {
      // Remove comments
      line = line.replace(/#.*$/, "");

      // Basic tokenization (simplified)
      // NOTE: Patterns must not have ^ anchor - we add it per pattern
      // NOTE: Order matters - longer patterns first!
      const tokenPatterns = [
        { type: "KEYWORD", regex: /^(?:\b(?:def|end|class|if|elsif|else|unless|while|until|for|in|do|return|yield|break|next|case|when|then|begin|rescue|ensure|module|puts|print|require|super|self|true|false|nil|and|or|not)\b)/i },
        { type: "SYMBOL", regex: /^:[a-zA-Z_]\w*/ },  // Match :symbol (must come before COLON)
        { type: "HASH_ROCKET", regex: /^=>/ },  // Match => (must come before OPERATOR)
        { type: "BLOCK_PIPE", regex: /^\|/ },  // Match | for block parameters (BEFORE OPERATOR)
        { type: "OPERATOR", regex: /^(?:===|==|!=|<=|>=|<=>|&&|\|\||\.\.|\*\*|[+\-*/%&^<>=!~]+)/ },  // Removed | from here
        { type: "IDENTIFIER", regex: /^[a-zA-Z_]\w*/ },
        { type: "NUMBER", regex: /^\d+(?:\.\d+)?/ },
        { type: "STRING", regex: /^(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/ },
        { type: "PUNCTUATION", regex: /^[(){}[\],;:.]/ },  // Removed | from here too
        { type: "WHITESPACE", regex: /^\s+/ },
      ];

      let pos = 0;
      while (pos < line.length) {
        let matched = false;

        for (const { type, regex } of tokenPatterns) {
          const match = line.slice(pos).match(regex);

          if (match) {
            if (type !== "WHITESPACE" && type !== "COMMENT") {
              tokens.push({
                type,
                value: match[0],
                position: pos,
              });
            }
            pos += match[0].length;
            matched = true;
            break;
          }
        }

        if (!matched) {
          pos++;
        }
      }
    }

    return tokens;
  }

  parseProgram() {
    const body = [];

    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) {
        body.push(stmt);
      }
    }

    return body;
  }

  parseStatement() {
    if (this.isAtEnd()) return null;

    // Skip optional semicolons (statement separators)
    while (!this.isAtEnd() && this.peek()?.value === ";") {
      this.consume(";", "Expected ';'");
    }

    if (this.isAtEnd()) return null;

    const token = this.peek();

    switch (token?.value?.toLowerCase()) {
    case "def":
      return this.parseFunctionDeclaration();

    case "class":
      return this.parseClassDeclaration();

    case "if":
      return this.parseIfStatement();

    case "while":
      return this.parseWhileStatement();

    case "for":
      return this.parseForStatement();

    case "return":
      return this.parseReturnStatement();

    case "puts":
    case "print":
      return this.parsePrintStatement();

    default:
      return this.parseExpressionStatement();
    }
  }

  parseFunctionDeclaration() {
    this.consume("def", "Expected 'def'");
    const name = this.consume(null, "Expected function name").value;

    // Parse parameters
    const params = [];
    if (this.peek()?.value === "(") {
      this.consume("(", "Expected '('");
      while (this.peek()?.value !== ")") {
        const param = this.consume(null, "Expected parameter name").value;
        params.push(param);
        if (this.peek()?.value === ",") {
          this.consume(",", "Expected ','");
        }
      }
      this.consume(")", "Expected ')'");
    }

    const body = this.parseBlockUntilEnd();

    return {
      type: "FunctionDeclaration",
      name,
      params: params.map((p) => ({ type: "Identifier", name: p })),
      body,
    };
  }

  parseClassDeclaration() {
    this.consume("class", "Expected 'class'");
    const name = this.consume(null, "Expected class name").value;

    let superClass = null;
    if (this.peek()?.value === "<") {
      this.consume("<", "Expected '<'");
      superClass = { type: "Identifier", name: this.consume(null, "Expected superclass name").value };
    }

    const body = this.parseBlockUntilEnd();

    return {
      type: "ClassDeclaration",
      name,
      superClass,
      body: {
        type: "BlockStatement",
        body,
      },
    };
  }

  parseIfStatement() {
    this.consume("if", "Expected 'if'");
    const test = this.parseExpression();
    // Skip optional semicolon after condition
    if (this.peek()?.value === ";") {
      this.consume(";", "Expected ';'");
    }
    const consequent = this.parseBlockUntilElseOrEnd();

    let alternate = null;
    if (this.peek()?.value?.toLowerCase() === "elsif") {
      alternate = this.parseIfStatement();
    } else if (this.peek()?.value?.toLowerCase() === "else") {
      this.consume("else", "Expected 'else'");
      alternate = {
        type: "BlockStatement",
        body: this.parseBlockUntilEnd(),
      };
    }

    if (this.peek()?.value?.toLowerCase() === "end") {
      this.consume("end", "Expected 'end'");
    }

    return {
      type: "IfStatement",
      test,
      consequent,
      alternate,
    };
  }

  parseWhileStatement() {
    this.consume("while", "Expected 'while'");
    const test = this.parseExpression();
    // Skip optional semicolon after condition
    if (this.peek()?.value === ";") {
      this.consume(";", "Expected ';'");
    }
    const body = this.parseBlockUntilEnd();  // This already consumes 'end'

    return {
      type: "WhileStatement",
      test,
      body: {
        type: "BlockStatement",
        body,
      },
    };
  }

  parseForStatement() {
    this.consume("for", "Expected 'for'");
    const left = {
      type: "VariableDeclaration",
      declarations: [
        {
          type: "VariableDeclarator",
          id: { type: "Identifier", name: this.consume(null, "Expected variable name").value },
          init: null,
        },
      ],
      kind: "let",
    };

    this.consume("in", "Expected 'in'");
    const right = this.parseExpression();
    const body = this.parseBlockUntilEnd();  // This already consumes 'end'

    return {
      type: "ForOfStatement",
      left,
      right,
      body: {
        type: "BlockStatement",
        body,
      },
    };
  }

  parseReturnStatement() {
    this.consume("return", "Expected 'return'");
    const argument = this.isAtEnd() || this.peek()?.value?.toLowerCase() === "end" ? null : this.parseExpression();

    return {
      type: "ReturnStatement",
      argument,
    };
  }

  parsePrintStatement() {
    const printType = this.consume(null, "Expected print function").value;

    const args = [];
    
    // Handle both puts(...) and puts ... syntax
    if (this.peek()?.value === "(") {
      this.consume("(", "Expected '('");
      while (this.peek()?.value !== ")") {
        args.push(this.parseExpression());
        if (this.peek()?.value === ",") {
          this.consume(",", "Expected ','");
        }
      }
      this.consume(")", "Expected ')'");
    } else {
      // Parse arguments without parentheses
      while (!this.isAtEnd() && this.peek()?.value !== "\n" && 
             !["def", "class", "if", "while", "for", "end"].includes(this.peek()?.value?.toLowerCase())) {
        args.push(this.parseExpression());
        if (this.peek()?.value === ",") {
          this.consume(",", "Expected ','");
        } else {
          break; // Stop at first non-comma
        }
      }
    }

    return {
      type: "ExpressionStatement",
      expression: {
        type: "CallExpression",
        callee: { type: "Identifier", name: printType },
        arguments: args,
      },
    };
  }

  parseExpressionStatement() {
    const expr = this.parseExpression();
    return {
      type: "ExpressionStatement",
      expression: expr,
    };
  }

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    let expr = this.parseLogical();

    if (this.peek()?.type === "OPERATOR" && this.peek()?.value === "=") {
      const op = this.consume(null, "Expected operator").value;
      const right = this.parseExpression();

      return {
        type: "AssignmentExpression",
        operator: op,
        left: expr,
        right,
      };
    }

    return expr;
  }

  parseLogical() {
    let expr = this.parseComparison();

    while (
      this.peek()?.value?.toLowerCase() === "and" ||
      this.peek()?.value?.toLowerCase() === "or" ||
      this.peek()?.value === "&&" ||
      this.peek()?.value === "||"
    ) {
      const op = this.consume(null, "Expected operator").value;
      const right = this.parseComparison();

      expr = {
        type: "LogicalExpression",
        operator: op,
        left: expr,
        right,
      };
    }

    return expr;
  }

  parseComparison() {
    let expr = this.parseAdditive();

    while (
      this.peek()?.value === "==" ||
      this.peek()?.value === "!=" ||
      this.peek()?.value === "<" ||
      this.peek()?.value === ">" ||
      this.peek()?.value === "<=" ||
      this.peek()?.value === ">="
    ) {
      const op = this.consume(null, "Expected operator").value;
      const right = this.parseAdditive();

      expr = {
        type: "BinaryExpression",
        operator: op,
        left: expr,
        right,
      };
    }

    return expr;
  }

  parseAdditive() {
    let expr = this.parseMultiplicative();

    while (this.peek()?.value === "+" || this.peek()?.value === "-") {
      const op = this.consume(null, "Expected operator").value;
      const right = this.parseMultiplicative();

      expr = {
        type: "BinaryExpression",
        operator: op,
        left: expr,
        right,
      };
    }

    return expr;
  }

  parseMultiplicative() {
    let expr = this.parseUnary();

    while (this.peek()?.value === "*" || this.peek()?.value === "/" || this.peek()?.value === "%") {
      const op = this.consume(null, "Expected operator").value;
      const right = this.parseUnary();

      expr = {
        type: "BinaryExpression",
        operator: op,
        left: expr,
        right,
      };
    }

    return expr;
  }

  parseUnary() {
    if (this.peek()?.value === "!" || this.peek()?.value === "-" || this.peek()?.value === "+") {
      const op = this.consume(null, "Expected operator").value;
      const arg = this.parseUnary();

      return {
        type: "UnaryExpression",
        operator: op,
        argument: arg,
      };
    }

    return this.parseMember();
  }

  parseMember() {
    let expr = this.parsePrimary();

    while (true) {
      if (this.peek()?.value === ".") {
        this.consume(".", "Expected '.'");
        const prop = { type: "Identifier", name: this.consume(null, "Expected property name").value };

        // Check if this is a method call (with or without parentheses)
        let isMethodCall = false;
        let args = [];
        
        if (this.peek()?.value === "(") {
          // Method call WITH parentheses: .map(...)
          this.consume("(", "Expected '('");
          isMethodCall = true;
          while (this.peek()?.value !== ")") {
            args.push(this.parseExpression());
            if (this.peek()?.value === ",") {
              this.consume(",", "Expected ','");
            }
          }
          this.consume(")", "Expected ')'");
        } else if (this.peek()?.value === "{") {
          // Method call WITHOUT parentheses followed by block: .map { ... }
          isMethodCall = true;
        }

        if (isMethodCall) {
          // It's a method call
          expr = {
            type: "CallExpression",
            callee: {
              type: "MemberExpression",
              object: expr,
              property: prop,
              computed: false,
            },
            arguments: args,
          };
          
          // Check for block after method call: .map { |x| x * 2 }
          if (this.peek()?.value === "{") {
            const block = this.parseRubyBlock();
            expr.block = block;
          }
        } else {
          // Property access, not method call
          expr = {
            type: "MemberExpression",
            object: expr,
            property: prop,
            computed: false,
          };
        }
      } else if (this.peek()?.value === "[") {
        this.consume("[", "Expected '['");
        const index = this.parseExpression();
        this.consume("]", "Expected ']'");

        expr = {
          type: "MemberExpression",
          object: expr,
          property: index,
          computed: true,
        };
      } else if (this.peek()?.value === "(") {
        // Function call
        this.consume("(", "Expected '('");
        const args = [];
        while (this.peek()?.value !== ")") {
          args.push(this.parseExpression());
          if (this.peek()?.value === ",") {
            this.consume(",", "Expected ','");
          }
        }
        this.consume(")", "Expected ')'");

        expr = {
          type: "CallExpression",
          callee: expr,
          arguments: args,
        };
        
        // Check for block after function call
        if (this.peek()?.value === "{") {
          const block = this.parseRubyBlock();
          expr.block = block;
        }
      } else {
        break;
      }
    }

    return expr;
  }
  
  /**
   * Parse Ruby block: { |x| x * 2 } or { |a, b| a + b }
   * @returns {object} BlockExpression node
   */
  parseRubyBlock() {
    this.consume("{", "Expected '{'");
    
    const params = [];
    
    // Parse block parameters: |x| or |a, b|
    if (this.peek()?.type === "BLOCK_PIPE") {
      this.consume(null, "Expected '|'");  // consume first |
      
      while (this.peek()?.type !== "BLOCK_PIPE") {
        if (this.isAtEnd()) {
          throw new Error("Unexpected end of input in block parameters");
        }
        const param = this.consume(null, "Expected parameter name").value;
        params.push({ type: "Identifier", name: param });
        
        if (this.peek()?.value === ",") {
          this.consume(",", "Expected ','");
        }
      }
      
      this.consume(null, "Expected '|'");  // consume closing |
    }
    
    // Parse block body (single expression or multiple statements)
    const body = [];
    while (!this.isAtEnd() && this.peek()?.value !== "}") {
      body.push(this.parseExpression());
      // Allow optional semicolons or commas between statements
      if (this.peek()?.value === ";" || this.peek()?.value === ",") {
        this.advance();
      }
    }
    
    this.consume("}", "Expected '}'");
    
    return {
      type: "BlockExpression",
      params,
      body: {
        type: "BlockStatement",
        body,
      },
    };
  }

  parsePrimary() {
    const token = this.peek();

    if (!token) {
      return { type: "Identifier", name: "nil" };
    }

    if (token.type === "NUMBER") {
      const value = parseFloat(this.consume(null, "Expected number").value);
      return {
        type: "Literal",
        value,
        raw: String(value),
      };
    }

    if (token.type === "STRING") {
      const value = this.consume(null, "Expected string").value;
      // Remove quotes
      const stringValue = value.slice(1, -1);
      return {
        type: "Literal",
        value: stringValue,
        raw: value,
      };
    }
    
    // Handle Ruby symbols: :symbol_name
    if (token.type === "SYMBOL") {
      const symbolValue = this.consume(null, "Expected symbol").value;
      return {
        type: "SymbolLiteral",
        value: symbolValue,  // Keep the : prefix
        name: symbolValue.slice(1),  // Without : for lookups
        raw: symbolValue,
      };
    }

    if (token.value === "true" || token.value === "false" || token.value === "nil") {
      const keyword = this.consume(null, "Expected keyword").value;
      return {
        type: "Literal",
        value: keyword === "true" ? true : keyword === "false" ? false : null,
        raw: keyword,
      };
    }

    if (token.type === "IDENTIFIER" || token.type === "KEYWORD") {
      const name = this.consume(null, "Expected identifier").value;
      return { type: "Identifier", name };
    }

    if (token.value === "(") {
      this.consume("(", "Expected '('");
      const expr = this.parseExpression();
      this.consume(")", "Expected ')'");
      return expr;
    }

    if (token.value === "[") {
      this.consume("[", "Expected '['");
      const elements = [];
      while (this.peek()?.value !== "]") {
        elements.push(this.parseExpression());
        if (this.peek()?.value === ",") {
          this.consume(",", "Expected ','");
        }
      }
      this.consume("]", "Expected ']'");
      return {
        type: "ArrayExpression",
        elements,
      };
    }

    if (token.value === "{") {
      this.consume("{", "Expected '{'");
      const properties = [];
      while (this.peek()?.value !== "}") {
        const key = this.parseExpression();
        
        // Support both : and => for hash separators
        // Ruby uses => (hash rocket) especially with symbol keys: { :name => "John" }
        if (this.peek()?.type === "HASH_ROCKET") {
          this.consume(null, "Expected '=>'");
        } else if (this.peek()?.value === ":") {
          this.consume(":", "Expected ':'");
        } else {
          throw new Error(`Expected ':' or '=>' in hash literal, got ${this.peek()?.value}`);
        }
        
        const value = this.parseExpression();
        properties.push({ 
          type: "Property",
          key, 
          value,
          kind: "init",
        });
        
        if (this.peek()?.value === ",") {
          this.consume(",", "Expected ','");
        }
      }
      this.consume("}", "Expected '}'");
      return {
        type: "ObjectExpression",
        properties,
      };
    }

    throw new Error(`Unexpected token: ${token.value}`);
  }

  parseBlockUntilEnd() {
    const statements = [];

    while (!this.isAtEnd() && this.peek()?.value?.toLowerCase() !== "end") {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }

    if (this.peek()?.value?.toLowerCase() === "end") {
      this.consume("end", "Expected 'end'");
    }

    return statements;
  }

  parseBlockUntilElseOrEnd() {
    const statements = [];

    while (
      !this.isAtEnd() &&
      this.peek()?.value?.toLowerCase() !== "end" &&
      this.peek()?.value?.toLowerCase() !== "elsif" &&
      this.peek()?.value?.toLowerCase() !== "else"
    ) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }

    return {
      type: "BlockStatement",
      body: statements,
    };
  }

  peek() {
    if (this.isAtEnd()) return null;
    return this.tokens[this.current];
  }

  consume(expected, message) {
    if (expected && this.peek()?.value?.toLowerCase() !== expected?.toLowerCase()) {
      throw new Error(`${message} (got ${this.peek()?.value})`);
    }

    if (this.isAtEnd()) {
      throw new Error(message);
    }

    return this.tokens[this.current++];
  }

  isAtEnd() {
    return this.current >= this.tokens.length;
  }
  
  advance() {
    if (!this.isAtEnd()) {
      this.current++;
    }
  }

  /**
   * Create AST node using object pool (Phase B pattern)
   * @param {string} type - Node type
   * @param {object} data - Node properties
   * @returns {object} Pooled AST node
   */
  createNode(type, data) {
    if (++this.objectCount > this.maxObjects) {
      throw new Error(`Memory limit exceeded: ${this.objectCount} AST nodes created`);
    }
    return this.pool.getNode(type, data);
  }

  /**
   * Get memory usage statistics
   * @returns {object} Memory statistics
   */
  getMemoryStats() {
    return {
      objectCount: this.objectCount,
      maxObjects: this.maxObjects,
      utilization: ((this.objectCount / this.maxObjects) * 100).toFixed(1) + "%",
      pool: this.pool.getStats(),
    };
  }

  /**
   * Reset memory state
   */
  reset() {
    this.objectCount = 0;
    this.current = 0;
    this.tokens = [];
    // Don't clear pool - reuse across parses
  }
}

module.exports = {
  RubyParser,
};

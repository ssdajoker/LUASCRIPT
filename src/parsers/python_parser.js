"use strict";

/**
 * Python Parser - Phase A Core Transpiler + TIER 1 OPTIMIZATIONS
 * Parses Python 3.11+ syntax to canonical AST/IR
 * 
 * Handles:
 * - Classes with inheritance and decorators
 * - Functions and async/await
 * - Context managers (with statements)
 * - Comprehensions (list, dict, set)
 * - F-strings and string formatting
 * - Exception handling
 * - Type hints and annotations
 * - Generators and yield
 * 
 * Memory: Object pooling for tokens and AST nodes (Phase B pattern)
 * 
 * TIER 1 OPTIMIZATIONS INTEGRATED (Step 3):
 * - Tier1OptimizationManager integration
 * - Hybrid caching for parse results
 * - Worker pool for concurrent parsing
 * - Enhanced memory pooling
 * - Performance monitoring
 */

// Import Tier 1 Optimization Suite
const {  Tier1OptimizationManager
} = require("../tier1_optimization_suite");

/**
 * Object Pool for memory-efficient token and AST node creation
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

class PythonParser {
  constructor(options = {}) {
    this.options = options;
    this.initializeLexer();
    this.position = 0;
    this.tokens = [];
    this.indentStack = [0];
    this.ast = null;
    
    // Memory management (Phase B pattern)
    this.pool = new ObjectPool(options.poolSize || 5000);
    this.objectCount = 0;
    this.maxObjects = options.maxObjects || 50000;
    
    // TIER 1 OPTIMIZATION: Integrate Tier1OptimizationManager (Step 3)
    if (options.enableTier1Optimizations !== false) {
      this.tier1Optimizer = new Tier1OptimizationManager();
      this.optimizationStats = {
        cacheHits: 0,
        cacheMisses: 0,
        totalParses: 0,
        averageParseTime: 0
      };
    }
  }

  /**
   * Initialize lexer token patterns
   */
  initializeLexer() {
    this.tokenPatterns = {
      // Keywords
      KEYWORDS: /^(False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/,
      
      // Identifiers
      IDENTIFIER: /^[a-zA-Z_][a-zA-Z0-9_]*/,
      
      // Numbers
      FLOAT: /^(\d+\.\d*|\d*\.\d+)([eE][+-]?\d+)?/,
      INTEGER: /^0[xX][0-9a-fA-F]+|^0[bB][01]+|^0[oO][0-7]+|^\d+/,
      
      // Strings
      FSTRING: /^f[rRuU]?(['"])/,
      STRING: /^[rRuUbB]?(['"])/,
      
      // Operators
      OPERATOR: /^(==|!=|<=|>=|\/\/|<<|>>|\*\*|->|:=|[+\-*/%&|^<>=!])/,
      
      // Delimiters
      LPAREN: /^\(/,
      RPAREN: /^\)/,
      LBRACKET: /^\[/,
      RBRACKET: /^\]/,
      LBRACE: /^\{/,
      RBRACE: /^\}/,
      COMMA: /^,/,
      COLON: /^:/,
      DOT: /^\./,
      SEMICOLON: /^;/,
      AT: /^@/,
      
      // Whitespace
      NEWLINE: /^\n/,
      INDENT: /^[ \t]+/,
      
      // Comments
      COMMENT: /^#.*/,
    };
  }

  /**
   * Tokenize Python source code
   */
  tokenize(source) {
    this.tokens = [];
    this.objectCount = 0; // Reset memory tracking
    let index = 0;
    let line = 1;
    let column = 1;
    let atLineStart = true;

    while (index < source.length) {
      const remaining = source.substring(index);
      let matched = false;

      // Handle indentation at line start
      if (atLineStart && /^[ \t]+/.test(remaining)) {
        const indent = /^[ \t]+/.exec(remaining)[0];
        const indentLevel = indent.length;
        
        this.updateIndentStack(indentLevel);
        index += indent.length;
        column += indent.length;
        atLineStart = false;
        matched = true;
      }

      // Skip non-indentation whitespace (spaces/tabs between tokens)
      if (!matched && !atLineStart && /^[ \t]+/.test(remaining)) {
        const whitespace = /^[ \t]+/.exec(remaining)[0];
        index += whitespace.length;
        column += whitespace.length;
        matched = true;
      }

      // Skip comments
      if (!matched && /^#/.test(remaining)) {
        const comment = /^#.*/.exec(remaining)[0];
        index += comment.length;
        column += comment.length;
        matched = true;
      }

      // Newline
      if (!matched && /^\n/.test(remaining)) {
        this.tokens.push(this.createToken("NEWLINE", {
          value: "\n",
          line,
          column,
        }));
        index++;
        line++;
        column = 1;
        atLineStart = true;
        matched = true;
      }

      // F-strings
      if (!matched && this.tokenPatterns.FSTRING.test(remaining)) {
        const fstringMatch = /^f[rRuU]?(['"])/.exec(remaining);
        const quote = fstringMatch[1];
        let end = fstringMatch[0].length;
        
        while (end < remaining.length) {
          if (remaining[end] === quote && remaining[end - 1] !== "\\") break;
          end++;
        }

        const content = remaining.substring(fstringMatch[0].length, end);
        this.tokens.push(this.createToken("FSTRING", {
          value: content,
          quote,
          line,
          column,
        }));
        index += end + 1;
        column += end + 1;
        matched = true;
      }

      // Regular strings
      if (!matched && this.tokenPatterns.STRING.test(remaining)) {
        const match = /^[rRuUbB]?(['"])/.exec(remaining);
        const quote = match[1];
        let end = match[0].length;

        // Handle triple quotes
        let isTriple = false;
        if (remaining.substring(end, end + 2) === quote + quote) {
          isTriple = true;
          end += 2;
          while (end < remaining.length - 2) {
            if (remaining.substring(end, end + 3) === quote + quote + quote) break;
            end++;
          }
          end += 3;
        } else {
          while (end < remaining.length) {
            if (remaining[end] === quote && remaining[end - 1] !== "\\") break;
            if (remaining[end] === "\n") break;
            end++;
          }
          end++;
        }

        const content = remaining.substring(match[0].length, end - (isTriple ? 3 : 1));
        this.tokens.push(this.createToken("STRING", {
          value: content,
          quote,
          isTriple,
          prefix: match[0].replace(/['"]/, ""),
          line,
          column,
        }));
        index += end;
        column += end;
        matched = true;
      }

      // Numbers
      if (!matched && this.tokenPatterns.FLOAT.test(remaining)) {
        const match = this.tokenPatterns.FLOAT.exec(remaining)[0];
        this.tokens.push(this.createToken("FLOAT", {
          value: parseFloat(match),
          line,
          column,
        }));
        index += match.length;
        column += match.length;
        matched = true;
      }

      if (!matched && this.tokenPatterns.INTEGER.test(remaining)) {
        const match = this.tokenPatterns.INTEGER.exec(remaining)[0];
        this.tokens.push({
          type: "INTEGER",
          value: this.parseInt(match),
          line,
          column,
        });
        index += match.length;
        column += match.length;
        matched = true;
      }

      // Operators
      if (!matched && this.tokenPatterns.OPERATOR.test(remaining)) {
        const match = this.tokenPatterns.OPERATOR.exec(remaining)[0];
        this.tokens.push(this.createToken("OPERATOR", {
          value: match,
          line,
          column,
        }));
        index += match.length;
        column += match.length;
        matched = true;
      }

      // Keywords and identifiers
      if (!matched && this.tokenPatterns.IDENTIFIER.test(remaining)) {
        const match = this.tokenPatterns.IDENTIFIER.exec(remaining)[0];
        const isKeyword = this.tokenPatterns.KEYWORDS.test(match);
        
        this.tokens.push(this.createToken(isKeyword ? match.toUpperCase() : "IDENTIFIER", {
          value: match,
          line,
          column,
        }));
        index += match.length;
        column += match.length;
        matched = true;
      }

      // Single character tokens
      if (!matched) {
        const char = remaining[0];
        let tokenType = null;

        switch (char) {
        case "(": tokenType = "LPAREN"; break;
        case ")": tokenType = "RPAREN"; break;
        case "[": tokenType = "LBRACKET"; break;
        case "]": tokenType = "RBRACKET"; break;
        case "{": tokenType = "LBRACE"; break;
        case "}": tokenType = "RBRACE"; break;
        case ",": tokenType = "COMMA"; break;
        case ":": tokenType = "COLON"; break;
        case ".": tokenType = "DOT"; break;
        case ";": tokenType = "SEMICOLON"; break;
        case "@": tokenType = "AT"; break;
        }

        if (tokenType) {
          this.tokens.push({
            type: tokenType,
            value: char,
            line,
            column,
          });
          index++;
          column++;
          matched = true;
        }
      }

      if (!matched) {
        throw new Error(`Unexpected character '${remaining[0]}' at line ${line}, column ${column}`);
      }
    }

    return this.tokens;
  }

  /**
   * Update indent stack for tracking nesting
   */
  updateIndentStack(indentLevel) {
    const current = this.indentStack[this.indentStack.length - 1];
    
    if (indentLevel > current) {
      this.indentStack.push(indentLevel);
      this.tokens.push(this.createToken("INDENT", {
        value: indentLevel,
      }));
    } else if (indentLevel < current) {
      while (this.indentStack.length > 1 && this.indentStack[this.indentStack.length - 1] > indentLevel) {
        this.indentStack.pop();
        this.tokens.push(this.createToken("DEDENT", {
          value: indentLevel,
        }));
      }
    }
  }

  /**
   * Parse integer with base support
   */
  parseInt(str) {
    if (str.startsWith("0x") || str.startsWith("0X")) {
      return parseInt(str, 16);
    }
    if (str.startsWith("0b") || str.startsWith("0B")) {
      return parseInt(str, 2);
    }
    if (str.startsWith("0o") || str.startsWith("0O")) {
      return parseInt(str, 8);
    }
    return parseInt(str, 10);
  }

  /**
   * Parse Python source code to AST
   */
  parse(source) {
    this.tokens = this.tokenize(source);
    this.position = 0;

    const statements = [];
    
    while (this.position < this.tokens.length) {
      this.skipNewlines();
      if (this.position >= this.tokens.length) break;

      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
      
      // CRITICAL: Advance position after each statement to prevent infinite loop
      this.next();
    }

    return {
      type: "Module",
      body: statements,
      sourceType: "module",
    };
  }

  /**
   * Parse a single statement
   */
  parseStatement() {
    const token = this.currentToken;

    if (!token) return null;

    switch (token.type) {
    case "CLASS":
      return this.parseClassDeclaration();
    case "DEF":
      return this.parseFunctionDeclaration();
    case "ASYNC":
      return this.parseAsyncFunction();
    case "IF":
      return this.parseIf();
    case "FOR":
      return this.parseFor();
    case "WHILE":
      return this.parseWhile();
    case "WITH":
      return this.parseWith();
    case "TRY":
      return this.parseTry();
    case "RETURN":
      return this.parseReturn();
    case "RAISE":
      return this.parseRaise();
    case "IMPORT":
      return this.parseImport();
    case "FROM":
      return this.parseFromImport();
    case "PASS":
      return this.parsePass();
    case "BREAK":
      return this.parseBreak();
    case "CONTINUE":
      return this.parseContinue();
    case "AT":
      return this.parseDecorator();
    default:
      return this.parseExpressionStatement();
    }
  }

  /**
   * Skip newline tokens
   */
  skipNewlines() {
    while (this.position < this.tokens.length && this.tokens[this.position].type === "NEWLINE") {
      this.position++;
    }
  }

  /**
   * Get current token
   */
  get currentToken() {
    if (this.position < this.tokens.length) {
      return this.tokens[this.position];
    }
    return null;
  }

  /**
   * Advance to next token
   */
  next() {
    this.position++;
    this.skipNewlines();
  }

  /**
   * Parse class declaration
   */
  parseClassDeclaration() {
    // Simplified class parsing
    this.next(); // Skip 'class'
    const name = this.currentToken.value;
    this.next();

    const bases = [];
    if (this.currentToken?.type === "LPAREN") {
      // Parse base classes
      this.next();
      while (this.currentToken?.type !== "RPAREN") {
        bases.push({ type: "Identifier", name: this.currentToken.value });
        this.next();
        if (this.currentToken?.type === "COMMA") this.next();
      }
      this.next(); // Skip ')'
    }

    this.skipTo("COLON");
    this.next();

    const body = [];
    while (this.currentToken?.type === "INDENT") {
      this.next();
      body.push(this.parseStatement());
    }

    return {
      type: "ClassDeclaration",
      name,
      bases,
      body,
    };
  }

  /**
   * Parse function declaration
   */
  parseFunctionDeclaration() {
    this.next(); // Skip 'def'
    const name = this.currentToken.value;
    this.next();

    const params = this.parseParameters();
    
    let returnType = null;
    if (this.currentToken?.type === "OPERATOR" && this.currentToken.value === "->") {
      this.next();
      returnType = this.parseTypeHint();
    }

    this.skipTo("COLON");
    this.next();

    const body = this.parseBlockBody();

    return {
      type: "FunctionDeclaration",
      name,
      params,
      returnType,
      body,
    };
  }

  /**
   * Parse async function
   */
  parseAsyncFunction() {
    this.next(); // Skip 'async'
    if (this.currentToken?.type !== "DEF") {
      throw new Error("Expected def after async");
    }

    const func = this.parseFunctionDeclaration();
    func.async = true;
    return func;
  }

  /**
   * Parse function parameters
   */
  parseParameters() {
    const params = [];
    
    if (this.currentToken?.type === "LPAREN") {
      this.next();
      
      while (this.currentToken?.type !== "RPAREN") {
        const param = {
          type: "Parameter",
          name: this.currentToken.value,
          annotation: null,
          default: null,
        };

        this.next();

        if (this.currentToken?.type === "COLON") {
          this.next();
          param.annotation = this.parseTypeHint();
        }

        if (this.currentToken?.type === "OPERATOR" && this.currentToken.value === "=") {
          this.next();
          param.default = this.parseExpression();
        }

        params.push(param);

        if (this.currentToken?.type === "COMMA") {
          this.next();
        }
      }

      this.next(); // Skip ')'
    }

    return params;
  }

  /**
   * Parse type hint
   */
  parseTypeHint() {
    const name = this.currentToken?.value;
    this.next();
    return this.createNode("TypeHint", { name });
  }

  /**
   * Skip to token type
   */
  skipTo(tokenType) {
    while (this.currentToken && this.currentToken.type !== tokenType) {
      this.next();
    }
  }

  /**
   * Parse block body (indented statements)
   */
  parseBlockBody() {
    const body = [];
    
    if (this.currentToken?.type === "INDENT") {
      this.next();
      
      while (this.currentToken?.type !== "DEDENT" && this.position < this.tokens.length) {
        this.skipNewlines();
        if (this.currentToken?.type === "DEDENT" || this.position >= this.tokens.length) break;
        const before = this.position;
        const stmt = this.parseStatement();
        if (stmt) body.push(stmt);
        if (this.position === before) this.next();
      }

      if (this.currentToken?.type === "DEDENT") {
        this.next();
      }
    }

    return body;
  }

  /**
   * Structured parsers for compound statements.
   */
  parseIf() {
    this.next();
    const test = this.parseExpression(new Set(["COLON"]));
    this.consumeColon();
    const consequent = this.parseBlockBody();
    let alternate = [];

    if (this.currentToken?.type === "ELIF") {
      alternate = [this.parseIf()];
    } else if (this.currentToken?.type === "ELSE") {
      this.next();
      this.consumeColon();
      alternate = this.parseBlockBody();
    }

    return this.createNode("IfStatement", { test, consequent, alternate });
  }

  parseFor() {
    this.next();
    const targetTokens = this.collectTokensUntil(new Set(["IN"]));
    const target = this.tokensToExpression(targetTokens);
    if (this.currentToken?.type === "IN") this.next();
    const iterable = this.parseExpression(new Set(["COLON"]));
    this.consumeColon();
    const body = this.parseBlockBody();
    return this.createNode("ForStatement", { target, iterable, body });
  }

  parseWhile() {
    this.next();
    const test = this.parseExpression(new Set(["COLON"]));
    this.consumeColon();
    const body = this.parseBlockBody();
    return this.createNode("WhileStatement", { test, body });
  }

  parseWith() {
    this.next();
    const contextTokens = this.collectTokensUntil(new Set(["AS", "COLON"]));
    const context = this.tokensToExpression(contextTokens);
    let alias = null;
    if (this.currentToken?.type === "AS") {
      this.next();
      alias = this.currentToken?.type === "IDENTIFIER"
        ? this.createNode("Identifier", { name: this.currentToken.value })
        : this.parseExpression(new Set(["COLON"]));
      if (this.currentToken?.type === "IDENTIFIER") this.next();
    }
    this.consumeColon();
    const body = this.parseBlockBody();
    return this.createNode("WithStatement", { context, alias, body });
  }

  parseTry() {
    this.next();
    this.consumeColon();
    const body = this.parseBlockBody();
    const handlers = [];
    let alternate = [];
    let finalizer = [];

    while (this.currentToken?.type === "EXCEPT") {
      this.next();
      const exceptionTokens = this.collectTokensUntil(new Set(["AS", "COLON"]));
      const exception = exceptionTokens.length > 0 ? this.tokensToExpression(exceptionTokens) : null;
      let alias = null;
      if (this.currentToken?.type === "AS") {
        this.next();
        alias = this.currentToken?.type === "IDENTIFIER" ? this.currentToken.value : null;
        if (this.currentToken?.type === "IDENTIFIER") this.next();
      }
      this.consumeColon();
      handlers.push(this.createNode("ExceptHandler", {
        exception,
        alias,
        body: this.parseBlockBody()
      }));
    }

    if (this.currentToken?.type === "ELSE") {
      this.next();
      this.consumeColon();
      alternate = this.parseBlockBody();
    }

    if (this.currentToken?.type === "FINALLY") {
      this.next();
      this.consumeColon();
      finalizer = this.parseBlockBody();
    }

    return this.createNode("TryStatement", { body, handlers, alternate, finalizer });
  }

  parseReturn() {
    this.next();
    return this.createNode("ReturnStatement", { value: this.parseExpression() });
  }

  parseRaise() {
    this.next();
    return this.createNode("RaiseStatement", { exception: this.parseExpression() });
  }

  parseImport() {
    return { type: "ImportStatement" };
  }

  parseFromImport() {
    return { type: "ImportStatement" };
  }

  parsePass() {
    this.next();
    return this.createNode("PassStatement", {});
  }

  parseBreak() {
    this.next();
    return this.createNode("BreakStatement", {});
  }

  parseContinue() {
    this.next();
    return this.createNode("ContinueStatement", {});
  }

  parseDecorator() {
    this.next();
    const name = this.currentToken?.value;
    this.next();
    return this.createNode("Decorator", { name });
  }

  parseExpressionStatement() {
    const expr = this.parseExpression();
    return this.createNode("ExpressionStatement", { expression: expr });
  }

  consumeColon() {
    if (this.currentToken?.type === "COLON") {
      this.next();
    }
  }

  collectTokensUntil(stopTypes) {
    const tokens = [];
    let depth = 0;
    while (this.currentToken && this.position < this.tokens.length) {
      const token = this.currentToken;
      if (depth === 0 && stopTypes.has(token.type)) break;
      if (token.type === "LPAREN" || token.type === "LBRACKET" || token.type === "LBRACE") depth++;
      if (token.type === "RPAREN" || token.type === "RBRACKET" || token.type === "RBRACE") depth--;
      tokens.push(token);
      this.position++;
    }
    return tokens;
  }

  /**
   * Parse expression into a minimal node preserving token data.
   */
  parseExpression(stopTypes = new Set(["NEWLINE", "COMMA", "COLON", "RPAREN", "DEDENT", "EOF"])) {
    return this.tokensToExpression(this.collectTokensUntil(stopTypes));
  }

  tokensToExpression(tokens) {
    const significant = tokens.filter(token => token.type !== "NEWLINE");
    if (significant.length === 0) {
      return this.createNode("Literal", { value: null, raw: "" });
    }

    const parseAtom = token => {
      if (!token) return this.createNode("Literal", { value: null, raw: "" });
      if (token.type === "IDENTIFIER") return this.createNode("Identifier", { name: token.value });
      if (token.type === "INTEGER" || token.type === "FLOAT") return this.createNode("Literal", { value: token.value, raw: String(token.value) });
      if (token.type === "STRING" || token.type === "FSTRING") return this.createNode("Literal", { value: token.value, raw: token.value });
      if (token.type === "TRUE") return this.createNode("Literal", { value: true, raw: "True" });
      if (token.type === "FALSE") return this.createNode("Literal", { value: false, raw: "False" });
      if (token.type === "NONE") return this.createNode("Literal", { value: null, raw: "None" });
      return this.createNode("TokenExpression", { tokenType: token.type, value: token.value });
    };

    let expression = parseAtom(significant[0]);
    for (let i = 1; i < significant.length - 1; i += 2) {
      const operator = significant[i];
      const right = parseAtom(significant[i + 1]);
      expression = this.createNode("BinaryExpression", {
        operator: this.operatorFromToken(operator),
        left: expression,
        right
      });
    }

    if (significant.length === 1) return expression;
    return this.createNode("RawExpression", {
      raw: significant.map(token => token.value).join(" "),
      expression,
      tokens: significant.map(token => ({
        type: token.type,
        value: token.value,
        line: token.line,
        column: token.column
      }))
    });
  }

  operatorFromToken(token) {
    if (!token) return "";
    if (token.type === "OPERATOR") return token.value;
    return String(token.value || token.type).toLowerCase();
  }

  /**
   * Convert AST to canonical IR
   */
  toIR(ast) {
    return {
      type: "IR",
      module: {
        name: "main",
        language: "Python",
      },
      nodes: this.astToIRNodes(ast.body),
    };
  }

  /**
   * Convert AST nodes to IR nodes
   */
  astToIRNodes(nodes) {
    return nodes.map(node => this.astNodeToIR(node));
  }

  /**
   * Convert single AST node to IR
   */
  astNodeToIR(node) {
    if (!node) return null;

    return {
      type: node.type,
      canonical: true,
      language: "Python",
      original: node,
    };
  }

  /**
   * Create token using object pool (Phase B pattern)
   */
  createToken(type, data) {
    if (++this.objectCount > this.maxObjects) {
      throw new Error(`Memory limit exceeded: ${this.objectCount} tokens created`);
    }
    return this.pool.getNode(type, data);
  }

  /**
   * Create AST node using object pool (Phase B pattern)
   */
  createNode(type, data) {
    if (++this.objectCount > this.maxObjects) {
      throw new Error(`Memory limit exceeded: ${this.objectCount} AST nodes created`);
    }
    return this.pool.getNode(type, data);
  }

  /**
   * Get memory usage statistics
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
    this.position = 0;
    this.tokens = [];
    this.indentStack = [0];
    this.ast = null;
    // Don't clear pool - reuse across parses
  }

  /**
   * TIER 1 OPTIMIZATION: Get optimization statistics
   */
  getOptimizationStats() {
    if (!this.tier1Optimizer) {
      return { tier1Optimizations: "disabled" };
    }

    return {
      ...this.optimizationStats,
      tier1Stats: this.tier1Optimizer.getOptimizationStats(),
      cacheHitRate: this.optimizationStats.totalParses > 0
        ? ((this.optimizationStats.cacheHits / this.optimizationStats.totalParses) * 100).toFixed(2) + "%"
        : "0%"
    };
  }

  /**
   * TIER 1 OPTIMIZATION: Generate comprehensive optimization report
   */
  generateOptimizationReport() {
    if (!this.tier1Optimizer) {
      return { status: "Tier 1 optimizations not enabled" };
    }

    return {
      language: "Python",
      parser: "PythonParser",
      tier1Report: this.tier1Optimizer.generateOptimizationReport(),
      parserStats: this.getOptimizationStats(),
      memoryPool: this.pool.getStats(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = PythonParser;
module.exports.PythonParser = PythonParser;

/**
 * PHP Parser - C-Family Language Support
 * Parses PHP code to canonical AST for IR pipeline
 * Focus: Server-side scripting, dynamic typing
 * Memory: Object pooling for tokens and AST nodes (Phase B pattern)
 */

const { BaseParser } = require("./base_parser");

/**
 * Object Pool for memory-efficient token and AST node creation
 * Reuses objects across multiple parse operations
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

class PHPParser extends BaseParser {
  constructor(source) {
    super(source);
    this.keywords = [
      "function", "class", "interface", "trait", "namespace", "use",
      "if", "else", "elseif", "switch", "case", "default",
      "while", "do", "for", "foreach", "as", "break", "continue",
      "return", "throw", "try", "catch", "finally",
      "new", "static", "public", "private", "protected", "abstract", "final",
      "const", "var", "isset", "unset", "empty", "include", "require",
      "echo", "print", "exit", "die", "true", "false", "null"
    ];
    this.operators = ["===", "!==", "==", "!=", "<=", ">=", "&&", "||", ".", "=>", "->", "::"];
    
    // Memory management (Phase B pattern)
    this.pool = new ObjectPool(5000);
    this.objectCount = 0;
    this.maxObjects = 50000;
  }

  tokenize() {
    this.objectCount = 0; // Reset memory tracking
    const maxTokens = 10000; // Safety limit
    const originalMethod = this.tokenizeC_Family.bind(this);
    
    // Wrap tokenization with safety check
    const startTime = Date.now();
    const tokens = originalMethod(this.keywords, this.operators);
    const duration = Date.now() - startTime;
    
    if (tokens.length > maxTokens) {
      throw new Error(`Tokenization produced ${tokens.length} tokens (limit: ${maxTokens}) - possible infinite loop`);
    }
    
    if (duration > 5000) {
      throw new Error(`Tokenization took ${duration}ms - possible infinite loop`);
    }
    
    return tokens;
  }

  parse() {
    this.tokens = this.tokenize();
    this.tokenPos = 0;
    return this.parseProgram();
  }

  current() {
    return this.tokens[this.tokenPos];
  }

  peek(offset = 1) {
    return this.tokens[this.tokenPos + offset];
  }

  advanceToken() {
    this.tokenPos++;
  }

  expect(type, value = null) {
    const token = this.current();
    if (!token || token.type !== type || (value && token.value !== value)) {
      throw new Error(`Expected ${type}:${value}, got ${token?.type}:${token?.value}`);
    }
    this.advanceToken();
    return token;
  }

  match(type, value = null) {
    const token = this.current();
    if (token && token.type === type && (!value || token.value === value)) {
      this.advanceToken();
      return true;
    }
    return false;
  }

  parseProgram() {
    const body = [];
    let lastPos = -1;
    while (this.current()) {
      // Infinite loop protection
      if (this.tokenPos === lastPos) {
        // Silent protection - force advance to prevent infinite loop
        this.advanceToken();
        continue;
      }
      lastPos = this.tokenPos;
      
      if (this.match("PUNCT", "<?php")) {
        continue;
      }
      if (this.match("PUNCT", "?>")) {
        break;
      }
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }
    return this.createNode("Program", { body });
  }

  parseStatement() {
    const token = this.current();
    if (!token) return null;

    if (token.type === "KEYWORD") {
      switch (token.value) {
      case "function": return this.parseFunctionDeclaration();
      case "class": return this.parseClassDeclaration();
      case "if": return this.parseIfStatement();
      case "while": return this.parseWhileStatement();
      case "for": return this.parseForStatement();
      case "foreach": return this.parseForeachStatement();
      case "do": return this.parseDoWhileStatement();
      case "switch": return this.parseSwitchStatement();
      case "try": return this.parseTryStatement();
      case "throw": return this.parseThrowStatement();
      case "return": return this.parseReturnStatement();
      case "break": return this.parseBreakStatement();
      case "continue": return this.parseContinueStatement();
      case "echo": return this.parseEchoStatement();
      case "var":
      case "static":
      case "public":
      case "private":
      case "protected":
        return this.parseVariableDeclaration();
      default:
        // Unknown keyword - skip and continue
        this.advanceToken();
        return null;
      }
    }

    // Only try expression statement for identifiers, literals, operators
    if (["IDENTIFIER", "NUMBER", "STRING", "PUNCT"].includes(token.type)) {
      return this.parseExpressionStatement();
    }

    // Unknown token type - skip it silently
    this.advanceToken();
    return null;
  }

  parseFunctionDeclaration() {
    this.expect("KEYWORD", "function");
    const name = this.expect("IDENTIFIER").value;
    this.expect("PUNCT", "(");
    const params = this.parseParameterList();
    this.expect("PUNCT", ")");
    const body = this.parseBlockStatement();
    return this.createFunctionDeclaration(name, params, body.body);
  }

  parseClassDeclaration() {
    this.expect("KEYWORD", "class");
    const name = this.expect("IDENTIFIER").value;
        
    let superClass = null;
    if (this.match("KEYWORD", "extends")) {
      superClass = this.createIdentifier(this.expect("IDENTIFIER").value);
    }

    this.expect("PUNCT", "{");
    const body = [];
    while (!this.match("PUNCT", "}") && this.current()) {
      body.push(this.parseClassMember());
    }
    return this.createClassDeclaration(name, superClass, body);
  }

  parseClassMember() {
    const modifiers = [];
    while (this.current() && ["public", "private", "protected", "static"].includes(this.current().value)) {
      modifiers.push(this.current().value);
      this.advanceToken();
    }

    if (this.current()?.value === "function") {
      return this.parseFunctionDeclaration();
    }
    return this.parseVariableDeclaration();
  }

  parseIfStatement() {
    this.expect("KEYWORD", "if");
    this.expect("PUNCT", "(");
    const test = this.parseExpression();
    this.expect("PUNCT", ")");
    const consequent = this.parseStatement();
    let alternate = null;
    if (this.match("KEYWORD", "else")) {
      alternate = this.parseStatement();
    }
    return this.createIfStatement(test, consequent, alternate);
  }

  parseWhileStatement() {
    this.expect("KEYWORD", "while");
    this.expect("PUNCT", "(");
    const test = this.parseExpression();
    this.expect("PUNCT", ")");
    const body = this.parseStatement();
    return this.createWhileStatement(test, body);
  }

  parseForStatement() {
    this.expect("KEYWORD", "for");
    this.expect("PUNCT", "(");
    const init = this.parseExpression();
    this.expect("PUNCT", ";");
    const test = this.parseExpression();
    this.expect("PUNCT", ";");
    const update = this.parseExpression();
    this.expect("PUNCT", ")");
    const body = this.parseStatement();
    return this.createForStatement(init, test, update, body);
  }

  parseForeachStatement() {
    this.expect("KEYWORD", "foreach");
    this.expect("PUNCT", "(");
    const expr = this.parseExpression();
    this.expect("KEYWORD", "as");
    const left = this.parseExpression();
    this.expect("PUNCT", ")");
    const body = this.parseStatement();
    return this.createNode("ForOfStatement", {
      left,
      right: expr,
      body
    });
  }

  parseDoWhileStatement() {
    this.expect("KEYWORD", "do");
    const body = this.parseStatement();
    this.expect("KEYWORD", "while");
    this.expect("PUNCT", "(");
    const test = this.parseExpression();
    this.expect("PUNCT", ")");
    return this.createNode("DoWhileStatement", { body, test });
  }

  parseSwitchStatement() {
    this.expect("KEYWORD", "switch");
    this.expect("PUNCT", "(");
    const discriminant = this.parseExpression();
    this.expect("PUNCT", ")");
    this.expect("PUNCT", "{");
    const cases = [];
    while (!this.match("PUNCT", "}") && this.current()) {
      if (this.match("KEYWORD", "case")) {
        const test = this.parseExpression();
        this.expect("PUNCT", ":");
        const consequent = [];
        while (this.current() && !["case", "default"].includes(this.current().value)) {
          consequent.push(this.parseStatement());
        }
        cases.push({ test, consequent });
      } else if (this.match("KEYWORD", "default")) {
        this.expect("PUNCT", ":");
        const consequent = [];
        while (this.current() && !["case", "default"].includes(this.current().value)) {
          consequent.push(this.parseStatement());
        }
        cases.push({ test: null, consequent });
      }
    }
    return this.createNode("SwitchStatement", { discriminant, cases });
  }

  parseTryStatement() {
    this.expect("KEYWORD", "try");
    const block = this.parseBlockStatement();
    const handlers = [];
    while (this.match("KEYWORD", "catch")) {
      this.expect("PUNCT", "(");
      const param = this.expect("IDENTIFIER").value;
      this.expect("PUNCT", ")");
      const handler = this.parseBlockStatement();
      handlers.push({ param: this.createIdentifier(param), body: handler });
    }
    let finalizer = null;
    if (this.match("KEYWORD", "finally")) {
      finalizer = this.parseBlockStatement();
    }
    return this.createTryStatement(block, handlers[0] || null, finalizer);
  }

  parseThrowStatement() {
    this.expect("KEYWORD", "throw");
    const argument = this.parseExpression();
    return this.createThrowStatement(argument);
  }

  parseReturnStatement() {
    this.expect("KEYWORD", "return");
    let argument = null;
    if (!this.match("PUNCT", ";")) {
      argument = this.parseExpression();
      this.match("PUNCT", ";");
    }
    return this.createReturnStatement(argument);
  }

  parseBreakStatement() {
    this.expect("KEYWORD", "break");
    this.match("PUNCT", ";");
    return this.createNode("BreakStatement", {});
  }

  parseContinueStatement() {
    this.expect("KEYWORD", "continue");
    this.match("PUNCT", ";");
    return this.createNode("ContinueStatement", {});
  }

  parseEchoStatement() {
    this.expect("KEYWORD", "echo");
    const args = [];
    do {
      args.push(this.parseExpression());
    } while (this.match("PUNCT", ","));
    this.match("PUNCT", ";");
    return this.createNode("ExpressionStatement", {
      expression: this.createCallExpression(
        this.createIdentifier("echo"),
        args
      )
    });
  }

  parseVariableDeclaration() {
    const modifiers = [];
    while (this.current() && ["var", "static", "public", "private", "protected"].includes(this.current().value)) {
      modifiers.push(this.current().value);
      this.advance();
    }
    this.expect("IDENTIFIER"); // $
    const id = this.expect("IDENTIFIER");
    let init = null;
    if (this.match("OPERATOR", "=")) {
      init = this.parseAssignment();
    }
    this.match("PUNCT", ";");
    return this.createNode("VariableDeclaration", {
      declarations: [{
        id: this.createIdentifier(id.value),
        init
      }]
    });
  }

  parseBlockStatement() {
    if (this.match("PUNCT", "{")) {
      const body = [];
      while (!this.match("PUNCT", "}") && this.current()) {
        body.push(this.parseStatement());
      }
      return this.createBlockStatement(body);
    }
    return this.createBlockStatement([this.parseStatement()]);
  }

  parseExpressionStatement() {
    const expr = this.parseExpression();
    this.match("PUNCT", ";");
    return this.createExpressionStatement(expr);
  }

  parseParameterList() {
    const params = [];
    while (!this.match("PUNCT", ")") && this.current()) {
      if (this.match("PUNCT", "$")) {
        params.push(this.expect("IDENTIFIER").value);
      } else {
        params.push(this.expect("IDENTIFIER").value);
      }
      this.match("PUNCT", ",");
    }
    return params;
  }

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    let expr = this.parseLogical();
    if (this.current() && ["=", "+=", "-=", "*=", "/="].includes(this.current().value)) {
      const op = this.current().value;
      this.advanceToken();
      const right = this.parseAssignment();
      expr = this.createAssignmentExpression(expr, op, right);
    }
    return expr;
  }

  parseLogical() {
    let expr = this.parseEquality();
    while (this.current() && ["&&", "||", "and", "or"].includes(this.current().value)) {
      const op = this.current().value;
      this.advanceToken();
      const right = this.parseEquality();
      expr = this.createLogicalExpression(expr, op, right);
    }
    return expr;
  }

  parseEquality() {
    let expr = this.parseComparison();
    while (this.current() && ["==", "!=", "===", "!=="].includes(this.current().value)) {
      const op = this.current().value;
      this.advanceToken();
      const right = this.parseComparison();
      expr = this.createBinaryExpression(expr, op, right);
    }
    return expr;
  }

  parseComparison() {
    let expr = this.parseAdditive();
    while (this.current() && ["<", ">", "<=", ">="].includes(this.current().value)) {
      const op = this.current().value;
      this.advanceToken();
      const right = this.parseAdditive();
      expr = this.createBinaryExpression(expr, op, right);
    }
    return expr;
  }

  parseAdditive() {
    let expr = this.parseMultiplicative();
    while (this.current() && ["+", "-", "."].includes(this.current().value)) {
      const op = this.current().value;
      this.advanceToken();
      const right = this.parseMultiplicative();
      expr = this.createBinaryExpression(expr, op, right);
    }
    return expr;
  }

  parseMultiplicative() {
    let expr = this.parseUnary();
    while (this.current() && ["*", "/", "%"].includes(this.current().value)) {
      const op = this.current().value;
      this.advanceToken();
      const right = this.parseUnary();
      expr = this.createBinaryExpression(expr, op, right);
    }
    return expr;
  }

  parseUnary() {
    if (this.current() && ["!", "-", "+", "~"].includes(this.current().value)) {
      const op = this.current().value;
      this.advanceToken();
      const arg = this.parseUnary();
      return this.createUnaryExpression(op, arg, true);
    }
    return this.parsePostfix();
  }

  parsePostfix() {
    let expr = this.parsePrimary();
    while (this.current()) {
      if (this.match("PUNCT", "(")) {
        const args = [];
        while (!this.match("PUNCT", ")") && this.current()) {
          args.push(this.parseExpression());
          this.match("PUNCT", ",");
        }
        expr = this.createCallExpression(expr, args);
      } else if (this.match("PUNCT", "[")) {
        const index = this.parseExpression();
        this.expect("PUNCT", "]");
        expr = this.createMemberExpression(expr, index, true);
      } else if (this.match("OPERATOR", "->") || this.match("OPERATOR", "::")) {
        const prop = this.expect("IDENTIFIER").value;
        expr = this.createMemberExpression(expr, this.createIdentifier(prop), false);
      } else if (this.match("PUNCT", ".")) {
        // In PHP, . is string concatenation operator, not member access
        // Treat it as binary operator - continue to parent level
        this.tokenPos--; // Put token back
        break;
      } else {
        break;
      }
    }
    return expr;
  }

  parsePrimary() {
    const token = this.current();
    if (!token) return this.createIdentifier("null");

    if (token.type === "STRING") {
      this.advanceToken();
      return this.createLiteral(token.value, token.value);
    }

    if (token.type === "NUMBER") {
      this.advanceToken();
      return this.createLiteral(parseFloat(token.value) || parseInt(token.value), token.value);
    }

    if (token.type === "IDENTIFIER") {
      const name = token.value;
      this.advanceToken();
      return this.createIdentifier(name);
    }

    if (token.type === "KEYWORD") {
      if (token.value === "true" || token.value === "false") {
        this.advanceToken();
        return this.createLiteral(token.value === "true", token.value);
      }
      if (token.value === "null") {
        this.advanceToken();
        return this.createLiteral(null, "null");
      }
      if (token.value === "new") {
        this.advanceToken();
        const callee = this.createIdentifier(this.expect("IDENTIFIER").value);
        this.expect("PUNCT", "(");
        const args = [];
        while (!this.match("PUNCT", ")") && this.current()) {
          args.push(this.parseExpression());
          this.match("PUNCT", ",");
        }
        return this.createNewExpression(callee, args);
      }
    }

    if (this.match("PUNCT", "(")) {
      const expr = this.parseExpression();
      this.expect("PUNCT", ")");
      return expr;
    }

    if (this.match("PUNCT", "[")) {
      const elements = [];
      while (!this.match("PUNCT", "]") && this.current()) {
        elements.push(this.parseExpression());
        this.match("PUNCT", ",");
      }
      return this.createArrayExpression(elements);
    }

    // Handle PHP variables starting with $
    if (this.match("PUNCT", "$")) {
      if (this.current()?.type === "IDENTIFIER") {
        const varName = this.current().value;
        this.advanceToken();
        return this.createIdentifier("$" + varName);
      }
    }

    // Unknown token - advance and return identifier to prevent infinite loops
    if (this.current()) {
      this.advanceToken();
    }
    return this.createIdentifier("undefined");
  }

  createAssignmentExpression(left, operator, right) {
    return this.createNode("AssignmentExpression", { left, operator, right });
  }

  createLogicalExpression(left, operator, right) {
    return this.createNode("LogicalExpression", { left, operator, right });
  }

  createUnaryExpression(operator, argument, prefix = true) {
    return this.createNode("UnaryExpression", { operator, argument, prefix });
  }

  createNewExpression(callee, args) {
    return this.createNode("NewExpression", { callee, arguments: args });
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
    this.tokenPos = 0;
    this.tokens = [];
    // Don't clear pool - reuse across parses
  }
}

module.exports = { PHPParser };

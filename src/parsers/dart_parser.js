/**
 * Dart Parser - C-Family Language with Null Safety + TIER 1 OPTIMIZATIONS
 * Parses Dart code to canonical AST for IR pipeline
 * Focus: Mobile/Flutter development, strong typing, null safety
 * Memory: Object pooling for tokens and AST nodes (Phase B pattern)
 * 
 * TIER 1 OPTIMIZATIONS INTEGRATED (Step 6):
 * - Tier1OptimizationManager integration
 * - Hybrid caching for parse results
 * - Enhanced memory pooling
 * - Performance monitoring
 */

const { BaseParser } = require("./base_parser");
const { Tier1OptimizationManager } = require("../tier1_optimization_suite");

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

class DartParser extends BaseParser {
  constructor(source) {
    super(source);
    this.keywords = [
      "void", "int", "double", "bool", "String", "List", "Map", "Set", "dynamic", "var", "final", "const",
      "class", "interface", "mixin", "enum", "extension", "factory", "abstract",
      "function", "async", "await", "yield", "sync", "stream",
      "if", "else", "switch", "case", "default", "while", "do", "for", "in", "break", "continue",
      "return", "throw", "try", "catch", "on", "finally", "assert",
      "new", "this", "super", "static", "external", "library", "import", "export", "part",
      "as", "show", "hide", "late", "required", "covariant", "get", "set",
      "true", "false", "null", "rethrow"
    ];
    this.operators = ["===", "!=", "==", "<=", ">=", "??", "?.", "=>", "...", "..", "|", "&", "^"];
    
    // Memory management (Phase B pattern)
    this.pool = new ObjectPool(5000);
    this.objectCount = 0;
    this.maxObjects = 50000;
    
    // TIER 1 OPTIMIZATION: Integrate Tier1OptimizationManager (Step 6)
    if (this.options && this.options.enableTier1Optimizations !== false) {
      this.tier1Optimizer = new Tier1OptimizationManager();
      this.optimizationStats = {
        cacheHits: 0,
        cacheMisses: 0,
        totalParses: 0,
        averageParseTime: 0
      };
    }
  }

  tokenize() {
    this.objectCount = 0; // Reset memory tracking
    return this.tokenizeC_Family(this.keywords, this.operators);
  }

  parse() {
    this.tokens = this.tokenize();
    this.tokenPos = 0;
    return this.parseProgram();
  }

  current() {
    return this.tokens[this.tokenPos];
  }

  advanceToken() {
    this.tokenPos++;
  }

  match(type, value = null) {
    const token = this.current();
    if (token && token.type === type && (!value || token.value === value)) {
      this.advanceToken();
      return true;
    }
    return false;
  }

  expect(type, value = null) {
    const token = this.current();
    if (!token || token.type !== type || (value && token.value !== value)) {
      throw new Error(`Expected ${type}:${value}`);
    }
    this.advanceToken();
    return token;
  }

  parseProgram() {
    const body = [];
    while (this.current()) {
      if (this.match("KEYWORD", "library") || this.match("KEYWORD", "import") || 
                this.match("KEYWORD", "export") || this.match("KEYWORD", "part")) {
        this.parseImportOrLibrary();
        continue;
      }
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }
    return this.createNode("Program", { body });
  }

  parseImportOrLibrary() {
    if (this.match("KEYWORD", "library")) {
      this.parseQualifiedName();
      this.match("PUNCT", ";");
    } else if (this.match("KEYWORD", "import")) {
      this.expect("STRING");
      if (this.match("KEYWORD", "as")) {
        this.expect("IDENTIFIER");
      }
      this.match("PUNCT", ";");
    } else if (this.match("KEYWORD", "export")) {
      this.expect("STRING");
      this.match("PUNCT", ";");
    } else if (this.match("KEYWORD", "part")) {
      this.expect("STRING");
      this.match("PUNCT", ";");
    }
  }

  parseQualifiedName() {
    this.expect("IDENTIFIER");
    while (this.match("PUNCT", ".")) {
      this.expect("IDENTIFIER");
    }
  }

  parseStatement() {
    const token = this.current();
    if (!token) return null;

    if (token.type === "KEYWORD") {
      switch (token.value) {
      case "class": return this.parseClassDeclaration();
      case "mixin": return this.parseMixinDeclaration();
      case "enum": return this.parseEnumDeclaration();
      case "extension": return this.parseExtensionDeclaration();
      case "void": return this.parseFunctionDeclaration();
      case "function": return this.parseFunctionDeclaration();
      case "if": return this.parseIfStatement();
      case "while": return this.parseWhileStatement();
      case "for": return this.parseForStatement();
      case "do": return this.parseDoWhileStatement();
      case "switch": return this.parseSwitchStatement();
      case "try": return this.parseTryStatement();
      case "throw": return this.parseThrowStatement();
      case "return": return this.parseReturnStatement();
      case "break": return this.parseBreakStatement();
      case "continue": return this.parseContinueStatement();
      case "var":
      case "final":
      case "const":
      case "late": return this.parseVariableDeclaration();
      }
    }

    // Remove incorrect check that treats function calls as declarations
    // Function declarations should only occur with explicit type/keyword
    // (e.g., "void foo()", "int bar()", etc.)

    return this.parseExpressionStatement();
  }

  parseFunctionDeclaration() {
    if (this.match("KEYWORD", "async") || this.match("KEYWORD", "sync") || 
            this.match("KEYWORD", "stream") || this.current()?.value === "void" || 
            this.current()?.value === "int" || this.current()?.value === "String") {
      this.expect("IDENTIFIER");
    }
        
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

    const implementsList = [];
    if (this.match("KEYWORD", "implements")) {
      do {
        implementsList.push(this.expect("IDENTIFIER").value);
      } while (this.match("PUNCT", ","));
    }

    const mixins = [];
    if (this.match("KEYWORD", "with")) {
      do {
        mixins.push(this.expect("IDENTIFIER").value);
      } while (this.match("PUNCT", ","));
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
    while (this.current() && ["static", "final", "const", "late", "abstract"].includes(this.current().value)) {
      modifiers.push(this.current().value);
      this.advanceToken();
    }

    if (this.current()?.type === "IDENTIFIER") {
      const id = this.expect("IDENTIFIER").value;
      if (this.current()?.value === "(") {
        this.expect("PUNCT", "(");
        this.parseParameterList();
        this.expect("PUNCT", ")");
        const body = this.parseBlockStatement();
        return this.createNode("MethodDefinition", {
          key: this.createIdentifier(id),
          value: this.createNode("FunctionExpression", {
            id: this.createIdentifier(id),
            params: [],
            body
          })
        });
      }
    }

    return this.parseVariableDeclaration();
  }

  parseMixinDeclaration() {
    this.expect("KEYWORD", "mixin");
    const name = this.expect("IDENTIFIER").value;
    this.expect("PUNCT", "{");
    const body = [];
    while (!this.match("PUNCT", "}") && this.current()) {
      body.push(this.parseClassMember());
    }
    return this.createNode("MixinDeclaration", {
      id: this.createIdentifier(name),
      body
    });
  }

  parseEnumDeclaration() {
    this.expect("KEYWORD", "enum");
    const name = this.expect("IDENTIFIER").value;
    this.expect("PUNCT", "{");
    const members = [];
    while (!this.match("PUNCT", "}") && this.current()) {
      const key = this.expect("IDENTIFIER").value;
      members.push({ key });
      this.match("PUNCT", ",");
    }
    return this.createNode("EnumDeclaration", {
      id: this.createIdentifier(name),
      members
    });
  }

  parseExtensionDeclaration() {
    this.expect("KEYWORD", "extension");
    const name = this.current()?.type === "IDENTIFIER" ? this.expect("IDENTIFIER").value : null;
    this.expect("KEYWORD", "on");
    this.expect("IDENTIFIER");
    this.expect("PUNCT", "{");
    const body = [];
    while (!this.match("PUNCT", "}") && this.current()) {
      body.push(this.parseClassMember());
    }
    return this.createNode("ExtensionDeclaration", {
      id: name ? this.createIdentifier(name) : null,
      body
    });
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
        
    if (this.current()?.value === "var" || this.current()?.type === "IDENTIFIER") {
      this.parseVariableDeclaration();
      if (this.current()?.value === "in") {
        this.advanceToken();
        const right = this.parseExpression();
        this.expect("PUNCT", ")");
        const body = this.parseStatement();
        return this.createNode("ForInStatement", { left: null, right, body });
      }
      this.expect("PUNCT", ";");
    }

    const init = this.parseExpression();
    this.expect("PUNCT", ";");
    const test = this.parseExpression();
    this.expect("PUNCT", ";");
    const update = this.parseExpression();
    this.expect("PUNCT", ")");
    const body = this.parseStatement();
    return this.createForStatement(init, test, update, body);
  }

  parseDoWhileStatement() {
    this.expect("KEYWORD", "do");
    const body = this.parseStatement();
    this.expect("KEYWORD", "while");
    this.expect("PUNCT", "(");
    const test = this.parseExpression();
    this.expect("PUNCT", ")");
    this.match("PUNCT", ";");
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
        while (this.current() && !["case", "default"].includes(this.current()?.value)) {
          consequent.push(this.parseStatement());
        }
        cases.push({ test, consequent });
      } else if (this.match("KEYWORD", "default")) {
        this.expect("PUNCT", ":");
        const consequent = [];
        while (this.current() && !["case", "default"].includes(this.current()?.value)) {
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
    while (this.match("KEYWORD", "on") || this.current()?.value === "catch") {
      let exceptionType = null;
      if (this.match("KEYWORD", "on")) {
        exceptionType = this.expect("IDENTIFIER").value;
      }
      this.match("KEYWORD", "catch");
      this.match("PUNCT", "(");
      const param = this.current()?.type === "IDENTIFIER" ? this.expect("IDENTIFIER").value : null;
      this.match("PUNCT", ")");
      const handler = this.parseBlockStatement();
      handlers.push({ exceptionType, param: param ? this.createIdentifier(param) : null, body: handler });
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

  parseVariableDeclaration() {
    const kind = this.current().value;
    this.advanceToken();
    const declarations = [];
    do {
      const id = this.expect("IDENTIFIER").value;
      let init = null;
      if (this.match("OPERATOR", "=")) {
        init = this.parseAssignment();
      }
      declarations.push({ id: this.createIdentifier(id), init });
    } while (this.match("PUNCT", ","));
    this.match("PUNCT", ";");
    return this.createNode("VariableDeclaration", { declarations, kind });
  }

  parseBlockStatement() {
    if (this.match("PUNCT", "{")) {
      const body = [];
      while (!this.match("PUNCT", "}") && this.current()) {
        const stmt = this.parseStatement();
        if (stmt) body.push(stmt);
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
      const name = this.expect("IDENTIFIER").value;
      params.push(name);
      this.match("PUNCT", ",");
    }
    return params;
  }

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    let expr = this.parseConditional();
    if (this.current() && ["=", "+=", "-=", "*=", "/=", "??="].includes(this.current().value)) {
      const op = this.current().value;
      this.advanceToken();
      const right = this.parseAssignment();
      expr = this.createNode("AssignmentExpression", { left: expr, operator: op, right });
    }
    return expr;
  }

  parseConditional() {
    let expr = this.parseLogical();
    if (this.match("PUNCT", "?")) {
      const consequent = this.parseExpression();
      this.expect("PUNCT", ":");
      const alternate = this.parseExpression();
      expr = this.createNode("ConditionalExpression", { test: expr, consequent, alternate });
    }
    return expr;
  }

  parseLogical() {
    let expr = this.parseEquality();
    while (this.current() && ["&&", "||", "??"].includes(this.current().value)) {
      const op = this.current().value;
      this.advanceToken();
      const right = this.parseEquality();
      expr = this.createNode("LogicalExpression", { left: expr, operator: op, right });
    }
    return expr;
  }

  parseEquality() {
    let expr = this.parseComparison();
    while (this.current() && ["==", "!=", "===", "!=="].includes(this.current().value)) {
      const op = this.current().value;
      this.advanceToken();
      const right = this.parseComparison();
      expr = this.createNode("BinaryExpression", { left: expr, operator: op, right });
    }
    return expr;
  }

  parseComparison() {
    let expr = this.parseAdditive();
    while (this.current() && ["<", ">", "<=", ">=", "is"].includes(this.current().value)) {
      const op = this.current().value;
      this.advanceToken();
      const right = this.parseAdditive();
      expr = this.createNode("BinaryExpression", { left: expr, operator: op, right });
    }
    return expr;
  }

  parseAdditive() {
    let expr = this.parseMultiplicative();
    while (this.current() && ["+", "-"].includes(this.current().value)) {
      const op = this.current().value;
      this.advanceToken();
      const right = this.parseMultiplicative();
      expr = this.createNode("BinaryExpression", { left: expr, operator: op, right });
    }
    return expr;
  }

  parseMultiplicative() {
    let expr = this.parseUnary();
    while (this.current() && ["*", "/", "%", "~/"].includes(this.current().value)) {
      const op = this.current().value;
      this.advanceToken();
      const right = this.parseUnary();
      expr = this.createNode("BinaryExpression", { left: expr, operator: op, right });
    }
    return expr;
  }

  parseUnary() {
    if (this.current() && ["!", "-", "+", "~", "await"].includes(this.current().value)) {
      const op = this.current().value;
      this.advanceToken();
      const arg = this.parseUnary();
      return this.createNode("UnaryExpression", { operator: op, argument: arg, prefix: true });
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
        expr = this.createNode("CallExpression", { callee: expr, arguments: args });
      } else if (this.match("PUNCT", "[")) {
        const index = this.parseExpression();
        this.expect("PUNCT", "]");
        expr = this.createNode("MemberExpression", { object: expr, property: index, computed: true });
      } else if (this.match("OPERATOR", "..")) {
        // Cascade operator - chain multiple method calls on the same object
        // Example: obj..method1()..method2() should be ONE expression with multiple operations
        const cascadeOps = [];
        
        // Parse first operation after initial ..
        while (this.current()) {
          // Parse property/method name
          const prop = this.expect("IDENTIFIER").value;
          
          // Check if it's a method call
          if (this.match("PUNCT", "(")) {
            const args = [];
            while (!this.match("PUNCT", ")") && this.current()) {
              args.push(this.parseExpression());
              this.match("PUNCT", ",");
            }
            cascadeOps.push({ 
              type: "method", 
              name: prop, 
              arguments: args 
            });
          } else {
            // Property access
            cascadeOps.push({ 
              type: "property", 
              name: prop 
            });
          }
          
          // Check for another cascade operator
          if (!this.match("OPERATOR", "..")) {
            break; // No more cascade operations
          }
        }
        
        // Create single cascade expression with all operations
        expr = this.createNode("CascadeExpression", { 
          object: expr, 
          operations: cascadeOps 
        });
      } else if (this.match("PUNCT", ".")) {
        const prop = this.expect("IDENTIFIER").value;
        expr = this.createNode("MemberExpression", { object: expr, property: this.createIdentifier(prop), computed: false });
      } else if (this.match("OPERATOR", "?.")) {
        const prop = this.expect("IDENTIFIER").value;
        expr = this.createNode("MemberExpression", { object: expr, property: this.createIdentifier(prop), optional: true });
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
      if (["true", "false"].includes(token.value)) {
        this.advanceToken();
        return this.createLiteral(token.value === "true", token.value);
      }
      if (token.value === "null") {
        this.advanceToken();
        return this.createLiteral(null, "null");
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
      return this.createNode("ArrayExpression", { elements });
    }

    if (this.match("PUNCT", "{")) {
      const properties = [];
      while (!this.match("PUNCT", "}") && this.current()) {
        let key;
        const keyToken = this.current();
        
        // Accept both STRING and IDENTIFIER as keys in map literals
        if (keyToken.type === "STRING") {
          key = keyToken.value;
          this.advanceToken();
        } else if (keyToken.type === "IDENTIFIER") {
          key = keyToken.value;
          this.advanceToken();
        } else {
          throw new Error(`Expected STRING or IDENTIFIER as map key, got ${keyToken.type}:${keyToken.value}`);
        }
        
        if (this.match("PUNCT", ":")) {
          const value = this.parseExpression();
          properties.push({ key: this.createIdentifier(key), value });
        }
        this.match("PUNCT", ",");
      }
      return this.createNode("ObjectExpression", { properties });
    }

    this.advanceToken();
    return this.createIdentifier("undefined");
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

module.exports = { DartParser };


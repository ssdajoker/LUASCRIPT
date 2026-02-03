/**
 * TypeScript Parser - C-Family Language with Type Support
 * Parses TypeScript code to canonical AST for IR pipeline
 * Focus: Static typing, advanced OOP, decorators
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

class TypeScriptParser extends BaseParser {
  constructor(source) {
    super(source);
    this.keywords = [
      "function", "class", "interface", "type", "namespace", "module", "export", "import", "as", "from",
      "if", "else", "switch", "case", "default", "while", "do", "for", "of", "in", "break", "continue",
      "return", "throw", "try", "catch", "finally", "new", "this", "super", "static",
      "public", "private", "protected", "readonly", "abstract", "implements", "extends", "declare",
      "const", "let", "var", "void", "any", "never", "unknown", "boolean", "number", "string",
      "true", "false", "null", "undefined", "async", "await", "yield", "enum"
    ];
    this.operators = ["===", "!==", "==", "!=", "<=", ">=", "&&", "||", "=>", "...", "?.", "??", "??=", "<", ">", "|", "&"];
    
    // Memory management (Phase B pattern)
    this.pool = new ObjectPool(5000);
    this.objectCount = 0;
    this.maxObjects = 50000;
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

  advance() {
    this.tokenPos++;
  }

  match(type, value = null) {
    const token = this.current();
    if (token && token.type === type && (!value || token.value === value)) {
      this.advance();
      return true;
    }
    return false;
  }

  expect(type, value = null) {
    const token = this.current();
    if (!token || token.type !== type || (value && token.value !== value)) {
      throw new Error(`Expected ${type}:${value}`);
    }
    this.advance();
    return token;
  }

  parseProgram() {
    const body = [];
    while (this.current()) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }
    return this.createNode("Program", { body });
  }

  parseStatement() {
    const token = this.current();
    if (!token) return null;

    // Handle decorators
    const decorators = [];
    while (this.current()?.value === "@") {
      this.advance();
      decorators.push(this.expect("IDENTIFIER").value);
    }

    // Handle modifiers
    const modifiers = [];
    while (this.current() && ["export", "declare", "default", "async"].includes(this.current().value)) {
      modifiers.push(this.current().value);
      this.advance();
    }

    if (token.type === "KEYWORD") {
      switch (token.value) {
      case "import": return this.parseImportStatement();
      case "export": return this.parseExportStatement();
      case "function": return this.parseFunctionDeclaration();
      case "class": return this.parseClassDeclaration();
      case "interface": return this.parseInterfaceDeclaration();
      case "type": return this.parseTypeDeclaration();
      case "enum": return this.parseEnumDeclaration();
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
      case "const":
      case "let":
      case "var": return this.parseVariableDeclaration();
      }
    }

    return this.parseExpressionStatement();
  }

  parseImportStatement() {
    this.expect("KEYWORD", "import");
    const specifiers = [];
        
    if (this.match("PUNCT", "{")) {
      while (!this.match("PUNCT", "}") && this.current()) {
        const name = this.expect("IDENTIFIER").value;
        let local = name;
        if (this.match("KEYWORD", "as")) {
          local = this.expect("IDENTIFIER").value;
        }
        specifiers.push({ name, local });
        this.match("PUNCT", ",");
      }
    } else {
      specifiers.push({ name: this.expect("IDENTIFIER").value });
    }

    this.expect("KEYWORD", "from");
    const source = this.expect("STRING").value;
    this.match("PUNCT", ";");
        
    return this.createNode("ImportDeclaration", { specifiers, source });
  }

  parseExportStatement() {
    this.expect("KEYWORD", "export");
    if (this.match("KEYWORD", "default")) {
      const declaration = this.parseStatement();
      return this.createNode("ExportDefaultDeclaration", { declaration });
    }
    const declaration = this.parseStatement();
    return this.createNode("ExportNamedDeclaration", { declaration });
  }

  parseFunctionDeclaration() {
    this.match("KEYWORD", "async");
    this.expect("KEYWORD", "function");
    const name = this.expect("IDENTIFIER").value;
        
    // Parse type parameters
    if (this.current()?.value === "<") {
      this.parseTypeParameters();
    }

    this.expect("PUNCT", "(");
    const params = this.parseParameterList();
    this.expect("PUNCT", ")");

    // Parse return type
    if (this.match("PUNCT", ":")) {
      this.parseType();
    }

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

    const interfaces = [];
    if (this.match("KEYWORD", "implements")) {
      do {
        interfaces.push(this.expect("IDENTIFIER").value);
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
    while (this.current() && ["public", "private", "protected", "static", "readonly"].includes(this.current().value)) {
      modifiers.push(this.current().value);
      this.advance();
    }

    if (this.current()?.value === "constructor") {
      this.advance();
      this.expect("PUNCT", "(");
      this.parseParameterList();
      this.expect("PUNCT", ")");
      const body = this.parseBlockStatement();
      return this.createNode("MethodDefinition", {
        key: this.createIdentifier("constructor"),
        value: this.createNode("FunctionExpression", {
          id: this.createIdentifier("constructor"),
          params: [],
          body
        }),
        kind: "constructor"
      });
    }

    if (this.current()?.value === "function" || this.current()?.type === "IDENTIFIER") {
      this.match("KEYWORD", "function");
      const propName = this.expect("IDENTIFIER").value;
            
      if (this.current()?.value === "(") {
        this.expect("PUNCT", "(");
        this.parseParameterList();
        this.expect("PUNCT", ")");
        if (this.match("PUNCT", ":")) {
          this.parseType();
        }
        const body = this.parseBlockStatement();
        return this.createNode("MethodDefinition", {
          key: this.createIdentifier(propName),
          value: this.createNode("FunctionExpression", {
            id: this.createIdentifier(propName),
            params: [],
            body
          })
        });
      }
    }

    return this.parseVariableDeclaration();
  }

  parseInterfaceDeclaration() {
    this.expect("KEYWORD", "interface");
    const name = this.expect("IDENTIFIER").value;
    this.expect("PUNCT", "{");
    const body = [];
    while (!this.match("PUNCT", "}") && this.current()) {
      const propName = this.expect("IDENTIFIER").value;
      if (this.match("PUNCT", ":")) {
        this.parseType();
      }
      this.match("PUNCT", ";");
      body.push({ key: propName });
    }
    return this.createNode("InterfaceDeclaration", {
      id: this.createIdentifier(name),
      body
    });
  }

  parseTypeDeclaration() {
    this.expect("KEYWORD", "type");
    const name = this.expect("IDENTIFIER").value;
    this.expect("OPERATOR", "=");
    this.parseType();
    this.match("PUNCT", ";");
    return this.createNode("TypeDeclaration", {
      id: this.createIdentifier(name)
    });
  }

  parseEnumDeclaration() {
    this.expect("KEYWORD", "enum");
    const name = this.expect("IDENTIFIER").value;
    this.expect("PUNCT", "{");
    const members = [];
    while (!this.match("PUNCT", "}") && this.current()) {
      const key = this.expect("IDENTIFIER").value;
      let value = null;
      if (this.match("OPERATOR", "=")) {
        value = this.parseExpression();
      }
      members.push({ key, value });
      this.match("PUNCT", ",");
    }
    return this.createNode("EnumDeclaration", {
      id: this.createIdentifier(name),
      members
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
        
    if (this.current()?.value === "const" || this.current()?.value === "let" || this.current()?.value === "var") {
      this.parseVariableDeclaration();
      if (this.current()?.value === "of") {
        this.advance();
        const right = this.parseExpression();
        this.expect("PUNCT", ")");
        const body = this.parseStatement();
        return this.createNode("ForOfStatement", { left: null, right, body });
      }
      if (this.current()?.value === "in") {
        this.advance();
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
    let handler = null;
    if (this.match("KEYWORD", "catch")) {
      const param = this.match("PUNCT", "(") ? this.expect("IDENTIFIER").value : null;
      if (param) this.expect("PUNCT", ")");
      const body = this.parseBlockStatement();
      handler = { param: param ? this.createIdentifier(param) : null, body };
    }
    let finalizer = null;
    if (this.match("KEYWORD", "finally")) {
      finalizer = this.parseBlockStatement();
    }
    return this.createTryStatement(block, handler, finalizer);
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
    this.advance();
    const declarations = [];
    do {
      const id = this.expect("IDENTIFIER").value;
      let init = null;
      if (this.match("OPERATOR", "=")) {
        init = this.parseAssignment();
      } else if (this.match("PUNCT", ":")) {
        this.parseType();
        if (this.match("OPERATOR", "=")) {
          init = this.parseAssignment();
        }
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
      if (this.match("PUNCT", ":")) {
        this.parseType();
      }
      params.push(name);
      this.match("PUNCT", ",");
    }
    return params;
  }

  parseTypeParameters() {
    this.expect("OPERATOR", "<");
    while (!this.match("OPERATOR", ">") && this.current()) {
      this.expect("IDENTIFIER");
      if (this.match("KEYWORD", "extends")) {
        this.parseType();
      }
      this.match("PUNCT", ",");
    }
  }

  parseType() {
    if (this.current()?.value === "(") {
      this.advance();
      while (!this.match("PUNCT", ")")) {
        this.parseType();
        this.match("PUNCT", ",");
      }
    }
    if (this.current()?.value === "{") {
      this.advance();
      while (!this.match("PUNCT", "}")) {
        this.expect("IDENTIFIER");
        if (this.match("PUNCT", ":")) {
          this.parseType();
        }
        this.match("PUNCT", ",");
      }
    }
    if (this.current()?.value === "[") {
      this.advance();
      this.parseType();
      this.expect("PUNCT", "]");
    }
        
    this.expect("IDENTIFIER");
    while (this.match("OPERATOR", "|") || this.match("OPERATOR", "&")) {
      this.expect("IDENTIFIER");
    }
  }

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    let expr = this.parseConditional();
    if (this.current() && ["=", "+=", "-=", "*=", "/=", "??="].includes(this.current().value)) {
      const op = this.current().value;
      this.advance();
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
      this.advance();
      const right = this.parseEquality();
      expr = this.createNode("LogicalExpression", { left: expr, operator: op, right });
    }
    return expr;
  }

  parseEquality() {
    let expr = this.parseComparison();
    while (this.current() && ["==", "!=", "===", "!=="].includes(this.current().value)) {
      const op = this.current().value;
      this.advance();
      const right = this.parseComparison();
      expr = this.createNode("BinaryExpression", { left: expr, operator: op, right });
    }
    return expr;
  }

  parseComparison() {
    let expr = this.parseAdditive();
    while (this.current() && ["<", ">", "<=", ">=", "in", "instanceof"].includes(this.current().value)) {
      const op = this.current().value;
      this.advance();
      const right = this.parseAdditive();
      expr = this.createNode("BinaryExpression", { left: expr, operator: op, right });
    }
    return expr;
  }

  parseAdditive() {
    let expr = this.parseMultiplicative();
    while (this.current() && ["+", "-"].includes(this.current().value)) {
      const op = this.current().value;
      this.advance();
      const right = this.parseMultiplicative();
      expr = this.createNode("BinaryExpression", { left: expr, operator: op, right });
    }
    return expr;
  }

  parseMultiplicative() {
    let expr = this.parseUnary();
    while (this.current() && ["*", "/", "%"].includes(this.current().value)) {
      const op = this.current().value;
      this.advance();
      const right = this.parseUnary();
      expr = this.createNode("BinaryExpression", { left: expr, operator: op, right });
    }
    return expr;
  }

  parseUnary() {
    if (this.current() && ["!", "-", "+", "~", "typeof", "await"].includes(this.current().value)) {
      const op = this.current().value;
      this.advance();
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
      this.advance();
      return this.createLiteral(token.value, token.value);
    }

    if (token.type === "NUMBER") {
      this.advance();
      return this.createLiteral(parseFloat(token.value) || parseInt(token.value), token.value);
    }

    if (token.type === "IDENTIFIER") {
      const name = token.value;
      this.advance();
      return this.createIdentifier(name);
    }

    if (token.type === "KEYWORD") {
      if (["true", "false"].includes(token.value)) {
        this.advance();
        return this.createLiteral(token.value === "true", token.value);
      }
      if (token.value === "null" || token.value === "undefined") {
        this.advance();
        return this.createLiteral(null, token.value);
      }
      if (token.value === "new") {
        this.advance();
        const callee = this.createIdentifier(this.expect("IDENTIFIER").value);
        this.expect("PUNCT", "(");
        const args = [];
        while (!this.match("PUNCT", ")") && this.current()) {
          args.push(this.parseExpression());
          this.match("PUNCT", ",");
        }
        return this.createNode("NewExpression", { callee, arguments: args });
      }
      if (token.value === "async") {
        this.advance();
        if (this.current()?.value === "function") {
          this.advance();
          const name = this.current()?.type === "IDENTIFIER" ? this.expect("IDENTIFIER").value : "";
          this.expect("PUNCT", "(");
          this.parseParameterList();
          this.expect("PUNCT", ")");
          const body = this.parseBlockStatement();
          return this.createNode("AsyncFunctionExpression", {
            id: name ? this.createIdentifier(name) : null,
            params: [],
            body
          });
        }
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
        const key = this.expect("IDENTIFIER").value;
        if (this.match("PUNCT", ":")) {
          const value = this.parseExpression();
          properties.push({ key: this.createIdentifier(key), value });
        } else {
          properties.push({ key: this.createIdentifier(key), value: this.createIdentifier(key) });
        }
        this.match("PUNCT", ",");
      }
      return this.createNode("ObjectExpression", { properties });
    }

    this.advance();
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

module.exports = { TypeScriptParser };


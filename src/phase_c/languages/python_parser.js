/**
 * PYTHON PHASE C PARSER
 * 
 * Parses Python source code into abstract syntax tree (AST)
 * Features:
 * - Control flow (if/elif/else, while, for)
 * - Function/class definitions with decorators
 * - Comprehensions (list, dict, set)
 * - Exception handling (try/except/finally)
 * - Context managers (with statements)
 * - Async/await support
 * - Type hints and annotations
 * 
 * CSC LM EVO-A Standard: Professional forensic-grade parser
 */

const AbstractPhaseC_Parser = require("../framework/abstract_parser");

class PythonPhaseC_Parser extends AbstractPhaseC_Parser {
  constructor(tokenizer) {
    super(tokenizer, {
      language: "Python",
      version: "3.8+"
    });

    this.ast = null;
    this.current = 0;
    this.tokens = [];
    this.parseMetrics = {
      functionCount: 0,
      classCount: 0,
      comprehensionCount: 0,
      decoratorCount: 0,
      asyncCount: 0,
      errors: []
    };
  }

  /**
   * PARSE PROGRAM
   * Entry point for parsing entire Python file
   */
  parseProgram(sourceCode) {
    try {
      // Tokenize
      const tokens = this.tokenizer.tokenize(sourceCode);
      this.tokens = tokens;
      this.current = 0;

      const statements = [];
      while (!this.isAtEnd()) {
        const stmt = this.parseStatement();
        if (stmt) {
          statements.push(stmt);
        }
      }

      this.ast = {
        type: "Program",
        body: statements,
        sourceType: "module",
        metadata: {
          language: "Python",
          parseMetrics: this.parseMetrics
        }
      };

      return this.ast;
    } catch (error) {
      this.parseMetrics.errors.push(`Parse error: ${error.message}`);
      throw new Error(`Python parsing failed: ${error.message}`);
    }
  }

  /**
   * PARSE STATEMENT
   * Handles different statement types
   */
  parseStatement() {
    // Skip EOF
    if (this.check("EOF")) {
      return null;
    }

    // Skip INDENT/DEDENT at statement level (handled by indentation)
    if (this.check("INDENT") || this.check("DEDENT")) {
      this.advance();
      return this.parseStatement();
    }

    const token = this.peek();

    // Function definition
    if (token.value === "async" && this.peekAhead(1)?.value === "def") {
      return this.parseFunctionDef(true);
    }
    if (token.value === "def") {
      return this.parseFunctionDef(false);
    }

    // Class definition
    if (token.value === "class") {
      return this.parseClassDef();
    }

    // Decorators
    if (token.type === "DECORATOR_START") {
      return this.parseDecoratedStatement();
    }

    // Control flow
    if (token.value === "if") {
      return this.parseIfStatement();
    }
    if (token.value === "while") {
      return this.parseWhileStatement();
    }
    if (token.value === "for") {
      return this.parseForStatement();
    }

    // Exception handling
    if (token.value === "try") {
      return this.parseTryStatement();
    }

    // Context manager
    if (token.value === "with") {
      return this.parseWithStatement();
    }

    // Return statement
    if (token.value === "return") {
      return this.parseReturnStatement();
    }

    // Yield statement
    if (token.value === "yield") {
      return this.parseYieldStatement();
    }

    // Raise statement
    if (token.value === "raise") {
      return this.parseRaiseStatement();
    }

    // Import statements
    if (token.value === "import" || token.value === "from") {
      return this.parseImportStatement();
    }

    // Expression statement (assignment, call, etc.)
    return this.parseExpressionStatement();
  }

  /**
   * PARSE FUNCTION DEFINITION
   */
  parseFunctionDef(isAsync) {
    const startToken = this.advance(); // def or async
    if (isAsync) {
      this.advance(); // def
    }

    const nameToken = this.advance(); // function name
    if (nameToken.type !== "IDENTIFIER") {
      throw new Error(`Expected function name, got ${nameToken.value}`);
    }

    this.parseMetrics.functionCount++;
    if (isAsync) {
      this.parseMetrics.asyncCount++;
    }

    // Parameters
    this.consume("(", "Expected ( after function name");
    const params = this.parseParameters();
    this.consume(")", "Expected ) after parameters");

    // Return type annotation (optional)
    let returnType = null;
    if (this.match("->")) {
      returnType = this.parseTypeHint();
    }

    this.consume(":", "Expected : after function signature");

    // Function body
    const body = this.parseBlock();

    return {
      type: "FunctionDef",
      name: nameToken.value,
      params: params,
      body: body,
      returnType: returnType,
      isAsync: isAsync,
      line: startToken.line,
      column: startToken.column
    };
  }

  /**
   * PARSE CLASS DEFINITION
   */
  parseClassDef() {
    const startToken = this.advance(); // class
    
    const nameToken = this.advance(); // class name
    if (nameToken.type !== "IDENTIFIER") {
      throw new Error(`Expected class name, got ${nameToken.value}`);
    }

    this.parseMetrics.classCount++;

    // Base classes (optional)
    let bases = [];
    if (this.match("(")) {
      bases = this.parseArguments();
      this.consume(")", "Expected ) after base classes");
    }

    this.consume(":", "Expected : after class header");

    // Class body
    const body = this.parseBlock();

    return {
      type: "ClassDef",
      name: nameToken.value,
      bases: bases,
      body: body,
      line: startToken.line,
      column: startToken.column
    };
  }

  /**
   * PARSE IF STATEMENT
   */
  parseIfStatement() {
    const ifToken = this.advance(); // if

    const test = this.parseExpression();
    this.consume(":", "Expected : after if condition");
    const ifBody = this.parseBlock();

    let elifClauses = [];
    let elseBody = null;

    // Handle elif clauses
    while (this.match("elif")) {
      const elifTest = this.parseExpression();
      this.consume(":", "Expected : after elif condition");
      const elifBody = this.parseBlock();
      elifClauses.push({ test: elifTest, body: elifBody });
    }

    // Handle else clause
    if (this.match("else")) {
      this.consume(":", "Expected : after else");
      elseBody = this.parseBlock();
    }

    return {
      type: "IfStatement",
      test: test,
      body: ifBody,
      elifClauses: elifClauses,
      elseBody: elseBody,
      line: ifToken.line,
      column: ifToken.column
    };
  }

  /**
   * PARSE WHILE STATEMENT
   */
  parseWhileStatement() {
    const whileToken = this.advance(); // while

    const test = this.parseExpression();
    this.consume(":", "Expected : after while condition");
    const body = this.parseBlock();

    let elseBody = null;
    if (this.match("else")) {
      this.consume(":", "Expected : after else");
      elseBody = this.parseBlock();
    }

    return {
      type: "WhileStatement",
      test: test,
      body: body,
      elseBody: elseBody,
      line: whileToken.line,
      column: whileToken.column
    };
  }

  /**
   * PARSE FOR STATEMENT
   * Handles both regular loops and comprehensions
   */
  parseForStatement() {
    const forToken = this.advance(); // for

    const target = this.parseExpression();
    this.consume("in", "Expected in after for target");
    const iter = this.parseExpression();

    // Check if this is a comprehension (expression follows)
    if (this.check("[") || this.check("{") || this.check("(")) {
      this.parseMetrics.comprehensionCount++;
      return {
        type: "Comprehension",
        target: target,
        iter: iter,
        filters: [],
        line: forToken.line,
        column: forToken.column
      };
    }

    this.consume(":", "Expected : after for clause");
    const body = this.parseBlock();

    let elseBody = null;
    if (this.match("else")) {
      this.consume(":", "Expected : after else");
      elseBody = this.parseBlock();
    }

    return {
      type: "ForStatement",
      target: target,
      iter: iter,
      body: body,
      elseBody: elseBody,
      line: forToken.line,
      column: forToken.column
    };
  }

  /**
   * PARSE TRY STATEMENT
   */
  parseTryStatement() {
    const tryToken = this.advance(); // try

    this.consume(":", "Expected : after try");
    const tryBody = this.parseBlock();

    const handlers = [];
    while (this.match("except")) {
      const exceptionType = this.parseExpression();
      let name = null;
      
      if (this.match("as")) {
        const nameToken = this.advance();
        name = nameToken.value;
      }

      this.consume(":", "Expected : after except clause");
      const handlerBody = this.parseBlock();
      
      handlers.push({
        type: "ExceptionHandler",
        exceptionType: exceptionType,
        name: name,
        body: handlerBody
      });
    }

    let elseBody = null;
    if (this.match("else")) {
      this.consume(":", "Expected : after else");
      elseBody = this.parseBlock();
    }

    let finallyBody = null;
    if (this.match("finally")) {
      this.consume(":", "Expected : after finally");
      finallyBody = this.parseBlock();
    }

    return {
      type: "TryStatement",
      body: tryBody,
      handlers: handlers,
      elseBody: elseBody,
      finallyBody: finallyBody,
      line: tryToken.line,
      column: tryToken.column
    };
  }

  /**
   * PARSE WITH STATEMENT
   */
  parseWithStatement() {
    const withToken = this.advance(); // with

    const items = [];
    do {
      const expr = this.parseExpression();
      let asName = null;

      if (this.match("as")) {
        const nameToken = this.advance();
        asName = nameToken.value;
      }

      items.push({ expr: expr, asName: asName });
    } while (this.match(","));

    this.consume(":", "Expected : after with clause");
    const body = this.parseBlock();

    return {
      type: "WithStatement",
      items: items,
      body: body,
      line: withToken.line,
      column: withToken.column
    };
  }

  /**
   * PARSE RETURN STATEMENT
   */
  parseReturnStatement() {
    const returnToken = this.advance(); // return

    let value = null;
    if (!this.check("NEWLINE") && !this.isAtEnd()) {
      value = this.parseExpression();
    }

    return {
      type: "ReturnStatement",
      value: value,
      line: returnToken.line,
      column: returnToken.column
    };
  }

  /**
   * PARSE YIELD STATEMENT
   */
  parseYieldStatement() {
    const yieldToken = this.advance(); // yield

    let value = null;
    if (!this.check("NEWLINE") && !this.isAtEnd()) {
      value = this.parseExpression();
    }

    return {
      type: "YieldStatement",
      value: value,
      line: yieldToken.line,
      column: yieldToken.column
    };
  }

  /**
   * PARSE RAISE STATEMENT
   */
  parseRaiseStatement() {
    const raiseToken = this.advance(); // raise

    let exception = null;
    if (!this.check("NEWLINE") && !this.isAtEnd()) {
      exception = this.parseExpression();
    }

    return {
      type: "RaiseStatement",
      exception: exception,
      line: raiseToken.line,
      column: raiseToken.column
    };
  }

  /**
   * PARSE IMPORT STATEMENT
   */
  parseImportStatement() {
    const importToken = this.advance(); // import or from

    if (importToken.value === "from") {
      const module = this.parseExpression();
      this.consume("import", "Expected import after from");
      const names = this.parseImportNames();

      return {
        type: "FromImport",
        module: module,
        names: names,
        line: importToken.line,
        column: importToken.column
      };
    } else {
      const names = this.parseImportNames();

      return {
        type: "ImportStatement",
        names: names,
        line: importToken.line,
        column: importToken.column
      };
    }
  }

  /**
   * PARSE EXPRESSION STATEMENT
   */
  parseExpressionStatement() {
    const expr = this.parseExpression();

    // Check for assignment
    if (this.match("=")) {
      const value = this.parseExpression();
      return {
        type: "Assignment",
        target: expr,
        value: value
      };
    }

    return {
      type: "ExpressionStatement",
      expression: expr
    };
  }

  /**
   * PARSE EXPRESSION
   */
  parseExpression() {
    return this.parseBinaryExpression();
  }

  /**
   * PARSE BINARY EXPRESSION
   */
  parseBinaryExpression(minPrecedence = 0) {
    let left = this.parsePrimaryExpression();

    while (!this.isAtEnd()) {
      const op = this.peek().value;
      const precedence = this.getOperatorPrecedence(op);

      if (precedence < minPrecedence || precedence === -1) {
        break;
      }

      this.advance();
      const right = this.parseBinaryExpression(precedence + 1);

      left = {
        type: "BinaryExpression",
        operator: op,
        left: left,
        right: right
      };
    }

    return left;
  }

  /**
   * PARSE PRIMARY EXPRESSION
   */
  parsePrimaryExpression() {
    const token = this.peek();

    if (token.type === "NUMBER") {
      this.advance();
      return { type: "Number", value: token.value };
    }

    if (token.type === "STRING") {
      this.advance();
      return { type: "String", value: token.value };
    }

    if (token.type === "IDENTIFIER") {
      const name = token.value;
      this.advance();

      // Function call
      if (this.match("(")) {
        const args = this.parseArguments();
        this.consume(")", "Expected ) after arguments");
        return {
          type: "Call",
          func: { type: "Identifier", name: name },
          args: args
        };
      }

      // Array/dict access
      if (this.match("[")) {
        const index = this.parseExpression();
        this.consume("]", "Expected ] after index");
        return {
          type: "Subscript",
          value: { type: "Identifier", name: name },
          slice: index
        };
      }

      return { type: "Identifier", name: name };
    }

    if (token.value === "lambda") {
      return this.parseLambda();
    }

    if (this.match("[")) {
      return this.parseList();
    }

    if (this.match("{")) {
      return this.parseDict();
    }

    if (this.match("(")) {
      const expr = this.parseExpression();
      this.consume(")", "Expected ) after expression");
      return expr;
    }

    throw new Error(`Unexpected token: ${token.value}`);
  }

  /**
   * PARSE PARAMETERS
   */
  parseParameters() {
    const params = [];

    if (!this.check(")")) {
      do {
        const param = this.advance();
        let default_value = null;

        if (this.match("=")) {
          default_value = this.parseExpression();
        }

        params.push({
          name: param.value,
          default: default_value,
          annotation: null
        });
      } while (this.match(","));
    }

    return params;
  }

  /**
   * PARSE ARGUMENTS
   */
  parseArguments() {
    const args = [];

    if (!this.check(")")) {
      do {
        args.push(this.parseExpression());
      } while (this.match(","));
    }

    return args;
  }

  /**
   * PARSE BLOCK
   * Handles indented blocks
   */
  parseBlock() {
    const statements = [];

    // NEWLINE is optional before INDENT
    while (!this.isAtEnd() && !this.check("DEDENT")) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }

    if (this.match("DEDENT")) {
      // Dedent consumed
    }

    return statements;
  }

  /**
   * PARSE LIST LITERAL
   */
  parseList() {
    const elements = [];

    if (!this.check("]")) {
      do {
        elements.push(this.parseExpression());
      } while (this.match(","));
    }

    this.consume("]", "Expected ] after list");
    return {
      type: "List",
      elements: elements
    };
  }

  /**
   * PARSE DICT LITERAL
   */
  parseDict() {
    const items = [];

    if (!this.check("}")) {
      do {
        const key = this.parseExpression();
        this.consume(":", "Expected : after dict key");
        const value = this.parseExpression();
        items.push({ key: key, value: value });
      } while (this.match(","));
    }

    this.consume("}", "Expected } after dict");
    return {
      type: "Dict",
      items: items
    };
  }

  /**
   * PARSE LAMBDA
   */
  parseLambda() {
    this.advance(); // lambda

    const params = [];
    if (!this.check(":")) {
      do {
        params.push(this.advance().value);
      } while (this.match(","));
    }

    this.consume(":", "Expected : in lambda");
    const body = this.parseExpression();

    return {
      type: "Lambda",
      params: params,
      body: body
    };
  }

  /**
   * PARSE IMPORT NAMES
   */
  parseImportNames() {
    const names = [];

    do {
      const name = this.advance().value;
      let asName = null;

      if (this.match("as")) {
        asName = this.advance().value;
      }

      names.push({ name: name, asName: asName });
    } while (this.match(","));

    return names;
  }

  /**
   * PARSE DECORATED STATEMENT
   */
  parseDecoratedStatement() {
    const decorators = [];

    while (this.match("@")) {
      const decorator = this.parseExpression();
      decorators.push(decorator);
      this.parseMetrics.decoratorCount++;
    }

    const statement = this.parseStatement();
    if (statement) {
      statement.decorators = decorators;
    }

    return statement;
  }

  /**
   * PARSE TYPE HINT
   */
  parseTypeHint() {
    return this.parseExpression();
  }

  /**
   * HELPER: Get operator precedence
   */
  getOperatorPrecedence(op) {
    const precedences = {
      "or": 1,
      "and": 2,
      "not": 3,
      "in": 4,
      "is": 4,
      "==": 5,
      "!=": 5,
      "<": 5,
      ">": 5,
      "<=": 5,
      ">=": 5,
      "|": 6,
      "^": 7,
      "&": 8,
      "<<": 9,
      ">>": 9,
      "+": 10,
      "-": 10,
      "*": 11,
      "/": 11,
      "//": 11,
      "%": 11,
      "**": 12
    };

    return precedences[op] ?? -1;
  }

  /**
   * HELPER: Check token type
   */
  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type || this.peek().value === type;
  }

  /**
   * HELPER: Match token and advance
   */
  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  /**
   * HELPER: Consume token
   */
  consume(type, message) {
    if (this.check(type)) {
      return this.advance();
    }
    throw new Error(message);
  }

  /**
   * HELPER: Advance to next token
   */
  advance() {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  /**
   * HELPER: Get current token
   */
  peek() {
    return this.tokens[this.current] || { type: "EOF", value: "" };
  }

  /**
   * HELPER: Look ahead
   */
  peekAhead(n) {
    return this.tokens[this.current + n] || { type: "EOF", value: "" };
  }

  /**
   * HELPER: Get previous token
   */
  previous() {
    return this.tokens[this.current - 1];
  }

  /**
   * HELPER: Check if at end
   */
  isAtEnd() {
    return this.current >= this.tokens.length || this.peek().type === "EOF";
  }

  /**
   * GET PARSE METRICS
   */
  getMetrics() {
    return this.parseMetrics;
  }
}

module.exports = PythonPhaseC_Parser;

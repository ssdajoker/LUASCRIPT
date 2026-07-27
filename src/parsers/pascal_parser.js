/**
 * Pascal Parser - Legacy Language
 * Parses pascal code to canonical AST for IR pipeline
 */

const { BaseParser } = require("./base_parser");

class PascalParser extends BaseParser {
  constructor(source) {
    super(source);
    this.keywords = [
      "program", "procedure", "function", "begin", "end", "if", "then", "else", "while", "do", "for", "to", "downto", "repeat", "until", "case", "of", "var", "const"
    ];
    this.operators = ["=", "<>", "<", "<=", ">", ">=", "AND", "OR", "NOT", "DIV", "MOD"];
  }

  tokenize() {
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

    if (token.type === "KEYWORD") {
      switch (token.value) {
      case "function":
      case "class":
        return this.parseDeclaration();
      case "if":
        return this.parseIfStatement();
      case "while":
      case "for":
        return this.parseLoopStatement();
      case "return":
        return this.parseReturnStatement();
      case "throw":
        return this.parseThrowStatement();
      }
    }

    return this.parseExpressionStatement();
  }

  parseDeclaration() {
    const keyword = this.current().value;
    this.advance();
    const name = this.expect("IDENTIFIER").value;
        
    if (keyword === "function" || keyword === "sub") {
      this.expect("PUNCT", "(");
      const params = this.parseParameterList();
      this.expect("PUNCT", ")");
      const body = this.parseBlockStatement();
      return this.createFunctionDeclaration(name, params, body.body);
    }
        
    if (keyword === "class") {
      this.expect("PUNCT", "{");
      const body = [];
      while (!this.match("PUNCT", "}") && this.current()) {
        body.push(this.parseStatement());
      }
      return this.createClassDeclaration(name, null, body);
    }
        
    return null;
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

  parseLoopStatement() {
    const keyword = this.current().value;
    this.advance();
        
    if (keyword === "while") {
      this.expect("PUNCT", "(");
      const test = this.parseExpression();
      this.expect("PUNCT", ")");
      const body = this.parseStatement();
      return this.createWhileStatement(test, body);
    }
        
    if (keyword === "for") {
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
        
    return null;
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

  parseThrowStatement() {
    this.expect("KEYWORD", "throw");
    const argument = this.parseExpression();
    return this.createThrowStatement(argument);
  }

  parseExpressionStatement() {
    const expr = this.parseExpression();
    this.match("PUNCT", ";");
    return this.createExpressionStatement(expr);
  }

  parseParameterList() {
    const params = [];
    while (!this.match("PUNCT", ")") && this.current()) {
      params.push(this.expect("IDENTIFIER").value);
      this.match("PUNCT", ",");
    }
    return params;
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

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    let expr = this.parseLogical();
    if (this.current() && this.current().value === "=") {
      this.advance();
      const right = this.parseAssignment();
      expr = this.createNode("AssignmentExpression", { left: expr, operator: "=", right });
    }
    return expr;
  }

  parseLogical() {
    let expr = this.parseEquality();
    while (this.current() && ["&&", "||"].includes(this.current().value)) {
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
    while (this.current() && ["<", ">", "<=", ">="].includes(this.current().value)) {
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
    if (this.current() && ["!", "-", "+"].includes(this.current().value)) {
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
        expr = this.createNode("MemberExpression", { object: expr, property: this.createIdentifier(prop) });
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
      return this.createLiteral(Number(token.value), token.value);
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
      if (token.value === "null") {
        this.advance();
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

    this.advance();
    return this.createIdentifier("undefined");
  }
}

module.exports = { PascalParser };

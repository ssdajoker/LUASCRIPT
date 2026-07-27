"use strict";

/**
 * C# to canonical IR compiler.
 *
 * V0.5 support is intentionally small and executable:
 * - Program wrapper with static methods
 * - locals, assignments, arithmetic/comparison/boolean expressions
 * - if/else, while, numeric for, break/continue, return
 * - arrays with zero-based indexing
 * - foreach over arrays including continue, string interpolation, .Length, and common Math.* calls
 * - Console.WriteLine mapped to canonical console.log
 */

const { IRBuilder } = require("../ir/builder");

const KEYWORDS = new Set([
  "bool", "break", "class", "continue", "double", "else", "false", "float",
  "for", "foreach", "if", "in", "int", "long", "namespace", "new", "null", "private",
  "public", "return", "static", "string", "true", "using", "var", "void",
  "while"
]);

const MODIFIERS = new Set(["public", "private", "protected", "internal", "static"]);
const DECLARATION_TYPES = new Set(["bool", "double", "float", "int", "long", "string", "var"]);
const PRECEDENCE = {
  "||": 1,
  "&&": 2,
  "==": 3,
  "!=": 3,
  "<": 4,
  "<=": 4,
  ">": 4,
  ">=": 4,
  "+": 5,
  "-": 5,
  "*": 6,
  "/": 6,
  "%": 6
};
const ASSIGNMENT_OPERATORS = new Set(["=", "+=", "-=", "*=", "/=", "%="]);
const MATH_METHOD_MAP = new Map([
  ["Abs", "abs"],
  ["Ceiling", "ceil"],
  ["Floor", "floor"],
  ["Max", "max"],
  ["Min", "min"],
  ["Pow", "pow"],
  ["Sqrt", "sqrt"]
]);

function unsupported(feature) {
  throw new Error(`Unsupported C# input feature: ${feature}`);
}

function tokenize(source) {
  const tokens = [];
  let index = 0;
  let line = 1;
  let column = 1;

  function advance(count = 1) {
    for (let i = 0; i < count; i++) {
      if (source[index] === "\n") {
        line += 1;
        column = 1;
      } else {
        column += 1;
      }
      index += 1;
    }
  }

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (/\s/.test(char)) {
      advance();
      continue;
    }

    if (char === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") advance();
      continue;
    }

    if (char === "/" && next === "*") {
      advance(2);
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        advance();
      }
      if (index < source.length) advance(2);
      continue;
    }

    const start = { line, column };

    if (char === "$" && next === "\"") {
      advance();
      advance();
      let value = "";
      while (index < source.length && source[index] !== "\"") {
        if (source[index] === "\\") {
          advance();
          const escaped = source[index];
          const escapeMap = { n: "\n", r: "\r", t: "\t", "\"": "\"", "\\": "\\" };
          value += Object.prototype.hasOwnProperty.call(escapeMap, escaped) ? escapeMap[escaped] : escaped;
          advance();
        } else {
          value += source[index];
          advance();
        }
      }
      if (source[index] !== "\"") unsupported("unterminated interpolated strings");
      advance();
      tokens.push({ type: "InterpolatedString", value, ...start });
      continue;
    }

    if (char === "\"") {
      advance();
      let value = "";
      while (index < source.length && source[index] !== "\"") {
        if (source[index] === "\\") {
          advance();
          const escaped = source[index];
          const escapeMap = { n: "\n", r: "\r", t: "\t", "\"": "\"", "\\": "\\" };
          value += Object.prototype.hasOwnProperty.call(escapeMap, escaped) ? escapeMap[escaped] : escaped;
          advance();
        } else {
          value += source[index];
          advance();
        }
      }
      if (source[index] !== "\"") unsupported("unterminated strings");
      advance();
      tokens.push({ type: "String", value, ...start });
      continue;
    }

    if (/\d/.test(char)) {
      let value = "";
      while (index < source.length && /[\d.]/.test(source[index])) {
        value += source[index];
        advance();
      }
      tokens.push({ type: "Number", value, ...start });
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      let value = "";
      while (index < source.length && /[A-Za-z0-9_]/.test(source[index])) {
        value += source[index];
        advance();
      }
      tokens.push({ type: KEYWORDS.has(value) ? "Keyword" : "Identifier", value, ...start });
      continue;
    }

    const two = source.slice(index, index + 2);
    if (["++", "--", "+=", "-=", "*=", "/=", "%=", "<=", ">=", "==", "!=", "&&", "||"].includes(two)) {
      tokens.push({ type: "Operator", value: two, ...start });
      advance(2);
      continue;
    }
    if (source.startsWith("??=", index)) unsupported("null-coalescing assignment");

    if ("{}()[];,.+-*/%<>=!".includes(char)) {
      tokens.push({ type: "{}()[];,.".includes(char) ? "Punctuator" : "Operator", value: char, ...start });
      advance();
      continue;
    }

    unsupported(`token ${JSON.stringify(char)}`);
  }

  return tokens;
}

class CSharpToIRCompiler {
  constructor(options = {}) {
    this.options = options;
    this.builder = new IRBuilder();
    this.tokens = [];
    this.pos = 0;
    this.tempCounter = 0;
  }

  compile(source) {
    this.validateSource(source);
    this.builder = new IRBuilder();
    this.tokens = tokenize(source);
    this.pos = 0;
    this.tempCounter = 0;
    const body = this.parseCompilationUnit();
    return this.builder.program(body, { metadata: { sourceLanguage: "csharp" } });
  }

  validateSource(source) {
    const checks = [
      [/\basync\b|\bawait\b/, "async/await"],
      [/\bfrom\b[\s\S]*\bselect\b/, "LINQ query syntax"],
      [/\btry\b|\bcatch\b|\bfinally\b/, "try/catch/finally"],
      [/\bswitch\s*\(/, "switch statements"],
      [/\binterface\b/, "interfaces"],
      [/\bstruct\b/, "structs"],
      [/\brecord\b/, "records"],
      [/\?\?|\?\./, "null-coalescing or null-conditional operators"],
      [/\bclass\s+(?!Program\b)[A-Za-z_][A-Za-z0-9_]*/, "classes beyond the Program wrapper"]
    ];
    for (const [pattern, feature] of checks) {
      if (pattern.test(source)) unsupported(feature);
    }
  }

  current() {
    return this.tokens[this.pos] || null;
  }

  peek(offset = 1) {
    return this.tokens[this.pos + offset] || null;
  }

  atEnd() {
    return this.pos >= this.tokens.length;
  }

  match(value) {
    if (this.current() && this.current().value === value) {
      this.pos += 1;
      return true;
    }
    return false;
  }

  expect(value) {
    if (!this.match(value)) {
      const token = this.current();
      throw new Error(`C# parse error: expected ${value}, got ${token ? token.value : "end of input"}`);
    }
  }

  expectIdentifier() {
    const token = this.current();
    if (!token || !["Identifier", "Keyword"].includes(token.type)) {
      throw new Error(`C# parse error: expected identifier, got ${token ? token.value : "end of input"}`);
    }
    this.pos += 1;
    return token.value;
  }

  parseCompilationUnit() {
    const functions = [];
    const mainStatements = [];

    while (!this.atEnd()) {
      if (this.match("using")) {
        this.skipUntil(";");
        continue;
      }
      if (this.match("namespace")) {
        this.skipNamespaceName();
        this.expect("{");
        const nested = this.parseCompilationUnitUntil("}");
        functions.push(...nested.functions);
        mainStatements.push(...nested.mainStatements);
        continue;
      }
      if (this.isClassStart()) {
        const nested = this.parseProgramClass();
        functions.push(...nested.functions);
        mainStatements.push(...nested.mainStatements);
        continue;
      }
      this.pos += 1;
    }

    return [...functions, ...mainStatements];
  }

  parseCompilationUnitUntil(endValue) {
    const functions = [];
    const mainStatements = [];
    while (!this.atEnd() && !this.match(endValue)) {
      if (this.match("using")) {
        this.skipUntil(";");
        continue;
      }
      if (this.isClassStart()) {
        const nested = this.parseProgramClass();
        functions.push(...nested.functions);
        mainStatements.push(...nested.mainStatements);
        continue;
      }
      this.pos += 1;
    }
    return { functions, mainStatements };
  }

  isClassStart() {
    let offset = 0;
    while (this.peek(offset) && MODIFIERS.has(this.peek(offset).value)) offset += 1;
    return this.peek(offset) && this.peek(offset).value === "class";
  }

  parseProgramClass() {
    while (this.current() && MODIFIERS.has(this.current().value)) this.pos += 1;
    this.expect("class");
    const name = this.expectIdentifier();
    if (name !== "Program") unsupported("classes beyond the Program wrapper");
    this.expect("{");

    const functions = [];
    const mainStatements = [];
    while (!this.atEnd() && !this.match("}")) {
      if (!this.isMethodStart()) {
        this.pos += 1;
        continue;
      }
      const method = this.parseMethod();
      if (method.name === "Main") {
        mainStatements.push(...method.body.statements);
      } else {
        functions.push(this.builder.functionDecl(method.name, method.parameters, method.body, null, {
          metadata: { sourceLanguage: "csharp", returnType: method.returnType }
        }));
      }
    }

    return { functions, mainStatements };
  }

  isMethodStart() {
    let offset = 0;
    while (this.peek(offset) && MODIFIERS.has(this.peek(offset).value)) offset += 1;
    return this.peek(offset) && this.isTypeToken(this.peek(offset)) &&
      this.peek(offset + 1) && ["Identifier", "Keyword"].includes(this.peek(offset + 1).type) &&
      this.peek(offset + 2) && this.peek(offset + 2).value === "(";
  }

  parseMethod() {
    while (this.current() && MODIFIERS.has(this.current().value)) this.pos += 1;
    const returnType = this.parseType();
    const name = this.expectIdentifier();
    this.expect("(");
    const parameters = this.parseParameters();
    this.expect(")");
    const body = this.parseBlock();
    return { name, returnType, parameters, body };
  }

  parseParameters() {
    const parameters = [];
    while (this.current() && this.current().value !== ")") {
      const type = this.parseType();
      const name = this.expectIdentifier();
      parameters.push(this.builder.parameter(name, null, null, {
        metadata: { sourceLanguage: "csharp", csharpType: type }
      }));
      if (!this.match(",")) break;
    }
    return parameters;
  }

  parseType() {
    const token = this.current();
    if (!token || !this.isTypeToken(token)) {
      throw new Error(`C# parse error: expected type, got ${token ? token.value : "end of input"}`);
    }
    let typeName = token.value;
    this.pos += 1;
    if (this.match("[")) {
      this.expect("]");
      typeName += "[]";
    }
    return typeName;
  }

  isTypeToken(token) {
    return token && (DECLARATION_TYPES.has(token.value) || token.value === "void" || token.type === "Identifier");
  }

  skipNamespaceName() {
    while (this.current() && this.current().value !== "{") this.pos += 1;
  }

  skipUntil(value) {
    while (!this.atEnd() && !this.match(value)) this.pos += 1;
  }

  parseBlock() {
    this.expect("{");
    const statements = [];
    while (!this.atEnd() && !this.match("}")) {
      statements.push(this.parseStatement());
    }
    return this.builder.block(statements);
  }

  parseStatement() {
    if (this.current() && this.current().value === "{") return this.parseBlock();
    if (this.match("if")) return this.parseIfStatement();
    if (this.match("while")) return this.parseWhileStatement();
    if (this.match("for")) return this.parseForStatement();
    if (this.match("foreach")) return this.parseForeachStatement();
    if (this.match("return")) return this.parseReturnStatement();
    if (this.match("break")) {
      this.expect(";");
      return this.builder.breakStmt();
    }
    if (this.match("continue")) {
      this.expect(";");
      return this.builder.continueStmt();
    }
    if (this.isVariableDeclarationStart()) {
      return this.parseVariableDeclaration(true);
    }
    const expression = this.parseExpression();
    this.expect(";");
    return this.builder.expressionStmt(expression);
  }

  isVariableDeclarationStart() {
    const token = this.current();
    if (!token || !DECLARATION_TYPES.has(token.value)) return false;
    let offset = 1;
    if (this.peek(offset) && this.peek(offset).value === "[") offset += 2;
    return this.peek(offset) && this.peek(offset).type === "Identifier";
  }

  parseVariableDeclaration(consumeSemicolon) {
    const type = this.parseType();
    const name = this.expectIdentifier();
    const init = this.match("=") ? this.parseExpression() : null;
    if (consumeSemicolon) this.expect(";");
    return this.builder.varDecl(name, init, null, {
      kind: "let",
      metadata: { sourceLanguage: "csharp", csharpType: type }
    });
  }

  parseIfStatement() {
    this.expect("(");
    const condition = this.parseExpression();
    this.expect(")");
    const consequent = this.parseStatementAsBlock();
    const alternate = this.match("else") ? this.parseStatementAsBlock() : null;
    return this.builder.ifStmt(condition, consequent, alternate);
  }

  parseStatementAsBlock() {
    const statement = this.parseStatement();
    return statement.kind === "BlockStatement" ? statement : this.builder.block([statement]);
  }

  parseWhileStatement() {
    this.expect("(");
    const condition = this.parseExpression();
    this.expect(")");
    return this.builder.whileStmt(condition, this.parseStatementAsBlock());
  }

  parseForStatement() {
    this.expect("(");
    let init = null;
    if (!this.match(";")) {
      init = this.isVariableDeclarationStart()
        ? this.parseVariableDeclaration(false)
        : this.parseExpression();
      this.expect(";");
    }
    const condition = this.current() && this.current().value !== ";" ? this.parseExpression() : null;
    this.expect(";");
    const update = this.current() && this.current().value !== ")" ? this.parseExpression() : null;
    this.expect(")");
    return this.builder.forStmt(init, condition, update, this.parseStatementAsBlock());
  }

  parseForeachStatement() {
    this.expect("(");
    const itemType = this.parseType();
    const itemName = this.expectIdentifier();
    this.expect("in");
    const iterable = this.parseExpression();
    this.expect(")");
    const userBody = this.parseStatementAsBlock();

    const iterableName = this.createTempName("__cs_foreach_items");
    const indexName = this.createTempName("__cs_foreach_i");
    const iterableId = () => this.builder.identifier(iterableName);
    const indexId = () => this.builder.identifier(indexName);
    const iterableDecl = this.builder.varDecl(iterableName, iterable, null, {
      kind: "let",
      metadata: { sourceLanguage: "csharp", compilerTemporary: true }
    });
    const indexDecl = this.builder.varDecl(indexName, this.builder.literal(0), null, {
      kind: "let",
      metadata: { sourceLanguage: "csharp", compilerTemporary: true }
    });
    const itemDecl = this.builder.varDecl(
      itemName,
      this.csharpBuiltinCall("index", [iterableId(), indexId()]),
      null,
      {
        kind: "let",
        metadata: { sourceLanguage: "csharp", csharpType: itemType }
      }
    );
    const condition = this.builder.binaryOp(
      "<",
      indexId(),
      this.csharpBuiltinCall("len", [iterableId()])
    );
    const update = this.builder.assignment(
      indexId(),
      this.builder.binaryOp("+", indexId(), this.builder.literal(1)),
      "="
    );
    const forBody = this.builder.block([
      itemDecl,
      ...(userBody.statements || [])
    ]);

    return this.builder.block([
      iterableDecl,
      this.builder.forStmt(indexDecl, condition, update, forBody, {
        metadata: { sourceLanguage: "csharp", loweredFrom: "foreach" }
      })
    ]);
  }

  parseReturnStatement() {
    if (this.match(";")) return this.builder.returnStmt(null);
    const value = this.parseExpression();
    this.expect(";");
    return this.builder.returnStmt(value);
  }

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    const left = this.parseBinary(0);
    if (this.current() && ASSIGNMENT_OPERATORS.has(this.current().value)) {
      const operator = this.current().value;
      this.pos += 1;
      const right = this.parseAssignment();
      return this.builder.assignment(left, right, operator);
    }
    return left;
  }

  parseBinary(minPrecedence) {
    let left = this.parseUnary();
    while (this.current() && PRECEDENCE[this.current().value] >= minPrecedence) {
      const operator = this.current().value;
      const precedence = PRECEDENCE[operator];
      this.pos += 1;
      const right = this.parseBinary(precedence + 1);
      left = this.builder.binaryOp(operator, left, right);
    }
    return left;
  }

  parseUnary() {
    if (this.current() && ["!", "-", "+"].includes(this.current().value)) {
      const operator = this.current().value;
      this.pos += 1;
      return this.builder.unaryOp(operator === "!" ? "!" : operator, this.parseUnary(), true);
    }
    if (this.current() && ["++", "--"].includes(this.current().value)) {
      const operator = this.current().value;
      this.pos += 1;
      const argument = this.parsePostfix();
      const delta = this.builder.literal(1);
      const binary = this.builder.binaryOp(operator === "++" ? "+" : "-", argument, delta);
      return this.builder.assignment(argument, binary, "=");
    }
    return this.parsePostfix();
  }

  parsePostfix() {
    let expression = this.parsePrimary();
    while (this.current()) {
      if (this.match(".")) {
        const propertyName = this.expectIdentifier();
        if (propertyName === "Length") {
          expression = this.csharpBuiltinCall("len", [expression]);
          continue;
        }
        const property = this.builder.identifier(propertyName);
        expression = this.builder.member(expression, property, false);
        continue;
      }
      if (this.match("[")) {
        const index = this.parseExpression();
        this.expect("]");
        expression = this.builder.member(expression, index, true, {
          metadata: { zeroBasedIndex: true, sourceLanguage: "csharp" }
        });
        continue;
      }
      if (this.match("(")) {
        const args = [];
        while (this.current() && this.current().value !== ")") {
          args.push(this.parseExpression());
          if (!this.match(",")) break;
        }
        this.expect(")");
        const call = this.normalizeCall(expression, args);
        expression = this.builder.call(call.callee, call.args, call.options || {});
        continue;
      }
      if (this.current().value === "++" || this.current().value === "--") {
        const operator = this.current().value;
        this.pos += 1;
        const delta = this.builder.literal(1);
        const binary = this.builder.binaryOp(operator === "++" ? "+" : "-", expression, delta);
        expression = this.builder.assignment(expression, binary, "=");
        continue;
      }
      break;
    }
    return expression;
  }

  normalizeCall(callee, args) {
    if (this.staticMemberName(callee) === "Console.WriteLine") {
      return {
        callee: this.builder.member(this.builder.identifier("console"), this.builder.identifier("log"), false),
        args: args.length === 1 ? this.flattenConsoleWriteLineArgument(args[0]) : args
      };
    }
    const mathName = this.staticMemberName(callee);
    if (mathName && mathName.startsWith("Math.")) {
      const methodName = mathName.slice("Math.".length);
      if (!MATH_METHOD_MAP.has(methodName)) {
        unsupported(`Math.${methodName}`);
      }
      return {
        callee: this.builder.member(
          this.builder.identifier("math"),
          this.builder.identifier(MATH_METHOD_MAP.get(methodName)),
          false,
          { metadata: { sourceLanguage: "csharp", csharpMathMethod: methodName } }
        ),
        args
      };
    }
    return { callee, args };
  }

  flattenConsoleWriteLineArgument(node) {
    const flattened = [];

    function visit(value) {
      if (value && value.kind === "BinaryExpression" && value.operator === "+") {
        visit(value.left);
        visit(value.right);
      } else {
        flattened.push(value);
      }
    }

    visit(node);
    return flattened.flatMap(value => {
      if (value && value.kind === "Literal" && typeof value.value === "string") {
        return value.value
          .split(/\s+/)
          .filter(Boolean)
          .map(part => this.builder.literal(part));
      }
      return [value];
    });
  }

  staticMemberName(node) {
    if (!node) return null;
    if (node.kind === "Identifier") return node.name;
    if (node.kind === "MemberExpression") {
      const object = this.staticMemberName(node.object);
      const property = this.staticMemberName(node.property);
      return object && property ? `${object}.${property}` : null;
    }
    return null;
  }

  parsePrimary() {
    const token = this.current();
    if (!token) throw new Error("C# parse error: unexpected end of input");

    if (this.match("(")) {
      const expression = this.parseExpression();
      this.expect(")");
      return expression;
    }

    if (this.match("new")) {
      return this.parseNewExpression();
    }

    if (token.type === "Number") {
      this.pos += 1;
      return this.builder.literal(Number(token.value));
    }

    if (token.type === "String") {
      this.pos += 1;
      return this.builder.literal(token.value);
    }

    if (token.type === "InterpolatedString") {
      this.pos += 1;
      return this.parseInterpolatedStringLiteral(token.value);
    }

    if (token.value === "true" || token.value === "false") {
      this.pos += 1;
      return this.builder.literal(token.value === "true");
    }

    if (token.value === "null") {
      this.pos += 1;
      return this.builder.literal(null);
    }

    if (["Identifier", "Keyword"].includes(token.type)) {
      this.pos += 1;
      return this.builder.identifier(token.value);
    }

    throw new Error(`C# parse error: unexpected token ${token.value}`);
  }

  parseNewExpression() {
    this.parseType();
    if (this.match("[")) this.expect("]");
    this.expect("{");
    const elements = [];
    while (this.current() && this.current().value !== "}") {
      elements.push(this.parseExpression());
      if (!this.match(",")) break;
    }
    this.expect("}");
    return this.builder.arrayLiteral(elements);
  }

  parseInterpolatedStringLiteral(value) {
    const parts = [];
    let text = "";
    for (let i = 0; i < value.length; i++) {
      const char = value[i];
      const next = value[i + 1];
      if (char === "{" && next === "{") {
        text += "{";
        i += 1;
        continue;
      }
      if (char === "}" && next === "}") {
        text += "}";
        i += 1;
        continue;
      }
      if (char === "{") {
        if (text) {
          parts.push(this.builder.literal(text));
          text = "";
        }
        let expressionText = "";
        i += 1;
        while (i < value.length && value[i] !== "}") {
          expressionText += value[i];
          i += 1;
        }
        if (i >= value.length || value[i] !== "}") {
          unsupported("unterminated string interpolation expression");
        }
        if (expressionText.includes(":")) {
          unsupported("formatted string interpolation expressions");
        }
        parts.push(this.parseEmbeddedExpression(expressionText.trim(), "string interpolation"));
        continue;
      }
      if (char === "}") {
        unsupported("unescaped } in interpolated strings");
      }
      text += char;
    }
    if (text) parts.push(this.builder.literal(text));
    if (parts.length === 0) return this.builder.literal("");
    return parts.reduce((left, right) => this.builder.binaryOp("+", left, right));
  }

  parseEmbeddedExpression(source, context) {
    if (!source) unsupported(`empty ${context} expression`);
    const savedTokens = this.tokens;
    const savedPos = this.pos;
    try {
      this.tokens = tokenize(source);
      this.pos = 0;
      const expression = this.parseExpression();
      if (!this.atEnd()) unsupported(`complex ${context} expressions`);
      return expression;
    } finally {
      this.tokens = savedTokens;
      this.pos = savedPos;
    }
  }

  csharpBuiltinCall(name, args) {
    return this.builder.call(this.builder.identifier(`__cs_${name}`), args, {
      metadata: { sourceLanguage: "csharp", csharpBuiltin: name }
    });
  }

  createTempName(prefix) {
    const name = `${prefix}_${this.tempCounter}`;
    this.tempCounter += 1;
    return name;
  }

}

module.exports = {
  CSharpToIRCompiler,
  tokenizeCSharp: tokenize
};

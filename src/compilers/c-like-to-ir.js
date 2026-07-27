"use strict";

/**
 * Small executable C/C++ to canonical IR compiler.
 *
 * This is intentionally a slice compiler, not a broad C-family frontend.
 * It supports simple functions, locals, numeric arrays, control flow,
 * printf/puts or cout output, and common math calls. Unsupported C-family
 * features fail before emission so the language-completion harness cannot
 * mistake parser awareness for implementation.
 */

const { IRBuilder } = require("../ir/builder");

const COMMON_TYPES = new Set([
  "auto", "bool", "char", "double", "float", "int", "long", "short",
  "size_t", "string", "void"
]);
const KEYWORDS = new Set([
  ...COMMON_TYPES,
  "break", "class", "const", "continue", "else", "false", "for", "if",
  "include", "namespace", "private", "protected", "public", "return",
  "static", "struct", "true", "using", "while", "NULL", "nullptr", "sizeof"
]);
const TYPE_QUALIFIERS = new Set(["const", "static"]);
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
  ["abs", "abs"],
  ["fabs", "abs"],
  ["ceil", "ceil"],
  ["floor", "floor"],
  ["fmax", "max"],
  ["fmin", "min"],
  ["max", "max"],
  ["min", "min"],
  ["pow", "pow"],
  ["sqrt", "sqrt"]
]);

function unsupported(languageLabel, feature) {
  throw new Error(`Unsupported ${languageLabel} input feature: ${feature}`);
}

function tokenizeCLike(source, languageLabel) {
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

    if (char === "#") {
      while (index < source.length && source[index] !== "\n") advance();
      continue;
    }

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

    if (char === "\"" || char === "'") {
      const quote = char;
      advance();
      let value = "";
      while (index < source.length && source[index] !== quote) {
        if (source[index] === "\\") {
          advance();
          const escaped = source[index];
          const escapeMap = { n: "\n", r: "\r", t: "\t", "\"": "\"", "'": "'", "\\": "\\" };
          value += Object.prototype.hasOwnProperty.call(escapeMap, escaped) ? escapeMap[escaped] : escaped;
          advance();
        } else {
          value += source[index];
          advance();
        }
      }
      if (source[index] !== quote) unsupported(languageLabel, "unterminated strings");
      advance();
      tokens.push({ type: quote === "\"" ? "String" : "Char", value, ...start });
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
    if (["++", "--", "+=", "-=", "*=", "/=", "%=", "<=", ">=", "==", "!=", "&&", "||", "<<", "::", "->"].includes(two)) {
      tokens.push({ type: "Operator", value: two, ...start });
      advance(2);
      continue;
    }

    if ("{}()[];,.:+-*/%<>=!&".includes(char)) {
      tokens.push({ type: "{}()[];,.:".includes(char) ? "Punctuator" : "Operator", value: char, ...start });
      advance();
      continue;
    }

    unsupported(languageLabel, `token ${JSON.stringify(char)}`);
  }

  return tokens;
}

class CLikeToIRCompiler {
  constructor(options = {}) {
    this.language = options.language || "c";
    this.languageLabel = options.languageLabel || "C";
    this.builder = new IRBuilder();
    this.tokens = [];
    this.pos = 0;
    this.recordTypes = new Map();
    this.typeScopes = [];
    this.thisAlias = null;
  }

  compile(source) {
    this.validateSource(source);
    this.builder = new IRBuilder();
    this.tokens = tokenizeCLike(source, this.languageLabel);
    this.pos = 0;
    this.recordTypes = new Map();
    this.typeScopes = [];
    this.thisAlias = null;
    const body = this.parseCompilationUnit();
    const program = this.builder.program(body);
    program.metadata = {
      sourceLanguage: this.language,
      cLikeRecordTypes: Array.from(this.recordTypes.values())
    };
    return program;
  }

  validateSource(source) {
    const commonChecks = [
      [/\bswitch\s*\(/, "switch statements"],
      [/\bgoto\b/, "goto"],
      [/\bdo\s*\{/, "do/while"],
      [/\bunion\b/, "unions"],
      [/\benum\b/, "enums"],
      [/\btypedef\b/, "typedefs"],
      [/\bmalloc\b|\bfree\b/, "manual memory management"],
      [/\b(?:int|double|float|long|short|void)\s*\*/, "pointer declarations"],
      [/^\s*#\s*define\b/m, "preprocessor macros"]
    ];
    const cppChecks = [
      [/\btemplate\s*</, "templates"],
      [/\btry\b|\bcatch\b|\bthrow\b/, "exceptions"],
      [/\bnew\b|\bdelete\b/, "manual object allocation"],
      [/\bstd\s*::\s*vector\b/, "std::vector"],
      [/\[[^\]]*\]\s*\(/, "lambdas"]
    ];

    for (const [pattern, feature] of commonChecks) {
      if (pattern.test(source)) unsupported(this.languageLabel, feature);
    }
    if (/->/.test(source.replace(/\bthis\s*->/g, ""))) {
      unsupported(this.languageLabel, "pointer member access");
    }
    if (this.language === "cpp") {
      for (const [pattern, feature] of cppChecks) {
        if (pattern.test(source)) unsupported(this.languageLabel, feature);
      }
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
      throw new Error(`${this.languageLabel} parse error: expected ${value}, got ${token ? token.value : "end of input"}`);
    }
  }

  expectIdentifier() {
    const token = this.current();
    if (!token || !["Identifier", "Keyword"].includes(token.type)) {
      throw new Error(`${this.languageLabel} parse error: expected identifier, got ${token ? token.value : "end of input"}`);
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
      if (this.isRecordDeclarationStart()) {
        functions.push(...this.parseRecordDeclaration());
        continue;
      }
      if (this.isFunctionStart()) {
        const method = this.parseFunction();
        if (method.name === "main") {
          mainStatements.push(...method.body.statements);
        } else {
          functions.push(this.builder.functionDecl(method.name, method.parameters, method.body, null, {
            metadata: {
              sourceLanguage: this.language,
              [`${this.language}ReturnType`]: method.returnType
            }
          }));
        }
        continue;
      }
      this.pos += 1;
    }

    return [...functions, ...mainStatements];
  }

  isFunctionStart() {
    const savedPos = this.pos;
    try {
      this.parseType();
      const name = this.current();
      const next = this.peek();
      return Boolean(name && ["Identifier", "Keyword"].includes(name.type) && next && next.value === "(");
    } catch {
      return false;
    } finally {
      this.pos = savedPos;
    }
  }

  parseFunction() {
    const returnType = this.parseType();
    const name = this.expectIdentifier();
    this.expect("(");
    this.pushTypeScope();
    const parameters = this.parseParameters();
    this.expect(")");
    const body = this.parseBlock();
    this.popTypeScope();
    return { name, returnType, parameters, body };
  }

  parseParameters() {
    const parameters = [];
    while (this.current() && this.current().value !== ")") {
      if (this.current().value === "void" && this.peek() && this.peek().value === ")") {
        this.pos += 1;
        break;
      }
      const type = this.parseType();
      const name = this.expectIdentifier();
      const parameterType = this.parseArrayDeclaratorSuffix(type);
      parameters.push(this.builder.parameter(name, null, null, {
        metadata: {
          sourceLanguage: this.language,
          [`${this.language}Type`]: parameterType
        }
      }));
      this.setVarType(name, parameterType);
      if (!this.match(",")) break;
    }
    return parameters;
  }

  parseType() {
    while (this.current() && TYPE_QUALIFIERS.has(this.current().value)) this.pos += 1;
    const token = this.current();
    if (token && token.value === "struct") {
      this.pos += 1;
      const recordName = this.expectIdentifier();
      if (!this.recordTypes.has(recordName)) {
        unsupported(this.languageLabel, `unknown struct type ${recordName}`);
      }
      if (this.match("*")) unsupported(this.languageLabel, "pointer declarations");
      return recordName;
    }
    if (!token || !this.isTypeToken(token)) {
      throw new Error(`${this.languageLabel} parse error: expected type, got ${token ? token.value : "end of input"}`);
    }

    let typeName = token.value;
    this.pos += 1;
    if (typeName === "std" && this.match("::")) {
      typeName = `std::${this.expectIdentifier()}`;
    }
    if (typeName === "string" && this.language === "cpp") {
      typeName = "std::string";
    }
    if (this.match("*")) {
      if (typeName !== "char") unsupported(this.languageLabel, "pointer declarations");
      typeName += "*";
    }
    return typeName;
  }

  isTypeToken(token) {
    if (!token) return false;
    if (COMMON_TYPES.has(token.value)) return true;
    if (this.recordTypes.has(token.value)) return true;
    return this.language === "cpp" && token.value === "std";
  }

  isRecordDeclarationStart() {
    if (!this.current()) return false;
    if (this.language === "cpp" && this.current().value === "class") return true;
    return Boolean(
      this.current().value === "struct" &&
      this.peek() &&
      ["Identifier", "Keyword"].includes(this.peek().type) &&
      this.peek(2) &&
      this.peek(2).value === "{"
    );
  }

  parseRecordDeclaration() {
    const recordKind = this.match("struct") ? "struct" : "class";
    if (recordKind === "class") this.expect("class");
    if (recordKind === "class" && this.language !== "cpp") {
      unsupported(this.languageLabel, "classes");
    }
    const name = this.expectIdentifier();
    this.expect("{");
    const fields = [];
    const functions = [];
    let access = recordKind === "struct" ? "public" : "private";

    while (this.current() && this.current().value !== "}") {
      if (this.language === "cpp" && ["public", "private", "protected"].includes(this.current().value)) {
        access = this.current().value;
        this.pos += 1;
        this.expect(":");
        continue;
      }
      if (access !== "public") {
        unsupported(this.languageLabel, "non-public class fields");
      }

      if (this.language === "cpp" && recordKind === "class" && this.isConstructorStart(name)) {
        functions.push(this.parseConstructorFunction(name, fields));
        continue;
      }

      const type = this.parseType();
      const fieldName = this.expectIdentifier();
      if (this.current() && this.current().value === "(") {
        if (this.language === "cpp" && recordKind === "class") {
          functions.push(this.parseMethodFunction(name, type, fieldName));
          continue;
        }
        unsupported(this.languageLabel, "struct methods");
      }
      const fieldType = this.parseArrayDeclaratorSuffix(type);
      if (fieldType.endsWith("[]")) {
        unsupported(this.languageLabel, `${recordKind} array fields`);
      }
      this.expect(";");
      fields.push({ name: fieldName, type: fieldType });
    }

    this.expect("}");
    this.expect(";");
    if (fields.length === 0) unsupported(this.languageLabel, `${recordKind} without fields`);
    this.recordTypes.set(name, {
      name,
      kind: recordKind,
      sourceLanguage: this.language,
      fields,
      methods: functions.map(fn => fn.name)
    });
    return functions;
  }

  isConstructorStart(recordName) {
    return Boolean(
      this.current() &&
      this.current().value === recordName &&
      this.peek() &&
      this.peek().value === "("
    );
  }

  parseConstructorFunction(recordName, fields) {
    this.expect(recordName);
    this.expect("(");
    this.pushTypeScope();
    const parameters = this.parseParameters();
    this.expect(")");
    const body = this.parseBlock();
    this.popTypeScope();

    const initialized = this.constructorPropertiesFromBody(recordName, fields, body);
    return this.builder.functionDecl(`${recordName}__new`, parameters, this.builder.block([
      this.builder.returnStmt(this.builder.objectLiteral(initialized, {
        metadata: {
          sourceLanguage: this.language,
          cLikeRecordType: recordName
        }
      }))
    ]), null, {
      metadata: {
        sourceLanguage: this.language,
        [`${this.language}ReturnType`]: recordName,
        cLikeRecordConstructor: true
      }
    });
  }

  parseMethodFunction(recordName, returnType, methodName) {
    this.expect("(");
    this.pushTypeScope();
    const selfParameter = this.builder.parameter("self", null, null, {
      metadata: {
        sourceLanguage: this.language,
        [`${this.language}Type`]: recordName
      }
    });
    this.setVarType("self", recordName);
    const parameters = [selfParameter, ...this.parseParameters()];
    this.expect(")");
    if (this.match(";")) {
      unsupported(this.languageLabel, "class method declarations without bodies");
    }
    const previousThisAlias = this.thisAlias;
    this.thisAlias = "self";
    const body = this.parseBlock();
    this.thisAlias = previousThisAlias;
    this.popTypeScope();

    return this.builder.functionDecl(`${recordName}__${methodName}`, parameters, body, null, {
      metadata: {
        sourceLanguage: this.language,
        [`${this.language}ReturnType`]: returnType,
        cLikeRecordMethod: `${recordName}.${methodName}`
      }
    });
  }

  constructorPropertiesFromBody(recordName, fields, body) {
    const valuesByName = new Map();
    for (const statement of body.statements || []) {
      const expression = this.expressionFromStatement(statement);
      if (!expression || !this.isKind(expression, "AssignmentExpression")) {
        unsupported(this.languageLabel, "constructor statements other than field assignment");
      }
      if (expression.operator !== "=") {
        unsupported(this.languageLabel, "constructor compound assignments");
      }
      const fieldName = this.constructorFieldName(recordName, expression.left);
      if (!fields.some(field => field.name === fieldName)) {
        unsupported(this.languageLabel, `constructor assignment to unknown field ${fieldName}`);
      }
      valuesByName.set(fieldName, expression.right);
    }

    return fields.map(field => {
      const value = valuesByName.has(field.name)
        ? valuesByName.get(field.name)
        : this.defaultLiteralForType(field.type);
      return this.builder.property(this.builder.identifier(field.name), value);
    });
  }

  expressionFromStatement(statement) {
    if (!statement) return null;
    return statement.expression || null;
  }

  constructorFieldName(recordName, node) {
    if (
      node &&
      this.isKind(node, "MemberExpression") &&
      node.object &&
      this.isKind(node.object, "Identifier") &&
      node.object.name === "this" &&
      node.property &&
      this.isKind(node.property, "Identifier")
    ) {
      return node.property.name;
    }
    unsupported(this.languageLabel, `constructor assignments must target this.<field> for ${recordName}`);
  }

  defaultLiteralForType(typeName) {
    if (["char*", "const char*", "std::string", "string"].includes(typeName)) {
      return this.builder.literal("");
    }
    if (typeName === "bool") {
      return this.builder.literal(false);
    }
    return this.builder.literal(0);
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
    if (this.language === "cpp" && this.isCoutStart()) return this.parseCoutStatement();
    if (this.match("if")) return this.parseIfStatement();
    if (this.match("while")) return this.parseWhileStatement();
    if (this.match("for")) return this.parseForStatement();
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
    const savedPos = this.pos;
    try {
      this.parseType();
      const token = this.current();
      return Boolean(token && ["Identifier", "Keyword"].includes(token.type));
    } catch {
      return false;
    } finally {
      this.pos = savedPos;
    }
  }

  parseVariableDeclaration(consumeSemicolon) {
    let type = this.parseType();
    const name = this.expectIdentifier();
    type = this.parseArrayDeclaratorSuffix(type);
    const init = this.match("=")
      ? (this.current() && this.current().value === "{"
        ? (this.isRecordType(type) ? this.parseRecordInitializer(type) : this.parseBraceArrayLiteral())
        : this.parseExpression())
      : null;
    if (this.isRecordType(type) && !init) {
      unsupported(this.languageLabel, "record declarations require explicit initializer");
    }
    if (consumeSemicolon) this.expect(";");
    this.setVarType(name, type);
    return this.builder.varDecl(name, init, null, {
      kind: "let",
      metadata: {
        sourceLanguage: this.language,
        [`${this.language}Type`]: type
      }
    });
  }

  parseBraceArrayLiteral() {
    this.expect("{");
    const elements = [];
    while (this.current() && this.current().value !== "}") {
      elements.push(this.parseExpression());
      if (!this.match(",")) break;
    }
    this.expect("}");
    return this.builder.arrayLiteral(elements);
  }

  parseRecordInitializer(typeName) {
    const record = this.recordTypes.get(typeName);
    if (!record) unsupported(this.languageLabel, `unknown record initializer ${typeName}`);
    this.expect("{");
    const properties = [];
    for (let index = 0; this.current() && this.current().value !== "}"; index++) {
      const field = record.fields[index];
      if (!field) unsupported(this.languageLabel, `too many initializer values for ${typeName}`);
      const value = this.parseExpression();
      properties.push(this.builder.property(this.builder.identifier(field.name), value));
      if (!this.match(",")) break;
    }
    this.expect("}");
    if (properties.length !== record.fields.length) {
      unsupported(this.languageLabel, `partial initializer for ${typeName}`);
    }
    return this.builder.objectLiteral(properties, {
      metadata: {
        sourceLanguage: this.language,
        cLikeRecordType: typeName
      }
    });
  }

  parseArrayDeclaratorSuffix(type) {
    if (!this.match("[")) return type;
    if (this.current() && this.current().value !== "]") this.parseExpression();
    this.expect("]");
    return `${type}[]`;
  }

  isRecordType(typeName) {
    return this.recordTypes.has(typeName);
  }

  isKind(node, kind) {
    return Boolean(node && (node.kind === kind || node.type === kind));
  }

  pushTypeScope() {
    this.typeScopes.push(new Map());
  }

  popTypeScope() {
    this.typeScopes.pop();
  }

  setVarType(name, type) {
    if (this.typeScopes.length === 0) this.pushTypeScope();
    this.typeScopes[this.typeScopes.length - 1].set(name, type);
  }

  lookupVarType(name) {
    for (let index = this.typeScopes.length - 1; index >= 0; index--) {
      if (this.typeScopes[index].has(name)) return this.typeScopes[index].get(name);
    }
    return null;
  }

  expressionRecordType(node) {
    if (!node) return null;
    if (this.isKind(node, "Identifier")) return this.lookupVarType(node.name);
    if (this.isKind(node, "CallExpression") && node.metadata && node.metadata.cLikeRecordConstructor) {
      return node.metadata.cLikeRecordType || null;
    }
    return null;
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

  parseReturnStatement() {
    if (this.match(";")) return this.builder.returnStmt(null);
    const value = this.parseExpression();
    this.expect(";");
    return this.builder.returnStmt(value);
  }

  parseCoutStatement() {
    this.consumeCoutStart();
    const args = [];
    while (this.match("<<")) {
      if (this.isEndlStart()) {
        this.consumeQualifiedName();
        continue;
      }
      this.appendPrintArgs(args, this.parseExpression());
    }
    this.expect(";");
    return this.builder.expressionStmt(this.builder.call(
      this.builder.member(this.builder.identifier("console"), this.builder.identifier("log"), false),
      args
    ));
  }

  isCoutStart() {
    return (this.current() && this.current().value === "cout") ||
      (this.current() && this.current().value === "std" && this.peek() && this.peek().value === "::" &&
        this.peek(2) && this.peek(2).value === "cout");
  }

  consumeCoutStart() {
    if (this.match("std")) this.expect("::");
    this.expect("cout");
  }

  isEndlStart() {
    return (this.current() && this.current().value === "endl") ||
      (this.current() && this.current().value === "std" && this.peek() && this.peek().value === "::" &&
        this.peek(2) && this.peek(2).value === "endl");
  }

  consumeQualifiedName() {
    const first = this.expectIdentifier();
    if (this.match("::")) return `${first}::${this.expectIdentifier()}`;
    return first;
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
      return this.builder.unaryOp(operator, this.parseUnary(), true);
    }
    if (this.current() && ["++", "--"].includes(this.current().value)) {
      const operator = this.current().value;
      this.pos += 1;
      const argument = this.parsePostfix();
      return this.builder.assignment(
        argument,
        this.builder.binaryOp(operator === "++" ? "+" : "-", argument, this.builder.literal(1)),
        "="
      );
    }
    return this.parsePostfix();
  }

  parsePostfix() {
    let expression = this.parsePrimary();
    while (this.current()) {
      if (this.match(".") || this.match("::") || this.match("->")) {
        const propertyName = this.expectIdentifier();
        const property = this.builder.identifier(propertyName);
        expression = this.builder.member(expression, property, false);
        continue;
      }
      if (this.match("[")) {
        const index = this.parseExpression();
        this.expect("]");
        expression = this.builder.member(expression, index, true, {
          metadata: { zeroBasedIndex: true, sourceLanguage: this.language }
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
        expression = call.expression || this.builder.call(call.callee, call.args, call.options || {});
        continue;
      }
      if (this.current().value === "++" || this.current().value === "--") {
        const operator = this.current().value;
        this.pos += 1;
        expression = this.builder.assignment(
          expression,
          this.builder.binaryOp(operator === "++" ? "+" : "-", expression, this.builder.literal(1)),
          "="
        );
        continue;
      }
      break;
    }
    return expression;
  }

  parsePrimary() {
    const token = this.current();
    if (!token) throw new Error(`${this.languageLabel} parse error: unexpected end of input`);

    if (this.match("(")) {
      const expression = this.parseExpression();
      this.expect(")");
      return expression;
    }

    if (token.type === "Number") {
      this.pos += 1;
      return this.builder.literal(Number(token.value));
    }

    if (token.type === "String" || token.type === "Char") {
      this.pos += 1;
      return this.builder.literal(token.value, null, token.type === "Char"
        ? { metadata: { sourceLanguage: this.language, cLikeChar: true } }
        : {});
    }

    if (this.match("sizeof")) {
      return this.parseSizeofExpression();
    }

    if (token.value === "true" || token.value === "false") {
      this.pos += 1;
      return this.builder.literal(token.value === "true");
    }

    if (token.value === "NULL" || token.value === "nullptr") {
      this.pos += 1;
      return this.builder.literal(null);
    }

    if (["Identifier", "Keyword"].includes(token.type)) {
      this.pos += 1;
      const name = token.value === "this" && this.thisAlias ? this.thisAlias : token.value;
      return this.builder.identifier(name);
    }

    throw new Error(`${this.languageLabel} parse error: unexpected token ${token.value}`);
  }

  normalizeCall(callee, args) {
    const name = this.staticMemberName(callee);
    if (this.language === "cpp" && callee && this.isKind(callee, "Identifier") && this.recordTypes.has(callee.name)) {
      const record = this.recordTypes.get(callee.name);
      const constructorName = `${callee.name}__new`;
      if (!record.methods || !record.methods.includes(constructorName)) {
        unsupported(this.languageLabel, `constructor for ${callee.name}`);
      }
      return {
        callee: this.builder.identifier(constructorName),
        args,
        options: {
          metadata: {
            sourceLanguage: this.language,
            cLikeRecordConstructor: true,
            cLikeRecordType: callee.name
          }
        }
      };
    }

    if (this.language === "cpp" && callee && this.isKind(callee, "MemberExpression") && !callee.computed) {
      const objectType = this.expressionRecordType(callee.object);
      const methodName = callee.property && callee.property.name;
      const functionName = objectType && methodName ? `${objectType}__${methodName}` : null;
      const record = objectType ? this.recordTypes.get(objectType) : null;
      if (functionName && record && (record.methods || []).includes(functionName)) {
        return {
          callee: this.builder.identifier(functionName),
          args: [callee.object, ...args],
          options: {
            metadata: {
              sourceLanguage: this.language,
              cLikeRecordMethodCall: `${objectType}.${methodName}`
            }
          }
        };
      }
    }

    if (name === "printf") {
      return {
        callee: this.builder.member(this.builder.identifier("console"), this.builder.identifier("log"), false),
        args: this.flattenPrintfArgs(args)
      };
    }
    if (name === "puts") {
      return {
        callee: this.builder.member(this.builder.identifier("console"), this.builder.identifier("log"), false),
        args
      };
    }

    if (name === "strlen") {
      return {
        callee: this.builder.identifier("__clike_len"),
        args,
        options: { metadata: { sourceLanguage: this.language, cLikeBuiltin: "len" } }
      };
    }

    if (name && name.endsWith(".size") && callee.kind === "MemberExpression") {
      return {
        callee: this.builder.identifier("__clike_len"),
        args: [callee.object],
        options: { metadata: { sourceLanguage: this.language, cLikeBuiltin: "len" } }
      };
    }

    const simpleName = name && name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : name;
    if (simpleName && MATH_METHOD_MAP.has(simpleName)) {
      return {
        callee: this.builder.member(
          this.builder.identifier("math"),
          this.builder.identifier(MATH_METHOD_MAP.get(simpleName)),
          false,
          { metadata: { sourceLanguage: this.language, cLikeMathMethod: simpleName } }
        ),
        args
      };
    }

    return { callee, args };
  }

  parseSizeofExpression() {
    this.expect("(");
    const expression = this.parseExpression();
    this.expect(")");
    if (expression.kind === "MemberExpression" && expression.computed) {
      return this.builder.literal(1);
    }
    return this.builder.call(this.builder.identifier("__clike_len"), [expression], {
      metadata: { sourceLanguage: this.language, cLikeBuiltin: "len" }
    });
  }

  flattenPrintfArgs(args) {
    if (args.length === 0 || args[0].kind !== "Literal" || typeof args[0].value !== "string") {
      unsupported(this.languageLabel, "printf without a literal format string");
    }
    const flattened = [];
    const format = args[0].value.replace(/\r?\n$/, "");
    const parts = format.split(/%[-+0-9.]*[diufsgG]/);
    const specCount = parts.length - 1;
    for (let i = 0; i < parts.length; i++) {
      this.appendTextParts(flattened, parts[i]);
      if (i < specCount) {
        if (!args[i + 1]) unsupported(this.languageLabel, "printf argument count mismatch");
        flattened.push(args[i + 1]);
      }
    }
    return flattened;
  }

  appendPrintArgs(args, node) {
    if (node && node.kind === "Literal" && typeof node.value === "string") {
      this.appendTextParts(args, node.value);
      return;
    }
    args.push(node);
  }

  appendTextParts(args, text) {
    for (const part of text.split(/\s+/).filter(Boolean)) {
      args.push(this.builder.literal(part));
    }
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
}

class CToIRCompiler extends CLikeToIRCompiler {
  constructor(options = {}) {
    super({ ...options, language: "c", languageLabel: "C" });
  }
}

class CppToIRCompiler extends CLikeToIRCompiler {
  constructor(options = {}) {
    super({ ...options, language: "cpp", languageLabel: "C++" });
  }
}

module.exports = {
  CLikeToIRCompiler,
  CToIRCompiler,
  CppToIRCompiler,
  tokenizeCLike
};

/**
 * Base Emitter - Intelligent chunking for all language families
 * Provides common emission patterns reusable across all target languages
 */

class BaseEmitter {
  constructor() {
    this.indent = 0;
    this.indentString = "";
    this.indentSize = 4;
    this.lineEnding = "\n";
  }

  // === Indentation Management ===

  setIndentSize(size) {
    this.indentSize = size;
  }

  getIndent(_context = {}) {
    return " ".repeat(this.indent * this.indentSize);
  }

  increaseIndent() {
    this.indent++;
  }

  decreaseIndent() {
    if (this.indent > 0) this.indent--;
  }

  withIndent(fn) {
    this.increaseIndent();
    const result = fn();
    this.decreaseIndent();
    return result;
  }

  // === Output Formatting ===

  emit(code) {
    return code;
  }

  emitLine(code) {
    return this.getIndent() + code + this.lineEnding;
  }

  emitBlock(code, _braceStyle = "same-line") {
    // different languages have different brace styles
    return code;
  }

  // === Common Expression Emission ===

  emitExpression(node) {
    if (!node) return "";

    const dispatch = {
      "Identifier": () => node.name,
      "Literal": () => this.emitLiteral(node),
      "BinaryExpression": () => this.emitBinaryExpression(node),
      "LogicalExpression": () => this.emitLogicalExpression(node),
      "UnaryExpression": () => this.emitUnaryExpression(node),
      "UpdateExpression": () => this.emitUpdateExpression(node),
      "AssignmentExpression": () => this.emitAssignmentExpression(node),
      "CallExpression": () => this.emitCallExpression(node),
      "MemberExpression": () => this.emitMemberExpression(node),
      "ArrayExpression": () => this.emitArrayExpression(node),
      "ObjectExpression": () => this.emitObjectExpression(node),
      "ConditionalExpression": () => this.emitConditionalExpression(node),
      "ThisExpression": () => this.emitThisExpression(node),
      "NewExpression": () => this.emitNewExpression(node),
      "FunctionExpression": () => this.emitFunctionExpression(node),
      "ArrowFunctionExpression": () => this.emitArrowFunctionExpression(node),
      "SequenceExpression": () => this.emitSequenceExpression(node)
    };

    return (dispatch[node.type] || (() => ""))();
  }

  emitLiteral(node) {
    if (typeof node.value === "string") {
      return `"${node.value.replace(/"/g, "\\\"")}"`;
    }
    if (typeof node.value === "boolean") {
      return node.value ? "true" : "false";
    }
    if (node.value === null) {
      return "null";
    }
    return String(node.value);
  }

  emitBinaryExpression(node) {
    const left = this.emitExpression(node.left);
    const right = this.emitExpression(node.right);
    return `${left} ${node.operator} ${right}`;
  }

  emitLogicalExpression(node) {
    const left = this.emitExpression(node.left);
    const right = this.emitExpression(node.right);
    return `${left} ${node.operator} ${right}`;
  }

  emitUnaryExpression(node) {
    const arg = this.emitExpression(node.argument);
    return node.prefix ? `${node.operator}${arg}` : `${arg}${node.operator}`;
  }

  emitUpdateExpression(node) {
    const arg = this.emitExpression(node.argument);
    return node.prefix ? `${node.operator}${arg}` : `${arg}${node.operator}`;
  }

  emitAssignmentExpression(node) {
    const left = this.emitExpression(node.left);
    const right = this.emitExpression(node.right);
    return `${left} ${node.operator} ${right}`;
  }

  emitCallExpression(node) {
    const callee = this.emitExpression(node.callee);
    const args = node.arguments.map(arg => this.emitExpression(arg)).join(", ");
    return `${callee}(${args})`;
  }

  emitMemberExpression(node) {
    const obj = this.emitExpression(node.object);
    if (node.computed) {
      const prop = this.emitExpression(node.property);
      return `${obj}[${prop}]`;
    } else {
      return `${obj}.${node.property.name || node.property}`;
    }
  }

  emitArrayExpression(node) {
    const elements = node.elements.map(el => this.emitExpression(el)).join(", ");
    return `[${elements}]`;
  }

  emitObjectExpression(node) {
    const props = node.properties.map(prop => {
      const key = prop.key.name || this.emitExpression(prop.key);
      const value = this.emitExpression(prop.value);
      return `${key}: ${value}`;
    }).join(", ");
    return `{${props}}`;
  }

  emitConditionalExpression(node) {
    const test = this.emitExpression(node.test);
    const consequent = this.emitExpression(node.consequent);
    const alternate = this.emitExpression(node.alternate);
    return `${test} ? ${consequent} : ${alternate}`;
  }

  emitThisExpression() {
    return "this";
  }

  emitNewExpression(node) {
    const callee = this.emitExpression(node.callee);
    const args = node.arguments.map(arg => this.emitExpression(arg)).join(", ");
    return `new ${callee}(${args})`;
  }

  emitFunctionExpression(node) {
    const name = node.id ? node.id.name : "";
    const params = node.params.map(p => p.name).join(", ");
    const body = this.emitStatement(node.body);
    return `function ${name}(${params}) { ${body} }`;
  }

  emitArrowFunctionExpression(node) {
    const params = node.params.map(p => p.name).join(", ");
    const body = this.emitStatement(node.body);
    return `(${params}) => { ${body} }`;
  }

  emitSequenceExpression(node) {
    return node.expressions.map(e => this.emitExpression(e)).join(", ");
  }

  // === Common Statement Emission ===

  emitStatement(node) {
    if (!node) return "";

    const dispatch = {
      "VariableDeclaration": () => this.emitVariableDeclaration(node),
      "FunctionDeclaration": () => this.emitFunctionDeclaration(node),
      "ClassDeclaration": () => this.emitClassDeclaration(node),
      "IfStatement": () => this.emitIfStatement(node),
      "WhileStatement": () => this.emitWhileStatement(node),
      "ForStatement": () => this.emitForStatement(node),
      "ForOfStatement": () => this.emitForOfStatement(node),
      "ForInStatement": () => this.emitForInStatement(node),
      "DoWhileStatement": () => this.emitDoWhileStatement(node),
      "TryStatement": () => this.emitTryStatement(node),
      "ThrowStatement": () => this.emitThrowStatement(node),
      "ReturnStatement": () => this.emitReturnStatement(node),
      "BreakStatement": () => this.emitBreakStatement(node),
      "ContinueStatement": () => this.emitContinueStatement(node),
      "BlockStatement": () => this.emitBlockStatement(node),
      "ExpressionStatement": () => this.emitExpressionStatement(node),
      "SwitchStatement": () => this.emitSwitchStatement(node),
      "LabeledStatement": () => this.emitLabeledStatement(node)
    };

    return (dispatch[node.type] || (() => ""))();
  }

  emitVariableDeclaration(_node) {
    return "";  // Override in subclass
  }

  emitFunctionDeclaration(_node) {
    return "";  // Override in subclass
  }

  emitClassDeclaration(_node) {
    return "";  // Override in subclass
  }

  emitIfStatement(_node) {
    return "";  // Override in subclass
  }

  emitWhileStatement(_node) {
    return "";  // Override in subclass
  }

  emitForStatement(_node) {
    return "";  // Override in subclass
  }

  emitForOfStatement(_node) {
    return "";  // Override in subclass
  }

  emitForInStatement(_node) {
    return "";  // Override in subclass
  }

  emitDoWhileStatement(_node) {
    return "";  // Override in subclass
  }

  emitTryStatement(_node) {
    return "";  // Override in subclass
  }

  emitThrowStatement(_node) {
    return "";  // Override in subclass
  }

  emitReturnStatement(node) {
    const arg = node.argument ? this.emitExpression(node.argument) : "";
    return `return ${arg};`;
  }

  emitBreakStatement() {
    return "break;";
  }

  emitContinueStatement() {
    return "continue;";
  }

  emitBlockStatement(_node) {
    return "";  // Override in subclass
  }

  emitExpressionStatement(node) {
    return this.emitExpression(node.expression) + ";";
  }

  emitSwitchStatement(_node) {
    return "";  // Override in subclass
  }

  emitLabeledStatement(_node) {
    return "";  // Override in subclass
  }

  // === Program Emission ===

  emitProgram(node) {
    if (!node.body) return "";
    return node.body.map(stmt => this.emitStatement(stmt)).join(this.lineEnding);
  }
}

module.exports = { BaseEmitter };


/**
 * IR to JavaScript Generator
 * 
 * Converts LUASCRIPT IR to JavaScript code.
 */

const { NodeCategory } = require("../ir/nodes");

class IRToJSGenerator {
  constructor(options = {}) {
    this.options = {
      indent: options.indent || "  ",
      semicolons: options.semicolons !== false,
      ...options
    };
    this.indentLevel = 0;
    this.usedHelpers = new Set();
  }

  /**
     * Generate JavaScript code from IR
     */
  generate(node) {
    this.usedHelpers = new Set();
    const code = this.visit(node);
    const helpers = this.emitHelpers();
    return helpers ? `${helpers}\n${code}` : code;
  }

  /**
     * Visit a node and generate code
     */
  visit(node) {
    if (!node || !node.kind) {
      return "";
    }

    const methodName = `visit${node.kind}`;
    if (typeof this[methodName] === "function") {
      return this[methodName](node);
    }

    throw new Error(`Unsupported JavaScript output IR node kind: ${node.kind}`);
  }

  // ========== PROGRAM & DECLARATIONS ==========

  visitProgram(node) {
    return node.body.map(stmt => this.visit(stmt)).join("\n");
  }

  visitFunctionDecl(node) {
    const name = node.name || "";
    const params = node.parameters.map(p => this.visitParameter(p)).join(", ");
    const body = this.visit(node.body);
        
    if (node.name) {
      return `function ${name}(${params}) ${body}`;
    } else {
      // Anonymous function (expression)
      return `function(${params}) ${body}`;
    }
  }

  visitFunctionDeclaration(node) {
    return this.visitFunctionDecl(node);
  }

  visitVarDecl(node) {
    const kind = node.varKind || "let";
    const init = node.init ? ` = ${this.visit(node.init)}` : "";
    const semi = this.options.semicolons ? ";" : "";
        
    return `${this.indent()}${kind} ${node.name}${init}${semi}`;
  }

  visitVariableDeclarator(node) {
    return this.visitVarDecl(node);
  }

  visitParameter(node) {
    if (node.defaultValue) {
      return `${node.name} = ${this.visit(node.defaultValue)}`;
    }
    return node.name;
  }

  // ========== STATEMENTS ==========

  visitBlock(node) {
    this.indentLevel++;
    const statements = node.statements.map(stmt => this.visit(stmt)).join("\n");
    this.indentLevel--;
        
    return `{\n${statements}\n${this.indent()}}`;
  }

  visitBlockStatement(node) {
    return this.visitBlock(node);
  }

  visitReturn(node) {
    const semi = this.options.semicolons ? ";" : "";
        
    if (node.value) {
      return `${this.indent()}return ${this.visit(node.value)}${semi}`;
    }
    return `${this.indent()}return${semi}`;
  }

  visitReturnStatement(node) {
    return this.visitReturn(node);
  }

  visitIf(node) {
    const condition = this.visit(node.condition);
    const consequent = this.visit(node.consequent);
        
    let result = `${this.indent()}if (${condition}) ${consequent}`;
        
    if (node.alternate) {
      const alternate = this.visit(node.alternate);
            
      // Check if alternate is another If node (else if)
      if (node.alternate.kind === NodeCategory.IF) {
        result += ` else ${alternate.trim()}`;
      } else {
        result += ` else ${alternate}`;
      }
    }
        
    return result;
  }

  visitIfStatement(node) {
    return this.visitIf(node);
  }

  visitWhile(node) {
    const condition = this.visit(node.condition);
    const body = this.visit(node.body);
        
    return `${this.indent()}while (${condition}) ${body}`;
  }

  visitWhileStatement(node) {
    return this.visitWhile(node);
  }

  visitDoWhile(node) {
    const body = this.visit(node.body);
    const condition = this.visit(node.condition);
    const semi = this.options.semicolons ? ";" : "";
        
    return `${this.indent()}do ${body} while (${condition})${semi}`;
  }

  visitDoWhileStatement(node) {
    return this.visitDoWhile(node);
  }

  visitFor(node) {
    const init = node.init ? this.visit(node.init).trim().replace(/^(let|const|var)\s+/, "$1 ").replace(/;$/, "") : "";
    const condition = node.condition ? this.visit(node.condition) : "";
    const update = node.update ? this.visit(node.update) : "";
    const body = this.visit(node.body);
        
    return `${this.indent()}for (${init}; ${condition}; ${update}) ${body}`;
  }

  visitForStatement(node) {
    return this.visitFor(node);
  }

  visitSwitch(node) {
    const discriminant = this.visit(node.discriminant);
        
    this.indentLevel++;
    const cases = node.cases.map(c => this.visitCase(c)).join("\n");
    this.indentLevel--;
        
    return `${this.indent()}switch (${discriminant}) {\n${cases}\n${this.indent()}}`;
  }

  visitSwitchStatement(node) {
    return this.visitSwitch(node);
  }

  visitCase(node) {
    if (node.test) {
      const test = this.visit(node.test);
      this.indentLevel++;
      const consequent = node.consequent.map(stmt => this.visit(stmt)).join("\n");
      this.indentLevel--;
            
      return `${this.indent()}case ${test}:\n${consequent}`;
    } else {
      // Default case
      this.indentLevel++;
      const consequent = node.consequent.map(stmt => this.visit(stmt)).join("\n");
      this.indentLevel--;
            
      return `${this.indent()}default:\n${consequent}`;
    }
  }

  visitSwitchCase(node) {
    return this.visitCase(node);
  }

  visitBreak(_node) {
    const semi = this.options.semicolons ? ";" : "";
    return `${this.indent()}break${semi}`;
  }

  visitBreakStatement(node) {
    return this.visitBreak(node);
  }

  visitContinue(_node) {
    const semi = this.options.semicolons ? ";" : "";
    return `${this.indent()}continue${semi}`;
  }

  visitContinueStatement(node) {
    return this.visitContinue(node);
  }

  visitExpressionStmt(node) {
    const semi = this.options.semicolons ? ";" : "";
    return `${this.indent()}${this.visit(node.expression)}${semi}`;
  }

  visitExpressionStatement(node) {
    return this.visitExpressionStmt(node);
  }

  // ========== EXPRESSIONS ==========

  visitBinaryOp(node) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    const operator = node.operator === "concat" ? "+" : node.operator;
    return `(${left} ${operator} ${right})`;
  }

  visitBinaryExpression(node) {
    return this.visitBinaryOp(node);
  }

  visitUnaryOp(node) {
    const operand = this.visit(node.operand);
        
    if (node.prefix) {
      return `${node.operator}${operand}`;
    } else {
      return `${operand}${node.operator}`;
    }
  }

  visitUnaryExpression(node) {
    return this.visitUnaryOp(node);
  }

  visitCall(node) {
    const callee = this.visit(node.callee);
    const args = node.args.map(arg => this.visit(arg)).join(", ");

    if (node.metadata && node.metadata.luascriptBuiltin === "many") {
      return `[${args}]`;
    }

    if (node.metadata && (node.metadata.csharpBuiltin === "len" || node.metadata.cLikeBuiltin === "len")) {
      this.usedHelpers.add("__cs_len");
      return `__cs_len(${this.visit(node.args[0])})`;
    }

    if (node.metadata && (node.metadata.csharpBuiltin === "index" || node.metadata.cLikeBuiltin === "index")) {
      this.usedHelpers.add("__cs_index");
      return `__cs_index(${args})`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "len") {
      this.usedHelpers.add("__py_len");
      return `__py_len(${this.visit(node.args[0])})`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "string_upper") {
      return `String(${this.visit(node.args[0])}).toUpperCase()`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "string_lower") {
      return `String(${this.visit(node.args[0])}).toLowerCase()`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "index") {
      this.usedHelpers.add("__py_index");
      return `__py_index(${args})`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "slice") {
      this.usedHelpers.add("__py_slice");
      return `__py_slice(${args})`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "append") {
      this.usedHelpers.add("__py_append");
      return `__py_append(${args})`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "pop") {
      this.usedHelpers.add("__py_pop");
      return `__py_pop(${args})`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "in_value") {
      this.usedHelpers.add("__py_in_value");
      return `__py_in_value(${args})`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "in_key") {
      this.usedHelpers.add("__py_in_key");
      return `__py_in_key(${args})`;
    }

    if (node.metadata && node.metadata.luaBuiltin === "len") {
      this.usedHelpers.add("__lua_len");
      return `__lua_len(${this.visit(node.args[0])})`;
    }
        
    // Check if this is a 'new' expression
    if (node.metadata && node.metadata.isNew) {
      return `new ${callee}(${args})`;
    }
        
    if (callee === "print") {
      return `console.log(${args})`;
    }

    return `${callee}(${args})`;
  }

  visitCallExpression(node) {
    return this.visitCall(node);
  }

  visitMember(node) {
    const object = node.object && node.object.kind === NodeCategory.IDENTIFIER && node.object.name === "math"
      ? "Math"
      : this.visit(node.object);
    const property = this.visitMemberProperty(node.property, node);
        
    if (node.computed) {
      return `${object}[${property}]`;
    } else {
      return `${object}.${property}`;
    }
  }

  visitMemberExpression(node) {
    return this.visitMember(node);
  }

  visitArrayLiteral(node) {
    const elements = node.elements.map(el => el ? this.visit(el) : "").join(", ");
    return `[${elements}]`;
  }

  visitArrayExpression(node) {
    return this.visitArrayLiteral(node);
  }

  visitObjectLiteral(node) {
    if (node.properties.length === 0) {
      return "{}";
    }
        
    this.indentLevel++;
    const properties = node.properties.map(prop => {
      const key = this.visit(prop.key);
      const value = this.visit(prop.value);
      return `${this.indent()}${key}: ${value}`;
    }).join(",\n");
    this.indentLevel--;
        
    return `{\n${properties}\n${this.indent()}}`;
  }

  visitObjectExpression(node) {
    return this.visitObjectLiteral(node);
  }

  visitProperty(node) {
    const key = this.visit(node.key);
    const value = this.visit(node.value);
        
    return `${key}: ${value}`;
  }

  visitIdentifier(node) {
    return node.name;
  }

  visitLiteral(node) {
    if (typeof node.value === "string") {
      return `"${node.value.replace(/"/g, "\\\"")}"`;
    } else if (node.value === null) {
      return "null";
    } else if (node.value === undefined) {
      return "undefined";
    }
    return String(node.value);
  }

  visitAssignment(node) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);
        
    return `${left} ${node.operator} ${right}`;
  }

  visitAssignmentExpression(node) {
    return this.visitAssignment(node);
  }

  visitConditional(node) {
    const condition = this.visit(node.condition);
    const consequent = this.visit(node.consequent);
    const alternate = this.visit(node.alternate);
        
    return `(${condition} ? ${consequent} : ${alternate})`;
  }

  visitConditionalExpression(node) {
    return this.visitConditional(node);
  }

  // ========== HELPERS ==========

  indent() {
    return this.options.indent.repeat(this.indentLevel);
  }

  visitMemberProperty(propertyNode, memberNode) {
    if (
      memberNode.computed &&
      this.options.luaIndexBase === 1 &&
      propertyNode &&
      propertyNode.kind === NodeCategory.LITERAL &&
      typeof propertyNode.value === "number"
    ) {
      return String(propertyNode.value - 1);
    }

    return this.visit(propertyNode);
  }

  emitHelpers() {
    const helpers = [];
    if (this.usedHelpers.has("__cs_len")) {
      helpers.push([
        "function __cs_len(value) {",
        "  if (Array.isArray(value) || typeof value === \"string\") return value.length;",
        "  return 0;",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__cs_index")) {
      helpers.push([
        "function __cs_index(value, key) {",
        "  return value[key];",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_len")) {
      helpers.push([
        "function __py_len(value) {",
        "  if (Array.isArray(value) || typeof value === \"string\") return value.length;",
        "  if (value && typeof value === \"object\") return Object.keys(value).length;",
        "  return 0;",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_index")) {
      helpers.push([
        "function __py_index(value, key) {",
        "  return value[key];",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_slice")) {
      helpers.push([
        "function __py_slice(value, start, end) {",
        "  const from = start === undefined || start === null ? 0 : start;",
        "  if (end === undefined || end === null) return value.slice(from);",
        "  return value.slice(from, end);",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_append")) {
      helpers.push([
        "function __py_append(value, item) {",
        "  value.push(item);",
        "  return null;",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_pop")) {
      helpers.push([
        "function __py_pop(value, index) {",
        "  if (index === undefined || index === null) return value.pop();",
        "  return value.splice(index, 1)[0];",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_in_value")) {
      helpers.push([
        "function __py_in_value(item, value) {",
        "  if (typeof value === \"string\") return value.indexOf(item) !== -1;",
        "  if (Array.isArray(value)) return value.indexOf(item) !== -1;",
        "  if (value && typeof value === \"object\") return Object.values(value).indexOf(item) !== -1;",
        "  return false;",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_in_key")) {
      helpers.push([
        "function __py_in_key(key, value) {",
        "  return !!(value && Object.prototype.hasOwnProperty.call(value, key));",
        "}"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__lua_len")) {
      helpers.push([
        "function __lua_len(value) {",
        "  if (Array.isArray(value) || typeof value === \"string\") return value.length;",
        "  if (value && typeof value === \"object\") return Object.keys(value).length;",
        "  return 0;",
        "}"
      ].join("\n"));
    }
    return helpers.join("\n");
  }
}

module.exports = {
  IRToJSGenerator
};

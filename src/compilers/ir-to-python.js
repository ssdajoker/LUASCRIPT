"use strict";

/**
 * IR to Python Generator
 *
 * Emits executable Python for the canonical IR subset used by the language
 * completion harness.
 */

const { NodeCategory } = require("../ir/nodes");

class IRToPythonGenerator {
  constructor(options = {}) {
    this.options = {
      indent: options.indent || "    ",
      ...options
    };
    this.indentLevel = 0;
    this.usedHelpers = new Set();
    this.luascriptMeta = null;
    this.forUpdateStack = [];
    this.pythonFunctionScopeStack = [];
  }

  generate(node) {
    this.usedHelpers = new Set();
    this.luascriptMeta = node && node.metadata ? node.metadata.luascriptMeta : null;
    this.forUpdateStack = [];
    this.pythonFunctionScopeStack = [];
    const code = this.visit(node);
    const helpers = this.emitHelpers();
    return helpers ? `${helpers}\n${code}` : code;
  }

  visit(node) {
    if (!node || !node.kind) {
      return "";
    }
    const methodName = `visit${node.kind}`;
    if (typeof this[methodName] === "function") {
      return this[methodName](node);
    }
    throw new Error(`Unsupported IR node kind for Python emission: ${node.kind}`);
  }

  visitProgram(node) {
    return node.body.map(stmt => this.visit(stmt)).filter(Boolean).join("\n");
  }

  visitFunctionDecl(node) {
    const params = node.parameters.map(param => this.visitParameter(param)).join(", ");
    const localNames = this.collectFunctionLocalNames(node);
    const nonlocalNames = this.collectFunctionNonlocals(node, localNames);
    this.pythonFunctionScopeStack.push(localNames);
    this.indentLevel++;
    const nonlocalDirectives = nonlocalNames.map(name => `${this.indent()}nonlocal ${name}`);
    const emittedBody = this.emitBlockStatements(node.body.statements || []);
    const body = [...nonlocalDirectives, emittedBody].join("\n");
    this.indentLevel--;
    this.pythonFunctionScopeStack.pop();
    return `${this.indent()}def ${node.name || "__anonymous"}(${params}):\n${body}`;
  }

  visitFunctionDeclaration(node) {
    return this.visitFunctionDecl(node);
  }

  visitVarDecl(node) {
    const init = node.init ? this.visit(node.init) : "None";
    return `${this.indent()}${node.name} = ${init}`;
  }

  visitVariableDeclarator(node) {
    return this.visitVarDecl(node);
  }

  visitParameter(node) {
    if (node.defaultValue) {
      return `${node.name}=${this.visit(node.defaultValue)}`;
    }
    return node.name;
  }

  visitBlock(node) {
    this.indentLevel++;
    const body = this.emitBlockStatements(node.statements || []);
    this.indentLevel--;
    return `\n${body}`;
  }

  visitBlockStatement(node) {
    return this.visitBlock(node);
  }

  visitReturn(node) {
    return node.value
      ? `${this.indent()}return ${this.visit(node.value)}`
      : `${this.indent()}return`;
  }

  visitReturnStatement(node) {
    return this.visitReturn(node);
  }

  visitIf(node) {
    const condition = this.toPythonCondition(this.visit(node.condition));
    this.indentLevel++;
    const consequent = this.emitBlockStatements(node.consequent.statements || []);
    this.indentLevel--;

    let result = `${this.indent()}if ${condition}:\n${consequent}`;
    if (node.alternate) {
      if (node.alternate.kind === NodeCategory.IF) {
        const alternate = this.visit(node.alternate).trimStart();
        result += `\n${this.indent()}el${alternate}`;
      } else {
        this.indentLevel++;
        const alternate = this.emitBlockStatements(node.alternate.statements || []);
        this.indentLevel--;
        result += `\n${this.indent()}else:\n${alternate}`;
      }
    }
    return result;
  }

  visitIfStatement(node) {
    return this.visitIf(node);
  }

  visitWhile(node) {
    const condition = this.toPythonCondition(this.visit(node.condition));
    this.indentLevel++;
    const body = this.emitBlockStatements(node.body.statements || []);
    this.indentLevel--;
    return `${this.indent()}while ${condition}:\n${body}`;
  }

  visitWhileStatement(node) {
    return this.visitWhile(node);
  }

  visitFor(node) {
    const init = node.init ? this.visit(node.init) : null;
    const condition = node.condition ? this.toPythonCondition(this.visit(node.condition)) : "True";
    const update = node.update ? this.visit(node.update).trim() : null;

    this.indentLevel++;
    if (update) {
      this.forUpdateStack.push(update);
    }
    const bodyStatements = [...(node.body.statements || [])];
    const body = this.emitBlockStatements(bodyStatements);
    if (update) {
      this.forUpdateStack.pop();
    }
    const updateLine = update ? `\n${this.indent()}${update}` : "";
    this.indentLevel--;

    const whileLoop = `${this.indent()}while ${condition}:\n${body}${updateLine}`;
    return init ? `${init}\n${whileLoop}` : whileLoop;
  }

  visitForStatement(node) {
    return this.visitFor(node);
  }

  visitBreak(_node) {
    return `${this.indent()}break`;
  }

  visitBreakStatement(node) {
    return this.visitBreak(node);
  }

  visitContinue(_node) {
    const update = this.forUpdateStack[this.forUpdateStack.length - 1];
    if (update) {
      return `${this.indent()}${update}\n${this.indent()}continue`;
    }
    return `${this.indent()}continue`;
  }

  visitContinueStatement(node) {
    return this.visitContinue(node);
  }

  visitExpressionStmt(node) {
    return `${this.indent()}${this.visit(node.expression)}`;
  }

  visitExpressionStatement(node) {
    return this.visitExpressionStmt(node);
  }

  visitBinaryOp(node) {
    if (node.operator === "&&" && this.hasPythonAdapter("truthiness", "js_truthy")) {
      this.usedHelpers.add("__ls_and");
      return `__ls_and(lambda: ${this.visit(node.left)}, lambda: ${this.visit(node.right)})`;
    }
    if (node.operator === "||" && this.hasPythonAdapter("truthiness", "js_truthy")) {
      this.usedHelpers.add("__ls_or");
      return `__ls_or(lambda: ${this.visit(node.left)}, lambda: ${this.visit(node.right)})`;
    }
    if (node.operator === "+" && this.hasPythonAdapter("string_coercion", "explicit_tostring")) {
      this.usedHelpers.add("__ls_add");
      return `__ls_add(${this.visit(node.left)}, ${this.visit(node.right)})`;
    }

    const operatorMap = {
      "&&": "and",
      "||": "or",
      "!=": "!=",
      "===": "==",
      "!==": "!=",
      concat: "+"
    };
    const operator = operatorMap[node.operator] || node.operator;
    return `(${this.visit(node.left)} ${operator} ${this.visit(node.right)})`;
  }

  visitBinaryExpression(node) {
    return this.visitBinaryOp(node);
  }

  visitUnaryOp(node) {
    const operand = this.visit(node.operand);
    if (node.operator === "!") {
      if (this.hasPythonAdapter("truthiness", "js_truthy")) {
        this.usedHelpers.add("__ls_truthy");
        return `(not __ls_truthy(${operand}))`;
      }
      return `(not ${operand})`;
    }
    if (node.operator === "+") {
      return `+${operand}`;
    }
    if (node.operator === "-") {
      return `-${operand}`;
    }
    throw new Error(`Unsupported Python unary operator: ${node.operator}`);
  }

  visitUnaryExpression(node) {
    return this.visitUnaryOp(node);
  }

  visitCall(node) {
    if (
      node.metadata &&
      node.metadata.luascriptBuiltin === "many" &&
      this.hasPythonAdapter("multiple_returns", "packed_array")
    ) {
      const args = node.args.map(arg => this.visit(arg)).join(", ");
      return `[${args}]`;
    }

    if (node.callee && node.callee.kind === NodeCategory.MEMBER) {
      const methodName = this.staticMemberName(node.callee);
      if (methodName === "slice" && this.hasPythonAdapter("slicing", "runtime_slice")) {
        this.usedHelpers.add("__ls_slice");
        const object = this.visit(node.callee.object);
        const args = node.args.map(arg => this.visit(arg));
        return `__ls_slice(${[object, ...args].join(", ")})`;
      }
    }

    const callee = this.visit(node.callee);
    const args = node.args.map(arg => this.visit(arg)).join(", ");
    if (node.metadata && node.metadata.pythonBuiltin === "len") {
      return `len(${this.visit(node.args[0])})`;
    }
    if (node.metadata && node.metadata.pythonBuiltin === "string_upper") {
      return `str(${this.visit(node.args[0])}).upper()`;
    }
    if (node.metadata && node.metadata.pythonBuiltin === "string_lower") {
      return `str(${this.visit(node.args[0])}).lower()`;
    }
    if (node.metadata && node.metadata.pythonBuiltin === "index") {
      return `${this.visit(node.args[0])}[${this.visit(node.args[1])}]`;
    }
    if (node.metadata && node.metadata.pythonBuiltin === "slice") {
      const start = this.pythonSliceBoundary(node.args[1]);
      const end = this.pythonSliceBoundary(node.args[2]);
      return `${this.visit(node.args[0])}[${start}:${end}]`;
    }
    if (node.metadata && node.metadata.pythonBuiltin === "append") {
      return `${this.visit(node.args[0])}.append(${this.visit(node.args[1])})`;
    }
    if (node.metadata && node.metadata.pythonBuiltin === "pop") {
      const index = node.args[1] ? this.visit(node.args[1]) : "";
      return `${this.visit(node.args[0])}.pop(${index})`;
    }
    if (node.metadata && node.metadata.pythonBuiltin === "in_value") {
      return `(${this.visit(node.args[0])} in ${this.visit(node.args[1])})`;
    }
    if (node.metadata && node.metadata.pythonBuiltin === "in_key") {
      return `(${this.visit(node.args[0])} in ${this.visit(node.args[1])})`;
    }
    if (node.metadata && node.metadata.luaBuiltin === "len") {
      this.usedHelpers.add("__lua_len");
      return `__lua_len(${this.visit(node.args[0])})`;
    }
    if (callee === "__clike_len") {
      this.usedHelpers.add("__clike_len");
      return `__clike_len(${args})`;
    }
    if (callee === "console.log") {
      this.usedHelpers.add("__ls_print");
      return `__ls_print(${args})`;
    }
    return `${callee}(${args})`;
  }

  visitCallExpression(node) {
    return this.visitCall(node);
  }

  visitMember(node) {
    const object = this.visit(node.object);
    const property = this.visit(node.property);
    const propertyName = this.staticMemberName(node);
    if (node.computed) {
      if (node.metadata && node.metadata.luaIndexBase === 1) {
        return `${object}[${this.luaIndexToPythonIndex(property, node.property)}]`;
      }
      if (this.hasPythonAdapter("indexing", "zero_based")) {
        this.usedHelpers.add("__ls_index");
        return `__ls_index(${object}, ${property})`;
      }
      return `${object}[${property}]`;
    }
    if (
      propertyName === "length" &&
      this.hasPythonAdapter("length", "array_length_property")
    ) {
      return `len(${object})`;
    }
    if ((object === "math" || object === "Math") && (propertyName === "max" || propertyName === "min")) {
      return propertyName;
    }
    if (this.isPythonMathMember(object, propertyName)) {
      this.usedHelpers.add("math");
      return `math.${propertyName}`;
    }
    if (propertyName && this.shouldUseDictionaryMemberAccess(object, propertyName)) {
      return `${object}[${JSON.stringify(propertyName)}]`;
    }
    return `${object}.${property}`;
  }

  visitMemberExpression(node) {
    return this.visitMember(node);
  }

  visitArrayLiteral(node) {
    return `[${node.elements.map(element => element ? this.visit(element) : "None").join(", ")}]`;
  }

  visitArrayExpression(node) {
    return this.visitArrayLiteral(node);
  }

  visitObjectLiteral(node) {
    if (!node.properties || node.properties.length === 0) {
      return "{}";
    }
    const properties = node.properties.map(prop => {
      const key = this.pythonObjectKey(prop.key);
      return `${key}: ${this.visit(prop.value)}`;
    });
    return `{${properties.join(", ")}}`;
  }

  visitObjectExpression(node) {
    return this.visitObjectLiteral(node);
  }

  visitIdentifier(node) {
    return node.name;
  }

  visitLiteral(node) {
    if (typeof node.value === "string") {
      return JSON.stringify(node.value);
    }
    if (node.value === null || node.value === undefined) {
      return "None";
    }
    if (typeof node.value === "boolean") {
      return node.value ? "True" : "False";
    }
    return String(node.value);
  }

  visitAssignment(node) {
    if (
      node.left &&
      node.left.kind === NodeCategory.MEMBER &&
      node.left.computed &&
      this.hasPythonAdapter("indexing", "zero_based")
    ) {
      this.usedHelpers.add("__ls_set_index");
      const object = this.visit(node.left.object);
      const property = this.visit(node.left.property);
      const right = this.visit(node.right);

      if (node.operator === "=") {
        return `__ls_set_index(${object}, ${property}, ${right})`;
      }

      this.usedHelpers.add("__ls_index");
      const op = node.operator.slice(0, -1);
      return `__ls_set_index(${object}, ${property}, __ls_index(${object}, ${property}) ${op} ${right})`;
    }

    return `${this.visit(node.left)} ${node.operator} ${this.visit(node.right)}`;
  }

  visitAssignmentExpression(node) {
    return this.visitAssignment(node);
  }

  pythonSliceBoundary(node) {
    if (!node || (node.kind === NodeCategory.LITERAL && node.value === null)) {
      return "";
    }
    return this.visit(node);
  }

  luaIndexToPythonIndex(property, propertyNode) {
    if (
      propertyNode &&
      propertyNode.kind === NodeCategory.LITERAL &&
      typeof propertyNode.value === "number"
    ) {
      return String(propertyNode.value - 1);
    }
    return `(${property}) - 1`;
  }

  visitConditional(node) {
    return `(${this.visit(node.consequent)} if ${this.toPythonCondition(this.visit(node.condition))} else ${this.visit(node.alternate)})`;
  }

  visitConditionalExpression(node) {
    return this.visitConditional(node);
  }

  emitBlockStatements(statements) {
    if (!statements || statements.length === 0) {
      return `${this.indent()}pass`;
    }
    return statements.map(stmt => this.visit(stmt)).filter(Boolean).join("\n");
  }

  collectFunctionLocalNames(functionNode) {
    const names = new Set();
    for (const parameter of functionNode.parameters || []) {
      const name = this.parameterName(parameter);
      if (name) {
        names.add(name);
      }
    }

    this.collectLocalDeclarations(functionNode.body, names);
    return names;
  }

  collectFunctionNonlocals(functionNode, localNames) {
    if (this.pythonFunctionScopeStack.length === 0) {
      return [];
    }

    const assignedNames = new Set();
    this.collectAssignedIdentifiers(functionNode.body, assignedNames);

    return [...assignedNames]
      .filter(name => !localNames.has(name) && this.isEnclosingFunctionLocal(name))
      .sort();
  }

  isEnclosingFunctionLocal(name) {
    for (let index = this.pythonFunctionScopeStack.length - 1; index >= 0; index--) {
      if (this.pythonFunctionScopeStack[index].has(name)) {
        return true;
      }
    }
    return false;
  }

  collectLocalDeclarations(node, names) {
    if (!node) {
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        this.collectLocalDeclarations(item, names);
      }
      return;
    }
    if (!node.kind) {
      return;
    }

    if (node.kind === NodeCategory.VAR_DECL) {
      if (node.name) {
        names.add(node.name);
      }
      return;
    }
    if (node.kind === NodeCategory.VARIABLE_DECLARATION) {
      this.collectLocalDeclarations(node.declarations || [], names);
      return;
    }
    if (node.kind === NodeCategory.FUNCTION_DECL) {
      if (node.name) {
        names.add(node.name);
      }
      return;
    }

    for (const child of this.scopeChildren(node)) {
      this.collectLocalDeclarations(child, names);
    }
  }

  collectAssignedIdentifiers(node, names) {
    if (!node) {
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        this.collectAssignedIdentifiers(item, names);
      }
      return;
    }
    if (!node.kind) {
      return;
    }
    if (node.kind === NodeCategory.FUNCTION_DECL) {
      return;
    }
    if (node.kind === NodeCategory.VAR_DECL) {
      this.collectAssignedIdentifiers(node.init, names);
      return;
    }
    if (node.kind === NodeCategory.VARIABLE_DECLARATION) {
      this.collectAssignedIdentifiers(node.declarations || [], names);
      return;
    }
    if (node.kind === NodeCategory.ASSIGNMENT) {
      if (node.left && node.left.kind === NodeCategory.IDENTIFIER && node.left.name) {
        names.add(node.left.name);
      } else {
        this.collectAssignedIdentifiers(node.left, names);
      }
      this.collectAssignedIdentifiers(node.right, names);
      return;
    }

    for (const child of this.scopeChildren(node)) {
      this.collectAssignedIdentifiers(child, names);
    }
  }

  scopeChildren(node) {
    switch (node.kind) {
    case NodeCategory.PROGRAM:
      return node.body || [];
    case NodeCategory.BLOCK:
      return node.statements || [];
    case NodeCategory.EXPRESSION_STMT:
      return [node.expression];
    case NodeCategory.RETURN:
      return [node.value];
    case NodeCategory.IF:
      return [node.condition, node.consequent, node.alternate];
    case NodeCategory.WHILE:
      return [node.condition, node.body];
    case NodeCategory.FOR:
      return [node.init, node.condition, node.update, node.body];
    case NodeCategory.DO_WHILE:
      return [node.body, node.condition];
    case NodeCategory.SWITCH:
      return [node.discriminant, ...(node.cases || [])];
    case NodeCategory.CASE:
      return [node.test, ...(node.consequent || [])];
    case NodeCategory.BINARY_OP:
      return [node.left, node.right];
    case NodeCategory.UNARY_OP:
      return [node.operand];
    case NodeCategory.CALL:
      return [node.callee, ...(node.args || [])];
    case NodeCategory.MEMBER:
      return [node.object, node.property];
    case NodeCategory.ARRAY_LITERAL:
      return node.elements || [];
    case NodeCategory.OBJECT_LITERAL:
      return node.properties || [];
    case NodeCategory.PROPERTY:
      return [node.key, node.value];
    case NodeCategory.CONDITIONAL:
      return [node.condition, node.consequent, node.alternate];
    default:
      return [];
    }
  }

  parameterName(parameter) {
    if (!parameter) {
      return null;
    }
    if (typeof parameter === "string") {
      return parameter;
    }
    return parameter.name || null;
  }

  pythonObjectKey(node) {
    if (!node) return "None";
    if (node.kind === NodeCategory.IDENTIFIER) {
      return JSON.stringify(node.name);
    }
    return this.visit(node);
  }

  staticMemberName(memberNode) {
    if (!memberNode || !memberNode.property) {
      return null;
    }
    const property = memberNode.property;
    if (property.kind === NodeCategory.IDENTIFIER) {
      return property.name;
    }
    if (property.kind === NodeCategory.LITERAL && typeof property.value === "string") {
      return property.value;
    }
    return null;
  }

  isPythonMathMember(object, propertyName) {
    return Boolean(
      propertyName &&
      (object === "math" || object === "Math") &&
      [
        "acos",
        "asin",
        "atan",
        "ceil",
        "cos",
        "exp",
        "floor",
        "log",
        "pow",
        "sin",
        "sqrt",
        "tan"
      ].includes(propertyName)
    );
  }

  shouldUseDictionaryMemberAccess(object, propertyName) {
    if (!object || !propertyName) {
      return false;
    }
    if (["math", "Math", "console", "str"].includes(object)) {
      return false;
    }
    return true;
  }

  hasPythonAdapter(feature, strategy) {
    const pythonPolicy = this.luascriptMeta &&
      this.luascriptMeta.targets &&
      this.luascriptMeta.targets.python
      ? this.luascriptMeta.targets.python
      : {};
    return Boolean(
      (pythonPolicy.adapters && pythonPolicy.adapters[feature] === strategy) ||
      (pythonPolicy.repairs && pythonPolicy.repairs[feature] === strategy)
    );
  }

  toPythonCondition(expression) {
    if (this.hasPythonAdapter("truthiness", "js_truthy")) {
      this.usedHelpers.add("__ls_truthy");
      return `__ls_truthy(${expression})`;
    }
    return expression;
  }

  emitHelpers() {
    const helpers = [];
    if (this.usedHelpers.has("math")) {
      helpers.push("import math\n");
    }
    if (this.usedHelpers.has("__ls_and") || this.usedHelpers.has("__ls_or")) {
      this.usedHelpers.add("__ls_truthy");
    }
    if (this.usedHelpers.has("__clike_len")) {
      helpers.push([
        "def __clike_len(value):",
        "    return len(value)",
        ""
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_truthy")) {
      helpers.push([
        "def __ls_truthy(value):",
        "    if value is None or value is False:",
        "        return False",
        "    if isinstance(value, (int, float)) and value == 0:",
        "        return False",
        "    if isinstance(value, float) and value != value:",
        "        return False",
        "    if isinstance(value, str) and value == \"\":",
        "        return False",
        "    return True",
        ""
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_add")) {
      helpers.push([
        "def __ls_to_string(value):",
        "    if value is True:",
        "        return \"true\"",
        "    if value is False:",
        "        return \"false\"",
        "    if value is None:",
        "        return \"null\"",
        "    if isinstance(value, float) and value.is_integer():",
        "        return str(int(value))",
        "    return str(value)",
        "",
        "def __ls_add(left, right):",
        "    if isinstance(left, str) or isinstance(right, str):",
        "        return __ls_to_string(left) + __ls_to_string(right)",
        "    return left + right",
        ""
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_index")) {
      helpers.push([
        "def __ls_index(value, key):",
        "    return value[key]",
        ""
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_set_index")) {
      helpers.push([
        "def __ls_set_index(value, key, assigned):",
        "    value[key] = assigned",
        "    return assigned",
        ""
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_slice")) {
      helpers.push([
        "def __ls_slice(value, start_index=None, end_index=None):",
        "    return value[start_index:end_index]",
        ""
      ].join("\n"));
    }
    if (this.usedHelpers.has("__lua_len")) {
      helpers.push([
        "def __lua_len(value):",
        "    return len(value)",
        ""
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_print")) {
      helpers.push([
        "def __ls_print(*values):",
        "    normalized = []",
        "    for value in values:",
        "        if isinstance(value, float) and value.is_integer():",
        "            normalized.append(int(value))",
        "        else:",
        "            normalized.append(value)",
        "    print(*normalized)",
        ""
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_and")) {
      helpers.push([
        "def __ls_and(left_fn, right_fn):",
        "    left = left_fn()",
        "    if __ls_truthy(left):",
        "        return right_fn()",
        "    return left",
        ""
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_or")) {
      helpers.push([
        "def __ls_or(left_fn, right_fn):",
        "    left = left_fn()",
        "    if __ls_truthy(left):",
        "        return left",
        "    return right_fn()",
        ""
      ].join("\n"));
    }
    return helpers.join("\n");
  }

  indent() {
    return this.options.indent.repeat(this.indentLevel);
  }
}

module.exports = {
  IRToPythonGenerator
};

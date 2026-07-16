
/**
 * IR to Lua Generator
 * 
 * Converts LUASCRIPT IR to Lua code.
 */

const { NodeCategory } = require("../ir/nodes");
const { TypeCategory, PrimitiveType } = require("../ir/types");

class IRToLuaGenerator {
  constructor(options = {}) {
    this.options = {
      indent: options.indent || "  ",
      ...options
    };
    this.indentLevel = 0;
    this.tempVarCounter = 0;
    this.usedHelpers = new Set();
    this.continueLabelCounter = 0;
    this.continueLabels = [];
    this.luascriptMeta = null;
  }

  /**
     * Generate Lua code from IR
     */
  generate(node) {
    this.usedHelpers = new Set();
    this.continueLabelCounter = 0;
    this.continueLabels = [];
    this.luascriptMeta = node && node.metadata ? node.metadata.luascriptMeta : null;
    this.validateCapabilityPolicy();
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

    throw new Error(`Unsupported Lua output IR node kind: ${node.kind}`);
  }

  luaPolicy() {
    return this.luascriptMeta && this.luascriptMeta.targets && this.luascriptMeta.targets.lua
      ? this.luascriptMeta.targets.lua
      : {};
  }

  luaRequires(capability) {
    return (this.luaPolicy().requires || []).includes(capability);
  }

  luaForbids(capability) {
    return (this.luaPolicy().forbid || []).includes(capability);
  }

  isJsLikeSource() {
    return ["javascript", "typescript"].includes(this.options.sourceLanguage);
  }

  validateCapabilityPolicy() {
    const policy = this.luaPolicy();
    const requires = new Set(policy.requires || []);
    const forbid = new Set(policy.forbid || []);

    for (const capability of requires) {
      if (forbid.has(capability)) {
        throw new Error(`Conflicting capability policy: ${capability} is both required and forbidden`);
      }
    }

    if (policy.resolve && policy.resolve.continue === "label_goto" && !requires.has("lua.goto")) {
      throw new Error("resolve continue using label_goto requires lua.goto");
    }
  }

  containsContinue(node) {
    if (!node || typeof node !== "object") {
      return false;
    }
    if (Array.isArray(node)) {
      return node.some(item => this.containsContinue(item));
    }
    if (node.kind === "Continue" || node.kind === "ContinueStatement") {
      return true;
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === "metadata") continue;
      if (this.containsContinue(value)) {
        return true;
      }
    }
    return false;
  }

  // ========== PROGRAM & DECLARATIONS ==========

  visitProgram(node) {
    return node.body.map(stmt => this.visit(stmt)).join("\n");
  }

  visitFunctionDecl(node) {
    const name = node.name || "";
    const params = node.parameters.map(p => this.visitParameter(p)).join(", ");
        
    this.indentLevel++;
    const bodyStatements = node.body.statements.map(stmt => this.visit(stmt)).join("\n");
    this.indentLevel--;
        
    if (node.name) {
      return `${this.indent()}local function ${name}(${params})\n${bodyStatements}\n${this.indent()}end`;
    } else {
      // Anonymous function
      return `function(${params})\n${bodyStatements}\n${this.indent()}end`;
    }
  }

  visitFunctionDeclaration(node) {
    return this.visitFunctionDecl(node);
  }

  visitVarDecl(node) {
    const init = node.init ? ` = ${this.visit(node.init)}` : "";
    return `${this.indent()}local ${node.name}${init}`;
  }

  visitVariableDeclarator(node) {
    return this.visitVarDecl(node);
  }

  visitParameter(node) {
    // Lua doesn't support default parameters in the same way
    // We'll just use the parameter name
    return node.name;
  }

  // ========== STATEMENTS ==========

  visitBlock(node) {
    // Lua doesn't have explicit block syntax like {}
    // We'll just generate the statements with proper indentation
    this.indentLevel++;
    const statements = node.statements.map(stmt => this.visit(stmt)).join("\n");
    this.indentLevel--;
        
    return statements;
  }

  visitBlockStatement(node) {
    return this.visitBlock(node);
  }

  visitReturn(node) {
    if (node.value) {
      return `${this.indent()}return ${this.visit(node.value)}`;
    }
    return `${this.indent()}return`;
  }

  visitReturnStatement(node) {
    return this.visitReturn(node);
  }

  visitIf(node) {
    const condition = this.toLuaCondition(this.visit(node.condition));
        
    this.indentLevel++;
    const consequent = node.consequent.kind === NodeCategory.BLOCK
      ? node.consequent.statements.map(stmt => this.visit(stmt)).join("\n")
      : this.visit(node.consequent);
    this.indentLevel--;
        
    let result = `${this.indent()}if ${condition} then\n${consequent}`;
        
    if (node.alternate) {
      // Check if alternate is another If node (elseif)
      if (node.alternate.kind === NodeCategory.IF) {
        const altCondition = this.toLuaCondition(this.visit(node.alternate.condition));
                
        this.indentLevel++;
        const altConsequent = node.alternate.consequent.kind === NodeCategory.BLOCK
          ? node.alternate.consequent.statements.map(stmt => this.visit(stmt)).join("\n")
          : this.visit(node.alternate.consequent);
        this.indentLevel--;
                
        result += `\n${this.indent()}elseif ${altCondition} then\n${altConsequent}`;
                
        // Check for further else/elseif
        if (node.alternate.alternate) {
          const furtherAlt = this.generateElse(node.alternate.alternate);
          result += furtherAlt;
        }
      } else {
        this.indentLevel++;
        const alternate = node.alternate.kind === NodeCategory.BLOCK
          ? node.alternate.statements.map(stmt => this.visit(stmt)).join("\n")
          : this.visit(node.alternate);
        this.indentLevel--;
                
        result += `\n${this.indent()}else\n${alternate}`;
      }
    }
        
    result += `\n${this.indent()}end`;
    return result;
  }

  visitIfStatement(node) {
    return this.visitIf(node);
  }

  generateElse(node) {
    if (node.kind === NodeCategory.IF) {
      const condition = this.toLuaCondition(this.visit(node.condition));
            
      this.indentLevel++;
      const consequent = node.consequent.kind === NodeCategory.BLOCK
        ? node.consequent.statements.map(stmt => this.visit(stmt)).join("\n")
        : this.visit(node.consequent);
      this.indentLevel--;
            
      let result = `\n${this.indent()}elseif ${condition} then\n${consequent}`;
            
      if (node.alternate) {
        result += this.generateElse(node.alternate);
      }
            
      return result;
    } else {
      this.indentLevel++;
      const alternate = node.kind === NodeCategory.BLOCK
        ? node.statements.map(stmt => this.visit(stmt)).join("\n")
        : this.visit(node);
      this.indentLevel--;
            
      return `\n${this.indent()}else\n${alternate}`;
    }
  }

  visitWhile(node) {
    const condition = this.toLuaCondition(this.visit(node.condition));
    const bodyHasContinue = this.containsContinue(node.body);
    const continueLabel = bodyHasContinue ? this.createContinueLabel() : null;
        
    this.indentLevel++;
    if (continueLabel) {
      this.continueLabels.push(continueLabel);
    }
    const body = node.body.kind === NodeCategory.BLOCK
      ? node.body.statements.map(stmt => this.visit(stmt)).join("\n")
      : this.visit(node.body);
    if (continueLabel) {
      this.continueLabels.pop();
    }
    this.indentLevel--;
        
    const labelLine = continueLabel ? `\n${this.indent()}::${continueLabel}::` : "";
    return `${this.indent()}while ${condition} do\n${body}${labelLine}\n${this.indent()}end`;
  }

  visitWhileStatement(node) {
    return this.visitWhile(node);
  }

  visitDoWhile(node) {
    // Lua doesn't have do-while, convert to repeat-until
    const condition = this.toLuaCondition(this.visit(node.condition));
        
    this.indentLevel++;
    const body = node.body.kind === NodeCategory.BLOCK
      ? node.body.statements.map(stmt => this.visit(stmt)).join("\n")
      : this.visit(node.body);
    this.indentLevel--;
        
    // Note: repeat-until continues while condition is false (opposite of do-while)
    return `${this.indent()}repeat\n${body}\n${this.indent()}until not (${condition})`;
  }

  visitDoWhileStatement(node) {
    return this.visitDoWhile(node);
  }

  visitFor(node) {
    // Convert JavaScript for loop to Lua while loop
    const init = node.init ? this.visit(node.init) : "";
    const condition = node.condition ? this.toLuaCondition(this.visit(node.condition)) : "true";
    const bodyHasContinue = this.containsContinue(node.body);
    const continueLabel = bodyHasContinue ? this.createContinueLabel() : null;
        
    this.indentLevel++;
    if (continueLabel) {
      this.continueLabels.push(continueLabel);
    }
    const bodyStatements = node.body.kind === NodeCategory.BLOCK
      ? node.body.statements.map(stmt => this.visit(stmt))
      : [this.visit(node.body)];
    if (continueLabel) {
      this.continueLabels.pop();
    }
        
    if (continueLabel) {
      bodyStatements.push(`${this.indent()}::${continueLabel}::`);
    }
    if (node.update) {
      bodyStatements.push(this.visit(node.update));
    }
        
    const body = bodyStatements.join("\n");
    this.indentLevel--;
        
    let result = "";
    if (init) {
      result += `${init}\n`;
    }
    result += `${this.indent()}while ${condition} do\n${body}\n${this.indent()}end`;
        
    return result;
  }

  visitForStatement(node) {
    return this.visitFor(node);
  }

  visitSwitch(node) {
    // Lua doesn't have switch, convert to if-elseif chain
    const discriminant = this.visit(node.discriminant);
    const switchVar = `__switch_${Math.random().toString(36).substr(2, 9)}`;
        
    let result = `${this.indent()}local ${switchVar} = ${discriminant}\n`;
        
    for (let i = 0; i < node.cases.length; i++) {
      const caseNode = node.cases[i];
            
      if (caseNode.test) {
        const test = this.visit(caseNode.test);
        const comparison = `${switchVar} == ${test}`;
                
        this.indentLevel++;
        const consequent = caseNode.consequent.map(stmt => this.visit(stmt)).join("\n");
        this.indentLevel--;
                
        if (i === 0) {
          result += `${this.indent()}if ${comparison} then\n${consequent}`;
        } else {
          result += `\n${this.indent()}elseif ${comparison} then\n${consequent}`;
        }
      } else {
        // Default case
        this.indentLevel++;
        const consequent = caseNode.consequent.map(stmt => this.visit(stmt)).join("\n");
        this.indentLevel--;
                
        result += `\n${this.indent()}else\n${consequent}`;
      }
    }
        
    result += `\n${this.indent()}end`;
    return result;
  }

  visitSwitchStatement(node) {
    return this.visitSwitch(node);
  }

  visitCase(_node) {
    // Cases are handled in visitSwitch
    throw new Error("Case nodes should be handled by visitSwitch");
  }

  visitSwitchCase(node) {
    return this.visitCase(node);
  }

  visitBreak(_node) {
    return `${this.indent()}break`;
  }

  visitBreakStatement(node) {
    return this.visitBreak(node);
  }

  visitContinue(_node) {
    const label = this.continueLabels[this.continueLabels.length - 1];
    if (!label) {
      throw new Error("ContinueStatement requires an enclosing loop");
    }
    if (this.luaForbids("lua.goto")) {
      throw new Error("Forbidden capability used by meta policy: lua.goto");
    }
    return `${this.indent()}goto ${label}`;
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

  createContinueLabel() {
    this.continueLabelCounter += 1;
    return `__continue_${this.continueLabelCounter}`;
  }

  // ========== EXPRESSIONS ==========

  visitBinaryOp(node) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    // Map JavaScript operators to Lua operators
    let operator = node.operator;
    if (operator === "concat") operator = "..";
    if (operator === "===") operator = "==";
    if (operator === "!==") operator = "~=";
    if (operator === "!=") operator = "~=";
    if (operator === "&&") {
      if (this.hasLuaAdapter("truthiness", "js_truthy")) {
        this.usedHelpers.add("__ls_logical_and");
        return `__ls_logical_and(${left}, function() return ${right} end)`;
      }
      operator = "and";
    }
    if (operator === "||") {
      if (this.hasLuaAdapter("truthiness", "js_truthy")) {
        this.usedHelpers.add("__ls_logical_or");
        return `__ls_logical_or(${left}, function() return ${right} end)`;
      }
      operator = "or";
    }
    if (operator === "+") {
      if (this.hasLuaAdapter("string_coercion", "explicit_tostring")) {
        this.usedHelpers.add("__ls_add");
        return `__ls_add(${left}, ${right})`;
      }
      const leftIsString = this.isStringLike(node.left);
      const rightIsString = this.isStringLike(node.right);
      if (leftIsString || rightIsString) {
        operator = "..";
        // Wrap non-string-like operands with tostring()
        const leftOperand = leftIsString ? left : `tostring(${left})`;
        const rightOperand = rightIsString ? right : `tostring(${right})`;
        return `(${leftOperand} ${operator} ${rightOperand})`;
      }
    }

    return `(${left} ${operator} ${right})`;
  }

  hasLuaAdapter(feature, strategy) {
    const luaPolicy = this.luascriptMeta && this.luascriptMeta.targets && this.luascriptMeta.targets.lua;
    return Boolean(luaPolicy && (
      (luaPolicy.adapters && luaPolicy.adapters[feature] === strategy) ||
      (luaPolicy.repairs && luaPolicy.repairs[feature] === strategy)
    ));
  }

  toLuaCondition(expression) {
    if (this.hasLuaAdapter("truthiness", "js_truthy")) {
      this.usedHelpers.add("__ls_truthy");
      return `__ls_truthy(${expression})`;
    }
    return expression;
  }

  visitBinaryExpression(node) {
    return this.visitBinaryOp(node);
  }

  visitUnaryOp(node) {
    const operand = this.visit(node.operand);

    // Map JavaScript operators to Lua operators
    let operator = node.operator;
    if (operator === "!") operator = "not";
    if (operator === "not") {
      if (this.hasLuaAdapter("truthiness", "js_truthy")) {
        this.usedHelpers.add("__ls_truthy");
        return `not __ls_truthy(${operand})`;
      }
    }

    if (operator === "++" || operator === "--") {
      const op = operator === "++" ? "+" : "-";
      if (node.prefix) {
        return `(function() ${operand} = ${operand} ${op} 1; return ${operand}; end)()`;
      } else {
        const tempVar = this.createTempVar();
        return `(function() local ${tempVar} = ${operand}; ${operand} = ${operand} ${op} 1; return ${tempVar}; end)()`;
      }
    }

    if (node.prefix) {
      return `${operator} ${operand}`;
    } else {
      return `${operand} ${operator}`;
    }
  }

  visitUnaryExpression(node) {
    return this.visitUnaryOp(node);
  }

  visitCall(node) {
    if (node.callee && node.callee.kind === NodeCategory.MEMBER) {
      const methodName = this.staticMemberName(node.callee);
      if (methodName === "slice" && this.hasLuaAdapter("slicing", "runtime_slice")) {
        this.usedHelpers.add("__ls_slice");
        const object = this.visit(node.callee.object);
        const args = node.args.map(arg => this.visit(arg));
        return `__ls_slice(${[object, ...args].join(", ")})`;
      }
    }

    if (
      node.metadata &&
      node.metadata.luascriptBuiltin === "many" &&
      this.hasLuaAdapter("multiple_returns", "packed_array")
    ) {
      this.usedHelpers.add("__ls_many");
      const args = node.args.map(arg => this.visit(arg)).join(", ");
      return `__ls_many(${args})`;
    }

    const callee = this.visit(node.callee);
    const args = node.args.map(arg => this.visit(arg)).join(", ");

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
      return `string.upper(${this.visit(node.args[0])})`;
    }

    if (node.metadata && node.metadata.pythonBuiltin === "string_lower") {
      return `string.lower(${this.visit(node.args[0])})`;
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
        
    // Map console.log to print
    if (callee === "console.log") {
      return `print(${args})`;
    }
        
    return `${callee}(${args})`;
  }

  visitCallExpression(node) {
    return this.visitCall(node);
  }

  visitMember(node) {
    const object = this.visit(node.object);
    const property = this.visit(node.property);

    if (node.computed) {
      if (
        (node.metadata && node.metadata.zeroBasedIndex) ||
        this.isJsLikeSource() ||
        this.hasLuaAdapter("indexing", "zero_based")
      ) {
        this.usedHelpers.add("__ls_index");
        return `__ls_index(${object}, ${property})`;
      }
      return `${object}[${property}]`;
    } else {
      if (
        this.staticMemberName(node) === "length" &&
        (
          this.isJsLikeSource() ||
          this.hasLuaAdapter("length", "array_length_property")
        )
      ) {
        this.usedHelpers.add("__ls_length");
        return `__ls_length(${object})`;
      }
      return `${object}.${property}`;
    }
  }

  visitMemberExpression(node) {
    return this.visitMember(node);
  }

  visitArrayLiteral(node) {
    const elements = node.elements.map(el => el ? this.visit(el) : "nil").join(", ");
    return `{${elements}}`;
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
      const key = this.visitObjectKey(prop.key);
      const value = this.visit(prop.value);
      return `${this.indent()}${key} = ${value}`;
    }).join(",\n");
    this.indentLevel--;
        
    return `{\n${properties}\n${this.indent()}}`;
  }

  visitObjectExpression(node) {
    return this.visitObjectLiteral(node);
  }

  visitProperty(node) {
    const key = this.visitObjectKey(node.key);
    const value = this.visit(node.value);
        
    return `${key} = ${value}`;
  }

  visitIdentifier(node) {
    return node.name;
  }

  visitLiteral(node) {
    if (typeof node.value === "string") {
      return `"${node.value.replace(/"/g, "\\\"")}"`;
    } else if (node.value === null || node.value === undefined) {
      return "nil";
    } else if (typeof node.value === "boolean") {
      return node.value ? "true" : "false";
    }
    return String(node.value);
  }

  visitAssignment(node) {
    if (
      node.left &&
      node.left.kind === NodeCategory.MEMBER &&
      node.left.computed &&
      (
        (node.left.metadata && node.left.metadata.zeroBasedIndex) ||
        this.isJsLikeSource() ||
        this.hasLuaAdapter("indexing", "zero_based")
      )
    ) {
      this.usedHelpers.add("__ls_index");
      this.usedHelpers.add("__ls_set_index");
      const object = this.visit(node.left.object);
      const property = this.visit(node.left.property);
      const right = this.visit(node.right);
      const current = `__ls_index(${object}, ${property})`;

      if (node.operator === "=") {
        return `__ls_set_index(${object}, ${property}, ${right})`;
      }

      const op = node.operator.slice(0, -1);
      return `__ls_set_index(${object}, ${property}, ${current} ${op} ${right})`;
    }

    const left = this.visit(node.left);
    const right = this.visit(node.right);
        
    // Handle compound assignment operators
    if (node.operator !== "=") {
      const op = node.operator.slice(0, -1); // Remove the '='
      return `${left} = ${left} ${op} ${right}`;
    }
        
    return `${left} = ${right}`;
  }

  visitAssignmentExpression(node) {
    return this.visitAssignment(node);
  }

  visitConditional(node) {
    const condition = this.toLuaCondition(this.visit(node.condition));
    const consequent = this.visit(node.consequent);
    const alternate = this.visit(node.alternate);
        
    // Lua ternary: (condition and consequent or alternate)
    // Note: This doesn't work correctly if consequent is false/nil
    // For proper behavior, we need: (condition and {consequent} or {alternate})[1]
    return `((${condition}) and {${consequent}} or {${alternate}})[1]`;
  }

  visitConditionalExpression(node) {
    return this.visitConditional(node);
  }

  // ========== HELPERS ==========

  indent() {
    return this.options.indent.repeat(this.indentLevel);
  }

  createTempVar() {
    return `__tmp${this.tempVarCounter++}`;
  }

  isStringLike(node) {
    if (!node) {
      return false;
    }

    if (node.type && this.isStringType(node.type)) {
      return true;
    }

    if (node.kind === NodeCategory.LITERAL && typeof node.value === "string") {
      return true;
    }

    return false;
  }

  isStringType(type) {
    if (!type || !type.category) {
      return false;
    }

    switch (type.category) {
    case TypeCategory.PRIMITIVE:
      return type.primitiveType === PrimitiveType.STRING;
    case TypeCategory.OPTIONAL:
      return this.isStringType(type.baseType);
    case TypeCategory.UNION:
      return Array.isArray(type.types) && type.types.every(t => this.isStringType(t));
    default:
      return false;
    }
  }

  visitObjectKey(keyNode) {
    if (!keyNode) {
      return "nil";
    }

    if (keyNode.kind === NodeCategory.IDENTIFIER) {
      return keyNode.name;
    }

    if (keyNode.kind === NodeCategory.LITERAL && typeof keyNode.value === "string") {
      return `[${this.visit(keyNode)}]`;
    }

    return `[${this.visit(keyNode)}]`;
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

  emitHelpers() {
    const helpers = [];
    if (this.usedHelpers.has("__ls_logical_and") || this.usedHelpers.has("__ls_logical_or")) {
      this.usedHelpers.add("__ls_truthy");
    }
    if (this.usedHelpers.has("__cs_len")) {
      helpers.push([
        "local function __cs_len(value)",
        "  if type(value) == \"table\" then",
        "    return #value",
        "  end",
        "  return #value",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__cs_index")) {
      helpers.push([
        "local function __cs_index(value, key)",
        "  if type(value) == \"string\" and type(key) == \"number\" then",
        "    return string.sub(value, key + 1, key + 1)",
        "  end",
        "  if type(key) == \"number\" then",
        "    return value[key + 1]",
        "  end",
        "  return value[key]",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_len")) {
      helpers.push([
        "local function __py_len(value)",
        "  if type(value) == \"table\" then",
        "    local count = 0",
        "    for _ in pairs(value) do",
        "      count = count + 1",
        "    end",
        "    return count",
        "  end",
        "  return #value",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_index")) {
      helpers.push([
        "local function __py_index(value, key)",
        "  if type(value) == \"string\" and type(key) == \"number\" then",
        "    return string.sub(value, key + 1, key + 1)",
        "  end",
        "  if type(key) == \"number\" then",
        "    return value[key + 1]",
        "  end",
        "  return value[key]",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_slice")) {
      helpers.push([
        "local function __py_slice(value, start_index, end_index)",
        "  local lua_start = (start_index or 0) + 1",
        "  if type(value) == \"string\" then",
        "    local lua_end = end_index or #value",
        "    return string.sub(value, lua_start, math.min(lua_end, #value))",
        "  end",
        "  local lua_end = end_index or #value",
        "  local result = {}",
        "  for i = lua_start, math.min(lua_end, #value) do",
        "    table.insert(result, value[i])",
        "  end",
        "  return result",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_append")) {
      helpers.push([
        "local function __py_append(value, item)",
        "  table.insert(value, item)",
        "  return nil",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_pop")) {
      helpers.push([
        "local function __py_pop(value, index)",
        "  if index == nil then",
        "    return table.remove(value)",
        "  end",
        "  return table.remove(value, index + 1)",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_in_value")) {
      helpers.push([
        "local function __py_in_value(item, value)",
        "  if type(value) == \"string\" then",
        "    return string.find(value, item, 1, true) ~= nil",
        "  end",
        "  if type(value) == \"table\" then",
        "    for _, candidate in pairs(value) do",
        "      if candidate == item then",
        "        return true",
        "      end",
        "    end",
        "  end",
        "  return false",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__py_in_key")) {
      helpers.push([
        "local function __py_in_key(key, value)",
        "  return type(value) == \"table\" and value[key] ~= nil",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_add")) {
      helpers.push([
        "local function __ls_to_string(value)",
        "  if value == nil then",
        "    return \"null\"",
        "  end",
        "  return tostring(value)",
        "end",
        "",
        "local function __ls_add(left, right)",
        "  if type(left) == \"string\" or type(right) == \"string\" then",
        "    return __ls_to_string(left) .. __ls_to_string(right)",
        "  end",
        "  return left + right",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_index")) {
      helpers.push([
        "local function __ls_is_array_like(value)",
        "  if type(value) ~= \"table\" then",
        "    return false",
        "  end",
        "  local hasNumeric = false",
        "  for key in pairs(value) do",
        "    if type(key) ~= \"number\" or key < 1 or key ~= math.floor(key) then",
        "      return false",
        "    end",
        "    hasNumeric = true",
        "  end",
        "  return hasNumeric",
        "end",
        "local function __ls_index(value, key)",
        "  if type(value) == \"string\" and type(key) == \"number\" then",
        "    return string.sub(value, key + 1, key + 1)",
        "  end",
        "  if type(key) == \"number\" then",
        "    if __ls_is_array_like(value) then",
        "      return value[key + 1]",
        "    end",
        "    return value[key]",
        "  end",
        "  return value[key]",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_set_index")) {
      helpers.push([
        "local function __ls_set_index(value, key, assigned)",
        "  if type(key) == \"number\" then",
        "    if __ls_is_array_like(value) then",
        "      value[key + 1] = assigned",
        "    else",
        "      value[key] = assigned",
        "    end",
        "  else",
        "    value[key] = assigned",
        "  end",
        "  return assigned",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_length")) {
      helpers.push([
        "local function __ls_length(value)",
        "  if type(value) == \"string\" then",
        "    return #value",
        "  end",
        "  if type(value) == \"table\" then",
        "    if value.length ~= nil then",
        "      return value.length",
        "    end",
        "    if __ls_is_array_like(value) then",
        "      local maxIndex = 0",
        "      for key in pairs(value) do",
        "        if key > maxIndex then",
        "          maxIndex = key",
        "        end",
        "      end",
        "      return maxIndex",
        "    end",
        "    return nil",
        "  end",
        "  return nil",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__lua_len")) {
      helpers.push([
        "local function __lua_len(value)",
        "  if type(value) == \"string\" then",
        "    return #value",
        "  end",
        "  if type(value) == \"table\" then",
        "    local count = 0",
        "    for _ in pairs(value) do",
        "      count = count + 1",
        "    end",
        "    return math.max(#value, count)",
        "  end",
        "  return 0",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_slice")) {
      helpers.push([
        "local function __ls_slice(value, start_index, end_index)",
        "  local lua_start = (start_index or 0) + 1",
        "  if type(value) == \"string\" then",
        "    local lua_end = end_index or #value",
        "    return string.sub(value, lua_start, math.min(lua_end, #value))",
        "  end",
        "  local final_index = end_index and (end_index + 1) or (#value + 1)",
        "  local result = {}",
        "  for i = lua_start, math.min(final_index - 1, #value) do",
        "    table.insert(result, value[i])",
        "  end",
        "  return result",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_many")) {
      helpers.push([
        "local function __ls_many(...)",
        "  return {...}",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_truthy")) {
      helpers.push([
        "local function __ls_truthy(value)",
        "  if value == nil or value == false then",
        "    return false",
        "  end",
        "  if type(value) == \"number\" and value == 0 then",
        "    return false",
        "  end",
        "  if type(value) == \"string\" and value == \"\" then",
        "    return false",
        "  end",
        "  return true",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_logical_and")) {
      this.usedHelpers.add("__ls_truthy");
      helpers.push([
        "local function __ls_logical_and(left, right_thunk)",
        "  if __ls_truthy(left) then",
        "    return right_thunk()",
        "  end",
        "  return left",
        "end"
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_logical_or")) {
      this.usedHelpers.add("__ls_truthy");
      helpers.push([
        "local function __ls_logical_or(left, right_thunk)",
        "  if __ls_truthy(left) then",
        "    return left",
        "  end",
        "  return right_thunk()",
        "end"
      ].join("\n"));
    }
    return helpers.join("\n");
  }
}

module.exports = {
  IRToLuaGenerator
};

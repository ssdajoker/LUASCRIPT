"use strict";

/**
 * Canonical IR to executable C# generator for the language-completion harness.
 */

const { NodeCategory } = require("../ir/nodes");

class IRToCSharpGenerator {
  constructor(options = {}) {
    this.options = {
      indent: options.indent || "    ",
      ...options
    };
    this.indentLevel = 0;
    this.usedHelpers = new Set();
  }

  generate(node) {
    this.usedHelpers = new Set();
    const code = this.visit(node);
    const helpers = this.emitHelpers();
    return [
      "using System;",
      "using System.Globalization;",
      "using System.Linq;",
      "",
      helpers,
      code
    ].filter(part => part !== "").join("\n");
  }

  visit(node) {
    if (!node || !node.kind) return "";
    const methodName = `visit${node.kind}`;
    if (typeof this[methodName] === "function") {
      return this[methodName](node);
    }
    throw new Error(`Unsupported IR node kind for C# emission: ${node.kind}`);
  }

  visitProgram(node) {
    return node.body.map(stmt => this.visit(stmt)).filter(Boolean).join("\n");
  }

  visitFunctionDecl(node) {
    const parameters = node.parameters.map(param => `dynamic ${this.csharpIdentifier(param.name)}`).join(", ");
    this.indentLevel++;
    const body = this.emitBlockStatements(node.body.statements || []);
    this.indentLevel--;
    return `dynamic ${this.csharpIdentifier(node.name || "__anonymous")}(${parameters})\n{\n${body}\n}`;
  }

  visitFunctionDeclaration(node) {
    return this.visitFunctionDecl(node);
  }

  visitVarDecl(node) {
    const init = node.init ? ` = ${this.visit(node.init)}` : "";
    return `${this.indent()}var ${this.csharpIdentifier(node.name)}${init};`;
  }

  visitVariableDeclarator(node) {
    return this.visitVarDecl(node);
  }

  visitBlock(node) {
    this.indentLevel++;
    const body = this.emitBlockStatements(node.statements || []);
    this.indentLevel--;
    return `{\n${body}\n${this.indent()}}`;
  }

  visitBlockStatement(node) {
    return this.visitBlock(node);
  }

  visitReturn(node) {
    return node.value
      ? `${this.indent()}return ${this.visit(node.value)};`
      : `${this.indent()}return null;`;
  }

  visitReturnStatement(node) {
    return this.visitReturn(node);
  }

  visitIf(node) {
    const condition = this.visit(node.condition);
    const consequent = this.visit(node.consequent);
    let result = `${this.indent()}if (${condition}) ${consequent}`;
    if (node.alternate) {
      result += ` else ${this.visit(node.alternate)}`;
    }
    return result;
  }

  visitIfStatement(node) {
    return this.visitIf(node);
  }

  visitWhile(node) {
    return `${this.indent()}while (${this.visit(node.condition)}) ${this.visit(node.body)}`;
  }

  visitWhileStatement(node) {
    return this.visitWhile(node);
  }

  visitFor(node) {
    const init = node.init ? this.visitForPart(node.init) : "";
    const condition = node.condition ? this.visit(node.condition) : "";
    const update = node.update ? this.visitForPart(node.update) : "";
    return `${this.indent()}for (${init}; ${condition}; ${update}) ${this.visit(node.body)}`;
  }

  visitForStatement(node) {
    return this.visitFor(node);
  }

  visitBreak(_node) {
    return `${this.indent()}break;`;
  }

  visitBreakStatement(node) {
    return this.visitBreak(node);
  }

  visitContinue(_node) {
    return `${this.indent()}continue;`;
  }

  visitContinueStatement(node) {
    return this.visitContinue(node);
  }

  visitExpressionStmt(node) {
    return `${this.indent()}${this.visit(node.expression)};`;
  }

  visitExpressionStatement(node) {
    return this.visitExpressionStmt(node);
  }

  visitBinaryOp(node) {
    const operatorMap = {
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
    const operator = node.operator === "not" ? "!" : node.operator;
    return node.prefix ? `${operator}${this.visit(node.operand)}` : `${this.visit(node.operand)}${operator}`;
  }

  visitUnaryExpression(node) {
    return this.visitUnaryOp(node);
  }

  visitCall(node) {
    const callee = this.visit(node.callee);
    const args = node.args.map(arg => this.visit(arg)).join(", ");
    if (node.metadata && node.metadata.csharpBuiltin === "len") {
      this.usedHelpers.add("__cs_len");
      return `__cs_len(${this.visit(node.args[0])})`;
    }
    if (node.metadata && node.metadata.csharpBuiltin === "index") {
      this.usedHelpers.add("__cs_index");
      return `__cs_index(${args})`;
    }
    if (callee === "__clike_len") {
      this.usedHelpers.add("__clike_len");
      return `__clike_len(${args})`;
    }
    if (callee === "console.log" || callee === "print") {
      this.usedHelpers.add("__ls_print");
      return `__ls_print(new object[] { ${args} })`;
    }
    return `${callee}(${args})`;
  }

  visitCallExpression(node) {
    return this.visitCall(node);
  }

  visitMember(node) {
    if (
      node.object &&
      node.object.kind === NodeCategory.IDENTIFIER &&
      node.object.name === "math" &&
      !node.computed
    ) {
      return `Math.${this.csharpMathMethodName(node.property)}`;
    }
    const object = this.visit(node.object);
    const property = this.visit(node.property);
    const propertyName = this.staticMemberName(node);
    if (!node.computed && propertyName && this.shouldUseDictionaryMemberAccess(object, propertyName)) {
      return `${object}[${JSON.stringify(propertyName)}]`;
    }
    return node.computed ? `${object}[${property}]` : `${object}.${property}`;
  }

  visitMemberExpression(node) {
    return this.visitMember(node);
  }

  visitArrayLiteral(node) {
    return `new dynamic[] { ${node.elements.map(element => element ? this.visit(element) : "null").join(", ")} }`;
  }

  visitArrayExpression(node) {
    return this.visitArrayLiteral(node);
  }

  visitObjectLiteral(node) {
    if (!node.properties || node.properties.length === 0) {
      return "new System.Collections.Generic.Dictionary<string, dynamic>()";
    }
    const properties = node.properties.map(prop => {
      const key = this.csharpObjectKey(prop.key);
      return `{ ${key}, ${this.visit(prop.value)} }`;
    });
    return `new System.Collections.Generic.Dictionary<string, dynamic> { ${properties.join(", ")} }`;
  }

  visitObjectExpression(node) {
    return this.visitObjectLiteral(node);
  }

  visitIdentifier(node) {
    return this.csharpIdentifier(node.name);
  }

  visitLiteral(node) {
    if (typeof node.value === "string") {
      return JSON.stringify(node.value);
    }
    if (node.value === null || node.value === undefined) {
      return "null";
    }
    if (typeof node.value === "boolean") {
      return node.value ? "true" : "false";
    }
    return String(node.value);
  }

  visitAssignment(node) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);
    if (node.operator === "=") {
      return `${left} = ${right}`;
    }
    const operator = node.operator.slice(0, -1);
    return `${left} = ${left} ${operator} ${right}`;
  }

  visitAssignmentExpression(node) {
    return this.visitAssignment(node);
  }

  visitConditional(node) {
    return `(${this.visit(node.condition)} ? ${this.visit(node.consequent)} : ${this.visit(node.alternate)})`;
  }

  visitConditionalExpression(node) {
    return this.visitConditional(node);
  }

  visitForPart(node) {
    if (!node) return "";
    if (node.kind === NodeCategory.VAR_DECL || node.kind === NodeCategory.VARIABLE_DECLARATION) {
      return this.visit(node).trim().replace(/;$/, "");
    }
    return this.visit(node).trim().replace(/;$/, "");
  }

  emitBlockStatements(statements) {
    if (!statements || statements.length === 0) {
      return `${this.indent()}return null;`;
    }
    return statements.map(stmt => this.visit(stmt)).filter(Boolean).join("\n");
  }

  csharpObjectKey(node) {
    if (node.kind === NodeCategory.IDENTIFIER) {
      return JSON.stringify(node.name);
    }
    return this.visit(node);
  }

  csharpIdentifier(name) {
    const reserved = new Set([
      "abstract",
      "as",
      "base",
      "bool",
      "break",
      "byte",
      "case",
      "catch",
      "char",
      "checked",
      "class",
      "const",
      "continue",
      "decimal",
      "default",
      "delegate",
      "do",
      "double",
      "else",
      "enum",
      "event",
      "explicit",
      "extern",
      "false",
      "finally",
      "fixed",
      "float",
      "for",
      "foreach",
      "goto",
      "if",
      "implicit",
      "in",
      "int",
      "interface",
      "internal",
      "is",
      "lock",
      "long",
      "namespace",
      "new",
      "null",
      "object",
      "operator",
      "out",
      "override",
      "params",
      "private",
      "protected",
      "public",
      "readonly",
      "ref",
      "return",
      "sbyte",
      "sealed",
      "short",
      "sizeof",
      "stackalloc",
      "static",
      "string",
      "struct",
      "switch",
      "this",
      "throw",
      "true",
      "try",
      "typeof",
      "uint",
      "ulong",
      "unchecked",
      "unsafe",
      "ushort",
      "using",
      "virtual",
      "void",
      "volatile",
      "while"
    ]);
    return reserved.has(name) ? `@${name}` : name;
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

  shouldUseDictionaryMemberAccess(object, propertyName) {
    if (!object || !propertyName) {
      return false;
    }
    if (["console", "Console", "math", "Math", "str", "String"].includes(object)) {
      return false;
    }
    return true;
  }

  emitHelpers() {
    const helpers = [];
    if (this.usedHelpers.has("__clike_len")) {
      helpers.push([
        "int __clike_len(dynamic value)",
        "{",
        "    if (value is string s) return s.Length;",
        "    return value.Length;",
        "}",
        ""
      ].join("\n"));
    }
    if (this.usedHelpers.has("__cs_len")) {
      helpers.push([
        "int __cs_len(dynamic value)",
        "{",
        "    if (value is string s) return s.Length;",
        "    return value.Length;",
        "}",
        ""
      ].join("\n"));
    }
    if (this.usedHelpers.has("__cs_index")) {
      helpers.push([
        "dynamic __cs_index(dynamic value, dynamic key)",
        "{",
        "    return value[(int)key];",
        "}",
        ""
      ].join("\n"));
    }
    if (this.usedHelpers.has("__ls_print")) {
      helpers.push([
        "string __ls_format(object value)",
        "{",
        "    if (value == null) return \"null\";",
        "    if (value is bool b) return b ? \"true\" : \"false\";",
        "    if (value is IFormattable f) return f.ToString(null, CultureInfo.InvariantCulture);",
        "    return Convert.ToString(value, CultureInfo.InvariantCulture) ?? \"\";",
        "}",
        "",
        "void __ls_print(object[] values)",
        "{",
        "    Console.WriteLine(string.Join(\" \", values.Select(__ls_format)));",
        "}",
        ""
      ].join("\n"));
    }
    return helpers.join("\n");
  }

  csharpMathMethodName(propertyNode) {
    const propertyName = propertyNode && propertyNode.kind === NodeCategory.IDENTIFIER
      ? propertyNode.name
      : this.visit(propertyNode);
    const map = {
      abs: "Abs",
      ceil: "Ceiling",
      floor: "Floor",
      max: "Max",
      min: "Min",
      pow: "Pow",
      sqrt: "Sqrt"
    };
    return map[propertyName] || propertyName;
  }

  indent() {
    return this.options.indent.repeat(this.indentLevel);
  }
}

module.exports = {
  IRToCSharpGenerator
};

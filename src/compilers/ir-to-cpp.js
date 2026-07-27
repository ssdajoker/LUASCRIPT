"use strict";

/**
 * Canonical IR to executable C++ generator for language-completion slices.
 */

const { NodeCategory } = require("../ir/nodes");

class IRToCppGenerator {
  constructor(options = {}) {
    this.options = {
      indent: options.indent || "    ",
      ...options
    };
    this.indentLevel = 0;
    this.scopes = [];
    this.functionReturnTypes = new Map();
    this.recordTypes = new Map();
  }

  generate(node) {
    this.scopes = [];
    this.functionReturnTypes = new Map();
    this.recordTypes = new Map();
    this.loadRecordTypes(node);
    this.prepassFunctions(node);
    return [
      "#include <cmath>",
      "#include <iostream>",
      "#include <string>",
      "#include <vector>",
      "",
      this.visit(node)
    ].join("\n");
  }

  prepassFunctions(node) {
    if (!node || !node.body) return;
    for (const stmt of node.body) {
      if (stmt.kind === NodeCategory.FUNCTION_DECL) {
        this.functionReturnTypes.set(stmt.name, this.typeFromMetadata(stmt.metadata) || "double");
      }
    }
  }

  visit(node) {
    if (!node || !node.kind) return "";
    const methodName = `visit${node.kind}`;
    if (typeof this[methodName] === "function") return this[methodName](node);
    throw new Error(`Unsupported IR node kind for C++ emission: ${node.kind}`);
  }

  visitProgram(node) {
    const functions = [];
    const statements = [];
    for (const stmt of node.body || []) {
      if (stmt.kind === NodeCategory.FUNCTION_DECL) {
        functions.push(this.visit(stmt));
      } else {
        statements.push(stmt);
      }
    }

    this.pushScope();
    this.indentLevel++;
    const mainBody = statements.map(stmt => this.visit(stmt)).filter(Boolean);
    mainBody.push(`${this.indent()}return 0;`);
    this.indentLevel--;
    this.popScope();

    const main = `int main()\n{\n${mainBody.join("\n")}\n}`;
    const records = this.emitRecordTypes();
    return [records, ...functions, main].filter(Boolean).join("\n\n");
  }

  visitFunctionDecl(node) {
    const returnType = this.typeFromMetadata(node.metadata) || "double";
    this.pushScope();
    const parameters = node.parameters.map(param => {
      const type = this.typeFromMetadata(param.metadata) || "double";
      this.setVarType(param.name, type);
      return `${this.formatParameterType(type)} ${param.name}`;
    }).join(", ");
    this.indentLevel++;
    const body = this.emitBlockStatements(node.body.statements || []);
    this.indentLevel--;
    this.popScope();
    return `${returnType} ${node.name || "__anonymous"}(${parameters})\n{\n${body}\n}`;
  }

  visitFunctionDeclaration(node) {
    return this.visitFunctionDecl(node);
  }

  visitVarDecl(node) {
    const inferred = this.declarationType(node);
    this.setVarType(node.name, inferred);
    if (node.init && node.init.kind === NodeCategory.ARRAY_LITERAL) {
      return `${this.indent()}std::vector<double> ${node.name} = { ${node.init.elements.map(element => this.visit(element)).join(", ")} };`;
    }
    const init = node.init ? ` = ${this.visit(node.init)}` : this.defaultInitializer(inferred);
    return `${this.indent()}${inferred} ${node.name}${init};`;
  }

  visitVariableDeclarator(node) {
    return this.visitVarDecl(node);
  }

  visitBlock(node) {
    this.pushScope();
    this.indentLevel++;
    const body = this.emitBlockStatements(node.statements || []);
    this.indentLevel--;
    this.popScope();
    return `{\n${body}\n${this.indent()}}`;
  }

  visitBlockStatement(node) {
    return this.visitBlock(node);
  }

  visitReturn(node) {
    return node.value ? `${this.indent()}return ${this.visit(node.value)};` : `${this.indent()}return;`;
  }

  visitReturnStatement(node) {
    return this.visitReturn(node);
  }

  visitIf(node) {
    let result = `${this.indent()}if (${this.visit(node.condition)}) ${this.visit(node.consequent)}`;
    if (node.alternate) result += ` else ${this.visit(node.alternate)}`;
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

  visitBreak() {
    return `${this.indent()}break;`;
  }

  visitBreakStatement(node) {
    return this.visitBreak(node);
  }

  visitContinue() {
    return `${this.indent()}continue;`;
  }

  visitContinueStatement(node) {
    return this.visitContinue(node);
  }

  visitExpressionStmt(node) {
    if (this.isConsoleLog(node.expression)) return this.emitPrintStatement(node.expression.args);
    return `${this.indent()}${this.visit(node.expression)};`;
  }

  visitExpressionStatement(node) {
    return this.visitExpressionStmt(node);
  }

  visitBinaryOp(node) {
    const operatorMap = { "===": "==", "!==": "!=", concat: "+" };
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
    if (this.isCLikeBuiltin(node, "len")) return `${this.visit(node.args[0])}.size()`;
    if (callee === "math.abs") return `std::abs(${args})`;
    if (callee === "math.ceil") return `std::ceil(${args})`;
    if (callee === "math.floor") return `std::floor(${args})`;
    if (callee === "math.max") return `std::max(${args})`;
    if (callee === "math.min") return `std::min(${args})`;
    if (callee === "math.pow") return `std::pow(${args})`;
    if (callee === "math.sqrt") return `std::sqrt(${args})`;
    return `${callee}(${args})`;
  }

  visitCallExpression(node) {
    return this.visitCall(node);
  }

  visitMember(node) {
    if (node.object && node.object.kind === NodeCategory.IDENTIFIER && node.object.name === "math" && !node.computed) {
      return `math.${this.visit(node.property)}`;
    }
    const object = this.visit(node.object);
    const property = this.visit(node.property);
    return node.computed ? `${object}[(int)(${property})]` : `${object}.${property}`;
  }

  visitMemberExpression(node) {
    return this.visitMember(node);
  }

  visitArrayLiteral(node) {
    return `std::vector<double>{ ${node.elements.map(element => element ? this.visit(element) : "0").join(", ")} }`;
  }

  visitArrayExpression(node) {
    return this.visitArrayLiteral(node);
  }

  visitObjectLiteral(node) {
    const typeName = node.metadata && node.metadata.cLikeRecordType;
    const record = typeName ? this.recordTypes.get(typeName) : null;
    if (!record) {
      throw new Error("Unsupported C++ output feature: object literals require a known record type");
    }
    const valuesByName = new Map();
    for (const property of node.properties || []) {
      const key = this.propertyName(property.key);
      valuesByName.set(key, this.visit(property.value));
    }
    const values = record.fields.map(field => {
      return valuesByName.has(field.name) ? valuesByName.get(field.name) : this.defaultValueForType(field.type);
    });
    return `${typeName}{ ${values.join(", ")} }`;
  }

  visitObjectExpression(node) {
    return this.visitObjectLiteral(node);
  }

  visitProperty(node) {
    return `${this.propertyName(node.key)}: ${this.visit(node.value)}`;
  }

  visitIdentifier(node) {
    return node.name;
  }

  visitLiteral(node) {
    if (node.metadata && node.metadata.cLikeChar) {
      return `'${String(node.value).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
    }
    if (typeof node.value === "string") return JSON.stringify(node.value);
    if (node.value === null || node.value === undefined) return "0";
    if (typeof node.value === "boolean") return node.value ? "true" : "false";
    return String(node.value);
  }

  visitAssignment(node) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);
    if (node.operator === "=") return `${left} = ${right}`;
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
    return this.visit(node).trim().replace(/;$/, "");
  }

  emitBlockStatements(statements) {
    if (!statements || statements.length === 0) return "";
    return statements.map(stmt => this.visit(stmt)).filter(Boolean).join("\n");
  }

  emitPrintStatement(args) {
    const parts = (args || []).map(arg => this.visit(arg));
    if (parts.length === 0) return `${this.indent()}std::cout << std::endl;`;
    return `${this.indent()}std::cout << ${parts.join(" << \" \" << ")} << std::endl;`;
  }

  isConsoleLog(node) {
    if (!node || node.kind !== NodeCategory.CALL) return false;
    const callee = this.visit(node.callee);
    return callee === "console.log" || callee === "print";
  }

  declarationType(node) {
    const metadataType = this.typeFromMetadata(node.metadata);
    if (metadataType && metadataType.endsWith("[]")) return "std::vector<double>";
    if (metadataType) return metadataType;
    return this.expressionType(node.init) === "std::string" ? "std::string" : "double";
  }

  expressionType(node) {
    if (!node) return "double";
    if (node.kind === NodeCategory.LITERAL) {
      if (typeof node.value === "string") return "std::string";
      if (typeof node.value === "boolean") return "bool";
      return "double";
    }
    if (node.kind === NodeCategory.IDENTIFIER) {
      return this.lookupVarType(node.name) || "double";
    }
    if (node.kind === NodeCategory.BINARY_OP && ["==", "!=", "<", "<=", ">", ">=", "&&", "||"].includes(node.operator)) {
      return "bool";
    }
    if (node.kind === NodeCategory.CALL) {
      const callee = node.callee && node.callee.kind === NodeCategory.IDENTIFIER ? node.callee.name : null;
      return this.functionReturnTypes.get(callee) || "double";
    }
    if (node.kind === NodeCategory.MEMBER && !node.computed) {
      const fieldType = this.recordFieldType(node);
      if (fieldType) return fieldType;
    }
    if (node.kind === NodeCategory.OBJECT_LITERAL && node.metadata && node.metadata.cLikeRecordType) {
      return node.metadata.cLikeRecordType;
    }
    return "double";
  }

  typeFromMetadata(metadata = {}) {
    const sourceType = metadata.cppType || metadata.cppReturnType || metadata.cType ||
      metadata.cReturnType || metadata.csharpType || metadata.csharpReturnType;
    if (!sourceType) return null;
    if (sourceType.endsWith("[]")) return `${this.normalizeScalarType(sourceType.slice(0, -2))}[]`;
    if (this.recordTypes.has(sourceType)) return sourceType;
    return this.normalizeScalarType(sourceType);
  }

  formatParameterType(type) {
    if (type.endsWith("[]")) return "std::vector<double>";
    return type;
  }

  normalizeScalarType(typeName) {
    if (this.recordTypes.has(typeName)) return typeName;
    if (["char*", "const char*", "std::string", "string"].includes(typeName)) return "std::string";
    if (typeName === "bool") return "bool";
    if (typeName === "void") return "void";
    return "double";
  }

  defaultInitializer(type) {
    if (type === "std::string") return " = \"\"";
    if (type === "bool") return " = false";
    if (this.recordTypes.has(type)) return ` = ${type}{}`;
    return " = 0";
  }

  defaultValueForType(type) {
    const normalized = this.normalizeScalarType(type);
    if (normalized === "std::string") return "\"\"";
    if (normalized === "bool") return "false";
    return "0";
  }

  isCLikeBuiltin(node, name) {
    return node.metadata && (node.metadata.cLikeBuiltin === name || node.metadata.csharpBuiltin === name);
  }

  pushScope() {
    this.scopes.push(new Map());
  }

  popScope() {
    this.scopes.pop();
  }

  setVarType(name, type) {
    if (this.scopes.length === 0) this.pushScope();
    this.scopes[this.scopes.length - 1].set(name, type);
  }

  lookupVarType(name) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name)) return this.scopes[i].get(name);
    }
    return null;
  }

  loadRecordTypes(node) {
    const records = node && node.metadata && Array.isArray(node.metadata.cLikeRecordTypes)
      ? node.metadata.cLikeRecordTypes
      : [];
    for (const record of records) {
      this.recordTypes.set(record.name, {
        ...record,
        fields: (record.fields || []).map(field => ({
          ...field,
          type: this.normalizeScalarType(field.type)
        }))
      });
    }
  }

  emitRecordTypes() {
    const definitions = [];
    for (const record of this.recordTypes.values()) {
      const fields = record.fields
        .map(field => `${this.options.indent}${this.normalizeScalarType(field.type)} ${field.name};`)
        .join("\n");
      definitions.push(`struct ${record.name}\n{\n${fields}\n};`);
    }
    return definitions.join("\n\n");
  }

  propertyName(node) {
    if (!node) return "";
    if (node.kind === NodeCategory.IDENTIFIER) return node.name;
    if (node.kind === NodeCategory.LITERAL) return String(node.value);
    return this.visit(node);
  }

  recordFieldType(node) {
    if (!node || !node.object || node.object.kind !== NodeCategory.IDENTIFIER) return null;
    const objectType = this.lookupVarType(node.object.name);
    const record = objectType ? this.recordTypes.get(objectType) : null;
    if (!record) return null;
    const fieldName = this.propertyName(node.property);
    const field = record.fields.find(candidate => candidate.name === fieldName);
    return field ? field.type : null;
  }

  indent() {
    return this.options.indent.repeat(this.indentLevel);
  }
}

module.exports = {
  IRToCppGenerator
};

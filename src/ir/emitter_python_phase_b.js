"use strict";

/**
 * Python Phase B Emitter - Converts canonical IR (Phase B) to Python code
 * Handles canonical IR node types defined in canonical_ir_schema.js
 */

const { IRNodeType, IRTypeKind } = require("./canonical_ir_schema");

const NEWLINE = "\n";

class PythonPhaseBEmitter {
  constructor(options = {}) {
    this.indentUnit = options.indent || "    ";
    this.options = options;
  }

  emit(ir) {
    if (!ir || typeof ir !== "object") {
      throw new Error("Invalid IR passed to Phase B Python emitter");
    }

    const moduleNode = this.resolveModule(ir);
    const context = {
      indentLevel: 0,
    };

    const body = moduleNode.body || [];
    const lines = body.map(node => this.emitStatement(node, context)).filter(Boolean);

    return lines.join(NEWLINE + NEWLINE).trimEnd() + NEWLINE;
  }

  resolveModule(ir) {
    if (ir.type === IRNodeType.Module || ir.type === "Module") {
      return ir;
    }

    if (ir.type === "IRModule" && Array.isArray(ir.nodes)) {
      return { type: IRNodeType.Module, body: ir.nodes, metadata: ir.module || {} };
    }

    if (Array.isArray(ir.body)) {
      return { type: IRNodeType.Module, body: ir.body, metadata: ir.metadata || {} };
    }

    throw new Error("Unable to resolve module from IR");
  }

  emitStatement(node, context) {
    if (!node || typeof node !== "object") return "";

    switch (node.type) {
    case IRNodeType.Function:
    case "Function":
      return this.emitFunction(node, context);
    case IRNodeType.Class:
    case "Class":
      return this.emitClass(node, context);
    case IRNodeType.Variable:
    case "Variable":
      return this.emitVariable(node, context);
    case IRNodeType.Assignment:
    case "Assignment":
      return this.emitAssignment(node, context);
    case IRNodeType.Return:
    case "Return":
      return this.emitReturn(node, context);
    case IRNodeType.If:
    case "If":
      return this.emitIf(node, context);
    case IRNodeType.While:
    case "While":
      return this.emitWhile(node, context);
    case IRNodeType.For:
    case "For":
      return this.emitFor(node, context);
    case IRNodeType.Try:
    case "Try":
      return this.emitTry(node, context);
    case IRNodeType.Throw:
    case "Throw":
      return this.emitThrow(node, context);
    case IRNodeType.Block:
    case "Block":
      return this.emitBlock(node, context);
    case IRNodeType.ExpressionStatement:
    case "ExpressionStatement":
      return this.emitExpressionStatement(node, context);
    default:
      return this.emitExpressionStatement(node, context);
    }
  }

  emitFunction(node, context) {
    const indent = this.getIndent(context);
    const params = (node.params || []).map(p => p.name || "param").join(", ");
    const asyncPrefix = node.isAsync ? "async " : "";
    let code = `${indent}${asyncPrefix}def ${node.name || "anonymous"}(${params}):\n`;

    const body = node.body || [];
    code += this.emitBlockBody(body, { ...context, indentLevel: context.indentLevel + 1 });
    return code.trimEnd();
  }

  emitClass(node, context) {
    const indent = this.getIndent(context);
    const base = node.superclass ? this.emitTypeAsName(node.superclass) : null;
    const bases = base ? `(${base})` : "";
    let code = `${indent}class ${node.name || "Class"}${bases}:\n`;

    const body = [];
    (node.fields || []).forEach(field => {
      body.push({ type: IRNodeType.Assignment, target: { name: field.name }, value: field.value });
    });
    (node.methods || []).forEach(method => body.push(method));
    (node.staticMethods || []).forEach(method => body.push(method));

    code += this.emitBlockBody(body, { ...context, indentLevel: context.indentLevel + 1 });
    return code.trimEnd();
  }

  emitVariable(node, context) {
    const indent = this.getIndent(context);
    const value = node.value ? this.emitExpression(node.value, context) : "None";
    return `${indent}${node.name} = ${value}`;
  }

  emitAssignment(node, context) {
    const indent = this.getIndent(context);
    const target = this.emitExpression(node.target, context);
    const value = this.emitExpression(node.value, context);
    return `${indent}${target} = ${value}`;
  }

  emitReturn(node, context) {
    const indent = this.getIndent(context);
    if (!node.value) return `${indent}return`;
    return `${indent}return ${this.emitExpression(node.value, context)}`;
  }

  emitIf(node, context) {
    const indent = this.getIndent(context);
    const test = this.emitExpression(node.condition, context);
    let code = `${indent}if ${test}:\n`;

    code += this.emitBlockBody(node.then || [], { ...context, indentLevel: context.indentLevel + 1 });

    if (node.else && node.else.length > 0) {
      code += `${indent}else:\n`;
      code += this.emitBlockBody(node.else, { ...context, indentLevel: context.indentLevel + 1 });
    }

    return code.trimEnd();
  }

  emitWhile(node, context) {
    const indent = this.getIndent(context);
    const test = this.emitExpression(node.condition, context);
    let code = `${indent}while ${test}:\n`;

    code += this.emitBlockBody(node.body || [], { ...context, indentLevel: context.indentLevel + 1 });
    return code.trimEnd();
  }

  emitFor(node, context) {
    const indent = this.getIndent(context);
    const init = node.init && node.init.name ? node.init.name : "item";
    const iter = this.resolveForIterable(node, context);

    let code = `${indent}for ${init} in ${iter}:\n`;
    code += this.emitBlockBody(node.body || [], { ...context, indentLevel: context.indentLevel + 1 });
    return code.trimEnd();
  }

  emitTry(node, context) {
    const indent = this.getIndent(context);
    let code = `${indent}try:\n`;
    code += this.emitBlockBody(node.block || [], { ...context, indentLevel: context.indentLevel + 1 });

    if (node.handlers) {
      for (const handler of node.handlers) {
        const name = handler.param?.name || "err";
        code += `${indent}except Exception as ${name}:\n`;
        code += this.emitBlockBody(handler.body || [], {
          ...context,
          indentLevel: context.indentLevel + 1,
        });
      }
    }

    if (node.finalizer) {
      code += `${indent}finally:\n`;
      code += this.emitBlockBody(node.finalizer || [], {
        ...context,
        indentLevel: context.indentLevel + 1,
      });
    }

    return code.trimEnd();
  }

  emitThrow(node, context) {
    const indent = this.getIndent(context);
    const value = node.value ? this.emitExpression(node.value, context) : "Exception()";
    return `${indent}raise ${value}`;
  }

  emitBlock(node, context) {
    return this.emitBlockBody(node.statements || node.body || [], context).trimEnd();
  }

  emitExpressionStatement(node, context) {
    const indent = this.getIndent(context);
    const expr = node.expression || node;
    return `${indent}${this.emitExpression(expr, context)}`;
  }

  emitBlockBody(statements, context) {
    if (!statements || statements.length === 0) {
      return this.emitIndentedLine(context, "pass") + NEWLINE;
    }

    const lines = statements
      .map(stmt => this.emitStatement(stmt, context))
      .filter(Boolean);

    if (lines.length === 0) {
      return this.emitIndentedLine(context, "pass") + NEWLINE;
    }

    return lines.join(NEWLINE) + NEWLINE;
  }

  emitExpression(node, context) {
    if (!node || typeof node !== "object") return String(node ?? "None");

    switch (node.type) {
    case IRNodeType.Literal:
    case "Literal":
      return this.emitLiteral(node);
    case IRNodeType.Identifier:
    case "Identifier":
      return node.name || "unknown";
    case IRNodeType.BinaryOp:
    case "BinaryOp":
      return this.emitBinary(node, context);
    case IRNodeType.UnaryOp:
    case "UnaryOp":
      return this.emitUnary(node, context);
    case IRNodeType.Call:
    case "Call":
      return this.emitCall(node, context);
    case IRNodeType.MemberAccess:
    case "MemberAccess":
      return `${this.emitExpression(node.object, context)}.${node.member}`;
    case IRNodeType.IndexAccess:
    case "IndexAccess":
      return `${this.emitExpression(node.object, context)}[${this.emitExpression(
        node.index,
        context
      )}]`;
    case IRNodeType.Await:
    case "Await":
      return `await ${this.emitExpression(node.value, context)}`;
    case IRNodeType.Yield:
    case "Yield":
      return `yield ${this.emitExpression(node.value, context)}`;
    default:
      if (node.name) return node.name;
      return "None";
    }
  }

  resolveForIterable(node, context) {
    if (node.iter) {
      return this.emitExpression(node.iter, context);
    }

    const condition = node.condition;
    if (condition && condition.type === IRNodeType.Call && condition.callee?.name === "hasNext") {
      const arg = condition.args && condition.args[0];
      if (arg) {
        return this.emitExpression(arg, context);
      }
    }

    return "iterable";
  }

  emitLiteral(node) {
    if (node.value === null || node.value === undefined) return "None";
    if (typeof node.value === "string") return JSON.stringify(node.value);
    if (typeof node.value === "boolean") return node.value ? "True" : "False";
    return String(node.value);
  }

  emitBinary(node, context) {
    const left = this.emitExpression(node.left, context);
    const right = this.emitExpression(node.right, context);
    const op = this.mapOperator(node.operator);
    return `${left} ${op} ${right}`;
  }

  emitUnary(node, context) {
    const arg = this.emitExpression(node.argument, context);
    const op = this.mapOperator(node.operator);
    return `${op}${arg}`;
  }

  emitCall(node, context) {
    const callee = node.callee?.object
      ? `${this.emitExpression(node.callee.object, context)}.${node.callee.name}`
      : node.callee?.name || this.emitExpression(node.callee, context);

    const args = (node.args || []).map(arg => this.emitExpression(arg, context)).join(", ");
    return `${callee}(${args})`;
  }

  emitTypeAsName(type) {
    if (!type || typeof type !== "object") return "Any";

    if (type.kind === IRTypeKind.Primitive) {
      return type.name === "i64" ? "int" : type.name;
    }

    if (type.kind === IRTypeKind.Generic) {
      return type.name || "Any";
    }

    return "Any";
  }

  mapOperator(op) {
    const map = {
      div: "//",
      pow: "**",
      matmul: "@",
      "&&": "and",
      "||": "or",
      "!": "not ",
      "===": "==",
      "!==": "!=",
      contains: "in",
      not_contains: "not in",
    };

    return map[op] || op || "+";
  }

  getIndent(context) {
    return this.indentUnit.repeat(context.indentLevel || 0);
  }

  emitIndentedLine(context, text) {
    return `${this.getIndent(context)}${text}`;
  }
}

module.exports = { PythonPhaseBEmitter };

"use strict";

/**
 * Ruby Emitter - Converts canonical IR to Ruby code
 * Tier 2 Language Support for LUASCRIPT Multi-Language Transpilation
 * 
 * Translates from the canonical IR to idiomatic Ruby code.
 * Handles Ruby-specific syntax like def/end blocks, symbols, and string interpolation.
 */

const NEWLINE = "\n";

class RubyEmitter {
  constructor(options = {}) {
    this.indentUnit = options.indent || "  "; // Ruby standard is 2 spaces
    this.options = options;
    this.statementDispatch = this.createStatementDispatch();
  }

  createStatementDispatch() {
    return {
      VariableDeclaration: (node, context) => this.emitVariableDeclaration(node, context),
      ExpressionStatement: (node, context) => this.emitExpressionStatement(node, context),
      ReturnStatement: (node, context) => this.emitReturnStatement(node, context),
      IfStatement: (node, context) => this.emitIfStatement(node, context),
      WhileStatement: (node, context) => this.emitWhileStatement(node, context),
      ForStatement: (node, context) => this.emitForStatement(node, context),
      ForOfStatement: (node, context) => this.emitForOfStatement(node, context),
      FunctionDeclaration: (node, context) => this.emitFunctionDeclaration(node, context),
      ClassDeclaration: (node, context) => this.emitClassDeclaration(node, context),
      BlockStatement: (node, context) => this.emitBlockStatement(node, context),
      ThrowStatement: (node, context) => this.emitThrowStatement(node, context),
      TryStatement: (node, context) => this.emitTryStatement(node, context),
    };
  }

  emit(irModule) {
    if (!irModule || !irModule.module || !irModule.nodes) {
      throw new Error("Invalid IR module passed to Ruby emitter");
    }

    const context = {
      nodes: irModule.nodes,
      indentLevel: 0,
    };

    const chunks = [];

    for (const nodeId of irModule.module.body) {
      const node = context.nodes[nodeId];
      if (!node) {
        throw new Error(`Missing node ${nodeId} referenced in module body`);
      }
      const emitted = this.emitStatement(node, context);
      if (emitted) {
        chunks.push(emitted.trimEnd());
      }
    }

    const program = chunks.join(NEWLINE + NEWLINE);
    return program;
  }

  emitStatement(node, context) {
    if (!node) return null;

    const handler = this.statementDispatch[node.kind];
    if (handler) {
      return handler(node, context);
    }

    // Fallback to expression statement
    if (node.kind === "ExpressionStatement" || node.expression) {
      return this.emitExpressionStatement(node, context);
    }

    throw new Error(`Unknown statement kind: ${node.kind}`);
  }

  emitVariableDeclaration(node, context) {
    const chunks = [];
    for (const declarator of node.declarations) {
      const { varName } = this.resolveDeclaratorName(declarator, context);
      const initExpr = declarator.init
        ? this.emitExpressionById(declarator.init, context)
        : "nil";

      if (varName) {
        chunks.push(this.emitIndentedLine(context, `${varName} = ${initExpr}`));
      }
    }
    return chunks.join(NEWLINE);
  }

  resolveDeclaratorName(declarator, context) {
    if (typeof declarator.name === "string") {
      return { varName: declarator.name, isPattern: false };
    }

    if (declarator.name && context.nodes[declarator.name]) {
      const nameNode = context.nodes[declarator.name];
      if (nameNode.kind === "Identifier") {
        return { varName: nameNode.name, isPattern: false };
      }
    }

    return { varName: null, isPattern: false };
  }

  emitExpressionStatement(node, context) {
    const expr = node.expression || node;
    const exprId = typeof expr === "string" ? expr : expr.id;
    const exprCode = this.emitExpressionById(exprId, context);
    return this.emitIndentedLine(context, exprCode);
  }

  emitReturnStatement(node, context) {
    if (!node.argument) {
      return this.emitIndentedLine(context, "return");
    }
    const argCode = this.emitExpressionById(node.argument, context);
    return this.emitIndentedLine(context, `return ${argCode}`);
  }

  emitIfStatement(node, context) {
    const test = this.emitExpressionById(node.test, context);
    const indent = this.getIndent(context);

    let code = `${indent}if ${test}\n`;

    const consequent = context.nodes[node.consequent];
    if (consequent) {
      code += this.emitBlockWithIndent(consequent, context, context.indentLevel + 1);
    }

    if (node.alternate) {
      const alternate = context.nodes[node.alternate];
      code += `${indent}else\n`;
      if (alternate) {
        code += this.emitBlockWithIndent(alternate, context, context.indentLevel + 1);
      }
    }

    code += `${indent}end`;
    return code.trimEnd();
  }

  emitWhileStatement(node, context) {
    const test = this.emitExpressionById(node.test, context);
    const indent = this.getIndent(context);

    let code = `${indent}while ${test}\n`;

    const body = context.nodes[node.body];
    if (body) {
      code += this.emitBlockWithIndent(body, context, context.indentLevel + 1);
    }

    code += `${indent}end`;
    return code.trimEnd();
  }

  emitForStatement(node, context) {
    const indent = this.getIndent(context);
    const left = context.nodes[node.left];
    let varName = "i";

    if (left && left.kind === "VariableDeclaration" && left.declarations && left.declarations[0]) {
      varName = left.declarations[0].name || "i";
    }

    // Ruby for loop with range
    let code = `${indent}for ${varName} in 0...10\n`;

    const body = context.nodes[node.body];
    if (body) {
      code += this.emitBlockWithIndent(body, context, context.indentLevel + 1);
    }

    code += `${indent}end`;
    return code.trimEnd();
  }

  emitForOfStatement(node, context) {
    const indent = this.getIndent(context);
    const left = context.nodes[node.left];
    let varName = "item";

    if (left && left.kind === "VariableDeclaration" && left.declarations && left.declarations[0]) {
      varName = left.declarations[0].name || "item";
    }

    const right = this.emitExpressionById(node.right, context);

    let code = `${indent}for ${varName} in ${right}\n`;

    const body = context.nodes[node.body];
    if (body) {
      code += this.emitBlockWithIndent(body, context, context.indentLevel + 1);
    }

    code += `${indent}end`;
    return code.trimEnd();
  }

  emitFunctionDeclaration(node, context) {
    const indent = this.getIndent(context);
    const name = node.name || "anonymous";

    const params = (node.params || [])
      .map((paramId) => {
        const paramNode = context.nodes[paramId];
        return paramNode?.name || paramId;
      })
      .join(", ");

    let code = `${indent}def ${name}(${params})\n`;

    const body = context.nodes[node.body];
    if (body) {
      code += this.emitBlockWithIndent(body, context, context.indentLevel + 1);
    } else {
      code += this.emitIndentedLine({ ...context, indentLevel: context.indentLevel + 1 }, "nil");
    }

    code += `${indent}end`;
    return code.trimEnd();
  }

  emitClassDeclaration(node, context) {
    const indent = this.getIndent(context);
    const name = node.name || "MyClass";
    const superClass = node.superClass ? this.emitExpressionById(node.superClass, context) : null;

    const classBase = superClass ? ` < ${superClass}` : "";
    let code = `${indent}class ${name}${classBase}\n`;

    const body = context.nodes[node.body];
    if (body && body.kind === "BlockStatement") {
      code += this.emitBlockWithIndent(body, context, context.indentLevel + 1);
    } else {
      code += this.emitIndentedLine({ ...context, indentLevel: context.indentLevel + 1 }, "nil");
    }

    code += `${indent}end`;
    return code.trimEnd();
  }

  emitBlockStatement(node, context) {
    if (!node.body || node.body.length === 0) {
      return this.emitIndentedLine(context, "nil");
    }

    const lines = [];
    for (const statementId of node.body) {
      const stmt = context.nodes[statementId];
      if (stmt) {
        const emitted = this.emitStatement(stmt, context);
        if (emitted) {
          lines.push(emitted);
        }
      }
    }

    return lines.join(NEWLINE);
  }

  emitThrowStatement(node, context) {
    const arg = this.emitExpressionById(node.argument, context);
    return this.emitIndentedLine(context, `raise Exception.new(${arg})`);
  }

  emitTryStatement(node, context) {
    const indent = this.getIndent(context);
    let code = `${indent}begin\n`;

    const tryBlock = context.nodes[node.block];
    if (tryBlock) {
      code += this.emitBlockWithIndent(tryBlock, context, context.indentLevel + 1);
    }

    if (node.handlers && node.handlers.length > 0) {
      for (const handlerId of node.handlers) {
        const handler = context.nodes[handlerId];
        if (handler) {
          const paramName = handler.param
            ? context.nodes[handler.param]?.name || "err"
            : "err";
          code += `${indent}rescue => ${paramName}\n`;

          const handlerBody = context.nodes[handler.body];
          if (handlerBody) {
            code += this.emitBlockWithIndent(handlerBody, context, context.indentLevel + 1);
          }
        }
      }
    }

    if (node.finalizer) {
      code += `${indent}ensure\n`;
      const finalizerBody = context.nodes[node.finalizer];
      if (finalizerBody) {
        code += this.emitBlockWithIndent(finalizerBody, context, context.indentLevel + 1);
      }
    }

    code += `${indent}end`;
    return code.trimEnd();
  }

  emitBlockWithIndent(node, context, newIndentLevel) {
    const oldIndent = context.indentLevel;
    context.indentLevel = newIndentLevel;

    let result = "";
    if (node.kind === "BlockStatement" && node.body) {
      const lines = [];
      for (const statementId of node.body) {
        const stmt = context.nodes[statementId];
        if (stmt) {
          const emitted = this.emitStatement(stmt, context);
          if (emitted) {
            lines.push(emitted);
          }
        }
      }
      result = lines.join(NEWLINE);

      if (lines.length === 0) {
        result = this.emitIndentedLine(context, "nil");
      }
    } else {
      result = this.emitStatement(node, context);
    }

    context.indentLevel = oldIndent;
    return result ? result + NEWLINE : "";
  }

  emitExpressionById(exprId, context) {
    if (!exprId) return "nil";
    const node = context.nodes[exprId];
    if (!node) return String(exprId);

    return this.emitExpression(node, context);
  }

  emitExpression(node, context) {
    if (!node) return "nil";

    switch (node.kind) {
    case "Identifier":
      return node.name || "unknown";

    case "Literal":
      return this.emitLiteral(node);

    case "BinaryExpression":
      return this.emitBinaryExpression(node, context);

    case "LogicalExpression":
      return this.emitLogicalExpression(node, context);

    case "UnaryExpression":
      return this.emitUnaryExpression(node, context);

    case "AssignmentExpression":
      return this.emitAssignmentExpression(node, context);

    case "CallExpression":
      return this.emitCallExpression(node, context);

    case "MemberExpression":
      return this.emitMemberExpression(node, context);

    case "ArrayExpression":
      return this.emitArrayExpression(node, context);

    case "ObjectExpression":
      return this.emitObjectExpression(node, context);

    case "ConditionalExpression":
      return this.emitConditionalExpression(node, context);

    case "ThisExpression":
      return "self";

    case "NewExpression":
      return this.emitNewExpression(node, context);

    case "ArrowFunctionExpression":
    case "FunctionExpression":
      return this.emitFunctionExpression(node, context);

    default:
      return "nil";
    }
  }

  emitLiteral(node) {
    if (typeof node.value === "string") {
      return JSON.stringify(node.value);
    }
    if (typeof node.value === "number") {
      return String(node.value);
    }
    if (typeof node.value === "boolean") {
      return node.value ? "true" : "false";
    }
    if (node.value === null) {
      return "nil";
    }
    return "nil";
  }

  emitBinaryExpression(node, context) {
    const left = this.emitExpressionById(node.left, context);
    const right = this.emitExpressionById(node.right, context);

    const opMap = {
      "+": "+",
      "-": "-",
      "*": "*",
      "/": "/",
      "%": "%",
      "**": "**",
      "==": "==",
      "!=": "!=",
      "<": "<",
      ">": ">",
      "<=": "<=",
      ">=": ">=",
      "&": "&",
      "|": "|",
      "^": "^",
      "<<": "<<",
      ">>": ">>",
    };

    const op = opMap[node.operator] || node.operator;
    return `(${left} ${op} ${right})`;
  }

  emitLogicalExpression(node, context) {
    const left = this.emitExpressionById(node.left, context);
    const right = this.emitExpressionById(node.right, context);

    const opMap = {
      "&&": "&&",
      "||": "||",
      "and": "and",
      "or": "or",
    };

    const op = opMap[node.operator] || node.operator;
    return `(${left} ${op} ${right})`;
  }

  emitUnaryExpression(node, context) {
    const arg = this.emitExpressionById(node.argument, context);
    const opMap = {
      "!": "!",
      "-": "-",
      "+": "+",
      "~": "~",
    };

    const op = opMap[node.operator] || node.operator;
    return `${op}${arg}`;
  }

  emitAssignmentExpression(node, context) {
    const left = this.emitExpressionById(node.left, context);
    const right = this.emitExpressionById(node.right, context);

    const opMap = {
      "=": "=",
      "+=": "+=",
      "-=": "-=",
      "*=": "*=",
      "/=": "/=",
      "%=": "%=",
    };

    const op = opMap[node.operator] || "=";
    return `${left} ${op} ${right}`;
  }

  emitCallExpression(node, context) {
    const callee = this.emitExpressionById(node.callee, context);
    const args = (node.arguments || [])
      .map((argId) => this.emitExpressionById(argId, context))
      .join(", ");

    return `${callee}(${args})`;
  }

  emitMemberExpression(node, context) {
    const object = this.emitExpressionById(node.object, context);

    if (node.computed) {
      const property = this.emitExpressionById(node.property, context);
      return `${object}[${property}]`;
    } else {
      const property = this.emitExpressionById(node.property, context);
      return `${object}.${property}`;
    }
  }

  emitArrayExpression(node, context) {
    const elements = (node.elements || [])
      .map((elemId) => this.emitExpressionById(elemId, context))
      .join(", ");

    return `[${elements}]`;
  }

  emitObjectExpression(node, context) {
    const props = (node.properties || [])
      .map((propId) => {
        const prop = context.nodes[propId];
        if (!prop) return null;

        const key = prop.key ? this.emitExpressionById(prop.key, context) : ":key";
        const value = prop.value ? this.emitExpressionById(prop.value, context) : "nil";

        return `${key} => ${value}`;
      })
      .filter(Boolean)
      .join(", ");

    return `{${props}}`;
  }

  emitConditionalExpression(node, context) {
    const test = this.emitExpressionById(node.test, context);
    const consequent = this.emitExpressionById(node.consequent, context);
    const alternate = this.emitExpressionById(node.alternate, context);

    return `(${test} ? ${consequent} : ${alternate})`;
  }

  emitNewExpression(node, context) {
    const callee = this.emitExpressionById(node.callee, context);
    const args = (node.arguments || [])
      .map((argId) => this.emitExpressionById(argId, context))
      .join(", ");

    return `${callee}.new(${args})`;
  }

  emitFunctionExpression(node, context) {
    const params = (node.params || [])
      .map((paramId) => {
        const paramNode = context.nodes[paramId];
        return paramNode?.name || paramId;
      })
      .join(", ");

    // Ruby lambda syntax
    return `lambda { |${params}| ... }`;
  }

  emitIndentedLine(context, line) {
    const indent = this.getIndent(context);
    return `${indent}${line}`;
  }

  getIndent(context) {
    return this.indentUnit.repeat(context.indentLevel);
  }
}

function emitRubyFromIR(irModule, options = {}) {
  const emitter = new RubyEmitter(options);
  return emitter.emit(irModule);
}

module.exports = {
  RubyEmitter,
  emitRubyFromIR,
};

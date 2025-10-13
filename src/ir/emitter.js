"use strict";

const NEWLINE = "\n";

class IREmitter {
  constructor(options = {}) {
    this.indentUnit = options.indent || "  ";
    this.options = options;
  }

  emit(irModule) {
    if (!irModule || !irModule.module || !irModule.nodes) {
      throw new Error("Invalid IR module passed to emitter");
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

    return chunks.join(NEWLINE + NEWLINE);
  }

  emitStatement(node, context) {
    switch (node.kind) {
      case "VariableDeclaration":
        return this.emitVariableDeclaration(node, context);
      case "ExpressionStatement":
        return this.withIndent(context, (indent) =>
          indent + this.emitExpressionById(node.expression, context) + ""
        );
      case "ReturnStatement":
        return this.withIndent(context, (indent) => {
          const argument = node.argument
            ? this.emitExpressionById(node.argument, context)
            : "";
          return `${indent}return${argument ? " " + argument : ""}`;
        });
      case "IfStatement":
        return this.emitIfStatement(node, context);
      case "WhileStatement":
        return this.emitWhileStatement(node, context);
      case "FunctionDeclaration":
        return this.emitFunctionDeclaration(node, context);
      case "BlockStatement":
        return this.emitBlockById(node.id, context);
      default:
        if (node.expression) {
          return this.emitStatement(context.nodes[node.expression], context);
        }
        throw new Error(`Emitter does not support statement kind ${node.kind}`);
    }
  }

  emitVariableDeclaration(node, context) {
    const chunks = [];
    for (const declarator of node.declarations) {
      const patternNode = context.nodes[declarator.pattern];
      if (!patternNode || patternNode.kind !== "Identifier") {
        throw new Error("Emitter only supports simple identifier patterns");
      }
      const luaName = patternNode.name;
      const initExpr = declarator.init
        ? this.emitExpressionById(declarator.init, context)
        : null;
      const prefix = this.luaDeclarationPrefix(node.declarationKind || declarator.kind);
      chunks.push(
        this.withIndent(context, (indent) =>
          `${indent}${prefix}${luaName}${initExpr ? " = " + initExpr : ""}`
        )
      );
    }
    return chunks.join(NEWLINE);
  }

  emitIfStatement(node, context) {
    const test = this.emitExpressionById(node.test, context);
    const consequent = this.emitBlockById(node.consequent, context);
    const alternate = node.alternate
      ? this.emitBlockById(node.alternate, context)
      : null;

    let output = `${this.currentIndent(context)}if ${test} then${NEWLINE}${consequent}`;

    if (alternate) {
      output += `${NEWLINE}${this.currentIndent(context)}else${NEWLINE}${alternate}`;
    }

    output += `${NEWLINE}${this.currentIndent(context)}end`;
    return output;
  }

  emitWhileStatement(node, context) {
    const test = this.emitExpressionById(node.test, context);
    const body = this.emitBlockById(node.body, context);
    let output = `${this.currentIndent(context)}while ${test} do${NEWLINE}${body}`;
    output += `${NEWLINE}${this.currentIndent(context)}end`;
    return output;
  }

  emitFunctionDeclaration(node, context) {
    const name = node.name;
    const params = (node.params || [])
      .map((paramId) => {
        const paramNode = context.nodes[paramId];
        if (!paramNode || paramNode.kind !== "Identifier") {
          throw new Error("Function parameters must be identifiers in emitter");
        }
        return paramNode.name;
      })
      .join(", ");

    const body = this.emitBlockById(node.body, context, {
      indentLevel: context.indentLevel + 1,
    });

    const header = `${this.currentIndent(context)}local function ${name}(${params})`;
    return `${header}${NEWLINE}${body}${NEWLINE}${this.currentIndent(context)}end`;
  }

  emitBlockById(blockId, parentContext, overrides = {}) {
    const blockNode = parentContext.nodes[blockId];
    if (!blockNode || blockNode.kind !== "BlockStatement") {
      throw new Error(`Expected BlockStatement for id ${blockId}`);
    }

    const context = Object.assign({}, parentContext, overrides);
    if (overrides.indentLevel !== undefined) {
      context.indentLevel = overrides.indentLevel;
    } else {
      context.indentLevel = parentContext.indentLevel + 1;
    }

    const statements = [];
    for (const statementId of blockNode.statements || []) {
      const statementNode = context.nodes[statementId];
      if (!statementNode) {
        throw new Error(`Missing node ${statementId} referenced in block ${blockId}`);
      }
      statements.push(this.emitStatement(statementNode, context));
    }

    return statements.join(NEWLINE);
  }

  emitExpressionById(nodeId, context) {
    const node = context.nodes[nodeId];
    if (!node) {
      throw new Error(`Missing node ${nodeId} referenced by expression`);
    }
    return this.emitExpression(node, context);
  }

  emitExpression(node, context) {
    switch (node.kind) {
      case "Identifier":
        return node.name;
      case "Literal":
        return this.emitLiteral(node);
      case "BinaryExpression":
      case "LogicalExpression": {
        const operator = this.luaBinaryOperator(node, context);
        const left = this.emitGrouped(node.left, context);
        const right = this.emitGrouped(node.right, context);
        return `${left} ${operator} ${right}`;
      }
      case "AssignmentExpression":
        return `${this.emitExpressionById(node.left, context)} ${this.luaAssignmentOperator(
          node.operator
        )} ${this.emitExpressionById(node.right, context)}`;
      case "UnaryExpression":
        return `${this.luaUnaryOperator(node.operator)}${this.emitGrouped(node.argument, context)}`;
      case "CallExpression": {
        const callee = this.emitExpressionById(node.callee, context);
        const args = (node.arguments || [])
          .map((argId) => this.emitExpressionById(argId, context))
          .join(", ");
        return `${callee}(${args})`;
      }
      case "ArrowFunctionExpression":
        return this.emitArrowFunction(node, context);
      case "BlockStatement":
        return `{ --[[block]] }`;
      default:
        throw new Error(`Emitter does not support expression kind ${node.kind}`);
    }
  }

  emitArrowFunction(node, context) {
    const params = (node.params || [])
      .map((paramId) => {
        const paramNode = context.nodes[paramId];
        if (!paramNode || paramNode.kind !== "Identifier") {
          throw new Error("Arrow function parameters must be identifiers");
        }
        return paramNode.name;
      })
      .join(", ");

    const body = this.emitBlockById(node.body, context, {
      indentLevel: context.indentLevel + 1,
    });

    return `function(${params})${NEWLINE}${body}${NEWLINE}${this.currentIndent(context)}end`;
  }

  emitLiteral(node) {
    if (node.literalKind === "string") {
      return node.raw || JSON.stringify(node.value);
    }
    if (node.literalKind === "boolean") {
      return node.value ? "true" : "false";
    }
    if (node.literalKind === "null") {
      return "nil";
    }
    return typeof node.value === "number" ? String(node.value) : node.raw || "nil";
  }

  emitGrouped(nodeId, context) {
    const expression = this.emitExpressionById(nodeId, context);
    if (this.requiresGrouping(nodeId, context)) {
      return `(${expression})`;
    }
    return expression;
  }

  requiresGrouping(nodeId, context) {
    const node = context.nodes[nodeId];
    if (!node) return false;
    if (node.kind === "BinaryExpression") {
      if (node.operator === "+" && (this.isStringLike(node.left, context) || this.isStringLike(node.right, context))) {
        return false;
      }
      return true;
    }
    return node.kind === "LogicalExpression";
  }

  luaDeclarationPrefix(kind) {
    switch (kind) {
      case "var":
      case "let":
      case "const":
        return "local ";
      default:
        return "local ";
    }
  }

  luaOperator(operator) {
    if (operator === "===" || operator === "==") {
      return "==";
    }
    if (operator === "!==" || operator === "!=") {
      return "~=";
    }
    if (operator === "&&") {
      return "and";
    }
    if (operator === "||") {
      return "or";
    }
    return operator;
  }

  luaBinaryOperator(node, context) {
    if (node.kind === "BinaryExpression" && node.operator === "+") {
      if (this.isStringLike(node.left, context) || this.isStringLike(node.right, context)) {
        return "..";
      }
    }
    return this.luaOperator(node.operator);
  }

  isStringLike(nodeOrId, context, depth = 0) {
    if (depth > 10 || !nodeOrId) {
      return false;
    }

    const node = typeof nodeOrId === "object" ? nodeOrId : context.nodes[nodeOrId];
    if (!node) {
      return false;
    }

    switch (node.kind) {
      case "Literal":
        return node.literalKind === "string";
      case "TemplateLiteral":
        return true;
      case "BinaryExpression":
        if (node.operator !== "+") {
          return false;
        }
        return this.isStringLike(node.left, context, depth + 1) || this.isStringLike(node.right, context, depth + 1);
      default:
        return false;
    }
  }

  luaAssignmentOperator(operator) {
    return operator === "=" ? "=" : operator;
  }

  luaUnaryOperator(operator) {
    if (operator === "!") {
      return "not ";
    }
    return operator;
  }

  withIndent(context, factory) {
    const indent = this.currentIndent(context);
    return factory(indent);
  }

  currentIndent(context) {
    return this.indentUnit.repeat(context.indentLevel || 0);
  }
}

function emitLuaFromIR(irModule, options) {
  const emitter = new IREmitter(options);
  return emitter.emit(irModule);
}

module.exports = {
  IREmitter,
  emitLuaFromIR,
};

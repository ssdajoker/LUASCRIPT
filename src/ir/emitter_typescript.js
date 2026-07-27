/**
 * TypeScript Emitter - Converts canonical IR to TypeScript code
 */

const { BaseEmitter } = require("./base_emitter");

class TypeScriptEmitter extends BaseEmitter {
  constructor() {
    super();
    this.setIndentSize(4);
    this.lineEnding = "\n";
  }

  emitProgram(node) {
    if (!node.body) return "";
    return node.body.map(stmt => this.emitStatement(stmt)).join(this.lineEnding);
  }

  emitVariableDeclaration(node) {
    const declarations = node.declarations.map(decl => {
      const id = decl.id.name;
      const init = decl.init ? " = " + this.emitExpression(decl.init) : "";
      return id + init;
    }).join(", ");
    const kind = node.kind || "let";
    return this.emitLine(`${kind} ${declarations};`);
  }

  emitFunctionDeclaration(node) {
    const name = node.id.name;
    const params = node.params.map(p => p.name).join(", ");
    const body = this.emitBlockStatement(node.body);
    return this.emitLine(`function ${name}(${params}) ${body}`);
  }

  emitClassDeclaration(node) {
    const name = node.id.name;
    const superClass = node.superClass ? ` extends ${node.superClass.name}` : "";
    this.increaseIndent();
    const body = node.body.map(item => this.emitStatement(item)).join(this.lineEnding);
    this.decreaseIndent();
    return this.emitLine(`class ${name}${superClass} {`) + body + this.emitLine("}");
  }

  emitIfStatement(node) {
    const test = this.emitExpression(node.test);
    const consequent = this.emitStatement(node.consequent);
    let result = this.emitLine(`if (${test}) ${consequent}`);
    if (node.alternate) {
      const alternate = this.emitStatement(node.alternate);
      result += this.emitLine(`else ${alternate}`);
    }
    return result;
  }

  emitWhileStatement(node) {
    const test = this.emitExpression(node.test);
    const body = this.emitStatement(node.body);
    return this.emitLine(`while (${test}) ${body}`);
  }

  emitForStatement(node) {
    const init = node.init ? this.emitExpression(node.init) : "";
    const test = node.test ? this.emitExpression(node.test) : "";
    const update = node.update ? this.emitExpression(node.update) : "";
    const body = this.emitStatement(node.body);
    return this.emitLine(`for (${init}; ${test}; ${update}) ${body}`);
  }

  emitForOfStatement(node) {
    const left = node.left ? this.emitExpression(node.left) : "value";
    const right = this.emitExpression(node.right);
    const body = this.emitStatement(node.body);
    return this.emitLine(`for (${left} of ${right}) ${body}`);
  }

  emitForInStatement(node) {
    const left = node.left ? this.emitExpression(node.left) : "key";
    const right = this.emitExpression(node.right);
    const body = this.emitStatement(node.body);
    return this.emitLine(`for (${left} in ${right}) ${body}`);
  }

  emitDoWhileStatement(node) {
    const body = this.emitStatement(node.body);
    const test = this.emitExpression(node.test);
    return this.emitLine(`do ${body} while (${test});`);
  }

  emitBlockStatement(node) {
    let result = "{\\n";
    this.increaseIndent();
    for (const stmt of node.body) {
      result += this.emitStatement(stmt) + "\\n";
    }
    this.decreaseIndent();
    result += this.getIndent() + "}";
    return result;
  }

  emitReturnStatement(node) {
    const arg = node.argument ? " " + this.emitExpression(node.argument) : "";
    return this.emitLine(`return${arg};`);
  }

  emitThrowStatement(node) {
    const arg = this.emitExpression(node.argument);
    return this.emitLine(`throw ${arg};`);
  }

  emitTryStatement(node) {
    let result = this.emitLine(`try ${this.emitBlockStatement(node.block)}`);
    if (node.handler) {
      const param = node.handler.param ? node.handler.param.name : "error";
      result += this.emitLine(`catch (${param}) ${this.emitBlockStatement(node.handler.body)}`);
    }
    if (node.finalizer) {
      result += this.emitLine(`finally ${this.emitBlockStatement(node.finalizer)}`);
    }
    return result;
  }

  emitBreakStatement() {
    return this.emitLine("break;");
  }

  emitContinueStatement() {
    return this.emitLine("continue;");
  }

  emitExpressionStatement(node) {
    return this.emitLine(this.emitExpression(node.expression) + ";");
  }

  emitSwitchStatement(node) {
    const discriminant = this.emitExpression(node.discriminant);
    let result = this.emitLine(`switch (${discriminant}) {`);
    this.increaseIndent();
    for (const c of node.cases) {
      if (c.test) {
        result += this.emitLine(`case ${this.emitExpression(c.test)}:`);
      } else {
        result += this.emitLine("default:");
      }
      this.increaseIndent();
      for (const stmt of c.consequent) {
        result += this.emitStatement(stmt) + this.lineEnding;
      }
      result += this.emitLine("break;");
      this.decreaseIndent();
    }
    this.decreaseIndent();
    result += this.emitLine("}");
    return result;
  }
}

module.exports = { TypeScriptEmitter };

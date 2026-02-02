/**
 * Fortran Emitter - Legacy Language
 * Converts canonical IR to fortran code
 */

const { BaseEmitter } = require("./base_emitter");

class FortranEmitter extends BaseEmitter {
  constructor() {
    super();
    this.setIndentSize(6);
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
    return this.emitLine(`var ${declarations};`);
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
    const body = this.emitBlockStatement(node.body);
    return this.emitLine(`class ${name}${superClass} ${body}`);
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
    const init = this.emitExpression(node.init);
    const test = this.emitExpression(node.test);
    const update = this.emitExpression(node.update);
    const body = this.emitStatement(node.body);
    return this.emitLine(`for (${init}; ${test}; ${update}) ${body}`);
  }

  emitForOfStatement(node) {
    const left = this.emitExpression(node.left);
    const right = this.emitExpression(node.right);
    const body = this.emitStatement(node.body);
    return this.emitLine(`for (${left} of ${right}) ${body}`);
  }

  emitBlockStatement(node) {
    let result = "{\n";
    this.increaseIndent();
    for (const stmt of node.body) {
      result += this.emitStatement(stmt) + "\n";
    }
    this.decreaseIndent();
    result += this.getIndent() + "}";
    return result;
  }

  emitReturnStatement(node) {
    const arg = node.argument ? " " + this.emitExpression(node.argument) : "";
    return this.emitLine(`return${arg};`);
  }

  emitExpressionStatement(node) {
    return this.emitLine(this.emitExpression(node.expression) + ";");
  }

  emitThrowStatement(node) {
    const arg = this.emitExpression(node.argument);
    return this.emitLine(`throw ${arg};`);
  }

  emitTryStatement(node) {
    let result = this.emitLine(`try ${this.emitBlockStatement(node.block)}`);
    if (node.handler) {
      const param = node.handler.param ? node.handler.param.name : "e";
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
}

module.exports = { FortranEmitter };

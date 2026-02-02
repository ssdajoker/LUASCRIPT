/**
 * PHP Emitter - Converts canonical IR to PHP code
 */

const { BaseEmitter } = require("./base_emitter");

class PHPEmitter extends BaseEmitter {
  constructor() {
    super();
    this.setIndentSize(4);
    this.lineEnding = "\n";
  }

  emitProgram(node) {
    let result = "<?php\n";
    if (node.body) {
      result += node.body.map(stmt => this.emitStatement(stmt)).join(this.lineEnding);
    }
    result += "\n?>";
    return result;
  }

  emitVariableDeclaration(node) {
    const declarations = node.declarations.map(decl => {
      const id = "$" + decl.id.name;
      const init = decl.init ? " = " + this.emitExpression(decl.init) : "";
      return id + init;
    }).join(", ");
    return this.emitLine(`${declarations};`);
  }

  emitFunctionDeclaration(node) {
    const name = node.id.name;
    const params = node.params.map(p => "$" + p.name).join(", ");
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
    const right = this.emitExpression(node.right);
    const left = node.left ? this.emitExpression(node.left) : "$value";
    const body = this.emitStatement(node.body);
    return this.emitLine(`foreach (${right} as ${left}) ${body}`);
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
      const param = node.handler.param ? "$" + node.handler.param.name : "$e";
      result += this.emitLine(`catch (Exception ${param}) ${this.emitBlockStatement(node.handler.body)}`);
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

  emitExpression(node) {
    return super.emitExpression(node);
  }

  emitMemberExpression(node) {
    const obj = this.emitExpression(node.object);
    if (node.computed) {
      const prop = this.emitExpression(node.property);
      return `${obj}[${prop}]`;
    } else {
      const propName = node.property.name || node.property;
      return `${obj}->${propName}`;
    }
  }

  emitCallExpression(node) {
    const callee = this.emitExpression(node.callee);
    const args = node.arguments.map(arg => this.emitExpression(arg)).join(", ");
    return `${callee}(${args})`;
  }
}

module.exports = { PHPEmitter };

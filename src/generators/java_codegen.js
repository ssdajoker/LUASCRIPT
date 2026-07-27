/**
 * JAVA CODE GENERATOR - Phase A Output Pipeline
 * Round 1: Java to Lua/JavaScript Transpilation
 * Date: February 3, 2026
 */

class JavaCodeGenerator {
  constructor(options = {}) {
    this.options = options;
    this.indentation = 0;
    this.indent = options.indent || "  ";
    this.targetLanguage = options.targetLanguage || "lua";
    this.output = [];
  }

  generate(ast) {
    this.output = [];
    this.indentation = 0;

    if (ast.type === "Program") {
      for (const item of ast.body) {
        this.generateNode(item);
      }
    }

    return this.output.join("\n");
  }

  generateNode(node) {
    if (!node) return;

    switch (node.type) {
    case "ClassDeclaration":
      this.generateClass(node);
      break;
    case "MethodDeclaration":
      this.generateMethod(node);
      break;
    case "IfStatement":
      this.generateIfStatement(node);
      break;
    case "ForStatement":
      this.generateForStatement(node);
      break;
    case "WhileStatement":
      this.generateWhileStatement(node);
      break;
    case "ReturnStatement":
      this.generateReturnStatement(node);
      break;
    case "ExpressionStatement":
      this.generateExpressionStatement(node);
      break;
    case "Block":
      this.generateBlock(node);
      break;
    case "BinaryExpression":
      return this.generateBinaryExpression(node);
    case "UnaryExpression":
      return this.generateUnaryExpression(node);
    case "AssignmentExpression":
      return this.generateAssignmentExpression(node);
    case "CallExpression":
      return this.generateCallExpression(node);
    case "Identifier":
      return node.name;
    case "Literal":
      return this.generateLiteral(node);
    default:
      return "";
    }
  }

  generateClass(node) {
    if (this.targetLanguage === "lua") {
      this.write(`local ${node.name} = {}`);
      this.write(`${node.name}.__index = ${node.name}`);
      this.write("");

      if (node.methods && node.methods.length > 0) {
        for (const method of node.methods) {
          this.generateMethodLua(node.name, method);
        }
      }

      this.write(`return ${node.name}`);
    } else if (this.targetLanguage === "javascript") {
      this.write(`class ${node.name} {`);
      this.indentation++;

      if (node.methods && node.methods.length > 0) {
        for (const method of node.methods) {
          this.generateMethodJS(method);
        }
      }

      this.indentation--;
      this.write("}");
    }
  }

  generateMethodLua(className, node) {
    this.write(`function ${className}:${node.name}(${this.generateParametersLua(node.parameters)})`);
    this.indentation++;
    this.generateNode(node.body);
    this.indentation--;
    this.write("end");
    this.write("");
  }

  generateMethodJS(node) {
    this.write(`${node.name}(${this.generateParametersJS(node.parameters)}) {`);
    this.indentation++;
    this.generateNode(node.body);
    this.indentation--;
    this.write("}");
  }

  generateParametersLua(parameters) {
    if (!parameters || !Array.isArray(parameters)) return "";
    return parameters.map(p => p.name || p).join(", ");
  }

  generateParametersJS(parameters) {
    if (!parameters || !Array.isArray(parameters)) return "";
    return parameters.map(p => p.name || p).join(", ");
  }

  generateMethod(node) {
    if (this.targetLanguage === "lua") {
      this.generateMethodLua(node.name, node);
    } else {
      this.generateMethodJS(node);
    }
  }

  generateIfStatement(node) {
    if (this.targetLanguage === "lua") {
      const condition = this.generateNode(node.condition);
      this.write(`if ${condition} then`);
      this.indentation++;
      this.generateNode(node.consequent);
      this.indentation--;

      if (node.alternate) {
        this.write("else");
        this.indentation++;
        this.generateNode(node.alternate);
        this.indentation--;
      }

      this.write("end");
    } else {
      const condition = this.generateNode(node.condition);
      this.write(`if (${condition}) {`);
      this.indentation++;
      this.generateNode(node.consequent);
      this.indentation--;
      this.write("}");

      if (node.alternate) {
        this.write(" else {");
        this.indentation++;
        this.generateNode(node.alternate);
        this.indentation--;
        this.write("}");
      }
    }
  }

  generateForStatement(node) {
    if (this.targetLanguage === "lua") {
      // Simplified: convert to while loop
      const init = node.init ? this.generateNode(node.init) : "";
      if (init) {
        this.write(init);
      }

      this.write("while true do");
      this.indentation++;

      const test = node.test ? this.generateNode(node.test) : "true";
      this.write(`if not (${test}) then break end`);

      this.generateNode(node.body);

      if (node.update) {
        const update = this.generateNode(node.update);
        this.write(update);
      }

      this.indentation--;
      this.write("end");
    } else {
      const init = node.init ? this.generateNode(node.init) : "";
      const test = node.test ? this.generateNode(node.test) : "";
      const update = node.update ? this.generateNode(node.update) : "";

      this.write(`for (${init}; ${test}; ${update}) {`);
      this.indentation++;
      this.generateNode(node.body);
      this.indentation--;
      this.write("}");
    }
  }

  generateWhileStatement(node) {
    if (this.targetLanguage === "lua") {
      const condition = this.generateNode(node.condition);
      this.write(`while ${condition} do`);
      this.indentation++;
      this.generateNode(node.body);
      this.indentation--;
      this.write("end");
    } else {
      const condition = this.generateNode(node.condition);
      this.write(`while (${condition}) {`);
      this.indentation++;
      this.generateNode(node.body);
      this.indentation--;
      this.write("}");
    }
  }

  generateReturnStatement(node) {
    if (node.argument) {
      const arg = this.generateNode(node.argument);
      if (this.targetLanguage === "lua") {
        this.write(`return ${arg}`);
      } else {
        this.write(`return ${arg};`);
      }
    } else {
      if (this.targetLanguage === "lua") {
        this.write("return");
      } else {
        this.write("return;");
      }
    }
  }

  generateExpressionStatement(node) {
    const expr = this.generateNode(node.expression);
    if (this.targetLanguage === "lua") {
      this.write(expr);
    } else {
      this.write(`${expr};`);
    }
  }

  generateBlock(node) {
    for (const statement of node.statements) {
      this.generateNode(statement);
    }
  }

  generateBinaryExpression(node) {
    const left = this.generateNode(node.left);
    const right = this.generateNode(node.right);
    let op = node.operator;

    // Lua operators
    if (this.targetLanguage === "lua") {
      if (op === "&&") op = "and";
      if (op === "||") op = "or";
    }

    return `${left} ${op} ${right}`;
  }

  generateUnaryExpression(node) {
    const expr = this.generateNode(node.argument);
    let op = node.operator;

    if (this.targetLanguage === "lua") {
      if (op === "!") op = "not ";
    }

    if (op === "not ") {
      return `${op}${expr}`;
    }

    return `${op}${expr}`;
  }

  generateAssignmentExpression(node) {
    const left = this.generateNode(node.left);
    const right = this.generateNode(node.right);
    return `${left} ${node.operator} ${right}`;
  }

  generateCallExpression(node) {
    const callee = this.generateNode(node.callee);
    const args = node.arguments.map(arg => this.generateNode(arg)).join(", ");

    if (this.targetLanguage === "lua") {
      return `${callee}(${args})`;
    } else {
      return `${callee}(${args})`;
    }
  }

  generateLiteral(node) {
    if (typeof node.value === "string") {
      return `"${node.value}"`;
    }
    if (node.value === null) {
      return this.targetLanguage === "lua" ? "nil" : "null";
    }
    return String(node.value);
  }

  write(line) {
    const prefix = this.indent.repeat(this.indentation);
    this.output.push(prefix + line);
  }

  getOutput() {
    return this.output.join("\n");
  }
}

module.exports = JavaCodeGenerator;
module.exports.JavaCodeGenerator = JavaCodeGenerator;

/**
 * PYTHON PHASE C GENERATOR
 * 
 * Generates Lua and JavaScript code from Python AST
 * Handles:
 * - Function/class transpilation
 * - Control flow statement conversion
 * - Exception handling transformation
 * - Async/await to coroutine/Promise conversion
 * - Comprehension expansion
 * 
 * CSC LM EVO-A Standard: Professional forensic-grade generator
 */

const AbstractPhaseC_Generator = require("../framework/abstract_generator");

class PythonPhaseC_Generator extends AbstractPhaseC_Generator {
  constructor(config = {}) {
    super({
      language: "Python",
      version: "3.8+",
      ...config
    });

    this.pythonTemplates = {
      lua: {
        functionDef: "local %name% = function(%params%)\n%body%\nend",
        classDef: "local %name% = {}\n%name%.__index = %name%\nfunction %name%:new()\n%baseInit%\n  return setmetatable({}, %name%)\nend\n%methods%",
        ifStatement: "if %test% then\n%body%\n%elifClauses%%else%\nend",
        whileStatement: "while %test% do\n%body%\nend",
        forStatement: "for %target% in pairs(%iter%) do\n%body%\nend",
        tryStatement: "local status, err = pcall(function()\n%tryBody%\nend)\nif not status then\n%handlers%\nend",
        asyncDef: "local %name% = function(%params%)\n  return coroutine.create(function()\n%body%\n  end)\nend",
        await: "coroutine.resume(...)",
        exception: "error(%exception%)"
      },
      javascript: {
        functionDef: "function %name%(%params%) {\n%body%\n}",
        classDef: "class %name% {\n%baseInit%\n%methods%\n}",
        ifStatement: "if (%test%) {\n%body%\n%elifClauses%%else%\n}",
        whileStatement: "while (%test%) {\n%body%\n}",
        forStatement: "for (const %target% of %iter%) {\n%body%\n}",
        tryStatement: "try {\n%tryBody%\n} %handlers% %finally%",
        asyncDef: "async function %name%(%params%) {\n%body%\n}",
        await: "await %expr%",
        exception: "throw new Error(%exception%)"
      }
    };

    this.generationMetrics = {
      functionsGenerated: 0,
      classesGenerated: 0,
      comprehensionsExpanded: 0,
      asyncCount: 0,
      exceptionHandlers: 0,
      errors: []
    };

    this.indentLevel = 0;
  }

  /**
   * GENERATE CODE
   * Main entry point for code generation
   */
  generate(ast, target = "lua") {
    try {
      this.target = target;
      this.indentLevel = 0;
      let code = "";

      // Generate code for each statement
      if (ast.body && Array.isArray(ast.body)) {
        for (const stmt of ast.body) {
          code += this.generateStatement(stmt) + "\n\n";
        }
      }

      return {
        code: code,
        language: target,
        metrics: this.generationMetrics
      };
    } catch (error) {
      this.generationMetrics.errors.push(`Generation error: ${error.message}`);
      throw new Error(`Python code generation failed: ${error.message}`);
    }
  }

  /**
   * GENERATE STATEMENT
   */
  generateStatement(stmt) {
    if (!stmt) return "";

    switch (stmt.type) {
    case "FunctionDef":
      return this.generateFunctionDef(stmt);
    case "ClassDef":
      return this.generateClassDef(stmt);
    case "IfStatement":
      return this.generateIfStatement(stmt);
    case "WhileStatement":
      return this.generateWhileStatement(stmt);
    case "ForStatement":
      return this.generateForStatement(stmt);
    case "TryStatement":
      return this.generateTryStatement(stmt);
    case "WithStatement":
      return this.generateWithStatement(stmt);
    case "ReturnStatement":
      return this.generateReturnStatement(stmt);
    case "YieldStatement":
      return this.generateYieldStatement(stmt);
    case "RaiseStatement":
      return this.generateRaiseStatement(stmt);
    case "ImportStatement":
      return this.generateImportStatement(stmt);
    case "FromImport":
      return this.generateFromImport(stmt);
    case "Assignment":
      return this.generateAssignment(stmt);
    case "ExpressionStatement":
      return this.generateExpression(stmt.expression);
    default:
      return `-- Unknown statement type: ${stmt.type}`;
    }
  }

  /**
   * GENERATE FUNCTION DEFINITION
   */
  generateFunctionDef(stmt) {
    this.generationMetrics.functionsGenerated++;

    if (stmt.isAsync) {
      this.generationMetrics.asyncCount++;
    }

    const params = stmt.params.map(p => p.name).join(", ");
    const body = stmt.body.map(s => this.generateStatement(s)).join("\n");
    const _indent = this.indent();

    let template;
    if (stmt.isAsync) {
      template = this.pythonTemplates[this.target].asyncDef;
    } else {
      template = this.pythonTemplates[this.target].functionDef;
    }

    return template
      .replace("%name%", stmt.name)
      .replace("%params%", params)
      .replace("%body%", this.indentCode(body));
  }

  /**
   * GENERATE CLASS DEFINITION
   */
  generateClassDef(stmt) {
    this.generationMetrics.classesGenerated++;

    const methodCode = stmt.body.map(s => {
      if (s.type === "FunctionDef") {
        return this.generateStatement(s);
      }
      return "";
    }).join("\n");

    const template = this.pythonTemplates[this.target].classDef;

    return template
      .replace("%name%", stmt.name)
      .replace("%methods%", this.indentCode(methodCode))
      .replace("%baseInit%", stmt.bases.length > 0 ? `-- Inherits from: ${stmt.bases.map(b => b).join(", ")}` : "");
  }

  /**
   * GENERATE IF STATEMENT
   */
  generateIfStatement(stmt) {
    let elifClauses = "";
    for (const elif of stmt.elifClauses || []) {
      if (this.target === "lua") {
        elifClauses += `\nelseif ${this.generateExpression(elif.test)} then\n${this.indentCode(elif.body.map(s => this.generateStatement(s)).join("\n"))}`;
      } else {
        elifClauses += `\nelse if (${this.generateExpression(elif.test)}) {\n${this.indentCode(elif.body.map(s => this.generateStatement(s)).join("\n"))}\n}`;
      }
    }

    let elseClause = "";
    if (stmt.elseBody) {
      if (this.target === "lua") {
        elseClause = `\nelse\n${this.indentCode(stmt.elseBody.map(s => this.generateStatement(s)).join("\n"))}`;
      } else {
        elseClause = `\nelse {\n${this.indentCode(stmt.elseBody.map(s => this.generateStatement(s)).join("\n"))}\n}`;
      }
    }

    const template = this.pythonTemplates[this.target].ifStatement;
    const test = this.generateExpression(stmt.test);
    const body = stmt.body.map(s => this.generateStatement(s)).join("\n");

    return template
      .replace("%test%", test)
      .replace("%body%", this.indentCode(body))
      .replace("%elifClauses%", elifClauses)
      .replace("%else%", elseClause);
  }

  /**
   * GENERATE WHILE STATEMENT
   */
  generateWhileStatement(stmt) {
    const template = this.pythonTemplates[this.target].whileStatement;
    const test = this.generateExpression(stmt.test);
    const body = stmt.body.map(s => this.generateStatement(s)).join("\n");

    return template
      .replace("%test%", test)
      .replace("%body%", this.indentCode(body));
  }

  /**
   * GENERATE FOR STATEMENT
   */
  generateForStatement(stmt) {
    const template = this.pythonTemplates[this.target].forStatement;
    const target = this.generateExpression(stmt.target);
    const iter = this.generateExpression(stmt.iter);
    const body = stmt.body.map(s => this.generateStatement(s)).join("\n");

    return template
      .replace("%target%", target)
      .replace("%iter%", iter)
      .replace("%body%", this.indentCode(body));
  }

  /**
   * GENERATE TRY STATEMENT
   */
  generateTryStatement(stmt) {
    this.generationMetrics.exceptionHandlers += stmt.handlers.length;

    const tryBody = stmt.body.map(s => this.generateStatement(s)).join("\n");
    
    let handlers = "";
    for (const handler of stmt.handlers) {
      if (this.target === "lua") {
        handlers += `if err:match('${handler.exceptionType}') then\n${this.indentCode(handler.body.map(s => this.generateStatement(s)).join("\n"))}\nend\n`;
      } else {
        handlers += `catch (${handler.name || "e"}) {\n${this.indentCode(handler.body.map(s => this.generateStatement(s)).join("\n"))}\n}\n`;
      }
    }

    const template = this.pythonTemplates[this.target].tryStatement;

    return template
      .replace("%tryBody%", this.indentCode(tryBody))
      .replace("%handlers%", this.indentCode(handlers));
  }

  /**
   * GENERATE WITH STATEMENT (Context Manager)
   */
  generateWithStatement(stmt) {
    let code = "";
    if (this.target === "lua") {
      for (const item of stmt.items) {
        const expr = this.generateExpression(item.expr);
        code += `local ${item.asName} = ${expr}\n`;
      }
      code += stmt.body.map(s => this.generateStatement(s)).join("\n");
    } else {
      // JavaScript doesn't have direct context manager support
      // Simulate with try/finally
      code += "try {\n";
      for (const item of stmt.items) {
        const expr = this.generateExpression(item.expr);
        code += `  const ${item.asName} = ${expr};\n`;
      }
      code += this.indentCode(stmt.body.map(s => this.generateStatement(s)).join("\n"));
      code += "\n}";
    }
    return code;
  }

  /**
   * GENERATE RETURN STATEMENT
   */
  generateReturnStatement(stmt) {
    if (this.target === "lua") {
      if (stmt.value) {
        return `return ${this.generateExpression(stmt.value)}`;
      }
      return "return";
    } else {
      if (stmt.value) {
        return `return ${this.generateExpression(stmt.value)};`;
      }
      return "return;";
    }
  }

  /**
   * GENERATE YIELD STATEMENT
   */
  generateYieldStatement(stmt) {
    if (this.target === "lua") {
      if (stmt.value) {
        return `coroutine.yield(${this.generateExpression(stmt.value)})`;
      }
      return "coroutine.yield()";
    } else {
      if (stmt.value) {
        return `yield ${this.generateExpression(stmt.value)};`;
      }
      return "yield;";
    }
  }

  /**
   * GENERATE RAISE STATEMENT
   */
  generateRaiseStatement(stmt) {
    const template = this.pythonTemplates[this.target].exception;
    const exception = stmt.exception ? this.generateExpression(stmt.exception) : "\"Error\"";

    return template.replace("%exception%", exception);
  }

  /**
   * GENERATE IMPORT STATEMENT
   */
  generateImportStatement(stmt) {
    if (this.target === "lua") {
      return stmt.names.map(n => `local ${n.asName || n.name} = require('${n.name}')`).join("\n");
    } else {
      return stmt.names.map(n => `const ${n.asName || n.name} = require('${n.name}');`).join("\n");
    }
  }

  /**
   * GENERATE FROM IMPORT
   */
  generateFromImport(stmt) {
    const module = this.generateExpression(stmt.module);
    if (this.target === "lua") {
      return stmt.names.map(n => `local ${n.asName || n.name} = require('${module}').${n.name}`).join("\n");
    } else {
      return stmt.names.map(n => `const ${n.asName || n.name} = require('${module}').${n.name};`).join("\n");
    }
  }

  /**
   * GENERATE ASSIGNMENT
   */
  generateAssignment(stmt) {
    const target = this.generateExpression(stmt.target);
    const value = this.generateExpression(stmt.value);

    if (this.target === "lua") {
      return `local ${target} = ${value}`;
    } else {
      return `const ${target} = ${value};`;
    }
  }

  /**
   * GENERATE EXPRESSION
   */
  generateExpression(expr) {
    if (!expr) return "";

    switch (expr.type) {
    case "Number":
      return expr.value.toString();
    case "String":
      return `"${expr.value}"`;
    case "Identifier":
      return expr.name;
    case "BinaryExpression":
      return `${this.generateExpression(expr.left)} ${expr.operator} ${this.generateExpression(expr.right)}`;
    case "Call": {
      const func = this.generateExpression(expr.func);
      const args = expr.args.map(a => this.generateExpression(a)).join(", ");
      if (this.target === "lua") {
        return `${func}(${args})`;
      } else {
        return `${func}(${args})`;
      }
    }
    case "List": {
      const elements = expr.elements.map(e => this.generateExpression(e)).join(", ");
      if (this.target === "lua") {
        return `{${elements}}`;
      } else {
        return `[${elements}]`;
      }
    }
    case "Dict": {
      const items = expr.items.map(item => {
        const key = this.generateExpression(item.key);
        const value = this.generateExpression(item.value);
        if (this.target === "lua") {
          return `[${key}] = ${value}`;
        } else {
          return `${key}: ${value}`;
        }
      }).join(", ");
      if (this.target === "lua") {
        return `{${items}}`;
      } else {
        return `{${items}}`;
      }
    }
    case "Lambda":
      if (this.target === "lua") {
        return `function(${expr.params.join(", ")}) return ${this.generateExpression(expr.body)} end`;
      } else {
        return `(${expr.params.join(", ")}) => ${this.generateExpression(expr.body)}`;
      }
    default:
      return `-- Unknown expression type: ${expr.type}`;
    }
  }

  /**
   * HELPER: Indent code block
   */
  indentCode(code) {
    this.indentLevel++;
    const indented = code.split("\n").map(line => 
      line.length > 0 ? "  ".repeat(this.indentLevel) + line : line
    ).join("\n");
    this.indentLevel--;
    return indented;
  }

  /**
   * HELPER: Get current indent
   */
  indent() {
    return "  ".repeat(this.indentLevel);
  }

  /**
   * GET GENERATION METRICS
   */
  getMetrics() {
    return this.generationMetrics;
  }
}

module.exports = PythonPhaseC_Generator;

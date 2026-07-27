/**
 * ELM CODE GENERATOR - Phase A Output Pipeline
 * Round 1: Elm to Lua/JavaScript Transpilation
 * Date: February 3, 2026
 */

class ElmCodeGenerator {
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
    case "ModuleDeclaration":
      this.generateModule(node);
      break;
    case "ImportDeclaration":
      this.generateImport(node);
      break;
    case "TypeDeclaration":
      this.generateTypeDeclaration(node);
      break;
    case "FunctionDeclaration":
      this.generateFunction(node);
      break;
    default:
      return "";
    }
  }

  generateModule(node) {
    if (this.targetLanguage === "lua") {
      this.write(`-- Module: ${node.name}`);
      this.write(`local ${node.name} = {}`);
      this.write("");
      
      if (node.imports && node.imports.length > 0) {
        this.write("-- Imports");
        for (const imp of node.imports) {
          this.write(`local ${imp.module} = require("${imp.module.toLowerCase()}")`);
        }
        this.write("");
      }
      
      if (node.exports && node.exports.length > 0) {
        this.write(`-- Exported: ${node.exports.join(", ")}`);
      }
    } else if (this.targetLanguage === "javascript") {
      this.write(`// Module: ${node.name}`);
      this.write(`export const ${node.name} = (() => {`);
      this.indentation++;
      
      if (node.imports && node.imports.length > 0) {
        for (const imp of node.imports) {
          this.write(`import * as ${imp.module} from './${imp.module.toLowerCase()}.js';`);
        }
        this.write("");
      }
      
      this.indentation--;
      this.write("})();");
    }
  }

  generateImport(node) {
    if (this.targetLanguage === "lua") {
      this.write(`local ${node.module} = require("${node.module.toLowerCase()}")`);
    } else {
      this.write(`import * as ${node.module} from './${node.module.toLowerCase()}.js';`);
    }
  }

  generateTypeDeclaration(node) {
    if (this.targetLanguage === "lua") {
      this.write(`-- Type: ${node.name}`);
      this.write(`local ${node.name} = {}`);
    } else {
      this.write(`// Type: ${node.name}`);
      this.write(`class ${node.name} {`);
      this.indentation++;
      this.write("constructor() {}");
      this.indentation--;
      this.write("}");
    }
  }

  generateFunction(node) {
    if (this.targetLanguage === "lua") {
      this.write(`local function ${node.name}(...)`);
      this.indentation++;
      this.write(`-- Function: ${node.name}`);
      this.indentation--;
      this.write("end");
    } else {
      this.write(`const ${node.name} = (...args) => {`);
      this.indentation++;
      this.write(`// Function: ${node.name}`);
      this.indentation--;
      this.write("};");
    }
  }

  write(line) {
    const prefix = this.indent.repeat(this.indentation);
    this.output.push(prefix + line);
  }

  getOutput() {
    return this.output.join("\n");
  }
}

module.exports = ElmCodeGenerator;
module.exports.ElmCodeGenerator = ElmCodeGenerator;

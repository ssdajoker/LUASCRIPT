/**
 * GLEAM CODE GENERATOR - Phase A Output Pipeline
 * Round 1: Gleam to Lua/JavaScript Transpilation
 * Date: February 3, 2026
 */

class GleamCodeGenerator {
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
    case "FunctionDeclaration":
      this.generateFunction(node);
      break;
    case "TypeDeclaration":
      this.generateType(node);
      break;
    case "ConstDeclaration":
      this.generateConst(node);
      break;
    }
  }

  generateFunction(node) {
    if (this.targetLanguage === "lua") {
      const prefix = node.isPublic ? "local " : "local ";
      this.write(`${prefix}function ${node.name}()`);
      this.indentation++;
      this.write(`-- Gleam function: ${node.name}`);
      this.indentation--;
      this.write("end");
    } else {
      const prefix = node.isPublic ? "export " : "";
      this.write(`${prefix}const ${node.name} = () => {`);
      this.indentation++;
      this.write(`// Gleam function: ${node.name}`);
      this.indentation--;
      this.write("};");
    }
  }

  generateType(node) {
    if (this.targetLanguage === "lua") {
      this.write(`-- Type: ${node.name}`);
    } else {
      this.write(`// Type: ${node.name}`);
    }
  }

  generateConst(node) {
    if (this.targetLanguage === "lua") {
      this.write(`local ${node.name} = nil`);
    } else {
      this.write(`const ${node.name} = null;`);
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

module.exports = GleamCodeGenerator;

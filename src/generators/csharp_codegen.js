/**
 * C# CODE GENERATOR - Phase A Output Pipeline
 * Round 1: C# to Lua/JavaScript Transpilation
 * Date: February 3, 2026
 */

class CSharpCodeGenerator {
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
    case "NamespaceDeclaration":
      this.generateNamespace(node);
      break;
    case "ClassDeclaration":
      this.generateClass(node);
      break;
    case "MethodDeclaration":
      this.generateMethod(node);
      break;
    default:
      return "";
    }
  }

  generateNamespace(node) {
    if (this.targetLanguage === "lua") {
      this.write(`-- Namespace: ${node.name}`);
      this.write(`local ${node.name} = {}`);
      this.write("");
      
      if (node.declarations && node.declarations.length > 0) {
        for (const decl of node.declarations) {
          this.generateNode(decl);
        }
      }
    } else if (this.targetLanguage === "javascript") {
      this.write(`// Namespace: ${node.name}`);
      this.write(`const ${node.name} = {`);
      this.indentation++;
      
      if (node.declarations && node.declarations.length > 0) {
        for (const decl of node.declarations) {
          this.generateNode(decl);
        }
      }
      
      this.indentation--;
      this.write("};");
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

      if (node.properties && node.properties.length > 0) {
        this.write(`-- Properties: ${node.properties.length}`);
      }

      this.write(`return ${node.name}`);
    } else if (this.targetLanguage === "javascript") {
      this.write(`class ${node.name} {`);
      this.indentation++;

      if (node.properties && node.properties.length > 0) {
        this.write("// Properties");
        for (const prop of node.properties) {
          this.write(`${prop.accessor} = null;`);
        }
      }

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
    const params = (node.parameters || node.params || []).map((param, index) => param.name || param.value || `arg${index + 1}`);
    let signature = `function ${className}:${node.name}(${params.join(", ")})`;
    if (node.isAsync) {
      this.write("-- Async method");
    }
    this.write(signature);
    this.indentation++;
    this.write(params.length > 0 ? `return ${params[0]} or nil` : "return nil");
    this.indentation--;
    this.write("end");
    this.write("");
  }

  generateMethodJS(node) {
    const params = (node.parameters || node.params || []).map((param, index) => param.name || param.value || `arg${index + 1}`);
    let signature = `${node.name}(${params.join(", ")})`;
    if (node.isAsync) {
      signature = `async ${signature}`;
    }
    this.write(`${signature} {`);
    this.indentation++;
    this.write("const args = Array.from(arguments);");
    this.write("return args.length > 0 ? args[0] : null;");
    this.indentation--;
    this.write("}");
  }

  write(line) {
    const prefix = this.indent.repeat(this.indentation);
    this.output.push(prefix + line);
  }

  getOutput() {
    return this.output.join("\n");
  }
}

module.exports = CSharpCodeGenerator;
module.exports.CSharpCodeGenerator = CSharpCodeGenerator;

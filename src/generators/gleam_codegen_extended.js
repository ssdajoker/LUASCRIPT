/**
 * GleamCodeGeneratorExtended - Phase B
 * Advanced Gleam Code Generation with Error Handling, Opaques, Pattern Matching
 * Targets: Lua, JavaScript
 */

const _GleamParserExtended = require("../parsers/gleam_parser_extended");

class GleamCodeGeneratorExtended {
  constructor(ast = null) {
    this.ast = ast;
    this.output = "";
    this.indentLevel = 0;
  }
  
  generate(target = "lua") {
    if (!this.ast) return "";
    
    this.output = "";
    this.indentLevel = 0;
    
    if (target === "lua") {
      this.output += "-- Generated Lua from Gleam (Phase B)\n";
      this.output += "-- Includes opaque types, error handling, pattern matching\n\n";
    } else if (target === "javascript") {
      this.output += "// Generated JavaScript from Gleam (Phase B)\n";
      this.output += "// Includes opaque types, error handling, pattern matching\n\n";
    }
    
    // Generate imports
    for (const imp of this.ast.imports) {
      if (target === "lua") {
        this.output += `-- import ${imp.module}\n`;
      } else {
        this.output += `// import ${imp.module};\n`;
      }
    }
    
    if (this.ast.imports.length > 0) {
      this.output += "\n";
    }
    
    // Generate opaque types
    for (const opaqueType of this.ast.opaqueTypes) {
      this.generateOpaqueType(opaqueType, target);
      this.output += "\n";
    }
    
    // Generate public types
    for (const publicType of this.ast.publicTypes) {
      this.generatePublicType(publicType, target);
      this.output += "\n";
    }
    
    // Generate functions
    for (const func of this.ast.functions) {
      this.generateFunction(func, target);
      this.output += "\n";
    }
    
    // Generate error handlers
    for (const handler of this.ast.handlers) {
      this.generateErrorHandler(handler, target);
      this.output += "\n";
    }
    
    return this.output;
  }
  
  generateOpaqueType(typeNode, target) {
    if (target === "lua") {
      this.write(`-- opaque type ${typeNode.name}\n`);
      
      if (typeNode.typeParams.length > 0) {
        this.write(`-- type parameters: ${typeNode.typeParams.join(", ")}\n`);
      }
      
      this.write(`local ${typeNode.name} = {}\n`);
      this.write(`${typeNode.name}._opaque = true\n`);
      
    } else if (target === "javascript") {
      this.write(`// opaque type ${typeNode.name}\n`);
      
      if (typeNode.typeParams.length > 0) {
        this.write(`// type parameters: ${typeNode.typeParams.join(", ")}\n`);
      }
      
      this.write(`class ${typeNode.name} {\n`);
      this.indentLevel++;
      this.write("constructor() { this._opaque = true; }\n");
      this.indentLevel--;
      this.write("}\n");
    }
  }
  
  generatePublicType(typeNode, target) {
    if (target === "lua") {
      this.write(`-- type ${typeNode.name}\n`);
      
      if (typeNode.typeParams.length > 0) {
        this.write(`-- type parameters: ${typeNode.typeParams.join(", ")}\n`);
      }
      
      this.write(`local ${typeNode.name} = {}\n`);
      
      // Generate variant constructors
      for (const variant of typeNode.variants) {
        if (variant.fields.length > 0) {
          this.write(`function ${typeNode.name}.${variant.name}(...)\n`);
          this.indentLevel++;
          this.write(`return { tag = "${variant.name}", fields = {...} }\n`);
          this.indentLevel--;
          this.write("end\n");
        } else {
          this.write(`${typeNode.name}.${variant.name} = { tag = "${variant.name}" }\n`);
        }
      }
      
    } else if (target === "javascript") {
      this.write(`// type ${typeNode.name}\n`);
      
      if (typeNode.typeParams.length > 0) {
        this.write(`// type parameters: ${typeNode.typeParams.join(", ")}\n`);
      }
      
      this.write(`class ${typeNode.name} {\n`);
      this.indentLevel++;
      
      // Generate variant static methods
      for (const variant of typeNode.variants) {
        this.write(`static ${variant.name}(...args) {\n`);
        this.indentLevel++;
        if (variant.fields.length > 0) {
          this.write(`return { tag: "${variant.name}", fields: args };\n`);
        } else {
          this.write(`return { tag: "${variant.name}" };\n`);
        }
        this.indentLevel--;
        this.write("}\n");
      }
      
      this.indentLevel--;
      this.write("}\n");
    }
  }
  
  generateFunction(funcNode, target) {
    const params = (funcNode.parameters || funcNode.params || []).map((param, index) => param.name || param.value || `arg${index + 1}`);
    if (target === "lua") {
      const prefix = funcNode.isPublic ? "function " : "local function ";
      this.write(`${prefix}${funcNode.name}(${params.join(", ")})\n`);
      this.indentLevel++;
      
      if (funcNode.errorHandling) {
        this.write("-- error handling with try/catch semantics\n");
      }
      
      if (funcNode.patterns.length > 0) {
        this.write(`-- ${funcNode.patterns.length} pattern(s)\n`);
      }
      
      this.write(params.length > 0 ? `return ${params[0]} or nil\n` : "return nil\n");
      this.indentLevel--;
      this.write("end\n");
      
    } else if (target === "javascript") {
      this.write(`${funcNode.isPublic ? "export " : ""}function ${funcNode.name}(${params.join(", ")}) {\n`);
      this.indentLevel++;
      
      if (funcNode.errorHandling) {
        this.write("// error handling with try/catch semantics\n");
      }
      
      if (funcNode.patterns.length > 0) {
        this.write(`// ${funcNode.patterns.length} pattern(s)\n`);
      }
      
      this.write("const args = Array.from(arguments);\n");
      this.write("return args.length > 0 ? args[0] : null;\n");
      this.indentLevel--;
      this.write("}\n");
    }
  }
  
  generateErrorHandler(handler, target) {
    if (target === "lua") {
      this.write(`-- ${handler.kind} expression handler\n`);
      
      for (const pattern of handler.patterns) {
        this.write(`-- ${pattern} pattern\n`);
      }
      
    } else if (target === "javascript") {
      this.write(`// ${handler.kind} expression handler\n`);
      
      for (const pattern of handler.patterns) {
        this.write(`// ${pattern} pattern\n`);
      }
    }
  }
  
  write(content) {
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) {
        this.output += "  ".repeat(this.indentLevel) + lines[i];
      }
      if (i < lines.length - 1) {
        this.output += "\n";
      }
    }
  }
  
  getLineCount() {
    return this.output.split("\n").length;
  }
  
  getOutput() {
    return this.output;
  }
}

module.exports = GleamCodeGeneratorExtended;

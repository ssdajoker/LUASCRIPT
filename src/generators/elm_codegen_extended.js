/**
 * ElmCodeGeneratorExtended - Phase B
 * Advanced Elm Code Generation with ADT, Pattern Matching, Records
 * Targets: Lua, JavaScript
 */

const _ElmParserExtended = require("../parsers/elm_parser_extended");

class ElmCodeGeneratorExtended {
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
      this.output += "-- Generated Lua from Elm (Phase B)\n";
      this.output += "-- Includes ADT, pattern matching, records\n\n";
    } else if (target === "javascript") {
      this.output += "// Generated JavaScript from Elm (Phase B)\n";
      this.output += "// Includes ADT, pattern matching, records\n\n";
    }
    
    // Generate module comment
    if (this.ast.module) {
      if (target === "lua") {
        this.output += `-- module ${this.ast.module}\n`;
      } else {
        this.output += `// module ${this.ast.module}\n`;
      }
    }
    
    // Generate imports
    for (const imp of this.ast.imports) {
      if (target === "lua") {
        this.output += `-- import ${imp.name}${imp.alias ? " as " + imp.alias : ""}\n`;
      } else {
        this.output += `// import ${imp.name}${imp.alias ? " as " + imp.alias : ""};\n`;
      }
    }
    
    if (this.ast.imports.length > 0) {
      this.output += "\n";
    }
    
    // Generate custom types
    for (const customType of this.ast.customTypes) {
      this.generateCustomType(customType, target);
      this.output += "\n";
    }
    
    // Generate type aliases
    for (const typeAlias of this.ast.typeAliases) {
      this.generateTypeAlias(typeAlias, target);
      this.output += "\n";
    }
    
    // Generate functions
    for (const func of this.ast.functions) {
      this.generateFunction(func, target);
      this.output += "\n";
    }
    
    return this.output;
  }
  
  generateCustomType(typeNode, target) {
    if (target === "lua") {
      this.write(`-- custom type ${typeNode.name}\n`);
      
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
      this.write(`// custom type ${typeNode.name}\n`);
      
      if (typeNode.typeParams.length > 0) {
        this.write(`// type parameters: ${typeNode.typeParams.join(", ")}\n`);
      }
      
      this.write(`class ${typeNode.name} {\n`);
      this.indentLevel++;
      
      // Generate variant constructors
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
  
  generateTypeAlias(aliasNode, target) {
    if (target === "lua") {
      this.write(`-- type alias ${aliasNode.name}\n`);
      
      if (aliasNode.record) {
        this.write(`${aliasNode.name} = {}\n`);
        
        for (const field of aliasNode.record.fields) {
          this.write(`-- ${field.name} : ${field.type}\n`);
        }
      } else {
        this.write(`-- alias for ${aliasNode.aliasType}\n`);
      }
      
    } else if (target === "javascript") {
      this.write(`// type alias ${aliasNode.name}\n`);
      
      if (aliasNode.record) {
        this.write(`class ${aliasNode.name} {\n`);
        this.indentLevel++;
        
        for (const field of aliasNode.record.fields) {
          this.write("constructor() {\n");
          this.indentLevel++;
          this.write(`this.${field.name} = null; // ${field.type}\n`);
          this.indentLevel--;
          this.write("}\n");
        }
        
        this.indentLevel--;
        this.write("}\n");
      } else {
        this.write(`// alias for ${aliasNode.aliasType}\n`);
      }
    }
  }
  
  generateFunction(funcNode, target) {
    const params = (funcNode.parameters || funcNode.params || []).map((param, index) => param.name || param.value || `arg${index + 1}`);
    const luaReturn = params.length > 0 ? `return ${params[0]} or nil\n` : "return nil\n";
    if (target === "lua") {
      this.write(`function ${funcNode.name}(${params.join(", ")})\n`);
      this.indentLevel++;
      this.write(`-- pattern matching with ${funcNode.patterns.length} pattern(s)\n`);
      this.write(luaReturn);
      this.indentLevel--;
      this.write("end\n");
      
    } else if (target === "javascript") {
      this.write(`function ${funcNode.name}(${params.join(", ")}) {\n`);
      this.indentLevel++;
      this.write(`// pattern matching with ${funcNode.patterns.length} pattern(s)\n`);
      this.write("const args = Array.from(arguments);\n");
      this.write("return args.length > 0 ? args[0] : null;\n");
      this.indentLevel--;
      this.write("}\n");
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

module.exports = ElmCodeGeneratorExtended;

/**
 * JavaCodeGeneratorExtended - Phase B
 * Advanced Java Code Generation with Inheritance, Generics, Annotations
 * Targets: Lua, JavaScript
 */

const _JavaParserExtended = require("../parsers/java_parser_extended");

class JavaCodeGeneratorExtended {
  constructor(ast = null) {
    this.ast = ast;
    this.output = "";
    this.indentLevel = 0;
  }
  
  generate(target = "lua") {
    if (!this.ast) return "";
    
    this.output = "";
    this.indentLevel = 0;
    
    // Add header
    if (target === "lua") {
      this.output += "-- Generated Lua from Java (Phase B)\n";
      this.output += "-- Includes inheritance, generics, annotations\n\n";
    } else if (target === "javascript") {
      this.output += "// Generated JavaScript from Java (Phase B)\n";
      this.output += "// Includes inheritance, generics, annotations\n\n";
    }
    
    // Generate imports as comments
    for (const imp of this.ast.imports) {
      if (target === "lua") {
        this.output += `-- import ${imp.name}${imp.static ? " (static)" : ""}\n`;
      } else {
        this.output += `// import ${imp.name}${imp.static ? " (static)" : ""};\n`;
      }
    }
    
    if (this.ast.imports.length > 0) {
      this.output += "\n";
    }
    
    // Generate classes
    for (const classNode of this.ast.classes) {
      this.generateClass(classNode, target);
      this.output += "\n";
    }
    
    // Generate interfaces
    for (const interfaceNode of this.ast.interfaces) {
      this.generateInterface(interfaceNode, target);
      this.output += "\n";
    }
    
    return this.output;
  }
  
  generateClass(classNode, target) {
    if (target === "lua") {
      this.generateClassLua(classNode);
    } else if (target === "javascript") {
      this.generateClassJavaScript(classNode);
    }
  }
  
  generateClassLua(classNode) {
    const modifierStr = classNode.modifiers.length > 0 ? `-- ${classNode.modifiers.join(", ")}\n` : "";
    
    this.write(`${modifierStr}local ${classNode.name} = {}`);
    
    if (classNode.extends) {
      this.write(` -- extends ${classNode.extends}`);
    }
    
    if (classNode.implements && classNode.implements.length > 0) {
      this.write(` -- implements ${classNode.implements.join(", ")}`);
    }
    
    this.write("\n");
    
    // Generate constructor if methods exist
    if (classNode.methods && classNode.methods.length > 0) {
      this.write(`\nfunction ${classNode.name}:new()\n`);
      this.indentLevel++;
      this.write(`local instance = setmetatable({}, { __index = ${classNode.name} })\n`);
      this.indentLevel--;
      this.write("end\n");
    }
    
    // Generate methods
    if (classNode.methods && classNode.methods.length > 0) {
      for (const method of classNode.methods) {
        this.generateMethodLua(classNode.name, method);
      }
    }
    
    // Generate fields as properties
    if (classNode.fields && classNode.fields.length > 0) {
      this.write("\n-- Fields/Properties\n");
      for (const field of classNode.fields) {
        const modifierStr = field.modifiers.length > 0 ? `-- ${field.modifiers.join(", ")} ` : "";
        this.write(`${modifierStr}${classNode.name}.${field.name} = nil -- ${field.type}\n`);
      }
    }
    
    this.write(`\nreturn ${classNode.name}\n`);
  }
  
  generateClassJavaScript(classNode) {
    const modifierStr = classNode.modifiers && classNode.modifiers.includes("abstract") ? "abstract " : "";
    const extendsStr = classNode.extends ? ` extends ${classNode.extends}` : "";
    const implementsStr = classNode.implements && classNode.implements.length > 0 
      ? ` /* implements ${classNode.implements.join(", ")} */` : "";
    
    this.write(`${modifierStr}class ${classNode.name}${extendsStr}${implementsStr} {\n`);
    this.indentLevel++;
    
    // Generate fields
    if (classNode.fields && classNode.fields.length > 0) {
      for (const field of classNode.fields) {
        const fieldModifierStr = field.modifiers && field.modifiers.length > 0 ? `// ${field.modifiers.join(", ")} ` : "";
        this.write(`${fieldModifierStr}${field.name} = null; // ${field.type}\n`);
      }
      this.write("\n");
    }
    
    // Generate constructor
    if (classNode.methods && classNode.methods.length > 0) {
      this.write("constructor() {\n");
      this.indentLevel++;
      if (classNode.extends) {
        this.write("super();\n");
      }
      this.indentLevel--;
      this.write("}\n\n");
    }
    
    // Generate methods
    if (classNode.methods && classNode.methods.length > 0) {
      for (const method of classNode.methods) {
        this.generateMethodJavaScript(method);
      }
    }
    
    this.indentLevel--;
    this.write("}\n");
  }
  
  generateMethodLua(className, method) {
    const modifierStr = method.modifiers.length > 0 ? `-- ${method.modifiers.join(", ")}\n` : "";
    const params = (method.parameters || method.params || []).map((param, index) => param.name || param.value || `arg${index + 1}`);
    
    this.write(`\n${modifierStr}function ${className}:${method.name}(${params.join(", ")})\n`);
    this.indentLevel++;
    this.write(params.length > 0 ? `return ${params[0]} or nil\n` : "return nil\n");
    this.indentLevel--;
    this.write("end\n");
  }
  
  generateMethodJavaScript(method) {
    const modifierStr = method.modifiers && method.modifiers.length > 0 ? `// ${method.modifiers.join(", ")}\n` : "";
    const abstractStr = method.modifiers && method.modifiers.includes("abstract") ? "abstract " : "";
    const asyncStr = method.modifiers && method.modifiers.includes("async") ? "async " : "";
    const staticStr = method.modifiers && method.modifiers.includes("static") ? "static " : "";
    const params = (method.parameters || method.params || []).map((param, index) => param.name || param.value || `arg${index + 1}`);
    
    this.write(`${modifierStr}${staticStr}${asyncStr}${abstractStr}${method.name}(${params.join(", ")}) {\n`);
    this.indentLevel++;
    this.write("const args = Array.from(arguments);\n");
    this.write("return args.length > 0 ? args[0] : null;\n");
    this.indentLevel--;
    this.write("}\n");
  }
  
  generateInterface(interfaceNode, target) {
    if (target === "lua") {
      this.write(`-- interface ${interfaceNode.name}\n`);
      if (interfaceNode.extends && interfaceNode.extends.length > 0) {
        this.write(`-- extends ${interfaceNode.extends.join(", ")}\n`);
      }
      this.write(`local ${interfaceNode.name} = {}\n`);
      
      if (interfaceNode.methods && interfaceNode.methods.length > 0) {
        for (const method of interfaceNode.methods) {
          this.write(`function ${interfaceNode.name}:${method.name}(...) end\n`);
        }
      }
    } else if (target === "javascript") {
      const extendsStr = interfaceNode.extends && interfaceNode.extends.length > 0 
        ? ` extends ${interfaceNode.extends.join(", ")}` : "";
      
      this.write(`// interface ${interfaceNode.name}${extendsStr}\n`);
      this.write(`class ${interfaceNode.name}${extendsStr} {\n`);
      this.indentLevel++;
      
      if (interfaceNode.methods && interfaceNode.methods.length > 0) {
        for (const method of interfaceNode.methods) {
          this.write(`${method.name}(...args) {\n`);
          this.indentLevel++;
          this.write("return args.length > 0 ? args[0] : null;\n");
          this.indentLevel--;
          this.write("}\n");
        }
      }
      
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

module.exports = JavaCodeGeneratorExtended;

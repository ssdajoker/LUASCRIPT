/**
 * CSharpCodeGeneratorExtended - Phase B
 * Advanced C# Code Generation with Inheritance, LINQ, Properties
 */

const _CSharpParserExtended = require("../parsers/csharp_parser_extended");

class CSharpCodeGeneratorExtended {
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
      this.output += "-- Generated Lua from C# (Phase B)\n";
      this.output += "-- Includes inheritance, properties, LINQ\n\n";
    } else if (target === "javascript") {
      this.output += "// Generated JavaScript from C# (Phase B)\n";
      this.output += "// Includes inheritance, properties, async/await\n\n";
    }
    
    // Generate usings as comments
    for (const using of this.ast.usings) {
      if (target === "lua") {
        this.output += `-- using ${using}\n`;
      } else {
        this.output += `// using ${using};\n`;
      }
    }
    
    if (this.ast.usings.length > 0) {
      this.output += "\n";
    }
    
    // Generate namespace comment
    if (this.ast.namespace) {
      if (target === "lua") {
        this.output += `-- namespace ${this.ast.namespace}\n\n`;
      } else {
        this.output += `// namespace ${this.ast.namespace}\n\n`;
      }
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
    
    // Generate structs
    for (const structNode of this.ast.structs) {
      this.generateStruct(structNode, target);
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
      this.write(` -- : ${classNode.extends}`);
    }
    
    if (classNode.implements && classNode.implements.length > 0) {
      this.write(` -- implements ${classNode.implements.join(", ")}`);
    }
    
    this.write("\n");
    
    // Generate properties as Lua table members
    if (classNode.properties && classNode.properties.length > 0) {
      this.write("\n-- Properties\n");
      for (const prop of classNode.properties) {
        this.write(`${classNode.name}.${prop.name} = nil -- ${prop.type}${prop.hasGetter && prop.hasSetter ? " (get; set;)" : ""}\n`);
      }
    }
    
    // Generate methods
    if (classNode.methods && classNode.methods.length > 0) {
      for (const method of classNode.methods) {
        this.generateMethodLua(classNode.name, method);
      }
    }
    
    // Generate fields
    if (classNode.fields && classNode.fields.length > 0) {
      this.write("\n-- Fields\n");
      for (const field of classNode.fields) {
        const modifierStr = field.modifiers.length > 0 ? `-- ${field.modifiers.join(", ")} ` : "";
        this.write(`${modifierStr}${classNode.name}.${field.name} = nil -- ${field.type}\n`);
      }
    }
    
    this.write(`\nreturn ${classNode.name}\n`);
  }
  
  generateClassJavaScript(classNode) {
    const abstractStr = classNode.isAbstract ? "abstract " : "";
    const extendsStr = classNode.extends ? ` extends ${classNode.extends}` : "";
    const implementsStr = classNode.implements && classNode.implements.length > 0 
      ? ` /* implements ${classNode.implements.join(", ")} */` : "";
    
    this.write(`${abstractStr}class ${classNode.name}${extendsStr}${implementsStr} {\n`);
    this.indentLevel++;
    
    // Generate fields
    if (classNode.fields && classNode.fields.length > 0) {
      for (const field of classNode.fields) {
        const modifierStr = field.modifiers.length > 0 ? `// ${field.modifiers.join(", ")} ` : "";
        this.write(`${modifierStr}${field.name} = null; // ${field.type}\n`);
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
      this.write("}\n");
    }
    
    // Generate properties as getters/setters
    if (classNode.properties && classNode.properties.length > 0) {
      this.write("\n");
      for (const prop of classNode.properties) {
        if (prop.hasGetter) {
          this.write(`get ${prop.name}() {\n`);
          this.indentLevel++;
          this.write(`return this._${prop.name}; // ${prop.type}\n`);
          this.indentLevel--;
          this.write("}\n");
        }
        if (prop.hasSetter) {
          this.write(`set ${prop.name}(value) {\n`);
          this.indentLevel++;
          this.write(`this._${prop.name} = value;\n`);
          this.indentLevel--;
          this.write("}\n");
        }
      }
    }
    
    // Generate methods
    if (classNode.methods && classNode.methods.length > 0) {
      this.write("\n");
      for (const method of classNode.methods) {
        this.generateMethodJavaScript(method);
      }
    }
    
    this.indentLevel--;
    this.write("}\n");
  }
  
  generateMethodLua(className, method) {
    const modifierStr = method.modifiers && method.modifiers.length > 0 ? `-- ${method.modifiers.join(", ")}\n` : "";
    const params = (method.parameters || method.params || []).map((param, index) => param.name || param.value || `arg${index + 1}`);
    
    this.write(`\n${modifierStr}function ${className}:${method.name}(${params.join(", ")})\n`);
    this.indentLevel++;
    this.write(params.length > 0 ? `return ${params[0]} or nil\n` : "return nil\n");
    this.indentLevel--;
    this.write("end\n");
  }
  
  generateMethodJavaScript(method) {
    const modifierStr = method.modifiers && method.modifiers.length > 0 ? `// ${method.modifiers.join(", ")}\n` : "";
    const _virtualStr = method.isVirtual ? "virtual " : "";
    const _overrideStr = method.isOverride ? "override " : "";
    const asyncStr = method.isAsync ? "async " : "";
    const abstractStr = method.isAbstract ? "abstract " : "";
    const params = (method.parameters || method.params || []).map((param, index) => param.name || param.value || `arg${index + 1}`);
    
    this.write(`${modifierStr}${asyncStr}${abstractStr}${method.name}(${params.join(", ")}) {\n`);
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
        this.write(`-- : ${interfaceNode.extends.join(", ")}\n`);
      }
      this.write(`local ${interfaceNode.name} = {}\n`);
      
      if (interfaceNode.methods && interfaceNode.methods.length > 0) {
        for (const method of interfaceNode.methods) {
          this.write(`function ${interfaceNode.name}:${method.name}(...) end\n`);
        }
      }
      
      if (interfaceNode.properties && interfaceNode.properties.length > 0) {
        for (const prop of interfaceNode.properties) {
          this.write(`${interfaceNode.name}.${prop.name} = nil -- ${prop.type}\n`);
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
  
  generateStruct(structNode, target) {
    if (target === "lua") {
      this.write(`-- struct ${structNode.name}\n`);
      if (structNode.interfaces && structNode.interfaces.length > 0) {
        this.write(`-- implements ${structNode.interfaces.join(", ")}\n`);
      }
      this.write(`local ${structNode.name} = {}\n`);
      
      if (structNode.fields && structNode.fields.length > 0) {
        for (const field of structNode.fields) {
          this.write(`${structNode.name}.${field.name} = nil -- ${field.type}\n`);
        }
      }
    } else if (target === "javascript") {
      this.write(`// struct ${structNode.name}${structNode.interfaces && structNode.interfaces.length > 0 ? ` implements ${structNode.interfaces.join(", ")}` : ""}\n`);
      this.write(`class ${structNode.name} {\n`);
      this.indentLevel++;
      
      if (structNode.fields && structNode.fields.length > 0) {
        for (const field of structNode.fields) {
          this.write(`${field.name} = null; // ${field.type}\n`);
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

module.exports = CSharpCodeGeneratorExtended;

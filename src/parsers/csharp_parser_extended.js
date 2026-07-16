/**
 * CSharpParserExtended - Phase B
 * Advanced C# Parsing with LINQ, Advanced Properties, Virtual Methods
 */

const CSharpTokenizerExtended = require("../tokenizers/csharp_tokenizer_extended");

class CSharpParserExtended {
  constructor(code = "") {
    this.code = code;
    this.tokenizer = new CSharpTokenizerExtended(code);
    this.tokens = [];
    this.pos = 0;
    this.ast = {
      type: "Program",
      namespace: null,
      usings: [],
      classes: [],
      interfaces: [],
      structs: [],
      body: []
    };
  }
  
  parse() {
    this.tokens = this.tokenizer.tokenize();
    this.pos = 0;
    
    this.ast = {
      type: "Program",
      namespace: null,
      usings: [],
      classes: [],
      interfaces: [],
      structs: [],
      body: []
    };
    
    while (this.pos < this.tokens.length) {
      const token = this.current();
      
      if (!token) break;
      
      if (token.value === "using") {
        this.parseUsing();
        continue;
      }
      
      if (token.value === "namespace") {
        this.parseNamespace();
        continue;
      }
      
      if (token.value === "class") {
        const classNode = this.parseClass();
        if (classNode) this.ast.classes.push(classNode);
        continue;
      }
      
      if (token.value === "interface") {
        const interfaceNode = this.parseInterface();
        if (interfaceNode) this.ast.interfaces.push(interfaceNode);
        continue;
      }
      
      if (token.value === "struct") {
        const structNode = this.parseStruct();
        if (structNode) this.ast.structs.push(structNode);
        continue;
      }
      
      this.advance();
    }
    
    return this.ast;
  }
  
  current() {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
  }
  
  peek(offset = 1) {
    return this.pos + offset < this.tokens.length ? this.tokens[this.pos + offset] : null;
  }
  
  advance() {
    this.pos++;
  }
  
  parseUsing() {
    this.advance(); // skip 'using'
    
    let usingName = "";
    while (this.current() && this.current().value !== ";") {
      if (this.current().type === "Identifier" || this.current().value === ".") {
        usingName += this.current().value;
      }
      this.advance();
    }
    
    if (this.current() && this.current().value === ";") {
      this.advance();
    }
    
    if (usingName) {
      this.ast.usings.push(usingName);
    }
  }
  
  parseNamespace() {
    this.advance(); // skip 'namespace'
    
    if (this.current() && this.current().type === "Identifier") {
      this.ast.namespace = this.current().value;
      this.advance();
    }
    
    // Skip opening brace  
    if (this.current() && this.current().value === "{") {
      this.advance();
      
      // Parse contents within namespace
      let braceDepth = 1;
      while (this.pos < this.tokens.length && braceDepth > 0) {
        const token = this.current();
        
        if (token.value === "{") braceDepth++;
        if (token.value === "}") {
          braceDepth--;
          if (braceDepth === 0) break;
        }
        
        // Parse types within namespace
        if (token.value === "class") {
          const classNode = this.parseClass();
          if (classNode) this.ast.classes.push(classNode);
          continue;
        }
        
        if (token.value === "interface") {
          const interfaceNode = this.parseInterface();
          if (interfaceNode) this.ast.interfaces.push(interfaceNode);
          continue;
        }
        
        if (token.value === "struct") {
          const structNode = this.parseStruct();
          if (structNode) this.ast.structs.push(structNode);
          continue;
        }
        
        this.advance();
      }
      
      // Skip closing brace
      if (this.current() && this.current().value === "}") {
        this.advance();
      }
    }
  }
  
  parseClass() {
    const classNode = {
      type: "ClassDeclaration",
      name: "",
      modifiers: [],
      extends: null,
      implements: [],
      generics: null,
      methods: [],
      properties: [],
      fields: [],
      isAbstract: false,
      isSealed: false,
      isStatic: false,
      body: []
    };
    
    // Parse modifiers
    while (this.current() && ["public", "private", "protected", "internal", "static", "sealed", "abstract", "partial"].includes(this.current().value)) {
      const modifier = this.current().value;
      classNode.modifiers.push(modifier);
      if (modifier === "abstract") classNode.isAbstract = true;
      if (modifier === "sealed") classNode.isSealed = true;
      if (modifier === "static") classNode.isStatic = true;
      this.advance();
    }
    
    // Skip 'class'
    if (this.current() && this.current().value === "class") {
      this.advance();
    } else {
      return null;
    }
    
    // Class name
    if (this.current() && this.current().type === "Identifier") {
      classNode.name = this.current().value;
      this.advance();
    }
    
    // Parse generics
    if (this.current() && this.current().value === "<") {
      classNode.generics = this.parseGenerics();
    }
    
    // Parse base class and interfaces
    if (this.current() && this.current().value === ":") {
      this.advance();
      
      // First is typically base class or first interface
      const firstType = this.parseType();
      classNode.extends = firstType;
      
      // Additional interfaces
      while (this.current() && this.current().value === ",") {
        this.advance();
        const interfaceType = this.parseType();
        if (!classNode.implements) classNode.implements = [];
        classNode.implements.push(interfaceType);
      }
    }
    
    // Parse class body
    if (this.current() && this.current().value === "{") {
      classNode.body = this.parseClassBody();
      classNode.methods = this.extractMethods(classNode.body);
      classNode.properties = this.extractProperties(classNode.body);
      classNode.fields = this.extractFields(classNode.body);
    }
    
    return classNode;
  }
  
  parseInterface() {
    const interfaceNode = {
      type: "InterfaceDeclaration",
      name: "",
      modifiers: [],
      extends: [],
      methods: [],
      properties: [],
      body: []
    };
    
    // Parse modifiers
    while (this.current() && ["public", "private", "protected", "internal", "partial"].includes(this.current().value)) {
      interfaceNode.modifiers.push(this.current().value);
      this.advance();
    }
    
    // Skip 'interface'
    if (this.current() && this.current().value === "interface") {
      this.advance();
    } else {
      return null;
    }
    
    // Interface name
    if (this.current() && this.current().type === "Identifier") {
      interfaceNode.name = this.current().value;
      this.advance();
    }
    
    // Parse base interfaces
    if (this.current() && this.current().value === ":") {
      this.advance();
      interfaceNode.extends.push(this.parseType());
      
      while (this.current() && this.current().value === ",") {
        this.advance();
        interfaceNode.extends.push(this.parseType());
      }
    }
    
    // Parse interface body
    if (this.current() && this.current().value === "{") {
      interfaceNode.body = this.parseClassBody();
      interfaceNode.methods = this.extractMethods(interfaceNode.body);
      interfaceNode.properties = this.extractProperties(interfaceNode.body);
    }
    
    return interfaceNode;
  }
  
  parseStruct() {
    const structNode = {
      type: "StructDeclaration",
      name: "",
      modifiers: [],
      interfaces: [],
      fields: [],
      methods: [],
      properties: [],
      body: []
    };
    
    // Parse modifiers
    while (this.current() && ["public", "private", "protected", "internal", "readonly", "partial"].includes(this.current().value)) {
      structNode.modifiers.push(this.current().value);
      this.advance();
    }
    
    // Skip 'struct'
    if (this.current() && this.current().value === "struct") {
      this.advance();
    } else {
      return null;
    }
    
    // Struct name
    if (this.current() && this.current().type === "Identifier") {
      structNode.name = this.current().value;
      this.advance();
    }
    
    // Parse interfaces
    if (this.current() && this.current().value === ":") {
      this.advance();
      structNode.interfaces.push(this.parseType());
      
      while (this.current() && this.current().value === ",") {
        this.advance();
        structNode.interfaces.push(this.parseType());
      }
    }
    
    // Parse body
    if (this.current() && this.current().value === "{") {
      structNode.body = this.parseClassBody();
      structNode.fields = this.extractFields(structNode.body);
      structNode.methods = this.extractMethods(structNode.body);
      structNode.properties = this.extractProperties(structNode.body);
    }
    
    return structNode;
  }
  
  parseGenerics() {
    const generics = [];
    
    if (this.current() && this.current().value === "<") {
      this.advance();
    }
    
    while (this.current() && this.current().value !== ">") {
      if (this.current().type === "Identifier") {
        generics.push(this.current().value);
        this.advance();
      }
      
      if (this.current() && this.current().value === ",") {
        this.advance();
      } else {
        break;
      }
    }
    
    if (this.current() && this.current().value === ">") {
      this.advance();
    }
    
    return generics.length > 0 ? generics : null;
  }
  
  parseType() {
    let typeName = "";
    
    if (this.current() && this.current().type === "Identifier") {
      typeName = this.current().value;
      this.advance();
    }
    
    // Handle generics in type
    if (this.current() && this.current().value === "<") {
      this.advance();
      while (this.current() && this.current().value !== ">") {
        typeName += this.current().value;
        this.advance();
      }
      if (this.current() && this.current().value === ">") {
        typeName += ">";
        this.advance();
      }
    }
    
    return typeName;
  }
  
  parseClassBody() {
    const body = [];
    
    if (this.current() && this.current().value === "{") {
      this.advance();
    }
    
    let braceDepth = 1;
    
    while (this.current() && braceDepth > 0) {
      if (this.current().value === "{") {
        braceDepth++;
      } else if (this.current().value === "}") {
        braceDepth--;
        if (braceDepth === 0) break;
      }
      
      body.push(this.current());
      this.advance();
    }
    
    if (this.current() && this.current().value === "}") {
      this.advance();
    }
    
    return body;
  }
  
  extractMethods(body) {
    const methods = [];
    let i = 0;
    
    while (i < body.length) {
      const _token = body[i];
      
      // Collect modifiers
      const modifiers = [];
      let isAsync = false;
      while (i < body.length && ["public", "private", "protected", "internal", "static", "virtual", "override", "abstract", "sealed", "async"].includes(body[i].value)) {
        if (body[i].value === "async") isAsync = true;
        modifiers.push(body[i].value);
        i++;
      }
      
      // Look for return type + identifier + (
      if (i < body.length && (body[i].type === "Identifier" || ["void", "int", "double", "float", "bool", "string", "long", "Task"].includes(body[i].value)) && i + 1 < body.length) {
        const returnType = body[i].value;
        i++;
        const nextToken = body[i];
        
        if (nextToken && nextToken.type === "Identifier") {
          let j = i + 1;
          
          // Skip generics
          if (j < body.length && body[j].value === "<") {
            let depth = 1;
            j++;
            while (j < body.length && depth > 0) {
              if (body[j].value === "<") depth++;
              if (body[j].value === ">") depth--;
              j++;
            }
          }
          
          if (j < body.length && body[j].value === "(") {
            const method = {
              name: nextToken.value,
              returnType: returnType,
              parameters: [],
              isVirtual: modifiers.includes("virtual"),
              isOverride: modifiers.includes("override"),
              isAbstract: modifiers.includes("abstract"),
              isAsync: isAsync,
              modifiers: modifiers
            };
            
            methods.push(method);
          }
        }
      } else {
        i++;
      }
    }
    
    return methods;
  }
  
  extractProperties(body) {
    const properties = [];
    let i = 0;
    
    while (i < body.length) {
      const token = body[i];
      
      // Skip modifiers
      if (["public", "private", "protected", "internal", "static", "virtual", "override"].includes(token.value)) {
        i++;
        continue;
      }
      
      // Look for type + identifier + { (property)
      if ((token.type === "Identifier" || ["int", "double", "float", "bool", "string", "long", "object"].includes(token.value)) && i + 1 < body.length) {
        const nextToken = body[i + 1];
        
        if (nextToken && nextToken.type === "Identifier") {
          let j = i + 2;
          
          if (j < body.length && body[j].value === "{") {
            const property = {
              name: nextToken.value,
              type: token.value,
              hasGetter: false,
              hasSetter: false,
              isAutoProperty: false
            };
            
            // Check for get/set
            j++;
            let braceDepth = 1;
            while (j < body.length && braceDepth > 0) {
              if (body[j].value === "get") property.hasGetter = true;
              if (body[j].value === "set") property.hasSetter = true;
              if (body[j].value === "{") braceDepth++;
              if (body[j].value === "}") braceDepth--;
              j++;
            }
            
            properties.push(property);
          }
        }
      }
      
      i++;
    }
    
    return properties;
  }
  
  extractFields(body) {
    const fields = [];
    let i = 0;
    
    while (i < body.length) {
      const _token = body[i];
      
      // Skip modifiers
      const modifiers = [];
      while (i < body.length && ["public", "private", "protected", "internal", "static", "readonly", "volatile"].includes(body[i].value)) {
        modifiers.push(body[i].value);
        i++;
      }
      
      // Field type
      if (i < body.length && (body[i].type === "Identifier" || ["int", "double", "float", "bool", "string", "long"].includes(body[i].value))) {
        const fieldType = body[i].value;
        i++;
        
        // Field names
        while (i < body.length && body[i].type === "Identifier") {
          const fieldName = body[i].value;
          i++;
          
          const field = {
            name: fieldName,
            type: fieldType,
            modifiers,
            initializer: false
          };
          
          if (i < body.length && body[i].value === "=") {
            field.initializer = true;
            i++;
            while (i < body.length && body[i].value !== ";") {
              i++;
            }
          }
          
          fields.push(field);
          
          if (i < body.length && body[i].value === ",") {
            i++;
          } else if (i < body.length && body[i].value === ";") {
            i++;
            break;
          } else {
            break;
          }
        }
      } else {
        i++;
      }
    }
    
    return fields;
  }
}

module.exports = CSharpParserExtended;

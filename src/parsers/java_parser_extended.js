/**
 * JavaParserExtended - Phase B
 * Advanced Java Parsing with Inheritance, Generics, Annotations, Nested Classes
 * Extracts: classes, interfaces, inheritance, generics, annotations, nested structures
 */

const JavaTokenizerExtended = require("../tokenizers/java_tokenizer_extended");

class JavaParserExtended {
  constructor(code = "") {
    this.code = code;
    this.tokenizer = new JavaTokenizerExtended(code);
    this.tokens = [];
    this.pos = 0;
    this.ast = {
      type: "Program",
      package: null,
      imports: [],
      classes: [],
      interfaces: [],
      annotations: [],
      body: []
    };
  }
  
  parse() {
    this.tokens = this.tokenizer.tokenize();
    this.pos = 0;
    
    this.ast = {
      type: "Program",
      package: null,
      imports: [],
      classes: [],
      interfaces: [],
      annotations: [],
      body: []
    };
    
    while (this.pos < this.tokens.length) {
      const token = this.current();
      
      if (!token) break;
      
      // Package declaration
      if (token.value === "package") {
        this.parsePackage();
        continue;
      }
      
      // Import declaration
      if (token.value === "import") {
        this.parseImport();
        continue;
      }
      
      // Annotations
      if (token.type === "Annotation") {
        this.parseAnnotation();
        continue;
      }
      
      // Class/Interface declaration
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
  
  parsePackage() {
    // Skip 'package'
    this.advance();
    
    let packageName = "";
    while (this.current() && this.current().value !== ";") {
      if (this.current().type === "Identifier" || this.current().value === ".") {
        packageName += this.current().value;
      }
      this.advance();
    }
    
    if (this.current() && this.current().value === ";") {
      this.advance();
    }
    
    this.ast.package = packageName;
  }
  
  parseImport() {
    // Skip 'import'
    this.advance();
    
    let importName = "";
    let isStatic = false;
    
    if (this.current() && this.current().value === "static") {
      isStatic = true;
      this.advance();
    }
    
    while (this.current() && this.current().value !== ";") {
      if (this.current().type === "Identifier" || this.current().value === "." || this.current().value === "*") {
        importName += this.current().value;
      }
      this.advance();
    }
    
    if (this.current() && this.current().value === ";") {
      this.advance();
    }
    
    this.ast.imports.push({ name: importName, static: isStatic });
  }
  
  parseAnnotation() {
    // Skip '@'
    this.advance();
    
    let annotationName = "";
    if (this.current() && this.current().type === "Identifier") {
      annotationName = this.current().value;
      this.advance();
    }
    
    // Skip annotation parameters if present
    if (this.current() && this.current().value === "(") {
      this.skipBalancedBraces("(", ")");
    }
    
    this.ast.annotations.push({ name: annotationName });
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
      fields: [],
      nestedClasses: [],
      nestedInterfaces: [],
      annotations: [],
      body: []
    };
    
    // Parse modifiers (public, private, protected, static, final, abstract, etc.)
    while (this.current() && ["public", "private", "protected", "static", "final", "abstract", "sealed", "strictfp"].includes(this.current().value)) {
      classNode.modifiers.push(this.current().value);
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
    
    // Parse generics <T, U extends Number>
    if (this.current() && this.current().value === "<") {
      classNode.generics = this.parseGenerics();
    }
    
    // Parse extends
    if (this.current() && this.current().value === "extends") {
      this.advance();
      classNode.extends = this.parseType();
    }
    
    // Parse implements
    if (this.current() && this.current().value === "implements") {
      this.advance();
      classNode.implements = this.parseImplementsList();
    }
    
    // Parse permits (sealed classes)
    if (this.current() && this.current().value === "permits") {
      this.advance();
      classNode.permits = this.parsePermitsList();
    }
    
    // Parse class body
    if (this.current() && this.current().value === "{") {
      classNode.body = this.parseClassBody();
      classNode.methods = this.extractMethods(classNode.body);
      classNode.fields = this.extractFields(classNode.body);
      classNode.nestedClasses = this.extractNestedClasses(classNode.body);
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
      constants: [],
      nestedTypes: [],
      annotations: [],
      body: []
    };
    
    // Parse modifiers
    while (this.current() && ["public", "private", "protected", "static", "sealed", "strictfp"].includes(this.current().value)) {
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
    
    // Parse extends
    if (this.current() && this.current().value === "extends") {
      this.advance();
      interfaceNode.extends = this.parseImplementsList();
    }
    
    // Parse interface body
    if (this.current() && this.current().value === "{") {
      interfaceNode.body = this.parseClassBody();
      interfaceNode.methods = this.extractMethods(interfaceNode.body);
      interfaceNode.constants = this.extractFields(interfaceNode.body);
    }
    
    return interfaceNode;
  }
  
  parseGenerics() {
    const generics = [];
    
    // Skip '<'
    if (this.current() && this.current().value === "<") {
      this.advance();
    }
    
    while (this.current() && this.current().value !== ">") {
      if (this.current().type === "Identifier") {
        const generic = {
          name: this.current().value,
          bound: null
        };
        this.advance();
        
        // Check for extends bound
        if (this.current() && this.current().value === "extends") {
          this.advance();
          generic.bound = this.parseType();
        }
        
        generics.push(generic);
      }
      
      if (this.current() && this.current().value === ",") {
        this.advance();
      } else {
        break;
      }
    }
    
    // Skip '>'
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
      typeName += "<" + this.skipBalancedBraces("<", ">") + ">";
    }
    
    return typeName;
  }
  
  parseImplementsList() {
    const interfaces = [];
    
    while (this.current() && this.current().type === "Identifier") {
      interfaces.push(this.parseType());
      
      if (this.current() && this.current().value === ",") {
        this.advance();
      } else {
        break;
      }
    }
    
    return interfaces;
  }
  
  parsePermitsList() {
    const permits = [];
    
    while (this.current() && this.current().type === "Identifier") {
      permits.push(this.current().value);
      this.advance();
      
      if (this.current() && this.current().value === ",") {
        this.advance();
      } else {
        break;
      }
    }
    
    return permits;
  }
  
  parseClassBody() {
    const body = [];
    
    // Skip '{'
    if (this.current() && this.current().value === "{") {
      this.advance();
    }
    
    const _depth = 1;
    let braceDepth = 1;
    
    while (this.current() && braceDepth > 0) {
      if (this.current().value === "{") {
        braceDepth++;
      } else if (this.current().value === "}") {
        braceDepth--;
        if (braceDepth === 0) break;
      }
      
      // Record tokens in body
      body.push(this.current());
      this.advance();
    }
    
    // Skip '}'
    if (this.current() && this.current().value === "}") {
      this.advance();
    }
    
    return body;
  }
  
  extractMethods(body) {
    const methods = [];
    let i = 0;
    
    while (i < body.length) {
      const token = body[i];
      
      // Skip annotations
      if (token.type === "Annotation") {
        i++;
        continue;
      }
      
      // Skip modifiers
      if (["public", "private", "protected", "static", "final", "synchronized", "native", "abstract", "strictfp", "default"].includes(token.value)) {
        i++;
        continue;
      }
      
      // Look for return type + identifier + (
      if ((token.type === "Identifier" || ["void", "int", "double", "float", "boolean", "char", "long", "short", "byte"].includes(token.value)) && i + 1 < body.length) {
        const nextToken = body[i + 1];
        
        if (nextToken && nextToken.type === "Identifier") {
          // Check if followed by '('
          let j = i + 2;
          let isMethod = false;
          
          // Skip generics if present
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
            isMethod = true;
          }
          
          if (isMethod) {
            const method = {
              name: nextToken.value,
              returnType: token.value,
              parameters: [],
              modifiers: [],
              isStatic: false,
              isFinal: false,
              isAbstract: false,
              isSynchronized: false
            };
            
            methods.push(method);
          }
        }
      }
      
      i++;
    }
    
    return methods;
  }
  
  extractFields(body) {
    const fields = [];
    let i = 0;
    
    while (i < body.length) {
      const token = body[i];
      
      // Skip annotations
      if (token.type === "Annotation") {
        i++;
        continue;
      }
      
      // Collect modifiers
      const modifiers = [];
      while (i < body.length && ["public", "private", "protected", "static", "final", "volatile", "transient"].includes(body[i].value)) {
        modifiers.push(body[i].value);
        i++;
      }
      
      // Field type
      if (i < body.length && (body[i].type === "Identifier" || ["int", "double", "float", "boolean", "char", "long", "short", "byte"].includes(body[i].value))) {
        const fieldType = body[i].value;
        i++;
        
        // Field name(s)
        while (i < body.length && body[i].type === "Identifier") {
          const fieldName = body[i].value;
          i++;
          
          const field = {
            name: fieldName,
            type: fieldType,
            modifiers,
            initializer: false
          };
          
          // Check for initializer
          if (i < body.length && body[i].value === "=") {
            field.initializer = true;
            i++;
            // Skip until semicolon
            while (i < body.length && body[i].value !== ";") {
              i++;
            }
          }
          
          fields.push(field);
          
          // Handle comma-separated fields
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
  
  extractNestedClasses(body) {
    const nestedClasses = [];
    let i = 0;
    
    while (i < body.length) {
      if (body[i].value === "class" && i > 0) {
        nestedClasses.push(body[i].value);
      }
      i++;
    }
    
    return nestedClasses;
  }
  
  skipBalancedBraces(open, close) {
    let content = "";
    let depth = 1;
    
    if (this.current() && this.current().value === open) {
      this.advance();
    }
    
    while (this.current() && depth > 0) {
      if (this.current().value === open) {
        depth++;
      } else if (this.current().value === close) {
        depth--;
        if (depth === 0) break;
      }
      
      content += this.current().value;
      this.advance();
    }
    
    if (this.current() && this.current().value === close) {
      this.advance();
    }
    
    return content;
  }
}

module.exports = JavaParserExtended;

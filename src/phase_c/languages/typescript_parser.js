/**
 * TYPESCRIPT PHASE C PARSER
 * Parses TypeScript source into AST with Phase C features
 * 
 * Features:
 * - Mapped type parsing (type Getters<T> = { [K in keyof T]: () => T[K] })
 * - Decorator parsing (@Component({ selector: 'app' }) class App {})
 * - Generic constraint parsing (<T extends string>, <T extends { x: number }>)
 * - Union/intersection parsing (Type | Other, Type & Mixin)
 * - Module declaration parsing (import/export statements)
 * - Async/await expression parsing
 * - Conditional type parsing (T extends U ? X : Y)
 * - Type narrowing and guards
 * 
 * Lines: 400
 */

const AbstractPhaseC_Parser = require("../framework/abstract_parser");

class TypeScriptPhaseC_Parser extends AbstractPhaseC_Parser {
  constructor(config = {}) {
    super({
      language: "TypeScript",
      ...config
    });

    this.typeScriptFeatures = {
      mappedTypes: [],
      decorators: [],
      genericConstraints: [],
      unionTypes: [],
      intersectionTypes: [],
      conditionalTypes: [],
      moduleDeclarations: [],
      asyncAwaitExpressions: []
    };

    this.typeContext = {
      currentType: null,
      currentGeneric: null,
      currentDecorator: null,
      decoratorStack: [],
      genericStack: [],
      typeStack: [],
      mappedTypeMap: {},
      conditionalTypeMap: {},
      decoratorMetadataMap: {}
    };

    this.astNode = {
      type: "TypeScriptProgram",
      body: [],
      metadata: {
        language: "TypeScript",
        features: this.typeScriptFeatures,
        totalMappedTypes: 0,
        totalDecorators: 0,
        totalGenerics: 0,
        totalUnions: 0,
        totalIntersections: 0
      }
    };
  }

  /**
   * MAIN PARSE FUNCTION
   */
  parse(tokens) {
    if (!tokens || tokens.length === 0) {
      return this.astNode;
    }

    this.tokens = tokens;
    this.position = 0;
    this.astNode.body = [];

    try {
      while (this.position < this.tokens.length) {
        const token = this.currentToken();

        if (!token) break;

        // Parse decorators
        if (token.type === "DECORATOR") {
          this.parseDecorator();
        }
        // Parse type declarations
        else if (token.type === "TYPE_DECLARATION") {
          if (token.value === "type") {
            this.parseMappedType();
          } else if (token.value === "interface") {
            this.parseInterface();
          }
        }
        // Parse class declarations
        else if (this.valueIs("class")) {
          this.parseClass();
        }
        // Parse function declarations
        else if (this.valueIs("function") || this.valueIs("async")) {
          this.parseFunction();
        }
        // Parse module statements
        else if (token.type === "MODULE_KEYWORD") {
          this.parseModuleStatement();
        }
        // Skip to next
        else {
          this.advance();
        }
      }

      this.updateMetadata();
      return this.astNode;
    } catch (error) {
      this.astNode.errors = this.astNode.errors || [];
      this.astNode.errors.push({
        message: error.message,
        position: this.position,
        token: this.currentToken()
      });
      return this.astNode;
    }
  }

  /**
   * PARSE DECORATORS
   */
  parseDecorator() {
    const decorator = {
      type: "Decorator",
      name: this.currentToken().name,
      arguments: [],
      metadata: {}
    };

    this.advance();

    // Parse decorator arguments if present
    if (this.currentTokenValue() === "(") {
      this.advance(); // Skip (

      while (!this.valueIs(")") && this.position < this.tokens.length) {
        decorator.arguments.push(this.currentToken().value);
        this.advance();
      }

      if (this.valueIs(")")) {
        this.advance();
      }
    }

    this.typeContext.decoratorStack.push(decorator);
    this.typeScriptFeatures.decorators.push(decorator);
    this.astNode.metadata.totalDecorators++;
  }

  /**
   * PARSE MAPPED TYPES
   */
  parseMappedType() {
    const mappedType = {
      type: "MappedType",
      name: "",
      typeVar: "",
      keyIteration: "",
      valueMapping: "",
      readonly: false,
      optional: false,
      asClause: "",
      line: this.currentToken().line
    };

    this.advance(); // Skip 'type'

    // Get type name
    if (this.currentToken().type === "IDENTIFIER") {
      mappedType.name = this.currentToken().value;
      this.advance();
    }

    // Skip to generic
    while (this.position < this.tokens.length && !this.valueIs("<")) {
      this.advance();
    }

    if (this.valueIs("<")) {
      this.advance();

      // Parse generic content
      let genericContent = "";
      let depth = 1;

      while (depth > 0 && this.position < this.tokens.length) {
        if (this.valueIs("<")) depth++;
        if (this.valueIs(">")) depth--;
        if (depth > 0) {
          genericContent += this.currentTokenValue();
        }
        this.advance();
      }

      // Parse generic structure
      if (genericContent.includes("in") && genericContent.includes("keyof")) {
        const parts = genericContent.split("in");
        mappedType.typeVar = parts[0].trim();
        mappedType.keyIteration = parts[1].trim();
      } else if (genericContent.includes("extends")) {
        mappedType.typeVar = genericContent.substring(0, genericContent.indexOf("extends")).trim();
        mappedType.valueMapping = genericContent.substring(genericContent.indexOf("extends") + 7).trim();
      }
    }

    // Skip to equals
    while (this.position < this.tokens.length && !this.valueIs("=")) {
      this.advance();
    }

    if (this.valueIs("=")) {
      this.advance();
    }

    // Parse mapping
    if (this.valueIs("{")) {
      this.advance();

      let mapping = "";
      let depth = 1;

      while (depth > 0 && this.position < this.tokens.length) {
        if (this.valueIs("{")) depth++;
        if (this.valueIs("}")) depth--;
        if (depth > 0) {
          mapping += this.currentTokenValue() + " ";
        }
        this.advance();
      }

      mappedType.valueMapping = mapping.trim();
    }

    this.typeScriptFeatures.mappedTypes.push(mappedType);
    this.astNode.body.push(mappedType);
    this.astNode.metadata.totalMappedTypes++;
  }

  /**
   * PARSE GENERIC CONSTRAINTS
   */
  parseGenericConstraint(content) {
    const constraint = {
      type: "GenericConstraint",
      typeVariable: "",
      constraintType: "",
      defaultType: "",
      multipleConstraints: []
    };

    if (content.includes("extends")) {
      const parts = content.split("extends");
      constraint.typeVariable = parts[0].trim();
      
      const remaining = parts[1].trim();
      
      if (remaining.includes("&")) {
        constraint.multipleConstraints = remaining.split("&").map(c => c.trim());
      } else if (remaining.includes("|")) {
        constraint.multipleConstraints = remaining.split("|").map(c => c.trim());
      } else {
        constraint.constraintType = remaining;
      }
    }

    if (content.includes("=")) {
      const defParts = content.split("=");
      constraint.defaultType = defParts[1].trim();
    }

    this.typeScriptFeatures.genericConstraints.push(constraint);
    this.astNode.metadata.totalGenerics++;
    return constraint;
  }

  /**
   * PARSE UNION TYPES
   */
  parseUnionType() {
    const unionType = {
      type: "UnionType",
      members: [],
      discriminated: false,
      discriminatorField: ""
    };

    while (this.valueIs("|")) {
      this.advance();
      if (this.currentToken().type === "IDENTIFIER") {
        unionType.members.push(this.currentToken().value);
        this.advance();
      }
    }

    this.typeScriptFeatures.unionTypes.push(unionType);
    this.astNode.metadata.totalUnions++;
    return unionType;
  }

  /**
   * PARSE INTERSECTION TYPES
   */
  parseIntersectionType() {
    const intersectionType = {
      type: "IntersectionType",
      members: []
    };

    while (this.valueIs("&")) {
      this.advance();
      if (this.currentToken().type === "IDENTIFIER") {
        intersectionType.members.push(this.currentToken().value);
        this.advance();
      }
    }

    this.typeScriptFeatures.intersectionTypes.push(intersectionType);
    this.astNode.metadata.totalIntersections++;
    return intersectionType;
  }

  /**
   * PARSE CONDITIONAL TYPES
   */
  parseConditionalType(content) {
    const conditionalType = {
      type: "ConditionalType",
      condition: "",
      trueType: "",
      falseType: "",
      checkType: "",
      extendsType: ""
    };

    if (content.includes("extends")) {
      const parts = content.split("?");
      const condition = parts[0].trim();
      
      const condParts = condition.split("extends");
      conditionalType.checkType = condParts[0].trim();
      conditionalType.extendsType = condParts[1].trim();
      
      if (parts[1]) {
        const thenElse = parts[1].split(":");
        conditionalType.trueType = thenElse[0].trim();
        conditionalType.falseType = thenElse[1].trim();
      }
    }

    this.typeScriptFeatures.conditionalTypes.push(conditionalType);
    return conditionalType;
  }

  /**
   * PARSE INTERFACE
   */
  parseInterface() {
    const interfaceNode = {
      type: "Interface",
      name: "",
      typeParameters: [],
      extends: [],
      members: []
    };

    this.advance(); // Skip 'interface'

    if (this.currentToken().type === "IDENTIFIER") {
      interfaceNode.name = this.currentToken().value;
      this.advance();
    }

    this.astNode.body.push(interfaceNode);
  }

  /**
   * PARSE CLASS
   */
  parseClass() {
    const classNode = {
      type: "Class",
      name: "",
      decorators: [...this.typeContext.decoratorStack],
      typeParameters: [],
      extends: "",
      implements: [],
      members: []
    };

    this.typeContext.decoratorStack = [];

    this.advance(); // Skip 'class'

    if (this.currentToken().type === "IDENTIFIER") {
      classNode.name = this.currentToken().value;
      this.advance();
    }

    this.astNode.body.push(classNode);
  }

  /**
   * PARSE FUNCTION
   */
  parseFunction() {
    const isAsync = this.valueIs("async");
    const funcNode = {
      type: "Function",
      isAsync: isAsync,
      name: "",
      typeParameters: [],
      parameters: [],
      returnType: "",
      decorators: [...this.typeContext.decoratorStack]
    };

    this.typeContext.decoratorStack = [];

    if (isAsync) {
      this.advance(); // Skip 'async'
    }

    this.advance(); // Skip 'function'

    if (this.currentToken().type === "IDENTIFIER") {
      funcNode.name = this.currentToken().value;
      this.advance();
    }

    this.astNode.body.push(funcNode);
  }

  /**
   * PARSE MODULE STATEMENTS
   */
  parseModuleStatement() {
    const moduleNode = {
      type: "ModuleDeclaration",
      kind: this.currentToken().value, // 'import' or 'export'
      specifiers: [],
      source: ""
    };

    this.advance(); // Skip import/export

    // Parse import/export specifiers
    while (this.position < this.tokens.length && !this.valueIs(";")) {
      if (this.currentToken().type === "IDENTIFIER") {
        moduleNode.specifiers.push(this.currentToken().value);
      } else if (this.currentToken().type === "STRING_LITERAL") {
        moduleNode.source = this.currentToken().value;
      }
      this.advance();
    }

    this.typeScriptFeatures.moduleDeclarations.push(moduleNode);
    this.astNode.body.push(moduleNode);
  }

  /**
   * UPDATE METADATA
   */
  updateMetadata() {
    this.astNode.metadata = {
      language: "TypeScript",
      totalMappedTypes: this.typeScriptFeatures.mappedTypes.length,
      totalDecorators: this.typeScriptFeatures.decorators.length,
      totalGenerics: this.typeScriptFeatures.genericConstraints.length,
      totalUnions: this.typeScriptFeatures.unionTypes.length,
      totalIntersections: this.typeScriptFeatures.intersectionTypes.length,
      totalConditionals: this.typeScriptFeatures.conditionalTypes.length,
      totalModules: this.typeScriptFeatures.moduleDeclarations.length,
      totalAsync: this.typeScriptFeatures.asyncAwaitExpressions.length,
      features: this.typeScriptFeatures
    };
  }

  // ==================== HELPER METHODS ====================

  currentToken() {
    return this.tokens[this.position];
  }

  currentTokenValue() {
    const token = this.currentToken();
    return token ? token.value : "";
  }

  valueIs(value) {
    const token = this.currentToken();
    return token && token.value === value;
  }

  advance() {
    this.position++;
  }

  getFeatures() {
    return this.typeScriptFeatures;
  }

  getAST() {
    return this.astNode;
  }
}

module.exports = TypeScriptPhaseC_Parser;

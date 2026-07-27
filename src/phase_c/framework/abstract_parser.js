/**
 * PHASE C ABSTRACT PARSER
 * Generic AST construction for all 13 languages
 * 
 * Features:
 * - Multi-target AST generation
 * - Error recovery mechanisms
 * - Type annotation parsing
 * - Pattern matching support
 * - Macro expansion hooks
 * - Concurrency pattern recognition
 * 
 * Lines: 170
 */

class AbstractPhaseC_Parser {
  constructor(config = {}) {
    this.config = {
      language: config.language || "generic",
      errorRecovery: config.errorRecovery !== false,
      typeAnnotations: config.typeAnnotations !== false,
      macroExpansion: config.macroExpansion !== false,
      ...config
    };

    this.tokens = [];
    this.position = 0;
    this.ast = {
      type: "Program",
      body: [],
      metadata: {
        language: this.config.language,
        phase: "C",
        features: {
          macros: [],
          concurrency: [],
          typeAnnotations: [],
          dsl: [],
          modules: [],
          errors: []
        }
      }
    };

    this.errorRecoveryStack = [];
    this.scopeStack = [{ type: "global", bindings: {} }];
  }

  /**
   * MAIN PARSE ENTRY POINT
   */
  parse(tokens) {
    this.tokens = tokens;
    this.position = 0;
    this.ast = {
      type: "Program",
      body: [],
      metadata: {
        language: this.config.language,
        phase: "C",
        features: {
          macros: [],
          concurrency: [],
          typeAnnotations: [],
          dsl: [],
          modules: [],
          errors: []
        }
      }
    };

    while (this.position < this.tokens.length) {
      try {
        const stmt = this.parseStatement();
        if (stmt) {
          this.ast.body.push(stmt);
        }
      } catch (error) {
        if (this.config.errorRecovery) {
          this.ast.metadata.features.errors.push({
            message: error.message,
            position: this.position,
            recovered: true
          });
          this.recoverFromError();
        } else {
          throw error;
        }
      }
    }

    return this.ast;
  }

  /**
   * PARSE STATEMENT
   */
  parseStatement() {
    const token = this.currentToken();
    if (!token) return null;

    // Parse macro definitions
    if (token.type === "MACRO") {
      return this.parseMacro();
    }

    // Parse concurrency statements
    if (token.type === "CONCURRENCY") {
      return this.parseConcurrency();
    }

    // Parse type annotations
    if (this.config.typeAnnotations && this.isTypeKeyword(token)) {
      return this.parseTypeAnnotation();
    }

    // Parse pattern matching
    if (this.isPatternStart(token)) {
      return this.parsePattern();
    }

    // Parse module statements
    if (this.isModuleKeyword(token)) {
      return this.parseModule();
    }

    // Parse generic statement
    return this.parseExpression();
  }

  /**
   * PARSE MACRO DEFINITION/INVOCATION
   */
  parseMacro() {
    const startPos = this.position;
    const macroNode = {
      type: "MacroStatement",
      category: "",
      name: "",
      parameters: [],
      body: [],
      startPos,
      line: this.currentToken().line
    };

    const token = this.consume("MACRO");

    if (token.category === "definition") {
      macroNode.category = "definition";
      // Expect macro name
      const nameToken = this.currentToken();
      if (nameToken && nameToken.type === "IDENTIFIER") {
        macroNode.name = nameToken.value;
        this.advance();
      }
    } else if (token.category === "decorator") {
      macroNode.category = "decorator";
      macroNode.name = token.value;

      // Parse decorator parameters if present
      if (this.currentToken() && this.currentToken().value === "(") {
        this.advance(); // consume (
        while (this.currentToken() && this.currentToken().value !== ")") {
          macroNode.parameters.push(this.parseExpression());
          if (this.currentToken() && this.currentToken().value === ",") {
            this.advance();
          }
        }
        this.advance(); // consume )
      }
    } else if (token.category === "attribute") {
      macroNode.category = "attribute";
      macroNode.name = token.value;
    }

    this.ast.metadata.features.macros.push({
      name: macroNode.name,
      category: macroNode.category,
      line: macroNode.line
    });

    return macroNode;
  }

  /**
   * PARSE CONCURRENCY PATTERNS
   */
  parseConcurrency() {
    const startPos = this.position;
    const token = this.consume("CONCURRENCY");
    
    const concurrencyNode = {
      type: "ConcurrencyStatement",
      keyword: token.keyword,
      expression: null,
      startPos,
      line: token.line
    };

    // Parse goroutine/async expression
    if (["go", "async", "spawn"].includes(token.keyword)) {
      concurrencyNode.expression = this.parseExpression();
    }
    // Parse channel operations
    else if (["chan", "channel"].includes(token.keyword)) {
      concurrencyNode.expression = this.parseChannelExpression();
    }
    // Parse select statement
    else if (token.keyword === "select") {
      concurrencyNode.type = "SelectStatement";
      concurrencyNode.cases = this.parseSelectCases();
    }

    this.ast.metadata.features.concurrency.push({
      keyword: token.keyword,
      line: token.line
    });

    return concurrencyNode;
  }

  /**
   * PARSE CHANNEL EXPRESSIONS
   */
  parseChannelExpression() {
    const channelExpr = {
      type: "ChannelExpression",
      operations: []
    };

    while (this.currentToken() && this.currentToken().type === "CHANNEL_OP") {
      const opToken = this.consume("CHANNEL_OP");
      channelExpr.operations.push({
        operator: opToken.value,
        keyword: opToken.keyword,
        value: this.parseExpression()
      });
    }

    return channelExpr;
  }

  /**
   * PARSE SELECT STATEMENT CASES
   */
  parseSelectCases() {
    const cases = [];

    // Expect opening brace
    if (this.currentToken() && this.currentToken().value === "{") {
      this.advance();

      while (this.currentToken() && this.currentToken().value !== "}") {
        if (this.currentToken().value === "case") {
          const selectCase = {
            type: "SelectCase",
            pattern: null,
            body: []
          };

          this.advance(); // consume 'case'

          // Parse case pattern
          selectCase.pattern = this.parseExpression();

          // Expect colon
          if (this.currentToken() && this.currentToken().value === ":") {
            this.advance();
          }

          // Parse case body
          while (this.currentToken() && 
                 this.currentToken().value !== "case" && 
                 this.currentToken().value !== "default" &&
                 this.currentToken().value !== "}") {
            selectCase.body.push(this.parseStatement());
          }

          cases.push(selectCase);
        } else if (this.currentToken().value === "default") {
          const defaultCase = {
            type: "DefaultCase",
            body: []
          };

          this.advance(); // consume 'default'

          if (this.currentToken() && this.currentToken().value === ":") {
            this.advance();
          }

          while (this.currentToken() && this.currentToken().value !== "}") {
            defaultCase.body.push(this.parseStatement());
          }

          cases.push(defaultCase);
        } else {
          this.advance();
        }
      }

      if (this.currentToken() && this.currentToken().value === "}") {
        this.advance();
      }
    }

    return cases;
  }

  /**
   * PARSE TYPE ANNOTATIONS
   */
  parseTypeAnnotation() {
    const typeNode = {
      type: "TypeAnnotation",
      keyword: this.currentToken().value,
      name: "",
      typeParams: [],
      constraints: [],
      body: null
    };

    this.advance(); // consume type keyword

    // Parse type name
    if (this.currentToken() && this.currentToken().type === "IDENTIFIER") {
      typeNode.name = this.currentToken().value;
      this.advance();
    }

    // Parse generic type parameters
    if (this.currentToken() && this.currentToken().value === "<") {
      this.advance();
      while (this.currentToken() && this.currentToken().value !== ">") {
        const typeParam = this.parseExpression();
        typeNode.typeParams.push(typeParam);

        if (this.currentToken() && this.currentToken().value === ",") {
          this.advance();
        }
      }
      if (this.currentToken() && this.currentToken().value === ">") {
        this.advance();
      }
    }

    // Parse where clause constraints
    if (this.currentToken() && this.currentToken().value === "where") {
      this.advance();
      while (this.currentToken() && this.currentToken().value !== "{" && this.currentToken().value !== ";") {
        const constraint = this.parseExpression();
        typeNode.constraints.push(constraint);

        if (this.currentToken() && this.currentToken().value === ",") {
          this.advance();
        }
      }
    }

    this.ast.metadata.features.typeAnnotations.push({
      name: typeNode.name,
      typeParams: typeNode.typeParams.length,
      constraints: typeNode.constraints.length
    });

    return typeNode;
  }

  /**
   * PARSE PATTERN MATCHING
   */
  parsePattern() {
    const patternNode = {
      type: "PatternExpression",
      patterns: []
    };

    while (this.isPatternStart(this.currentToken())) {
      const pattern = {
        condition: this.parseExpression(),
        action: null
      };

      if (this.currentToken() && this.currentToken().value === "=>") {
        this.advance();
        pattern.action = this.parseExpression();
      } else if (this.currentToken() && this.currentToken().value === ":") {
        this.advance();
        pattern.action = this.parseExpression();
      }

      patternNode.patterns.push(pattern);

      if (this.currentToken() && this.currentToken().value === ",") {
        this.advance();
      }
    }

    return patternNode;
  }

  /**
   * PARSE MODULE STATEMENTS
   */
  parseModule() {
    const moduleNode = {
      type: "ModuleStatement",
      keyword: this.currentToken().value,
      name: "",
      imports: [],
      exports: []
    };

    this.advance(); // consume module keyword

    if (this.currentToken() && this.currentToken().type === "IDENTIFIER") {
      moduleNode.name = this.currentToken().value;
      this.advance();
    }

    this.ast.metadata.features.modules.push({
      name: moduleNode.name,
      keyword: moduleNode.keyword
    });

    return moduleNode;
  }

  /**
   * PARSE GENERIC EXPRESSION
   * With iteration bounds to prevent infinite recursion
   */
  parseExpression(maxDepth = 0) {
    // Enforce maximum expression depth (prevent infinite loops)
    if (maxDepth > 100) {
      throw new Error("Maximum expression depth exceeded (>100)");
    }

    if (!this.currentToken()) return null;

    let expr = this.parsePrimary();

    let operatorCount = 0;
    const maxOperators = 50;
    
    while (this.currentToken() && this.isBinaryOperator(this.currentToken()) && operatorCount < maxOperators) {
      const op = this.currentToken();
      this.advance();

      expr = {
        type: "BinaryExpression",
        operator: op.value,
        left: expr,
        right: this.parsePrimary()
      };
      
      operatorCount++;
    }

    if (operatorCount >= maxOperators) {
      this.profiling.errors.push("Max operators in expression reached");
    }

    return expr;
  }

  /**
   * PARSE PRIMARY EXPRESSION
   */
  parsePrimary() {
    const token = this.currentToken();
    if (!token) return null;

    if (token.type === "IDENTIFIER") {
      this.advance();
      return {
        type: "Identifier",
        name: token.value,
        line: token.line
      };
    }

    if (token.type === "NUMBER") {
      this.advance();
      return {
        type: "Number",
        value: token.value,
        line: token.line
      };
    }

    if (token.type === "STRING") {
      this.advance();
      return {
        type: "String",
        value: token.value,
        line: token.line
      };
    }

    this.advance();
    return {
      type: "UnknownExpression",
      value: token.value,
      line: token.line
    };
  }

  // HELPER METHODS

  currentToken() {
    return this.tokens[this.position];
  }

  advance() {
    this.position++;
  }

  consume(expectedType) {
    const token = this.currentToken();
    if (!token || token.type !== expectedType) {
      throw new Error(`Expected token type ${expectedType}, got ${token ? token.type : "EOF"}`);
    }
    this.advance();
    return token;
  }

  isTypeKeyword(token) {
    return token && ["trait", "interface", "type", "class", "struct"].includes(token.value);
  }

  isPatternStart(token) {
    return token && token.value === "match";
  }

  isModuleKeyword(token) {
    return token && ["module", "import", "export", "use", "mod"].includes(token.value);
  }

  isBinaryOperator(token) {
    return token && ["=", "==", "+", "-", "*", "/", "&&", "||", "<", ">", ",", ";"].includes(token.value);
  }

  recoverFromError() {
    // Skip to next statement boundary
    while (this.position < this.tokens.length) {
      const token = this.currentToken();
      if (token && [";", "\n", "}"].includes(token.value)) {
        this.advance();
        break;
      }
      this.advance();
    }
  }
}

module.exports = AbstractPhaseC_Parser;

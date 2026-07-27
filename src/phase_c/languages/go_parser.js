/**
 * GO PHASE C PARSER
 * Parses Go source into AST with Phase C features
 * 
 * Features:
 * - Goroutine declaration parsing
 * - Channel type parsing
 * - Select statement AST
 * - Error interface handling
 * - Interface implementation detection
 * - DSL macro parsing
 * 
 * Lines: 420
 */

const AbstractPhaseC_Parser = require("../framework/abstract_parser");

class GoPhaseC_Parser extends AbstractPhaseC_Parser {
  constructor(config = {}) {
    super({
      language: "Go",
      ...config
    });

    this.goFeatures = {
      goroutineDeclarations: [],
      channelTypes: [],
      selectStatements: [],
      errorHandles: [],
      interfaceImplementations: [],
      builderPatterns: []
    };

    this.typeContext = {
      currentType: null,
      currentInterface: null,
      currentFunction: null,
      channelMap: {}
    };
  }

  /**
   * GOROUTINE DECLARATION PARSING
   * Parses: go functionCall()
   */
  parseGoroutineDeclaration() {
    const startPos = this.position;
    const goroutineNode = {
      type: "GoroutineDeclaration",
      keyword: "go",
      function: null,
      arguments: [],
      startPos,
      line: this.currentToken().line
    };

    this.advance(); // consume 'go'

    // Parse function call
    if (this.currentToken() && this.currentToken().type === "IDENTIFIER") {
      goroutineNode.function = this.currentToken().value;
      this.advance();

      // Parse arguments
      if (this.currentToken() && this.currentToken().value === "(") {
        this.advance();

        let argCount = 0;
        const maxArgs = 100;
        while (this.currentToken() && this.currentToken().value !== ")" && argCount < maxArgs) {
          goroutineNode.arguments.push(this.parseExpression());
          argCount++;

          if (this.currentToken() && this.currentToken().value === ",") {
            this.advance();
          } else if (this.currentToken() && this.currentToken().value !== ")") {
            break;
          }
        }

        if (this.currentToken() && this.currentToken().value === ")") {
          this.advance();
        }
      }
    }

    this.goFeatures.goroutineDeclarations.push({
      function: goroutineNode.function,
      argCount: goroutineNode.arguments.length,
      line: goroutineNode.line
    });

    this.ast.metadata.features.concurrency.push({
      type: "goroutine",
      function: goroutineNode.function,
      line: goroutineNode.line
    });

    return goroutineNode;
  }

  /**
   * CHANNEL TYPE PARSING
   * Parses: chan int, chan<- string, <-chan bool
   */
  parseChannelType() {
    const startPos = this.position;
    const channelNode = {
      type: "ChannelType",
      direction: "bidirectional",
      elementType: null,
      buffered: false,
      bufferSize: 0,
      startPos,
      line: this.currentToken().line
    };

    const token = this.currentToken();

    // Check for <-chan (receive-only)
    if (token.type === "CHANNEL_OP" && token.value === "<-" && token.direction === "receive_only") {
      channelNode.direction = "receive_only";
      this.advance();
    }
    // Expect 'chan'
    if (this.currentToken() && this.currentToken().value === "chan") {
      this.advance();

      // Check for chan<- (send-only)
      if (this.currentToken() && this.currentToken().type === "CHANNEL_OP" && this.currentToken().value === "<-") {
        channelNode.direction = "send_only";
        this.advance();
      }
    }

    // Parse element type
    if (this.currentToken() && this.currentToken().type === "IDENTIFIER") {
      channelNode.elementType = this.currentToken().value;
      this.advance();
    }

    // Track channel in context
    this.typeContext.channelMap[channelNode.elementType] = channelNode;

    this.goFeatures.channelTypes.push({
      direction: channelNode.direction,
      elementType: channelNode.elementType,
      line: channelNode.line
    });

    return channelNode;
  }

  /**
   * CHANNEL OPERATION PARSING
   * Parses: ch <- value or value := <-ch
   */
  parseChannelOperation() {
    const startPos = this.position;
    const channelOpNode = {
      type: "ChannelOperation",
      operator: "<-",
      channel: null,
      value: null,
      assignment: false,
      startPos,
      line: this.currentToken().line
    };

    const token = this.currentToken();

    // Check for receive operation (<-ch)
    if (token.type === "CHANNEL_OP" && token.value === "<-") {
      channelOpNode.operator = "<-";
      this.advance();

      // Parse channel expression
      channelOpNode.channel = this.parseExpression();
    }
    // Check for send operation (ch <- value)
    else if (this.isChannelIdentifier()) {
      channelOpNode.channel = this.parseExpression();

      if (this.currentToken() && this.currentToken().type === "CHANNEL_OP") {
        channelOpNode.operator = "<-";
        this.advance();

        // Parse value
        channelOpNode.value = this.parseExpression();
      }
    }

    return channelOpNode;
  }

  /**
   * SELECT STATEMENT PARSING
   * Parses: select { case ... case ... default ... }
   */
  parseSelectStatement() {
    const startPos = this.position;
    const selectNode = {
      type: "SelectStatement",
      cases: [],
      defaultCase: null,
      startPos,
      line: this.currentToken().line
    };

    this.advance(); // consume 'select'

    // Expect opening brace
    if (this.currentToken() && this.currentToken().value === "{") {
      this.advance();

      while (this.currentToken() && this.currentToken().value !== "}") {
        if (this.currentToken().value === "case") {
          const selectCase = {
            type: "SelectCase",
            pattern: null,
            communication: null,
            body: [],
            timeout: false
          };

          this.advance(); // consume 'case'

          // Parse case pattern
          selectCase.communication = this.parseChannelOperation();

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

          selectNode.cases.push(selectCase);
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

          selectNode.defaultCase = defaultCase;
        } else {
          this.advance();
        }
      }

      if (this.currentToken() && this.currentToken().value === "}") {
        this.advance();
      }
    }

    this.goFeatures.selectStatements.push({
      caseCount: selectNode.cases.length,
      hasDefault: selectNode.defaultCase !== null,
      line: selectNode.line
    });

    this.ast.metadata.features.concurrency.push({
      type: "select",
      cases: selectNode.cases.length,
      line: selectNode.line
    });

    return selectNode;
  }

  /**
   * ERROR HANDLING PARSING
   * Parses: if err != nil, defer cleanup(), errors.Is(), errors.As()
   */
  parseErrorHandling() {
    const startPos = this.position;
    const errorNode = {
      type: "ErrorHandling",
      category: "",
      target: null,
      handler: null,
      startPos,
      line: this.currentToken().line
    };

    const token = this.currentToken();

    if (token.type === "ERROR_HANDLING") {
      if (token.category === "defer") {
        errorNode.category = "defer_cleanup";
        this.advance();

        // Parse cleanup expression
        errorNode.handler = this.parseExpression();
      } else if (token.category === "error_type") {
        errorNode.category = "error_return";
        this.advance();
      } else if (token.category === "error_check") {
        errorNode.category = "error_check";
        this.advance();

        // Parse error check expression
        if (this.currentToken() && this.currentToken().value === "(") {
          this.advance();
          errorNode.target = this.parseExpression();
          if (this.currentToken() && this.currentToken().value === ")") {
            this.advance();
          }
        }
      } else if (token.category === "error_extract") {
        errorNode.category = "error_extract";
        this.advance();

        // Parse error extraction
        if (this.currentToken() && this.currentToken().value === "(") {
          this.advance();
          errorNode.target = this.parseExpression();
          if (this.currentToken() && this.currentToken().value === ")") {
            this.advance();
          }
        }
      }
    }

    this.goFeatures.errorHandles.push({
      category: errorNode.category,
      line: errorNode.line
    });

    this.ast.metadata.features.errors.push({
      type: errorNode.category,
      line: errorNode.line
    });

    return errorNode;
  }

  /**
   * INTERFACE PARSING
   * Parses: type Reader interface { Read(...) ... }
   */
  parseInterfaceDefinition() {
    const startPos = this.position;
    const interfaceNode = {
      type: "InterfaceDefinition",
      name: "",
      methods: [],
      embedded: [],
      startPos,
      line: this.currentToken().line
    };

    if (this.currentToken() && this.currentToken().type === "GO_INTERFACE") {
      this.advance(); // consume 'interface'

      // Parse interface name if provided
      if (this.currentToken() && this.currentToken().type === "IDENTIFIER" && this.currentToken().value !== "{") {
        interfaceNode.name = this.currentToken().value;
        this.advance();
      }

      // Expect opening brace
      if (this.currentToken() && this.currentToken().value === "{") {
        this.advance();

        // Parse methods
        while (this.currentToken() && this.currentToken().value !== "}") {
          const methodNode = {
            name: "",
            parameters: [],
            returns: []
          };

          if (this.currentToken().type === "IDENTIFIER") {
            methodNode.name = this.currentToken().value;
            this.advance();

            // Parse parameters
            if (this.currentToken() && this.currentToken().value === "(") {
              this.advance();
              while (this.currentToken() && this.currentToken().value !== ")") {
                methodNode.parameters.push(this.parseExpression());
                if (this.currentToken() && this.currentToken().value === ",") {
                  this.advance();
                }
              }
              if (this.currentToken() && this.currentToken().value === ")") {
                this.advance();
              }
            }

            // Parse return types
            if (this.currentToken() && this.currentToken().value === "(") {
              this.advance();
              while (this.currentToken() && this.currentToken().value !== ")") {
                methodNode.returns.push(this.parseExpression());
                if (this.currentToken() && this.currentToken().value === ",") {
                  this.advance();
                }
              }
              if (this.currentToken() && this.currentToken().value === ")") {
                this.advance();
              }
            }
          }

          interfaceNode.methods.push(methodNode);

          if (this.currentToken() && this.currentToken().value === "\n") {
            this.advance();
          }
        }

        if (this.currentToken() && this.currentToken().value === "}") {
          this.advance();
        }
      }
    }

    this.typeContext.currentInterface = interfaceNode.name;

    this.goFeatures.interfaceImplementations.push({
      interface: interfaceNode.name,
      methodCount: interfaceNode.methods.length,
      line: interfaceNode.line
    });

    this.ast.metadata.features.typeAnnotations.push({
      type: "interface",
      name: interfaceNode.name,
      methods: interfaceNode.methods.length
    });

    return interfaceNode;
  }

  /**
   * BUILDER PATTERN PARSING
   * Parses: obj.Method1(v1).Method2(v2).Build()
   */
  parseBuilderPattern() {
    const startPos = this.position;
    const builderNode = {
      type: "BuilderPattern",
      methods: [],
      startPos,
      line: this.currentToken().line
    };

    let current = this.parseExpression();
    builderNode.methods.push(current);

    // Track method chain
    while (this.currentToken() && this.currentToken().value === ".") {
      this.advance(); // consume '.'

      if (this.currentToken() && this.currentToken().type === "IDENTIFIER") {
        const method = {
          name: this.currentToken().value,
          arguments: []
        };

        this.advance();

        // Parse method arguments
        if (this.currentToken() && this.currentToken().value === "(") {
          this.advance();

          while (this.currentToken() && this.currentToken().value !== ")") {
            method.arguments.push(this.parseExpression());

            if (this.currentToken() && this.currentToken().value === ",") {
              this.advance();
            }
          }

          if (this.currentToken() && this.currentToken().value === ")") {
            this.advance();
          }
        }

        builderNode.methods.push(method);

        // Stop if we hit Build()
        if (method.name === "Build" && method.arguments.length === 0) {
          break;
        }
      }
    }

    this.goFeatures.builderPatterns.push({
      methodCount: builderNode.methods.length,
      isFluent: builderNode.methods.some(m => m.name === "Build"),
      line: builderNode.line
    });

    return builderNode;
  }

  /**
   * OVERRIDE PARSE STATEMENT FOR GO
   */
  parseStatement() {
    const token = this.currentToken();
    if (!token) return null;

    // Go-specific: Goroutine
    if (token.type === "GO_KEYWORD") {
      return this.parseGoroutineDeclaration();
    }

    // Go-specific: Select statement
    if (token.type === "SELECT_KEYWORD") {
      return this.parseSelectStatement();
    }

    // Go-specific: Error handling
    if (token.type === "ERROR_HANDLING") {
      return this.parseErrorHandling();
    }

    // Go-specific: Interface definition
    if (token.type === "GO_INTERFACE" && token.value === "interface") {
      return this.parseInterfaceDefinition();
    }

    // Go-specific: Channel type
    if (token.type === "CHANNEL_OP" || (token.type === "IDENTIFIER" && token.value === "chan")) {
      return this.parseChannelType();
    }

    // Default: use parent parsing
    return super.parseStatement();
  }

  // HELPER METHODS

  isChannelIdentifier() {
    if (!this.currentToken()) return false;

    const name = this.currentToken().value;
    return name in this.typeContext.channelMap;
  }

  getGoFeatures() {
    return this.goFeatures;
  }
}

module.exports = GoPhaseC_Parser;

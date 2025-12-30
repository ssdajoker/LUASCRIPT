
/**
 * LUASCRIPT Phase 1 Core - Advanced Parser Implementation
 * PS2/PS3 Specialists + Steve Jobs + Donald Knuth Excellence
 * 32+ Developer Team Implementation - CRUNCH MODE!
 */

const { LuaScriptLexer } = require("./phase1_core_lexer");
const {
  ProgramNode, BlockStatementNode, ExpressionStatementNode,
  VariableDeclarationNode, VariableDeclaratorNode, FunctionDeclarationNode,
  ReturnStatementNode, IfStatementNode, WhileStatementNode, ForStatementNode, ForOfStatementNode,
  ArrayPatternNode,
  BreakStatementNode, ContinueStatementNode, ThrowStatementNode, CatchClauseNode, TryStatementNode, BinaryExpressionNode,
  UnaryExpressionNode, AssignmentExpressionNode, UpdateExpressionNode,
  LogicalExpressionNode, ConditionalExpressionNode, CallExpressionNode,
  MemberExpressionNode, ArrayExpressionNode, ObjectExpressionNode,
  NewExpressionNode, ClassDeclarationNode, SwitchStatementNode, SwitchCaseNode,
  PropertyNode, ArrowFunctionExpressionNode, FunctionExpressionNode,
  LiteralNode, IdentifierNode, ThisExpressionNode,
  ErrorNode
} = require("./phase1_core_ast");

/**
 * The core parser for LUASCRIPT, responsible for constructing an Abstract Syntax Tree (AST) from a stream of tokens.
 * It includes features like error recovery and configurable parsing options.
 */
class LuaScriptParser {
  /**
     * Creates an instance of the LuaScriptParser.
     * @param {string} source - The source code to parse.
     * @param {object} [options={}] - Configuration options for the parser.
     * @param {boolean} [options.errorRecovery=true] - Whether to enable error recovery.
     * @param {boolean} [options.strictMode=false] - Whether to enforce strict mode rules.
     * @param {boolean} [options.allowReturnOutsideFunction=false] - Whether to allow return statements outside of functions.
     */
  constructor(source, options = {}) {
    this.lexer = new LuaScriptLexer(source, options);
    this.tokens = [];
    this.current = 0;
    this.errors = [];
    this.options = {
      errorRecovery: options.errorRecovery !== false,
      strictMode: options.strictMode || false,
      allowReturnOutsideFunction: options.allowReturnOutsideFunction || false,
      ...options
    };
    this.functionDepth = 0;
    this.loopDepth = 0;
  }

  /**
     * Parses the source code and returns the AST.
     * @returns {object} The program node of the AST, along with any errors.
     */
  parse() {
    try {
      this.tokens = this.lexer.tokenize();
            
      if (this.lexer.hasErrors()) {
        this.errors.push(...this.lexer.getErrors().map(err => ({
          type: "LexicalError",
          message: err.value,
          line: err.line,
          column: err.column
        })));
      }

      const program = this.parseProgram();
            
      if (!this.isAtEnd() && this.options.errorRecovery) {
        this.addError("Unexpected tokens after end of program");
      }

      return {
        type: "Program",
        body: program.body,
        errors: this.errors,
        sourceType: "script"
      };
    } catch (error) {
      if (this.options.errorRecovery) {
        this.addError(error.message);
        return {
          type: "Program",
          body: [],
          errors: this.errors,
          sourceType: "script"
        };
      }
      throw error;
    }
  }

  /**
     * Parses the main program body.
     * @returns {ProgramNode} The root ProgramNode of the AST.
     * @private
     */
  parseProgram() {
    const body = [];
        
    while (!this.isAtEnd()) {
      try {
        const stmt = this.parseStatement();
        if (stmt) {
          body.push(stmt);
          // Only break on EOF after a successful statement parse to avoid masking genuine parsing errors
          if (this.isAtEnd()) break;
        }
      } catch (error) {
        if (this.options.errorRecovery) {
          this.addError(error.message);
          this.synchronize();
        } else {
          throw error;
        }
      }
    }

    return new ProgramNode(body);
  }

  /**
     * Parses a single statement.
     * @returns {ASTNode} The AST node for the parsed statement.
     * @private
     */
  parseStatement() {
    console.log("Parsing statement, current token:", this.peek());
    try {
      if (this.check("KEYWORD")) {
        const firstKeywordToken = this.peek();
        if (firstKeywordToken.value === "async") {
          const nextToken = this.tokens[this.current + 1];
          if (nextToken && nextToken.type === "KEYWORD" && nextToken.value === "function") {
            this.advance(); // Consume 'async'
            this.advance(); // Consume 'function'
            return this.parseFunctionDeclaration(true);
          }
        }

        this.advance(); // Consume the current keyword
        const keyword = this.previous().value;

        switch (keyword) {
        case "let":
        case "const":
        case "var":
          return this.parseVariableDeclaration(keyword);
        case "function":
          return this.parseFunctionDeclaration(false); // Not async
        case "return":
          return this.parseReturnStatement();
        case "if":
          return this.parseIfStatement();
        case "while":
          return this.parseWhileStatement();
        case "for":
          return this.parseForStatement();
        case "break":
          return this.parseBreakStatement();
        case "continue":
          return this.parseContinueStatement();
        case "throw":
          return this.parseThrowStatement();
        case "try":
          return this.parseTryStatement();
        case "do":
          return this.parseDoWhileStatement();
        case "class":
          return this.parseClassDeclaration();
        case "switch":
          return this.parseSwitchStatement();
        default:
          // Backtrack and parse as expression statement
          this.current--;
          return this.parseExpressionStatement();
        }
      }

      if (this.check("LEFT_BRACE")) {
        return this.parseBlockStatement();
      }

      return this.parseExpressionStatement();
    } catch (error) {
      if (this.options.errorRecovery) {
        this.addError(error.message);
        // Advance to a synchronization point to avoid infinite loops
        this.synchronize();
        return new ErrorNode(error.message, this.peek());
      }
      throw error;
    }
  }

  /**
     * Parses a variable declaration statement.
     * @param {string} kind - The type of declaration ('let', 'const', 'var').
     * @returns {VariableDeclarationNode} The AST node for the variable declaration.
     * @private
     */
  parseVariableDeclaration(kind) {
    const declarations = [];
        
    do {
      const id = this.check("LEFT_BRACKET") ? this.parseArrayPattern() : this.parseIdentifier();
      let init = null;
            
      if (this.match("ASSIGN")) {
        init = this.parseAssignmentExpression();
      } else if (kind === "const") {
        throw new SyntaxError(`Missing initializer in const declaration at line ${this.peek().line}`);
      }
            
      declarations.push(new VariableDeclaratorNode(id, init, {
        line: id.line,
        column: id.column
      }));
            
    } while (this.match("COMMA"));
        
    this.consume("SEMICOLON", "Expected ';' after variable declaration");
        
    return new VariableDeclarationNode(declarations, kind, {
      line: declarations[0].line,
      column: declarations[0].column
    });
  }

  /**
     * Parses a function declaration.
     * @returns {FunctionDeclarationNode} The AST node for the function declaration.
     * @private
     */
  parseFunctionDeclaration(isAsync = false) {
    this.functionDepth++;
        
    const id = this.parseIdentifier();
        
    this.consume("LEFT_PAREN", "Expected '(' after function name");
    const params = this.parseParameterList();
    this.consume("RIGHT_PAREN", "Expected ')' after parameters");
        
    const body = this.parseBlockStatement();
        
    this.functionDepth--;
        
    return new FunctionDeclarationNode(id, params, body, {
      line: id.line,
      column: id.column,
      async: isAsync
    });
  }

  /**
     * Parses a return statement.
     * @returns {ReturnStatementNode} The AST node for the return statement.
     * @private
     */
  parseReturnStatement() {
    const token = this.previous();
        
    if (this.functionDepth === 0 && !this.options.allowReturnOutsideFunction) {
      throw new SyntaxError(`Return statement outside function at line ${token.line}`);
    }
        
    let argument = null;
    if (!this.check("SEMICOLON") && !this.isAtEnd()) {
      argument = this.parseExpression();
    }
        
    this.consume("SEMICOLON", "Expected ';' after return statement");
        
    return new ReturnStatementNode(argument, {
      line: token.line,
      column: token.column
    });
  }

  /**
     * Parses an if statement.
     * @returns {IfStatementNode} The AST node for the if statement.
     * @private
     */
  parseIfStatement() {
    const token = this.previous();
        
    this.consume("LEFT_PAREN", "Expected '(' after 'if'");
    const test = this.parseExpression();
    this.consume("RIGHT_PAREN", "Expected ')' after if condition");
        
    const consequent = this.parseStatement();
    let alternate = null;
        
    if (this.match("KEYWORD") && this.previous().value === "else") {
      alternate = this.parseStatement();
    } else {
      this.current--; // Backtrack if not 'else'
    }
        
    return new IfStatementNode(test, consequent, alternate, {
      line: token.line,
      column: token.column
    });
  }

  /**
     * Parses a while statement.
     * @returns {WhileStatementNode} The AST node for the while statement.
     * @private
     */
  parseWhileStatement() {
    const token = this.previous();
    this.loopDepth++;
        
    this.consume("LEFT_PAREN", "Expected '(' after 'while'");
    const test = this.parseExpression();
    this.consume("RIGHT_PAREN", "Expected ')' after while condition");
        
    const body = this.parseStatement();
        
    this.loopDepth--;
        
    return new WhileStatementNode(test, body, {
      line: token.line,
      column: token.column
    });
  }

  /**
     * Parses a for statement.
     * @returns {ForStatementNode} The AST node for the for statement.
     * @private
     */
  parseForStatement() {
    const token = this.previous();
    this.loopDepth++;

    this.consume("LEFT_PAREN", "Expected '(' after 'for'");

    if (this.match("KEYWORD") && ["let", "const", "var"].includes(this.previous().value)) {
      const kindToken = this.previous();
      const id = this.parseIdentifier();
      let initExpr = null;
      if (this.match("ASSIGN")) {
        initExpr = this.parseAssignmentExpression();
      }
      const declarator = new VariableDeclaratorNode(id, initExpr, {
        line: id.line,
        column: id.column
      });
      const decl = new VariableDeclarationNode([declarator], kindToken.value, {
        line: token.line,
        column: token.column
      });

      if (this.match("IDENTIFIER") && this.previous().value === "of") {
        const right = this.parseExpression();
        this.consume("RIGHT_PAREN", "Expected ')' after for-of clauses");
        const body = this.parseStatement();
        this.loopDepth--;
        return new ForOfStatementNode(decl, right, body, {
          line: token.line,
          column: token.column
        });
      }

      this.consume("SEMICOLON", "Expected ';' after for loop initializer");
      let test = null;
      if (!this.check("SEMICOLON")) {
        test = this.parseExpression();
      }
      this.consume("SEMICOLON", "Expected ';' after for loop condition");

      let update = null;
      if (!this.check("RIGHT_PAREN")) {
        update = this.parseExpression();
      }
      this.consume("RIGHT_PAREN", "Expected ')' after for clauses");

      const body = this.parseStatement();
      this.loopDepth--;
      return new ForStatementNode(decl, test, update, body, {
        line: token.line,
        column: token.column
      });
    }

    let init = null;
    if (!this.check("SEMICOLON")) {
      init = this.parseExpression();
    }
    this.consume("SEMICOLON", "Expected ';' after for loop initializer");

    let test = null;
    if (!this.check("SEMICOLON")) {
      test = this.parseExpression();
    }
    this.consume("SEMICOLON", "Expected ';' after for loop condition");

    let update = null;
    if (!this.check("RIGHT_PAREN")) {
      update = this.parseExpression();
    }
    this.consume("RIGHT_PAREN", "Expected ')' after for clauses");

    const body = this.parseStatement();

    this.loopDepth--;

    return new ForStatementNode(init, test, update, body, {
      line: token.line,
      column: token.column
    });
  }

  /**
     * Parses a break statement.
     * @returns {BreakStatementNode} The AST node for the break statement.
     * @private
     */
  parseBreakStatement() {
    const token = this.previous();
        
    if (this.loopDepth === 0) {
      throw new SyntaxError(`Break statement outside loop at line ${token.line}`);
    }
        
    this.consume("SEMICOLON", "Expected ';' after 'break'");
        
    return new BreakStatementNode(null, {
      line: token.line,
      column: token.column
    });
  }

  /**
     * Parses a continue statement.
     * @returns {ContinueStatementNode} The AST node for the continue statement.
     * @private
     */
  parseContinueStatement() {
    const token = this.previous();

    if (this.loopDepth === 0) {
      throw new SyntaxError(`Continue statement outside loop at line ${token.line}`);
    }

    this.consume("SEMICOLON", "Expected ';' after 'continue'");

    return new ContinueStatementNode(null, {
      line: token.line,
      column: token.column
    });
  }

  /**
     * Parses a throw statement.
     * @returns {ThrowStatementNode}
     * @private
     */
  parseThrowStatement() {
    const argument = this.parseExpression();
    this.consume("SEMICOLON", "Expected ';' after throw statement");
    return new ThrowStatementNode(argument, {
      line: this.previous().line,
      column: this.previous().column
    });
  }

  /**
     * Parses a try statement with optional catch/finally.
     * @returns {TryStatementNode}
     * @private
     */
  parseTryStatement() {
    const block = this.parseBlockStatement();
    let handler = null;
    let finalizer = null;

    if (this.check("KEYWORD") && this.peek().value === "catch") {
      this.advance();
      let param = null;
      if (this.match("LEFT_PAREN")) {
        const paramToken = this.consume("IDENTIFIER", "Expected identifier for catch parameter");
        param = new IdentifierNode(paramToken.value, {
          line: paramToken.line,
          column: paramToken.column
        });
        this.consume("RIGHT_PAREN", "Expected ')' after catch parameter");
      }
      const catchBody = this.parseBlockStatement();
      handler = new CatchClauseNode(param, catchBody);
    }

    if (this.check("KEYWORD") && this.peek().value === "finally") {
      this.advance();
      finalizer = this.parseBlockStatement();
    }

    if (!handler && !finalizer) {
      throw new SyntaxError("Expected 'catch' or 'finally' after 'try'");
    }

    return new TryStatementNode(block, handler, finalizer);
  }

  /**
     * Parses a block statement.
     * @returns {BlockStatementNode} The AST node for the block statement.
     * @private
     */
  parseBlockStatement() {
    const token = this.peek();
    this.consume("LEFT_BRACE", "Expected '{'");
        
    const body = [];
    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }
        
    this.consume("RIGHT_BRACE", "Expected '}'");
        
    return new BlockStatementNode(body, {
      line: token.line,
      column: token.column
    });
  }

  /**
     * Parses an expression statement.
     * @returns {ExpressionStatementNode} The AST node for the expression statement.
     * @private
     */
  parseExpressionStatement() {
    const expr = this.parseExpression();
    this.consume("SEMICOLON", "Expected ';' after expression");
        
    return new ExpressionStatementNode(expr, {
      line: expr.line,
      column: expr.column
    });
  }

  /**
     * Parses an expression.
     * @returns {ASTNode} The AST node for the expression.
     * @private
     */
  parseExpression() {
    return this.parseAssignmentExpression();
  }

  /**
     * Parses an assignment expression.
     * @returns {ASTNode} The AST node for the assignment expression.
     * @private
     */
  parseAssignmentExpression() {
    const expr = this.parseConditionalExpression();
        
    if (this.match("ASSIGN", "PLUS_ASSIGN", "MINUS_ASSIGN", "MULTIPLY_ASSIGN", "DIVIDE_ASSIGN", "NULLISH_ASSIGN")) {
      const operator = this.previous().value;
      const right = this.parseAssignmentExpression();
            
      return new AssignmentExpressionNode(operator, expr, right, {
        line: expr.line,
        column: expr.column
      });
    }
        
    return expr;
  }

  /**
     * Parses a conditional (ternary) expression.
     * @returns {ASTNode} The AST node for the conditional expression.
     * @private
     */
  parseConditionalExpression() {
    const expr = this.parseLogicalOrExpression();
        
    if (this.match("QUESTION")) {
      const consequent = this.parseAssignmentExpression();
      this.consume("COLON", "Expected ':' after '?' in conditional expression");
      const alternate = this.parseAssignmentExpression();
            
      return new ConditionalExpressionNode(expr, consequent, alternate, {
        line: expr.line,
        column: expr.column
      });
    }
        
    return expr;
  }

  /**
     * Parses a logical OR expression.
     * @returns {ASTNode} The AST node for the logical OR expression.
     * @private
     */
  parseLogicalOrExpression() {
    let expr = this.parseLogicalAndExpression();

    while (this.match("LOGICAL_OR", "NULLISH_COALESCING", "BITWISE_OR", "BITWISE_XOR")) {
      const operator = this.previous().value;
      const right = this.parseLogicalAndExpression();
      expr = new LogicalExpressionNode(operator, expr, right, {
        line: expr.line,
        column: expr.column
      });
    }

    return expr;
  }

  /**
     * Parses a logical AND expression.
     * @returns {ASTNode} The AST node for the logical AND expression.
     * @private
     */
  parseLogicalAndExpression() {
    let expr = this.parseEqualityExpression();
        
    while (this.match("LOGICAL_AND", "BITWISE_AND")) {
      const operator = this.previous().value;
      const right = this.parseEqualityExpression();
      expr = new LogicalExpressionNode(operator, expr, right, {
        line: expr.line,
        column: expr.column
      });
    }
        
    return expr;
  }

  /**
     * Parses an equality expression.
     * @returns {ASTNode} The AST node for the equality expression.
     * @private
     */
  parseEqualityExpression() {
    let expr = this.parseRelationalExpression();
        
    while (this.match("EQUAL", "NOT_EQUAL", "STRICT_EQUAL", "STRICT_NOT_EQUAL")) {
      const operator = this.previous().value;
      const right = this.parseRelationalExpression();
      expr = new BinaryExpressionNode(operator, expr, right, {
        line: expr.line,
        column: expr.column
      });
    }
        
    return expr;
  }

  /**
     * Parses a relational expression.
     * @returns {ASTNode} The AST node for the relational expression.
     * @private
     */
  parseRelationalExpression() {
    let expr = this.parseAdditiveExpression();
        
    while (this.match("LESS_THAN", "GREATER_THAN", "LESS_EQUAL", "GREATER_EQUAL")) {
      const operator = this.previous().value;
      const right = this.parseAdditiveExpression();
      expr = new BinaryExpressionNode(operator, expr, right, {
        line: expr.line,
        column: expr.column
      });
    }
        
    return expr;
  }

  /**
     * Parses an additive expression.
     * @returns {ASTNode} The AST node for the additive expression.
     * @private
     */
  parseAdditiveExpression() {
    let expr = this.parseMultiplicativeExpression();
        
    while (this.match("PLUS", "MINUS")) {
      const operator = this.previous().value;
      const right = this.parseMultiplicativeExpression();
      expr = new BinaryExpressionNode(operator, expr, right, {
        line: expr.line,
        column: expr.column
      });
    }
        
    return expr;
  }

  /**
     * Parses a multiplicative expression.
     * @returns {ASTNode} The AST node for the multiplicative expression.
     * @private
     */
  parseMultiplicativeExpression() {
    let expr = this.parseUnaryExpression();
        
    while (this.match("MULTIPLY", "DIVIDE", "MODULO")) {
      const operator = this.previous().value;
      const right = this.parseUnaryExpression();
      expr = new BinaryExpressionNode(operator, expr, right, {
        line: expr.line,
        column: expr.column
      });
    }
        
    return expr;
  }

  /**
     * Parses a unary expression.
     * @returns {ASTNode} The AST node for the unary expression.
     * @private
     */
  parseUnaryExpression() {
    if (this.match("LOGICAL_NOT", "MINUS", "PLUS", "BITWISE_NOT")) {
      const operator = this.previous().value;
      const argument = this.parseUnaryExpression();
      return new UnaryExpressionNode(operator, argument, true, {
        line: this.previous().line,
        column: this.previous().column
      });
    }
        
    return this.parseUpdateExpression();
  }

  /**
     * Parses an update expression (e.g., ++a, a--).
     * @returns {ASTNode} The AST node for the update expression.
     * @private
     */
  parseUpdateExpression() {
    // Prefix increment/decrement
    if (this.match("INCREMENT", "DECREMENT")) {
      const operator = this.previous().value;
      const argument = this.parsePostfixExpression();
      return new UpdateExpressionNode(operator, argument, true, {
        line: this.previous().line,
        column: this.previous().column
      });
    }
        
    const expr = this.parsePostfixExpression();
        
    // Postfix increment/decrement
    if (this.match("INCREMENT", "DECREMENT")) {
      const operator = this.previous().value;
      return new UpdateExpressionNode(operator, expr, false, {
        line: expr.line,
        column: expr.column
      });
    }
        
    return expr;
  }

  /**
     * Parses a postfix expression (e.g., a(), a[]).
     * @returns {ASTNode} The AST node for the postfix expression.
     * @private
     */
  parsePostfixExpression() {
    let expr = this.parsePrimaryExpression();
        
     
    while (true) {
      if (this.match("LEFT_PAREN")) {
        // Function call
        const args = this.parseArgumentList();
        this.consume("RIGHT_PAREN", "Expected ')' after arguments");
        expr = new CallExpressionNode(expr, args, {
          line: expr.line,
          column: expr.column
        });
      } else if (this.match("KEYWORD") && this.previous().value === "new") {
        // Support minimal `new Callee(args)` syntax
        const callee = this.parsePrimaryExpression();
        let args = [];
        if (this.match("LEFT_PAREN")) {
          args = this.parseArgumentList();
          this.consume("RIGHT_PAREN", "Expected ')' after arguments");
    parsePostfixExpression() {
        let expr = this.parsePrimaryExpression();
        
        while (true) {
            if (this.match("LEFT_PAREN")) {
                // Function call
                const args = this.parseArgumentList();
                this.consume("RIGHT_PAREN", "Expected ')' after arguments");
                expr = new CallExpressionNode(expr, args, {
                    line: expr.line,
                    column: expr.column
                });
            } else if (this.match("KEYWORD") && this.previous().value === "new") {
                // Support minimal `new Callee(args)` syntax
                const callee = this.parsePrimaryExpression();
                let args = [];
                if (this.match("LEFT_PAREN")) {
                    args = this.parseArgumentList();
                    this.consume("RIGHT_PAREN", "Expected ')' after arguments");
                }
                expr = new NewExpressionNode(callee, args, { line: callee.line, column: callee.column });
            } else if (this.match("LEFT_BRACKET")) {
                // Member access (computed)
                const property = this.parseExpression();
                this.consume("RIGHT_BRACKET", "Expected ']' after computed member expression");
                expr = new MemberExpressionNode(expr, property, true, {
                    line: expr.line,
                    column: expr.column
                });
            } else if (this.match("DOT")) {
                // Member access (non-computed)
                const property = this.parseIdentifier();
                expr = new MemberExpressionNode(expr, property, false, {
                    line: expr.line,
                    column: expr.column
                });
            } else if (this.match("OPTIONAL_CHAINING")) {
                if (this.check("LEFT_PAREN")) {
                    this.advance();
                    const args = this.parseArgumentList();
                    this.consume("RIGHT_PAREN", "Expected ')' after optional call arguments");
                    expr = new CallExpressionNode(expr, args, {
                        line: expr.line,
                        column: expr.column,
                        optional: true
                    });
                } else if (this.check("LEFT_BRACKET")) {
                    this.advance();
                    const property = this.parseExpression();
                    this.consume("RIGHT_BRACKET", "Expected ']' after optional computed member expression");
                    expr = new MemberExpressionNode(expr, property, true, {
                        line: expr.line,
                        column: expr.column,
                        optional: true
                    });
                } else {
                    const property = this.parseIdentifier();
                    expr = new MemberExpressionNode(expr, property, false, {
                        line: expr.line,
                        column: expr.column,
                        optional: true
                    });
                }
            } else {
                break;
            }
        }
        expr = new NewExpressionNode(callee, args, { line: callee.line, column: callee.column });
      } else if (this.match("LEFT_BRACKET")) {
        // Member access (computed)
        const property = this.parseExpression();
        this.consume("RIGHT_BRACKET", "Expected ']' after computed member expression");
        expr = new MemberExpressionNode(expr, property, true, {
          line: expr.line,
          column: expr.column
        });
      } else if (this.match("DOT")) {
        // Member access (non-computed)
        const property = this.parseIdentifier();
        expr = new MemberExpressionNode(expr, property, false, {
          line: expr.line,
          column: expr.column
        });
      } else if (this.match("OPTIONAL_CHAINING")) {
        if (this.check("LEFT_PAREN")) {
          this.advance();
          const args = this.parseArgumentList();
          this.consume("RIGHT_PAREN", "Expected ')' after optional call arguments");
          expr = new CallExpressionNode(expr, args, {
            line: expr.line,
            column: expr.column,
            optional: true
          });
        } else if (this.check("LEFT_BRACKET")) {
          this.advance();
          const property = this.parseExpression();
          this.consume("RIGHT_BRACKET", "Expected ']' after optional computed member expression");
          expr = new MemberExpressionNode(expr, property, true, {
            line: expr.line,
            column: expr.column,
            optional: true
          });
        } else {
          const property = this.parseIdentifier();
          expr = new MemberExpressionNode(expr, property, false, {
            line: expr.line,
            column: expr.column,
            optional: true
          });
        }
      } else {
        break;
      }
    }
        
    return expr;
  }

  /**
     * Parses a primary expression (e.g., literals, identifiers, this, function expressions, grouped expressions).
     * @returns {ASTNode} The AST node for the primary expression.
     * @private
     */
  parsePrimaryExpression() {
    if (this.match("KEYWORD")) {
      const keyword = this.previous().value;
      switch (keyword) {
      case "true":
        return new LiteralNode(true, "true", {
          line: this.previous().line,
          column: this.previous().column
        });
      case "false":
        return new LiteralNode(false, "false", {
          line: this.previous().line,
          column: this.previous().column
        });
      case "null":
        return new LiteralNode(null, "null", {
          line: this.previous().line,
          column: this.previous().column
        });
      case "undefined":
        return new LiteralNode(undefined, "undefined", {
          line: this.previous().line,
          column: this.previous().column
        });
      case "this":
        return new ThisExpressionNode({
          line: this.previous().line,
          column: this.previous().column
        });
      case "function":
        return this.parseFunctionExpression();
      case "new":
        return this.parseNewExpression();
      default:
        throw new SyntaxError(`Unexpected keyword '${keyword}' at line ${this.previous().line}`);
      }
    }
        
    if (this.match("NUMBER")) {
      const token = this.previous();
      return new LiteralNode(token.value, token.value.toString(), {
        line: token.line,
        column: token.column
      });
    }
        
    if (this.match("STRING")) {
      const token = this.previous();
      return new LiteralNode(token.value, `"${token.value}"`, {
        line: token.line,
        column: token.column
      });
    }
        
    if (this.match("IDENTIFIER")) {
      const token = this.previous();
            
      // Check for arrow function
      if (this.check("ARROW")) {
        this.current--; // Backtrack
        return this.parseArrowFunction();
      }
            
      return new IdentifierNode(token.value, {
        line: token.line,
        column: token.column
      });
    }
        
    if (this.match("LEFT_PAREN")) {
      // Could be grouped expression or arrow function parameters
      const checkpoint = this.current;
            
      try {
        // Try to parse as arrow function parameters
        this.current--; // Backtrack to '('
        return this.parseArrowFunction();
      } catch {
        // If that fails, parse as grouped expression
        this.current = checkpoint;
        const expr = this.parseExpression();
        this.consume("RIGHT_PAREN", "Expected ')' after expression");
        return expr;
      }
    }
            try {
                // Try to parse as arrow function parameters
                this.current--; // Backtrack to '('
                return this.parseArrowFunction();
            } catch {
                // If that fails, parse as grouped expression
                this.current = checkpoint;
                const expr = this.parseExpression();
                this.consume("RIGHT_PAREN", "Expected ')' after expression");
                return expr;
            }
        }
        
    if (this.match("LEFT_BRACKET")) {
      return this.parseArrayExpression();
    }
        
    if (this.match("LEFT_BRACE")) {
      return this.parseObjectExpression();
    }
        
    throw new SyntaxError(`Unexpected token '${this.peek().value}' at line ${this.peek().line}`);
  }

  /** Parses a 'new' expression: new Callee(args?) */
  parseNewExpression() {
    const start = this.previous(); // 'new'
    const callee = this.parsePrimaryExpression();
    let args = [];
    if (this.match("LEFT_PAREN")) {
      args = this.parseArgumentList();
      this.consume("RIGHT_PAREN", "Expected ')' after arguments");
    }
    return new NewExpressionNode(callee, args, { line: start.line, column: start.column });
  }

  /** Parses a class declaration with methods */
  parseClassDeclaration() {
    const token = this.previous(); // 'class'
    const id = this.parseIdentifier();
    let superClass = null;
    if (this.match("KEYWORD") && this.previous().value === "extends") {
      superClass = this.parseIdentifier();
    }
    this.consume("LEFT_BRACE", "Expected '{' for class body");
    const body = [];
    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      // Allow optional 'static' modifier
      let isStatic = false;
      if (this.check("KEYWORD") && this.peek().value === "static") {
        this.advance();
        isStatic = true;
      }
      // Method name must be identifier for now
      const nameToken = this.consume("IDENTIFIER", "Expected method name in class body");
      const nameId = new IdentifierNode(nameToken.value, { line: nameToken.line, column: nameToken.column });
      this.consume("LEFT_PAREN", "Expected '(' after method name");
      const params = this.parseParameterList();
      this.consume("RIGHT_PAREN", "Expected ')' after method parameters");
      const methodBody = this.parseBlockStatement();
      const kind = nameToken.value === "constructor" ? "constructor" : "method";
      body.push(new (require("./phase1_core_ast").MethodDefinitionNode)(nameId, params, methodBody, { static: isStatic, kind, line: nameToken.line, column: nameToken.column }));
      // Optional semicolon between methods is not standard, but be tolerant
      if (this.check("SEMICOLON")) this.advance();
    }
    this.consume("RIGHT_BRACE", "Expected '}' after class body");
    return new ClassDeclarationNode(id, superClass, body, {
      line: token.line,
      column: token.column
    });
  }

  /** Parses a switch statement to an AST shape */
  parseSwitchStatement() {
    const token = this.previous(); // 'switch'
    this.consume("LEFT_PAREN", "Expected '(' after 'switch'");
    const discriminant = this.parseExpression();
    this.consume("RIGHT_PAREN", "Expected ')' after switch discriminant");
    this.consume("LEFT_BRACE", "Expected '{' to start switch cases");
    const cases = [];
    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      if (this.match("KEYWORD") && (this.previous().value === "case" || this.previous().value === "default")) {
        const isDefault = this.previous().value === "default";
        let test = null;
        if (!isDefault) {
          test = this.parseExpression();
        }
        this.consume("COLON", "Expected ':' after case");
        const consequent = [];
        while (!this.check("RIGHT_BRACE") && !(this.check("KEYWORD") && ["case", "default"].includes(this.peek().value)) && !this.isAtEnd()) {
          // collect statements until next case/default or '}'
          consequent.push(this.parseStatement());
        }
        cases.push(new SwitchCaseNode(test, consequent, { line: token.line, column: token.column }));
      } else {
        // Skip unexpected tokens within switch
        this.advance();
      }
    }
    this.consume("RIGHT_BRACE", "Expected '}' to close switch");
    return new SwitchStatementNode(discriminant, cases, { line: token.line, column: token.column });
  }

  /**
     * Parses an arrow function expression.
     * @returns {ArrowFunctionExpressionNode} The AST node for the arrow function.
     * @private
     */
  parseArrowFunction() {
    this.functionDepth++;
        
    const startToken = this.peek();
    let params = [];
        
    if (this.match("IDENTIFIER")) {
      // Single parameter without parentheses
      const param = this.previous();
      params = [new IdentifierNode(param.value, {
        line: param.line,
        column: param.column
      })];
    } else if (this.match("LEFT_PAREN")) {
      // Parameters in parentheses
      if (!this.check("RIGHT_PAREN")) {
        params = this.parseParameterList();
      }
      this.consume("RIGHT_PAREN", "Expected ')' after arrow function parameters");
    } else {
      throw new SyntaxError(`Expected arrow function parameters at line ${this.peek().line}`);
    }
        
    this.consume("ARROW", "Expected '=>' in arrow function");
        
    let body;
    let expression = false;
        
    if (this.check("LEFT_BRACE")) {
      // Block body
      body = this.parseBlockStatement();
      expression = false;
    } else {
      // Expression body
      body = this.parseAssignmentExpression();
      expression = true;
    }
        
    this.functionDepth--;
        
    return new ArrowFunctionExpressionNode(params, body, {
      line: startToken.line,
      column: startToken.column,
      expression
    });
  }

  /**
     * Parses a function expression.
     * @returns {FunctionExpressionNode} The AST node for the function expression.
     * @private
     */
  parseFunctionExpression() {
    this.functionDepth++;
        
    let id = null;
    if (this.check("IDENTIFIER")) {
      id = this.parseIdentifier();
    }
        
    this.consume("LEFT_PAREN", "Expected '(' after 'function'");
    const params = this.parseParameterList();
    this.consume("RIGHT_PAREN", "Expected ')' after parameters");
        
    const body = this.parseBlockStatement();
        
    this.functionDepth--;
        
    return new FunctionExpressionNode(id, params, body, {
      line: this.previous().line,
      column: this.previous().column
    });
  }

  /**
     * Parses an array expression.
     * @returns {ArrayExpressionNode} The AST node for the array expression.
     * @private
     */
  parseArrayExpression() {
    const elements = [];
        
    if (!this.check("RIGHT_BRACKET")) {
      do {
        if (this.check("COMMA")) {
          // Sparse array element
          elements.push(null);
        } else {
          elements.push(this.parseAssignmentExpression());
        }
      } while (this.match("COMMA"));
    }
        
    this.consume("RIGHT_BRACKET", "Expected ']' after array elements");
        
    return new ArrayExpressionNode(elements, {
      line: this.previous().line,
      column: this.previous().column
    });
  }

  /**
     * Parses an object expression.
     * @returns {ObjectExpressionNode} The AST node for the object expression.
     * @private
     */
  parseObjectExpression() {
    const properties = [];
        
    if (!this.check("RIGHT_BRACE")) {
      do {
        const property = this.parseProperty();
        properties.push(property);
      } while (this.match("COMMA") && !this.check("RIGHT_BRACE"));
    }
        
    this.consume("RIGHT_BRACE", "Expected '}' after object properties");
        
    return new ObjectExpressionNode(properties, {
      line: this.previous().line,
      column: this.previous().column
    });
  }

  /**
     * Parses a property in an object literal.
     * @returns {PropertyNode} The AST node for the property.
     * @private
     */
  parseProperty() {
    let key;
    let computed = false;
        
    if (this.match("LEFT_BRACKET")) {
      // Computed property name
      key = this.parseExpression();
      this.consume("RIGHT_BRACKET", "Expected ']' after computed property name");
      computed = true;
    } else if (this.match("STRING", "NUMBER")) {
      // String or number literal key
      const token = this.previous();
      key = new LiteralNode(token.value, token.value.toString(), {
        line: token.line,
        column: token.column
      });
    } else {
      // Identifier key
      key = this.parseIdentifier();
    }
    // Support shorthand {a} as {a: a}
    if (this.check("COMMA") || this.check("RIGHT_BRACE")) {
      return new PropertyNode(key, key, "init", {
        line: key.line,
        column: key.column,
        computed,
        shorthand: true
      });
    }

    this.consume("COLON", "Expected ':' after property key");
    const value = this.parseAssignmentExpression();

    return new PropertyNode(key, value, "init", {
      line: key.line,
      column: key.column,
      computed
    });
  }

  /**
     * Parses a list of parameters for a function.
     * @returns {IdentifierNode[]} An array of identifier nodes for the parameters.
     * @private
     */
  parseParameterList() {
    const params = [];
        
    if (!this.check("RIGHT_PAREN")) {
      do {
        params.push(this.parseIdentifier());
      } while (this.match("COMMA"));
    }
        
    return params;
  }

  /**
     * Parses a list of arguments for a function call.
     * @returns {ASTNode[]} An array of expression nodes for the arguments.
     * @private
     */
  parseArgumentList() {
    const args = [];
        
    if (!this.check("RIGHT_PAREN")) {
      do {
        args.push(this.parseAssignmentExpression());
      } while (this.match("COMMA"));
    }
        
    return args;
  }

  /**
     * Parses an identifier.
     * @returns {IdentifierNode} The AST node for the identifier.
     * @private
     * @throws {SyntaxError} If an identifier is not found.
     */
  parseIdentifier() {
    if (this.match("IDENTIFIER")) {
      const token = this.previous();
      return new IdentifierNode(token.value, {
        line: token.line,
        column: token.column
      });
    }

    throw new SyntaxError(`Expected identifier at line ${this.peek().line}`);
  }

  /** Parses a simple array pattern for destructuring. */
  parseArrayPattern() {
    const start = this.advance(); // consume '['
    const elements = [];
    if (!this.check("RIGHT_BRACKET")) {
      while (!this.check("RIGHT_BRACKET")) {
        if (this.check("COMMA")) {
          elements.push(null);
          this.advance();
          continue;
        }
        elements.push(this.parseIdentifier());
        if (this.match("COMMA")) {
          continue;
        }
        break;
      }
    }
    this.consume("RIGHT_BRACKET", "Expected ']' to close array pattern");
    return new ArrayPatternNode(elements, { line: start.line, column: start.column });
  }

  /**
     * Checks if the current token matches any of the given types, and advances if so.
     * @param {...string} types - The token types to match against.
     * @returns {boolean} True if a match was found.
     * @private
     */
  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  /**
     * Checks the type of the current token without consuming it.
     * @param {string} type - The token type to check for.
     * @returns {boolean} True if the current token matches the type.
     * @private
     */
  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  /**
     * Consumes the current token and advances to the next one.
     * @returns {object} The consumed token.
     * @private
     */
  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  /**
     * Checks if the parser has reached the end of the token stream.
     * @returns {boolean} True if at the end.
     * @private
     */
  isAtEnd() {
    return this.current >= this.tokens.length || this.peek().type === "EOF";
  }

  /**
     * Gets the current token without consuming it.
     * @returns {object} The current token.
     * @private
     */
  peek() {
    if (this.current >= this.tokens.length) {
      return { type: "EOF", value: null, line: 0, column: 0 };
    }
    return this.tokens[this.current];
  }

  /**
     * Gets the previously consumed token.
     * @returns {object} The previous token.
     * @private
     */
  previous() {
    return this.tokens[this.current - 1];
  }

  /**
     * Consumes a token of a specific type, or throws an error if the type does not match.
     * @param {string} type - The expected token type.
     * @param {string} message - The error message to throw on failure.
     * @returns {object} The consumed token.
     * @private
     * @throws {SyntaxError} If the token type does not match.
     */
  consume(type, message) {
    if (this.check(type)) return this.advance();
        
    const token = this.peek();
    throw new SyntaxError(`${message} at line ${token.line}, column ${token.column}. Got '${token.value}'`);
  }

  /**
     * Synchronizes the parser after an error to continue parsing.
     * @private
     */
  synchronize() {
    this.advance();
        
    while (!this.isAtEnd()) {
      if (this.previous().type === "SEMICOLON") return;
            
      if (this.peek().type === "KEYWORD") {
        const keyword = this.peek().value;
        if (["class", "function", "var", "for", "if", "while", "return"].includes(keyword)) {
          return;
        }
      }
            
      this.advance();
    }
  }

  /**
     * Adds a syntax error to the list of errors.
     * @param {string} message - The error message.
     * @private
     */
  addError(message) {
    const token = this.peek();
    this.errors.push({
      type: "SyntaxError",
      message,
      line: token.line,
      column: token.column,
      token: token.value
    });
  }

  /**
     * Checks if any errors have been recorded.
     * @returns {boolean} True if there are errors.
     */
  hasErrors() {
    return this.errors.length > 0;
  }

  /**
     * Gets the list of recorded errors.
     * @returns {object[]} The array of error objects.
     */
  getErrors() {
    return this.errors;
  }
}

module.exports = { LuaScriptParser };

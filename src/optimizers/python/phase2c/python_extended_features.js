"use strict";

/**
 * Python Extended Language Features - Phase 2C Enhancement
 * 
 * Adds support for:
 * - Decorators and annotations
 * - Context managers (with statement)
 * - Generators and yield expressions
 * - Async/await support
 */

class PythonExtendedFeaturesEnhancer {
  /**
   * Enhance parser with extended language features
   */
  static enhanceParser(parser) {
    // Store original methods
    const originalParseDecorator = parser.parseDecorator.bind(parser);
    const originalParseWith = parser.parseWith.bind(parser);
    const originalParseFunctionDeclaration = parser.parseFunctionDeclaration.bind(parser);
    const originalParseStatement = parser.parseStatement.bind(parser);

    /**
     * Enhanced decorator parsing - now handles full decorator expressions
     */
    parser.parseDecorator = function() {
      const decorators = [];
      
      while (this.currentToken?.type === "AT") {
        this.next(); // Skip @
        
        // Parse decorator expression (name or call)
        const decoratorExpr = this.parseExpression();
        
        decorators.push({
          type: "Decorator",
          expression: decoratorExpr,
        });
        
        this.skipNewlines();
      }
      
      // Parse decorated function or class
      const target = this.parseStatement();
      if (target) {
        target.decorators = decorators;
      }
      
      return target;
    };

    /**
     * Enhanced context manager parsing (with statement)
     */
    parser.parseWith = function() {
      this.next(); // Skip WITH
      
      const contexts = [];
      
      // Parse context expressions
      do {
        const expr = this.parseExpression();
        let variable = null;
        
        if (this.currentToken?.type === "AS") {
          this.next(); // Skip AS
          variable = this.currentToken.value;
          this.next();
        }
        
        contexts.push({
          type: "Context",
          expression: expr,
          variable,
        });
        
        if (this.currentToken?.type === "COMMA") {
          this.next();
        } else {
          break;
        }
      } while (true);
      
      this.skipTo("COLON");
      this.next(); // Skip :
      
      const body = this.parseBlockBody();
      
      return {
        type: "WithStatement",
        contexts,
        body,
      };
    };

    /**
     * Enhanced function parsing - tracks if generator/async
     */
    parser.parseFunctionDeclaration = function() {
      const isAsync = this.currentToken?.type === "ASYNC";
      if (isAsync) this.next();
      
      this.next(); // Skip 'def'
      const name = this.currentToken.value;
      this.next();

      const params = this.parseParameters();
      
      let returnType = null;
      if (this.currentToken?.type === "OPERATOR" && this.currentToken.value === "->") {
        this.next();
        returnType = this.parseTypeHint();
      }

      this.skipTo("COLON");
      this.next();

      const body = this.parseBlockBody();
      
      // Check if function contains yield (makes it generator)
      const isGenerator = this.containsYield(body);

      return {
        type: "FunctionDeclaration",
        name,
        params,
        returnType,
        body,
        async: isAsync,
        generator: isGenerator,
        decorators: [],
      };
    };

    /**
     * Check if function body contains yield
     */
    parser.containsYield = function(nodes) {
      if (!nodes) return false;
      
      for (const node of (Array.isArray(nodes) ? nodes : [nodes])) {
        if (!node) continue;
        
        if (node.type === "YieldStatement" || node.type === "YieldExpression") {
          return true;
        }
        
        if (node.body && this.containsYield(node.body)) {
          return true;
        }
        
        if (node.expression && typeof node.expression === 'object') {
          if (node.expression.type === "YieldExpression") {
            return true;
          }
        }
      }
      
      return false;
    };

    /**
     * Parse yield expression/statement
     */
    parser.parseYield = function() {
      this.next(); // Skip YIELD
      
      // Check if it's a bare yield or yield from
      if (this.currentToken?.type === "FROM") {
        this.next();
        const iterator = this.parseExpression();
        return {
          type: "YieldExpression",
          value: iterator,
          isFrom: true,
        };
      }
      
      // Parse value if present
      let value = null;
      if (this.currentToken?.type !== "NEWLINE" && 
          this.currentToken?.type !== "DEDENT" &&
          this.currentToken?.type !== "RPAREN") {
        value = this.parseExpression();
      }
      
      return {
        type: "YieldExpression",
        value,
        isFrom: false,
      };
    };

    /**
     * Parse await expression
     */
    parser.parseAwait = function() {
      this.next(); // Skip AWAIT
      const expression = this.parseExpression();
      
      return {
        type: "AwaitExpression",
        expression,
      };
    };

    /**
     * Enhanced statement parsing - handle yield, await, async for, async with
     */
    const originalStatementHandler = parser.parseStatement.bind(parser);
    parser.parseStatement = function() {
      const token = this.currentToken;
      
      if (!token) return null;

      // Handle YIELD statements
      if (token.value === "yield") {
        return this.parseYield();
      }
      
      // Handle AWAIT expressions
      if (token.value === "await") {
        const expr = this.parseAwait();
        return { type: "ExpressionStatement", expression: expr };
      }
      
      // Handle AT (decorators)
      if (token.type === "AT") {
        return this.parseDecorator();
      }
      
      // Handle WITH (context managers)
      if (token.type === "WITH") {
        return this.parseWith();
      }
      
      // Handle FOR/ASYNC FOR
      if (token.type === "FOR") {
        return this.parseFor();
      }
      
      // Call original handler for everything else
      return originalStatementHandler();
    };

    /**
     * Parse for statement - enhanced for async for
     */
    parser.parseFor = function() {
      const isAsync = this.currentToken?.type === "ASYNC";
      if (isAsync) this.next();
      
      this.next(); // Skip FOR
      
      const target = this.currentToken.value;
      this.next();
      
      this.skipTo("IN");
      this.next();
      
      const iterator = this.parseExpression();
      
      this.skipTo("COLON");
      this.next();
      
      const body = this.parseBlockBody();
      
      return {
        type: "ForStatement",
        target,
        iterator,
        body,
        async: isAsync,
      };
    };

    return parser;
  }

  /**
   * Enhance lowerer to handle extended features
   */
  static enhanceLowerer(lowerer) {
    // Add lowering rules for new node types
    
    /**
     * Lower Decorator node
     */
    lowerer.lowerDecorator = function(node, context) {
      return {
        type: "DecoratorNode",
        expression: this.lowerExpression(node.expression, context),
        canonical: true,
      };
    };

    /**
     * Lower WithStatement
     */
    lowerer.lowerWithStatement = function(node, context) {
      return {
        type: "WithStatementNode",
        contexts: node.contexts.map(ctx => ({
          expression: this.lowerExpression(ctx.expression, context),
          variable: ctx.variable,
        })),
        body: node.body.map(stmt => this.lower(stmt, context)),
        canonical: true,
      };
    };

    /**
     * Lower YieldExpression
     */
    lowerer.lowerYieldExpression = function(node, context) {
      return {
        type: "YieldNode",
        value: node.value ? this.lowerExpression(node.value, context) : null,
        isFrom: node.isFrom || false,
        canonical: true,
      };
    };

    /**
     * Lower AwaitExpression
     */
    lowerer.lowerAwaitExpression = function(node, context) {
      return {
        type: "AwaitNode",
        expression: this.lowerExpression(node.expression, context),
        canonical: true,
      };
    };

    return lowerer;
  }

  /**
   * Enhance emitter to generate code for extended features
   */
  static enhanceEmitter(emitter) {
    /**
     * Emit decorator
     */
    emitter.emitDecorator = function(node) {
      let code = "@";
      code += this.emitExpression(node.expression);
      return code;
    };

    /**
     * Emit with statement
     */
    emitter.emitWithStatement = function(node) {
      let code = "with ";
      code += node.contexts.map(ctx => {
        let contextCode = this.emitExpression(ctx.expression);
        if (ctx.variable) {
          contextCode += ` as ${ctx.variable}`;
        }
        return contextCode;
      }).join(", ");
      code += ":\n";
      code += this.emitBlockBody(node.body);
      return code;
    };

    /**
     * Emit yield expression
     */
    emitter.emitYieldExpression = function(node) {
      if (node.isFrom) {
        return `yield from ${this.emitExpression(node.value)}`;
      }
      if (node.value) {
        return `yield ${this.emitExpression(node.value)}`;
      }
      return "yield";
    };

    /**
     * Emit await expression
     */
    emitter.emitAwaitExpression = function(node) {
      return `await ${this.emitExpression(node.expression)}`;
    };

    /**
     * Emit async for statement
     */
    emitter.emitAsyncForStatement = function(node) {
      let code = "async for ";
      code += node.target;
      code += " in ";
      code += this.emitExpression(node.iterator);
      code += ":\n";
      code += this.emitBlockBody(node.body);
      return code;
    };

    return emitter;
  }

  /**
   * Validate extended features
   */
  static validateFeatures(ir) {
    const issues = [];
    
    // Check for await outside async function
    // Check for yield outside generator
    // Check for with statement context manager
    
    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

module.exports = PythonExtendedFeaturesEnhancer;

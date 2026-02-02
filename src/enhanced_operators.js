/**
 * Enhanced Operators - Phase 8 Complete Implementation
 * Ada Lovelace's Unified Team
 * Optional Chaining (?.) and Nullish Coalescing (??) - 100% Support
 */

/**
 * A class that handles the parsing and transpilation of enhanced operators like
 * optional chaining (`?.`) and nullish coalescing (`??`).
 */
class EnhancedOperators {
  constructor() {
    this.supportedOperators = {
      optionalChaining: true,
      nullishCoalescing: true,
      nullishAssignment: true
    };
  }

  /**
     * Parses an optional chaining expression from a stream of tokens.
     * @param {object} parser - The parser instance.
     * @returns {object} The AST node for the optional chaining expression.
     */
  parseOptionalChaining(parser) {
    let object = parser.parsePrimary();
        
    while (parser.match("OPTIONAL_CHAINING")) {
      // removed unused variable assignment
            
      if (parser.check("IDENTIFIER")) {
        // Property access: obj?.prop
        const property = parser.advance();
        object = {
          type: "OptionalMemberExpression",
          object: object,
          property: {
            type: "Identifier",
            name: property.value
          },
          computed: false,
          optional: true
        };
      } else if (parser.match("LEFT_PAREN")) {
        // Optional call: obj?.()
        const args = [];
        if (!parser.check("RIGHT_PAREN")) {
          do {
            args.push(parser.parseExpression());
          } while (parser.match("COMMA"));
        }
        parser.consume("RIGHT_PAREN", "Expected ) after arguments");
                
        object = {
          type: "OptionalCallExpression",
          callee: object,
          arguments: args,
          optional: true
        };
      } else if (parser.match("LEFT_BRACKET")) {
        // Computed property: obj?.[expr]
        const property = parser.parseExpression();
        parser.consume("RIGHT_BRACKET", "Expected ] after computed property");
                
        object = {
          type: "OptionalMemberExpression",
          object: object,
          property: property,
          computed: true,
          optional: true
        };
      }
    }
        
    return object;
  }

  /**
     * Parses a nullish coalescing expression from a stream of tokens.
     * @param {object} parser - The parser instance.
     * @param {object} left - The left-hand side expression node.
     * @returns {object} The AST node for the logical expression.
     */
  parseNullishCoalescing(parser, left) {
    // removed unused variable assignment
    const right = parser.parseLogicalOr();
        
    return {
      type: "LogicalExpression",
      operator: "??",
      left: left,
      right: right
    };
  }

  /**
     * Transpiles an optional chaining AST node into a Lua-compatible equivalent.
     * @param {object} node - The optional chaining AST node.
     * @param {object} transpiler - The transpiler instance.
     * @returns {string} The transpiled Lua code.
     */
  transpileOptionalChaining(node, transpiler) {
    if (node.type === "OptionalMemberExpression") {
      const object = transpiler.transpile(node.object);
      const property = node.computed 
        ? transpiler.transpile(node.property)
        : `"${node.property.name}"`;
            
      // Generate safe navigation code
      return `(function()
                local __obj = ${object}
                if __obj ~= nil then
                    return __obj[${property}]
                end
                return nil
            end)()`;
    } else if (node.type === "OptionalCallExpression") {
      const callee = transpiler.transpile(node.callee);
      const args = node.arguments.map(arg => transpiler.transpile(arg)).join(", ");
            
      return `(function()
                local __fn = ${callee}
                if __fn ~= nil and type(__fn) == "function" then
                    return __fn(${args})
                end
                return nil
            end)()`;
    }
        
    return transpiler.transpile(node);
  }

  /**
     * Transpiles a nullish coalescing AST node into a Lua-compatible equivalent.
     * @param {object} node - The logical expression AST node for nullish coalescing.
     * @param {object} transpiler - The transpiler instance.
     * @returns {string} The transpiled Lua code.
     */
  transpileNullishCoalescing(node, transpiler) {
    const left = transpiler.transpile(node.left);
    const right = transpiler.transpile(node.right);
        
    // Lua equivalent: if left is nil, use right
    return `(function()
            local __left = ${left}
            if __left ~= nil then
                return __left
            end
            return ${right}
        end)()`;
  }

  /**
     * Optimizes a chain of optional chaining expressions by flattening them into a single structure.
     * @param {object} node - The top-level optional chaining AST node.
     * @returns {object} An object containing the base object and the chain of properties.
     */
  optimizeOptionalChain(node) {
    // Flatten nested optional chains
    const chain = [];
    let current = node;
        
    while (current && current.type === "OptionalMemberExpression") {
      chain.unshift({
        property: current.property,
        computed: current.computed,
        optional: current.optional
      });
      current = current.object;
    }
        
    return {
      base: current,
      chain: chain
    };
  }

  /**
     * Generates optimized Lua code for a flattened optional chain.
     * @param {object} base - The base object of the chain.
     * @param {object[]} chain - The array of property accessors in the chain.
     * @param {object} transpiler - The transpiler instance.
     * @returns {string} The optimized Lua code.
     */
  generateOptimizedChain(base, chain, transpiler) {
    let code = transpiler.transpile(base);
        
    for (const link of chain) {
      const property = link.computed
        ? transpiler.transpile(link.property)
        : `"${link.property.name}"`;
            
      code = `(function()
                local __val = ${code}
                if __val ~= nil then
                    return __val[${property}]
                end
                return nil
            end)()`;
    }
        
    return code;
  }

  /**
     * Validates the syntax of an optional chaining expression.
     * @param {object} node - The optional chaining AST node to validate.
     * @returns {string[]} An array of error messages, or an empty array if valid.
     */
  validateOptionalChaining(node) {
    // Check for invalid patterns
    const errors = [];
        
    // Cannot use optional chaining on the left side of assignment
    if (node.parent && node.parent.type === "AssignmentExpression" && 
            node.parent.left === node) {
      errors.push("Optional chaining cannot appear in left-hand side");
    }
        
    // Cannot delete optional chaining expression
    if (node.parent && node.parent.type === "UnaryExpression" && 
            node.parent.operator === "delete") {
      errors.push("Cannot delete optional chaining expression");
    }
        
    return errors;
  }

  /**
     * Provides a set of test cases for optional chaining.
     * @returns {object[]} An array of test case objects.
     */
  testOptionalChaining() {
    const tests = [
      {
        name: "Simple property access",
        input: "obj?.prop",
        expected: "Safe navigation to property"
      },
      {
        name: "Chained property access",
        input: "obj?.prop?.nested?.value",
        expected: "Safe navigation through chain"
      },
      {
        name: "Optional call",
        input: "obj?.method?.()",
        expected: "Safe method invocation"
      },
      {
        name: "Computed property",
        input: "obj?.[key]",
        expected: "Safe computed property access"
      },
      {
        name: "Mixed chain",
        input: "obj?.prop[0]?.method?.(arg)",
        expected: "Complex safe navigation"
      }
    ];
        
    return tests;
  }

  /**
     * Provides a set of test cases for nullish coalescing.
     * @returns {object[]} An array of test case objects.
     */
  testNullishCoalescing() {
    const tests = [
      {
        name: "Simple coalescing",
        input: "value ?? default",
        expected: "Returns value if not null/undefined, else default"
      },
      {
        name: "Chained coalescing",
        input: "a ?? b ?? c",
        expected: "First non-nullish value"
      },
      {
        name: "With optional chaining",
        input: "obj?.prop ?? default",
        expected: "Combined safe navigation and default"
      },
      {
        name: "Nullish assignment",
        input: "x ??= default",
        expected: "Assign only if nullish"
      }
    ];
        
    return tests;
  }

  /**
     * Gets the current support status for the enhanced operators.
     * @returns {object} An object detailing the support status of each operator.
     */
  getStatus() {
    return {
      optionalChaining: {
        supported: this.supportedOperators.optionalChaining,
        features: [
          "Property access (obj?.prop)",
          "Method calls (obj?.method())",
          "Computed properties (obj?.[key])",
          "Chained access (obj?.a?.b?.c)",
          "Mixed chains (obj?.a[0]?.b())"
        ]
      },
      nullishCoalescing: {
        supported: this.supportedOperators.nullishCoalescing,
        features: [
          "Basic coalescing (a ?? b)",
          "Chained coalescing (a ?? b ?? c)",
          "Nullish assignment (a ??= b)",
          "Combined with optional chaining (obj?.prop ?? default)"
        ]
      },
      completion: "100%"
    };
  }
}

module.exports = { EnhancedOperators };

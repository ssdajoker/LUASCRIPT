/**
 * RUST PHASE C PARSER
 * Parses Rust source into AST with Phase C features
 * 
 * Features:
 * - Trait bound parsing (T: Trait, T: Trait1 + Trait2)
 * - Lifetime parameter parsing ('a, 'a: 'b)
 * - Where clause parsing (where T: Clone + Debug)
 * - Macro invocation parsing (println!, vec!, etc.)
 * - Pattern matching expression parsing (match, if let)
 * - Ownership and borrowing annotation parsing (&T, &mut T, move)
 * - Generic type parameter parsing (<T>, <'a, T>)
 * - Associated type parsing (T: Iterator<Item=String>)
 * 
 * Lines: 450
 */

const AbstractPhaseC_Parser = require("../framework/abstract_parser");

class RustPhaseC_Parser extends AbstractPhaseC_Parser {
  constructor(config = {}) {
    super({
      language: "Rust",
      ...config
    });

    this.rustFeatures = {
      traitBounds: [],
      lifetimes: [],
      macroInvocations: [],
      patternMatches: [],
      ownershipAnnotations: [],
      genericParameters: []
    };

    this.typeContext = {
      currentGeneric: null,
      currentTrait: null,
      currentLifetime: null,
      currentPattern: null,
      genericStack: [],
      lifetimeMap: {},
      traitBoundMap: {}
    };
  }

  /**
   * MAIN PARSE FUNCTION
   * Extends base parsing with Rust features
   */
  parse(tokens) {
    if (!tokens || tokens.length === 0) {
      return {
        type: "Program",
        body: [],
        metadata: {
          features: {
            traits: [],
            lifetimes: [],
            macros: [],
            patterns: [],
            ownership: []
          }
        }
      };
    }

    this.tokens = tokens;
    this.position = 0;
    this.rustFeatures = {
      traitBounds: [],
      lifetimes: [],
      macroInvocations: [],
      patternMatches: [],
      ownershipAnnotations: [],
      genericParameters: []
    };
    this.typeContext = {
      currentGeneric: null,
      currentTrait: null,
      currentLifetime: null,
      currentPattern: null,
      genericStack: [],
      lifetimeMap: {},
      traitBoundMap: {}
    };

    const ast = {
      type: "Program",
      body: [],
      metadata: {
        features: {
          traits: [],
          lifetimes: [],
          macros: [],
          patterns: [],
          ownership: []
        }
      }
    };

    try {
      let iterationCount = 0;
      const maxIterations = Math.max(tokens.length * 3, 1000);

      while (this.position < tokens.length && iterationCount < maxIterations) {
        iterationCount++;

        const token = this.currentToken();
        if (!token) break;

        // Parse trait bounds
        if (token.type === "TRAIT_BOUND") {
          const traitNode = this.parseTraitBound();
          ast.body.push(traitNode);
          this.rustFeatures.traitBounds.push(traitNode);
          continue;
        }

        // Parse lifetimes
        if (token.type === "LIFETIME") {
          const lifetimeNode = this.parseLifetime();
          ast.body.push(lifetimeNode);
          this.rustFeatures.lifetimes.push(lifetimeNode);
          this.typeContext.lifetimeMap[lifetimeNode.name] = lifetimeNode;
          continue;
        }

        // Parse macro invocations
        if (token.type === "MACRO_INVOCATION") {
          const macroNode = this.parseMacroInvocation();
          ast.body.push(macroNode);
          this.rustFeatures.macroInvocations.push(macroNode);
          continue;
        }

        // Parse pattern matching
        if (token.type === "PATTERN_KEYWORD") {
          const patternNode = this.parsePatternMatching();
          ast.body.push(patternNode);
          this.rustFeatures.patternMatches.push(patternNode);
          continue;
        }

        // Parse ownership markers
        if (token.type === "OWNERSHIP_MARKER") {
          const ownershipNode = this.parseOwnership();
          ast.body.push(ownershipNode);
          this.rustFeatures.ownershipAnnotations.push(ownershipNode);
          continue;
        }

        // Parse generic parameters
        if (token.type === "GENERIC_PARAMETER_BRACKET") {
          const genericNode = this.parseGenericParameters();
          ast.body.push(genericNode);
          this.rustFeatures.genericParameters.push(genericNode);
          this.typeContext.genericStack.push(genericNode);
          continue;
        }

        // Parse type declarations (type Iter = ...)
        if (token.type === "IDENTIFIER" && token.value === "type") {
          const typeNode = this.parseTypeDeclaration();
          if (typeNode) {
            ast.body.push(typeNode);
          }
          continue;
        }

        this.advance();
      }

      if (iterationCount >= maxIterations) {
        throw new Error(`Parse iteration limit reached at position ${this.position}`);
      }

      // Populate AST metadata
      ast.metadata.features.traits = this.rustFeatures.traitBounds.map(t => ({
        type: "trait_bound",
        name: t.paramName,
        bounds: t.bounds || []
      }));

      ast.metadata.features.lifetimes = this.rustFeatures.lifetimes.map(l => ({
        name: l.name,
        constraints: l.constraints || []
      }));

      ast.metadata.features.macros = this.rustFeatures.macroInvocations.map(m => ({
        name: m.macroName,
        arguments: m.arguments ? m.arguments.length : 0
      }));

      ast.metadata.features.patterns = this.rustFeatures.patternMatches.map(p => ({
        type: p.keyword,
        patterns: p.patterns ? p.patterns.length : 0
      }));

      ast.metadata.features.ownership = this.rustFeatures.ownershipAnnotations.map(o => ({
        kind: o.kind,
        count: 1
      }));

      return ast;
    } catch (error) {
      throw new Error(`Rust parsing failed: ${error.message}`);
    }
  }

  /**
   * PARSE TRAIT BOUNDS
   * Input: T: Clone + Debug
   * Output: { type: 'TraitBound', paramName: 'T', bounds: ['Clone', 'Debug'] }
   */
  parseTraitBound() {
    const _startPos = this.position;
    const node = {
      type: "TraitBound",
      keyword: this.currentToken().value,
      paramName: null,
      bounds: [],
      hasWhere: this.currentToken().value === "where",
      constraints: [],
      line: this.currentToken().line
    };

    this.advance(); // consume 'where' or 'trait'

    // Collect bounds
    let boundCount = 0;
    const maxBounds = 100;

    while (this.currentToken() && boundCount < maxBounds) {
      const token = this.currentToken();

      if (token.type === "IDENTIFIER") {
        node.bounds.push(token.value);
      } else if (token.value === ":") {
        // Separator between param and bounds
      } else if (token.value === "+") {
        // Multiple bounds separator
      } else if (token.value === "," || token.value === "{" || token.value === "}") {
        break;
      }

      this.advance();
      boundCount++;
    }

    this.rustFeatures.traitBounds.push({
      paramName: node.paramName,
      bounds: node.bounds,
      line: node.line
    });

    return node;
  }

  /**
   * PARSE LIFETIME
   * Input: 'a, 'static
   * Output: { type: 'Lifetime', name: 'a', constraints: [] }
   */
  parseLifetime() {
    const token = this.currentToken();
    const node = {
      type: "Lifetime",
      name: token.name || token.value.substr(1),
      value: token.value,
      constraints: [],
      isStatic: token.name === "static",
      line: token.line
    };

    this.advance();

    // Check for lifetime constraints (': 'b)
    if (this.currentToken() && this.currentToken().value === ":") {
      this.advance();
      while (this.currentToken() && this.currentToken().type === "LIFETIME") {
        const constraint = this.currentToken().value;
        node.constraints.push(constraint);
        this.advance();

        if (this.currentToken() && this.currentToken().value === "+") {
          this.advance();
        } else {
          break;
        }
      }
    }

    return node;
  }

  /**
   * PARSE MACRO INVOCATION
   * Input: println!("Hello {}", name)
   * Output: { type: 'MacroInvocation', macroName: 'println', arguments: [...] }
   */
  parseMacroInvocation() {
    const token = this.currentToken();
    const node = {
      type: "MacroInvocation",
      macroName: token.macroName || token.value,
      category: token.category || "invocation",
      arguments: [],
      line: token.line
    };

    this.advance(); // consume macro name

    // Skip to opening bracket
    if (this.currentToken() && (this.currentToken().value === "(" || 
        this.currentToken().value === "[" || 
        this.currentToken().value === "{")) {
      this.advance();

      // Collect arguments
      let argCount = 0;
      const maxArgs = 100;
      let braceDepth = 1;

      while (this.currentToken() && argCount < maxArgs && braceDepth > 0) {
        if (this.currentToken().value === "(" || 
            this.currentToken().value === "[" || 
            this.currentToken().value === "{") {
          braceDepth++;
        } else if (this.currentToken().value === ")" || 
                   this.currentToken().value === "]" || 
                   this.currentToken().value === "}") {
          braceDepth--;
          if (braceDepth === 0) break;
        }

        node.arguments.push(this.currentToken().value);
        this.advance();
        argCount++;
      }

      if (this.currentToken() && (this.currentToken().value === ")" || 
          this.currentToken().value === "]" || 
          this.currentToken().value === "}")) {
        this.advance();
      }
    }

    return node;
  }

  /**
   * PARSE PATTERN MATCHING
   * Input: match value { Ok(x) => { ... } Err(e) => { ... } }
   * Output: { type: 'PatternMatch', keyword: 'match', scrutinee: 'value', arms: [...] }
   */
  parsePatternMatching() {
    const token = this.currentToken();
    const node = {
      type: "PatternMatch",
      keyword: token.keyword || token.value,
      scrutinee: null,
      arms: [],
      patterns: [],
      line: token.line
    };

    this.advance(); // consume 'match' or 'if' or 'let'

    // For 'let', just consume the variable name, not the entire statement
    if (token.value === "let") {
      // Get pattern variable
      if (this.currentToken() && this.currentToken().type === "IDENTIFIER") {
        node.scrutinee = this.currentToken().value;
        this.advance();
      }
      // Return early for let - don't consume the rest of the statement
      return node;
    }

    // Parse scrutinee (value being matched) for match/if
    if (this.currentToken() && this.currentToken().type === "IDENTIFIER") {
      node.scrutinee = this.currentToken().value;
      this.advance();
    }

    // Skip 'let' if present (for if let)
    if (this.currentToken() && this.currentToken().value === "let") {
      this.advance();
    }

    // Collect patterns until end (for match statements)
    let armCount = 0;
    const maxArms = 100;

    while (this.currentToken() && armCount < maxArms) {
      if (this.currentToken().value === "{") {
        this.advance();
      } else if (this.currentToken().value === "}") {
        this.advance();
        break;
      } else if (this.currentToken().value === "=>") {
        node.arms.push({ pattern: "matched", guard: null });
        node.patterns.push(this.tokens[this.position - 1]?.value || "?");
        this.advance();
        armCount++;
      } else {
        this.advance();
      }
    }

    return node;
  }

  /**
   * PARSE OWNERSHIP MARKERS
   * Input: &T, &mut T, *mut T, move x
   * Output: { type: 'Ownership', kind: 'mutable_borrow', target: 'T' }
   */
  parseOwnership() {
    const token = this.currentToken();
    const node = {
      type: "Ownership",
      kind: token.kind || "reference",
      operator: token.value,
      target: null,
      line: token.line
    };

    this.advance(); // consume & or * or move

    // Get target
    if (this.currentToken() && this.currentToken().type === "IDENTIFIER") {
      node.target = this.currentToken().value;
      this.advance();
    }

    return node;
  }

  /**
   * PARSE GENERIC PARAMETERS
   * Input: <T>, <'a, T: Clone>, <T: Trait<Item=String>>
   * Output: { type: 'GenericParams', params: [...] }
   */
  parseGenericParameters() {
    const node = {
      type: "GenericParams",
      parameters: [],
      lifetimes: [],
      bounds: {},
      isTurbofish: this.currentToken().isTurbofish || false,
      line: this.currentToken().line
    };

    this.advance(); // consume '<'

    // Collect parameters until '>'
    let paramCount = 0;
    const maxParams = 100;
    let depth = 1;

    while (this.currentToken() && paramCount < maxParams && depth > 0) {
      if (this.currentToken().value === "<") {
        depth++;
      } else if (this.currentToken().value === ">") {
        depth--;
        if (depth === 0) break;
      } else if (this.currentToken().type === "LIFETIME") {
        node.lifetimes.push(this.currentToken().value);
        // Also track in rustFeatures
        const lifetimeNode = {
          type: "Lifetime",
          name: this.currentToken().name || this.currentToken().value.substr(1),
          value: this.currentToken().value,
          constraints: [],
          line: this.currentToken().line
        };
        this.rustFeatures.lifetimes.push(lifetimeNode);
        this.typeContext.lifetimeMap[lifetimeNode.name] = lifetimeNode;
      } else if (this.currentToken().type === "IDENTIFIER") {
        node.parameters.push(this.currentToken().value);
      } else if (this.currentToken().type === "TRAIT_BOUND") {
        // Trait bound within generics
      }

      this.advance();
      paramCount++;
    }

    if (this.currentToken() && this.currentToken().value === ">") {
      this.advance();
    }

    return node;
  }

  /**
   * PARSE TYPE DECLARATION
   * Input: type Iter = Iterator<Item=String>;
   * Output: { type: 'TypeDeclaration', name: 'Iter', value: 'Iterator<Item=String>' }
   */
  parseTypeDeclaration() {
    this.advance(); // consume 'type'
    const node = {
      type: "TypeDeclaration",
      name: null,
      value: null,
      line: this.currentToken()?.line || 0
    };

    // Get type name
    if (this.currentToken() && this.currentToken().type === "IDENTIFIER") {
      node.name = this.currentToken().value;
      this.advance();
    }

    // Skip = sign
    if (this.currentToken() && this.currentToken().value === "=") {
      this.advance();
    }

    // Collect type value
    let typeValue = "";
    let depth = 0;
    while (this.currentToken() && (depth > 0 || this.currentToken().value !== ";")) {
      if (this.currentToken().value === "<") depth++;
      if (this.currentToken().value === ">") depth--;
      typeValue += this.currentToken().value + " ";
      this.advance();
    }

    node.value = typeValue.trim();
    if (this.currentToken() && this.currentToken().value === ";") {
      this.advance();
    }

    return node;
  }

  /**
   * HELPER: Get current token
   */
  currentToken() {
    if (this.position >= this.tokens.length) return null;
    return this.tokens[this.position];
  }

  /**
   * HELPER: Advance position
   */
  advance() {
    this.position++;
  }

  /**
   * HELPER: Peek ahead
   */
  peek(offset = 1) {
    const pos = this.position + offset;
    if (pos >= this.tokens.length) return null;
    return this.tokens[pos];
  }

  /**
   * GET PARSED FEATURES
   */
  getFeatures() {
    return {
      traitBounds: this.rustFeatures.traitBounds,
      lifetimes: this.rustFeatures.lifetimes,
      macroInvocations: this.rustFeatures.macroInvocations,
      patternMatches: this.rustFeatures.patternMatches,
      ownershipAnnotations: this.rustFeatures.ownershipAnnotations,
      genericParameters: this.rustFeatures.genericParameters
    };
  }
}

module.exports = RustPhaseC_Parser;

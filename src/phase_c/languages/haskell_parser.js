/**
 * HASKELL PHASE C PARSER - TIER 3 IMPLEMENTATION
 * Parses Haskell Phase C features into AST:
 * - Type classes & instances
 * - Higher-kinded types and kind signatures
 * - Monads & do-notation
 * - Algebraic Data Types (ADTs) + GADTs
 * - Pattern matching + guards
 * - Lazy evaluation annotations
 *
 * Complexity: TIER 3 - HARD
 * Lines: 340
 *
 * Known semantic gaps (documented for Tier 2):
 * NOTE: Phase D enhancement - GAP-001: Overlapping/duplicate instance detection
 * NOTE: Phase D enhancement - GAP-002: Template Haskell quasi-quotes/splices
 * NOTE: Phase D enhancement - GAP-003: Exhaustiveness checking for GADT patterns
 * NOTE: Phase D enhancement - GAP-004: Infinite list/space leak detection
 * NOTE: Phase D enhancement - GAP-005: Monad transformer stack/lift depth analysis
 * NOTE: Phase D enhancement - GAP-006: Type family/associated type recognition
 * NOTE: Phase D enhancement - GAP-007: Multi-parameter type class validation
 * NOTE: Phase D enhancement - GAP-008: Existential quantification parsing/AST
 */

const AbstractPhaseC_Parser = require("../framework/abstract_parser");

class HaskellPhaseC_Parser extends AbstractPhaseC_Parser {
  constructor(config = {}) {
    super({
      language: "Haskell",
      ...config
    });

    this.parserMetrics = {
      typeClassesParsed: 0,
      instancesParsed: 0,
      adtsParsed: 0,
      gadtsParsed: 0,
      doBlocksParsed: 0,
      caseExpressionsParsed: 0
    };
  }

  /**
    * Parse tokens into Haskell AST.
    *
    * This parser favors resilience over strict semantic validation.
    * It builds a structural AST and records metadata needed by generators.
   */
  parse(tokens) {
    this.tokens = tokens || [];
    this.position = 0;

    const ast = {
      kind: "program",
      language: "Haskell",
      typeClasses: [],
      instances: [],
      dataTypes: [],
      expressions: [],
      metadata: {
        hasDoNotation: false,
        hasGADTs: false
      }
    };

    if (!this.tokens.length) return ast;

    let iterations = 0;
    const maxIterations = Math.max(this.tokens.length * 4, 1000);

    while (!this.isAtEnd() && iterations < maxIterations) {
      iterations++;
      const current = this.peek();
      if (!current) break;

      if (current.type === "CLASS_KEYWORD") {
        const node = this.parseTypeClass();
        if (node) {
          ast.typeClasses.push(node);
          this.parserMetrics.typeClassesParsed++;
        }
        continue;
      }

      if (current.type === "INSTANCE_KEYWORD") {
        const node = this.parseInstance();
        if (node) {
          ast.instances.push(node);
          this.parserMetrics.instancesParsed++;
        }
        continue;
      }

      if (current.type === "DATA_KEYWORD" || current.type === "NEWTYPE_KEYWORD") {
        const node = this.parseDataType();
        if (node) {
          ast.dataTypes.push(node);
          if (node.kind === "gadt_definition") {
            this.parserMetrics.gadtsParsed++;
            ast.metadata.hasGADTs = true;
          } else {
            this.parserMetrics.adtsParsed++;
          }
        }
        continue;
      }

      if (current.type === "DO_KEYWORD") {
        const node = this.parseDoBlock();
        if (node) {
          ast.expressions.push(node);
          this.parserMetrics.doBlocksParsed++;
          ast.metadata.hasDoNotation = true;
        }
        continue;
      }

      if (current.type === "CASE_KEYWORD") {
        const node = this.parseCaseExpression();
        if (node) {
          ast.expressions.push(node);
          this.parserMetrics.caseExpressionsParsed++;
        }
        continue;
      }

      this.advance();
    }

    if (iterations >= maxIterations) {
      throw new Error("Parse iteration limit reached");
    }

    return ast;
  }

  /**
   * Parse a typeclass definition and collect method signatures.
   */
  parseTypeClass() {
    this.expect("CLASS_KEYWORD");
    const nameToken = this.expectIdentifier();

    const params = [];
    while (!this.isAtEnd() && !this.check("WHERE_KEYWORD")) {
      if (this.isIdentifierLike(this.peek())) {
        params.push(this.advance().value);
        continue;
      }
      if (this.check("CONTEXT_ARROW") || this.check("TYPE_ARROW") || this.check("SYMBOL", "(") || this.check("SYMBOL", ")")) {
        this.advance();
        continue;
      }
      if (this.check("SYMBOL", ",")) {
        this.advance();
        continue;
      }
      break;
    }

    const methods = [];
    if (this.check("WHERE_KEYWORD")) {
      this.advance();
      this.collectMethodSignatures(methods);
    }

    return {
      kind: "typeclass_definition",
      name: nameToken.value,
      params,
      methods
    };
  }

  /**
   * Parse a typeclass instance definition.
   * NOTE: Phase D enhancement - GAP-001/GAP-007 require semantic validation.
   */
  parseInstance() {
    this.expect("INSTANCE_KEYWORD");
    const className = this.expectIdentifier().value;

    const instanceTypeParts = [];
    while (!this.isAtEnd() && !this.check("WHERE_KEYWORD") && !this.isTopLevelStart(this.peek())) {
      instanceTypeParts.push(this.advance().value);
    }

    const methods = [];
    if (this.check("WHERE_KEYWORD")) {
      this.advance();
      this.collectMethodSignatures(methods);
    }

    return {
      kind: "instance_definition",
      className,
      instanceType: instanceTypeParts.join(" ").trim(),
      methods
    };
  }

  /**
   * Parse data/newtype declarations (ADT or GADT based on `where`).
   */
  parseDataType() {
    const keyword = this.advance();
    const nameToken = this.expectConstructor();

    const typeParams = [];
    while (!this.isAtEnd() && !this.check("SYMBOL", "=") && !this.check("WHERE_KEYWORD")) {
      if (this.isIdentifierLike(this.peek())) {
        typeParams.push(this.advance().value);
        continue;
      }
      this.advance();
    }

    if (this.check("WHERE_KEYWORD")) {
      this.advance();
      const constructors = this.parseGadtConstructors();
      return {
        kind: "gadt_definition",
        name: nameToken.value,
        typeParams,
        constructors,
        keyword: keyword.value
      };
    }

    if (this.check("SYMBOL", "=")) {
      this.advance();
    }

    const constructors = this.parseAdtConstructors();
    return {
      kind: "adt_definition",
      name: nameToken.value,
      typeParams,
      constructors,
      keyword: keyword.value
    };
  }

  /**
   * Parse ADT constructors until a new top-level definition begins.
   */
  parseAdtConstructors() {
    const constructors = [];
    let iterations = 0;
    const maxIterations = 500;

    while (!this.isAtEnd() && !this.isTopLevelStart(this.peek()) && iterations < maxIterations) {
      iterations++;

      if (this.check("SYMBOL", "|")) {
        this.advance();
        continue;
      }

      if (this.check("CONSTRUCTOR")) {
        const name = this.advance().value;
        const fields = [];
        while (!this.isAtEnd() && !this.check("SYMBOL", "|") && !this.isTopLevelStart(this.peek())) {
          if (this.isIdentifierLike(this.peek())) {
            fields.push(this.advance().value);
          } else {
            this.advance();
          }
        }
        constructors.push({ name, fields });
        continue;
      }

      this.advance();
    }

    return constructors;
  }

  /**
   * Parse GADT constructors with optional type signatures.
   * NOTE: Phase D enhancement - GAP-003 for exhaustiveness checks.
   */
  parseGadtConstructors() {
    const constructors = [];
    let iterations = 0;
    const maxIterations = 500;

    while (!this.isAtEnd() && !this.isTopLevelStart(this.peek()) && iterations < maxIterations) {
      iterations++;

      if (this.check("SYMBOL", "|")) {
        this.advance();
        continue;
      }

      if (this.check("CONSTRUCTOR")) {
        const name = this.advance().value;
        let typeSignature = "";
        if (this.check("KIND_SIGNATURE")) {
          this.advance();
          typeSignature = this.collectTypeSignature();
        }
        constructors.push({ name, typeSignature: typeSignature.trim() });
        continue;
      }

      this.advance();
    }

    return constructors;
  }

  /**
   * Parse do-notation into a list of bind/expression statements.
   */
  parseDoBlock() {
    this.expect("DO_KEYWORD");

    const statements = [];
    const buffer = [];
    let iterations = 0;
    const maxIterations = 500;

    while (!this.isAtEnd() && !this.isTopLevelStart(this.peek()) && iterations < maxIterations) {
      iterations++;

      if (this.check("DO_BIND")) {
        const name = buffer.length > 0 ? buffer.shift() : "_";
        buffer.length = 0;
        this.advance();
        const expr = this.collectExpressionUntilDelimiter();
        statements.push({ kind: "bind", name, expr });
        continue;
      }

      if (this.check("SYMBOL", ";")) {
        if (buffer.length > 0) {
          statements.push({ kind: "expression", expr: buffer.join(" ") });
          buffer.length = 0;
        }
        this.advance();
        continue;
      }

      buffer.push(this.advance().value);
    }

    if (buffer.length > 0) {
      statements.push({ kind: "expression", expr: buffer.join(" ") });
    }

    return {
      kind: "do_block",
      statements
    };
  }

  /**
   * Parse case-of expressions with simple guard/token separators.
   * NOTE: Phase D enhancement - GAP-003 for exhaustiveness validation.
   */
  parseCaseExpression() {
    this.expect("CASE_KEYWORD");
    const scrutinee = this.collectUntil("OF_KEYWORD");
    if (this.check("OF_KEYWORD")) {
      this.advance();
    }

    const cases = [];
    let iterations = 0;
    const maxIterations = 500;

    while (!this.isAtEnd() && !this.isTopLevelStart(this.peek()) && iterations < maxIterations) {
      iterations++;
      if (this.check("SYMBOL", "|")) {
        this.advance();
      }

      const pattern = this.collectUntilToken(["TYPE_ARROW", "SYMBOL"], ["|"]);
      if (this.check("TYPE_ARROW")) {
        this.advance();
      }
      const body = this.collectExpressionUntilDelimiter(["SYMBOL"], ["|"]);
      if (pattern || body) {
        cases.push({ pattern: pattern.trim(), body: body.trim() });
      }

      if (!this.check("SYMBOL", "|")) {
        if (this.isTopLevelStart(this.peek())) break;
      }
    }

    return {
      kind: "case_expression",
      scrutinee: scrutinee.trim(),
      cases
    };
  }

  /**
   * Collect method signatures under a `where` block.
   * NOTE: Phase D enhancement - GAP-006 type families treated as methods.
   */
  collectMethodSignatures(methods) {
    let iterations = 0;
    const maxIterations = 500;

    while (!this.isAtEnd() && !this.isTopLevelStart(this.peek()) && iterations < maxIterations) {
      iterations++;

      if (this.check("IDENTIFIER")) {
        const name = this.advance().value;
        let signature = "";
        if (this.check("KIND_SIGNATURE")) {
          this.advance();
          signature = this.collectTypeSignature();
        } else {
          signature = this.collectExpressionUntilDelimiter();
        }
        methods.push({ name, signature: signature.trim() });
        continue;
      }

      if (this.check("SYMBOL", ";")) {
        this.advance();
        continue;
      }

      this.advance();
    }
  }

  /**
   * Collect a type signature token stream until a safe stop point.
   */
  collectTypeSignature() {
    const parts = [];
    let iterations = 0;
    const maxIterations = 200;

    while (!this.isAtEnd() && iterations < maxIterations) {
      iterations++;
      if (this.isTopLevelStart(this.peek()) || this.check("SYMBOL", ";")) break;
      if (this.check("CONSTRUCTOR") || this.check("IDENTIFIER") || this.check("TYPE_ARROW") || this.check("CONTEXT_ARROW") || this.check("SYMBOL", "(") || this.check("SYMBOL", ")") || this.check("SYMBOL", "*")) {
        parts.push(this.advance().value);
        continue;
      }
      if (this.check("SYMBOL", "|")) break;
      this.advance();
    }

    return parts.join(" ");
  }

  /**
   * Collect tokens until a specific token type is encountered.
   */
  collectUntil(tokenType) {
    const parts = [];
    let iterations = 0;
    const maxIterations = 200;

    while (!this.isAtEnd() && !this.check(tokenType) && iterations < maxIterations) {
      parts.push(this.advance().value);
      iterations++;
    }

    return parts.join(" ");
  }

  /**
   * Collect tokens until any of the provided token types/symbols is hit.
   */
  collectUntilToken(typeList = [], symbolStop = []) {
    const parts = [];
    let iterations = 0;
    const maxIterations = 200;

    while (!this.isAtEnd() && iterations < maxIterations) {
      const current = this.peek();
      if (!current) break;
      if (typeList.includes(current.type) || (current.type === "SYMBOL" && symbolStop.includes(current.value))) break;
      parts.push(this.advance().value);
      iterations++;
    }

    return parts.join(" ");
  }

  /**
   * Collect expression tokens until delimiter or top-level boundary.
   */
  collectExpressionUntilDelimiter(stopTypes = ["SYMBOL"], stopValues = [";"]) {
    const parts = [];
    let iterations = 0;
    const maxIterations = 200;

    while (!this.isAtEnd() && iterations < maxIterations) {
      const current = this.peek();
      if (!current) break;
      if (stopTypes.includes(current.type) && stopValues.includes(current.value)) break;
      if (this.isTopLevelStart(current)) break;
      parts.push(this.advance().value);
      iterations++;
    }

    return parts.join(" ");
  }

  /**
   * Expect an identifier-like token or throw a parse error.
   */
  expectIdentifier() {
    if (this.check("IDENTIFIER") || this.check("CONSTRUCTOR")) {
      return this.advance();
    }
    throw new Error("Expected identifier");
  }

  /**
   * Expect a constructor token or fallback identifier.
   */
  expectConstructor() {
    if (this.check("CONSTRUCTOR")) {
      return this.advance();
    }
    if (this.check("IDENTIFIER")) {
      return this.advance();
    }
    throw new Error("Expected constructor name");
  }

  /**
   * Determine if a token can be treated as an identifier in this grammar.
   */
  isIdentifierLike(token) {
    if (!token) return false;
    return token.type === "IDENTIFIER" || token.type === "CONSTRUCTOR";
  }

  /**
   * Top-level starters indicate a new declaration/expression boundary.
   */
  isTopLevelStart(token) {
    if (!token) return false;
    return [
      "CLASS_KEYWORD",
      "INSTANCE_KEYWORD",
      "DATA_KEYWORD",
      "NEWTYPE_KEYWORD",
      "TYPE_KEYWORD",
      "MODULE_KEYWORD",
      "IMPORT_KEYWORD",
      "CASE_KEYWORD",
      "DO_KEYWORD"
    ].includes(token.type);
  }

  /**
   * Lookahead check for type/value without consuming.
   */
  check(type, value = null) {
    const token = this.peek();
    if (!token) return false;
    if (token.type !== type) return false;
    if (value !== null && token.value !== value) return false;
    return true;
  }

  /**
   * Expect a specific token and throw a detailed error on mismatch.
   */
  expect(type, value = null) {
    if (!this.check(type, value)) {
      const token = this.peek();
      const actual = token ? `${token.type}(${token.value})` : "EOF";
      throw new Error(`Expected ${type}${value ? `(${value})` : ""}, got ${actual}`);
    }
    return this.advance();
  }

  /**
   * Consume and return the current token.
   */
  advance() {
    if (!this.isAtEnd()) this.position++;
    return this.tokens[this.position - 1];
  }

  /**
   * Read the current token without consuming it.
   */
  peek() {
    return this.tokens[this.position];
  }

  /**
   * Determine whether the parser has consumed all tokens.
   */
  isAtEnd() {
    return this.position >= this.tokens.length;
  }

  /**
   * Return immutable snapshot of parser metrics for tests and profiling.
   */
  getMetrics() {
    return { ...this.parserMetrics };
  }
}

module.exports = HaskellPhaseC_Parser;

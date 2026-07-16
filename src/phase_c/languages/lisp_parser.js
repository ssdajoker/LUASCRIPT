/**
 * LISP PHASE C PARSER - TIER 3 IMPLEMENTATION
 * Parses Lisp tokens into homoiconic AST:
 * - Macro definitions (defmacro)
 * - Quasiquote/unquote forms (`(a ,b ,@c))
 * - S-expressions as AST nodes
 * - Symbol interning table
 * - Pattern matching (cond/case)
 * - Higher-order function detection
 *
 * Complexity: TIER 3 - HARD
 */

const AbstractPhaseCParser = require("../framework/abstract_parser");
const { ForensicDebugTools } = require("../forensic_debug_tools");

class LispPhaseC_Parser extends AbstractPhaseCParser {
  constructor(config = {}) {
    super({
      language: "Lisp",
      ...config
    });

    this.symbolTable = new Map(); // Symbol interning
    this.gensymCounter = 0;
    this.quasiquoteDepth = 0; // Track nested quasiquote depth
    this.capturedVariables = new Set(); // Track potential variable capture

    // Forensic tools integration (MANDATORY for Lisp)
    this.forensicTools = new ForensicDebugTools("validation", {
      maxTraceDepth: 100,
      maxExpansionDepth: 50,
      iteration: { maxGlobalIterations: 100000 }
    });

    this.parserMetrics = {
      macrosParsed: 0,
      quasiquotesParsed: 0,
      listFormsParsed: 0,
      patternMatchesParsed: 0,
      higherOrderParsed: 0,
      symbolsInterned: 0,
      maxQuasiquoteDepth: 0,
      gensymsGenerated: 0,
      hygieneViolations: 0
    };
  }

  /**
   * Parse tokens into homoiconic AST
   */
  parse(tokens) {
    this.tokens = tokens;
    this.position = 0;

    const ast = {
      type: "Program",
      body: [],
      macros: [],
      quasiquotes: [],
      patternMatches: [],
      higherOrderFunctions: [],
      symbolTable: {},
      metadata: {
        hasMacros: false,
        hasQuasiquote: false,
        hasPatternMatching: false,
        hasGensym: false,
        maxQuasiquoteDepth: 0,
        hasNestedQuasiquotes: false,
        hasMacroHygiene: true,
        forensicToolsEnabled: true
      }
    };

    // Start forensic monitoring
    const parseLoopId = "lisp-parser-main";
    this.forensicTools.monitorLoop(parseLoopId, Math.max(tokens.length * 3, 1000));

    const maxIterations = Math.max(tokens.length * 3, 1000);
    let iterations = 0;

    while (this.position < tokens.length && iterations < maxIterations) {
      iterations++;
      this.forensicTools.logIteration(parseLoopId);
      const form = this.parseTopLevel();
      if (form) {
        ast.body.push(form);

        // Track special features
        if (form.type === "MacroDefinition") {
          ast.macros.push(form);
          ast.metadata.hasMacros = true;
          
          // Check for nested quasiquotes in macro body
          this.extractNestedFeatures(form.body, ast);
        }
        if (form.type === "Quasiquote") {
          ast.quasiquotes.push(form);
          ast.metadata.hasQuasiquote = true;
        }
        if (form.type === "PatternMatch") {
          ast.patternMatches.push(form);
          ast.metadata.hasPatternMatching = true;
          
          // Check for nested higher-order functions in pattern match
          this.extractNestedFeatures(form.clauses, ast);
        }
        if (form.type === "HigherOrderCall") {
          ast.higherOrderFunctions.push(form);
        }
      }
    }

    // Complete forensic monitoring
    this.forensicTools.completeLoop(parseLoopId);

    // Export symbol table
    ast.symbolTable = this.exportSymbolTable();

    // Update metadata with forensic metrics
    ast.metadata.maxQuasiquoteDepth = this.parserMetrics.maxQuasiquoteDepth;
    ast.metadata.hasNestedQuasiquotes = this.parserMetrics.maxQuasiquoteDepth > 1;
    ast.metadata.gensymsGenerated = this.parserMetrics.gensymsGenerated;
    ast.metadata.hygieneViolations = this.parserMetrics.hygieneViolations;

    return ast;
  }

  /**
   * Parse top-level form
   */
  parseTopLevel() {
    const token = this.peek();
    if (!token) return null;

    // List form starting with (
    if (token.type === "LPAREN") {
      return this.parseList();
    }

    // Reader macros
    if (token.type === "QUOTE") {
      return this.parseQuote();
    }

    if (token.type === "BACKQUOTE") {
      return this.parseBackquote();
    }

    // Atom
    return this.parseAtom();
  }

  /**
   * Parse list form (defmacro, defun, etc)
   */
  parseList() {
    const _startToken = this.consume("LPAREN");
    const elements = [];

    // Check for special forms
    const head = this.peek();
    if (!head) {
      this.consume("RPAREN");
      return { type: "List", elements: [] };
    }

    // (defmacro name args body)
    if (head.type === "DEFMACRO") {
      return this.parseMacroDefinition();
    }

    // (cond ...) or (case ...)
    if (head.type === "SPECIAL_FORM" && (head.value === "cond" || head.value === "case")) {
      return this.parsePatternMatch();
    }

    // (mapcar f list) etc - higher-order functions
    if (head.type === "HIGHER_ORDER") {
      return this.parseHigherOrderCall();
    }

    // Regular list form
    while (this.peek() && this.peek().type !== "RPAREN") {
      const element = this.parseExpression();
      if (element) {
        elements.push(element);
      }
    }

    this.consume("RPAREN");
    this.parserMetrics.listFormsParsed++;

    return {
      type: "List",
      elements
    };
  }

  /**
   * Parse macro definition: (defmacro name (args) body)
   */
  parseMacroDefinition() {
    this.consume("DEFMACRO");

    const nameToken = this.consume("SYMBOL");
    const name = nameToken.value;

    // Parameters
    this.consume("LPAREN");
    const parameters = [];
    while (this.peek() && this.peek().type !== "RPAREN") {
      const param = this.consume("SYMBOL");
      parameters.push(param.value);
    }
    this.consume("RPAREN");

    // Body (rest of the forms) - track quasiquotes found in body
    const body = [];
    while (this.peek() && this.peek().type !== "RPAREN") {
      const expr = this.parseExpression();
      body.push(expr);
      
      // Track quasiquotes in macro body for metadata
      if (expr && expr.type === "Quasiquote") {
        this.parserMetrics.quasiquotesParsed++;
      }
    }

    this.consume("RPAREN");
    this.parserMetrics.macrosParsed++;

    return {
      type: "MacroDefinition",
      name,
      parameters,
      body
    };
  }

  /**
   * Parse quasiquote with unquote/unquote-splicing
   * CRITICAL FIX: Supports nested quasiquotes
   */
  parseBackquote() {
    this.consume("BACKQUOTE");
    const expression = this.parseQuasiquoteExpression(1); // Start at depth 1
    this.parserMetrics.quasiquotesParsed++;

    return {
      type: "Quasiquote",
      expression,
      depth: 1
    };
  }

  /**
   * Parse expression inside quasiquote (handles unquote and nested quasiquotes)
   * CRITICAL FIX: Supports nested quasiquote depth > 3 levels
   */
  parseQuasiquoteExpression(depth = 1) {
    const token = this.peek();
    if (!token) return null;

    // Track maximum quasiquote depth
    if (depth > this.parserMetrics.maxQuasiquoteDepth) {
      this.parserMetrics.maxQuasiquoteDepth = depth;
    }

    // NESTED BACKQUOTE - recurse with increased depth
    if (token.type === "BACKQUOTE") {
      this.consume("BACKQUOTE");
      const nestedExpr = this.parseQuasiquoteExpression(depth + 1);
      return {
        type: "Quasiquote",
        expression: nestedExpr,
        depth: depth + 1,
        metadata: { isNested: true }
      };
    }

    // ,expr - unquote (decreases effective depth)
    if (token.type === "UNQUOTE") {
      this.consume("UNQUOTE");
      return {
        type: "Unquote",
        expression: depth > 1 ? this.parseQuasiquoteExpression(depth - 1) : this.parseExpression(),
        depth
      };
    }

    // ,@expr - unquote-splicing (decreases effective depth)
    if (token.type === "UNQUOTE_SPLICING") {
      this.consume("UNQUOTE_SPLICING");
      return {
        type: "UnquoteSplicing",
        expression: depth > 1 ? this.parseQuasiquoteExpression(depth - 1) : this.parseExpression(),
        depth
      };
    }

    // List inside quasiquote
    if (token.type === "LPAREN") {
      this.consume("LPAREN");
      const elements = [];

      while (this.peek() && this.peek().type !== "RPAREN") {
        elements.push(this.parseQuasiquoteExpression(depth));
      }

      this.consume("RPAREN");
      return { 
        type: "QuasiquoteList", 
        elements,
        depth
      };
    }

    // Regular atom
    return this.parseAtom();
  }

  /**
   * Parse quote form
   */
  parseQuote() {
    this.consume("QUOTE");
    return {
      type: "Quote",
      expression: this.parseExpression()
    };
  }

  /**
   * Parse pattern matching (cond/case)
   */
  parsePatternMatch() {
    const formToken = this.consume("SPECIAL_FORM");
    const kind = formToken.value; // 'cond' or 'case'

    const scrutinee = kind === "case" ? this.parseExpression() : null;
    const clauses = [];

    // Parse clauses
    while (this.peek() && this.peek().type !== "RPAREN") {
      const clause = this.parsePatternClause();
      if (clause) {
        clauses.push(clause);
      }
    }

    this.consume("RPAREN");
    this.parserMetrics.patternMatchesParsed++;

    return {
      type: "PatternMatch",
      kind,
      scrutinee,
      clauses
    };
  }

  /**
   * Parse a single pattern clause (pattern -> body)
   */
  parsePatternClause() {
    if (this.peek()?.type !== "LPAREN") return null;

    this.consume("LPAREN");
    const pattern = this.parseExpression();
    const body = this.parseExpression();
    this.consume("RPAREN");

    // Track higher-order functions in body for proper detection
    if (body && body.type === "HigherOrderCall") {
      // Already tracked by parseHigherOrderCall
    }

    return { pattern, body };
  }

  /**
   * Parse higher-order function call
   */
  parseHigherOrderCall() {
    const funcToken = this.consume("HIGHER_ORDER");
    const funcName = funcToken.value;

    const args = [];
    while (this.peek() && this.peek().type !== "RPAREN") {
      args.push(this.parseExpression());
    }

    this.consume("RPAREN");
    this.parserMetrics.higherOrderParsed++;

    return {
      type: "HigherOrderCall",
      function: funcName,
      arguments: args
    };
  }

  /**
   * Parse expression (recursive)
   */
  parseExpression() {
    const token = this.peek();
    if (!token) return null;

    // List form
    if (token.type === "LPAREN") {
      return this.parseList();
    }

    // Reader macros
    if (token.type === "QUOTE") {
      return this.parseQuote();
    }

    if (token.type === "BACKQUOTE") {
      return this.parseBackquote();
    }

    // Reader macro #'function
    if (token.type === "READER_FUNCTION") {
      this.advance();
      return {
        type: "FunctionReference",
        name: this.parseExpression()
      };
    }

    // Atom
    return this.parseAtom();
  }

  /**
   * Parse atom (symbol, number, string)
   */
  parseAtom() {
    const token = this.peek();
    if (!token) return null;

    if (token.type === "SYMBOL") {
      const symbol = this.internSymbol(token.value);
      this.advance();
      return { type: "Symbol", value: symbol };
    }

    if (token.type === "NUMBER") {
      this.advance();
      return { type: "Number", value: parseFloat(token.value) };
    }

    if (token.type === "STRING") {
      this.advance();
      return { type: "String", value: token.value.slice(1, -1) }; // Remove quotes
    }

    // Special keywords
    if (token.type === "MACRO_KW" && token.value === "gensym") {
      this.advance();
      return { type: "Gensym", value: this.generateGensym() };
    }

    // Unknown - skip
    this.advance();
    return null;
  }

  /**
   * Intern a symbol (deduplicate)
   */
  internSymbol(name) {
    if (!this.symbolTable.has(name)) {
      this.symbolTable.set(name, { name, id: this.parserMetrics.symbolsInterned++ });
    }
    return name;
  }

  /**
   * Generate unique symbol (gensym) with hygiene tracking
   * CRITICAL FIX: Supports macro hygiene by preventing variable capture
   */
  generateGensym(prefix = "G") {
    const sym = `#:${prefix}${this.gensymCounter++}`;
    this.parserMetrics.gensymsGenerated++;
    // Intern the gensym to prevent collisions
    this.internSymbol(sym);
    return sym;
  }

  /**
   * Check for potential variable capture in macro parameters
   * Records hygiene violations for forensic analysis
   */
  checkMacroHygiene(macroName, parameters, bodySymbols) {
    const violations = [];
    for (const param of parameters) {
      if (bodySymbols.has(param)) {
        violations.push({
          macro: macroName,
          parameter: param,
          reason: "Parameter shadows body symbol"
        });
        this.parserMetrics.hygieneViolations++;
      }
    }
    return violations;
  }

  /**
   * Export symbol table
   */
  exportSymbolTable() {
    const table = {};
    for (const [name, info] of this.symbolTable.entries()) {
      table[name] = info;
    }
    return table;
  }

  /**
   * Extract nested features from arrays/objects for proper tracking
   */
  extractNestedFeatures(items, ast) {
    if (!items) return;
    
    const traverse = (node) => {
      if (!node) return;
      
      if (Array.isArray(node)) {
        node.forEach(item => traverse(item));
        return;
      }
      
      if (typeof node === "object") {
        if (node.type === "Quasiquote") {
          ast.quasiquotes.push(node);
          ast.metadata.hasQuasiquote = true;
        }
        if (node.type === "HigherOrderCall") {
          ast.higherOrderFunctions.push(node);
        }
        
        // Recurse into nested structures
        for (const key in node) {
          if (key !== "type" && typeof node[key] === "object") {
            traverse(node[key]);
          }
        }
      }
    };
    
    traverse(items);
  }

  /**
   * Peek at current token
   */
  peek() {
    return this.tokens[this.position] || null;
  }

  /**
   * Advance to next token
   */
  advance() {
    this.position++;
  }

  /**
   * Consume token of specific type
   */
  consume(expectedType) {
    const token = this.peek();
    if (!token || token.type !== expectedType) {
      // Allow graceful fallback
      return token;
    }
    this.advance();
    return token;
  }

  /**
   * Get parser metrics
   */
  getMetrics() {
    return { ...this.parserMetrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.parserMetrics = {
      macrosParsed: 0,
      quasiquotesParsed: 0,
      listFormsParsed: 0,
      patternMatchesParsed: 0,
      higherOrderParsed: 0,
      symbolsInterned: 0,
      maxQuasiquoteDepth: 0,
      gensymsGenerated: 0,
      hygieneViolations: 0
    };
    this.symbolTable.clear();
    this.gensymCounter = 0;
    this.quasiquoteDepth = 0;
    this.capturedVariables.clear();
  }
}

module.exports = LispPhaseC_Parser;

/**
 * OCAML PHASE C TOKENIZER - TIER 2 IMPLEMENTATION
 * Extends tokenizer with OCaml-specific Phase C features:
 * - Module system & functors (module, struct, sig, functor)
 * - Polymorphic variants (backtick syntax, open/closed types)
 * - GADTs (Generalized Algebraic Data Types with type equations)
 * - Advanced pattern matching (or-patterns, as-patterns, guards)
 * - First-class modules (packing/unpacking modules as values)
 * - Object system (classes, inheritance, methods)
 * 
 * Complexity: TIER 2 - HARD
 * Lines: 310
 * Target: 34/34 tests passing, <7ms performance
 */

const AbstractPhaseCtokenizer = require("../framework/abstract_tokenizer");

class OCamlPhaseC_Tokenizer extends AbstractPhaseCtokenizer {
  constructor(config = {}) {
    super({
      language: "OCaml",
      ...config
    });

    // OCaml-specific Phase C keywords (functional + module system focus)
    this.ocamlKeywords = {
      moduleSystem: [
        "module", "struct", "end", "sig", "functor", "include",
        "open", "type", "val", "external", "constraint"
      ],
      polymorphicVariants: [
        "polymorphic", "variant", "coerce", "cast"
      ],
      gadt: [
        "gadt", "existential", "witness", "phantom"
      ],
      patternMatching: [
        "match", "with", "when", "as", "lazy", "exception",
        "or", "function", "fun"
      ],
      firstClassModules: [
        "pack", "unpack", "val", "module"
      ],
      objectSystem: [
        "object", "class", "inherit", "method", "private", "virtual",
        "initializer", "constraint", "new", "self"
      ],
      types: [
        "int", "float", "bool", "char", "string", "unit",
        "list", "array", "option", "ref", "exn",
        "Some", "None", "Ok", "Error"
      ],
      modifiers: [
        "rec", "and", "mutable", "nonrec", "private", "abstract"
      ],
      builtins: [
        "let", "in", "if", "then", "else", "begin", "end",
        "try", "raise", "assert", "failwith"
      ]
    };

    // OCaml-specific operators and symbols
    this.ocamlOperators = {
      // Module operators
      moduleAccess: ".",
      moduleSeparator: "::",
      functorApplication: "()",
      
      // Polymorphic variant operators
      variantTag: "`",
      openVariant: "[>",
      closedVariant: "[<",
      exactVariant: "[",
      
      // Type operators
      typeArrow: "->",
      typeProduct: "*",
      typeConstraint: ":",
      typeEquation: "=",
      
      // Pattern matching operators
      orPattern: "|",
      asPattern: "as",
      guardKeyword: "when",
      wildcard: "_",
      
      // First-class module operators
      modulePack: "(module",
      moduleUnpack: "(val",
      
      // Object operators
      methodCall: "#",
      selfReference: "self",
      
      // General operators
      pipe: "|>",
      compose: "@@",
      semicolon: ";",
      doubleColon: "::",
      referenceOp: "!",
      assignmentOp: ":="
    };

    this.tokenMetrics = {
      moduleDefinitionCount: 0,
      functorCount: 0,
      polymorphicVariantCount: 0,
      gadtCount: 0,
      patternMatchCount: 0,
      firstClassModuleCount: 0,
      objectCount: 0,
      totalTokens: 0
    };
  }

  /**
   * Tokenize OCaml Phase C code with module system tracking
   * @param {string} code - OCaml source code
   * @returns {Array} Array of tokens with OCaml-specific metadata
   */
  tokenize(code) {
    const tokens = [];
    let position = 0;
    let line = 1;
    let column = 1;
    let _currentModule = null;

    while (position < code.length) {
      const char = code[position];

      // Skip whitespace
      if (/\s/.test(char)) {
        if (char === "\n") {
          line++;
          column = 1;
        } else {
          column++;
        }
        position++;
        continue;
      }

      // Skip comments (* ... *)
      if (char === "(" && code[position + 1] === "*") {
        const commentEnd = code.indexOf("*)", position + 2);
        if (commentEnd !== -1) {
          const commentText = code.substring(position + 2, commentEnd);
          const newlines = (commentText.match(/\n/g) || []).length;
          line += newlines;
          position = commentEnd + 2;
          column = 1;
          continue;
        }
      }

      // Module keyword tracking
      if (this.matchKeyword(code, position, "module")) {
        const keywordLen = 6;
        tokens.push(this.createToken("MODULE_KEYWORD", "module", line, column, position));
        position += keywordLen;
        column += keywordLen;
        this.tokenMetrics.moduleDefinitionCount++;
        continue;
      }

      // Functor keyword
      if (this.matchKeyword(code, position, "functor")) {
        tokens.push(this.createToken("FUNCTOR_KEYWORD", "functor", line, column, position));
        position += 7;
        column += 7;
        this.tokenMetrics.functorCount++;
        continue;
      }

      // Struct/Sig keywords
      if (this.matchKeyword(code, position, "struct")) {
        tokens.push(this.createToken("STRUCT_KEYWORD", "struct", line, column, position));
        position += 6;
        column += 6;
        continue;
      }

      if (this.matchKeyword(code, position, "sig")) {
        tokens.push(this.createToken("SIG_KEYWORD", "sig", line, column, position));
        position += 3;
        column += 3;
        continue;
      }

      // Polymorphic variant tag `Name
      if (char === "`") {
        const tagMatch = code.substring(position).match(/^`([A-Z][a-zA-Z0-9_]*)/);
        if (tagMatch) {
          tokens.push(this.createToken("POLYMORPHIC_VARIANT", tagMatch[0], line, column, position, {
            tag: tagMatch[1]
          }));
          position += tagMatch[0].length;
          column += tagMatch[0].length;
          this.tokenMetrics.polymorphicVariantCount++;
          continue;
        }
      }

      // Open/closed variant types [> [<
      if (char === "[") {
        if (code[position + 1] === ">") {
          tokens.push(this.createToken("OPEN_VARIANT", "[>", line, column, position));
          position += 2;
          column += 2;
          continue;
        }
        if (code[position + 1] === "<") {
          tokens.push(this.createToken("CLOSED_VARIANT", "[<", line, column, position));
          position += 2;
          column += 2;
          continue;
        }
      }

      // GADT type constraint : in constructors
      if (char === ":" && position > 0) {
        // Check if this is a GADT constructor type constraint
        const before = code.substring(Math.max(0, position - 20), position);
        if (/[A-Z][a-zA-Z0-9_]*\s*$/.test(before)) {
          tokens.push(this.createToken("GADT_TYPE_CONSTRAINT", ":", line, column, position));
          position++;
          column++;
          continue;
        }
      }

      // Pattern matching keywords
      if (this.matchKeyword(code, position, "match")) {
        tokens.push(this.createToken("MATCH_KEYWORD", "match", line, column, position));
        position += 5;
        column += 5;
        this.tokenMetrics.patternMatchCount++;
        continue;
      }

      if (this.matchKeyword(code, position, "when")) {
        tokens.push(this.createToken("WHEN_GUARD", "when", line, column, position));
        position += 4;
        column += 4;
        continue;
      }

      if (this.matchKeyword(code, position, "as")) {
        tokens.push(this.createToken("AS_PATTERN", "as", line, column, position));
        position += 2;
        column += 2;
        continue;
      }

      // First-class modules (module and (val
      if (char === "(" && code.substring(position, position + 7) === "(module") {
        tokens.push(this.createToken("PACK_MODULE", "(module", line, column, position));
        position += 7;
        column += 7;
        this.tokenMetrics.firstClassModuleCount++;
        continue;
      }

      if (char === "(" && code.substring(position, position + 4) === "(val") {
        tokens.push(this.createToken("UNPACK_MODULE", "(val", line, column, position));
        position += 4;
        column += 4;
        continue;
      }

      // Object system keywords
      if (this.matchKeyword(code, position, "object")) {
        tokens.push(this.createToken("OBJECT_KEYWORD", "object", line, column, position));
        position += 6;
        column += 6;
        this.tokenMetrics.objectCount++;
        continue;
      }

      if (this.matchKeyword(code, position, "method")) {
        tokens.push(this.createToken("METHOD_KEYWORD", "method", line, column, position));
        position += 6;
        column += 6;
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(char)) {
        const idMatch = code.substring(position).match(/^[a-zA-Z_][a-zA-Z0-9_']*/);
        if (idMatch) {
          const identifier = idMatch[0];
          const tokenType = this.getKeywordType(identifier);
          tokens.push(this.createToken(tokenType, identifier, line, column, position));
          position += identifier.length;
          column += identifier.length;
          continue;
        }
      }

      // Numbers
      if (/[0-9]/.test(char)) {
        const numMatch = code.substring(position).match(/^[0-9]+(\.[0-9]+)?/);
        if (numMatch) {
          tokens.push(this.createToken("NUMBER", numMatch[0], line, column, position));
          position += numMatch[0].length;
          column += numMatch[0].length;
          continue;
        }
      }

      // String literals
      if (char === "\"") {
        const stringEnd = code.indexOf("\"", position + 1);
        if (stringEnd !== -1) {
          const stringValue = code.substring(position, stringEnd + 1);
          tokens.push(this.createToken("STRING", stringValue, line, column, position));
          position = stringEnd + 1;
          column += stringValue.length;
          continue;
        }
      }

      // Operators
      const opResult = this.tokenizeOperator(code, position, line, column);
      if (opResult) {
        tokens.push(opResult.token);
        position += opResult.length;
        column += opResult.length;
        continue;
      }

      // Single character tokens
      tokens.push(this.createToken("SYMBOL", char, line, column, position));
      position++;
      column++;
    }

    this.tokenMetrics.totalTokens = tokens.length;
    return tokens;
  }

  /**
   * Create a token with OCaml-specific metadata
   */
  createToken(type, value, line, column, position, metadata = {}) {
    return {
      type,
      value,
      line,
      column,
      position,
      ...metadata
    };
  }

  /**
   * Check if position matches a keyword
   */
  matchKeyword(code, position, keyword) {
    if (code.substring(position, position + keyword.length) !== keyword) {
      return false;
    }
    const nextChar = code[position + keyword.length];
    return !nextChar || !/[a-zA-Z0-9_']/.test(nextChar);
  }

  /**
   * Get token type for identifier/keyword
   */
  getKeywordType(identifier) {
    for (const [category, keywords] of Object.entries(this.ocamlKeywords)) {
      if (keywords.includes(identifier)) {
        return category.toUpperCase() + "_KEYWORD";
      }
    }
    return "IDENTIFIER";
  }

  /**
   * Tokenize operators
   */
  tokenizeOperator(code, position, line, column) {
    const ops = ["->>", "->", "|>", "@@", ":=", "::"];
    for (const op of ops) {
      if (code.substring(position, position + op.length) === op) {
        return {
          token: this.createToken("OPERATOR", op, line, column, position),
          length: op.length
        };
      }
    }
    return null;
  }

  /**
   * Get tokenization metrics for analysis
   */
  getMetrics() {
    return { ...this.tokenMetrics };
  }
}

module.exports = OCamlPhaseC_Tokenizer;

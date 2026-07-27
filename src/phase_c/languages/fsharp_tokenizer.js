/**
 * F# PHASE C TOKENIZER - TIER 3 IMPLEMENTATION
 * Extends tokenizer with F# Phase C features:
 * - Computation expressions (async/seq/task/option)
 * - Active patterns (|A|B|)
 * - Discriminated unions + records
 * - Units of measure
 * - Type providers (simulated)
 * - Pattern matching + guards
 *
 * Complexity: TIER 3 - HARD
 */

const AbstractPhaseCtokenizer = require("../framework/abstract_tokenizer");

class FSharpPhaseC_Tokenizer extends AbstractPhaseCtokenizer {
  constructor(config = {}) {
    super({
      language: "FSharp",
      ...config
    });

    this.keywords = {
      computationBuilders: ["async", "seq", "task", "option", "result"],
      computationKeywords: ["let!", "do!", "use!", "return", "return!", "yield", "yield!"],
      patternMatching: ["match", "with", "when"],
      types: ["type", "of", "and"],
      misc: ["let", "open", "module", "namespace", "function", "fun"]
    };

    this.tokenMetrics = {
      computationKeywordCount: 0,
      activePatternCount: 0,
      measureCount: 0,
      unionCount: 0,
      recordCount: 0,
      typeProviderCount: 0,
      totalTokens: 0
    };
  }

  tokenize(code) {
    const tokens = [];
    let position = 0;
    let line = 1;
    let column = 1;

    if (!code || code.length === 0) return tokens;

    const maxIterations = Math.max(code.length * 3, 1000);
    let iterations = 0;

    while (position < code.length && iterations < maxIterations) {
      iterations++;
      const char = code[position];

      if (this.isWhitespace(char)) {
        if (char === "\n") {
          line++;
          column = 1;
        } else {
          column++;
        }
        position++;
        continue;
      }

      // Line comments //
      if (char === "/" && code[position + 1] === "/") {
        while (position < code.length && code[position] !== "\n") {
          position++;
          column++;
        }
        continue;
      }

      // Block comments (* ... *)
      if (char === "(" && code[position + 1] === "*") {
        const end = code.indexOf("*)", position + 2);
        if (end === -1) break;
        const commentText = code.substring(position + 2, end);
        const newlines = (commentText.match(/\n/g) || []).length;
        line += newlines;
        position = end + 2;
        column = 1;
        continue;
      }

      // Measure annotation [<Measure>]
      if (code.substring(position, position + 11) === "[<Measure>]") {
        tokens.push(this.createToken("MEASURE_ANNOTATION", "[<Measure>]", line, column, position));
        this.tokenMetrics.measureCount++;
        position += 11;
        column += 11;
        continue;
      }

      // Computation expression keywords (let!, do!, use!, return!, yield!)
      const ceKeyword = this.matchComputationKeyword(code, position);
      if (ceKeyword) {
        tokens.push(this.createToken(ceKeyword.type, ceKeyword.value, line, column, position));
        this.tokenMetrics.computationKeywordCount++;
        position += ceKeyword.length;
        column += ceKeyword.length;
        continue;
      }

      // Active pattern start/end
      if (code.substring(position, position + 2) === "(|") {
        tokens.push(this.createToken("ACTIVE_PATTERN_START", "(|", line, column, position));
        this.tokenMetrics.activePatternCount++;
        position += 2;
        column += 2;
        continue;
      }
      if (code.substring(position, position + 2) === "|)") {
        tokens.push(this.createToken("ACTIVE_PATTERN_END", "|)", line, column, position));
        position += 2;
        column += 2;
        continue;
      }

      // Operators and arrows
      const opResult = this.tokenizeOperator(code, position, line, column);
      if (opResult) {
        tokens.push(opResult.token);
        position += opResult.length;
        column += opResult.length;
        continue;
      }

      // Strings
      if (char === "\"") {
        let str = "\"";
        position++;
        column++;
        while (position < code.length && code[position] !== "\"") {
          str += code[position];
          position++;
          column++;
        }
        if (code[position] === "\"") {
          str += "\"";
          position++;
          column++;
        }
        tokens.push(this.createToken("STRING", str, line, column, position));
        continue;
      }

      // Numbers (with optional measure <m>)
      if (/[0-9]/.test(char)) {
        const numMatch = code.substring(position).match(/^[0-9]+(\.[0-9]+)?/);
        if (numMatch) {
          tokens.push(this.createToken("NUMBER", numMatch[0], line, column, position));
          position += numMatch[0].length;
          column += numMatch[0].length;

          // Measure suffix <m>
          const measureMatch = code.substring(position).match(/^<([A-Za-z][A-Za-z0-9_]*)>/);
          if (measureMatch) {
            tokens.push(this.createToken("MEASURE_TYPE", `<${measureMatch[1]}>`, line, column, position));
            this.tokenMetrics.measureCount++;
            position += measureMatch[0].length;
            column += measureMatch[0].length;
          }
          continue;
        }
      }

      // Identifiers & keywords
      if (/[A-Za-z_]/.test(char)) {
        const match = code.substring(position).match(/^[A-Za-z_][A-Za-z0-9_']*/);
        if (match) {
          const identifier = match[0];
          const tokenType = this.getKeywordType(identifier);
          const token = this.createToken(tokenType, identifier, line, column, position);
          tokens.push(token);

          if (tokenType === "TYPE_KEYWORD") this.tokenMetrics.unionCount++;
          if (tokenType === "RECORD_KEYWORD") this.tokenMetrics.recordCount++;
          if (tokenType === "TYPE_PROVIDER") this.tokenMetrics.typeProviderCount++;
          if (tokenType === "CE_BUILDER") this.tokenMetrics.computationKeywordCount++;

          position += identifier.length;
          column += identifier.length;
          continue;
        }
      }

      // Measure types in annotations (e.g., float<m>)
      const measureType = code.substring(position).match(/^<([A-Za-z][A-Za-z0-9_]*)>/);
      if (measureType) {
        tokens.push(this.createToken("MEASURE_TYPE", `<${measureType[1]}>`, line, column, position));
        this.tokenMetrics.measureCount++;
        position += measureType[0].length;
        column += measureType[0].length;
        continue;
      }

      // Single character symbol
      tokens.push(this.createToken("SYMBOL", char, line, column, position));
      position++;
      column++;
    }

    if (iterations >= maxIterations) {
      this.profiling.errors.push("Tokenization iteration limit reached");
    }

    this.tokenMetrics.totalTokens = tokens.length;
    return tokens;
  }

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

  getKeywordType(identifier) {
    if (this.keywords.computationBuilders.includes(identifier)) return "CE_BUILDER";
    if (this.keywords.patternMatching.includes(identifier)) {
      return identifier === "match" ? "MATCH_KEYWORD" : (identifier === "with" ? "WITH_KEYWORD" : "WHEN_KEYWORD");
    }
    if (identifier === "type") return "TYPE_KEYWORD";
    if (identifier === "of") return "OF_KEYWORD";
    if (identifier === "and") return "AND_KEYWORD";
    if (identifier === "let") return "LET_KEYWORD";
    if (identifier === "return") return "CE_RETURN";
    if (identifier === "yield") return "CE_YIELD";
    if (identifier.endsWith("Provider")) return "TYPE_PROVIDER";

    if (/^[A-Z]/.test(identifier)) return "CONSTRUCTOR";
    return "IDENTIFIER";
  }

  matchComputationKeyword(code, position) {
    const keywords = [
      { value: "let!", type: "CE_LET_BANG" },
      { value: "do!", type: "CE_DO_BANG" },
      { value: "use!", type: "CE_USE_BANG" },
      { value: "return!", type: "CE_RETURN_BANG" },
      { value: "yield!", type: "CE_YIELD_BANG" }
    ];

    for (const entry of keywords) {
      if (code.substring(position, position + entry.value.length) === entry.value) {
        return { ...entry, length: entry.value.length };
      }
    }

    return null;
  }

  tokenizeOperator(code, position, line, column) {
    const ops = [
      { op: "->", type: "ARROW" },
      { op: "<-", type: "ASSIGN_LEFT" },
      { op: "|>", type: "PIPE_FORWARD" },
      { op: "||", type: "OR" },
      { op: "&&", type: "AND" },
      { op: "|", type: "PIPE" },
      { op: "=", type: "EQUALS" },
      { op: ":", type: "COLON" }
    ];

    for (const entry of ops) {
      if (code.substring(position, position + entry.op.length) === entry.op) {
        return {
          token: this.createToken(entry.type, entry.op, line, column, position),
          length: entry.op.length
        };
      }
    }

    return null;
  }

  getMetrics() {
    return { ...this.tokenMetrics };
  }
}

module.exports = FSharpPhaseC_Tokenizer;

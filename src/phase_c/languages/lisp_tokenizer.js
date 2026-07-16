/**
 * LISP PHASE C TOKENIZER - TIER 3 IMPLEMENTATION
 * Extends tokenizer with Lisp-specific Phase C features:
 * - Macros + Quasiquote/Unquote (`thing `(a ,b ,@c))
 * - Homoiconic symbols (everything is data)
 * - Symbol interning + gensym
 * - Reader macros (#' #. etc)
 * - List forms and s-expressions
 * - Special forms (defmacro, quote, backquote)
 *
 * Complexity: TIER 3 - HARD
 */

const AbstractPhaseCtokenizer = require("../framework/abstract_tokenizer");

class LispPhaseC_Tokenizer extends AbstractPhaseCtokenizer {
  constructor(config = {}) {
    super({
      language: "Lisp",
      ...config
    });

    this.keywords = {
      specialForms: ["defmacro", "quote", "backquote", "quasiquote", "unquote", "unquote-splicing"],
      macros: ["defmacro", "macroexpand", "macroexpand-1", "gensym"],
      coreSpecial: ["defun", "lambda", "let", "cond", "case", "if", "progn"],
      higherOrder: ["mapcar", "reduce", "filter", "apply", "funcall"]
    };

    this.readerMacros = {
      quote: "'",
      backquote: "`",
      unquote: ",",
      unquoteSplicing: ",@",
      function: "#'",
      sharpDot: "#."
    };

    this.tokenMetrics = {
      macroDefCount: 0,
      quasiquoteCount: 0,
      unquoteCount: 0,
      readerMacroCount: 0,
      symbolCount: 0,
      gensymCount: 0,
      listFormCount: 0,
      totalTokens: 0
    };
  }

  /**
   * Tokenize Lisp Phase C code with iteration bounds
   */
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

      // Whitespace
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

      // Line comment ;
      if (char === ";") {
        while (position < code.length && code[position] !== "\n") {
          position++;
          column++;
        }
        continue;
      }

      // String literals
      if (char === "\"") {
        const stringResult = this.tokenizeString(code, position, line, column);
        tokens.push(stringResult.token);
        position += stringResult.length;
        column += stringResult.length;
        continue;
      }

      // Reader macro: ,@ (unquote-splicing) - must check before ,
      if (code.substring(position, position + 2) === ",@") {
        tokens.push(this.createToken("UNQUOTE_SPLICING", ",@", line, column, position));
        this.tokenMetrics.unquoteCount++;
        this.tokenMetrics.readerMacroCount++;
        position += 2;
        column += 2;
        continue;
      }

      // Reader macro: #' (function)
      if (code.substring(position, position + 2) === "#'") {
        tokens.push(this.createToken("READER_FUNCTION", "#'", line, column, position));
        this.tokenMetrics.readerMacroCount++;
        position += 2;
        column += 2;
        continue;
      }

      // Reader macro: #. (sharp-dot)
      if (code.substring(position, position + 2) === "#.") {
        tokens.push(this.createToken("READER_SHARP_DOT", "#.", line, column, position));
        this.tokenMetrics.readerMacroCount++;
        position += 2;
        column += 2;
        continue;
      }

      // Single character reader macros
      if (char === "'") {
        tokens.push(this.createToken("QUOTE", "'", line, column, position));
        position++;
        column++;
        continue;
      }

      if (char === "`") {
        tokens.push(this.createToken("BACKQUOTE", "`", line, column, position));
        this.tokenMetrics.quasiquoteCount++;
        position++;
        column++;
        continue;
      }

      if (char === ",") {
        tokens.push(this.createToken("UNQUOTE", ",", line, column, position));
        this.tokenMetrics.unquoteCount++;
        position++;
        column++;
        continue;
      }

      // Parentheses (list forms)
      if (char === "(") {
        tokens.push(this.createToken("LPAREN", "(", line, column, position));
        this.tokenMetrics.listFormCount++;
        position++;
        column++;
        continue;
      }

      if (char === ")") {
        tokens.push(this.createToken("RPAREN", ")", line, column, position));
        position++;
        column++;
        continue;
      }

      // Numbers
      if (/[0-9]/.test(char) || (char === "-" && /[0-9]/.test(code[position + 1]))) {
        const numResult = this.tokenizeNumber(code, position, line, column);
        tokens.push(numResult.token);
        position += numResult.length;
        column += numResult.length;
        continue;
      }

      // Symbols and keywords
      if (this.isSymbolStart(char)) {
        const symResult = this.tokenizeSymbol(code, position, line, column);
        tokens.push(symResult.token);
        position += symResult.length;
        column += symResult.length;
        continue;
      }

      // Unknown character - skip
      position++;
      column++;
    }

    this.tokenMetrics.totalTokens = tokens.length;
    return tokens;
  }

  /**
   * Check if character can start a symbol
   */
  isSymbolStart(char) {
    return /[a-zA-Z_*+\-/<>=!?]/.test(char);
  }

  /**
   * Check if character can continue a symbol
   */
  isSymbolContinue(char) {
    return /[a-zA-Z0-9_*+\-/<>=!?]/.test(char);
  }

  /**
   * Tokenize a symbol or keyword
   */
  tokenizeSymbol(code, start, line, column) {
    let end = start;
    while (end < code.length && this.isSymbolContinue(code[end])) {
      end++;
    }

    const value = code.substring(start, end);
    const length = value.length;

    // Check for special keywords
    if (this.keywords.specialForms.includes(value)) {
      if (value === "defmacro") {
        this.tokenMetrics.macroDefCount++;
        return { token: this.createToken("DEFMACRO", value, line, column, start), length };
      }
      if (value === "quasiquote" || value === "backquote") {
        this.tokenMetrics.quasiquoteCount++;
        return { token: this.createToken("QUASIQUOTE_KW", value, line, column, start), length };
      }
      if (value === "unquote") {
        this.tokenMetrics.unquoteCount++;
        return { token: this.createToken("UNQUOTE_KW", value, line, column, start), length };
      }
      if (value === "unquote-splicing") {
        this.tokenMetrics.unquoteCount++;
        return { token: this.createToken("UNQUOTE_SPLICING_KW", value, line, column, start), length };
      }
      if (value === "quote") {
        return { token: this.createToken("QUOTE_KW", value, line, column, start), length };
      }
    }

    if (this.keywords.macros.includes(value)) {
      if (value === "gensym") {
        this.tokenMetrics.gensymCount++;
      }
      return { token: this.createToken("MACRO_KW", value, line, column, start), length };
    }

    if (this.keywords.coreSpecial.includes(value)) {
      return { token: this.createToken("SPECIAL_FORM", value, line, column, start), length };
    }

    if (this.keywords.higherOrder.includes(value)) {
      return { token: this.createToken("HIGHER_ORDER", value, line, column, start), length };
    }

    // Regular symbol
    this.tokenMetrics.symbolCount++;
    return { token: this.createToken("SYMBOL", value, line, column, start), length };
  }

  /**
   * Tokenize a string literal
   */
  tokenizeString(code, start, line, column) {
    let end = start + 1;
    let escaped = false;

    while (end < code.length) {
      if (escaped) {
        escaped = false;
        end++;
        continue;
      }

      if (code[end] === "\\") {
        escaped = true;
        end++;
        continue;
      }

      if (code[end] === "\"") {
        end++;
        break;
      }

      end++;
    }

    const value = code.substring(start, end);
    const length = value.length;
    return { token: this.createToken("STRING", value, line, column, start), length };
  }

  /**
   * Tokenize a number
   */
  tokenizeNumber(code, start, line, column) {
    let end = start;
    let hasDecimal = false;

    // Handle negative sign
    if (code[end] === "-") {
      end++;
    }

    while (end < code.length) {
      const char = code[end];
      if (/[0-9]/.test(char)) {
        end++;
      } else if (char === "." && !hasDecimal) {
        hasDecimal = true;
        end++;
      } else {
        break;
      }
    }

    const value = code.substring(start, end);
    const length = value.length;
    return { token: this.createToken("NUMBER", value, line, column, start), length };
  }

  /**
   * Check if character is whitespace
   */
  isWhitespace(char) {
    return /\s/.test(char);
  }

  /**
   * Create a token
   */
  createToken(type, value, line, column, position) {
    return {
      type,
      value,
      line,
      column,
      position
    };
  }

  /**
   * Get tokenization metrics
   */
  getMetrics() {
    return { ...this.tokenMetrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.tokenMetrics = {
      macroDefCount: 0,
      quasiquoteCount: 0,
      unquoteCount: 0,
      readerMacroCount: 0,
      symbolCount: 0,
      gensymCount: 0,
      listFormCount: 0,
      totalTokens: 0
    };
  }
}

module.exports = LispPhaseC_Tokenizer;

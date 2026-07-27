/**
 * KOTLIN PHASE C TOKENIZER
 * Extends tokenizer with Kotlin-specific Phase C features:
 * - Extension functions (fun Type.name())
 * - Coroutines (suspend, launch, async, flow)
 * - Reified generics (inline fun <reified T>)
 * - DSL builders (lambda with receiver: Type.() -> Unit)
 * - Data classes & sealed classes
 * - Smart casts & null safety (is, as, ?, !!)
 * 
 * Lines: 290
 */

const AbstractPhaseCtokenizer = require("../framework/abstract_tokenizer");

class KotlinPhaseC_Tokenizer extends AbstractPhaseCtokenizer {
  constructor(config = {}) {
    super({
      language: "Kotlin",
      ...config
    });

    // Kotlin-specific Phase C keywords
    this.kotlinKeywords = {
      extension: [
        "extension", "receiver", "this", "super", "companion", "object"
      ],
      coroutine: [
        "suspend", "launch", "async", "await", "delay", "flow", "emit",
        "collect", "runBlocking", "coroutineScope", "withContext",
        "Channel", "GlobalScope", "CoroutineScope", "Dispatchers"
      ],
      reified: [
        "inline", "reified", "noinline", "crossinline", "contract"
      ],
      dsl: [
        "apply", "also", "let", "run", "with", "takeIf", "takeUnless",
        "buildString", "buildList"
      ],
      dataSealed: [
        "data", "sealed", "open", "abstract", "final", "enum",
        "value", "annotation", "inner", "lateinit", "by"
      ],
      nullSafety: [
        "nullable", "safe", "elvis", "assertion", "platform"
      ],
      types: [
        "Int", "Long", "Short", "Byte", "Float", "Double", "Boolean",
        "Char", "String", "Unit", "Nothing", "Any", "Array", "List",
        "Map", "Set", "MutableList", "MutableMap", "MutableSet",
        "Pair", "Triple", "Sequence"
      ]
    };

    // Kotlin-specific operators and symbols
    this.kotlinOperators = {
      extensionDot: ".",
      safeCall: "?.",
      elvis: "?:",
      notNull: "!!",
      rangeOperator: "..",
      lambdaArrow: "->",
      typeCheck: "is",
      typeCast: "as",
      safeCast: "as?",
      spreadOperator: "*",
      labelReference: "@",
      methodReference: "::",
      nullable: "?",
      when: "when",
      in: "in",
      out: "out"
    };

    this.tokenMetrics = {
      extensionFunctionCount: 0,
      suspendFunctionCount: 0,
      reifiedGenericCount: 0,
      dslBuilderCount: 0,
      dataClassCount: 0,
      sealedClassCount: 0,
      smartCastCount: 0,
      nullSafetyCount: 0,
      coroutineBuilderCount: 0,
      flowOperatorCount: 0
    };
  }

  /**
   * MAIN TOKENIZATION
   */
  tokenize(sourceCode) {
    const startTime = performance.now();
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.source = sourceCode;
    this.tokens = [];
    this.currentToken = null;

    const maxIterations = sourceCode.length * 2;
    let iterations = 0;

    while (this.position < this.source.length && iterations < maxIterations) {
      iterations++;
      this.skipWhitespaceAndComments();

      if (this.position >= this.source.length) break;

      const _char = this.source[this.position];

      // Suspend function (check before fun)
      if (this.matchKeyword("suspend")) {
        this.tokenizeSuspendFunction();
        continue;
      }

      // Inline + reified (check before fun)
      if (this.matchKeyword("inline")) {
        this.tokenizeInlineFunction();
        continue;
      }

      // Data class (check before fun/class)
      if (this.matchKeyword("data")) {
        this.tokenizeDataClass();
        continue;
      }

      // Extension function check: fun Type.name()
      if (this.matchKeyword("fun") && this.lookAheadForExtensionFunction()) {
        this.tokenizeExtensionFunction();
        continue;
      }

      // Sealed class
      if (this.matchKeyword("sealed")) {
        this.tokenizeSealedClass();
        continue;
      }

      // DSL builders (apply, also, let, run, with)
      if (this.kotlinKeywords.dsl.some(kw => this.matchKeyword(kw))) {
        this.tokenizeDSLBuilder();
        continue;
      }

      // Coroutine builders (launch, async)
      if (["launch", "async", "flow"].some(kw => this.matchKeyword(kw))) {
        this.tokenizeCoroutineBuilder();
        continue;
      }

      // Null safety operators
      if (this.matchSequence("?.")) {
        this.tokens.push({
          type: "SAFE_CALL",
          value: "?.",
          line: this.line,
          column: this.column
        });
        this.position += 2;
        this.column += 2;
        this.tokenMetrics.nullSafetyCount++;
        continue;
      }

      if (this.matchSequence("?:")) {
        this.tokens.push({
          type: "ELVIS_OPERATOR",
          value: "?:",
          line: this.line,
          column: this.column
        });
        this.position += 2;
        this.column += 2;
        this.tokenMetrics.nullSafetyCount++;
        continue;
      }

      if (this.matchSequence("!!")) {
        this.tokens.push({
          type: "NOT_NULL_ASSERTION",
          value: "!!",
          line: this.line,
          column: this.column
        });
        this.position += 2;
        this.column += 2;
        this.tokenMetrics.nullSafetyCount++;
        continue;
      }

      // Smart cast operators
      if (this.matchKeyword("is")) {
        this.tokens.push({
          type: "TYPE_CHECK",
          value: "is",
          line: this.line,
          column: this.column
        });
        this.position += 2;
        this.column += 2;
        this.tokenMetrics.smartCastCount++;
        continue;
      }

      if (this.matchKeyword("as")) {
        const isSafe = this.lookAhead(2) === "?";
        this.tokens.push({
          type: isSafe ? "SAFE_CAST" : "TYPE_CAST",
          value: isSafe ? "as?" : "as",
          line: this.line,
          column: this.column
        });
        this.position += isSafe ? 3 : 2;
        this.column += isSafe ? 3 : 2;
        this.tokenMetrics.smartCastCount++;
        continue;
      }

      // Fallback to base tokenizer
      const token = this.tokenizeGeneric();
      if (token) {
        this.tokens.push(token);
      } else {
        this.position++;
        this.column++;
      }
    }

    const elapsed = performance.now() - startTime;
    return {
      tokens: this.tokens,
      metrics: this.tokenMetrics,
      elapsed,
      iterations
    };
  }

  /**
   * EXTENSION FUNCTION TOKENIZATION
   * Pattern: fun ReceiverType.extensionName(params): ReturnType { }
   */
  tokenizeExtensionFunction() {
    const _startPos = this.position;
    const startCol = this.column;

    // Skip 'fun'
    this.position += 3;
    this.column += 3;
    this.skipWhitespace();

    // Generic parameters if present
    let generics = null;
    if (this.source[this.position] === "<") {
      generics = this.captureGenerics();
    }

    this.skipWhitespace();

    // Capture receiver type
    const receiverStart = this.position;
    while (this.position < this.source.length && 
           /[A-Za-z0-9_<>,? ]/.test(this.source[this.position])) {
      if (this.source[this.position] === ".") break;
      this.position++;
    }
    const receiverType = this.source.slice(receiverStart, this.position).trim();

    // Skip the dot
    if (this.source[this.position] === ".") {
      this.position++;
      this.column++;
    }

    // Capture function name
    const nameStart = this.position;
    while (this.position < this.source.length && 
           /[A-Za-z0-9_]/.test(this.source[this.position])) {
      this.position++;
    }
    const functionName = this.source.slice(nameStart, this.position);

    this.tokens.push({
      type: "EXTENSION_FUNCTION",
      value: `fun ${receiverType}.${functionName}`,
      receiverType,
      functionName,
      generics,
      line: this.line,
      column: startCol
    });

    this.tokenMetrics.extensionFunctionCount++;
  }

  /**
   * SUSPEND FUNCTION TOKENIZATION
   */
  tokenizeSuspendFunction() {
    this.tokens.push({
      type: "SUSPEND_KEYWORD",
      value: "suspend",
      line: this.line,
      column: this.column
    });
    this.position += 7;
    this.column += 7;
    this.tokenMetrics.suspendFunctionCount++;
  }

  /**
   * INLINE FUNCTION TOKENIZATION (with potential reified)
   */
  tokenizeInlineFunction() {
    const startCol = this.column;
    this.position += 6; // 'inline'
    this.column += 6;
    this.skipWhitespace();

    // Check for 'fun' keyword
    const hasFun = this.matchKeyword("fun");
    
    // Look ahead for '<' to detect generics
    let hasReified = false;
    let lookPos = this.position;
    if (hasFun) lookPos += 3; // Skip 'fun'
    
    // Skip whitespace in lookahead
    while (lookPos < this.source.length && /\s/.test(this.source[lookPos])) lookPos++;
    
    // Check if there's a generic parameter with 'reified'
    if (this.source[lookPos] === "<") {
      const genericEnd = this.findMatchingBracket(lookPos, "<", ">");
      const genericContent = this.source.slice(lookPos, genericEnd);
      hasReified = genericContent.includes("reified");
    }

    this.tokens.push({
      type: "INLINE_FUNCTION",
      value: "inline",
      hasReified,
      line: this.line,
      column: startCol
    });

    if (hasReified) {
      this.tokenMetrics.reifiedGenericCount++;
    }
  }

  /**
   * DATA CLASS TOKENIZATION
   */
  tokenizeDataClass() {
    this.tokens.push({
      type: "DATA_CLASS",
      value: "data class",
      line: this.line,
      column: this.column
    });
    this.position += 4; // 'data'
    this.column += 4;
    this.tokenMetrics.dataClassCount++;
  }

  /**
   * SEALED CLASS TOKENIZATION
   */
  tokenizeSealedClass() {
    this.tokens.push({
      type: "SEALED_CLASS",
      value: "sealed",
      line: this.line,
      column: this.column
    });
    this.position += 6; // 'sealed'
    this.column += 6;
    this.tokenMetrics.sealedClassCount++;
  }

  /**
   * DSL BUILDER TOKENIZATION
   */
  tokenizeDSLBuilder() {
    const keyword = this.kotlinKeywords.dsl.find(kw => this.matchKeyword(kw));
    
    this.tokens.push({
      type: "DSL_BUILDER",
      value: keyword,
      builderType: keyword,
      line: this.line,
      column: this.column
    });
    
    this.position += keyword.length;
    this.column += keyword.length;
    this.tokenMetrics.dslBuilderCount++;
  }

  /**
   * COROUTINE BUILDER TOKENIZATION
   */
  tokenizeCoroutineBuilder() {
    const keyword = ["launch", "async", "flow"].find(kw => this.matchKeyword(kw));
    
    this.tokens.push({
      type: "COROUTINE_BUILDER",
      value: keyword,
      builderType: keyword,
      line: this.line,
      column: this.column
    });
    
    this.position += keyword.length;
    this.column += keyword.length;
    this.tokenMetrics.coroutineBuilderCount++;
  }

  /**
   * HELPER: Look ahead for extension function pattern
   */
  lookAheadForExtensionFunction() {
    let pos = this.position + 3; // after 'fun'
    
    // Skip whitespace
    while (pos < this.source.length && /\s/.test(this.source[pos])) pos++;
    
    // Skip generics if present
    if (this.source[pos] === "<") {
      let depth = 1;
      pos++;
      while (pos < this.source.length && depth > 0) {
        if (this.source[pos] === "<") depth++;
        if (this.source[pos] === ">") depth--;
        pos++;
      }
      // Skip whitespace after generics
      while (pos < this.source.length && /\s/.test(this.source[pos])) pos++;
    }
    
    // Look for Type.name pattern
    let foundDot = false;
    let charCount = 0;
    while (pos < this.source.length && charCount < 100) {
      const char = this.source[pos];
      
      if (char === "." && !foundDot) {
        // Check if next char is a valid identifier start
        const next = this.source[pos + 1];
        if (next && /[A-Za-z_]/.test(next)) {
          // Check previous char was identifier
          const prev = this.source[pos - 1];
          if (prev && /[A-Za-z0-9_>]/.test(prev)) {
            return true; // Found extension pattern
          }
        }
        foundDot = true;
      }
      
      if (char === "(" || char === "{") {
        // Reached function params/body without finding extension pattern
        return false;
      }
      
      pos++;
      charCount++;
    }
    
    return false;
  }

  /**
   * HELPER: Capture generic parameters
   */
  captureGenerics() {
    const start = this.position;
    let depth = 0;
    
    while (this.position < this.source.length) {
      const char = this.source[this.position];
      if (char === "<") depth++;
      if (char === ">") {
        depth--;
        if (depth === 0) {
          this.position++;
          return this.source.slice(start, this.position);
        }
      }
      this.position++;
    }
    
    return null;
  }

  /**
   * HELPER: Find matching bracket
   */
  findMatchingBracket(startPos, openChar, closeChar) {
    let pos = startPos + 1;
    let depth = 1;
    
    while (pos < this.source.length && depth > 0) {
      if (this.source[pos] === openChar) depth++;
      if (this.source[pos] === closeChar) depth--;
      pos++;
    }
    
    return pos;
  }

  /**
   * HELPER: Match keyword at current position
   */
  matchKeyword(keyword) {
    const slice = this.source.slice(this.position, this.position + keyword.length);
    const nextChar = this.source[this.position + keyword.length];
    return slice === keyword && (!nextChar || !/[A-Za-z0-9_]/.test(nextChar));
  }

  /**
   * HELPER: Match sequence
   */
  matchSequence(seq) {
    return this.source.slice(this.position, this.position + seq.length) === seq;
  }

  /**
   * HELPER: Look ahead
   */
  lookAhead(distance) {
    return this.source.slice(this.position, this.position + distance);
  }

  /**
   * HELPER: Skip whitespace
   */
  skipWhitespace() {
    while (this.position < this.source.length && 
           /\s/.test(this.source[this.position])) {
      if (this.source[this.position] === "\n") {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.position++;
    }
  }

  /**
   * HELPER: Skip whitespace and comments
   */
  skipWhitespaceAndComments() {
    while (this.position < this.source.length) {
      const char = this.source[this.position];
      
      if (/\s/.test(char)) {
        if (char === "\n") {
          this.line++;
          this.column = 1;
        } else {
          this.column++;
        }
        this.position++;
      } else if (this.source.slice(this.position, this.position + 2) === "//") {
        // Single-line comment
        while (this.position < this.source.length && this.source[this.position] !== "\n") {
          this.position++;
        }
      } else if (this.source.slice(this.position, this.position + 2) === "/*") {
        // Multi-line comment
        this.position += 2;
        while (this.position < this.source.length - 1) {
          if (this.source.slice(this.position, this.position + 2) === "*/") {
            this.position += 2;
            break;
          }
          if (this.source[this.position] === "\n") this.line++;
          this.position++;
        }
      } else {
        break;
      }
    }
  }

  /**
   * GENERIC TOKEN EXTRACTION
   */
  tokenizeGeneric() {
    const char = this.source[this.position];

    // Identifiers
    if (/[A-Za-z_]/.test(char)) {
      return this.tokenizeIdentifier();
    }

    // Numbers
    if (/[0-9]/.test(char)) {
      return this.tokenizeNumber();
    }

    // Strings
    if (char === "\"" || char === "'") {
      return this.tokenizeString();
    }

    // Single char operators
    const singleOps = "(){}[]<>,;:+-*/%=!&|^~";
    if (singleOps.includes(char)) {
      const token = {
        type: "OPERATOR",
        value: char,
        line: this.line,
        column: this.column
      };
      this.position++;
      this.column++;
      return token;
    }

    return null;
  }

  tokenizeIdentifier() {
    const start = this.position;
    while (this.position < this.source.length && 
           /[A-Za-z0-9_]/.test(this.source[this.position])) {
      this.position++;
    }
    const value = this.source.slice(start, this.position);
    return {
      type: "IDENTIFIER",
      value,
      line: this.line,
      column: this.column
    };
  }

  tokenizeNumber() {
    const start = this.position;
    while (this.position < this.source.length && 
           /[0-9.]/.test(this.source[this.position])) {
      this.position++;
    }
    const value = this.source.slice(start, this.position);
    return {
      type: "NUMBER",
      value,
      line: this.line,
      column: this.column
    };
  }

  tokenizeString() {
    const quote = this.source[this.position];
    const start = this.position;
    this.position++; // Skip opening quote

    while (this.position < this.source.length) {
      if (this.source[this.position] === "\\") {
        this.position += 2; // Skip escape sequence
      } else if (this.source[this.position] === quote) {
        this.position++; // Skip closing quote
        break;
      } else {
        this.position++;
      }
    }

    const value = this.source.slice(start, this.position);
    return {
      type: "STRING",
      value,
      line: this.line,
      column: this.column
    };
  }
}

module.exports = KotlinPhaseC_Tokenizer;

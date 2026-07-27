/**
 * Base Parser - Intelligent chunking for language families
 * Provides common parsing patterns for multiple language families
 */

class BaseParser {
  constructor(source) {
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
  }

  // === Tokenization Utilities ===
    
  peek(offset = 0) {
    return this.source.charCodeAt(this.pos + offset);
  }

  advance(count = 1) {
    for (let i = 0; i < count; i++) {
      if (this.pos < this.source.length) {
        if (this.source[this.pos] === "\n") {
          this.line++;
          this.column = 1;
        } else {
          this.column++;
        }
        this.pos++;
      }
    }
  }

  skipWhitespace() {
    while (this.pos < this.source.length && /\s/.test(this.source[this.pos])) {
      this.advance();
    }
  }

  skipLineComment(startSequence) {
    if (this.source.substr(this.pos, startSequence.length) === startSequence) {
      this.advance(startSequence.length);
      while (this.pos < this.source.length && this.source[this.pos] !== "\n") {
        this.advance();
      }
      return true;
    }
    return false;
  }

  skipBlockComment(startSeq, endSeq) {
    if (this.source.substr(this.pos, startSeq.length) === startSeq) {
      this.advance(startSeq.length);
      while (this.pos < this.source.length - endSeq.length + 1) {
        if (this.source.substr(this.pos, endSeq.length) === endSeq) {
          this.advance(endSeq.length);
          return true;
        }
        this.advance();
      }
    }
    return false;
  }

  readString(quote) {
    let value = "";
    this.advance(); // skip opening quote
    while (this.pos < this.source.length && this.source[this.pos] !== quote) {
      if (this.source[this.pos] === "\\" && this.pos + 1 < this.source.length) {
        this.advance();
        value += this.source[this.pos];
      } else {
        value += this.source[this.pos];
      }
      this.advance();
    }
    if (this.source[this.pos] === quote) this.advance();
    return value;
  }

  readNumber() {
    let num = "";
    const hasDecimal = false;
    while (this.pos < this.source.length) {
      if (/\d/.test(this.source[this.pos])) {
        num += this.source[this.pos];
      } else if (this.source[this.pos] === "." && !hasDecimal) {
        num += ".";
      } else if (this.source[this.pos] === "e" || this.source[this.pos] === "E") {
        num += "e";
        this.advance();
        if (this.source[this.pos] === "+" || this.source[this.pos] === "-") {
          num += this.source[this.pos];
        }
        continue;
      } else if (/[a-zA-Z_]/.test(this.source[this.pos])) {
        // Hex, binary, octal suffix
        break;
      } else {
        break;
      }
      this.advance();
    }
    return num;
  }

  readIdentifier() {
    let id = "";
    while (this.pos < this.source.length && /[a-zA-Z0-9_$]/.test(this.source[this.pos])) {
      id += this.source[this.pos];
      this.advance();
    }
    return id;
  }

  // === Common Token Types ===

  isKeyword(word, keywords) {
    return keywords.includes(word);
  }

  tokenizeC_Family(keywords = [], operators = []) {
    const tokens = [];
    let iterations = 0;
    const maxIterations = 50000; // Safety limit
    
    while (this.pos < this.source.length) {
      if (++iterations > maxIterations) {
        throw new Error(`Tokenizer exceeded ${maxIterations} iterations - infinite loop detected at pos ${this.pos}, char: "${this.source[this.pos]}"`);
      }
      
      this.skipWhitespace();
      if (this.pos >= this.source.length) break;

      const char = this.source[this.pos];
      const _lastPos = this.pos; // Track position to detect stalls

      // Comments
      if (char === "/" && this.source[this.pos + 1] === "/") {
        this.skipLineComment("//");
        continue;
      }
      if (char === "/" && this.source[this.pos + 1] === "*") {
        this.skipBlockComment("/*", "*/");
        continue;
      }

      // Strings
      if (char === "\"" || char === "'" || char === "`") {
        tokens.push({
          type: "STRING",
          value: this.readString(char)
        });
        continue;
      }

      // Numbers
      if (/\d/.test(char)) {
        tokens.push({
          type: "NUMBER",
          value: this.readNumber()
        });
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_$]/.test(char)) {
        const id = this.readIdentifier();
        tokens.push({
          type: this.isKeyword(id, keywords) ? "KEYWORD" : "IDENTIFIER",
          value: id
        });
        continue;
      }

      // Operators and punctuation
      const twoChar = this.source.substr(this.pos, 2);
      const threeChar = this.source.substr(this.pos, 3);

      if (operators.includes(threeChar)) {
        tokens.push({ type: "OPERATOR", value: threeChar });
        this.advance(3);
        continue;  // CRITICAL: Must continue after advancing
      } else if (operators.includes(twoChar)) {
        tokens.push({ type: "OPERATOR", value: twoChar });
        this.advance(2);
        continue;  // CRITICAL: Must continue after advancing
      } else if (/[{}()[\];,.:?]/.test(char)) {
        // Note: ':' is a PUNCT (used in ternary, map literals, etc.)
        // '?' is a PUNCT (used in ternary, optional, etc.)
        tokens.push({ type: "PUNCT", value: char });
        this.advance();
        continue;  // CRITICAL: Must continue after advancing
      } else if (/[+\-*/%&|^<>=!]/.test(char)) {
        tokens.push({ type: "OPERATOR", value: char });
        this.advance();
        continue;  // CRITICAL: Must continue after advancing
      } else {
        // Unknown character - advance to prevent infinite loop
        this.advance();
        continue;
      }
      
      // Safety: ensure we advanced
      // Note: This should never be reached due to continues above, but kept for debugging
      // Removing would make ESLint happy, but keeping for defensive programming
    }
    return tokens;
  }

  // === AST Node Builders ===

  createNode(type, properties = {}) {
    return { type, ...properties };
  }

  createIdentifier(name) {
    return this.createNode("Identifier", { name });
  }

  createLiteral(value, raw) {
    return this.createNode("Literal", { value, raw });
  }

  createBinaryExpression(left, operator, right) {
    return this.createNode("BinaryExpression", { left, operator, right });
  }

  createCallExpression(callee, args) {
    return this.createNode("CallExpression", { callee, arguments: args });
  }

  createMemberExpression(object, property, computed = false) {
    return this.createNode("MemberExpression", { object, property, computed });
  }

  createArrayExpression(elements) {
    return this.createNode("ArrayExpression", { elements });
  }

  createObjectExpression(properties) {
    return this.createNode("ObjectExpression", { properties });
  }

  createFunctionDeclaration(name, params, body) {
    return this.createNode("FunctionDeclaration", {
      id: this.createIdentifier(name),
      params: params.map(p => this.createIdentifier(p)),
      body: this.createNode("BlockStatement", { body })
    });
  }

  createIfStatement(test, consequent, alternate = null) {
    return this.createNode("IfStatement", { test, consequent, alternate });
  }

  createWhileStatement(test, body) {
    return this.createNode("WhileStatement", { test, body });
  }

  createForStatement(init, test, update, body) {
    return this.createNode("ForStatement", { init, test, update, body });
  }

  createReturnStatement(argument = null) {
    return this.createNode("ReturnStatement", { argument });
  }

  createThrowStatement(argument) {
    return this.createNode("ThrowStatement", { argument });
  }

  createTryStatement(block, handler, finalizer) {
    return this.createNode("TryStatement", { block, handler, finalizer });
  }

  createBlockStatement(body = []) {
    return this.createNode("BlockStatement", { body });
  }

  createExpressionStatement(expression) {
    return this.createNode("ExpressionStatement", { expression });
  }

  createClassDeclaration(name, superClass, body) {
    return this.createNode("ClassDeclaration", {
      id: this.createIdentifier(name),
      superClass,
      body: this.createNode("ClassBody", { body })
    });
  }
}

module.exports = { BaseParser };

/**
 * JSON Parser - Production Grade
 * Compliant with RFC 7158/RFC 8259
 * Supports: Objects, Arrays, Strings, Numbers, Booleans, Null
 * Features: Proper error reporting, memory pooling, AST generation
 */

const { BaseParser } = require("./base_parser");

/**
 * Object Pool for JSON nodes
 */
class ObjectPool {
  constructor(maxSize = 5000) {
    this.nodes = [];
    this.maxSize = maxSize;
  }

  getNode(type, data) {
    let node = this.nodes.pop() || {};
    for (const key in node) delete node[key];
    node.type = type;
    if (data) Object.assign(node, data);
    return node;
  }

  returnNode(node) {
    if (this.nodes.length < this.maxSize) {
      this.nodes.push(node);
    }
  }

  getStats() {
    return {
      nodesPooled: this.nodes.length,
      maxSize: this.maxSize
    };
  }
}

/**
 * JSON Parser
 * Strict RFC 8259 compliant JSON parsing
 * Generates AST compatible with LUASCRIPT IR pipeline
 */
class JSONParser {
  constructor(source = "") {
    this.source = source;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.objectCount = 0;
    this.maxObjects = 50000;
    this.pool = new ObjectPool(5000);
  }

  /**
   * Main parse entry point
   * @param {string} jsonString - JSON string to parse
   * @returns {object} AST with type "JSONDocument"
   */
  parse(jsonString = null) {
    if (jsonString !== null) {
      this.source = jsonString;
    }
    
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.objectCount = 0;

    this.skipWhitespace();
    const value = this.parseValue();
    this.skipWhitespace();

    if (this.position < this.source.length) {
      throw new Error(`Unexpected characters after JSON value at line ${this.line}, column ${this.column}`);
    }

    return this.createNode("JSONDocument", {
      body: value
    });
  }

  /**
   * Parse a JSON value (object, array, string, number, boolean, null)
   */
  parseValue() {
    this.skipWhitespace();
    const char = this.peek();

    if (char === "{") {
      return this.parseObject();
    } else if (char === "[") {
      return this.parseArray();
    } else if (char === "\"") {
      return this.parseString();
    } else if (char === "t" || char === "f") {
      return this.parseBoolean();
    } else if (char === "n") {
      return this.parseNull();
    } else if (char === "-" || (char >= "0" && char <= "9")) {
      return this.parseNumber();
    } else {
      throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
    }
  }

  /**
   * Parse JSON object: { "key": value, ... }
   */
  parseObject() {
    this.consume("{", "Expected '{'");
    const properties = [];

    this.skipWhitespace();
    if (this.peek() === "}") {
      this.consume("}", "Expected '}'");
      return this.createNode("JSONObject", { properties });
    }

    while (true) {
      this.skipWhitespace();
      
      // Key must be a string in JSON
      if (this.peek() !== "\"") {
        throw new Error(`Expected string key at line ${this.line}, column ${this.column}`);
      }

      const key = this.parseString().value;
      this.skipWhitespace();
      
      this.consume(":", "Expected ':' after property key");
      this.skipWhitespace();
      
      const value = this.parseValue();

      properties.push(this.createNode("JSONProperty", {
        key,
        value
      }));

      this.skipWhitespace();
      
      if (this.peek() === "}") {
        this.consume("}", "Expected '}'");
        break;
      } else if (this.peek() === ",") {
        this.consume(",", "Expected ','");
      } else {
        throw new Error(`Expected ',' or '}' at line ${this.line}, column ${this.column}`);
      }
    }

    return this.createNode("JSONObject", { properties });
  }

  /**
   * Parse JSON array: [ value, value, ... ]
   */
  parseArray() {
    this.consume("[", "Expected '['");
    const elements = [];

    this.skipWhitespace();
    if (this.peek() === "]") {
      this.consume("]", "Expected ']'");
      return this.createNode("JSONArray", { elements });
    }

    while (true) {
      this.skipWhitespace();
      const value = this.parseValue();
      elements.push(value);

      this.skipWhitespace();
      
      if (this.peek() === "]") {
        this.consume("]", "Expected ']'");
        break;
      } else if (this.peek() === ",") {
        this.consume(",", "Expected ','");
      } else {
        throw new Error(`Expected ',' or ']' at line ${this.line}, column ${this.column}`);
      }
    }

    return this.createNode("JSONArray", { elements });
  }

  /**
   * Parse JSON string: "..."
   * Handles escape sequences: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
   */
  parseString() {
    this.consume("\"", "Expected '\"'");
    let value = "";

    while (this.position < this.source.length) {
      const char = this.source[this.position];

      if (char === "\"") {
        this.position++;
        this.column++;
        return this.createNode("JSONString", { value });
      } else if (char === "\\") {
        this.position++;
        this.column++;
        
        if (this.position >= this.source.length) {
          throw new Error(`Unterminated string escape at line ${this.line}, column ${this.column}`);
        }

        const escaped = this.source[this.position];
        switch (escaped) {
        case "\"":
        case "\\":
        case "/":
          value += escaped;
          break;
        case "b":
          value += "\b";
          break;
        case "f":
          value += "\f";
          break;
        case "n":
          value += "\n";
          break;
        case "r":
          value += "\r";
          break;
        case "t":
          value += "\t";
          break;
        case "u": {
          // Unicode escape: \uXXXX
          const hex = this.source.substr(this.position + 1, 4);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
            throw new Error(`Invalid Unicode escape at line ${this.line}, column ${this.column}`);
          }
          value += String.fromCharCode(parseInt(hex, 16));
          this.position += 4;
          this.column += 4;
          break;
        }
        default:
          throw new Error(`Invalid escape sequence '\\${escaped}' at line ${this.line}, column ${this.column}`);
        }
        
        this.position++;
        this.column++;
      } else if (char.charCodeAt(0) < 0x20) {
        throw new Error(`Unescaped control character at line ${this.line}, column ${this.column}`);
      } else {
        value += char;
        this.position++;
        this.column++;
      }
    }

    throw new Error(`Unterminated string at line ${this.line}, column ${this.column}`);
  }

  /**
   * Parse JSON number: -? ( 0 | [1-9][0-9]* ) ( . [0-9]+ )? ( e[+-]? [0-9]+ )?
   */
  parseNumber() {
    let numStr = "";

    // Optional minus
    if (this.peek() === "-") {
      numStr += this.source[this.position];
      this.position++;
      this.column++;
    }

    // Integer part
    if (this.peek() === "0") {
      numStr += "0";
      this.position++;
      this.column++;
    } else if (this.peek() >= "1" && this.peek() <= "9") {
      while (this.position < this.source.length && this.peek() >= "0" && this.peek() <= "9") {
        numStr += this.source[this.position];
        this.position++;
        this.column++;
      }
    } else {
      throw new Error(`Invalid number at line ${this.line}, column ${this.column}`);
    }

    // Fractional part
    if (this.peek() === ".") {
      numStr += ".";
      this.position++;
      this.column++;
      
      if (!(this.peek() >= "0" && this.peek() <= "9")) {
        throw new Error(`Expected digit after decimal point at line ${this.line}, column ${this.column}`);
      }

      while (this.position < this.source.length && this.peek() >= "0" && this.peek() <= "9") {
        numStr += this.source[this.position];
        this.position++;
        this.column++;
      }
    }

    // Exponent part
    if (this.peek() === "e" || this.peek() === "E") {
      numStr += this.source[this.position];
      this.position++;
      this.column++;

      if (this.peek() === "+" || this.peek() === "-") {
        numStr += this.source[this.position];
        this.position++;
        this.column++;
      }

      if (!(this.peek() >= "0" && this.peek() <= "9")) {
        throw new Error(`Expected digit in exponent at line ${this.line}, column ${this.column}`);
      }

      while (this.position < this.source.length && this.peek() >= "0" && this.peek() <= "9") {
        numStr += this.source[this.position];
        this.position++;
        this.column++;
      }
    }

    const value = parseFloat(numStr);
    if (isNaN(value)) {
      throw new Error(`Invalid number '${numStr}' at line ${this.line}, column ${this.column}`);
    }

    return this.createNode("JSONNumber", { value, rawValue: numStr });
  }

  /**
   * Parse JSON boolean: true or false
   */
  parseBoolean() {
    if (this.source.substring(this.position, this.position + 4) === "true") {
      this.position += 4;
      this.column += 4;
      return this.createNode("JSONBoolean", { value: true });
    } else if (this.source.substring(this.position, this.position + 5) === "false") {
      this.position += 5;
      this.column += 5;
      return this.createNode("JSONBoolean", { value: false });
    } else {
      throw new Error(`Invalid boolean at line ${this.line}, column ${this.column}`);
    }
  }

  /**
   * Parse JSON null
   */
  parseNull() {
    if (this.source.substring(this.position, this.position + 4) === "null") {
      this.position += 4;
      this.column += 4;
      return this.createNode("JSONNull", { value: null });
    } else {
      throw new Error(`Invalid null at line ${this.line}, column ${this.column}`);
    }
  }

  /**
   * Skip whitespace: space, tab, newline, carriage return
   */
  skipWhitespace() {
    while (this.position < this.source.length) {
      const char = this.source[this.position];
      if (char === " " || char === "\t") {
        this.position++;
        this.column++;
      } else if (char === "\n") {
        this.position++;
        this.line++;
        this.column = 1;
      } else if (char === "\r") {
        this.position++;
        if (this.source[this.position] === "\n") {
          this.position++;
        }
        this.line++;
        this.column = 1;
      } else {
        break;
      }
    }
  }

  /**
   * Peek at current character without consuming
   */
  peek() {
    if (this.position < this.source.length) {
      return this.source[this.position];
    }
    return null;
  }

  /**
   * Consume expected character or throw error
   */
  consume(expected, message) {
    if (this.peek() !== expected) {
      throw new Error(`${message} at line ${this.line}, column ${this.column}`);
    }
    this.position++;
    this.column++;
  }

  /**
   * Create AST node with memory tracking
   */
  createNode(type, data) {
    if (++this.objectCount > this.maxObjects) {
      throw new Error(`Memory limit exceeded: ${this.objectCount} JSON nodes created`);
    }
    return this.pool.getNode(type, data);
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    return {
      objectCount: this.objectCount,
      maxObjects: this.maxObjects,
      utilization: ((this.objectCount / this.maxObjects) * 100).toFixed(1) + "%",
      pool: this.pool.getStats()
    };
  }

  /**
   * Reset parser state
   */
  reset() {
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.objectCount = 0;
  }

  /**
   * Convert AST back to JSON string (round-trip verification)
   */
  astToJSON(node) {
    if (!node) return "null";

    switch (node.type) {
    case "JSONDocument":
      return this.astToJSON(node.body);
      
    case "JSONObject": {
      if (!node.properties || node.properties.length === 0) {
        return "{}";
      }
      const pairs = node.properties.map(prop => {
        const key = JSON.stringify(prop.key);
        const value = this.astToJSON(prop.value);
        return `${key}:${value}`;
      });
      return `{${pairs.join(",")}}`;
    }

    case "JSONArray": {
      if (!node.elements || node.elements.length === 0) {
        return "[]";
      }
      const values = node.elements.map(elem => this.astToJSON(elem));
      return `[${values.join(",")}]`;
    }

    case "JSONString":
      return JSON.stringify(node.value);

    case "JSONNumber":
      return node.rawValue || String(node.value);

    case "JSONBoolean":
      return String(node.value);

    case "JSONNull":
      return "null";

    default:
      throw new Error(`Unknown JSON node type: ${node.type}`);
    }
  }
}

module.exports = { JSONParser };

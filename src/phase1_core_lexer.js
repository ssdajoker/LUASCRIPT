
/**
 * LUASCRIPT Phase 1 Core - Advanced Lexer Implementation
 * PS2/PS3 Specialists + Steve Jobs Excellence Standards
 * 32+ Developer Team Implementation
 */

/**
 * The core lexer for LUASCRIPT, responsible for converting source code into a stream of tokens.
 * It includes advanced features like error recovery and support for a wide range of JavaScript syntax.
 */
class LuaScriptLexer {
    /**
     * Creates an instance of the LuaScriptLexer.
     * @param {string} source - The source code to tokenize.
     * @param {object} [options={}] - Configuration options for the lexer.
     * @param {boolean} [options.errorRecovery=true] - Whether to enable error recovery mode.
     * @param {boolean} [options.strictMode=false] - Whether to enforce strict mode rules.
     */
    constructor(source, options = {}) {
        this.source = source;
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
        this.keywords = new Set([
            "let", "const", "var", "function", "return", "if", "else", "for", 
            "while", "do", "break", "continue", "true", "false", "null", 
            "undefined", "class", "extends", "super", "this", "new", "try", 
            "catch", "finally", "throw", "async", "await", "import", "export",
            "switch", "case", "default", "static"
        ]);
        this.operators = new Map([
            ["+", "PLUS"], ["-", "MINUS"], ["*", "MULTIPLY"], ["/", "DIVIDE"],
            ["%", "MODULO"], ["=", "ASSIGN"], ["==", "EQUAL"], ["===", "STRICT_EQUAL"],
            ["!=", "NOT_EQUAL"], ["!==", "STRICT_NOT_EQUAL"], ["<", "LESS_THAN"],
            [">", "GREATER_THAN"], ["<=", "LESS_EQUAL"], [">=", "GREATER_EQUAL"],
            ["&&", "LOGICAL_AND"], ["||", "LOGICAL_OR"], ["!", "LOGICAL_NOT"],
            ["&", "BITWISE_AND"], ["|", "BITWISE_OR"], ["^", "BITWISE_XOR"],
            ["~", "BITWISE_NOT"], ["<<", "LEFT_SHIFT"], [">>", "RIGHT_SHIFT"],
            ["++", "INCREMENT"], ["--", "DECREMENT"], ["+=", "PLUS_ASSIGN"],
            ["-=", "MINUS_ASSIGN"], ["*=", "MULTIPLY_ASSIGN"], ["/=", "DIVIDE_ASSIGN"],
            ["=>", "ARROW"], ["...", "SPREAD"], ["?.", "OPTIONAL_CHAINING"],
            ["??", "NULLISH_COALESCING"], ["??=", "NULLISH_ASSIGN"]
        ]);
        this.errorRecovery = options.errorRecovery !== false;
        this.strictMode = options.strictMode || false;
    }

    /**
     * Tokenizes the source code into a stream of tokens.
     * @returns {object[]} The array of tokens.
     */
    tokenize() {
        this.tokens = [];
        this.position = 0;
        this.line = 1;
        this.column = 1;

        while (this.position < this.source.length) {
            this.skipWhitespace();
            
            if (this.position >= this.source.length) break;

            const char = this.current();
            
            try {
                if (this.isAlpha(char) || char === "_" || char === "$") {
                    this.tokenizeIdentifier();
                } else if (this.isDigit(char)) {
                    this.tokenizeNumber();
                } else if (char === "\"" || char === "'" || char === "`") {
                    this.tokenizeString();
                } else if (char === "/" && this.peek() === "/") {
                    this.tokenizeLineComment();
                } else if (char === "/" && this.peek() === "*") {
                    this.tokenizeBlockComment();
                } else if (this.isOperatorStart(char)) {
                    this.tokenizeOperator();
                } else if (this.isPunctuation(char)) {
                    this.tokenizePunctuation();
                } else {
                    if (this.errorRecovery) {
                        this.addError(`Unexpected character: ${char}`);
                        this.advance();
                    } else {
                        throw new SyntaxError(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
                    }
                }
            } catch (error) {
                if (this.errorRecovery) {
                    this.addError(error.message);
                    this.advance();
                } else {
                    throw error;
                }
            }
        }

        this.addToken("EOF", null);
        return this.tokens;
    }

    /**
     * Tokenizes an identifier or a keyword.
     * @private
     */
    tokenizeIdentifier() {
        const start = this.position;
        const startLine = this.line;
        const startColumn = this.column;

        while (this.position < this.source.length && 
               (this.isAlphaNumeric(this.current()) || this.current() === "_" || this.current() === "$")) {
            this.advance();
        }

        const value = this.source.substring(start, this.position);
        const type = this.keywords.has(value) ? "KEYWORD" : "IDENTIFIER";
        
        this.addToken(type, value, startLine, startColumn);
    }

    /**
     * Tokenizes a number, handling various formats like decimal, hex, binary, and octal.
     * @private
     */
    tokenizeNumber() {
        const start = this.position;
        const startLine = this.line;
        const startColumn = this.column;
        let hasDecimal = false;
        let hasExponent = false;

        // Handle hex, binary, octal literals
        if (this.current() === "0") {
            this.advance();
            if (this.current() === "x" || this.current() === "X") {
                this.advance();
                return this.tokenizeHexNumber(start, startLine, startColumn);
            } else if (this.current() === "b" || this.current() === "B") {
                this.advance();
                return this.tokenizeBinaryNumber(start, startLine, startColumn);
            } else if (this.current() === "o" || this.current() === "O") {
                this.advance();
                return this.tokenizeOctalNumber(start, startLine, startColumn);
            }
        }

        // Regular decimal number
        while (this.position < this.source.length) {
            const char = this.current();
            
            if (this.isDigit(char)) {
                this.advance();
            } else if (char === "." && !hasDecimal && this.isDigit(this.peek())) {
                hasDecimal = true;
                this.advance();
            } else if ((char === "e" || char === "E") && !hasExponent) {
                hasExponent = true;
                this.advance();
                if (this.current() === "+" || this.current() === "-") {
                    this.advance();
                }
            } else {
                break;
            }
        }

        const value = this.source.substring(start, this.position);
        this.addToken("NUMBER", parseFloat(value), startLine, startColumn);
    }

    /**
     * Tokenizes a hexadecimal number.
     * @param {number} start - The starting position of the number.
     * @param {number} startLine - The starting line of the number.
     * @param {number} startColumn - The starting column of the number.
     * @private
     */
    tokenizeHexNumber(start, startLine, startColumn) {
        while (this.position < this.source.length && this.isHexDigit(this.current())) {
            this.advance();
        }
        const value = this.source.substring(start, this.position);
        this.addToken("NUMBER", parseInt(value, 16), startLine, startColumn);
    }

    /**
     * Tokenizes a binary number.
     * @param {number} start - The starting position of the number.
     * @param {number} startLine - The starting line of the number.
     * @param {number} startColumn - The starting column of the number.
     * @private
     */
    tokenizeBinaryNumber(start, startLine, startColumn) {
        while (this.position < this.source.length && (this.current() === "0" || this.current() === "1")) {
            this.advance();
        }
        const value = this.source.substring(start, this.position);
        this.addToken("NUMBER", parseInt(value.substring(2), 2), startLine, startColumn);
    }

    /**
     * Tokenizes an octal number.
     * @param {number} start - The starting position of the number.
     * @param {number} startLine - The starting line of the number.
     * @param {number} startColumn - The starting column of the number.
     * @private
     */
    tokenizeOctalNumber(start, startLine, startColumn) {
        while (this.position < this.source.length && this.current() >= "0" && this.current() <= "7") {
            this.advance();
        }
        const value = this.source.substring(start, this.position);
        this.addToken("NUMBER", parseInt(value.substring(2), 8), startLine, startColumn);
    }

    /**
     * Tokenizes a string literal, handling quotes, template literals, and escape sequences.
     * @private
     */
    tokenizeString() {
        const quote = this.current();
        const startLine = this.line;
        const startColumn = this.column;
        this.advance(); // Skip opening quote

        let value = "";
        let escaped = false;

        while (this.position < this.source.length) {
            const char = this.current();

            if (escaped) {
                switch (char) {
                case "n": value += "\n"; break;
                case "t": value += "\t"; break;
                case "r": value += "\r"; break;
                case "\\": value += "\\"; break;
                case "\"": value += "\""; break;
                case "'": value += "'"; break;
                case "`": value += "`"; break;
                case "u": {
                    // Unicode escape sequence
                    this.advance();
                    const unicode = this.source.substr(this.position, 4);
                    if (unicode.length === 4 && /^[0-9a-fA-F]{4}$/.test(unicode)) {
                        value += String.fromCharCode(parseInt(unicode, 16));
                        this.position += 3; // Will be incremented by advance()
                    } else {
                        throw new SyntaxError(`Invalid unicode escape sequence at line ${this.line}`);
                    }
                }
                    break;
                default:
                    value += char;
                }
                escaped = false;
            } else if (char === "\\") {
                escaped = true;
            } else if (char === quote) {
                this.advance(); // Skip closing quote
                this.addToken("STRING", value, startLine, startColumn);
                return;
            } else if (char === "\n") {
                if (quote !== "`") {
                    throw new SyntaxError(`Unterminated string literal at line ${this.line}`);
                }
                value += char;
                this.line++;
                this.column = 0;
            } else {
                value += char;
            }

            this.advance();
        }

        throw new SyntaxError(`Unterminated string literal starting at line ${startLine}`);
    }

    /**
     * Tokenizes a single-line comment.
     * @private
     */
    tokenizeLineComment() {
        this.advance(); // Skip first /
        this.advance(); // Skip second /

        const start = this.position;
        while (this.position < this.source.length && this.current() !== "\n") {
            this.advance();
        }

        const value = this.source.substring(start, this.position);
        this.addToken("COMMENT", value);
    }

    /**
     * Tokenizes a block comment.
     * @private
     * @throws {SyntaxError} If the block comment is unterminated.
     */
    tokenizeBlockComment() {
        const startLine = this.line;
        this.advance(); // Skip /
        this.advance(); // Skip *

        const start = this.position;
        while (this.position < this.source.length - 1) {
            if (this.current() === "*" && this.peek() === "/") {
                const value = this.source.substring(start, this.position);
                this.advance(); // Skip *
                this.advance(); // Skip /
                this.addToken("COMMENT", value);
                return;
            }
            if (this.current() === "\n") {
                this.line++;
                this.column = 0;
            }
            this.advance();
        }

        throw new SyntaxError(`Unterminated block comment starting at line ${startLine}`);
    }

    /**
     * Tokenizes an operator.
     * @private
     */
    tokenizeOperator() {
        // const start = this.position; // removed unused variable
        const startLine = this.line;
        const startColumn = this.column;

        // Try to match longest operator first
        for (let length = 3; length >= 1; length--) {
            const substr = this.source.substr(this.position, length);
            if (this.operators.has(substr)) {
                this.position += length;
                this.column += length;
                this.addToken(this.operators.get(substr), substr, startLine, startColumn);
                return;
            }
        }

        // If no operator matched, treat as single character
        const char = this.current();
        this.advance();
        this.addToken("OPERATOR", char, startLine, startColumn);
    }

    /**
     * Tokenizes punctuation characters.
     * @private
     */
    tokenizePunctuation() {
        const char = this.current();
        const startLine = this.line;
        const startColumn = this.column;

        if (char === "?" && (this.peek() === "." || this.peek() === "?")) {
            this.advance();
            const next = this.current();
            if (next === ".") {
                this.advance();
                this.addToken("OPTIONAL_CHAINING", "?.", startLine, startColumn);
                return;
            }
            if (next === "?") {
                this.advance();
                if (this.current() === "=") {
                    this.advance();
                    this.addToken("NULLISH_ASSIGN", "??=", startLine, startColumn);
                } else {
                    this.addToken("NULLISH_COALESCING", "??", startLine, startColumn);
                }
                return;
            }
        }

        this.advance();

        const punctuationMap = {
            "(": "LEFT_PAREN",
            ")": "RIGHT_PAREN",
            "[": "LEFT_BRACKET",
            "]": "RIGHT_BRACKET",
            "{": "LEFT_BRACE",
            "}": "RIGHT_BRACE",
            ",": "COMMA",
            ";": "SEMICOLON",
            ":": "COLON",
            "?": "QUESTION",
            ".": "DOT"
        };

        const type = punctuationMap[char] || "PUNCTUATION";
        this.addToken(type, char, startLine, startColumn);
    }

    /**
     * Gets the current character without advancing.
     * @returns {string} The current character.
     * @private
     */
    current() {
        return this.position < this.source.length ? this.source[this.position] : "\0";
    }

    /**
     * Peeks at the next character without advancing.
     * @param {number} [offset=1] - The offset from the current position.
     * @returns {string} The character at the given offset.
     * @private
     */
    peek(offset = 1) {
        const pos = this.position + offset;
        return pos < this.source.length ? this.source[pos] : "\0";
    }

    /**
     * Advances the lexer's position.
     * @private
     */
    advance() {
        if (this.position < this.source.length) {
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
     * Skips whitespace characters.
     * @private
     */
    skipWhitespace() {
        while (this.position < this.source.length && this.isWhitespace(this.current())) {
            this.advance();
        }
    }

    /**
     * Checks if a character is whitespace.
     * @param {string} char - The character to check.
     * @returns {boolean} True if the character is whitespace.
     * @private
     */
    isWhitespace(char) {
        return /\s/.test(char);
    }

    /**
     * Checks if a character is alphabetic.
     * @param {string} char - The character to check.
     * @returns {boolean} True if the character is alphabetic.
     * @private
     */
    isAlpha(char) {
        return /[a-zA-Z]/.test(char);
    }

    /**
     * Checks if a character is a digit.
     * @param {string} char - The character to check.
     * @returns {boolean} True if the character is a digit.
     * @private
     */
    isDigit(char) {
        return /[0-9]/.test(char);
    }

    /**
     * Checks if a character is a hexadecimal digit.
     * @param {string} char - The character to check.
     * @returns {boolean} True if the character is a hex digit.
     * @private
     */
    isHexDigit(char) {
        return /[0-9a-fA-F]/.test(char);
    }

    /**
     * Checks if a character is alphanumeric.
     * @param {string} char - The character to check.
     * @returns {boolean} True if the character is alphanumeric.
     * @private
     */
    isAlphaNumeric(char) {
        return this.isAlpha(char) || this.isDigit(char);
    }

    /**
     * Checks if a character can be the start of an operator.
     * @param {string} char - The character to check.
     * @returns {boolean} True if the character can start an operator.
     * @private
     */
    isOperatorStart(char) {
    // Treat ':' and '?' as punctuation (COLON/QUESTION); exclude them here
        return "+-*/%=<>!&|^~".includes(char);
    }

    /**
     * Checks if a character is a punctuation mark.
     * @param {string} char - The character to check.
     * @returns {boolean} True if the character is punctuation.
     * @private
     */
    isPunctuation(char) {
        return "()[]{},.;:?".includes(char);
    }

    /**
     * Adds a token to the token list.
     * @param {string} type - The type of the token.
     * @param {*} value - The value of the token.
     * @param {number} [line=this.line] - The line number of the token.
     * @param {number} [column=this.column] - The column number of the token.
     * @private
     */
    addToken(type, value, line = this.line, column = this.column) {
        this.tokens.push({
            type,
            value,
            line,
            column,
            position: this.position
        });
    }

    /**
     * Adds an error token to the token list.
     * @param {string} message - The error message.
     * @private
     */
    addError(message) {
        this.tokens.push({
            type: "ERROR",
            value: message,
            line: this.line,
            column: this.column,
            position: this.position
        });
    }

    /**
     * Gets the list of all tokens.
     * @returns {object[]} The array of tokens.
     */
    getTokens() {
        return this.tokens;
    }

    /**
     * Checks if any errors were encountered during tokenization.
     * @returns {boolean} True if there are errors.
     */
    hasErrors() {
        return this.tokens.some(token => token.type === "ERROR");
    }

    /**
     * Gets the list of all error tokens.
     * @returns {object[]} The array of error tokens.
     */
    getErrors() {
        return this.tokens.filter(token => token.type === "ERROR");
    }
}

module.exports = { LuaScriptLexer };

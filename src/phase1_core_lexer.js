
/**
 * LUASCRIPT Phase 1 Core - Advanced Lexer Implementation
 * PS2/PS3 Specialists + Steve Jobs Excellence Standards
 * 32+ Developer Team Implementation
 */

class LuaScriptLexer {
    constructor(source, options = {}) {
        this.source = source;
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
        this.keywords = new Set([
            'let', 'const', 'var', 'function', 'return', 'if', 'else', 'for', 
            'while', 'do', 'break', 'continue', 'true', 'false', 'null', 
            'undefined', 'class', 'extends', 'super', 'this', 'new', 'try', 
            'catch', 'finally', 'throw', 'async', 'await', 'import', 'export'
        ]);
        this.operators = new Map([
            ['+', 'PLUS'], ['-', 'MINUS'], ['*', 'MULTIPLY'], ['/', 'DIVIDE'],
            ['%', 'MODULO'], ['=', 'ASSIGN'], ['==', 'EQUAL'], ['===', 'STRICT_EQUAL'],
            ['!=', 'NOT_EQUAL'], ['!==', 'STRICT_NOT_EQUAL'], ['<', 'LESS_THAN'],
            ['>', 'GREATER_THAN'], ['<=', 'LESS_EQUAL'], ['>=', 'GREATER_EQUAL'],
            ['&&', 'LOGICAL_AND'], ['||', 'LOGICAL_OR'], ['!', 'LOGICAL_NOT'],
            ['&', 'BITWISE_AND'], ['|', 'BITWISE_OR'], ['^', 'BITWISE_XOR'],
            ['~', 'BITWISE_NOT'], ['<<', 'LEFT_SHIFT'], ['>>', 'RIGHT_SHIFT'],
            ['++', 'INCREMENT'], ['--', 'DECREMENT'], ['+=', 'PLUS_ASSIGN'],
            ['-=', 'MINUS_ASSIGN'], ['*=', 'MULTIPLY_ASSIGN'], ['/=', 'DIVIDE_ASSIGN'],
            ['=>', 'ARROW'], ['...', 'SPREAD'], ['?.', 'OPTIONAL_CHAINING']
        ]);
        this.errorRecovery = options.errorRecovery !== false;
        this.strictMode = options.strictMode || false;
    }

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
                if (this.isAlpha(char) || char === '_' || char === '$') {
                    this.tokenizeIdentifier();
                } else if (this.isDigit(char)) {
                    this.tokenizeNumber();
                } else if (char === '"' || char === "'" || char === '`') {
                    this.tokenizeString();
                } else if (char === '/' && this.peek() === '/') {
                    this.tokenizeLineComment();
                } else if (char === '/' && this.peek() === '*') {
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

        this.addToken('EOF', null);
        return this.tokens;
    }

    tokenizeIdentifier() {
        const start = this.position;
        const startLine = this.line;
        const startColumn = this.column;

        while (this.position < this.source.length && 
               (this.isAlphaNumeric(this.current()) || this.current() === '_' || this.current() === '$')) {
            this.advance();
        }

        const value = this.source.substring(start, this.position);
        const type = this.keywords.has(value) ? 'KEYWORD' : 'IDENTIFIER';
        
        this.addToken(type, value, startLine, startColumn);
    }

    tokenizeNumber() {
        const start = this.position;
        const startLine = this.line;
        const startColumn = this.column;
        let hasDecimal = false;
        let hasExponent = false;

        // Handle hex, binary, octal literals
        if (this.current() === '0') {
            this.advance();
            if (this.current() === 'x' || this.current() === 'X') {
                this.advance();
                return this.tokenizeHexNumber(start, startLine, startColumn);
            } else if (this.current() === 'b' || this.current() === 'B') {
                this.advance();
                return this.tokenizeBinaryNumber(start, startLine, startColumn);
            } else if (this.current() === 'o' || this.current() === 'O') {
                this.advance();
                return this.tokenizeOctalNumber(start, startLine, startColumn);
            }
        }

        // Regular decimal number
        while (this.position < this.source.length) {
            const char = this.current();
            
            if (this.isDigit(char)) {
                this.advance();
            } else if (char === '.' && !hasDecimal && this.isDigit(this.peek())) {
                hasDecimal = true;
                this.advance();
            } else if ((char === 'e' || char === 'E') && !hasExponent) {
                hasExponent = true;
                this.advance();
                if (this.current() === '+' || this.current() === '-') {
                    this.advance();
                }
            } else {
                break;
            }
        }

        const value = this.source.substring(start, this.position);
        this.addToken('NUMBER', parseFloat(value), startLine, startColumn);
    }

    tokenizeHexNumber(start, startLine, startColumn) {
        while (this.position < this.source.length && this.isHexDigit(this.current())) {
            this.advance();
        }
        const value = this.source.substring(start, this.position);
        this.addToken('NUMBER', parseInt(value, 16), startLine, startColumn);
    }

    tokenizeBinaryNumber(start, startLine, startColumn) {
        while (this.position < this.source.length && (this.current() === '0' || this.current() === '1')) {
            this.advance();
        }
        const value = this.source.substring(start, this.position);
        this.addToken('NUMBER', parseInt(value.substring(2), 2), startLine, startColumn);
    }

    tokenizeOctalNumber(start, startLine, startColumn) {
        while (this.position < this.source.length && this.current() >= '0' && this.current() <= '7') {
            this.advance();
        }
        const value = this.source.substring(start, this.position);
        this.addToken('NUMBER', parseInt(value.substring(2), 8), startLine, startColumn);
    }

    tokenizeString() {
        const quote = this.current();
        const start = this.position;
        const startLine = this.line;
        const startColumn = this.column;
        this.advance(); // Skip opening quote

        let value = '';
        let escaped = false;

        while (this.position < this.source.length) {
            const char = this.current();

            if (escaped) {
                switch (char) {
                    case 'n': value += '\n'; break;
                    case 't': value += '\t'; break;
                    case 'r': value += '\r'; break;
                    case '\\': value += '\\'; break;
                    case '"': value += '"'; break;
                    case "'": value += "'"; break;
                    case '`': value += '`'; break;
                    case 'u': 
                        // Unicode escape sequence
                        this.advance();
                        const unicode = this.source.substr(this.position, 4);
                        if (unicode.length === 4 && /^[0-9a-fA-F]{4}$/.test(unicode)) {
                            value += String.fromCharCode(parseInt(unicode, 16));
                            this.position += 3; // Will be incremented by advance()
                        } else {
                            throw new SyntaxError(`Invalid unicode escape sequence at line ${this.line}`);
                        }
                        break;
                    default:
                        value += char;
                }
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === quote) {
                this.advance(); // Skip closing quote
                this.addToken('STRING', value, startLine, startColumn);
                return;
            } else if (char === '\n') {
                if (quote !== '`') {
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

    tokenizeLineComment() {
        this.advance(); // Skip first /
        this.advance(); // Skip second /

        const start = this.position;
        while (this.position < this.source.length && this.current() !== '\n') {
            this.advance();
        }

        const value = this.source.substring(start, this.position);
        this.addToken('COMMENT', value);
    }

    tokenizeBlockComment() {
        const startLine = this.line;
        this.advance(); // Skip /
        this.advance(); // Skip *

        const start = this.position;
        while (this.position < this.source.length - 1) {
            if (this.current() === '*' && this.peek() === '/') {
                const value = this.source.substring(start, this.position);
                this.advance(); // Skip *
                this.advance(); // Skip /
                this.addToken('COMMENT', value);
                return;
            }
            if (this.current() === '\n') {
                this.line++;
                this.column = 0;
            }
            this.advance();
        }

        throw new SyntaxError(`Unterminated block comment starting at line ${startLine}`);
    }

    tokenizeOperator() {
        const start = this.position;
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
        this.addToken('OPERATOR', char, startLine, startColumn);
    }

    tokenizePunctuation() {
        const char = this.current();
        const startLine = this.line;
        const startColumn = this.column;
        this.advance();

        const punctuationMap = {
            '(': 'LEFT_PAREN',
            ')': 'RIGHT_PAREN',
            '[': 'LEFT_BRACKET',
            ']': 'RIGHT_BRACKET',
            '{': 'LEFT_BRACE',
            '}': 'RIGHT_BRACE',
            ',': 'COMMA',
            ';': 'SEMICOLON',
            ':': 'COLON',
            '?': 'QUESTION',
            '.': 'DOT'
        };

        const type = punctuationMap[char] || 'PUNCTUATION';
        this.addToken(type, char, startLine, startColumn);
    }

    // Utility methods
    current() {
        return this.position < this.source.length ? this.source[this.position] : '\0';
    }

    peek(offset = 1) {
        const pos = this.position + offset;
        return pos < this.source.length ? this.source[pos] : '\0';
    }

    advance() {
        if (this.position < this.source.length) {
            if (this.source[this.position] === '\n') {
                this.line++;
                this.column = 1;
            } else {
                this.column++;
            }
            this.position++;
        }
    }

    skipWhitespace() {
        while (this.position < this.source.length && this.isWhitespace(this.current())) {
            this.advance();
        }
    }

    isWhitespace(char) {
        return /\s/.test(char);
    }

    isAlpha(char) {
        return /[a-zA-Z]/.test(char);
    }

    isDigit(char) {
        return /[0-9]/.test(char);
    }

    isHexDigit(char) {
        return /[0-9a-fA-F]/.test(char);
    }

    isAlphaNumeric(char) {
        return this.isAlpha(char) || this.isDigit(char);
    }

    isOperatorStart(char) {
        return '+-*/%=<>!&|^~?:'.includes(char);
    }

    isPunctuation(char) {
        return '()[]{},.;:?'.includes(char);
    }

    addToken(type, value, line = this.line, column = this.column) {
        this.tokens.push({
            type,
            value,
            line,
            column,
            position: this.position
        });
    }

    addError(message) {
        this.tokens.push({
            type: 'ERROR',
            value: message,
            line: this.line,
            column: this.column,
            position: this.position
        });
    }

    getTokens() {
        return this.tokens;
    }

    hasErrors() {
        return this.tokens.some(token => token.type === 'ERROR');
    }

    getErrors() {
        return this.tokens.filter(token => token.type === 'ERROR');
    }
}

module.exports = { LuaScriptLexer };

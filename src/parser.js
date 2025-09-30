
/**
 * LUASCRIPT Parser - Phase 1D Implementation
 * Supports arrow functions, memory management, and enhanced error handling
 */

class MemoryManager {
    constructor(maxNodes = 10000, maxDepth = 100) {
        this.maxNodes = maxNodes;
        this.maxDepth = maxDepth;
        this.nodeCount = 0;
        this.currentDepth = 0;
        this.allocatedNodes = new Set();
    }

    allocateNode(type, data = {}) {
        if (this.nodeCount >= this.maxNodes) {
            throw new Error(`Memory limit exceeded: maximum ${this.maxNodes} nodes allowed`);
        }
        
        const node = {
            id: `node_${this.nodeCount}`,
            type,
            ...data,
            _allocated: true
        };
        
        this.nodeCount++;
        this.allocatedNodes.add(node);
        return node;
    }

    enterScope() {
        this.currentDepth++;
        if (this.currentDepth > this.maxDepth) {
            throw new Error(`Stack overflow: maximum depth ${this.maxDepth} exceeded`);
        }
    }

    exitScope() {
        this.currentDepth = Math.max(0, this.currentDepth - 1);
    }

    cleanup() {
        for (const node of this.allocatedNodes) {
            if (node._allocated) {
                node._allocated = false;
            }
        }
        this.allocatedNodes.clear();
        this.nodeCount = 0;
        this.currentDepth = 0;
    }

    getStats() {
        return {
            nodeCount: this.nodeCount,
            currentDepth: this.currentDepth,
            maxNodes: this.maxNodes,
            maxDepth: this.maxDepth,
            memoryUsage: `${this.nodeCount}/${this.maxNodes} nodes`
        };
    }
}

class Token {
    constructor(type, value, line = 1, column = 1) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }
}

class Lexer {
    constructor(input) {
        this.input = input;
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
    }

    tokenize() {
        while (this.position < this.input.length) {
            this.skipWhitespace();
            
            if (this.position >= this.input.length) break;
            
            const char = this.input[this.position];
            
            // Arrow function operator
            if (char === '=' && this.peek() === '>') {
                this.tokens.push(new Token('ARROW', '=>', this.line, this.column));
                this.advance(2);
                continue;
            }
            
            // Other operators and tokens
            if (char === '(') {
                this.tokens.push(new Token('LPAREN', '(', this.line, this.column));
                this.advance();
            } else if (char === ')') {
                this.tokens.push(new Token('RPAREN', ')', this.line, this.column));
                this.advance();
            } else if (char === '{') {
                this.tokens.push(new Token('LBRACE', '{', this.line, this.column));
                this.advance();
            } else if (char === '}') {
                this.tokens.push(new Token('RBRACE', '}', this.line, this.column));
                this.advance();
            } else if (char === ',') {
                this.tokens.push(new Token('COMMA', ',', this.line, this.column));
                this.advance();
            } else if (char === ';') {
                this.tokens.push(new Token('SEMICOLON', ';', this.line, this.column));
                this.advance();
            } else if (char === '=') {
                this.tokens.push(new Token('ASSIGN', '=', this.line, this.column));
                this.advance();
            } else if (char === '+') {
                this.tokens.push(new Token('PLUS', '+', this.line, this.column));
                this.advance();
            } else if (char === '-') {
                this.tokens.push(new Token('MINUS', '-', this.line, this.column));
                this.advance();
            } else if (char === '*') {
                this.tokens.push(new Token('MULTIPLY', '*', this.line, this.column));
                this.advance();
            } else if (char === '/') {
                this.tokens.push(new Token('DIVIDE', '/', this.line, this.column));
                this.advance();
            } else if (char === '<') {
                if (this.peek() === '=') {
                    this.tokens.push(new Token('LESS_EQUAL', '<=', this.line, this.column));
                    this.advance(2);
                } else {
                    this.tokens.push(new Token('LESS', '<', this.line, this.column));
                    this.advance();
                }
            } else if (char === '>') {
                if (this.peek() === '=') {
                    this.tokens.push(new Token('GREATER_EQUAL', '>=', this.line, this.column));
                    this.advance(2);
                } else {
                    this.tokens.push(new Token('GREATER', '>', this.line, this.column));
                    this.advance();
                }
            } else if (char === '!') {
                if (this.peek() === '=') {
                    this.tokens.push(new Token('NOT_EQUAL', '!=', this.line, this.column));
                    this.advance(2);
                } else {
                    this.tokens.push(new Token('NOT', '!', this.line, this.column));
                    this.advance();
                }
            } else if (char === '&' && this.peek() === '&') {
                this.tokens.push(new Token('AND', '&&', this.line, this.column));
                this.advance(2);
            } else if (char === '|' && this.peek() === '|') {
                this.tokens.push(new Token('OR', '||', this.line, this.column));
                this.advance(2);
            } else if (char === '[') {
                this.tokens.push(new Token('LBRACKET', '[', this.line, this.column));
                this.advance();
            } else if (char === ']') {
                this.tokens.push(new Token('RBRACKET', ']', this.line, this.column));
                this.advance();
            } else if (this.isAlpha(char)) {
                this.tokenizeIdentifier();
            } else if (this.isDigit(char)) {
                this.tokenizeNumber();
            } else if (char === '"' || char === "'") {
                this.tokenizeString();
            } else {
                throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
            }
        }
        
        this.tokens.push(new Token('EOF', null, this.line, this.column));
        return this.tokens;
    }

    advance(count = 1) {
        for (let i = 0; i < count; i++) {
            if (this.position < this.input.length) {
                if (this.input[this.position] === '\n') {
                    this.line++;
                    this.column = 1;
                } else {
                    this.column++;
                }
                this.position++;
            }
        }
    }

    peek(offset = 1) {
        const pos = this.position + offset;
        return pos < this.input.length ? this.input[pos] : null;
    }

    skipWhitespace() {
        while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
            this.advance();
        }
    }

    isAlpha(char) {
        return /[a-zA-Z_]/.test(char);
    }

    isDigit(char) {
        return /[0-9]/.test(char);
    }

    isAlphaNumeric(char) {
        return this.isAlpha(char) || this.isDigit(char);
    }

    tokenizeIdentifier() {
        const start = this.position;
        while (this.position < this.input.length && this.isAlphaNumeric(this.input[this.position])) {
            this.advance();
        }
        
        const value = this.input.substring(start, this.position);
        const keywords = {
            'function': 'FUNCTION',
            'return': 'RETURN',
            'if': 'IF',
            'else': 'ELSE',
            'while': 'WHILE',
            'for': 'FOR',
            'let': 'LET',
            'const': 'CONST',
            'var': 'VAR',
            'true': 'TRUE',
            'false': 'FALSE',
            'null': 'NULL'
        };
        
        const type = keywords[value] || 'IDENTIFIER';
        this.tokens.push(new Token(type, value, this.line, this.column - value.length));
    }

    tokenizeNumber() {
        const start = this.position;
        while (this.position < this.input.length && (this.isDigit(this.input[this.position]) || this.input[this.position] === '.')) {
            this.advance();
        }
        
        const value = this.input.substring(start, this.position);
        this.tokens.push(new Token('NUMBER', parseFloat(value), this.line, this.column - value.length));
    }

    tokenizeString() {
        const quote = this.input[this.position];
        this.advance(); // Skip opening quote
        
        const start = this.position;
        while (this.position < this.input.length && this.input[this.position] !== quote) {
            if (this.input[this.position] === '\\') {
                this.advance(); // Skip escape character
            }
            this.advance();
        }
        
        if (this.position >= this.input.length) {
            throw new Error(`Unterminated string at line ${this.line}`);
        }
        
        const value = this.input.substring(start, this.position);
        this.advance(); // Skip closing quote
        this.tokens.push(new Token('STRING', value, this.line, this.column - value.length - 2));
    }
}

class Parser {
    constructor(tokens, memoryManager = new MemoryManager()) {
        this.tokens = tokens;
        this.position = 0;
        this.memoryManager = memoryManager;
    }

    parse() {
        try {
            this.memoryManager.enterScope();
            const program = this.memoryManager.allocateNode('Program', {
                body: []
            });
            
            while (!this.isAtEnd()) {
                const stmt = this.parseStatement();
                if (stmt) {
                    program.body.push(stmt);
                }
            }
            
            return program;
        } finally {
            this.memoryManager.exitScope();
        }
    }

    parseStatement() {
        this.memoryManager.enterScope();
        try {
            if (this.match('LET', 'CONST', 'VAR')) {
                return this.parseVariableDeclaration();
            }
            
            if (this.match('FUNCTION')) {
                return this.parseFunctionDeclaration();
            }
            
            if (this.match('IF')) {
                return this.parseIfStatement();
            }
            
            if (this.match('WHILE')) {
                return this.parseWhileStatement();
            }
            
            if (this.match('RETURN')) {
                return this.parseReturnStatement();
            }
            
            return this.parseExpressionStatement();
        } finally {
            this.memoryManager.exitScope();
        }
    }

    parseExpression() {
        return this.parseArrowFunction();
    }

    // New: Arrow function parsing
    parseArrowFunction() {
        const checkpoint = this.position;
        
        try {
            // Try to parse as arrow function
            let params = [];
            
            // Single parameter without parentheses: x => x * 2
            if (this.check('IDENTIFIER') && this.peekNext()?.type === 'ARROW') {
                const param = this.advance();
                params = [this.memoryManager.allocateNode('Parameter', {
                    name: param.value
                })];
            }
            // Multiple parameters with parentheses: (x, y) => x + y
            else if (this.check('LPAREN')) {
                this.advance(); // consume '('
                
                if (!this.check('RPAREN')) {
                    do {
                        if (!this.check('IDENTIFIER')) {
                            throw new Error('Expected parameter name');
                        }
                        const param = this.advance();
                        params.push(this.memoryManager.allocateNode('Parameter', {
                            name: param.value
                        }));
                    } while (this.match('COMMA'));
                }
                
                if (!this.match('RPAREN')) {
                    throw new Error('Expected ")" after parameters');
                }
            }
            
            // Check for arrow operator
            if (this.match('ARROW')) {
                let body;
                
                // Block body: (x) => { return x * 2; }
                if (this.check('LBRACE')) {
                    body = this.parseBlockStatement();
                }
                // Expression body: (x) => x * 2
                else {
                    const expr = this.parseAssignment();
                    body = this.memoryManager.allocateNode('ExpressionStatement', {
                        expression: expr
                    });
                }
                
                return this.memoryManager.allocateNode('ArrowFunction', {
                    params,
                    body,
                    isAsync: false
                });
            }
        } catch (error) {
            // If arrow function parsing fails, reset and try assignment
            this.position = checkpoint;
        }
        
        return this.parseAssignment();
    }

    parseAssignment() {
        let expr = this.parseLogicalOr();
        
        if (this.match('ASSIGN')) {
            const value = this.parseAssignment();
            return this.memoryManager.allocateNode('AssignmentExpression', {
                left: expr,
                operator: '=',
                right: value
            });
        }
        
        return expr;
    }

    parseLogicalOr() {
        let expr = this.parseLogicalAnd();
        
        while (this.match('OR')) {
            const operator = this.previous();
            const right = this.parseLogicalAnd();
            expr = this.memoryManager.allocateNode('BinaryExpression', {
                left: expr,
                operator: operator.value,
                right
            });
        }
        
        return expr;
    }

    parseLogicalAnd() {
        let expr = this.parseEquality();
        
        while (this.match('AND')) {
            const operator = this.previous();
            const right = this.parseEquality();
            expr = this.memoryManager.allocateNode('BinaryExpression', {
                left: expr,
                operator: operator.value,
                right
            });
        }
        
        return expr;
    }

    parseEquality() {
        let expr = this.parseComparison();
        
        while (this.match('EQUAL', 'NOT_EQUAL')) {
            const operator = this.previous();
            const right = this.parseComparison();
            expr = this.memoryManager.allocateNode('BinaryExpression', {
                left: expr,
                operator: operator.value,
                right
            });
        }
        
        return expr;
    }

    parseComparison() {
        let expr = this.parseTerm();
        
        while (this.match('GREATER', 'GREATER_EQUAL', 'LESS', 'LESS_EQUAL')) {
            const operator = this.previous();
            const right = this.parseTerm();
            expr = this.memoryManager.allocateNode('BinaryExpression', {
                left: expr,
                operator: operator.value,
                right
            });
        }
        
        return expr;
    }

    parseTerm() {
        let expr = this.parseFactor();
        
        while (this.match('MINUS', 'PLUS')) {
            const operator = this.previous();
            const right = this.parseFactor();
            expr = this.memoryManager.allocateNode('BinaryExpression', {
                left: expr,
                operator: operator.value,
                right
            });
        }
        
        return expr;
    }

    parseFactor() {
        let expr = this.parseUnary();
        
        while (this.match('DIVIDE', 'MULTIPLY')) {
            const operator = this.previous();
            const right = this.parseUnary();
            expr = this.memoryManager.allocateNode('BinaryExpression', {
                left: expr,
                operator: operator.value,
                right
            });
        }
        
        return expr;
    }

    parseUnary() {
        if (this.match('NOT', 'MINUS')) {
            const operator = this.previous();
            const right = this.parseUnary();
            return this.memoryManager.allocateNode('UnaryExpression', {
                operator: operator.value,
                argument: right
            });
        }
        
        return this.parseCall();
    }

    parseCall() {
        let expr = this.parsePrimary();
        
        while (true) {
            if (this.match('LPAREN')) {
                expr = this.finishCall(expr);
            } else {
                break;
            }
        }
        
        return expr;
    }

    finishCall(callee) {
        const args = [];
        
        if (!this.check('RPAREN')) {
            do {
                args.push(this.parseExpression());
            } while (this.match('COMMA'));
        }
        
        if (!this.match('RPAREN')) {
            throw new Error('Expected ")" after arguments');
        }
        
        return this.memoryManager.allocateNode('CallExpression', {
            callee,
            arguments: args
        });
    }

    parsePrimary() {
        if (this.match('TRUE')) {
            return this.memoryManager.allocateNode('Literal', {
                value: true,
                raw: 'true'
            });
        }
        
        if (this.match('FALSE')) {
            return this.memoryManager.allocateNode('Literal', {
                value: false,
                raw: 'false'
            });
        }
        
        if (this.match('NULL')) {
            return this.memoryManager.allocateNode('Literal', {
                value: null,
                raw: 'null'
            });
        }
        
        if (this.match('NUMBER')) {
            return this.memoryManager.allocateNode('Literal', {
                value: this.previous().value,
                raw: this.previous().value.toString()
            });
        }
        
        if (this.match('STRING')) {
            return this.memoryManager.allocateNode('Literal', {
                value: this.previous().value,
                raw: `"${this.previous().value}"`
            });
        }
        
        if (this.match('IDENTIFIER')) {
            return this.memoryManager.allocateNode('Identifier', {
                name: this.previous().value
            });
        }
        
        if (this.match('LPAREN')) {
            const expr = this.parseExpression();
            if (!this.match('RPAREN')) {
                throw new Error('Expected ")" after expression');
            }
            return expr;
        }
        
        throw new Error(`Unexpected token ${this.peek().type}`);
    }

    parseVariableDeclaration() {
        const kind = this.previous().value;
        const name = this.consume('IDENTIFIER', 'Expected variable name').value;
        
        let initializer = null;
        if (this.match('ASSIGN')) {
            initializer = this.parseExpression();
        }
        
        this.consume('SEMICOLON', 'Expected ";" after variable declaration');
        
        return this.memoryManager.allocateNode('VariableDeclaration', {
            kind,
            declarations: [{
                id: this.memoryManager.allocateNode('Identifier', { name }),
                init: initializer
            }]
        });
    }

    parseFunctionDeclaration() {
        const name = this.consume('IDENTIFIER', 'Expected function name').value;
        
        this.consume('LPAREN', 'Expected "(" after function name');
        
        const params = [];
        if (!this.check('RPAREN')) {
            do {
                const param = this.consume('IDENTIFIER', 'Expected parameter name').value;
                params.push(this.memoryManager.allocateNode('Parameter', { name: param }));
            } while (this.match('COMMA'));
        }
        
        this.consume('RPAREN', 'Expected ")" after parameters');
        
        const body = this.parseBlockStatement();
        
        return this.memoryManager.allocateNode('FunctionDeclaration', {
            id: this.memoryManager.allocateNode('Identifier', { name }),
            params,
            body
        });
    }

    parseBlockStatement() {
        this.consume('LBRACE', 'Expected "{"');
        
        const statements = [];
        while (!this.check('RBRACE') && !this.isAtEnd()) {
            statements.push(this.parseStatement());
        }
        
        this.consume('RBRACE', 'Expected "}"');
        
        return this.memoryManager.allocateNode('BlockStatement', {
            body: statements
        });
    }

    parseIfStatement() {
        this.consume('LPAREN', 'Expected "(" after "if"');
        const test = this.parseExpression();
        this.consume('RPAREN', 'Expected ")" after if condition');
        
        const consequent = this.parseStatement();
        let alternate = null;
        
        if (this.match('ELSE')) {
            alternate = this.parseStatement();
        }
        
        return this.memoryManager.allocateNode('IfStatement', {
            test,
            consequent,
            alternate
        });
    }

    parseWhileStatement() {
        this.consume('LPAREN', 'Expected "(" after "while"');
        const test = this.parseExpression();
        this.consume('RPAREN', 'Expected ")" after while condition');
        
        const body = this.parseStatement();
        
        return this.memoryManager.allocateNode('WhileStatement', {
            test,
            body
        });
    }

    parseReturnStatement() {
        let argument = null;
        if (!this.check('SEMICOLON')) {
            argument = this.parseExpression();
        }
        
        this.consume('SEMICOLON', 'Expected ";" after return value');
        
        return this.memoryManager.allocateNode('ReturnStatement', {
            argument
        });
    }

    parseExpressionStatement() {
        const expr = this.parseExpression();
        this.consume('SEMICOLON', 'Expected ";" after expression');
        
        return this.memoryManager.allocateNode('ExpressionStatement', {
            expression: expr
        });
    }

    // Helper methods
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    check(type) {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    advance() {
        if (!this.isAtEnd()) this.position++;
        return this.previous();
    }

    isAtEnd() {
        return this.peek().type === 'EOF';
    }

    peek() {
        return this.tokens[this.position];
    }

    peekNext() {
        if (this.position + 1 >= this.tokens.length) return null;
        return this.tokens[this.position + 1];
    }

    previous() {
        return this.tokens[this.position - 1];
    }

    consume(type, message) {
        if (this.check(type)) return this.advance();
        
        const current = this.peek();
        throw new Error(`${message}. Got ${current.type} at line ${current.line}, column ${current.column}`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Lexer, Parser, MemoryManager, Token };
}

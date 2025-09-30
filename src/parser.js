/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🌟 LUASCRIPT - THE COMPLETE VISION 🌟
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * MISSION: Give JavaScript developers Mojo-like superpowers
 * 
 * THE FIVE PILLARS:
 * 1. 💪 Mojo-Like Superpowers: JavaScript syntax + Native performance + System access
 * 2. 🤖 Self-Building Agentic IDE: AI-powered IDE written in LUASCRIPT for LUASCRIPT
 * 3. 🔢 Balanced Ternary Computing: Revolutionary (-1,0,+1) logic for quantum-ready algorithms
 * 4. 🎨 CSS Evolution: CSS → Gaussian CSS → GSS → AGSS (AI-driven adaptive design)
 * 5. ⚡ Great C Support: Seamless FFI, inline C, full ecosystem access
 * 
 * VISION: "Possibly impossible to achieve but dammit, we're going to try!"
 * 
 * This file is part of the LUASCRIPT revolution - a paradigm shift in programming
 * that bridges JavaScript familiarity with native performance, AI-driven tooling,
 * novel computing paradigms, and revolutionary styling systems.
 * 
 * 📖 Full Vision: See VISION.md, docs/vision_overview.md, docs/architecture_spec.md
 * 🗺️ Roadmap: See docs/roadmap.md
 * 💾 Backup: See docs/redundant/vision_backup.txt
 * ═══════════════════════════════════════════════════════════════════════════════
 */



/**
 * LUASCRIPT Parser - PERFECT PARSER INITIATIVE Phase 1 Implementation
 * 
 * PHASE 1 ENHANCEMENTS:
 * - Fixed string concatenation bug in code generator
 * - Comprehensive runtime validation and input validation
 * - Consistent parsing strategy alignment across all modules
 * - Enhanced memory management with leak prevention
 * - Improved error handling and recovery mechanisms
 * 
 * Supports arrow functions, memory management, and enhanced error handling
 */

class MemoryManager {
    constructor(maxNodes = 10000, maxDepth = 100) {
        this.maxNodes = maxNodes;
        this.maxDepth = maxDepth;
        this.nodeCount = 0;
        this.currentDepth = 0;
        this.allocatedNodes = new Set();
        
        // PERFECT PARSER INITIATIVE - Phase 1: Enhanced memory tracking
        this.nodeTypeStats = new Map();
        this.peakMemoryUsage = 0;
        this.allocationHistory = [];
        this.leakDetectionEnabled = true;
    }

    allocateNode(type, data = {}) {
        // PHASE 1: Enhanced memory limit checking with better error messages
        if (this.nodeCount >= this.maxNodes) {
            const stats = this.getDetailedStats();
            throw new Error(
                `LUASCRIPT_MEMORY_ERROR: Memory limit exceeded (${this.maxNodes} nodes). ` +
                `Current usage: ${stats.memoryUsage}. Top node types: ${stats.topNodeTypes.join(', ')}`
            );
        }
        
        // PHASE 1: Input validation for node creation
        if (typeof type !== 'string' || type.trim().length === 0) {
            throw new Error('LUASCRIPT_PARSER_ERROR: Node type must be a non-empty string');
        }
        
        if (typeof data !== 'object' || data === null) {
            throw new Error('LUASCRIPT_PARSER_ERROR: Node data must be an object');
        }
        
        const node = {
            id: `node_${this.nodeCount}`,
            type,
            ...data,
            _allocated: true,
            _createdAt: Date.now(),
            _depth: this.currentDepth
        };
        
        this.nodeCount++;
        this.allocatedNodes.add(node);
        
        // PHASE 1: Enhanced statistics tracking
        this.nodeTypeStats.set(type, (this.nodeTypeStats.get(type) || 0) + 1);
        this.peakMemoryUsage = Math.max(this.peakMemoryUsage, this.nodeCount);
        
        if (this.allocationHistory.length < 1000) { // Keep last 1000 allocations
            this.allocationHistory.push({ type, timestamp: Date.now(), depth: this.currentDepth });
        }
        
        return node;
    }

    enterScope() {
        this.currentDepth++;
        if (this.currentDepth > this.maxDepth) {
            throw new Error(
                `LUASCRIPT_PARSER_ERROR: Stack overflow - maximum depth ${this.maxDepth} exceeded. ` +
                `This usually indicates infinite recursion or deeply nested structures.`
            );
        }
    }

    exitScope() {
        this.currentDepth = Math.max(0, this.currentDepth - 1);
        
        // PHASE 1: Leak detection - check for nodes that should be cleaned up
        if (this.leakDetectionEnabled && this.currentDepth === 0) {
            this.detectPotentialLeaks();
        }
    }

    /**
     * PERFECT PARSER INITIATIVE - Phase 1: Memory Leak Detection
     * Detects nodes that may have been leaked during parsing
     */
    detectPotentialLeaks() {
        const suspiciousNodes = [];
        const currentTime = Date.now();
        
        for (const node of this.allocatedNodes) {
            // Nodes older than 10 seconds at depth 0 might be leaked
            if (node._allocated && (currentTime - node._createdAt) > 10000) {
                suspiciousNodes.push(node);
            }
        }
        
        if (suspiciousNodes.length > 0) {
            console.warn(
                `LUASCRIPT_MEMORY_WARNING: Detected ${suspiciousNodes.length} potentially leaked nodes. ` +
                `Consider calling cleanup() if parsing is complete.`
            );
        }
    }

    cleanup() {
        for (const node of this.allocatedNodes) {
            if (node._allocated) {
                node._allocated = false;
                // PHASE 1: More thorough cleanup
                delete node._createdAt;
                delete node._depth;
            }
        }
        this.allocatedNodes.clear();
        this.nodeCount = 0;
        this.currentDepth = 0;
        
        // PHASE 1: Reset enhanced tracking
        this.nodeTypeStats.clear();
        this.allocationHistory = [];
    }

    getStats() {
        return {
            nodeCount: this.nodeCount,
            currentDepth: this.currentDepth,
            maxNodes: this.maxNodes,
            maxDepth: this.maxDepth,
            memoryUsage: `${this.nodeCount}/${this.maxNodes} nodes`,
            peakMemoryUsage: this.peakMemoryUsage
        };
    }

    /**
     * PERFECT PARSER INITIATIVE - Phase 1: Detailed Memory Statistics
     * Provides comprehensive memory usage information for debugging
     */
    getDetailedStats() {
        const topNodeTypes = Array.from(this.nodeTypeStats.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type, count]) => `${type}(${count})`);
        
        return {
            ...this.getStats(),
            topNodeTypes,
            nodeTypeBreakdown: Object.fromEntries(this.nodeTypeStats),
            allocationRate: this.allocationHistory.length > 1 ? 
                (this.allocationHistory.length / ((Date.now() - this.allocationHistory[0].timestamp) / 1000)).toFixed(2) + ' nodes/sec' : 
                'N/A'
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
        // PERFECT PARSER INITIATIVE - Phase 1: Input validation and strategy alignment
        this.validateConstructorInputs(tokens, memoryManager);
        
        this.tokens = tokens;
        this.position = 0;
        this.memoryManager = memoryManager;
        
        // PHASE 1: Parser strategy configuration for consistency
        this.parsingStrategy = {
            strictMode: true,
            allowRecovery: true,
            maxErrorsBeforeAbort: 10,
            trackSourceLocations: true
        };
        
        this.errors = [];
        this.warnings = [];
    }

    /**
     * PERFECT PARSER INITIATIVE - Phase 1: Constructor Input Validation
     * Ensures consistent parser initialization across all modules
     */
    validateConstructorInputs(tokens, memoryManager) {
        if (!Array.isArray(tokens)) {
            throw new Error('LUASCRIPT_PARSER_ERROR: Tokens must be an array');
        }
        
        if (tokens.length === 0) {
            throw new Error('LUASCRIPT_PARSER_ERROR: Token array cannot be empty');
        }
        
        // Validate token structure
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (!token || typeof token.type !== 'string') {
                throw new Error(`LUASCRIPT_PARSER_ERROR: Invalid token at position ${i} - missing or invalid type`);
            }
            if (typeof token.line !== 'number' || typeof token.column !== 'number') {
                throw new Error(`LUASCRIPT_PARSER_ERROR: Invalid token at position ${i} - missing line/column information`);
            }
        }
        
        // Ensure EOF token exists
        const lastToken = tokens[tokens.length - 1];
        if (lastToken.type !== 'EOF') {
            throw new Error('LUASCRIPT_PARSER_ERROR: Token array must end with EOF token');
        }
        
        if (memoryManager && !(memoryManager instanceof MemoryManager)) {
            throw new Error('LUASCRIPT_PARSER_ERROR: memoryManager must be an instance of MemoryManager');
        }
    }

    parse() {
        try {
            this.memoryManager.enterScope();
            
            // PHASE 1: Enhanced program node with metadata
            const program = this.memoryManager.allocateNode('Program', {
                body: [],
                sourceType: 'script',
                parsingStartTime: Date.now(),
                parsingStrategy: { ...this.parsingStrategy }
            });
            
            while (!this.isAtEnd()) {
                try {
                    const stmt = this.parseStatement();
                    if (stmt) {
                        program.body.push(stmt);
                    }
                } catch (error) {
                    // PHASE 1: Error recovery strategy
                    this.handleParsingError(error);
                    
                    if (this.errors.length >= this.parsingStrategy.maxErrorsBeforeAbort) {
                        throw new Error(
                            `LUASCRIPT_PARSER_ERROR: Too many parsing errors (${this.errors.length}). ` +
                            `Aborting parse. First error: ${this.errors[0].message}`
                        );
                    }
                    
                    // Try to recover by skipping to next statement
                    this.recoverToNextStatement();
                }
            }
            
            // PHASE 1: Add parsing completion metadata
            program.parsingEndTime = Date.now();
            program.parsingDuration = program.parsingEndTime - program.parsingStartTime;
            program.errors = [...this.errors];
            program.warnings = [...this.warnings];
            
            return program;
        } finally {
            this.memoryManager.exitScope();
        }
    }

    /**
     * PERFECT PARSER INITIATIVE - Phase 1: Enhanced Error Handling
     * Provides consistent error handling across all parsing methods
     */
    handleParsingError(error) {
        const currentToken = this.peek();
        const errorInfo = {
            message: error.message,
            line: currentToken.line,
            column: currentToken.column,
            position: this.position,
            tokenType: currentToken.type,
            tokenValue: currentToken.value,
            timestamp: Date.now()
        };
        
        this.errors.push(errorInfo);
        
        // Log error for debugging (can be disabled in production)
        if (this.parsingStrategy.strictMode) {
            console.error(`LUASCRIPT_PARSER_ERROR at ${errorInfo.line}:${errorInfo.column}: ${errorInfo.message}`);
        }
    }

    /**
     * PERFECT PARSER INITIATIVE - Phase 1: Error Recovery Strategy
     * Attempts to recover from parsing errors to continue parsing
     */
    recoverToNextStatement() {
        if (!this.parsingStrategy.allowRecovery) {
            return;
        }
        
        // Skip tokens until we find a likely statement boundary
        const statementBoundaries = ['SEMICOLON', 'RBRACE', 'LET', 'CONST', 'VAR', 'FUNCTION', 'IF', 'WHILE', 'FOR', 'RETURN'];
        
        while (!this.isAtEnd() && !statementBoundaries.includes(this.peek().type)) {
            this.advance();
        }
        
        // If we found a semicolon, skip it
        if (this.check('SEMICOLON')) {
            this.advance();
        }
    }

    /**
     * PERFECT PARSER INITIATIVE - Phase 1: Parser Strategy Validation
     * Ensures consistent parsing behavior across all methods
     */
    validateParsingStrategy() {
        const requiredProperties = ['strictMode', 'allowRecovery', 'maxErrorsBeforeAbort', 'trackSourceLocations'];
        
        for (const prop of requiredProperties) {
            if (!(prop in this.parsingStrategy)) {
                throw new Error(`LUASCRIPT_PARSER_ERROR: Missing required parsing strategy property: ${prop}`);
            }
        }
        
        if (typeof this.parsingStrategy.strictMode !== 'boolean') {
            throw new Error('LUASCRIPT_PARSER_ERROR: strictMode must be a boolean');
        }
        
        if (typeof this.parsingStrategy.allowRecovery !== 'boolean') {
            throw new Error('LUASCRIPT_PARSER_ERROR: allowRecovery must be a boolean');
        }
        
        if (typeof this.parsingStrategy.maxErrorsBeforeAbort !== 'number' || this.parsingStrategy.maxErrorsBeforeAbort < 1) {
            throw new Error('LUASCRIPT_PARSER_ERROR: maxErrorsBeforeAbort must be a positive number');
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


/**
 * LUASCRIPT Parser - Phase 1D Implementation + Tony Yoka's PS2/PS3 Optimizations
 * 
 * MULTI-TEAM ENHANCEMENT:
 * - Steve Jobs & Donald Knuth: Algorithmic Excellence
 * - Tony Yoka PS2/PS3 Team: Memory & Performance Optimizations
 * - Main Dev Team: 95% Phase Completion Push
 * - Sundar/Linus/Ada: Stability & Harmony
 * 
 * Features:
 * - Arrow functions, memory management, enhanced error handling
 * - PS2/PS3-inspired memory pool allocation
 * - Cache-aware data structures
 * - Performance monitoring integration
 */

/**
 * Manages memory allocation for AST nodes, incorporating optimizations inspired by PS2/PS3 architecture.
 * This includes memory pooling and performance tracking to ensure efficient parsing.
 */
class MemoryManager {
    /**
     * Creates an instance of the MemoryManager.
     * @param {number} [maxNodes=10000] - The maximum number of nodes that can be allocated.
     * @param {number} [maxDepth=100] - The maximum recursion depth for parsing.
     */
    constructor(maxNodes = 10000, maxDepth = 100) {
        this.maxNodes = maxNodes;
        this.maxDepth = maxDepth;
        this.nodeCount = 0;
        this.currentDepth = 0;
        this.allocatedNodes = new Set();
        
        // Tony Yoka's PS2/PS3 Memory Optimizations
        this.memoryPools = {
            small: { size: 64, nodes: [], allocated: 0 },    // Small nodes (64 bytes equivalent)
            medium: { size: 256, nodes: [], allocated: 0 },  // Medium nodes (256 bytes equivalent)
            large: { size: 1024, nodes: [], allocated: 0 }   // Large nodes (1KB equivalent)
        };
        
        // Pre-allocate node pools (PS2/PS3 style)
        this.initializeNodePools();
        
        // Performance tracking
        this.stats = {
            allocations: 0,
            deallocations: 0,
            poolHits: 0,
            poolMisses: 0,
            peakMemory: 0
        };
    }

    /**
     * Initializes the node pools for memory management.
     * @private
     */
    initializeNodePools() {
        // Pre-allocate nodes in pools to avoid runtime allocation overhead
        for (const [poolName, pool] of Object.entries(this.memoryPools)) {
            for (let i = 0; i < 50; i++) { // Pre-allocate 50 nodes per pool
                pool.nodes.push({
                    id: `pool_${poolName}_${i}`,
                    inUse: false,
                    data: {},
                    lastUsed: 0
                });
            }
        }
    }

    /**
     * Allocates a new AST node, using a memory pool if available.
     * @param {string} type - The type of the node to allocate.
     * @param {object} [data={}] - The data to store in the node.
     * @returns {object} The allocated node.
     * @throws {Error} If the memory or depth limit is exceeded.
     */
    allocateNode(type, data = {}) {
        if (this.nodeCount >= this.maxNodes) {
            throw new Error(`Memory limit exceeded: maximum ${this.maxNodes} nodes allowed`);
        }
        
        this.stats.allocations++;
        
        // Tony Yoka's PS2/PS3 Pool Allocation Strategy
        const nodeSize = this.estimateNodeSize(type, data);
        const poolName = this.selectPool(nodeSize);
        const pool = this.memoryPools[poolName];
        
        // Try to get node from pool first
        const pooledNode = pool.nodes.find(n => !n.inUse);
        if (pooledNode) {
            // Reuse pooled node
            pooledNode.inUse = true;
            pooledNode.type = type;
            pooledNode.data = { ...data };
            if (pooledNode.__dataKeys) {
                for (const key of pooledNode.__dataKeys) {
                    delete pooledNode[key];
                }
            }
            pooledNode.__dataKeys = Object.keys(data);
            for (const key of pooledNode.__dataKeys) {
                pooledNode[key] = data[key];
            }
            pooledNode.lastUsed = Date.now();
            pooledNode._allocated = true;
            
            pool.allocated++;
            this.stats.poolHits++;
            this.nodeCount++;
            this.allocatedNodes.add(pooledNode);
            
            return pooledNode;
        }
        
        // Fallback to regular allocation if pool is exhausted
        this.stats.poolMisses++;
        const node = {
            id: `node_${this.nodeCount}`,
            type,
            ...data,
            _allocated: true,
            _pooled: false,
            __dataKeys: Object.keys(data)
        };
        
        this.nodeCount++;
        this.allocatedNodes.add(node);
        
        // Track peak memory usage
        if (this.nodeCount > this.stats.peakMemory) {
            this.stats.peakMemory = this.nodeCount;
        }
        
        return node;
    }

    /**
     * Estimates the memory size of a node.
     * @param {string} type - The node type.
     * @param {object} data - The node data.
     * @returns {number} The estimated size in bytes.
     * @private
     */
    estimateNodeSize(type, data) {
        // Estimate node size based on type and data
        const baseSize = 32; // Base node overhead
        const typeSize = type.length * 2;
        const dataSize = JSON.stringify(data).length;
        return baseSize + typeSize + dataSize;
    }

    /**
     * Selects the appropriate memory pool for a given node size.
     * @param {number} estimatedSize - The estimated size of the node.
     * @returns {string} The name of the selected pool.
     * @private
     */
    selectPool(estimatedSize) {
        if (estimatedSize <= 64) return 'small';
        if (estimatedSize <= 256) return 'medium';
        return 'large';
    }

    /**
     * Enters a new scope, incrementing the depth counter.
     * @throws {Error} If the maximum depth is exceeded.
     */
    enterScope() {
        this.currentDepth++;
        if (this.currentDepth > this.maxDepth) {
            throw new Error(`Stack overflow: maximum depth ${this.maxDepth} exceeded`);
        }
    }

    /**
     * Exits the current scope, decrementing the depth counter.
     */
    exitScope() {
        this.currentDepth = Math.max(0, this.currentDepth - 1);
    }

    /**
     * Cleans up allocated nodes and resets the memory manager's state.
     */
    cleanup() {
        this.stats.deallocations += this.allocatedNodes.size;
        
        // Return pooled nodes to their pools
        for (const node of this.allocatedNodes) {
            if (node._allocated) {
                node._allocated = false;
                
                // If it's a pooled node, return it to the pool
                if (node.id && node.id.startsWith('pool_')) {
                    const poolName = node.id.split('_')[1];
                    const pool = this.memoryPools[poolName];
                    if (pool) {
                        node.inUse = false;
                        node.data = {};
                        if (node.__dataKeys) {
                            for (const key of node.__dataKeys) {
                                delete node[key];
                            }
                            node.__dataKeys = [];
                        }
                        pool.allocated--;
                    }
                }
            }
        }
        
        this.allocatedNodes.clear();
        this.nodeCount = 0;
        this.currentDepth = 0;
    }

    /**
     * Retrieves statistics about memory usage and performance.
     * @returns {object} An object containing detailed statistics.
     */
    getStats() {
        const poolStats = {};
        for (const [poolName, pool] of Object.entries(this.memoryPools)) {
            poolStats[poolName] = {
                total: pool.nodes.length,
                allocated: pool.allocated,
                available: pool.nodes.length - pool.allocated,
                utilization: pool.nodes.length > 0 ? (pool.allocated / pool.nodes.length * 100).toFixed(1) + '%' : '0%'
            };
        }

        return {
            nodeCount: this.nodeCount,
            currentDepth: this.currentDepth,
            maxNodes: this.maxNodes,
            maxDepth: this.maxDepth,
            memoryUsage: `${this.nodeCount}/${this.maxNodes} nodes`,
            peakMemory: this.stats.peakMemory,
            allocations: this.stats.allocations,
            deallocations: this.stats.deallocations,
            poolHitRate: this.stats.allocations > 0 ? ((this.stats.poolHits / this.stats.allocations) * 100).toFixed(1) + '%' : '0%',
            poolStats: poolStats,
            tonyYokaOptimizations: {
                memoryPools: 'Active',
                poolAllocation: 'Enabled',
                performanceTracking: 'Enabled'
            }
        };
    }
}

/**
 * Represents a token in the source code.
 */
class Token {
    /**
     * Creates an instance of a Token.
     * @param {string} type - The type of the token (e.g., 'IDENTIFIER', 'NUMBER').
     * @param {*} value - The value of the token.
     * @param {number} [line=1] - The line number where the token appears.
     * @param {number} [column=1] - The column number where the token appears.
     */
    constructor(type, value, line = 1, column = 1) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }
}

/**
 * The Lexer class is responsible for breaking the input code string into a sequence of tokens.
 */
class Lexer {
    /**
     * Creates an instance of the Lexer.
     * @param {string} input - The source code to tokenize.
     */
    constructor(input) {
        this.input = input;
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
    }

    /**
     * Tokenizes the input string into an array of tokens.
     * @returns {Token[]} The array of tokens.
     * @throws {Error} If an unexpected character is encountered.
     */
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

    /**
     * Advances the lexer's position in the input string.
     * @param {number} [count=1] - The number of characters to advance.
     * @private
     */
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

    /**
     * Peeks at a character in the input string without advancing the position.
     * @param {number} [offset=1] - The offset from the current position to peek.
     * @returns {string|null} The character at the given offset, or null if out of bounds.
     * @private
     */
    peek(offset = 1) {
        const pos = this.position + offset;
        return pos < this.input.length ? this.input[pos] : null;
    }

    /**
     * Skips whitespace characters in the input string.
     * @private
     */
    skipWhitespace() {
        while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
            this.advance();
        }
    }

    /**
     * Checks if a character is alphabetic.
     * @param {string} char - The character to check.
     * @returns {boolean} True if the character is alphabetic.
     * @private
     */
    isAlpha(char) {
        return /[a-zA-Z_]/.test(char);
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
     * Checks if a character is alphanumeric.
     * @param {string} char - The character to check.
     * @returns {boolean} True if the character is alphanumeric.
     * @private
     */
    isAlphaNumeric(char) {
        return this.isAlpha(char) || this.isDigit(char);
    }

    /**
     * Tokenizes an identifier or a keyword.
     * @private
     */
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

    /**
     * Tokenizes a number literal.
     * @private
     */
    tokenizeNumber() {
        const start = this.position;
        while (this.position < this.input.length && (this.isDigit(this.input[this.position]) || this.input[this.position] === '.')) {
            this.advance();
        }
        
        const value = this.input.substring(start, this.position);
        this.tokens.push(new Token('NUMBER', parseFloat(value), this.line, this.column - value.length));
    }

    /**
     * Tokenizes a string literal.
     * @private
     * @throws {Error} If the string is unterminated.
     */
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

/**
 * The Parser class constructs an Abstract Syntax Tree (AST) from a sequence of tokens.
 */
class Parser {
    /**
     * Creates an instance of the Parser.
     * @param {Token[]} tokens - The array of tokens from the lexer.
     * @param {MemoryManager} [memoryManager] - The memory manager to use for AST node allocation.
     */
    constructor(tokens, memoryManager = new MemoryManager()) {
        this.tokens = tokens;
        this.position = 0;
        this.memoryManager = memoryManager;
    }

    /**
     * Parses the tokens into an AST.
     * @returns {object} The root node of the AST.
     */
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

    /**
     * Parses a single statement.
     * @returns {object} The AST node for the statement.
     * @private
     */
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

    /**
     * Parses an expression.
     * @returns {object} The AST node for the expression.
     * @private
     */
    parseExpression() {
        return this.parseArrowFunction();
    }

    /**
     * Parses an arrow function expression.
     * @returns {object} The AST node for the arrow function or a lower-precedence expression.
     * @private
     */
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

    /**
     * Parses an assignment expression.
     * @returns {object} The AST node for the assignment or a lower-precedence expression.
     * @private
     */
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

    /**
     * Parses a logical OR expression.
     * @returns {object} The AST node for the logical OR or a lower-precedence expression.
     * @private
     */
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

    /**
     * Parses a logical AND expression.
     * @returns {object} The AST node for the logical AND or a lower-precedence expression.
     * @private
     */
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

    /**
     * Parses an equality expression.
     * @returns {object} The AST node for the equality expression or a lower-precedence expression.
     * @private
     */
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

    /**
     * Parses a comparison expression.
     * @returns {object} The AST node for the comparison or a lower-precedence expression.
     * @private
     */
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

    /**
     * Parses a term (addition/subtraction).
     * @returns {object} The AST node for the term or a lower-precedence expression.
     * @private
     */
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

    /**
     * Parses a factor (multiplication/division).
     * @returns {object} The AST node for the factor or a lower-precedence expression.
     * @private
     */
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

    /**
     * Parses a unary expression.
     * @returns {object} The AST node for the unary expression or a lower-precedence expression.
     * @private
     */
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

    /**
     * Parses a call expression.
     * @returns {object} The AST node for the call expression or a lower-precedence expression.
     * @private
     */
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

    /**
     * Finishes parsing a call expression after the callee has been parsed.
     * @param {object} callee - The callee node.
     * @returns {object} The AST node for the call expression.
     * @private
     */
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

    /**
     * Parses a primary expression (literals, identifiers, grouped expressions).
     * @returns {object} The AST node for the primary expression.
     * @private
     * @throws {Error} If an unexpected token is found.
     */
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

    /**
     * Parses a variable declaration statement.
     * @returns {object} The AST node for the variable declaration.
     * @private
     */
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

    /**
     * Parses a function declaration statement.
     * @returns {object} The AST node for the function declaration.
     * @private
     */
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

    /**
     * Parses a block statement.
     * @returns {object} The AST node for the block statement.
     * @private
     */
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

    /**
     * Parses an if statement.
     * @returns {object} The AST node for the if statement.
     * @private
     */
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

    /**
     * Parses a while statement.
     * @returns {object} The AST node for the while statement.
     * @private
     */
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

    /**
     * Parses a return statement.
     * @returns {object} The AST node for the return statement.
     * @private
     */
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

    /**
     * Parses an expression statement.
     * @returns {object} The AST node for the expression statement.
     * @private
     */
    parseExpressionStatement() {
        const expr = this.parseExpression();
        this.consume('SEMICOLON', 'Expected ";" after expression');
        
        return this.memoryManager.allocateNode('ExpressionStatement', {
            expression: expr
        });
    }

    /**
     * Checks if the current token matches any of the given types and advances if it does.
     * @param {...string} types - The token types to match.
     * @returns {boolean} True if a match is found.
     * @private
     */
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if the current token is of the given type without advancing.
     * @param {string} type - The token type to check.
     * @returns {boolean} True if the current token matches the type.
     * @private
     */
    check(type) {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    /**
     * Advances the parser to the next token.
     * @returns {Token} The previous token.
     * @private
     */
    advance() {
        if (!this.isAtEnd()) this.position++;
        return this.previous();
    }

    /**
     * Checks if the parser is at the end of the token stream.
     * @returns {boolean} True if at the end.
     * @private
     */
    isAtEnd() {
        return this.peek().type === 'EOF';
    }

    /**
     * Gets the current token without advancing.
     * @returns {Token} The current token.
     * @private
     */
    peek() {
        return this.tokens[this.position];
    }

    /**
     * Gets the next token without advancing.
     * @returns {Token|null} The next token, or null if at the end.
     * @private
     */
    peekNext() {
        if (this.position + 1 >= this.tokens.length) return null;
        return this.tokens[this.position + 1];
    }

    /**
     * Gets the previous token.
     * @returns {Token} The previous token.
     * @private
     */
    previous() {
        return this.tokens[this.position - 1];
    }

    /**
     * Consumes the current token if it matches the expected type, otherwise throws an error.
     * @param {string} type - The expected token type.
     * @param {string} message - The error message to throw if the token doesn't match.
     * @returns {Token} The consumed token.
     * @private
     * @throws {Error} If the token does not match the expected type.
     */
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

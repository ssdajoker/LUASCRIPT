
/**
 * LUASCRIPT Phase 1 Core - Advanced Parser Implementation
 * PS2/PS3 Specialists + Steve Jobs + Donald Knuth Excellence
 * 32+ Developer Team Implementation - CRUNCH MODE!
 */

const { LuaScriptLexer } = require('./phase1_core_lexer');
const {
    ProgramNode, BlockStatementNode, ExpressionStatementNode,
    VariableDeclarationNode, VariableDeclaratorNode, FunctionDeclarationNode,
    ReturnStatementNode, IfStatementNode, WhileStatementNode, ForStatementNode,
    BreakStatementNode, ContinueStatementNode, BinaryExpressionNode,
    UnaryExpressionNode, AssignmentExpressionNode, UpdateExpressionNode,
    LogicalExpressionNode, ConditionalExpressionNode, CallExpressionNode,
    MemberExpressionNode, ArrayExpressionNode, ObjectExpressionNode,
    PropertyNode, ArrowFunctionExpressionNode, FunctionExpressionNode,
    LiteralNode, IdentifierNode, ThisExpressionNode, TemplateLiteralNode,
    TemplateElementNode, ErrorNode, ASTUtils
} = require('./phase1_core_ast');

class LuaScriptParser {
    constructor(source, options = {}) {
        this.lexer = new LuaScriptLexer(source, options);
        this.tokens = [];
        this.current = 0;
        this.errors = [];
        this.options = {
            errorRecovery: options.errorRecovery !== false,
            strictMode: options.strictMode || false,
            allowReturnOutsideFunction: options.allowReturnOutsideFunction || false,
            ...options
        };
        this.functionDepth = 0;
        this.loopDepth = 0;
    }

    parse() {
        try {
            this.tokens = this.lexer.tokenize();
            
            if (this.lexer.hasErrors()) {
                this.errors.push(...this.lexer.getErrors().map(err => ({
                    type: 'LexicalError',
                    message: err.value,
                    line: err.line,
                    column: err.column
                })));
            }

            const program = this.parseProgram();
            
            if (!this.isAtEnd() && this.options.errorRecovery) {
                this.addError('Unexpected tokens after end of program');
            }

            return {
                type: 'Program',
                body: program.body,
                errors: this.errors,
                sourceType: 'script'
            };
        } catch (error) {
            if (this.options.errorRecovery) {
                this.addError(error.message);
                return {
                    type: 'Program',
                    body: [],
                    errors: this.errors,
                    sourceType: 'script'
                };
            }
            throw error;
        }
    }

    parseProgram() {
        const body = [];
        
        while (!this.isAtEnd()) {
            try {
                const stmt = this.parseStatement();
                if (stmt) body.push(stmt);
            } catch (error) {
                if (this.options.errorRecovery) {
                    this.addError(error.message);
                    this.synchronize();
                } else {
                    throw error;
                }
            }
        }

        return new ProgramNode(body);
    }

    parseStatement() {
        try {
            if (this.match('KEYWORD')) {
                const keyword = this.previous().value;
                switch (keyword) {
                    case 'let':
                    case 'const':
                    case 'var':
                        return this.parseVariableDeclaration(keyword);
                    case 'function':
                        return this.parseFunctionDeclaration();
                    case 'return':
                        return this.parseReturnStatement();
                    case 'if':
                        return this.parseIfStatement();
                    case 'while':
                        return this.parseWhileStatement();
                    case 'for':
                        return this.parseForStatement();
                    case 'break':
                        return this.parseBreakStatement();
                    case 'continue':
                        return this.parseContinueStatement();
                    case 'do':
                        return this.parseDoWhileStatement();
                    default:
                        // Backtrack and parse as expression statement
                        this.current--;
                        return this.parseExpressionStatement();
                }
            }

            if (this.check('LEFT_BRACE')) {
                return this.parseBlockStatement();
            }

            return this.parseExpressionStatement();
        } catch (error) {
            if (this.options.errorRecovery) {
                this.addError(error.message);
                return new ErrorNode(error.message, this.peek());
            }
            throw error;
        }
    }

    parseVariableDeclaration(kind) {
        const declarations = [];
        
        do {
            const id = this.parseIdentifier();
            let init = null;
            
            if (this.match('ASSIGN')) {
                init = this.parseAssignmentExpression();
            } else if (kind === 'const') {
                throw new SyntaxError(`Missing initializer in const declaration at line ${this.peek().line}`);
            }
            
            declarations.push(new VariableDeclaratorNode(id, init, {
                line: id.line,
                column: id.column
            }));
            
        } while (this.match('COMMA'));
        
        this.consume('SEMICOLON', "Expected ';' after variable declaration");
        
        return new VariableDeclarationNode(declarations, kind, {
            line: declarations[0].line,
            column: declarations[0].column
        });
    }

    parseFunctionDeclaration() {
        this.functionDepth++;
        
        const id = this.parseIdentifier();
        
        this.consume('LEFT_PAREN', "Expected '(' after function name");
        const params = this.parseParameterList();
        this.consume('RIGHT_PAREN', "Expected ')' after parameters");
        
        const body = this.parseBlockStatement();
        
        this.functionDepth--;
        
        return new FunctionDeclarationNode(id, params, body, {
            line: id.line,
            column: id.column
        });
    }

    parseReturnStatement() {
        const token = this.previous();
        
        if (this.functionDepth === 0 && !this.options.allowReturnOutsideFunction) {
            throw new SyntaxError(`Return statement outside function at line ${token.line}`);
        }
        
        let argument = null;
        if (!this.check('SEMICOLON') && !this.isAtEnd()) {
            argument = this.parseExpression();
        }
        
        this.consume('SEMICOLON', "Expected ';' after return statement");
        
        return new ReturnStatementNode(argument, {
            line: token.line,
            column: token.column
        });
    }

    parseIfStatement() {
        const token = this.previous();
        
        this.consume('LEFT_PAREN', "Expected '(' after 'if'");
        const test = this.parseExpression();
        this.consume('RIGHT_PAREN', "Expected ')' after if condition");
        
        const consequent = this.parseStatement();
        let alternate = null;
        
        if (this.match('KEYWORD') && this.previous().value === 'else') {
            alternate = this.parseStatement();
        } else {
            this.current--; // Backtrack if not 'else'
        }
        
        return new IfStatementNode(test, consequent, alternate, {
            line: token.line,
            column: token.column
        });
    }

    parseWhileStatement() {
        const token = this.previous();
        this.loopDepth++;
        
        this.consume('LEFT_PAREN', "Expected '(' after 'while'");
        const test = this.parseExpression();
        this.consume('RIGHT_PAREN', "Expected ')' after while condition");
        
        const body = this.parseStatement();
        
        this.loopDepth--;
        
        return new WhileStatementNode(test, body, {
            line: token.line,
            column: token.column
        });
    }

    parseForStatement() {
        const token = this.previous();
        this.loopDepth++;
        
        this.consume('LEFT_PAREN', "Expected '(' after 'for'");
        
        let init = null;
        if (!this.check('SEMICOLON')) {
            if (this.match('KEYWORD') && ['let', 'const', 'var'].includes(this.previous().value)) {
                const kind = this.previous().value;
                this.current--; // Backtrack to re-parse as variable declaration
                init = this.parseVariableDeclaration(kind);
                this.current--; // Don't consume semicolon here
            } else {
                init = this.parseExpression();
            }
        }
        this.consume('SEMICOLON', "Expected ';' after for loop initializer");
        
        let test = null;
        if (!this.check('SEMICOLON')) {
            test = this.parseExpression();
        }
        this.consume('SEMICOLON', "Expected ';' after for loop condition");
        
        let update = null;
        if (!this.check('RIGHT_PAREN')) {
            update = this.parseExpression();
        }
        this.consume('RIGHT_PAREN', "Expected ')' after for clauses");
        
        const body = this.parseStatement();
        
        this.loopDepth--;
        
        return new ForStatementNode(init, test, update, body, {
            line: token.line,
            column: token.column
        });
    }

    parseBreakStatement() {
        const token = this.previous();
        
        if (this.loopDepth === 0) {
            throw new SyntaxError(`Break statement outside loop at line ${token.line}`);
        }
        
        this.consume('SEMICOLON', "Expected ';' after 'break'");
        
        return new BreakStatementNode(null, {
            line: token.line,
            column: token.column
        });
    }

    parseContinueStatement() {
        const token = this.previous();
        
        if (this.loopDepth === 0) {
            throw new SyntaxError(`Continue statement outside loop at line ${token.line}`);
        }
        
        this.consume('SEMICOLON', "Expected ';' after 'continue'");
        
        return new ContinueStatementNode(null, {
            line: token.line,
            column: token.column
        });
    }

    parseBlockStatement() {
        const token = this.peek();
        this.consume('LEFT_BRACE', "Expected '{'");
        
        const body = [];
        while (!this.check('RIGHT_BRACE') && !this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) body.push(stmt);
        }
        
        this.consume('RIGHT_BRACE', "Expected '}'");
        
        return new BlockStatementNode(body, {
            line: token.line,
            column: token.column
        });
    }

    parseExpressionStatement() {
        const expr = this.parseExpression();
        this.consume('SEMICOLON', "Expected ';' after expression");
        
        return new ExpressionStatementNode(expr, {
            line: expr.line,
            column: expr.column
        });
    }

    parseExpression() {
        return this.parseAssignmentExpression();
    }

    parseAssignmentExpression() {
        const expr = this.parseConditionalExpression();
        
        if (this.match('ASSIGN', 'PLUS_ASSIGN', 'MINUS_ASSIGN', 'MULTIPLY_ASSIGN', 'DIVIDE_ASSIGN')) {
            const operator = this.previous().value;
            const right = this.parseAssignmentExpression();
            
            return new AssignmentExpressionNode(operator, expr, right, {
                line: expr.line,
                column: expr.column
            });
        }
        
        return expr;
    }

    parseConditionalExpression() {
        const expr = this.parseLogicalOrExpression();
        
        if (this.match('QUESTION')) {
            const consequent = this.parseAssignmentExpression();
            this.consume('COLON', "Expected ':' after '?' in conditional expression");
            const alternate = this.parseAssignmentExpression();
            
            return new ConditionalExpressionNode(expr, consequent, alternate, {
                line: expr.line,
                column: expr.column
            });
        }
        
        return expr;
    }

    parseLogicalOrExpression() {
        let expr = this.parseLogicalAndExpression();
        
        while (this.match('LOGICAL_OR')) {
            const operator = this.previous().value;
            const right = this.parseLogicalAndExpression();
            expr = new LogicalExpressionNode(operator, expr, right, {
                line: expr.line,
                column: expr.column
            });
        }
        
        return expr;
    }

    parseLogicalAndExpression() {
        let expr = this.parseEqualityExpression();
        
        while (this.match('LOGICAL_AND')) {
            const operator = this.previous().value;
            const right = this.parseEqualityExpression();
            expr = new LogicalExpressionNode(operator, expr, right, {
                line: expr.line,
                column: expr.column
            });
        }
        
        return expr;
    }

    parseEqualityExpression() {
        let expr = this.parseRelationalExpression();
        
        while (this.match('EQUAL', 'NOT_EQUAL', 'STRICT_EQUAL', 'STRICT_NOT_EQUAL')) {
            const operator = this.previous().value;
            const right = this.parseRelationalExpression();
            expr = new BinaryExpressionNode(operator, expr, right, {
                line: expr.line,
                column: expr.column
            });
        }
        
        return expr;
    }

    parseRelationalExpression() {
        let expr = this.parseAdditiveExpression();
        
        while (this.match('LESS_THAN', 'GREATER_THAN', 'LESS_EQUAL', 'GREATER_EQUAL')) {
            const operator = this.previous().value;
            const right = this.parseAdditiveExpression();
            expr = new BinaryExpressionNode(operator, expr, right, {
                line: expr.line,
                column: expr.column
            });
        }
        
        return expr;
    }

    parseAdditiveExpression() {
        let expr = this.parseMultiplicativeExpression();
        
        while (this.match('PLUS', 'MINUS')) {
            const operator = this.previous().value;
            const right = this.parseMultiplicativeExpression();
            expr = new BinaryExpressionNode(operator, expr, right, {
                line: expr.line,
                column: expr.column
            });
        }
        
        return expr;
    }

    parseMultiplicativeExpression() {
        let expr = this.parseUnaryExpression();
        
        while (this.match('MULTIPLY', 'DIVIDE', 'MODULO')) {
            const operator = this.previous().value;
            const right = this.parseUnaryExpression();
            expr = new BinaryExpressionNode(operator, expr, right, {
                line: expr.line,
                column: expr.column
            });
        }
        
        return expr;
    }

    parseUnaryExpression() {
        if (this.match('LOGICAL_NOT', 'MINUS', 'PLUS', 'BITWISE_NOT')) {
            const operator = this.previous().value;
            const argument = this.parseUnaryExpression();
            return new UnaryExpressionNode(operator, argument, true, {
                line: this.previous().line,
                column: this.previous().column
            });
        }
        
        return this.parseUpdateExpression();
    }

    parseUpdateExpression() {
        // Prefix increment/decrement
        if (this.match('INCREMENT', 'DECREMENT')) {
            const operator = this.previous().value;
            const argument = this.parsePostfixExpression();
            return new UpdateExpressionNode(operator, argument, true, {
                line: this.previous().line,
                column: this.previous().column
            });
        }
        
        const expr = this.parsePostfixExpression();
        
        // Postfix increment/decrement
        if (this.match('INCREMENT', 'DECREMENT')) {
            const operator = this.previous().value;
            return new UpdateExpressionNode(operator, expr, false, {
                line: expr.line,
                column: expr.column
            });
        }
        
        return expr;
    }

    parsePostfixExpression() {
        let expr = this.parsePrimaryExpression();
        
        while (true) {
            if (this.match('LEFT_PAREN')) {
                // Function call
                const args = this.parseArgumentList();
                this.consume('RIGHT_PAREN', "Expected ')' after arguments");
                expr = new CallExpressionNode(expr, args, {
                    line: expr.line,
                    column: expr.column
                });
            } else if (this.match('LEFT_BRACKET')) {
                // Member access (computed)
                const property = this.parseExpression();
                this.consume('RIGHT_BRACKET', "Expected ']' after computed member expression");
                expr = new MemberExpressionNode(expr, property, true, {
                    line: expr.line,
                    column: expr.column
                });
            } else if (this.match('DOT')) {
                // Member access (non-computed)
                const property = this.parseIdentifier();
                expr = new MemberExpressionNode(expr, property, false, {
                    line: expr.line,
                    column: expr.column
                });
            } else {
                break;
            }
        }
        
        return expr;
    }

    parsePrimaryExpression() {
        if (this.match('KEYWORD')) {
            const keyword = this.previous().value;
            switch (keyword) {
                case 'true':
                    return new LiteralNode(true, 'true', {
                        line: this.previous().line,
                        column: this.previous().column
                    });
                case 'false':
                    return new LiteralNode(false, 'false', {
                        line: this.previous().line,
                        column: this.previous().column
                    });
                case 'null':
                    return new LiteralNode(null, 'null', {
                        line: this.previous().line,
                        column: this.previous().column
                    });
                case 'undefined':
                    return new LiteralNode(undefined, 'undefined', {
                        line: this.previous().line,
                        column: this.previous().column
                    });
                case 'this':
                    return new ThisExpressionNode({
                        line: this.previous().line,
                        column: this.previous().column
                    });
                case 'function':
                    return this.parseFunctionExpression();
                default:
                    throw new SyntaxError(`Unexpected keyword '${keyword}' at line ${this.previous().line}`);
            }
        }
        
        if (this.match('NUMBER')) {
            const token = this.previous();
            return new LiteralNode(token.value, token.value.toString(), {
                line: token.line,
                column: token.column
            });
        }
        
        if (this.match('STRING')) {
            const token = this.previous();
            return new LiteralNode(token.value, `"${token.value}"`, {
                line: token.line,
                column: token.column
            });
        }
        
        if (this.match('IDENTIFIER')) {
            const token = this.previous();
            
            // Check for arrow function
            if (this.check('ARROW')) {
                this.current--; // Backtrack
                return this.parseArrowFunction();
            }
            
            return new IdentifierNode(token.value, {
                line: token.line,
                column: token.column
            });
        }
        
        if (this.match('LEFT_PAREN')) {
            // Could be grouped expression or arrow function parameters
            const checkpoint = this.current;
            
            try {
                // Try to parse as arrow function parameters
                this.current--; // Backtrack to '('
                return this.parseArrowFunction();
            } catch (error) {
                // If that fails, parse as grouped expression
                this.current = checkpoint;
                const expr = this.parseExpression();
                this.consume('RIGHT_PAREN', "Expected ')' after expression");
                return expr;
            }
        }
        
        if (this.match('LEFT_BRACKET')) {
            return this.parseArrayExpression();
        }
        
        if (this.match('LEFT_BRACE')) {
            return this.parseObjectExpression();
        }
        
        throw new SyntaxError(`Unexpected token '${this.peek().value}' at line ${this.peek().line}`);
    }

    parseArrowFunction() {
        const startToken = this.peek();
        let params = [];
        
        if (this.match('IDENTIFIER')) {
            // Single parameter without parentheses
            const param = this.previous();
            params = [new IdentifierNode(param.value, {
                line: param.line,
                column: param.column
            })];
        } else if (this.match('LEFT_PAREN')) {
            // Parameters in parentheses
            if (!this.check('RIGHT_PAREN')) {
                params = this.parseParameterList();
            }
            this.consume('RIGHT_PAREN', "Expected ')' after arrow function parameters");
        } else {
            throw new SyntaxError(`Expected arrow function parameters at line ${this.peek().line}`);
        }
        
        this.consume('ARROW', "Expected '=>' in arrow function");
        
        let body;
        let expression = false;
        
        if (this.check('LEFT_BRACE')) {
            // Block body
            body = this.parseBlockStatement();
            expression = false;
        } else {
            // Expression body
            body = this.parseAssignmentExpression();
            expression = true;
        }
        
        return new ArrowFunctionExpressionNode(params, body, {
            line: startToken.line,
            column: startToken.column,
            expression
        });
    }

    parseFunctionExpression() {
        let id = null;
        if (this.check('IDENTIFIER')) {
            id = this.parseIdentifier();
        }
        
        this.consume('LEFT_PAREN', "Expected '(' after 'function'");
        const params = this.parseParameterList();
        this.consume('RIGHT_PAREN', "Expected ')' after parameters");
        
        const body = this.parseBlockStatement();
        
        return new FunctionExpressionNode(id, params, body, {
            line: this.previous().line,
            column: this.previous().column
        });
    }

    parseArrayExpression() {
        const elements = [];
        
        if (!this.check('RIGHT_BRACKET')) {
            do {
                if (this.check('COMMA')) {
                    // Sparse array element
                    elements.push(null);
                } else {
                    elements.push(this.parseAssignmentExpression());
                }
            } while (this.match('COMMA'));
        }
        
        this.consume('RIGHT_BRACKET', "Expected ']' after array elements");
        
        return new ArrayExpressionNode(elements, {
            line: this.previous().line,
            column: this.previous().column
        });
    }

    parseObjectExpression() {
        const properties = [];
        
        if (!this.check('RIGHT_BRACE')) {
            do {
                const property = this.parseProperty();
                properties.push(property);
            } while (this.match('COMMA') && !this.check('RIGHT_BRACE'));
        }
        
        this.consume('RIGHT_BRACE', "Expected '}' after object properties");
        
        return new ObjectExpressionNode(properties, {
            line: this.previous().line,
            column: this.previous().column
        });
    }

    parseProperty() {
        let key;
        let computed = false;
        
        if (this.match('LEFT_BRACKET')) {
            // Computed property name
            key = this.parseExpression();
            this.consume('RIGHT_BRACKET', "Expected ']' after computed property name");
            computed = true;
        } else if (this.match('STRING', 'NUMBER')) {
            // String or number literal key
            const token = this.previous();
            key = new LiteralNode(token.value, token.value.toString(), {
                line: token.line,
                column: token.column
            });
        } else {
            // Identifier key
            key = this.parseIdentifier();
        }
        
        this.consume('COLON', "Expected ':' after property key");
        const value = this.parseAssignmentExpression();
        
        return new PropertyNode(key, value, 'init', {
            line: key.line,
            column: key.column,
            computed
        });
    }

    parseParameterList() {
        const params = [];
        
        if (!this.check('RIGHT_PAREN')) {
            do {
                params.push(this.parseIdentifier());
            } while (this.match('COMMA'));
        }
        
        return params;
    }

    parseArgumentList() {
        const args = [];
        
        if (!this.check('RIGHT_PAREN')) {
            do {
                args.push(this.parseAssignmentExpression());
            } while (this.match('COMMA'));
        }
        
        return args;
    }

    parseIdentifier() {
        if (this.match('IDENTIFIER')) {
            const token = this.previous();
            return new IdentifierNode(token.value, {
                line: token.line,
                column: token.column
            });
        }
        
        throw new SyntaxError(`Expected identifier at line ${this.peek().line}`);
    }

    // Utility methods
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
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    isAtEnd() {
        return this.current >= this.tokens.length || this.peek().type === 'EOF';
    }

    peek() {
        if (this.current >= this.tokens.length) {
            return { type: 'EOF', value: null, line: 0, column: 0 };
        }
        return this.tokens[this.current];
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    consume(type, message) {
        if (this.check(type)) return this.advance();
        
        const token = this.peek();
        throw new SyntaxError(`${message} at line ${token.line}, column ${token.column}. Got '${token.value}'`);
    }

    synchronize() {
        this.advance();
        
        while (!this.isAtEnd()) {
            if (this.previous().type === 'SEMICOLON') return;
            
            if (this.peek().type === 'KEYWORD') {
                const keyword = this.peek().value;
                if (['class', 'function', 'var', 'for', 'if', 'while', 'return'].includes(keyword)) {
                    return;
                }
            }
            
            this.advance();
        }
    }

    addError(message) {
        const token = this.peek();
        this.errors.push({
            type: 'SyntaxError',
            message,
            line: token.line,
            column: token.column,
            token: token.value
        });
    }

    hasErrors() {
        return this.errors.length > 0;
    }

    getErrors() {
        return this.errors;
    }
}

module.exports = { LuaScriptParser };

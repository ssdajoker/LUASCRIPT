#!/usr/bin/env node

/**
 * RAPID MULTILANG GENERATION TOOL
 * Intelligently generates parsers and emitters for 12 new languages
 * Uses Clarity Super-Canon for quality coordination
 * 
 * Usage: node .aitk/generate_languages.js [language-list]
 */

const fs = require('fs');
const path = require('path');

// Language Family Definitions
const LANGUAGE_FAMILIES = {
    'C-Family': {
        languages: ['groovy', 'v'],  // PHP, TS, Dart already done
        commonKeywords: ['function', 'class', 'if', 'while', 'for', 'switch', 'try', 'catch', 'throw', 'return'],
        indentSize: 4,
        lineEnding: '\n',
        blockStyle: 'brace'
    },
    'Script': {
        languages: ['perl', 'bash'],
        commonKeywords: ['sub', 'my', 'our', 'if', 'while', 'for', 'foreach'],
        indentSize: 4,
        lineEnding: '\n',
        blockStyle: 'special'  // Perl uses 'sub {}', Bash uses 'function() {}'
    },
    'Legacy': {
        languages: ['fortran', 'pascal'],
        commonKeywords: ['PROGRAM', 'SUBROUTINE', 'FUNCTION', 'IF', 'DO', 'END'],
        indentSize: 6,  // FORTRAN column-based
        lineEnding: '\n',
        blockStyle: 'keyword-end'  // END statement
    },
    'Markup': {
        languages: ['html', 'css'],
        commonKeywords: [],
        indentSize: 2,
        lineEnding: '\n',
        blockStyle: 'tag'  // HTML tags, CSS rules
    }
};

class LanguageGenerator {
    constructor() {
        this.srcDir = path.join(__dirname, '..', 'src');
        this.parsersDir = path.join(this.srcDir, 'parsers');
        this.emittersDir = path.join(this.srcDir, 'ir');
    }

    /**
     * Generate parser for a language
     */
    generateParser(language, family) {
        const config = LANGUAGE_FAMILIES[family];
        const className = this.pascalCase(language) + 'Parser';
        const baseClass = 'BaseParser';

        const keywords = this.getLanguageKeywords(language, config);
        const operators = this.getLanguageOperators(language);

        const template = `/**
 * ${this.pascalCase(language)} Parser - ${family} Language
 * Parses ${language} code to canonical AST for IR pipeline
 */

const { BaseParser } = require('./base_parser');

class ${className} extends BaseParser {
    constructor(source) {
        super(source);
        this.keywords = [
            ${keywords.map(k => `'${k}'`).join(', ')}
        ];
        this.operators = [${operators.map(o => `'${o}'`).join(', ')}];
    }

    tokenize() {
        return this.tokenizeC_Family(this.keywords, this.operators);
    }

    parse() {
        this.tokens = this.tokenize();
        this.tokenPos = 0;
        return this.parseProgram();
    }

    current() {
        return this.tokens[this.tokenPos];
    }

    advance() {
        this.tokenPos++;
    }

    match(type, value = null) {
        const token = this.current();
        if (token && token.type === type && (!value || token.value === value)) {
            this.advance();
            return true;
        }
        return false;
    }

    expect(type, value = null) {
        const token = this.current();
        if (!token || token.type !== type || (value && token.value !== value)) {
            throw new Error(\`Expected \${type}:\${value}\`);
        }
        this.advance();
        return token;
    }

    parseProgram() {
        const body = [];
        while (this.current()) {
            const stmt = this.parseStatement();
            if (stmt) body.push(stmt);
        }
        return this.createNode('Program', { body });
    }

    parseStatement() {
        const token = this.current();
        if (!token) return null;

        if (token.type === 'KEYWORD') {
            switch (token.value) {
                case 'function':
                case 'class':
                    return this.parseDeclaration();
                case 'if':
                    return this.parseIfStatement();
                case 'while':
                case 'for':
                    return this.parseLoopStatement();
                case 'return':
                    return this.parseReturnStatement();
                case 'throw':
                    return this.parseThrowStatement();
            }
        }

        return this.parseExpressionStatement();
    }

    parseDeclaration() {
        const keyword = this.current().value;
        this.advance();
        const name = this.expect('IDENTIFIER').value;
        
        if (keyword === 'function' || keyword === 'sub') {
            this.expect('PUNCT', '(');
            const params = this.parseParameterList();
            this.expect('PUNCT', ')');
            const body = this.parseBlockStatement();
            return this.createFunctionDeclaration(name, params, body.body);
        }
        
        if (keyword === 'class') {
            this.expect('PUNCT', '{');
            const body = [];
            while (!this.match('PUNCT', '}') && this.current()) {
                body.push(this.parseStatement());
            }
            return this.createClassDeclaration(name, null, body);
        }
        
        return null;
    }

    parseIfStatement() {
        this.expect('KEYWORD', 'if');
        this.expect('PUNCT', '(');
        const test = this.parseExpression();
        this.expect('PUNCT', ')');
        const consequent = this.parseStatement();
        let alternate = null;
        if (this.match('KEYWORD', 'else')) {
            alternate = this.parseStatement();
        }
        return this.createIfStatement(test, consequent, alternate);
    }

    parseLoopStatement() {
        const keyword = this.current().value;
        this.advance();
        
        if (keyword === 'while') {
            this.expect('PUNCT', '(');
            const test = this.parseExpression();
            this.expect('PUNCT', ')');
            const body = this.parseStatement();
            return this.createWhileStatement(test, body);
        }
        
        if (keyword === 'for') {
            this.expect('PUNCT', '(');
            const init = this.parseExpression();
            this.expect('PUNCT', ';');
            const test = this.parseExpression();
            this.expect('PUNCT', ';');
            const update = this.parseExpression();
            this.expect('PUNCT', ')');
            const body = this.parseStatement();
            return this.createForStatement(init, test, update, body);
        }
        
        return null;
    }

    parseReturnStatement() {
        this.expect('KEYWORD', 'return');
        let argument = null;
        if (!this.match('PUNCT', ';')) {
            argument = this.parseExpression();
            this.match('PUNCT', ';');
        }
        return this.createReturnStatement(argument);
    }

    parseThrowStatement() {
        this.expect('KEYWORD', 'throw');
        const argument = this.parseExpression();
        return this.createThrowStatement(argument);
    }

    parseExpressionStatement() {
        const expr = this.parseExpression();
        this.match('PUNCT', ';');
        return this.createExpressionStatement(expr);
    }

    parseParameterList() {
        const params = [];
        while (!this.match('PUNCT', ')') && this.current()) {
            params.push(this.expect('IDENTIFIER').value);
            this.match('PUNCT', ',');
        }
        return params;
    }

    parseBlockStatement() {
        if (this.match('PUNCT', '{')) {
            const body = [];
            while (!this.match('PUNCT', '}') && this.current()) {
                const stmt = this.parseStatement();
                if (stmt) body.push(stmt);
            }
            return this.createBlockStatement(body);
        }
        return this.createBlockStatement([this.parseStatement()]);
    }

    parseExpression() {
        return this.parseAssignment();
    }

    parseAssignment() {
        let expr = this.parseLogical();
        if (this.current() && this.current().value === '=') {
            this.advance();
            const right = this.parseAssignment();
            expr = this.createNode('AssignmentExpression', { left: expr, operator: '=', right });
        }
        return expr;
    }

    parseLogical() {
        let expr = this.parseEquality();
        while (this.current() && ['&&', '||'].includes(this.current().value)) {
            const op = this.current().value;
            this.advance();
            const right = this.parseEquality();
            expr = this.createNode('LogicalExpression', { left: expr, operator: op, right });
        }
        return expr;
    }

    parseEquality() {
        let expr = this.parseComparison();
        while (this.current() && ['==', '!=', '===', '!=='].includes(this.current().value)) {
            const op = this.current().value;
            this.advance();
            const right = this.parseComparison();
            expr = this.createNode('BinaryExpression', { left: expr, operator: op, right });
        }
        return expr;
    }

    parseComparison() {
        let expr = this.parseAdditive();
        while (this.current() && ['<', '>', '<=', '>='].includes(this.current().value)) {
            const op = this.current().value;
            this.advance();
            const right = this.parseAdditive();
            expr = this.createNode('BinaryExpression', { left: expr, operator: op, right });
        }
        return expr;
    }

    parseAdditive() {
        let expr = this.parseMultiplicative();
        while (this.current() && ['+', '-'].includes(this.current().value)) {
            const op = this.current().value;
            this.advance();
            const right = this.parseMultiplicative();
            expr = this.createNode('BinaryExpression', { left: expr, operator: op, right });
        }
        return expr;
    }

    parseMultiplicative() {
        let expr = this.parseUnary();
        while (this.current() && ['*', '/', '%'].includes(this.current().value)) {
            const op = this.current().value;
            this.advance();
            const right = this.parseUnary();
            expr = this.createNode('BinaryExpression', { left: expr, operator: op, right });
        }
        return expr;
    }

    parseUnary() {
        if (this.current() && ['!', '-', '+'].includes(this.current().value)) {
            const op = this.current().value;
            this.advance();
            const arg = this.parseUnary();
            return this.createNode('UnaryExpression', { operator: op, argument: arg, prefix: true });
        }
        return this.parsePostfix();
    }

    parsePostfix() {
        let expr = this.parsePrimary();
        while (this.current()) {
            if (this.match('PUNCT', '(')) {
                const args = [];
                while (!this.match('PUNCT', ')') && this.current()) {
                    args.push(this.parseExpression());
                    this.match('PUNCT', ',');
                }
                expr = this.createNode('CallExpression', { callee: expr, arguments: args });
            } else if (this.match('PUNCT', '[')) {
                const index = this.parseExpression();
                this.expect('PUNCT', ']');
                expr = this.createNode('MemberExpression', { object: expr, property: index, computed: true });
            } else if (this.match('PUNCT', '.')) {
                const prop = this.expect('IDENTIFIER').value;
                expr = this.createNode('MemberExpression', { object: expr, property: this.createIdentifier(prop) });
            } else {
                break;
            }
        }
        return expr;
    }

    parsePrimary() {
        const token = this.current();
        if (!token) return this.createIdentifier('null');

        if (token.type === 'STRING') {
            this.advance();
            return this.createLiteral(token.value, token.value);
        }

        if (token.type === 'NUMBER') {
            this.advance();
            return this.createLiteral(Number(token.value), token.value);
        }

        if (token.type === 'IDENTIFIER') {
            const name = token.value;
            this.advance();
            return this.createIdentifier(name);
        }

        if (token.type === 'KEYWORD') {
            if (['true', 'false'].includes(token.value)) {
                this.advance();
                return this.createLiteral(token.value === 'true', token.value);
            }
            if (token.value === 'null') {
                this.advance();
                return this.createLiteral(null, 'null');
            }
        }

        if (this.match('PUNCT', '(')) {
            const expr = this.parseExpression();
            this.expect('PUNCT', ')');
            return expr;
        }

        if (this.match('PUNCT', '[')) {
            const elements = [];
            while (!this.match('PUNCT', ']') && this.current()) {
                elements.push(this.parseExpression());
                this.match('PUNCT', ',');
            }
            return this.createNode('ArrayExpression', { elements });
        }

        this.advance();
        return this.createIdentifier('undefined');
    }
}

module.exports = { ${className} };
`;

        return template;
    }

    /**
     * Generate emitter for a language
     */
    generateEmitter(language, family) {
        const config = LANGUAGE_FAMILIES[family];
        const className = this.pascalCase(language) + 'Emitter';

        const template = `/**
 * ${this.pascalCase(language)} Emitter - ${family} Language
 * Converts canonical IR to ${language} code
 */

const { BaseEmitter } = require('./base_emitter');

class ${className} extends BaseEmitter {
    constructor() {
        super();
        this.setIndentSize(${config.indentSize});
        this.lineEnding = '${config.lineEnding}';
    }

    emitProgram(node) {
        if (!node.body) return '';
        return node.body.map(stmt => this.emitStatement(stmt)).join(this.lineEnding);
    }

    emitVariableDeclaration(node) {
        const declarations = node.declarations.map(decl => {
            const id = decl.id.name;
            const init = decl.init ? ' = ' + this.emitExpression(decl.init) : '';
            return id + init;
        }).join(', ');
        return this.emitLine(\`var \${declarations};\`);
    }

    emitFunctionDeclaration(node) {
        const name = node.id.name;
        const params = node.params.map(p => p.name).join(', ');
        const body = this.emitBlockStatement(node.body);
        return this.emitLine(\`function \${name}(\${params}) \${body}\`);
    }

    emitClassDeclaration(node) {
        const name = node.id.name;
        const superClass = node.superClass ? \` extends \${node.superClass.name}\` : '';
        const body = this.emitBlockStatement(node.body);
        return this.emitLine(\`class \${name}\${superClass} \${body}\`);
    }

    emitIfStatement(node) {
        const test = this.emitExpression(node.test);
        const consequent = this.emitStatement(node.consequent);
        let result = this.emitLine(\`if (\${test}) \${consequent}\`);
        if (node.alternate) {
            const alternate = this.emitStatement(node.alternate);
            result += this.emitLine(\`else \${alternate}\`);
        }
        return result;
    }

    emitWhileStatement(node) {
        const test = this.emitExpression(node.test);
        const body = this.emitStatement(node.body);
        return this.emitLine(\`while (\${test}) \${body}\`);
    }

    emitForStatement(node) {
        const init = this.emitExpression(node.init);
        const test = this.emitExpression(node.test);
        const update = this.emitExpression(node.update);
        const body = this.emitStatement(node.body);
        return this.emitLine(\`for (\${init}; \${test}; \${update}) \${body}\`);
    }

    emitForOfStatement(node) {
        const left = this.emitExpression(node.left);
        const right = this.emitExpression(node.right);
        const body = this.emitStatement(node.body);
        return this.emitLine(\`for (\${left} of \${right}) \${body}\`);
    }

    emitBlockStatement(node) {
        let result = '{\\n';
        this.increaseIndent();
        for (const stmt of node.body) {
            result += this.emitStatement(stmt) + '\\n';
        }
        this.decreaseIndent();
        result += this.getIndent() + '}';
        return result;
    }

    emitReturnStatement(node) {
        const arg = node.argument ? ' ' + this.emitExpression(node.argument) : '';
        return this.emitLine(\`return\${arg};\`);
    }

    emitExpressionStatement(node) {
        return this.emitLine(this.emitExpression(node.expression) + ';');
    }

    emitThrowStatement(node) {
        const arg = this.emitExpression(node.argument);
        return this.emitLine(\`throw \${arg};\`);
    }

    emitTryStatement(node) {
        let result = this.emitLine(\`try \${this.emitBlockStatement(node.block)}\`);
        if (node.handler) {
            const param = node.handler.param ? node.handler.param.name : 'e';
            result += this.emitLine(\`catch (\${param}) \${this.emitBlockStatement(node.handler.body)}\`);
        }
        if (node.finalizer) {
            result += this.emitLine(\`finally \${this.emitBlockStatement(node.finalizer)}\`);
        }
        return result;
    }

    emitBreakStatement() {
        return this.emitLine('break;');
    }

    emitContinueStatement() {
        return this.emitLine('continue;');
    }
}

module.exports = { ${className} };
`;

        return template;
    }

    /**
     * Get keywords for a specific language
     */
    getLanguageKeywords(language, config) {
        const languageKeywords = {
            'groovy': [...config.commonKeywords, 'def', 'static', 'import', 'package', 'assert', 'as'],
            'v': [...config.commonKeywords, 'mut', 'pub', 'const', 'struct', 'enum', 'match'],
            'perl': ['sub', 'my', 'our', 'use', 'require', 'package', 'if', 'unless', 'while', 'until', 'for', 'foreach', 'last', 'next', 'return', 'die', 'warn'],
            'bash': ['function', 'if', 'then', 'else', 'elif', 'fi', 'case', 'in', 'esac', 'for', 'while', 'do', 'done', 'return', 'exit', 'local'],
            'fortran': ['PROGRAM', 'SUBROUTINE', 'FUNCTION', 'IF', 'THEN', 'ELSE', 'ELSEIF', 'ENDIF', 'DO', 'ENDDO', 'END', 'CALL', 'RETURN', 'IMPLICIT', 'INTEGER', 'REAL', 'LOGICAL', 'CHARACTER'],
            'pascal': ['program', 'procedure', 'function', 'begin', 'end', 'if', 'then', 'else', 'while', 'do', 'for', 'to', 'downto', 'repeat', 'until', 'case', 'of', 'var', 'const'],
            'html': ['html', 'head', 'body', 'title', 'meta', 'link', 'script', 'style', 'div', 'span', 'p', 'h1', 'h2', 'h3', 'a', 'img', 'form', 'input'],
            'css': ['@media', '@keyframes', '@import', '@font-face']
        };
        return languageKeywords[language] || config.commonKeywords;
    }

    /**
     * Get operators for a specific language
     */
    getLanguageOperators(language) {
        const languageOperators = {
            'groovy': ['===', '!==', '==', '!=', '<=', '>=', '&&', '||', '?.', '*.', '.&'],
            'v': ['===', '!==', '==', '!=', '<=', '>=', '&&', '||', '..', '...'],
            'perl': ['=>', '..', '...', '&&', '||', 'and', 'or', 'xor', '=~', '!~'],
            'bash': ['==', '!=', '-eq', '-ne', '-lt', '-le', '-gt', '-ge', '-a', '-o'],
            'fortran': ['.EQ.', '.NE.', '.LT.', '.LE.', '.GT.', '.GE.', '.AND.', '.OR.', '.NOT.'],
            'pascal': ['=', '<>', '<', '<=', '>', '>=', 'AND', 'OR', 'NOT', 'DIV', 'MOD'],
            'html': [],
            'css': [':', ';', '{', '}', ',', '>', '+', '~', '[', ']']
        };
        return languageOperators[language] || [];
    }

    /**
     * Helper: Convert to PascalCase
     */
    pascalCase(str) {
        return str.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join('');
    }

    /**
     * Write file to disk
     */
    writeFile(filepath, content) {
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filepath, content);
        console.log(`✓ Created: ${filepath}`);
    }

    /**
     * Generate all remaining languages
     */
    async generateAll() {
        console.log('🚀 RAPID LANGUAGE GENERATION ENGINE');
        console.log('=====================================\n');

        const generated = { parsers: 0, emitters: 0, lines: 0 };

        for (const [family, config] of Object.entries(LANGUAGE_FAMILIES)) {
            console.log(`\n📦 Generating ${family} Languages...`);
            
            for (const language of config.languages) {
                // Generate parser
                const parserCode = this.generateParser(language, family);
                const parserPath = path.join(this.parsersDir, `${language}_parser.js`);
                this.writeFile(parserPath, parserCode);
                generated.parsers++;
                generated.lines += parserCode.split('\n').length;

                // Generate emitter
                const emitterCode = this.generateEmitter(language, family);
                const emitterPath = path.join(this.emittersDir, `emitter_${language}.js`);
                this.writeFile(emitterPath, emitterCode);
                generated.emitters++;
                generated.lines += emitterCode.split('\n').length;
            }
        }

        console.log('\n✅ GENERATION COMPLETE');
        console.log('=======================');
        console.log(`Parsers created: ${generated.parsers}`);
        console.log(`Emitters created: ${generated.emitters}`);
        console.log(`Lines of code: ${generated.lines}`);
        console.log(`Total new components: ${generated.parsers + generated.emitters}`);

        return generated;
    }
}

// Run if executed directly
if (require.main === module) {
    const generator = new LanguageGenerator();
    generator.generateAll().catch(console.error);
}

module.exports = { LanguageGenerator };

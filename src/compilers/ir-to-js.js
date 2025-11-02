
/**
 * IR to JavaScript Generator
 * 
 * Converts LUASCRIPT IR to JavaScript code.
 */

const { NodeCategory } = require('../ir/nodes');

class IRToJSGenerator {
    constructor(options = {}) {
        this.options = {
            indent: options.indent || '  ',
            semicolons: options.semicolons !== false,
            ...options
        };
        this.indentLevel = 0;
    }

    /**
     * Generate JavaScript code from IR
     */
    generate(node) {
        return this.visit(node);
    }

    /**
     * Visit a node and generate code
     */
    visit(node) {
        if (!node || !node.kind) {
            return '';
        }

        const methodName = `visit${node.kind}`;
        if (typeof this[methodName] === 'function') {
            return this[methodName](node);
        }

        throw new Error(`Unsupported IR node kind: ${node.kind}`);
    }

    // ========== PROGRAM & DECLARATIONS ==========

    visitProgram(node) {
        return node.body.map(stmt => this.visit(stmt)).join('\n');
    }

    visitFunctionDecl(node) {
        const name = node.name || '';
        const params = node.parameters.map(p => this.visitParameter(p)).join(', ');
        const body = this.visit(node.body);
        
        if (node.name) {
            return `function ${name}(${params}) ${body}`;
        } else {
            // Anonymous function (expression)
            return `function(${params}) ${body}`;
        }
    }

    visitVarDecl(node) {
        const kind = node.varKind || 'let';
        const init = node.init ? ` = ${this.visit(node.init)}` : '';
        const semi = this.options.semicolons ? ';' : '';
        
        return `${this.indent()}${kind} ${node.name}${init}${semi}`;
    }

    visitParameter(node) {
        if (node.defaultValue) {
            return `${node.name} = ${this.visit(node.defaultValue)}`;
        }
        return node.name;
    }

    // ========== STATEMENTS ==========

    visitBlock(node) {
        this.indentLevel++;
        const statements = node.statements.map(stmt => this.visit(stmt)).join('\n');
        this.indentLevel--;
        
        return `{\n${statements}\n${this.indent()}}`;
    }

    visitReturn(node) {
        const semi = this.options.semicolons ? ';' : '';
        
        if (node.value) {
            return `${this.indent()}return ${this.visit(node.value)}${semi}`;
        }
        return `${this.indent()}return${semi}`;
    }

    visitIf(node) {
        const condition = this.visit(node.condition);
        const consequent = this.visit(node.consequent);
        
        let result = `${this.indent()}if (${condition}) ${consequent}`;
        
        if (node.alternate) {
            const alternate = this.visit(node.alternate);
            
            // Check if alternate is another If node (else if)
            if (node.alternate.kind === NodeCategory.IF) {
                result += ` else ${alternate.trim()}`;
            } else {
                result += ` else ${alternate}`;
            }
        }
        
        return result;
    }

    visitWhile(node) {
        const condition = this.visit(node.condition);
        const body = this.visit(node.body);
        
        return `${this.indent()}while (${condition}) ${body}`;
    }

    visitDoWhile(node) {
        const body = this.visit(node.body);
        const condition = this.visit(node.condition);
        const semi = this.options.semicolons ? ';' : '';
        
        return `${this.indent()}do ${body} while (${condition})${semi}`;
    }

    visitFor(node) {
        const init = node.init ? this.visit(node.init).trim().replace(/^(let|const|var)\s+/, '$1 ').replace(/;$/, '') : '';
        const condition = node.condition ? this.visit(node.condition) : '';
        const update = node.update ? this.visit(node.update) : '';
        const body = this.visit(node.body);
        
        return `${this.indent()}for (${init}; ${condition}; ${update}) ${body}`;
    }

    visitSwitch(node) {
        const discriminant = this.visit(node.discriminant);
        
        this.indentLevel++;
        const cases = node.cases.map(c => this.visitCase(c)).join('\n');
        this.indentLevel--;
        
        return `${this.indent()}switch (${discriminant}) {\n${cases}\n${this.indent()}}`;
    }

    visitCase(node) {
        
        
        if (node.test) {
            const test = this.visit(node.test);
            this.indentLevel++;
            const consequent = node.consequent.map(stmt => this.visit(stmt)).join('\n');
            this.indentLevel--;
            
            return `${this.indent()}case ${test}:\n${consequent}`;
        } else {
            // Default case
            this.indentLevel++;
            const consequent = node.consequent.map(stmt => this.visit(stmt)).join('\n');
            this.indentLevel--;
            
            return `${this.indent()}default:\n${consequent}`;
        }
    }

    visitBreak(node) {
        const semi = this.options.semicolons ? ';' : '';
        return `${this.indent()}break${semi}`;
    }

    visitContinue(node) {
        const semi = this.options.semicolons ? ';' : '';
        return `${this.indent()}continue${semi}`;
    }

    visitExpressionStmt(node) {
        const semi = this.options.semicolons ? ';' : '';
        return `${this.indent()}${this.visit(node.expression)}${semi}`;
    }

    // ========== EXPRESSIONS ==========

    visitBinaryOp(node) {
        const left = this.visit(node.left);
        const right = this.visit(node.right);
        
        return `(${left} ${node.operator} ${right})`;
    }

    visitUnaryOp(node) {
        const operand = this.visit(node.operand);
        
        if (node.prefix) {
            return `${node.operator}${operand}`;
        } else {
            return `${operand}${node.operator}`;
        }
    }

    visitCall(node) {
        const callee = this.visit(node.callee);
        const args = node.args.map(arg => this.visit(arg)).join(', ');
        
        // Check if this is a 'new' expression
        if (node.metadata && node.metadata.isNew) {
            return `new ${callee}(${args})`;
        }
        
        return `${callee}(${args})`;
    }

    visitMember(node) {
        const object = this.visit(node.object);
        const property = this.visit(node.property);
        
        if (node.computed) {
            return `${object}[${property}]`;
        } else {
            return `${object}.${property}`;
        }
    }

    visitArrayLiteral(node) {
        const elements = node.elements.map(el => el ? this.visit(el) : '').join(', ');
        return `[${elements}]`;
    }

    visitObjectLiteral(node) {
        if (node.properties.length === 0) {
            return '{}';
        }
        
        this.indentLevel++;
        const properties = node.properties.map(prop => {
            const key = this.visit(prop.key);
            const value = this.visit(prop.value);
            return `${this.indent()}${key}: ${value}`;
        }).join(',\n');
        this.indentLevel--;
        
        return `{\n${properties}\n${this.indent()}}`;
    }

    visitProperty(node) {
        const key = this.visit(node.key);
        const value = this.visit(node.value);
        
        return `${key}: ${value}`;
    }

    visitIdentifier(node) {
        return node.name;
    }

    visitLiteral(node) {
        if (typeof node.value === 'string') {
            return `"${node.value.replace(/"/g, '\\"')}"`;
        } else if (node.value === null) {
            return 'null';
        } else if (node.value === undefined) {
            return 'undefined';
        }
        return String(node.value);
    }

    visitAssignment(node) {
        const left = this.visit(node.left);
        const right = this.visit(node.right);
        
        return `${left} ${node.operator} ${right}`;
    }

    visitConditional(node) {
        const condition = this.visit(node.condition);
        const consequent = this.visit(node.consequent);
        const alternate = this.visit(node.alternate);
        
        return `(${condition} ? ${consequent} : ${alternate})`;
    }

    // ========== HELPERS ==========

    indent() {
        return this.options.indent.repeat(this.indentLevel);
    }
}

module.exports = {
    IRToJSGenerator
};

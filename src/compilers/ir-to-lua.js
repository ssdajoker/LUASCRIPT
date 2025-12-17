
/**
 * IR to Lua Generator
 * 
 * Converts LUASCRIPT IR to Lua code.
 */

const { NodeCategory } = require('../ir/nodes');
const { TypeCategory, PrimitiveType } = require('../ir/types');

class IRToLuaGenerator {
    constructor(options = {}) {
        this.options = {
            indent: options.indent || '  ',
            ...options
        };
        this.indentLevel = 0;
        this.tempVarCounter = 0;
    }

    /**
     * Generate Lua code from IR
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
        
        this.indentLevel++;
        const bodyStatements = node.body.statements.map(stmt => this.visit(stmt)).join('\n');
        this.indentLevel--;
        
        if (node.name) {
            return `${this.indent()}local function ${name}(${params})\n${bodyStatements}\n${this.indent()}end`;
        } else {
            // Anonymous function
            return `function(${params})\n${bodyStatements}\n${this.indent()}end`;
        }
    }

    visitVarDecl(node) {
        const init = node.init ? ` = ${this.visit(node.init)}` : '';
        return `${this.indent()}local ${node.name}${init}`;
    }

    visitParameter(node) {
        // Lua doesn't support default parameters in the same way
        // We'll just use the parameter name
        return node.name;
    }

    // ========== STATEMENTS ==========

    visitBlock(node) {
        // Lua doesn't have explicit block syntax like {}
        // We'll just generate the statements with proper indentation
        this.indentLevel++;
        const statements = node.statements.map(stmt => this.visit(stmt)).join('\n');
        this.indentLevel--;
        
        return statements;
    }

    visitReturn(node) {
        if (node.value) {
            return `${this.indent()}return ${this.visit(node.value)}`;
        }
        return `${this.indent()}return`;
    }

    visitIf(node) {
        const condition = this.visit(node.condition);
        
        this.indentLevel++;
        const consequent = node.consequent.kind === NodeCategory.BLOCK
            ? node.consequent.statements.map(stmt => this.visit(stmt)).join('\n')
            : this.visit(node.consequent);
        this.indentLevel--;
        
        let result = `${this.indent()}if ${condition} then\n${consequent}`;
        
        if (node.alternate) {
            // Check if alternate is another If node (elseif)
            if (node.alternate.kind === NodeCategory.IF) {
                const altCondition = this.visit(node.alternate.condition);
                
                this.indentLevel++;
                const altConsequent = node.alternate.consequent.kind === NodeCategory.BLOCK
                    ? node.alternate.consequent.statements.map(stmt => this.visit(stmt)).join('\n')
                    : this.visit(node.alternate.consequent);
                this.indentLevel--;
                
                result += `\n${this.indent()}elseif ${altCondition} then\n${altConsequent}`;
                
                // Check for further else/elseif
                if (node.alternate.alternate) {
                    const furtherAlt = this.generateElse(node.alternate.alternate);
                    result += furtherAlt;
                }
            } else {
                this.indentLevel++;
                const alternate = node.alternate.kind === NodeCategory.BLOCK
                    ? node.alternate.statements.map(stmt => this.visit(stmt)).join('\n')
                    : this.visit(node.alternate);
                this.indentLevel--;
                
                result += `\n${this.indent()}else\n${alternate}`;
            }
        }
        
        result += `\n${this.indent()}end`;
        return result;
    }

    generateElse(node) {
        if (node.kind === NodeCategory.IF) {
            const condition = this.visit(node.condition);
            
            this.indentLevel++;
            const consequent = node.consequent.kind === NodeCategory.BLOCK
                ? node.consequent.statements.map(stmt => this.visit(stmt)).join('\n')
                : this.visit(node.consequent);
            this.indentLevel--;
            
            let result = `\n${this.indent()}elseif ${condition} then\n${consequent}`;
            
            if (node.alternate) {
                result += this.generateElse(node.alternate);
            }
            
            return result;
        } else {
            this.indentLevel++;
            const alternate = node.kind === NodeCategory.BLOCK
                ? node.statements.map(stmt => this.visit(stmt)).join('\n')
                : this.visit(node);
            this.indentLevel--;
            
            return `\n${this.indent()}else\n${alternate}`;
        }
    }

    visitWhile(node) {
        const condition = this.visit(node.condition);
        
        this.indentLevel++;
        const body = node.body.kind === NodeCategory.BLOCK
            ? node.body.statements.map(stmt => this.visit(stmt)).join('\n')
            : this.visit(node.body);
        this.indentLevel--;
        
        return `${this.indent()}while ${condition} do\n${body}\n${this.indent()}end`;
    }

    visitDoWhile(node) {
        // Lua doesn't have do-while, convert to repeat-until
        const condition = this.visit(node.condition);
        
        this.indentLevel++;
        const body = node.body.kind === NodeCategory.BLOCK
            ? node.body.statements.map(stmt => this.visit(stmt)).join('\n')
            : this.visit(node.body);
        this.indentLevel--;
        
        // Note: repeat-until continues while condition is false (opposite of do-while)
        return `${this.indent()}repeat\n${body}\n${this.indent()}until not (${condition})`;
    }

    visitFor(node) {
        // Convert JavaScript for loop to Lua while loop
        const init = node.init ? this.visit(node.init) : '';
        const condition = node.condition ? this.visit(node.condition) : 'true';
        
        this.indentLevel++;
        const bodyStatements = node.body.kind === NodeCategory.BLOCK
            ? node.body.statements.map(stmt => this.visit(stmt))
            : [this.visit(node.body)];
        
        if (node.update) {
            bodyStatements.push(this.visit(node.update));
        }
        
        const body = bodyStatements.join('\n');
        this.indentLevel--;
        
        let result = '';
        if (init) {
            result += `${init}\n`;
        }
        result += `${this.indent()}while ${condition} do\n${body}\n${this.indent()}end`;
        
        return result;
    }

    visitSwitch(node) {
        // Lua doesn't have switch, convert to if-elseif chain
        const discriminant = this.visit(node.discriminant);
        const switchVar = `__switch_${Math.random().toString(36).substr(2, 9)}`;
        
        let result = `${this.indent()}local ${switchVar} = ${discriminant}\n`;
        
        for (let i = 0; i < node.cases.length; i++) {
            const caseNode = node.cases[i];
            
            if (caseNode.test) {
                const test = this.visit(caseNode.test);
                const comparison = `${switchVar} == ${test}`;
                
                this.indentLevel++;
                const consequent = caseNode.consequent.map(stmt => this.visit(stmt)).join('\n');
                this.indentLevel--;
                
                if (i === 0) {
                    result += `${this.indent()}if ${comparison} then\n${consequent}`;
                } else {
                    result += `\n${this.indent()}elseif ${comparison} then\n${consequent}`;
                }
            } else {
                // Default case
                this.indentLevel++;
                const consequent = caseNode.consequent.map(stmt => this.visit(stmt)).join('\n');
                this.indentLevel--;
                
                result += `\n${this.indent()}else\n${consequent}`;
            }
        }
        
        result += `\n${this.indent()}end`;
        return result;
    }

    visitCase(node) {
        // Cases are handled in visitSwitch
        throw new Error('Case nodes should be handled by visitSwitch');
    }

    visitBreak(node) {
        return `${this.indent()}break`;
    }

    visitContinue(node) {
        // Lua 5.1 doesn't have continue, we'll use a workaround with goto
        // For simplicity, we'll just comment it for now
        return `${this.indent()}-- continue (not directly supported in Lua 5.1)`;
    }

    visitExpressionStmt(node) {
        return `${this.indent()}${this.visit(node.expression)}`;
    }

    // ========== EXPRESSIONS ==========

    visitBinaryOp(node) {
        const left = this.visit(node.left);
        const right = this.visit(node.right);

        // Map JavaScript operators to Lua operators
        let operator = node.operator;
        if (operator === '===') operator = '==';
        if (operator === '!==') operator = '~=';
        if (operator === '!=') operator = '~=';
        if (operator === '&&') operator = 'and';
        if (operator === '||') operator = 'or';
        if (operator === '+') {
            const leftIsString = this.isStringLike(node.left);
            const rightIsString = this.isStringLike(node.right);
            if (leftIsString || rightIsString) {
                operator = '..';
                // Wrap non-string-like operands with tostring()
                const leftOperand = leftIsString ? left : `tostring(${left})`;
                const rightOperand = rightIsString ? right : `tostring(${right})`;
                return `(${leftOperand} ${operator} ${rightOperand})`;
            }
        }

        return `(${left} ${operator} ${right})`;
    }

    visitUnaryOp(node) {
        const operand = this.visit(node.operand);

        // Map JavaScript operators to Lua operators
        let operator = node.operator;
        if (operator === '!') operator = 'not';

        if (operator === '++' || operator === '--') {
            const op = operator === '++' ? '+' : '-';
            if (node.prefix) {
                return `(function() ${operand} = ${operand} ${op} 1; return ${operand}; end)()`;
            } else {
                const tempVar = this.createTempVar();
                return `(function() local ${tempVar} = ${operand}; ${operand} = ${operand} ${op} 1; return ${tempVar}; end)()`;
            }
        }

        if (node.prefix) {
            return `${operator} ${operand}`;
        } else {
            return `${operand} ${operator}`;
        }
    }

    visitCall(node) {
        const callee = this.visit(node.callee);
        const args = node.args.map(arg => this.visit(arg)).join(', ');
        
        // Map console.log to print
        if (callee === 'console.log') {
            return `print(${args})`;
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
        const elements = node.elements.map(el => el ? this.visit(el) : 'nil').join(', ');
        return `{${elements}}`;
    }

    visitObjectLiteral(node) {
        if (node.properties.length === 0) {
            return '{}';
        }
        
        this.indentLevel++;
        const properties = node.properties.map(prop => {
            const key = prop.key.kind === NodeCategory.IDENTIFIER 
                ? prop.key.name 
                : this.visit(prop.key);
            const value = this.visit(prop.value);
            return `${this.indent()}${key} = ${value}`;
        }).join(',\n');
        this.indentLevel--;
        
        return `{\n${properties}\n${this.indent()}}`;
    }

    visitProperty(node) {
        const key = this.visit(node.key);
        const value = this.visit(node.value);
        
        return `${key} = ${value}`;
    }

    visitIdentifier(node) {
        return node.name;
    }

    visitLiteral(node) {
        if (typeof node.value === 'string') {
            return `"${node.value.replace(/"/g, '\\"')}"`;
        } else if (node.value === null || node.value === undefined) {
            return 'nil';
        } else if (typeof node.value === 'boolean') {
            return node.value ? 'true' : 'false';
        }
        return String(node.value);
    }

    visitAssignment(node) {
        const left = this.visit(node.left);
        const right = this.visit(node.right);
        
        // Handle compound assignment operators
        if (node.operator !== '=') {
            const op = node.operator.slice(0, -1); // Remove the '='
            return `${left} = ${left} ${op} ${right}`;
        }
        
        return `${left} = ${right}`;
    }

    visitConditional(node) {
        const condition = this.visit(node.condition);
        const consequent = this.visit(node.consequent);
        const alternate = this.visit(node.alternate);
        
        // Lua ternary: (condition and consequent or alternate)
        // Note: This doesn't work correctly if consequent is false/nil
        // For proper behavior, we need: (condition and {consequent} or {alternate})[1]
        return `((${condition}) and {${consequent}} or {${alternate}})[1]`;
    }

    // ========== HELPERS ==========

    indent() {
        return this.options.indent.repeat(this.indentLevel);
    }

    createTempVar() {
        return `__tmp${this.tempVarCounter++}`;
    }

    isStringLike(node) {
        if (!node) {
            return false;
        }

        if (node.type && this.isStringType(node.type)) {
            return true;
        }

        if (node.kind === NodeCategory.LITERAL && typeof node.value === 'string') {
            return true;
        }

        return false;
    }

    isStringType(type) {
        if (!type || !type.category) {
            return false;
        }

        switch (type.category) {
            case TypeCategory.PRIMITIVE:
                return type.primitiveType === PrimitiveType.STRING;
            case TypeCategory.OPTIONAL:
                return this.isStringType(type.baseType);
            case TypeCategory.UNION:
                return Array.isArray(type.types) && type.types.every(t => this.isStringType(t));
            default:
                return false;
        }
    }
}

module.exports = {
    IRToLuaGenerator
};

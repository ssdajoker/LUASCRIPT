/**
 * LUASCRIPT Enhanced Emitter
 * 
 * Converts IR to Lua with semantic understanding of:
 * - Async/await → coroutines
 * - Classes → metatables with prototype chains
 * - For-of → pairs/ipairs
 * - Try-catch → pcall
 * - Templates → string concatenation
 * - Spread/rest → table.unpack
 */

const nodes = require('./nodes');

class EnhancedEmitter {
    constructor(options = {}) {
        this.options = options;
        this.indentLevel = 0;
        this.localVarCounter = 0;
        this.contextStack = [];
        this.needsAwaitHelper = false;
        this.needsAsyncGeneratorHelper = false;
    }

    resetState() {
        this.contextStack = [];
        this.needsAwaitHelper = false;
        this.needsAsyncGeneratorHelper = false;
        this.localVarCounter = 0;
    }

    emit(ir) {
        this.resetState();
        return this.emitNode(ir);
    }

    indent() {
        return '  '.repeat(this.indentLevel);
    }

    createTempVar(prefix = '__emit') {
        return `${prefix}_${++this.localVarCounter}`;
    }

    pushContext(type) {
        this.contextStack.push(type);
    }

    popContext() {
        this.contextStack.pop();
    }

    inAsyncGenerator() {
        return this.contextStack.includes('async-generator');
    }

    inAsyncFunction() {
        return this.contextStack.includes('async-function');
    }

    emitNode(node) {
        if (!node) return '';

        switch (node.kind) {
            case 'Program':
                return this.emitProgram(node);
            case 'BlockStatement':
                return this.emitBlockStatement(node);
            case 'FunctionDeclaration':
                return this.emitFunctionDeclaration(node);
            case 'AsyncFunctionDeclaration':
                return this.emitAsyncFunctionDeclaration(node);
                        case 'GeneratorDeclaration':
                            return this.emitGeneratorDeclaration(node);
            case 'ClassDeclaration':
                return this.emitClassDeclaration(node);
            case 'VariableDeclaration':
                return this.emitVariableDeclaration(node);
            case 'ExpressionStatement':
                return this.emitExpressionStatement(node);
            case 'ReturnStatement':
                return this.emitReturnStatement(node);
            case 'IfStatement':
                return this.emitIfStatement(node);
            case 'WhileStatement':
                return this.emitWhileStatement(node);
            case 'ForStatement':
                return this.emitForStatement(node);
            case 'ForOfStatement':
                return this.emitForOfStatement(node);
            case 'ForInStatement':
                return this.emitForInStatement(node);
            case 'DoWhileStatement':
                return this.emitDoWhileStatement(node);
            case 'BreakStatement':
                return 'break';
            case 'ContinueStatement':
                return 'goto continue_loop';
            case 'TryStatement':
                return this.emitTryStatement(node);
            case 'ThrowStatement':
                return this.emitThrowStatement(node);
            case 'SwitchStatement':
                return this.emitSwitchStatement(node);
            default:
                // Try expression emission
                return this.emitExpression(node);
        }
    }

    emitProgram(node) {
        const body = (node.body || [])
            .map(stmt => this.emitNode(stmt))
            .filter(Boolean);

        const helpers = [];
        if (this.needsAwaitHelper || this.needsAsyncGeneratorHelper) {
            helpers.push(this.emitAwaitHelper());
        }
        if (this.needsAsyncGeneratorHelper) {
            helpers.push(this.emitAsyncGeneratorHelper());
        }

        return [...helpers, ...body].filter(Boolean).join('\n');
    }

    emitBlockStatement(node) {
        // Handle both IR Block nodes (statements) and AST BlockStatement (body)
        const stmtArray = node.statements || node.body || [];
        const stmts = stmtArray.map(stmt => this.emitNode(stmt));
        return stmts.join('\n');
    }

    emitFunctionDeclaration(node) {
        const name = node.id.name;
        const params = (node.params || []).map(p => p.name).join(', ');
        this.indentLevel++;
        const body = this.emitBlockStatement(node.body);
        this.indentLevel--;

        return `${this.indent()}local function ${name}(${params})\n${body}\n${this.indent()}end`;
    }

    emitAsyncFunctionDeclaration(node) {
        const name = node.id.name;
        const params = (node.params || []).map(p => p.name).join(', ');

        this.pushContext('async-function');
        this.indentLevel++;
        const body = this.emitBlockStatement(node.body);
        this.indentLevel--;
        this.popContext();

        return `${this.indent()}local function ${name}(${params})\n${this.indent()}  return coroutine.create(function()\n${body}\n${this.indent()}  end)\n${this.indent()}end`;
    }

    emitClassDeclaration(node) {
        const className = node.id.name;
        const superClass = node.superClass ? this.emitExpression(node.superClass) : null;

        const lines = [];
        lines.push(`${this.indent()}local ${className} = {}`);

        if (superClass) {
            lines.push(`${this.indent()}${className}.__index = ${superClass}`);
        } else {
            lines.push(`${this.indent()}${className}.__index = ${className}`);
        }

        // Emit methods
        for (const method of (node.body.body || [])) {
            const methodName = method.key.name;
            const isStatic = method.static;
            const params = (method.value.params || []).map(p => p.name).join(', ');

            this.indentLevel++;
            const body = this.emitBlockStatement(method.value.body);
            this.indentLevel--;

            if (methodName === 'constructor') {
                lines.push(`${this.indent()}function ${className}:new(${params})\n${body}\n${this.indent()}end`);
            } else if (isStatic) {
                lines.push(`${this.indent()}function ${className}.${methodName}(${params})\n${body}\n${this.indent()}end`);
            } else {
                lines.push(`${this.indent()}function ${className}:${methodName}(${params})\n${body}\n${this.indent()}end`);
            }
        }

        return lines.join('\n');
    }

    emitVariableDeclaration(node) {
        const decls = (node.body || [])
            .map(varDecl => {
                if (typeof varDecl.init === 'string') {
                    return `${varDecl.id} = ${varDecl.init}`;
                } else if (varDecl.init) {
                    return `${varDecl.id} = ${this.emitExpression(varDecl.init)}`;
                } else {
                    return `${varDecl.id} = nil`;
                }
            })
            .join(', ');

        return `${this.indent()}local ${decls}`;
    }

    emitExpressionStatement(node) {
        return `${this.indent()}${this.emitExpression(node.expression)}`;
    }

    emitReturnStatement(node) {
        const value = node.argument ? this.emitExpression(node.argument) : '';
        return `${this.indent()}return ${value}`.trimEnd();
    }

    emitIfStatement(node) {
        const test = this.emitExpression(node.test);
        this.indentLevel++;
        const consequent = this.emitBlockStatement(node.consequent);
        this.indentLevel--;

        let code = `${this.indent()}if ${test} then\n${consequent}`;

        if (node.alternate) {
            this.indentLevel++;
            const alternate = this.emitBlockStatement(node.alternate);
            this.indentLevel--;
            code += `\n${this.indent()}else\n${alternate}`;
        }

        code += `\n${this.indent()}end`;
        return code;
    }

    emitWhileStatement(node) {
        const test = this.emitExpression(node.test);
        this.indentLevel++;
        const body = this.emitBlockStatement(node.body);
        this.indentLevel--;

        return `${this.indent()}while ${test} do\n${body}\n${this.indent()}end`;
    }

    emitForStatement(node) {
        const init = node.init ? this.emitNode(node.init).trim() : '';
        const test = node.test ? this.emitExpression(node.test) : 'true';
        const update = node.update ? this.emitExpression(node.update) : '';

        this.indentLevel++;
        const body = this.emitBlockStatement(node.body);
        this.indentLevel--;

        let code = init ? `${this.indent()}${init}\n` : '';
        code += `${this.indent()}while ${test} do\n${body}`;
        if (update) {
            code += `\n${this.indent()}  ${update}`;
        }
        code += `\n${this.indent()}end`;

        return code;
    }

    emitForOfStatement(node) {
        const left = node.left.id || node.left;
        const right = this.emitExpression(node.right);
        const isAsync = Boolean(node.await);

        const originalIndent = this.indentLevel;
        this.indentLevel = originalIndent + 2;
        const body = this.emitBlockStatement(node.body);
        this.indentLevel = originalIndent;

        const base = this.indent();
        const iterIndent = `${base}  `;
        const lines = [`${base}local __iter = ${right}`];

        if (isAsync) {
            this.needsAwaitHelper = true;
            lines.push(`${base}if type(__iter) == "table" and __iter.next then`);
            lines.push(`${iterIndent}while true do`);
            lines.push(`${iterIndent}  local __res = __iter:next()`);
            lines.push(`${iterIndent}  if __res.done then break end`);
            lines.push(`${iterIndent}  local ${left} = __await_value(__res.value)`);
            lines.push(body);
            lines.push(`${iterIndent}end`);
            lines.push(`${base}else`);
            lines.push(`${iterIndent}for _, __item in ipairs(__iter) do`);
            lines.push(`${iterIndent}  local ${left} = __await_value(__item)`);
            lines.push(body);
            lines.push(`${iterIndent}end`);
            lines.push(`${base}end`);
        } else {
            lines.push(`${base}if type(__iter) == "table" and __iter.next then`);
            lines.push(`${iterIndent}while true do`);
            lines.push(`${iterIndent}  local __res = __iter:next()`);
            lines.push(`${iterIndent}  if __res.done then break end`);
            lines.push(`${iterIndent}  local ${left} = __res.value`);
            lines.push(body);
            lines.push(`${iterIndent}end`);
            lines.push(`${base}else`);
            lines.push(`${iterIndent}for _, ${left} in ipairs(__iter) do`);
            lines.push(body);
            lines.push(`${iterIndent}end`);
            lines.push(`${base}end`);
        }

        return lines.join('\n');
    }

    emitForInStatement(node) {
        const left = node.left.id || node.left;
        const right = this.emitExpression(node.right);

        this.indentLevel++;
        const body = this.emitBlockStatement(node.body);
        this.indentLevel--;

        return `${this.indent()}for ${left}, _ in pairs(${right}) do\n${body}\n${this.indent()}end`;
    }

    emitDoWhileStatement(node) {
        this.indentLevel++;
        const body = this.emitBlockStatement(node.body);
        this.indentLevel--;

        const test = this.emitExpression(node.test);
        return `${this.indent()}repeat\n${body}\n${this.indent()}until ${test}`;
    }

    emitTryStatement(node) {
        const temp = this.createTempVar('__try');
        const lines = [];

        this.indentLevel++;
        const tryBody = this.emitBlockStatement(node.body);
        this.indentLevel--;

        lines.push(`${this.indent()}local ${temp}_ok, ${temp}_err = pcall(function()\n${tryBody}\n${this.indent()}end)`);

        if (node.handler) {
            const catchParam = node.handler.param ? node.handler.param.name : '_';
            this.indentLevel++;
            const catchBody = this.emitBlockStatement(node.handler.body);
            this.indentLevel--;

            lines.push(`${this.indent()}if not ${temp}_ok then`);
            lines.push(`${this.indent()}  local ${catchParam} = ${temp}_err`);
            lines.push(`${this.indent()}  ${catchBody.replace(this.indent(), this.indent() + '  ')}`);
            lines.push(`${this.indent()}end`);
        }

        if (node.finalizer) {
            this.indentLevel++;
            const finallyBody = this.emitBlockStatement(node.finalizer);
            this.indentLevel--;
            lines.push(`${this.indent()}${finallyBody}`);
        }

        return lines.join('\n');
    }

    emitThrowStatement(node) {
        const value = this.emitExpression(node.argument);
        return `${this.indent()}error(${value})`;
    }

    emitSwitchStatement(node) {
        const discriminant = this.emitExpression(node.discriminant);
        const lines = [];

        for (const switchCase of (node.cases || [])) {
            if (switchCase.test) {
                const test = this.emitExpression(switchCase.test);
                lines.push(`${this.indent()}if ${discriminant} == ${test} then`);
            } else {
                lines.push(`${this.indent()}else`);
            }

            this.indentLevel++;
            const stmts = (switchCase.consequent || []).map(stmt => this.emitNode(stmt));
            lines.push(...stmts);
            this.indentLevel--;
        }

        lines.push(`${this.indent()}end`);
        return lines.join('\n');
    }

    // ========== Expression Emission ==========
    emitExpression(node) {
        if (!node) return '';

        switch (node.kind) {
            case 'Identifier':
                return node.name;
            case 'Literal':
                return this.emitLiteral(node);
            case 'BinaryExpression':
                return this.emitBinaryExpression(node);
            case 'UnaryExpression':
                return this.emitUnaryExpression(node);
            case 'CallExpression':
                return this.emitCallExpression(node);
            case 'MemberExpression':
                return this.emitMemberExpression(node);
            case 'ArrayExpression':
                return this.emitArrayExpression(node);
            case 'ObjectExpression':
                return this.emitObjectExpression(node);
            case 'FunctionExpression':
                return this.emitFunctionExpression(node);
            case 'ConditionalExpression':
                return this.emitConditionalExpression(node);
            case 'AssignmentExpression':
                return this.emitAssignmentExpression(node);
            case 'TemplateLiteral':
                return this.emitTemplateLiteral(node);
            case 'AwaitExpression':
                return this.emitAwaitExpression(node);
                        case 'YieldExpression':
                            return this.emitYieldExpression(node);
            case 'SpreadElement':
                return `...${this.emitExpression(node.argument)}`;
            case 'ThisExpression':
                return 'self';
            default:
                return '';
        }
    }

    emitLiteral(node) {
        if (typeof node.value === 'string') {
            return JSON.stringify(node.value);
        }
        if (typeof node.value === 'boolean') {
            return node.value ? 'true' : 'false';
        }
        if (node.value === null) {
            return 'nil';
        }
        return String(node.value);
    }

    emitBinaryExpression(node) {
        const left = this.emitExpression(node.left);
        const right = this.emitExpression(node.right);
        const op = this.getLuaOperator(node.operator, node.left, node.right);
        return `(${left} ${op} ${right})`;
    }

    emitUnaryExpression(node) {
        const arg = this.emitExpression(node.argument);
        const op = this.getLuaUnaryOperator(node.operator);
        return node.prefix ? `${op}${arg}` : `${arg}${op}`;
    }

    emitCallExpression(node) {
        const callee = this.emitExpression(node.callee);
        const args = (node.arguments || []).map(arg => this.emitExpression(arg)).join(', ');
        return `${callee}(${args})`;
    }

    emitMemberExpression(node) {
        const obj = this.emitExpression(node.object);
        const prop = this.emitExpression(node.property);
        return node.computed ? `${obj}[${prop}]` : `${obj}.${prop}`;
    }

    emitArrayExpression(node) {
        const elements = (node.elements || [])
            .map(el => el ? this.emitExpression(el) : 'nil')
            .join(', ');
        return `{${elements}}`;
    }

    emitObjectExpression(node) {
        const props = (node.properties || [])
            .map(prop => {
                const key = prop.key.name || this.emitExpression(prop.key);
                const value = this.emitExpression(prop.value);
                return `${key} = ${value}`;
            })
            .join(', ');
        return `{${props}}`;
    }

    emitFunctionExpression(node) {
        const params = (node.params || []).map(p => p.name).join(', ');
        this.indentLevel++;
        const body = this.emitBlockStatement(node.body);
        this.indentLevel--;

        return `function(${params})\n${body}\n${this.indent()}end`;
    }

    emitConditionalExpression(node) {
        const test = this.emitExpression(node.test);
        const cons = this.emitExpression(node.consequent);
        const alt = this.emitExpression(node.alternate);
        return `(${test} and ${cons} or ${alt})`;
    }

    emitAssignmentExpression(node) {
        const left = this.emitExpression(node.left);
        const right = this.emitExpression(node.right);
        return `${left} = ${right}`;
    }

    emitTemplateLiteral(node) {
        const parts = [];
        (node.quasis || []).forEach((quasi, idx) => {
            if (quasi.value.cooked) {
                parts.push(JSON.stringify(quasi.value.cooked));
            }
            if (idx < (node.expressions || []).length) {
                parts.push(`tostring(${this.emitExpression(node.expressions[idx])})`);
            }
        });
        return parts.join(' .. ');
    }

    emitAwaitExpression(node) {
        const arg = this.emitExpression(node.argument);
        if (this.inAsyncGenerator()) {
            this.needsAwaitHelper = true;
            return `__await_value(${arg})`;
        }
        return `coroutine.yield(${arg})`;
    }

    emitGeneratorDeclaration(node) {
        const name = node.id.name;
        const params = (node.params || []).map(p => p.name).join(', ');
        const isAsync = Boolean(node.async);

        this.pushContext(isAsync ? 'async-generator' : 'generator');
        this.indentLevel += 2;
        const body = this.emitBlockStatement(node.body);
        this.indentLevel -= 2;
        this.popContext();

        const indent = this.indent();
        const innerIndent = `${indent}  `;
        const lines = [];
        lines.push(`${indent}local function ${name}(${params})`);
        lines.push(`${innerIndent}local co = coroutine.create(function()`);
        if (body) {
            lines.push(body);
        }
        lines.push(`${innerIndent}end)`);

        if (isAsync) {
            this.needsAwaitHelper = true;
            this.needsAsyncGeneratorHelper = true;
            lines.push(`${innerIndent}return __async_generator(co)`);
        } else {
            lines.push(`${innerIndent}return {`);
            lines.push(`${innerIndent}  next = function(self, value)`);
            lines.push(`${innerIndent}    if coroutine.status(co) == "dead" then`);
            lines.push(`${innerIndent}      return { value = nil, done = true }`);
            lines.push(`${innerIndent}    end`);
            lines.push(`${innerIndent}    local success, result = coroutine.resume(co, value)`);
            lines.push(`${innerIndent}    if not success then`);
            lines.push(`${innerIndent}      error(result)`);
            lines.push(`${innerIndent}    end`);
            lines.push(`${innerIndent}    local done = coroutine.status(co) == "dead"`);
            lines.push(`${innerIndent}    return { value = result, done = done }`);
            lines.push(`${innerIndent}  end,`);
            lines.push(`${innerIndent}  ["return"] = function(self, value)`);
            lines.push(`${innerIndent}    return { value = value, done = true }`);
            lines.push(`${innerIndent}  end,`);
            lines.push(`${innerIndent}  ["throw"] = function(self, err)`);
            lines.push(`${innerIndent}    error(err)`);
            lines.push(`${innerIndent}  end`);
            lines.push(`${innerIndent}}`);
        }

        lines.push(`${indent}end`);
        return lines.join('\n');
    }

    emitYieldExpression(node) {
        const inAsyncGen = this.inAsyncGenerator();
        if (node.delegate) {
            const arg = this.emitExpression(node.argument);
            const indent = this.indent();
            const innerIndent = `${indent}  `;
            const yieldValue = inAsyncGen ? '__await_value(result.value)' : 'result.value';
            if (inAsyncGen) {
                this.needsAwaitHelper = true;
            }

            const lines = [
                `(function()`,
                `${innerIndent}local gen = ${arg}`,
                `${innerIndent}while true do`,
                `${innerIndent}  local result = gen:next()`,
                `${innerIndent}  if result.done then`,
                `${innerIndent}    return result.value`,
                `${innerIndent}  end`,
                `${innerIndent}  coroutine.yield(${yieldValue})`,
                `${innerIndent}end`,
                `${indent})()`,
            ];
            return lines.join('\n');
        }

        const arg = node.argument ? this.emitExpression(node.argument) : 'nil';
        const awaitedArg = inAsyncGen ? `__await_value(${arg})` : arg;
        if (inAsyncGen) {
            this.needsAwaitHelper = true;
        }
        return `coroutine.yield(${awaitedArg})`;
    }

    emitAwaitHelper() {
        return [
            'local function __await_value(v)',
            '  if type(v) == "table" and v.await then',
            '    return v:await()',
            '  end',
            '  if type(v) == "function" then',
            '    return v()',
            '  end',
            '  return v',
            'end',
        ].join('\n');
    }

    emitAsyncGeneratorHelper() {
        return [
            'local function __async_generator(co)',
            '  return {',
            '    next = function(self, value)',
            '      if coroutine.status(co) == "dead" then',
            '        return { value = nil, done = true }',
            '      end',
            '      local ok, res = coroutine.resume(co, value)',
            '      if not ok then error(res) end',
            '      res = __await_value(res)',
            '      local done = coroutine.status(co) == "dead"',
            '      return { value = res, done = done }',
            '    end,',
            '    ["return"] = function(self, value)',
            '      return { value = value, done = true }',
            '    end,',
            '    ["throw"] = function(self, err)',
            '      error(err)',
            '    end',
            '  }',
            'end',
        ].join('\n');
    }

    getLuaOperator(op, left, right) {
        // Check for string concatenation
        if (op === '+' && (this.isStringLike(left) || this.isStringLike(right))) {
            return '..';
        }
        
        const map = {
            '===': '==',
            '!==': '~=',
            '!=': '~=',
            '&&': 'and',
            '||': 'or',
            '**': '^',
            '??': 'or'
        };
        return map[op] || op;
    }

    isStringLike(node, depth = 0) {
        if (depth > 10 || !node) return false;
        
        switch (node.kind) {
            case 'Literal':
                return typeof node.value === 'string';
            case 'TemplateLiteral':
                return true;
            case 'BinaryExpression':
                if (node.operator === '+') {
                    return this.isStringLike(node.left, depth + 1) || this.isStringLike(node.right, depth + 1);
                }
                return false;
            case 'CallExpression':
                // Check for String(), .toString(), .concat()
                if (node.callee && node.callee.kind === 'Identifier' && node.callee.name === 'String') {
                    return true;
                }
                if (node.callee && node.callee.kind === 'MemberExpression') {
                    const prop = node.callee.property;
                    if (prop && prop.kind === 'Identifier' && (prop.name === 'toString' || prop.name === 'concat')) {
                        return true;
                    }
                }
                return false;
            case 'MemberExpression':
                // String properties might produce strings
                return this.isStringLike(node.object, depth + 1);
            default:
                return false;
        }
    }

    getLuaUnaryOperator(op) {
        const map = {
            '!': 'not ',
            '~': '~',
            '-': '-',
            '+': ''
        };
        return map[op] || op;
    }
}

module.exports = { EnhancedEmitter };

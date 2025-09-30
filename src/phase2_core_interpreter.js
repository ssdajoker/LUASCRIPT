
/**
 * LUASCRIPT Phase 2 Core - Advanced Interpreter Implementation
 * PS2/PS3 Specialists + Steve Jobs + Donald Knuth Excellence
 * 32+ Developer Team Implementation - CRUNCH MODE!
 */

const {
    ProgramNode, BlockStatementNode, ExpressionStatementNode,
    VariableDeclarationNode, VariableDeclaratorNode, FunctionDeclarationNode,
    ReturnStatementNode, IfStatementNode, WhileStatementNode, ForStatementNode,
    BreakStatementNode, ContinueStatementNode, BinaryExpressionNode,
    UnaryExpressionNode, AssignmentExpressionNode, UpdateExpressionNode,
    LogicalExpressionNode, ConditionalExpressionNode, CallExpressionNode,
    MemberExpressionNode, ArrayExpressionNode, ObjectExpressionNode,
    PropertyNode, ArrowFunctionExpressionNode, FunctionExpressionNode,
    LiteralNode, IdentifierNode, ThisExpressionNode
} = require('./phase1_core_ast');

class Environment {
    constructor(parent = null) {
        this.parent = parent;
        this.variables = new Map();
        this.constants = new Set();
        this.functions = new Map();
    }

    define(name, value, isConst = false) {
        if (this.variables.has(name)) {
            throw new ReferenceError(`Variable '${name}' already declared in this scope`);
        }
        
        this.variables.set(name, value);
        if (isConst) {
            this.constants.add(name);
        }
    }

    get(name) {
        if (this.variables.has(name)) {
            return this.variables.get(name);
        }
        
        if (this.parent) {
            return this.parent.get(name);
        }
        
        throw new ReferenceError(`Undefined variable '${name}'`);
    }

    set(name, value) {
        if (this.variables.has(name)) {
            if (this.constants.has(name)) {
                throw new TypeError(`Cannot assign to const variable '${name}'`);
            }
            this.variables.set(name, value);
            return;
        }
        
        if (this.parent) {
            this.parent.set(name, value);
            return;
        }
        
        throw new ReferenceError(`Undefined variable '${name}'`);
    }

    has(name) {
        return this.variables.has(name) || (this.parent && this.parent.has(name));
    }

    defineFunction(name, func) {
        this.functions.set(name, func);
        this.define(name, func);
    }

    getFunction(name) {
        if (this.functions.has(name)) {
            return this.functions.get(name);
        }
        
        if (this.parent) {
            return this.parent.getFunction(name);
        }
        
        return null;
    }
}

class LuaScriptFunction {
    constructor(declaration, closure, interpreter) {
        this.declaration = declaration;
        this.closure = closure;
        this.interpreter = interpreter;
        this.isArrowFunction = declaration.type === 'ArrowFunctionExpression';
        this.name = declaration.id ? declaration.id.name : '<anonymous>';
    }

    call(args = []) {
        const environment = new Environment(this.closure);
        
        // Bind parameters
        const params = this.declaration.params || [];
        for (let i = 0; i < params.length; i++) {
            const param = params[i];
            const value = i < args.length ? args[i] : undefined;
            environment.define(param.name, value);
        }
        
        // Bind 'arguments' object for regular functions (not arrow functions)
        if (!this.isArrowFunction) {
            const argumentsObj = new LuaScriptArray(args);
            environment.define('arguments', argumentsObj);
        }
        
        const previous = this.interpreter.environment;
        this.interpreter.environment = environment;
        
        try {
            if (this.isArrowFunction && this.declaration.expression) {
                // Arrow function with expression body
                return this.interpreter.evaluate(this.declaration.body);
            } else {
                // Regular function or arrow function with block body
                this.interpreter.execute(this.declaration.body);
                return undefined; // No explicit return
            }
        } catch (error) {
            if (error instanceof ReturnValue) {
                return error.value;
            }
            throw error;
        } finally {
            this.interpreter.environment = previous;
        }
    }

    toString() {
        return `[Function: ${this.name}]`;
    }
}

class LuaScriptArray {
    constructor(elements = []) {
        this.elements = [...elements];
        this.length = this.elements.length;
    }

    get(index) {
        if (index < 0 || index >= this.length) {
            return undefined;
        }
        return this.elements[index];
    }

    set(index, value) {
        if (index >= 0) {
            this.elements[index] = value;
            this.length = Math.max(this.length, index + 1);
        }
    }

    push(...values) {
        this.elements.push(...values);
        this.length = this.elements.length;
        return this.length;
    }

    pop() {
        if (this.length === 0) return undefined;
        const value = this.elements.pop();
        this.length = this.elements.length;
        return value;
    }

    shift() {
        if (this.length === 0) return undefined;
        const value = this.elements.shift();
        this.length = this.elements.length;
        return value;
    }

    unshift(...values) {
        this.elements.unshift(...values);
        this.length = this.elements.length;
        return this.length;
    }

    slice(start = 0, end = this.length) {
        return new LuaScriptArray(this.elements.slice(start, end));
    }

    splice(start, deleteCount = 0, ...items) {
        const deleted = this.elements.splice(start, deleteCount, ...items);
        this.length = this.elements.length;
        return new LuaScriptArray(deleted);
    }

    indexOf(searchElement, fromIndex = 0) {
        return this.elements.indexOf(searchElement, fromIndex);
    }

    includes(searchElement, fromIndex = 0) {
        return this.elements.includes(searchElement, fromIndex);
    }

    join(separator = ',') {
        return this.elements.join(separator);
    }

    reverse() {
        this.elements.reverse();
        return this;
    }

    sort(compareFn) {
        this.elements.sort(compareFn);
        return this;
    }

    forEach(callback, thisArg) {
        for (let i = 0; i < this.length; i++) {
            callback.call(thisArg, this.elements[i], i, this);
        }
    }

    map(callback, thisArg) {
        const result = new LuaScriptArray();
        for (let i = 0; i < this.length; i++) {
            result.elements[i] = callback.call(thisArg, this.elements[i], i, this);
        }
        result.length = this.length;
        return result;
    }

    filter(callback, thisArg) {
        const result = new LuaScriptArray();
        for (let i = 0; i < this.length; i++) {
            if (callback.call(thisArg, this.elements[i], i, this)) {
                result.elements.push(this.elements[i]);
            }
        }
        result.length = result.elements.length;
        return result;
    }

    reduce(callback, initialValue) {
        let accumulator = initialValue;
        let startIndex = 0;
        
        if (arguments.length < 2) {
            if (this.length === 0) {
                throw new TypeError('Reduce of empty array with no initial value');
            }
            accumulator = this.elements[0];
            startIndex = 1;
        }
        
        for (let i = startIndex; i < this.length; i++) {
            accumulator = callback(accumulator, this.elements[i], i, this);
        }
        
        return accumulator;
    }

    toString() {
        return this.elements.toString();
    }

    valueOf() {
        return this.elements;
    }

    [Symbol.iterator]() {
        return this.elements[Symbol.iterator]();
    }
}

class LuaScriptObject {
    constructor(properties = {}) {
        this.properties = new Map();
        
        for (const [key, value] of Object.entries(properties)) {
            this.properties.set(key, value);
        }
    }

    get(key) {
        return this.properties.get(String(key));
    }

    set(key, value) {
        this.properties.set(String(key), value);
    }

    has(key) {
        return this.properties.has(String(key));
    }

    delete(key) {
        return this.properties.delete(String(key));
    }

    keys() {
        return Array.from(this.properties.keys());
    }

    values() {
        return Array.from(this.properties.values());
    }

    entries() {
        return Array.from(this.properties.entries());
    }

    toString() {
        const entries = this.entries().map(([k, v]) => `${k}: ${v}`);
        return `{ ${entries.join(', ')} }`;
    }

    valueOf() {
        const obj = {};
        for (const [key, value] of this.properties) {
            obj[key] = value;
        }
        return obj;
    }
}

class ReturnValue extends Error {
    constructor(value) {
        super();
        this.value = value;
    }
}

class BreakException extends Error {
    constructor() {
        super();
    }
}

class ContinueException extends Error {
    constructor() {
        super();
    }
}

class LuaScriptInterpreter {
    constructor(options = {}) {
        this.globals = new Environment();
        this.environment = this.globals;
        this.options = {
            strictMode: options.strictMode || false,
            maxCallStack: options.maxCallStack || 1000,
            maxExecutionTime: options.maxExecutionTime || 30000, // 30 seconds
            ...options
        };
        this.callStack = [];
        this.startTime = null;
        this.setupBuiltins();
    }

    setupBuiltins() {
        // Console functions
        this.globals.define('console', new LuaScriptObject({
            log: (...args) => console.log(...args),
            error: (...args) => console.error(...args),
            warn: (...args) => console.warn(...args),
            info: (...args) => console.info(...args)
        }));

        // Global functions
        this.globals.define('print', (...args) => console.log(...args));
        this.globals.define('parseInt', (str, radix = 10) => parseInt(str, radix));
        this.globals.define('parseFloat', (str) => parseFloat(str));
        this.globals.define('isNaN', (value) => isNaN(value));
        this.globals.define('isFinite', (value) => isFinite(value));

        // Type checking functions
        this.globals.define('typeof', (value) => {
            if (value === null) return 'object';
            if (value instanceof LuaScriptArray) return 'object';
            if (value instanceof LuaScriptObject) return 'object';
            if (value instanceof LuaScriptFunction) return 'function';
            return typeof value;
        });

        // Array constructor
        this.globals.define('Array', (...args) => {
            if (args.length === 1 && typeof args[0] === 'number') {
                return new LuaScriptArray(new Array(args[0]));
            }
            return new LuaScriptArray(args);
        });

        // Object constructor
        this.globals.define('Object', (value) => {
            if (value == null) return new LuaScriptObject();
            return value;
        });

        // Math object
        this.globals.define('Math', new LuaScriptObject({
            PI: Math.PI,
            E: Math.E,
            abs: Math.abs,
            ceil: Math.ceil,
            floor: Math.floor,
            round: Math.round,
            max: Math.max,
            min: Math.min,
            pow: Math.pow,
            sqrt: Math.sqrt,
            random: Math.random,
            sin: Math.sin,
            cos: Math.cos,
            tan: Math.tan
        }));

        // String constructor and methods
        this.globals.define('String', (value) => String(value));

        // Number constructor
        this.globals.define('Number', (value) => Number(value));

        // Boolean constructor
        this.globals.define('Boolean', (value) => Boolean(value));
    }

    interpret(ast) {
        this.startTime = Date.now();
        this.callStack = [];
        
        try {
            return this.execute(ast);
        } catch (error) {
            if (error instanceof ReturnValue) {
                return error.value;
            }
            throw error;
        }
    }

    execute(node) {
        this.checkExecutionTime();
        
        if (!node) return undefined;

        switch (node.type) {
            case 'Program':
                return this.executeProgram(node);
            case 'BlockStatement':
                return this.executeBlockStatement(node);
            case 'ExpressionStatement':
                return this.evaluate(node.expression);
            case 'VariableDeclaration':
                return this.executeVariableDeclaration(node);
            case 'FunctionDeclaration':
                return this.executeFunctionDeclaration(node);
            case 'ReturnStatement':
                return this.executeReturnStatement(node);
            case 'IfStatement':
                return this.executeIfStatement(node);
            case 'WhileStatement':
                return this.executeWhileStatement(node);
            case 'ForStatement':
                return this.executeForStatement(node);
            case 'BreakStatement':
                throw new BreakException();
            case 'ContinueStatement':
                throw new ContinueException();
            default:
                return this.evaluate(node);
        }
    }

    executeProgram(node) {
        let result = undefined;
        for (const statement of node.body) {
            result = this.execute(statement);
        }
        return result;
    }

    executeBlockStatement(node) {
        const previous = this.environment;
        this.environment = new Environment(previous);
        
        try {
            let result = undefined;
            for (const statement of node.body) {
                result = this.execute(statement);
            }
            return result;
        } finally {
            this.environment = previous;
        }
    }

    executeVariableDeclaration(node) {
        for (const declarator of node.declarations) {
            const name = declarator.id.name;
            const value = declarator.init ? this.evaluate(declarator.init) : undefined;
            const isConst = node.kind === 'const';
            
            this.environment.define(name, value, isConst);
        }
        return undefined;
    }

    executeFunctionDeclaration(node) {
        const func = new LuaScriptFunction(node, this.environment, this);
        this.environment.defineFunction(node.id.name, func);
        return undefined;
    }

    executeReturnStatement(node) {
        const value = node.argument ? this.evaluate(node.argument) : undefined;
        throw new ReturnValue(value);
    }

    executeIfStatement(node) {
        const condition = this.evaluate(node.test);
        
        if (this.isTruthy(condition)) {
            return this.execute(node.consequent);
        } else if (node.alternate) {
            return this.execute(node.alternate);
        }
        
        return undefined;
    }

    executeWhileStatement(node) {
        let result = undefined;
        
        try {
            while (this.isTruthy(this.evaluate(node.test))) {
                try {
                    result = this.execute(node.body);
                } catch (error) {
                    if (error instanceof ContinueException) {
                        continue;
                    }
                    throw error;
                }
            }
        } catch (error) {
            if (error instanceof BreakException) {
                return result;
            }
            throw error;
        }
        
        return result;
    }

    executeForStatement(node) {
        const previous = this.environment;
        this.environment = new Environment(previous);
        
        try {
            // Initialize
            if (node.init) {
                this.execute(node.init);
            }
            
            let result = undefined;
            
            try {
                while (true) {
                    // Test condition
                    if (node.test && !this.isTruthy(this.evaluate(node.test))) {
                        break;
                    }
                    
                    // Execute body
                    try {
                        result = this.execute(node.body);
                    } catch (error) {
                        if (error instanceof ContinueException) {
                            // Continue to update
                        } else {
                            throw error;
                        }
                    }
                    
                    // Update
                    if (node.update) {
                        this.evaluate(node.update);
                    }
                }
            } catch (error) {
                if (error instanceof BreakException) {
                    return result;
                }
                throw error;
            }
            
            return result;
        } finally {
            this.environment = previous;
        }
    }

    evaluate(node) {
        this.checkExecutionTime();
        
        if (!node) return undefined;

        switch (node.type) {
            case 'Literal':
                return node.value;
            case 'Identifier':
                return this.environment.get(node.name);
            case 'ThisExpression':
                return this.environment.get('this');
            case 'BinaryExpression':
                return this.evaluateBinaryExpression(node);
            case 'UnaryExpression':
                return this.evaluateUnaryExpression(node);
            case 'AssignmentExpression':
                return this.evaluateAssignmentExpression(node);
            case 'UpdateExpression':
                return this.evaluateUpdateExpression(node);
            case 'LogicalExpression':
                return this.evaluateLogicalExpression(node);
            case 'ConditionalExpression':
                return this.evaluateConditionalExpression(node);
            case 'CallExpression':
                return this.evaluateCallExpression(node);
            case 'MemberExpression':
                return this.evaluateMemberExpression(node);
            case 'ArrayExpression':
                return this.evaluateArrayExpression(node);
            case 'ObjectExpression':
                return this.evaluateObjectExpression(node);
            case 'ArrowFunctionExpression':
            case 'FunctionExpression':
                return new LuaScriptFunction(node, this.environment, this);
            default:
                throw new Error(`Unknown expression type: ${node.type}`);
        }
    }

    evaluateBinaryExpression(node) {
        const left = this.evaluate(node.left);
        const right = this.evaluate(node.right);
        
        switch (node.operator) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return left / right;
            case '%': return left % right;
            case '==': return left == right;
            case '!=': return left != right;
            case '===': return left === right;
            case '!==': return left !== right;
            case '<': return left < right;
            case '>': return left > right;
            case '<=': return left <= right;
            case '>=': return left >= right;
            case '&': return left & right;
            case '|': return left | right;
            case '^': return left ^ right;
            case '<<': return left << right;
            case '>>': return left >> right;
            default:
                throw new Error(`Unknown binary operator: ${node.operator}`);
        }
    }

    evaluateUnaryExpression(node) {
        const argument = this.evaluate(node.argument);
        
        switch (node.operator) {
            case '+': return +argument;
            case '-': return -argument;
            case '!': return !argument;
            case '~': return ~argument;
            default:
                throw new Error(`Unknown unary operator: ${node.operator}`);
        }
    }

    evaluateAssignmentExpression(node) {
        const value = this.evaluate(node.right);
        
        if (node.left.type === 'Identifier') {
            if (node.operator === '=') {
                this.environment.set(node.left.name, value);
            } else {
                const current = this.environment.get(node.left.name);
                let newValue;
                
                switch (node.operator) {
                    case '+=': newValue = current + value; break;
                    case '-=': newValue = current - value; break;
                    case '*=': newValue = current * value; break;
                    case '/=': newValue = current / value; break;
                    default:
                        throw new Error(`Unknown assignment operator: ${node.operator}`);
                }
                
                this.environment.set(node.left.name, newValue);
                return newValue;
            }
        } else if (node.left.type === 'MemberExpression') {
            const object = this.evaluate(node.left.object);
            const property = node.left.computed ? 
                this.evaluate(node.left.property) : 
                node.left.property.name;
            
            if (node.operator === '=') {
                this.setProperty(object, property, value);
            } else {
                const current = this.getProperty(object, property);
                let newValue;
                
                switch (node.operator) {
                    case '+=': newValue = current + value; break;
                    case '-=': newValue = current - value; break;
                    case '*=': newValue = current * value; break;
                    case '/=': newValue = current / value; break;
                    default:
                        throw new Error(`Unknown assignment operator: ${node.operator}`);
                }
                
                this.setProperty(object, property, newValue);
                return newValue;
            }
        }
        
        return value;
    }

    evaluateUpdateExpression(node) {
        if (node.argument.type === 'Identifier') {
            const name = node.argument.name;
            const current = this.environment.get(name);
            const newValue = node.operator === '++' ? current + 1 : current - 1;
            
            this.environment.set(name, newValue);
            
            return node.prefix ? newValue : current;
        } else if (node.argument.type === 'MemberExpression') {
            const object = this.evaluate(node.argument.object);
            const property = node.argument.computed ? 
                this.evaluate(node.argument.property) : 
                node.argument.property.name;
            
            const current = this.getProperty(object, property);
            const newValue = node.operator === '++' ? current + 1 : current - 1;
            
            this.setProperty(object, property, newValue);
            
            return node.prefix ? newValue : current;
        }
        
        throw new Error('Invalid left-hand side in assignment');
    }

    evaluateLogicalExpression(node) {
        const left = this.evaluate(node.left);
        
        if (node.operator === '&&') {
            return this.isTruthy(left) ? this.evaluate(node.right) : left;
        } else if (node.operator === '||') {
            return this.isTruthy(left) ? left : this.evaluate(node.right);
        }
        
        throw new Error(`Unknown logical operator: ${node.operator}`);
    }

    evaluateConditionalExpression(node) {
        const test = this.evaluate(node.test);
        return this.isTruthy(test) ? 
            this.evaluate(node.consequent) : 
            this.evaluate(node.alternate);
    }

    evaluateCallExpression(node) {
        const callee = this.evaluate(node.callee);
        const args = node.arguments.map(arg => this.evaluate(arg));
        
        if (typeof callee === 'function') {
            // Native JavaScript function
            return callee.apply(null, args);
        } else if (callee instanceof LuaScriptFunction) {
            // LuaScript function
            this.checkCallStack();
            this.callStack.push(callee.name);
            
            try {
                return callee.call(args);
            } finally {
                this.callStack.pop();
            }
        } else {
            throw new TypeError(`${callee} is not a function`);
        }
    }

    evaluateMemberExpression(node) {
        const object = this.evaluate(node.object);
        const property = node.computed ? 
            this.evaluate(node.property) : 
            node.property.name;
        
        return this.getProperty(object, property);
    }

    evaluateArrayExpression(node) {
        const elements = node.elements.map(element => 
            element ? this.evaluate(element) : undefined
        );
        return new LuaScriptArray(elements);
    }

    evaluateObjectExpression(node) {
        const obj = new LuaScriptObject();
        
        for (const property of node.properties) {
            const key = property.computed ? 
                this.evaluate(property.key) : 
                property.key.name || property.key.value;
            const value = this.evaluate(property.value);
            
            obj.set(key, value);
        }
        
        return obj;
    }

    getProperty(object, property) {
        if (object instanceof LuaScriptArray) {
            if (typeof property === 'number' || /^\d+$/.test(property)) {
                return object.get(Number(property));
            }
            // Array methods
            const method = object[property];
            if (typeof method === 'function') {
                return method.bind(object);
            }
            return object[property];
        } else if (object instanceof LuaScriptObject) {
            return object.get(property);
        } else if (object != null) {
            return object[property];
        }
        
        return undefined;
    }

    setProperty(object, property, value) {
        if (object instanceof LuaScriptArray) {
            if (typeof property === 'number' || /^\d+$/.test(property)) {
                object.set(Number(property), value);
            } else {
                object[property] = value;
            }
        } else if (object instanceof LuaScriptObject) {
            object.set(property, value);
        } else if (object != null) {
            object[property] = value;
        } else {
            throw new TypeError('Cannot set property on null or undefined');
        }
    }

    isTruthy(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0 && !isNaN(value);
        if (typeof value === 'string') return value.length > 0;
        return true;
    }

    checkExecutionTime() {
        if (this.startTime && Date.now() - this.startTime > this.options.maxExecutionTime) {
            throw new Error('Maximum execution time exceeded');
        }
    }

    checkCallStack() {
        if (this.callStack.length >= this.options.maxCallStack) {
            throw new Error('Maximum call stack size exceeded');
        }
    }

    getCallStack() {
        return [...this.callStack];
    }

    getEnvironment() {
        return this.environment;
    }

    getGlobals() {
        return this.globals;
    }
}

module.exports = {
    LuaScriptInterpreter,
    Environment,
    LuaScriptFunction,
    LuaScriptArray,
    LuaScriptObject,
    ReturnValue,
    BreakException,
    ContinueException
};

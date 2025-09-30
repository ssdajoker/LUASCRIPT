
/**
 * LUASCRIPT Runtime - Phase 1D Implementation
 * Enhanced runtime with memory management and arrow function support
 */

class RuntimeMemoryManager {
    constructor(maxCallStack = 1000, maxHeapSize = 50 * 1024 * 1024) { // 50MB default
        this.maxCallStack = maxCallStack;
        this.maxHeapSize = maxHeapSize;
        this.callStack = [];
        this.heapSize = 0;
        this.allocatedObjects = new WeakSet();
        this.gcThreshold = maxHeapSize * 0.8; // Trigger GC at 80% capacity
    }

    enterFunction(functionName, args = []) {
        if (this.callStack.length >= this.maxCallStack) {
            throw new Error(`Stack overflow: maximum call stack size ${this.maxCallStack} exceeded in function '${functionName}'`);
        }
        
        this.callStack.push({
            function: functionName,
            arguments: args,
            timestamp: Date.now()
        });
    }

    exitFunction() {
        if (this.callStack.length > 0) {
            this.callStack.pop();
        }
    }

    allocateObject(obj, estimatedSize = 64) {
        if (this.heapSize + estimatedSize > this.maxHeapSize) {
            this.triggerGarbageCollection();
            
            if (this.heapSize + estimatedSize > this.maxHeapSize) {
                throw new Error(`Out of memory: heap size limit ${this.maxHeapSize} bytes exceeded`);
            }
        }
        
        this.heapSize += estimatedSize;
        this.allocatedObjects.add(obj);
        
        if (this.heapSize > this.gcThreshold) {
            this.triggerGarbageCollection();
        }
        
        return obj;
    }

    triggerGarbageCollection() {
        // Simulate garbage collection by reducing heap size
        const beforeSize = this.heapSize;
        this.heapSize = Math.max(0, this.heapSize * 0.7); // Assume 30% can be collected
        
        console.log(`GC: Freed ${beforeSize - this.heapSize} bytes, heap size now ${this.heapSize} bytes`);
    }

    getStats() {
        return {
            callStackDepth: this.callStack.length,
            maxCallStack: this.maxCallStack,
            heapSize: this.heapSize,
            maxHeapSize: this.maxHeapSize,
            heapUtilization: `${((this.heapSize / this.maxHeapSize) * 100).toFixed(1)}%`,
            callStack: this.callStack.slice(-5) // Last 5 calls for debugging
        };
    }

    cleanup() {
        this.callStack = [];
        this.heapSize = 0;
        this.triggerGarbageCollection();
    }
}

class Environment {
    constructor(parent = null) {
        this.parent = parent;
        this.variables = new Map();
    }

    define(name, value) {
        this.variables.set(name, value);
    }

    get(name) {
        if (this.variables.has(name)) {
            return this.variables.get(name);
        }
        
        if (this.parent) {
            return this.parent.get(name);
        }
        
        throw new Error(`Undefined variable '${name}'`);
    }

    set(name, value) {
        if (this.variables.has(name)) {
            this.variables.set(name, value);
            return;
        }
        
        if (this.parent) {
            this.parent.set(name, value);
            return;
        }
        
        throw new Error(`Undefined variable '${name}'`);
    }
}

class LuaScriptFunction {
    constructor(declaration, closure, isArrow = false) {
        this.declaration = declaration;
        this.closure = closure;
        this.isArrow = isArrow;
        this.name = isArrow ? '<arrow>' : (declaration.id ? declaration.id.name : '<anonymous>');
    }

    call(interpreter, args) {
        const environment = new Environment(this.closure);
        
        // Bind parameters
        const params = this.declaration.params || [];
        for (let i = 0; i < params.length; i++) {
            const param = params[i];
            const value = i < args.length ? args[i] : null;
            environment.define(param.name, value);
        }
        
        try {
            interpreter.runtimeMemory.enterFunction(this.name, args);
            
            if (this.isArrow && this.declaration.body.type === 'ExpressionStatement') {
                // Arrow function with expression body
                return interpreter.evaluate(this.declaration.body.expression, environment);
            } else {
                // Regular function or arrow function with block body
                interpreter.executeBlock(this.declaration.body.body, environment);
            }
        } catch (error) {
            if (error instanceof ReturnValue) {
                return error.value;
            }
            throw error;
        } finally {
            interpreter.runtimeMemory.exitFunction();
        }
        
        return null;
    }
}

class ReturnValue extends Error {
    constructor(value) {
        super();
        this.value = value;
    }
}

class Interpreter {
    constructor() {
        this.globals = new Environment();
        this.environment = this.globals;
        this.runtimeMemory = new RuntimeMemoryManager();
        
        // Define built-in functions
        this.defineBuiltins();
    }

    defineBuiltins() {
        this.globals.define('print', {
            call: (interpreter, args) => {
                const output = args.map(arg => this.stringify(arg)).join(' ');
                console.log(output);
                return null;
            }
        });

        this.globals.define('type', {
            call: (interpreter, args) => {
                if (args.length === 0) return 'nil';
                const value = args[0];
                if (value === null) return 'nil';
                if (typeof value === 'boolean') return 'boolean';
                if (typeof value === 'number') return 'number';
                if (typeof value === 'string') return 'string';
                if (typeof value === 'function' || (value && typeof value.call === 'function')) return 'function';
                return 'object';
            }
        });

        this.globals.define('tostring', {
            call: (interpreter, args) => {
                if (args.length === 0) return 'nil';
                return this.stringify(args[0]);
            }
        });

        this.globals.define('tonumber', {
            call: (interpreter, args) => {
                if (args.length === 0) return null;
                const value = args[0];
                if (typeof value === 'number') return value;
                if (typeof value === 'string') {
                    const num = parseFloat(value);
                    return isNaN(num) ? null : num;
                }
                return null;
            }
        });
    }

    interpret(statements) {
        try {
            for (const statement of statements) {
                this.execute(statement);
            }
        } catch (error) {
            if (error instanceof ReturnValue) {
                // Top-level return
                return error.value;
            }
            throw error;
        } finally {
            // Cleanup memory
            this.runtimeMemory.cleanup();
        }
    }

    execute(statement) {
        switch (statement.type) {
            case 'Program':
                return this.interpret(statement.body);
            
            case 'ExpressionStatement':
                return this.evaluate(statement.expression);
            
            case 'VariableDeclaration':
                return this.executeVariableDeclaration(statement);
            
            case 'FunctionDeclaration':
                return this.executeFunctionDeclaration(statement);
            
            case 'BlockStatement':
                return this.executeBlockStatement(statement);
            
            case 'IfStatement':
                return this.executeIfStatement(statement);
            
            case 'WhileStatement':
                return this.executeWhileStatement(statement);
            
            case 'ReturnStatement':
                return this.executeReturnStatement(statement);
            
            default:
                throw new Error(`Unknown statement type: ${statement.type}`);
        }
    }

    evaluate(expression, env = this.environment) {
        const previousEnv = this.environment;
        this.environment = env;
        
        try {
            switch (expression.type) {
                case 'Literal':
                    return expression.value;
                
                case 'Identifier':
                    return this.environment.get(expression.name);
                
                case 'BinaryExpression':
                    return this.evaluateBinaryExpression(expression);
                
                case 'UnaryExpression':
                    return this.evaluateUnaryExpression(expression);
                
                case 'AssignmentExpression':
                    return this.evaluateAssignmentExpression(expression);
                
                case 'CallExpression':
                    return this.evaluateCallExpression(expression);
                
                case 'ArrowFunction':
                    return this.evaluateArrowFunction(expression);
                
                default:
                    throw new Error(`Unknown expression type: ${expression.type}`);
            }
        } finally {
            this.environment = previousEnv;
        }
    }

    evaluateBinaryExpression(expression) {
        const left = this.evaluate(expression.left);
        const right = this.evaluate(expression.right);
        
        switch (expression.operator) {
            case '+':
                if (typeof left === 'string' || typeof right === 'string') {
                    return this.stringify(left) + this.stringify(right);
                }
                return left + right;
            case '-':
                return left - right;
            case '*':
                return left * right;
            case '/':
                if (right === 0) throw new Error('Division by zero');
                return left / right;
            case '==':
                return left === right;
            case '!=':
                return left !== right;
            case '<':
                return left < right;
            case '<=':
                return left <= right;
            case '>':
                return left > right;
            case '>=':
                return left >= right;
            case '&&':
                return this.isTruthy(left) && this.isTruthy(right);
            case '||':
                return this.isTruthy(left) || this.isTruthy(right);
            default:
                throw new Error(`Unknown binary operator: ${expression.operator}`);
        }
    }

    evaluateUnaryExpression(expression) {
        const operand = this.evaluate(expression.argument);
        
        switch (expression.operator) {
            case '-':
                return -operand;
            case '!':
                return !this.isTruthy(operand);
            default:
                throw new Error(`Unknown unary operator: ${expression.operator}`);
        }
    }

    evaluateAssignmentExpression(expression) {
        const value = this.evaluate(expression.right);
        
        if (expression.left.type === 'Identifier') {
            this.environment.set(expression.left.name, value);
            return value;
        }
        
        throw new Error('Invalid assignment target');
    }

    evaluateCallExpression(expression) {
        const callee = this.evaluate(expression.callee);
        const args = expression.arguments.map(arg => this.evaluate(arg));
        
        if (!callee || typeof callee.call !== 'function') {
            throw new Error('Not a function');
        }
        
        return callee.call(this, args);
    }

    evaluateArrowFunction(expression) {
        const func = this.runtimeMemory.allocateObject(
            new LuaScriptFunction(expression, this.environment, true)
        );
        
        return {
            call: (interpreter, args) => func.call(interpreter, args)
        };
    }

    executeVariableDeclaration(statement) {
        for (const declaration of statement.declarations) {
            const value = declaration.init ? this.evaluate(declaration.init) : null;
            this.environment.define(declaration.id.name, value);
        }
    }

    executeFunctionDeclaration(statement) {
        const func = this.runtimeMemory.allocateObject(
            new LuaScriptFunction(statement, this.environment, false)
        );
        
        this.environment.define(statement.id.name, {
            call: (interpreter, args) => func.call(interpreter, args)
        });
    }

    executeBlockStatement(statement) {
        this.executeBlock(statement.body, new Environment(this.environment));
    }

    executeBlock(statements, environment) {
        const previous = this.environment;
        
        try {
            this.environment = environment;
            
            for (const statement of statements) {
                this.execute(statement);
            }
        } finally {
            this.environment = previous;
        }
    }

    executeIfStatement(statement) {
        const condition = this.evaluate(statement.test);
        
        if (this.isTruthy(condition)) {
            this.execute(statement.consequent);
        } else if (statement.alternate) {
            this.execute(statement.alternate);
        }
    }

    executeWhileStatement(statement) {
        while (this.isTruthy(this.evaluate(statement.test))) {
            this.execute(statement.body);
        }
    }

    executeReturnStatement(statement) {
        const value = statement.argument ? this.evaluate(statement.argument) : null;
        throw new ReturnValue(value);
    }

    isTruthy(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'boolean') return value;
        return true;
    }

    stringify(value) {
        if (value === null || value === undefined) return 'nil';
        if (typeof value === 'string') return value;
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        return String(value);
    }

    getMemoryStats() {
        return this.runtimeMemory.getStats();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Interpreter, Environment, LuaScriptFunction, RuntimeMemoryManager };
}

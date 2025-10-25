
/**
 * LUASCRIPT Runtime - Phase 1D Implementation
 * Enhanced runtime with memory management and arrow function support
 */

/**
 * Manages the runtime memory, including the call stack and heap, to prevent memory leaks and stack overflows.
 */
class RuntimeMemoryManager {
    /**
     * Creates an instance of the RuntimeMemoryManager.
     * @param {number} [maxCallStack=1000] - The maximum depth of the call stack.
     * @param {number} [maxHeapSize=50*1024*1024] - The maximum size of the heap in bytes (defaults to 50MB).
     * @param {object} [gcOptions={}] - Adaptive garbage collection configuration options.
     */
    constructor(maxCallStack = 1000, maxHeapSize = 50 * 1024 * 1024, gcOptions = {}) {
        this.maxCallStack = maxCallStack;
        this.maxHeapSize = maxHeapSize;
        this.callStack = [];
        this.heapSize = 0;
        this.allocatedObjects = new WeakSet();

        this.gcTargetRatio = Math.min(Math.max(gcOptions.targetRatio ?? 0.62, 0.4), 0.9);
        this.gcHardRatio = Math.min(Math.max(gcOptions.hardLimitRatio ?? 0.85, this.gcTargetRatio + 0.05), 0.98);
        this.gcMinIntervalMs = Math.max(gcOptions.minIntervalMs ?? 200, 0);
        this.gcSmoothingWindow = Math.max(gcOptions.smoothingWindow ?? 5, 1);
        this.lastGcTimestamp = 0;
        this.recentHeapPeaks = [];

        this.gcThreshold = this.maxHeapSize * this.gcTargetRatio;
        this.gcHardLimit = this.maxHeapSize * this.gcHardRatio;
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

    adjustHeap(bytes) {
        if (bytes === 0) {
            return;
        }

        if (bytes > 0) {
            if (this.heapSize + bytes > this.maxHeapSize) {
                this.triggerGarbageCollection({ reason: 'hard-limit-precheck', aggressive: true });

                if (this.heapSize + bytes > this.maxHeapSize) {
                    throw new Error(`Out of memory: heap size limit ${this.maxHeapSize} bytes exceeded`);
                }
            }

            this.heapSize += bytes;
            this.recentHeapPeaks.push(this.heapSize);
            if (this.recentHeapPeaks.length > this.gcSmoothingWindow) {
                this.recentHeapPeaks.shift();
            }

            if (this.heapSize > this.gcHardLimit) {
                this.triggerGarbageCollection({ reason: 'hard-limit', aggressive: true });
            } else if (this.heapSize > this.gcThreshold) {
                this.maybeTriggerAdaptiveGC();
            }
        } else {
            this.heapSize = Math.max(0, this.heapSize + bytes);
        }
    }

    allocateObject(obj, estimatedSize = 64) {
        this.adjustHeap(estimatedSize);
        this.allocatedObjects.add(obj);
        return obj;
    }

    maybeTriggerAdaptiveGC() {
        const now = Date.now();
        if (now - this.lastGcTimestamp < this.gcMinIntervalMs) {
            return;
        }

        const averagePeak = this.recentHeapPeaks.length
            ? this.recentHeapPeaks.reduce((sum, value) => sum + value, 0) / this.recentHeapPeaks.length
            : this.heapSize;

        if (averagePeak >= this.gcThreshold) {
            this.triggerGarbageCollection({ reason: 'threshold' });
        }
    }

    triggerGarbageCollection(options = {}) {
        const { reason = 'manual', aggressive = false } = options;

        const beforeSize = this.heapSize;
        const reductionFactor = aggressive ? 0.5 : 0.7;
        this.heapSize = Math.max(0, this.heapSize * reductionFactor);
        this.lastGcTimestamp = Date.now();

        const freed = beforeSize - this.heapSize;

        if (freed < this.maxHeapSize * 0.05) {
            this.gcThreshold = Math.max(this.maxHeapSize * this.gcTargetRatio, this.gcThreshold * 0.95);
        } else {
            const ceiling = this.gcHardLimit * 0.95;
            this.gcThreshold = Math.min(ceiling, this.gcThreshold * 1.05);
        }

        console.log(`GC: Freed ${freed} bytes (reason=${reason}, aggressive=${aggressive}), heap size now ${this.heapSize} bytes, next threshold ${(this.gcThreshold / this.maxHeapSize * 100).toFixed(1)}%`);
    }

    /**
     * Retrieves statistics about the current memory usage.
     * @returns {object} An object containing memory statistics.
     */
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

    /**
     * Cleans up the memory manager's state.
     */
    cleanup() {
        this.callStack = [];
        this.heapSize = 0;
        this.triggerGarbageCollection({ reason: 'cleanup', aggressive: true });
    }
}

/**
 * Represents a lexical environment for storing variables and their values.
 * Environments can be nested to create scopes.
 */
class Environment {
    /**
     * Creates an instance of an Environment.
     * @param {Environment|null} [parent=null] - The parent environment.
     */
    constructor(parent = null) {
        this.parent = parent;
        this.variables = new Map();
    }

    /**
     * Defines a new variable in the current environment.
     * @param {string} name - The name of the variable.
     * @param {*} value - The value of the variable.
     */
    define(name, value) {
        this.variables.set(name, value);
    }

    /**
     * Retrieves the value of a variable from the environment or its ancestors.
     * @param {string} name - The name of the variable to retrieve.
     * @returns {*} The value of the variable.
     * @throws {Error} If the variable is not defined.
     */
    get(name) {
        if (this.variables.has(name)) {
            return this.variables.get(name);
        }
        
        if (this.parent) {
            return this.parent.get(name);
        }
        
        throw new Error(`Undefined variable '${name}'`);
    }

    /**
     * Sets the value of an existing variable in the environment or its ancestors.
     * @param {string} name - The name of the variable to set.
     * @param {*} value - The new value for the variable.
     * @throws {Error} If the variable is not defined.
     */
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

    resolve(name) {
        if (this.variables.has(name)) {
            return this;
        }

        if (this.parent) {
            return this.parent.resolve(name);
        }

        return null;
    }
}

/**
 * Represents a function in the LuaScript runtime.
 */
class LuaScriptFunction {
    /**
     * Creates an instance of a LuaScriptFunction.
     * @param {object} declaration - The AST node for the function declaration or expression.
     * @param {Environment} closure - The environment in which the function was created.
     * @param {boolean} [isArrow=false] - Whether the function is an arrow function.
     */
    constructor(declaration, closure, isArrow = false) {
        this.declaration = declaration;
        this.closure = closure;
        this.isArrow = isArrow;
        this.name = isArrow ? '<arrow>' : (declaration.id ? declaration.id.name : '<anonymous>');
    }

    /**
     * Calls the function with the given arguments.
     * @param {Interpreter} interpreter - The interpreter instance.
     * @param {any[]} args - The arguments to pass to the function.
     * @returns {*} The return value of the function.
     */
    call(interpreter, args) {
        const environment = new Environment(this.closure);
        
        // Bind parameters
        const params = this.declaration.params || [];
        for (let i = 0; i < params.length; i++) {
            const param = params[i];
            const value = i < args.length ? args[i] : null;
            environment.define(param.name, value);
            interpreter.trackStringAllocation(environment, param.name, value);
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
            interpreter.cleanupEnvironmentStrings(environment);
        }
        
        return null;
    }
}

/**
 * A custom error class used for handling return values during interpretation.
 * This allows for unwinding the call stack without using actual exceptions for control flow.
 */
class ReturnValue extends Error {
    constructor(value) {
        super();
        this.value = value;
    }
}

/**
 * The main interpreter class that executes the AST.
 */
class Interpreter {
    constructor() {
        this.globals = new Environment();
        this.environment = this.globals;
        this.runtimeMemory = new RuntimeMemoryManager();
        this.stringAllocations = new WeakMap();
        
        // Define built-in functions
        this.defineBuiltins();
    }

    /**
     * Defines built-in functions available in the global environment.
     * @private
     */
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

    /**
     * Interprets an array of statements.
     * @param {object[]} statements - The array of AST statement nodes to interpret.
     * @returns {*} The result of the interpretation.
     */
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
            this.stringAllocations = new WeakMap();
        }
    }

    /**
     * Executes a single statement.
     * @param {object} statement - The statement node to execute.
     * @returns {*} The result of the execution.
     * @private
     */
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

    /**
     * Evaluates a single expression.
     * @param {object} expression - The expression node to evaluate.
     * @param {Environment} [env=this.environment] - The environment in which to evaluate the expression.
     * @returns {*} The result of the evaluation.
     * @private
     */
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

    /**
     * Evaluates a binary expression.
     * @param {object} expression - The binary expression node.
     * @returns {*} The result of the binary operation.
     * @private
     */
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

    /**
     * Evaluates a unary expression.
     * @param {object} expression - The unary expression node.
     * @returns {*} The result of the unary operation.
     * @private
     */
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

    /**
     * Evaluates an assignment expression.
     * @param {object} expression - The assignment expression node.
     * @returns {*} The assigned value.
     * @private
     */
    evaluateAssignmentExpression(expression) {
        const value = this.evaluate(expression.right);
        
        if (expression.left.type === 'Identifier') {
            const targetEnv = this.environment.resolve(expression.left.name);
            if (!targetEnv) {
                throw new Error(`Undefined variable '${expression.left.name}'`);
            }
            targetEnv.set(expression.left.name, value);
            this.trackStringAllocation(targetEnv, expression.left.name, value);
            return value;
        }
        
        throw new Error('Invalid assignment target');
    }

    /**
     * Evaluates a call expression.
     * @param {object} expression - The call expression node.
     * @returns {*} The result of the function call.
     * @private
     */
    evaluateCallExpression(expression) {
        const callee = this.evaluate(expression.callee);
        const args = expression.arguments.map(arg => this.evaluate(arg));
        
        if (!callee || typeof callee.call !== 'function') {
            throw new Error('Not a function');
        }
        
        return callee.call(this, args);
    }

    /**
     * Evaluates an arrow function expression.
     * @param {object} expression - The arrow function expression node.
     * @returns {object} A callable function object.
     * @private
     */
    evaluateArrowFunction(expression) {
        const func = this.runtimeMemory.allocateObject(
            new LuaScriptFunction(expression, this.environment, true)
        );
        
        return {
            call: (interpreter, args) => func.call(interpreter, args)
        };
    }

    /**
     * Executes a variable declaration statement.
     * @param {object} statement - The variable declaration node.
     * @private
     */
    executeVariableDeclaration(statement) {
        for (const declaration of statement.declarations) {
            const value = declaration.init ? this.evaluate(declaration.init) : null;
            this.environment.define(declaration.id.name, value);
            this.trackStringAllocation(this.environment, declaration.id.name, value);
        }
    }

    /**
     * Executes a function declaration statement.
     * @param {object} statement - The function declaration node.
     * @private
     */
    executeFunctionDeclaration(statement) {
        const func = this.runtimeMemory.allocateObject(
            new LuaScriptFunction(statement, this.environment, false)
        );
        
        this.environment.define(statement.id.name, {
            call: (interpreter, args) => func.call(interpreter, args)
        });
    }

    /**
     * Executes a block statement.
     * @param {object} statement - The block statement node.
     * @private
     */
    executeBlockStatement(statement) {
        this.executeBlock(statement.body, new Environment(this.environment));
    }

    /**
     * Executes a block of statements in a new environment.
     * @param {object[]} statements - The array of statements to execute.
     * @param {Environment} environment - The environment for the block.
     * @private
     */
    executeBlock(statements, environment) {
        const previous = this.environment;
        
        try {
            this.environment = environment;
            
            for (const statement of statements) {
                this.execute(statement);
            }
        } finally {
            this.environment = previous;
            this.cleanupEnvironmentStrings(environment);
        }
    }

    /**
     * Executes an if statement.
     * @param {object} statement - The if statement node.
     * @private
     */
    executeIfStatement(statement) {
        const condition = this.evaluate(statement.test);
        
        if (this.isTruthy(condition)) {
            this.execute(statement.consequent);
        } else if (statement.alternate) {
            this.execute(statement.alternate);
        }
    }

    /**
     * Executes a while statement.
     * @param {object} statement - The while statement node.
     * @private
     */
    executeWhileStatement(statement) {
        while (this.isTruthy(this.evaluate(statement.test))) {
            this.execute(statement.body);
        }
    }

    /**
     * Executes a return statement.
     * @param {object} statement - The return statement node.
     * @private
     * @throws {ReturnValue} Throws a ReturnValue to unwind the stack.
     */
    executeReturnStatement(statement) {
        const value = statement.argument ? this.evaluate(statement.argument) : null;
        throw new ReturnValue(value);
    }

    /**
     * Checks if a value is truthy according to JavaScript rules.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is truthy.
     * @private
     */
    isTruthy(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'boolean') return value;
        return true;
    }

    /**
     * Converts a value to its string representation.
     * @param {*} value - The value to stringify.
     * @returns {string} The string representation of the value.
     * @private
     */
    stringify(value) {
        if (value === null || value === undefined) return 'nil';
        if (typeof value === 'string') return value;
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        return String(value);
    }

    /**
     * Gets the current memory statistics from the memory manager.
     * @returns {object} The memory statistics.
     */
    getMemoryStats() {
        return this.runtimeMemory.getStats();
    }

    trackStringAllocation(environment, name, value) {
        if (!environment) {
            return;
        }

        const allocations = this.stringAllocations.get(environment) || new Map();
        const previousSize = allocations.get(name) || 0;
        const newSize = typeof value === 'string' ? Buffer.byteLength(value, 'utf8') : 0;
        const delta = newSize - previousSize;

        if (delta !== 0) {
            this.runtimeMemory.adjustHeap(delta);
        }

        if (newSize > 0) {
            allocations.set(name, newSize);
            this.stringAllocations.set(environment, allocations);
        } else if (previousSize > 0) {
            allocations.delete(name);
            if (allocations.size === 0) {
                this.stringAllocations.delete(environment);
            } else {
                this.stringAllocations.set(environment, allocations);
            }
        }
    }

    cleanupEnvironmentStrings(environment) {
        if (!environment) {
            return;
        }

        const allocations = this.stringAllocations.get(environment);
        if (!allocations || allocations.size === 0) {
            return;
        }

        let totalSize = 0;
        for (const size of allocations.values()) {
            totalSize += size;
        }

        if (totalSize !== 0) {
            this.runtimeMemory.adjustHeap(-totalSize);
        }

        this.stringAllocations.delete(environment);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Interpreter, Environment, LuaScriptFunction, RuntimeMemoryManager };
}

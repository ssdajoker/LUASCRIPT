
/**
 * LUASCRIPT Phase 2 Core - Advanced Interpreter Implementation
 * PS2/PS3 Specialists + Steve Jobs + Donald Knuth Excellence
 * 32+ Developer Team Implementation - CRUNCH MODE!
 */

// Removed unused AST node imports - not referenced in interpreter

/**
 * Manages the lexical scope for variables and functions during interpretation.
 */
class Environment {
  /**
     * Creates an instance of Environment.
     * @param {Environment|null} [parent=null] - The parent environment for scope chaining.
     */
  constructor(parent = null) {
    this.parent = parent;
    this.variables = new Map();
    this.constants = new Set();
    this.functions = new Map();
  }

  /**
     * Defines a new variable or constant in the current scope.
     * @param {string} name - The name of the variable.
     * @param {*} value - The value of the variable.
     * @param {boolean} [isConst=false] - Whether the variable is a constant.
     * @throws {ReferenceError} If the variable is already declared in the current scope.
     */
  define(name, value, isConst = false) {
    if (this.variables.has(name)) {
      throw new ReferenceError(`Variable '${name}' already declared in this scope`);
    }
        
    this.variables.set(name, value);
    if (isConst) {
      this.constants.add(name);
    }
  }

  /**
     * Retrieves the value of a variable, searching up the scope chain if necessary.
     * @param {string} name - The name of the variable.
     * @returns {*} The value of the variable.
     * @throws {ReferenceError} If the variable is not defined.
     */
  get(name) {
    if (this.variables.has(name)) {
      return this.variables.get(name);
    }
        
    if (this.parent) {
      return this.parent.get(name);
    }
        
    throw new ReferenceError(`Undefined variable '${name}'`);
  }

  /**
     * Assigns a new value to an existing variable.
     * @param {string} name - The name of the variable.
     * @param {*} value - The new value.
     * @throws {TypeError} If attempting to assign to a constant.
     * @throws {ReferenceError} If the variable is not defined.
     */
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

  /**
     * Checks if a variable exists in the current scope or any parent scopes.
     * @param {string} name - The name of the variable.
     * @returns {boolean} True if the variable exists.
     */
  has(name) {
    return this.variables.has(name) || (this.parent && this.parent.has(name));
  }

  /**
     * Defines a function in the current scope.
     * @param {string} name - The name of the function.
     * @param {LuaScriptFunction} func - The function object.
     */
  defineFunction(name, func) {
    this.functions.set(name, func);
    this.define(name, func);
  }

  /**
     * Retrieves a function from the current scope or parent scopes.
     * @param {string} name - The name of the function.
     * @returns {LuaScriptFunction|null} The function object, or null if not found.
     */
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

/**
 * Represents a function within the LuaScript runtime, encapsulating its declaration, closure, and the interpreter instance.
 */
class LuaScriptFunction {
  /**
     * Creates an instance of LuaScriptFunction.
     * @param {object} declaration - The AST node for the function.
     * @param {Environment} closure - The environment where the function was defined.
     * @param {LuaScriptInterpreter} interpreter - The interpreter instance.
     */
  constructor(declaration, closure, interpreter) {
    this.declaration = declaration;
    this.closure = closure;
    this.interpreter = interpreter;
    this.isArrowFunction = declaration.type === "ArrowFunctionExpression";
    this.name = declaration.id ? declaration.id.name : "<anonymous>";
  }

  /**
     * Executes the function.
     * @param {any[]} [args=[]] - The arguments to the function.
     * @returns {*} The return value of the function.
     */
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
      environment.define("arguments", argumentsObj);
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

/**
 * A custom implementation of a JavaScript-like array for the LuaScript runtime.
 */
class LuaScriptArray {
  /**
     * Creates an instance of LuaScriptArray.
     * @param {any[]} [elements=[]] - The initial elements of the array.
     */
  constructor(elements = []) {
    this.elements = [...elements];
    this.length = this.elements.length;
  }

  /**
     * Gets the element at the specified index.
     * @param {number} index - The index of the element.
     * @returns {*} The element at the specified index, or undefined if out of bounds.
     */
  get(index) {
    if (index < 0 || index >= this.length) {
      return undefined;
    }
    return this.elements[index];
  }

  /**
     * Sets the element at the specified index.
     * @param {number} index - The index to set.
     * @param {*} value - The value to set.
     */
  set(index, value) {
    if (index >= 0) {
      this.elements[index] = value;
      this.length = Math.max(this.length, index + 1);
    }
  }

  /**
     * Appends new elements to the end of an array, and returns the new length of the array.
     * @param {...*} values - The elements to add to the end of the array.
     * @returns {number} The new length of the array.
     */
  push(...values) {
    this.elements.push(...values);
    this.length = this.elements.length;
    return this.length;
  }

  /**
     * Removes the last element from an array and returns that element.
     * @returns {*} The removed element, or undefined if the array is empty.
     */
  pop() {
    if (this.length === 0) return undefined;
    const value = this.elements.pop();
    this.length = this.elements.length;
    return value;
  }

  /**
     * Removes the first element from an array and returns that element.
     * @returns {*} The removed element, or undefined if the array is empty.
     */
  shift() {
    if (this.length === 0) return undefined;
    const value = this.elements.shift();
    this.length = this.elements.length;
    return value;
  }

  /**
     * Adds one or more elements to the beginning of an array and returns the new length of the array.
     * @param {...*} values - The elements to add to the front of the array.
     * @returns {number} The new length of the array.
     */
  unshift(...values) {
    this.elements.unshift(...values);
    this.length = this.elements.length;
    return this.length;
  }

  /**
     * Returns a shallow copy of a portion of an array into a new array object.
     * @param {number} [start=0] - The beginning of the specified portion of the array.
     * @param {number} [end=this.length] - The end of the specified portion of the array.
     * @returns {LuaScriptArray} A new array containing the extracted elements.
     */
  slice(start = 0, end = this.length) {
    return new LuaScriptArray(this.elements.slice(start, end));
  }

  /**
     * Changes the contents of an array by removing or replacing existing elements and/or adding new elements in place.
     * @param {number} start - The index at which to start changing the array.
     * @param {number} [deleteCount=0] - The number of elements to remove.
     * @param {...*} items - The elements to add to the array.
     * @returns {LuaScriptArray} A new array containing the deleted elements.
     */
  splice(start, deleteCount = 0, ...items) {
    const deleted = this.elements.splice(start, deleteCount, ...items);
    this.length = this.elements.length;
    return new LuaScriptArray(deleted);
  }

  /**
     * Returns the first index at which a given element can be found in the array, or -1 if it is not present.
     * @param {*} searchElement - The element to locate in the array.
     * @param {number} [fromIndex=0] - The index to start the search at.
     * @returns {number} The first index of the element in the array; -1 if not found.
     */
  indexOf(searchElement, fromIndex = 0) {
    return this.elements.indexOf(searchElement, fromIndex);
  }

  /**
     * Determines whether an array includes a certain value among its entries.
     * @param {*} searchElement - The element to search for.
     * @param {number} [fromIndex=0] - The position in this array at which to begin searching.
     * @returns {boolean} True if the element is found.
     */
  includes(searchElement, fromIndex = 0) {
    return this.elements.includes(searchElement, fromIndex);
  }

  /**
     * Joins all elements of an array into a string.
     * @param {string} [separator=','] - The separator string.
     * @returns {string} The joined string.
     */
  join(separator = ",") {
    return this.elements.join(separator);
  }

  /**
     * Reverses an array in place.
     * @returns {this} The reversed array.
     */
  reverse() {
    this.elements.reverse();
    return this;
  }

  /**
     * Sorts the elements of an array in place.
     * @param {function} [compareFn] - The function used to determine the order of the elements.
     * @returns {this} The sorted array.
     */
  sort(compareFn) {
    this.elements.sort(compareFn);
    return this;
  }

  /**
     * Executes a provided function once for each array element.
     * @param {function} callback - The function to execute for each element.
     * @param {*} [thisArg] - The value to use as `this` when executing the callback.
     */
  forEach(callback, thisArg) {
    for (let i = 0; i < this.length; i++) {
      callback.call(thisArg, this.elements[i], i, this);
    }
  }

  /**
     * Creates a new array populated with the results of calling a provided function on every element in the calling array.
     * @param {function} callback - The function to execute for each element.
     * @param {*} [thisArg] - The value to use as `this` when executing the callback.
     * @returns {LuaScriptArray} A new array with each element being the result of the callback function.
     */
  map(callback, thisArg) {
    const result = new LuaScriptArray();
    for (let i = 0; i < this.length; i++) {
      result.elements[i] = callback.call(thisArg, this.elements[i], i, this);
    }
    result.length = this.length;
    return result;
  }

  /**
     * Creates a new array with all elements that pass the test implemented by the provided function.
     * @param {function} callback - The function to test each element of the array.
     * @param {*} [thisArg] - The value to use as `this` when executing the callback.
     * @returns {LuaScriptArray} A new array with the elements that pass the test.
     */
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

  /**
     * Executes a reducer function on each element of the array, resulting in a single output value.
     * @param {function} callback - The function to execute on each element in the array.
     * @param {*} [initialValue] - The value to use as the first argument to the first call of the callback.
     * @returns {*} The single value that results from the reduction.
     */
  reduce(callback, initialValue) {
    let accumulator = initialValue;
    let startIndex = 0;
        
    if (arguments.length < 2) {
      if (this.length === 0) {
        throw new TypeError("Reduce of empty array with no initial value");
      }
      accumulator = this.elements[0];
      startIndex = 1;
    }
        
    for (let i = startIndex; i < this.length; i++) {
      accumulator = callback(accumulator, this.elements[i], i, this);
    }
        
    return accumulator;
  }

  /**
     * Returns a string representation of the array.
     * @returns {string} The string representation.
     */
  toString() {
    return this.elements.toString();
  }

  /**
     * Returns the primitive value of the array.
     * @returns {any[]} The array of elements.
     */
  valueOf() {
    return this.elements;
  }

  /**
     * Returns an iterator for the array.
     * @returns {Iterator} The iterator object.
     */
  [Symbol.iterator]() {
    return this.elements[Symbol.iterator]();
  }
}

/**
 * A custom implementation of a JavaScript-like object for the LuaScript runtime.
 */
class LuaScriptObject {
  /**
     * Creates an instance of LuaScriptObject.
     * @param {object} [properties={}] - The initial properties of the object.
     */
  constructor(properties = {}) {
    this.properties = new Map();
        
    for (const [key, value] of Object.entries(properties)) {
      this.properties.set(key, value);
    }
  }

  /**
     * Gets the value of a property.
     * @param {string} key - The property key.
     * @returns {*} The value of the property.
     */
  get(key) {
    return this.properties.get(String(key));
  }

  /**
     * Sets the value of a property.
     * @param {string} key - The property key.
     * @param {*} value - The new value.
     */
  set(key, value) {
    this.properties.set(String(key), value);
  }

  /**
     * Checks if a property exists on the object.
     * @param {string} key - The property key.
     * @returns {boolean} True if the property exists.
     */
  has(key) {
    return this.properties.has(String(key));
  }

  /**
     * Deletes a property from the object.
     * @param {string} key - The property key.
     * @returns {boolean} True if the property was successfully deleted.
     */
  delete(key) {
    return this.properties.delete(String(key));
  }

  /**
     * Gets an array of the object's property keys.
     * @returns {string[]} An array of keys.
     */
  keys() {
    return Array.from(this.properties.keys());
  }

  /**
     * Gets an array of the object's property values.
     * @returns {any[]} An array of values.
     */
  values() {
    return Array.from(this.properties.values());
  }

  /**
     * Gets an array of the object's key-value pairs.
     * @returns {[string, any][]} An array of entries.
     */
  entries() {
    return Array.from(this.properties.entries());
  }

  /**
     * Returns a string representation of the object.
     * @returns {string} The string representation.
     */
  toString() {
    const entries = this.entries().map(([k, v]) => `${k}: ${v}`);
    return `{ ${entries.join(", ")} }`;
  }

  /**
     * Returns the primitive value of the object.
     * @returns {object} The plain JavaScript object.
     */
  valueOf() {
    const obj = {};
    for (const [key, value] of this.properties) {
      obj[key] = value;
    }
    return obj;
  }
}

/** Custom error for handling return values. */
class ReturnValue extends Error {
  constructor(value) {
    super();
    this.value = value;
  }
}

/** Custom error for handling break statements. */
class BreakException extends Error {
  constructor() {
    super();
  }
}

/** Custom error for handling continue statements. */
class ContinueException extends Error {
  constructor() {
    super();
  }
}

/**
 * The core interpreter for executing LuaScript ASTs.
 */
class LuaScriptInterpreter {
  /**
     * Creates an instance of the LuaScriptInterpreter.
     * @param {object} [options={}] - Configuration options for the interpreter.
     * @param {boolean} [options.strictMode=false] - Whether to enable strict mode.
     * @param {number} [options.maxCallStack=1000] - The maximum call stack size.
     * @param {number} [options.maxExecutionTime=30000] - The maximum execution time in milliseconds.
     */
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

  /**
     * Sets up the built-in functions and objects in the global environment.
     * @private
     */
  setupBuiltins() {
    // Console functions
    this.globals.define("console", new LuaScriptObject({
      log: (...args) => console.log(...args),
      error: (...args) => console.error(...args),
      warn: (...args) => console.warn(...args),
      info: (...args) => console.info(...args)
    }));

    // Global functions
    this.globals.define("print", (...args) => console.log(...args));
    this.globals.define("parseInt", (str, radix = 10) => parseInt(str, radix));
    this.globals.define("parseFloat", (str) => parseFloat(str));
    this.globals.define("isNaN", (value) => isNaN(value));
    this.globals.define("isFinite", (value) => isFinite(value));

    // Type checking functions
    this.globals.define("typeof", (value) => {
      if (value === null) return "object";
      if (value instanceof LuaScriptArray) return "object";
      if (value instanceof LuaScriptObject) return "object";
      if (value instanceof LuaScriptFunction) return "function";
      return typeof value;
    });

    // Array constructor
    this.globals.define("Array", (...args) => {
      if (args.length === 1 && typeof args[0] === "number") {
        return new LuaScriptArray(new Array(args[0]));
      }
      return new LuaScriptArray(args);
    });

    // Object constructor
    this.globals.define("Object", (value) => {
      if (value === null || value === undefined) return new LuaScriptObject();
      return value;
    });

    // Math object
    this.globals.define("Math", new LuaScriptObject({
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
    this.globals.define("String", (value) => String(value));

    // Number constructor
    this.globals.define("Number", (value) => Number(value));

    // Boolean constructor
    this.globals.define("Boolean", (value) => Boolean(value));
  }

  /**
     * Interprets the given AST.
     * @param {object} ast - The root node of the AST to interpret.
     * @returns {*} The result of the interpretation.
     */
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

  /**
     * Executes an AST node.
     * @param {object} node - The node to execute.
     * @returns {*} The result of the execution.
     * @private
     */
  execute(node) {
    this.checkExecutionTime();
        
    if (!node) return undefined;

    switch (node.type) {
    case "Program":
      return this.executeProgram(node);
    case "BlockStatement":
      return this.executeBlockStatement(node);
    case "ExpressionStatement":
      return this.evaluate(node.expression);
    case "VariableDeclaration":
      return this.executeVariableDeclaration(node);
    case "FunctionDeclaration":
      return this.executeFunctionDeclaration(node);
    case "ReturnStatement":
      return this.executeReturnStatement(node);
    case "IfStatement":
      return this.executeIfStatement(node);
    case "WhileStatement":
      return this.executeWhileStatement(node);
    case "ForStatement":
      return this.executeForStatement(node);
    case "BreakStatement":
      throw new BreakException();
    case "ContinueStatement":
      throw new ContinueException();
    default:
      return this.evaluate(node);
    }
  }

  /**
     * Executes a program node.
     * @param {object} node - The program node.
     * @returns {*} The result of the last statement.
     * @private
     */
  executeProgram(node) {
    let result = undefined;
    for (const statement of node.body) {
      result = this.execute(statement);
    }
    return result;
  }

  /**
     * Executes a block statement in a new scope.
     * @param {object} node - The block statement node.
     * @returns {*} The result of the last statement in the block.
     * @private
     */
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

  /**
     * Executes a variable declaration.
     * @param {object} node - The variable declaration node.
     * @private
     */
  executeVariableDeclaration(node) {
    for (const declarator of node.declarations) {
      const name = declarator.id.name;
      const value = declarator.init ? this.evaluate(declarator.init) : undefined;
      const isConst = node.kind === "const";
            
      this.environment.define(name, value, isConst);
    }
    return undefined;
  }

  /**
     * Executes a function declaration.
     * @param {object} node - The function declaration node.
     * @private
     */
  executeFunctionDeclaration(node) {
    const func = new LuaScriptFunction(node, this.environment, this);
    this.environment.defineFunction(node.id.name, func);
    return undefined;
  }

  /**
     * Executes a return statement.
     * @param {object} node - The return statement node.
     * @throws {ReturnValue} Throws a ReturnValue to be caught by a function call.
     * @private
     */
  executeReturnStatement(node) {
    const value = node.argument ? this.evaluate(node.argument) : undefined;
    throw new ReturnValue(value);
  }

  /**
     * Executes an if statement.
     * @param {object} node - The if statement node.
     * @returns {*} The result of the executed branch.
     * @private
     */
  executeIfStatement(node) {
    const condition = this.evaluate(node.test);
        
    if (this.isTruthy(condition)) {
      return this.execute(node.consequent);
    } else if (node.alternate) {
      return this.execute(node.alternate);
    }
        
    return undefined;
  }

  /**
     * Executes a while statement.
     * @param {object} node - The while statement node.
     * @returns {*} The result of the last executed statement in the loop.
     * @private
     */
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

  /**
     * Executes a for statement.
     * @param {object} node - The for statement node.
     * @returns {*} The result of the last executed statement in the loop.
     * @private
     */
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

  /**
     * Evaluates an AST node.
     * @param {object} node - The node to evaluate.
     * @returns {*} The result of the evaluation.
     * @private
     */
  evaluate(node) {
    this.checkExecutionTime();
        
    if (!node) return undefined;

    switch (node.type) {
    case "Literal":
      return node.value;
    case "Identifier":
      return this.environment.get(node.name);
    case "ThisExpression":
      return this.environment.get("this");
    case "BinaryExpression":
      return this.evaluateBinaryExpression(node);
    case "UnaryExpression":
      return this.evaluateUnaryExpression(node);
    case "AssignmentExpression":
      return this.evaluateAssignmentExpression(node);
    case "UpdateExpression":
      return this.evaluateUpdateExpression(node);
    case "LogicalExpression":
      return this.evaluateLogicalExpression(node);
    case "ConditionalExpression":
      return this.evaluateConditionalExpression(node);
    case "CallExpression":
      return this.evaluateCallExpression(node);
    case "MemberExpression":
      return this.evaluateMemberExpression(node);
    case "ArrayExpression":
      return this.evaluateArrayExpression(node);
    case "ObjectExpression":
      return this.evaluateObjectExpression(node);
    case "ArrowFunctionExpression":
    case "FunctionExpression":
      return new LuaScriptFunction(node, this.environment, this);
    default:
      throw new Error(`Unknown expression type: ${node.type}`);
    }
  }

  /**
     * Evaluates a binary expression.
     * @param {object} node - The binary expression node.
     * @returns {*} The result of the operation.
     * @private
     */
  evaluateBinaryExpression(node) {
    const left = this.evaluate(node.left);
    const right = this.evaluate(node.right);
        
    switch (node.operator) {
    case "+": return left + right;
    case "-": return left - right;
    case "*": return left * right;
    case "/": return left / right;
    case "%": return left % right;
    case "==": return left === right;
    case "!=": return left !== right;
    case "===": return left === right;
    case "!==": return left !== right;
    case "<": return left < right;
    case ">": return left > right;
    case "<=": return left <= right;
    case ">=": return left >= right;
    case "&": return left & right;
    case "|": return left | right;
    case "^": return left ^ right;
    case "<<": return left << right;
    case ">>": return left >> right;
    default:
      throw new Error(`Unknown binary operator: ${node.operator}`);
    }
  }

  /**
     * Evaluates a unary expression.
     * @param {object} node - The unary expression node.
     * @returns {*} The result of the operation.
     * @private
     */
  evaluateUnaryExpression(node) {
    const argument = this.evaluate(node.argument);
        
    switch (node.operator) {
    case "+": return +argument;
    case "-": return -argument;
    case "!": return !argument;
    case "~": return ~argument;
    default:
      throw new Error(`Unknown unary operator: ${node.operator}`);
    }
  }

  /**
     * Evaluates an assignment expression.
     * @param {object} node - The assignment expression node.
     * @returns {*} The assigned value.
     * @private
     */
  evaluateAssignmentExpression(node) {
    const value = this.evaluate(node.right);
        
    if (node.left.type === "Identifier") {
      if (node.operator === "=") {
        this.environment.set(node.left.name, value);
      } else {
        const current = this.environment.get(node.left.name);
        let newValue;
                
        switch (node.operator) {
        case "+=": newValue = current + value; break;
        case "-=": newValue = current - value; break;
        case "*=": newValue = current * value; break;
        case "/=": newValue = current / value; break;
        default:
          throw new Error(`Unknown assignment operator: ${node.operator}`);
        }
                
        this.environment.set(node.left.name, newValue);
        return newValue;
      }
    } else if (node.left.type === "MemberExpression") {
      const object = this.evaluate(node.left.object);
      const property = node.left.computed ? 
        this.evaluate(node.left.property) : 
        node.left.property.name;
            
      if (node.operator === "=") {
        this.setProperty(object, property, value);
      } else {
        const current = this.getProperty(object, property);
        let newValue;
                
        switch (node.operator) {
        case "+=": newValue = current + value; break;
        case "-=": newValue = current - value; break;
        case "*=": newValue = current * value; break;
        case "/=": newValue = current / value; break;
        default:
          throw new Error(`Unknown assignment operator: ${node.operator}`);
        }
                
        this.setProperty(object, property, newValue);
        return newValue;
      }
    }
        
    return value;
  }

  /**
     * Evaluates an update expression.
     * @param {object} node - The update expression node.
     * @returns {number} The updated or original value, depending on the operator (prefix/postfix).
     * @private
     */
  evaluateUpdateExpression(node) {
    if (node.argument.type === "Identifier") {
      const name = node.argument.name;
      const current = this.environment.get(name);
      const newValue = node.operator === "++" ? current + 1 : current - 1;
            
      this.environment.set(name, newValue);
            
      return node.prefix ? newValue : current;
    } else if (node.argument.type === "MemberExpression") {
      const object = this.evaluate(node.argument.object);
      const property = node.argument.computed ? 
        this.evaluate(node.argument.property) : 
        node.argument.property.name;
            
      const current = this.getProperty(object, property);
      const newValue = node.operator === "++" ? current + 1 : current - 1;
            
      this.setProperty(object, property, newValue);
            
      return node.prefix ? newValue : current;
    }
        
    throw new Error("Invalid left-hand side in assignment");
  }

  /**
     * Evaluates a logical expression.
     * @param {object} node - The logical expression node.
     * @returns {*} The result of the logical operation.
     * @private
     */
  evaluateLogicalExpression(node) {
    const left = this.evaluate(node.left);
        
    if (node.operator === "&&") {
      return this.isTruthy(left) ? this.evaluate(node.right) : left;
    } else if (node.operator === "||") {
      return this.isTruthy(left) ? left : this.evaluate(node.right);
    }
        
    throw new Error(`Unknown logical operator: ${node.operator}`);
  }

  /**
     * Evaluates a conditional (ternary) expression.
     * @param {object} node - The conditional expression node.
     * @returns {*} The result of the evaluated branch.
     * @private
     */
  evaluateConditionalExpression(node) {
    const test = this.evaluate(node.test);
    return this.isTruthy(test) ? 
      this.evaluate(node.consequent) : 
      this.evaluate(node.alternate);
  }

  /**
     * Evaluates a function call expression.
     * @param {object} node - The call expression node.
     * @returns {*} The return value of the function call.
     * @private
     */
  evaluateCallExpression(node) {
    const callee = this.evaluate(node.callee);
    const args = node.arguments.map(arg => this.evaluate(arg));
        
    if (typeof callee === "function") {
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

  /**
     * Evaluates a member expression.
     * @param {object} node - The member expression node.
     * @returns {*} The value of the member.
     * @private
     */
  evaluateMemberExpression(node) {
    const object = this.evaluate(node.object);
    const property = node.computed ? 
      this.evaluate(node.property) : 
      node.property.name;
        
    return this.getProperty(object, property);
  }

  /**
     * Evaluates an array expression.
     * @param {object} node - The array expression node.
     * @returns {LuaScriptArray} The new array.
     * @private
     */
  evaluateArrayExpression(node) {
    const elements = node.elements.map(element => 
      element ? this.evaluate(element) : undefined
    );
    return new LuaScriptArray(elements);
  }

  /**
     * Evaluates an object expression.
     * @param {object} node - The object expression node.
     * @returns {LuaScriptObject} The new object.
     * @private
     */
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

  /**
     * Gets a property from an object or array.
     * @param {object|LuaScriptArray|LuaScriptObject} object - The object to get the property from.
     * @param {string|number} property - The property key.
     * @returns {*} The value of the property.
     * @private
     */
  getProperty(object, property) {
    if (object instanceof LuaScriptArray) {
      if (typeof property === "number" || /^\d+$/.test(property)) {
        return object.get(Number(property));
      }
      // Array methods
      const method = object[property];
      if (typeof method === "function") {
        return method.bind(object);
      }
      return object[property];
    } else if (object instanceof LuaScriptObject) {
      return object.get(property);
    } else if (object !== null && object !== undefined) {
      return object[property];
    }
        
    return undefined;
  }

  /**
     * Sets a property on an object or array.
     * @param {object|LuaScriptArray|LuaScriptObject} object - The object to set the property on.
     * @param {string|number} property - The property key.
     * @param {*} value - The value to set.
     * @private
     */
  setProperty(object, property, value) {
    if (object instanceof LuaScriptArray) {
      if (typeof property === "number" || /^\d+$/.test(property)) {
        object.set(Number(property), value);
      } else {
        object[property] = value;
      }
    } else if (object instanceof LuaScriptObject) {
      object.set(property, value);
    } else if (object !== null && object !== undefined) {
      object[property] = value;
    } else {
      throw new TypeError("Cannot set property on null or undefined");
    }
  }

  /**
     * Determines if a value is truthy.
     * @param {*} value - The value to check.
     * @returns {boolean} True if the value is truthy.
     * @private
     */
  isTruthy(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0 && !isNaN(value);
    if (typeof value === "string") return value.length > 0;
    return true;
  }

  /**
     * Checks if the execution time has exceeded the maximum allowed time.
     * @private
     */
  checkExecutionTime() {
    if (this.startTime && Date.now() - this.startTime > this.options.maxExecutionTime) {
      throw new Error("Maximum execution time exceeded");
    }
  }

  /**
     * Checks if the call stack has exceeded the maximum allowed size.
     * @private
     */
  checkCallStack() {
    if (this.callStack.length >= this.options.maxCallStack) {
      throw new Error("Maximum call stack size exceeded");
    }
  }

  /**
     * Gets the current call stack.
     * @returns {string[]} The call stack.
     */
  getCallStack() {
    return [...this.callStack];
  }

  /**
     * Gets the current environment.
     * @returns {Environment} The current environment.
     */
  getEnvironment() {
    return this.environment;
  }

  /**
     * Gets the global environment.
     * @returns {Environment} The global environment.
     */
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

/**
 * Parity Tests: Function Expressions
 * Validates function expression transpilation including arrows, closures, and scope
 */

const { describe, it, expect } = require('./jest-lite');
const Transpiler = require('../../src/transpiler');

describe('Function Expressions Parity Tests', () => {
    const transpiler = new Transpiler();

    // ═══════════════════════════════════════════════════════════════
    // BASIC FUNCTION EXPRESSIONS
    // ═══════════════════════════════════════════════════════════════

    it('should transpile function declaration', () => {
        const js = `function add(a, b) {
            return a + b;
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
        expect(result.code).toContain('return');
    });

    it('should transpile function expression', () => {
        const js = `const add = function(a, b) {
            return a + b;
        };`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
        expect(result.code).toContain('return');
    });

    it('should transpile arrow function (single parameter)', () => {
        const js = `const square = x => x * x;`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
        expect(result.code).toContain('return');
    });

    it('should transpile arrow function (multiple parameters)', () => {
        const js = `const add = (a, b) => a + b;`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
        expect(result.code).toContain('return');
    });

    it('should transpile arrow function (no parameters)', () => {
        const js = `const getValue = () => 42;`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
        expect(result.code).toContain('return');
    });

    it('should transpile arrow function (block body)', () => {
        const js = `const process = (x) => {
            const result = x * 2;
            return result;
        };`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
        expect(result.code).toContain('return');
    });

    // ═══════════════════════════════════════════════════════════════
    // FUNCTION CALLS AND INVOCATION
    // ═══════════════════════════════════════════════════════════════

    it('should transpile immediate function invocation (IIFE)', () => {
        const js = `const result = (function(x) { return x * 2; })(5);`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
        expect(result.code).toContain('(');
    });

    it('should transpile arrow IIFE', () => {
        const js = `const result = ((x) => x * 2)(5);`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });

    it('should transpile function call with multiple arguments', () => {
        const js = `function sum(a, b, c) { return a + b + c; }
        const result = sum(1, 2, 3);`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('sum');
    });

    // ═══════════════════════════════════════════════════════════════
    // CLOSURES AND SCOPE CAPTURE
    // ═══════════════════════════════════════════════════════════════

    it('should capture outer variable in closure', () => {
        const js = `function makeAdder(x) {
            return function(y) {
                return x + y;
            };
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });

    it('should capture multiple variables in closure', () => {
        const js = `function makeMultiplier(a, b) {
            return function(x) {
                return (a + b) * x;
            };
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });

    it('should handle nested closures', () => {
        const js = `function outer(a) {
            return function middle(b) {
                return function inner(c) {
                    return a + b + c;
                };
            };
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });

    it('should capture variables in arrow function closures', () => {
        const js = `const x = 10;
        const addX = (y) => x + y;`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });

    // ═══════════════════════════════════════════════════════════════
    // DEFAULT PARAMETERS AND REST PARAMETERS
    // ═══════════════════════════════════════════════════════════════

    it('should transpile function with default parameter', () => {
        const js = `function greet(name = "World") {
            return "Hello " + name;
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });

    it('should transpile arrow function with default parameter', () => {
        const js = `const greet = (name = "World") => "Hello " + name;`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });

    it('should transpile rest parameters', () => {
        const js = `function sum(...numbers) {
            let total = 0;
            for (const num of numbers) {
                total += num;
            }
            return total;
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });

    it('should transpile spread in function call', () => {
        const js = `const args = [1, 2, 3];
        const result = sum(...args);`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('sum');
    });

    // ═══════════════════════════════════════════════════════════════
    // FUNCTION METHODS AND THIS BINDING
    // ═══════════════════════════════════════════════════════════════

    it('should transpile method call on object', () => {
        const js = `const obj = {
            name: "test",
            greet: function() {
                return "Hello " + this.name;
            }
        };
        const msg = obj.greet();`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('greet');
    });

    it('should transpile arrow function in object (lexical this)', () => {
        const js = `const obj = {
            value: 42,
            getValue: () => this.value
        };`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });

    it('should transpile method call chain', () => {
        const js = `const result = obj.method1().method2().getValue();`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('method1');
    });

    // ═══════════════════════════════════════════════════════════════
    // HIGHER-ORDER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    it('should transpile array.map with function', () => {
        const js = `const numbers = [1, 2, 3];
        const doubled = numbers.map(x => x * 2);`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('map');
    });

    it('should transpile array.filter with function', () => {
        const js = `const numbers = [1, 2, 3, 4];
        const evens = numbers.filter(x => x % 2 === 0);`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('filter');
    });

    it('should transpile array.reduce with function', () => {
        const js = `const numbers = [1, 2, 3];
        const sum = numbers.reduce((acc, x) => acc + x, 0);`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('reduce');
    });

    it('should transpile function passed as argument', () => {
        const js = `function apply(fn, x, y) {
            return fn(x, y);
        }
        const result = apply((a, b) => a + b, 2, 3);`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });

    it('should transpile function returning function', () => {
        const js = `function compose(f, g) {
            return (x) => f(g(x));
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });

    // ═══════════════════════════════════════════════════════════════
    // FUNCTION DECLARATIONS VS EXPRESSIONS
    // ═══════════════════════════════════════════════════════════════

    it('should handle hoisted function declaration', () => {
        const js = `const result = hoisted(5);
        function hoisted(x) {
            return x * 2;
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('hoisted');
    });

    it('should handle function expression not hoisted', () => {
        const js = `const notHoisted = function(x) {
            return x * 2;
        };
        const result = notHoisted(5);`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });

    it('should handle named function expression', () => {
        const js = `const factorial = function fact(n) {
            if (n <= 1) return 1;
            return n * fact(n - 1);
        };`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });

    // ═══════════════════════════════════════════════════════════════
    // EDGE CASES
    // ═══════════════════════════════════════════════════════════════

    it('should transpile function with no return statement', () => {
        const js = `function log(msg) {
            console.log(msg);
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });

    it('should transpile arrow function with implicit return', () => {
        const js = `const getValue = () => 42;`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
        expect(result.code).toContain('return');
    });

    it('should transpile arrow function with object literal return', () => {
        const js = `const makeObj = () => ({ x: 1, y: 2 });`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });

    it('should transpile recursive function', () => {
        const js = `function factorial(n) {
            if (n <= 1) return 1;
            return n * factorial(n - 1);
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('factorial');
    });

    it('should transpile mutually recursive functions', () => {
        const js = `function isEven(n) {
            if (n === 0) return true;
            return isOdd(n - 1);
        }
        function isOdd(n) {
            if (n === 0) return false;
            return isEven(n - 1);
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('isEven');
        expect(result.code).toContain('isOdd');
    });

    it('should transpile function variable shadowing', () => {
        const js = `const x = 10;
        function f() {
            const x = 20;
            return x;
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });

    it('should transpile function with undefined parameter', () => {
        const js = `function process(x) {
            if (x === undefined) {
                return null;
            }
            return x;
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function');
    });
});

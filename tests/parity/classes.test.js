/**
 * Parity Tests: Classes
 * Validates class transpilation to Lua metatables
 */

const { describe, it, expect } = require('./jest-lite');
const Transpiler = require('../../src/transpiler');

describe('Classes Parity Tests', () => {
    const transpiler = new Transpiler();

    it('should transpile simple class declaration', () => {
        const js = `class Animal {
            constructor(name) {
                this.name = name;
            }
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('local Animal');
        expect(result.code).toContain('__index');
    });

    it('should transpile class with methods', () => {
        const js = `class Dog {
            bark() {
                return "woof";
            }
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function Dog:bark');
    });

    it('should transpile class with static methods', () => {
        const js = `class Utils {
            static helper() {
                return 42;
            }
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('function Utils.helper');
    });

    it('should transpile class with inheritance', () => {
        const js = `class Animal {
            constructor(name) {
                this.name = name;
            }
        }
        
        class Dog extends Animal {
            bark() {
                return "woof";
            }
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('Dog');
        expect(result.code).toContain('Animal');
    });

    it('should transpile super calls', () => {
        const js = `class Dog extends Animal {
            constructor(name, breed) {
                super(name);
                this.breed = breed;
            }
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should transpile class expressions', () => {
        const js = 'const MyClass = class { method() {} };';
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('MyClass');
        expect(result.code).toContain('method');
    });

    it('should handle this binding in methods', () => {
        const js = `class Counter {
            increment() {
                this.count++;
            }
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result.code).toContain('self');
    });

    it('should transpile getters and setters', () => {
        const js = `class Rectangle {
            get area() {
                return this.width * this.height;
            }
            set area(val) {
                this.width = val;
            }
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });

    it('should handle class with multiple methods', () => {
        const js = `class Vector {
            add(v) { return this.x + v.x; }
            subtract(v) { return this.x - v.x; }
            dot(v) { return this.x * v.x; }
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect((result.code.match(/function Vector:/g) || []).length).toBeGreaterEqual(3);
    });

    it('should handle class with properties', () => {
        const js = `class Circle {
            radius = 5;
            constructor(r) {
                this.radius = r;
            }
        }`;
        const result = transpiler.transpile(js, 'test.js');
        expect(result).toBeDefined();
    });
});

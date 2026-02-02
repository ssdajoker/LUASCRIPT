#!/usr/bin/env node
const { describe, it, expect } = require('./tests/parity/jest-lite');
const Transpiler = require('./src/transpiler');

describe('Function Expressions - Failing Tests Only', () => {
    const transpiler = new Transpiler();

    it('should transpile function with default parameter', () => {
        const js = `function greet(name = "World") {
            return "Hello " + name;
        }`;
        const result = transpiler.transpile(js, 'test.js');
        console.log('\n=== DEFAULT PARAM ===');
        console.log('Success:', result.success);
        console.log('Contains function:', result.code.includes('function'));
        console.log('Code snippet:', result.code.substring(0, 200));
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
        console.log('\n=== REST PARAMS ===');
        console.log('Success:', result.success);
        console.log('Contains function:', result.code.includes('function'));
        console.log('Code snippet:', result.code.substring(0, 200));
        expect(result.code).toContain('function');
    });

    it('should transpile spread in function call', () => {
        const js = `const args = [1, 2, 3];
        const result = sum(...args);`;
        const result = transpiler.transpile(js, 'test.js');
        console.log('\n=== SPREAD CALL ===');
        console.log('Success:', result.success);
        console.log('Contains sum:', result.code.includes('sum'));
        console.log('Code snippet:', result.code.substring(0, 200));
        expect(result.code).toContain('sum');
    });
});

require('./tests/parity/jest-lite').run();

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🌟 LUASCRIPT - THE COMPLETE VISION 🌟
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * MISSION: Give JavaScript developers Mojo-like superpowers
 * 
 * THE FIVE PILLARS:
 * 1. 💪 Mojo-Like Superpowers: JavaScript syntax + Native performance + System access
 * 2. 🤖 Self-Building Agentic IDE: AI-powered IDE written in LUASCRIPT for LUASCRIPT
 * 3. 🔢 Balanced Ternary Computing: Revolutionary (-1,0,+1) logic for quantum-ready algorithms
 * 4. 🎨 CSS Evolution: CSS → Gaussian CSS → GSS → AGSS (AI-driven adaptive design)
 * 5. ⚡ Great C Support: Seamless FFI, inline C, full ecosystem access
 * 
 * VISION: "Possibly impossible to achieve but dammit, we're going to try!"
 * 
 * This file is part of the LUASCRIPT revolution - a paradigm shift in programming
 * that bridges JavaScript familiarity with native performance, AI-driven tooling,
 * novel computing paradigms, and revolutionary styling systems.
 * 
 * 📖 Full Vision: See VISION.md, docs/vision_overview.md, docs/architecture_spec.md
 * 🗺️ Roadmap: See docs/roadmap.md
 * 💾 Backup: See docs/redundant/vision_backup.txt
 * ═══════════════════════════════════════════════════════════════════════════════
 */



/**
 * LUASCRIPT Arrow Functions Test Suite - Phase 1D
 * Tests for arrow function parsing and execution
 */

const { Lexer, Parser, MemoryManager } = require('../src/parser.js');
const { Interpreter } = require('../src/runtime.js');

class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async run() {
        console.log('Running Arrow Functions Test Suite...\n');
        
        for (const { name, testFn } of this.tests) {
            try {
                await testFn();
                console.log(`✅ ${name}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ ${name}: ${error.message}`);
                this.failed++;
            }
        }
        
        console.log(`\nTest Results: ${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }

    parseAndExecute(code) {
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        const interpreter = new Interpreter();
        return interpreter.interpret(ast.body);
    }

    assertEqual(actual, expected, message = '') {
        // Clean up the actual output by removing extra whitespace and GC messages
        const cleanActual = String(actual).replace(/GC:.*?\n/g, '').trim();
        const cleanExpected = String(expected).trim();
        
        if (cleanActual !== cleanExpected) {
            throw new Error(`Expected "${cleanExpected}", got "${cleanActual}". ${message}`);
        }
    }

    assertThrows(fn, expectedError = null) {
        try {
            fn();
            throw new Error('Expected function to throw an error');
        } catch (error) {
            if (expectedError && !error.message.includes(expectedError)) {
                throw new Error(`Expected error containing "${expectedError}", got "${error.message}"`);
            }
        }
    }
}

const runner = new TestRunner();

// Basic arrow function parsing tests
runner.test('Parse simple arrow function', () => {
    const code = 'let f = x => x * 2;';
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    const varDecl = ast.body[0];
    runner.assertEqual(varDecl.type, 'VariableDeclaration');
    
    const arrowFunc = varDecl.declarations[0].init;
    runner.assertEqual(arrowFunc.type, 'ArrowFunction');
    runner.assertEqual(arrowFunc.params.length, 1);
    runner.assertEqual(arrowFunc.params[0].name, 'x');
});

runner.test('Parse arrow function with parentheses', () => {
    const code = 'let f = (x) => x * 2;';
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    const arrowFunc = ast.body[0].declarations[0].init;
    runner.assertEqual(arrowFunc.type, 'ArrowFunction');
    runner.assertEqual(arrowFunc.params.length, 1);
});

runner.test('Parse arrow function with multiple parameters', () => {
    const code = 'let f = (x, y) => x + y;';
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    const arrowFunc = ast.body[0].declarations[0].init;
    runner.assertEqual(arrowFunc.type, 'ArrowFunction');
    runner.assertEqual(arrowFunc.params.length, 2);
    runner.assertEqual(arrowFunc.params[0].name, 'x');
    runner.assertEqual(arrowFunc.params[1].name, 'y');
});

runner.test('Parse arrow function with block body', () => {
    const code = 'let f = (x) => { return x * 2; };';
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    const arrowFunc = ast.body[0].declarations[0].init;
    runner.assertEqual(arrowFunc.type, 'ArrowFunction');
    runner.assertEqual(arrowFunc.body.type, 'BlockStatement');
});

// Arrow function execution tests
runner.test('Execute simple arrow function', () => {
    const code = `
        let double = x => x * 2;
        let result = double(5);
        print(result);
    `;
    
    // Capture console output
    let output = '';
    const originalLog = console.log;
    console.log = (msg) => { 
        if (!msg.includes('GC:')) {
            output += msg; 
        }
    };
    
    try {
        runner.parseAndExecute(code);
        runner.assertEqual(output, '10');
    } finally {
        console.log = originalLog;
    }
});

runner.test('Execute arrow function with multiple parameters', () => {
    const code = `
        let add = (x, y) => x + y;
        let result = add(3, 4);
        print(result);
    `;
    
    let output = '';
    const originalLog = console.log;
    console.log = (msg) => { 
        if (!msg.includes('GC:')) {
            output += msg; 
        }
    };
    
    try {
        runner.parseAndExecute(code);
        runner.assertEqual(output, '7');
    } finally {
        console.log = originalLog;
    }
});

runner.test('Execute arrow function with block body', () => {
    const code = `
        let multiply = (x, y) => {
            let result = x * y;
            return result;
        };
        print(multiply(6, 7));
    `;
    
    let output = '';
    const originalLog = console.log;
    console.log = (msg) => { 
        if (!msg.includes('GC:')) {
            output += msg; 
        }
    };
    
    try {
        runner.parseAndExecute(code);
        runner.assertEqual(output, '42');
    } finally {
        console.log = originalLog;
    }
});

runner.test('Arrow function closure test', () => {
    const code = `
        let makeAdder = x => {
            return y => x + y;
        };
        let add5 = makeAdder(5);
        print(add5(3));
    `;
    
    let output = '';
    const originalLog = console.log;
    console.log = (msg) => { 
        if (!msg.includes('GC:')) {
            output += msg; 
        }
    };
    
    try {
        runner.parseAndExecute(code);
        runner.assertEqual(output, '8');
    } finally {
        console.log = originalLog;
    }
});

// Memory management tests
runner.test('Memory manager limits node allocation', () => {
    const memoryManager = new MemoryManager(5, 10); // Very low limits
    
    runner.assertThrows(() => {
        for (let i = 0; i < 10; i++) {
            memoryManager.allocateNode('TestNode');
        }
    }, 'Memory limit exceeded');
});

runner.test('Memory manager limits recursion depth', () => {
    const memoryManager = new MemoryManager(1000, 3); // Very low depth limit
    
    runner.assertThrows(() => {
        for (let i = 0; i < 5; i++) {
            memoryManager.enterScope();
        }
    }, 'Stack overflow');
});

runner.test('Memory manager cleanup works', () => {
    const memoryManager = new MemoryManager();
    
    // Allocate some nodes
    for (let i = 0; i < 5; i++) {
        memoryManager.allocateNode('TestNode');
    }
    
    runner.assertEqual(memoryManager.nodeCount, 5);
    
    // Cleanup
    memoryManager.cleanup();
    runner.assertEqual(memoryManager.nodeCount, 0);
});

runner.test('Runtime memory management prevents stack overflow', () => {
    const code = `
        function factorial(n) {
            if (n <= 1) return 1;
            return n * factorial(n - 1);
        }
        factorial(2000);
    `;
    
    runner.assertThrows(() => {
        runner.parseAndExecute(code);
    }, 'call stack');
});

// Error handling tests
runner.test('Invalid arrow function syntax throws error', () => {
    runner.assertThrows(() => {
        const code = 'let f = => x * 2;'; // Missing parameter
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        parser.parse();
    });
});

runner.test('Arrow function with invalid parameter throws error', () => {
    runner.assertThrows(() => {
        const code = 'let f = (123) => x * 2;'; // Number as parameter
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        parser.parse();
    });
});

// Integration tests
runner.test('Arrow functions work with built-in functions', () => {
    const code = `
        let double = x => x * 2;
        print(type(double));
    `;
    
    let output = '';
    const originalLog = console.log;
    console.log = (msg) => { 
        if (!msg.includes('GC:')) {
            output += msg; 
        }
    };
    
    try {
        runner.parseAndExecute(code);
        runner.assertEqual(output, 'function');
    } finally {
        console.log = originalLog;
    }
});

runner.test('Complex arrow function expression', () => {
    const code = `
        let complex = (a, b) => {
            return x => a * x + b;
        };
        let linear = complex(2, 3);
        print(linear(5));
    `;
    
    let output = '';
    const originalLog = console.log;
    console.log = (msg) => { 
        if (!msg.includes('GC:')) {
            output += msg; 
        }
    };
    
    try {
        runner.parseAndExecute(code);
        runner.assertEqual(output, '13'); // 2 * 5 + 3 = 13
    } finally {
        console.log = originalLog;
    }
});

// Run all tests
if (require.main === module) {
    runner.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { TestRunner };

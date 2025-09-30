
/**
 * LUASCRIPT Memory Management Test Suite - Phase 1D
 * Tests for parser and runtime memory management
 */

const { Lexer, Parser, MemoryManager } = require('../src/parser.js');
const { Interpreter, RuntimeMemoryManager } = require('../src/runtime.js');

class MemoryTestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async run() {
        console.log('Running Memory Management Test Suite...\n');
        
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

    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`Expected true, got false. ${message}`);
        }
    }
}

const runner = new MemoryTestRunner();

// Parser Memory Manager Tests
runner.test('MemoryManager initializes with correct defaults', () => {
    const mm = new MemoryManager();
    runner.assertEqual(mm.maxNodes, 10000);
    runner.assertEqual(mm.maxDepth, 100);
    runner.assertEqual(mm.nodeCount, 0);
    runner.assertEqual(mm.currentDepth, 0);
});

runner.test('MemoryManager allocates nodes correctly', () => {
    const mm = new MemoryManager();
    const node = mm.allocateNode('TestNode', { value: 42 });
    
    runner.assertEqual(node.type, 'TestNode');
    runner.assertEqual(node.value, 42);
    runner.assertEqual(node._allocated, true);
    runner.assertEqual(mm.nodeCount, 1);
    runner.assertTrue(mm.allocatedNodes.has(node));
});

runner.test('MemoryManager enforces node limit', () => {
    const mm = new MemoryManager(3, 100); // Only 3 nodes allowed
    
    // Allocate up to limit
    mm.allocateNode('Node1');
    mm.allocateNode('Node2');
    mm.allocateNode('Node3');
    
    // This should throw
    runner.assertThrows(() => {
        mm.allocateNode('Node4');
    }, 'Memory limit exceeded');
});

runner.test('MemoryManager tracks scope depth', () => {
    const mm = new MemoryManager();
    
    runner.assertEqual(mm.currentDepth, 0);
    
    mm.enterScope();
    runner.assertEqual(mm.currentDepth, 1);
    
    mm.enterScope();
    runner.assertEqual(mm.currentDepth, 2);
    
    mm.exitScope();
    runner.assertEqual(mm.currentDepth, 1);
    
    mm.exitScope();
    runner.assertEqual(mm.currentDepth, 0);
});

runner.test('MemoryManager enforces depth limit', () => {
    const mm = new MemoryManager(1000, 2); // Only 2 levels deep
    
    mm.enterScope(); // depth 1
    mm.enterScope(); // depth 2
    
    // This should throw
    runner.assertThrows(() => {
        mm.enterScope(); // depth 3 - should fail
    }, 'Stack overflow');
});

runner.test('MemoryManager cleanup works', () => {
    const mm = new MemoryManager();
    
    // Allocate some nodes and enter scopes
    const node1 = mm.allocateNode('Node1');
    const node2 = mm.allocateNode('Node2');
    mm.enterScope();
    mm.enterScope();
    
    runner.assertEqual(mm.nodeCount, 2);
    runner.assertEqual(mm.currentDepth, 2);
    
    // Cleanup
    mm.cleanup();
    
    runner.assertEqual(mm.nodeCount, 0);
    runner.assertEqual(mm.currentDepth, 0);
    runner.assertEqual(mm.allocatedNodes.size, 0);
    runner.assertEqual(node1._allocated, false);
    runner.assertEqual(node2._allocated, false);
});

runner.test('MemoryManager provides accurate stats', () => {
    const mm = new MemoryManager(100, 10);
    
    mm.allocateNode('Node1');
    mm.allocateNode('Node2');
    mm.enterScope();
    
    const stats = mm.getStats();
    
    runner.assertEqual(stats.nodeCount, 2);
    runner.assertEqual(stats.currentDepth, 1);
    runner.assertEqual(stats.maxNodes, 100);
    runner.assertEqual(stats.maxDepth, 10);
    runner.assertEqual(stats.memoryUsage, '2/100 nodes');
});

// Runtime Memory Manager Tests
runner.test('RuntimeMemoryManager initializes correctly', () => {
    const rmm = new RuntimeMemoryManager();
    runner.assertEqual(rmm.maxCallStack, 1000);
    runner.assertEqual(rmm.maxHeapSize, 50 * 1024 * 1024);
    runner.assertEqual(rmm.callStack.length, 0);
    runner.assertEqual(rmm.heapSize, 0);
});

runner.test('RuntimeMemoryManager tracks function calls', () => {
    const rmm = new RuntimeMemoryManager();
    
    rmm.enterFunction('testFunc', [1, 2, 3]);
    runner.assertEqual(rmm.callStack.length, 1);
    runner.assertEqual(rmm.callStack[0].function, 'testFunc');
    runner.assertEqual(rmm.callStack[0].arguments.length, 3);
    
    rmm.enterFunction('nestedFunc', ['a']);
    runner.assertEqual(rmm.callStack.length, 2);
    
    rmm.exitFunction();
    runner.assertEqual(rmm.callStack.length, 1);
    
    rmm.exitFunction();
    runner.assertEqual(rmm.callStack.length, 0);
});

runner.test('RuntimeMemoryManager enforces call stack limit', () => {
    const rmm = new RuntimeMemoryManager(3, 1024); // Only 3 calls deep
    
    rmm.enterFunction('func1');
    rmm.enterFunction('func2');
    rmm.enterFunction('func3');
    
    runner.assertThrows(() => {
        rmm.enterFunction('func4');
    }, 'Stack overflow');
});

runner.test('RuntimeMemoryManager tracks heap allocation', () => {
    const rmm = new RuntimeMemoryManager(1000, 1024); // 1KB heap limit
    
    const obj1 = rmm.allocateObject({ data: 'test' }, 100);
    runner.assertEqual(rmm.heapSize, 100);
    
    const obj2 = rmm.allocateObject({ data: 'test2' }, 200);
    runner.assertEqual(rmm.heapSize, 300);
});

runner.test('RuntimeMemoryManager enforces heap limit', () => {
    const rmm = new RuntimeMemoryManager(1000, 100); // 100 bytes heap limit
    
    rmm.allocateObject({ data: 'test' }, 50);
    rmm.allocateObject({ data: 'test2' }, 30);
    
    // This should trigger GC and still work
    rmm.allocateObject({ data: 'test3' }, 10);
    
    // This should fail even after GC
    runner.assertThrows(() => {
        rmm.allocateObject({ data: 'huge' }, 200);
    }, 'Out of memory');
});

runner.test('RuntimeMemoryManager triggers garbage collection', () => {
    const rmm = new RuntimeMemoryManager(1000, 1000);
    
    // Fill up to GC threshold (80% of 1000 = 800)
    rmm.allocateObject({ data: 'test' }, 800);
    
    // Capture console output to verify GC message
    let gcTriggered = false;
    const originalLog = console.log;
    console.log = (msg) => {
        if (msg.includes('GC:')) {
            gcTriggered = true;
        }
        originalLog(msg); // Still log for debugging
    };
    
    try {
        // This should trigger GC as it exceeds the 80% threshold
        rmm.allocateObject({ data: 'trigger' }, 50);
        runner.assertTrue(gcTriggered, 'GC should have been triggered');
    } finally {
        console.log = originalLog;
    }
});

runner.test('RuntimeMemoryManager cleanup works', () => {
    const rmm = new RuntimeMemoryManager();
    
    rmm.enterFunction('test');
    rmm.allocateObject({ data: 'test' }, 100);
    
    runner.assertEqual(rmm.callStack.length, 1);
    runner.assertEqual(rmm.heapSize, 100);
    
    rmm.cleanup();
    
    runner.assertEqual(rmm.callStack.length, 0);
    runner.assertEqual(rmm.heapSize, 0);
});

runner.test('RuntimeMemoryManager provides accurate stats', () => {
    const rmm = new RuntimeMemoryManager(100, 1000);
    
    rmm.enterFunction('test1');
    rmm.enterFunction('test2');
    rmm.allocateObject({ data: 'test' }, 200);
    
    const stats = rmm.getStats();
    
    runner.assertEqual(stats.callStackDepth, 2);
    runner.assertEqual(stats.maxCallStack, 100);
    runner.assertEqual(stats.heapSize, 200);
    runner.assertEqual(stats.maxHeapSize, 1000);
    runner.assertEqual(stats.heapUtilization, '20.0%');
    runner.assertEqual(stats.callStack.length, 2);
});

// Integration Tests
runner.test('Parser with memory limits handles complex code', () => {
    const code = `
        function factorial(n) {
            if (n <= 1) return 1;
            return n * factorial(n - 1);
        }
        
        let result = factorial(5);
        print(result);
    `;
    
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const memoryManager = new MemoryManager(1000, 50);
    const parser = new Parser(tokens, memoryManager);
    
    const ast = parser.parse();
    runner.assertEqual(ast.type, 'Program');
    runner.assertTrue(memoryManager.nodeCount > 0);
    
    const stats = memoryManager.getStats();
    runner.assertTrue(stats.nodeCount < 1000, 'Should not exceed memory limit');
});

runner.test('Runtime with memory limits prevents infinite recursion', () => {
    const code = `
        function infiniteRecursion() {
            return infiniteRecursion();
        }
        infiniteRecursion();
    `;
    
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    const interpreter = new Interpreter();
    // Set very low call stack limit for testing
    interpreter.runtimeMemory = new RuntimeMemoryManager(10, 1024 * 1024);
    
    runner.assertThrows(() => {
        interpreter.interpret(ast.body);
    }, 'Stack overflow');
});

runner.test('Memory stats are accessible during execution', () => {
    const code = `
        function test() {
            let x = 42;
            return x;
        }
        test();
    `;
    
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    const interpreter = new Interpreter();
    interpreter.interpret(ast.body);
    
    const stats = interpreter.getMemoryStats();
    runner.assertTrue(stats.callStackDepth >= 0);
    runner.assertTrue(stats.heapSize >= 0);
    runner.assertTrue(stats.heapUtilization.includes('%'));
});

// Run all tests
if (require.main === module) {
    runner.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { MemoryTestRunner };

/**
 * LUASCRIPT Destructuring Edge Cases & Array Methods
 * 
 * Tests for array methods, spread patterns, and control flow edge cases
 * Phase 3B Enhancement: High-signal edge case coverage
 */

const { CoreTranspiler } = require('../src/core_transpiler');

class DestructuringEdgeCaseTests {
    constructor() {
        this.transpiler = new CoreTranspiler({ strict: false });
        this.passed = 0;
        this.failed = 0;
        this.tests = [];
    }

    transpile(code) {
        try {
            const result = this.transpiler.transpile(code);
            return result.code || '';
        } catch (error) {
            return `ERROR: ${error.message}`;
        }
    }

    test(name, code, expectedPatterns) {
        const result = this.transpile(code);
        
        // Support both string matching and regex patterns
        let passed = true;
        const failures = [];
        
        for (const pattern of expectedPatterns) {
            const isRegex = pattern instanceof RegExp;
            const matches = isRegex ? pattern.test(result) : result.includes(pattern);
            
            if (!matches) {
                passed = false;
                failures.push(`Missing: "${pattern}"`);
            }
        }
        
        if (passed) {
            console.log(`  ✅ ${name}`);
            this.passed++;
        } else {
            console.log(`  ❌ ${name}`);
            console.log(`     Code: ${code}`);
            console.log(`     Issues: ${failures.join(', ')}`);
            console.log(`     Generated:\n${result}`);
            this.failed++;
        }
        
        this.tests.push({ name, passed, code, result });
    }

    run() {
        console.log('\n═══════════════════════════════════════════════════');
        console.log('🧪 DESTRUCTURING EDGE CASES & ARRAY METHODS');
        console.log('═══════════════════════════════════════════════════\n');

        // ========== SPREAD IN LITERALS ==========
        console.log('🔀 Spread Patterns in Literals (Phase 4 Feature)');
        console.log('─────────────────────────────\n');

        // Note: Spread in array/object literals is a Phase 4 feature (pending enhancement)
        // These tests document the gap for future work:
        // - Array spread: let arr = [1, ...[2, 3], 4];
        // - Object spread: let obj = {a: 1, ...other, b: 2};

        console.log('  ℹ️  Spread patterns deferred to Phase 4 (parser enhancement required)');
        console.log('  ℹ️  Will enable: array spreads, object spreads, multiple spreads\n');

        // ========== ARRAY METHODS ==========
        console.log('📚 Array Methods with Destructuring (Phase 4 Feature)');
        console.log('─────────────────────────────\n');

        // Note: Arrow function parameter destructuring is Phase 4
        // These tests document the gap:
        // - let results = items.map(([a, b]) => a + b);
        // - let filtered = items.filter(({type}) => type === "active");
        // - let sum = arr.reduce(([a, b], [c, d]) => [[a+c, b+d]], [0, 0]);

        console.log('  ℹ️  Arrow function parameter destructuring deferred to Phase 4');
        console.log('  ℹ️  Will enable: destructuring in arrow parameters, callbacks, event handlers\n');

        // ========== CONTROL FLOW EDGE CASES ==========
        console.log('🎯 Control Flow Edge Cases (Phase 4 Enhancement)');
        console.log('─────────────────────────────\n');

        // Note: Destructuring in control flow conditions is a Phase 4 feature
        // Requires parser support for:
        // - if (let [x, y] = point) { ... }
        // - while (let {x, y} = getNext()) { ... }
        // - Destructuring in switch/try blocks

        console.log('  ℹ️  Control flow destructuring deferred to Phase 4');
        console.log('  ℹ️  Will enable: conditional destructuring, loop patterns, error handling\n');

        // ========== FUNCTION PARAMETERS ==========
        console.log('🔧 Function Parameter Destructuring (Phase 4 Feature)');
        console.log('─────────────────────────────\n');

        // Note: Function parameter destructuring is Phase 4
        // Requires parameter rewriting:
        // - function process([x, y]) { return x + y; }
        // - function setup({width, height}) { /* ... */ }
        // - const sum = ([a, b]) => a + b;

        console.log('  ℹ️  Function parameter destructuring deferred to Phase 4');
        console.log('  ℹ️  Will enable: parameter patterns, default values, object/array params\n');

        // ========== COMPLEX NESTING (PHASE 3 SCOPE) ==========
        console.log('🌳 Complex Nesting Patterns (Phase 3 Working)');
        console.log('─────────────────────────────\n');

        this.test(
            'Triple-nested destructuring',
            'let {a: {b: {c: [d, e]}}} = deeply;',
            [/local _destructure_\d+/, /local _nested_\d+/]
        );

        this.test(
            'Mixed nesting: array of objects of arrays',
            'let [{values: [a, b]}, {values: [c, d]}] = pairs;',
            [/local _destructure_\d+/, /local _nested_\d+/]
        );

        this.test(
            'Deeply nested with defaults',
            'let {x: {y: {z = 99}}} = config;',
            ['or 99']
        );

        // ========== REST PATTERN EDGE CASES (PHASE 3 WORKING) ==========
        console.log('\n🔄 Rest Pattern Edge Cases (Phase 3 Working)');
        console.log('─────────────────────────────\n');

        this.test(
            'Rest with preceding items',
            'let [first, second, ...rest] = list;',
            [/local first = _destructure_\d+\[1\]/, /local second = _destructure_\d+\[2\]/]
        );

        this.test(
            'Rest with holes',
            'let [, , ...rest] = items;',
            [/local rest/, 'table.insert']
        );

        this.test(
            'Multiple rest patterns in variables',
            'let {a, ...b} = obj; let [x, ...y] = arr;',
            [/local _destructure_\d+/]
        );

        // ========== COMPLEX REAL-WORLD PATTERNS (PHASE 3 SCOPE) ==========
        console.log('\n🚀 Real-World Usage Patterns (Phase 3 Working)');
        console.log('─────────────────────────────\n');

        this.test(
            'Configuration object destructuring',
            'let {host, port = 3000, ssl = true} = config;',
            [/local host = _destructure_\d+/, 'or 3000', 'or true']
        );

        this.test(
            'Event data destructuring',
            'let {target: {id, className}, type} = event;',
            [/local _destructure_\d+/, /local _nested_\d+/]
        );

        this.test(
            'Response data destructuring',
            'let {data: {user: {id, name, email}}} = response;',
            [/local _destructure_\d+/, /local _nested_\d+/]
        );

        this.test(
            'Array of objects destructuring',
            'let [{id: uid, name: userName}, {id: aid, role}] = users;',
            [/local uid = _destructure_\d+/, /local userName = _destructure_\d+/]
        );

        this.test(
            'Mixed value and nested destructuring',
            'let {x, y, nested: {z, w}} = point;',
            [/local x = _destructure_\d+/, /local _nested_\d+/]
        );

        // ========== SUMMARY ==========
        console.log('\n═══════════════════════════════════════════════════');
        console.log(`📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
        console.log(`   Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
        console.log('═══════════════════════════════════════════════════\n');

        return this.failed === 0;
    }
}

// Run tests
const suite = new DestructuringEdgeCaseTests();
const allPassed = suite.run();
process.exit(allPassed ? 0 : 1);

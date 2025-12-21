/**
 * LUASCRIPT Destructuring Pattern Tests
 * 
 * Tests for array/object destructuring, rest patterns, default values, and nested patterns
 * Phase 4 Implementation: Pattern/Destructuring Support
 */

const { CoreTranspiler } = require('../src/core_transpiler');

class DestructuringTests {
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
        
        // Check if result contains expected Lua patterns
        let passed = true;
        const failures = [];
        
        for (const pattern of expectedPatterns) {
            if (!result.includes(pattern)) {
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
        console.log('🧪 LUASCRIPT DESTRUCTURING PATTERN TESTS');
        console.log('═══════════════════════════════════════════════════\n');

        // ========== ARRAY DESTRUCTURING ==========
        console.log('📋 Array Destructuring Tests');
        console.log('─────────────────────────────\n');

        this.test(
            'Simple array destructuring',
            'let [a, b] = [1, 2];',
            ['local _destructure_', 'local a = _destructure_', 'local b = _destructure_', '[1]', '[2]']
        );

        this.test(
            'Array destructuring with three elements',
            'let [x, y, z] = arr;',
            ['local x = _destructure_', 'local y = _destructure_', 'local z = _destructure_']
        );

        this.test(
            'Array destructuring with fewer elements',
            'let [a, b, c] = [1, 2];',
            ['local a = _destructure_', 'local b = _destructure_', 'local c = _destructure_']
        );

        this.test(
            'Array with default value',
            'let [a, b = 10] = [1];',
            ['local a = _destructure_', 'local b = _destructure_', 'or 10']
        );

        this.test(
            'Array with multiple defaults',
            'let [a = 5, b = 10, c = 15] = [];',
            ['or 5', 'or 10', 'or 15']
        );

        this.test(
            'Array destructuring with hole',
            'let [a, , b] = [1, 2, 3];',
            ['local a = _destructure_', 'local b = _destructure_[3]']
        );

        // ========== REST PATTERNS ==========
        console.log('\n📚 Rest Pattern Tests');
        console.log('─────────────────────────────\n');

        this.test(
            'Array with rest at end',
            'let [first, ...rest] = [1, 2, 3];',
            ['local first = _destructure_[1]', 'local rest = {}', 'table.insert(rest']
        );

        this.test(
            'Array with rest in middle position',
            'let [a, b, ...rest] = arr;',
            ['local a = _destructure_[1]', 'local b = _destructure_[2]', 'table.insert(rest']
        );

        this.test(
            'Rest with default value',
            'let [a, ...rest = []] = arr;',
            ['local a = _destructure_', 'local rest']
        );

        // ========== OBJECT DESTRUCTURING ==========
        console.log('\n🎁 Object Destructuring Tests');
        console.log('─────────────────────────────\n');

        this.test(
            'Simple object destructuring',
            'let {x, y} = obj;',
            ['local _destructure_', 'local x = _destructure_.x', 'local y = _destructure_.y']
        );

        this.test(
            'Object destructuring with three properties',
            'let {name, age, city} = person;',
            ['local name = _destructure_', 'local age = _destructure_', 'local city = _destructure_']
        );

        this.test(
            'Object with renamed variables',
            'let {x: a, y: b} = coord;',
            ['local a = _destructure_.x', 'local b = _destructure_.y']
        );

        this.test(
            'Object with default values',
            'let {x = 10, y = 20} = opts;',
            ['or 10', 'or 20']
        );

        this.test(
            'Object with mixed renamed and default',
            'let {x: a = 5, y: b = 10} = data;',
            ['local a = _destructure_.x', 'or 5', 'local b = _destructure_.y', 'or 10']
        );

        // ========== NESTED DESTRUCTURING ==========
        console.log('\n🎯 Nested Pattern Tests');
        console.log('─────────────────────────────\n');

        this.test(
            'Nested array in array',
            'let [[a, b], c] = [[1, 2], 3];',
            ['local _destructure_', 'local _nested_']
        );

        this.test(
            'Nested object in array',
            'let [{x, y}, z] = [{x: 1, y: 2}, 3];',
            ['local _destructure_', 'local _nested_', 'local x = _nested_', 'local y = _nested_']
        );

        this.test(
            'Nested array in object',
            'let {coords: [x, y]} = point;',
            ['local _destructure_', 'local _nested_']
        );

        this.test(
            'Nested object in object',
            'let {user: {name, email}} = data;',
            ['local _destructure_', 'local _nested_', 'local name = _nested_', 'local email = _nested_']
        );

        this.test(
            'Deep nesting: object > array > object',
            'let {data: [{id, val}]} = config;',
            ['local _destructure_', 'local _nested_']
        );

        // ========== MIXED PATTERNS ==========
        console.log('\n🔀 Mixed Pattern Tests');
        console.log('─────────────────────────────\n');

        this.test(
            'Array with object element',
            'let [a, {x, y}] = [1, {x: 10, y: 20}];',
            ['local a = _destructure_[1]', 'local _nested_', 'local x = _nested_']
        );

        this.test(
            'Object with array property',
            'let {items: [first, second]} = list;',
            ['local _destructure_', 'local _nested_', 'local first = _nested_[1]', 'local second = _nested_[2]']
        );

        // ========== ASSIGNMENT PATTERNS ==========
        console.log('\n✍️  Assignment Pattern Tests');
        console.log('─────────────────────────────\n');

        this.test(
            'Array assignment with parentheses',
            '([a, b] = [1, 2]);',
            ['local _destructure_']
        );

        this.test(
            'Destructuring in for loop',
            'for (let [key, value] of items) {}',
            ['_destructure_'] // Should generate destructuring in loop
        );

        // ========== EDGE CASES ==========
        console.log('\n⚠️  Edge Case Tests');
        console.log('─────────────────────────────\n');

        this.test(
            'Empty array destructuring',
            'let [] = arr;',
            ['local _destructure_']
        );

        this.test(
            'Empty object destructuring',
            'let {} = obj;',
            ['local _destructure_']
        );

        this.test(
            'Single element destructuring',
            'let [a] = arr;',
            ['local a = _destructure_[1]']
        );

        this.test(
            'Destructuring with undefined variable names',
            'let [x, y, z] = getCoordinates();',
            ['local x = _destructure_[1]', 'local y = _destructure_[2]', 'local z = _destructure_[3]']
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
const suite = new DestructuringTests();
const allPassed = suite.run();
process.exit(allPassed ? 0 : 1);


/**
 * MLIR Dialect Tests
 * Tests for LUASCRIPT MLIR dialect
 */

const { LuaScriptDialect } = require('../../src/mlir/dialect');

function testDialectInit() {
    console.log('Testing MLIR Dialect - Initialization...');
    
    const dialect = new LuaScriptDialect();
    
    if (dialect.name !== 'luascript') {
        console.log('  ⚠️ FAIL: Incorrect dialect name');
        return false;
    }
    
    if (dialect.operations.size === 0) {
        console.log('  ⚠️ FAIL: No operations registered');
        return false;
    }
    
    if (dialect.types.size === 0) {
        console.log('  ⚠️ FAIL: No types registered');
        return false;
    }
    
    console.log(`  ✅ PASS: Dialect initialized with ${dialect.operations.size} ops, ${dialect.types.size} types`);
    return true;
}

function testOperationRegistration() {
    console.log('Testing MLIR Dialect - Operation Registration...');
    
    const dialect = new LuaScriptDialect();
    
    const testOps = ['luascript.func', 'luascript.call', 'luascript.add', 'luascript.return'];
    
    for (const opName of testOps) {
        const op = dialect.getOp(opName);
        if (!op) {
            console.log(`  ⚠️ FAIL: Operation ${opName} not found`);
            return false;
        }
    }
    
    console.log(`  ✅ PASS: All core operations registered`);
    return true;
}

function testTypeSystem() {
    console.log('Testing MLIR Dialect - Type System...');
    
    const dialect = new LuaScriptDialect();
    
    const testTypes = ['number', 'integer', 'boolean', 'string', 'table', 'function'];
    
    for (const typeName of testTypes) {
        const type = dialect.getType(typeName);
        if (!type) {
            console.log(`  ⚠️ FAIL: Type ${typeName} not found`);
            return false;
        }
    }
    
    console.log(`  ✅ PASS: All core types registered`);
    return true;
}

function testOperationValidation() {
    console.log('Testing MLIR Dialect - Operation Validation...');
    
    const dialect = new LuaScriptDialect();
    
    try {
        // Valid operation
        dialect.validateOp('luascript.add', ['%1', '%2'], ['%3']);
        
        // Invalid operation (wrong number of args)
        try {
            dialect.validateOp('luascript.add', ['%1'], ['%3']);
            console.log('  ⚠️ FAIL: Should have thrown error for invalid args');
            return false;
        } catch (e) {
            // Expected
        }
        
        console.log(`  ✅ PASS: Operation validation working`);
        return true;
    } catch (error) {
        console.log(`  ⚠️ FAIL: ${error.message}`);
        return false;
    }
}

function runTests() {
    console.log('=== MLIR Dialect Test Suite ===\n');
    
    const tests = [
        testDialectInit,
        testOperationRegistration,
        testTypeSystem,
        testOperationValidation
    ];
    
    let passed = 0;
    for (const test of tests) {
        try {
            const result = test();
            if (result) passed++;
        } catch (error) {
            console.log(`  ❌ ERROR: ${error.message}`);
        }
        console.log('');
    }
    
    console.log(`\nResults: ${passed}/${tests.length} tests passed`);
    console.log(passed === tests.length ? '✅ All tests passed!' : '⚠️ Some tests failed');
}

if (require.main === module) {
    runTests();
}

module.exports = { runTests };

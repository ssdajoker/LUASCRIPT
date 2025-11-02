
/**
 * LUASCRIPT MLIR Dialect
 * Defines the MLIR dialect for LUASCRIPT compilation
 */

class LuaScriptDialect {
    constructor() {
        this.name = 'luascript';
        this.operations = new Map();
        this.types = new Map();
        this.attributes = new Map();
        
        this.registerBuiltinOperations();
        this.registerBuiltinTypes();
    }
    
    /**
     * Registers core operations for the dialect.
     */
    registerBuiltinOperations() {
        // Function operations
        this.registerOp('luascript.func', {
            arguments: ['name', 'params', 'body', 'returnType'],
            results: [],
            traits: ['IsolatedFromAbove', 'FunctionLike']
        });
        
        this.registerOp('luascript.call', {
            arguments: ['callee', 'args'],
            results: ['result'],
            traits: []
        });
        
        this.registerOp('luascript.return', {
            arguments: ['value'],
            results: [],
            traits: ['Terminator']
        });
        
        // Memory operations
        this.registerOp('luascript.alloc', {
            arguments: ['type'],
            results: ['memref'],
            traits: []
        });
        
        this.registerOp('luascript.load', {
            arguments: ['memref'],
            results: ['value'],
            traits: []
        });
        
        this.registerOp('luascript.store', {
            arguments: ['value', 'memref'],
            results: [],
            traits: []
        });
        
        // Arithmetic operations
        this.registerOp('luascript.add', {
            arguments: ['lhs', 'rhs'],
            results: ['result'],
            traits: ['Commutative']
        });
        
        this.registerOp('luascript.sub', {
            arguments: ['lhs', 'rhs'],
            results: ['result'],
            traits: []
        });
        
        this.registerOp('luascript.mul', {
            arguments: ['lhs', 'rhs'],
            results: ['result'],
            traits: ['Commutative']
        });
        
        this.registerOp('luascript.div', {
            arguments: ['lhs', 'rhs'],
            results: ['result'],
            traits: []
        });
        
        // Control flow
        this.registerOp('luascript.if', {
            arguments: ['condition', 'thenRegion', 'elseRegion'],
            results: [],
            traits: []
        });
        
        this.registerOp('luascript.while', {
            arguments: ['condition', 'body'],
            results: [],
            traits: []
        });
        
        this.registerOp('luascript.br', {
            arguments: ['target'],
            results: [],
            traits: ['Terminator']
        });
        
        // Lua-specific operations
        this.registerOp('luascript.table_new', {
            arguments: [],
            results: ['table'],
            traits: []
        });
        
        this.registerOp('luascript.table_get', {
            arguments: ['table', 'key'],
            results: ['value'],
            traits: []
        });
        
        this.registerOp('luascript.table_set', {
            arguments: ['table', 'key', 'value'],
            results: [],
            traits: []
        });
        
        // Constants
        this.registerOp('luascript.constant', {
            arguments: ['value', 'type'],
            results: ['result'],
            traits: ['ConstantLike']
        });
    }
    
    /**
     * Registers built-in types for the dialect.
     */
    registerBuiltinTypes() {
        this.registerType('number', {
            size: 8,
            alignment: 8,
            isFloating: true
        });
        
        this.registerType('integer', {
            size: 4,
            alignment: 4,
            isFloating: false
        });
        
        this.registerType('boolean', {
            size: 1,
            alignment: 1,
            isFloating: false
        });
        
        this.registerType('string', {
            size: 0, // variable
            alignment: 8,
            isFloating: false
        });
        
        this.registerType('table', {
            size: 0, // variable
            alignment: 8,
            isFloating: false
        });
        
        this.registerType('function', {
            size: 8, // pointer
            alignment: 8,
            isFloating: false
        });
        
        this.registerType('nil', {
            size: 0,
            alignment: 1,
            isFloating: false
        });
    }
    
    /**
     * Registers an operation in the dialect.
     */
    registerOp(name, definition) {
        this.operations.set(name, definition);
    }
    
    /**
     * Registers a type in the dialect.
     */
    registerType(name, definition) {
        this.types.set(name, definition);
    }
    
    /**
     * Gets an operation definition.
     */
    getOp(name) {
        return this.operations.get(name);
    }
    
    /**
     * Gets a type definition.
     */
    getType(name) {
        return this.types.get(name);
    }
    
    /**
     * Validates an operation.
     */
    validateOp(opName, args, results) {
        const opDef = this.getOp(opName);
        if (!opDef) {
            throw new Error(`Unknown operation: ${opName}`);
        }
        
        if (args.length !== opDef.arguments.length) {
            throw new Error(
                `Operation ${opName} expects ${opDef.arguments.length} arguments, got ${args.length}`
            );
        }
        
        if (results.length !== opDef.results.length) {
            throw new Error(
                `Operation ${opName} expects ${opDef.results.length} results, got ${results.length}`
            );
        }
        
        return true;
    }
}

module.exports = { LuaScriptDialect };

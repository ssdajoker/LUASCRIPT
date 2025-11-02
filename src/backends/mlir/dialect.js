
/**
 * LUASCRIPT MLIR Dialect Definition
 * 
 * Defines the MLIR dialect for LUASCRIPT canonical IR
 * Based on MLIR (Multi-Level Intermediate Representation) framework
 */

/**
 * MLIR Dialect for LUASCRIPT
 * 
 * This dialect provides operations for representing LUASCRIPT programs
 * in MLIR format, enabling powerful optimization and transformation passes.
 * 
 * Namespace: luascript
 */
class LuascriptDialect {
    constructor() {
        this.name = 'luascript';
        this.namespace = 'luascript';
        this.operations = this.defineOperations();
        this.types = this.defineTypes();
        this.attributes = this.defineAttributes();
    }

    /**
     * Define LUASCRIPT dialect operations
     */
    defineOperations() {
        return {
            // Module operations
            'luascript.module': {
                description: 'LUASCRIPT module',
                traits: ['IsolatedFromAbove', 'SymbolTable'],
                regions: 1,
                operands: [],
                results: []
            },

            // Function operations
            'luascript.func': {
                description: 'Function definition',
                traits: ['FunctionLike', 'IsolatedFromAbove'],
                regions: 1,
                operands: [],
                results: [],
                attributes: ['sym_name', 'function_type']
            },

            'luascript.call': {
                description: 'Function call',
                operands: ['callee', 'args...'],
                results: ['result'],
                attributes: ['callee_name']
            },

            'luascript.return': {
                description: 'Return from function',
                operands: ['value?'],
                results: [],
                traits: ['Terminator']
            },

            // Variable operations
            'luascript.alloc': {
                description: 'Allocate variable',
                operands: [],
                results: ['ref'],
                attributes: ['var_name', 'type']
            },

            'luascript.load': {
                description: 'Load variable value',
                operands: ['ref'],
                results: ['value']
            },

            'luascript.store': {
                description: 'Store value to variable',
                operands: ['ref', 'value'],
                results: []
            },

            // Arithmetic operations
            'luascript.add': {
                description: 'Addition',
                operands: ['lhs', 'rhs'],
                results: ['result'],
                traits: ['Commutative']
            },

            'luascript.sub': {
                description: 'Subtraction',
                operands: ['lhs', 'rhs'],
                results: ['result']
            },

            'luascript.mul': {
                description: 'Multiplication',
                operands: ['lhs', 'rhs'],
                results: ['result'],
                traits: ['Commutative']
            },

            'luascript.div': {
                description: 'Division',
                operands: ['lhs', 'rhs'],
                results: ['result']
            },

            'luascript.mod': {
                description: 'Modulo',
                operands: ['lhs', 'rhs'],
                results: ['result']
            },

            'luascript.neg': {
                description: 'Negation',
                operands: ['operand'],
                results: ['result']
            },

            // Comparison operations
            'luascript.cmp': {
                description: 'Comparison',
                operands: ['lhs', 'rhs'],
                results: ['result'],
                attributes: ['predicate'] // eq, ne, lt, le, gt, ge
            },

            // Logical operations
            'luascript.and': {
                description: 'Logical AND',
                operands: ['lhs', 'rhs'],
                results: ['result'],
                traits: ['Commutative']
            },

            'luascript.or': {
                description: 'Logical OR',
                operands: ['lhs', 'rhs'],
                results: ['result'],
                traits: ['Commutative']
            },

            'luascript.not': {
                description: 'Logical NOT',
                operands: ['operand'],
                results: ['result']
            },

            // Control flow operations
            'luascript.if': {
                description: 'If statement',
                operands: ['condition'],
                results: [],
                regions: 2, // then, else
                traits: ['NoRegionArguments']
            },

            'luascript.while': {
                description: 'While loop',
                operands: ['condition'],
                results: [],
                regions: 1, // body
                traits: ['NoRegionArguments']
            },

            'luascript.for': {
                description: 'For loop',
                operands: ['start', 'end', 'step?'],
                results: [],
                regions: 1, // body
                attributes: ['iterator_var']
            },

            'luascript.break': {
                description: 'Break from loop',
                operands: [],
                results: [],
                traits: ['Terminator']
            },

            'luascript.continue': {
                description: 'Continue loop',
                operands: [],
                results: [],
                traits: ['Terminator']
            },

            // Constant operations
            'luascript.constant': {
                description: 'Constant value',
                operands: [],
                results: ['result'],
                attributes: ['value', 'type']
            },

            // Array operations
            'luascript.array.create': {
                description: 'Create array',
                operands: ['size?'],
                results: ['array'],
                attributes: ['element_type']
            },

            'luascript.array.get': {
                description: 'Get array element',
                operands: ['array', 'index'],
                results: ['element']
            },

            'luascript.array.set': {
                description: 'Set array element',
                operands: ['array', 'index', 'value'],
                results: []
            },

            'luascript.array.length': {
                description: 'Get array length',
                operands: ['array'],
                results: ['length']
            },

            // Object operations
            'luascript.object.create': {
                description: 'Create object',
                operands: [],
                results: ['object']
            },

            'luascript.object.get': {
                description: 'Get object property',
                operands: ['object', 'key'],
                results: ['value'],
                attributes: ['property_name?']
            },

            'luascript.object.set': {
                description: 'Set object property',
                operands: ['object', 'key', 'value'],
                results: [],
                attributes: ['property_name?']
            },

            // Type operations
            'luascript.cast': {
                description: 'Type cast',
                operands: ['value'],
                results: ['result'],
                attributes: ['from_type', 'to_type']
            },

            'luascript.typeof': {
                description: 'Get type of value',
                operands: ['value'],
                results: ['type']
            },

            // String operations
            'luascript.string.concat': {
                description: 'String concatenation',
                operands: ['lhs', 'rhs'],
                results: ['result']
            },

            'luascript.string.length': {
                description: 'String length',
                operands: ['string'],
                results: ['length']
            },

            // Special operations
            'luascript.print': {
                description: 'Print to console',
                operands: ['values...'],
                results: []
            },

            'luascript.yield': {
                description: 'Yield control',
                operands: ['value?'],
                results: []
            }
        };
    }

    /**
     * Define LUASCRIPT dialect types
     */
    defineTypes() {
        return {
            'luascript.number': {
                description: 'Number type (f64)',
                storage: 'f64'
            },
            'luascript.integer': {
                description: 'Integer type (i32)',
                storage: 'i32'
            },
            'luascript.boolean': {
                description: 'Boolean type',
                storage: 'i1'
            },
            'luascript.string': {
                description: 'String type',
                storage: 'ptr'
            },
            'luascript.array': {
                description: 'Array type',
                storage: 'ptr',
                parameters: ['element_type']
            },
            'luascript.object': {
                description: 'Object type',
                storage: 'ptr',
                parameters: ['properties?']
            },
            'luascript.function': {
                description: 'Function type',
                storage: 'ptr',
                parameters: ['param_types', 'return_type']
            },
            'luascript.any': {
                description: 'Any type (dynamic)',
                storage: 'ptr'
            },
            'luascript.void': {
                description: 'Void type',
                storage: 'void'
            },
            'luascript.ref': {
                description: 'Reference type',
                storage: 'ptr',
                parameters: ['pointee_type']
            }
        };
    }

    /**
     * Define LUASCRIPT dialect attributes
     */
    defineAttributes() {
        return {
            'luascript.inline': {
                description: 'Function should be inlined',
                type: 'unit'
            },
            'luascript.pure': {
                description: 'Function has no side effects',
                type: 'unit'
            },
            'luascript.const': {
                description: 'Variable is constant',
                type: 'unit'
            },
            'luascript.export': {
                description: 'Symbol is exported',
                type: 'string'
            },
            'luascript.import': {
                description: 'Symbol is imported',
                type: 'string'
            }
        };
    }

    /**
     * Get operation definition
     */
    getOperation(name) {
        return this.operations[name];
    }

    /**
     * Get type definition
     */
    getType(name) {
        return this.types[name];
    }

    /**
     * Get attribute definition
     */
    getAttribute(name) {
        return this.attributes[name];
    }

    /**
     * Verify operation is valid
     */
    verifyOperation(opName, operands, results, attributes) {
        const opDef = this.operations[opName];
        if (!opDef) {
            throw new Error(`Unknown operation: ${opName}`);
        }

        // Verify operand count (simplified)
        const expectedOperands = opDef.operands.filter(o => !o.includes('?') && !o.includes('...')).length;
        const hasVariadic = opDef.operands.some(o => o.includes('...'));
        
        if (!hasVariadic && operands.length < expectedOperands) {
            throw new Error(`Operation ${opName} expects at least ${expectedOperands} operands, got ${operands.length}`);
        }

        return true;
    }
}

module.exports = { LuascriptDialect };

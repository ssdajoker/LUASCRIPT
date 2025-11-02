/**
 * LUASCRIPT IR to WASM Compiler
 * 
 * Compiles canonical IR to WebAssembly bytecode
 * Integrates with existing WASM backend infrastructure
 */

const { NodeCategory } = require('../../ir/nodes');
const { TypeCategory } = require('../../ir/types');

/**
 * WASM Opcode Constants
 */
const WasmOp = {
    // Control flow
    UNREACHABLE: 0x00,
    NOP: 0x01,
    BLOCK: 0x02,
    LOOP: 0x03,
    IF: 0x04,
    ELSE: 0x05,
    END: 0x0B,
    BR: 0x0C,
    BR_IF: 0x0D,
    BR_TABLE: 0x0E,
    RETURN: 0x0F,
    CALL: 0x10,
    CALL_INDIRECT: 0x11,
    
    // Parametric
    DROP: 0x1A,
    SELECT: 0x1B,
    
    // Variable access
    LOCAL_GET: 0x20,
    LOCAL_SET: 0x21,
    LOCAL_TEE: 0x22,
    GLOBAL_GET: 0x23,
    GLOBAL_SET: 0x24,
    
    // Memory access
    I32_LOAD: 0x28,
    I64_LOAD: 0x29,
    F32_LOAD: 0x2A,
    F64_LOAD: 0x2B,
    I32_STORE: 0x36,
    I64_STORE: 0x37,
    F32_STORE: 0x38,
    F64_STORE: 0x39,
    MEMORY_SIZE: 0x3F,
    MEMORY_GROW: 0x40,
    
    // Constants
    I32_CONST: 0x41,
    I64_CONST: 0x42,
    F32_CONST: 0x43,
    F64_CONST: 0x44,
    
    // Numeric operators - i32
    I32_EQZ: 0x45,
    I32_EQ: 0x46,
    I32_NE: 0x47,
    I32_LT_S: 0x48,
    I32_LT_U: 0x49,
    I32_GT_S: 0x4A,
    I32_GT_U: 0x4B,
    I32_LE_S: 0x4C,
    I32_LE_U: 0x4D,
    I32_GE_S: 0x4E,
    I32_GE_U: 0x4F,
    
    // Numeric operators - i64
    I64_EQZ: 0x50,
    I64_EQ: 0x51,
    I64_NE: 0x52,
    I64_LT_S: 0x53,
    I64_LT_U: 0x54,
    I64_GT_S: 0x55,
    I64_GT_U: 0x56,
    I64_LE_S: 0x57,
    I64_LE_U: 0x58,
    I64_GE_S: 0x59,
    I64_GE_U: 0x5A,
    
    // Numeric operators - f32
    F32_EQ: 0x5B,
    F32_NE: 0x5C,
    F32_LT: 0x5D,
    F32_GT: 0x5E,
    F32_LE: 0x5F,
    F32_GE: 0x60,
    
    // Numeric operators - f64
    F64_EQ: 0x61,
    F64_NE: 0x62,
    F64_LT: 0x63,
    F64_GT: 0x64,
    F64_LE: 0x65,
    F64_GE: 0x66,
    
    // i32 arithmetic
    I32_CLZ: 0x67,
    I32_CTZ: 0x68,
    I32_POPCNT: 0x69,
    I32_ADD: 0x6A,
    I32_SUB: 0x6B,
    I32_MUL: 0x6C,
    I32_DIV_S: 0x6D,
    I32_DIV_U: 0x6E,
    I32_REM_S: 0x6F,
    I32_REM_U: 0x70,
    I32_AND: 0x71,
    I32_OR: 0x72,
    I32_XOR: 0x73,
    I32_SHL: 0x74,
    I32_SHR_S: 0x75,
    I32_SHR_U: 0x76,
    I32_ROTL: 0x77,
    I32_ROTR: 0x78,
    
    // i64 arithmetic
    I64_ADD: 0x7C,
    I64_SUB: 0x7D,
    I64_MUL: 0x7E,
    I64_DIV_S: 0x7F,
    I64_DIV_U: 0x80,
    I64_REM_S: 0x81,
    I64_REM_U: 0x82,
    I64_AND: 0x83,
    I64_OR: 0x84,
    I64_XOR: 0x85,
    I64_SHL: 0x86,
    I64_SHR_S: 0x87,
    I64_SHR_U: 0x88,
    I64_ROTL: 0x89,
    I64_ROTR: 0x8A,
    
    // f32 arithmetic
    F32_ABS: 0x8B,
    F32_NEG: 0x8C,
    F32_CEIL: 0x8D,
    F32_FLOOR: 0x8E,
    F32_TRUNC: 0x8F,
    F32_NEAREST: 0x90,
    F32_SQRT: 0x91,
    F32_ADD: 0x92,
    F32_SUB: 0x93,
    F32_MUL: 0x94,
    F32_DIV: 0x95,
    F32_MIN: 0x96,
    F32_MAX: 0x97,
    F32_COPYSIGN: 0x98,
    
    // f64 arithmetic
    F64_ABS: 0x99,
    F64_NEG: 0x9A,
    F64_CEIL: 0x9B,
    F64_FLOOR: 0x9C,
    F64_TRUNC: 0x9D,
    F64_NEAREST: 0x9E,
    F64_SQRT: 0x9F,
    F64_ADD: 0xA0,
    F64_SUB: 0xA1,
    F64_MUL: 0xA2,
    F64_DIV: 0xA3,
    F64_MIN: 0xA4,
    F64_MAX: 0xA5,
    F64_COPYSIGN: 0xA6,
    
    // Conversions
    I32_WRAP_I64: 0xA7,
    I32_TRUNC_F32_S: 0xA8,
    I32_TRUNC_F32_U: 0xA9,
    I32_TRUNC_F64_S: 0xAA,
    I32_TRUNC_F64_U: 0xAB,
    I64_EXTEND_I32_S: 0xAC,
    I64_EXTEND_I32_U: 0xAD,
    F32_CONVERT_I32_S: 0xB2,
    F32_CONVERT_I32_U: 0xB3,
    F64_CONVERT_I32_S: 0xB7,
    F64_CONVERT_I32_U: 0xB8,
    F32_DEMOTE_F64: 0xB6,
    F64_PROMOTE_F32: 0xBB
};

/**
 * WASM Type Constants
 */
const WasmType = {
    I32: 0x7F,
    I64: 0x7E,
    F32: 0x7D,
    F64: 0x7C,
    FUNCREF: 0x70,
    EXTERNREF: 0x6F,
    FUNC: 0x60,
    EMPTY_BLOCK: 0x40
};

/**
 * IR to WASM Compiler
 */
class IRToWasmCompiler {
    constructor(options = {}) {
        this.options = {
            optimize: options.optimize !== false,
            debug: options.debug || false,
            emitNames: options.emitNames !== false,
            ...options
        };
        
        // Compilation state
        this.functions = [];
        this.functionTypes = [];
        this.functionMap = new Map(); // name -> index
        this.globals = [];
        this.globalMap = new Map(); // name -> index
        this.locals = [];
        this.localMap = new Map(); // name -> index
        this.strings = [];
        this.stringMap = new Map(); // string -> offset
        this.dataOffset = 0;
        this.memorySize = 1; // 64KB pages
    }

    /**
     * Compile IR program to WASM module
     */
    compile(program) {
        if (program.kind !== NodeCategory.PROGRAM) {
            throw new Error('Expected Program node at root');
        }

        // Reset state
        this.reset();
        
        // First pass: collect function and global declarations
        this.collectDeclarations(program);
        
        // Second pass: compile function bodies
        this.compileFunctions(program);
        
        // Build WASM module
        return this.buildModule();
    }

    /**
     * Reset compiler state
     */
    reset() {
        this.functions = [];
        this.functionTypes = [];
        this.functionMap.clear();
        this.globals = [];
        this.globalMap.clear();
        this.locals = [];
        this.localMap.clear();
        this.strings = [];
        this.stringMap.clear();
        this.dataOffset = 0;
    }

    /**
     * Collect all declarations (functions, globals)
     */
    collectDeclarations(program) {
        for (const stmt of program.body) {
            if (stmt.kind === NodeCategory.FUNCTION_DECL) {
                this.registerFunction(stmt);
            } else if (stmt.kind === NodeCategory.VAR_DECL) {
                this.registerGlobal(stmt);
            }
        }
    }

    /**
     * Register a function
     */
    registerFunction(funcDecl) {
        const funcIndex = this.functions.length;
        this.functionMap.set(funcDecl.name, funcIndex);
        
        // Create function type
        const paramTypes = funcDecl.params.map(p => this.irTypeToWasmType(p.type));
        const returnType = this.irTypeToWasmType(funcDecl.returnType);
        
        const typeIndex = this.registerFunctionType(paramTypes, returnType);
        
        this.functions.push({
            name: funcDecl.name,
            typeIndex: typeIndex,
            params: funcDecl.params,
            body: funcDecl.body,
            locals: [],
            code: []
        });
    }

    /**
     * Register a function type
     */
    registerFunctionType(paramTypes, returnType) {
        // Check if this type already exists
        const typeStr = JSON.stringify({ paramTypes, returnType });
        const existing = this.functionTypes.findIndex(t => 
            JSON.stringify(t) === typeStr
        );
        
        if (existing !== -1) {
            return existing;
        }
        
        this.functionTypes.push({ paramTypes, returnType });
        return this.functionTypes.length - 1;
    }

    /**
     * Register a global variable
     */
    registerGlobal(varDecl) {
        const globalIndex = this.globals.length;
        this.globalMap.set(varDecl.name, globalIndex);
        
        this.globals.push({
            name: varDecl.name,
            type: this.irTypeToWasmType(varDecl.type),
            mutable: varDecl.varKind !== 'const',
            init: varDecl.init
        });
    }

    /**
     * Convert IR type to WASM type
     */
    irTypeToWasmType(irType) {
        if (!irType) return WasmType.I32; // Default
        
        switch (irType.category) {
            case TypeCategory.PRIMITIVE:
                switch (irType.name) {
                    case 'number':
                        return WasmType.F64; // Use f64 for JavaScript numbers
                    case 'boolean':
                        return WasmType.I32;
                    case 'string':
                        return WasmType.I32; // String pointer
                    default:
                        return WasmType.I32;
                }
            case TypeCategory.ARRAY:
            case TypeCategory.OBJECT:
                return WasmType.I32; // Pointer to heap object
            default:
                return WasmType.I32;
        }
    }

    /**
     * Compile all function bodies
     */
    compileFunctions(program) {
        for (const stmt of program.body) {
            if (stmt.kind === NodeCategory.FUNCTION_DECL) {
                this.compileFunction(stmt);
            }
        }
    }

    /**
     * Compile a single function
     */
    compileFunction(funcDecl) {
        const funcIndex = this.functionMap.get(funcDecl.name);
        const func = this.functions[funcIndex];
        
        // Setup local variable context
        this.localMap.clear();
        
        // Add parameters to locals
        funcDecl.params.forEach((param, idx) => {
            this.localMap.set(param.name, idx);
        });
        
        let nextLocalIndex = funcDecl.params.length;
        
        // Collect local variables from function body
        const localVars = this.collectLocalVars(funcDecl.body);
        for (const varName of localVars) {
            if (!this.localMap.has(varName)) {
                this.localMap.set(varName, nextLocalIndex++);
            }
        }
        
        // Generate function body code
        func.code = this.compileBlock(funcDecl.body);
        
        // Add implicit return if needed
        if (func.returnType !== WasmType.EMPTY_BLOCK && 
            (!func.code.length || func.code[func.code.length - 1] !== WasmOp.RETURN)) {
            // Add default return value
            func.code.push(
                WasmOp.I32_CONST, 0,
                WasmOp.RETURN
            );
        }
        
        // Store locals info
        func.locals = Array.from(this.localMap.entries())
            .filter(([name, idx]) => idx >= funcDecl.params.length)
            .map(([name, idx]) => ({
                name,
                index: idx,
                type: WasmType.I32 // Default type
            }));
    }

    /**
     * Collect local variable names from block
     */
    collectLocalVars(block) {
        const vars = new Set();
        
        const visit = (node) => {
            if (!node) return;
            
            if (node.kind === NodeCategory.VAR_DECL) {
                vars.add(node.name);
            } else if (node.kind === NodeCategory.BLOCK) {
                node.body.forEach(visit);
            } else if (node.kind === NodeCategory.IF) {
                visit(node.consequent);
                if (node.alternate) visit(node.alternate);
            } else if (node.kind === NodeCategory.WHILE || 
                       node.kind === NodeCategory.DO_WHILE) {
                visit(node.body);
            } else if (node.kind === NodeCategory.FOR) {
                if (node.init) visit(node.init);
                visit(node.body);
            }
        };
        
        if (block.kind === NodeCategory.BLOCK) {
            block.body.forEach(visit);
        }
        
        return vars;
    }

    /**
     * Compile a block of statements
     */
    compileBlock(block) {
        const code = [];
        
        const statements = block.kind === NodeCategory.BLOCK ? 
            block.body : [block];
        
        for (const stmt of statements) {
            code.push(...this.compileStatement(stmt));
        }
        
        return code;
    }

    /**
     * Compile a statement
     */
    compileStatement(stmt) {
        switch (stmt.kind) {
            case NodeCategory.VAR_DECL:
                return this.compileVarDecl(stmt);
            case NodeCategory.RETURN:
                return this.compileReturn(stmt);
            case NodeCategory.IF:
                return this.compileIf(stmt);
            case NodeCategory.WHILE:
                return this.compileWhile(stmt);
            case NodeCategory.FOR:
                return this.compileFor(stmt);
            case NodeCategory.EXPRESSION_STMT:
                return [...this.compileExpression(stmt.expression), WasmOp.DROP];
            case NodeCategory.BLOCK:
                return this.compileBlock(stmt);
            case NodeCategory.BREAK:
                return [WasmOp.BR, 1]; // Break to outer loop
            case NodeCategory.CONTINUE:
                return [WasmOp.BR, 0]; // Continue to loop start
            default:
                return [];
        }
    }

    /**
     * Compile variable declaration
     */
    compileVarDecl(varDecl) {
        const code = [];
        
        if (varDecl.init) {
            // Compile initializer
            code.push(...this.compileExpression(varDecl.init));
            
            // Store to local or global
            if (this.localMap.has(varDecl.name)) {
                const localIdx = this.localMap.get(varDecl.name);
                code.push(WasmOp.LOCAL_SET, ...this.encodeU32(localIdx));
            } else if (this.globalMap.has(varDecl.name)) {
                const globalIdx = this.globalMap.get(varDecl.name);
                code.push(WasmOp.GLOBAL_SET, ...this.encodeU32(globalIdx));
            }
        }
        
        return code;
    }

    /**
     * Compile return statement
     */
    compileReturn(returnStmt) {
        const code = [];
        
        if (returnStmt.value) {
            code.push(...this.compileExpression(returnStmt.value));
        }
        
        code.push(WasmOp.RETURN);
        return code;
    }

    /**
     * Compile if statement
     */
    compileIf(ifStmt) {
        const code = [];
        
        // Compile condition
        code.push(...this.compileExpression(ifStmt.test));
        
        // If block
        code.push(WasmOp.IF, WasmType.EMPTY_BLOCK);
        code.push(...this.compileBlock(ifStmt.consequent));
        
        if (ifStmt.alternate) {
            code.push(WasmOp.ELSE);
            code.push(...this.compileBlock(ifStmt.alternate));
        }
        
        code.push(WasmOp.END);
        
        return code;
    }

    /**
     * Compile while loop
     */
    compileWhile(whileStmt) {
        const code = [];
        
        // Block for break
        code.push(WasmOp.BLOCK, WasmType.EMPTY_BLOCK);
        
        // Loop
        code.push(WasmOp.LOOP, WasmType.EMPTY_BLOCK);
        
        // Condition
        code.push(...this.compileExpression(whileStmt.test));
        code.push(WasmOp.I32_EQZ);
        code.push(WasmOp.BR_IF, 1); // Break if false
        
        // Body
        code.push(...this.compileBlock(whileStmt.body));
        
        // Continue loop
        code.push(WasmOp.BR, 0);
        
        code.push(WasmOp.END); // end loop
        code.push(WasmOp.END); // end block
        
        return code;
    }

    /**
     * Compile for loop
     */
    compileFor(forStmt) {
        const code = [];
        
        // Initialize
        if (forStmt.init) {
            code.push(...this.compileStatement(forStmt.init));
        }
        
        // Block for break
        code.push(WasmOp.BLOCK, WasmType.EMPTY_BLOCK);
        
        // Loop
        code.push(WasmOp.LOOP, WasmType.EMPTY_BLOCK);
        
        // Test condition
        if (forStmt.test) {
            code.push(...this.compileExpression(forStmt.test));
            code.push(WasmOp.I32_EQZ);
            code.push(WasmOp.BR_IF, 1); // Break if false
        }
        
        // Body
        code.push(...this.compileBlock(forStmt.body));
        
        // Update
        if (forStmt.update) {
            code.push(...this.compileExpression(forStmt.update));
            code.push(WasmOp.DROP);
        }
        
        // Continue loop
        code.push(WasmOp.BR, 0);
        
        code.push(WasmOp.END); // end loop
        code.push(WasmOp.END); // end block
        
        return code;
    }

    /**
     * Compile an expression
     */
    compileExpression(expr) {
        switch (expr.kind) {
            case NodeCategory.LITERAL:
                return this.compileLiteral(expr);
            case NodeCategory.IDENTIFIER:
                return this.compileIdentifier(expr);
            case NodeCategory.BINARY_OP:
                return this.compileBinaryOp(expr);
            case NodeCategory.UNARY_OP:
                return this.compileUnaryOp(expr);
            case NodeCategory.ASSIGNMENT:
                return this.compileAssignment(expr);
            case NodeCategory.CALL:
                return this.compileCall(expr);
            case NodeCategory.CONDITIONAL:
                return this.compileConditional(expr);
            case NodeCategory.MEMBER:
                return this.compileMember(expr);
            case NodeCategory.ARRAY_LITERAL:
                return this.compileArrayLiteral(expr);
            default:
                return [WasmOp.I32_CONST, 0];
        }
    }

    /**
     * Compile literal value
     */
    compileLiteral(literal) {
        const code = [];
        
        switch (typeof literal.value) {
            case 'number':
                // Check if integer or float
                if (Number.isInteger(literal.value)) {
                    code.push(WasmOp.I32_CONST, ...this.encodeI32(literal.value));
                } else {
                    code.push(WasmOp.F64_CONST, ...this.encodeF64(literal.value));
                }
                break;
            case 'boolean':
                code.push(WasmOp.I32_CONST, literal.value ? 1 : 0);
                break;
            case 'string':
                // Store string in data section and return pointer
                const offset = this.addString(literal.value);
                code.push(WasmOp.I32_CONST, ...this.encodeI32(offset));
                break;
            default:
                // null, undefined -> 0
                code.push(WasmOp.I32_CONST, 0);
        }
        
        return code;
    }

    /**
     * Compile identifier reference
     */
    compileIdentifier(identifier) {
        const code = [];
        const name = identifier.name;
        
        // Check locals first
        if (this.localMap.has(name)) {
            const localIdx = this.localMap.get(name);
            code.push(WasmOp.LOCAL_GET, ...this.encodeU32(localIdx));
        }
        // Then globals
        else if (this.globalMap.has(name)) {
            const globalIdx = this.globalMap.get(name);
            code.push(WasmOp.GLOBAL_GET, ...this.encodeU32(globalIdx));
        }
        // Unknown - return 0
        else {
            code.push(WasmOp.I32_CONST, 0);
        }
        
        return code;
    }

    /**
     * Compile binary operation
     */
    compileBinaryOp(binOp) {
        const code = [];
        
        // Compile operands
        code.push(...this.compileExpression(binOp.left));
        code.push(...this.compileExpression(binOp.right));
        
        // Generate operation
        switch (binOp.operator) {
            // Arithmetic
            case '+':
                code.push(WasmOp.I32_ADD);
                break;
            case '-':
                code.push(WasmOp.I32_SUB);
                break;
            case '*':
                code.push(WasmOp.I32_MUL);
                break;
            case '/':
                code.push(WasmOp.I32_DIV_S);
                break;
            case '%':
                code.push(WasmOp.I32_REM_S);
                break;
                
            // Comparison
            case '==':
            case '===':
                code.push(WasmOp.I32_EQ);
                break;
            case '!=':
            case '!==':
                code.push(WasmOp.I32_NE);
                break;
            case '<':
                code.push(WasmOp.I32_LT_S);
                break;
            case '<=':
                code.push(WasmOp.I32_LE_S);
                break;
            case '>':
                code.push(WasmOp.I32_GT_S);
                break;
            case '>=':
                code.push(WasmOp.I32_GE_S);
                break;
                
            // Bitwise
            case '&':
                code.push(WasmOp.I32_AND);
                break;
            case '|':
                code.push(WasmOp.I32_OR);
                break;
            case '^':
                code.push(WasmOp.I32_XOR);
                break;
            case '<<':
                code.push(WasmOp.I32_SHL);
                break;
            case '>>':
                code.push(WasmOp.I32_SHR_S);
                break;
            case '>>>':
                code.push(WasmOp.I32_SHR_U);
                break;
                
            // Logical (short-circuit not implemented yet)
            case '&&':
                code.push(WasmOp.I32_AND);
                break;
            case '||':
                code.push(WasmOp.I32_OR);
                break;
                
            default:
                // Unknown operator - just add
                code.push(WasmOp.I32_ADD);
        }
        
        return code;
    }

    /**
     * Compile unary operation
     */
    compileUnaryOp(unaryOp) {
        const code = [];
        
        code.push(...this.compileExpression(unaryOp.operand));
        
        switch (unaryOp.operator) {
            case '-':
                // Negate: 0 - x
                code.unshift(WasmOp.I32_CONST, 0);
                code.push(WasmOp.I32_SUB);
                break;
            case '!':
                // Logical not: x == 0
                code.push(WasmOp.I32_EQZ);
                break;
            case '~':
                // Bitwise not: x ^ -1
                code.push(WasmOp.I32_CONST, ...this.encodeI32(-1));
                code.push(WasmOp.I32_XOR);
                break;
        }
        
        return code;
    }

    /**
     * Compile assignment
     */
    compileAssignment(assignment) {
        const code = [];
        
        // Compile value
        code.push(...this.compileExpression(assignment.value));
        
        // Store based on target
        if (assignment.target.kind === NodeCategory.IDENTIFIER) {
            const name = assignment.target.name;
            
            // Duplicate value for return
            code.push(WasmOp.LOCAL_TEE, 0); // Use temp local
            
            if (this.localMap.has(name)) {
                const localIdx = this.localMap.get(name);
                code.push(WasmOp.LOCAL_SET, ...this.encodeU32(localIdx));
            } else if (this.globalMap.has(name)) {
                const globalIdx = this.globalMap.get(name);
                code.push(WasmOp.GLOBAL_SET, ...this.encodeU32(globalIdx));
            }
        }
        
        return code;
    }

    /**
     * Compile function call
     */
    compileCall(call) {
        const code = [];
        
        // Compile arguments
        for (const arg of call.args) {
            code.push(...this.compileExpression(arg));
        }
        
        // Call function
        if (call.callee.kind === NodeCategory.IDENTIFIER) {
            const funcName = call.callee.name;
            
            if (this.functionMap.has(funcName)) {
                const funcIdx = this.functionMap.get(funcName);
                code.push(WasmOp.CALL, ...this.encodeU32(funcIdx));
            } else {
                // Unknown function - return 0
                code.push(WasmOp.I32_CONST, 0);
            }
        }
        
        return code;
    }

    /**
     * Compile conditional (ternary) expression
     */
    compileConditional(conditional) {
        const code = [];
        
        // Test condition
        code.push(...this.compileExpression(conditional.test));
        
        // If-else expression
        code.push(WasmOp.IF, WasmType.I32); // Result type
        code.push(...this.compileExpression(conditional.consequent));
        code.push(WasmOp.ELSE);
        code.push(...this.compileExpression(conditional.alternate));
        code.push(WasmOp.END);
        
        return code;
    }

    /**
     * Compile member access
     */
    compileMember(member) {
        // Simplified: treat as property offset
        // Real implementation would use heap and property tables
        const code = [];
        
        // Get object pointer
        code.push(...this.compileExpression(member.object));
        
        // Add property offset (simplified)
        code.push(WasmOp.I32_CONST, 4); // Assume 4-byte offset
        code.push(WasmOp.I32_ADD);
        
        // Load value
        code.push(WasmOp.I32_LOAD, 0, 0); // align=0, offset=0
        
        return code;
    }

    /**
     * Compile array literal
     */
    compileArrayLiteral(arrayLit) {
        // Simplified: allocate memory and store elements
        const code = [];
        
        // Return pointer to array (simplified)
        code.push(WasmOp.I32_CONST, ...this.encodeI32(this.dataOffset));
        
        // In real implementation, would allocate heap memory
        // and store array elements
        
        return code;
    }

    /**
     * Add string to data section
     */
    addString(str) {
        if (this.stringMap.has(str)) {
            return this.stringMap.get(str);
        }
        
        const offset = this.dataOffset;
        this.strings.push({ offset, value: str });
        this.stringMap.set(str, offset);
        
        // Update offset (length + null terminator)
        this.dataOffset += str.length + 1;
        
        return offset;
    }

    /**
     * Build complete WASM module
     */
    buildModule() {
        const sections = [];
        
        // Type section
        sections.push(this.buildTypeSection());
        
        // Function section
        sections.push(this.buildFunctionSection());
        
        // Memory section
        sections.push(this.buildMemorySection());
        
        // Global section
        if (this.globals.length > 0) {
            sections.push(this.buildGlobalSection());
        }
        
        // Export section
        sections.push(this.buildExportSection());
        
        // Code section
        sections.push(this.buildCodeSection());
        
        // Data section
        if (this.strings.length > 0) {
            sections.push(this.buildDataSection());
        }
        
        // Name section (custom)
        if (this.options.emitNames) {
            sections.push(this.buildNameSection());
        }
        
        // Assemble module
        return this.assembleModule(sections);
    }

    /**
     * Build type section
     */
    buildTypeSection() {
        const data = [];
        data.push(...this.encodeU32(this.functionTypes.length));
        
        for (const funcType of this.functionTypes) {
            data.push(WasmType.FUNC);
            data.push(...this.encodeU32(funcType.paramTypes.length));
            data.push(...funcType.paramTypes);
            
            if (funcType.returnType !== WasmType.EMPTY_BLOCK) {
                data.push(...this.encodeU32(1));
                data.push(funcType.returnType);
            } else {
                data.push(...this.encodeU32(0));
            }
        }
        
        return { id: 1, data };
    }

    /**
     * Build function section
     */
    buildFunctionSection() {
        const data = [];
        data.push(...this.encodeU32(this.functions.length));
        
        for (const func of this.functions) {
            data.push(...this.encodeU32(func.typeIndex));
        }
        
        return { id: 3, data };
    }

    /**
     * Build memory section
     */
    buildMemorySection() {
        const data = [];
        data.push(...this.encodeU32(1)); // 1 memory
        data.push(0x01); // has maximum
        data.push(...this.encodeU32(this.memorySize));
        data.push(...this.encodeU32(this.memorySize * 10)); // max 10x initial
        
        return { id: 5, data };
    }

    /**
     * Build global section
     */
    buildGlobalSection() {
        const data = [];
        data.push(...this.encodeU32(this.globals.length));
        
        for (const global of this.globals) {
            data.push(global.type);
            data.push(global.mutable ? 0x01 : 0x00);
            
            // Initial value
            if (global.init) {
                data.push(...this.compileExpression(global.init));
            } else {
                data.push(WasmOp.I32_CONST, 0);
            }
            data.push(WasmOp.END);
        }
        
        return { id: 6, data };
    }

    /**
     * Build export section
     */
    buildExportSection() {
        const data = [];
        const exports = [];
        
        // Export memory
        exports.push({
            name: 'memory',
            kind: 0x02, // memory
            index: 0
        });
        
        // Export all functions
        this.functions.forEach((func, idx) => {
            exports.push({
                name: func.name,
                kind: 0x00, // function
                index: idx
            });
        });
        
        data.push(...this.encodeU32(exports.length));
        
        for (const exp of exports) {
            data.push(...this.encodeString(exp.name));
            data.push(exp.kind);
            data.push(...this.encodeU32(exp.index));
        }
        
        return { id: 7, data };
    }

    /**
     * Build code section
     */
    buildCodeSection() {
        const data = [];
        data.push(...this.encodeU32(this.functions.length));
        
        for (const func of this.functions) {
            const funcData = [];
            
            // Locals
            const localGroups = this.groupLocals(func.locals);
            funcData.push(...this.encodeU32(localGroups.length));
            
            for (const group of localGroups) {
                funcData.push(...this.encodeU32(group.count));
                funcData.push(group.type);
            }
            
            // Code
            funcData.push(...func.code);
            funcData.push(WasmOp.END);
            
            // Size + data
            data.push(...this.encodeU32(funcData.length));
            data.push(...funcData);
        }
        
        return { id: 10, data };
    }

    /**
     * Group locals by type
     */
    groupLocals(locals) {
        const groups = [];
        let currentType = null;
        let currentCount = 0;
        
        for (const local of locals) {
            if (local.type === currentType) {
                currentCount++;
            } else {
                if (currentType !== null) {
                    groups.push({ type: currentType, count: currentCount });
                }
                currentType = local.type;
                currentCount = 1;
            }
        }
        
        if (currentType !== null) {
            groups.push({ type: currentType, count: currentCount });
        }
        
        return groups;
    }

    /**
     * Build data section
     */
    buildDataSection() {
        const data = [];
        data.push(...this.encodeU32(this.strings.length));
        
        for (const str of this.strings) {
            data.push(0x00); // active segment
            data.push(WasmOp.I32_CONST, ...this.encodeI32(str.offset));
            data.push(WasmOp.END);
            
            const bytes = Buffer.from(str.value + '\0', 'utf8');
            data.push(...this.encodeU32(bytes.length));
            data.push(...bytes);
        }
        
        return { id: 11, data };
    }

    /**
     * Build name section (custom)
     */
    buildNameSection() {
        const data = [];
        
        // Section name
        data.push(...this.encodeString('name'));
        
        // Function names subsection
        const funcNames = [];
        funcNames.push(0x01); // function names
        
        const funcNamesData = [];
        funcNamesData.push(...this.encodeU32(this.functions.length));
        
        this.functions.forEach((func, idx) => {
            funcNamesData.push(...this.encodeU32(idx));
            funcNamesData.push(...this.encodeString(func.name));
        });
        
        funcNames.push(...this.encodeU32(funcNamesData.length));
        funcNames.push(...funcNamesData);
        
        data.push(...funcNames);
        
        return { id: 0, data }; // Custom section
    }

    /**
     * Assemble complete module
     */
    assembleModule(sections) {
        const bytes = [];
        
        // Magic number
        bytes.push(0x00, 0x61, 0x73, 0x6D);
        
        // Version
        bytes.push(0x01, 0x00, 0x00, 0x00);
        
        // Sections
        for (const section of sections) {
            bytes.push(section.id);
            bytes.push(...this.encodeU32(section.data.length));
            bytes.push(...section.data);
        }
        
        return new Uint8Array(bytes);
    }

    /**
     * Encode unsigned 32-bit integer (LEB128)
     */
    encodeU32(value) {
        const result = [];
        do {
            let byte = value & 0x7F;
            value >>>= 7;
            if (value !== 0) {
                byte |= 0x80;
            }
            result.push(byte);
        } while (value !== 0);
        return result;
    }

    /**
     * Encode signed 32-bit integer (LEB128)
     */
    encodeI32(value) {
        const result = [];
        let more = true;
        
        while (more) {
            let byte = value & 0x7F;
            value >>= 7;
            
            if ((value === 0 && (byte & 0x40) === 0) ||
                (value === -1 && (byte & 0x40) !== 0)) {
                more = false;
            } else {
                byte |= 0x80;
            }
            
            result.push(byte);
        }
        
        return result;
    }

    /**
     * Encode 64-bit float
     */
    encodeF64(value) {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setFloat64(0, value, true); // little-endian
        return Array.from(new Uint8Array(buffer));
    }

    /**
     * Encode string
     */
    encodeString(str) {
        const bytes = Buffer.from(str, 'utf8');
        return [...this.encodeU32(bytes.length), ...bytes];
    }
}

module.exports = { IRToWasmCompiler, WasmOp, WasmType };

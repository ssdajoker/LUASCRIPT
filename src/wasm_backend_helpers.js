/**
 * WASM Backend Helper Functions
 * Utilities for compiling canonical IR to WASM
 */

/**
 * Collects all functions from the canonical IR.
 * @param {object} ir - The canonical IR.
 * @returns {Array} Array of function information objects.
 */
function collectFunctions(ir) {
    const functions = [];
    if (!ir || !ir.nodes) return functions;
    
    for (const [nodeId, node] of Object.entries(ir.nodes)) {
        if (node.kind === 'FunctionDeclaration' || 
            node.kind === 'ArrowFunctionExpression' ||
            node.kind === 'FunctionExpression') {
            functions.push({
                id: nodeId,
                name: node.name || `func_${nodeId}`,
                params: node.params || [],
                body: node.body,
                returnType: node.returnType || 'void',
                meta: node.meta || {}
            });
        }
    }
    
    return functions;
}

/**
 * Collects all global variables from the canonical IR.
 * @param {object} ir - The canonical IR.
 * @returns {Array} Array of global variable information.
 */
function collectGlobals(ir) {
    const globals = [];
    if (!ir || !ir.nodes || !ir.module) return globals;
    
    // Find top-level variable declarations
    for (const nodeId of ir.module.body) {
        const node = ir.nodes[nodeId];
        if (node && node.kind === 'VariableDeclaration') {
            for (const decl of (node.declarations || [])) {
                globals.push({
                    pattern: decl.pattern,
                    init: decl.init,
                    kind: decl.kind,
                    mutable: decl.kind !== 'const'
                });
            }
        }
    }
    
    return globals;
}

/**
 * Compiles an IR expression node to WASM instructions.
 * @param {object} node - The IR node.
 * @param {object} ir - The full IR for reference lookups.
 * @param {object} context - Compilation context (locals, etc).
 * @returns {Array} Array of WASM instruction bytes.
 */
function compileExpression(node, ir, context) {
    const instructions = [];
    
    if (!node) return instructions;
    
    // Get the actual node if nodeId is passed
    const actualNode = typeof node === 'string' ? ir.nodes[node] : node;
    if (!actualNode) return instructions;
    
    switch (actualNode.kind) {
        case 'Literal':
            // Push literal value onto stack
            if (typeof actualNode.value === 'number') {
                // f32.const or i32.const depending on value
                if (Number.isInteger(actualNode.value)) {
                    instructions.push(0x41); // i32.const
                    instructions.push(...encodeI32(actualNode.value));
                } else {
                    instructions.push(0x43); // f32.const
                    instructions.push(...encodeF32(actualNode.value));
                }
            } else if (typeof actualNode.value === 'boolean') {
                instructions.push(0x41); // i32.const
                instructions.push(actualNode.value ? 1 : 0);
            }
            break;
            
        case 'Identifier':
            // Load variable (local.get or global.get)
            const varIndex = context.findVariable(actualNode.name);
            if (varIndex !== undefined) {
                instructions.push(0x20); // local.get
                instructions.push(...encodeU32(varIndex));
            }
            break;
            
        case 'BinaryExpression':
            // Compile left and right operands
            instructions.push(...compileExpression(actualNode.left, ir, context));
            instructions.push(...compileExpression(actualNode.right, ir, context));
            
            // Add operation instruction
            instructions.push(...compileBinaryOp(actualNode.operator));
            break;
            
        case 'CallExpression':
            // Compile arguments
            for (const arg of (actualNode.arguments || [])) {
                instructions.push(...compileExpression(arg, ir, context));
            }
            
            // Call function
            const funcIndex = context.findFunction(actualNode.callee);
            if (funcIndex !== undefined) {
                instructions.push(0x10); // call
                instructions.push(...encodeU32(funcIndex));
            }
            break;
            
        case 'UnaryExpression':
            instructions.push(...compileExpression(actualNode.argument, ir, context));
            instructions.push(...compileUnaryOp(actualNode.operator));
            break;
            
        case 'ConditionalExpression':
            // if-else expression
            instructions.push(...compileExpression(actualNode.test, ir, context));
            instructions.push(0x04); // if (with result)
            instructions.push(0x40); // void result type (for now)
            instructions.push(...compileExpression(actualNode.consequent, ir, context));
            instructions.push(0x05); // else
            instructions.push(...compileExpression(actualNode.alternate, ir, context));
            instructions.push(0x0B); // end
            break;
            
        default:
            // Unsupported expression, add nop
            instructions.push(0x01); // nop
    }
    
    return instructions;
}

/**
 * Compiles a binary operator to WASM instructions.
 * @param {string} operator - The operator (+, -, *, /, etc).
 * @returns {Array} WASM instruction bytes.
 */
function compileBinaryOp(operator) {
    const opMap = {
        '+': [0x6A],  // i32.add (default to integer ops)
        '-': [0x6B],  // i32.sub
        '*': [0x6C],  // i32.mul
        '/': [0x6D],  // i32.div_s
        '%': [0x6F],  // i32.rem_s
        '==': [0x46], // i32.eq
        '!=': [0x47], // i32.ne
        '<': [0x48],  // i32.lt_s
        '>': [0x4A],  // i32.gt_s
        '<=': [0x4C], // i32.le_s
        '>=': [0x4E], // i32.ge_s
        '&&': [0x71], // i32.and
        '||': [0x72], // i32.or
        '&': [0x71],  // i32.and
        '|': [0x72],  // i32.or
        '^': [0x73],  // i32.xor
    };
    return opMap[operator] || [0x01]; // nop if unknown
}

/**
 * Compiles a unary operator to WASM instructions.
 * @param {string} operator - The operator (!, -, +, etc).
 * @returns {Array} WASM instruction bytes.
 */
function compileUnaryOp(operator) {
    const opMap = {
        '!': [0x45],  // i32.eqz (logical not)
        '-': [0x41, 0x00, 0x6B], // i32.const 0, i32.sub (negate)
        '~': [0x41, 0xFF, 0xFF, 0xFF, 0xFF, 0x0F, 0x73], // i32.const -1, i32.xor (bitwise not)
    };
    return opMap[operator] || [0x01]; // nop if unknown
}

/**
 * Encodes an i32 value as LEB128.
 * @param {number} value - The value to encode.
 * @returns {Array} Encoded bytes.
 */
function encodeI32(value) {
    const bytes = [];
    let val = value < 0 ? (1 << 32) + value : value;
    
    do {
        let byte = val & 0x7F;
        val >>= 7;
        if (val !== 0) byte |= 0x80;
        bytes.push(byte);
    } while (val !== 0);
    
    return bytes;
}

/**
 * Encodes an f32 value as IEEE 754.
 * @param {number} value - The value to encode.
 * @returns {Array} Encoded bytes (4 bytes).
 */
function encodeF32(value) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, value, true); // little-endian
    return Array.from(new Uint8Array(buffer));
}

/**
 * Encodes an unsigned 32-bit integer as LEB128.
 * @param {number} value - The value to encode.
 * @returns {Array} Encoded bytes.
 */
function encodeU32(value) {
    const bytes = [];
    let val = value;
    
    do {
        let byte = val & 0x7F;
        val >>= 7;
        if (val !== 0) byte |= 0x80;
        bytes.push(byte);
    } while (val !== 0);
    
    return bytes;
}

/**
 * Compiles a statement node to WASM instructions.
 * @param {object} node - The IR node.
 * @param {object} ir - The full IR for reference lookups.
 * @param {object} context - Compilation context.
 * @returns {Array} Array of WASM instruction bytes.
 */
function compileStatement(node, ir, context) {
    const instructions = [];
    
    if (!node) return instructions;
    
    const actualNode = typeof node === 'string' ? ir.nodes[node] : node;
    if (!actualNode) return instructions;
    
    switch (actualNode.kind) {
        case 'ReturnStatement':
            if (actualNode.argument) {
                instructions.push(...compileExpression(actualNode.argument, ir, context));
            }
            instructions.push(0x0F); // return
            break;
            
        case 'ExpressionStatement':
            instructions.push(...compileExpression(actualNode.expression, ir, context));
            instructions.push(0x1A); // drop (discard result)
            break;
            
        case 'IfStatement':
            instructions.push(...compileExpression(actualNode.test, ir, context));
            instructions.push(0x04); // if
            instructions.push(0x40); // void result type
            instructions.push(...compileStatement(actualNode.consequent, ir, context));
            if (actualNode.alternate) {
                instructions.push(0x05); // else
                instructions.push(...compileStatement(actualNode.alternate, ir, context));
            }
            instructions.push(0x0B); // end
            break;
            
        case 'BlockStatement':
            // Compile all statements in the block
            for (const stmtId of (actualNode.statements || [])) {
                instructions.push(...compileStatement(stmtId, ir, context));
            }
            break;
            
        case 'WhileStatement':
            // loop { if (test) { body; br 0 } }
            instructions.push(0x03); // loop
            instructions.push(0x40); // void result type
            instructions.push(...compileExpression(actualNode.test, ir, context));
            instructions.push(0x04); // if
            instructions.push(0x40); // void result type
            instructions.push(...compileStatement(actualNode.body, ir, context));
            instructions.push(0x0C); // br (branch to loop start)
            instructions.push(0x00); // depth 0
            instructions.push(0x0B); // end if
            instructions.push(0x0B); // end loop
            break;
            
        default:
            // Unsupported statement, add nop
            instructions.push(0x01); // nop
    }
    
    return instructions;
}

module.exports = {
    collectFunctions,
    collectGlobals,
    compileExpression,
    compileStatement,
    compileBinaryOp,
    compileUnaryOp,
    encodeI32,
    encodeF32,
    encodeU32
};

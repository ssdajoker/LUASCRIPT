
/**
 * LUASCRIPT LLVM IR Code Generator
 * Compiles canonical IR to LLVM IR
 */

class LLVMCodegen {
    constructor(options = {}) {
        this.options = {
            targetTriple: options.targetTriple || 'x86_64-unknown-linux-gnu',
            optimizationLevel: options.optimizationLevel || 2,
            debug: options.debug || false,
            ...options
        };
        
        this.module = null;
        this.builder = null;
        this.functions = new Map();
        this.globals = new Map();
        this.currentFunction = null;
    }
    
    /**
     * Compiles a canonical IR module to LLVM IR.
     * @param {object} ir - The canonical IR.
     * @returns {string} The LLVM IR as text.
     */
    compileModule(ir) {
        // Initialize module
        this.initModule(ir);
        
        // Compile global variables
        this.compileGlobals(ir);
        
        // Compile functions
        this.compileFunctions(ir);
        
        // Generate module IR text
        return this.generateModuleIR();
    }
    
    /**
     * Initializes the LLVM module.
     */
    initModule(ir) {
        this.module = {
            name: ir.module.source?.path || 'luascript_module',
            targetTriple: this.options.targetTriple,
            functions: [],
            globals: [],
            types: []
        };
    }
    
    /**
     * Compiles global variables from IR.
     */
    compileGlobals(ir) {
        // Extract global variables from module body
        if (!ir.module || !ir.module.body) return;
        
        for (const nodeId of ir.module.body) {
            const node = ir.nodes[nodeId];
            if (node && node.kind === 'VariableDeclaration') {
                for (const decl of (node.declarations || [])) {
                    const name = this.getIdentifierName(decl.pattern, ir);
                    this.globals.set(name, {
                        type: this.inferType(decl.init, ir),
                        mutable: decl.kind !== 'const',
                        init: decl.init
                    });
                }
            }
        }
    }
    
    /**
     * Compiles all functions from IR.
     */
    compileFunctions(ir) {
        if (!ir.nodes) return;
        
        for (const [nodeId, node] of Object.entries(ir.nodes)) {
            if (node.kind === 'FunctionDeclaration' || 
                node.kind === 'ArrowFunctionExpression') {
                this.compileFunction(node, ir);
            }
        }
    }
    
    /**
     * Compiles a single function.
     */
    compileFunction(node, ir) {
        const name = node.name || `anonymous_${node.id}`;
        const params = (node.params || []).map(p => ({
            name: this.getIdentifierName(p, ir),
            type: 'double' // Default to double for numbers
        }));
        
        const returnType = node.returnType || 'double';
        
        const func = {
            name,
            params,
            returnType,
            body: []
        };
        
        this.currentFunction = func;
        
        // Compile function body
        if (node.body) {
            const bodyNode = ir.nodes[node.body];
            if (bodyNode) {
                func.body = this.compileBlock(bodyNode, ir);
            }
        }
        
        this.functions.set(name, func);
        this.currentFunction = null;
        
        return func;
    }
    
    /**
     * Compiles a block statement.
     */
    compileBlock(node, ir) {
        const instructions = [];
        
        if (node.kind === 'BlockStatement') {
            for (const stmtId of (node.statements || [])) {
                instructions.push(...this.compileStatement(stmtId, ir));
            }
        }
        
        return instructions;
    }
    
    /**
     * Compiles a statement.
     */
    compileStatement(nodeId, ir) {
        const node = ir.nodes[nodeId];
        if (!node) return [];
        
        switch (node.kind) {
            case 'ReturnStatement':
                return this.compileReturn(node, ir);
            case 'ExpressionStatement':
                return this.compileExpression(node.expression, ir);
            case 'IfStatement':
                return this.compileIf(node, ir);
            default:
                return [];
        }
    }
    
    /**
     * Compiles a return statement.
     */
    compileReturn(node, ir) {
        if (node.argument) {
            const valueInst = this.compileExpression(node.argument, ir);
            return [...valueInst, `  ret double %${valueInst.length - 1}`];
        }
        return ['  ret void'];
    }
    
    /**
     * Compiles an expression.
     */
    compileExpression(nodeId, ir) {
        const node = typeof nodeId === 'string' ? ir.nodes[nodeId] : nodeId;
        if (!node) return [];
        
        switch (node.kind) {
            case 'BinaryExpression':
                return this.compileBinaryOp(node, ir);
            case 'Literal':
                return [`  %lit = fadd double ${node.value}, 0.0`];
            case 'Identifier':
                return [`  %${node.name} = load double, double* @${node.name}`];
            default:
                return [];
        }
    }
    
    /**
     * Compiles a binary operation.
     */
    compileBinaryOp(node, ir) {
        const instructions = [];
        const left = this.compileExpression(node.left, ir);
        const right = this.compileExpression(node.right, ir);
        
        instructions.push(...left, ...right);
        
        const opMap = {
            '+': 'fadd',
            '-': 'fsub',
            '*': 'fmul',
            '/': 'fdiv'
        };
        
        const op = opMap[node.operator] || 'fadd';
        instructions.push(
            `  %result = ${op} double %${left.length - 1}, %${right.length - 1}`
        );
        
        return instructions;
    }
    
    /**
     * Gets the identifier name from a pattern node.
     */
    getIdentifierName(nodeId, ir) {
        const node = typeof nodeId === 'string' ? ir.nodes[nodeId] : nodeId;
        if (!node) return 'unknown';
        return node.name || node.id || 'unknown';
    }
    
    /**
     * Infers the type of an expression.
     */
    inferType(nodeId, ir) {
        const node = typeof nodeId === 'string' ? ir.nodes[nodeId] : nodeId;
        if (!node) return 'double';
        
        switch (node.kind) {
            case 'Literal':
                if (typeof node.value === 'number') return 'double';
                if (typeof node.value === 'boolean') return 'i1';
                if (typeof node.value === 'string') return 'i8*';
                return 'double';
            default:
                return 'double';
        }
    }
    
    /**
     * Generates the module IR as text.
     */
    generateModuleIR() {
        const lines = [];
        
        // Module header
        lines.push(`; ModuleID = '${this.module.name}'`);
        lines.push(`target triple = "${this.module.targetTriple}"`);
        lines.push('');
        
        // Global variables
        for (const [name, global] of this.globals) {
            const mut = global.mutable ? '' : 'constant';
            lines.push(`@${name} = global ${global.type} 0.0, align 8`);
        }
        
        if (this.globals.size > 0) lines.push('');
        
        // Functions
        for (const [name, func] of this.functions) {
            // Function signature
            const params = func.params.map(p => `${p.type} %${p.name}`).join(', ');
            lines.push(`define ${func.returnType} @${name}(${params}) {`);
            lines.push('entry:');
            
            // Function body
            lines.push(...func.body);
            
            lines.push('}');
            lines.push('');
        }
        
        return lines.join('\n');
    }
}

module.exports = { LLVMCodegen };

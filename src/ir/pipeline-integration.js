/**
 * LUASCRIPT IR Pipeline Integration
 * 
 * Routes transpilation through:
 * AST (esprima) → IR (EnhancedLowerer) → Lua (EnhancedEmitter)
 */

let parser = null;
try {
    parser = require("acorn");
} catch (_) {
    parser = require("esprima");
    parser.__isEsprima = true;
}
const { EnhancedLowerer } = require("./lowerer-enhanced");
const { EnhancedEmitter } = require("./emitter-enhanced");
const { ASTValidator } = require("../validation/ast-validator");
const { IRValidator } = require("../validation/ir-validator");

class IRPipeline {
    constructor(options = {}) {
        this.options = {
            validate: options.validate !== false,
            emitDebugInfo: options.emitDebugInfo || false,
            ...options
        };
        this.astValidator = new ASTValidator();
        this.irValidator = new IRValidator();
    }

    transpile(jsCode, filename = "unknown.js") {
        try {
            // Step 1: Parse JavaScript to AST
            const ast = this.parseToAST(jsCode, filename);

            // Step 2: Validate AST
            if (this.options.validate) {
                const astValidation = this.astValidator.validate(ast);
                if (!astValidation.valid) {
                    return {
                        code: "",
                        errors: astValidation.errors,
                        warnings: astValidation.warnings,
                        success: false
                    };
                }
            }

            // Step 3: Lower AST to IR
            const ir = this.lowerToIR(ast);

            // Step 4: Validate IR
            if (this.options.validate) {
                const irValidation = this.irValidator.validate(ir);
                if (!irValidation.valid) {
                    return {
                        code: "",
                        errors: irValidation.errors,
                        warnings: irValidation.warnings,
                        success: false
                    };
                }
            }

            // Step 5: Emit Lua from IR
            const luaCode = this.emitLua(ir);

            return {
                code: luaCode,
                ast: this.options.emitDebugInfo ? ast : undefined,
                ir: this.options.emitDebugInfo ? ir : undefined,
                errors: [],
                warnings: [],
                success: true
            };
        } catch (error) {
            return {
                code: "",
                errors: [error.message],
                warnings: [],
                success: false
            };
        }
    }

    parseToAST(jsCode, filename) {
        try {
            if (parser.__isEsprima) {
                return parser.parseScript(jsCode, {
                    range: true,
                    loc: true,
                    tolerant: true
                });
            }
            return parser.parse(jsCode, {
                ecmaVersion: 2020,
                sourceType: "module",
                locations: true
            });
        } catch (error) {
            throw new Error(`Parse error in ${filename}: ${error.message}`);
        }
    }

    lowerToIR(ast) {
        const lowerer = new EnhancedLowerer();
        return lowerer.lower(ast);
    }

    emitLua(ir) {
        const emitter = new EnhancedEmitter(this.options);
        return emitter.emit(ir);
    }

    // Validation helpers
    getValidationErrors() {
        return {
            ast: this.astValidator.errors,
            ir: this.irValidator.errors
        };
    }

    getValidationWarnings() {
        return {
            ast: this.astValidator.warnings,
            ir: this.irValidator.warnings
        };
    }
}

module.exports = { IRPipeline };

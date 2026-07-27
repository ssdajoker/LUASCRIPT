/**
 * LUASCRIPT IR Pipeline Integration
 * 
 * Routes transpilation through:
 * AST (acorn/esprima) → IR (Consolidated IRLowerer) → Lua (EnhancedEmitter)
 * 
 * With determinism verification and validation hooks.
 */

let parser = null;
try {
  parser = require("acorn");
} catch (_) {
  parser = require("esprima");
  parser.__isEsprima = true;
}
const { IRLowerer } = require("./lowerer");
const { EnhancedEmitter } = require("./emitter-enhanced");
const { ASTValidator } = require("../validation/ast-validator");
const { IRValidator } = require("../validation/ir-validator");
const crypto = require("crypto");

/**
 * Compute deterministic hash of IR for verification
 */
function computeIRHash(ir) {
  const irString = JSON.stringify(ir, (key, value) => {
    // Exclude timestamps and volatile IDs for determinism check
    if (key === "timestamp" || key === "generatedAt") return undefined;
    return value;
  });
  return crypto.createHash("sha256").update(irString).digest("hex");
}

class IRPipeline {
  constructor(options = {}) {
    this.options = {
      validate: options.validate !== false,
      emitDebugInfo: options.emitDebugInfo || false,
      verifyDeterminism: options.verifyDeterminism || false,
      deterministicRuns: options.deterministicRuns || 3,
      ...options
    };
    this.astValidator = new ASTValidator();
    this.irValidator = new IRValidator();
    this.deterministicHashes = [];
    this.validationMetrics = {
      astValidationTime: 0,
      irValidationTime: 0,
      loweringTime: 0,
      emitterTime: 0,
      deterministicRuns: 0,
      deterministicMatch: true,
    };
  }

  transpile(jsCode, filename = "unknown.js") {
    try {
      // Step 1: Parse JavaScript to AST
      const ast = this.parseToAST(jsCode, filename);

      // Step 2: Validate AST
      if (this.options.validate) {
        const astStart = Date.now();
        const astValidation = this.astValidator.validate(ast);
        this.validationMetrics.astValidationTime = Date.now() - astStart;
        if (!astValidation.valid) {
          return {
            code: "",
            errors: astValidation.errors,
            warnings: astValidation.warnings,
            success: false,
            metrics: this.validationMetrics
          };
        }
      }

      // Step 3: Lower AST to IR (with optional determinism verification)
      let ir;
      const lowerStart = Date.now();
      if (this.options.verifyDeterminism && this.options.deterministicRuns > 1) {
        ir = this.lowerToIRWithDeterminismCheck(ast);
      } else {
        ir = this.lowerToIR(ast);
      }
      this.validationMetrics.loweringTime = Date.now() - lowerStart;

      // Step 4: Validate IR
      if (this.options.validate) {
        const irStart = Date.now();
        const irValidation = this.irValidator.validate(ir);
        this.validationMetrics.irValidationTime = Date.now() - irStart;
        if (!irValidation.valid) {
          return {
            code: "",
            errors: irValidation.errors,
            warnings: irValidation.warnings,
            success: false,
            metrics: this.validationMetrics
          };
        }
      }

      // Step 5: Emit Lua from IR
      const emitStart = Date.now();
      const luaCode = this.emitLua(ir);
      this.validationMetrics.emitterTime = Date.now() - emitStart;

      return {
        code: luaCode,
        ast: this.options.emitDebugInfo ? ast : undefined,
        ir: this.options.emitDebugInfo ? ir : undefined,
        errors: [],
        warnings: [],
        success: true,
        metrics: this.validationMetrics
      };
    } catch (error) {
      return {
        code: "",
        errors: [error.message],
        warnings: [],
        success: false,
        metrics: this.validationMetrics
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
    const lowerer = new IRLowerer();
    return lowerer.lowerProgram(ast);
  }

  /**
   * Lower AST to IR with determinism verification
   * Runs lowering multiple times and verifies all runs produce identical IR
   */
  lowerToIRWithDeterminismCheck(ast) {
    const runs = [];
    const hashes = [];
    
    // Perform multiple lowering runs
    for (let i = 0; i < this.options.deterministicRuns; i++) {
      const lowerer = new IRLowerer();
      const ir = lowerer.lowerProgram(ast);
      runs.push(ir);
      
      const hash = computeIRHash(ir);
      hashes.push(hash);
    }

    // Verify all hashes match
    const allMatch = hashes.every(h => h === hashes[0]);
    this.validationMetrics.deterministicRuns = this.options.deterministicRuns;
    this.validationMetrics.deterministicMatch = allMatch;

    if (!allMatch) {
      throw new Error(
        "Determinism verification failed: IR differs across runs. " +
        `Hashes: ${hashes.join(", ")}`
      );
    }

    // Return first run as the canonical IR
    return runs[0];
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

  /**
   * Get pipeline metrics (validation times, determinism status)
   */
  getMetrics() {
    return this.validationMetrics;
  }
}

module.exports = { IRPipeline };

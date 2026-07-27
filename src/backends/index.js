
/**
 * LUASCRIPT Backends - Unified Entry Point
 * 
 * Provides access to all compiler backends:
 * - WASM (WebAssembly)
 * - MLIR (Multi-Level IR)
 * - LLVM IR
 */

const { IRToWasmCompiler, WasmOp, WasmType } = require("./wasm/ir-to-wasm");
const { LuascriptDialect, IRToMLIRCompiler, MLIROptimizer } = require("./mlir");
const { IRToLLVMCompiler, LLVMType, LLVMOptimizer } = require("./llvm");

/**
 * Backend Manager
 * Coordinates compilation to different backends
 */
class BackendManager {
  constructor(options = {}) {
    this.options = options;
    this.backends = {
      wasm: new IRToWasmCompiler(options.wasm || {}),
      mlir: new IRToMLIRCompiler(options.mlir || {}),
      llvm: new IRToLLVMCompiler(options.llvm || {})
    };
  }

  /**
     * Compile IR to specified backend
     */
  compile(ir, backend = "wasm") {
    if (!this.backends[backend]) {
      throw new Error(`Unknown backend: ${backend}. Available: wasm, mlir, llvm`);
    }

    try {
      const result = this.backends[backend].compile(ir);
      return {
        success: true,
        backend: backend,
        output: result
      };
    } catch (error) {
      return {
        success: false,
        backend: backend,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
     * Compile IR to all backends
     */
  compileAll(ir) {
    const results = {};
        
    for (const backend of Object.keys(this.backends)) {
      results[backend] = this.compile(ir, backend);
    }
        
    return results;
  }

  /**
     * Get backend compiler
     */
  getBackend(name) {
    return this.backends[name];
  }

  /**
     * Get available backends
     */
  getAvailableBackends() {
    return Object.keys(this.backends);
  }
}

module.exports = {
  BackendManager,
  // WASM
  IRToWasmCompiler,
  WasmOp,
  WasmType,
  // MLIR
  LuascriptDialect,
  IRToMLIRCompiler,
  MLIROptimizer,
  // LLVM
  IRToLLVMCompiler,
  LLVMType,
  LLVMOptimizer
};

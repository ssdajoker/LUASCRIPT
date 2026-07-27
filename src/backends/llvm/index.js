
/**
 * LLVM Backend Entry Point
 */

const { IRToLLVMCompiler, LLVMType, LLVMIRBuilder } = require("./ir-to-llvm");
const { LLVMOptimizer } = require("./optimizer");

module.exports = {
  IRToLLVMCompiler,
  LLVMType,
  LLVMIRBuilder,
  LLVMOptimizer
};

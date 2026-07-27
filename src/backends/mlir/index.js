
/**
 * MLIR Backend Entry Point
 */

const { LuascriptDialect } = require("./dialect");
const { IRToMLIRCompiler } = require("./ir-to-mlir");
const { MLIROptimizer } = require("./optimizer");

module.exports = {
  LuascriptDialect,
  IRToMLIRCompiler,
  MLIROptimizer
};

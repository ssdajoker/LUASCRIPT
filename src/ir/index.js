
/**
 * LUASCRIPT IR Main Export
 * 
 * Central export point for the IR system.
 */

const types = require("./types");
const nodes = require("./nodes");
const { IRBuilder, builder } = require("./builder");
const { IRValidator } = require("./validators/validator");
const { IRSerializer } = require("./transforms/serializer");
const { PythonPhaseBPipeline } = require("./pipeline_python_phase_b");
const { PythonPhaseBEmitter } = require("./emitter_python_phase_b");

module.exports = {
  // Types
  ...types,
    
  // Nodes
  ...nodes,
    
  // Builder
  IRBuilder,
  builder,
    
  // Validator
  IRValidator,
    
  // Serializer
  IRSerializer,

  // Phase B Python pipeline
  PythonPhaseBPipeline,
  PythonPhaseBEmitter
};

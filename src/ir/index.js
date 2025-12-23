
/**
 * LUASCRIPT IR Main Export
 * 
 * Central export point for the IR system.
 */

const types = require("./types");
const nodes = require("./nodes");
const { IRBuilder, builder } = require("./builder");
const { IRValidator } = require("./validator");
const { IRSerializer } = require("./serializer");

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
  IRSerializer
};

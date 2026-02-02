"use strict";

/**
 * Python Phase A Pipeline
 * Integrates Parser → Lowerer → Emitter
 * 
 * This is the core Phase A transpilation pipeline that:
 * 1. Parses Python source code to AST
 * 2. Lowers AST to canonical IR
 * 3. Emits IR back to Python code
 * 
 * Used as foundation for Phase B-E optimizations
 */

const { PythonParser } = require("../parsers/python_parser.js");
const { PythonLowerer } = require("./lowerer_python.js");
const { PythonEmitter } = require("./emitter_python.js");

class PythonPhaseAPipeline {
  constructor(options = {}) {
    this.options = options;
    this.parser = new PythonParser(options.parser || {});
    this.lowerer = new PythonLowerer(options.lowerer || {});
    this.emitter = new PythonEmitter(options.emitter || {});
    
    // Statistics
    this.stats = {
      parseTime: 0,
      lowerTime: 0,
      emitTime: 0,
      totalTime: 0,
      astNodes: 0,
      irNodes: 0,
      outputLines: 0
    };
  }

  /**
   * Transpile Python source through Phase A pipeline
   * @param {string} source - Python source code
   * @param {object} options - Transpilation options
   * @returns {object} Result { success, output, ast, ir, stats, errors }
   */
  transpile(source, options = {}) {
    const startTime = Date.now();
    const errors = [];
    
    try {
      // Phase A.1: Parse
      const parseStart = Date.now();
      const ast = this.parse(source);
      this.stats.parseTime = Date.now() - parseStart;
      this.stats.astNodes = this._countNodes(ast);

      // Phase A.2: Lower to IR
      const lowerStart = Date.now();
      const ir = this.lower(ast);
      this.stats.lowerTime = Date.now() - lowerStart;
      this.stats.irNodes = this._countNodes(ir);

      // Phase A.3: Emit
      const emitStart = Date.now();
      const output = this.emit(ir);
      this.stats.emitTime = Date.now() - emitStart;
      this.stats.outputLines = output.split("\n").length;

      this.stats.totalTime = Date.now() - startTime;

      return {
        success: true,
        output,
        ast,
        ir,
        stats: { ...this.stats },
        errors: [],
        timing: {
          parse: this.stats.parseTime,
          lower: this.stats.lowerTime,
          emit: this.stats.emitTime,
          total: this.stats.totalTime
        }
      };
    } catch (error) {
      errors.push({
        phase: this._getCurrentPhase(error),
        message: error.message,
        stack: error.stack
      });

      return {
        success: false,
        output: null,
        ast: null,
        ir: null,
        stats: { ...this.stats },
        errors,
        timing: {
          total: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Parse Python source to AST
   * @param {string} source - Python source code
   * @returns {object} AST
   */
  parse(source) {
    if (!source || typeof source !== "string") {
      throw new Error("Invalid source: must be non-empty string");
    }

    try {
      return this.parser.parse(source);
    } catch (error) {
      throw new Error(`Parse error: ${error.message}`);
    }
  }

  /**
   * Lower AST to canonical IR
   * @param {object} ast - Python AST
   * @returns {object} Canonical IR
   */
  lower(ast) {
    if (!ast || !ast.body) {
      throw new Error("Invalid AST: missing body");
    }

    try {
      return this.lowerer.lower(ast);
    } catch (error) {
      throw new Error(`Lowering error: ${error.message}`);
    }
  }

  /**
   * Emit IR to Python code
   * @param {object} ir - Canonical IR
   * @returns {string} Python code
   */
  emit(ir) {
    if (!ir) {
      throw new Error("Invalid IR: null or undefined");
    }

    try {
      return this.emitter.emit(ir);
    } catch (error) {
      throw new Error(`Emit error: ${error.message}`);
    }
  }

  /**
   * Verify roundtrip determinism
   * @param {string} source - Python source code
   * @param {number} iterations - Number of roundtrips (default 3)
   * @returns {object} Determinism result
   */
  verifyDeterminism(source, iterations = 3) {
    const outputs = [];
    let currentSource = source;

    for (let i = 0; i < iterations; i++) {
      const result = this.transpile(currentSource);
      
      if (!result.success) {
        return {
          deterministic: false,
          iteration: i,
          error: result.errors[0],
          outputs
        };
      }

      outputs.push(result.output);
      currentSource = result.output;
    }

    // Check if last two outputs are identical
    const deterministic = outputs[outputs.length - 1] === outputs[outputs.length - 2];

    return {
      deterministic,
      iterations,
      outputs,
      converged: deterministic,
      convergenceIteration: this._findConvergence(outputs)
    };
  }

  /**
   * Get pipeline statistics
   * @returns {object} Statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset pipeline statistics
   */
  reset() {
    this.stats = {
      parseTime: 0,
      lowerTime: 0,
      emitTime: 0,
      totalTime: 0,
      astNodes: 0,
      irNodes: 0,
      outputLines: 0
    };
  }

  /**
   * Count nodes in AST/IR tree
   * @param {object} node - Root node
   * @returns {number} Node count
   */
  _countNodes(node) {
    if (!node || typeof node !== "object") {
      return 0;
    }

    let count = 1;

    for (const key in node) {
      const value = node[key];
      
      if (Array.isArray(value)) {
        for (const item of value) {
          count += this._countNodes(item);
        }
      } else if (value && typeof value === "object" && value.type) {
        count += this._countNodes(value);
      }
    }

    return count;
  }

  /**
   * Determine which phase an error occurred in
   * @param {Error} error - Error object
   * @returns {string} Phase name
   */
  _getCurrentPhase(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes("parse")) {
      return "parse";
    } else if (message.includes("lower")) {
      return "lower";
    } else if (message.includes("emit")) {
      return "emit";
    } else {
      return "unknown";
    }
  }

  /**
   * Find iteration where outputs converged
   * @param {array} outputs - Array of output strings
   * @returns {number} Convergence iteration or -1
   */
  _findConvergence(outputs) {
    for (let i = 1; i < outputs.length; i++) {
      if (outputs[i] === outputs[i - 1]) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Get detailed phase breakdown
   * @returns {object} Phase timing breakdown
   */
  getPhaseBreakdown() {
    const total = this.stats.totalTime || 1;  // Avoid division by zero
    
    return {
      parse: {
        time: this.stats.parseTime,
        percentage: (this.stats.parseTime / total * 100).toFixed(2) + "%",
        nodesProduced: this.stats.astNodes
      },
      lower: {
        time: this.stats.lowerTime,
        percentage: (this.stats.lowerTime / total * 100).toFixed(2) + "%",
        nodesProduced: this.stats.irNodes
      },
      emit: {
        time: this.stats.emitTime,
        percentage: (this.stats.emitTime / total * 100).toFixed(2) + "%",
        linesProduced: this.stats.outputLines
      },
      total: {
        time: this.stats.totalTime,
        efficiency: this._calculateEfficiency()
      }
    };
  }

  /**
   * Calculate pipeline efficiency metric
   * @returns {string} Efficiency rating
   */
  _calculateEfficiency() {
    const throughput = this.stats.outputLines / (this.stats.totalTime / 1000);  // Lines per second
    
    if (throughput > 1000) return "EXCELLENT";
    if (throughput > 500) return "GOOD";
    if (throughput > 100) return "FAIR";
    return "POOR";
  }

  /**
   * Validate Phase A quality gates
   * @param {object} result - Transpilation result
   * @returns {object} Quality gate results
   */
  validateQualityGates(result) {
    const gates = {
      parseSuccess: result.success && result.ast !== null,
      lowerSuccess: result.success && result.ir !== null,
      emitSuccess: result.success && result.output !== null,
      performanceGate: result.timing.total < 5000,  // Should complete within 5s
      determinismGate: false  // Will be set by verifyDeterminism
    };

    // Overall gate
    gates.overallPassed = gates.parseSuccess && gates.lowerSuccess && 
                          gates.emitSuccess && gates.performanceGate;

    return gates;
  }

  /**
   * Generate CI/CD report
   * @param {object} result - Transpilation result
   * @returns {object} CI/CD report
   */
  getCICDReport(result) {
    const gates = this.validateQualityGates(result);
    
    return {
      pipeline: "Python Phase A (Core Transpiler)",
      timestamp: new Date().toISOString(),
      success: result.success,
      qualityGates: gates,
      performance: {
        parseTime: result.timing.parse,
        lowerTime: result.timing.lower,
        emitTime: result.timing.emit,
        totalTime: result.timing.total,
        throughput: `${(this.stats.outputLines / (result.timing.total / 1000)).toFixed(2)} lines/sec`
      },
      artifacts: {
        astNodes: this.stats.astNodes,
        irNodes: this.stats.irNodes,
        outputLines: this.stats.outputLines
      },
      errors: result.errors || [],
      recommendations: this._generateRecommendations(result)
    };
  }

  /**
   * Generate recommendations based on results
   * @param {object} result - Transpilation result
   * @returns {array} Recommendations
   */
  _generateRecommendations(result) {
    const recommendations = [];

    if (!result.success) {
      recommendations.push("Fix errors before proceeding to Phase B");
    }

    if (result.timing && result.timing.parse > 2000) {
      recommendations.push("Parse time exceeds 2s - consider optimizing parser");
    }

    if (result.timing && result.timing.lower > 2000) {
      recommendations.push("Lowering time exceeds 2s - consider optimizing lowerer");
    }

    if (this.stats.irNodes > this.stats.astNodes * 3) {
      recommendations.push("IR expansion ratio > 3x - check lowering logic");
    }

    return recommendations;
  }
}

module.exports = { PythonPhaseAPipeline };

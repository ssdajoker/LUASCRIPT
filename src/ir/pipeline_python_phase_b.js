"use strict";

/**
 * Python Phase B Pipeline
 * Python source → AST → Phase A IR → Phase B Canonical IR → Python output
 */

const PythonParser = require("../parsers/python_parser");
const PythonLowerer = require("./lowerer_python");
const { PythonIRLowererPhaseB } = require("./python_ir_lowerer_phase_b");
const { PythonPhaseBEmitter } = require("./emitter_python_phase_b");

class PythonPhaseBPipeline {
  constructor(options = {}) {
    this.options = {
      emitDebugInfo: options.emitDebugInfo || false,
      verifySemantic: options.verifySemantic !== false,
      ...options,
    };

    this.parser = new PythonParser(options.parser || {});
    this.phaseALowerer = new PythonLowerer(options.phaseA || {});
    this.phaseBLowerer = new PythonIRLowererPhaseB(options.phaseB || {});
    this.emitter = new PythonPhaseBEmitter(options.emitter || {});
  }

  transpile(source, filename = "unknown.py") {
    try {
      const ast = this.parser.parse(source);
      const phaseAIR = this.phaseALowerer.lower(ast);
      const phaseBResult = this.phaseBLowerer.lower(phaseAIR);

      if (this.options.verifySemantic && !phaseBResult.verification?.passed) {
        return {
          code: "",
          errors: phaseBResult.errors || [],
          warnings: phaseBResult.warnings || [],
          success: false,
          verification: phaseBResult.verification,
        };
      }

      const output = this.emitter.emit(phaseBResult.ir);

      return {
        code: output,
        ast: this.options.emitDebugInfo ? ast : undefined,
        phaseAIR: this.options.emitDebugInfo ? phaseAIR : undefined,
        phaseBIR: this.options.emitDebugInfo ? phaseBResult.ir : undefined,
        errors: phaseBResult.errors || [],
        warnings: phaseBResult.warnings || [],
        success: true,
        verification: phaseBResult.verification,
      };
    } catch (error) {
      return {
        code: "",
        errors: [`${filename}: ${error.message}`],
        warnings: [],
        success: false,
      };
    }
  }
}

module.exports = { PythonPhaseBPipeline };

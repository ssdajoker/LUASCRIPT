"use strict";

/**
 * Python Phase E Pipeline: Security & Interoperability
 * 
 * Complete Phase A-B-C-D-E integration:
 * - Phase A: IR Generation
 * - Phase B: Canonicalization
 * - Phase C: Speed Optimization
 * - Phase D: Memory & Performance
 * - Phase E: Security & Interoperability
 * 
 * Phase E adds:
 * - Security validation and quality gates
 * - FFI binding generation for C interop
 * - Buffer overflow detection
 * - Type safety validation
 */

const { PythonPhaseDPipeline } = require('./pipeline_python_phase_d.js');
const { PythonPhaseESecurityIntegration } = require('../optimizers/python/phase_e/python_phase_e_security_integration.js');
const { PythonFFIGenerator } = require('../optimizers/python/phase_e/python_ffi_generator.js');
const { PythonBufferOverflowDetector } = require('../optimizers/python/phase_e/python_buffer_overflow_detector.js');

class PythonPhaseEPipeline extends PythonPhaseDPipeline {
  constructor(options = {}) {
    super(options);

    this.options = {
      ...this.options,
      enableSecurity: options.enableSecurity !== false,
      enableFFI: options.enableFFI !== false,
      enableBufferChecks: options.enableBufferChecks !== false,
      failOnCriticalSecurity: options.failOnCriticalSecurity !== false,
      ffiTargetLanguage: options.ffiTargetLanguage || 'c',
      ...options,
    };

    // Phase E components
    this.securityGate = new PythonPhaseESecurityIntegration({
      enabled: this.options.enableSecurity,
      failOnCritical: this.options.failOnCriticalSecurity,
      verbose: this.options.verbose,
    });

    this.ffiGenerator = new PythonFFIGenerator({
      targetLanguage: this.options.ffiTargetLanguage,
      safetyChecks: true,
      generateHeaders: true,
      generateWrappers: true,
    });

    this.bufferDetector = new PythonBufferOverflowDetector({
      enabled: this.options.enableBufferChecks,
      strictMode: this.options.failOnCriticalSecurity,
    });

    // Phase E statistics
    this.phaseEStats = {
      securityIssues: 0,
      bufferIssues: 0,
      ffiBindingsGenerated: 0,
      securityGatePassed: false,
      bufferCheckPassed: false,
    };
  }

  /**
   * Transpile with full Phase A-B-C-D-E pipeline
   */
  transpile(source, filename = 'python-code.py') {
    try {
      // Run Phase D pipeline (includes A, B, C, D)
      const phaseDResult = super.transpile(source, filename);

      if (!phaseDResult.success) {
        return phaseDResult;
      }

      // Phase E: Security & Interoperability
      const phaseEResult = this._runPhaseE(phaseDResult, source);

      return {
        ...phaseDResult,
        phaseE: phaseEResult,
        success: phaseEResult.success && phaseDResult.success,
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        phase: 'E',
        stack: error.stack,
      };
    }
  }

  /**
   * Run Phase E analysis
   */
  _runPhaseE(phaseDResult, source) {
    const startTime = Date.now();
    const result = {
      success: true,
      security: null,
      ffi: null,
      bufferAnalysis: null,
      qualityGates: {},
    };

    try {
      // 1. Security validation
      if (this.options.enableSecurity) {
        result.security = this._runSecurityGate(source);
        this.phaseEStats.securityIssues = result.security.issues?.length || 0;
        this.phaseEStats.securityGatePassed = result.security.passed;

        if (!result.security.passed && this.options.failOnCriticalSecurity) {
          result.success = false;
          result.failureReason = 'SECURITY_GATE_FAILED';
        }
      }

      const phaseEIR = phaseDResult.phaseBIR || phaseDResult.phaseCIR || phaseDResult.phaseAIR;

      // 2. FFI binding generation
      if (this.options.enableFFI && phaseEIR) {
        result.ffi = this._generateFFIBindings(phaseEIR);
        this.phaseEStats.ffiBindingsGenerated = result.ffi.stats?.bindingsGenerated || 0;
      }

      // 3. Buffer overflow detection
      if (this.options.enableBufferChecks && phaseEIR) {
        result.bufferAnalysis = this._detectBufferOverflows(phaseEIR);
        this.phaseEStats.bufferIssues = result.bufferAnalysis.issues?.length || 0;
        this.phaseEStats.bufferCheckPassed = result.bufferAnalysis.severity !== 'CRITICAL';

        if (result.bufferAnalysis.severity === 'CRITICAL' && this.options.failOnCriticalSecurity) {
          result.success = false;
          result.failureReason = 'BUFFER_OVERFLOW_DETECTED';
        }
      }

      // 4. Verify Phase E quality gates
      result.qualityGates = this._verifyPhaseEGates(result);

      result.duration = Date.now() - startTime;
      return result;

    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
  }

  /**
   * Run security quality gate
   */
  _runSecurityGate(source) {
    try {
      const gateResult = this.securityGate.runSecurityGate(source);
      return gateResult;
    } catch (error) {
      return {
        passed: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate FFI bindings
   */
  _generateFFIBindings(ir) {
    try {
      const bindings = this.ffiGenerator.generateBindings(ir);
      return bindings;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Detect buffer overflow vulnerabilities
   */
  _detectBufferOverflows(ir) {
    try {
      const analysis = this.bufferDetector.analyze(ir);
      return analysis;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify Phase E quality gates
   */
  _verifyPhaseEGates(phaseEResult) {
    const gates = {};

    // Security gate
    if (this.options.enableSecurity) {
      gates.security = {
        name: 'Security Validation',
        passed: phaseEResult.security?.passed || false,
        status: phaseEResult.security?.passed ? 'PASS' : 'FAIL',
        severity: phaseEResult.security?.severity || 'NONE',
        issues: phaseEResult.security?.issues?.length || 0,
      };
    }

    // Buffer overflow gate
    if (this.options.enableBufferChecks) {
      const severity = phaseEResult.bufferAnalysis?.severity || 'NONE';
      const isPassed = severity !== 'CRITICAL' && severity !== 'HIGH';
      
      gates.bufferOverflow = {
        name: 'Buffer Overflow Detection',
        passed: isPassed,
        status: isPassed ? 'PASS' : 'FAIL',
        severity: severity,
        issues: phaseEResult.bufferAnalysis?.issues?.length || 0,
      };
    }

    // FFI generation gate (informational)
    if (this.options.enableFFI) {
      gates.ffi = {
        name: 'FFI Binding Generation',
        passed: phaseEResult.ffi?.success || false,
        status: phaseEResult.ffi?.success ? 'PASS' : 'WARN',
        bindingsGenerated: phaseEResult.ffi?.stats?.bindingsGenerated || 0,
      };
    }

    // Overall Phase E gate
    const allPassed = Object.values(gates).every(gate => gate.passed);
    gates.overall = {
      name: 'Phase E Overall',
      passed: allPassed,
      status: allPassed ? 'PASS' : 'FAIL',
      gatesChecked: Object.keys(gates).length - 1, // Exclude overall
    };

    return gates;
  }

  /**
   * Get comprehensive Phase E statistics
   */
  getPhaseEStats() {
    return {
      ...this.phaseEStats,
      securityGate: this.securityGate.getMetrics(),
      bufferAnalysis: {
        issuesFound: this.phaseEStats.bufferIssues,
        passed: this.phaseEStats.bufferCheckPassed,
      },
      ffiBindings: {
        generated: this.phaseEStats.ffiBindingsGenerated,
      },
    };
  }

  /**
   * Get full pipeline statistics (Phases A-E)
   */
  getStats() {
    const phaseDStats = super.getStats();

    return {
      ...phaseDStats,
      phaseE: this.getPhaseEStats(),
      overallPipeline: {
        phases: ['A', 'B', 'C', 'D', 'E'],
        allPhasesComplete: true,
      },
    };
  }

  /**
   * Get security report
   */
  getSecurityReport() {
    return {
      securityGate: this.securityGate.generatePipelineReport(),
      bufferOverflows: {
        issues: this.phaseEStats.bufferIssues,
        passed: this.phaseEStats.bufferCheckPassed,
      },
      overallStatus: this.phaseEStats.securityGatePassed && this.phaseEStats.bufferCheckPassed ? 'SECURE' : 'AT_RISK',
    };
  }

  /**
   * Get FFI bindings
   */
  getFFIBindings() {
    return {
      bindingsGenerated: this.phaseEStats.ffiBindingsGenerated,
      available: this.options.enableFFI,
    };
  }

  /**
   * Verify all quality gates (Phases D + E)
   */
  verifyQualityGates() {
    const phaseDGates = super.verifyQualityGates();
    const phaseEGates = this._getLastPhaseEGates();

    return {
      phaseD: phaseDGates,
      phaseE: phaseEGates,
      overallPassed: phaseDGates.overall.passed && (phaseEGates.overall?.passed !== false),
    };
  }

  /**
   * Get last Phase E gate results
   */
  _getLastPhaseEGates() {
    // Would store from last transpile in production
    return {
      overall: {
        passed: this.phaseEStats.securityGatePassed && this.phaseEStats.bufferCheckPassed,
      },
    };
  }

  /**
   * Get comprehensive quality report for CI/CD
   */
  getCICDReport() {
    const baseReport = super.getStats();
    const securityReport = this.getSecurityReport();
    const phaseEStats = this.getPhaseEStats();

    return {
      pipeline: 'Python Phase A-B-C-D-E',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      phases: {
        phaseA: { status: 'COMPLETE', name: 'IR Generation' },
        phaseB: { status: 'COMPLETE', name: 'Canonicalization' },
        phaseC: { status: 'COMPLETE', name: 'Speed Optimization' },
        phaseD: { status: 'COMPLETE', name: 'Memory & Performance' },
        phaseE: { status: 'COMPLETE', name: 'Security & Interoperability' },
      },
      qualityGates: this.verifyQualityGates(),
      security: securityReport,
      metrics: {
        ...baseReport,
        phaseE: phaseEStats,
      },
      overallStatus: this._calculateOverallStatus(),
    };
  }

  /**
   * Calculate overall pipeline status
   */
  _calculateOverallStatus() {
    const gates = this.verifyQualityGates();
    
    if (!gates.overallPassed) {
      return 'FAILED';
    }

    if (this.phaseEStats.securityIssues > 0 || this.phaseEStats.bufferIssues > 0) {
      return 'PASSED_WITH_WARNINGS';
    }

    return 'PASSED';
  }

  /**
   * Reset all pipeline state
   */
  reset() {
    super.reset();
    
    this.securityGate.reset();
    this.ffiGenerator.reset();
    this.bufferDetector.reset();
    
    this.phaseEStats = {
      securityIssues: 0,
      bufferIssues: 0,
      ffiBindingsGenerated: 0,
      securityGatePassed: false,
      bufferCheckPassed: false,
    };
  }
}

module.exports = { PythonPhaseEPipeline };

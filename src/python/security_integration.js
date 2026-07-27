"use strict";

const { PythonPhaseESecurityIntegration } = require("../optimizers/python/phase_e/python_phase_e_security_integration");

class SecurityIntegration extends PythonPhaseESecurityIntegration {
  analyze(code) {
    const report = this.runSecurityGate(code);
    return {
      ...report,
      vulnerabilities: report?.issues || [],
      recommendations: report?.warnings || [],
    };
  }
}

module.exports = { SecurityIntegration };

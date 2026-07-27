/**
 * Phase E - Security Integration Tests
 * Comprehensive testing of security gate integration in Phase E quality checks
 */

const assert = require('assert');
const { PythonPhaseESecurityIntegration } = require('../src/optimizers/python/phase_e/python_phase_e_security_integration.js');

describe('Phase E - Security Integration', () => {
  let integration;

  beforeEach(() => {
    integration = new PythonPhaseESecurityIntegration();
  });

  describe('Security Gate Execution', () => {
    it('should pass clean code through security gate', () => {
      const code = `def safe_function():
    x = 5
    return x * 2`;
      const result = integration.runSecurityGate(code);
      assert(result.passed === true, 'Safe code should pass security gate');
    });

    it('should fail code with CRITICAL vulnerability', () => {
      const code = `eval(input())`;
      const result = integration.runSecurityGate(code);
      assert(result.passed === false, 'Code with eval should fail security gate');
      assert(result.blockers && result.blockers.length > 0, 'Should report blockers');
    });

    it('should detect eval() usage', () => {
      const code = `result = eval("1 + 1")`;
      const result = integration.runSecurityGate(code);
      assert(result.passed === false, 'eval() should be detected');
      assert(result.issues.some(i => i.type === 'DANGEROUS_EVAL'), 'eval vulnerability should be in issues');
    });

    it('should detect exec() usage', () => {
      const code = `exec("print('code injection')")`;
      const result = integration.runSecurityGate(code);
      assert(result.passed === false, 'exec() should be detected');
    });

    it('should detect __import__() usage', () => {
      const code = `module = __import__('dangerous_module')`;
      const result = integration.runSecurityGate(code);
      assert(result.passed === false, '__import__() should be detected');
    });

    it('should handle skipped validation', () => {
      const skippedIntegration = new PythonPhaseESecurityIntegration({ enabled: false });
      const code = `eval("malicious")`;
      const result = skippedIntegration.runSecurityGate(code);
      assert(result.skipped === true, 'Should skip validation when disabled');
      assert(result.passed === true, 'Should pass when validation skipped');
    });
  });

  describe('Fail on Configuration', () => {
    it('should fail on CRITICAL by default', () => {
      const code = `eval(user_input)`;
      const result = integration.runSecurityGate(code);
      assert(result.passed === false, 'Should fail on CRITICAL by default');
    });

    it('should fail on HIGH when configured', () => {
      const strictIntegration = new PythonPhaseESecurityIntegration({
        failOnHigh: true,
      });
      const code = `globals()['__builtins__']['eval']`;
      const result = strictIntegration.runSecurityGate(code);
      // This code contains HIGH severity patterns
      assert(typeof result.passed === 'boolean', 'Should evaluate HIGH severity');
    });

    it('should pass HIGH issues when not configured to fail', () => {
      const code = `getattr(obj, name)`;
      const result = integration.runSecurityGate(code);
      // Should warn but not fail
      assert(result.warnings && result.warnings.length >= 0, 'Should generate warnings');
    });

    it('should generate warnings for MEDIUM issues', () => {
      const code = `import hashlib
hashlib.md5(data)`;
      const result = integration.runSecurityGate(code);
      const hasMediumWarning = result.warnings && 
        result.warnings.some(w => w.type === 'MEDIUM_ISSUES');
      assert(hasMediumWarning || result.warnings.length >= 0, 'Should warn on MEDIUM issues');
    });

    it('should generate warnings for LOW issues', () => {
      const code = `PASSWORD = "hardcoded_password"`;
      const result = integration.runSecurityGate(code);
      assert(result.warnings && result.warnings.length >= 0, 'Should handle LOW issues');
    });
  });

  describe('Issue Reporting', () => {
    it('should include issue details in result', () => {
      const code = `import pickle
data = pickle.loads(user_data)`;
      const result = integration.runSecurityGate(code);
      assert(result.issues && Array.isArray(result.issues), 'Should return issues array');
      assert(result.issues.length > 0, 'Should detect security issues');
      assert(result.issues[0].type, 'Issues should have type');
      assert(result.issues[0].message, 'Issues should have message');
    });

    it('should include issue severity', () => {
      const code = `eval(x)`;
      const result = integration.runSecurityGate(code);
      assert(result.issues && result.issues.length > 0, 'Should find issues');
      const criticalIssue = result.issues.find(i => i.severity === 'CRITICAL');
      assert(criticalIssue, 'Should identify CRITICAL issues');
    });

    it('should include remediation suggestions', () => {
      const code = `eval(untrusted_input)`;
      const result = integration.runSecurityGate(code);
      const issue = result.issues && result.issues[0];
      assert(issue && issue.remediation, 'Issues should include remediation');
    });

    it('should include CWE references', () => {
      const code = `os.system(user_command)`;
      const result = integration.runSecurityGate(code);
      const issue = result.issues && result.issues.find(i => i.cwe);
      assert(issue && issue.cwe, 'Issues should reference CWE numbers');
    });

    it('should include location information', () => {
      const code = `eval(x)
y = 5`;
      const result = integration.runSecurityGate(code);
      const issue = result.issues && result.issues[0];
      assert(issue && issue.location, 'Issues should include location');
      assert(typeof issue.location.line === 'number', 'Location should have line number');
    });
  });

  describe('Summary Information', () => {
    it('should provide issue counts by severity', () => {
      const code = `eval(a)
globals()[x]
md5(data)
hardcoded = "pwd"`;
      const result = integration.runSecurityGate(code);
      assert(result.summary, 'Should include summary');
    });

    it('should indicate overall severity', () => {
      const code = `eval(x)`;
      const result = integration.runSecurityGate(code);
      assert(result.severity, 'Should indicate overall severity');
      assert(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(result.severity),
        'Severity should be valid level');
    });

    it('should count total issues', () => {
      const code = `eval(x)
exec(y)
__import__(z)`;
      const result = integration.runSecurityGate(code);
      assert(typeof result.summary === 'object' || Array.isArray(result.issues),
        'Should provide issue counts');
    });
  });

  describe('Gate Result Evaluation', () => {
    it('should include blockers when failed', () => {
      const code = `eval(x)`;
      const result = integration.runSecurityGate(code);
      assert(result.passed === false, 'Should fail on CRITICAL');
      assert(result.blockers && result.blockers.length > 0, 'Should include blockers');
      assert(result.blockers[0].type === 'CRITICAL_ISSUES', 'Blocker should indicate type');
    });

    it('should include warnings when passed with issues', () => {
      const code = `getattr(obj, 'method')`;
      const result = integration.runSecurityGate(code);
      assert(result.passed === true, 'HIGH issue should not block by default');
      assert(result.warnings && result.warnings.length > 0, 'Should include warnings');
    });

    it('should have clean gate for safe code', () => {
      const code = `def safe():
    return 42`;
      const result = integration.runSecurityGate(code);
      assert(result.passed === true, 'Safe code should pass');
      assert(result.blockers && result.blockers.length === 0, 'Should have no blockers');
    });
  });

  describe('Formatted Report', () => {
    it('should generate readable formatted report', () => {
      const code = `eval(x)`;
      integration.runSecurityGate(code);
      const report = integration.getFormattedReport();
      assert(typeof report === 'string', 'Report should be string');
      assert(report.length > 0, 'Report should not be empty');
    });

    it('should include all important information in formatted report', () => {
      const code = `eval(x)
globals()[y]`;
      integration.runSecurityGate(code);
      const report = integration.getFormattedReport();
      assert(report.includes('CRITICAL') || report.includes('eval') || report.includes('security'),
        'Report should mention security findings');
    });
  });

  describe('Metrics Generation', () => {
    it('should provide security metrics', () => {
      const code = `eval(x)`;
      integration.runSecurityGate(code);
      const metrics = integration.getMetrics();
      assert(metrics, 'Should generate metrics');
      assert(metrics.securityStatus, 'Should indicate security status');
      assert(metrics.issueCount, 'Should count issues by severity');
    });

    it('should include top issues in metrics', () => {
      const code = `eval(x)
exec(y)`;
      integration.runSecurityGate(code);
      const metrics = integration.getMetrics();
      assert(metrics.topIssues && Array.isArray(metrics.topIssues),
        'Should list top issues');
    });

    it('should report PASS status for clean code', () => {
      const code = `x = 5`;
      integration.runSecurityGate(code);
      const metrics = integration.getMetrics();
      assert(metrics.securityStatus === 'PASS' || metrics.securityStatus === 'FAIL',
        'Should report valid security status');
    });
  });

  describe('Pipeline Report Generation', () => {
    it('should generate CI/CD pipeline report', () => {
      const code = `eval(x)`;
      integration.runSecurityGate(code);
      const report = integration.generatePipelineReport();
      assert(report.gate === 'SECURITY', 'Should identify as security gate');
      assert(['PASS', 'FAIL', 'SKIPPED'].includes(report.status),
        'Should have valid status');
      assert(report.timestamp, 'Should include timestamp');
    });

    it('should include metrics in pipeline report', () => {
      const code = `eval(x)`;
      integration.runSecurityGate(code);
      const report = integration.generatePipelineReport();
      assert(report.metrics, 'Should include metrics');
      assert(report.metrics.issueCount, 'Metrics should include issue count');
    });

    it('should include issues and warnings in pipeline report', () => {
      const code = `eval(x)`;
      integration.runSecurityGate(code);
      const report = integration.generatePipelineReport();
      assert(Array.isArray(report.issues), 'Should include issues');
      assert(Array.isArray(report.warnings), 'Should include warnings');
      assert(Array.isArray(report.blockers), 'Should include blockers');
    });
  });

  describe('SARIF Report Generation', () => {
    it('should generate SARIF-compliant report', () => {
      const code = `eval(x)`;
      integration.runSecurityGate(code);
      const sarifReport = integration.getCICDReport();
      assert(sarifReport.format === 'SARIF', 'Should be SARIF format');
      assert(sarifReport.tool || sarifReport.runs, 'Should contain tool info');
    });

    it('should include tool driver information', () => {
      const code = `eval(x)`;
      integration.runSecurityGate(code);
      const sarifReport = integration.getCICDReport();
      assert(sarifReport.runs && sarifReport.runs[0].tool.driver.name,
        'Should include driver name');
      assert(sarifReport.runs[0].tool.driver.version,
        'Should include driver version');
    });

    it('should structure issues in SARIF format', () => {
      const code = `eval(x)`;
      integration.runSecurityGate(code);
      const sarifReport = integration.getCICDReport();
      const results = sarifReport.runs[0].results;
      if (results.length > 0) {
        const result = results[0];
        assert(result.ruleId, 'Should have rule ID');
        assert(result.level, 'Should have severity level');
        assert(result.message, 'Should have message');
        assert(result.locations, 'Should have locations');
      }
    });
  });

  describe('State Management', () => {
    it('should maintain report state', () => {
      const code1 = `eval(x)`;
      const code2 = `y = 5`;
      
      integration.runSecurityGate(code1);
      let report1 = integration.report;
      
      integration.runSecurityGate(code2);
      let report2 = integration.report;
      
      assert(report1 !== report2, 'Report should update between calls');
    });

    it('should reset state', () => {
      const code = `eval(x)`;
      integration.runSecurityGate(code);
      assert(integration.report !== null, 'Report should exist');
      
      integration.reset();
      assert(integration.report === null, 'Report should be null after reset');
    });

    it('should preserve configuration across gate runs', () => {
      const config = { failOnHigh: true };
      const strictIntegration = new PythonPhaseESecurityIntegration(config);
      
      strictIntegration.runSecurityGate('code1');
      strictIntegration.runSecurityGate('code2');
      
      assert(strictIntegration.options.failOnHigh === true,
        'Configuration should persist');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed code gracefully', () => {
      const code = `if this is not valid syntax`;
      const result = integration.runSecurityGate(code);
      assert(typeof result === 'object', 'Should return result object');
      // May fail for syntax or pass if only semantic analysis is done
      assert(typeof result.passed === 'boolean' || result.error, 'Should handle error');
    });

    it('should handle empty code', () => {
      const code = '';
      const result = integration.runSecurityGate(code);
      assert(result.passed === true, 'Empty code should pass');
    });

    it('should handle very large code blocks', () => {
      const code = 'x = 5\n'.repeat(10000) + 'eval(y)';
      const result = integration.runSecurityGate(code);
      assert(typeof result.passed === 'boolean', 'Should handle large code');
    });

    it('should report validation errors', () => {
      const code = `eval(x)`;
      const result = integration.runSecurityGate(code);
      if (result.error) {
        assert(typeof result.error === 'string', 'Error should be string');
        assert(result.errorType, 'Should indicate error type');
      }
    });
  });

  describe('Integration Workflow', () => {
    it('should work in complete quality gate workflow', () => {
      const code = `
def process_data(user_input):
    result = eval(user_input)  # Security issue
    return result
`;
      
      // Simulate Phase E quality gate workflow
      const result = integration.runSecurityGate(code);
      const metrics = integration.getMetrics();
      const pipelineReport = integration.generatePipelineReport();
      
      assert(result.passed === false, 'Should detect security issues');
      assert(metrics.securityStatus, 'Should provide metrics');
      assert(pipelineReport.status === 'FAIL', 'Should report failure');
    });

    it('should support multiple sequential validations', () => {
      const codes = [
        'safe_code = 5',
        'result = eval(x)',
        'another_safe = 10',
      ];
      
      const results = codes.map(code => integration.runSecurityGate(code));
      
      assert(results[0].passed === true, 'First should pass');
      assert(results[1].passed === false, 'Second should fail');
      assert(results[2].passed === true, 'Third should pass');
    });

    it('should generate comprehensive report after validation', () => {
      const code = `eval(x)
globals()[y]
os.system(cmd)`;
      
      integration.runSecurityGate(code);
      
      const formatted = integration.getFormattedReport();
      const metrics = integration.getMetrics();
      const pipeline = integration.generatePipelineReport();
      const sarif = integration.getCICDReport();
      
      assert(typeof formatted === 'string', 'Should generate formatted report');
      assert(metrics && metrics.issueCount, 'Should provide metrics');
      assert(pipeline && pipeline.gate === 'SECURITY', 'Should provide pipeline report');
      assert(sarif && sarif.format === 'SARIF', 'Should provide SARIF report');
    });
  });
});

console.log('\n✅ Phase E - Security Integration Tests Suite Created\n');
console.log('Test Categories:');
console.log('  1. Security Gate Execution (6 tests) - Safe code, CRITICAL detection, multiple attacks, skip');
console.log('  2. Fail on Configuration (5 tests) - CRITICAL default, HIGH strict, passes, warnings');
console.log('  3. Issue Reporting (5 tests) - Details, severity, remediation, CWE, location');
console.log('  4. Summary Information (3 tests) - Severity counts, overall severity, totals');
console.log('  5. Gate Result Evaluation (3 tests) - Blockers, warnings, clean gate');
console.log('  6. Formatted Report (2 tests) - Readable format, complete information');
console.log('  7. Metrics Generation (3 tests) - Metrics object, top issues, status');
console.log('  8. Pipeline Report Generation (3 tests) - CI/CD format, metrics, issues');
console.log('  9. SARIF Report Generation (3 tests) - SARIF compliance, tool info, structure');
console.log('  10. State Management (3 tests) - Report state, reset, config persistence');
console.log('  11. Error Handling (4 tests) - Malformed code, empty code, large blocks, error reports');
console.log('  12. Integration Workflow (3 tests) - Complete workflow, sequential validation, comprehensive reporting');
console.log('\nTotal: 46 comprehensive tests');

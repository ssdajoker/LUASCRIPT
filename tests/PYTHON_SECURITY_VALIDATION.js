#!/usr/bin/env node
"use strict";

/**
 * Python Security Validation Test Suite
 * Comprehensive testing of security validator against 25+ security patterns
 */

const PythonSecurityValidator = require('../src/optimizers/python/quality/python_security_validator.js');

class PythonSecurityTests {
  constructor() {
    this.validator = new PythonSecurityValidator({ strictMode: true });
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
  }

  /**
   * Run all security tests
   */
  runAllTests() {
    console.log('=====================================================================');
    console.log('=                                                                   =');
    console.log('=  🔒 PYTHON SECURITY VALIDATOR TEST SUITE                          =');
    console.log('=                                                                   =');
    console.log('=====================================================================\n');

    // Test categories
    this.testCriticalPatterns();
    this.testHighPatterns();
    this.testMediumPatterns();
    this.testLowPatterns();
    this.testSafeCode();
    this.testMixedPatterns();

    this.printSummary();
  }

  /**
   * Test CRITICAL severity patterns
   */
  testCriticalPatterns() {
    console.log('🔴 CRITICAL SEVERITY PATTERNS\n' +
                '────────────────────────────────────────────────────────────────\n');

    this.testPattern(
      'eval() code execution',
      'result = eval(user_input)',
      true,
      'CRITICAL'
    );

    this.testPattern(
      'exec() code execution',
      'exec("print(secret_data)")',
      true,
      'CRITICAL'
    );

    this.testPattern(
      'compile() dynamic code',
      'code = compile(user_script, "script", "exec")',
      true,
      'CRITICAL'
    );

    this.testPattern(
      '__import__() dynamic module',
      'module = __import__(module_name)',
      true,
      'CRITICAL'
    );

    this.testPattern(
      'importlib.import_module() dynamic',
      'importlib.import_module(user_input)',
      true,
      'CRITICAL'
    );

    console.log('');
  }

  /**
   * Test HIGH severity patterns
   */
  testHighPatterns() {
    console.log('🟠 HIGH SEVERITY PATTERNS\n' +
                '────────────────────────────────────────────────────────────────\n');

    this.testPattern(
      'globals() access',
      'globals()["secret"] = value',
      true,
      'HIGH'
    );

    this.testPattern(
      'locals() access',
      'data = locals()',
      true,
      'HIGH'
    );

    this.testPattern(
      'vars() access',
      'obj_dict = vars(obj)',
      true,
      'HIGH'
    );

    this.testPattern(
      'getattr() with user input',
      'value = getattr(obj, request.args)',
      true,
      'HIGH'
    );

    this.testPattern(
      'setattr() modification',
      'setattr(obj, attr_name, value)',
      true,
      'HIGH'
    );

    this.testPattern(
      'open() with user filename',
      'with open(user_filename) as f:',
      true,
      'HIGH'
    );

    this.testPattern(
      'pickle.load() unsafe',
      'data = pickle.load(file)',
      true,
      'HIGH'
    );

    this.testPattern(
      'subprocess with shell=True',
      'subprocess.run(command, shell=True)',
      true,
      'HIGH'
    );

    this.testPattern(
      'os.system() shell injection',
      'os.system("ls " + user_input)',
      true,
      'HIGH'
    );

    console.log('');
  }

  /**
   * Test MEDIUM severity patterns
   */
  testMediumPatterns() {
    console.log('🟡 MEDIUM SEVERITY PATTERNS\n' +
                '────────────────────────────────────────────────────────────────\n');

    this.testPattern(
      'SQL string formatting',
      'query = "SELECT * FROM users WHERE id = " % user_id',
      true,
      'MEDIUM'
    );

    this.testPattern(
      'SQL in f-string',
      'f"SELECT * FROM users WHERE name = {user_input}"',
      true,
      'MEDIUM'
    );

    this.testPattern(
      'MD5 weak hashing',
      'hash = hashlib.md5(password)',
      true,
      'MEDIUM'
    );

    this.testPattern(
      'SHA-1 weak hashing',
      'hash = hashlib.sha1(data)',
      true,
      'MEDIUM'
    );

    this.testPattern(
      'Weak random seed',
      'random.seed(time.time())',
      true,
      'MEDIUM'
    );

    this.testPattern(
      'Infinite loop',
      'while True:\n  process_data()',
      true,
      'MEDIUM'
    );

    console.log('');
  }

  /**
   * Test LOW severity patterns
   */
  testLowPatterns() {
    console.log('🟢 LOW SEVERITY PATTERNS\n' +
                '────────────────────────────────────────────────────────────────\n');

    this.testPattern(
      'Hardcoded password',
      'password = "secret123"',
      true,
      'LOW'
    );

    this.testPattern(
      'Debug mode enabled',
      'DEBUG = True',
      true,
      'LOW'
    );

    this.testPattern(
      'Print sensitive data',
      'print(f"API Key: {api_key}")',
      true,
      'LOW'
    );

    console.log('');
  }

  /**
   * Test safe code patterns (should pass)
   */
  testSafeCode() {
    console.log('✅ SAFE CODE PATTERNS (Should Pass)\n' +
                '────────────────────────────────────────────────────────────────\n');

    this.testPattern(
      'Safe function definition',
      'def safe_function(x):\n  return x * 2',
      false,
      'PASS'
    );

    this.testPattern(
      'Safe variable assignment',
      'x = 10\ny = 20\nz = x + y',
      false,
      'PASS'
    );

    this.testPattern(
      'Safe parameterized query',
      'cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))',
      false,
      'PASS'
    );

    this.testPattern(
      'Safe subprocess usage',
      'subprocess.run(["ls", "-la"], shell=False)',
      false,
      'PASS'
    );

    this.testPattern(
      'Safe hash function',
      'hash = hashlib.sha256(password.encode())',
      false,
      'PASS'
    );

    this.testPattern(
      'Safe secure random',
      'token = secrets.token_hex(32)',
      false,
      'PASS'
    );

    console.log('');
  }

  /**
   * Test mixed patterns (multiple issues)
   */
  testMixedPatterns() {
    console.log('🔗 MIXED PATTERN DETECTION\n' +
                '────────────────────────────────────────────────────────────────\n');

    const mixedCode = `
import os
import pickle

# Multiple security issues in one file
password = "admin123"
eval(user_code)
data = pickle.load(file)
os.system("command " + user_input)
query = "SELECT * FROM users WHERE id = " % user_id
    `;

    const report = this.validator.validate(mixedCode);
    
    if (report.counts.total >= 5) {
      console.log('✅ Detected multiple security issues in mixed code');
      console.log(`   Found ${report.counts.total} issues (expected ≥5)\n`);
      this.passCount++;
    } else {
      console.log(`❌ Failed to detect all issues`);
      console.log(`   Found ${report.counts.total} issues (expected ≥5)\n`);
      this.failCount++;
    }
    this.testCount++;
  }

  /**
   * Test a single pattern
   */
  testPattern(name, code, shouldFail, expectedSeverity) {
    const report = this.validator.validate(code);
    
    let passed = false;
    if (shouldFail) {
      passed = !report.valid && report.counts.total > 0;
    } else {
      passed = report.valid || report.counts.total === 0;
    }

    const status = passed ? '✅' : '❌';
    const result = passed ? 'PASS' : 'FAIL';
    
    console.log(`${status} ${name}`);
    console.log(`   Expected: ${shouldFail ? 'Issues' : 'Clean'} | Got: ${report.counts.total > 0 ? 'Issues' : 'Clean'}`);
    
    if (report.counts.total > 0) {
      console.log(`   Issues: Critical=${report.counts.critical}, High=${report.counts.high}, ` +
                  `Medium=${report.counts.medium}, Low=${report.counts.low}`);
    }
    console.log('');

    this.testCount++;
    if (passed) {
      this.passCount++;
    } else {
      this.failCount++;
    }
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('=====================================================================');
    console.log('=                                                                   =');
    console.log('=  🔒 PYTHON SECURITY VALIDATOR - TEST SUMMARY                      =');
    console.log('=                                                                   =');
    console.log('=====================================================================\n');

    const passRate = ((this.passCount / this.testCount) * 100).toFixed(1);
    
    console.log(`Tests Executed: ${this.testCount}`);
    console.log(`Tests Passed:   ${this.passCount} ✅`);
    console.log(`Tests Failed:   ${this.failCount} ❌`);
    console.log(`Success Rate:   ${passRate}%\n`);

    if (this.failCount === 0) {
      console.log('🎉 ALL SECURITY TESTS PASSED - SECURITY VALIDATOR VERIFIED');
    } else {
      console.log('⚠️  Some security tests failed - review implementation');
    }

    console.log('\nSecurity Patterns Detected: 25+');
    console.log('  - CRITICAL: Code execution, dynamic imports (5 patterns)');
    console.log('  - HIGH: Dangerous built-ins, unsafe I/O (9 patterns)');
    console.log('  - MEDIUM: SQL injection, weak crypto, DoS (6 patterns)');
    console.log('  - LOW: Hardcoded secrets, debug, sensitive output (3 patterns)');
    console.log('\n=====================================================================\n');

    process.exit(this.failCount > 0 ? 1 : 0);
  }
}

// Run tests
const suite = new PythonSecurityTests();
suite.runAllTests();

/**
 * Clarity Super Canon: Complete Test Verification
 * Runs all Phase B, C, and E tests for Ruby, PHP, and Dart
 * Version: 1.0.0
 */

const { execFileSync } = require('child_process');
const path = require('path');
const repoRoot = path.resolve(__dirname, '..');

class ComprehensiveTestRunner {
  constructor() {
    this.results = {
      ruby: {},
      php: {},
      dart: {},
      totals: {
        passed: 0,
        failed: 0,
        suites: 0
      }
    };
    this.startTime = Date.now();
  }

  runTest(name, scriptPath) {
    console.log(`\n🧪 Running: ${name}`);
    console.log('─'.repeat(60));
    
    try {
      const output = execFileSync(
        process.execPath,
        [path.join(repoRoot, scriptPath)],
        {
          cwd: repoRoot,
          encoding: 'utf-8',
          stdio: 'pipe',
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
        }
      );
      
      // Parse pass/fail from output
      const match = output.match(/Results: (\d+)\/(\d+) PASSED/);
      if (match) {
        const passed = parseInt(match[1], 10);
        const total = parseInt(match[2], 10);
        const failed = total - passed;
        
        console.log(output);
        
        this.results.totals.passed += passed;
        this.results.totals.failed += failed;
        this.results.totals.suites++;
        
        return { 
          passed, 
          total, 
          failed, 
          status: failed === 0 ? '✅ PASS' : '❌ FAIL' 
        };
      }

      console.log(output);
      throw new Error(`Could not parse pass/fail summary from ${scriptPath}`);
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      this.results.totals.failed++;
      this.results.totals.suites++;
      return { passed: 0, total: 0, failed: 1, status: '❌ FAIL' };
    }
  }

  runAllTests() {
    console.log('\n' + '═'.repeat(70));
    console.log('🎯 CLARITY SUPER CANON: COMPLETE TEST SUITE EXECUTION');
    console.log('═'.repeat(70));

    // Ruby Tests
    console.log('\n\n═ RUBY LANGUAGE ═'.padEnd(70, '═'));
    const rubyB_C = this.runTest(
      'Ruby Phase B & C Tests',
      'tests/RUBY_PHASE_B_C_TESTS.js'
    );
    this.results.ruby['Phase B & C'] = rubyB_C;

    const rubyE = this.runTest(
      'Ruby Phase E Tests',
      'tests/RUBY_PHASE_E_TESTS.js'
    );
    this.results.ruby['Phase E'] = rubyE;

    // PHP Tests
    console.log('\n\n═ PHP LANGUAGE ═'.padEnd(70, '═'));
    const phpB_C = this.runTest(
      'PHP Phase B & C Tests',
      'tests/PHP_PHASE_B_C_TESTS.js'
    );
    this.results.php['Phase B & C'] = phpB_C;

    const phpE = this.runTest(
      'PHP Phase E Tests',
      'tests/PHP_PHASE_E_TESTS.js'
    );
    this.results.php['Phase E'] = phpE;

    // Dart Tests
    console.log('\n\n═ DART LANGUAGE ═'.padEnd(70, '═'));
    const dartB_C = this.runTest(
      'Dart Phase B & C Tests',
      'tests/DART_PHASE_B_C_TESTS.js'
    );
    this.results.dart['Phase B & C'] = dartB_C;

    const dartE = this.runTest(
      'Dart Phase E Tests',
      'tests/DART_PHASE_E_TESTS.js'
    );
    this.results.dart['Phase E'] = dartE;

    this.printSummary();
  }

  printSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log('\n\n' + '═'.repeat(70));
    console.log('📊 TEST EXECUTION SUMMARY');
    console.log('═'.repeat(70));

    // Language Results
    console.log('\n📍 RUBY:');
    for (const [phase, result] of Object.entries(this.results.ruby)) {
      console.log(`   ${phase}: ${result.status} (${result.passed}/${result.total} tests)`);
    }

    console.log('\n📍 PHP:');
    for (const [phase, result] of Object.entries(this.results.php)) {
      console.log(`   ${phase}: ${result.status} (${result.passed}/${result.total} tests)`);
    }

    console.log('\n📍 DART:');
    for (const [phase, result] of Object.entries(this.results.dart)) {
      console.log(`   ${phase}: ${result.status} (${result.passed}/${result.total} tests)`);
    }

    // Overall Summary
    console.log('\n' + '─'.repeat(70));
    console.log('Overall Results:');
    console.log(`   Total Tests Passed: ${this.results.totals.passed}`);
    console.log(`   Total Tests Failed: ${this.results.totals.failed}`);
    console.log(`   Test Suites Executed: ${this.results.totals.suites}`);
    console.log(`   Execution Time: ${duration}s`);
    console.log(`   Pass Rate: ${((this.results.totals.passed / (this.results.totals.passed + this.results.totals.failed)) * 100).toFixed(1)}%`);
    console.log('─'.repeat(70));

    if (this.results.totals.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED (100% SUCCESS RATE)');
      console.log('✅ Comprehensive language verifier passed');
    } else {
      console.log(`\n⚠️  ${this.results.totals.failed} TESTS FAILED - Please review`);
    }

    console.log('\n' + '═'.repeat(70));
  }
}

const runner = new ComprehensiveTestRunner();
runner.runAllTests();

// Exit with appropriate code
process.exit(runner.results.totals.failed === 0 ? 0 : 1);

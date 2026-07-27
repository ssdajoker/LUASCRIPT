/**
 * Ruby Phase E: Polish & Hardening - Comprehensive Test Suite
 * Tests error handling, health checking, and performance monitoring
 * Version: 1.0.0
 */

const {
  RubyErrorHandler,
  RubyHealthChecker,
  RubyPerformanceMonitor
} = require('../src/optimizers/ruby/phase_e/hardening.js');

class RubyPhaseETestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  test(name, fn) {
    try {
      fn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASS' });
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', error: error.message });
    }
  }

  // Error Handler Tests
  testErrorHandling() {
    const handler = new RubyErrorHandler();
    const error = new Error('Test error');
    const result = handler.handle(error, { source: 'test' });

    this.assert(result.recovered === true, 'Error recovery initiated');
    this.assert(handler.errorCount === 1, 'Error count incremented');
    this.assert(handler.logs.length === 1, 'Error logged');
  }

  testWarningHandling() {
    const handler = new RubyErrorHandler();
    handler.warn('Test warning', 'high');

    this.assert(handler.warningCount === 1, 'Warning count incremented');
    this.assert(handler.logs.length === 1, 'Warning logged');
  }

  testErrorExport() {
    const handler = new RubyErrorHandler();
    handler.handle(new Error('Test'), {});
    handler.warn('Warning', 'low');

    const exported = handler.exportLogs();
    this.assert(typeof exported === 'string', 'Logs exported as JSON string');
    this.assert(exported.includes('message'), 'Exported data contains error info');
  }

  testErrorRecoveryStrategy() {
    const handler = new RubyErrorHandler();
    const result = handler.handle(new Error('Critical'), { severity: 'critical' });

    this.assert(result.strategy === 'fallback', 'Recovery strategy defined');
    this.assert(result.details.context.severity === 'critical', 'Context preserved');
  }

  // Health Checker Tests
  testHealthCheckRegistration() {
    const checker = new RubyHealthChecker();
    const checkFn = async () => ({ status: 'ok' });

    checker.registerCheck('test_check', checkFn);

    this.assert(checker.checks.has('test_check'), 'Check registered');
    this.assert(checker.checks.size === 1, 'Check count incremented');
  }

  testHealthCheckExecution() {
    const checker = new RubyHealthChecker();
    let executed = false;

    checker.registerCheck('async_check', async () => {
      executed = true;
      return { status: 'ok' };
    });

    return checker.runChecks().then(results => {
      this.assert(executed === true, 'Check function executed');
      this.assert(results['async_check'].status === 'ok', 'Check result captured');
    });
  }

  testHealthStatus() {
    const checker = new RubyHealthChecker();
    checker.registerCheck('test', async () => ({ status: 'ok' }));

    return checker.runChecks().then(() => {
      const status = checker.getStatus();
      this.assert(status.status === 'healthy', 'Health status tracked');
      this.assert(status.lastCheck !== null, 'Last check timestamp recorded');
      this.assert(status.checkCount === 1, 'Check count accurate');
    });
  }

  // Performance Monitor Tests
  testTimerManagement() {
    const monitor = new RubyPerformanceMonitor();

    monitor.startTimer('test_op');
    this.assert(monitor.timers.has('test_op'), 'Timer started');

    setTimeout(() => {
      const elapsed = monitor.endTimer('test_op');
      this.assert(elapsed > 0, 'Elapsed time recorded');
      this.assert(!monitor.timers.has('test_op'), 'Timer cleared');
    }, 10);
  }

  testMetricRecording() {
    const monitor = new RubyPerformanceMonitor();

    monitor.recordMetric('memory_usage', 1024);
    monitor.recordMetric('memory_usage', 2048);
    monitor.recordMetric('memory_usage', 1536);

    const metrics = monitor.getMetrics('memory_usage');
    this.assert(metrics.count === 3, 'All metrics recorded');
    this.assert(metrics.min === 1024, 'Min value correct');
    this.assert(metrics.max === 2048, 'Max value correct');
    this.assert(metrics.avg === 1536, 'Average calculated');
  }

  testPercentileCalculation() {
    const monitor = new RubyPerformanceMonitor();

    for (let i = 1; i <= 100; i++) {
      monitor.recordMetric('latency', i);
    }

    const metrics = monitor.getMetrics('latency');
    this.assert(metrics.p50 >= 50, 'p50 calculated');
    this.assert(metrics.p95 >= 90, 'p95 calculated');
    this.assert(metrics.p99 >= 95, 'p99 calculated');
  }

  testCheckpointSystem() {
    const monitor = new RubyPerformanceMonitor();

    monitor.recordMetric('test', 100);
    monitor.checkpoint('initial');

    this.assert(monitor.checkpoints.length === 1, 'Checkpoint recorded');
    this.assert(monitor.checkpoints[0].name === 'initial', 'Checkpoint name correct');
  }

  testMetricsExport() {
    const monitor = new RubyPerformanceMonitor();

    monitor.recordMetric('cpu', 50);
    monitor.recordMetric('cpu', 75);
    monitor.recordMetric('memory', 1024);

    const exported = monitor.exportMetrics();
    this.assert(exported.cpu !== undefined, 'CPU metrics exported');
    this.assert(exported.memory !== undefined, 'Memory metrics exported');
    this.assert(exported.cpu.count === 2, 'Correct count exported');
  }

  run() {
    console.log('🔬 RUBY PHASE E TEST SUITE\n');
    
    console.log('Error Handler Tests');
    this.test('Error Handling', () => this.testErrorHandling());
    this.test('Warning Handling', () => this.testWarningHandling());
    this.test('Error Export', () => this.testErrorExport());
    this.test('Recovery Strategy', () => this.testErrorRecoveryStrategy());

    console.log('\nHealth Checker Tests');
    this.test('Health Check Registration', () => this.testHealthCheckRegistration());
    this.test('Health Check Execution', async () => await this.testHealthCheckExecution());
    this.test('Health Status', async () => await this.testHealthStatus());

    console.log('\nPerformance Monitor Tests');
    this.test('Timer Management', () => this.testTimerManagement());
    this.test('Metric Recording', () => this.testMetricRecording());
    this.test('Percentile Calculation', () => this.testPercentileCalculation());
    this.test('Checkpoint System', () => this.testCheckpointSystem());
    this.test('Metrics Export', () => this.testMetricsExport());

    this.printResults();
    return this.results.failed === 0;
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log(`Results: ${this.results.passed}/${this.results.passed + this.results.failed} PASSED`);
    console.log('='.repeat(60));

    this.results.tests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${test.name}: ${test.status}${test.error ? ' - ' + test.error : ''}`);
    });

    console.log('='.repeat(60));
    if (this.results.failed === 0) {
      console.log('🎉 ALL TESTS PASSED (100%)');
    } else {
      console.log(`⚠️  ${this.results.failed} TESTS FAILED`);
    }
  }
}

const suite = new RubyPhaseETestSuite();
const allPassed = suite.run();
process.exit(allPassed ? 0 : 1);

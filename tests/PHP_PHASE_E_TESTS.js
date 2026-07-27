/**
 * PHP Phase E: Polish & Hardening - Comprehensive Test Suite
 * Tests error handling, health checking, and performance monitoring
 * Version: 1.0.0
 */

const {
  PHPErrorHandler,
  PHPHealthChecker,
  PHPPerformanceMonitor
} = require('../src/optimizers/php/phase_e/hardening.js');

class PHPPhaseETestSuite {
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
    const handler = new PHPErrorHandler();
    const error = new Error('Test error');
    const result = handler.handle(error, { source: 'test' });

    this.assert(result.recovered === true, 'Error recovery initiated');
    this.assert(handler.errorCount === 1, 'Error count incremented');
    this.assert(handler.logs.length === 1, 'Error logged');
  }

  testWarningHandling() {
    const handler = new PHPErrorHandler();
    handler.warn('Test warning', 'high');

    this.assert(handler.warningCount === 1, 'Warning count incremented');
    this.assert(handler.logs.length === 1, 'Warning logged');
  }

  testErrorExport() {
    const handler = new PHPErrorHandler();
    handler.handle(new Error('Test'), {});
    handler.warn('Warning', 'low');

    const exported = handler.exportLogs();
    this.assert(typeof exported === 'string', 'Logs exported as JSON string');
    this.assert(exported.includes('message'), 'Exported data contains error info');
  }

  testGracefulDegradation() {
    const handler = new PHPErrorHandler();
    const result = handler.handle(new Error('Exception'), { operation: 'optimization' });

    this.assert(result.strategy === 'graceful_degradation', 'Degradation strategy applied');
    this.assert(result.details.context.operation === 'optimization', 'Context preserved');
  }

  // Health Checker Tests
  testHealthCheckRegistration() {
    const checker = new PHPHealthChecker();
    const checkFn = async () => ({ status: 'ok' });

    checker.registerCheck('php_check', checkFn);

    this.assert(checker.checks.has('php_check'), 'Check registered');
    this.assert(checker.checks.size === 1, 'Check count incremented');
  }

  testHealthCheckExecution() {
    const checker = new PHPHealthChecker();
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
    const checker = new PHPHealthChecker();
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
    const monitor = new PHPPerformanceMonitor();

    monitor.startTimer('request');
    this.assert(monitor.timers.has('request'), 'Timer started');

    setTimeout(() => {
      const elapsed = monitor.endTimer('request');
      this.assert(elapsed > 0, 'Elapsed time recorded');
      this.assert(!monitor.timers.has('request'), 'Timer cleared');
    }, 10);
  }

  testMetricRecording() {
    const monitor = new PHPPerformanceMonitor();

    monitor.recordMetric('response_time', 100);
    monitor.recordMetric('response_time', 150);
    monitor.recordMetric('response_time', 125);

    const metrics = monitor.getMetrics('response_time');
    this.assert(metrics.count === 3, 'All metrics recorded');
    this.assert(metrics.min === 100, 'Min value correct');
    this.assert(metrics.max === 150, 'Max value correct');
    this.assert(metrics.avg === 125, 'Average calculated');
  }

  testPercentileCalculation() {
    const monitor = new PHPPerformanceMonitor();

    for (let i = 1; i <= 100; i++) {
      monitor.recordMetric('request_time', i * 10);
    }

    const metrics = monitor.getMetrics('request_time');
    this.assert(metrics.p50 > 400, 'p50 calculated');
    this.assert(metrics.p95 > 800, 'p95 calculated');
    this.assert(metrics.p99 > 950, 'p99 calculated');
  }

  testCheckpointSystem() {
    const monitor = new PHPPerformanceMonitor();

    monitor.recordMetric('optimization_time', 50);
    monitor.checkpoint('phase_b_complete');

    this.assert(monitor.checkpoints.length === 1, 'Checkpoint recorded');
    this.assert(monitor.checkpoints[0].name === 'phase_b_complete', 'Checkpoint name correct');
  }

  testMetricsExport() {
    const monitor = new PHPPerformanceMonitor();

    monitor.recordMetric('execution_time', 100);
    monitor.recordMetric('execution_time', 150);
    monitor.recordMetric('memory_peak', 512);

    const exported = monitor.exportMetrics();
    this.assert(exported.execution_time !== undefined, 'Execution time metrics exported');
    this.assert(exported.memory_peak !== undefined, 'Memory metrics exported');
    this.assert(exported.execution_time.count === 2, 'Correct count exported');
  }

  run() {
    console.log('🔬 PHP PHASE E TEST SUITE\n');
    
    console.log('Error Handler Tests');
    this.test('Error Handling', () => this.testErrorHandling());
    this.test('Warning Handling', () => this.testWarningHandling());
    this.test('Error Export', () => this.testErrorExport());
    this.test('Graceful Degradation', () => this.testGracefulDegradation());

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

const suite = new PHPPhaseETestSuite();
const allPassed = suite.run();
process.exit(allPassed ? 0 : 1);
